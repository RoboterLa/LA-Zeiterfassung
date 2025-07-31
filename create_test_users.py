#!/usr/bin/env python3
"""
Test-User Erstellung für Zeiterfassung System
Erstellt Büro, Admin, Monteur 1 und Monteur 2
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User

def create_test_users():
    """Erstellt die gewünschten Test-User"""
    print("🚀 Erstelle Test-User...")
    
    with app.app_context():
        # Test-User definieren
        test_users = [
            {
                'email': 'buero@lackner-aufzuege.com',
                'name': 'Maria Büro',
                'role': 'Buero',
                'description': 'Büro-Interface für Auftrags- und Stammdatenverwaltung'
            },
            {
                'email': 'admin@lackner-aufzuege.com',
                'name': 'System Administrator',
                'role': 'Admin',
                'description': 'Vollzugriff auf alle Funktionen'
            },
            {
                'email': 'monteur1@lackner-aufzuege.com',
                'name': 'Max Monteur',
                'role': 'Monteur',
                'description': 'Basis-Zugriff für Monteure'
            },
            {
                'email': 'monteur2@lackner-aufzuege.com',
                'name': 'Anna Monteur',
                'role': 'Monteur',
                'description': 'Basis-Zugriff für Monteure'
            }
        ]
        
        created_users = []
        updated_users = []
        
        for user_data in test_users:
            email = user_data['email']
            name = user_data['name']
            role = user_data['role']
            description = user_data['description']
            
            # Prüfen ob User bereits existiert
            existing_user = User.query.filter_by(email=email).first()
            
            if existing_user:
                # User existiert - Update falls nötig
                if existing_user.role != role or existing_user.name != name:
                    existing_user.name = name
                    existing_user.role = role
                    existing_user.is_admin = (role == 'Admin')
                    existing_user.can_approve = (role in ['Supervisor', 'Admin'])
                    existing_user.is_active = True
                    db.session.commit()
                    updated_users.append(user_data)
                    print(f"🔄 User aktualisiert: {name} ({role})")
                else:
                    print(f"ℹ️  User bereits vorhanden: {name} ({role})")
            else:
                # Neuen User erstellen
                user = User(
                    email=email,
                    name=name,
                    role=role,
                    is_admin=(role == 'Admin'),
                    can_approve=(role in ['Supervisor', 'Admin']),
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.session.add(user)
                created_users.append(user_data)
                print(f"✅ User erstellt: {name} ({role})")
        
        # Änderungen speichern
        db.session.commit()
        
        print(f"\n📊 Zusammenfassung:")
        print(f"   - {len(created_users)} neue User erstellt")
        print(f"   - {len(updated_users)} User aktualisiert")
        print(f"   - {len(test_users)} User insgesamt")
        
        print(f"\n🔑 Test-Logins:")
        for user_data in test_users:
            print(f"   - {user_data['email']} ({user_data['role']}) - {user_data['description']}")
        
        print(f"\n🌐 Zugriff:")
        print(f"   - Büro-Interface: http://localhost:3000/buero")
        print(f"   - Admin-Bereich: http://localhost:3000/admin")
        print(f"   - Monteur-Dashboard: http://localhost:3000")
        
        return True

def main():
    """Hauptfunktion"""
    print("🔧 Test-User Erstellung gestartet")
    
    try:
        create_test_users()
        print("\n✅ Test-User Erstellung erfolgreich abgeschlossen!")
        
    except Exception as e:
        print(f"❌ Fehler: {e}")
        return False
    
    return True

if __name__ == '__main__':
    main() 