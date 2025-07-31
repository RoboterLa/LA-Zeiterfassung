# Azure Deployment Anleitung

## 🚀 Deployment über Azure Portal

### 1. Deployment Package hochladen

1. Gehe zu: https://portal.azure.com
2. Suche nach: `la-zeiterfassung-fyd4cge3d9e3cac4`
3. Öffne die Web App
4. Gehe zu **"Deployment Center"** (links im Menü)
5. Klicke auf **"Manual deployment"**
6. Lade die Datei `deploy_simple.zip` hoch
7. Warte auf das Deployment (kann 5-10 Minuten dauern)

### 2. Environment Variables setzen

1. Gehe zu **"Configuration"** (links im Menü)
2. Klicke auf **"Application settings"**
3. Füge folgende Einstellungen hinzu:

| Name | Value |
|------|-------|
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `0` |
| `FLASK_SECRET_KEY` | `$(openssl rand -hex 32)` |
| `CLIENT_ID` | `bce7f739-d799-4c57-8758-7b6b21999678` |
| `CLIENT_SECRET` | `eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `true` |
| `PYTHON_VERSION` | `3.11` |

4. Klicke auf **"Save"**

### 3. Startup Command setzen

1. Gehe zu **"Configuration"** → **"General settings"**
2. Setze **"Startup Command"** auf:
   ```
   gunicorn --bind=0.0.0.0:$PORT --timeout 600 --workers 1 app:app
   ```
3. Klicke auf **"Save"**

### 4. App testen

1. Gehe zu **"Overview"**
2. Klicke auf die **URL** der App
3. Die App sollte jetzt unter https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net erreichbar sein

## 🔧 Troubleshooting

### Falls die App nicht startet:

1. **Logs prüfen:**
   - Gehe zu **"Log stream"** (links im Menü)
   - Schaue nach Fehlermeldungen

2. **Build Logs prüfen:**
   - Gehe zu **"Deployment Center"**
   - Klicke auf **"Logs"**
   - Schaue nach Build-Fehlern

3. **Häufige Probleme:**
   - **ModuleNotFoundError**: Dependencies nicht installiert
   - **Port Error**: Startup Command falsch
   - **Database Error**: SQLite Datei nicht gefunden

### Logs anzeigen:

```bash
# Live Logs
az webapp log tail --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg

# Deployment Logs
az webapp deployment list-latest-build-logs --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg
```

## 📊 Monitoring

### App Status prüfen:

```bash
# App Status
az webapp show --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg --query "state"

# App Settings
az webapp config appsettings list --name la-zeiterfassung-fyd4cge3d9e3cac4 --resource-group la-zeiterfassung-rg
```

## 🌐 URLs

- **App URL**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net
- **Admin**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/admin
- **API**: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/auth/me

## 🔐 Azure AD Setup (später)

1. Gehe zu Azure Active Directory
2. Registriere eine neue App
3. Setze Redirect URI auf: `https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/auth/callback`
4. Aktualisiere CLIENT_ID und CLIENT_SECRET in den App Settings

## 💰 Kosten

- **App Service Plan**: B1 (~€10/Monat)
- **Bandwidth**: Inklusive
- **Storage**: Inklusive

## 🚀 Nächste Schritte

1. **Frontend deployen** (React App)
2. **Azure AD konfigurieren**
3. **SSL Certificate hinzufügen**
4. **Custom Domain einrichten**
5. **Monitoring aktivieren** 