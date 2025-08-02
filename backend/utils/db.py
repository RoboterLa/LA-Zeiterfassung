from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from models import Base, User, UserRole
from utils.auth import AuthManager
import os
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._setup_engine()
    
    def _setup_engine(self):
        """Setup database engine based on environment"""
        database_url = os.environ.get('DATABASE_URL')
        
        if database_url:
            # Production: PostgreSQL/MySQL
            self.engine = create_engine(database_url)
        else:
            # Development: SQLite
            db_path = os.path.join(os.path.dirname(__file__), '..', 'zeiterfassung.db')
            self.engine = create_engine(f'sqlite:///{db_path}')
        
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def create_tables(self):
        """Create all tables"""
        Base.metadata.create_all(bind=self.engine)
        logger.info("Database tables created successfully")
    
    def drop_tables(self):
        """Drop all tables"""
        Base.metadata.drop_all(bind=self.engine)
        logger.info("Database tables dropped successfully")
    
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
    
    def close_session(self, session):
        """Close database session"""
        session.close()

# Global database manager instance
db_manager = DatabaseManager()

def get_db():
    """Dependency to get database session"""
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db_manager.close_session(db)

def init_database():
    """Initialize database with tables"""
    try:
        db_manager.create_tables()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

def reset_database():
    """Reset database (drop and recreate tables)"""
    try:
        db_manager.drop_tables()
        db_manager.create_tables()
        logger.info("Database reset successfully")
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise

def setup_demo_users():
    """Setup demo users for testing"""
    try:
        session = db_manager.get_session()
        auth_manager = AuthManager()
        
        # Check if demo users already exist
        existing_users = session.query(User).filter(User.username.in_(['monteur1', 'meister1', 'admin'])).all()
        if existing_users:
            logger.info("Demo users already exist")
            return
        
        # Create demo users
        demo_users = [
            {
                'username': 'monteur1',
                'name': 'Max Mustermann',
                'email': 'max.mustermann@example.com',
                'role': UserRole.MONTEUR,
                'password': 'Demo123!',
                'vacation_days_remaining': 25,
                'weekly_hours': 40
            },
            {
                'username': 'meister1',
                'name': 'Hans Meister',
                'email': 'hans.meister@example.com',
                'role': UserRole.MEISTER,
                'password': 'Demo123!',
                'vacation_days_remaining': 30,
                'weekly_hours': 40
            },
            {
                'username': 'admin',
                'name': 'Admin User',
                'email': 'admin@example.com',
                'role': UserRole.ADMIN,
                'password': 'Demo123!',
                'vacation_days_remaining': 30,
                'weekly_hours': 40
            },
            {
                'username': 'buero1',
                'name': 'Anna Büro',
                'email': 'anna.buero@example.com',
                'role': UserRole.BUERO,
                'password': 'Demo123!',
                'vacation_days_remaining': 25,
                'weekly_hours': 40
            }
        ]
        
        for user_data in demo_users:
            hashed_password = auth_manager.hash_password(user_data['password'])
            user = User(
                username=user_data['username'],
                name=user_data['name'],
                email=user_data['email'],
                password_hash=hashed_password,
                role=user_data['role'],
                vacation_days_remaining=user_data['vacation_days_remaining'],
                weekly_hours=user_data['weekly_hours'],
                is_active=True
            )
            session.add(user)
        
        session.commit()
        logger.info("Demo users created successfully")
        
    except Exception as e:
        logger.error(f"Failed to setup demo users: {e}")
        session.rollback()
        raise
    finally:
        db_manager.close_session(session) 