from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import logging
from config import Config
from utils.db import init_db, ensure_sessions_dir
from controllers.api import api_bp
from controllers.auth import auth_bp

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)

print("🚀 Refactored App wird gestartet...")

def create_app() -> Flask:
    """Flask-App Factory"""
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    
    # Konfiguration
    app.config.from_object(Config)
    
    # Session-Konfiguration
    ensure_sessions_dir()
    
    # CORS für React-Frontend
    CORS(app, 
         supports_credentials=Config.CORS_SUPPORTS_CREDENTIALS,
         origins=Config.CORS_ORIGINS,
         allow_headers=Config.CORS_ALLOW_HEADERS,
         methods=Config.CORS_METHODS)
    
    # Blueprints registrieren
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    
    # Datenbank initialisieren
    with app.app_context():
        init_db()
    
    # React-Routes (Single Page Application)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        """Serve React-App für alle Frontend-Routes"""
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    # Health Check
    @app.route('/health')
    def health():
        """Health Check Endpoint"""
        return {'status': 'healthy', 'version': '1.0.0'}
    
    return app

# App-Instanz für direkten Import
app = create_app()

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5001) 