#!/bin/bash

echo "⚙️  Environment Variables setzen"
echo "================================"

# Variablen
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
RESOURCE_GROUP="la-zeiterfassung-rg"

echo "🔧 Setze Environment Variables..."
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        FLASK_ENV=production \
        FLASK_SECRET_KEY="$(openssl rand -hex 32)" \
        CLIENT_ID="bce7f739-d799-4c57-8758-7b6b21999678" \
        CLIENT_SECRET="your-client-secret-here" \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        PYTHON_VERSION=3.11

echo "🔄 Restarte App..."
az webapp restart \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP

echo "✅ Environment Variables gesetzt!"
echo "⚠️  WICHTIG: Ersetzen Sie 'your-client-secret-here' mit Ihrem echten Secret!" 