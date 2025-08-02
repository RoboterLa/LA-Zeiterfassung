from typing import List, Optional, Type, TypeVar, Generic, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models import Base, User, TimeRecord, WorkReport, JobSite, AbsenceRequest, UserRole, TimeRecordStatus, WorkReportStatus, AbsenceStatus
from utils.db import db_manager
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=Base)

class GenericCrudService(Generic[T]):
    """Generischer CRUD Service für alle Models"""
    
    def __init__(self, model: Type[T]):
        self.model = model
    
    def create(self, data: Dict[str, Any]) -> T:
        """Erstellt einen neuen Eintrag"""
        session = db_manager.get_session()
        try:
            instance = self.model(**data)
            session.add(instance)
            session.commit()
            session.refresh(instance)
            logger.info(f"Created {self.model.__name__}: {instance.id}")
            return instance
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to create {self.model.__name__}: {e}")
            raise
        finally:
            db_manager.close_session(session)
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Holt einen Eintrag nach ID"""
        session = db_manager.get_session()
        try:
            return session.query(self.model).filter(self.model.id == id).first()
        finally:
            db_manager.close_session(session)
    
    def get_all(self, limit: Optional[int] = None, offset: Optional[int] = None) -> List[T]:
        """Holt alle Einträge mit optionaler Pagination"""
        session = db_manager.get_session()
        try:
            query = session.query(self.model)
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            return query.all()
        finally:
            db_manager.close_session(session)
    
    def get_by_filters(self, filters: Dict[str, Any], limit: Optional[int] = None) -> List[T]:
        """Holt Einträge nach Filtern"""
        session = db_manager.get_session()
        try:
            query = session.query(self.model)
            
            for key, value in filters.items():
                if hasattr(self.model, key):
                    if isinstance(value, list):
                        query = query.filter(getattr(self.model, key).in_(value))
                    else:
                        query = query.filter(getattr(self.model, key) == value)
            
            if limit:
                query = query.limit(limit)
            
            return query.all()
        finally:
            db_manager.close_session(session)
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Aktualisiert einen Eintrag"""
        session = db_manager.get_session()
        try:
            instance = session.query(self.model).filter(self.model.id == id).first()
            if not instance:
                return None
            
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            
            session.commit()
            session.refresh(instance)
            logger.info(f"Updated {self.model.__name__}: {id}")
            return instance
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to update {self.model.__name__} {id}: {e}")
            raise
        finally:
            db_manager.close_session(session)
    
    def delete(self, id: int) -> bool:
        """Löscht einen Eintrag"""
        session = db_manager.get_session()
        try:
            instance = session.query(self.model).filter(self.model.id == id).first()
            if not instance:
                return False
            
            session.delete(instance)
            session.commit()
            logger.info(f"Deleted {self.model.__name__}: {id}")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to delete {self.model.__name__} {id}: {e}")
            raise
        finally:
            db_manager.close_session(session)
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Zählt Einträge mit optionalen Filtern"""
        session = db_manager.get_session()
        try:
            query = session.query(self.model)
            
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key):
                        if isinstance(value, list):
                            query = query.filter(getattr(self.model, key).in_(value))
                        else:
                            query = query.filter(getattr(self.model, key) == value)
            
            return query.count()
        finally:
            db_manager.close_session(session)
    
    def exists(self, id: int) -> bool:
        """Prüft ob ein Eintrag existiert"""
        session = db_manager.get_session()
        try:
            return session.query(self.model).filter(self.model.id == id).first() is not None
        finally:
            db_manager.close_session(session)

# Spezialisierte Services für spezifische Models
class UserService(GenericCrudService):
    """Service für User-spezifische Operationen"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_username(self, username: str):
        """Holt User nach Username"""
        session = db_manager.get_session()
        try:
            return session.query(User).filter(
                or_(User.username == username, User.email == username)
            ).first()
        finally:
            db_manager.close_session(session)
    
    def get_by_role(self, role: str):
        """Holt alle User einer bestimmten Rolle"""
        session = db_manager.get_session()
        try:
            return session.query(User).filter(User.role == role).all()
        finally:
            db_manager.close_session(session)

