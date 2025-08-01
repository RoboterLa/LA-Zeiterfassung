from flask import Blueprint, request, jsonify, session, redirect
from typing import Dict, Any
from backend.config import Config

# Blueprint für Auth-Routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login API - POST: Authentifizierung"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'E-Mail und Passwort erforderlich'}), 400
    
    # Prüfe Test-User
    if email in Config.TEST_USERS and Config.TEST_USERS[email]['password'] == password:
        user_data = Config.TEST_USERS[email]
        session['user'] = {
            'email': email,
            'name': user_data['name'],
            'role': user_data['role']
        }
        
        return jsonify({
            'success': True,
            'user': session['user'],
            'redirect': '/buero' if user_data['role'] == 'Admin' else '/'
        })
    
    return jsonify({'error': 'Ungültige Anmeldedaten'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout API - POST: Session löschen"""
    session.clear()
    session.modified = True
    
    return jsonify({'success': True, 'message': 'Erfolgreich abgemeldet'})

@auth_bp.route('/me', methods=['GET'])
def me():
    """Current User API - GET: Aktueller Benutzer"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    return jsonify({
        'user': session['user'],
        'authenticated': True
    }) 