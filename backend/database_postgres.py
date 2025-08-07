import os
import psycopg2
import logging
from datetime import datetime
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

class PostgreSQLDatabase:
    def __init__(self):
        self.database_url = os.environ.get('DATABASE_URL')
        self.init_database()

    def get_connection(self):
        """Erstellt eine Verbindung zur PostgreSQL-Datenbank"""
        try:
            if not self.database_url:
                logger.warning("DATABASE_URL nicht gesetzt, verwende Mock-Daten")
                return None
            
            conn = psycopg2.connect(self.database_url)
            return conn
        except Exception as e:
            logger.error(f"Fehler beim Verbinden zur PostgreSQL-DB: {e}")
            return None

    def init_database(self):
        """Initialisiert die Datenbank-Tabellen"""
        conn = self.get_connection()
        if not conn:
            logger.warning("Keine DB-Verbindung, überspringe Initialisierung")
            return

        try:
            with conn.cursor() as cursor:
                # Users Tabelle
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(20) NOT NULL DEFAULT 'monteur',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Time Entries Tabelle
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS time_entries (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        start_time TIMESTAMP NOT NULL,
                        end_time TIMESTAMP,
                        description TEXT,
                        order_id VARCHAR(50),
                        break_start TIMESTAMP,
                        break_end TIMESTAMP,
                        location VARCHAR(50) DEFAULT 'auswärts',
                        type VARCHAR(20) DEFAULT 'arbeit',
                        note TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Orders Tabelle
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS orders (
                        id SERIAL PRIMARY KEY,
                        order_number VARCHAR(50) UNIQUE NOT NULL,
                        customer_name VARCHAR(100) NOT NULL,
                        description TEXT,
                        status VARCHAR(20) DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Emergencies Tabelle
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS emergencies (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(100) NOT NULL,
                        description TEXT,
                        priority VARCHAR(20) DEFAULT 'medium',
                        status VARCHAR(20) DEFAULT 'open',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Customer Entries Tabelle (Kundenarbeiten)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS customer_entries (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        customer_name VARCHAR(100) NOT NULL,
                        customer_address TEXT,
                        work_type VARCHAR(50) NOT NULL DEFAULT 'reparatur',
                        description TEXT NOT NULL,
                        hours DECIMAL(5,2),
                        materials TEXT,
                        order_id VARCHAR(50),
                        date DATE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Default Users einfügen (falls nicht vorhanden)
                cursor.execute("""
                    INSERT INTO users (username, password_hash, role) 
                    VALUES ('monteur', 'monteur', 'monteur')
                    ON CONFLICT (username) DO NOTHING
                """)
                
                cursor.execute("""
                    INSERT INTO users (username, password_hash, role) 
                    VALUES ('buero', 'buero', 'buero')
                    ON CONFLICT (username) DO NOTHING
                """)

                conn.commit()
                logger.info("PostgreSQL-Datenbank erfolgreich initialisiert")

        except Exception as e:
            logger.error(f"Fehler bei DB-Initialisierung: {e}")
            conn.rollback()
        finally:
            conn.close()

    def authenticate_user(self, username, password):
        """Authentifiziert einen Benutzer"""
        conn = self.get_connection()
        if not conn:
            # Mock-Authentifizierung als Fallback
            if username == 'monteur' and password == 'monteur':
                return {'id': 1, 'username': 'monteur', 'role': 'monteur'}
            elif username == 'buero' and password == 'buero':
                return {'id': 2, 'username': 'buero', 'role': 'buero'}
            return None

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, username, role FROM users 
                    WHERE username = %s AND password_hash = %s
                """, (username, password))
                user = cursor.fetchone()
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Fehler bei Authentifizierung: {e}")
            return None
        finally:
            conn.close()

    def get_time_entries(self, user_id=None):
        """Holt alle Zeiteinträge"""
        conn = self.get_connection()
        if not conn:
            # Mock-Daten als Fallback
            return [
                {
                    'id': 1,
                    'user_id': 1,
                    'start_time': '2025-08-05T08:00:00',
                    'end_time': '2025-08-05T16:00:00',
                    'description': 'Aufzugwartung',
                    'order_id': 'AUF-001'
                }
            ]

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                if user_id:
                    cursor.execute("""
                        SELECT * FROM time_entries WHERE user_id = %s 
                        ORDER BY start_time DESC
                    """, (user_id,))
                else:
                    cursor.execute("""
                        SELECT * FROM time_entries ORDER BY start_time DESC
                    """)
                entries = cursor.fetchall()
                return [dict(entry) for entry in entries]
        except Exception as e:
            logger.error(f"Fehler beim Laden der Zeiteinträge: {e}")
            return []
        finally:
            conn.close()

    def add_time_entry(self, user_id, start_time, end_time=None, description=None, order_id=None):
        """Fügt einen neuen Zeiteintrag hinzu"""
        conn = self.get_connection()
        if not conn:
            return {'success': False, 'message': 'Keine DB-Verbindung'}

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO time_entries (user_id, start_time, end_time, description, order_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (user_id, start_time, end_time, description, order_id))
                entry_id = cursor.fetchone()[0]
                conn.commit()
                return {'success': True, 'id': entry_id}
        except Exception as e:
            logger.error(f"Fehler beim Hinzufügen des Zeiteintrags: {e}")
            conn.rollback()
            return {'success': False, 'message': str(e)}
        finally:
            conn.close()

    def update_time_entry(self, entry_id, end_time=None, description=None):
        """Aktualisiert einen Zeiteintrag"""
        conn = self.get_connection()
        if not conn:
            return {'success': False, 'message': 'Keine DB-Verbindung'}

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE time_entries 
                    SET end_time = COALESCE(%s, end_time), 
                        description = COALESCE(%s, description)
                    WHERE id = %s
                """, (end_time, description, entry_id))
                conn.commit()
                return {'success': True}
        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren des Zeiteintrags: {e}")
            conn.rollback()
            return {'success': False, 'message': str(e)}
        finally:
            conn.close()

    def delete_time_entry(self, entry_id):
        """Löscht einen Zeiteintrag"""
        conn = self.get_connection()
        if not conn:
            return {'success': False, 'message': 'Keine DB-Verbindung'}

        try:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM time_entries WHERE id = %s", (entry_id,))
                conn.commit()
                return {'success': True}
        except Exception as e:
            logger.error(f"Fehler beim Löschen des Zeiteintrags: {e}")
            conn.rollback()
            return {'success': False, 'message': str(e)}
        finally:
            conn.close()

    def get_orders(self):
        """Holt alle Aufträge"""
        conn = self.get_connection()
        if not conn:
            # Mock-Daten als Fallback
            return [
                {
                    'id': 1,
                    'order_number': 'AUF-001',
                    'customer_name': 'Musterfirma GmbH',
                    'description': 'Aufzugwartung',
                    'status': 'active'
                }
            ]

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
                orders = cursor.fetchall()
                return [dict(order) for order in orders]
        except Exception as e:
            logger.error(f"Fehler beim Laden der Aufträge: {e}")
            return []
        finally:
            conn.close()

    def add_order(self, order_number, customer_name, description):
        """Fügt einen neuen Auftrag hinzu"""
        conn = self.get_connection()
        if not conn:
            return {'success': False, 'message': 'Keine DB-Verbindung'}

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO orders (order_number, customer_name, description)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (order_number, customer_name, description))
                order_id = cursor.fetchone()[0]
                conn.commit()
                return {'success': True, 'id': order_id}
        except Exception as e:
            logger.error(f"Fehler beim Hinzufügen des Auftrags: {e}")
            conn.rollback()
            return {'success': False, 'message': str(e)}
        finally:
            conn.close()

    def get_emergencies(self):
        """Holt alle Notfälle"""
        conn = self.get_connection()
        if not conn:
            # Mock-Daten als Fallback
            return [
                {
                    'id': 1,
                    'title': 'Aufzug steckt fest',
                    'description': 'Aufzug im 3. Stock steckt fest',
                    'priority': 'high',
                    'status': 'open'
                }
            ]

        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM emergencies ORDER BY created_at DESC")
                emergencies = cursor.fetchall()
                return [dict(emergency) for emergency in emergencies]
        except Exception as e:
            logger.error(f"Fehler beim Laden der Notfälle: {e}")
            return []
        finally:
            conn.close()

    def add_emergency(self, title, description, priority='medium'):
        """Fügt einen neuen Notfall hinzu"""
        conn = self.get_connection()
        if not conn:
            return {'success': False, 'message': 'Keine DB-Verbindung'}

        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO emergencies (title, description, priority)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (title, description, priority))
                emergency_id = cursor.fetchone()[0]
                conn.commit()
                return {'success': True, 'id': emergency_id}
        except Exception as e:
            logger.error(f"Fehler beim Hinzufügen des Notfalls: {e}")
            conn.rollback()
            return {'success': False, 'message': str(e)}
        finally:
            conn.close()

    def get_database_status(self):
        """Gibt den Datenbankstatus zurück"""
        conn = self.get_connection()
        if conn:
            conn.close()
            return "connected"
        return "mock" 