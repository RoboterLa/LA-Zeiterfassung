from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'zeiterfassung-secret-key-2025'
CORS(app, supports_credentials=True)

# Mock-Daten für Azure (ohne Datenbank)
MOCK_USERS = [
    {'id': 1, 'email': 'monteur', 'password': 'monteur', 'name': 'Monteur', 'role': 'monteur'},
    {'id': 2, 'email': 'buero', 'password': 'buero', 'name': 'Büro', 'role': 'buero'}
]

MOCK_TIME_ENTRIES = [
    {'id': 1, 'user_id': 1, 'clock_in': '08:00:00', 'clock_out': '17:00:00', 'location': 'Hauptstraße 15, München', 'notes': 'Wartung Aufzug'},
    {'id': 2, 'user_id': 1, 'clock_in': '07:30:00', 'clock_out': None, 'location': 'Marienplatz 1, München', 'notes': 'Reparatur'}
]

MOCK_ORDERS = [
    {'id': 1, 'title': 'Wartung Aufzug Hauptstraße 15', 'description': 'Regelmäßige Wartung', 'customer': 'Gebäudeverwaltung München', 'location': 'Hauptstraße 15, München', 'order_type': 'maintenance', 'priority': 'normal', 'status': 'assigned', 'assigned_to': 1, 'created_date': '2025-01-20', 'due_date': '2025-01-25'},
    {'id': 2, 'title': 'Reparatur Aufzug Marienplatz', 'description': 'Dringende Reparatur', 'customer': 'Stadt München', 'location': 'Marienplatz 1, München', 'order_type': 'repair', 'priority': 'urgent', 'status': 'in_progress', 'assigned_to': 1, 'created_date': '2025-01-19', 'due_date': '2025-01-22'}
]

MOCK_EMERGENCIES = [
    {'id': 1, 'title': 'Aufzug steckt fest', 'description': 'Aufzug ist stecken geblieben', 'location': 'Marienplatz 1, München', 'priority': 'urgent', 'status': 'active', 'assigned_to': 1, 'reported_at': '2025-01-20 10:30:00'}
]

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
        
        user = next((u for u in MOCK_USERS if u['email'] == email and u['password'] == password), None)
        
        if user:
            session['user_id'] = user['id']
            session['user_role'] = user['role']
            return jsonify({
                'success': True,
                'message': 'Erfolgreich angemeldet',
                'user': {k: v for k, v in user.items() if k != 'password'}
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
        user = next((u for u in MOCK_USERS if u['id'] == user_id), None)
        
        if user:
            return jsonify({
                'success': True,
                'user': {k: v for k, v in user.items() if k != 'password'}
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
        entries = [e for e in MOCK_TIME_ENTRIES if e['user_id'] == user_id]
        return jsonify({
            'success': True,
            'time_entries': entries
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-in', methods=['POST'])
def clock_in():
    try:
        data = request.get_json()
        location = data.get('location', 'Standort')
        
        # Mock clock-in
        return jsonify({
            'success': True,
            'message': f'Erfolgreich eingestempelt um {datetime.now().strftime("%H:%M")}',
            'location': location
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    try:
        data = request.get_json()
        notes = data.get('notes', '')
        
        # Mock clock-out
        return jsonify({
            'success': True,
            'message': f'Erfolgreich ausgestempelt um {datetime.now().strftime("%H:%M")}',
            'notes': notes
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/current-status')
def get_current_status():
    try:
        # Mock current status
        return jsonify({
            'success': True,
            'is_working': False,
            'current_time': datetime.now().strftime("%H:%M:%S")
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/orders')
def get_monteur_orders():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        orders = [o for o in MOCK_ORDERS if o['assigned_to'] == user_id]
        return jsonify({
            'success': True,
            'orders': orders
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        # Mock status update
        return jsonify({
            'success': True,
            'message': f'Auftrag {order_id} Status auf {new_status} geändert'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders')
def get_all_orders():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        return jsonify({
            'success': True,
            'orders': MOCK_ORDERS
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} ist erforderlich'}), 400
        
        new_order = {
            'id': len(MOCK_ORDERS) + 1,
            'title': data['title'],
            'description': data.get('description'),
            'customer': data.get('customer'),
            'location': data['location'],
            'order_type': data.get('order_type', 'maintenance'),
            'priority': data.get('priority', 'normal'),
            'status': data.get('status', 'new'),
            'assigned_to': data.get('assigned_to'),
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': data.get('due_date')
        }
        MOCK_ORDERS.append(new_order)
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich erstellt'
        })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies')
def get_emergencies():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        return jsonify({
            'success': True,
            'emergencies': MOCK_EMERGENCIES
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies', methods=['POST'])
def create_emergency():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} ist erforderlich'}), 400
        
        new_emergency = {
            'id': len(MOCK_EMERGENCIES) + 1,
            'title': data['title'],
            'description': data.get('description'),
            'location': data['location'],
            'priority': data.get('priority', 'normal'),
            'status': data.get('status', 'active'),
            'assigned_to': None,
            'reported_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        MOCK_EMERGENCIES.append(new_emergency)
        
        return jsonify({
            'success': True,
            'message': 'Notfall erfolgreich erstellt'
        })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/customers')
def get_customers():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        customers = [
            {'id': 1, 'name': 'Gebäudeverwaltung München', 'contact': 'Herr Meyer', 'phone': '089-123456'},
            {'id': 2, 'name': 'Stadt München', 'contact': 'Frau Schmidt', 'phone': '089-654321'},
            {'id': 3, 'name': 'Bauprojekt GmbH', 'contact': 'Herr Weber', 'phone': '089-789123'}
        ]
        return jsonify({
            'success': True,
            'customers': customers
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/users')
def get_users():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        users = [{'id': u['id'], 'name': u['name'], 'role': u['role']} for u in MOCK_USERS]
        return jsonify({
            'success': True,
            'users': users
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Frontend Routes
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

@app.route('/')
def serve_frontend():
    return send_from_directory('build', 'index.html')

@app.route('/<path:path>')
def serve_react_routes(path):
    # Alle anderen Pfade zur index.html für React Router
    return send_from_directory('build', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
