import os

class Config:
    """Flask Configuration"""
    
    # Basic Flask Config
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')
    DEBUG = False
    
    # Database
    DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'zeiterfassung.db')
    
    # CORS
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net"
    ]
    
    # Session Config
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sessions')
    
    # Test Users (erweitert für Frontend-Kompatibilität)
    TEST_USERS = {
        'admin@test.com': {
            'password': 'test123',
            'name': 'Admin Test',
            'role': 'Admin'
        },
        'monteur@test.com': {
            'password': 'test123',
            'name': 'Monteur Test',
            'role': 'Monteur'
        },
        # Frontend-kompatible Versionen
        'admin': {
            'password': 'admin123',
            'name': 'Administrator',
            'role': 'Admin'
        },
        'monteur': {
            'password': 'monteur123',
            'name': 'Monteur',
            'role': 'Monteur'
        },
        'buero': {
            'password': 'buero123',
            'name': 'Büroangestellte',
            'role': 'Büroangestellte'
        },
        'lohn': {
            'password': 'lohn123',
            'name': 'Lohnbuchhalter',
            'role': 'Lohnbuchhalter'
        }
    }
