#!/bin/bash

echo "🧪 Teste Azure Deployment"
echo "========================"

# Variablen
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
APP_URL="https://$APP_NAME.azurewebsites.net"

echo "🌐 Teste App URL..."
curl -I $APP_URL

echo ""
echo "🔍 Teste Health Check..."
curl $APP_URL/health

echo ""
echo "📊 Teste API Status..."
curl $APP_URL/api/status

echo ""
echo "📋 Logs anzeigen..."
echo "Führen Sie aus: az webapp log tail --name $APP_NAME --resource-group la-zeiterfassung-rg"

echo ""
echo "✅ Tests abgeschlossen!"
echo "�� App URL: $APP_URL" 