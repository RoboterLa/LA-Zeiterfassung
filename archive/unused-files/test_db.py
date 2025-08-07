#!/usr/bin/env python3
import sqlite3
import hashlib
from datetime import datetime

def init_test_db():
    """Datenbank mit Testdaten initialisieren"""
    conn = sqlite3.connect('zeiterfassung.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Time entries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            clock_in TEXT,
            clock_out TEXT,
            break_start TEXT,
            break_end TEXT,
            total_hours REAL DEFAULT 0,
            regular_hours REAL DEFAULT 0,
            overtime_hours REAL DEFAULT 0,
            work_type TEXT DEFAULT 'regular',
            note TEXT,
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            location TEXT,
            priority TEXT DEFAULT 'normal',
            status TEXT DEFAULT 'open',
            assigned_to INTEGER,
            start_time TEXT,
            end_time TEXT,
            order_number TEXT,
            factory_number TEXT,
            order_type TEXT DEFAULT 'maintenance',
            coordinates_lat REAL,
            coordinates_lon REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users (id)
        )
    ''')
    
    # Hash function
    def hash_password(password):
        salt = "zeiterfassung_salt_2024"
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    # Insert test users
    test_users = [
        ('admin', hash_password('admin123'), 'admin', 'Administrator', 'admin@lackner.com'),
        ('monteur', hash_password('monteur123'), 'monteur', 'Monteur', 'monteur@lackner.com'),
        ('buero', hash_password('buero123'), 'buero', 'Büro', 'buero@lackner.com'),
        ('lohn', hash_password('lohn123'), 'lohn', 'Lohn', 'lohn@lackner.com')
    ]
    
    for user in test_users:
        cursor.execute('''
            INSERT OR REPLACE INTO users (username, password, role, name, email)
            VALUES (?, ?, ?, ?, ?)
        ''', user)
    
    # Insert test time entries
    test_entries = [
        (2, '2025-08-04', '08:00:00', '17:00:00', None, None, 8.5, 8.5, 0.0, 'regular', 'Reguläre Arbeit', 'completed'),
        (2, '2025-08-04', '09:00:00', '18:00:00', None, None, 9.0, 8.5, 0.5, 'regular', 'Überstunden', 'completed'),
        (2, '2025-08-04', None, None, None, None, 4.0, 4.0, 0.0, 'sick', 'Krankheit Vormittag', 'open'),
        (2, '2025-08-04', None, None, None, None, 6.0, 6.0, 0.0, 'training', 'Schulung', 'open')
    ]
    
    for entry in test_entries:
        cursor.execute('''
            INSERT OR REPLACE INTO time_entries 
            (user_id, date, clock_in, clock_out, break_start, break_end, total_hours, regular_hours, overtime_hours, work_type, note, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', entry)
    
    # Insert test orders
    test_orders = [
        (1, 'Notfall: Aufzug klemmt zwischen 2. und 3. Stock', 'Aufzug klemmt zwischen 2. und 3. Stock, sofortige Reparatur erforderlich', 'Hauptbahnhof München', 'urgent', 'assigned', 2, '08:30', '12:00', 'AUF-2024-001', 'FAC-001', 'emergency', 48.1374, 11.5755),
        (2, 'Jährliche Wartung und Inspektion', 'Regelmäßige Wartung und Sicherheitsinspektion des Personenaufzugs', 'Sendlinger Tor, München', 'normal', 'assigned', 2, '09:15', '15:30', 'AUF-2024-002', 'FAC-002', 'maintenance', 48.1344, 11.5678),
        (3, 'Türschließer defekt - Austausch erforderlich', 'Türschließer defekt, muss ausgetauscht werden', 'Karlsplatz, München', 'low', 'assigned', 2, '10:30', '14:00', 'AUF-2024-003', 'FAC-003', 'repair', 48.1392, 11.5682),
        (4, 'Jährliche Sicherheitsprüfung', 'Jährliche Sicherheitsprüfung erfolgreich abgeschlossen', 'Marienplatz, München', 'low', 'completed', 2, '08:00', '11:30', 'AUF-2024-004', 'FAC-004', 'inspection', 48.1374, 11.5755),
        (5, 'Wartung Aufzug Hauptstraße 15', 'Regelmäßige Wartung des Personenaufzugs', 'Hauptstraße 15, München', 'normal', 'assigned', 2, '08:00', '17:00', 'AUF-2024-005', 'FAC-005', 'maintenance', 48.1351, 11.5820),
        (6, 'Reparatur Notruf-System', 'Notruf-System funktioniert nicht, Reparatur erforderlich', 'Maximilianstraße 15, München', 'high', 'in_progress', 2, '07:30', '13:00', 'AUF-2024-006', 'FAC-006', 'repair', 48.1392, 11.5682),
        (7, 'Inspektion Lastenaufzug', 'Jährliche Inspektion des Lastenaufzugs', 'Industriestraße 8, München', 'normal', 'assigned', 2, '09:00', '16:00', 'AUF-2024-007', 'FAC-007', 'inspection', 48.1374, 11.5755),
        (8, 'Wartung Rolltreppe', 'Regelmäßige Wartung der Rolltreppe', 'U-Bahn Station Marienplatz', 'normal', 'assigned', 2, '10:00', '15:00', 'AUF-2024-008', 'FAC-008', 'maintenance', 48.1374, 11.5755)
    ]
    
    for order in test_orders:
        cursor.execute('''
            INSERT OR REPLACE INTO orders 
            (id, title, description, location, priority, status, assigned_to, start_time, end_time, order_number, factory_number, order_type, coordinates_lat, coordinates_lon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', order)
    
    conn.commit()
    conn.close()
    print("Test database initialized successfully!")

if __name__ == '__main__':
    init_test_db() 