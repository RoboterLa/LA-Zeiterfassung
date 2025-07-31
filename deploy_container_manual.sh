#!/bin/bash
set -euo pipefail

# Variablen setzen
RESOURCE_GROUP="la-zeiterfassung-rg"
WEBAPP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
ACR_NAME="zeiterfassungacr"  # ohne .azurecr.io
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
IMAGE_NAME="zeiterfassung-app"
TAG="$(date +%Y%m%d%H%M)-manual"
FULL_IMAGE="${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${TAG}"

echo "🚀 Container Deployment - Manueller Fallback"
echo "============================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Web App: $WEBAPP_NAME"
echo "ACR: $ACR_LOGIN_SERVER"
echo "Image: $FULL_IMAGE"
echo ""

# Prüfen ob ACR existiert
echo "🔍 Prüfe Azure Container Registry..."
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "❌ ACR '$ACR_NAME' nicht gefunden!"
    echo "Erstelle ACR..."
    az acr create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$ACR_NAME" \
        --sku Basic \
        --admin-enabled true
    echo "✅ ACR erstellt"
else
    echo "✅ ACR gefunden"
fi

# Build Frontend
echo "🔨 Baue Frontend..."
if [ -f frontend/package.json ]; then
    cd frontend
    npm ci
    npm run build
    cd ..
    echo "✅ Frontend-Build abgeschlossen"
else
    echo "⚠️  Kein frontend/package.json gefunden"
fi

# Login ACR
echo "🔐 Login zu ACR..."
az acr login --name "$ACR_NAME"

# Build & push
echo "🐳 Baue und pushe Docker Image..."
docker build -t "$FULL_IMAGE" .
docker push "$FULL_IMAGE"
echo "✅ Image gepusht: $FULL_IMAGE"

# Set container image in Web App
echo "🌐 Setze Container Image in Web App..."
az webapp config container set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEBAPP_NAME" \
    --docker-custom-image-name "$FULL_IMAGE" \
    --docker-registry-server-url "https://${ACR_LOGIN_SERVER}"

# Restart
echo "🔄 Starte Web App neu..."
az webapp restart --resource-group "$RESOURCE_GROUP" --name "$WEBAPP_NAME"

echo ""
echo "✅ Deployment abgeschlossen!"
echo "🌐 App URL: https://$WEBAPP_NAME.azurewebsites.net"
echo "📊 Logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME"
echo ""
echo "🔍 Teste die App:"
echo "curl -I https://$WEBAPP_NAME.azurewebsites.net/health"
echo "curl -I https://$WEBAPP_NAME.azurewebsites.net/" 