import os

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'azure_production_secret_key_2024')
    DEBUG = False
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_ORIGINS = [
        'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        'http://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        'https://localhost:3000',
        'http://localhost:3000'
    ]
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
