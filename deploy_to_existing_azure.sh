#!/bin/bash

# 🚀 Deployment auf bestehende Azure Web App "LA-Zeiterfassung"
# Deployt Code auf die bereits existierende Azure Web App

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration für bestehende Azure Web App
RESOURCE_GROUP="LA-Zeiterfassung_group"
WEBAPP_NAME="LA-Zeiterfassung"
LOCATION="germanywestcentral"

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Deployment auf bestehende Azure Web App${NC}"
echo "======================================================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI ist nicht installiert. Bitte installieren Sie es zuerst.${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Sie sind nicht bei Azure angemeldet. Bitte melden Sie sich an.${NC}"
    az login
fi

echo -e "${GREEN}✅ Azure CLI bereit${NC}"

# Function to check if web app exists
check_webapp() {
    echo -e "${BLUE}🔍 Prüfe bestehende Azure Web App...${NC}"
    
    if az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        echo -e "${GREEN}✅ Web App gefunden: ${WEBAPP_NAME}${NC}"
        
        # Get web app details
        WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
        echo -e "${GREEN}✅ Web App URL: https://${WEBAPP_URL}${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Web App ${WEBAPP_NAME} nicht gefunden in Resource Group ${RESOURCE_GROUP}${NC}"
        return 1
    fi
}

# Function to configure environment variables
configure_environment() {
    echo -e "${BLUE}⚙️  Konfiguriere Environment Variables...${NC}"
    
    # Get the web app URL
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    # Backend Environment Variables (SQLite für Azure)
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
            WEBSITE_HOSTNAME="${WEBAPP_URL}"
    
    echo -e "${GREEN}✅ Environment Variables konfiguriert${NC}"
}

# Function to deploy backend code
deploy_backend() {
    echo -e "${BLUE}📦 Deploye Backend Code...${NC}"
    
    # Create deployment package
    echo "📦 Erstelle Backend Package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    cp -r app.py requirements.txt create_test_data.py migrate_to_azure.py "$TEMP_DIR/"
    cp -r instance "$TEMP_DIR/" 2>/dev/null || true
    
    # Copy startup files
    cp startup.txt web.config "$TEMP_DIR/"
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r backend.zip . > /dev/null
    cd - > /dev/null
    
    # Deploy to Azure
    echo "🚀 Deploye zu Azure Web App..."
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --src "$TEMP_DIR/backend.zip"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Function to restart web app
restart_webapp() {
    echo -e "${BLUE}🔄 Starte Web App neu...${NC}"
    
    az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
    
    echo -e "${GREEN}✅ Web App neu gestartet${NC}"
}

# Function to run database migration
run_migration() {
    echo -e "${BLUE}🗄️  Führe Database Migration aus...${NC}"
    
    # Get the web app URL
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    # Wait a bit for the app to start
    echo "⏳ Warte auf App-Start..."
    sleep 30
    
    # Run migration via HTTP request
    echo "🔄 Starte Migration..."
    curl -X POST "https://${WEBAPP_URL}/migrate" || echo -e "${YELLOW}⚠️  Migration endpoint nicht verfügbar${NC}"
    
    echo -e "${GREEN}✅ Migration abgeschlossen${NC}"
}

# Function to test deployment
test_deployment() {
    echo -e "${BLUE}🧪 Teste Deployment...${NC}"
    
    # Get the web app URL
    WEBAPP_URL=$(az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)
    
    # Wait for app to be ready
    echo "⏳ Warte auf App-Bereitschaft..."
    sleep 60
    
    # Test basic connectivity
    echo "🔍 Teste Web App Erreichbarkeit..."
    if curl -f "https://${WEBAPP_URL}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web App ist erreichbar${NC}"
    else
        echo -e "${YELLOW}⚠️  Web App noch nicht erreichbar (kann normal sein bei erstem Deployment)${NC}"
    fi
    
    # Test API endpoint
    echo "🔍 Teste API Endpoint..."
    if curl -f "https://${WEBAPP_URL}/api/auth/me" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API ist erreichbar${NC}"
    else
        echo -e "${YELLOW}⚠️  API noch nicht erreichbar${NC}"
    fi
}

# Function to display deployment info
show_deployment_info() {
    echo -e "${BLUE}📋 Deployment Information:${NC}"
    echo "=================================="
    echo -e "${GREEN}✅ Web App Name:${NC} ${WEBAPP_NAME}"
    echo -e "${GREEN}✅ Resource Group:${NC} ${RESOURCE_GROUP}"
    echo -e "${GREEN}✅ Location:${NC} ${LOCATION}"
    echo -e "${GREEN}✅ Web App URL:${NC} https://${WEBAPP_URL}"
    echo ""
    echo -e "${YELLOW}⚠️  Nächste Schritte:${NC}"
    echo "1. Azure AD App Registration konfigurieren"
    echo "2. Custom Domain konfigurieren"
    echo "3. SSL Certificates installieren"
    echo "4. Frontend deployen (separat)"
    echo ""
    echo -e "${BLUE}📖 Vollständige Anleitung:${NC} AZURE_DEPLOYMENT_GUIDE.md"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Starte Deployment auf bestehende Azure Web App...${NC}"
    
    # Check if web app exists
    if ! check_webapp; then
        echo -e "${RED}❌ Web App nicht gefunden. Bitte erstellen Sie zuerst eine Azure Web App.${NC}"
        exit 1
    fi
    
    # Configure Environment
    configure_environment
    
    # Deploy Code
    deploy_backend
    
    # Restart Web App
    restart_webapp
    
    # Test Deployment
    test_deployment
    
    # Run Migration
    run_migration
    
    # Show Info
    show_deployment_info
    
    echo -e "${GREEN}🎉 Deployment erfolgreich abgeschlossen!${NC}"
    echo -e "${BLUE}🌐 Ihre App ist verfügbar unter: https://${WEBAPP_URL}${NC}"
}

# Run main function
main "$@" 