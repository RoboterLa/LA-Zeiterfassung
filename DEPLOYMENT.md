# 🚀 Deployment Guide - Zeiterfassung System

## Übersicht

Dieses Dokument beschreibt die verschiedenen Deployment-Optionen für das Zeiterfassung-System.

## 📋 Voraussetzungen

- Azure CLI installiert
- Node.js 18+ installiert
- Python 3.11+ installiert
- Git installiert

## 🏗️ Azure App Service Deployment

### 1. Azure CLI Setup

```bash
# Azure CLI Login
az login

# Subscription auswählen
az account list --output table
az account set --subscription <subscription-id>
```

### 2. Resource Group erstellen

```bash
# Resource Group erstellen
az group create --name zeiterfassung-rg --location centralus

# Alternative Regionen bei Quota-Problemen:
# az group create --name zeiterfassung-rg --location eastus
# az group create --name zeiterfassung-rg --location westus2
```

### 3. App Service Plan erstellen

```bash
# Free Tier (für Entwicklung)
az appservice plan create --name zeiterfassung-plan --resource-group zeiterfassung-rg --sku F1 --is-linux

# Basic Tier (für Produktion)
az appservice plan create --name zeiterfassung-plan --resource-group zeiterfassung-rg --sku B1 --is-linux
```

### 4. Web App erstellen

```bash
# Web App erstellen
az webapp create --resource-group zeiterfassung-rg --plan zeiterfassung-plan --name zeiterfassung-app --runtime "PYTHON|3.11"
```

### 5. Konfiguration

```bash
# Python Version setzen
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --linux-fx-version "PYTHON|3.11"

# Startup Command setzen
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 backend.app:app"

# Environment Variables setzen
az webapp config appsettings set --resource-group zeiterfassung-rg --name zeiterfassung-app --settings \
  FLASK_ENV=production \
  FLASK_SECRET_KEY=$(openssl rand -hex 32) \
  CLIENT_ID=azure-client-id \
  CLIENT_SECRET=azure-client-secret
```

### 6. Frontend Build

```bash
# Frontend Dependencies installieren
cd frontend
npm install

# Production Build
npm run build

# Static files kopieren
cd ..
mkdir -p backend/static
cp -r frontend/build/* backend/static/
```

### 7. Deployment Package erstellen

```bash
# Package erstellen (ohne Cache-Dateien)
zip -r app.zip backend/ -x "backend/__pycache__/*" "backend/*.pyc" "backend/venv/*"

# Alternative mit tar
tar --exclude='backend/__pycache__' --exclude='backend/*.pyc' --exclude='backend/venv' -czf app.tar.gz backend/
```

### 8. Deployment ausführen

```bash
# ZIP Deployment
az webapp deployment source config-zip --resource-group zeiterfassung-rg --name zeiterfassung-app --src app.zip

# Alternative: TAR Deployment
az webapp deployment source config-local-git --resource-group zeiterfassung-rg --name zeiterfassung-app
```

### 9. Deployment Status prüfen

```bash
# App Status
az webapp show --resource-group zeiterfassung-rg --name zeiterfassung-app --query "state"

# Logs anzeigen
az webapp log tail --resource-group zeiterfassung-rg --name zeiterfassung-app

# Health Check
curl -I https://zeiterfassung-app.azurewebsites.net/health
```

## 🌐 Render.com Deployment

### 1. render.yaml erstellen

```yaml
services:
  - type: web
    name: zeiterfassung-app
    env: python
    region: frankfurt
    plan: free
    buildCommand: |
      cd frontend && npm install && npm run build
      cd ../backend && pip install -r requirements.txt
      mkdir -p backend/static
      cp -r frontend/build/* backend/static/
    startCommand: gunicorn backend.app:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FLASK_SECRET_KEY
        generateValue: true
      - key: CLIENT_ID
        value: render-client-id
      - key: CLIENT_SECRET
        value: render-client-secret
```

### 2. Deployment

```bash
# Render CLI installieren
npm install -g @render/cli

# Login
render login

# Service erstellen
render blueprint apply

# Oder manuell über Dashboard
```

## 🐳 Docker Deployment

### 1. Dockerfile erstellen

```dockerfile
# Multi-stage build
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./static/

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--timeout", "600", "app:app"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  zeiterfassung:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - FLASK_SECRET_KEY=${FLASK_SECRET_KEY}
      - CLIENT_ID=${CLIENT_ID}
      - CLIENT_SECRET=${CLIENT_SECRET}
    volumes:
      - ./data:/app/data
```

