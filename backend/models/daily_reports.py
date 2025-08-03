from typing import Dict, List, Optional
from datetime import datetime, timedelta
from backend.utils.db import get_db_connection

class DailyReport:
    """Tagesbericht-Modell"""
    def __init__(self, id: Optional[int], user_id: int, date: str, 
                 work_description: str, hours_worked: float, 
                 materials_used: str = "", problems: str = "", 
                 status: str = "pending", approved_by: Optional[int] = None,
                 approval_comment: str = "", created_at: str = ""):
        self.id = id
        self.user_id = user_id
        self.date = date
        self.work_description = work_description
        self.hours_worked = hours_worked
        self.materials_used = materials_used
        self.problems = problems
        self.status = status  # pending, approved, rejected
        self.approved_by = approved_by
        self.approval_comment = approval_comment
        self.created_at = created_at

class DailyReportService:
    """Service für Tagesberichte und Prämienlohn"""
    
    @staticmethod
    def create_daily_report(user_id: int, date: str, work_description: str, 
                           hours_worked: float, materials_used: str = "", 
                           problems: str = "") -> Dict:
        """Erstellt neuen Tagesbericht"""
        
        # Pflichtfelder prüfen
        if not work_description.strip():
            return {
                'success': False,
                'error': 'Arbeitsbeschreibung ist Pflichtfeld'
            }
        
        if hours_worked <= 0:
            return {
                'success': False,
                'error': 'Arbeitszeit muss größer als 0 sein'
            }
        
        # Prüfe ob bereits Bericht für diesen Tag existiert
        existing = DailyReportService.get_daily_report(user_id, date)
        if existing:
            return {
                'success': False,
                'error': 'Tagesbericht für diesen Tag bereits vorhanden'
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                work_description TEXT NOT NULL,
                hours_worked REAL NOT NULL,
                materials_used TEXT,
                problems TEXT,
                status TEXT DEFAULT 'pending',
                approved_by INTEGER,
                approval_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO daily_reports (user_id, date, work_description, hours_worked, 
                                     materials_used, problems)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, date, work_description, hours_worked, materials_used, problems))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': 'Tagesbericht erstellt',
            'report_id': report_id
        }
    
    @staticmethod
    def get_daily_report(user_id: int, date: str) -> Optional[Dict]:
        """Holt Tagesbericht für Benutzer und Datum"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM daily_reports 
            WHERE user_id = ? AND date = ?
        ''', (user_id, date))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    @staticmethod
    def get_pending_reports() -> List[Dict]:
        """Holt ausstehende Tagesberichte (für Meister)"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT dr.*, u.name as user_name 
            FROM daily_reports dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status = 'pending'
            ORDER BY dr.date DESC, dr.created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def approve_report(report_id: int, approver_id: int, approved: bool, 
                      comment: str = "") -> Dict:
        """Genehmigt oder lehnt Tagesbericht ab"""
        
        # Prüfe 3-Tage Korrekturfrist
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT date, created_at FROM daily_reports WHERE id = ?', (report_id,))
        row = cursor.fetchone()
        
        if not row:
            return {'success': False, 'error': 'Tagesbericht nicht gefunden'}
        
        report_date = datetime.strptime(row['date'], '%Y-%m-%d')
        created_at = datetime.strptime(row['created_at'], '%Y-%m-%d %H:%M:%S')
        days_since_creation = (datetime.now() - created_at).days
        
        if days_since_creation > 3:
            return {
                'success': False, 
                'error': f'Korrekturfrist von 3 Tagen überschritten ({days_since_creation} Tage)'
            }
        
        status = 'approved' if approved else 'rejected'
        
        cursor.execute('''
            UPDATE daily_reports 
            SET status = ?, approved_by = ?, approval_comment = ?
            WHERE id = ?
        ''', (status, approver_id, comment, report_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': f'Tagesbericht {"genehmigt" if approved else "abgelehnt"}'
        }
    
    @staticmethod
    def calculate_premium_pay(user_id: int, month: int, year: int) -> Dict:
        """Berechnet Prämienlohn für Monat"""
        
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hole alle genehmigten Tagesberichte
        cursor.execute('''
            SELECT * FROM daily_reports 
            WHERE user_id = ? AND date >= ? AND date < ? AND status = 'approved'
        ''', (user_id, start_date, end_date))
        
        reports = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Berechne Prämienlohn
        total_hours = sum(r['hours_worked'] for r in reports)
        work_days = len(reports)
        
        # Prämienlohn-Regeln
        base_rate = 15.0  # €/Stunde
        overtime_rate = 20.0  # €/Stunde für Überstunden
        efficiency_bonus = 0.1  # 10% Bonus für Effizienz
        
        regular_hours = min(total_hours, work_days * 8)
        overtime_hours = max(0, total_hours - work_days * 8)
        
        base_pay = regular_hours * base_rate
        overtime_pay = overtime_hours * overtime_rate
        
        # Effizienz-Bonus (wenn durchschnittlich > 8h/Tag)
        efficiency_bonus_pay = 0
        if work_days > 0 and (total_hours / work_days) > 8:
            efficiency_bonus_pay = base_pay * efficiency_bonus
        
        total_pay = base_pay + overtime_pay + efficiency_bonus_pay
        
        return {
            'month': month,
            'year': year,
            'total_hours': f"{total_hours:.2f}",
            'work_days': work_days,
            'regular_hours': f"{regular_hours:.2f}",
            'overtime_hours': f"{overtime_hours:.2f}",
            'base_pay': f"{base_pay:.2f}",
            'overtime_pay': f"{overtime_pay:.2f}",
            'efficiency_bonus_pay': f"{efficiency_bonus_pay:.2f}",
            'total_pay': f"{total_pay:.2f}",
            'reports_count': len(reports)
        }
    
    @staticmethod
    def get_notdienst_zuschlag(user_id: int, month: int, year: int) -> Dict:
        """Berechnet Notdienstzuschläge"""
        
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hole Notdienst-Einträge (emergency_week = TRUE)
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND date >= ? AND date < ? AND emergency_week = TRUE
        ''', (user_id, start_date, end_date))
        
        emergency_entries = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Berechne Notdienstzuschläge
        notdienst_rate = 25.0  # €/Stunde für Notdienst
        total_notdienst_hours = sum(float(e['total_hours']) for e in emergency_entries if e['total_hours'])
        
        notdienst_pay = total_notdienst_hours * notdienst_rate
        
        return {
            'month': month,
            'year': year,
            'notdienst_hours': f"{total_notdienst_hours:.2f}",
            'notdienst_rate': f"{notdienst_rate:.2f}",
            'notdienst_pay': f"{notdienst_pay:.2f}",
            'emergency_entries': len(emergency_entries)
        }
