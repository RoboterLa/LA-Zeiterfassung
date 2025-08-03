#!/usr/bin/env python3
"""
Test-Script für Benutzer- und Rollenverwaltung
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models.user import UserService, UserRole
from backend.utils.db import init_db

def test_user_management():
    """Testet die Benutzerverwaltung"""
    print("🧪 Teste Benutzer- und Rollenverwaltung...")
    
    # Initialisiere Datenbank
    init_db()
    
    # Erstelle Demo-Benutzer
    users = UserService.create_demo_users()
    print(f"✅ {len(users)} Demo-Benutzer erstellt:")
    
    for user in users:
        print(f"  - {user.name} ({user.email}) - Rolle: {user.role.value}")
    
    # Teste Login
    print("\n🔐 Teste Login...")
    test_user = UserService.get_user_by_email("admin@test.com")
    if test_user and test_user.verify_password("admin123"):
        print("✅ Admin Login erfolgreich")
    else:
        print("❌ Admin Login fehlgeschlagen")
    
    # Teste Berechtigungen
    print("\n🔑 Teste Berechtigungen...")
    admin = UserService.get_user_by_email("admin@test.com")
    monteur = UserService.get_user_by_email("monteur1@test.com")
    
    if admin:
        print(f"✅ Admin hat user_management: {admin.has_permission('user_management')}")
        print(f"✅ Admin hat time_entry: {admin.has_permission('time_entry')}")
    
    if monteur:
        print(f"✅ Monteur hat time_entry: {monteur.has_permission('time_entry')}")
        print(f"❌ Monteur hat user_management: {monteur.has_permission('user_management')}")
    
    # Teste Rollen
    print("\n👥 Verfügbare Rollen:")
    for role in UserRole:
        print(f"  - {role.value}")
    
    print("\n✅ Benutzer- und Rollenverwaltung Test abgeschlossen!")

if __name__ == "__main__":
    test_user_management()
