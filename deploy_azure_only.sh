#!/bin/bash

echo "🚀 Erstelle Azure-Only Deployment Package..."

# Stoppe laufende Prozesse
echo "Stoppe laufende Prozesse..."
pkill -f "python.*app.py" || true
pkill -f "python.*run.py" || true

# Erstelle Azure Deployment Package
echo "Erstelle Azure Deployment Package..."
mkdir -p deploy_azure_only
cp -r backend deploy_azure_only/
cp app.py deploy_azure_only/
cp requirements.txt deploy_azure_only/

# Erstelle Azure-spezifische Konfiguration
cat > deploy_azure_only/startup.txt << EOF
python app.py
EOF

cat > deploy_azure_only/web.config << EOF
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
  </system.webServer>
</configuration>
EOF

# Erstelle requirements.txt für Azure
cat > deploy_azure_only/requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
EOF

# Erstelle Azure-spezifische Backend-Konfiguration
cat > deploy_azure_only/backend/config.py << EOF
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
cat > deploy_azure_only/app.py << EOF
#!/usr/bin/env python3
"""
Azure Production App für Zeiterfassung System
"""

import sys
import os

# Füge das Backend-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from backend.app import app

if __name__ == '__main__':
    print("🚀 Azure Production - Zeiterfassung System wird gestartet...")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

# Erstelle ZIP für Azure Deployment
echo "Erstelle ZIP-Datei..."
cd deploy_azure_only
zip -r ../deploy_azure_only.zip .
cd ..

echo "✅ Azure-Only Deployment Package erstellt: deploy_azure_only.zip"
echo "📁 Inhalt:"
ls -la deploy_azure_only/

echo ""
echo "🚀 Azure Deployment Anweisungen:"
echo "1. deploy_azure_only.zip auf Azure hochladen"
echo "2. App Service konfigurieren:"
echo "   - Python 3.11"
echo "   - Startup Command: python app.py"
echo "   - Environment Variables:"
echo "     - FLASK_ENV=production"
echo "     - FLASK_SECRET_KEY=azure_production_secret_key_2024"
echo "3. Custom Domain konfigurieren (optional)"
echo "4. SSL-Zertifikat aktivieren" 