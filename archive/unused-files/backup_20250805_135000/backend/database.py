import pyodbc
import os
from datetime import datetime
import json

class Database:
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL')
        self.init_database()
    
    def get_connection(self):
        return pyodbc.connect(self.connection_string)
    
    def init_database(self):
        """Initialisiert die Datenbanktabellen"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Users Tabelle
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
                CREATE TABLE users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE()
                )
            """)
            
            # Time Entries Tabelle
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='time_entries' AND xtype='U')
                CREATE TABLE time_entries (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    clock_in DATETIME NOT NULL,
                    clock_out DATETIME NULL,
                    location VARCHAR(255) NULL,
                    notes TEXT NULL,
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Orders Tabelle
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
                CREATE TABLE orders (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    customer VARCHAR(255) NOT NULL,
                    location VARCHAR(255) NOT NULL,
                    order_type VARCHAR(50) NOT NULL,
                    priority VARCHAR(50) DEFAULT 'normal',
                    status VARCHAR(50) DEFAULT 'pending',
                    assigned_to INT NULL,
                    created_date DATE NOT NULL,
                    due_date DATE NULL,
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (assigned_to) REFERENCES users(id)
                )
            """)
            
            # Emergencies Tabelle
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='emergencies' AND xtype='U')
                CREATE TABLE emergencies (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    location VARCHAR(255) NOT NULL,
                    priority VARCHAR(50) DEFAULT 'normal',
                    status VARCHAR(50) DEFAULT 'active',
                    assigned_to INT NULL,
                    reported_at DATETIME DEFAULT GETDATE(),
                    resolved_at DATETIME NULL,
                    FOREIGN KEY (assigned_to) REFERENCES users(id)
                )
            """)
            
            # Customers Tabelle
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
                CREATE TABLE customers (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    contact VARCHAR(255) NULL,
                    phone VARCHAR(50) NULL,
                    email VARCHAR(255) NULL,
                    address TEXT NULL,
                    created_at DATETIME DEFAULT GETDATE()
                )
            """)
            
            # Test-Daten einfügen
            self.insert_test_data(cursor)
            
            conn.commit()
            conn.close()
            print("Datenbank erfolgreich initialisiert!")
            
        except Exception as e:
            print(f"Fehler beim Initialisieren der Datenbank: {e}")
    
    def insert_test_data(self, cursor):
        """Fügt Test-Daten ein"""
        try:
            # Test-Users
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM users WHERE email = 'monteur@lackner.com')
                INSERT INTO users (email, password, name, role) VALUES 
                ('monteur@lackner.com', 'monteur123', 'Monteur', 'monteur'),
                ('buero@lackner.com', 'buero123', 'Büro', 'buero')
            """)
            
            # Test-Customers
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM customers WHERE name = 'Gebäudeverwaltung München')
                INSERT INTO customers (name, contact, phone) VALUES 
                ('Gebäudeverwaltung München', 'Herr Meyer', '089-123456'),
                ('Stadt München', 'Frau Schmidt', '089-654321'),
                ('Bauprojekt GmbH', 'Herr Weber', '089-789123')
            """)
            
            # Test-Orders
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM orders WHERE title = 'Wartung Aufzug Hauptstraße 15')
                INSERT INTO orders (title, description, customer, location, order_type, priority, status, assigned_to, created_date, due_date) VALUES 
                ('Wartung Aufzug Hauptstraße 15', 'Regelmäßige Wartung', 'Gebäudeverwaltung München', 'Hauptstraße 15, München', 'maintenance', 'normal', 'assigned', 1, '2025-01-20', '2025-01-25'),
                ('Reparatur Aufzug Marienplatz', 'Dringende Reparatur', 'Stadt München', 'Marienplatz 1, München', 'repair', 'urgent', 'in_progress', 1, '2025-01-19', '2025-01-22'),
                ('Installation neuer Aufzug', 'Neue Aufzugsanlage', 'Bauprojekt GmbH', 'Neubau Zentrum, München', 'installation', 'high', 'pending', NULL, '2025-01-18', '2025-02-15')
            """)
            
            # Test-Emergencies
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM emergencies WHERE title = 'Aufzug steckt fest')
                INSERT INTO emergencies (title, description, location, priority, status, assigned_to) VALUES 
                ('Aufzug steckt fest', 'Aufzug ist stecken geblieben', 'Marienplatz 1, München', 'urgent', 'active', 1)
            """)
            
            # Test-Time-Entries
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM time_entries WHERE user_id = 1 AND clock_in = '2025-01-20 08:00:00')
                INSERT INTO time_entries (user_id, clock_in, clock_out, location) VALUES 
                (1, '2025-01-20 08:00:00', '2025-01-20 17:00:00', 'Hauptstraße 15, München'),
                (1, '2025-01-20 07:30:00', NULL, 'Marienplatz 1, München')
            """)
            
        except Exception as e:
            print(f"Fehler beim Einfügen der Test-Daten: {e}")
    
    def get_user_by_credentials(self, email, password):
        """Authentifiziert einen Benutzer"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, email, name, role FROM users WHERE email = ? AND password = ?", (email, password))
            user = cursor.fetchone()
            
            conn.close()
            
            if user:
                return {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'role': user[3]
                }
            return None
            
        except Exception as e:
            print(f"Fehler bei der Authentifizierung: {e}")
            return None
    
    def get_time_entries(self, user_id):
        """Holt Zeiteinträge für einen Benutzer"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, clock_in, clock_out, location, notes 
                FROM time_entries 
                WHERE user_id = ? 
                ORDER BY clock_in DESC
            """, (user_id,))
            
            entries = []
            for row in cursor.fetchall():
                entries.append({
                    'id': row[0],
                    'clock_in': row[1].strftime('%H:%M:%S') if row[1] else None,
                    'clock_out': row[2].strftime('%H:%M:%S') if row[2] else None,
                    'location': row[3],
                    'notes': row[4]
                })
            
            conn.close()
            return entries
            
        except Exception as e:
            print(f"Fehler beim Laden der Zeiteinträge: {e}")
            return []
    
    def create_time_entry(self, user_id, clock_in, location=None, notes=None):
        """Erstellt einen neuen Zeiteintrag"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO time_entries (user_id, clock_in, location, notes)
                VALUES (?, ?, ?, ?)
            """, (user_id, clock_in, location, notes))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Fehler beim Erstellen des Zeiteintrags: {e}")
            return False
    
    def update_time_entry(self, entry_id, clock_out):
        """Aktualisiert einen Zeiteintrag (Ausstempelung)"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE time_entries 
                SET clock_out = ? 
                WHERE id = ?
            """, (clock_out, entry_id))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Fehler beim Aktualisieren des Zeiteintrags: {e}")
            return False
    
    def get_orders(self, user_id=None):
        """Holt alle Aufträge"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if user_id:
                cursor.execute("""
                    SELECT o.*, u.name as assigned_to_name
                    FROM orders o
                    LEFT JOIN users u ON o.assigned_to = u.id
                    WHERE o.assigned_to = ?
                    ORDER BY o.created_date DESC
                """, (user_id,))
            else:
                cursor.execute("""
                    SELECT o.*, u.name as assigned_to_name
                    FROM orders o
                    LEFT JOIN users u ON o.assigned_to = u.id
                    ORDER BY o.created_date DESC
                """)
            
            orders = []
            for row in cursor.fetchall():
                orders.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'customer': row[3],
                    'location': row[4],
                    'order_type': row[5],
                    'priority': row[6],
                    'status': row[7],
                    'assigned_to': row[8],
                    'created_date': row[9].strftime('%Y-%m-%d') if row[9] else None,
                    'due_date': row[10].strftime('%Y-%m-%d') if row[10] else None,
                    'assigned_to_name': row[12]
                })
            
            conn.close()
            return orders
            
        except Exception as e:
            print(f"Fehler beim Laden der Aufträge: {e}")
            return []
    
    def create_order(self, order_data):
        """Erstellt einen neuen Auftrag"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO orders (title, description, customer, location, order_type, priority, status, created_date, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                order_data['title'],
                order_data.get('description'),
                order_data['customer'],
                order_data['location'],
                order_data['order_type'],
                order_data.get('priority', 'normal'),
                order_data.get('status', 'pending'),
                order_data['created_date'],
                order_data.get('due_date')
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Fehler beim Erstellen des Auftrags: {e}")
            return False
    
    def update_order_status(self, order_id, status, assigned_to=None):
        """Aktualisiert den Status eines Auftrags"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if assigned_to:
                cursor.execute("""
                    UPDATE orders 
                    SET status = ?, assigned_to = ?
                    WHERE id = ?
                """, (status, assigned_to, order_id))
            else:
                cursor.execute("""
                    UPDATE orders 
                    SET status = ?
                    WHERE id = ?
                """, (status, order_id))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Fehler beim Aktualisieren des Auftrags: {e}")
            return False
    
    def get_emergencies(self):
        """Holt alle Notfälle"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT e.*, u.name as assigned_to_name
                FROM emergencies e
                LEFT JOIN users u ON e.assigned_to = u.id
                ORDER BY e.reported_at DESC
            """)
            
            emergencies = []
            for row in cursor.fetchall():
                emergencies.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'location': row[3],
                    'priority': row[4],
                    'status': row[5],
                    'assigned_to': row[6],
                    'reported_at': row[7].strftime('%Y-%m-%d %H:%M:%S') if row[7] else None,
                    'resolved_at': row[8].strftime('%Y-%m-%d %H:%M:%S') if row[8] else None,
                    'assigned_to_name': row[9]
                })
            
            conn.close()
            return emergencies
            
        except Exception as e:
            print(f"Fehler beim Laden der Notfälle: {e}")
            return []
    
    def create_emergency(self, emergency_data):
        """Erstellt einen neuen Notfall"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO emergencies (title, description, location, priority, status)
                VALUES (?, ?, ?, ?, ?)
            """, (
                emergency_data['title'],
                emergency_data.get('description'),
                emergency_data['location'],
                emergency_data.get('priority', 'normal'),
                emergency_data.get('status', 'active')
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Fehler beim Erstellen des Notfalls: {e}")
            return False
    
    def get_customers(self):
        """Holt alle Kunden"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM customers ORDER BY name")
            
            customers = []
            for row in cursor.fetchall():
                customers.append({
                    'id': row[0],
                    'name': row[1],
                    'contact': row[2],
                    'phone': row[3],
                    'email': row[4],
                    'address': row[5]
                })
            
            conn.close()
            return customers
            
        except Exception as e:
            print(f"Fehler beim Laden der Kunden: {e}")
            return []
    
    def get_users(self):
        """Holt alle Benutzer"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, name, role FROM users ORDER BY name")
            
            users = []
            for row in cursor.fetchall():
                users.append({
                    'id': row[0],
                    'name': row[1],
                    'role': row[2]
                })
            
            conn.close()
            return users
            
        except Exception as e:
            print(f"Fehler beim Laden der Benutzer: {e}")
            return [] 