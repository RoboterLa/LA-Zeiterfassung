from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import sqlite3
from utils.db import get_db_connection

@dataclass
class TimeEntry:
    """Zeiteintrag-Modell"""
    id: Optional[int]
    user_id: int
    date: str
    start_time: str
    end_time: Optional[str]
    break_duration: str = "00:00"
    total_hours: Optional[str] = None
    status: str = "active"  # active, completed, approved, rejected
    notes: Optional[str] = None
    overtime_hours: Optional[str] = None
    overtime_requested: bool = False
    overtime_approved: Optional[bool] = None
    created_at: str = ""

class TimeTrackingService:
    """Service für Zeiterfassung"""
    
    # Arbeitszeit-Regeln
    MAX_REGULAR_HOURS = 8  # Stunden
    WARNING_HOURS = 8  # Warnung nach 8h
    MAX_HOURS = 10  # Sperre nach 10h
    BREAK_AFTER_HOURS = 6  # Pause nach 6h
    
    @staticmethod
    def clock_in(user_id: int, location: str = None) -> Dict:
        """Einstempeln"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M')
        
        # Prüfe ob bereits eingestempelt
        active_entry = TimeTrackingService.get_active_entry(user_id)
        if active_entry:
            return {
                'success': False,
                'error': 'Bereits eingestempelt',
                'entry': active_entry
            }
        
        # Erstelle neuen Zeiteintrag
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO zeiterfassung (user_id, date, start_time, location, status, activity_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, today, current_time, location, 'active', 'work'))
        
        entry_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': f'Eingestempelt um {current_time}',
            'entry_id': entry_id
        }
    
    @staticmethod
    def clock_out(user_id: int, notes: str = None) -> Dict:
        """Ausstempeln"""
        active_entry = TimeTrackingService.get_active_entry(user_id)
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
        
        # Prüfe Überstunden
        overtime_hours = max(0, total_hours - TimeTrackingService.MAX_REGULAR_HOURS)
        overtime_warning = total_hours > TimeTrackingService.WARNING_HOURS
        overtime_blocked = total_hours > TimeTrackingService.MAX_HOURS
        
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
            'message': f'Ausgestempelt um {current_time}',
            'total_hours': f"{total_hours:.2f}",
            'overtime_hours': f"{overtime_hours:.2f}" if overtime_hours > 0 else None
        }
        
        if overtime_warning:
            result['warning'] = f'Warnung: {total_hours:.1f}h gearbeitet (über {TimeTrackingService.WARNING_HOURS}h)'
        
        if overtime_blocked:
            result['error'] = f'Blockiert: {total_hours:.1f}h gearbeitet (über {TimeTrackingService.MAX_HOURS}h)'
            result['success'] = False
        
        return result
    
    @staticmethod
    def get_active_entry(user_id: int) -> Optional[Dict]:
        """Holt aktiven Zeiteintrag"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND status = 'active'
            ORDER BY id DESC LIMIT 1
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    @staticmethod
    def get_today_entries(user_id: int) -> List[Dict]:
        """Holt heutige Zeiteinträge"""
        today = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND date = ?
            ORDER BY start_time
        ''', (user_id, today))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def request_overtime(entry_id: int, reason: str) -> Dict:
        """Überstundenantrag erstellen"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE zeiterfassung 
            SET overtime_requested = TRUE, notes = ?
            WHERE id = ?
        ''', (reason, entry_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': 'Überstundenantrag erstellt' if success else 'Eintrag nicht gefunden'
        }
    
    @staticmethod
    def approve_overtime(entry_id: int, approved: bool, approver_id: int, comment: str = None) -> Dict:
        """Überstunden genehmigen/ablehnen"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE zeiterfassung 
            SET overtime_approved = ?, status = ?, notes = ?
            WHERE id = ?
        ''', (approved, 'approved' if approved else 'rejected', comment, entry_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': 'Überstunden genehmigt' if approved else 'Überstunden abgelehnt'
        }
    
    @staticmethod
    def get_pending_overtime_requests() -> List[Dict]:
        """Holt ausstehende Überstundenanträge"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT z.*, u.name as user_name 
            FROM zeiterfassung z
            JOIN users u ON z.user_id = u.id
            WHERE z.overtime_requested = TRUE AND z.overtime_approved IS NULL
            ORDER BY z.created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def calculate_work_summary(user_id: int, date: str = None) -> Dict:
        """Berechnet Arbeitszeit-Zusammenfassung"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        entries = TimeTrackingService.get_today_entries(user_id)
        
        total_hours = 0
        overtime_hours = 0
        break_time = 0
        
        for entry in entries:
            if entry['total_hours']:
                hours = float(entry['total_hours'])
                total_hours += hours
                overtime_hours += max(0, hours - TimeTrackingService.MAX_REGULAR_HOURS)
        
        return {
            'date': date,
            'total_hours': f"{total_hours:.2f}",
            'regular_hours': f"{min(total_hours, TimeTrackingService.MAX_REGULAR_HOURS):.2f}",
            'overtime_hours': f"{overtime_hours:.2f}",
            'entries_count': len(entries),
            'status': 'active' if any(e['status'] == 'active' for e in entries) else 'completed'
        }

class BreakService:
    """Service für Pausenverwaltung"""
    
    @staticmethod
    def start_break(user_id: int) -> Dict:
        """Pause starten"""
        active_entry = TimeTrackingService.get_active_entry(user_id)
        if not active_entry:
            return {'success': False, 'error': 'Nicht eingestempelt'}
        
        return {'success': True, 'message': 'Pause gestartet'}
    
    @staticmethod
    def end_break(user_id: int) -> Dict:
        """Pause beenden"""
        return {'success': True, 'message': 'Pause beendet'}
