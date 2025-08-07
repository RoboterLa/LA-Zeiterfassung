#!/bin/bash

# 🚀 Deployment mit Azure Python Build Tools
# Nutzt die eingebauten Azure Python-Build-Mechanismen

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

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Deployment mit Python Build Tools${NC}"
echo "======================================================================"

# Function to configure Python build settings
configure_python_build() {
    echo -e "${BLUE}⚙️  Konfiguriere Python Build Settings...${NC}"
    
    # Set Python-specific build settings
    az webapp config appsettings set \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            PYTHON_VERSION=3.11 \
            SCM_DO_BUILD_DURING_DEPLOYMENT=true \
            WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
            ENABLE_ORYX_BUILD=true \
            BUILD_FLAGS="--platform python --platform-version 3.11"
    
    echo -e "${GREEN}✅ Python Build Settings konfiguriert${NC}"
}

# Function to set environment variables
set_environment() {
    echo -e "${BLUE}⚙️  Setze Environment Variables...${NC}"
    
    # Get web app URL
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
            WEBSITE_HOSTNAME="${WEBAPP_URL}" \
            WEBSITES_PORT=8000
    
    echo -e "${GREEN}✅ Environment Variables gesetzt${NC}"
}

# Function to create deployment package with startup command
create_package() {
    echo -e "${BLUE}📦 Erstelle Deployment Package...${NC}"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy application files
    cp app.py requirements.txt "$TEMP_DIR/"
    cp migrate_to_azure.py create_test_data.py "$TEMP_DIR/"
    
    # Create startup command
    cat > "$TEMP_DIR/startup.txt" << 'EOF'
gunicorn --bind=0.0.0.0:$PORT --timeout 600 --workers 1 app:app
EOF
    
    # Create web.config for Python
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
    
    # Create .deployment file to trigger build
    cat > "$TEMP_DIR/.deployment" << EOF
[config]
command = pip install -r requirements.txt && gunicorn --bind=0.0.0.0:\$PORT --timeout 600 --workers 1 app:app
EOF
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r python_build_deployment.zip . > /dev/null
    cd - > /dev/null
    
    # Move to current directory
    mv "$TEMP_DIR/python_build_deployment.zip" ./
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Deployment Package erstellt${NC}"
}

# Function to deploy
deploy() {
    echo -e "${BLUE}🚀 Deploye mit Python Build Tools...${NC}"
    
    # Deploy using the new package
    az webapp deploy \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --src-path python_build_deployment.zip
    
    echo -e "${GREEN}✅ Deployment abgeschlossen${NC}"
}

# Function to restart and test
restart_and_test() {
    echo -e "${BLUE}🔄 Starte Web App neu...${NC}"
    
    az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
    
    echo -e "${GREEN}✅ Web App neu gestartet${NC}"
    
    # Wait for startup
    echo -e "${BLUE}⏳ Warte auf App-Start...${NC}"
    sleep 60
    
    # Test the application
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    echo -e "${BLUE}🧪 Teste Application...${NC}"
    if curl -f "https://${WEBAPP_URL}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application ist erreichbar!${NC}"
        echo -e "${BLUE}🌐 URL: https://${WEBAPP_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️  Application noch nicht erreichbar${NC}"
        echo -e "${BLUE}🔍 Prüfe die Logs im Azure Portal${NC}"
    fi
}

# Main function
main() {
    echo -e "${BLUE}🚀 Starte Deployment mit Python Build Tools...${NC}"
    
    # Configure Python build settings
    configure_python_build
    
    # Set environment variables
    set_environment
    
    # Create deployment package
    create_package
    
    # Deploy
    deploy
    
    # Restart and test
    restart_and_test
    
    echo -e "${GREEN}🎉 Deployment mit Python Build Tools abgeschlossen!${NC}"
}

# Run main function
main "$@" 