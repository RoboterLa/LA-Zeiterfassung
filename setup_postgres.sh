#!/bin/bash
set -e  # Exit on error
set -x  # Show commands for debugging

# Variables (from your command, with unique suffixes to avoid conflicts)
RESOURCE_GROUP="zeiterfassung-rg"
LOCATION="northeurope"
DB_SERVER_NAME="zeiterfassung-postgres-$(date +%s)"  # Unique with timestamp
DB_NAME="zeiterfassung"
ADMIN_USER="postgresadmin"
ADMIN_PASSWORD="Zeiterfassung2025!"
APP_PLAN="zeiterfassung-plan"
APP_NAME="zeiterfassung-app-$(date +%s)"  # Unique with timestamp

# Step 0: Validate Azure CLI setup
echo "Checking Azure CLI installation and version..."
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Install it with 'curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash' (Linux) or 'winget install -e --id Microsoft.AzureCLI' (Windows)."
    exit 1
fi
az --version | grep "azure-cli" | grep -q "2.67.0" || echo "Warning: Azure CLI version should be at least 2.67.0. Update with 'az upgrade'."

# Check if logged in
echo "Checking Azure login status..."
az account show &> /dev/null || { echo "Error: Please log in with 'az login'."; exit 1; }

# Step 1: Create resource group (idempotent)
echo "Creating or verifying resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none || { echo "Error: Failed to create resource group."; exit 1; }

# Step 2: Create PostgreSQL Flexible Server (direct creation, no check to avoid hanging)
echo "Creating PostgreSQL server..."
az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --location "$LOCATION" \
    --admin-user "$ADMIN_USER" \
    --admin-password "$ADMIN_PASSWORD" \
    --database-name "$DB_NAME" \
    --public-access 0.0.0.0 \
    --tier Burstable --sku-name Standard_B1ms --storage-size 32 \
    --backup-retention 7 --high-availability Disabled \
    --output none --verbose || { echo "Error: Failed to create PostgreSQL server. Check if DB_SERVER_NAME is unique or if the subscription supports Burstable tier in $LOCATION."; exit 1; }

# Step 2.1: Test database connection
echo "Testing database connection..."
DB_HOST="$DB_SERVER_NAME.postgres.database.azure.com"
DATABASE_URL="postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null && echo "Database connection successful." || { echo "Error: Database connection failed. Check credentials or network."; exit 1; }
else
    echo "psql not installed. Skipping connection test (install PostgreSQL client for testing)."
fi

# Step 3: App Service Plan (skip if exists, we have B1)
echo "Checking App Service Plan..."
az appservice plan show --resource-group "$RESOURCE_GROUP" --name "$APP_PLAN" &> /dev/null || {
    echo "App Service Plan does not exist, creating B1 plan..."
    az appservice plan create --resource-group "$RESOURCE_GROUP" --name "$APP_PLAN" \
        --is-linux --sku B1 --location "$LOCATION" --output none || { echo "Error: Failed to create App Service Plan."; exit 1; }
}

# Step 4: Web App (skip if exists)
echo "Checking Web App..."
az webapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" &> /dev/null || {
    echo "Web App does not exist, creating..."
    az webapp create --resource-group "$RESOURCE_GROUP" --plan "$APP_PLAN" \
        --name "$APP_NAME" --runtime "python|3.11" --output none || { echo "Error: Failed to create Web App."; exit 1; }
}

# Step 5: Configure App Settings
echo "Setting App Settings..."
az webapp config appsettings set --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" \
    --settings DATABASE_URL="$DATABASE_URL" SCM_DO_BUILD_DURING_DEPLOYMENT=true --output none || { echo "Error: Failed to set App Settings."; exit 1; }

# Step 6: Configure Startup Command
echo "Setting Startup Command..."
az webapp config set --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" \
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 app_postgres:app" --output none || { echo "Error: Failed to set Startup Command."; exit 1; }

echo "Setup completed successfully!"
echo "Database URL: $DATABASE_URL"
echo "Web App URL: https://$APP_NAME.azurewebsites.net"
echo "Next step: Deploy your Flask app with the PostgreSQL database." 