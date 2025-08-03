#!/usr/bin/env python3
"""
Minimale App für Production Deployment
"""

from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "message": "Zeiterfassung System läuft!",
        "environment": "production"
    })

@app.route('/')
def index():
    return jsonify({
        "message": "Zeiterfassung System",
        "status": "running"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
