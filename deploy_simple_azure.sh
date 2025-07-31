#!/bin/bash

# 🚀 Vereinfachtes Azure Deployment für LACKNER® AUFZÜGE
# Deployment ohne Azure SQL Database (verwendet SQLite)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="lackner-rg"
LOCATION="swedencentral"
BACKEND_NAME="lackner-backend"
FRONTEND_NAME="lackner-frontend"

echo -e "${BLUE}🚀 LACKNER® AUFZÜGE - Vereinfachtes Azure Deployment${NC}"
echo "=============================================================="

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

# Function to create resource group
create_resource_group() {
    echo -e "${BLUE}📦 Erstelle Resource Group...${NC}"
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output table
    echo -e "${GREEN}✅ Resource Group erstellt${NC}"
}

# Function to create App Service Plan and Backend
create_backend() {
    echo -e "${BLUE}🔧 Erstelle Backend (Flask App Service)...${NC}"
    
    # Create App Service Plan
    az appservice plan create \
        --name "${BACKEND_NAME}-plan" \
        --resource-group $RESOURCE_GROUP \
        --sku B1 \
        --is-linux \
        --output table
    
    # Create Web App
    az webapp create \
        --name $BACKEND_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan "${BACKEND_NAME}-plan" \
        --runtime "PYTHON|3.11" \
        --output table
    
    # Configure Python version
    az webapp config set \
        --name $BACKEND_NAME \
        --resource-group $RESOURCE_GROUP \
        --linux-fx-version "PYTHON|3.11"
    
    echo -e "${GREEN}✅ Backend erstellt${NC}"
}

# Function to create Frontend App Service
create_frontend() {
    echo -e "${BLUE}🌐 Erstelle Frontend (App Service)...${NC}"
    
    az appservice plan create \
        --name "${FRONTEND_NAME}-plan" \
        --resource-group $RESOURCE_GROUP \
        --sku F1 \
        --is-linux \
        --output table
    
    az webapp create \
        --name $FRONTEND_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan "${FRONTEND_NAME}-plan" \
        --runtime "NODE|18-lts" \
        --output table
    
    echo -e "${GREEN}✅ Frontend erstellt${NC}"
}

# Function to configure environment variables
configure_environment() {
    echo -e "${BLUE}⚙️  Konfiguriere Environment Variables...${NC}"
    
    # Backend Environment Variables (SQLite)
    az webapp config appsettings set \
        --name $BACKEND_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            FLASK_ENV=production \
            DATABASE_URL="sqlite:///zeiterfassung.db" \
            AZURE_CLIENT_ID="your-azure-ad-app-id" \
            AZURE_CLIENT_SECRET="your-azure-ad-secret" \
            AZURE_TENANT_ID="your-tenant-id" \
            SECRET_KEY="$(openssl rand -hex 32)" \
            CORS_ORIGINS="https://${FRONTEND_NAME}.azurewebsites.net"
    
    # Frontend Environment Variables
    az webapp config appsettings set \
        --name $FRONTEND_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            NEXT_PUBLIC_API_URL="https://${BACKEND_NAME}.azurewebsites.net" \
            NEXT_PUBLIC_AZURE_CLIENT_ID="your-azure-ad-app-id" \
            NEXT_PUBLIC_AZURE_TENANT_ID="your-tenant-id"
    
    echo -e "${GREEN}✅ Environment Variables konfiguriert${NC}"
}

# Function to deploy backend code
deploy_backend() {
    echo -e "${BLUE}📦 Deploye Backend Code...${NC}"
    
    # Create deployment package
    echo "📦 Erstelle Backend Package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    cp -r app.py requirements.txt create_test_data.py "$TEMP_DIR/"
    cp -r instance "$TEMP_DIR/" 2>/dev/null || true
    
    # Create startup command file
    cat > "$TEMP_DIR/startup.txt" << EOF
gunicorn --bind=0.0.0.0 --timeout 600 app:app
EOF
    
    # Create web.config for Azure
    cat > "$TEMP_DIR/web.config" << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="%home%\site\wwwroot\env\Scripts\python.exe" arguments="%home%\site\wwwroot\startup.txt" stdoutLogEnabled="true" stdoutLogFile="%home%\LogFiles\stdout" />
  </system.webServer>
</configuration>
EOF
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r backend.zip . > /dev/null
    cd - > /dev/null
    
    # Deploy to Azure
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $BACKEND_NAME \
        --src "$TEMP_DIR/backend.zip"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Function to deploy frontend code
deploy_frontend() {
    echo -e "${BLUE}📦 Deploye Frontend Code...${NC}"
    
    # Build Next.js
    echo "🔨 Baue Next.js Application..."
    cd frontend
    npm install
    npm run build
    
    # Create deployment package
    TEMP_DIR=$(mktemp -d)
    cp -r .next "$TEMP_DIR/"
    cp -r public "$TEMP_DIR/"
    cp package.json "$TEMP_DIR/"
    
    # Create web.config for Azure
    cat > "$TEMP_DIR/web.config" << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </add>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin" />
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
EOF
    
    # Create server.js for Azure
    cat > "$TEMP_DIR/server.js" << EOF
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`)
    })
})
EOF
    
    # Zip the package
    cd "$TEMP_DIR"
    zip -r frontend.zip . > /dev/null
    cd - > /dev/null
    
    # Deploy to Azure
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $FRONTEND_NAME \
        --src "$TEMP_DIR/frontend.zip"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    cd ..
    
    echo -e "${GREEN}✅ Frontend deployed${NC}"
}

# Function to display deployment info
show_deployment_info() {
    echo -e "${BLUE}📋 Deployment Information:${NC}"
    echo "=================================="
    echo -e "${GREEN}✅ Backend URL:${NC} https://${BACKEND_NAME}.azurewebsites.net"
    echo -e "${GREEN}✅ Frontend URL:${NC} https://${FRONTEND_NAME}.azurewebsites.net"
    echo -e "${GREEN}✅ Database:${NC} SQLite (eingebettet)"
    echo ""
    echo -e "${YELLOW}⚠️  Nächste Schritte:${NC}"
    echo "1. Azure AD App Registration erstellen"
    echo "2. Environment Variables mit echten Werten aktualisieren"
    echo "3. Custom Domain konfigurieren"
    echo "4. SSL Certificates installieren"
    echo "5. Monitoring aktivieren"
    echo ""
    echo -e "${BLUE}📖 Vollständige Anleitung:${NC} AZURE_DEPLOYMENT_GUIDE.md"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Starte vereinfachtes Azure Deployment...${NC}"
    
    # Check if resource group exists
    if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
        create_resource_group
    else
        echo -e "${YELLOW}⚠️  Resource Group existiert bereits${NC}"
    fi
    
    # Create Backend
    create_backend
    
    # Create Frontend
    create_frontend
    
    # Configure Environment
    configure_environment
    
    # Deploy Code
    deploy_backend
    deploy_frontend
    
    # Show Info
    show_deployment_info
    
    echo -e "${GREEN}🎉 Vereinfachtes Deployment erfolgreich abgeschlossen!${NC}"
    echo -e "${YELLOW}💡 Hinweis: SQLite wird verwendet. Für Produktion empfehlen wir Azure SQL Database.${NC}"
}

# Run main function
main "$@" 