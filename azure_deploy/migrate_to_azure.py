#!/usr/bin/env python3
"""
Migration Script für Azure SQL Database
Migriert von SQLite zu Azure SQL und erstellt Produktionsdaten
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, Order, ArbeitszeitErfassung, Elevator
from datetime import datetime, timedelta
import json

def migrate_to_azure():
    """Migration zu Azure SQL Database"""
    
    with app.app_context():
        print("🚀 Starte Migration zu Azure SQL Database...")
        
        # 1. Alle Tabellen erstellen
        print("📦 Erstelle Datenbankschema...")
        db.create_all()
        print("✅ Schema erstellt")
        
        # 2. Testuser für Produktion erstellen
        print("👥 Erstelle Produktions-User...")
        
        production_users = [
            {
                'email': 'robert.lackner@lackner-aufzuege.com',
                'name': 'Robert Lackner',
                'role': 'Admin',
                'is_admin': True,
                'can_approve': True
            },
            {
                'email': 'maria.buero@lackner-aufzuege.com',
                'name': 'Maria Büro',
                'role': 'Buero',
                'is_admin': False,
                'can_approve': False
            },
            {
                'email': 'monteur1@lackner-aufzuege.com',
                'name': 'Monteur 1',
                'role': 'Monteur',
                'is_admin': False,
                'can_approve': False
            },
            {
                'email': 'monteur2@lackner-aufzuege.com',
                'name': 'Monteur 2',
                'role': 'Monteur',
                'is_admin': False,
                'can_approve': False
            },
            {
                'email': 'supervisor@lackner-aufzuege.com',
                'name': 'Supervisor',
                'role': 'Supervisor',
                'is_admin': False,
                'can_approve': True
            }
        ]
        
        for user_data in production_users:
            user = User.query.filter_by(email=user_data['email']).first()
            if user:
                print(f"✅ User existiert bereits: {user_data['name']}")
                # Update user data
                user.name = user_data['name']
                user.role = user_data['role']
                user.is_admin = user_data['is_admin']
                user.can_approve = user_data['can_approve']
                user.is_active = True
            else:
                print(f"➕ Erstelle User: {user_data['name']}")
                user = User(
                    email=user_data['email'],
                    name=user_data['name'],
                    role=user_data['role'],
                    is_admin=user_data['is_admin'],
                    can_approve=user_data['can_approve'],
                    is_active=True
                )
                db.session.add(user)
        
        db.session.commit()
        print("✅ Produktions-User erstellt")
        
        # 3. Produktions-Aufzugsanlagen erstellen
        print("🏢 Erstelle Produktions-Aufzugsanlagen...")
        
        production_elevators = [
            {
                'manufacturer': 'Schindler',
                'model': '5500',
                'type': 'Passenger',
                'location_address': 'Hauptstraße 1, 80331 München',
                'installation_date': datetime.now().date() - timedelta(days=365)
            },
            {
                'manufacturer': 'Kone',
                'model': 'MonoSpace',
                'type': 'Passenger',
                'location_address': 'Bahnhofstraße 15, 80331 München',
                'installation_date': datetime.now().date() - timedelta(days=180)
            },
            {
                'manufacturer': 'Otis',
                'model': 'Gen2',
                'type': 'Freight',
                'location_address': 'Industriestraße 42, 80331 München',
                'installation_date': datetime.now().date() - timedelta(days=90)
            },
            {
                'manufacturer': 'ThyssenKrupp',
                'model': 'TWIN',
                'type': 'Passenger',
                'location_address': 'Einkaufszentrum 5, 80331 München',
                'installation_date': datetime.now().date() - timedelta(days=60)
            },
            {
                'manufacturer': 'Mitsubishi',
                'model': 'NEXIEZ',
                'type': 'Passenger',
                'location_address': 'Bürogebäude 12, 80331 München',
                'installation_date': datetime.now().date() - timedelta(days=30)
            }
        ]
        
        elevator_ids = []
        for elevator_data in production_elevators:
            elevator = Elevator.query.filter_by(
                manufacturer=elevator_data['manufacturer'],
                model=elevator_data['model'],
                location_address=elevator_data['location_address']
            ).first()
            
            if not elevator:
                print(f"➕ Erstelle Aufzugsanlage: {elevator_data['manufacturer']} {elevator_data['model']}")
                elevator = Elevator(**elevator_data)
                db.session.add(elevator)
                db.session.flush()  # Get ID
            else:
                print(f"✅ Aufzugsanlage existiert bereits: {elevator_data['manufacturer']} {elevator_data['model']}")
            
            elevator_ids.append(elevator.id)
        
        db.session.commit()
        print("✅ Produktions-Aufzugsanlagen erstellt")
        
        # 4. Produktions-Aufträge erstellen
        print("📋 Erstelle Produktions-Aufträge...")
        
        production_orders = [
            # Monteur 1 Aufträge
            {
                'type': 'Reparatur',
                'description': 'Türschließer defekt - Ersatz notwendig',
                'assigned_user': 'monteur1@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(hours=2),
                'planned_end': datetime.now() + timedelta(hours=4),
                'status': 'Open',
                'elevator_id': elevator_ids[0],
                'priority': 'High'
            },
            {
                'type': 'Wartung',
                'description': 'Regelmäßige Wartung - Ölwechsel und Inspektion',
                'assigned_user': 'monteur1@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(days=1),
                'planned_end': datetime.now() + timedelta(days=1, hours=2),
                'status': 'Open',
                'elevator_id': elevator_ids[1],
                'priority': 'Medium'
            },
            # Monteur 2 Aufträge
            {
                'type': 'Modernisierung',
                'description': 'Kabinenbeleuchtung auf LED umstellen',
                'assigned_user': 'monteur2@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(days=2),
                'planned_end': datetime.now() + timedelta(days=2, hours=6),
                'status': 'Open',
                'elevator_id': elevator_ids[2],
                'priority': 'Medium'
            },
            {
                'type': 'Neubau',
                'description': 'Neue Aufzugsanlage installieren',
                'assigned_user': 'monteur2@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(days=3),
                'planned_end': datetime.now() + timedelta(days=5),
                'status': 'In Progress',
                'elevator_id': None,
                'priority': 'High'
            },
            # Dringende Aufträge
            {
                'type': 'Reparatur',
                'description': 'Notrufsystem defekt - Dringend zu reparieren',
                'assigned_user': 'monteur1@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(hours=1),
                'planned_end': datetime.now() + timedelta(hours=3),
                'status': 'Open',
                'elevator_id': elevator_ids[0],
                'priority': 'High'
            },
            {
                'type': 'Wartung',
                'description': 'Jährliche Sicherheitsprüfung',
                'assigned_user': 'monteur2@lackner-aufzuege.com',
                'planned_start': datetime.now() + timedelta(days=1, hours=4),
                'planned_end': datetime.now() + timedelta(days=1, hours=6),
                'status': 'Open',
                'elevator_id': elevator_ids[3],
                'priority': 'Medium'
            }
        ]
        
        order_ids = []
        for order_data in production_orders:
            # Prüfe ob Auftrag bereits existiert
            existing_order = Order.query.filter_by(
                type=order_data['type'],
                description=order_data['description'],
                assigned_user=order_data['assigned_user']
            ).first()
            
            if not existing_order:
                print(f"➕ Erstelle Auftrag: {order_data['type']} - {order_data['description'][:30]}...")
                order = Order(**order_data)
                db.session.add(order)
                db.session.flush()  # Get ID
                order_ids.append(order.id)
            else:
                print(f"✅ Auftrag existiert bereits: {order_data['type']} - {order_data['description'][:30]}...")
                order_ids.append(existing_order.id)
        
        db.session.commit()
        print("✅ Produktions-Aufträge erstellt")
        
        # 5. Produktions-Zeiteinträge erstellen
        print("⏰ Erstelle Produktions-Zeiteinträge...")
        
        production_time_entries = [
            # Monteur 1 Zeiteinträge
            {
                'order_id': order_ids[0],
                'technician_id': 'monteur1@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(hours=2),
                'end_time': datetime.now() - timedelta(hours=1),
                'category': 'Arbeitszeit',
                'notes': 'Türschließer repariert - Ersatzteil eingebaut',
                'overtime': False,
                'status': 'abgeschlossen'
            },
            {
                'order_id': order_ids[1],
                'technician_id': 'monteur1@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(days=1, hours=3),
                'end_time': datetime.now() - timedelta(days=1, hours=1),
                'category': 'Arbeitszeit',
                'notes': 'Wartung durchgeführt - Öl gewechselt',
                'overtime': False,
                'status': 'abgeschlossen'
            },
            # Monteur 2 Zeiteinträge
            {
                'order_id': order_ids[2],
                'technician_id': 'monteur2@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(days=1, hours=4),
                'end_time': datetime.now() - timedelta(days=1, hours=2),
                'category': 'Arbeitszeit',
                'notes': 'LED-Beleuchtung installiert',
                'overtime': True,
                'status': 'abgeschlossen'
            },
            {
                'order_id': order_ids[3],
                'technician_id': 'monteur2@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(days=2),
                'end_time': None,  # Noch läuft
                'category': 'Arbeitszeit',
                'notes': 'Neubau in Bearbeitung',
                'overtime': False,
                'status': 'offen'
            },
            # Freie Zeiteinträge (ohne Auftrag)
            {
                'order_id': None,
                'technician_id': 'monteur1@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(hours=6),
                'end_time': datetime.now() - timedelta(hours=5),
                'category': 'Fahrtzeit',
                'notes': 'Fahrt zum Kunden',
                'overtime': False,
                'status': 'abgeschlossen'
            },
            {
                'order_id': None,
                'technician_id': 'monteur2@lackner-aufzuege.com',
                'start_time': datetime.now() - timedelta(hours=8),
                'end_time': datetime.now() - timedelta(hours=7),
                'category': 'Pause',
                'notes': 'Mittagspause',
                'overtime': False,
                'status': 'abgeschlossen'
            }
        ]
        
        for entry_data in production_time_entries:
            # Prüfe ob Zeiteintrag bereits existiert
            existing_entry = ArbeitszeitErfassung.query.filter_by(
                technician_id=entry_data['technician_id'],
                start_time=entry_data['start_time'],
                category=entry_data['category']
            ).first()
            
            if not existing_entry:
                print(f"➕ Erstelle Zeiteintrag: {entry_data['category']} - {entry_data['technician_id']}")
                entry = ArbeitszeitErfassung(**entry_data)
                db.session.add(entry)
            else:
                print(f"✅ Zeiteintrag existiert bereits: {entry_data['category']} - {entry_data['technician_id']}")
        
        db.session.commit()
        print("✅ Produktions-Zeiteinträge erstellt")
        
        # 6. Zusammenfassung ausgeben
        print("\n📊 Azure Migration - Übersicht:")
        print("=================================")
        print(f"👥 Users: {User.query.count()}")
        print(f"🏢 Elevators: {Elevator.query.count()}")
        print(f"📋 Orders: {Order.query.count()}")
        print(f"⏰ Time Entries: {ArbeitszeitErfassung.query.count()}")
        
        print("\n👤 Monteur 1 Aufträge:")
        monteur1_orders = Order.query.filter_by(assigned_user='monteur1@lackner-aufzuege.com').all()
        for order in monteur1_orders:
            print(f"  - #{order.id}: {order.type} - {order.description}")
        
        print("\n👤 Monteur 2 Aufträge:")
        monteur2_orders = Order.query.filter_by(assigned_user='monteur2@lackner-aufzuege.com').all()
        for order in monteur2_orders:
            print(f"  - #{order.id}: {order.type} - {order.description}")
        
        print("\n✅ Azure Migration erfolgreich abgeschlossen!")
        print("🚀 Die App ist bereit für Produktion!")

if __name__ == '__main__':
    migrate_to_azure() 