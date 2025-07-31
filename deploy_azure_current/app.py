#!/usr/bin/env python3
"""
Haupt-App für Zeiterfassung System auf Azure
"""

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

# Flask App erstellen
app = Flask(__name__, static_folder='frontend_build', static_url_path='')

# CORS konfigurieren
CORS(app, supports_credentials=True)

# Health Check
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

# API Status
@app.route('/api/status')
def api_status():
    return jsonify({'status': 'running', 'api': 'v1'})

# React-Routes (Single Page Application)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React-App für alle Frontend-Routes"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("🚀 Zeiterfassung System wird auf Azure gestartet...")
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 