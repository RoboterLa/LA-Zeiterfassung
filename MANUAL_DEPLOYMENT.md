# 🔧 Manuelles Azure Deployment

## Problem: CLI Deployment funktioniert nicht
Das automatische Deployment über die CLI schlägt fehl. Lass uns das manuell über das Azure Portal machen.

## 📋 Schritt-für-Schritt Anleitung:

### 1. **Azure Portal öffnen**
```
https://portal.azure.com
```

### 2. **Web App finden**
- Suche nach: `la-zeiterfassung-fyd4cge3d9e3cac4`
- Klicke auf die Web App

### 3. **Deployment Center**
- Links im Menü: **"Deployment Center"**
- Klicke auf **"Manual deployment"**
- Lade die Datei `deploy_final.zip` hoch

### 4. **Environment Variables prüfen**
- Gehe zu **"Configuration"** → **"Application settings"**
- Prüfe ob diese Variablen gesetzt sind:
  ```
  FLASK_ENV=production
  FLASK_DEBUG=0
  FLASK_SECRET_KEY=<random-key>
  CLIENT_ID=bce7f739-d799-4c57-8758-7b6b21999678
  CLIENT_SECRET=eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr
  WEBSITES_PORT=8000
  ```

### 5. **Startup Command prüfen**
- Gehe zu **"Configuration"** → **"General settings"**
- Sollte sein: `gunicorn app:app`

## 📦 Deployment Package: `deploy_final.zip`

### Inhalt:
```
deploy_final.zip
├── app.py (Session-Filesystem deaktiviert)
├── requirements.txt
├── Procfile (web: gunicorn app:app)
└── .deployment
```

## 🔧 Behobene Probleme:

### ✅ **Session-Filesystem deaktiviert**
```python
# Azure Production
app.config['SESSION_TYPE'] = 'null'  # Deaktiviert für Azure
```

### ✅ **Procfile hinzugefügt**
```
web: gunicorn app:app
```

### ✅ **Startup Command gesetzt**
```
gunicorn app:app
```

## 🌐 Test URLs:

### **Nach Deployment:**
- **App**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net
- **Health Check**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health
- **API**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/auth/me

## 🔍 Troubleshooting:

### **Falls immer noch Application Error:**
1. **Logs prüfen:**
   - Azure Portal → Log stream
   - Schaue nach spezifischen Fehlermeldungen

2. **Build Logs:**
   - Azure Portal → Deployment Center → Logs

3. **App neu starten:**
   - Azure Portal → Overview → Restart

## 📊 Monitoring:

```bash
# App Status
az webapp show --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg --query "state"

# Live Logs
az webapp log tail --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg
```

---

**🚀 Deployment Package bereit: `deploy_final.zip`** 