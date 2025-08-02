#!/usr/bin/env python3
"""
Haupt-App für Zeiterfassung System
Heroku Deployment - Optimiert für Production
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app

if __name__ == '__main__':
    app.run() 