import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models import User, UserRole
from utils.db import db_manager
import logging
import os

logger = logging.getLogger(__name__)

class AuthManager:
    def __init__(self, secret_key):
        self.secret_key = secret_key
    
    def hash_password(self, password: str) -> str:
        """Hash ein Passwort mit bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verifiziert ein Passwort gegen den Hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_token(self, user_id: int, username: str, role: str) -> str:
        """Erstellt ein JWT Token"""
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=24),  # 24 Stunden
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token: str) -> dict:
        """Verifiziert ein JWT Token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def authenticate_user(self, username: str, password: str) -> User:
        """Authentifiziert einen Benutzer"""
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(
                (User.username == username) | (User.email == username)
            ).first()
            
            if user and self.verify_password(password, user.password_hash):
                return user
            return None
        finally:
            db_manager.close_session(session)
    
    def create_user(self, username: str, email: str, password: str, name: str, role: UserRole) -> User:
        """Erstellt einen neuen Benutzer"""
        session = db_manager.get_session()
        try:
            # Prüfe ob Benutzer bereits existiert
            existing_user = session.query(User).filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                raise ValueError("User already exists")
            
            # Erstelle neuen Benutzer
            password_hash = self.hash_password(password)
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                name=name,
                role=role
            )
            
            session.add(user)
            session.commit()
            session.refresh(user)
            
            logger.info(f"User created: {username} with role {role}")
            return user
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to create user: {e}")
            raise
        finally:
            db_manager.close_session(session)

# Global Auth Manager Instance
auth_manager = AuthManager(os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key'))

def require_auth(f):
    """Decorator für Auth-geschützte Endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Token aus Header extrahieren
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            payload = auth_manager.verify_token(token)
            request.user_id = payload['user_id']
            request.username = payload['username']
            request.user_role = payload['role']
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

def require_role(*roles):
    """Decorator für Rollen-basierte Autorisierung"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'user_role'):
                return jsonify({'error': 'Authentication required'}), 401
            
            if request.user_role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """Gibt den aktuellen Benutzer zurück"""
    if not hasattr(request, 'user_id'):
        return None
    
    session = db_manager.get_session()
    try:
        return session.query(User).filter(User.id == request.user_id).first()
    finally:
        db_manager.close_session(session)

# Hilfsfunktionen für Rollen-Checks
def is_monteur():
    return hasattr(request, 'user_role') and request.user_role == UserRole.MONTEUR.value

def is_meister():
    return hasattr(request, 'user_role') and request.user_role == UserRole.MEISTER.value

def is_admin():
    return hasattr(request, 'user_role') and request.user_role == UserRole.ADMIN.value

def is_buero():
    return hasattr(request, 'user_role') and request.user_role == UserRole.BUERO.value

def is_lohnbuchhaltung():
    return hasattr(request, 'user_role') and request.user_role == UserRole.LOEHBUCHHALTUNG.value

# Demo-User Setup
def setup_demo_users():
    """Erstellt Demo-Benutzer für Testing"""
    session = db_manager.get_session()
    try:
        # Prüfe ob Demo-User bereits existieren
        existing_users = session.query(User).count()
        if existing_users > 0:
            logger.info("Demo users already exist, skipping creation")
            return
        
        # Demo-User erstellen
        demo_users = [
            {
                'username': 'monteur',
                'email': 'monteur@test.com',
                'password': 'test123',
                'name': 'Monteur Test',
                'role': UserRole.MONTEUR
            },
            {
                'username': 'meister',
                'email': 'meister@test.com',
                'password': 'test123',
                'name': 'Meister Test',
                'role': UserRole.MEISTER
            },
            {
                'username': 'buero',
                'email': 'buero@test.com',
                'password': 'test123',
                'name': 'Büro Test',
                'role': UserRole.BUERO
            },
            {
                'username': 'admin',
                'email': 'admin@test.com',
                'password': 'test123',
                'name': 'Admin Test',
                'role': UserRole.ADMIN
            },
            {
                'username': 'lohnbuchhaltung',
                'email': 'lohn@test.com',
                'password': 'test123',
                'name': 'Lohnbuchhaltung Test',
                'role': UserRole.LOEHBUCHHALTUNG
            }
        ]
        
        for user_data in demo_users:
            try:
                auth_manager.create_user(**user_data)
                logger.info(f"Demo user created: {user_data['username']}")
            except ValueError as e:
                logger.warning(f"Demo user {user_data['username']} already exists: {e}")
        
        logger.info("Demo users setup completed")
        
    except Exception as e:
        logger.error(f"Failed to setup demo users: {e}")
        raise
    finally:
        db_manager.close_session(session) 