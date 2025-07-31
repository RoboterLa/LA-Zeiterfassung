import os
from typing import List

class Config:
    """Flask-Konfiguration für die Zeiterfassung-App"""
    
    # Flask-Konfiguration
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # CORS-Konfiguration für React-Frontend
    CORS_ORIGINS: List[str] = [
        'http://localhost:3000',
        'https://localhost:3000', 
        'http://192.168.50.99:3000',
        'http://localhost:3001',
        'https://localhost:3001',
        'http://192.168.50.99:3001',
        'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        'http://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        '*'
    ]
    
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Datenbank-Konfiguration
    DATABASE_PATH = 'zeiterfassung.db'
    
    # Session-Konfiguration für Azure
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = '/tmp/sessions'
    
    # Test-User (später in Datenbank migrieren)
    TEST_USERS = {
        'monteur@test.com': {
            'password': 'test123',
            'name': 'Monteur Test',
            'role': 'Monteur'
        },
        'admin@test.com': {
            'password': 'test123',
            'name': 'Admin Test',
            'role': 'Admin'
        }
    } 