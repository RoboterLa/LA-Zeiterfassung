from flask import Flask, jsonify, render_template_string, request, session, redirect, url_for
from flask_cors import CORS
import os

print("🚀 App wird gestartet...")

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())

# CORS für Frontend-Kommunikation
CORS(app, 
     supports_credentials=True, 
     origins=[
         'http://localhost:3000',
         'https://localhost:3000', 
         'http://192.168.50.99:3000',
         'http://localhost:3001',
         'https://localhost:3001',
         'http://192.168.50.99:3001'
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

@app.route('/')
def home():
    # Prüfe ob User eingeloggt ist
    if 'user' not in session:
        return redirect('/login')
    
    # Admin wird zum Büro-Frontend weitergeleitet
    if session['user'].get('is_admin', False):
        return redirect('/buero')
    
    # Monteur bleibt auf normalem Dashboard
    # HTML-Seite statt JSON
    html = """
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zeiterfassung System</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #2c3e50;
                margin-bottom: 30px;
            }
            .status {
                background: #27ae60;
                color: white;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
            }
            .info {
                background: #ecf0f1;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .endpoints {
                background: #3498db;
                color: white;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .endpoint {
                background: rgba(255,255,255,0.2);
                padding: 8px;
                margin: 5px 0;
                border-radius: 3px;
                font-family: monospace;
            }
            .user-info {
                background: #e8f4fd;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .logout-btn {
                background: #e74c3c;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Zeiterfassung System</h1>
                <h2>Lackner Aufzüge</h2>
            </div>
            
            <div class="user-info">
                <h3>👤 Angemeldet als: """ + session.get('user', {}).get('name', 'Unbekannt') + """</h3>
                <p><strong>E-Mail:</strong> """ + session.get('user', {}).get('email', 'N/A') + """</p>
                <p><strong>Rolle:</strong> """ + session.get('user', {}).get('role', 'Monteur') + """</p>
                <a href="/logout" class="logout-btn">🚪 Abmelden</a>
            </div>
            
            <div class="status">
                <h3>✅ System Status: Online</h3>
                <p>Die Anwendung läuft erfolgreich auf Azure</p>
            </div>
            
            <div class="info">
                <h3>📊 System Informationen</h3>
                <p><strong>Umgebung:</strong> Azure Cloud</p>
                <p><strong>Status:</strong> Aktiv und bereit</p>
                <p><strong>URL:</strong> https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net</p>
                <p><strong>Deployment:</strong> Erfolgreich abgeschlossen</p>
            </div>
            
            <div class="endpoints">
                <h3>🔗 Verfügbare Endpunkte</h3>
                <div class="endpoint">GET / - Diese Startseite (Login erforderlich)</div>
                <div class="endpoint">GET /login - Anmeldeseite</div>
                <div class="endpoint">POST /login - Anmeldung</div>
                <div class="endpoint">GET /logout - Abmeldung</div>
                <div class="endpoint">GET /health - System-Status</div>
                <div class="endpoint">GET /api/status - JSON Status</div>
            </div>
            
            <div class="info">
                <h3>🎯 Nächste Schritte</h3>
                <ul>
                    <li>Frontend (React) mit Backend verbinden</li>
                    <li>MS365 Login aktivieren</li>
                    <li>Datenbank-Funktionen erweitern</li>
                    <li>Zeiterfassung-Features implementieren</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return html

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Einfache Login-Logik (für Demo)
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Demo-User (in Produktion: echte Authentifizierung)
        if email == 'admin@lackner-aufzuege.com' and password == 'admin123':
            session['user'] = {
                'name': 'Administrator',
                'email': email,
                'role': 'Admin',
                'is_admin': True,
                'can_approve': True
            }
            # Admin wird zum Büro-Frontend weitergeleitet
            return redirect('/buero')
        elif email == 'monteur@lackner-aufzuege.com' and password == 'monteur123':
            session['user'] = {
                'name': 'Monteur Test',
                'email': email,
                'role': 'Monteur',
                'is_admin': False,
                'can_approve': False
            }
            # Monteur wird zum normalen Dashboard weitergeleitet
            return redirect('/')
        else:
            error = "Ungültige Anmeldedaten"
            return render_template_string(login_html, error=error)
    
    return render_template_string(login_html)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/api/status')
def api_status():
    user = session.get('user', None)
    print(f"🔍 DEBUG: Session user: {user}")  # Debug-Log
    
    if user:
        # Stelle sicher, dass is_admin korrekt gesetzt ist
        if user.get('role') == 'Admin':
            user['is_admin'] = True
        else:
            user['is_admin'] = False
        
        print(f"🔍 DEBUG: Processed user: {user}")  # Debug-Log
    
    response_data = {
        'message': 'Zeiterfassung App läuft!',
        'status': 'success',
        'environment': 'Azure' if os.getenv('WEBSITE_HOSTNAME') else 'Local',
        'user': user
    }
    
    print(f"🔍 DEBUG: API Response: {response_data}")  # Debug-Log
    return jsonify(response_data)

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'App ist bereit'
    })

@app.route('/buero')
def buero():
    # Prüfe ob User eingeloggt ist und Admin ist
    if 'user' not in session:
        return redirect('/login')
    
    if not session['user'].get('is_admin', False):
        return redirect('/')
    
    # Büro-Interface HTML
    html = """
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Büro Interface - Zeiterfassung System</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #2c3e50;
                margin-bottom: 30px;
                border-bottom: 3px solid #0066b3;
                padding-bottom: 20px;
            }
            .user-info {
                background: #e8f4fd;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .logout-btn {
                background: #e74c3c;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 10px 0;
            }
            .admin-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #0066b3;
            }
            .admin-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .admin-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 1px solid #e9ecef;
            }
            .admin-card h3 {
                color: #0066b3;
                margin-top: 0;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 10px;
            }
            .btn {
                background: #0066b3;
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 5px;
            }
            .btn:hover {
                background: #0052a3;
            }
            .btn-secondary {
                background: #6c757d;
            }
            .btn-secondary:hover {
                background: #5a6268;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 Büro Interface</h1>
                <h2>Lackner Aufzüge - Administrationsbereich</h2>
            </div>
            
            <div class="user-info">
                <h3>👤 Administrator: """ + session.get('user', {}).get('name', 'Unbekannt') + """</h3>
                <p><strong>E-Mail:</strong> """ + session.get('user', {}).get('email', 'N/A') + """</p>
                <p><strong>Rolle:</strong> """ + session.get('user', {}).get('role', 'Admin') + """</p>
                <a href="/logout" class="logout-btn">🚪 Abmelden</a>
            </div>
            
            <div class="admin-section">
                <h2>📊 Verwaltungsfunktionen</h2>
                <p>Hier können Sie alle Monteure und deren Daten verwalten, Aufträge zuordnen und das System administrieren.</p>
                
                <div class="admin-grid">
                    <div class="admin-card">
                        <h3>👥 Monteur-Verwaltung</h3>
                        <p>Neue Monteure anlegen, bestehende bearbeiten und Berechtigungen verwalten.</p>
                        <a href="/buero/monteure" class="btn">Monteure verwalten</a>
                    </div>
                    
                    <div class="admin-card">
                        <h3>📋 Auftragsverwaltung</h3>
                        <p>Aufträge erstellen, zuordnen und den Status verfolgen.</p>
                        <a href="/buero/auftraege" class="btn">Aufträge verwalten</a>
                    </div>
                    
                    <div class="admin-card">
                        <h3>⏰ Zeiterfassung-Übersicht</h3>
                        <p>Alle Zeiteinträge aller Monteure einsehen und genehmigen.</p>
                        <a href="/buero/zeiterfassung" class="btn">Zeiterfassung prüfen</a>
                    </div>
                    
                    <div class="admin-card">
                        <h3>📅 Urlaubsverwaltung</h3>
                        <p>Urlaubsanträge bearbeiten und genehmigen.</p>
                        <a href="/buero/urlaub" class="btn">Urlaub verwalten</a>
                    </div>
                    
                    <div class="admin-card">
                        <h3>📈 Berichte & Statistiken</h3>
                        <p>Auswertungen und Berichte für das Management erstellen.</p>
                        <a href="/buero/berichte" class="btn">Berichte anzeigen</a>
                    </div>
                    
                    <div class="admin-card">
                        <h3>⚙️ System-Einstellungen</h3>
                        <p>Systemkonfiguration und Einstellungen verwalten.</p>
                        <a href="/buero/einstellungen" class="btn">Einstellungen</a>
                    </div>
                </div>
            </div>
            
            <div class="admin-section">
                <h2>🔗 Schnellzugriff</h2>
                <a href="/" class="btn btn-secondary">← Zurück zum Dashboard</a>
                <a href="/api/status" class="btn btn-secondary">API Status</a>
                <a href="/health" class="btn btn-secondary">System Health</a>
            </div>
        </div>
    </body>
    </html>
    """
    return html

# Login HTML Template
login_html = """
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anmeldung - Zeiterfassung System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        input[type="email"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            border-color: #0066b3;
            outline: none;
        }
        .login-btn {
            width: 100%;
            background: #0066b3;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
        }
        .login-btn:hover {
            background: #0052a3;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .demo-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="header">
            <h1>🚀 Zeiterfassung System</h1>
            <h2>Lackner Aufzüge</h2>
        </div>
        
        {% if error %}
        <div class="error">
            {{ error }}
        </div>
        {% endif %}
        
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="email">E-Mail:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Passwort:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="login-btn">🔐 Anmelden</button>
        </form>
        
        <div class="demo-info">
            <h4>📋 Demo-Anmeldedaten:</h4>
            <p><strong>Administrator:</strong><br>
            E-Mail: admin@lackner-aufzuege.com<br>
            Passwort: admin123</p>
            
            <p><strong>Monteur:</strong><br>
            E-Mail: monteur@lackner-aufzuege.com<br>
            Passwort: monteur123</p>
        </div>
    </div>
</body>
</html>
"""

print("✅ App bereit für gunicorn")
