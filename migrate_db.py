#!/usr/bin/env python3
"""
Datenbank-Migration für Zeiterfassung System
Erstellt alle Tabellen und fügt Test-Daten hinzu
"""

import os
import sys
from datetime import datetime, date
from sqlalchemy import create_engine, text

# Füge das Projektverzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, TimeEntry, ArbeitszeitErfassung, TimeReport, Auftrag, Arbeitszeit, Order, Elevator

def migrate_database():
    """Führe die Datenbank-Migration durch"""
    print("🚀 Starte Datenbank-Migration...")
    
    with app.app_context():
        # Erstelle alle Tabellen
        print("📋 Erstelle Tabellen...")
        db.create_all()
        print("✅ Tabellen erstellt")
        
        # Prüfe ob bereits Test-Daten vorhanden sind
        existing_users = User.query.count()
        if existing_users > 0:
            print(f"⚠️  {existing_users} User bereits vorhanden - überspringe Test-Daten")
            return
        
        # Erstelle Test-User
        print("👥 Erstelle Test-User...")
        test_users = [
            ('admin@lackner-aufzuege.com', 'System Administrator', 'Admin'),
            ('monteur@lackner-aufzuege.com', 'Max Monteur', 'Monteur'),
            ('supervisor@lackner-aufzuege.com', 'Anna Supervisor', 'Supervisor'),
            ('buero@lackner-aufzuege.com', 'Maria Büro', 'Buero')
        ]
        
        for email, name, role in test_users:
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
        
        # Erstelle Test-Aufzugsanlagen
        print("🏢 Erstelle Test-Aufzugsanlagen...")
        test_elevators = [
            {
                'manufacturer': 'Schindler',
                'model': '5500',
                'type': 'Passenger',
                'installation_date': date(2020, 1, 15),
                'location_address': 'Musterstraße 1, 80331 München',
                'components': '[{"name": "Tür", "install_date": "2020-01-15"}, {"name": "Antrieb", "install_date": "2020-01-15"}]'
            },
            {
                'manufacturer': 'Kone',
                'model': 'MonoSpace',
                'type': 'Passenger',
                'installation_date': date(2019, 6, 20),
                'location_address': 'Beispielweg 42, 80331 München',
                'components': '[{"name": "Tür", "install_date": "2019-06-20"}, {"name": "Antrieb", "install_date": "2019-06-20"}]'
            },
            {
                'manufacturer': 'Otis',
                'model': 'Gen2',
                'type': 'Freight',
                'installation_date': date(2021, 3, 10),
                'location_address': 'Industriepark 5, 80331 München',
                'components': '[{"name": "Tür", "install_date": "2021-03-10"}, {"name": "Antrieb", "install_date": "2021-03-10"}]'
            }
        ]
        
        for elevator_data in test_elevators:
            elevator = Elevator(**elevator_data)
            db.session.add(elevator)
        
        # Erstelle Test-Aufträge
        print("📋 Erstelle Test-Aufträge...")
        test_orders = [
            {
                'type': 'Wartung',
                'description': 'Regelmäßige Wartung der Aufzugsanlage',
                'assigned_user': 'monteur@lackner-aufzuege.com',
                'planned_start': datetime(2025, 7, 29, 9, 0),
                'planned_end': datetime(2025, 7, 29, 12, 0),
                'status': 'Open',
                'elevator_id': 1,
                'priority': 'Medium'
            },
            {
                'type': 'Reparatur',
                'description': 'Türschließer defekt - muss ausgetauscht werden',
                'assigned_user': 'monteur@lackner-aufzuege.com',
                'planned_start': datetime(2025, 7, 30, 8, 0),
                'planned_end': datetime(2025, 7, 30, 16, 0),
                'status': 'In Progress',
                'elevator_id': 2,
                'priority': 'High'
            },
            {
                'type': 'Modernisierung',
                'description': 'Komplette Modernisierung der Steuerung',
                'assigned_user': 'supervisor@lackner-aufzuege.com',
                'planned_start': datetime(2025, 8, 5, 7, 0),
                'planned_end': datetime(2025, 8, 7, 17, 0),
                'status': 'Open',
                'elevator_id': 3,
                'priority': 'High'
            }
        ]
        
        for order_data in test_orders:
            order = Order(**order_data)
            db.session.add(order)
        
        # Commit alle Änderungen
        db.session.commit()
        print("✅ Test-Daten erfolgreich erstellt")
        
        print("\n📊 Migration abgeschlossen!")
        print(f"   - {len(test_users)} Test-User erstellt")
        print(f"   - {len(test_elevators)} Test-Aufzugsanlagen erstellt")
        print(f"   - {len(test_orders)} Test-Aufträge erstellt")
        print("\n🔑 Test-Logins:")
        for email, name, role in test_users:
            print(f"   - {email} ({role})")

if __name__ == '__main__':
    migrate_database() 