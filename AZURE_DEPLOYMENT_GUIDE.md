# 🚀 Azure Deployment Guide - LACKNER® AUFZÜGE

## **Übersicht**
Deployment der Zeiterfassungs-App auf Azure mit:
- **Frontend**: Next.js auf Azure Static Web Apps
- **Backend**: Flask auf Azure App Service
- **Database**: Azure SQL Database
- **Authentication**: Azure AD (Microsoft 365)

---

## **1. Azure Services Setup**

### **1.1 Azure SQL Database**
```bash
# SQL Database erstellen
az sql server create \
  --name lackner-aufzuege-sql \
  --resource-group lackner-rg \
  --location westeurope \
  --admin-user sqladmin \
  --admin-password "SecurePassword123!"

az sql db create \
  --resource-group lackner-rg \
  --server lackner-aufzuege-sql \
  --name zeiterfassung-db \
  --edition Standard \
  --capacity 10
```

### **1.2 Azure App Service (Backend)**
```bash
# App Service Plan erstellen
az appservice plan create \
  --name lackner-backend-plan \
  --resource-group lackner-rg \
  --sku B1 \
  --is-linux

# Flask App Service erstellen
az webapp create \
  --name lackner-backend \
  --resource-group lackner-rg \
  --plan lackner-backend-plan \
  --runtime "PYTHON|3.11"
```

### **1.3 Azure Static Web Apps (Frontend)**
```bash
# Static Web App erstellen
az staticwebapp create \
  --name lackner-frontend \
  --resource-group lackner-rg \
  --source https://github.com/your-username/zeiterfassung \
  --location westeurope \
  --branch main
```

---

## **2. Environment Configuration**

### **2.1 Backend Environment Variables**
```bash
# App Service Configuration
az webapp config appsettings set \
  --name lackner-backend \
  --resource-group lackner-rg \
  --settings \
    FLASK_ENV=production \
    DATABASE_URL="mssql+pyodbc://sqladmin:SecurePassword123!@lackner-aufzuege-sql.database.windows.net:1433/zeiterfassung-db?driver=ODBC+Driver+17+for+SQL+Server" \
    AZURE_CLIENT_ID="your-azure-ad-app-id" \
    AZURE_CLIENT_SECRET="your-azure-ad-secret" \
    AZURE_TENANT_ID="your-tenant-id" \
    SECRET_KEY="your-secret-key"
```

### **2.2 Frontend Environment Variables**
```bash
# Static Web App Configuration
az staticwebapp appsettings set \
  --name lackner-frontend \
  --resource-group lackner-rg \
  --setting-names \
    NEXT_PUBLIC_API_URL="https://lackner-backend.azurewebsites.net" \
    NEXT_PUBLIC_AZURE_CLIENT_ID="your-azure-ad-app-id" \
    NEXT_PUBLIC_AZURE_TENANT_ID="your-tenant-id"
```

---

## **3. Azure AD (Microsoft 365) Setup**

### **3.1 App Registration**
1. **Azure Portal** → **Azure Active Directory** → **App registrations**
2. **New registration**:
   - **Name**: `Lackner Zeiterfassung`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: `https://lackner-frontend.azurestaticapps.net`

### **3.2 API Permissions**
```
Microsoft Graph:
- User.Read
- User.Read.All
- AppRoleAssignment.Read.All

Azure SQL Database:
- user_impersonation
```

### **3.3 Client Secret**
1. **Certificates & secrets** → **New client secret**
2. **Description**: `Production Secret`
3. **Expires**: `Never`
4. **Copy the value** → Environment Variable

---

## **4. Database Migration**

### **4.1 Connection String**
```python
# app.py - Production Database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///zeiterfassung.db')

# Azure SQL mit ODBC
if 'azure' in DATABASE_URL.lower():
    engine = create_engine(DATABASE_URL, echo=True)
else:
    engine = create_engine(DATABASE_URL)
```

### **4.2 Migration Script**
```bash
# Lokale Migration zu Azure SQL
python3 migrate_to_azure.py
```

---

## **5. Deployment Scripts**

### **5.1 Backend Deployment**
```bash
#!/bin/bash
# deploy_backend.sh

echo "🚀 Deploying Backend to Azure..."

# Build requirements
pip install -r requirements.txt

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --resource-group lackner-rg \
  --name lackner-backend \
  --src backend.zip

echo "✅ Backend deployed!"
```

### **5.2 Frontend Deployment**
```bash
#!/bin/bash
# deploy_frontend.sh

echo "🚀 Deploying Frontend to Azure..."

# Build Next.js
npm run build

# Deploy to Static Web Apps
az staticwebapp deployment create \
  --name lackner-frontend \
  --resource-group lackner-rg \
  --source . \
  --branch main

echo "✅ Frontend deployed!"
```

---

## **6. SSL & Custom Domain**

