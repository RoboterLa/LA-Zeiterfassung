#!/bin/bash

echo "🚀 Azure App Service B1 Deployment"
echo "=================================="

# Variablen
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
RESOURCE_GROUP="la-zeiterfassung-rg"

echo "🔍 Prüfe bestehende Web App..."
if ! az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME &> /dev/null; then
    echo "❌ Web App '$APP_NAME' nicht gefunden"
    exit 1
fi

echo "✅ Web App gefunden: $APP_NAME"

echo "💾 Erstelle Datenbank-Backup..."
python3 backup_db.py

echo "⚙️ Konfiguriere App Settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    PYTHON_VERSION=3.11 \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    --output none

echo "📦 Erstelle Deployment Package..."
# Temporäres Verzeichnis erstellen
rm -rf deploy_temp
mkdir deploy_temp

# Dateien kopieren
cp app.py deploy_temp/
cp requirements.txt deploy_temp/
cp -r backend deploy_temp/
cp -r frontend deploy_temp/

# ZIP erstellen
cd deploy_temp
zip -r ../deploy_azure_app_service.zip .
cd ..

# Aufräumen
rm -rf deploy_temp

echo "📤 Deploye die Anwendung..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy_azure_app_service.zip

echo "✅ Deployment abgeschlossen!"
echo "🌐 Ihre App ist verfügbar unter: https://$APP_NAME.azurewebsites.net"
echo ""
echo "📊 App Status:"
az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query "{name:name, state:state, defaultHostName:defaultHostName}" --output table

echo ""
echo "📋 Nächste Schritte:"
echo "1. App testen: https://$APP_NAME.azurewebsites.net"
echo "2. Health Check: https://$APP_NAME.azurewebsites.net/health"
echo "3. API Status: https://$APP_NAME.azurewebsites.net/api/status"
echo "4. Logs anzeigen: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME" 