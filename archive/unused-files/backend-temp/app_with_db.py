from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
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
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM time_entries WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        entries = cursor.fetchall()
        conn.close()
        
        time_entries = []
        for entry in entries:
            time_entries.append({
                'id': entry['id'],
                'user_id': entry['user_id'],
                'clock_in': entry['clock_in'],
                'clock_out': entry['clock_out'],
                'break_start': entry['break_start'],
                'break_end': entry['break_end'],
                'location': entry['location'],
                'notes': entry['notes'],
                'created_at': entry['created_at']
            })
        
        return jsonify({
            'success': True,
            'time_entries': time_entries
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-in', methods=['POST'])
def clock_in():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        location = data.get('location', 'Standort')
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO time_entries (user_id, clock_in, location, notes)
            VALUES (?, ?, ?, ?)
        ''', (user_id, datetime.now().isoformat(), location, notes))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Erfolgreich eingestempelt',
            'clock_in_time': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktuellen offenen Eintrag finden
        cursor.execute('''
            SELECT id FROM time_entries 
            WHERE user_id = ? AND clock_out IS NULL 
            ORDER BY clock_in DESC LIMIT 1
        ''', (user_id,))
        entry = cursor.fetchone()
        
        if entry:
            cursor.execute('''
                UPDATE time_entries 
                SET clock_out = ? 
                WHERE id = ?
            ''', (datetime.now().isoformat(), entry['id']))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Erfolgreich ausgestempelt',
                'clock_out_time': datetime.now().isoformat()
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Kein aktiver Zeiteintrag gefunden'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/current-status')
def get_current_status():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Aktuellen Status ermitteln
        cursor.execute('''
            SELECT * FROM time_entries 
            WHERE user_id = ? AND clock_out IS NULL 
            ORDER BY clock_in DESC LIMIT 1
        ''', (user_id,))
        current_entry = cursor.fetchone()
        
        status = {
            'is_working': False,
            'current_entry': None,
            'total_work_time_today': 0
        }
        
        if current_entry:
            status['is_working'] = True
            status['current_entry'] = {
                'id': current_entry['id'],
                'clock_in': current_entry['clock_in'],
                'location': current_entry['location'],
                'notes': current_entry['notes']
            }
        
        # Arbeitszeit heute berechnen
        today = datetime.now().date()
        cursor.execute('''
            SELECT SUM(
                CASE 
                    WHEN clock_out IS NOT NULL 
                    THEN (julianday(clock_out) - julianday(clock_in)) * 24 * 3600
                    ELSE (julianday('now') - julianday(clock_in)) * 24 * 3600
                END
            ) as total_seconds
            FROM time_entries 
            WHERE user_id = ? AND date(clock_in) = ?
        ''', (user_id, today.isoformat()))
        
        result = cursor.fetchone()
        if result and result['total_seconds']:
            status['total_work_time_today'] = int(result['total_seconds'])
        
        conn.close()
        
        return jsonify({
            'success': True,
            'status': status
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

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False) 