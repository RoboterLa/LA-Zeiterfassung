from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import sqlite3
import os
from datetime import datetime, timedelta
import csv
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Test Users
TEST_USERS = {
    'monteur': {'password': 'monteur123', 'role': 'Monteur'},
    'admin': {'password': 'admin123', 'role': 'Admin'}
}

def get_db_connection():
    conn = sqlite3.connect('zeiterfassung.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS zeiterfassung (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            datum TEXT NOT NULL,
            start_zeit TEXT NOT NULL,
            end_zeit TEXT,
            pause_minuten INTEGER DEFAULT 0,
            bemerkung TEXT
        )
    ''')
    conn.commit()
    conn.close()

def requires_role(role):
    def decorator(f):
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            if session.get('role') != role and session.get('role') != 'Admin':
                return "Zugriff verweigert", 403
            return f(*args, **kwargs)
        decorated_function.__name__ = f.__name__
        return decorated_function
    return decorator

@app.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    return """
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Zeiterfassung System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <header class="bg-blue-600 text-white p-4">
                <div class="container mx-auto flex justify-between items-center">
                    <h1 class="text-2xl font-bold">Dashboard</h1>
                    <div class="flex space-x-4">
                        <a href="/logout" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700">Abmelden</a>
                    </div>
                </div>
            </header>
            <main class="container mx-auto p-6">
                <h2 class="text-3xl font-bold mb-6">Willkommen!</h2>
                <p class="text-gray-600">Das System funktioniert wieder.</p>
            </main>
        </div>
    </body>
    </html>
    """

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username in TEST_USERS and TEST_USERS[username]['password'] == password:
            session['user'] = username
            session['role'] = TEST_USERS[username]['role']
            return redirect(url_for('index'))
        else:
            return "Ungültige Anmeldedaten", 401
    
    return """
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Zeiterfassung System</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
                <form method="POST">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                            Benutzername
                        </label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                               id="username" name="username" type="text" required>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                            Passwort
                        </label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
                               id="password" name="password" type="password" required>
                    </div>
                    <div class="flex items-center justify-between">
                        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
                                type="submit">
                            Anmelden
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </body>
    </html>
    """

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 