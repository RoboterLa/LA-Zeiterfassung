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
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///zeiterfassung.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS für Frontend aktivieren
CORS(app, origins=['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3009'], supports_credentials=True)
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'connect_args': {'timeout': 30}}
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './sessions'

# Sitzungsverzeichnis erstellen
try:
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    app.logger.debug(f"Sitzungsverzeichnis erstellt/verifiziert: {app.config['SESSION_FILE_DIR']}")
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
            if user_role == 'Admin':
                return f(*args, **kwargs)
            
            role_permissions = ROLES.get(user_role, {}).get('permissions', [])
            if permission not in role_permissions:
                abort(403)  # Forbidden
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def requires_any_role(*roles):
    """Decorator für mehrere mögliche Rollen"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            
            user_role = session['user'].get('role', 'Monteur')
            if user_role == 'Admin' or user_role in roles:
                return f(*args, **kwargs)
            
            abort(403)  # Forbidden
        return decorated_function
    return decorator

# RBAC Utility Functions
def get_user_permissions(user_role):
    """Gibt die Berechtigungen für eine Rolle zurück"""
    return ROLES.get(user_role, {}).get('permissions', [])

def has_permission(user_role, permission):
    """Prüft ob eine Rolle eine bestimmte Berechtigung hat"""
    if user_role == 'Admin':
        return True
    return permission in get_user_permissions(user_role)

def can_approve_entries(user_role):
    """Prüft ob ein User Zeiterfassungen freigeben kann"""
    return user_role in ['Supervisor', 'Admin']

def can_manage_users(user_role):
    """Prüft ob ein User andere User verwalten kann"""
    return user_role == 'Admin'

def update_user_session(user):
    """Aktualisiert die User-Session mit RBAC-Informationen"""
    session['user'] = {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'is_admin': user.is_admin,
        'can_approve': user.can_approve,
        'permissions': get_user_permissions(user.role)
    }

# Datenbankmodelle angepasst an Ihre CSV-Struktur
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

# Neue erweiterte Arbeitszeiterfassung
class ArbeitszeitErfassung(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True, index=True)  # Optional, für freie Erfassungen NULL
    technician_id = db.Column(db.String(120), nullable=False, index=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)  # NULL wenn noch läuft
    duration = db.Column(db.Interval, nullable=True)  # Berechnete Nettodauer
    category = db.Column(db.String(50), nullable=False, default='Arbeitszeit')  # ENUM: Arbeitszeit, Fahrtzeit, Pause, Vorbereitung
    pauses = db.Column(db.Text, nullable=True)  # JSON Array von Pausen
    notes = db.Column(db.Text, nullable=True)
    attachments = db.Column(db.Text, nullable=True)  # JSON Array von Anhängen
    overtime = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='offen')  # ENUM: offen, abgeschlossen, korrigiert
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    order = db.relationship('Order', backref='time_entries')

# Zeitberichte für Reporting
class TimeReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    technician_id = db.Column(db.String(120), nullable=False, index=True)
    period = db.Column(db.String(20), nullable=False)  # ENUM: täglich, wöchentlich, monatlich
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

# Neue Modelle für Büro-Interface
class Order(db.Model):
    """Erweiterte Auftragsverwaltung für Büro-Interface"""
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # Reparatur, Modernisierung, Neubau, Wartung
    description = db.Column(db.Text, nullable=True)
    assigned_user = db.Column(db.String(120), nullable=True, index=True)  # Azure AD Email
    planned_start = db.Column(db.DateTime, nullable=True)
    planned_end = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='Open')  # Open, In Progress, Completed, Cancelled
    elevator_id = db.Column(db.Integer, db.ForeignKey('elevator.id'), nullable=True)
    priority = db.Column(db.String(20), default='Medium')  # High, Medium, Low
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    elevator = db.relationship('Elevator', backref='orders')

class Elevator(db.Model):
    """Stammdaten für Aufzugsanlagen"""
    id = db.Column(db.Integer, primary_key=True)
    manufacturer = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Passenger, Freight, Hydraulic, Traction
    installation_date = db.Column(db.Date, nullable=True)
    location_address = db.Column(db.String(200), nullable=False)
    components = db.Column(db.Text, nullable=True)  # JSON für Komponenten
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Arbeitszeit(db.Model):
    id = db.Column(db.String(36), primary_key=True)  # UUID
    datum = db.Column(db.Date, nullable=False)
    start = db.Column(db.String(5), nullable=False)
    stop = db.Column(db.String(5), nullable=False)
    dauer = db.Column(db.String(10), nullable=False)
    notdienstwoche = db.Column(db.String(1), default='0')
    quelle = db.Column(db.String(20), default='manuell')
    bemerkung = db.Column(db.Text, nullable=True)

# Datenbank initialisieren
if db:
    with app.app_context():
        try:
            db.create_all()
            app.logger.debug("Datenbank erfolgreich initialisiert")
        except Exception as e:
            app.logger.error(f"Fehler beim Erstellen der Datenbank: {str(e)}")

CSV_FILE = 'zeiterfassung.csv'
FIELDNAMES = [
    'id', 'elevator_id', 'location', 'date', 'activity_type', 'other_activity',
    'start_time', 'end_time', 'emergency_week', 'notes', 'status', 'mitarbeiter', 'comment', 'history'
]

AUFTRAEGE_CSV = 'auftraege.csv'
AUFTRAG_FIELDS = ['id','art','uhrzeit','standort','coords','details','done']

ARBEITSZEIT_CSV = 'arbeitszeit.csv'
ARBEITSZEIT_FIELDS = ['id','datum','start','stop','dauer','notdienstwoche','quelle','bemerkung']

# Dummy-User für das Template (wird durch echten User ersetzt)
class DummyUser:
    initials = 'RL'
    email = 'robert.lackner@lackner-aufzuege.com'
    is_admin = True
    can_approve = True
user = DummyUser()

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

def lade_auftraege():
    auftraege = []
    if os.path.exists(AUFTRAEGE_CSV):
        with open(AUFTRAEGE_CSV, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['done'] = row.get('done','False') == 'True'
                row['coords'] = json.loads(row['coords']) if row.get('coords') else None
                auftraege.append(row)
    else:
        # Demo-Daten initialisieren, falls Datei nicht existiert
        demo = [
            {"id": 1, "art": "Reparatur", "uhrzeit": "07:30", "standort": "Hauptbahnhof, München", "coords": [48.1402, 11.5586], "details": "Aufzug klemmt, Notruf ausgelöst.", "done": False},
            {"id": 2, "art": "Wartung", "uhrzeit": "08:15", "standort": "Sendlinger Tor, München", "coords": [48.1325, 11.5674], "details": "Regelmäßige Wartung, Ölwechsel.", "done": False},
            {"id": 3, "art": "Modernisierung", "uhrzeit": "09:00", "standort": "Odeonsplatz, München", "coords": [48.1421, 11.5802], "details": "Umbau Steuerung, neue Kabine.", "done": False},
            {"id": 4, "art": "Reparatur", "uhrzeit": "10:00", "standort": "Theresienwiese, München", "coords": [48.1319, 11.5496], "details": "Türkontakt defekt.", "done": False},
            {"id": 5, "art": "Wartung", "uhrzeit": "11:00", "standort": "Marienplatz, München", "coords": [48.1374, 11.5755], "details": "Wartung, Sichtprüfung.", "done": False},
            {"id": 6, "art": "Modernisierung", "uhrzeit": "12:00", "standort": "Lehel, München", "coords": [48.1446, 11.5912], "details": "Neuer Antrieb.", "done": False},
            {"id": 7, "art": "Reparatur", "uhrzeit": "13:30", "standort": "Giesing, München", "coords": [48.1147, 11.5886], "details": "Hydraulikleck.", "done": False},
            {"id": 8, "art": "Wartung", "uhrzeit": "14:00", "standort": "Pasing, München", "coords": [48.1486, 11.4637], "details": "Wartung, Reinigung.", "done": True},
            {"id": 9, "art": "Modernisierung", "uhrzeit": "15:00", "standort": "Schwabing, München", "coords": [48.1596, 11.5861], "details": "Kabine erneuern.", "done": True},
            {"id": 10, "art": "Reparatur", "uhrzeit": "16:00", "standort": "Moosach, München", "coords": [48.1767, 11.5021], "details": "Steuerungsausfall.", "done": True},
        ]
        with open(AUFTRAEGE_CSV, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=AUFTRAG_FIELDS)
            writer.writeheader()
            for a in demo:
                a = a.copy()
                a['coords'] = json.dumps(a['coords'])
                a['done'] = str(a['done'])
                writer.writerow(a)
        return lade_auftraege()
    return auftraege

def speichere_auftraege(auftraege):
    with open(AUFTRAEGE_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=AUFTRAG_FIELDS)
        writer.writeheader()
        for a in auftraege:
            a = a.copy()
            a['coords'] = json.dumps(a['coords']) if isinstance(a['coords'], (list, tuple)) else a['coords']
            a['done'] = str(a['done'])
            writer.writerow(a)

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
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    history = []
    if eintrag.get('history'):
        try:
            history = json.loads(eintrag['history'])
        except Exception:
            history = []
    history.append({'timestamp': now, 'action': action, 'comment': comment or ''})
    eintrag['history'] = json.dumps(history, ensure_ascii=False)

@app.route('/zeiterfassung', methods=['GET', 'POST'])
def zeiterfassung():
    try:
        # Temporär deaktiviert für lokales Testing
        # if 'user' not in session:
        #     app.logger.debug("Benutzer nicht in der Sitzung, Umleitung zu Login")
        #     return redirect(url_for('login'))
        
        # (Bisherige Logik aus index() für Zeiterfassung hierher verschieben)
        eintraege = lade_zeiteintraege()
        pending_count = len([e for e in eintraege if e.get('status') == 'pending'])
        if request.method == 'POST':
            start = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            auftrag = request.form['auftrag']
            notiz = request.form['notiz']
            neue_id = str(max([int(e['id']) for e in eintraege], default=0) + 1)
            eintrag = {
                'id': neue_id,
                'start': start,
                'ende': '',
                'auftrag': auftrag,
                'notiz': notiz
            }
            eintraege.append(eintrag)
            speichere_zeiteintraege(eintraege)
            return redirect(url_for('zeiterfassung'))
        return render_template('zeiterfassung.html', eintraege=eintraege, user=session['user'], today=get_today(), pending_count=pending_count)
    except Exception as e:
        app.logger.error(f"Fehler in zeiterfassung: {str(e)}")
        return f"Fehler in zeiterfassung: {str(e)}", 500

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
        arbeitszeit_eintraege = lade_arbeitszeit()
        heute = date.today().isoformat()
        heutige_arbeitszeit = [e for e in arbeitszeit_eintraege if e.get('datum') == heute]
        
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
        
        ## Verbleibende Zeit
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
                'is_admin': user.get('is_admin', True),
                'can_approve': user.get('can_approve', True)
            },
            'dashboard_data': {
                'stoerungen': stoerungen,
                'auftraege': auftraege,
                'heutige_arbeitszeit': heutige_arbeitszeit,
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

@app.route('/entries')
@requires_any_role('Supervisor', 'Admin')
def entries():
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
        # Datumsfilter
        if filter_date_type == 'today':
            if e.get('date') != date.today().isoformat():
                continue
        elif filter_date_type == 'yesterday':
            if e.get('date') != (date.today() - timedelta(days=1)).isoformat():
                continue
        elif filter_date_type == 'custom':
            if filter_date_start and e.get('date') < filter_date_start:
                continue
            if filter_date_end and e.get('date') > filter_date_end:
                continue
        filtered.append(e)
    # Elevator-IDs für Filter
    elevator_ids = sorted(set(e['elevator_id'] for e in eintraege if e['elevator_id']))
    # Format für Tabelle
    entries = []
    for e in filtered:
        activity = e['other_activity'] if e['activity_type'] == 'other' and e['other_activity'] else e['activity_type']
        entries.append({
            'id': e['id'],
            'elevator_id': e['elevator_id'],
            'location': e['location'],
            'date': e['date'],
            'task': activity,
            'time_range': f"{e['start_time']} - {e['end_time']}",
            'duration': berechne_dauer(e['start_time'], e['end_time']),
            'emergency_week': e['emergency_week'],
            'notes': e['notes'],
            'status': e.get('status', 'pending')
        })
    # API-Endpoint für Frontend
    if request.headers.get('Accept') == 'application/json':
        return jsonify(entries)
    
    return jsonify({'entries': entries, 'elevator_ids': elevator_ids})

@app.route('/edit_entry/<id>', methods=['POST'])
def edit_entry(id):
    data = request.get_json()
    eintraege = lade_zeiteintraege()
    found = False
    for e in eintraege:
        if e['id'] == id:
            e['elevator_id'] = data.get('elevator_id', '').strip()
            e['location'] = data.get('location', '').strip()
            e['date'] = data.get('entry_date', '')
            e['activity_type'] = data.get('activity_type', '')
            e['other_activity'] = data.get('other_activity', '')
            e['start_time'] = data.get('start_time', '')
            e['end_time'] = data.get('end_time', '')
            e['emergency_week'] = 'Ja' if data.get('emergency_week') == 'yes' else 'Nein'
            e['notes'] = data.get('notes', '')
            found = True
            break
    if found:
        speichere_zeiteintraege(eintraege)
        return jsonify({'status': 'success', 'message': 'Eintrag aktualisiert.'})
    else:
        return jsonify({'status': 'error', 'message': 'Eintrag nicht gefunden.'}), 404

@app.route('/delete_entry/<id>', methods=['DELETE'])
def delete_entry(id):
    eintraege = lade_zeiteintraege()
    neue_eintraege = [e for e in eintraege if e['id'] != id]
    if len(neue_eintraege) != len(eintraege):
        speichere_zeiteintraege(neue_eintraege)
        return jsonify({'status': 'success', 'message': 'Eintrag gelöscht.'})
    else:
        return jsonify({'status': 'error', 'message': 'Eintrag nicht gefunden.'}), 404

@app.route('/export')
@requires_any_role('Supervisor', 'Admin')
def export():
    eintraege = lade_zeiteintraege()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(eintraege)
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='zeiterfassung_export.csv'
    )

@app.route('/api/auftraege', methods=['GET', 'POST'])
def api_auftraege():
    if request.method == 'GET':
        auftraege = lade_auftraege()
        # API-Endpoint für Frontend
        if request.headers.get('Accept') == 'application/json':
            return jsonify(auftraege)
        return jsonify(auftraege)
    elif request.method == 'POST':
        data = request.get_json()
        auftraege = lade_auftraege()
        for a in auftraege:
            if str(a['id']) == str(data.get('id')):
                a['done'] = bool(data.get('done'))
        speichere_auftraege(auftraege)
        return jsonify({'status':'ok'})

# Dummy-Routen für User-Menü
@app.route('/logout', methods=['GET', 'POST', 'OPTIONS'])
def logout():
    # CORS-Headers für OPTIONS-Requests
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3002')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Session löschen
    session.clear()
    
    if request.method == 'POST':
        response = jsonify({'success': True, 'message': 'Erfolgreich abgemeldet'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3002')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # GET: Redirect zur Login-Seite
    return redirect(url_for('login'))

@app.route('/login')
def login():
    try:
        # Prüfe ob wir in Azure sind
        if os.getenv('FLASK_ENV') == 'production' or os.getenv('WEBSITE_HOSTNAME'):
            # In Azure - MS365 Login aktivieren
            app.logger.info("Azure-Umgebung erkannt - MS365 Login aktiviert")
            return redirect(url_for('login_ms365'))
        else:
            # Lokale Entwicklung - Dev-Login verwenden
            app.logger.info("Lokale Entwicklung - Dev-Login verwenden")
            return redirect(url_for('dev_login'))
    except Exception as e:
        app.logger.error(f"Fehler beim Login: {str(e)}")
        return f"Fehler beim Login: {str(e)}", 500

@app.route('/login_ms365')
def login_ms365():
    try:
        # MS365 Login aktivieren für Azure
        app.logger.info("MS365 Login aktiviert")
        oauth = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, scope=SCOPES)
        oauth.requests_timeout = 10
        authorization_url, state = oauth.authorization_url(AUTH_URL)
        session['oauth_state'] = state
        app.logger.debug(f"Authorization URL: {authorization_url}, State: {state}")
        return redirect(authorization_url)
    except Exception as e:
        app.logger.error(f"Fehler in login_ms365: {str(e)}")
        return f"Fehler beim Initiieren des Microsoft 365 Logins: {str(e)}", 500

@app.route('/auth/callback')
def callback():
    try:
        start_time = time.time()
        request_url = request.url
        app.logger.debug(f"Request URL: {request_url}")

        if 'oauth_state' not in session:
            app.logger.error("OAuth-State nicht in der Sitzung gefunden")
            return "OAuth-State nicht in der Sitzung gefunden", 400

        oauth = OAuth2Session(CLIENT_ID, state=session['oauth_state'], redirect_uri=REDIRECT_URI)
        oauth.requests_timeout = 10
        state = session.pop('oauth_state', None)

        try:
            token = oauth.fetch_token(TOKEN_URL, client_secret=CLIENT_SECRET, authorization_response=request_url)
        except Exception as e:
            if 'invalid_grant' in str(e).lower() and 'oauth_token' in session:
                app.logger.debug("Ungültiger Autorisierungscode, versuche Refresh-Token")
                oauth = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI)
                token = session['oauth_token']
                refresh_token = token.get('refresh_token')
                if refresh_token:
                    token = oauth.refresh_token(TOKEN_URL, refresh_token=refresh_token, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
                else:
                    raise Exception("Kein Refresh-Token verfügbar, bitte erneut authentifizieren")
            else:
                raise e

        session['oauth_token'] = token
        app.logger.debug(f"Token: {token}")

        user_info = oauth.get('https://graph.microsoft.com/v1.0/me').json()
        app.logger.debug(f"User Info Response: {user_info}")

        email = user_info.get('mail') or user_info.get('userPrincipalName') or 'unknown@example.com'
        display_name = user_info.get('displayName') or 'Unknown User'

        if db:
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, name=display_name)
                if not User.query.first():
                    user.is_admin = True
                    user.can_approve = True
                db.session.add(user)
                db.session.commit()

            if email == 'info@robert-lackner.de':
                user.is_admin = True
                user.can_approve = True
                db.session.commit()
        else:
            app.logger.warning("Datenbank nicht verfügbar, überspringe Benutzererstellung")

        session['user'] = {
            'name': display_name,
            'email': email,
            'initials': ''.join(word[0].upper() for word in display_name.split()),
            'is_admin': True if not db else user.is_admin,
            'can_approve': True if not db else user.can_approve
        }
        app.logger.debug(f"Sitzungsbenutzer gesetzt: {session['user']}")
        app.logger.debug(f"Callback-Route dauerte {time.time() - start_time} Sekunden")
        return redirect(url_for('dashboard'))

    except Exception as e:
        app.logger.error(f"Fehler in callback: {str(e)}")
        return f"Authentifizierungsfehler: {str(e)}", 500

# Alte dev_login Route entfernt - wird durch neue RBAC-Version ersetzt

@app.route('/approve_entries', methods=['GET', 'POST'])
@requires_any_role('Supervisor', 'Admin')
def approve_entries():
    
    eintraege = lade_zeiteintraege()
    # Filter
    mitarbeiter_liste = sorted(set(e.get('mitarbeiter', 'Unbekannt') for e in eintraege))
    filtered = eintraege
    if request.method == 'POST':
        emp = request.form.get('employee', '')
        start = request.form.get('start', '')
        end = request.form.get('end', '')
        status = request.form.get('status', '')
        if emp:
            filtered = [e for e in filtered if e.get('mitarbeiter') == emp]
        if start:
            filtered = [e for e in filtered if e.get('date') >= start]
        if end:
            filtered = [e for e in filtered if e.get('date') <= end]
        if status:
            filtered = [e for e in filtered if e.get('status') == status]
    # Trenne in pending und beantwortete Einträge
    pending_entries = []
    answered_entries = []
    for e in filtered:
        activity = e['other_activity'] if e['activity_type'] == 'other' and e['other_activity'] else e['activity_type']
        # History parsen
        history = []
        if e.get('history'):
            try:
                history = json.loads(e['history'])
            except Exception:
                history = []
        eintrag = {
            'id': e['id'],
            'mitarbeiter': e.get('mitarbeiter', 'Unbekannt'),
            'date': e['date'],
            'elevator_id': e['elevator_id'],
            'task': activity,
            'time_range': f"{e['start_time']} - {e['end_time']}",
            'duration': berechne_dauer(e['start_time'], e['end_time']),
            'emergency_week': e['emergency_week'],
            'notes': e['notes'],
            'status': e.get('status', 'pending'),
            'comment': e.get('comment', ''),
            'history': history
        }
        if eintrag['status'] == 'pending':
            pending_entries.append(eintrag)
        elif eintrag['status'] in ('approved', 'rejected'):
            answered_entries.append(eintrag)
    pending_count = len([e for e in eintraege if e.get('status') == 'pending'])
    return render_template('approve_entries.html',
        pending_entries=pending_entries,
        answered_entries=answered_entries,
        mitarbeiter_liste=mitarbeiter_liste,
        user=session.get('user', user),
        today=get_today(),
        pending_count=pending_count
    )

@app.route('/approve_entry/<id>', methods=['POST'])
@requires_any_role('Supervisor', 'Admin')
def approve_entry(id):
    eintraege = lade_zeiteintraege()
    for e in eintraege:
        if e['id'] == id:
            e['status'] = 'approved'
            append_history(e, 'genehmigt', e.get('comment', ''))
            break
    speichere_zeiteintraege(eintraege)
    return redirect(url_for('approve_entries'))

@app.route('/reject_entry/<id>', methods=['POST'])
@requires_any_role('Supervisor', 'Admin')
def reject_entry(id):
    eintraege = lade_zeiteintraege()
    for e in eintraege:
        if e['id'] == id:
            e['status'] = 'rejected'
            append_history(e, 'abgelehnt', e.get('comment', ''))
            break
    speichere_zeiteintraege(eintraege)
    return redirect(url_for('approve_entries'))

@app.route('/edit_entry_status/<id>', methods=['POST'])
@requires_any_role('Supervisor', 'Admin')
def edit_entry_status(id):
    eintraege = lade_zeiteintraege()
    for e in eintraege:
        if e['id'] == id:
            append_history(e, 'zurückgesetzt', e.get('comment', ''))
            e['status'] = 'pending'
            break
    speichere_zeiteintraege(eintraege)
    return redirect(url_for('approve_entries'))

@app.route('/comment_entry/<id>', methods=['POST'])
@requires_any_role('Supervisor', 'Admin')
def comment_entry(id):
    eintraege = lade_zeiteintraege()
    comment = request.form.get('comment', '')
    for e in eintraege:
        if e['id'] == id:
            e['comment'] = comment
            break
    speichere_zeiteintraege(eintraege)
    return redirect(url_for('approve_entries'))

@app.route('/manage_users')
def manage_users():
    return redirect(url_for('index'))

def bayern_feiertage(year):
    # Feste Feiertage
    feiertage = set([
        date(year, 1, 1),   # Neujahr
        date(year, 5, 1),   # Tag der Arbeit
        date(year, 8, 15),  # Mariä Himmelfahrt
        date(year, 10, 3),  # Tag der Deutschen Einheit
        date(year, 11, 1),  # Allerheiligen
        date(year, 12, 25), # 1. Weihnachtstag
        date(year, 12, 26), # 2. Weihnachtstag
    ])
    # Bewegliche Feiertage (Ostern)
    def ostersonntag(y):
        a = y % 19
        b = y // 100
        c = y % 100
        d = b // 4
        e = b % 4
        f = (b + 8) // 25
        g = (b - f + 1) // 3
        h = (19 * a + b - d - g + 15) % 30
        i = c // 4
        k = c % 4
        l = (32 + 2 * e + 2 * i - h - k) % 7
        m = (a + 11 * h + 22 * l) // 451
        month = (h + l - 7 * m + 114) // 31
        day = ((h + l - 7 * m + 114) % 31) + 1
        return date(y, month, day)
    ostern = ostersonntag(year)
    feiertage.update([
        ostern - timedelta(days=2),   # Karfreitag
        ostern + timedelta(days=1),   # Ostermontag
        ostern + timedelta(days=39),  # Christi Himmelfahrt
        ostern + timedelta(days=50),  # Pfingstmontag
        ostern + timedelta(days=60),  # Fronleichnam
    ])
    return feiertage

@app.route('/urlaub', methods=['GET', 'POST'])
def urlaub():
    # Session-Prüfung für Azure aktivieren
    if os.getenv('FLASK_ENV') == 'production' or os.getenv('WEBSITE_HOSTNAME'):
        if 'user' not in session:
            return redirect(url_for('login'))
    
    urlaub_file = 'urlaub.csv'
    # Urlaube laden
    urlaube = []
    if os.path.exists(urlaub_file):
        with open(urlaub_file, encoding='utf-8') as f:
            reader = csv.reader(f)
            for idx, row in enumerate(reader):
                if len(row) >= 2:
                    urlaube.append({'id': str(idx), 'start': row[0], 'end': row[1], 'comment': row[2] if len(row) > 2 else ''})
    editing_id = None
    today_dt = date.today()
    if request.method == 'POST':
        if 'edit' in request.form:
            editing_id = request.form['edit']
        elif 'edit_id' in request.form:
            eid = request.form['edit_id']
            for u in urlaube:
                if u['id'] == eid:
                    orig_start = date.fromisoformat(u['start'])
                    orig_end = date.fromisoformat(u['end'])
                    new_start = date.fromisoformat(request.form['start'])
                    new_end = date.fromisoformat(request.form['end'])
                    # Nur zukünftige Tage dürfen geändert werden
                    if orig_end < today_dt:
                        # Komplett vergangener Urlaub: keine Änderung
                        continue
                    if orig_start < today_dt:
                        # Urlaub läuft schon: Start bleibt, Enddatum darf nicht vor heute liegen
                        u['start'] = u['start']
                        u['end'] = max(request.form['end'], today_dt.isoformat())
                    else:
                        # Urlaub in der Zukunft: alles änderbar
                        u['start'] = request.form['start']
                        u['end'] = request.form['end']
                    u['comment'] = request.form['comment']
            with open(urlaub_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                for u in urlaube:
                    writer.writerow([u['start'], u['end'], u['comment']])
            return redirect(url_for('urlaub'))
        elif 'delete' in request.form:
            del_id = request.form['delete']
            urlaube = [u for u in urlaube if u['id'] != del_id]
            with open(urlaub_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                for u in urlaube:
                    writer.writerow([u['start'], u['end'], u['comment']])
            return redirect(url_for('urlaub'))
        else:
            start = request.form.get('start')
            end = request.form.get('end')
            comment = request.form.get('comment', '')
            with open(urlaub_file, 'a', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([start, end, comment])
            return redirect(url_for('urlaub'))
    for u in urlaube:
        u['editing'] = (u['id'] == editing_id)
        try:
            u['is_past'] = date.fromisoformat(u['end']) < today_dt
        except Exception:
            u['is_past'] = False
    year = today_dt.year
    feiertage = bayern_feiertage(year)
    year_calendar = []
    urlaubstage = set()
    verbraucht = set()
    verplant = set()
    for u in urlaube:
        try:
            s = date.fromisoformat(u['start'])
            e = date.fromisoformat(u['end'])
            for d in range((e-s).days+1):
                tag = s + timedelta(days=d)
                # Nur Arbeitstage (Mo-Fr), keine Feiertage, keine Wochenenden
                if tag.weekday() < 5 and tag not in feiertage:
                    urlaubstage.add(tag)
                    if tag <= today_dt:
                        verbraucht.add(tag)
                    elif tag > today_dt:
                        verplant.add(tag)
        except Exception:
            pass
    for month in range(1, 13):
        cal = calendar.Calendar(firstweekday=0)
        month_days = list(cal.itermonthdays4(year, month))
        weeks = []
        week = []
        for y, m, d, wd in month_days:
            in_month = (m == month)
            day_obj = date(y, m, d)
            is_weekend = day_obj.weekday() >= 5
            week.append({
                'day': d if in_month else '',
                'is_holiday': in_month and day_obj in urlaubstage,
                'is_feiertag': in_month and day_obj in feiertage,
                'is_weekend': in_month and is_weekend,
                'in_month': in_month
            })
            if len(week) == 7:
                weeks.append(week)
                week = []
        if week:
            weeks.append(week)
        year_calendar.append({
            'name': date(year, month, 1).strftime('%B'),
            'weeks': weeks
        })
    tage_verbraucht = len([d for d in verbraucht if d.year == year])
    tage_verplant = len([d for d in verplant if d.year == year])
    jahresurlaub = 30
    tage_uebrig = max(0, jahresurlaub - tage_verbraucht - tage_verplant)
    # Legende für das Template
    legende = [
        {'farbe': 'bg-green-200', 'text': 'Urlaubstag'},
        {'farbe': 'bg-yellow-200', 'text': 'Feiertag'},
        {'farbe': 'border-2 border-yellow-300 bg-green-200', 'text': 'Urlaubstag & Feiertag'},
        {'farbe': 'text-gray-300', 'text': 'Nicht im Monat'},
        {'farbe': 'text-gray-400', 'text': 'Wochenende'},
    ]
    eintraege = lade_zeiteintraege()
    pending_count = len([e for e in eintraege if e.get('status') == 'pending'])
    return render_template('urlaub.html',
        year_calendar=year_calendar,
        urlaube=urlaube,
        today=get_today(),
        user=session.get('user', user),
        pending_count=pending_count,
        tage_verbraucht=tage_verbraucht,
        tage_verplant=tage_verplant,
        tage_uebrig=tage_uebrig,
        legende=legende
    )

@app.route('/add_entry', methods=['POST'])
def add_entry():
    # Session-Prüfung für Azure aktivieren
    if os.getenv('FLASK_ENV') == 'production' or os.getenv('WEBSITE_HOSTNAME'):
        if 'user' not in session:
            return jsonify({'status': 'error', 'message': 'Nicht angemeldet'}), 401
    
    data = request.get_json()
    eintraege = lade_zeiteintraege()
    # Neue ID bestimmen
    neue_id = str(max([int(e['id']) for e in eintraege if e['id'].isdigit()], default=0) + 1)
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
        'status': 'pending',
        'mitarbeiter': session.get('user', {}).get('email', 'Unbekannt'),
        'comment': '',
        'history': json.dumps([], ensure_ascii=False)
    }
    eintraege.append(eintrag)
    speichere_zeiteintraege(eintraege)
    return jsonify({'status': 'success', 'message': 'Eintrag gespeichert.'})

@app.route('/meine_auftraege')
def meine_auftraege():
    from datetime import datetime
    today = datetime.now().strftime('%d.%m.%Y')
    return render_template('meine_auftraege.html', today=today)

@app.template_filter('date_de')
def date_de(value):
    try:
        if value:
            return f"{value[8:10]}.{value[5:7]}.{value[0:4]}"
    except Exception:
        return value
    return ''

ARBEITSZEIT_CSV = 'arbeitszeit.csv'
ARBEITSZEIT_FIELDS = ['id','datum','start','stop','dauer','notdienstwoche','quelle','bemerkung']

def lade_arbeitszeit():
    if not os.path.exists(ARBEITSZEIT_CSV):
        return []
    with open(ARBEITSZEIT_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def speichere_arbeitszeit(eintraege):
    with open(ARBEITSZEIT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=ARBEITSZEIT_FIELDS)
        writer.writeheader()
        for e in eintraege:
            writer.writerow(e)

@app.route('/arbeitszeit', methods=['GET', 'POST'])
def arbeitszeit():
    eintraege = lade_arbeitszeit()
    
    if request.method == 'POST':
        # AJAX-Anfrage für automatische Arbeitszeit-Speicherung
        if request.headers.get('Content-Type') == 'application/json':
            data = request.get_json()
            if data.get('action') == 'save_session':
                # Arbeitszeit-Session-Daten speichern
                session['arbeitszeit_data'] = data.get('arbeitszeit_data', {})
                return jsonify({'status': 'success', 'message': 'Arbeitszeit-Daten gespeichert'})
            
            # Neuer Eintrag über JSON
            try:
                new_entry = {
                    'id': str(uuid.uuid4()),
                    'datum': data.get('datum', ''),
                    'start': data.get('start', ''),
                    'stop': data.get('stop', ''),
                    'dauer': data.get('dauer', ''),
                    'notdienstwoche': data.get('notdienstwoche', '0'),
                    'quelle': 'manuell',
                    'bemerkung': data.get('bemerkung', '')
                }
                
                # Validiere die Daten
                if not new_entry['datum'] or not new_entry['start'] or not new_entry['stop']:
                    return jsonify({'status': 'error', 'message': 'Alle Pflichtfelder müssen ausgefüllt werden'}), 400
                
                eintraege.append(new_entry)
                speichere_arbeitszeit(eintraege)
                return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich hinzugefügt'})
                
            except Exception as e:
                app.logger.error(f'Error adding entry: {str(e)}')
                return jsonify({'status': 'error', 'message': f'Fehler beim Hinzufügen des Eintrags: {str(e)}'}), 500
        
        # Edit-Funktion
        if 'edit_id' in request.form:
            edit_id = request.form.get('edit_id')
            for e in eintraege:
                if e['id'] == edit_id:
                    # Prüfen ob Eintrag im aktuellen Monat ist
                    try:
                        entry_date = datetime.strptime(e['datum'], '%Y-%m-%d').date()
                        current_date = date.today()
                        if entry_date.year != current_date.year or entry_date.month != current_date.month:
                            if request.headers.get('Content-Type') == 'application/json':
                                return jsonify({'status': 'error', 'message': 'Nur Einträge des aktuellen Monats können bearbeitet werden.'}), 400
                            flash('Nur Einträge des aktuellen Monats können bearbeitet werden.', 'error')
                            break
                    except:
                        if request.headers.get('Content-Type') == 'application/json':
                            return jsonify({'status': 'error', 'message': 'Ungültiges Datum.'}), 400
                        flash('Ungültiges Datum.', 'error')
                        break
                    
                    e['datum'] = request.form.get('datum', '')
                    e['start'] = request.form.get('start', '')
                    e['stop'] = request.form.get('stop', '')
                    e['dauer'] = request.form.get('dauer', '')
                    e['notdienstwoche'] = request.form.get('notdienstwoche', '0')
                    e['bemerkung'] = request.form.get('bemerkung', '')
                    speichere_arbeitszeit(eintraege)
                    if request.headers.get('Content-Type') == 'application/json':
                        return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich bearbeitet.'})
                    flash('Eintrag erfolgreich bearbeitet.', 'success')
                    break
        else:
            # Neuer Eintrag über Form
            data = request.form
            new_entry = {
                'id': str(uuid.uuid4()),
                'datum': data.get('datum',''),
                'start': data.get('start'),
                'stop': data.get('stop'),
                'dauer': data.get('dauer'),
                'notdienstwoche': data.get('notdienstwoche','0'),
                'quelle': 'manuell',
                'bemerkung': data.get('bemerkung','')
            }
            eintraege.append(new_entry)
            speichere_arbeitszeit(eintraege)
            if request.headers.get('Content-Type') == 'application/json':
                return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich hinzugefügt.'})
            flash('Eintrag erfolgreich hinzugefügt.', 'success')
    
    # Erweiterte Filterung
    q = request.args.get('q', '')
    month = request.args.get('month', '')
    year = request.args.get('year', '')
    
    gefiltert = eintraege
    
    # Text-Suche
    if q:
        gefiltert = [e for e in gefiltert if q.lower() in (e.get('bemerkung','')+e.get('start','')+e.get('stop','')).lower()]
    
    # Monats-Filter
    if month:
        gefiltert = [e for e in gefiltert if e.get('datum') and datetime.strptime(e['datum'], '%Y-%m-%d').month == int(month)]
    
    # Jahres-Filter
    if year:
        gefiltert = [e for e in gefiltert if e.get('datum') and datetime.strptime(e['datum'], '%Y-%m-%d').year == int(year)]
    
    # Sortierung nach Datum (neueste zuerst)
    gefiltert.sort(key=lambda x: x.get('datum', ''), reverse=True)
    
    # API-Endpoint für Frontend
    if request.headers.get('Accept') == 'application/json':
        return jsonify(gefiltert)
    
    return render_template('arbeitszeit.html', eintraege=gefiltert, q=q, month=month, year=year)

@app.route('/arbeitszeit/save_session', methods=['POST'])
def save_arbeitszeit_session():
    """Speichert Arbeitszeit-Session-Daten automatisch"""
    try:
        data = request.get_json()
        if data and 'arbeitszeit_data' in data:
            session['arbeitszeit_data'] = data['arbeitszeit_data']
            return jsonify({'status': 'success', 'message': 'Arbeitszeit-Daten gespeichert'})
        return jsonify({'status': 'error', 'message': 'Keine Daten erhalten'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/arbeitszeit/delete/<entry_id>', methods=['POST'])
def delete_arbeitszeit_entry(entry_id):
    eintraege = lade_arbeitszeit()
    for e in eintraege:
        if e['id'] == entry_id:
            # Prüfen ob Eintrag im aktuellen Monat ist
            try:
                entry_date = datetime.strptime(e['datum'], '%Y-%m-%d').date()
                current_date = date.today()
                if entry_date.year != current_date.year or entry_date.month != current_date.month:
                    return jsonify({'status': 'error', 'message': 'Nur Einträge des aktuellen Monats können gelöscht werden.'}), 400
            except:
                return jsonify({'status': 'error', 'message': 'Ungültiges Datum.'}), 400
            
            eintraege.remove(e)
            speichere_arbeitszeit(eintraege)
            return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich gelöscht.'})
    
    return jsonify({'status': 'error', 'message': 'Eintrag nicht gefunden.'}), 404

@app.route('/arbeitszeit/edit/<entry_id>', methods=['POST'])
def edit_arbeitszeit_entry(entry_id):
    eintraege = lade_arbeitszeit()
    
    # JSON-Request verarbeiten
    if request.headers.get('Content-Type') == 'application/json':
        data = request.get_json()
        
        for e in eintraege:
            if e['id'] == entry_id:
                # Prüfen ob Eintrag im aktuellen Monat ist
                try:
                    entry_date = datetime.strptime(e['datum'], '%Y-%m-%d').date()
                    current_date = date.today()
                    if entry_date.year != current_date.year or entry_date.month != current_date.month:
                        return jsonify({'status': 'error', 'message': 'Nur Einträge des aktuellen Monats können bearbeitet werden.'}), 400
                except:
                    return jsonify({'status': 'error', 'message': 'Ungültiges Datum.'}), 400
                
                # Update Eintrag
                e['datum'] = data.get('datum', e['datum'])
                e['start'] = data.get('start', e['start'])
                e['stop'] = data.get('stop', e['stop'])
                e['dauer'] = data.get('dauer', e['dauer'])
                e['notdienstwoche'] = data.get('notdienstwoche', e['notdienstwoche'])
                e['bemerkung'] = data.get('bemerkung', e['bemerkung'])
                
                speichere_arbeitszeit(eintraege)
                return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich bearbeitet.'})
        
        return jsonify({'status': 'error', 'message': 'Eintrag nicht gefunden.'}), 404
    
    # Form-Request verarbeiten (für Kompatibilität)
    data = request.form
    for e in eintraege:
        if e['id'] == entry_id:
            # Prüfen ob Eintrag im aktuellen Monat ist
            try:
                entry_date = datetime.strptime(e['datum'], '%Y-%m-%d').date()
                current_date = date.today()
                if entry_date.year != current_date.year or entry_date.month != current_date.month:
                    return jsonify({'status': 'error', 'message': 'Nur Einträge des aktuellen Monats können bearbeitet werden.'}), 400
            except:
                return jsonify({'status': 'error', 'message': 'Ungültiges Datum.'}), 400
            
            # Update Eintrag
            e['datum'] = data.get('datum', e['datum'])
            e['start'] = data.get('start', e['start'])
            e['stop'] = data.get('stop', e['stop'])
            e['dauer'] = data.get('dauer', e['dauer'])
            e['notdienstwoche'] = data.get('notdienstwoche', e['notdienstwoche'])
            e['bemerkung'] = data.get('bemerkung', e['bemerkung'])
            
            speichere_arbeitszeit(eintraege)
            return jsonify({'status': 'success', 'message': 'Eintrag erfolgreich bearbeitet.'})
    
    return jsonify({'status': 'error', 'message': 'Eintrag nicht gefunden.'}), 404

@app.route('/arbeitszeit/export')
@requires_any_role('Supervisor', 'Admin')
def arbeitszeit_export():
    return send_file(ARBEITSZEIT_CSV, as_attachment=True)

# Neue API-Routen für erweiterte Arbeitszeiterfassung
@app.route('/api/arbeitszeit-erfassung', methods=['GET', 'POST'])
def api_arbeitszeit_erfassung():
    if request.method == 'GET':
        # Alle Erfassungen des aktuellen Benutzers laden
        if 'user' not in session:
            return jsonify({'status': 'error', 'message': 'Nicht angemeldet'}), 401
        
        technician_id = session['user']['email']
        erfassungen = ArbeitszeitErfassung.query.filter_by(technician_id=technician_id).order_by(ArbeitszeitErfassung.created_at.desc()).all()
        
        result = []
        for e in erfassungen:
            result.append({
                'id': e.id,
                'order_id': e.order_id,
                'start_time': e.start_time.isoformat() if e.start_time else None,
                'end_time': e.end_time.isoformat() if e.end_time else None,
                'duration': str(e.duration) if e.duration else None,
                'category': e.category,
                'pauses': json.loads(e.pauses) if e.pauses else [],
                'notes': e.notes,
                'attachments': json.loads(e.attachments) if e.attachments else [],
                'overtime': e.overtime,
                'status': e.status,
                'created_at': e.created_at.isoformat()
            })
        
        return jsonify(result)
    
    elif request.method == 'POST':
        # Neue Erfassung erstellen
        if 'user' not in session:
            return jsonify({'status': 'error', 'message': 'Nicht angemeldet'}), 401
        
        data = request.get_json()
        technician_id = session['user']['email']
        
        # Startzeit automatisch setzen wenn nicht vorhanden
        start_time = data.get('start_time')
        if not start_time:
            start_time = datetime.utcnow()
        else:
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        erfassung = ArbeitszeitErfassung(
            order_id=data.get('order_id'),
            technician_id=technician_id,
            start_time=start_time,
            category=data.get('category', 'Arbeitszeit'),
            notes=data.get('notes', ''),
            pauses=json.dumps(data.get('pauses', [])),
            attachments=json.dumps(data.get('attachments', []))
        )
        
        db.session.add(erfassung)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Erfassung gestartet',
            'id': erfassung.id
        })

@app.route('/api/arbeitszeit-erfassung/<int:entry_id>', methods=['PUT', 'DELETE'])
def api_arbeitszeit_erfassung_detail(entry_id):
    erfassung = ArbeitszeitErfassung.query.get_or_404(entry_id)
    
    if request.method == 'PUT':
        # Erfassung aktualisieren (z.B. beenden)
        data = request.get_json()
        
        if 'end_time' in data:
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            erfassung.end_time = end_time
            
            # Dauer berechnen
            duration = end_time - erfassung.start_time
            erfassung.duration = duration
            
            # Überstunden prüfen (mehr als 8 Stunden)
            if duration.total_seconds() > 8 * 3600:
                erfassung.overtime = True
        
        if 'category' in data:
            erfassung.category = data['category']
        
        if 'notes' in data:
            erfassung.notes = data['notes']
        
        if 'pauses' in data:
            erfassung.pauses = json.dumps(data['pauses'])
        
        if 'attachments' in data:
            erfassung.attachments = json.dumps(data['attachments'])
        
        if 'status' in data:
            erfassung.status = data['status']
        
        erfassung.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Erfassung aktualisiert'
        })
    
    elif request.method == 'DELETE':
        # Erfassung löschen
        db.session.delete(erfassung)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Erfassung gelöscht'
        })

@app.route('/api/arbeitszeit-erfassung/<int:entry_id>/pause', methods=['POST'])
def api_arbeitszeit_pause(entry_id):
    erfassung = ArbeitszeitErfassung.query.get_or_404(entry_id)
    data = request.get_json()
    
    pauses = json.loads(erfassung.pauses) if erfassung.pauses else []
    
    if data.get('action') == 'start':
        # Pause starten
        pause = {
            'start': datetime.utcnow().isoformat(),
            'end': None,
            'duration': None
        }
        pauses.append(pause)
        erfassung.pauses = json.dumps(pauses)
    
    elif data.get('action') == 'stop':
        # Pause beenden
        if pauses and pauses[-1]['end'] is None:
            pause_end = datetime.utcnow()
            pause_start = datetime.fromisoformat(pauses[-1]['start'])
            pause_duration = pause_end - pause_start
            
            pauses[-1]['end'] = pause_end.isoformat()
            pauses[-1]['duration'] = str(pause_duration)
            erfassung.pauses = json.dumps(pauses)
    
    erfassung.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Pause aktualisiert'
    })

@app.route('/api/arbeitszeit-report', methods=['GET'])
@requires_any_role('Supervisor', 'Admin')
def api_arbeitszeit_report():
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Nicht angemeldet'}), 401
    
    technician_id = session['user']['email']
    period = request.args.get('period', 'täglich')  # täglich, wöchentlich, monatlich
    
    # Zeitraum berechnen
    today = date.today()
    if period == 'täglich':
        start_date = today
        end_date = today
    elif period == 'wöchentlich':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    else:  # monatlich
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    
    # Erfassungen laden
    erfassungen = ArbeitszeitErfassung.query.filter(
        ArbeitszeitErfassung.technician_id == technician_id,
        ArbeitszeitErfassung.start_time >= datetime.combine(start_date, datetime.min.time()),
        ArbeitszeitErfassung.start_time <= datetime.combine(end_date, datetime.max.time())
    ).all()
    
    # Statistiken berechnen
    total_hours = 0
    overtime_hours = 0
    
    for e in erfassungen:
        if e.duration:
            hours = e.duration.total_seconds() / 3600
            total_hours += hours
            if e.overtime:
                overtime_hours += hours - 8  # Überstunden = Gesamt - 8 Stunden
    
    return jsonify({
        'period': period,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'total_hours': round(total_hours, 2),
        'overtime_hours': round(overtime_hours, 2),
        'entries_count': len(erfassungen)
    })

@app.route('/api/arbeitszeit', methods=['GET'])
def api_arbeitszeit():
    """API-Route für Arbeitszeit-Daten im JSON-Format"""
    try:
        eintraege = lade_arbeitszeit()
        return jsonify(eintraege)
    except Exception as e:
        app.logger.error(f'Error loading arbeitszeit data: {str(e)}')
        return jsonify({'error': 'Fehler beim Laden der Arbeitszeit-Daten'}), 500

# User Management Funktionen
def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def get_user_by_azure_id(azure_id):
    return User.query.filter_by(azure_id=azure_id).first()

def create_user(email, name, role='Monteur', azure_id=None):
    user = User(
        email=email,
        name=name,
        role=role,
        azure_id=azure_id,
        is_admin=(role == 'Admin'),
        can_approve=(role in ['Supervisor', 'Admin'])
    )
    db.session.add(user)
    db.session.commit()
    return user

def update_user_role(user_id, new_role):
    user = User.query.get(user_id)
    if user:
        user.role = new_role
        user.is_admin = (new_role == 'Admin')
        user.can_approve = (new_role in ['Supervisor', 'Admin'])
        db.session.commit()
        return True
    return False

# Admin Routes für User Management
@app.route('/admin/users')
@requires_role('Admin')
def admin_users():
    users = User.query.all()
    return render_template('admin_users.html', users=users, roles=ROLES)

@app.route('/admin/users/<int:user_id>', methods=['GET', 'POST'])
@requires_role('Admin')
def admin_edit_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        user.name = request.form.get('name', user.name)
        user.email = request.form.get('email', user.email)
        user.role = request.form.get('role', user.role)
        user.is_active = 'is_active' in request.form
        
        user.is_admin = (user.role == 'Admin')
        user.can_approve = (user.role in ['Supervisor', 'Admin'])
        
        db.session.commit()
        flash('Benutzer erfolgreich aktualisiert.', 'success')
        return redirect(url_for('admin_users'))
    
    return render_template('admin_edit_user.html', user=user, roles=ROLES)

@app.route('/admin/users/new', methods=['GET', 'POST'])
@requires_role('Admin')
def admin_new_user():
    if request.method == 'POST':
        email = request.form.get('email')
        name = request.form.get('name')
        role = request.form.get('role', 'Monteur')
        
        if get_user_by_email(email):
            flash('Benutzer mit dieser E-Mail existiert bereits.', 'error')
        else:
            create_user(email, name, role)
            flash('Benutzer erfolgreich erstellt.', 'success')
            return redirect(url_for('admin_users'))
    
    return render_template('admin_new_user.html', roles=ROLES)

@app.route('/admin/users/<int:user_id>/delete', methods=['POST'])
@requires_role('Admin')
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Verhindere Selbstlöschung
    if user.id == session.get('user', {}).get('id'):
        flash('Sie können sich nicht selbst löschen.', 'error')
        return redirect(url_for('admin_users'))
    
    db.session.delete(user)
    db.session.commit()
    flash('Benutzer erfolgreich gelöscht.', 'success')
    return redirect(url_for('admin_users'))

# API Routes für User Management
@app.route('/api/users', methods=['GET'])
@requires_role('Admin')
def api_users():
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None
    } for user in users])

@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@requires_role('Admin')
def api_update_user_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ROLES:
        return jsonify({'error': 'Ungültige Rolle'}), 400
    
    if update_user_role(user_id, new_role):
        return jsonify({'success': True, 'message': 'Rolle erfolgreich aktualisiert'})
    else:
        return jsonify({'error': 'Benutzer nicht gefunden'}), 404

# Erweiterte Login-Funktion für Azure AD Integration (später)
def handle_azure_login(azure_user_info):
    """Behandelt Azure AD Login und erstellt/aktualisiert User"""
    try:
        email = azure_user_info.get('email')
        azure_id = azure_user_info.get('oid')
        name = azure_user_info.get('name', email)
        
        if not email:
            app.logger.error("Keine Email in Azure User Info")
            return False
        
        # User in DB finden oder erstellen
        user = get_user_by_email(email)
        if not user:
            # Neuen User erstellen
            user = create_user(email, name, 'Monteur', azure_id)
            app.logger.info(f"Neuer User erstellt: {email}")
        else:
            # Bestehenden User aktualisieren
            user.azure_id = azure_id
            user.name = name
            user.last_login = datetime.utcnow()
            db.session.commit()
            app.logger.info(f"User aktualisiert: {email}")
        
        # Session-Daten für Frontend setzen
        session['user'] = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'is_admin': user.is_admin,
            'can_approve': user.can_approve
        }
        
        app.logger.info(f"Login erfolgreich: {email} ({user.role})")
        return True
        
    except Exception as e:
        app.logger.error(f"Fehler beim Azure Login: {str(e)}")
        return False

# Temporärer Dev-Login erweitert
@app.route('/dev_login', methods=['GET', 'POST', 'OPTIONS'])
def dev_login():
    # CORS-Headers für OPTIONS-Requests
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3002')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    if request.method == 'POST':
        # Benutzer-Umschaltung über POST
        data = request.get_json() or request.form
        email = data.get('email', 'admin@lackner-aufzuege.com')
        role = data.get('role', 'Admin')
        
        # User finden oder erstellen
        user = get_user_by_email(email)
        if not user:
            # User erstellen falls nicht vorhanden
            user = create_user(email, f'Test {role}', role)
        
        # Login als gewählter User
        handle_azure_login({
            'oid': f'dev-{role.lower()}-id',
            'email': email,
            'name': user.name
        })
        
        response = jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3002')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # GET: Standard Dev-Login (Admin)
    # Erstelle Admin-User falls nicht vorhanden
    admin_user = get_user_by_email('admin@lackner-aufzuege.com')
    if not admin_user:
        admin_user = create_user('admin@lackner-aufzuege.com', 'System Administrator', 'Admin')
    
    # Erstelle Test-User
    test_users = [
        ('monteur@lackner-aufzuege.com', 'Max Monteur', 'Monteur'),
        ('supervisor@lackner-aufzuege.com', 'Anna Supervisor', 'Supervisor'),
        ('admin@lackner-aufzuege.com', 'System Administrator', 'Admin'),
        ('buero@lackner-aufzuege.com', 'Maria Büro', 'Buero')
    ]
    
    for email, name, role in test_users:
        user = get_user_by_email(email)
        if not user:
            create_user(email, name, role)
    
    # Login als Admin
    handle_azure_login({
        'oid': 'dev-admin-id',
        'email': 'admin@lackner-aufzuege.com',
        'name': 'System Administrator'
    })
    
    return redirect(url_for('dashboard'))

# Büro-Interface API Endpunkte
@app.route('/api/orders', methods=['GET', 'POST'])
@requires_any_role('Buero', 'Admin')
def api_orders():
    """CRUD für Aufträge - nur für Büro/Admin"""
    if request.method == 'GET':
        # Filter nach assigned_user für Monteure
        user_role = session['user'].get('role', 'Monteur')
        user_email = session['user'].get('email')
        
        if user_role == 'Monteur':
            orders = Order.query.filter_by(assigned_user=user_email).all()
        else:
            orders = Order.query.all()
        
        return jsonify([{
            'id': order.id,
            'type': order.type,
            'description': order.description,
            'assigned_user': order.assigned_user,
            'planned_start': order.planned_start.isoformat() if order.planned_start else None,
            'planned_end': order.planned_end.isoformat() if order.planned_end else None,
            'status': order.status,
            'elevator_id': order.elevator_id,
            'priority': order.priority,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat()
        } for order in orders])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        order = Order(
            type=data.get('type'),
            description=data.get('description'),
            assigned_user=data.get('assigned_user'),
            planned_start=datetime.fromisoformat(data.get('planned_start')) if data.get('planned_start') else None,
            planned_end=datetime.fromisoformat(data.get('planned_end')) if data.get('planned_end') else None,
            status=data.get('status', 'Open'),
            elevator_id=data.get('elevator_id'),
            priority=data.get('priority', 'Medium')
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'id': order.id,
            'message': 'Auftrag erfolgreich erstellt'
        }), 201

@app.route('/api/orders/<int:order_id>', methods=['GET', 'PUT', 'DELETE'])
@requires_any_role('Buero', 'Admin')
def api_order_detail(order_id):
    """Einzelne Aufträge bearbeiten"""
    order = Order.query.get_or_404(order_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': order.id,
            'type': order.type,
            'description': order.description,
            'assigned_user': order.assigned_user,
            'planned_start': order.planned_start.isoformat() if order.planned_start else None,
            'planned_end': order.planned_end.isoformat() if order.planned_end else None,
            'status': order.status,
            'elevator_id': order.elevator_id,
            'priority': order.priority,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        order.type = data.get('type', order.type)
        order.description = data.get('description', order.description)
        order.assigned_user = data.get('assigned_user', order.assigned_user)
        order.planned_start = datetime.fromisoformat(data.get('planned_start')) if data.get('planned_start') else order.planned_start
        order.planned_end = datetime.fromisoformat(data.get('planned_end')) if data.get('planned_end') else order.planned_end
        order.status = data.get('status', order.status)
        order.elevator_id = data.get('elevator_id', order.elevator_id)
        order.priority = data.get('priority', order.priority)
        order.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Auftrag erfolgreich aktualisiert'})
    
    elif request.method == 'DELETE':
        # Soft-Delete: Status auf Cancelled setzen
        order.status = 'Cancelled'
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Auftrag erfolgreich storniert'})

@app.route('/api/elevators', methods=['GET', 'POST'])
@requires_any_role('Buero', 'Admin')
def api_elevators():
    """CRUD für Aufzugsanlagen"""
    if request.method == 'GET':
        elevators = Elevator.query.all()
        return jsonify([{
            'id': elevator.id,
            'manufacturer': elevator.manufacturer,
            'model': elevator.model,
            'type': elevator.type,
            'installation_date': elevator.installation_date.isoformat() if elevator.installation_date else None,
            'location_address': elevator.location_address,
            'components': elevator.components,
            'created_at': elevator.created_at.isoformat(),
            'updated_at': elevator.updated_at.isoformat()
        } for elevator in elevators])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        elevator = Elevator(
            manufacturer=data.get('manufacturer'),
            model=data.get('model'),
            type=data.get('type'),
            installation_date=datetime.strptime(data.get('installation_date'), '%Y-%m-%d').date() if data.get('installation_date') else None,
            location_address=data.get('location_address'),
            components=data.get('components')
        )
        
        db.session.add(elevator)
        db.session.commit()
        
        return jsonify({
            'id': elevator.id,
            'message': 'Aufzugsanlage erfolgreich erstellt'
        }), 201

@app.route('/api/elevators/<int:elevator_id>', methods=['GET', 'PUT', 'DELETE'])
@requires_any_role('Buero', 'Admin')
def api_elevator_detail(elevator_id):
    """Einzelne Aufzugsanlagen bearbeiten"""
    elevator = Elevator.query.get_or_404(elevator_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': elevator.id,
            'manufacturer': elevator.manufacturer,
            'model': elevator.model,
            'type': elevator.type,
            'installation_date': elevator.installation_date.isoformat() if elevator.installation_date else None,
            'location_address': elevator.location_address,
            'components': elevator.components,
            'created_at': elevator.created_at.isoformat(),
            'updated_at': elevator.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        elevator.manufacturer = data.get('manufacturer', elevator.manufacturer)
        elevator.model = data.get('model', elevator.model)
        elevator.type = data.get('type', elevator.type)
        elevator.installation_date = datetime.strptime(data.get('installation_date'), '%Y-%m-%d').date() if data.get('installation_date') else elevator.installation_date
        elevator.location_address = data.get('location_address', elevator.location_address)
        elevator.components = data.get('components', elevator.components)
        elevator.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Aufzugsanlage erfolgreich aktualisiert'})
    
    elif request.method == 'DELETE':
        db.session.delete(elevator)
        db.session.commit()
        
        return jsonify({'message': 'Aufzugsanlage erfolgreich gelöscht'})

@app.route('/api/users/available', methods=['GET'])
@requires_any_role('Buero', 'Admin')
def api_available_users():
    """Liste verfügbarer User für Zuweisung"""
    users = User.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role
    } for user in users])

@app.route('/api/time-entries', methods=['GET', 'POST'])
@requires_any_role('Buero', 'Admin')
def api_time_entries():
    """CRUD für Zeiterfassung - nur für Büro/Admin"""
    if request.method == 'GET':
        # Filter nach assigned_user für Monteure
        user_role = session['user'].get('role', 'Monteur')
        user_email = session['user'].get('email')
        
        if user_role == 'Monteur':
            entries = ArbeitszeitErfassung.query.filter_by(technician_id=user_email).all()
        else:
            entries = ArbeitszeitErfassung.query.all()
        
        return jsonify([{
            'id': entry.id,
            'order_id': entry.order_id,
            'technician_id': entry.technician_id,
            'start_time': entry.start_time.isoformat() if entry.start_time else None,
            'end_time': entry.end_time.isoformat() if entry.end_time else None,
            'duration': str(entry.duration) if entry.duration else None,
            'category': entry.category,
            'pauses': entry.pauses,
            'notes': entry.notes,
            'attachments': entry.attachments,
            'overtime': entry.overtime,
            'status': entry.status,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat()
        } for entry in entries])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        entry = ArbeitszeitErfassung(
            order_id=data.get('order_id'),
            technician_id=data.get('technician_id'),
            start_time=datetime.fromisoformat(data.get('start_time')) if data.get('start_time') else None,
            end_time=datetime.fromisoformat(data.get('end_time')) if data.get('end_time') else None,
            category=data.get('category', 'Arbeitszeit'),
            pauses=data.get('pauses'),
            notes=data.get('notes'),
            attachments=data.get('attachments'),
            overtime=data.get('overtime', False),
            status=data.get('status', 'offen')
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'id': entry.id,
            'message': 'Zeiteintrag erfolgreich erstellt'
        }), 201

@app.route('/api/time-entries/<int:entry_id>', methods=['GET', 'PUT', 'DELETE'])
@requires_any_role('Buero', 'Admin')
def api_time_entry_detail(entry_id):
    """Einzelne Zeiteinträge bearbeiten"""
    entry = ArbeitszeitErfassung.query.get_or_404(entry_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': entry.id,
            'order_id': entry.order_id,
            'technician_id': entry.technician_id,
            'start_time': entry.start_time.isoformat() if entry.start_time else None,
            'end_time': entry.end_time.isoformat() if entry.end_time else None,
            'duration': str(entry.duration) if entry.duration else None,
            'category': entry.category,
            'pauses': entry.pauses,
            'notes': entry.notes,
            'attachments': entry.attachments,
            'overtime': entry.overtime,
            'status': entry.status,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        entry.order_id = data.get('order_id', entry.order_id)
        entry.technician_id = data.get('technician_id', entry.technician_id)
        entry.start_time = datetime.fromisoformat(data.get('start_time')) if data.get('start_time') else entry.start_time
        entry.end_time = datetime.fromisoformat(data.get('end_time')) if data.get('end_time') else entry.end_time
        entry.category = data.get('category', entry.category)
        entry.pauses = data.get('pauses', entry.pauses)
        entry.notes = data.get('notes', entry.notes)
        entry.attachments = data.get('attachments', entry.attachments)
        entry.overtime = data.get('overtime', entry.overtime)
        entry.status = data.get('status', entry.status)
        entry.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Zeiteintrag erfolgreich aktualisiert'})
    
    elif request.method == 'DELETE':
        db.session.delete(entry)
        db.session.commit()
        
        return jsonify({'message': 'Zeiteintrag erfolgreich gelöscht'})

@app.route('/api/notifications/send', methods=['POST'])
@requires_any_role('Buero', 'Admin')
def api_send_notification():
    """Push-Benachrichtigung nach Auftragszuweisung"""
    data = request.get_json()
    user_email = data.get('user_email')
    message = data.get('message')
    
    # TODO: Implementiere Web Push API
    # Für jetzt: Logging
    app.logger.info(f"Push-Benachrichtigung an {user_email}: {message}")
    
    return jsonify({'message': 'Benachrichtigung gesendet'})

@app.route('/migrate', methods=['POST'])
def migrate():
    """Database Migration für Azure"""
    try:
        app.logger.info("Starte Database Migration...")
        
        # Erstelle alle Tabellen
        db.create_all()
        app.logger.info("✅ Tabellen erstellt")
        
        # Führe Migration aus
        from migrate_to_azure import migrate_to_azure
        migrate_to_azure()
        
        app.logger.info("✅ Migration erfolgreich abgeschlossen")
        return jsonify({'status': 'success', 'message': 'Migration erfolgreich'}), 200
        
    except Exception as e:
        app.logger.error(f"❌ Migration fehlgeschlagen: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

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

if __name__ == '__main__':
    app.run(debug=True)
