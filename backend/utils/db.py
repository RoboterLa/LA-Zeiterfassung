import sqlite3
import os
from typing import Optional
from backend.config import Config

def get_db_connection() -> sqlite3.Connection:
    """Erstellt eine Datenbankverbindung"""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initialisiert die Datenbank mit allen Tabellen"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Aufträge Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS auftraege (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            art TEXT NOT NULL,
            uhrzeit TEXT NOT NULL,
            standort TEXT NOT NULL,
            coords TEXT,
            details TEXT,
            done BOOLEAN DEFAULT FALSE,
            priority TEXT DEFAULT 'normal',
            mitarbeiter TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Zeiterfassung Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS zeiterfassung (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elevator_id TEXT,
            location TEXT,
            date TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            emergency_week BOOLEAN DEFAULT FALSE,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            mitarbeiter TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Arbeitszeit Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS arbeitszeit (
            id TEXT PRIMARY KEY,
            datum TEXT NOT NULL,
            start TEXT NOT NULL,
            ende TEXT,
            pause TEXT DEFAULT '00:00',
            gesamt TEXT,
            mitarbeiter TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Urlaub Tabelle
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS urlaub (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mitarbeiter TEXT NOT NULL,
            start_datum TEXT NOT NULL,
            end_datum TEXT NOT NULL,
            tage INTEGER,
            typ TEXT DEFAULT 'Urlaub',
            status TEXT DEFAULT 'pending',
            bemerkung TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User Tabelle (für zukünftige Migration von TEST_USERS)
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

def ensure_sessions_dir() -> None:
    """Stellt sicher, dass das Sessions-Verzeichnis existiert"""
    os.makedirs(Config.SESSION_FILE_DIR, exist_ok=True) 