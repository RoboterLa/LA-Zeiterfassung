from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import logging
from backend.config import Config
from backend.utils.db import init_db, ensure_sessions_dir
from backend.controllers.api import api_bp
from backend.controllers.auth import auth_bp

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)

print("🚀 Refactored App wird gestartet...")

def create_app() -> Flask:
    """Flask-App Factory"""
    # Korrekte Pfade für Heroku Deployment
    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    
    # Konfiguration
    app.config.from_object(Config)
    
    # Session-Konfiguration
    ensure_sessions_dir()
    
    # CORS für React-Frontend
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # Blueprints registrieren
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Database initialisieren
    init_db()
    
    # Root-Route für React-App - Alle Frontend-Routen an React weiterleiten
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # API-Routen an Backend weiterleiten
        if path.startswith('api/') or path.startswith('auth/') or path == 'health':
            return {'error': 'API route not found'}, 404
        
        # Statische Dateien direkt servieren
        if path != "" and os.path.exists(app.static_folder + '/' + path):
            return send_from_directory(app.static_folder, path)
        else:
            # Alle anderen Routen an React-App weiterleiten
            return send_from_directory(app.static_folder, 'index.html')
    
    # Health Check
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'message': 'Zeiterfassung System läuft!'}
    
    print("✅ Flask-App erfolgreich konfiguriert")
    return app

# App-Instanz für direkten Import
app = create_app()

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5001) 