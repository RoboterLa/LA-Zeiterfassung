#!/bin/bash

echo "🚀 Vollständiges Container Deployment"
echo "===================================="

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
    --command-line "tail -f /dev/null" \
    --environment-variables \
        PYTHONPATH=/app \
        FLASK_ENV=production \
    --cpu 1 \
    --memory 2 \
    --os-type Linux \
    --output none

echo "📤 Deploye die komplette Anwendung..."
# Container stoppen
az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --output none

# Neuen Container mit unserer App erstellen
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_NAME \
    --image python:3.11 \
    --ports 5000 \
    --dns-name-label zeiterfassung-app \
    --command-line "tail -f /dev/null" \
    --environment-variables \
        PYTHONPATH=/app \
        FLASK_ENV=production \
    --cpu 1 \
    --memory 2 \
    --os-type Linux \
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