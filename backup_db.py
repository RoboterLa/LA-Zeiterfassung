#!/usr/bin/env python3
"""
Datenbank-Backup vor Azure Deployment
Kopiert zeiterfassung.db zu backup.db
"""

import shutil
import os
from datetime import datetime

def backup_database():
    """Backup der SQLite-Datenbank"""
    source_db = 'backend/zeiterfassung.db'
    backup_db = 'backup.db'
    
    if os.path.exists(source_db):
        try:
            # Backup erstellen
            shutil.copy2(source_db, backup_db)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"✅ Datenbank-Backup erstellt: {backup_db} ({timestamp})")
            print(f"📊 Größe: {os.path.getsize(backup_db)} Bytes")
            return True
        except Exception as e:
            print(f"❌ Backup fehlgeschlagen: {e}")
            return False
    else:
        print(f"❌ Datenbank nicht gefunden: {source_db}")
        return False

def restore_database():
    """Datenbank aus Backup wiederherstellen"""
    backup_db = 'backup.db'
    target_db = 'backend/zeiterfassung.db'
    
    if os.path.exists(backup_db):
        try:
            # Backup wiederherstellen
            shutil.copy2(backup_db, target_db)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"✅ Datenbank wiederhergestellt: {target_db} ({timestamp})")
            return True
        except Exception as e:
            print(f"❌ Wiederherstellung fehlgeschlagen: {e}")
            return False
    else:
        print(f"❌ Backup nicht gefunden: {backup_db}")
        return False

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'restore':
        restore_database()
    else:
        backup_database() 