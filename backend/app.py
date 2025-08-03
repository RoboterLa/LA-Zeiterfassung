#!/usr/bin/env python3
"""
Haupt-App für Zeiterfassung System
"""

from flask import Flask, send_from_directory, request, jsonify, session
from flask_cors import CORS
import os
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.config import Config
from backend.utils.db import init_db, ensure_sessions_dir
from backend.controllers.monteur_api import monteur_bp

logging.basicConfig(level=logging.DEBUG)

def create_app():
    app = Flask(__name__,
                static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))

    app.config.from_object(Config)
    app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')

    # Validiere nur FLASK_SECRET_KEY
    if not os.environ.get('FLASK_SECRET_KEY'):
        print("WARNING: FLASK_SECRET_KEY nicht gesetzt, verwende dev-secret-key")

    CORS(app, origins=Config.CORS_ORIGINS)

    with app.app_context():
        init_db()
        ensure_sessions_dir()

    # Registriere Blueprints
    app.register_blueprint(monteur_bp)

    @app.route('/health')
    def health_check():
        return jsonify({
            "message": "Zeiterfassung System läuft!",
            "status": "healthy",
            "environment": os.environ.get('FLASK_ENV', 'production'),
            "git_commit_sha": os.environ.get('GIT_COMMIT_SHA', 'unknown')
        })

    # Auth Routes direkt implementiert
    @app.route('/api/auth/login', methods=['POST'])
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
                'redirect': '/dashboard' if user_data['role'] == 'Monteur' else '/buero'
            })
        
        return jsonify({'error': 'Ungültige Anmeldedaten'}), 401

    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        """Logout API - POST: Session löschen"""
        session.clear()
        session.modified = True
        
        return jsonify({'success': True, 'message': 'Erfolgreich abgemeldet'})

    @app.route('/api/auth/me', methods=['GET'])
    def me():
        """Current User API - GET: Aktueller Benutzer"""
        if 'user' not in session:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        return jsonify({
            'user': session['user'],
            'authenticated': True
        })

    # Static files
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:filename>')
    def static_files(filename):
        return send_from_directory(app.static_folder, filename)

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
