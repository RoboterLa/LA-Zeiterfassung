# Lokale Entwicklung mit MS365 Login

## 🚨 Wichtiger Hinweis

Der MS365 Login funktioniert **nicht direkt** in der lokalen Entwicklung, weil:

1. **Redirect URI Mismatch**: Die App ist für Azure konfiguriert
2. **HTTPS erforderlich**: MS365 erwartet HTTPS, lokal läuft HTTP

## ✅ Lösungsoptionen

### Option 1: ngrok verwenden (Empfohlen)

1. **ngrok installieren:**
   ```bash
   # Mit Homebrew (macOS)
   brew install ngrok
   
   # Oder von https://ngrok.com/download
   ```

2. **ngrok starten:**
   ```bash
   ngrok http 5000
   ```

3. **Redirect URI in Azure anpassen:**
   - Gehen Sie zu Azure Portal → App Registrations
   - Fügen Sie die ngrok-URL hinzu: `https://YOUR-NGROK-URL.ngrok.io/auth/callback`

4. **App starten:**
   ```bash
   python3 run_local.py
   ```

### Option 2: Temporärer Dummy-Login (Für Entwicklung)

Fügen Sie diese Route zur `app.py` hinzu:

```python
@app.route('/dev_login')
def dev_login():
    """Temporärer Login für lokale Entwicklung"""
    if os.getenv('FLASK_ENV') == 'development':
        session['user'] = {
            'name': 'Entwickler Test',
            'email': 'dev@example.com',
            'initials': 'ET',
            'is_admin': True,
            'can_approve': True
        }
        return redirect(url_for('dashboard'))
    return "Nur in Entwicklung verfügbar", 403
```

### Option 3: Azure App-ID anpassen

1. Gehen Sie zu [Azure Portal](https://portal.azure.com)
2. App Registrations → Ihre App
3. Authentication → Add Platform → Web
4. Redirect URIs hinzufügen:
   - `http://localhost:5000/auth/callback`
   - `https://localhost:5000/auth/callback`

## 🚀 Schnellstart

```bash
# 1. Abhängigkeiten installieren
pip3 install -r requirements.txt

# 2. App starten
python3 run_local.py

# 3. Browser öffnen
open http://localhost:5000
```

## 🔧 Umgebungsvariablen

```bash
# Für lokale Entwicklung
export FLASK_ENV=development
export FLASK_DEBUG=1
export OAUTHLIB_INSECURE_TRANSPORT=1

# Für Produktion
export FLASK_ENV=production
```

## 📝 Debugging

- Logs werden in der Konsole ausgegeben
- Datenbank: `zeiterfassung.db`
- Sessions: `./sessions/`

## ⚠️ Sicherheitshinweise

- `OAUTHLIB_INSECURE_TRANSPORT=1` nur für lokale Entwicklung
- Niemals in Produktion verwenden
- ngrok-URLs sind öffentlich zugänglich 