from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import logging
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from config import Config
from utils.db import init_db, ensure_sessions_dir
from utils.monitoring import monitoring_service, AlertService
from utils.security import SecurityService, require_auth
from controllers.api import api_bp
from controllers.auth import auth_bp

# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

print("🚀 Enhanced App wird gestartet...")

def create_app():
    app = Flask(__name__, 
                static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))
    
    # Load configuration
    app.config.from_object(Config)
    
    # Set secret key and required environment variables
    app.secret_key = os.environ.get('FLASK_SECRET_KEY')
    app.config['CLIENT_ID'] = os.environ.get('CLIENT_ID')
    app.config['CLIENT_SECRET'] = os.environ.get('CLIENT_SECRET')
    
    # Validate required environment variables
    if not app.secret_key:
        raise ValueError("FLASK_SECRET_KEY muss gesetzt sein!")
    if not app.config['CLIENT_ID']:
        raise ValueError("CLIENT_ID muss gesetzt sein!")
    if not app.config['CLIENT_SECRET']:
        raise ValueError("CLIENT_SECRET muss gesetzt sein!")
    
    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Initialize database and services
    with app.app_context():
        init_db()
        ensure_sessions_dir()
        
        # Log startup
        logger.info("Application starting up...")
        SecurityService.generate_audit_log(None, 'app_startup', 'Application started')
    
    # Enhanced health check endpoint
    @app.route('/health')
    def health_check():
        try:
            # Run comprehensive health checks
            health_results = monitoring_service.run_health_checks()
            
            # Add application-specific info
            health_results.update({
                "message": "Zeiterfassung System läuft!",
                "environment": os.environ.get('FLASK_ENV', 'production'),
                "version": "1.0.0",
                "uptime": "TODO: Implement uptime tracking",
                "git_commit": os.environ.get('GIT_COMMIT_SHA', 'unknown'),
                "deployed_at": os.environ.get('DEPLOYED_AT', 'unknown')
            })
            
            # Send alert if health check fails
            if health_results['overall_status'] != 'healthy':
                AlertService.send_alert(
                    'health_check_failed',
                    f"Health check failed: {health_results['overall_status']}",
                    'critical' if health_results['overall_status'] == 'critical' else 'warning'
                )
            
            return jsonify(health_results)
            
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            AlertService.send_alert('health_check_error', str(e), 'critical')
            return jsonify({
                "message": "Health check error",
                "status": "error",
                "error": str(e)
            }), 500
    
    # Monitoring endpoints
    @app.route('/api/monitoring/alerts')
    @require_auth
    def get_alerts():
        """Holt aktive Alerts (nur für Admins)"""
        from utils.monitoring import AlertService
        alerts = AlertService.get_active_alerts()
        return jsonify({'alerts': alerts})
    
    @app.route('/api/monitoring/status')
    @require_auth
    def get_monitoring_status():
        """Holt Monitoring-Status"""
        return jsonify({
            'health_checks': len(monitoring_service.health_checks),
            'active_alerts': len(AlertService.get_active_alerts()),
            'last_check': datetime.now().isoformat()
        })
    
    # Security endpoints
    @app.route('/api/security/audit-logs')
    @require_auth
    def get_audit_logs():
        """Holt Audit-Logs (nur für Admins)"""
        from utils.db import get_db_connection
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM audit_logs 
            ORDER BY created_at DESC 
            LIMIT 100
        ''')
        
        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'audit_logs': logs})
    
    # Serve static files with cache busting
    @app.route('/static/<path:filename>')
    def static_files(filename):
        # Check if file exists in static folder
        static_path = os.path.join(app.static_folder, filename)
        if not os.path.exists(static_path):
            return "Not Found", 404
        
        response = send_from_directory(app.static_folder, filename)
        # Add cache busting headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    # Serve nested static files (static/static/)
    @app.route('/static/static/<path:filename>')
    def nested_static_files(filename):
        nested_static_folder = os.path.join(app.static_folder, 'static')
        static_path = os.path.join(nested_static_folder, filename)
        if not os.path.exists(static_path):
            return "Not Found", 404
        
        response = send_from_directory(nested_static_folder, filename)
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
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        AlertService.send_alert('internal_error', str(error), 'critical')
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
