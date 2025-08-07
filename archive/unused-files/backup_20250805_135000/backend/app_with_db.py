from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'zeiterfassung-secret-key-2025'
CORS(app, supports_credentials=True)

def get_db_connection():
    """Erstellt eine Datenbankverbindung"""
    conn = sqlite3.connect('zeiterfassung.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialisiert die Datenbank falls sie nicht existiert"""
    if not os.path.exists('zeiterfassung.db'):
        from database_setup import create_database
        create_database()

@app.route('/health')
def health_check():
    return jsonify({
        'service': 'zeiterfassung-app',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email und Passwort erforderlich'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user['id']
            session['user_role'] = user['role']
            return jsonify({
                'success': True,
                'message': 'Erfolgreich angemeldet',
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role']
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Ungültige Anmeldedaten'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Erfolgreich abgemeldet'})

@app.route('/api/auth/me')
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role']
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Benutzer nicht gefunden'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/time-entries')
def get_time_entries():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Zeiteinträge der letzten 30 Tage
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) >= ?
            ORDER BY clock_in DESC
        ''', (session.get('user_id'), thirty_days_ago))
        
        entries = cursor.fetchall()
        conn.close()
        
        entries_list = []
        for entry in entries:
            # Arbeitszeit berechnen
            total_hours = 0
            if entry['clock_out']:
                clock_in = datetime.strptime(entry['clock_in'], '%Y-%m-%d %H:%M:%S')
                clock_out = datetime.strptime(entry['clock_out'], '%Y-%m-%d %H:%M:%S')
                work_duration = clock_out - clock_in
                
                # Pausenzeit abziehen
                break_time = 0
                if entry['break_start'] and entry['break_end']:
                    break_start = datetime.strptime(entry['break_start'], '%Y-%m-%d %H:%M:%S')
                    break_end = datetime.strptime(entry['break_end'], '%Y-%m-%d %H:%M:%S')
                    break_duration = break_end - break_start
                    break_time = break_duration.total_seconds() / 3600
                
                total_hours = (work_duration.total_seconds() / 3600) - break_time
            
            entries_list.append({
                'id': entry['id'],
                'clock_in': entry['clock_in'],
                'clock_out': entry['clock_out'],
                'break_start': entry['break_start'],
                'break_end': entry['break_end'],
                'total_hours': round(total_hours, 2),
                'location': entry['location'],
                'notes': entry['notes'],
                'created_at': entry['created_at']
            })
        
        return jsonify({
            'success': True,
            'time_entries': entries_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Enhanced Time Tracking with Arbeitsrecht Rules
@app.route('/api/monteur/clock-in', methods=['POST'])
def clock_in():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        location = data.get('location', 'Standort')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Prüfe ob bereits eingestempelt
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ? AND clock_out IS NULL
        ''', (session.get('user_id'), today))
        
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Bereits eingestempelt'}), 400
        
        # Einstempeln
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO time_entries (user_id, clock_in, location, notes)
            VALUES (?, ?, ?, ?)
        ''', (session.get('user_id'), current_time, location, 'Eingestempelt'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Erfolgreich eingestempelt um {datetime.now().strftime("%H:%M")}',
            'clock_in': current_time
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktiven Eintrag finden
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ? AND clock_out IS NULL
        ''', (session.get('user_id'), today))
        
        entry = cursor.fetchone()
        if not entry:
            return jsonify({'success': False, 'error': 'Nicht eingestempelt'}), 400
        
        # Ausstempeln
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        clock_in_time = datetime.strptime(entry['clock_in'], '%Y-%m-%d %H:%M:%S')
        clock_out_time = datetime.strptime(current_time, '%Y-%m-%d %H:%M:%S')
        
        # Arbeitszeit berechnen
        work_duration = clock_out_time - clock_in_time
        total_hours = work_duration.total_seconds() / 3600
        
        # Pausenzeit abziehen (falls vorhanden)
        break_time = 0
        if entry['break_start'] and entry['break_end']:
            break_start = datetime.strptime(entry['break_start'], '%Y-%m-%d %H:%M:%S')
            break_end = datetime.strptime(entry['break_end'], '%Y-%m-%d %H:%M:%S')
            break_duration = break_end - break_start
            break_time = break_duration.total_seconds() / 3600
        
        net_work_hours = total_hours - break_time
        
        # Arbeitsrechtliche Prüfungen
        warnings = []
        errors = []
        
        # 8,5h Regel
        if net_work_hours > 8.5:
            errors.append(f'Arbeitszeit von {net_work_hours:.1f}h überschreitet 8,5h-Grenze')
        elif net_work_hours > 8.0:
            warnings.append(f'Warnung: {net_work_hours:.1f}h gearbeitet (über 8h)')
        
        # 10h Grenze
        if net_work_hours > 10:
            errors.append(f'Arbeitszeit von {net_work_hours:.1f}h überschreitet 10h-Grenze')
        
        # Pausenregelung
        if net_work_hours > 6 and break_time < 0.5:
            warnings.append('Pause von mindestens 30 Minuten erforderlich bei über 6h Arbeit')
        
        # Update Eintrag
        cursor.execute('''
            UPDATE time_entries 
            SET clock_out = ?, notes = ?, total_hours = ?
            WHERE id = ?
        ''', (current_time, notes, round(net_work_hours, 2), entry['id']))
        
        conn.commit()
        conn.close()
        
        result = {
            'success': True,
            'message': f'Erfolgreich ausgestempelt um {datetime.now().strftime("%H:%M")}',
            'total_hours': round(net_work_hours, 2),
            'break_time': round(break_time, 2),
            'warnings': warnings,
            'errors': errors
        }
        
        if errors:
            result['success'] = False
            result['message'] = 'Ausstempeln mit Warnungen'
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/break-start', methods=['POST'])
def start_break():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktiven Eintrag finden
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ? AND clock_out IS NULL
        ''', (session.get('user_id'), today))
        
        entry = cursor.fetchone()
        if not entry:
            return jsonify({'success': False, 'error': 'Nicht eingestempelt'}), 400
        
        if entry['break_start'] and not entry['break_end']:
            return jsonify({'success': False, 'error': 'Pause bereits gestartet'}), 400
        
        # Pause starten
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            UPDATE time_entries 
            SET break_start = ?
            WHERE id = ?
        ''', (current_time, entry['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Pause gestartet um {datetime.now().strftime("%H:%M")}'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/break-end', methods=['POST'])
def end_break():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktiven Eintrag finden
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ? AND clock_out IS NULL
        ''', (session.get('user_id'), today))
        
        entry = cursor.fetchone()
        if not entry:
            return jsonify({'success': False, 'error': 'Nicht eingestempelt'}), 400
        
        if not entry['break_start']:
            return jsonify({'success': False, 'error': 'Keine Pause gestartet'}), 400
        
        if entry['break_end']:
            return jsonify({'success': False, 'error': 'Pause bereits beendet'}), 400
        
        # Pause beenden
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            UPDATE time_entries 
            SET break_end = ?
            WHERE id = ?
        ''', (current_time, entry['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Pause beendet um {datetime.now().strftime("%H:%M")}'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/current-status')
def get_current_status():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktiven Eintrag finden
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ? AND clock_out IS NULL
        ''', (session.get('user_id'), today))
        
        entry = cursor.fetchone()
        conn.close()
        
        if not entry:
            return jsonify({
                'success': True,
                'is_working': False,
                'break_status': 'no_break',
                'status': 'ausgestempelt'
            })
        
        # Arbeitszeit berechnen
        clock_in_time = datetime.strptime(entry['clock_in'], '%Y-%m-%d %H:%M:%S')
        current_time = datetime.now()
        work_duration = current_time - clock_in_time
        total_hours = work_duration.total_seconds() / 3600
        
        # Pausenstatus
        break_status = 'no_break'
        if entry['break_start'] and not entry['break_end']:
            break_status = 'on_break'
        elif entry['break_start'] and entry['break_end']:
            break_status = 'break_completed'
        
        # Warnungen
        warnings = []
        if total_hours > 8.0:
            warnings.append(f'Warnung: {total_hours:.1f}h gearbeitet (über 8h)')
        if total_hours > 8.5:
            warnings.append(f'Kritisch: {total_hours:.1f}h gearbeitet (über 8,5h)')
        if total_hours > 10:
            warnings.append(f'Blockiert: {total_hours:.1f}h gearbeitet (über 10h)')
        
        return jsonify({
            'success': True,
            'is_working': True,
            'break_status': break_status,
            'status': 'eingestempelt',
            'clock_in': entry['clock_in'],
            'total_hours': round(total_hours, 2),
            'warnings': warnings,
            'location': entry['location']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/orders')
def get_monteur_orders():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM orders 
            WHERE assigned_to = ? 
            ORDER BY created_date DESC
        ''', (user_id,))
        orders = cursor.fetchall()
        conn.close()
        
        orders_list = []
        for order in orders:
            orders_list.append({
                'id': order['id'],
                'title': order['title'],
                'description': order['description'],
                'customer': order['customer'],
                'location': order['location'],
                'order_type': order['order_type'],
                'priority': order['priority'],
                'status': order['status'],
                'assigned_to': order['assigned_to'],
                'created_date': order['created_date'],
                'due_date': order['due_date']
            })
        
        return jsonify({
            'success': True,
            'orders': orders_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'error': 'Status erforderlich'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE orders 
            SET status = ? 
            WHERE id = ? AND assigned_to = ?
        ''', (new_status, order_id, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auftragsstatus erfolgreich aktualisiert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders')
def get_all_orders():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT o.*, u.name as assigned_name 
            FROM orders o 
            LEFT JOIN users u ON o.assigned_to = u.id 
            ORDER BY o.created_date DESC
        ''')
        orders = cursor.fetchall()
        conn.close()
        
        orders_list = []
        for order in orders:
            orders_list.append({
                'id': order['id'],
                'title': order['title'],
                'description': order['description'],
                'customer': order['customer'],
                'location': order['location'],
                'order_type': order['order_type'],
                'priority': order['priority'],
                'status': order['status'],
                'assigned_to': order['assigned_to'],
                'assigned_name': order['assigned_name'],
                'created_date': order['created_date'],
                'due_date': order['due_date']
            })
        
        return jsonify({
            'success': True,
            'orders': orders_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders', methods=['POST'])
def create_order():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (title, description, customer, location, order_type, priority, status, assigned_to, created_date, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('description'),
            data.get('customer'),
            data.get('location'),
            data.get('order_type'),
            data.get('priority'),
            'new',
            data.get('assigned_to'),
            datetime.now().date().isoformat(),
            data.get('due_date')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update fields
        update_fields = []
        params = []
        
        if 'assigned_to' in data:
            update_fields.append('assigned_to = ?')
            params.append(data['assigned_to'])
        
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
        
        if update_fields:
            params.append(order_id)
            cursor.execute(f'''
                UPDATE orders 
                SET {', '.join(update_fields)}
                WHERE id = ?
            ''', params)
            conn.commit()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich aktualisiert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies')
def get_emergencies():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT e.*, u.name as assigned_name 
            FROM emergencies e 
            LEFT JOIN users u ON e.assigned_to = u.id 
            ORDER BY e.reported_at DESC
        ''')
        emergencies = cursor.fetchall()
        conn.close()
        
        emergencies_list = []
        for emergency in emergencies:
            emergencies_list.append({
                'id': emergency['id'],
                'title': emergency['title'],
                'description': emergency['description'],
                'location': emergency['location'],
                'priority': emergency['priority'],
                'status': emergency['status'],
                'assigned_to': emergency['assigned_to'],
                'assigned_name': emergency['assigned_name'],
                'reported_at': emergency['reported_at']
            })
        
        return jsonify({
            'success': True,
            'emergencies': emergencies_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies', methods=['POST'])
def create_emergency():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO emergencies (title, description, location, priority, status, assigned_to, reported_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('description'),
            data.get('location'),
            data.get('priority'),
            'active',
            data.get('assigned_to'),
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Notfall erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/customers')
def get_customers():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers ORDER BY name')
        customers = cursor.fetchall()
        conn.close()
        
        customers_list = []
        for customer in customers:
            customers_list.append({
                'id': customer['id'],
                'name': customer['name'],
                'contact_person': customer['contact_person'],
                'email': customer['email'],
                'phone': customer['phone'],
                'address': customer['address']
            })
        
        return jsonify({
            'success': True,
            'customers': customers_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/users')
def get_users():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, role FROM users ORDER BY name')
        users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'name': user['name'],
                'role': user['role']
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Frontend Routes
@app.route('/')
def serve_frontend():
    return send_from_directory('build', 'index.html')

@app.route('/static/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('build/static', filename)

@app.route('/static/js/<path:filename>')
def serve_js_files(filename):
    return send_from_directory('build/static/js', filename)

@app.route('/static/css/<path:filename>')
def serve_css_files(filename):
    return send_from_directory('build/static/css', filename)

@app.route('/favicon.ico')
def serve_favicon():
    return send_from_directory('build', 'favicon.ico')

@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('build', 'manifest.json')

@app.route('/logo192.png')
def serve_logo192():
    return send_from_directory('build', 'logo192.png')

@app.route('/logo512.png')
def serve_logo512():
    return send_from_directory('build', 'logo512.png')

@app.route('/<path:path>')
def serve_react_routes(path):
    # Alle anderen Pfade zur index.html für React Router
    return send_from_directory('build', 'index.html')

# Work Breaks CRUD
@app.route('/api/monteur/work-breaks', methods=['GET'])
def get_work_breaks():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM work_breaks 
            WHERE user_id = ? 
            ORDER BY break_start DESC
        ''', (session.get('user_id'),))
        breaks = cursor.fetchall()
        conn.close()
        
        breaks_list = []
        for break_entry in breaks:
            breaks_list.append({
                'id': break_entry['id'],
                'user_id': break_entry['user_id'],
                'break_start': break_entry['break_start'],
                'break_end': break_entry['break_end'],
                'break_type': break_entry['break_type'],
                'notes': break_entry['notes'],
                'created_at': break_entry['created_at']
            })
        
        return jsonify({
            'success': True,
            'work_breaks': breaks_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/work-breaks', methods=['POST'])
def create_work_break():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO work_breaks (user_id, break_start, break_end, break_type, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session.get('user_id'),
            data.get('break_start'),
            data.get('break_end'),
            data.get('break_type', 'pause'),
            data.get('notes')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Pause erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/work-breaks/<int:break_id>', methods=['PUT'])
def update_work_break(break_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE work_breaks 
            SET break_start = ?, break_end = ?, break_type = ?, notes = ?
            WHERE id = ? AND user_id = ?
        ''', (
            data.get('break_start'),
            data.get('break_end'),
            data.get('break_type'),
            data.get('notes'),
            break_id,
            session.get('user_id')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Pause erfolgreich aktualisiert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/work-breaks/<int:break_id>', methods=['DELETE'])
def delete_work_break(break_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM work_breaks 
            WHERE id = ? AND user_id = ?
        ''', (break_id, session.get('user_id')))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Pause erfolgreich gelöscht'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Vacation Requests CRUD
@app.route('/api/monteur/vacation-requests', methods=['GET'])
def get_vacation_requests():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT vr.*, u.name as approved_by_name 
            FROM vacation_requests vr 
            LEFT JOIN users u ON vr.approved_by = u.id
            WHERE vr.user_id = ? 
            ORDER BY vr.created_at DESC
        ''', (session.get('user_id'),))
        requests = cursor.fetchall()
        conn.close()
        
        requests_list = []
        for req in requests:
            requests_list.append({
                'id': req['id'],
                'user_id': req['user_id'],
                'start_date': req['start_date'],
                'end_date': req['end_date'],
                'request_type': req['request_type'],
                'status': req['status'],
                'notes': req['notes'],
                'approved_by': req['approved_by'],
                'approved_by_name': req['approved_by_name'],
                'created_at': req['created_at']
            })
        
        return jsonify({
            'success': True,
            'vacation_requests': requests_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/vacation-requests', methods=['POST'])
def create_vacation_request():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vacation_requests (user_id, start_date, end_date, request_type, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session.get('user_id'),
            data.get('start_date'),
            data.get('end_date'),
            data.get('request_type', 'vacation'),
            data.get('notes')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Urlaubsantrag erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Work Events CRUD
@app.route('/api/monteur/work-events', methods=['GET'])
def get_work_events():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM work_events 
            WHERE user_id = ? 
            ORDER BY event_date DESC, start_time DESC
        ''', (session.get('user_id'),))
        events = cursor.fetchall()
        conn.close()
        
        events_list = []
        for event in events:
            events_list.append({
                'id': event['id'],
                'user_id': event['user_id'],
                'event_type': event['event_type'],
                'description': event['description'],
                'location': event['location'],
                'event_date': event['event_date'],
                'start_time': event['start_time'],
                'end_time': event['end_time'],
                'created_at': event['created_at']
            })
        
        return jsonify({
            'success': True,
            'work_events': events_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/work-events', methods=['POST'])
def create_work_event():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO work_events (user_id, event_type, description, location, event_date, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            session.get('user_id'),
            data.get('event_type'),
            data.get('description'),
            data.get('location'),
            data.get('event_date'),
            data.get('start_time'),
            data.get('end_time')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Arbeitsereignis erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Enhanced Orders CRUD
@app.route('/api/monteur/orders/<int:order_id>', methods=['PUT'])
def update_monteur_order(order_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update fields
        update_fields = []
        params = []
        
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
        
        if 'start_time' in data:
            update_fields.append('start_time = ?')
            params.append(data['start_time'])
        
        if 'end_time' in data:
            update_fields.append('end_time = ?')
            params.append(data['end_time'])
        
        if update_fields:
            params.extend([order_id, session.get('user_id')])
            cursor.execute(f'''
                UPDATE orders 
                SET {', '.join(update_fields)}
                WHERE id = ? AND assigned_to = ?
            ''', params)
            conn.commit()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich aktualisiert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Enhanced Time Entries CRUD
@app.route('/api/monteur/time-entries', methods=['POST'])
def create_time_entry():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO time_entries (user_id, clock_in, clock_out, location, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session.get('user_id'),
            data.get('clock_in'),
            data.get('clock_out'),
            data.get('location'),
            data.get('notes')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich erstellt'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['PUT'])
def update_time_entry(entry_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE time_entries 
            SET clock_in = ?, clock_out = ?, location = ?, notes = ?
            WHERE id = ? AND user_id = ?
        ''', (
            data.get('clock_in'),
            data.get('clock_out'),
            data.get('location'),
            data.get('notes'),
            entry_id,
            session.get('user_id')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich aktualisiert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['DELETE'])
def delete_time_entry(entry_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM time_entries 
            WHERE id = ? AND user_id = ?
        ''', (entry_id, session.get('user_id')))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich gelöscht'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/work-summary')
def get_work_summary():
    if not session.get('user_id'):
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktuelle Woche
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND date(clock_in) >= ? AND clock_out IS NOT NULL
        ''', (session.get('user_id'), week_start.strftime('%Y-%m-%d')))
        
        entries = cursor.fetchall()
        conn.close()
        
        # Zusammenfassung berechnen
        total_hours = 0
        regular_hours = 0
        overtime_hours = 0
        days_worked = 0
        
        for entry in entries:
            if entry['total_hours']:
                hours = entry['total_hours']
                total_hours += hours
                
                if hours <= 8.0:
                    regular_hours += hours
                else:
                    regular_hours += 8.0
                    overtime_hours += (hours - 8.0)
                
                days_worked += 1
        
        # Durchschnitt pro Tag
        avg_hours = total_hours / days_worked if days_worked > 0 else 0
        
        return jsonify({
            'success': True,
            'summary': {
                'total_hours': round(total_hours, 2),
                'regular_hours': round(regular_hours, 2),
                'overtime_hours': round(overtime_hours, 2),
                'days_worked': days_worked,
                'avg_hours_per_day': round(avg_hours, 2),
                'week_start': week_start.strftime('%Y-%m-%d')
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False) 