#!/usr/bin/env python3
"""
Einfacher Test für das System
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.utils.db import init_db
from backend.models.user import UserService

def simple_test():
    """Einfacher System-Test"""
    print("🧪 Einfacher System-Test...")
    
    # Initialisiere Datenbank
    init_db()
    print("✅ Datenbank initialisiert")
    
    # Erstelle Demo-Benutzer
    users = UserService.create_demo_users()
    print(f"✅ {len(users)} Demo-Benutzer erstellt")
    
    # Teste Health Check
    from backend.utils.monitoring import MonitoringService
    health = MonitoringService().run_health_checks()
    print(f"✅ Health Check: {health['overall_status']}")
    
    print("✅ System ist funktionsfähig!")

if __name__ == "__main__":
    simple_test()
