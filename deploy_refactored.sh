#!/bin/bash

echo "🚀 Deploye refactored Zeiterfassung System..."

# Stoppe laufende Prozesse
echo "Stoppe laufende Prozesse..."
pkill -f "python.*app.py" || true
pkill -f "python.*run.py" || true

# Erstelle Deployment-Package
echo "Erstelle Deployment-Package..."
mkdir -p deploy_refactored
cp -r backend deploy_refactored/
cp -r frontend deploy_refactored/
cp app.py deploy_refactored/
cp requirements.txt deploy_refactored/
cp web.config deploy_refactored/
cp startup.txt deploy_refactored/

# Erstelle requirements.txt für Backend
cat > deploy_refactored/backend/requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
EOF

# Erstelle package.json für Frontend (falls nicht vorhanden)
if [ ! -f deploy_refactored/frontend/package.json ]; then
    cat > deploy_refactored/frontend/package.json << EOF
{
  "name": "zeiterfassung-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "axios": "^1.4.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF
fi

# Erstelle Azure-spezifische Konfiguration
cat > deploy_refactored/startup.txt << EOF
python app.py
EOF

cat > deploy_refactored/web.config << EOF
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
      </environmentVariables>
    </httpPlatform>
  </system.webServer>
</configuration>
EOF

# Erstelle ZIP für Azure Deployment
echo "Erstelle ZIP-Datei..."
cd deploy_refactored
zip -r ../deploy_refactored_azure.zip .
cd ..

echo "✅ Deployment-Package erstellt: deploy_refactored_azure.zip"
echo "📁 Inhalt:"
ls -la deploy_refactored/

echo ""
echo "🚀 Zum Deployen:"
echo "1. Frontend bauen: cd frontend && npm run build"
echo "2. Backend starten: python3 app.py"
echo "3. Azure: deploy_refactored_azure.zip hochladen" 