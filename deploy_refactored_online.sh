#!/bin/bash

echo "🚀 Deploying Refactored Online Version..."

# Backup der aktuellen app.py
cp app.py app.py.backup.$(date +%Y%m%d_%H%M%S)

# Ersetze app.py mit der refactored Version
cp app_refactored.py app.py

# Erstelle Deployment-Package
echo "📦 Creating deployment package..."

# Erstelle temporäres Verzeichnis
mkdir -p deploy_refactored_temp
cd deploy_refactored_temp

# Kopiere alle notwendigen Dateien
cp ../app.py .
cp ../requirements.txt .
cp ../web.config .
cp ../startup.txt .
cp ../Procfile .

# Kopiere Templates (falls vorhanden)
if [ -d "../templates" ]; then
    cp -r ../templates .
fi

# Kopiere statische Dateien
if [ -d "../static" ]; then
    cp -r ../static .
fi

# Erstelle ZIP-Package
zip -r ../deploy_refactored_online.zip .

# Cleanup
cd ..
rm -rf deploy_refactored_temp

echo "✅ Deployment package created: deploy_refactored_online.zip"
echo "📋 Next steps:"
echo "1. Upload deploy_refactored_online.zip to Azure"
echo "2. Test the new API endpoints"
echo "3. Verify compatibility with existing frontend"

# Optional: Deploy direkt zu Azure (falls Azure CLI verfügbar)
if command -v az &> /dev/null; then
    echo "🌐 Deploying to Azure..."
    az webapp deployment source config-zip \
        --resource-group "la-zeiterfassung-rg" \
        --name "la-zeiterfassung-fyd4cge3d9e3cac4" \
        --src deploy_refactored_online.zip
    echo "✅ Deployed to Azure!"
else
    echo "⚠️  Azure CLI not found. Please deploy manually."
fi

echo "🎉 Refactored online deployment ready!" 