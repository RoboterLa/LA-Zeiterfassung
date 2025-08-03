import sqlite3
import os

def create_new_tables():
    db_path = 'zeiterfassung.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Vacation Requests Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vacation_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT
        )
    ''')
    
    # Sick Leaves Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sick_leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT
        )
    ''')
    
    # Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'assigned',
            assigned_to TEXT NOT NULL,
            assigned_date TEXT NOT NULL,
            completed_date TEXT,
            priority TEXT DEFAULT 'normal'
        )
    ''')
    
    # Daily Reports Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            order_id INTEGER,
            work_description TEXT NOT NULL,
            hours_worked REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            approved_by TEXT,
            approved_at TEXT
        )
    ''')
    
    # Update zeiterfassung table with break fields
    cursor.execute('''
        ALTER TABLE zeiterfassung ADD COLUMN break_start TEXT
    ''')
    
    cursor.execute('''
        ALTER TABLE zeiterfassung ADD COLUMN break_end TEXT
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Neue Tabellen erstellt!")

if __name__ == '__main__':
    create_new_tables()
