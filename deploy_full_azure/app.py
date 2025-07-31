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
from sqlalchemy import text

# Debug-Ausgaben für Azure
print("🚀 App wird initialisiert...")
print(f"📁 Arbeitsverzeichnis: {os.getcwd()}")
print(f"🌍 Umgebung: {'Azure' if os.getenv('WEBSITE_HOSTNAME') else 'Local'}")

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
print("✅ Flask App erstellt")

# Azure-kompatible Konfiguration
if os.getenv('WEBSITE_HOSTNAME'):  # Azure Production
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
    # Azure-kompatible Datenbank-Pfad
    db_path = '/tmp/zeiterfassung.db' if os.getenv('WEBSITE_HOSTNAME') else 'zeiterfassung.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    # Azure-kompatible Session-Konfiguration
    app.config['SESSION_TYPE'] = 'null'
    # Azure-kompatible CORS
    CORS(app, origins=['*'], supports_credentials=True)
else:  # Local Development
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///zeiterfassung.db'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = './sessions'
    # Lokale CORS
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3009'], supports_credentials=True)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'connect_args': {'timeout': 30}}

# Sitzungsverzeichnis erstellen (Azure-kompatibel)
try:
    session_dir = app.config.get('SESSION_FILE_DIR', './sessions')
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
            if user_role != role and user_role != 'Admin':
                flash('Keine Berechtigung für diese Aktion.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def requires_permission(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            if not has_permission(user_role, permission):
                flash('Keine Berechtigung für diese Aktion.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def requires_any_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            if user_role not in roles and user_role != 'Admin':
                flash('Keine Berechtigung für diese Aktion.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_permissions(user_role):
    return ROLES.get(user_role, {}).get('permissions', [])

def has_permission(user_role, permission):
    permissions = get_user_permissions(user_role)
    return permission in permissions or user_role == 'Admin'

def can_approve_entries(user_role):
    return user_role in ['Supervisor', 'Admin']

def can_manage_users(user_role):
    return user_role == 'Admin'

def update_user_session(user):
    session['user'] = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'is_admin': user.is_admin,
        'can_approve': user.can_approve,
        'initials': ''.join([n[0].upper() for n in user.name.split()[:2]])
    }

# Datenbank-Modelle
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

# CSV-Funktionen für Kompatibilität
CSV_FILE = 'zeiterfassung.csv'
FIELDNAMES = [
    'id', 'elevator_id', 'location', 'date', 'activity_type', 'other_activity',
    'start_time', 'end_time', 'emergency_week', 'notes', 'status'
]

def lade_zeiteintraege():
    if not os.path.exists(CSV_FILE):
        return []
    with open(CSV_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def speichere_zeiteintraege(eintraege):
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(eintraege)

def berechne_dauer(start, end):
    try:
        s = datetime.strptime(start, '%H:%M')
        e = datetime.strptime(end, '%H:%M')
        if e < s:
            e += timedelta(days=1)
        diff = e - s
        stunden = diff.seconds // 3600
        minuten = (diff.seconds % 3600) // 60
        return f"{stunden:02d}:{minuten:02d}"
    except Exception:
        return ''

def get_today():
    return date.today().strftime('%d.%m.%Y')

def append_history(eintrag, action, comment=None):
    history = json.loads(eintrag.get('history', '[]'))
    history.append({
        'action': action,
        'timestamp': datetime.now().isoformat(),
        'comment': comment
    })
    eintrag['history'] = json.dumps(history)

# DummyUser für Entwicklung
class DummyUser:
    initials = 'RL'
    email = 'robert.lackner@lackner-aufzuege.com'
    is_admin = True
    can_approve = True

# Routen
@app.route('/')
def dashboard():
    """Dashboard - Hauptseite"""
    print("🏠 Dashboard Route aufgerufen")
    
    # Session-Prüfung für Azure aktivieren
    if 'user' not in session:
        print("⚠️ Keine Session gefunden - Redirect zu Login")
        return redirect(url_for('login'))
    
    user = session['user']
    print(f"👤 Benutzer: {user.get('name', 'Unbekannt')}")
    
    # Einfache Health-Check für Azure
    if request.args.get('health') == 'check':
        return jsonify({
            'status': 'healthy',
            'user': user.get('name', 'Unbekannt'),
            'environment': 'Azure' if os.getenv('WEBSITE_HOSTNAME') else 'Local',
            'timestamp': datetime.now().isoformat()
        })
    
    # Vollständige Dashboard-Logik
    try:
        # Temporärer Dev-User für lokales Testing
        if not session.get('user'):
            session['user'] = {
                'name': 'Entwickler Test',
                'email': 'dev@example.com',
                'initials': 'ET',
                'is_admin': True,
                'can_approve': True,
                'role': 'Admin'
            }
            app.logger.info("Temporärer Dev-User gesetzt für lokales Testing")
        
        # Zeiteinträge laden
        eintraege = lade_zeiteintraege()
        offene_zeiteintraege = [e for e in eintraege if not e.get('ende')]
        letzte_zeiteintraege = eintraege[-3:][::-1] if eintraege else []
        
        # Aufträge aus CSV laden
        auftraege = []
        if os.path.exists('auftraege.csv'):
            with open('auftraege.csv', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                auftraege = list(reader)
        
        auftraege_offen = len([a for a in auftraege if not a.get("done", False)])
        auftraege_erledigt = len([a for a in auftraege if a.get("done", False)])
        
        # Auftragsarten-Statistik
        auftragsarten = {}
        for a in auftraege:
            art = a.get('art', 'Unbekannt')
            if art not in auftragsarten:
                auftragsarten[art] = {'offen': 0, 'gesamt': 0}
            auftragsarten[art]['gesamt'] += 1
            if not a.get('done', False):
                auftragsarten[art]['offen'] += 1
        
        # Nächster Auftrag
        def parse_time(t):
            return datetime.strptime(t, "%H:%M")
        offene = [a for a in auftraege if not a.get("done", False)]
        naechster = min(offene, key=lambda a: parse_time(a["uhrzeit"])) if offene else None
        naechster_auftrag_uhrzeit = naechster["uhrzeit"] if naechster else None
        naechster_auftrag_art = naechster["art"] if naechster else None
        naechster_auftrag_standort = naechster["standort"] if naechster else None
        naechster_auftrag_coords = naechster.get("coords") if naechster else None
        
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
        
        return jsonify({
            'user': {
                'name': session['user'].get('name', 'Dev User'),
                'email': session['user'].get('email', 'dev@example.com'),
                'initials': session['user'].get('initials', 'DU'),
                'is_admin': session['user'].get('is_admin', True),
                'can_approve': session['user'].get('can_approve', True)
            },
            'dashboard_data': {
                'stoerungen': stoerungen,
                'auftraege': auftraege,
                'urlaub': urlaub,
                'offene_zeiteintraege': offene_zeiteintraege,
                'letzte_zeiteintraege': letzte_zeiteintraege,
                'auftraege_offen': auftraege_offen,
                'auftraege_erledigt': auftraege_erledigt,
                'auftragsarten': auftragsarten,
                'naechster_auftrag_uhrzeit': naechster_auftrag_uhrzeit,
                'naechster_auftrag_art': naechster_auftrag_art,
                'naechster_auftrag_standort': naechster_auftrag_standort,
                'naechster_auftrag_coords': naechster_auftrag_coords,
                'verbleibende_zeit': verbleibende_zeit,
                'pending_count': pending_count,
                'resturlaub': 30,
                'tage_verbraucht': 0,
                'tage_verplant': 0,
                'tage_uebrig': 30,
                'aktueller_urlaub': None,
                'naechster_urlaub': None
            }
        })
        
    except Exception as e:
        app.logger.error(f"Fehler in dashboard: {str(e)}")
        return jsonify({'error': f"Fehler in dashboard: {str(e)}"}), 500

@app.route('/zeiterfassung', methods=['GET', 'POST'])
def zeiterfassung():
    """Zeiterfassung-Seite"""
    print("⏰ Zeiterfassung Route aufgerufen")
    
    if request.method == 'POST':
        data = request.get_json()
        eintraege = lade_zeiteintraege()
        neue_id = str(max([int(e['id']) for e in eintraege], default=0) + 1)
        eintrag = {
            'id': neue_id,
            'elevator_id': data.get('elevator_id', '').strip(),
            'location': data.get('location', '').strip(),
            'date': data.get('entry_date', ''),
            'activity_type': data.get('activity_type', ''),
            'other_activity': data.get('other_activity', ''),
            'start_time': data.get('start_time', ''),
            'end_time': data.get('end_time', ''),
            'emergency_week': 'Ja' if data.get('emergency_week') == 'yes' else 'Nein',
            'notes': data.get('notes', ''),
            'status': 'pending'
        }
        eintraege.append(eintrag)
        speichere_zeiteintraege(eintraege)
        return jsonify({'status': 'success', 'message': 'Eintrag gespeichert.'})
    
    return jsonify({
        'message': 'Zeiterfassung API verfügbar',
        'today': get_today()
    })

@app.route('/entries')
@requires_any_role('Supervisor', 'Admin')
def entries():
    """Zeiteinträge anzeigen"""
    print("📋 Entries Route aufgerufen")
    
    eintraege = lade_zeiteintraege()
    
    # Filter
    filter_text = request.args.get('filter_text', '').lower()
    filter_activity = request.args.get('filter_activity', '')
    filter_elevator = request.args.get('filter_elevator', '')
    filter_date_type = request.args.get('filter_date_type', 'all')
    filter_date_start = request.args.get('filter_date_start', '')
    filter_date_end = request.args.get('filter_date_end', '')
    
    filtered = []
    for e in eintraege:
        if filter_text and not (
            filter_text in e.get('elevator_id', '').lower() or
            filter_text in e.get('location', '').lower() or
            filter_text in e.get('notes', '').lower() or
            filter_text in e.get('activity_type', '').lower() or
            filter_text in e.get('other_activity', '').lower()
        ):
            continue
        
        if filter_activity and e.get('activity_type') != filter_activity:
            continue
        
        if filter_elevator and e.get('elevator_id') != filter_elevator:
            continue
        
        if filter_date_type == 'range' and filter_date_start and filter_date_end:
            try:
                entry_date = datetime.strptime(e.get('date', ''), '%Y-%m-%d').date()
                start_date = datetime.strptime(filter_date_start, '%Y-%m-%d').date()
                end_date = datetime.strptime(filter_date_end, '%Y-%m-%d').date()
                if not (start_date <= entry_date <= end_date):
                    continue
            except:
                continue
        
        filtered.append(e)
    
    return jsonify({
        'entries': filtered,
        'total': len(filtered),
        'filters': {
            'text': filter_text,
            'activity': filter_activity,
            'elevator': filter_elevator,
            'date_type': filter_date_type,
            'date_start': filter_date_start,
            'date_end': filter_date_end
        }
    })

@app.route('/login')
def login():
    """Login-Seite"""
    print("🔐 Login Route aufgerufen")
    return jsonify({
        'message': 'Login API verfügbar',
        'ms365_login_url': url_for('login_ms365')
    })

@app.route('/login_ms365')
def login_ms365():
    """MS365 OAuth Login"""
    print("🔐 MS365 Login Route aufgerufen")
    
    oauth = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, scope=SCOPES)
    authorization_url, state = oauth.authorization_url(AUTH_URL)
    
    session['oauth_state'] = state
    return jsonify({
        'authorization_url': authorization_url,
        'state': state
    })

@app.route('/auth/callback')
def callback():
    """OAuth Callback"""
    print("🔄 OAuth Callback Route aufgerufen")
    
    try:
        oauth = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, state=session.get('oauth_state'))
        token = oauth.fetch_token(TOKEN_URL, client_secret=CLIENT_SECRET, authorization_response=request.url)
        
        # Benutzerinfo abrufen
        resp = oauth.get('https://graph.microsoft.com/v1.0/me')
        user_info = resp.json()
        
        # Benutzer in DB speichern/aktualisieren
        user = get_user_by_email(user_info['mail'])
        if not user:
            user = create_user(user_info['mail'], user_info['displayName'], azure_id=user_info['id'])
        
        update_user_session(user)
        
        return jsonify({
            'status': 'success',
            'message': 'Login erfolgreich',
            'user': session['user']
        })
        
    except Exception as e:
        app.logger.error(f"OAuth Callback Fehler: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Login fehlgeschlagen: {str(e)}'
        }), 500

@app.route('/logout')
def logout():
    """Logout"""
    print("🚪 Logout Route aufgerufen")
    session.clear()
    return jsonify({
        'status': 'success',
        'message': 'Logout erfolgreich'
    })

@app.route('/dev_login')
def dev_login():
    """Entwickler-Login für lokale Entwicklung"""
    print("👨‍💻 Dev Login Route aufgerufen")
    
    if os.getenv('FLASK_ENV') == 'development' or os.getenv('WEBSITE_HOSTNAME') is None:
        session['user'] = {
            'name': 'Entwickler Test',
            'email': 'dev@example.com',
            'initials': 'ET',
            'is_admin': True,
            'can_approve': True,
            'role': 'Admin'
        }
        return jsonify({
            'status': 'success',
            'message': 'Dev Login erfolgreich',
            'user': session['user']
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Dev Login nur in Entwicklung verfügbar'
    }), 403

@app.route('/health')
def health_check():
    """Health check endpoint for Azure"""
    print("❤️ Health Check Route aufgerufen")
    try:
        with app.app_context():
            # Korrekte SQLAlchemy-Syntax
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'environment': 'Azure' if os.getenv('WEBSITE_HOSTNAME') else 'Local',
                'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'environment': 'Azure' if os.getenv('WEBSITE_HOSTNAME') else 'Local',
            'timestamp': datetime.now().isoformat()
        }), 500

# Hilfsfunktionen
def get_user_by_email(email):
    """Benutzer anhand E-Mail finden"""
    return User.query.filter_by(email=email).first()

def get_user_by_azure_id(azure_id):
    """Benutzer anhand Azure ID finden"""
    return User.query.filter_by(azure_id=azure_id).first()

def create_user(email, name, role='Monteur', azure_id=None):
    """Neuen Benutzer erstellen"""
    user = User(
        email=email,
        name=name,
        role=role,
        azure_id=azure_id,
        is_admin=role == 'Admin',
        can_approve=role in ['Supervisor', 'Admin']
    )
    db.session.add(user)
    db.session.commit()
    return user

def update_user_role(user_id, new_role):
    """Benutzerrolle aktualisieren"""
    user = User.query.get(user_id)
    if user:
        user.role = new_role
        user.is_admin = new_role == 'Admin'
        user.can_approve = new_role in ['Supervisor', 'Admin']
        db.session.commit()
        return True
    return False

# Kein app.run() – gunicorn übernimmt das
print("App initialisiert – bereit für gunicorn.")
