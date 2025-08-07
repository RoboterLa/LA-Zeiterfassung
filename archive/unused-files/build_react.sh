#!/bin/bash

echo "🚀 React Build für Azure Deployment"
echo "=================================="

echo "📦 Installiere Dependencies..."
cd frontend
npm install

echo "🔨 Baue React App..."
npm run build

echo "📁 Kopiere Build zu Root..."
cp -r build ../frontend/

echo "✅ React Build abgeschlossen!"
echo "📁 Build-Verzeichnis: frontend/build/" 