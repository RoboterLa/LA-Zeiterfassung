#!/bin/bash

# 🚀 Deployment mit Build-Script für Azure App Service
# Diese Methode stellt sicher, dass Python-Dependencies installiert werden

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="LA-Zeiterfassung_group"
WEBAPP_NAME="LA-Zeiterfassung"
LOCATION="germanywestcentral"

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Deployment mit Build-Script${NC}"
echo "======================================================================"

# Function to configure build settings
configure_build() {
    echo -e "${BLUE}⚙️  Konfiguriere Build-Einstellungen...${NC}"
    
    # Set build configuration
    az webapp config appsettings set \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            SCM_DO_BUILD_DURING_DEPLOYMENT=true \
            BUILD_FLAGS="--build-from-local" \
            PYTHON_VERSION=3.11 \
            WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
    
    echo -e "${GREEN}✅ Build-Einstellungen konfiguriert${NC}"
}

# Function to configure environment variables
configure_environment() {
    echo -e "${BLUE}⚙️  Konfiguriere Environment Variables...${NC}"
    
    # Get the web app URL
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    # Set environment variables
    az webapp config appsettings set \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            FLASK_ENV=production \
            DATABASE_URL="sqlite:///zeiterfassung.db" \
            CLIENT_ID="bce7f739-d799-4c57-8758-7b6b21999678" \
            CLIENT_SECRET="eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr" \
            SECRET_KEY="$(openssl rand -hex 32)" \
            CORS_ORIGINS="https://${WEBAPP_URL},http://localhost:3000" \
            WEBSITE_HOSTNAME="${WEBAPP_URL}" \
            WEBSITES_PORT=8000
    
    echo -e "${GREEN}✅ Environment Variables konfiguriert${NC}"
}

# Function to create deployment package
create_package() {
    echo -e "${BLUE}📦 Erstelle Deployment Package...${NC}"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy necessary files
    cp app.py requirements.txt startup.txt build.sh "$TEMP_DIR/"
    cp migrate_to_azure.py create_test_data.py "$TEMP_DIR/"
    
    # Create startup command
    cat > "$TEMP_DIR/startup.txt" << EOF
#!/bin/bash
# Run build script first
chmod +x build.sh
./build.sh

# Start the application
gunicorn --bind=0.0.0.0:\$PORT --timeout 600 --workers 1 app:app
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
    
    # Make startup script executable
    chmod +x "$TEMP_DIR/startup.txt"
    chmod +x "$TEMP_DIR/build.sh"
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r deployment.zip . > /dev/null
    cd - > /dev/null
    
    # Move to current directory
    mv "$TEMP_DIR/deployment.zip" ./deployment_with_build.zip
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Deployment Package erstellt: deployment_with_build.zip${NC}"
}

# Function to deploy
deploy() {
    echo -e "${BLUE}🚀 Deploye mit Build-Script...${NC}"
    
    # Deploy using the new package
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --src deployment_with_build.zip
    
    echo -e "${GREEN}✅ Deployment abgeschlossen${NC}"
}

# Function to restart and test
restart_and_test() {
    echo -e "${BLUE}🔄 Starte Web App neu...${NC}"
    
    az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
    
    echo -e "${GREEN}✅ Web App neu gestartet${NC}"
    
    # Wait for startup
    echo -e "${BLUE}⏳ Warte auf App-Start...${NC}"
    sleep 120
    
    # Test the application
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    echo -e "${BLUE}🧪 Teste Application...${NC}"
    if curl -f "https://${WEBAPP_URL}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application ist erreichbar!${NC}"
        echo -e "${BLUE}🌐 URL: https://${WEBAPP_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️  Application noch nicht erreichbar (kann normal sein)${NC}"
    fi
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Starte Deployment mit Build-Script...${NC}"
    
    # Configure build settings
    configure_build
    
    # Configure environment
    configure_environment
    
    # Create deployment package
    create_package
    
    # Deploy
    deploy
    
    # Restart and test
    restart_and_test
    
    echo -e "${GREEN}🎉 Deployment mit Build-Script abgeschlossen!${NC}"
    echo -e "${BLUE}🌐 Deine App ist verfügbar unter: https://${WEBAPP_URL}${NC}"
}

# Run main function
main "$@" 