#!/bin/bash

echo "🚀 Ultra-einfaches Deployment..."

# Cleanup
rm -rf deploy_simple_final
mkdir deploy_simple_final

# Nur die wichtigsten Dateien
cp app.py deploy_simple_final/
cp requirements.txt deploy_simple_final/

# ZIP erstellen
cd deploy_simple_final
zip -r ../deploy_simple_final.zip . > /dev/null
cd ..

# Cleanup
rm -rf deploy_simple_final

echo "✅ Fertig: deploy_simple_final.zip"
echo ""
echo "📋 JETZT:"
echo "1. Azure Portal ist geöffnet"
echo "2. Suche: la-zeiterfassung-fyd4cge3d9e3cac4"
echo "3. Deployment Center → Manual deployment"
echo "4. Lade deploy_simple_final.zip hoch"
echo ""
echo "🌐 App URL: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net" 