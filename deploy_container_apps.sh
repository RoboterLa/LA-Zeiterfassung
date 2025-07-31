#!/bin/bash

echo "🚀 Azure Container Apps Deployment"
echo "================================="

# Variablen
RESOURCE_GROUP="la-zeiterfassung-rg"
CONTAINER_APP_NAME="zeiterfassung-app"
LOCATION="West Europe"

echo "🔍 Prüfe Resource Group..."
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "📦 Erstelle Resource Group..."
    az group create --name $RESOURCE_GROUP --location "$LOCATION" --output none
fi

echo "🌐 Erstelle Container Apps Environment..."
az containerapp env create \
    --name "zeiterfassung-env" \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --output none

echo "🚀 Erstelle Container App..."
az containerapp create \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --environment "zeiterfassung-env" \
    --image python:3.11 \
    --target-port 5000 \
    --ingress external \
    --cpu 1 \
    --memory 1.5Gi \
    --output none

echo "✅ Container Apps Deployment abgeschlossen!"
echo "🌐 Ihre App ist verfügbar unter: https://$CONTAINER_APP_NAME.azurecontainerapps.io"
echo ""
echo "📊 Container App Status:"
az containerapp show --resource-group $RESOURCE_GROUP --name $CONTAINER_APP_NAME --query "{name:name, state:state, defaultHostName:properties.configuration.ingress.fqdn}" --output table 