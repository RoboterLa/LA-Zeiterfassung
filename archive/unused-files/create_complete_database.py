#!/usr/bin/env python3
"""
Vollständige Datenbank-Erstellung mit allen Tabellen und Test-Daten
"""
import os
import sys
from datetime import datetime, timedelta
import hashlib

# Backend-Pfad hinzufügen
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models.database import engine, SessionLocal
from backend.models.models import Base, User, TimeEntry, VacationRequest, SickLeave, Order, DailyReport, Notification, WorkSchedule

def create_database():
    """Datenbank mit allen Tabellen erstellen"""
    print("🗄️  Erstelle Datenbank mit allen Tabellen...")
    
    # Alle Tabellen erstellen
    Base.metadata.create_all(bind=engine)
    print("✅ Tabellen erstellt")
    
    # Datenbank-Session
    db = SessionLocal()
    
    try:
        # Test-Benutzer erstellen
        print("👥 Erstelle Test-Benutzer...")
        
        # Passwörter hashen
        test_users = [
            {
                'email': 'monteur',
                'name': 'Max Mustermann',
                'role': 'Monteur',
                'password': 'monteur123'
            },
            {
                'email': 'admin',
                'name': 'Admin User',
                'role': 'Admin',
                'password': 'admin123'
            },
            {
                'email': 'buero',
                'name': 'Büro User',
                'role': 'Büro',
                'password': 'buero123'
            },
            {
                'email': 'lohn',
                'name': 'Lohn User',
                'role': 'Lohn',
                'password': 'lohn123'
            }
        ]
        
        for user_data in test_users:
            # Prüfen ob Benutzer bereits existiert
            existing_user = db.query(User).filter(User.email == user_data['email']).first()
            if not existing_user:
                # Passwort hashen mit gleichem Salt wie im Auth-Controller
                salt = "zeiterfassung_salt_2024"
                password_hash = hashlib.sha256((user_data['password'] + salt).encode()).hexdigest()
                
                user = User(
                    email=user_data['email'],
                    name=user_data['name'],
                    role=user_data['role'],
                    password_hash=password_hash,
                    is_active=True
                )
                db.add(user)
                print(f"✅ Benutzer erstellt: {user_data['email']}")
            else:
                print(f"ℹ️  Benutzer existiert bereits: {user_data['email']}")
        
        db.commit()
        
        # Test-Zeiteinträge für Monteur erstellen
        print("⏰ Erstelle Test-Zeiteinträge...")
        monteur = db.query(User).filter(User.email == 'monteur').first()
        
        if monteur:
            # Letzte 7 Tage Zeiteinträge
            for i in range(7):
                date = datetime.now() - timedelta(days=i)
                date_str = date.strftime('%Y-%m-%d')
                
                # Prüfen ob Eintrag bereits existiert
                existing_entry = db.query(TimeEntry).filter(
                    TimeEntry.user_id == monteur.id,
                    TimeEntry.date == date_str
                ).first()
                
                if not existing_entry:
                    # 8 Stunden Arbeitstag
                    clock_in = "08:00:00"
                    clock_out = "16:00:00"
                    break_start = "12:00:00"
                    break_end = "12:30:00"
                    
                    time_entry = TimeEntry(
                        user_id=monteur.id,
                        date=date_str,
                        clock_in=clock_in,
                        clock_out=clock_out,
                        break_start=break_start,
                        break_end=break_end,
                        total_hours=7.5,  # 8h - 30min Pause
                        regular_hours=7.5,
                        overtime_hours=0.0,
                        status='completed',
                        note=f'Test-Eintrag für {date_str}'
                    )
                    db.add(time_entry)
                    print(f"✅ Zeiteintrag erstellt: {date_str}")
        
        # Test-Urlaubsanträge
        print("🏖️  Erstelle Test-Urlaubsanträge...")
        if monteur:
            vacation_request = VacationRequest(
                user_id=monteur.id,
                start_date='2024-08-15',
                end_date='2024-08-20',
                reason='Sommerurlaub',
                is_half_day=False,
                comment='Familienurlaub in den Bergen',
                status='pending'
            )
            db.add(vacation_request)
            print("✅ Urlaubsantrag erstellt")
        
        # Test-Aufträge
        print("📋 Erstelle Test-Aufträge...")
        if monteur:
            orders = [
                {
                    'name': 'Wartung Aufzug Hauptbahnhof',
                    'address': 'Bahnhofplatz 2, 80335 München',
                    'factory_number': 'LA-2024-001',
                    'priority': 'high'
                },
                {
                    'name': 'Reparatur Aufzug Kaufhof',
                    'address': 'Kaufingerstraße 1, 80331 München',
                    'factory_number': 'LA-2024-002',
                    'priority': 'normal'
                }
            ]
            
            for order_data in orders:
                order = Order(
                    user_id=monteur.id,
                    name=order_data['name'],
                    address=order_data['address'],
                    factory_number=order_data['factory_number'],
                    status='active',
                    priority=order_data['priority']
                )
                db.add(order)
                print(f"✅ Auftrag erstellt: {order_data['name']}")
        
        # Test-Tagesberichte
        print("📝 Erstelle Test-Tagesberichte...")
        if monteur:
            daily_report = DailyReport(
                user_id=monteur.id,
                date=datetime.now().strftime('%Y-%m-%d'),
                location='Hauptbahnhof München',
                factory_number='LA-2024-001',
                activity='Wartung',
                performance_unit=8.0,
                emergency_service=False,
                order_number='ORD-2024-001',
                free_text='Regelmäßige Wartung durchgeführt. Alle Systeme funktionieren einwandfrei.',
                status='pending'
            )
            db.add(daily_report)
            print("✅ Tagesbericht erstellt")
        
        db.commit()
        print("✅ Alle Test-Daten erstellt")
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen der Datenbank: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("🎉 Datenbank erfolgreich erstellt!")
    print("\n📋 Test-Accounts:")
    print("  Monteur: monteur / monteur123")
    print("  Admin: admin / admin123")
    print("  Büro: buero / buero123")
    print("  Lohn: lohn / lohn123")

if __name__ == '__main__':
    create_database()
