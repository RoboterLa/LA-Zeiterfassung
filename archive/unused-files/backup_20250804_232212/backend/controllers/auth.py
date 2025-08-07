from flask import Blueprint, request, jsonify, session
from models.database import get_db, User
from config import Config
import hashlib
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def verify_password(password: str, hashed: str) -> bool:
    """Passwort verifizieren"""
    salt = "zeiterfassung_salt_2024"
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash == hashed

@auth_bp.route('/login', methods=['POST'])
def login():
    """Benutzer anmelden"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email und Passwort erforderlich'}), 400
        
        db = next(get_db())
        user = db.query(User).filter(User.email == email).first()
        
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Ungültige Anmeldedaten'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Benutzer ist deaktiviert'}), 401
        
        # Session setzen
        session['user'] = {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role
        }
        
        return jsonify({
            'success': True,
            'message': 'Erfolgreich angemeldet',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        })
        
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({'error': 'Interner Serverfehler'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Benutzer abmelden"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Erfolgreich abgemeldet'
    })

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Aktuellen Benutzer abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    return jsonify({
        'success': True,
        'user': session['user']
    })

@auth_bp.route('/test-users', methods=['GET'])
def get_test_users():
    """Test-Users für Entwicklung anzeigen"""
    if Config.FLASK_ENV == 'production':
        return jsonify({'error': 'Nicht verfügbar in Production'}), 403
    
    test_users = []
    for email, user_data in Config.TEST_USERS.items():
        test_users.append({
            'email': user_data['email'],
            'password': user_data['password'],
            'name': user_data['name'],
            'role': user_data['role']
        })
    
    return jsonify({
        'success': True,
        'test_users': test_users
    })
