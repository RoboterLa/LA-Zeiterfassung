#!/usr/bin/env python3
"""
Einfache Flask-App für Azure Deployment
"""

from flask import Flask, jsonify, send_from_directory
import os

app = Flask(__name__)

# Statisches Frontend
app.static_folder = 'frontend/build'
app.static_url_path = ''

@app.route('/health')
def health():
    """Health Check"""
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

@app.route('/api/status')
def api_status():
    """API Status"""
    return jsonify({'status': 'running', 'message': 'API is working'})

@app.route('/')
def index():
    """Serve React App"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False) 