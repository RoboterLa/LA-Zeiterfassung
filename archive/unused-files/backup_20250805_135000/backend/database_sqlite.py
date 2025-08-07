import sqlite3
import os
from datetime import datetime
import json

class Database:
    def __init__(self):
        self.db_path = 'zeiterfassung.db'
        self.init_database()
    
    def get_connection(self):
        return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Initialisiert die Datenbanktabellen"""
        try:
            # Import database_setup to create tables
            from database_setup import create_database
            create_database()
            print("Datenbank erfolgreich initialisiert!")
            
        except Exception as e:
            print(f"Fehler beim Initialisieren der Datenbank: {e}")
    
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
                clock_in = datetime.fromisoformat(row[1]) if row[1] else None
                clock_out = datetime.fromisoformat(row[2]) if row[2] else None
                
                entries.append({
                    'id': row[0],
                    'clock_in': clock_in.strftime('%H:%M:%S') if clock_in else None,
                    'clock_out': clock_out.strftime('%H:%M:%S') if clock_out else None,
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
            """, (user_id, clock_in.isoformat(), location, notes))
            
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
            """, (clock_out.isoformat(), entry_id))
            
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
                created_date = datetime.fromisoformat(row[9]) if row[9] else None
                due_date = datetime.fromisoformat(row[10]) if row[10] else None
                
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
                    'created_date': created_date.strftime('%Y-%m-%d') if created_date else None,
                    'due_date': due_date.strftime('%Y-%m-%d') if due_date else None,
                    'assigned_to_name': row[13] if len(row) > 13 else None
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
                order_data.get('created_date', datetime.now().date().isoformat()),
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
                reported_at = datetime.fromisoformat(row[7]) if row[7] else None
                resolved_at = datetime.fromisoformat(row[8]) if row[8] else None
                
                emergencies.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'location': row[3],
                    'priority': row[4],
                    'status': row[5],
                    'assigned_to': row[6],
                    'reported_at': reported_at.strftime('%Y-%m-%d %H:%M:%S') if reported_at else None,
                    'resolved_at': resolved_at.strftime('%Y-%m-%d %H:%M:%S') if resolved_at else None,
                    'assigned_to_name': row[9] if len(row) > 9 else None
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
                INSERT INTO emergencies (title, description, location, priority, status, reported_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                emergency_data['title'],
                emergency_data.get('description'),
                emergency_data['location'],
                emergency_data.get('priority', 'normal'),
                emergency_data.get('status', 'active'),
                datetime.now().isoformat()
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