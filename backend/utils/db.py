import sqlite3
import os

def get_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'zeiterfassung.db')
    return sqlite3.connect(db_path)

def init_db():
    """Initialisiere die Datenbank mit allen Tabellen"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Erstelle zeiterfassung Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS zeiterfassung (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            clock_in TEXT,
            clock_out TEXT,
            total_hours REAL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Erstelle users Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Datenbank initialisiert")

def ensure_sessions_dir():
    """Stelle sicher, dass das Sessions-Verzeichnis existiert"""
    sessions_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'sessions')
    if not os.path.exists(sessions_dir):
        os.makedirs(sessions_dir)
        print("✅ Sessions-Verzeichnis erstellt")
