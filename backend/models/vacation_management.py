from typing import Dict, List, Optional
from datetime import datetime, timedelta
from backend.utils.db import get_db_connection

class VacationRequest:
    """Urlaubs-/Krankheitsantrag"""
    def __init__(self, id: Optional[int], user_id: int, start_date: str, 
                 end_date: str, vacation_type: str, days: int, 
                 reason: str = "", status: str = "pending", 
                 approved_by: Optional[int] = None, approval_comment: str = "",
                 created_at: str = ""):
        self.id = id
        self.user_id = user_id
        self.start_date = start_date
        self.end_date = end_date
        self.vacation_type = vacation_type  # Urlaub, Krankheit, Sonderurlaub
        self.days = days
        self.reason = reason
        self.status = status  # pending, approved, rejected
        self.approved_by = approved_by
        self.approval_comment = approval_comment
        self.created_at = created_at

class VacationService:
    """Service für Urlaubs-/Krankheitsverwaltung"""
    
    # Urlaubsansprüche pro Jahr
    VACATION_DAYS_PER_YEAR = 25
    SICK_DAYS_PER_YEAR = 30
    
    @staticmethod
    def create_vacation_request(user_id: int, start_date: str, end_date: str, 
                               vacation_type: str, reason: str = "") -> Dict:
        """Erstellt Urlaubs-/Krankheitsantrag"""
        
        # Validiere Datum
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            
            if start > end:
                return {'success': False, 'error': 'Startdatum muss vor Enddatum liegen'}
            
            if start < datetime.now():
                return {'success': False, 'error': 'Startdatum kann nicht in der Vergangenheit liegen'}
                
        except ValueError:
            return {'success': False, 'error': 'Ungültiges Datumsformat (YYYY-MM-DD)'}
        
        # Berechne Anzahl Tage
        days = (end - start).days + 1
        
        # Prüfe verfügbare Urlaubstage
        available_days = VacationService.get_available_days(user_id, start.year)
        
        if vacation_type == 'Urlaub' and days > available_days['vacation_days']:
            return {
                'success': False, 
                'error': f'Nicht genügend Urlaubstage verfügbar. Verfügbar: {available_days["vacation_days"]}, Angefordert: {days}'
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vacation_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                vacation_type TEXT NOT NULL,
                days INTEGER NOT NULL,
                reason TEXT,
                status TEXT DEFAULT 'pending',
                approved_by INTEGER,
                approval_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO vacation_requests (user_id, start_date, end_date, vacation_type, days, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, start_date, end_date, vacation_type, days, reason))
        
        request_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': f'{vacation_type}-Antrag erstellt',
            'request_id': request_id,
            'days': days
        }
    
    @staticmethod
    def get_available_days(user_id: int, year: int) -> Dict:
        """Berechnet verfügbare Urlaubs-/Krankheitstage"""
        
        # Berechne anteiligen Anspruch bei Neueintritt
        user = VacationService._get_user_hire_date(user_id)
        if not user:
            return {'vacation_days': 0, 'sick_days': 0}
        
        hire_date = datetime.strptime(user['created_at'], '%Y-%m-%d %H:%M:%S')
        year_start = datetime(year, 1, 1)
        year_end = datetime(year, 12, 31)
        
        # Berechne Anteil basierend auf Eintrittsdatum
        if hire_date.year == year:
            # Neueintritt im laufenden Jahr
            days_in_year = (year_end - hire_date).days + 1
            total_days_in_year = 365
            factor = days_in_year / total_days_in_year
        else:
            factor = 1.0
        
        vacation_days = int(VacationService.VACATION_DAYS_PER_YEAR * factor)
        sick_days = int(VacationService.SICK_DAYS_PER_YEAR * factor)
        
        # Ziehe bereits genommene Tage ab
        used_vacation = VacationService._get_used_vacation_days(user_id, year)
        used_sick = VacationService._get_used_sick_days(user_id, year)
        
        return {
            'vacation_days': max(0, vacation_days - used_vacation),
            'sick_days': max(0, sick_days - used_sick),
            'total_vacation_days': vacation_days,
            'total_sick_days': sick_days,
            'used_vacation_days': used_vacation,
            'used_sick_days': used_sick
        }
    
    @staticmethod
    def _get_user_hire_date(user_id: int) -> Optional[Dict]:
        """Holt Eintrittsdatum des Benutzers"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT created_at FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    @staticmethod
    def _get_used_vacation_days(user_id: int, year: int) -> int:
        """Berechnet bereits genommene Urlaubstage"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT SUM(days) as total_days FROM vacation_requests 
            WHERE user_id = ? AND vacation_type = 'Urlaub' AND status = 'approved'
            AND strftime('%Y', start_date) = ?
        ''', (user_id, str(year)))
        
        row = cursor.fetchone()
        conn.close()
        
        return int(row['total_days']) if row and row['total_days'] else 0
    
    @staticmethod
    def _get_used_sick_days(user_id: int, year: int) -> int:
        """Berechnet bereits genommene Krankheitstage"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT SUM(days) as total_days FROM vacation_requests 
            WHERE user_id = ? AND vacation_type = 'Krankheit' AND status = 'approved'
            AND strftime('%Y', start_date) = ?
        ''', (user_id, str(year)))
        
        row = cursor.fetchone()
        conn.close()
        
        return int(row['total_days']) if row and row['total_days'] else 0
    
    @staticmethod
    def get_pending_requests() -> List[Dict]:
        """Holt ausstehende Urlaubs-/Krankheitsanträge (für Genehmiger)"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT vr.*, u.name as user_name 
            FROM vacation_requests vr
            JOIN users u ON vr.user_id = u.id
            WHERE vr.status = 'pending'
            ORDER BY vr.created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def approve_vacation_request(request_id: int, approver_id: int, approved: bool, 
                               comment: str = "") -> Dict:
        """Genehmigt oder lehnt Urlaubs-/Krankheitsantrag ab"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM vacation_requests WHERE id = ?', (request_id,))
        row = cursor.fetchone()
        
        if not row:
            return {'success': False, 'error': 'Antrag nicht gefunden'}
        
        status = 'approved' if approved else 'rejected'
        
        cursor.execute('''
            UPDATE vacation_requests 
            SET status = ?, approved_by = ?, approval_comment = ?
            WHERE id = ?
        ''', (status, approver_id, comment, request_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': f'Antrag {"genehmigt" if approved else "abgelehnt"}'
        }
    
    @staticmethod
    def get_calendar_view(year: int, month: int) -> Dict:
        """Holt Kalenderansicht für Monat"""
        
        start_date = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end_date = f"{year+1:04d}-01-01"
        else:
            end_date = f"{year:04d}-{month+1:02d}-01"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT vr.*, u.name as user_name 
            FROM vacation_requests vr
            JOIN users u ON vr.user_id = u.id
            WHERE vr.status = 'approved' 
            AND vr.start_date >= ? AND vr.start_date < ?
            ORDER BY vr.start_date
        ''', (start_date, end_date))
        
        approved_requests = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Gruppiere nach Datum
        calendar = {}
        for request in approved_requests:
            start = datetime.strptime(request['start_date'], '%Y-%m-%d')
            end = datetime.strptime(request['end_date'], '%Y-%m-%d')
            
            current = start
            while current <= end:
                date_str = current.strftime('%Y-%m-%d')
                if date_str not in calendar:
                    calendar[date_str] = []
                
                calendar[date_str].append({
                    'user_name': request['user_name'],
                    'vacation_type': request['vacation_type'],
                    'reason': request['reason']
                })
                
                current += timedelta(days=1)
        
        return {
            'year': year,
            'month': month,
            'calendar': calendar,
            'total_requests': len(approved_requests)
        }
