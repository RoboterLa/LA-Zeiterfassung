#!/bin/bash

echo "🚀 Erstelle komplettes Azure Deployment Package..."

# Stoppe laufende Prozesse
echo "Stoppe laufende Prozesse..."
pkill -f "python.*app.py" || true
pkill -f "python.*run.py" || true

# Erstelle Azure Complete Deployment Package
echo "Erstelle Azure Complete Deployment Package..."
mkdir -p deploy_azure_complete

# Backend kopieren
echo "📦 Kopiere Backend..."
cp -r backend deploy_azure_complete/
cp app.py deploy_azure_complete/

# Frontend bauen und kopieren
echo "🔨 Baue Frontend..."
cd frontend

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js nicht gefunden - verwende vorhandenes Build..."
    if [ -d "build" ]; then
        cp -r build ../deploy_azure_complete/frontend_build
    else
        echo "❌ Kein Build gefunden. Erstelle statisches Frontend..."
        mkdir -p ../deploy_azure_complete/frontend_build
        cat > ../deploy_azure_complete/frontend_build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zeiterfassung System - Lackner Aufzüge</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: Arial, sans-serif; }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <div class="mb-8">
                <img src="https://lackner-aufzuege-gmbh.com/wp-content/uploads/2021/09/cropped-2205_lackner_r.png" 
                     alt="Lackner Aufzüge" class="h-20 mx-auto mb-4">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Zeiterfassung System</h1>
                <p class="text-gray-600">Lackner Aufzüge GmbH</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                <div class="loading text-4xl mb-4">⏳</div>
                <h2 class="text-xl font-semibold text-gray-900 mb-2">System wird geladen...</h2>
                <p class="text-gray-600 mb-4">Das Frontend wird für Azure optimiert</p>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
                        <span class="text-blue-700">Backend API</span>
                        <span class="text-green-600">✓ Bereit</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-yellow-50 rounded">
                        <span class="text-yellow-700">Frontend Build</span>
                        <span class="text-yellow-600">⏳ Wird erstellt...</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span class="text-gray-700">Azure Deployment</span>
                        <span class="text-gray-600">⏳ Wird vorbereitet...</span>
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-gray-100 rounded text-sm">
                    <p class="text-gray-700">
                        <strong>Azure URL:</strong><br>
                        https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
EOF
    fi
else
    echo "📦 Installiere Dependencies..."
    npm install --silent
    
    echo "🔨 Baue Production Build..."
    REACT_APP_API_URL=https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net npm run build --silent
    
    echo "📦 Kopiere Frontend Build..."
    cp -r build ../deploy_azure_complete/frontend_build
fi

cd ..

# Erstelle Azure-spezifische Konfiguration
echo "⚙️ Erstelle Azure-Konfiguration..."

cat > deploy_azure_complete/startup.txt << EOF
python app.py
EOF

cat > deploy_azure_complete/web.config << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" scriptProcessor="python.exe" />
    </handlers>
    <httpPlatform processPath="%home%\site\wwwroot\env\Scripts\python.exe" arguments="%home%\site\wwwroot\app.py" stdoutLogEnabled="true" stdoutLogFile="%home%\LogFiles\stdout" startupTimeLimit="60">
      <environmentVariables>
        <environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />
        <environmentVariable name="FLASK_ENV" value="production" />
        <environmentVariable name="FLASK_SECRET_KEY" value="azure_production_secret_key_2024" />
      </environmentVariables>
    </httpPlatform>
    <rewrite>
      <rules>
        <rule name="Static Files" stopProcessing="true">
          <match url="^(static|assets|css|js|images)/.*" />
          <action type="Rewrite" url="frontend_build/{R:0}" />
        </rule>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/.*" negate="true" />
          </conditions>
          <action type="Rewrite" url="frontend_build/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
EOF

cat > deploy_azure_complete/requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
EOF

# Erstelle Azure-spezifische Backend-Konfiguration
cat > deploy_azure_complete/backend/config.py << EOF
import os

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'azure_production_secret_key_2024')
    DEBUG = False
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_ORIGINS = [
        'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        'http://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net',
        'https://localhost:3000',
        'http://localhost:3000'
    ]
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
EOF

# Erstelle Azure-spezifische app.py
cat > deploy_azure_complete/app.py << EOF
#!/usr/bin/env python3
"""
Azure Production App für Zeiterfassung System
Backend + Frontend in einem Package
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app

if __name__ == '__main__':
    print("🚀 Azure Production - Zeiterfassung System wird gestartet...")
    print("📦 Backend + Frontend Package")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

# Erstelle ZIP für Azure Deployment
echo "📦 Erstelle ZIP-Datei..."
cd deploy_azure_complete
zip -r ../deploy_azure_complete.zip .
cd ..

echo "✅ Komplettes Azure Deployment Package erstellt: deploy_azure_complete.zip"
echo "📁 Inhalt:"
ls -la deploy_azure_complete/

echo ""
echo "🚀 Azure Complete Deployment Anweisungen:"
echo "1. deploy_azure_complete.zip auf Azure App Service hochladen"
echo "2. App Service konfigurieren:"
echo "   - Python 3.11"
echo "   - Startup Command: python app.py"
echo "   - Environment Variables:"
echo "     - FLASK_ENV=production"
echo "     - FLASK_SECRET_KEY=azure_production_secret_key_2024"
echo "3. Custom Domain konfigurieren (optional)"
echo "4. SSL-Zertifikat aktivieren"
echo ""
echo "🌐 Nach dem Deployment:"
echo "   - Backend API: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/"
echo "   - Frontend: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/"
echo "   - Health Check: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health" 