#!/bin/bash

# Azure Deployment Script für Zeiterfassung System
echo "🚀 Azure Deployment für Zeiterfassung System"

# Variablen
RESOURCE_GROUP="zeiterfassung-rg"
APP_NAME="zeiterfassung-app"
LOCATION="centralus"

# 1. Frontend Build
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Backend Dependencies installieren
echo "🐍 Installing Python dependencies..."
pip install -r backend/requirements.txt

# 3. Static Files kopieren
echo "📁 Copying static files..."
mkdir -p backend/static
cp -r frontend/build/* backend/static/

# 4. Azure App Service konfigurieren
echo "⚙️ Configuring Azure App Service..."

# Python Version setzen
az webapp config set --resource-group $RESOURCE_GROUP --name $APP_NAME --linux-fx-version "PYTHON|3.11"

# Startup Command setzen
az webapp config set --resource-group $RESOURCE_GROUP --name $APP_NAME --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 backend.app:app"

# Environment Variables setzen
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    FLASK_ENV=production \
    FLASK_SECRET_KEY=$(openssl rand -hex 32) \
    CLIENT_ID=azure-client-id \
    CLIENT_SECRET=azure-client-secret

# 5. Deployment
echo "🚀 Deploying to Azure..."
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src app.zip

echo "✅ Deployment completed!"
echo "🌐 App URL: https://$APP_NAME.azurewebsites.net"
echo "📊 Azure Portal: https://portal.azure.com/#@/resource/subscriptions/0a0a3056-2608-441a-8688-a962f9285174/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" 