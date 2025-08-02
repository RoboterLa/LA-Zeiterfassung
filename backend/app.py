from flask import Flask, send_from_directory, jsonify, make_response
from flask_cors import CORS
import os
import logging
from utils.db import init_database, setup_demo_users
from controllers.auth import auth_bp
from controllers.api import api_bp

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("🚀 Zeiterfassung System wird gestartet...")

def create_app():
    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')

    # Error-Handling für kritische Umgebungsvariablen
    try:
        app.config['SECRET_KEY'] = os.environ['FLASK_SECRET_KEY']
    except KeyError:
        raise ValueError("FLASK_SECRET_KEY not set - required for production")
    
    app.config['CLIENT_ID'] = os.environ.get('CLIENT_ID', 'dev-client-id')
    app.config['CLIENT_SECRET'] = os.environ.get('CLIENT_SECRET', 'dev-client-secret')

    CORS(app, origins=['*'])

    with app.app_context():
        try:
            init_database()
            logger.info("Database initialized successfully")
            setup_demo_users()
            logger.info("Demo users setup completed")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    @app.route('/health')
    def health_check():
        return jsonify({
            "message": "Zeiterfassung System läuft!",
            "status": "healthy",
            "version": "v2.0",
            "database": "connected"
        })

    @app.route('/api/status')
    def api_status():
        return jsonify({
            "status": "API läuft",
            "endpoints": {
                "auth": "/api/auth",
                "timeclock": "/api/timeclock",
                "reports": "/api/reports"
            }
        })

    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 