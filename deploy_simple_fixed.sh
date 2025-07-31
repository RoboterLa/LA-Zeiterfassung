#!/bin/bash

# 🚀 Vereinfachtes Deployment für Azure App Service
# Fokus: Python-Dependencies korrekt installieren

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

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Vereinfachtes Deployment${NC}"
echo "======================================================================"

# Function to create minimal deployment package
create_minimal_package() {
    echo -e "${BLUE}📦 Erstelle minimales Deployment Package...${NC}"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy only essential files
    cp app.py requirements.txt "$TEMP_DIR/"
    
    # Create startup command that installs dependencies
    cat > "$TEMP_DIR/startup.txt" << 'EOF'
#!/bin/bash
echo "🚀 Starting application..."

# Install dependencies if not already installed
if [ ! -f "/tmp/dependencies_installed" ]; then
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch /tmp/dependencies_installed
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Create necessary directories
mkdir -p sessions
mkdir -p instance

# Start the application
echo "🚀 Starting Flask application..."
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
    
    # Make startup script executable
    chmod +x "$TEMP_DIR/startup.txt"
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r minimal_deployment.zip . > /dev/null
    cd - > /dev/null
    
    # Move to current directory
    mv "$TEMP_DIR/minimal_deployment.zip" ./
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Minimales Deployment Package erstellt${NC}"
}

# Function to set basic environment variables
set_basic_env() {
    echo -e "${BLUE}⚙️  Setze grundlegende Environment Variables...${NC}"
    
    # Set only essential environment variables
    az webapp config appsettings set \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            FLASK_ENV=production \
            DATABASE_URL="sqlite:///zeiterfassung.db" \
            CLIENT_ID="bce7f739-d799-4c57-8758-7b6b21999678" \
            CLIENT_SECRET="eKN8Q~dojyFDd2Bdt8BSiHVVapJuko3bgqbvhcOr" \
            SECRET_KEY="$(openssl rand -hex 32)"
    
    echo -e "${GREEN}✅ Environment Variables gesetzt${NC}"
}

# Function to deploy
deploy() {
    echo -e "${BLUE}🚀 Deploye minimales Package...${NC}"
    
    # Deploy the minimal package
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --src minimal_deployment.zip
    
    echo -e "${GREEN}✅ Deployment abgeschlossen${NC}"
}

# Function to restart and monitor
restart_and_monitor() {
    echo -e "${BLUE}🔄 Starte Web App neu...${NC}"
    
    az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
    
    echo -e "${GREEN}✅ Web App neu gestartet${NC}"
    
    # Monitor startup
    echo -e "${BLUE}⏳ Überwache App-Start...${NC}"
    for i in {1..10}; do
        echo "⏳ Warte... ($i/10)"
        sleep 30
        
        # Test the application
        WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
        
        if curl -f "https://${WEBAPP_URL}/" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Application ist erreichbar!${NC}"
            echo -e "${BLUE}🌐 URL: https://${WEBAPP_URL}${NC}"
            return 0
        fi
    done
    
    echo -e "${YELLOW}⚠️  Application noch nicht erreichbar${NC}"
    echo -e "${BLUE}🔍 Prüfe die Logs im Azure Portal${NC}"
}

# Main function
main() {
    echo -e "${BLUE}🚀 Starte vereinfachtes Deployment...${NC}"
    
    # Create minimal package
    create_minimal_package
    
    # Set basic environment variables
    set_basic_env
    
    # Deploy
    deploy
    
    # Restart and monitor
    restart_and_monitor
    
    echo -e "${GREEN}🎉 Vereinfachtes Deployment abgeschlossen!${NC}"
}

# Run main function
main "$@" 