#!/bin/bash

echo "🚀 Azure Deployment für Zeiterfassung System (Simple)"
echo "====================================================="

# Prüfe ob Azure CLI installiert ist
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI ist nicht installiert. Bitte installieren Sie es zuerst:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Prüfe ob der User eingeloggt ist
if ! az account show &> /dev/null; then
    echo "❌ Sie sind nicht bei Azure eingeloggt. Bitte loggen Sie sich ein:"
    echo "   az login"
    exit 1
fi

# Variablen für bestehende Web App
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
RESOURCE_GROUP="la-zeiterfassung-rg"

echo "🔍 Prüfe bestehende Web App..."
if ! az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME &> /dev/null; then
    echo "❌ Web App '$APP_NAME' nicht gefunden in Resource Group '$RESOURCE_GROUP'"
    echo "Bitte überprüfen Sie den Namen und die Resource Group"
    exit 1
fi

echo "✅ Web App gefunden: $APP_NAME"

echo "⚙️ Konfiguriere App Settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    PYTHON_VERSION=3.11 \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    --output none

echo "📤 Deploye die Anwendung..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy_azure_simple.zip

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