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
    {'id': 1, 'user_id': 1, 'start_time': '2025-01-20T08:00:00', 'end_time': '2025-01-20T17:00:00', 'description': 'Wartung Aufzug', 'order_id': 'AUF-001'},
    {'id': 2, 'user_id': 1, 'start_time': '2025-01-20T07:30:00', 'end_time': None, 'description': 'Reparatur', 'order_id': 'AUF-002'}
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
    """Health Check Endpoint für Backend-Status"""
    return jsonify({
        'service': 'zeiterfassung-app',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authentifizierung für Benutzer"""
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
        return jsonify({'success': False, 'error': 'Server-Fehler bei der Anmeldung'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Abmeldung für Benutzer"""
    session.clear()
    return jsonify({'success': True, 'message': 'Erfolgreich abgemeldet'})

@app.route('/api/auth/me')
def get_current_user():
    """Aktueller angemeldeter Benutzer"""
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
        return jsonify({'success': False, 'error': 'Server-Fehler beim Abrufen des Benutzers'}), 500

@app.route('/api/monteur/time-entries')
def get_time_entries():
    """Zeiteinträge für Monteur abrufen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        entries = [e for e in MOCK_TIME_ENTRIES if e['user_id'] == user_id]
        return jsonify({
            'success': True,
            'entries': entries
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Zeiteinträge'}), 500

@app.route('/api/monteur/time-entries', methods=['POST'])
def create_time_entry():
    """Neuen Zeiteintrag erstellen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        new_entry = {
            'id': len(MOCK_TIME_ENTRIES) + 1,
            'user_id': user_id,
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time'),
            'description': data.get('description', ''),
            'order_id': data.get('order_id', '')
        }
        MOCK_TIME_ENTRIES.append(new_entry)
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich erstellt',
            'entry': new_entry
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Erstellen des Zeiteintrags'}), 500

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['PUT'])
def update_time_entry(entry_id):
    """Zeiteintrag bearbeiten"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        entry = next((e for e in MOCK_TIME_ENTRIES if e['id'] == entry_id and e['user_id'] == user_id), None)
        
        if not entry:
            return jsonify({'success': False, 'error': 'Zeiteintrag nicht gefunden'}), 404
        
        entry.update({
            'start_time': data.get('start_time', entry['start_time']),
            'end_time': data.get('end_time', entry['end_time']),
            'description': data.get('description', entry['description']),
            'order_id': data.get('order_id', entry['order_id'])
        })
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich aktualisiert',
            'entry': entry
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Aktualisieren des Zeiteintrags'}), 500

@app.route('/api/monteur/time-entries/<int:entry_id>', methods=['DELETE'])
def delete_time_entry(entry_id):
    """Zeiteintrag löschen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        global MOCK_TIME_ENTRIES
        MOCK_TIME_ENTRIES = [e for e in MOCK_TIME_ENTRIES if not (e['id'] == entry_id and e['user_id'] == user_id)]
        
        return jsonify({
            'success': True,
            'message': 'Zeiteintrag erfolgreich gelöscht'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Löschen des Zeiteintrags'}), 500

@app.route('/api/monteur/clock-in', methods=['POST'])
def clock_in():
    """Einstempeln für Monteur"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        # TODO: Implementiere echte Einstempel-Logik
        return jsonify({
            'success': True,
            'message': 'Erfolgreich eingestempelt',
            'clock_in_time': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Einstempeln'}), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    """Ausstempeln für Monteur"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        # TODO: Implementiere echte Ausstempel-Logik
        return jsonify({
            'success': True,
            'message': 'Erfolgreich ausgestempelt',
            'clock_out_time': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Ausstempeln'}), 500

@app.route('/api/monteur/current-status')
def get_current_status():
    """Aktueller Arbeitsstatus für Monteur"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        # TODO: Implementiere echte Status-Logik
        return jsonify({
            'success': True,
            'is_working': False,
            'is_on_break': False,
            'work_start_time': None,
            'break_start_time': None
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen des Status'}), 500

@app.route('/api/monteur/orders')
def get_monteur_orders():
    """Aufträge für Monteur abrufen"""
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
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Aufträge'}), 500

@app.route('/api/monteur/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Auftragsstatus aktualisieren"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        order = next((o for o in MOCK_ORDERS if o['id'] == order_id and o['assigned_to'] == user_id), None)
        if not order:
            return jsonify({'success': False, 'error': 'Auftrag nicht gefunden'}), 404
        
        order['status'] = new_status
        
        return jsonify({
            'success': True,
            'message': 'Auftragsstatus erfolgreich aktualisiert',
            'order': order
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Aktualisieren des Auftragsstatus'}), 500

@app.route('/api/buero/orders')
def get_all_orders():
    """Alle Aufträge für Büro abrufen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        return jsonify({
            'success': True,
            'orders': MOCK_ORDERS
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Aufträge'}), 500

@app.route('/api/buero/orders', methods=['POST'])
def create_order():
    """Neuen Auftrag erstellen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        new_order = {
            'id': len(MOCK_ORDERS) + 1,
            'title': data.get('title'),
            'description': data.get('description'),
            'customer': data.get('customer'),
            'location': data.get('location'),
            'order_type': data.get('order_type', 'maintenance'),
            'priority': data.get('priority', 'normal'),
            'status': 'assigned',
            'assigned_to': data.get('assigned_to'),
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': data.get('due_date')
        }
        MOCK_ORDERS.append(new_order)
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich erstellt',
            'order': new_order
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Erstellen des Auftrags'}), 500

@app.route('/api/buero/emergencies')
def get_emergencies():
    """Notfälle für Büro abrufen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        return jsonify({
            'success': True,
            'emergencies': MOCK_EMERGENCIES
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Notfälle'}), 500

@app.route('/api/buero/emergencies', methods=['POST'])
def create_emergency():
    """Neuen Notfall erstellen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        new_emergency = {
            'id': len(MOCK_EMERGENCIES) + 1,
            'title': data.get('title'),
            'description': data.get('description'),
            'location': data.get('location'),
            'priority': data.get('priority', 'urgent'),
            'status': 'active',
            'assigned_to': data.get('assigned_to'),
            'reported_at': datetime.now().isoformat()
        }
        MOCK_EMERGENCIES.append(new_emergency)
        
        return jsonify({
            'success': True,
            'message': 'Notfall erfolgreich erstellt',
            'emergency': new_emergency
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Erstellen des Notfalls'}), 500

@app.route('/api/buero/customers')
def get_customers():
    """Kunden für Büro abrufen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        # TODO: Implementiere echte Kunden-Daten
        mock_customers = [
            {'id': 1, 'name': 'Gebäudeverwaltung München', 'address': 'München', 'contact': 'info@gebaeude.de'},
            {'id': 2, 'name': 'Stadt München', 'address': 'München', 'contact': 'info@muenchen.de'}
        ]
        return jsonify({
            'success': True,
            'customers': mock_customers
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Kunden'}), 500

@app.route('/api/buero/users')
def get_users():
    """Benutzer für Büro abrufen"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        return jsonify({
            'success': True,
            'users': MOCK_USERS
        })
    except Exception as e:
        return jsonify({'success': False, 'error': 'Fehler beim Abrufen der Benutzer'}), 500

# Static file serving
@app.route('/static/<path:filename>')
def serve_static_files(filename):
    """Statische Dateien servieren"""
    return send_from_directory('static', filename)

@app.route('/favicon.ico')
def serve_favicon():
    """Favicon servieren"""
    return send_from_directory('static', 'favicon.ico')

@app.route('/manifest.json')
def serve_manifest():
    """Manifest servieren"""
    return send_from_directory('static', 'manifest.json')

@app.route('/logo192.png')
def serve_logo192():
    """Logo 192x192 servieren"""
    return send_from_directory('static', 'logo192.png')

@app.route('/logo512.png')
def serve_logo512():
    """Logo 512x512 servieren"""
    return send_from_directory('static', 'logo512.png')

@app.route('/')
def serve_frontend():
    """Frontend-Hauptseite servieren"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_react_routes(path):
    """React Router - Alle anderen Routen zur Frontend-App weiterleiten"""
    # Statische Dateien zuerst prüfen
    static_file = os.path.join('static', path)
    if os.path.exists(static_file) and os.path.isfile(static_file):
        return send_from_directory('static', path)
    
    # Ansonsten zur React-App weiterleiten
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 