#!/bin/bash

# Finales Azure Deployment
# Mit Procfile und korrigierten Session-Einstellungen

echo "🚀 Finales Azure Deployment..."

# Cleanup
rm -rf deploy_final
mkdir deploy_final

# Essentielle Dateien
cp app.py deploy_final/
cp requirements.txt deploy_final/
cp Procfile deploy_final/

# Einfache .deployment Datei
cat > deploy_final/.deployment << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = true
EOF

# ZIP erstellen
cd deploy_final
zip -r ../deploy_final.zip . > /dev/null
cd ..

# Cleanup
rm -rf deploy_final

echo "✅ Finales Deployment Package erstellt: deploy_final.zip"
echo ""
echo "📋 Deployment:"
echo "az webapp deploy --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4 --src-path deploy_final.zip --type zip" 