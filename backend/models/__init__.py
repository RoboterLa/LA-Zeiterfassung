from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()

# Enums für Rollen und Status
class UserRole(enum.Enum):
    MONTEUR = "monteur"
    MEISTER = "meister"
    BUERO = "buero"
    LOEHBUCHHALTUNG = "lohnbuchhaltung"
    ADMIN = "admin"

class TimeRecordStatus(enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class WorkReportStatus(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class AbsenceType(enum.Enum):
    URLAUB = "urlaub"
    KRANKHEIT = "krankheit"
    FREISTELLUNG = "freistellung"

class AbsenceStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# User Model
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    supervisor_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Urlaubskonto
    vacation_days_total = Column(Integer, default=25)
    vacation_days_used = Column(Integer, default=0)
    vacation_days_remaining = Column(Integer, default=25)
    
    # Arbeitszeit-Konfiguration
    weekly_hours = Column(Float, default=40.0)
    daily_hours = Column(Float, default=8.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    time_records = relationship("TimeRecord", back_populates="user")
    work_reports = relationship("WorkReport", back_populates="user")
    absence_requests = relationship("AbsenceRequest", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

# TimeRecord Model
class TimeRecord(Base):
    __tablename__ = 'time_records'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    clock_in = Column(DateTime, nullable=False)
    clock_out = Column(DateTime, nullable=True)
    status = Column(Enum(TimeRecordStatus), default=TimeRecordStatus.ACTIVE)
    
    # Pausen
    break_start = Column(DateTime, nullable=True)
    break_end = Column(DateTime, nullable=True)
    total_break_minutes = Column(Integer, default=0)
    
    # Notizen
    note = Column(Text, nullable=True)
    
    # Verpflegungsmehraufwand
    meal_allowance = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="time_records")

# JobSite Model
class JobSite(Base):
    __tablename__ = 'job_sites'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    factory_number = Column(String(50), nullable=True)
    project_number = Column(String(50), nullable=True)
    order_number = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    work_reports = relationship("WorkReport", back_populates="job_site")

# WorkReport Model
class WorkReport(Base):
    __tablename__ = 'work_reports'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    job_site_id = Column(Integer, ForeignKey('job_sites.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Leistungserfassung
    units = Column(Float, nullable=False)
    factor = Column(Float, default=1.0)
    task_type = Column(String(50), nullable=False)  # Wartung, Reparatur, etc.
    
    # Notdienst
    emergency_service = Column(Boolean, default=False)
    emergency_start = Column(DateTime, nullable=True)
    emergency_end = Column(DateTime, nullable=True)
    
    # Freigabe
    status = Column(Enum(WorkReportStatus), default=WorkReportStatus.DRAFT)
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="work_reports")
    job_site = relationship("JobSite", back_populates="work_reports")

# AbsenceRequest Model
class AbsenceRequest(Base):
    __tablename__ = 'absence_requests'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    absence_type = Column(Enum(AbsenceType), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    
    # Genehmigung
    status = Column(Enum(AbsenceStatus), default=AbsenceStatus.PENDING)
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="absence_requests")

# Notification Model
class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # warning, info, success, error
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

# Setting Model
class Setting(Base):
    __tablename__ = 'settings'
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# AuditLog Model
class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs") 