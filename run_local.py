#!/usr/bin/env python3
"""
Lokale Entwicklungsumgebung für die Zeiterfassung-App
"""
import os
import sys

# Umgebungsvariablen für lokale Entwicklung setzen
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_DEBUG'] = '1'
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Erlaubt HTTP für lokale Entwicklung

print("🚀 Starte lokale Entwicklungsumgebung...")
print("📝 Hinweis: Für MS365 Login müssen Sie ngrok verwenden oder die App-ID in Azure anpassen")
print("🌐 App läuft auf: http://localhost:5002")
print("🔑 Login-URL: http://localhost:5002/login")
print("🔧 Dev-Login: http://localhost:5002/dev_login")
print("")

# App importieren und starten
from app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002) 