class TimeRecordService(GenericCrudService):
    """Service für TimeRecord-spezifische Operationen"""
    
    def __init__(self):
        super().__init__(TimeRecord)
    
    def get_active_by_user(self, user_id: int):
        """Holt aktive TimeRecord für einen User"""
        session = db_manager.get_session()
        try:
            return session.query(TimeRecord).filter(
                and_(
                    TimeRecord.user_id == user_id,
                    TimeRecord.status == TimeRecordStatus.ACTIVE
                )
            ).first()
        finally:
            db_manager.close_session(session)
    
    def get_by_user_and_date(self, user_id: int, date):
        """Holt TimeRecords für User an einem bestimmten Datum"""
        session = db_manager.get_session()
        try:
            return session.query(TimeRecord).filter(
                and_(
                    TimeRecord.user_id == user_id,
                    TimeRecord.clock_in >= date.replace(hour=0, minute=0, second=0),
                    TimeRecord.clock_in < date.replace(hour=23, minute=59, second=59)
                )
            ).all()
        finally:
            db_manager.close_session(session)

class WorkReportService(GenericCrudService):
    """Service für WorkReport-spezifische Operationen"""
    
    def __init__(self):
        super().__init__(WorkReport)
    
    def get_pending_approvals(self, approver_id: int):
        """Holt alle zur Freigabe anstehenden Berichte"""
        session = db_manager.get_session()
        try:
            return session.query(WorkReport).filter(
                WorkReport.status == WorkReportStatus.SUBMITTED
            ).all()
        finally:
            db_manager.close_session(session)
    
    def approve_report(self, report_id: int, approver_id: int):
        """Genehmigt einen Bericht"""
        return self.update(report_id, {
            'status': WorkReportStatus.APPROVED,
            'approved_by': approver_id,
            'approved_at': datetime.utcnow()
        })
    
    def reject_report(self, report_id: int, approver_id: int, reason: str):
        """Lehnt einen Bericht ab"""
        return self.update(report_id, {
            'status': WorkReportStatus.REJECTED,
            'approved_by': approver_id,
            'approved_at': datetime.utcnow(),
            'rejection_reason': reason
        })

class JobSiteService(GenericCrudService):
    """Service für JobSite-spezifische Operationen"""
    
    def __init__(self):
        super().__init__(JobSite)
    
    def get_active_sites(self):
        """Holt alle aktiven JobSites"""
        session = db_manager.get_session()
        try:
            return session.query(JobSite).filter(JobSite.is_active == True).all()
        finally:
            db_manager.close_session(session)
    
    def get_sites_by_region(self, region: str):
        """Holt JobSites nach Region"""
        session = db_manager.get_session()
        try:
            return session.query(JobSite).filter(
                JobSite.region == region,
                JobSite.is_active == True
            ).all()
        finally:
            db_manager.close_session(session)

class AbsenceRequestService(GenericCrudService):
    """Service für AbsenceRequest-spezifische Operationen"""
    
    def __init__(self):
        super().__init__(AbsenceRequest)
    
    def get_by_user_and_period(self, user_id: int, start_date: datetime, end_date: datetime):
        """Holt Abwesenheitsanfragen für einen User in einem bestimmten Zeitraum"""
        session = db_manager.get_session()
        try:
            return session.query(AbsenceRequest).filter(
                and_(
                    AbsenceRequest.user_id == user_id,
                    AbsenceRequest.start_date <= end_date,
                    AbsenceRequest.end_date >= start_date
                )
            ).all()
        finally:
            db_manager.close_session(session)
    
    def get_pending_approvals(self, approver_id: int):
        """Holt alle zur Freigabe anstehenden Abwesenheitsanfragen"""
        session = db_manager.get_session()
        try:
            return session.query(AbsenceRequest).filter(
                AbsenceRequest.status == AbsenceStatus.PENDING
            ).all()
        finally:
            db_manager.close_session(session)
    
    def approve_request(self, request_id: int, approver_id: int):
        """Genehmigt eine Abwesenheitsanfrage"""
        return self.update(request_id, {
            'status': AbsenceStatus.APPROVED,
            'approved_by': approver_id,
            'approved_at': datetime.utcnow()
        })
    
    def reject_request(self, request_id: int, approver_id: int, reason: str):
        """Lehnt eine Abwesenheitsanfrage ab"""
        return self.update(request_id, {
            'status': AbsenceStatus.REJECTED,
            'approved_by': approver_id,
            'approved_at': datetime.utcnow(),
            'rejection_reason': reason
        })

# Service Instances
user_service = UserService()
time_record_service = TimeRecordService()
work_report_service = WorkReportService()
job_site_service = JobSiteService()
absence_request_service = AbsenceRequestService() 