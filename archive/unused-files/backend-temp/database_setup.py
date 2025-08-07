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
    
    # Testdaten einfügen
    # Users
    cursor.execute('''
        INSERT INTO users (email, password, name, role) VALUES 
        ('monteur', 'monteur', 'Monteur', 'monteur'),
        ('buero', 'buero', 'Büro', 'buero')
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
    
    # Orders
    cursor.execute('''
        INSERT INTO orders (title, description, customer, location, order_type, priority, status, assigned_to, created_date, due_date) VALUES 
        ('Wartung Aufzug Hauptstraße 15', 'Regelmäßige Wartung', 'Gebäudeverwaltung München', 'Hauptstraße 15, München', 'maintenance', 'normal', 'assigned', 1, ?, ?),
        ('Reparatur Aufzug Marienplatz', 'Dringende Reparatur', 'Stadt München', 'Marienplatz 1, München', 'repair', 'urgent', 'in_progress', 1, ?, ?)
    ''', (
        f'{today - timedelta(days=5)}',
        f'{today + timedelta(days=5)}',
        f'{today - timedelta(days=6)}',
        f'{today + timedelta(days=3)}'
    ))
    
    # Emergencies
    cursor.execute('''
        INSERT INTO emergencies (title, description, location, priority, status, assigned_to, reported_at) VALUES 
        ('Aufzug steckt fest', 'Aufzug ist stecken geblieben', 'Marienplatz 1, München', 'urgent', 'active', 1, ?)
    ''', (f'{today} 10:30:00',))
    
    # Customers
    cursor.execute('''
        INSERT INTO customers (name, contact_person, email, phone, address) VALUES 
        ('Gebäudeverwaltung München', 'Max Mustermann', 'max@gebaeude-muenchen.de', '+49 89 123456', 'Hauptstraße 15, 80331 München'),
        ('Stadt München', 'Anna Schmidt', 'anna.schmidt@muenchen.de', '+49 89 654321', 'Marienplatz 1, 80331 München')
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ Datenbank erfolgreich erstellt!")
    print("📊 Tabellen: users, time_entries, orders, emergencies, customers")
    print("👥 Testbenutzer: monteur/monteur, buero/buero")

if __name__ == '__main__':
    create_database() 