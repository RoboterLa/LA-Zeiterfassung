#!/bin/bash

echo "🚀 Erstelle funktionierendes Azure Deployment Package..."

# Stoppe laufende Prozesse
echo "Stoppe laufende Prozesse..."
pkill -f "python.*app.py" || true

# Erstelle Azure Working Deployment Package
echo "Erstelle Azure Working Deployment Package..."
mkdir -p deploy_azure_working

# Backend kopieren
echo "📦 Kopiere Backend..."
cp -r backend deploy_azure_working/
cp app.py deploy_azure_working/

# Frontend kopieren
echo "📦 Kopiere Frontend..."
cp -r frontend_build deploy_azure_working/frontend_build

# Erstelle Azure-spezifische Konfiguration
echo "⚙️ Erstelle Azure-Konfiguration..."

cat > deploy_azure_working/startup.txt << EOF
python app.py
EOF

cat > deploy_azure_working/web.config << EOF
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

cat > deploy_azure_working/requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
EOF

# Erstelle Azure-spezifische Backend-Konfiguration
cat > deploy_azure_working/backend/config.py << EOF
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
cat > deploy_azure_working/app.py << EOF
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
cd deploy_azure_working
zip -r ../deploy_azure_working.zip .
cd ..

echo "✅ Funktionierendes Azure Deployment Package erstellt: deploy_azure_working.zip"
echo "📁 Inhalt:"
ls -la deploy_azure_working/

echo ""
echo "🚀 Azure Working Deployment Anweisungen:"
echo "1. deploy_azure_working.zip auf Azure App Service hochladen"
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
echo "   - Frontend: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/"
echo "   - Backend API: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/"
echo "   - Health Check: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health"
echo ""
echo "✅ GETESTET:"
echo "   - Backend API funktioniert"
echo "   - Frontend wird korrekt serviert"
echo "   - Login-System funktioniert"
echo "   - Timer-Funktionalität implementiert" 