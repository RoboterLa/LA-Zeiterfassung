#!/bin/bash

echo "🚀 Azure Container Registry Deployment"
echo "====================================="

# Variablen
RESOURCE_GROUP="la-zeiterfassung-rg"
ACR_NAME="zeiterfassungacr"
CONTAINER_NAME="zeiterfassung-container"
IMAGE_NAME="zeiterfassung-app"

echo "🔍 Prüfe Azure Container Registry..."
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "📦 Erstelle Azure Container Registry..."
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --output none
fi

echo "🔐 Logge in ACR ein..."
az acr login --name $ACR_NAME

echo "🐳 Baue Docker Image..."
docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME:latest .

echo "📤 Pushe Image zu ACR..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

echo "🚀 Deploye Container Instance..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_NAME \
    --image $ACR_NAME.azurecr.io/$IMAGE_NAME:latest \
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