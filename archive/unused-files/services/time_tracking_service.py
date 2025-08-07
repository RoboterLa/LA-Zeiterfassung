from datetime import datetime, timedelta
from backend.models.database import get_db
from backend.models.models import TimeEntry, User
from sqlalchemy.orm import Session

class TimeTrackingService:
    
    @staticmethod
    def clock_in(db: Session, user_id: int) -> dict:
        """Benutzer einstempeln"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')
        
        # Prüfen ob bereits eingestempelt
        existing_entry = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date == today,
            TimeEntry.clock_out.is_(None)
        ).first()
        
        if existing_entry:
            return {"success": False, "error": "Bereits eingestempelt"}
        
        # Neue Zeiteintrag erstellen
        time_entry = TimeEntry(
            user_id=user_id,
            date=today,
            clock_in=current_time,
            status='active'
        )
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        return {"success": True, "message": "Erfolgreich eingestempelt", "entry": time_entry.to_dict()}
    
    @staticmethod
    def clock_out(db: Session, user_id: int) -> dict:
        """Benutzer ausstempeln"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')
        
        # Aktiven Eintrag finden
        time_entry = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date == today,
            TimeEntry.clock_out.is_(None)
        ).first()
        
        if not time_entry:
            return {"success": False, "error": "Nicht eingestempelt"}
        
        # Ausstempeln
        time_entry.clock_out = current_time
        time_entry.status = 'completed'
        
        # Stunden berechnen
        if time_entry.clock_in and time_entry.clock_out:
            start_time = datetime.strptime(time_entry.clock_in, '%H:%M:%S')
            end_time = datetime.strptime(time_entry.clock_out, '%H:%M:%S')
            
            # Pausenzeit abziehen
            break_time = timedelta(0)
            if time_entry.break_start and time_entry.break_end:
                break_start = datetime.strptime(time_entry.break_start, '%H:%M:%S')
                break_end = datetime.strptime(time_entry.break_end, '%H:%M:%S')
                break_time = break_end - break_start
            
            total_time = end_time - start_time - break_time
            total_hours = total_time.total_seconds() / 3600
            
            time_entry.total_hours = round(total_hours, 2)
            
            # Reguläre Stunden vs. Überstunden
            if total_hours <= 8.0:
                time_entry.regular_hours = round(total_hours, 2)
                time_entry.overtime_hours = 0.0
            else:
                time_entry.regular_hours = 8.0
                time_entry.overtime_hours = round(total_hours - 8.0, 2)
        
        db.commit()
        db.refresh(time_entry)
        
        return {"success": True, "message": "Erfolgreich ausgestempelt", "entry": time_entry.to_dict()}
    
    @staticmethod
    def start_break(db: Session, user_id: int) -> dict:
        """Pause starten"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')
        
        # Aktiven Eintrag finden
        time_entry = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date == today,
            TimeEntry.clock_out.is_(None)
        ).first()
        
        if not time_entry:
            return {"success": False, "error": "Nicht eingestempelt"}
        
        if time_entry.break_start and not time_entry.break_end:
            return {"success": False, "error": "Pause bereits gestartet"}
        
        time_entry.break_start = current_time
        db.commit()
        db.refresh(time_entry)
        
        return {"success": True, "message": "Pause gestartet", "entry": time_entry.to_dict()}
    
    @staticmethod
    def end_break(db: Session, user_id: int) -> dict:
        """Pause beenden"""
        today = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M:%S')
        
        # Aktiven Eintrag finden
        time_entry = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date == today,
            TimeEntry.clock_out.is_(None)
        ).first()
        
        if not time_entry:
            return {"success": False, "error": "Nicht eingestempelt"}
        
        if not time_entry.break_start:
            return {"success": False, "error": "Keine Pause gestartet"}
        
        if time_entry.break_end:
            return {"success": False, "error": "Pause bereits beendet"}
        
        time_entry.break_end = current_time
        db.commit()
        db.refresh(time_entry)
        
        return {"success": True, "message": "Pause beendet", "entry": time_entry.to_dict()}
    
    @staticmethod
    def get_current_status(db: Session, user_id: int) -> dict:
        """Aktuellen Status abrufen"""
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Aktiven Eintrag finden
        time_entry = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date == today,
            TimeEntry.clock_out.is_(None)
        ).first()
        
        if not time_entry:
            return {
                "is_working": False,
                "break_status": "no_break",
                "status": "ausgestempelt",
                "current_entry": None
            }
        
        # Pausenstatus bestimmen
        break_status = "no_break"
        if time_entry.break_start and not time_entry.break_end:
            break_status = "on_break"
        elif time_entry.break_start and time_entry.break_end:
            break_status = "break_completed"
        
        return {
            "is_working": True,
            "break_status": break_status,
            "status": "eingestempelt",
            "current_entry": time_entry.to_dict()
        }
    
    @staticmethod
    def get_time_entries(db: Session, user_id: int, days: int = 7) -> dict:
        """Zeiteinträge abrufen"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        entries = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date >= start_date.strftime('%Y-%m-%d'),
            TimeEntry.date <= end_date.strftime('%Y-%m-%d')
        ).order_by(TimeEntry.date.desc(), TimeEntry.created_at.desc()).all()
        
        return {
            "time_entries": [entry.to_dict() for entry in entries],
            "count": len(entries)
        }
    
    @staticmethod
    def get_work_summary(db: Session, user_id: int, days: int = 7) -> dict:
        """Arbeitszeit-Zusammenfassung"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        entries = db.query(TimeEntry).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.date >= start_date.strftime('%Y-%m-%d'),
            TimeEntry.date <= end_date.strftime('%Y-%m-%d'),
            TimeEntry.status == 'completed'
        ).all()
        
        total_hours = sum(entry.total_hours or 0 for entry in entries)
        regular_hours = sum(entry.regular_hours or 0 for entry in entries)
        overtime_hours = sum(entry.overtime_hours or 0 for entry in entries)
        
        return {
            "total_hours": round(total_hours, 2),
            "regular_hours": round(regular_hours, 2),
            "overtime_hours": round(overtime_hours, 2),
            "entries_count": len(entries),
            "period_days": days
        }
