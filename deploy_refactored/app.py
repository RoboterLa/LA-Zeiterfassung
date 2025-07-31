#!/usr/bin/env python3
"""
Haupt-App für Zeiterfassung System
Verwendet die refactored Backend-Struktur
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app

if __name__ == '__main__':
    print("🚀 Zeiterfassung System wird gestartet...")
    app.run(debug=True, host='0.0.0.0', port=5000) 