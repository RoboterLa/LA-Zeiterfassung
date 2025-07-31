# Azure Deployment - Aktuelle Version

## Übersicht
Dieses Deployment-Paket enthält die aktuelle refactored Version der Zeiterfassung-App mit:
- Backend: Flask mit MVC-Struktur
- Frontend: React-Build (statisch)
- Datenbank: SQLite (eingebettet)

## Dateien
- `deploy_azure_current.zip` - Deployment-Paket
- `deploy_azure_current.sh` - Automatisches Deployment-Script
- `deploy_azure_current/` - Quellverzeichnis

## Deployment-Optionen

### Option 1: Automatisches Deployment (Empfohlen)
```bash
./deploy_azure_current.sh
```

**Voraussetzungen:**
- Azure CLI installiert: `brew install azure-cli`
- Bei Azure eingeloggt: `az login`

### Option 2: Manuelles Deployment über Azure Portal

1. **Resource Group erstellen:**
   - Name: `zeiterfassung-rg`
   - Region: West Europe

2. **App Service Plan erstellen:**
   - Name: `zeiterfassung-plan`
   - SKU: B1 (Basic)
   - OS: Linux

3. **Web App erstellen:**
   - Name: `zeiterfassung-app`
   - Runtime: Python 3.11
   - Plan: `zeiterfassung-plan`

4. **Deployment:**
   - ZIP-Deployment mit `deploy_azure_current.zip`
   - Oder Git-Deployment

### Option 3: Azure CLI (Manuell)
```bash
# Resource Group
az group create --name zeiterfassung-rg --location "West Europe"

# App Service Plan
az appservice plan create --name zeiterfassung-plan --resource-group zeiterfassung-rg --sku B1 --is-linux

# Web App
az webapp create --resource-group zeiterfassung-rg --plan zeiterfassung-plan --name zeiterfassung-app --runtime "PYTHON|3.11"

# App Settings
az webapp config appsettings set --resource-group zeiterfassung-rg --name zeiterfassung-app --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true PYTHON_VERSION=3.11

# Deployment
az webapp deployment source config-zip --resource-group zeiterfassung-rg --name zeiterfassung-app --src deploy_azure_current.zip
```

## App-Struktur
```
deploy_azure_current/
├── app.py                 # Haupt-App
├── requirements.txt       # Python Dependencies
├── startup.txt           # Azure Startup Command
├── .deployment          # Azure Deployment Config
├── backend/             # Flask Backend
│   ├── app.py          # Flask App Factory
│   ├── config.py       # Konfiguration
│   ├── controllers/    # API Blueprints
│   ├── models/         # SQLAlchemy Models
│   ├── services/       # Business Logic
│   └── utils/          # Utilities
└── frontend_build/     # React Build
    └── index.html      # Statische Frontend-Dateien
```

## Features
- ✅ Flask Backend mit MVC-Struktur
- ✅ React Frontend (statisch)
- ✅ SQLite Datenbank
- ✅ CORS-Konfiguration
- ✅ Health Check Endpoint
- ✅ Session-Management
- ✅ Authentication System

## URLs nach Deployment
- **Haupt-App:** https://zeiterfassung-app.azurewebsites.net
- **Health Check:** https://zeiterfassung-app.azurewebsites.net/health
- **API Status:** https://zeiterfassung-app.azurewebsites.net/api/status

## Troubleshooting

### Port 5000 bereits belegt
Die App verwendet automatisch den von Azure bereitgestellten PORT.

### CORS-Fehler
Die App ist bereits für CORS konfiguriert.

### Datenbank-Probleme
Die SQLite-Datenbank ist im `backend/` Verzeichnis enthalten.

### Logs anzeigen
```bash
az webapp log tail --resource-group zeiterfassung-rg --name zeiterfassung-app
```

## Kosten
- **App Service Plan B1:** ~€10-15/Monat
- **Resource Group:** Kostenlos
- **Bandwidth:** Inklusive in B1 Plan

## Nächste Schritte
1. Deployment ausführen
2. App testen unter der bereitgestellten URL
3. Bei Problemen: Logs überprüfen
4. Bei Bedarf: Skalierung anpassen 