#!/usr/bin/env python3
"""
Database Migration Script
"""

import sqlite3
import os
from backend.utils.db import get_db_connection, init_db
from backend.config import Config

def migrate_database():
    """Führt Datenbank-Migrationen durch"""
    print("🔄 Führe Datenbank-Migrationen durch...")
    
    # Initialisiere Datenbank
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Prüfe ob user_id Spalte existiert
    cursor.execute("PRAGMA table_info(zeiterfassung)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'user_id' not in columns:
        print("➕ Füge user_id Spalte zu zeiterfassung hinzu...")
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN user_id INTEGER')
        
        # Migriere bestehende Daten (setze user_id auf 1 für bestehende Einträge)
        cursor.execute('UPDATE zeiterfassung SET user_id = 1 WHERE user_id IS NULL')
    
    # Prüfe ob overtime_requested Spalte existiert
    if 'overtime_requested' not in columns:
        print("➕ Füge overtime_requested Spalte hinzu...")
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN overtime_requested BOOLEAN DEFAULT FALSE')
    
    if 'overtime_approved' not in columns:
        print("➕ Füge overtime_approved Spalte hinzu...")
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN overtime_approved BOOLEAN')
    
    if 'total_hours' not in columns:
        print("➕ Füge total_hours Spalte hinzu...")
        cursor.execute('ALTER TABLE zeiterfassung ADD COLUMN total_hours TEXT')
    
    conn.commit()
    conn.close()
    
    print("✅ Datenbank-Migration abgeschlossen!")

if __name__ == "__main__":
    migrate_database()
