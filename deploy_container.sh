#!/bin/bash

echo "🚀 Container Deployment für Zeiterfassung System"
echo "================================================"

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

# Variablen
RESOURCE_GROUP="la-zeiterfassung-rg"
CONTAINER_NAME="zeiterfassung-container"
LOCATION="West Europe"

echo "🔍 Prüfe Resource Group..."
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "📦 Erstelle Resource Group..."
    az group create --name $RESOURCE_GROUP --location "$LOCATION" --output none
fi

echo "🐳 Erstelle Container Instance..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_NAME \
    --image python:3.11 \
    --ports 5000 \
    --dns-name-label zeiterfassung-app \
    --environment-variables \
        PYTHONPATH=/app \
        FLASK_ENV=production \
    --cpu 1 \
    --memory 1.5 \
    --output none

echo "📤 Deploye die Anwendung..."
# Container stoppen
az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --output none

# Neuen Container mit unserer App erstellen
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_NAME \
    --image python:3.11 \
    --ports 5000 \
    --dns-name-label zeiterfassung-app \
    --environment-variables \
        PYTHONPATH=/app \
        FLASK_ENV=production \
    --cpu 1 \
    --memory 1.5 \
    --output none

echo "✅ Container Deployment abgeschlossen!"
echo "🌐 Ihre App ist verfügbar unter: https://zeiterfassung-app.$LOCATION.azurecontainer.io"
echo ""
echo "📊 Container Status:"
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "{name:name, state:state, ipAddress:ipAddress.fqdn}" --output table

echo ""
echo "📋 Nächste Schritte:"
echo "1. App testen: https://zeiterfassung-app.$LOCATION.azurecontainer.io"
echo "2. Health Check: https://zeiterfassung-app.$LOCATION.azurecontainer.io/health"
echo "3. API Status: https://zeiterfassung-app.$LOCATION.azurecontainer.io/api/status"
echo "4. Logs anzeigen: az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME" 