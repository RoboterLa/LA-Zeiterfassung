from sqlalchemy.orm import Session
from models.models import VacationRequest, SickLeave, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class VacationService:
    
    @staticmethod
    def create_vacation_request(db: Session, user_id: int, request_type: str, start_date: str, 
                               end_date: str, is_half_day: bool = False, comment: str = "") -> VacationRequest:
        """Neuen Urlaubsantrag erstellen"""
        try:
            vacation_request = VacationRequest(
                user_id=user_id,
                type=request_type,
                start_date=start_date,
                end_date=end_date,
                is_half_day=is_half_day,
                comment=comment,
                status='pending',
                created_at=datetime.now()
            )
            db.add(vacation_request)
            db.commit()
            db.refresh(vacation_request)
            return vacation_request
        except Exception as e:
            logger.error(f"Error creating vacation request: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_vacation_requests(db: Session, user_id: int) -> dict:
        """Alle Urlaubsanträge eines Benutzers abrufen"""
        try:
            requests = db.query(VacationRequest).filter(VacationRequest.user_id == user_id).order_by(VacationRequest.created_at.desc()).all()
            requests_list = []
            for request in requests:
                requests_list.append({
                    'id': request.id,
                    'user_id': request.user_id,
                    'type': request.type,
                    'start_date': request.start_date,
                    'end_date': request.end_date,
                    'is_half_day': request.is_half_day,
                    'comment': request.comment,
                    'status': request.status,
                    'created_at': request.created_at.isoformat() if request.created_at else None
                })
            return {"success": True, "vacation_requests": requests_list}
        except Exception as e:
            logger.error(f"Error fetching vacation requests: {e}")
            return {"success": False, "vacation_requests": []}
    
    @staticmethod
    def update_vacation_request(db: Session, request_id: int, **kwargs) -> VacationRequest:
        """Urlaubsantrag aktualisieren"""
        try:
            request = db.query(VacationRequest).filter(VacationRequest.id == request_id).first()
            if not request:
                raise ValueError("Urlaubsantrag nicht gefunden")
            
            for key, value in kwargs.items():
                if hasattr(request, key):
                    setattr(request, key, value)
            
            db.commit()
            db.refresh(request)
            return request
        except Exception as e:
            logger.error(f"Error updating vacation request: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def delete_vacation_request(db: Session, request_id: int) -> bool:
        """Urlaubsantrag löschen"""
        try:
            request = db.query(VacationRequest).filter(VacationRequest.id == request_id).first()
            if not request:
                return False
            
            db.delete(request)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting vacation request: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def create_sick_leave(db: Session, user_id: int, start_date: str, end_date: str, comment: str = "") -> SickLeave:
        """Neue Krankmeldung erstellen"""
        try:
            sick_leave = SickLeave(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                comment=comment,
                status='pending',
                created_at=datetime.now()
            )
            db.add(sick_leave)
            db.commit()
            db.refresh(sick_leave)
            return sick_leave
        except Exception as e:
            logger.error(f"Error creating sick leave: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_sick_leaves(db: Session, user_id: int) -> dict:
        """Alle Krankmeldungen eines Benutzers abrufen"""
        try:
            leaves = db.query(SickLeave).filter(SickLeave.user_id == user_id).order_by(SickLeave.created_at.desc()).all()
            leaves_list = []
            for leave in leaves:
                leaves_list.append({
                    'id': leave.id,
                    'user_id': leave.user_id,
                    'start_date': leave.start_date,
                    'end_date': leave.end_date,
                    'comment': leave.comment,
                    'status': leave.status,
                    'created_at': leave.created_at.isoformat() if leave.created_at else None
                })
            return {"success": True, "sick_leaves": leaves_list}
        except Exception as e:
            logger.error(f"Error fetching sick leaves: {e}")
            return {"success": False, "sick_leaves": []}
    
    @staticmethod
    def update_sick_leave(db: Session, leave_id: int, **kwargs) -> SickLeave:
        """Krankmeldung aktualisieren"""
        try:
            leave = db.query(SickLeave).filter(SickLeave.id == leave_id).first()
            if not leave:
                raise ValueError("Krankmeldung nicht gefunden")
            
            for key, value in kwargs.items():
                if hasattr(leave, key):
                    setattr(leave, key, value)
            
            db.commit()
            db.refresh(leave)
            return leave
        except Exception as e:
            logger.error(f"Error updating sick leave: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def delete_sick_leave(db: Session, leave_id: int) -> bool:
        """Krankmeldung löschen"""
        try:
            leave = db.query(SickLeave).filter(SickLeave.id == leave_id).first()
            if not leave:
                return False
            
            db.delete(leave)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting sick leave: {e}")
            db.rollback()
            return False
