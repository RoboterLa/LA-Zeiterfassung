from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from requests_oauthlib import OAuth2Session
import os
import logging
import time
from datetime import datetime, timedelta

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)
print("Initialisiere App...")

app = Flask(__name__, template_folder='templates', static_folder='static')

# Sichere Secret Key Konfiguration
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
print(f"Secret Key gesetzt: {bool(app.secret_key)}")

# SQLite DB Setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/time_entries.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'connect_args': {'timeout': 30}}

# Session-Handling (temporär auf 'null' für Azure-Kompatibilität)
app.config['SESSION_TYPE'] = 'null'

# Datenbank initialisieren
db = SQLAlchemy(app)

# Beispielmodelle – falls du noch keine Tabellen hast
class TimeEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(128))
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    comment = db.Column(db.String(256))

# Healthcheck-Route
@app.route('/')
def health():
    print("Healthcheck aufgerufen")
    return 'App läuft!'

# Beispielroute – später anpassen
@app.route('/logtime', methods=['POST'])
def log_time():
    print("POST /logtime erhalten")
    data = request.form
    # Eintrag erstellen
    new_entry = TimeEntry(
        user=data.get('user'),
        start_time=datetime.strptime(data.get('start'), "%Y-%m-%d %H:%M"),
        end_time=datetime.strptime(data.get('end'), "%Y-%m-%d %H:%M"),
        comment=data.get('comment')
    )
    db.session.add(new_entry)
    db.session.commit()
    return redirect(url_for('health'))

# Kein app.run() – gunicorn übernimmt das
print("App initialisiert – bereit für gunicorn.")
