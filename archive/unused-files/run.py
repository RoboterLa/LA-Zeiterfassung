#!/usr/bin/env python3
"""
Start-Script für das refactored Backend
"""
import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    print("🚀 Starte refactored Backend...")
    app.run(debug=True, host='0.0.0.0', port=5001) 