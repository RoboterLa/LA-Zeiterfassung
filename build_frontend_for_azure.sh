#!/bin/bash

echo "🚀 Baue Frontend für Azure Deployment..."

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert. Bitte installiere Node.js zuerst."
    exit 1
fi

# Wechsle ins Frontend-Verzeichnis
cd frontend

# Installiere Dependencies
echo "📦 Installiere Dependencies..."
npm install

# Baue Production Build
echo "🔨 Baue Production Build..."
npm run build

# Erstelle Azure-spezifische Konfiguration
echo "⚙️ Erstelle Azure-Konfiguration..."

# Erstelle .env.production für Azure
cat > .env.production << EOF
REACT_APP_API_URL=https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net
REACT_APP_ENVIRONMENT=production
EOF

# Baue mit Production-Konfiguration
echo "🔨 Baue mit Production-Konfiguration..."
REACT_APP_API_URL=https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net npm run build

# Erstelle Azure Deployment Package
echo "📦 Erstelle Azure Frontend Package..."
mkdir -p ../deploy_frontend_azure
cp -r build/* ../deploy_frontend_azure/

# Erstelle web.config für Azure Static Files
cat > ../deploy_frontend_azure/web.config << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
EOF

# Erstelle ZIP für Frontend
cd ../deploy_frontend_azure
zip -r ../deploy_frontend_azure.zip .
cd ..

echo "✅ Frontend Azure Package erstellt: deploy_frontend_azure.zip"
echo "📁 Inhalt:"
ls -la deploy_frontend_azure/

echo ""
echo "🚀 Azure Frontend Deployment Anweisungen:"
echo "1. deploy_frontend_azure.zip auf Azure Static Web Apps hochladen"
echo "2. Oder in Azure App Service als statische Dateien deployen"
echo "3. Custom Domain konfigurieren (optional)"
echo "4. SSL-Zertifikat aktivieren" 