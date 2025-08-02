from flask import Blueprint, request, jsonify
from utils.auth import auth_manager, require_auth, require_role
from utils.db import db_manager
from models import User, UserRole
from services.crud_service import user_service
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login Endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Authentifizierung
        user = auth_manager.authenticate_user(username, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Token erstellen
        token = auth_manager.create_token(user.id, user.username, user.role.value)
        
        logger.info(f"User logged in: {user.username}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role.value,
                'vacation_days_remaining': user.vacation_days_remaining
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """Gibt aktuellen Benutzer zurück"""
    try:
        user = user_service.get_by_id(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role.value,
                'vacation_days_remaining': user.vacation_days_remaining,
                'weekly_hours': user.weekly_hours,
                'daily_hours': user.daily_hours
            }
        })
        
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Failed to get user'}), 500

@auth_bp.route('/register', methods=['POST'])
@require_auth
@require_role(UserRole.ADMIN.value)
def register_user():
    """Registriert einen neuen Benutzer (nur Admin)"""
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Rolle validieren
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Benutzer erstellen
        user = auth_manager.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            name=data['name'],
            role=role
        )
        
        logger.info(f"User registered by admin: {user.username}")
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role.value
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Register user error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/users', methods=['GET'])
@require_auth
@require_role(UserRole.ADMIN.value, UserRole.MEISTER.value)
def get_users():
    """Holt alle Benutzer (Admin/Meister)"""
    try:
        users = user_service.get_all()
        
        user_list = []
        for user in users:
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role.value,
                'is_active': user.is_active,
                'vacation_days_remaining': user.vacation_days_remaining,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        
        return jsonify({
            'success': True,
            'users': user_list
        })
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({'error': 'Failed to get users'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@require_auth
@require_role(UserRole.ADMIN.value)
def update_user(user_id):
    """Aktualisiert einen Benutzer (nur Admin)"""
    try:
        data = request.get_json()
        
        # Erlaubte Felder für Update
        allowed_fields = ['name', 'email', 'role', 'vacation_days_total', 'weekly_hours', 'daily_hours', 'is_active']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Rolle validieren falls vorhanden
        if 'role' in update_data:
            try:
                role = UserRole(update_data['role'])
                update_data['role'] = role
            except ValueError:
                return jsonify({'error': 'Invalid role'}), 400
        
        user = user_service.update(user_id, update_data)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"User updated by admin: {user.username}")
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.name,
                'role': user.role.value,
                'is_active': user.is_active
            }
        })
        
    except Exception as e:
        logger.error(f"Update user error: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Ändert das Passwort des aktuellen Benutzers"""
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password required'}), 400
        
        user = user_service.get_by_id(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Aktuelles Passwort verifizieren
        if not auth_manager.verify_password(current_password, user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Neues Passwort hashen und speichern
        new_password_hash = auth_manager.hash_password(new_password)
        user_service.update(user.id, {'password_hash': new_password_hash})
        
        logger.info(f"Password changed for user: {user.username}")
        
        return jsonify({'success': True, 'message': 'Password changed successfully'})
        
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return jsonify({'error': 'Failed to change password'}), 500 