from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
import os
from database import Database

app = Flask(__name__)
app.secret_key = 'zeiterfassung-secret-key-2025'
CORS(app, supports_credentials=True)

# Datenbank initialisieren
db = Database()

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
        
        user = db.get_user_by_credentials(email, password)
        
        if user:
            session['user_id'] = user['id']
            session['user_role'] = user['role']
            return jsonify({
                'success': True,
                'message': 'Erfolgreich angemeldet',
                'user': user
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
        users = db.get_users()
        user = next((u for u in users if u['id'] == user_id), None)
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
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
        entries = db.get_time_entries(user_id)
        return jsonify({
            'success': True,
            'time_entries': entries
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
        notes = data.get('notes')
        
        clock_in_time = datetime.now()
        
        success = db.create_time_entry(user_id, clock_in_time, location, notes)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Erfolgreich eingestempelt',
                'clock_in': clock_in_time.strftime('%H:%M:%S')
            })
        else:
            return jsonify({'success': False, 'error': 'Fehler beim Einstempeln'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/clock-out', methods=['POST'])
def clock_out():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        # Finde den aktuellen offenen Zeiteintrag
        entries = db.get_time_entries(user_id)
        open_entry = next((entry for entry in entries if not entry['clock_out']), None)
        
        if not open_entry:
            return jsonify({'success': False, 'error': 'Kein offener Zeiteintrag gefunden'}), 400
        
        clock_out_time = datetime.now()
        
        success = db.update_time_entry(open_entry['id'], clock_out_time)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Erfolgreich ausgestempelt',
                'clock_out': clock_out_time.strftime('%H:%M:%S')
            })
        else:
            return jsonify({'success': False, 'error': 'Fehler beim Ausstempeln'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/current-status')
def get_current_status():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        entries = db.get_time_entries(user_id)
        open_entry = next((entry for entry in entries if not entry['clock_out']), None)
        
        return jsonify({
            'success': True,
            'is_working': open_entry is not None,
            'current_entry': open_entry
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/monteur/orders')
def get_monteur_orders():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        orders = db.get_orders(user_id)
        return jsonify({
            'success': True,
            'orders': orders
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
        
        success = db.update_order_status(order_id, new_status)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Auftragsstatus aktualisiert'
            })
        else:
            return jsonify({'success': False, 'error': 'Fehler beim Aktualisieren'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Büro APIs
@app.route('/api/buero/orders')
def get_all_orders():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        orders = db.get_orders()  # Alle Aufträge
        return jsonify({
            'success': True,
            'orders': orders
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/orders', methods=['POST'])
def create_order():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        required_fields = ['title', 'customer', 'location', 'order_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} ist erforderlich'}), 400
        
        success = db.create_order(data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Auftrag erfolgreich erstellt'
            })
        else:
            return jsonify({'success': False, 'error': 'Fehler beim Erstellen des Auftrags'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies')
def get_emergencies():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        emergencies = db.get_emergencies()
        return jsonify({
            'success': True,
            'emergencies': emergencies
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/emergencies', methods=['POST'])
def create_emergency():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        data = request.get_json()
        
        required_fields = ['title', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} ist erforderlich'}), 400
        
        success = db.create_emergency(data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notfall erfolgreich erstellt'
            })
        else:
            return jsonify({'success': False, 'error': 'Fehler beim Erstellen des Notfalls'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/buero/customers')
def get_customers():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Nicht angemeldet'}), 401
    
    try:
        customers = db.get_customers()
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
        users = db.get_users()
        return jsonify({
            'success': True,
            'users': users
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
