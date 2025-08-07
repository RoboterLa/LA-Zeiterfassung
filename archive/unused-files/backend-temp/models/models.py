from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    time_entries = relationship("TimeEntry", back_populates="user", foreign_keys="TimeEntry.user_id")
    vacation_requests = relationship("VacationRequest", back_populates="user", foreign_keys="VacationRequest.user_id")
    sick_leaves = relationship("SickLeave", back_populates="user", foreign_keys="SickLeave.user_id")
    orders = relationship("Order", back_populates="user", foreign_keys="Order.user_id")
    daily_reports = relationship("DailyReport", back_populates="user", foreign_keys="DailyReport.user_id")
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }

class TimeEntry(Base):
    __tablename__ = 'time_entries'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    clock_in = Column(String(8))  # HH:MM:SS
    clock_out = Column(String(8))  # HH:MM:SS
    break_start = Column(String(8))  # HH:MM:SS
    break_end = Column(String(8))  # HH:MM:SS
    total_hours = Column(Float, default=0.0)
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    status = Column(String(20), default='active')
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="time_entries", foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date,
            'clock_in': self.clock_in,
            'clock_out': self.clock_out,
            'break_start': self.break_start,
            'break_end': self.break_end,
            'total_hours': self.total_hours,
            'regular_hours': self.regular_hours,
            'overtime_hours': self.overtime_hours,
            'status': self.status,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class VacationRequest(Base):
    __tablename__ = 'vacation_requests'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    reason = Column(String(100), nullable=False)
    is_half_day = Column(Boolean, default=False)
    comment = Column(Text)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="vacation_requests", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'reason': self.reason,
            'is_half_day': self.is_half_day,
            'comment': self.comment,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SickLeave(Base):
    __tablename__ = 'sick_leaves'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10))  # YYYY-MM-DD (optional for ongoing)
    reason = Column(Text)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sick_leaves", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'reason': self.reason,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    factory_number = Column(String(100))
    status = Column(String(20), default='active')  # active, completed, cancelled
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    daily_reports = relationship("DailyReport", back_populates="order")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'address': self.address,
            'factory_number': self.factory_number,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class DailyReport(Base):
    __tablename__ = 'daily_reports'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    order_id = Column(Integer, ForeignKey('orders.id'))
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    location = Column(String(200), nullable=False)
    factory_number = Column(String(100))
    activity = Column(String(100), nullable=False)
    performance_unit = Column(Float)
    emergency_service = Column(Boolean, default=False)
    emergency_service_times = Column(String(100))
    order_number = Column(String(100))
    free_text = Column(Text)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    master_comment = Column(Text)
    approved_by = Column(Integer, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="daily_reports", foreign_keys=[user_id])
    order = relationship("Order", back_populates="daily_reports", foreign_keys=[order_id])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'order_id': self.order_id,
            'date': self.date,
            'location': self.location,
            'factory_number': self.factory_number,
            'activity': self.activity,
            'performance_unit': self.performance_unit,
            'emergency_service': self.emergency_service,
            'emergency_service_times': self.emergency_service_times,
            'order_number': self.order_number,
            'free_text': self.free_text,
            'status': self.status,
            'master_comment': self.master_comment,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default='info')  # info, warning, error, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WorkSchedule(Base):
    __tablename__ = 'work_schedules'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(8))  # HH:MM:SS
    end_time = Column(String(8))  # HH:MM:SS
    break_start = Column(String(8))  # HH:MM:SS
    break_end = Column(String(8))  # HH:MM:SS
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'break_start': self.break_start,
            'break_end': self.break_end,
            'is_active': self.is_active
        }
