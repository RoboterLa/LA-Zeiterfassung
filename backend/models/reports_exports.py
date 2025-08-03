from typing import Dict, List, Optional
from datetime import datetime, timedelta
import csv
import json
from io import StringIO
from backend.utils.db import get_db_connection

class ReportService:
    """Service für Berichte und Exporte"""
    
    @staticmethod
    def generate_monthly_report(year: int, month: int) -> Dict:
        """Generiert Monatsbericht"""
        
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hole alle Zeiteinträge für den Monat
        cursor.execute('''
            SELECT z.*, u.name as user_name, u.role as user_role
            FROM zeiterfassung z
            JOIN users u ON z.user_id = u.id
            WHERE z.date >= ? AND z.date < ?
            ORDER BY z.date, z.start_time
        ''', (start_date, end_date))
        
        time_entries = [dict(row) for row in cursor.fetchall()]
        
        # Hole alle Tagesberichte
        cursor.execute('''
            SELECT dr.*, u.name as user_name
            FROM daily_reports dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.date >= ? AND dr.date < ? AND dr.status = 'approved'
        ''', (start_date, end_date))
        
        daily_reports = [dict(row) for row in cursor.fetchall()]
        
        # Hole alle Urlaubsanträge
        cursor.execute('''
            SELECT vr.*, u.name as user_name
            FROM vacation_requests vr
            JOIN users u ON vr.user_id = u.id
            WHERE vr.start_date >= ? AND vr.start_date < ? AND vr.status = 'approved'
        ''', (start_date, end_date))
        
        vacation_requests = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        # Berechne Statistiken
        total_hours = sum(float(e['total_hours']) for e in time_entries if e['total_hours'])
        total_overtime = sum(max(0, float(e['total_hours']) - 8) for e in time_entries if e['total_hours'])
        work_days = len(set(e['date'] for e in time_entries))
        
        # Gruppiere nach Mitarbeiter
        employee_stats = {}
        for entry in time_entries:
            user_name = entry['user_name']
            if user_name not in employee_stats:
                employee_stats[user_name] = {
                    'total_hours': 0,
                    'overtime_hours': 0,
                    'work_days': 0,
                    'role': entry['user_role']
                }
            
            if entry['total_hours']:
                hours = float(entry['total_hours'])
                employee_stats[user_name]['total_hours'] += hours
                employee_stats[user_name]['overtime_hours'] += max(0, hours - 8)
                employee_stats[user_name]['work_days'] += 1
        
        return {
            'year': year,
            'month': month,
            'total_hours': f"{total_hours:.2f}",
            'total_overtime': f"{total_overtime:.2f}",
            'work_days': work_days,
            'employee_count': len(employee_stats),
            'employee_stats': employee_stats,
            'time_entries_count': len(time_entries),
            'daily_reports_count': len(daily_reports),
            'vacation_days': sum(r['days'] for r in vacation_requests),
            'generated_at': datetime.now().isoformat()
        }
    
    @staticmethod
    def calculate_premium_pay_report(year: int, month: int) -> Dict:
        """Berechnet Prämienlohn-Bericht"""
        
        from backend.models.daily_reports import DailyReportService
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hole alle Mitarbeiter
        cursor.execute('SELECT id, name FROM users WHERE role IN ("Monteur", "Meister")')
        employees = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        premium_report = {
            'year': year,
            'month': month,
            'employees': [],
            'total_premium_pay': 0,
            'total_notdienst_pay': 0
        }
        
        for employee in employees:
            # Berechne Prämienlohn
            premium_pay = DailyReportService.calculate_premium_pay(employee['id'], month, year)
            notdienst_pay = DailyReportService.get_notdienst_zuschlag(employee['id'], month, year)
            
            employee_report = {
                'employee_id': employee['id'],
                'employee_name': employee['name'],
                'premium_pay': premium_pay,
                'notdienst_pay': notdienst_pay,
                'total_pay': float(premium_pay['total_pay']) + float(notdienst_pay['notdienst_pay'])
            }
            
            premium_report['employees'].append(employee_report)
            premium_report['total_premium_pay'] += employee_report['total_pay']
            premium_report['total_notdienst_pay'] += float(notdienst_pay['notdienst_pay'])
        
        return premium_report
    
    @staticmethod
    def export_to_csv(data: List[Dict], filename: str) -> str:
        """Exportiert Daten zu CSV"""
        
        if not data:
            return ""
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        
        writer.writeheader()
        for row in data:
            writer.writerow(row)
        
        return output.getvalue()
    
    @staticmethod
    def export_time_entries_csv(year: int, month: int) -> str:
        """Exportiert Zeiteinträge zu CSV"""
        
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT z.*, u.name as user_name, u.role as user_role
            FROM zeiterfassung z
            JOIN users u ON z.user_id = u.id
            WHERE z.date >= ? AND z.date < ?
            ORDER BY z.date, z.start_time
        ''', (start_date, end_date))
        
        entries = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return ReportService.export_to_csv(entries, f"zeiteintraege_{year}_{month:02d}.csv")
    
    @staticmethod
    def export_payroll_csv(year: int, month: int) -> str:
        """Exportiert Gehaltsabrechnung zu CSV"""
        
        premium_report = ReportService.calculate_premium_pay_report(year, month)
        
        payroll_data = []
        for employee in premium_report['employees']:
            payroll_data.append({
                'Mitarbeiter_ID': employee['employee_id'],
                'Name': employee['employee_name'],
                'Prämienlohn': f"{employee['premium_pay']['total_pay']} €",
                'Notdienstzuschlag': f"{employee['notdienst_pay']['notdienst_pay']} €",
                'Gesamtlohn': f"{employee['total_pay']:.2f} €",
                'Arbeitsstunden': employee['premium_pay']['total_hours'],
                'Überstunden': employee['premium_pay']['overtime_hours'],
                'Notdienststunden': employee['notdienst_pay']['notdienst_hours']
            })
        
        return ReportService.export_to_csv(payroll_data, f"gehaltsabrechnung_{year}_{month:02d}.csv")
    
    @staticmethod
    def generate_management_dashboard() -> Dict:
        """Generiert Management-Dashboard"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktuelle Statistiken
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Eingestempelte Mitarbeiter heute
        cursor.execute('''
            SELECT COUNT(DISTINCT user_id) as active_employees
            FROM zeiterfassung 
            WHERE date = ? AND status = 'active'
        ''', (today,))
        active_employees = cursor.fetchone()['active_employees']
        
        # Offene Aufträge
        cursor.execute('SELECT COUNT(*) as open_orders FROM auftraege WHERE done = FALSE')
        open_orders = cursor.fetchone()['open_orders']
        
        # Ausstehende Genehmigungen
        cursor.execute('SELECT COUNT(*) as pending_reports FROM daily_reports WHERE status = "pending"')
        pending_reports = cursor.fetchone()['pending_reports']
        
        cursor.execute('SELECT COUNT(*) as pending_vacation FROM vacation_requests WHERE status = "pending"')
        pending_vacation = cursor.fetchone()['pending_vacation']
        
        # Monatliche Übersicht
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        cursor.execute('''
            SELECT SUM(CAST(total_hours AS FLOAT)) as total_hours
            FROM zeiterfassung 
            WHERE strftime('%Y-%m', date) = ?
        ''', (f"{current_year:04d}-{current_month:02d}",))
        
        monthly_hours = cursor.fetchone()['total_hours'] or 0
        
        conn.close()
        
        return {
            'date': today,
            'active_employees': active_employees,
            'open_orders': open_orders,
            'pending_reports': pending_reports,
            'pending_vacation': pending_vacation,
            'monthly_hours': f"{monthly_hours:.2f}",
            'system_status': 'healthy'
        }
