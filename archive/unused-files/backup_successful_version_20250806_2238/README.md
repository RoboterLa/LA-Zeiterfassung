# Zeiterfassung Backend

## 🏗️ Struktur

### Haupt-Dateien:
- `app_azure.py` - Aktuelle Azure-App (Mock-Daten)
- `app_azure_with_db.py` - Azure-App mit Datenbank-Support
- `database_azure.py` - Azure SQL Database Integration
- `app.py` - Standard Flask-App (für lokale Entwicklung)

### Konfiguration:
- `requirements.txt` - Python Dependencies
- `config.py` - App-Konfiguration
- `run.py` - App-Starter

### Azure-Deployment:
- `Procfile` - Azure App Service Konfiguration
- `runtime.txt` - Python Version
- `web.config` - IIS Konfiguration
- `startup.sh` - Startup-Script

### Ordner:
- `controllers/` - API Controller
- `models/` - Datenmodelle
- `services/` - Business Logic
- `utils/` - Hilfsfunktionen
- `build/` - Frontend Build
- `migrations/` - Datenbank-Migrationen

## 🚀 Deployment

### Mock-Daten (Aktuell):
```bash
gunicorn --bind=0.0.0.0 --timeout 600 app_azure:app
```

### Mit Datenbank:
```bash
gunicorn --bind=0.0.0.0 --timeout 600 app_azure_with_db:app
```

## 📊 Datenbank

### Azure SQL Database:
- Server: `zeiterfassung-sql.database.windows.net`
- Database: `zeiterfassung-db`
- Fallback: Mock-Daten bei DB-Problemen

### Environment Variables:
```bash
AZURE_SQL_PASSWORD="IHR_PASSWORT"
```

## 🔧 Entwicklung

### Lokal starten:
```bash
python app.py
```

### Dependencies installieren:
```bash
pip install -r requirements.txt
``` 