### **6.1 Custom Domain Setup**
```bash
# Backend Domain
az webapp config hostname add \
  --webapp-name lackner-backend \
  --resource-group lackner-rg \
  --hostname api.lackner-aufzuege.com

# Frontend Domain
az staticwebapp hostname set \
  --name lackner-frontend \
  --resource-group lackner-rg \
  --hostname zeiterfassung.lackner-aufzuege.com
```

### **6.2 SSL Certificate**
```bash
# App Service Managed Certificate
az webapp config ssl bind \
  --certificate-thumbprint "your-cert-thumbprint" \
  --ssl-type SNI \
  --name lackner-backend \
  --resource-group lackner-rg
```

---

## **7. Monitoring & Logging**

### **7.1 Application Insights**
```bash
# App Insights erstellen
az monitor app-insights component create \
  --app lackner-insights \
  --location westeurope \
  --resource-group lackner-rg \
  --application-type web

# Backend verbinden
az webapp config appsettings set \
  --name lackner-backend \
  --resource-group lackner-rg \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
```

### **7.2 Log Analytics**
```bash
# Log Analytics Workspace
az monitor log-analytics workspace create \
  --resource-group lackner-rg \
  --workspace-name lackner-logs
```

---

## **8. Security & Compliance**

### **8.1 Network Security**
```bash
# VNET Integration
az webapp vnet-integration add \
  --name lackner-backend \
  --resource-group lackner-rg \
  --vnet lackner-vnet \
  --subnet backend-subnet
```

### **8.2 Key Vault Integration**
```bash
# Key Vault erstellen
az keyvault create \
  --name lackner-keyvault \
  --resource-group lackner-rg \
  --location westeurope

# Secrets speichern
az keyvault secret set \
  --vault-name lackner-keyvault \
  --name database-password \
  --value "SecurePassword123!"
```

---

## **9. Backup & Disaster Recovery**

### **9.1 Database Backup**
```bash
# Automated Backup
az sql db update \
  --resource-group lackner-rg \
  --server lackner-aufzuege-sql \
  --name zeiterfassung-db \
  --backup-storage-redundancy Geo
```

### **9.2 App Service Backup**
```bash
# Backup Configuration
az webapp config backup create \
  --resource-group lackner-rg \
  --webapp-name lackner-backend \
  --backup-name daily-backup
```

---

## **10. Cost Optimization**

### **10.1 Reserved Instances**
```bash
# App Service Plan Reservierung
az appservice plan update \
  --name lackner-backend-plan \
  --resource-group lackner-rg \
  --sku B1 \
  --reserved true
```

### **10.2 Auto-scaling**
```bash
# Auto-scaling Rules
az monitor autoscale create \
  --resource-group lackner-rg \
  --resource lackner-backend-plan \
  --resource-type Microsoft.Web/serverFarms \
  --name lackner-autoscale
```

---

## **11. Testing & Validation**

### **11.1 Health Checks**
```bash
# Backend Health Check
curl https://lackner-backend.azurewebsites.net/health

# Frontend Health Check
curl https://lackner-frontend.azurestaticapps.net/api/health
```

### **11.2 Load Testing**
```bash
# Apache Bench Test
ab -n 1000 -c 10 https://lackner-backend.azurewebsites.net/api/auth/me
```

---

## **12. Go-Live Checklist**

- [ ] **Azure Resources** erstellt
- [ ] **Database** migriert
- [ ] **Environment Variables** konfiguriert
- [ ] **Azure AD** eingerichtet
- [ ] **SSL Certificates** installiert
- [ ] **Custom Domains** konfiguriert
- [ ] **Monitoring** aktiviert
- [ ] **Backup** konfiguriert
- [ ] **Security** überprüft
- [ ] **Performance** getestet
- [ ] **User Training** durchgeführt

---

## **13. Estimated Costs (Monthly)**

| Service | Tier | Cost |
|---------|------|------|
| Azure SQL Database | Standard S1 | ~$30 |
| App Service | Basic B1 | ~$13 |
| Static Web Apps | Free | $0 |
| Application Insights | Free | $0 |
| **Total** | | **~$43** |

---

## **14. Support & Maintenance**

### **14.1 Monitoring Alerts**
```bash
# CPU Alert
az monitor metrics alert create \
  --name "high-cpu-alert" \
  --resource-group lackner-rg \
  --scopes "/subscriptions/your-subscription/resourceGroups/lackner-rg/providers/Microsoft.Web/sites/lackner-backend" \
  --condition "avg Percentage CPU > 80" \
  --description "High CPU usage detected"
```

### **14.2 Maintenance Windows**
- **Database Maintenance**: Sonntags 02:00-04:00
- **App Updates**: Dienstags 22:00-23:00
- **Security Patches**: Automatisch

---

**🚀 Ready for Azure Deployment!** 