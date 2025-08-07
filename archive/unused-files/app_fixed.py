from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.controllers.auth import auth_bp
from backend.controllers.monteur_api import monteur_bp
from backend.models.database import Base, engine
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # CORS konfigurieren
    CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:8080'])
    
    # Blueprints registrieren
    app.register_blueprint(auth_bp)
    app.register_blueprint(monteur_bp)
    
    # Datenbank initialisieren
    Base.metadata.create_all(bind=engine)
    
    # Static files für React App
    @app.route('/')
    def serve_react_app():
        return send_from_directory('static', 'index.html')
    
    @app.route('/static/<path:path>')
    def serve_static(path):
        return send_from_directory('static', path)
    
    @app.route('/<path:path>')
    def serve_react_routes(path):
        return send_from_directory('static', 'index.html')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'zeiterfassung-app'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=8080)
