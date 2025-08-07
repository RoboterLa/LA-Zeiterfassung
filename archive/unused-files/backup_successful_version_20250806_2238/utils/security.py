import bcrypt
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from functools import wraps
from flask import request, jsonify, session
from models.user import UserService, UserRole

class SecurityService:
    """Service für Sicherheitsfunktionen"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash-Passwort mit bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Überprüft Passwort mit bcrypt"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def generate_audit_log(user_id: int, action: str, details: str = None) -> None:
        """Erstellt Audit-Log"""
        timestamp = datetime.now().isoformat()
        
        # Get request info if available
        try:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
        except RuntimeError:
            # Outside request context
            ip_address = 'system'
            user_agent = 'system'
        
        log_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'action': action,
            'details': details,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        # Log to file for 10-year retention
        logging.info(f"AUDIT: {log_entry}")
        
        # TODO: Store in database for long-term retention
        SecurityService._store_audit_log(log_entry)
    
    @staticmethod
    def _store_audit_log(log_entry: Dict):
        """Speichert Audit-Log in Datenbank"""
        from utils.db import get_db_connection
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO audit_logs (timestamp, user_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            log_entry['timestamp'],
            log_entry['user_id'],
            log_entry['action'],
            log_entry['details'],
            log_entry['ip_address'],
            log_entry['user_agent']
        ))
        
        conn.commit()
        conn.close()

def require_auth(f):
    """Decorator für Authentifizierung"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        # Audit-Log für Zugriff
        user_id = session['user'].get('id')
        if user_id:
            SecurityService.generate_audit_log(
                user_id, 
                'page_access', 
                f'Accessed: {request.endpoint}'
            )
        
        return f(*args, **kwargs)
    return decorated_function

def require_permission(permission: str):
    """Decorator für Berechtigungen"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return jsonify({'error': 'Nicht angemeldet'}), 401
            
            user = UserService.get_user_by_email(session['user']['email'])
            if not user or not user.has_permission(permission):
                SecurityService.generate_audit_log(
                    user.id if user else None,
                    'permission_denied',
                    f'Permission: {permission}, Endpoint: {request.endpoint}'
                )
                return jsonify({'error': 'Keine Berechtigung'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role: UserRole):
    """Decorator für Rollen"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return jsonify({'error': 'Nicht angemeldet'}), 401
            
            user = UserService.get_user_by_email(session['user']['email'])
            if not user or user.role != role:
                SecurityService.generate_audit_log(
                    user.id if user else None,
                    'role_denied',
                    f'Required: {role.value}, User: {user.role.value if user else "unknown"}'
                )
                return jsonify({'error': 'Falsche Rolle'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class DataRetentionService:
    """Service für Datenaufbewahrung (10 Jahre)"""
    
    @staticmethod
    def cleanup_old_data():
        """Bereinigt alte Daten nach 10 Jahren"""
        cutoff_date = datetime.now() - timedelta(days=3650)  # 10 Jahre
        
        from utils.db import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Lösche alte Audit-Logs (außer kritische)
        cursor.execute('''
            DELETE FROM audit_logs 
            WHERE created_at < ? AND action NOT IN ('login_failed', 'security_violation')
        ''', (cutoff_date.isoformat(),))
        
        # Lösche alte Zeiteinträge (außer genehmigte)
        cursor.execute('''
            DELETE FROM zeiterfassung 
            WHERE created_at < ? AND status != 'approved'
        ''', (cutoff_date.isoformat(),))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def export_data_for_retention(user_id: int, start_date: str, end_date: str) -> Dict:
        """Exportiert Daten für Langzeitaufbewahrung"""
        from utils.db import get_db_connection
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Exportiere alle relevanten Daten
        cursor.execute('''
            SELECT * FROM zeiterfassung 
            WHERE user_id = ? AND date BETWEEN ? AND ?
        ''', (user_id, start_date, end_date))
        
        time_entries = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute('''
            SELECT * FROM audit_logs 
            WHERE user_id = ? AND timestamp BETWEEN ? AND ?
        ''', (user_id, start_date, end_date))
        
        audit_logs = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'user_id': user_id,
            'export_date': datetime.now().isoformat(),
            'period': {'start': start_date, 'end': end_date},
            'time_entries': time_entries,
            'audit_logs': audit_logs
        }
