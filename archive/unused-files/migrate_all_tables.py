#!/usr/bin/env python3
"""
Database Migration für alle neuen Tabellen
"""

import sqlite3
from backend.utils.db import get_db_connection, init_db
from backend.config import Config

def migrate_all_tables():
    """Führt alle Datenbank-Migrationen durch"""
    print("🔄 Führe alle Datenbank-Migrationen durch...")
    
    # Initialisiere Datenbank
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Daily Reports Tabelle
    print("➕ Erstelle daily_reports Tabelle...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            work_description TEXT NOT NULL,
            hours_worked REAL NOT NULL,
            materials_used TEXT,
            problems TEXT,
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            approval_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Vacation Requests Tabelle
    print("➕ Erstelle vacation_requests Tabelle...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vacation_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            vacation_type TEXT NOT NULL,
            days INTEGER NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            approval_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. Audit Logs Tabelle (falls nicht vorhanden)
    print("➕ Erstelle audit_logs Tabelle...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user_id INTEGER,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 4. Alerts Tabelle (falls nicht vorhanden)
    print("➕ Erstelle alerts Tabelle...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL,
            acknowledged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 5. Erweitere zeiterfassung Tabelle um neue Spalten
    print("➕ Erweitere zeiterfassung Tabelle...")
    
    # Prüfe und füge Spalten hinzu
    cursor.execute("PRAGMA table_info(zeiterfassung)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'user_id' not in columns:
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN user_id INTEGER')
    
    if 'overtime_requested' not in columns:
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN overtime_requested BOOLEAN DEFAULT FALSE')
    
    if 'overtime_approved' not in columns:
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN overtime_approved BOOLEAN')
    
    if 'total_hours' not in columns:
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN total_hours TEXT')
    
    if 'activity_type' not in columns:
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN activity_type TEXT DEFAULT "work"')
    
    conn.commit()
    conn.close()
    
    print("✅ Alle Datenbank-Migrationen abgeschlossen!")

if __name__ == "__main__":
    migrate_all_tables()