### 3. Deployment

```bash
# Build Image
docker build -t zeiterfassung-app .

# Run Container
docker run -p 8000:8000 zeiterfassung-app

# Mit Docker Compose
docker-compose up -d
```

## 🔧 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        pip install -r backend/requirements.txt
        cd frontend && npm install
    
    - name: Build frontend
      run: |
        cd frontend && npm run build
        mkdir -p ../backend/static
        cp -r build/* ../backend/static/
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'zeiterfassung-app'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: backend/
```

### Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  python.version: '3.11'
  node.version: '18'

stages:
- stage: Build
  jobs:
  - job: Build
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '$(python.version)'
    
    - task: NodeTool@0
      inputs:
        versionSpec: '$(node.version)'
    
    - script: |
        pip install -r backend/requirements.txt
      displayName: 'Install Python dependencies'
    
    - script: |
        cd frontend
        npm install
        npm run build
        mkdir -p ../backend/static
        cp -r build/* ../backend/static/
      displayName: 'Build frontend'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'backend/'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/app.zip'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '$(Build.ArtifactStagingDirectory)'
        artifactName: 'drop'

- stage: Deploy
  jobs:
  - deployment: Deploy
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure subscription'
              appName: 'zeiterfassung-app'
              package: '$(Pipeline.Workspace)/drop/app.zip'
```

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. ModuleNotFoundError
```bash
# Problem: Python-Module nicht gefunden
# Lösung: Dependencies installieren
pip install -r backend/requirements.txt
```

#### 2. Port bereits belegt
```bash
# Problem: Port 8000 bereits in Verwendung
# Lösung: Anderen Port verwenden
export PORT=8001
python app.py
```

#### 3. Azure App Service startet nicht
```bash
# Problem: App Service bleibt im "Starting" Status
# Lösung: Logs prüfen
az webapp log tail --resource-group zeiterfassung-rg --name zeiterfassung-app

# Startup Command anpassen
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 --workers 1 backend.app:app"
```

#### 4. Frontend nicht erreichbar
```bash
# Problem: React-App wird nicht geladen
# Lösung: Static files korrekt kopieren
mkdir -p backend/static
cp -r frontend/build/* backend/static/
```

### Debugging

#### Azure App Service Logs
```bash
# Live Logs
az webapp log tail --resource-group zeiterfassung-rg --name zeiterfassung-app

# Logs herunterladen
az webapp log download --resource-group zeiterfassung-rg --name zeiterfassung-app
```

#### Lokale Tests
```bash
# Backend testen
cd backend
python app.py

# Frontend testen
cd frontend
npm start

# Integration testen
curl http://localhost:5000/health
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# System Health
curl https://zeiterfassung-app.azurewebsites.net/health

# API Status
curl https://zeiterfassung-app.azurewebsites.net/api/status

# Database Connection
curl https://zeiterfassung-app.azurewebsites.net/api/health/db
```

### Monitoring Setup

```bash
# Application Insights aktivieren
az monitor app-insights component create --app zeiterfassung-insights --location centralus --resource-group zeiterfassung-rg --application-type web

# Web App mit App Insights verbinden
az webapp config appsettings set --resource-group zeiterfassung-rg --name zeiterfassung-app --settings \
  APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

## 🔐 Security

### SSL/TLS Konfiguration

```bash
# SSL-Zertifikat binden
az webapp config ssl bind --certificate-thumbprint <thumbprint> --ssl-type SNI --name zeiterfassung-app --resource-group zeiterfassung-rg

# HTTPS erzwingen
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --https-only true
```

### Environment Variables

```bash
# Sichere Secrets setzen
az webapp config appsettings set --resource-group zeiterfassung-rg --name zeiterfassung-app --settings \
  FLASK_SECRET_KEY=$(openssl rand -hex 32) \
  JWT_SECRET_KEY=$(openssl rand -hex 32) \
  DATABASE_URL="postgresql://user:pass@host:port/db"
```

## 📈 Performance

### Optimierungen

```bash
# Gunicorn Workers anpassen
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --startup-file "gunicorn --bind=0.0.0.0 --workers 4 --timeout 600 backend.app:app"

# Always On aktivieren (nur bei bezahlten Plänen)
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --always-on true
```

### Caching

```bash
# Static File Caching
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --generic-configurations '{"staticFiles": {"cacheControl": "max-age=31536000"}}'
```

---

**Deployment erfolgreich! 🎉**

Die Anwendung ist jetzt unter `https://zeiterfassung-app.azurewebsites.net` verfügbar. 