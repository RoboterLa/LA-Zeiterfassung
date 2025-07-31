#!/bin/bash

echo "🚀 Erstelle minimales Azure Deployment Package..."

# Erstelle temporäres Verzeichnis
rm -rf deploy_minimal_temp
mkdir deploy_minimal_temp
cd deploy_minimal_temp

# Kopiere nur die essentiellen Dateien
cp ../app_azure.py ./app.py
cp ../requirements.txt ./

# Erstelle startup.txt für Azure
echo "gunicorn --bind=0.0.0.0:\$PORT --timeout 600 app:app" > startup.txt

# Erstelle web.config für IIS
cat > web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="%home%\site\wwwroot\env\Scripts\python.exe"
                  arguments="%home%\site\wwwroot\startup.txt"
                  stdoutLogEnabled="true"
                  stdoutLogFile="%home%\LogFiles\stdout"
                  startupTimeLimit="60">
      <environmentVariables>
        <environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />
      </environmentVariables>
    </httpPlatform>
  </system.webServer>
</configuration>
EOF

# Erstelle .deployment für Azure
cat > .deployment << 'EOF'
[config]
command = pip install -r requirements.txt
EOF

# Erstelle ZIP
zip -r ../deploy_azure_minimal.zip .

# Aufräumen
cd ..
rm -rf deploy_minimal_temp

echo "✅ Deployment Package erstellt: deploy_azure_minimal.zip"
echo "📦 Inhalt:"
unzip -l deploy_azure_minimal.zip

echo ""
echo "🚀 Deployment-Befehl:"
echo "az webapp deploy --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4 --src-path deploy_azure_minimal.zip --type zip" 