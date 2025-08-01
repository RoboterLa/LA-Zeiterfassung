from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import logging
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.config import Config
from backend.utils.db import init_db, ensure_sessions_dir
from backend.controllers.api import api_bp
from backend.controllers.auth import auth_bp

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)

print("🚀 Refactored App wird gestartet...")

def create_app():
    app = Flask(__name__, 
                static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))
    
    # Load configuration
    app.config.from_object(Config)
    
    # Set secret key
    app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')
    app.config['CLIENT_ID'] = os.environ.get('CLIENT_ID', 'default-client-id')
    app.config['CLIENT_SECRET'] = os.environ.get('CLIENT_SECRET', 'default-client-secret')
    
    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Initialize database
    with app.app_context():
        init_db()
        ensure_sessions_dir()
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            "message": "Zeiterfassung System läuft!",
            "status": "healthy"
        })
    
    # Serve static files with cache busting
    @app.route('/static/<path:filename>')
    def static_files(filename):
        response = send_from_directory(app.static_folder, filename)
        # Add cache busting headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    # Catch-all route for SPA
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # Don't serve index.html for API routes
        if path.startswith('api/') or path.startswith('auth/') or path == 'health':
            return "Not Found", 404
        
        # Serve index.html for all other routes (SPA routing)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 