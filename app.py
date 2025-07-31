#!/usr/bin/env python3
"""
Haupt-App für Zeiterfassung System
Azure App Service B1 - Optimiert für Production
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import create_app

# App-Instanz erstellen
app = create_app()

# Statisches Frontend konfigurieren
app.static_folder = 'frontend/build'
app.static_url_path = ''

if __name__ == '__main__':
    print("🚀 Zeiterfassung System wird auf Azure App Service gestartet...")
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 80))) 