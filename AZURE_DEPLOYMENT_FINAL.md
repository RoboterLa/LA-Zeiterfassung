# 🚀 Finale Azure Deployment Anleitung

## ✅ Probleme behoben:

### 1. **Umgebungsvariablen** ✅
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `FLASK_SECRET_KEY=<random-key>`
- `CLIENT_ID` und `CLIENT_SECRET` gesetzt
- `WEBSITES_PORT=8000`

### 2. **Datenbank-Pfad** ✅
- Azure: `/tmp/zeiterfassung.db`
- Lokal: `zeiterfassung.db`
- Automatische Erkennung

### 3. **Port-Konfiguration** ✅
- Azure: `$PORT` (automatisch)
- Lokal: `5002`
- `host='0.0.0.0'` für Azure

### 4. **CORS-Konfiguration** ✅
- Azure: `origins=['*']`
- Lokal: `localhost:3000,3002,3009`

### 5. **Session-Verzeichnis** ✅
- Azure: `/tmp/sessions`
- Lokal: `./sessions`
- Automatische Erstellung

### 6. **Migration-Route** ✅
- Entfernt: `from migrate_to_azure import migrate_to_azure`
- Vereinfacht: Nur `db.create_all()`

## 📦 Deployment Package: `deploy_fixed.zip`

### Inhalt:
```
deploy_fixed.zip
├── app.py (Azure-optimiert)
├── requirements.txt
├── startup.txt
├── .deployment
├── build.sh (Azure-kompatibel)
├── sessions/
└── instance/
```

## 🔧 Deployment Schritte:

### 1. **Azure Portal öffnen**
```
https://portal.azure.com
```

### 2. **Web App finden**
```
Suche: la-zeiterfassung-fyd4cge3d9e3cac4
```

### 3. **Deployment Center**
- Links im Menü: **"Deployment Center"**
- Klicke auf **"Manual deployment"**
- Lade `deploy_fixed.zip` hoch

### 4. **Environment Variables prüfen**
- Gehe zu **"Configuration"** → **"Application settings"**
- Prüfe ob alle Variablen gesetzt sind:
  - `FLASK_ENV=production`
  - `FLASK_DEBUG=0`
  - `FLASK_SECRET_KEY=<random-key>`
  - `CLIENT_ID=bce7f739-d799-4c57-8758-7b6b21999678`
  - `CLIENT_SECRET=eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr`
  - `WEBSITES_PORT=8000`

### 5. **Startup Command prüfen**
- Gehe zu **"Configuration"** → **"General settings"**
- Sollte sein: `gunicorn --bind=0.0.0.0:$PORT --timeout 600 --workers 1 app:app`

## 🌐 URLs zum Testen:

### **App URLs:**
- **Production**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net
- **Health Check**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health
- **API Test**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/auth/me

### **Lokale URLs:**
- **Backend**: http://localhost:5002
- **Frontend**: http://localhost:3002

## 🔍 Troubleshooting:

### **Falls App Error:**
1. **Logs prüfen:**
   ```bash
   az webapp log tail --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg
   ```

2. **Build Logs:**
   - Azure Portal → Deployment Center → Logs

3. **Health Check:**
   ```
   https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health
   ```

### **Häufige Probleme:**
- **ModuleNotFoundError**: Dependencies nicht installiert
- **Port Error**: Startup Command falsch
- **Database Error**: SQLite Pfad falsch
- **CORS Error**: Origins nicht korrekt

## 📊 Monitoring Commands:

```bash
# App Status
az webapp show --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg --query "state"

# App Settings
az webapp config appsettings list --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg

# Live Logs
az webapp log tail --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg
```

## 🎯 Erwartetes Verhalten:

### **Nach erfolgreichem Deployment:**
1. **Health Check** sollte `{"status": "healthy", "database": "connected"}` zurückgeben
2. **Root URL** sollte JSON-Dashboard-Daten zurückgeben
3. **API Endpoints** sollten funktionieren
4. **Keine Application Error** mehr

### **Lokale Tests:**
```bash
# Teste lokales Backend
curl http://localhost:5002/health

# Teste lokales Frontend
curl http://localhost:3002
```

## 💰 Kosten:
- **App Service Plan B1**: ~€10/Monat
- **Bandwidth**: Inklusive
- **Storage**: Inklusive

---

**🚀 Deployment Package bereit: `deploy_fixed.zip`** 