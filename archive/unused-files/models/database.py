from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
from backend.config import Config

# Create SQLAlchemy engine
engine = create_engine(Config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class OrderPriority(enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class OrderStatus(enum.Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ReportStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class TimeEntryStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    BREAK = "break"

class VacationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Monteur, Büro, Lohn
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    time_entries = relationship("TimeEntry", back_populates="user")
    vacation_requests = relationship("VacationRequest", back_populates="user", foreign_keys="VacationRequest.user_id")
    sick_leaves = relationship("SickLeave", back_populates="user", foreign_keys="SickLeave.user_id")
    daily_reports = relationship("DailyReport", back_populates="user", foreign_keys="DailyReport.user_id")
    assigned_orders = relationship("Order", back_populates="assigned_to_user", foreign_keys="Order.assigned_to")
    approved_vacation_requests = relationship("VacationRequest", back_populates="approver", foreign_keys="VacationRequest.approved_by")
    approved_sick_leaves = relationship("SickLeave", back_populates="approver", foreign_keys="SickLeave.approved_by")
    approved_daily_reports = relationship("DailyReport", back_populates="approver", foreign_keys="DailyReport.approved_by")

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    clock_in = Column(DateTime, nullable=False)
    clock_out = Column(DateTime)
    break_start = Column(DateTime)
    break_end = Column(DateTime)
    total_hours = Column(Float)
    regular_hours = Column(Float)
    overtime_hours = Column(Float)
    status = Column(Enum(TimeEntryStatus), default=TimeEntryStatus.ACTIVE)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="time_entries")

class VacationRequest(Base):
    __tablename__ = "vacation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(String, nullable=False)  # YYYY-MM-DD format
    end_date = Column(String, nullable=False)  # YYYY-MM-DD format
    reason = Column(Text)
    status = Column(Enum(VacationStatus), default=VacationStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="vacation_requests", foreign_keys=[user_id])
    approver = relationship("User", back_populates="approved_vacation_requests", foreign_keys=[approved_by])

class SickLeave(Base):
    __tablename__ = "sick_leaves"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(String, nullable=False)  # YYYY-MM-DD format
    end_date = Column(String)  # YYYY-MM-DD format, optional
    reason = Column(Text)
    status = Column(Enum(VacationStatus), default=VacationStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sick_leaves", foreign_keys=[user_id])
    approver = relationship("User", back_populates="approved_sick_leaves", foreign_keys=[approved_by])

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(OrderStatus), default=OrderStatus.ASSIGNED)
    priority = Column(Enum(OrderPriority), default=OrderPriority.NORMAL)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    completed_date = Column(DateTime)
    estimated_hours = Column(Float)
    actual_hours = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assigned_to_user = relationship("User", back_populates="assigned_orders", foreign_keys=[assigned_to])
    daily_reports = relationship("DailyReport", back_populates="order")

class DailyReport(Base):
    __tablename__ = "daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    work_description = Column(Text, nullable=False)
    hours_worked = Column(Float, nullable=False)
    materials_used = Column(Text)
    issues_encountered = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="daily_reports", foreign_keys=[user_id])
    order = relationship("Order", back_populates="daily_reports")
    approver = relationship("User", back_populates="approved_daily_reports", foreign_keys=[approved_by])

class WorkSchedule(Base):
    __tablename__ = "work_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    break_start = Column(String)  # HH:MM format
    break_end = Column(String)  # HH:MM format
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # info, warning, error, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
