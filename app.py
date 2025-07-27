from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
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

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///zeiterfassung.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
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
if os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG') == '1':
    # Lokale Entwicklung
    REDIRECT_URI = 'http://localhost:5000/auth/callback'
    app.logger.info("Lokale Entwicklungsumgebung erkannt - verwende localhost")
else:
    # Produktionsumgebung
    REDIRECT_URI = 'https://la-zeiterfassung-fyd4cge3d9e3cac4.germanywestcentral-01.azurewebsites.net/auth/callback'
    app.logger.info("Produktionsumgebung erkannt - verwende Azure URL")

AUTHORITY = 'https://login.microsoftonline.com/3efb4b34-9ef2-4200-b749-2a501b2aaee6'
TOKEN_URL = f'{AUTHORITY}/oauth2/v2.0/token'
AUTH_URL = f'{AUTHORITY}/oauth2/v2.0/authorize'
SCOPES = ['openid', 'User.Read', 'profile', 'email']
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '0'

# Datenbankmodelle angepasst an Ihre CSV-Struktur
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    can_approve = db.Column(db.Boolean, default=False)

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

class Auftrag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    art = db.Column(db.String(50), nullable=False)
    uhrzeit = db.Column(db.String(5), nullable=False)
    standort = db.Column(db.String(100), nullable=False)
    coords = db.Column(db.Text, nullable=True)
    details = db.Column(db.Text, nullable=True)
    done = db.Column(db.Boolean, default=False)

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
        if 'user' not in session:
            app.logger.debug("Benutzer nicht in der Sitzung, Umleitung zu Login")
            return redirect(url_for('login'))
        
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
    try:
        if 'user' not in session:
            app.logger.debug("Benutzer nicht in der Sitzung, Umleitung zu Login")
            return redirect(url_for('login'))
        
        eintraege = lade_zeiteintraege()
        offene_zeiteintraege = [e for e in eintraege if not e.get('ende')]
        letzte_zeiteintraege = eintraege[-3:][::-1] if eintraege else []
        urlaub_file = 'urlaub.csv'
        urlaube = []
        if os.path.exists(urlaub_file):
            with open(urlaub_file, encoding='utf-8') as f:
                reader = csv.reader(f)
                for idx, row in enumerate(reader):
                    if len(row) >= 2:
                        urlaube.append({'id': str(idx), 'start': row[0], 'end': row[1], 'comment': row[2] if len(row) > 2 else ''})
        resturlaub = 30
        today_dt = date.today()
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
        from datetime import datetime
        def parse_time(t):
            return datetime.strptime(t, "%H:%M")
        offene = [a for a in auftraege if not a["done"]]
        naechster = min(offene, key=lambda a: parse_time(a["uhrzeit"])) if offene else None
        naechster_auftrag_uhrzeit = naechster["uhrzeit"] if naechster else None
        naechster_auftrag_art = naechster["art"] if naechster else None
        naechster_auftrag_standort = naechster["standort"] if naechster else None
        naechster_auftrag_coords = naechster["coords"] if naechster else None
        # Verbleibende Zeit bis nächster Auftrag (dynamisch)
        verbleibende_zeit = None
        if naechster and naechster_auftrag_uhrzeit:
            now = datetime.now()
            try:
                start_dt = now.replace(hour=int(naechster_auftrag_uhrzeit.split(':')[0]), minute=int(naechster_auftrag_uhrzeit.split(':')[1]), second=0, microsecond=0)
                if start_dt < now:
                    start_dt += timedelta(days=1)
                diff = start_dt - now
                h, m = divmod(diff.seconds//60, 60)
                verbleibende_zeit = f"{h}:{m:02d}h"
            except Exception:
                verbleibende_zeit = None
        tage_verbraucht = None
        tage_verplant = None
        tage_uebrig = None
        naechster_urlaub = None
        aktueller_urlaub = None
        if urlaube:
            year = today_dt.year
            feiertage = bayern_feiertage(year)
            urlaubstage = set()
            verbraucht = set()
            verplant = set()
            for u in urlaube:
                try:
                    s = date.fromisoformat(u['start'])
                    e = date.fromisoformat(u['end'])
                    for d in range((e-s).days+1):
                        tag = s + timedelta(days=d)
                        if tag.weekday() < 5 and tag not in feiertage:
                            urlaubstage.add(tag)
                            if tag <= today_dt:
                                verbraucht.add(tag)
                            elif tag > today_dt:
                                verplant.add(tag)
                except Exception:
                    pass
            tage_verbraucht = len([d for d in verbraucht if d.year == year])
            tage_verplant = len([d for d in verplant if d.year == year])
            jahresurlaub = 30
            tage_uebrig = max(0, jahresurlaub - tage_verbraucht - tage_verplant)
            future = [u for u in urlaube if u['start'] > today_dt.isoformat()]
            naechster_urlaub = min(future, key=lambda u: u['start']) if future else None
            aktuell = [u for u in urlaube if u['start'] <= today_dt.isoformat() <= u['end']]
            aktueller_urlaub = aktuell[0] if aktuell else None
        # --- Störungen (Demo/Test) ---
        stoerungen = [
            {
                'art': 'Aufzug außer Betrieb',
                'adresse': 'Musterstraße 1, 12345 Musterstadt',
                'deadline': '14:30 Uhr',
                'coords': [48.12345, 11.56789]
            }
        ]
        return render_template('dashboard.html',
            offene_zeiteintraege=offene_zeiteintraege,
            letzte_zeiteintraege=letzte_zeiteintraege,
            resturlaub=resturlaub,
            user=session['user'],
            today=get_today(),
            today_dt=today_dt,
            urlaube=urlaube,
            pending_count=len([e for e in eintraege if e.get('status') == 'pending']),
            auftraege_offen=auftraege_offen,
            auftraege_erledigt=auftraege_erledigt,
            naechster_auftrag_uhrzeit=naechster_auftrag_uhrzeit,
            verbleibende_zeit=verbleibende_zeit,
            user_fullname=session['user']['name'],
            tage_verbraucht=tage_verbraucht,
            tage_verplant=tage_verplant,
            tage_uebrig=tage_uebrig,
            naechster_urlaub=naechster_urlaub,
            aktueller_urlaub=aktueller_urlaub,
            naechster_auftrag_art=naechster_auftrag_art,
            naechster_auftrag_standort=naechster_auftrag_standort,
            naechster_auftrag_coords=naechster_auftrag_coords,
            auftraege=auftraege,
            auftragsarten=auftragsarten,
            stoerungen=stoerungen
        )
    except Exception as e:
        app.logger.error(f"Fehler in dashboard: {str(e)}")
        return f"Fehler in dashboard: {str(e)}", 500

@app.route('/entries')
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
        return jsonify(lade_auftraege())
    elif request.method == 'POST':
        data = request.get_json()
        auftraege = lade_auftraege()
        for a in auftraege:
            if str(a['id']) == str(data.get('id')):
                a['done'] = bool(data.get('done'))
        speichere_auftraege(auftraege)
        return jsonify({'status':'ok'})

# Dummy-Routen für User-Menü
@app.route('/logout')
def logout():
    try:
        session.clear()
        app.logger.debug("Sitzung gelöscht, rendern von logout.html")
        return render_template('logout.html')
    except Exception as e:
        app.logger.error(f"Fehler in logout: {str(e)}")
        return f"Interner Serverfehler beim Abmelden: {str(e)}", 500

@app.route('/login')
def login():
    try:
        app.logger.debug("Rendern von login.html")
        return render_template('login.html')
    except Exception as e:
        app.logger.error(f"Fehler beim Rendern von login.html: {str(e)}")
        return f"Fehler beim Rendern von login.html: {str(e)}", 500

@app.route('/login_ms365')
def login_ms365():
    try:
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

@app.route('/dev_login')
def dev_login():
    """Temporärer Login für lokale Entwicklung"""
    if os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG') == '1':
        session['user'] = {
            'name': 'Entwickler Test',
            'email': 'dev@example.com',
            'initials': 'ET',
            'is_admin': True,
            'can_approve': True
        }
        app.logger.info("Dev-Login erfolgreich - Benutzer: Entwickler Test")
        return redirect(url_for('dashboard'))
    return "Nur in Entwicklung verfügbar", 403

@app.route('/approve_entries', methods=['GET', 'POST'])
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
        # Manuelle Erfassung
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
    # Filter/Suche
    q = request.args.get('q','')
    gefiltert = [e for e in eintraege if q.lower() in (e.get('bemerkung','')+e.get('start','')+e.get('stop','')).lower()]
    return render_template('arbeitszeit.html', eintraege=gefiltert, q=q)

@app.route('/arbeitszeit/export')
def arbeitszeit_export():
    return send_file(ARBEITSZEIT_CSV, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
