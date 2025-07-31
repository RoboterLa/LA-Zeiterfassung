#!/bin/bash

# Verbessertes Azure Deployment Script
# Behebt alle bekannten Probleme

set -e

echo "🚀 Verbessertes Azure Deployment..."

# Konfiguration
RESOURCE_GROUP="la-zeiterfassung-rg"
APP_NAME="la-zeiterfassung-fyd4cge3d9e3cac4"
LOCATION="germanywestcentral"

# Prüfe Login
if ! az account show &> /dev/null; then
    echo "❌ Nicht bei Azure eingeloggt. Bitte 'az login' ausführen."
    exit 1
fi

echo "✅ Azure CLI Login erfolgreich"

# Environment Variables setzen
echo "🔧 Setze Environment Variables..."
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
    FLASK_ENV=production \
    FLASK_DEBUG=0 \
    FLASK_SECRET_KEY="$(openssl rand -hex 32)" \
    CLIENT_ID="bce7f739-d799-4c57-8758-7b6b21999678" \
    CLIENT_SECRET="eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    PYTHON_VERSION=3.11 \
    WEBSITES_PORT=8000

# Startup Command setzen
echo "⚙️ Setze Startup Command..."
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "gunicorn --bind=0.0.0.0:$PORT --timeout 600 --workers 1 app:app"

# Deployment Package erstellen
echo "📦 Erstelle verbessertes Deployment Package..."

# Cleanup
rm -rf deploy_fixed
mkdir deploy_fixed

# Dateien kopieren
cp app.py deploy_fixed/
cp requirements.txt deploy_fixed/
cp startup.txt deploy_fixed/

# Verzeichnisse erstellen
mkdir -p deploy_fixed/sessions
mkdir -p deploy_fixed/instance

# .deployment Datei
cat > deploy_fixed/.deployment << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = true
POST_BUILD_COMMAND = pip install -r requirements.txt
EOF

# build.sh erstellen
cat > deploy_fixed/build.sh << 'EOF'
#!/bin/bash
echo "🔧 Installiere Python Dependencies..."
pip install -r requirements.txt

echo "📁 Erstelle notwendige Verzeichnisse..."
mkdir -p /tmp/sessions
mkdir -p /tmp/instance

echo "🗄️ Initialisiere Datenbank..."
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Datenbank erfolgreich initialisiert')
"

echo "✅ Build abgeschlossen"
EOF

chmod +x deploy_fixed/build.sh

# ZIP erstellen
cd deploy_fixed
zip -r ../deploy_fixed.zip . > /dev/null
cd ..

# Cleanup
rm -rf deploy_fixed

echo "✅ Verbessertes Deployment Package erstellt: deploy_fixed.zip"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Gehe zu https://portal.azure.com"
echo "2. Suche nach: $APP_NAME"
echo "3. Gehe zu 'Deployment Center'"
echo "4. Wähle 'Manual deployment'"
echo "5. Lade die Datei 'deploy_fixed.zip' hoch"
echo ""
echo "🌐 App URL: https://$APP_NAME.azurewebsites.net"
echo "🔍 Health Check: https://$APP_NAME.azurewebsites.net/health" 