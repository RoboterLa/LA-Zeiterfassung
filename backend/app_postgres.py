import os
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
from database_postgres import PostgreSQLDatabase

app = Flask(__name__, static_folder='static')
app.secret_key = 'zeiterfassung-secret-key-2025'
CORS(app, supports_credentials=True)

db = PostgreSQLDatabase()

@app.route('/health')
def health_check():
    return jsonify({
        'service': 'zeiterfassung-app',
        'status': 'healthy',
        'database': db.get_database_status(),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = db.authenticate_user(username, password)
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'message': 'Ungültige Anmeldedaten'}), 401

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json()
    username = data.get('username')  # Frontend sendet 'username'
    password = data.get('password')
    
    user = db.authenticate_user(username, password)
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'user': user, 'token': 'dummy-token'})
    else:
        return jsonify({'success': False, 'message': 'Ungültige Anmeldedaten'}), 401

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user_id = session.get('user_id')
    if user_id:
        # Hier sollten wir den User aus der DB holen, aber für jetzt verwenden wir die Session-Daten
        user = {
            'id': user_id,
            'username': session.get('username'),
            'role': session.get('role')
        }
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401

@app.route('/api/update-passwords', methods=['POST'])
def update_passwords():
    """Temporäre Route zum Aktualisieren der Passwörter"""
    try:
        conn = db.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users SET password_hash = 'monteur' WHERE username = 'monteur'
                """)
                cursor.execute("""
                    UPDATE users SET password_hash = 'buero' WHERE username = 'buero'
                """)
                conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Passwörter aktualisiert'})
        else:
            return jsonify({'success': False, 'message': 'Keine Datenbankverbindung'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/time-entries', methods=['GET'])
def get_time_entries():
    user_id = session.get('user_id')
    entries = db.get_time_entries(user_id)
    return jsonify(entries)

@app.route('/api/time-entries', methods=['POST'])
def add_time_entry():
    data = request.get_json()
    user_id = session.get('user_id')
    
    result = db.add_time_entry(
        user_id=user_id,
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        description=data.get('description'),
        order_id=data.get('order_id')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/time-entries/<int:entry_id>', methods=['PUT'])
def update_time_entry(entry_id):
    data = request.get_json()
    
    result = db.update_time_entry(
        entry_id=entry_id,
        end_time=data.get('end_time'),
        description=data.get('description')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

# Monteur-spezifische Routen (Frontend erwartet diese)
@app.route('/api/monteur/time-entries', methods=['GET'])
def get_monteur_time_entries():
    user_id = session.get('user_id')
    entries = db.get_time_entries(user_id)
    return jsonify({'success': True, 'entries': entries})

@app.route('/api/monteur/time-entries', methods=['POST'])
def add_monteur_time_entry():
    data = request.get_json()
    user_id = session.get('user_id')
    
    result = db.add_time_entry(
        user_id=user_id,
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        description=data.get('description'),
        order_id=data.get('order_id')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['PUT'])
def update_monteur_time_entry(entry_id):
    data = request.get_json()
    
    result = db.update_time_entry(
        entry_id=entry_id,
        end_time=data.get('end_time'),
        description=data.get('description')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['DELETE'])
def delete_monteur_time_entry(entry_id):
    result = db.delete_time_entry(entry_id)
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/monteur/clock-in', methods=['POST'])
def monteur_clock_in():
    """Monteur stempelt ein"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    # Aktueller Zeitstempel
    start_time = datetime.now().isoformat()
    
    result = db.add_time_entry(
        user_id=user_id,
        start_time=start_time,
        description='Eingestempelt'
    )
    
    if result['success']:
        return jsonify({'success': True, 'message': 'Erfolgreich eingestempelt'})
    else:
        return jsonify(result), 400

