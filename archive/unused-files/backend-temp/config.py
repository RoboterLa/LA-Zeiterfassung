import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', '3Gz7bL0PfHs9qAe2JvY5tDx8wU6RmNc1')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Database Configuration
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///zeiterfassung.db')
    
    # CORS Configuration
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080']
    
    # Session Configuration
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    
    # Test Users (for development)
    TEST_USERS = {
        'admin': {
            'email': 'admin',
            'password': 'admin123',
            'name': 'Administrator',
            'role': 'Admin'
        },
        'monteur': {
            'email': 'monteur',
            'password': 'monteur123',
            'name': 'Max Mustermann',
            'role': 'Monteur'
        },
        'buero': {
            'email': 'buero',
            'password': 'buero123',
            'name': 'Anna Büro',
            'role': 'Büro'
        },
        'lohn': {
            'email': 'lohn',
            'password': 'lohn123',
            'name': 'Peter Lohn',
            'role': 'Lohn'
        }
    }
    
    # Business Logic Configuration
    REGULAR_WORK_HOURS = 8.0  # Standard work hours per day
    OVERTIME_THRESHOLD = 8.0  # Hours after which overtime starts
    BREAK_DURATION = 0.5  # Standard break duration in hours
    MAX_WORK_HOURS = 12.0  # Maximum work hours per day
    
    # Vacation Configuration
    VACATION_DAYS_PER_YEAR = 25
    SICK_LEAVE_DAYS_PER_YEAR = 30
    
    # Order Configuration
    ORDER_PRIORITIES = ['low', 'normal', 'high', 'urgent']
    ORDER_STATUSES = ['assigned', 'in_progress', 'completed', 'cancelled']
    
    # Report Configuration
    REPORT_STATUSES = ['pending', 'approved', 'rejected']
    REPORT_TYPES = ['daily', 'weekly', 'monthly']
