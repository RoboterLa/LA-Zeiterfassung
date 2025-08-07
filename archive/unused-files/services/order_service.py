from sqlalchemy.orm import Session
from backend.models.models import Order, DailyReport, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class OrderService:
    
    @staticmethod
    def create_order(db: Session, user_id: int, order_number: str, location: str, 
                    factory_number: str, activity: str, description: str = "", status: str = "active") -> Order:
        """Neuen Auftrag erstellen"""
        try:
            order = Order(
                user_id=user_id,
                order_number=order_number,
                location=location,
                factory_number=factory_number,
                activity=activity,
                description=description,
                status=status,
                created_at=datetime.now()
            )
            db.add(order)
            db.commit()
            db.refresh(order)
            return order
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_orders(db: Session, user_id: int) -> list:
        """Alle Aufträge eines Benutzers abrufen"""
        try:
            return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
        except Exception as e:
            logger.error(f"Error fetching orders: {e}")
            return []
    
    @staticmethod
    def update_order(db: Session, order_id: int, **kwargs) -> Order:
        """Auftrag aktualisieren"""
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise ValueError("Auftrag nicht gefunden")
            
            for key, value in kwargs.items():
                if hasattr(order, key):
                    setattr(order, key, value)
            
            db.commit()
            db.refresh(order)
            return order
        except Exception as e:
            logger.error(f"Error updating order: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def delete_order(db: Session, order_id: int) -> bool:
        """Auftrag löschen"""
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return False
            
            db.delete(order)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting order: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def create_daily_report(db: Session, user_id: int, report_date: str, location: str, 
                           factory_number: str, activity: str, performance_unit: float = 0.0,
                           emergency_service: bool = False, order_number: str = "", 
                           free_text: str = "", status: str = "pending") -> DailyReport:
        """Neuen Tagesbericht erstellen"""
        try:
            daily_report = DailyReport(
                user_id=user_id,
                report_date=report_date,
                location=location,
                factory_number=factory_number,
                activity=activity,
                performance_unit=performance_unit,
                emergency_service=emergency_service,
                order_number=order_number,
                free_text=free_text,
                status=status,
                created_at=datetime.now()
            )
            db.add(daily_report)
            db.commit()
            db.refresh(daily_report)
            return daily_report
        except Exception as e:
            logger.error(f"Error creating daily report: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_daily_reports(db: Session, user_id: int) -> list:
        """Alle Tagesberichte eines Benutzers abrufen"""
        try:
            return db.query(DailyReport).filter(DailyReport.user_id == user_id).order_by(DailyReport.created_at.desc()).all()
        except Exception as e:
            logger.error(f"Error fetching daily reports: {e}")
            return []
    
    @staticmethod
    def update_daily_report(db: Session, report_id: int, **kwargs) -> DailyReport:
        """Tagesbericht aktualisieren"""
        try:
            report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
            if not report:
                raise ValueError("Tagesbericht nicht gefunden")
            
            for key, value in kwargs.items():
                if hasattr(report, key):
                    setattr(report, key, value)
            
            db.commit()
            db.refresh(report)
            return report
        except Exception as e:
            logger.error(f"Error updating daily report: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def delete_daily_report(db: Session, report_id: int) -> bool:
        """Tagesbericht löschen"""
        try:
            report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
            if not report:
                return False
            
            db.delete(report)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting daily report: {e}")
            db.rollback()
            return False
