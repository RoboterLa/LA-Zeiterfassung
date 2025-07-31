from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, session, flash, abort, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from requests_oauthlib import OAuth2Session
import csv
import os
import logging
import time
from datetime import datetime, date, timedelta
import io
import json
import calendar
import uuid
from functools import wraps

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Azure-kompatible Konfiguration
if os.getenv('WEBSITE_HOSTNAME'):  # Azure Production
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
    # Azure-kompatible Datenbank-Pfad
    db_path = '/tmp/zeiterfassung.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    # KEINE Session-Konfiguration für Azure (verwende Flask's default)
    # Azure-kompatible CORS
    CORS(app, origins=['*'], supports_credentials=True)
    app.logger.info("Azure Production Environment erkannt")
else:  # Local Development
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///zeiterfassung.db'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = './sessions'
    # Lokale CORS
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3009'], supports_credentials=True)
    app.logger.info("Local Development Environment erkannt")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'connect_args': {'timeout': 30}}

# Sitzungsverzeichnis nur für lokale Entwicklung erstellen
if not os.getenv('WEBSITE_HOSTNAME'):
    try:
        session_dir = app.config['SESSION_FILE_DIR']
        os.makedirs(session_dir, exist_ok=True)
        app.logger.debug(f"Sitzungsverzeichnis erstellt/verifiziert: {session_dir}")
    except Exception as e:
        app.logger.error(f"Fehler beim Erstellen des Sitzungsverzeichnisses: {str(e)}")

db = SQLAlchemy(app)

# MS365 OAuth-Konfiguration
CLIENT_ID = os.getenv('CLIENT_ID', 'bce7f739-d799-4c57-8758-7b6b21999678')
CLIENT_SECRET = os.getenv('CLIENT_SECRET', 'eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr')

# Automatische Erkennung der Umgebung
if os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG') == '1' or os.getenv('WEBSITE_HOSTNAME') is None:
    # Lokale Entwicklung
    REDIRECT_URI = 'http://localhost:5001/auth/callback'
    app.logger.info("Lokale Entwicklungsumgebung erkannt - verwende localhost:5001")
else:
    # Produktionsumgebung (Azure)
    WEBSITE_HOSTNAME = os.getenv('WEBSITE_HOSTNAME', 'la-zeiterfassung-fyd4cge3d9e3cac4.germanywestcentral-01.azurewebsites.net')
    REDIRECT_URI = f'https://{WEBSITE_HOSTNAME}/auth/callback'
    app.logger.info(f"Azure-Umgebung erkannt - verwende {REDIRECT_URI}")

AUTHORITY = 'https://login.microsoftonline.com/3efb4b34-9ef2-4200-b749-2a501b2aaee6'
TOKEN_URL = f'{AUTHORITY}/oauth2/v2.0/token'
AUTH_URL = f'{AUTHORITY}/oauth2/v2.0/authorize'
SCOPES = ['openid', 'User.Read', 'profile', 'email']
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '0'

# RBAC Rollen-Konfiguration
ROLES = {
    'Monteur': {
        'permissions': ['view_own_orders', 'create_time_entries', 'view_own_reports'],
        'description': 'Basis-Zugriff für Monteure'
    },
    'Supervisor': {
        'permissions': ['approve_entries', 'view_all_reports', 'manage_orders'],
        'description': 'Erweiterte Berechtigungen für Vorgesetzte'
    },
    'Admin': {
        'permissions': ['manage_users', 'system_admin', 'all_permissions'],
        'description': 'Vollzugriff auf alle Funktionen'
    },
    'Buero': {
        'permissions': ['manage_orders', 'manage_elevators', 'view_all_reports', 'assign_orders'],
        'description': 'Büro-Interface für Auftrags- und Stammdatenverwaltung'
    }
}

