#!/usr/bin/env python3
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime, date, timedelta

app = Flask(__name__)
app.secret_key = '3Gz7bL0PfHs9qAe2JvY5tDx8wU6RmNc1'

# CORS
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:8080'])

def hash_password(password):
    salt = "zeiterfassung_salt_2024"
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(password, hashed):
    return hash_password(password) == hashed

def get_db():
    conn = sqlite3.connect('zeiterfassung.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Datenbank initialisieren"""
    conn = get_db()
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
    
    # Vacation requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vacation_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            days_requested INTEGER,
            reason TEXT,
            status TEXT DEFAULT 'pending',
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
    
    # Daily reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            work_done TEXT,
            issues TEXT,
            next_day_plan TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def calculate_overtime(total_hours):
    """Berechnet Überstunden basierend auf 8,5 Stunden Regelarbeitszeit"""
    regular_hours = 8.5
    if total_hours > regular_hours:
        return round(total_hours - regular_hours, 2)
    return 0.0

def migrate_db():
    """Datenbank-Migration für neue Spalten"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Prüfe ob work_type Spalte existiert
        cursor.execute("PRAGMA table_info(time_entries)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'work_type' not in columns:
            print("Adding work_type column to time_entries table...")
            cursor.execute('ALTER TABLE time_entries ADD COLUMN work_type TEXT DEFAULT "regular"')
            conn.commit()
            print("work_type column added successfully!")
        else:
            print("work_type column already exists!")
            
    except Exception as e:
        print(f"Migration error: {str(e)}")
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Benutzer anmelden"""
    try:
        data = request.get_json()
        email = data.get('email') or data.get('username')
        password = data.get('password')
        
        print(f"DEBUG: Login attempt for {email}")
        
        if not email or not password:
            return jsonify({'error': 'Email/Username und Passwort erforderlich'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        print(f"DEBUG: Querying database for user {email}")
        cursor.execute('SELECT * FROM users WHERE username = ? OR email = ?', (email, email))
        user = cursor.fetchone()
        
        print(f"DEBUG: User found: {user is not None}")
        
        if not user:
            conn.close()
            return jsonify({'error': 'Benutzer nicht gefunden'}), 401
            
        print(f"DEBUG: Verifying password")
        if not verify_password(password, user['password']):
            conn.close()
            return jsonify({'error': 'Falsches Passwort'}), 401
        
        print(f"DEBUG: Password verified, setting session")
        # Session setzen
        session['user'] = {
            'id': user['id'],
            'email': user['email'] if 'email' in user.keys() else user['username'],
            'name': user['name'],
            'role': user['role']
        }
        
        conn.close()
        
        print(f"DEBUG: Login successful")
        return jsonify({
            'success': True,
            'message': 'Erfolgreich angemeldet',
            'user': {
                'id': user['id'],
                'email': user['email'] if 'email' in user.keys() else user['username'],
                'name': user['name'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        print(f"ERROR in login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Interner Serverfehler'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Erfolgreich abgemeldet'
    })

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    return jsonify({
        'success': True,
        'user': session['user']
    })

# Time Tracking Endpoints
@app.route('/api/monteur/clock-in', methods=['POST'])
def clock_in():
    """Einstempeln"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Prüfe ob bereits ein offener Eintrag für heute existiert
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        ''', (user_id, today))
        
        existing_entry = cursor.fetchone()
        if existing_entry:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Sie sind bereits eingestempelt'
            }), 400
        
        # Erstelle neuen Zeiteintrag
        now = datetime.now()
        cursor.execute('''
            INSERT INTO time_entries (user_id, date, clock_in, status)
            VALUES (?, ?, ?, ?)
        ''', (user_id, today, now.strftime('%H:%M:%S'), 'active'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Erfolgreich eingestempelt um {now.strftime("%H:%M")}'
        })
        
    except Exception as e:
        print(f"Error in clock_in: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Fehler beim Einstempeln'
        }), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    """Ausstempeln"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Finde offenen Eintrag für heute
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        ''', (user_id, today))
        
        entry = cursor.fetchone()
        if not entry:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Kein aktiver Zeiteintrag gefunden'
            }), 400
        
        # Berechne Arbeitszeit
        clock_in = datetime.strptime(entry['clock_in'], '%H:%M:%S')
        now = datetime.now()
        clock_out_time = now.strftime('%H:%M:%S')
        
        # Berechne Gesamtarbeitszeit (ohne Pausen)
        total_seconds = (now - now.replace(hour=clock_in.hour, minute=clock_in.minute, second=clock_in.second)).total_seconds()
        total_hours = total_seconds / 3600
        
        # Berechne reguläre Stunden (8h) und Überstunden
        regular_hours = min(total_hours, 8.0)
        overtime_hours = max(0, total_hours - 8.0)
        
        # Aktualisiere Eintrag
        cursor.execute('''
            UPDATE time_entries 
            SET clock_out = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, status = ?
            WHERE id = ?
        ''', (clock_out_time, total_hours, regular_hours, overtime_hours, 'completed', entry['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Erfolgreich ausgestempelt um {now.strftime("%H:%M")} (Arbeitszeit: {total_hours:.1f}h)'
        })
        
    except Exception as e:
        print(f"Error in clock_out: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Fehler beim Ausstempeln'
        }), 500

@app.route('/api/monteur/start-break', methods=['POST'])
def start_break():
    """Pause starten"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Finde aktiven Eintrag für heute
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        ''', (user_id, today))
        
        entry = cursor.fetchone()
        if not entry:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Kein aktiver Zeiteintrag gefunden'
            }), 400
        
        # Prüfe ob bereits Pause läuft
        if entry['break_start']:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Pause läuft bereits'
            }), 400
        
        # Starte Pause
        now = datetime.now()
        cursor.execute('''
            UPDATE time_entries 
            SET break_start = ?, status = ?
            WHERE id = ?
        ''', (now.strftime('%H:%M:%S'), 'break', entry['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Pause gestartet um {now.strftime("%H:%M")}'
        })
        
    except Exception as e:
        print(f"Error in start_break: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Fehler beim Starten der Pause'
        }), 500

@app.route('/api/monteur/end-break', methods=['POST'])
def end_break():
    """Pause beenden"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Finde aktiven Eintrag für heute
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        ''', (user_id, today))
        
        entry = cursor.fetchone()
        if not entry:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Kein aktiver Zeiteintrag gefunden'
            }), 400
        
        # Prüfe ob Pause läuft
        if not entry['break_start']:
            conn.close()
            return jsonify({
                'success': False, 
                'error': 'Keine Pause läuft'
            }), 400
        
        # Beende Pause
        now = datetime.now()
        cursor.execute('''
            UPDATE time_entries 
            SET break_end = ?, status = ?
            WHERE id = ?
        ''', (now.strftime('%H:%M:%S'), 'active', entry['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Pause beendet um {now.strftime("%H:%M")}'
        })
        
    except Exception as e:
        print(f"Error in end_break: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Fehler beim Beenden der Pause'
        }), 500

@app.route('/api/monteur/current-status', methods=['GET'])
def get_current_status():
    """Aktuellen Status abrufen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Aktiven Eintrag finden
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM time_entries 
        WHERE user_id = ? AND date = ? AND clock_out IS NULL
        ORDER BY id DESC LIMIT 1
    ''', (user_id, today))
    
    entry = cursor.fetchone()
    conn.close()
    
    if not entry:
        return jsonify({
            'success': True,
            'is_working': False,
            'break_status': 'no_break',
            'status': 'ausgestempelt',
            'current_entry': None
        })
    
    # Pausenstatus bestimmen
    break_status = "no_break"
    if entry['break_start'] and not entry['break_end']:  # break_start but no break_end
        break_status = "on_break"
    elif entry['break_start'] and entry['break_end']:  # both break_start and break_end
        break_status = "break_completed"
    
    return jsonify({
        'success': True,
        'is_working': True,
        'break_status': break_status,
        'status': 'eingestempelt',
        'current_entry': {
            'id': entry['id'],
            'user_id': entry['user_id'],
            'date': entry['date'],
            'clock_in': entry['clock_in'],
            'clock_out': entry['clock_out'],
            'break_start': entry['break_start'],
            'break_end': entry['break_end'],
            'total_hours': entry['total_hours'],
            'regular_hours': entry['regular_hours'],
            'overtime_hours': entry['overtime_hours'],
            'status': entry['status'],
            'note': entry['note']
        }
    })

@app.route('/api/monteur/work-summary', methods=['GET'])
def get_work_summary():
    """Arbeitszeit-Zusammenfassung"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    days = request.args.get('days', 7, type=int)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM time_entries 
        WHERE user_id = ? AND date >= ? AND date <= ? AND status = 'completed'
        ORDER BY date DESC, id DESC
    ''', (user_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
    
    entries = cursor.fetchall()
    conn.close()
    
    total_hours = sum(entry['total_hours'] or 0 for entry in entries)
    regular_hours = sum(entry['regular_hours'] or 0 for entry in entries)
    overtime_hours = sum(entry['overtime_hours'] or 0 for entry in entries)
    
    return jsonify({
        'success': True,
        'total_hours': round(total_hours, 2),
        'regular_hours': round(regular_hours, 2),
        'overtime_hours': round(overtime_hours, 2),
        'entries_count': len(entries),
        'period_days': days
    })

# Absence request endpoints
@app.route('/api/monteur/vacation-requests', methods=['GET'])
def get_vacation_requests():
    """Urlaubsanträge abrufen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM vacation_requests 
        WHERE user_id = ? 
        ORDER BY start_date DESC
    ''', (user_id,))
    
    requests = []
    for row in cursor.fetchall():
        request_data = {
            'id': row['id'],
            'user_id': row['user_id'],
            'start_date': row['start_date'],
            'end_date': row['end_date'],
            'reason': row['reason'],
            'status': row['status'],
            'created_at': row['created_at'] if 'created_at' in row.keys() else None
        }
        
        # Handle missing days_requested column
        if 'days_requested' in row.keys():
            request_data['days_requested'] = row['days_requested']
        else:
            # Calculate days_requested from start_date and end_date
            try:
                start = datetime.strptime(row['start_date'], '%Y-%m-%d')
                end = datetime.strptime(row['end_date'], '%Y-%m-%d')
                days = (end - start).days + 1
                request_data['days_requested'] = days
            except:
                request_data['days_requested'] = 1
        
        requests.append(request_data)
    
    conn.close()
    
    return jsonify({
        'success': True,
        'vacation_requests': requests
    })

@app.route('/api/monteur/absence-request', methods=['POST'])
def create_absence_request():
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('type') or not data.get('startDate') or not data.get('endDate'):
            return jsonify({'error': 'Alle Pflichtfelder müssen ausgefüllt werden'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO vacation_requests 
            (user_id, start_date, end_date, reason, is_half_day, comment, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ''', (
            session['user']['id'],
            data['startDate'],
            data['endDate'],
            data.get('comment', ''),
            data.get('isHalfDay', False),
            data.get('comment', ''),
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Abwesenheitsantrag erfolgreich erstellt'
        })
        
    except Exception as e:
        print(f"Error in create_absence_request: {str(e)}")
        return jsonify({'error': 'Interner Serverfehler'}), 500

# Time entries endpoint
@app.route('/api/monteur/time-entries', methods=['GET'])
def get_time_entries():
    """Zeiteinträge abrufen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    days = request.args.get('days', 7, type=int)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM time_entries 
        WHERE user_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC, id DESC
    ''', (user_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
    
    entries = []
    for row in cursor.fetchall():
        entries.append({
            'id': row['id'],
            'user_id': row['user_id'],
            'date': row['date'],
            'clock_in': row['clock_in'],
            'clock_out': row['clock_out'],
            'break_start': row['break_start'],
            'break_end': row['break_end'],
            'total_hours': row['total_hours'],
            'regular_hours': row['regular_hours'],
            'overtime_hours': row['overtime_hours'],
            'work_type': row['work_type'],
            'status': row['status'],
            'note': row['note'],
            'created_at': row['created_at'] if len(row) > 12 else None
        })
    
    conn.close()
    
    return jsonify({
        'success': True,
        'time_entries': entries,
        'count': len(entries)
    })

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['PUT'])
def update_time_entry(entry_id):
    """Zeiteintrag bearbeiten"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Prüfe ob der Eintrag dem Benutzer gehört
        cursor.execute('SELECT * FROM time_entries WHERE id = ? AND user_id = ?', (entry_id, user_id))
        entry = cursor.fetchone()
        
        if not entry:
            return jsonify({'success': False, 'error': 'Eintrag nicht gefunden'}), 404
        
        # Status bestimmen (heute = offen, vergangen = zur Freigabe)
        today = datetime.now().strftime('%Y-%m-%d')
        is_today = data.get('date', entry['date']) == today
        status = 'open' if is_today else 'pending'
        
        if data.get('entry_type') == 'fullDay':
            # Validierung für ganzen Tag
            if not all(key in data for key in ['start_time', 'end_time']):
                return jsonify({'success': False, 'error': 'Start- und Endzeit sind erforderlich'}), 400
            
            # Arbeitszeit berechnen
            start_time = datetime.strptime(data['start_time'], '%H:%M')
            end_time = datetime.strptime(data['end_time'], '%H:%M')
            break_minutes = int(data.get('break_time', 0))
            
            work_minutes = (end_time - start_time).seconds / 60 - break_minutes
            total_hours = round(work_minutes / 60, 2)
            
            # Überstunden berechnen
            overtime_hours = calculate_overtime(total_hours)
            regular_hours = min(total_hours, 8.5)
            
            cursor.execute('''
                UPDATE time_entries 
                SET date = ?, clock_in = ?, clock_out = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, note = ?, status = ?
                WHERE id = ? AND user_id = ?
            ''', (
                data['date'], data['start_time'], data['end_time'],
                total_hours, regular_hours, overtime_hours, data.get('note', ''), status, entry_id, user_id
            ))
            
        else:  # hoursOnly
            if 'hours' not in data:
                return jsonify({'success': False, 'error': 'Stundenanzahl ist erforderlich'}), 400
            
            total_hours = float(data['hours'])
            
            # Überstunden berechnen
            overtime_hours = calculate_overtime(total_hours)
            regular_hours = min(total_hours, 8.5)
            
            cursor.execute('''
                UPDATE time_entries 
                SET date = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, note = ?, status = ?
                WHERE id = ? AND user_id = ?
            ''', (
                data['date'], total_hours, regular_hours, overtime_hours, data.get('note', ''), status, entry_id, user_id
            ))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich aktualisiert'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': f'Datenbankfehler: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['DELETE'])
def delete_time_entry(entry_id):
    """Zeiteintrag löschen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Prüfe ob der Eintrag dem Benutzer gehört
        cursor.execute('SELECT * FROM time_entries WHERE id = ? AND user_id = ?', (entry_id, user_id))
        entry = cursor.fetchone()
        
        if not entry:
            return jsonify({'success': False, 'error': 'Eintrag nicht gefunden'}), 404
        
        # Lösche den Eintrag
        cursor.execute('DELETE FROM time_entries WHERE id = ? AND user_id = ?', (entry_id, user_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich gelöscht'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': f'Datenbankfehler: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/monteur/orders', methods=['GET'])
def get_orders():
    """Aufträge abrufen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM orders 
        WHERE assigned_to = ? 
        ORDER BY 
            CASE 
                WHEN priority = 'urgent' THEN 1
                WHEN priority = 'high' THEN 2
                WHEN priority = 'normal' THEN 3
                WHEN priority = 'low' THEN 4
            END,
            created_at DESC
    ''', (user_id,))
    
    orders = []
    for row in cursor.fetchall():
        orders.append({
            'id': row['id'],
            'title': row['title'],
            'description': row['description'],
            'location': row['location'],
            'status': row['status'],
            'priority': row['priority'],
            'start_time': row['start_time'],
            'end_time': row['end_time'],
            'order_number': row['order_number'],
            'factory_number': row['factory_number'],
            'order_type': row['order_type'],
            'coordinates': [row['coordinates_lat'], row['coordinates_lon']] if row['coordinates_lat'] and row['coordinates_lon'] else None,
            'created_at': row['created_at'] if 'created_at' in row.keys() else None
        })
    
    conn.close()
    
    return jsonify({
        'success': True,
        'orders': orders
    })

@app.route('/api/monteur/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Auftragsstatus aktualisieren"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'success': False, 'error': 'Status erforderlich'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE orders 
            SET status = ? 
            WHERE id = ? AND assigned_to = ?
        ''', (new_status, order_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Auftrag nicht gefunden'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auftragsstatus erfolgreich aktualisiert'
        })
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'success': False, 'error': f'Datenbankfehler: {str(e)}'}), 500

@app.route('/api/monteur/daily-reports', methods=['GET'])
def get_daily_reports():
    """Tagesberichte abrufen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM daily_reports 
        WHERE user_id = ? 
        ORDER BY date DESC
    ''', (user_id,))
    
    reports = []
    for row in cursor.fetchall():
        reports.append({
            'id': row['id'],
            'user_id': row['user_id'],
            'date': row['date'],
            'content': row['content'],
            'status': row['status'],
            'created_at': row['created_at'] if 'created_at' in row.keys() else None
        })
    
    conn.close()
    
    return jsonify({
        'success': True,
        'daily_reports': reports
    })

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Wetter-Daten abrufen (Mock)"""
    return jsonify({
        'success': True,
        'weather': {
            'temperature': 22,
            'condition': 'Sonnig',
            'icon': '☀️',
            'city': 'München'
        }
    })

@app.route('/health')
def health_check():
    return {'status': 'healthy', 'service': 'zeiterfassung-app'}

@app.route('/api/monteur/manual-entry', methods=['POST'])
def create_manual_entry():
    """Manuellen Zeiteintrag erstellen"""
    if 'user' not in session:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    user_id = session['user']['id']
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Status bestimmen (heute = offen, vergangen = zur Freigabe)
        today = datetime.now().strftime('%Y-%m-%d')
        is_today = data.get('date') == today
        status = 'open' if is_today else 'pending'
        
        # Arbeitszeit-Typ bestimmen
        work_type = data.get('work_type', 'regular')  # regular, overtime, sick, vacation, training, travel
        
        if data.get('entry_type') == 'fullDay':
            # Validierung für ganzen Tag
            if not all(key in data for key in ['start_time', 'end_time']):
                return jsonify({'success': False, 'error': 'Start- und Endzeit sind erforderlich'}), 400
            
            # Arbeitszeit berechnen
            start_time = datetime.strptime(data['start_time'], '%H:%M')
            end_time = datetime.strptime(data['end_time'], '%H:%M')
            break_minutes = int(data.get('break_time', 0))
            
            work_minutes = (end_time - start_time).seconds / 60 - break_minutes
            total_hours = round(work_minutes / 60, 2)
            
            # Überstunden nur bei regulärer Arbeit berechnen
            if work_type == 'regular':
                overtime_hours = calculate_overtime(total_hours)
                regular_hours = min(total_hours, 8.5)
            else:
                overtime_hours = 0.0
                regular_hours = total_hours
            
            cursor.execute('''
                INSERT INTO time_entries
                (user_id, date, clock_in, clock_out, total_hours, regular_hours, overtime_hours, work_type, note, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, data['date'], data['start_time'], data['end_time'],
                total_hours, regular_hours, overtime_hours, work_type, data.get('note', ''), status
            ))
            
        else:  # hoursOnly
            if 'hours' not in data:
                return jsonify({'success': False, 'error': 'Stundenanzahl ist erforderlich'}), 400
            
            total_hours = float(data['hours'])
            
            # Überstunden nur bei regulärer Arbeit berechnen
            if work_type == 'regular':
                overtime_hours = calculate_overtime(total_hours)
                regular_hours = min(total_hours, 8.5)
            else:
                overtime_hours = 0.0
                regular_hours = total_hours
            
            cursor.execute('''
                INSERT INTO time_entries
                (user_id, date, total_hours, regular_hours, overtime_hours, work_type, note, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, data['date'], total_hours, regular_hours, overtime_hours, 
                work_type, data.get('note', ''), status
            ))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich gespeichert'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': f'Datenbankfehler: {str(e)}'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    migrate_db()
    app.run(debug=True, host='0.0.0.0', port=8080) 