import os
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
from database_postgres import PostgreSQLDatabase

app = Flask(__name__, static_folder='build')
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
    username = data.get('email')  # Frontend sendet 'email' statt 'username'
    password = data.get('password')
    
    user = db.authenticate_user(username, password)
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'user': user})
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
    # Check if file exists in static folder
    static_path = os.path.join(app.static_folder, 'static', filename)
    if not os.path.exists(static_path):
        return "Not Found", 404
    
    response = send_from_directory(os.path.join(app.static_folder, 'static'), filename)
    # Add cache busting headers
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

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
    
    # Serve index.html for all other routes (SPA routing)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 