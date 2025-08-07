from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/health')
def health_check():
    return jsonify({
        'service': 'zeiterfassung-app',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    return jsonify({
        'success': True,
        'message': 'Erfolgreich angemeldet',
        'user': {
            'id': 1,
            'email': 'monteur@lackner.com',
            'name': 'Monteur',
            'role': 'monteur'
        }
    })

@app.route('/api/monteur/time-entries')
def get_time_entries():
    return jsonify({
        'success': True,
        'time_entries': [
            {
                'id': 1,
                'clock_in': '08:00:00',
                'clock_out': '17:00:00',
                'location': 'Hauptstraße 15, München',
                'notes': 'Wartung Aufzug'
            }
        ]
    })

@app.route('/api/monteur/orders')
def get_orders():
    return jsonify({
        'success': True,
        'orders': [
            {
                'id': 1,
                'title': 'Wartung Aufzug Hauptstraße 15',
                'description': 'Regelmäßige Wartung',
                'customer': 'Gebäudeverwaltung München',
                'location': 'Hauptstraße 15, München',
                'order_type': 'maintenance',
                'priority': 'normal',
                'status': 'assigned',
                'created_date': '2025-01-20',
                'due_date': '2025-01-25'
            }
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False) 