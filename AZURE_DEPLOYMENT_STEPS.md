# 🚀 AZURE DEPLOYMENT - SCHRITT FÜR SCHRITT

## 📦 **Package bereit: `deploy_azure_working.zip`**

### **Schritt 1: Azure Portal öffnen**
1. Gehe zu https://portal.azure.com
2. Melde dich mit deinem Azure-Account an

### **Schritt 2: App Service erstellen**
1. Klicke auf **"Create a resource"**
2. Suche nach **"App Service"**
3. Klicke auf **"Create"**

### **Schritt 3: App Service konfigurieren**
- **Resource Group:** Wähle bestehende oder erstelle neue
- **Name:** `la-zeiterfassung`
- **Publish:** Code
- **Runtime stack:** Python 3.11
- **Operating System:** Linux
- **Region:** West Europe (oder deine bevorzugte Region)
- **App Service Plan:** 
  - **Name:** `zeiterfassung-plan`
  - **Sku and size:** B1 (Basic)

### **Schritt 4: Deployment**
1. Warte bis der App Service erstellt ist
2. Gehe zu deinem App Service
3. Klicke auf **"Deployment Center"**
4. Wähle **"ZIP Deploy"**
5. Lade **`deploy_azure_working.zip`** hoch
6. Klicke auf **"Deploy"**

### **Schritt 5: Environment Variables setzen**
1. Gehe zu **"Configuration"**
2. Klicke auf **"Application settings"**
3. Füge hinzu:
   - **Name:** `FLASK_ENV` | **Value:** `production`
   - **Name:** `FLASK_SECRET_KEY` | **Value:** `azure_production_secret_key_2024`
4. Klicke auf **"Save"**

### **Schritt 6: Testen**
Nach dem Deployment:
- **Frontend:** https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/
- **API:** https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/
- **Health:** https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health

### **Test-Accounts:**
- **Monteur:** `monteur@test.com` / `test123`
- **Admin:** `admin@test.com` / `test123`

## 🎯 **Das war's!**

Das Zeiterfassung System ist dann live auf Azure verfügbar. 