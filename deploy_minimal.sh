#!/bin/bash

# Minimales Azure Deployment
# Ohne komplexe Build-Scripts

echo "🚀 Minimales Azure Deployment..."

# Cleanup
rm -rf deploy_minimal
mkdir deploy_minimal

# Nur die essentiellen Dateien
cp app.py deploy_minimal/
cp requirements.txt deploy_minimal/

# Einfache .deployment Datei
cat > deploy_minimal/.deployment << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = true
EOF

# ZIP erstellen
cd deploy_minimal
zip -r ../deploy_minimal.zip . > /dev/null
cd ..

# Cleanup
rm -rf deploy_minimal

echo "✅ Minimales Deployment Package erstellt: deploy_minimal.zip"
echo ""
echo "📋 Deployment:"
echo "az webapp deploy --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4 --src-path deploy_minimal.zip --type zip" 