@app.route('/api/monteur/clock-out', methods=['POST'])
def monteur_clock_out():
    """Monteur stempelt aus"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    # Aktueller Zeitstempel
    end_time = datetime.now().isoformat()
    
    # Finde den letzten offenen Eintrag für diesen Benutzer
    entries = db.get_time_entries(user_id)
    open_entries = [e for e in entries if not e.get('end_time')]
    
    if open_entries:
        latest_entry = open_entries[0]  # Nehm den neuesten
        result = db.update_time_entry(
            entry_id=latest_entry['id'],
            end_time=end_time,
            description=latest_entry.get('description', '') + ' - Ausgestempelt'
        )
        
        if result['success']:
            return jsonify({'success': True, 'message': 'Erfolgreich ausgestempelt'})
        else:
            return jsonify(result), 400
    else:
        return jsonify({'success': False, 'message': 'Kein offener Eintrag gefunden'}), 400

# Customer Entries API (Kundenarbeiten)
@app.route('/api/monteur/customer-entries', methods=['GET'])
def get_customer_entries():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    try:
        conn = db.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, customer_name, customer_address, work_type, description, 
                           hours, materials, order_id, date, created_at
                    FROM customer_entries 
                    WHERE user_id = %s
                    ORDER BY date DESC, created_at DESC
                """, (user_id,))
                
                entries = []
                for row in cursor.fetchall():
                    entries.append({
                        'id': row[0],
                        'customer_name': row[1],
                        'customer_address': row[2],
                        'work_type': row[3],
                        'description': row[4],
                        'hours': row[5],
                        'materials': row[6],
                        'order_id': row[7],
                        'date': row[8],
                        'created_at': row[9].isoformat() if row[9] else None
                    })
                
                conn.close()
                return jsonify({'success': True, 'entries': entries})
        else:
            return jsonify({'success': False, 'message': 'Datenbankfehler'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/monteur/customer-entries', methods=['POST'])
def add_customer_entry():
    data = request.get_json()
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    try:
        conn = db.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO customer_entries 
                    (user_id, customer_name, customer_address, work_type, description, 
                     hours, materials, order_id, date, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_id,
                    data.get('customer_name'),
                    data.get('customer_address'),
                    data.get('work_type'),
                    data.get('description'),
                    data.get('hours'),
                    data.get('materials'),
                    data.get('order_id'),
                    data.get('date'),
                    datetime.now()
                ))
                
                entry_id = cursor.fetchone()[0]
                conn.commit()
                conn.close()
                
                return jsonify({
                    'success': True, 
                    'message': 'Kundenauftrag erfolgreich erstellt',
                    'entry_id': entry_id
                })
        else:
            return jsonify({'success': False, 'message': 'Datenbankfehler'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/monteur/customer-entries/<int:entry_id>', methods=['PUT'])
def update_customer_entry(entry_id):
    data = request.get_json()
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    try:
        conn = db.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE customer_entries 
                    SET customer_name = %s, customer_address = %s, work_type = %s,
                        description = %s, hours = %s, materials = %s, order_id = %s, date = %s
                    WHERE id = %s AND user_id = %s
                """, (
                    data.get('customer_name'),
                    data.get('customer_address'),
                    data.get('work_type'),
                    data.get('description'),
                    data.get('hours'),
                    data.get('materials'),
                    data.get('order_id'),
                    data.get('date'),
                    entry_id,
                    user_id
                ))
                
                if cursor.rowcount > 0:
                    conn.commit()
                    conn.close()
                    return jsonify({
                        'success': True, 
                        'message': 'Kundenauftrag erfolgreich aktualisiert'
                    })
                else:
                    conn.close()
                    return jsonify({'success': False, 'message': 'Eintrag nicht gefunden'}), 404
        else:
            return jsonify({'success': False, 'message': 'Datenbankfehler'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/monteur/customer-entries/<int:entry_id>', methods=['DELETE'])
def delete_customer_entry(entry_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Nicht angemeldet'}), 401
    
    try:
        conn = db.get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM customer_entries 
                    WHERE id = %s AND user_id = %s
                """, (entry_id, user_id))
                
                if cursor.rowcount > 0:
                    conn.commit()
                    conn.close()
                    return jsonify({
                        'success': True, 
                        'message': 'Kundenauftrag erfolgreich gelöscht'
                        })
                else:
                    conn.close()
                    return jsonify({'success': False, 'message': 'Eintrag nicht gefunden'}), 404
        else:
            return jsonify({'success': False, 'message': 'Datenbankfehler'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = db.get_orders()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.get_json()
    
    result = db.add_order(
        order_number=data.get('order_number'),
        customer_name=data.get('customer_name'),
        description=data.get('description')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/emergencies', methods=['GET'])
def get_emergencies():
    emergencies = db.get_emergencies()
    return jsonify(emergencies)

@app.route('/api/emergencies', methods=['POST'])
def add_emergency():
    data = request.get_json()
    
    result = db.add_emergency(
        title=data.get('title'),
        description=data.get('description'),
        priority=data.get('priority', 'medium')
    )
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

# Serve static files with cache busting
@app.route('/static/<path:filename>')
def static_files(filename):
    # First try to find file in static/static/ (nested structure)
    nested_static_path = os.path.join(app.static_folder, 'static', filename)
    if os.path.exists(nested_static_path):
        response = send_from_directory(os.path.join(app.static_folder, 'static'), filename)
        # Add cache busting headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    # If not found in nested, try direct static folder
    direct_static_path = os.path.join(app.static_folder, filename)
    if os.path.exists(direct_static_path):
        response = send_from_directory(app.static_folder, filename)
        # Add cache busting headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    return "Not Found", 404

# Serve nested static files (static/static/)
@app.route('/static/static/<path:filename>')
def nested_static_files(filename):
    nested_static_folder = os.path.join(app.static_folder, 'static', 'static')
    static_path = os.path.join(nested_static_folder, filename)
    if not os.path.exists(static_path):
        return "Not Found", 404
    
    response = send_from_directory(nested_static_folder, filename)
    # Add cache busting headers
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Catch-all route for SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Don't serve index.html for API routes
    if path.startswith('api/') or path.startswith('auth/') or path == 'health':
        return "Not Found", 404
    
    # Don't serve index.html for static files
    if path.startswith('static/'):
        return "Not Found", 404
    
    # Serve index.html for all other routes (SPA routing)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 