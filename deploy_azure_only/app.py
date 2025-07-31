#!/usr/bin/env python3
"""
Azure Production App für Zeiterfassung System
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app

if __name__ == '__main__':
    print("🚀 Azure Production - Zeiterfassung System wird gestartet...")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
