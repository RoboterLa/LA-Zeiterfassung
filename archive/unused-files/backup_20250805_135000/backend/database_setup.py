import sqlite3
import os
from datetime import datetime, timedelta

def create_database():
    """Erstellt die SQLite-Datenbank mit allen Tabellen und Testdaten"""
    
    # Datenbank-Datei erstellen
    db_path = 'zeiterfassung.db'
    
    # Alte Datenbank löschen falls vorhanden
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Users Tabelle
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Time Entries Tabelle
    cursor.execute('''
        CREATE TABLE time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            clock_in TIMESTAMP,
            clock_out TIMESTAMP,
            break_start TIMESTAMP,
            break_end TIMESTAMP,
            location TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Work Breaks Tabelle
    cursor.execute('''
        CREATE TABLE work_breaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            break_start TIMESTAMP,
            break_end TIMESTAMP,
            break_type TEXT DEFAULT 'pause',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Orders Tabelle
    cursor.execute('''
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            customer TEXT,
            location TEXT,
            order_type TEXT,
            priority TEXT,
            status TEXT,
            assigned_to INTEGER,
            created_date DATE,
            due_date DATE,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            coordinates TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users (id)
        )
    ''')
    
    # Emergencies Tabelle
    cursor.execute('''
        CREATE TABLE emergencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            location TEXT,
            priority TEXT,
            status TEXT,
            assigned_to INTEGER,
            reported_at TIMESTAMP,
            resolved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users (id)
        )
    ''')
    
    # Customers Tabelle
    cursor.execute('''
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Vacation Requests Tabelle
    cursor.execute('''
        CREATE TABLE vacation_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_date DATE,
            end_date DATE,
            request_type TEXT DEFAULT 'vacation',
            status TEXT DEFAULT 'pending',
            notes TEXT,
            approved_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (approved_by) REFERENCES users (id)
        )
    ''')
    
    # Work Events Tabelle
    cursor.execute('''
        CREATE TABLE work_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_type TEXT,
            description TEXT,
            location TEXT,
            event_date DATE,
            start_time TIME,
            end_time TIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Testdaten einfügen
    # Users
    cursor.execute('''
        INSERT INTO users (email, password, name, role, phone, address) VALUES 
        ('monteur', 'monteur', 'Max Mustermann', 'monteur', '+49 89 123456', 'München'),
        ('buero', 'buero', 'Anna Schmidt', 'buero', '+49 89 654321', 'München')
    ''')
    
    # Time Entries für Monteur
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    cursor.execute('''
        INSERT INTO time_entries (user_id, clock_in, clock_out, location, notes) VALUES 
        (1, ?, ?, 'Hauptstraße 15, München', 'Wartung Aufzug'),
        (1, ?, NULL, 'Marienplatz 1, München', 'Reparatur')
    ''', (
        f'{yesterday} 08:00:00',
        f'{yesterday} 17:00:00',
        f'{today} 07:30:00'
    ))
    
    # Work Breaks
    cursor.execute('''
        INSERT INTO work_breaks (user_id, break_start, break_end, break_type, notes) VALUES 
        (1, ?, ?, 'pause', 'Mittagspause'),
        (1, ?, ?, 'pause', 'Kaffeepause')
    ''', (
        f'{today} 12:00:00',
        f'{today} 12:30:00',
        f'{today} 15:00:00',
        f'{today} 15:15:00'
    ))
    
    # Orders
    cursor.execute('''
        INSERT INTO orders (title, description, customer, location, order_type, priority, status, assigned_to, created_date, due_date, coordinates) VALUES 
        ('Wartung Aufzug Hauptstraße 15', 'Regelmäßige Wartung des Aufzugs', 'Gebäudeverwaltung München', 'Hauptstraße 15, München', 'maintenance', 'normal', 'assigned', 1, ?, ?, '48.1351,11.5820'),
        ('Reparatur Aufzug Marienplatz', 'Dringende Reparatur des stecken gebliebenen Aufzugs', 'Stadt München', 'Marienplatz 1, München', 'repair', 'urgent', 'in_progress', 1, ?, ?, '48.1374,11.5755'),
        ('Installation neuer Aufzug', 'Installation eines neuen Aufzugs im Bürogebäude', 'Bauprojekt GmbH', 'Neubau Zentrum, München', 'installation', 'high', 'pending', NULL, ?, ?, '48.1400,11.5800')
    ''', (
        f'{today - timedelta(days=5)}',
        f'{today + timedelta(days=5)}',
        f'{today - timedelta(days=6)}',
        f'{today + timedelta(days=3)}',
        f'{today - timedelta(days=10)}',
        f'{today + timedelta(days=30)}'
    ))
    
    # Emergencies
    cursor.execute('''
        INSERT INTO emergencies (title, description, location, priority, status, assigned_to, reported_at) VALUES 
        ('Aufzug steckt fest', 'Aufzug ist stecken geblieben, Passagiere sind eingeschlossen', 'Marienplatz 1, München', 'urgent', 'active', 1, ?),
        ('Aufzug funktioniert nicht', 'Aufzug reagiert nicht auf Knopfdruck', 'Hauptstraße 15, München', 'high', 'active', NULL, ?)
    ''', (
        f'{today} 10:30:00',
        f'{today} 14:15:00'
    ))
    
    # Customers
    cursor.execute('''
        INSERT INTO customers (name, contact_person, email, phone, address) VALUES 
        ('Gebäudeverwaltung München', 'Max Mustermann', 'max@gebaeude-muenchen.de', '+49 89 123456', 'Hauptstraße 15, 80331 München'),
        ('Stadt München', 'Anna Schmidt', 'anna.schmidt@muenchen.de', '+49 89 654321', 'Marienplatz 1, 80331 München'),
        ('Bauprojekt GmbH', 'Tom Weber', 'tom.weber@bauprojekt.de', '+49 89 789123', 'Neubau Zentrum, 80331 München')
    ''')
    
    # Vacation Requests
    cursor.execute('''
        INSERT INTO vacation_requests (user_id, start_date, end_date, request_type, status, notes) VALUES 
        (1, ?, ?, 'vacation', 'pending', 'Sommerurlaub'),
        (1, ?, ?, 'sick', 'approved', 'Krankheit')
    ''', (
        f'{today + timedelta(days=30)}',
        f'{today + timedelta(days=37)}',
        f'{today - timedelta(days=5)}',
        f'{today - timedelta(days=3)}'
    ))
    
    # Work Events
    cursor.execute('''
        INSERT INTO work_events (user_id, event_type, description, location, event_date, start_time, end_time) VALUES 
        (1, 'maintenance', 'Wartung Aufzug Hauptstraße 15', 'Hauptstraße 15, München', ?, '08:00', '12:00'),
        (1, 'repair', 'Reparatur Aufzug Marienplatz', 'Marienplatz 1, München', ?, '13:00', '17:00')
    ''', (
        f'{today}',
        f'{today}'
    ))
    
    conn.commit()
    conn.close()
    
    print("✅ Datenbank erfolgreich erstellt!")
    print("📊 Tabellen: users, time_entries, work_breaks, orders, emergencies, customers, vacation_requests, work_events")
    print("👥 Testbenutzer: monteur/monteur, buero/buero")
    print("🔧 CRUD-Operationen verfügbar für alle Tabellen")

if __name__ == '__main__':
    create_database() 