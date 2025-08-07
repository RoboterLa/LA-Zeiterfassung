#!/bin/bash

echo "🚀 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "📦 Packaging application..."
zip -r app.zip app.py backend/ requirements.txt static/ >/dev/null

echo "🌐 Deploying to Azure..."
az webapp deployment source config-zip \
  --resource-group la-zeiterfassung-rg \
  --name la-zeiterfassung-fyd4cge3d9e3cac4 \
  --src app.zip

echo "✅ Deployment complete!"
echo "🔍 Testing health endpoint..."
sleep 10
curl -s https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health
