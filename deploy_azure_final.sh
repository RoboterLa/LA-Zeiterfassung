#!/bin/bash

echo "🚀 Finales Azure Deployment - Komplette App"
echo "==========================================="

# Variablen
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
RESOURCE_GROUP="la-zeiterfassung-rg"

echo "🔍 Prüfe bestehende Web App..."
if ! az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME &> /dev/null; then
    echo "❌ Web App '$APP_NAME' nicht gefunden"
    exit 1
fi

echo "✅ Web App gefunden: $APP_NAME"

echo "⚙️ Konfiguriere App Settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    PYTHON_VERSION=3.11 \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    --output none

echo "📤 Deploye die komplette Anwendung..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy_azure_complete.zip

echo "✅ Deployment abgeschlossen!"
echo "🌐 Ihre App ist verfügbar unter: https://$APP_NAME.azurewebsites.net"
echo ""
echo "📊 App Status:"
az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query "{name:name, state:state, defaultHostName:defaultHostName}" --output table 