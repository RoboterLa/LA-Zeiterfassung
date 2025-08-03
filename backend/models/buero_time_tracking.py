from typing import Dict, List, Optional
from datetime import datetime, timedelta
from backend.utils.db import get_db_connection

class BueroTimeTrackingService:
    """Service für Büroangestellte Zeiterfassung"""
    
    # Arbeitszeit-Regeln für Büro
    REGULAR_HOURS = 8  # Soll-Arbeitszeit
    WARNING_HOURS = 8.5  # Warnung bei Überzeit
    MAX_HOURS = 10  # Maximale Arbeitszeit
    
    @staticmethod
    def clock_in_office(user_id: int, location: str = "Büro") -> Dict:
        """Büro-Einstempeln"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M')
        
        # Prüfe ob bereits eingestempelt
        active_entry = BueroTimeTrackingService.get_active_entry(user_id)
        if active_entry:
            return {
                'success': False,
                'error': 'Bereits eingestempelt',
                'entry': active_entry
            }
        
        # Erstelle neuen Büro-Zeiteintrag
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO zeiterfassung (user_id, date, start_time, location, status, activity_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, today, current_time, location, 'active', 'office_work'))
        
        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': f'Büro-Einstempeln um {current_time}',
            'entry_id': entry_id
        }
    
    @staticmethod
    def clock_out_office(user_id: int, notes: str = None) -> Dict:
        """Büro-Ausstempeln"""
        active_entry = BueroTimeTrackingService.get_active_entry(user_id)
        if not active_entry:
            return {
                'success': False,
                'error': 'Nicht eingestempelt'
            }
        
        current_time = datetime.now().strftime('%H:%M')
        start_time = datetime.strptime(active_entry['start_time'], '%H:%M')
        end_time = datetime.strptime(current_time, '%H:%M')
        
        # Berechne Arbeitszeit
        work_duration = end_time - start_time
        total_hours = work_duration.total_seconds() / 3600
        
        # Soll/Ist-Vergleich
        soll_hours = BueroTimeTrackingService.REGULAR_HOURS
        ist_hours = total_hours
        difference = ist_hours - soll_hours
        
        # Aktualisiere Eintrag
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE zeiterfassung 
            SET end_time = ?, total_hours = ?, notes = ?, status = ?
            WHERE id = ?
        ''', (current_time, f"{total_hours:.2f}", notes, 'completed', active_entry['id']))
        
        conn.commit()
        conn.close()
        
        result = {
            'success': True,
            'message': f'Büro-Ausstempeln um {current_time}',
            'total_hours': f"{total_hours:.2f}",
            'soll_hours': f"{soll_hours:.2f}",
            'difference': f"{difference:.2f}"
        }
        
        # Überzeit-Warnung
        if total_hours > BueroTimeTrackingService.WARNING_HOURS:
            result['warning'] = f'Überzeit: {total_hours:.1f}h (über {BueroTimeTrackingService.WARNING_HOURS}h)'
        
        if total_hours > BueroTimeTrackingService.MAX_HOURS:
            result['error'] = f'Maximale Arbeitszeit überschritten: {total_hours:.1f}h'
            result['success'] = False
        
        return result
    
    @staticmethod
    def get_active_entry(user_id: int) -> Optional[Dict]:
        """Holt aktiven Büro-Zeiteintrag"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND status = 'active' AND activity_type = 'office_work'
            ORDER BY id DESC LIMIT 1
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    @staticmethod
    def get_monthly_summary(user_id: int, year: int, month: int) -> Dict:
        """Holt Monatsübersicht für Büroangestellte"""
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND date >= ? AND date < ? AND activity_type = 'office_work'
            ORDER BY date, start_time
        ''', (user_id, start_date, end_date))
        
        entries = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Berechne Statistiken
        total_hours = 0
        work_days = 0
        overtime_hours = 0
        
        for entry in entries:
            if entry['total_hours']:
                hours = float(entry['total_hours'])
                total_hours += hours
                work_days += 1
                overtime_hours += max(0, hours - BueroTimeTrackingService.REGULAR_HOURS)
        
        return {
            'year': year,
            'month': month,
            'total_hours': f"{total_hours:.2f}",
            'work_days': work_days,
            'overtime_hours': f"{overtime_hours:.2f}",
            'average_hours_per_day': f"{total_hours/work_days:.2f}" if work_days > 0 else "0.00",
            'entries': entries
        }
    
    @staticmethod
    def get_soll_ist_comparison(user_id: int, date: str = None) -> Dict:
        """Soll/Ist-Vergleich für einen Tag"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        entries = BueroTimeTrackingService.get_daily_entries(user_id, date)
        
        total_hours = 0
        for entry in entries:
            if entry['total_hours']:
                total_hours += float(entry['total_hours'])
        
        soll_hours = BueroTimeTrackingService.REGULAR_HOURS
        ist_hours = total_hours
        difference = ist_hours - soll_hours
        
        return {
            'date': date,
            'soll_hours': soll_hours,
            'ist_hours': f"{ist_hours:.2f}",
            'difference': f"{difference:.2f}",
            'status': 'over' if difference > 0 else 'under' if difference < 0 else 'exact'
        }
    
    @staticmethod
    def get_daily_entries(user_id: int, date: str) -> List[Dict]:
        """Holt tägliche Büro-Einträge"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND date = ? AND activity_type = 'office_work'
            ORDER BY start_time
        ''', (user_id, date))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
