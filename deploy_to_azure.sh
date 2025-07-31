#!/bin/bash

echo "🚀 Azure App Service B1 Deployment"
echo "=================================="

# Variablen
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
RESOURCE_GROUP="la-zeiterfassung-rg"
LOCATION="germanywestcentral"

echo "💾 Backup Datenbank..."
./backup_db.sh

echo "🔨 Baue React Frontend..."
./build_react.sh

echo "📤 Deploye zu Azure App Service..."
az webapp up \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --runtime PYTHON:3.11 \
    --location $LOCATION

echo "✅ Deployment abgeschlossen!"
echo "🌐 App URL: https://$APP_NAME.azurewebsites.net"
echo ""
echo "📋 Nächste Schritte:"
echo "1. DB hochladen: https://$APP_NAME.scm.azurewebsites.net/"
echo "2. Env-Vars setzen: ./set_env_vars.sh"
echo "3. App testen: ./test_deployment.sh" 