# RBAC Decorators
def requires_role(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            # Admin hat Zugriff auf alles
            if user_role == 'Admin':
                return f(*args, **kwargs)
            # Prüfe spezifische Rolle
            if user_role == role:
                return f(*args, **kwargs)
            
            abort(403)  # Forbidden
        return decorated_function
    return decorator

def requires_permission(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            if has_permission(user_role, permission):
                return f(*args, **kwargs)
            
            abort(403)  # Forbidden
        return decorated_function
    return decorator

def requires_any_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            # Admin hat Zugriff auf alles
            if user_role == 'Admin':
                return f(*args, **kwargs)
            # Prüfe eine der Rollen
            if user_role in roles:
                return f(*args, **kwargs)
            
            abort(403)  # Forbidden
        return decorated_function
    return decorator

def get_user_permissions(user_role):
    return ROLES.get(user_role, {}).get('permissions', [])

def has_permission(user_role, permission):
    permissions = get_user_permissions(user_role)
    return permission in permissions

def can_approve_entries(user_role):
    return has_permission(user_role, 'approve_entries')

def can_manage_users(user_role):
    return has_permission(user_role, 'manage_users')

def update_user_session(user):
    session['user'] = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'is_admin': user.is_admin,
        'can_approve': user.can_approve,
        'azure_id': user.azure_id
    }

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    can_approve = db.Column(db.Boolean, default=False)
    # Neue Felder für RBAC
    azure_id = db.Column(db.String(100), unique=True, nullable=True)  # Azure AD Object ID
    role = db.Column(db.String(50), default='Monteur')  # Monteur, Supervisor, Admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    permissions = db.Column(db.Text, nullable=True)  # JSON für spezielle Berechtigungen

class TimeEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    elevator_id = db.Column(db.String(50), nullable=False, index=True)
    location = db.Column(db.String(100), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    activity_type = db.Column(db.String(50), nullable=False)
    other_activity = db.Column(db.String(100), nullable=True)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    emergency_week = db.Column(db.String(3), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    mitarbeiter = db.Column(db.String(120), nullable=False, index=True)
    comment = db.Column(db.Text, nullable=True)
    history = db.Column(db.Text, nullable=True)

class ArbeitszeitErfassung(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True, index=True)
    technician_id = db.Column(db.String(120), nullable=False, index=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Interval, nullable=True)
    category = db.Column(db.String(50), nullable=False, default='Arbeitszeit')
    pauses = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    attachments = db.Column(db.Text, nullable=True)
    overtime = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='offen')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    order = db.relationship('Order', backref='time_entries')

class TimeReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    technician_id = db.Column(db.String(120), nullable=False, index=True)
    period = db.Column(db.String(20), nullable=False)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    total_hours = db.Column(db.Float, nullable=False)
    overtime_hours = db.Column(db.Float, default=0.0)
    pdf_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Auftrag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    art = db.Column(db.String(50), nullable=False)
    uhrzeit = db.Column(db.String(5), nullable=False)
    standort = db.Column(db.String(100), nullable=False)
    coords = db.Column(db.Text, nullable=True)
    details = db.Column(db.Text, nullable=True)
    done = db.Column(db.Boolean, default=False)

class Order(db.Model):
    """Erweiterte Auftragsverwaltung für Büro-Interface"""
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    assigned_user = db.Column(db.String(120), nullable=True, index=True)
    planned_start = db.Column(db.DateTime, nullable=True)
    planned_end = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='Open')
    elevator_id = db.Column(db.Integer, db.ForeignKey('elevator.id'), nullable=True)
    priority = db.Column(db.String(20), default='Medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    elevator = db.relationship('Elevator', backref='orders')

class Elevator(db.Model):
    """Stammdaten für Aufzugsanlagen"""
    id = db.Column(db.Integer, primary_key=True)
    manufacturer = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    installation_date = db.Column(db.Date, nullable=True)
    location_address = db.Column(db.String(200), nullable=False)
    components = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Arbeitszeit(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    datum = db.Column(db.Date, nullable=False)
    start = db.Column(db.String(5), nullable=False)
    stop = db.Column(db.String(5), nullable=False)
    dauer = db.Column(db.String(10), nullable=False)
    notdienstwoche = db.Column(db.String(1), default='0')
    quelle = db.Column(db.String(20), default='manuell')
    bemerkung = db.Column(db.Text, nullable=True)

# Dummy User für lokale Entwicklung
class DummyUser:
    initials = 'RL'
    email = 'robert.lackner@lackner-aufzuege.com'
    is_admin = True
    can_approve = True

# CSV-Funktionen
def lade_zeiteintraege():
    try:
        with open('zeiterfassung.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    except FileNotFoundError:
        return []

def speichere_zeiteintraege(eintraege):
    with open('zeiterfassung.csv', 'w', newline='', encoding='utf-8') as f:
        if eintraege:
            writer = csv.DictWriter(f, fieldnames=eintraege[0].keys())
            writer.writeheader()
            writer.writerows(eintraege)

def lade_auftraege():
    try:
        with open('auftraege.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    except FileNotFoundError:
        return []

def speichere_auftraege(auftraege):
    with open('auftraege.csv', 'w', newline='', encoding='utf-8') as f:
        if auftraege:
            writer = csv.DictWriter(f, fieldnames=auftraege[0].keys())
            writer.writeheader()
            writer.writerows(auftraege)

def berechne_dauer(start, end):
    try:
        start_dt = datetime.strptime(start, "%H:%M")
        end_dt = datetime.strptime(end, "%H:%M")
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        diff = end_dt - start_dt
        hours = diff.seconds // 3600
        minutes = (diff.seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
    except:
        return "00:00"

def get_today():
    return date.today().strftime("%Y-%m-%d")

def append_history(eintrag, action, comment=None):
    history = json.loads(eintrag.get('history', '[]'))
    history.append({
        'action': action,
        'timestamp': datetime.now().isoformat(),
        'comment': comment
    })
    eintrag['history'] = json.dumps(history)

# Routes
@app.route('/')
def dashboard():
    """API-Endpoint für Dashboard-Daten"""
    try:
        # Temporärer Dev-User für lokales Testing
        if 'user' not in session:
            session['user'] = {
                'name': 'Entwickler Test',
                'email': 'dev@example.com',
                'initials': 'ET',
                'is_admin': True,
                'can_approve': True
            }
            app.logger.info("Temporärer Dev-User gesetzt für lokales Testing")
        
        # Zeiteinträge laden
        eintraege = lade_zeiteintraege()
        offene_zeiteintraege = [e for e in eintraege if not e.get('ende')]
        letzte_zeiteintraege = eintraege[-3:][::-1] if eintraege else []
        
        # Arbeitszeit-Daten laden
        try:
            arbeitszeit_eintraege = lade_arbeitszeit()
            heute = date.today().isoformat()
            heutige_arbeitszeit = [e for e in arbeitszeit_eintraege if e.get('datum') == heute]
        except:
            heutige_arbeitszeit = []
        
        # Aufträge aus CSV laden
        auftraege = lade_auftraege()
        auftraege_offen = len([a for a in auftraege if not a["done"]])
        auftraege_erledigt = len([a for a in auftraege if a["done"]])
        
        # Auftragsarten-Statistik
        auftragsarten = {}
        for a in auftraege:
            art = a.get('art', 'Unbekannt')
            if art not in auftragsarten:
                auftragsarten[art] = {'offen': 0, 'gesamt': 0}
            auftragsarten[art]['gesamt'] += 1
            if not a.get('done'):
                auftragsarten[art]['offen'] += 1
        
        # Nächster Auftrag
        from datetime import datetime
        def parse_time(t):
            return datetime.strptime(t, "%H:%M")
        offene = [a for a in auftraege if not a["done"]]
        naechster = min(offene, key=lambda a: parse_time(a["uhrzeit"])) if offene else None
        naechster_auftrag_uhrzeit = naechster["uhrzeit"] if naechster else None
        naechster_auftrag_art = naechster["art"] if naechster else None
        naechster_auftrag_standort = naechster["standort"] if naechster else None
        naechster_auftrag_coords = naechster["coords"] if naechster else None
        
        # Verbleibende Zeit
        verbleibende_zeit = None
        if naechster and naechster_auftrag_uhrzeit:
            now = datetime.now()
            try:
                start_dt = now.replace(
                    hour=int(naechster_auftrag_uhrzeit.split(':')[0]),
                    minute=int(naechster_auftrag_uhrzeit.split(':')[1]),
                    second=0, microsecond=0
                )
                if start_dt < now:
                    start_dt += timedelta(days=1)
                diff = start_dt - now
                h, m = divmod(diff.seconds // 60, 60)
                verbleibende_zeit = f"{h}:{m:02d}h"
            except Exception:
                verbleibende_zeit = None
        
        # Störungen (Demo/Test)
        stoerungen = [
            {
                'art': 'Aufzug außer Betrieb',
                'adresse': 'Musterstraße 1, 12345 Musterstadt',
                'deadline': '14:30 Uhr',
                'coords': [48.12345, 11.56789]
            }
        ]
        
        # Urlaub-Daten (vereinfacht)
        urlaub = []
        pending_count = len([e for e in eintraege if e.get('status') == 'pending'])
        
        user = session['user']
        return jsonify({
            'user': {
                'name': user.get('name', 'Dev User'),
                'email': user.get('email', 'dev@example.com'),
                'initials': user.get('initials', 'DU'),
                'role': user.get('role', 'Admin'),
                'is_admin': user.get('is_admin', True),
                'can_approve': user.get('can_approve', True)
            },
            'dashboard': {
                'offene_zeiteintraege': len(offene_zeiteintraege),
                'letzte_zeiteintraege': letzte_zeiteintraege,
                'heutige_arbeitszeit': heutige_arbeitszeit,
                'auftraege_offen': auftraege_offen,
                'auftraege_erledigt': auftraege_erledigt,
                'auftragsarten': auftragsarten,
                'naechster_auftrag': {
                    'uhrzeit': naechster_auftrag_uhrzeit,
                    'art': naechster_auftrag_art,
                    'standort': naechster_auftrag_standort,
                    'coords': naechster_auftrag_coords,
                    'verbleibende_zeit': verbleibende_zeit
                },
                'stoerungen': stoerungen,
                'urlaub': urlaub,
                'pending_count': pending_count
            }
        })
    except Exception as e:
        app.logger.error(f"Fehler in dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Azure"""
    try:
        with app.app_context():
            db.engine.execute('SELECT 1')
            return jsonify({'status': 'healthy', 'database': 'connected'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
def api_auth_me():
    """API-Endpunkt für Frontend-Authentifizierung"""
    if 'user' in session:
        user_data = session['user']
        return jsonify({
            'id': user_data.get('id', 1),
            'name': user_data.get('name', 'Dev User'),
            'email': user_data.get('email', 'dev@example.com'),
            'role': user_data.get('role', 'Admin'),
            'is_admin': user_data.get('is_admin', True),
            'can_approve': user_data.get('can_approve', True)
        })
    else:
        return jsonify({'error': 'Nicht authentifiziert'}), 401

@app.route('/dev_login', methods=['GET', 'POST', 'OPTIONS'])
def dev_login():
    # CORS-Headers für OPTIONS-Requests
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    if request.method == 'GET':
        # Default Dev-Login
        session['user'] = {
            'id': 1,
            'name': 'Admin User',
            'email': 'admin@example.com',
            'role': 'Admin',
            'is_admin': True,
            'can_approve': True,
            'initials': 'AU'
        }
        app.logger.info("Temporärer Dev-User gesetzt für lokales Testing")
        return jsonify({'message': 'Dev login successful', 'user': session['user']})
    
    elif request.method == 'POST':
        data = request.get_json()
        email = data.get('email', 'admin@example.com')
        role = data.get('role', 'Admin')
        
        # User in DB erstellen/aktualisieren
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                name=email.split('@')[0],
                role=role,
                is_admin=(role == 'Admin'),
                can_approve=(role in ['Admin', 'Supervisor'])
            )
            db.session.add(user)
        else:
            user.role = role
            user.is_admin = (role == 'Admin')
            user.can_approve = (role in ['Admin', 'Supervisor'])
        
        db.session.commit()
        app.logger.info(f"User aktualisiert: {email}")
        
        # Session setzen
        session['user'] = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'is_admin': user.is_admin,
            'can_approve': user.can_approve,
            'initials': user.name[:2].upper() if user.name else 'U'
        }
        
        app.logger.info(f"Login erfolgreich: {email} ({role})")
        return jsonify({'message': 'Login successful', 'user': session['user']})

# Initialize database
with app.app_context():
    db.create_all()
    app.logger.info("Datenbank erfolgreich initialisiert")

if __name__ == '__main__':
    # Azure-kompatible Port-Konfiguration
    port = int(os.getenv('PORT', 5002))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    
    app.logger.info(f"🚀 Starte App auf Port {port} (Debug: {debug})")
    app.run(host='0.0.0.0', port=port, debug=debug) 