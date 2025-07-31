#!/bin/bash

echo "🚀 Einfaches Container Deployment"
echo "================================"

# Variablen
RESOURCE_GROUP="la-zeiterfassung-rg"
CONTAINER_NAME="zeiterfassung-container"

echo "🔍 Prüfe Resource Group..."
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "📦 Erstelle Resource Group..."
    az group create --name $RESOURCE_GROUP --location "West Europe" --output none
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

echo "✅ Container Deployment abgeschlossen!"
echo "🌐 Ihre App ist verfügbar unter: https://zeiterfassung-app.westeurope.azurecontainer.io"
echo ""
echo "📊 Container Status:"
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "{name:name, state:state, ipAddress:ipAddress.fqdn}" --output table 