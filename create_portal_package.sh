#!/bin/bash

# 🚀 Erstelle Deployment Package für Azure Portal
# Diese Methode umgeht die CLI-Probleme

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Azure Portal Deployment Package${NC}"
echo "======================================================================"

# Create deployment package
create_package() {
    echo -e "${BLUE}📦 Erstelle Azure Portal Deployment Package...${NC}"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy application files
    cp app.py requirements.txt "$TEMP_DIR/"
    cp migrate_to_azure.py create_test_data.py "$TEMP_DIR/"
    
    # Create startup command
    cat > "$TEMP_DIR/startup.txt" << 'EOF'
gunicorn --bind=0.0.0.0:$PORT --timeout 600 --workers 1 app:app
EOF
    
    # Create web.config
    cat > "$TEMP_DIR/web.config" << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="%home%\site\wwwroot\startup.txt" arguments="" stdoutLogEnabled="true" stdoutLogFile="%home%\LogFiles\stdout" />
  </system.webServer>
</configuration>
EOF
    
    # Create deployment instructions
    cat > "$TEMP_DIR/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
# Azure Portal Deployment Instructions

## 1. Environment Variables im Azure Portal setzen:

Gehe zu: Azure Portal > LA-Zeiterfassung > Configuration > Application settings

Setze folgende Environment Variables:

- FLASK_ENV = production
- DATABASE_URL = sqlite:///zeiterfassung.db
- CLIENT_ID = bce7f739-d799-4c57-8758-7b6b21999678
- CLIENT_SECRET = eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr
- SECRET_KEY = [generiere einen zufälligen String]
- PYTHON_VERSION = 3.11
- SCM_DO_BUILD_DURING_DEPLOYMENT = true

## 2. Deployment Package hochladen:

1. Gehe zu: Azure Portal > LA-Zeiterfassung > Deployment Center
2. Wähle "Manual deployment"
3. Lade diese ZIP-Datei hoch
4. Klicke auf "Deploy"

## 3. Nach dem Deployment:

1. Gehe zu: Azure Portal > LA-Zeiterfassung > Restart
2. Warte 2-3 Minuten
3. Teste die URL: https://la-zeiterfassung-fyd4cge3d9e3cac4.germanywestcentral-01.azurewebsites.net/

## 4. Migration ausführen:

Nach dem ersten Start, führe die Migration aus:
POST https://la-zeiterfassung-fyd4cge3d9e3cac4.germanywestcentral-01.azurewebsites.net/migrate
EOF
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r azure_portal_deployment.zip . > /dev/null
    cd - > /dev/null
    
    # Move to current directory
    mv "$TEMP_DIR/azure_portal_deployment.zip" ./
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Azure Portal Deployment Package erstellt: azure_portal_deployment.zip${NC}"
    echo -e "${BLUE}📋 Nächste Schritte:${NC}"
    echo -e "${YELLOW}1. Gehe ins Azure Portal${NC}"
    echo -e "${YELLOW}2. Setze die Environment Variables (siehe DEPLOYMENT_INSTRUCTIONS.md)${NC}"
    echo -e "${YELLOW}3. Lade azure_portal_deployment.zip hoch${NC}"
    echo -e "${YELLOW}4. Starte die Web App neu${NC}"
}

# Run the function
create_package 