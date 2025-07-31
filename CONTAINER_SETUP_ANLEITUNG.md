# 🐳 Container Deployment Setup - Anleitung für Cursor

## 📋 **Übersicht**

Dieses Setup umgeht die aktuellen ZIP-Deployment-Probleme durch Container-Deployment mit Azure Container Registry (ACR) und GitHub Actions.

## 🚀 **Option 1: GitHub Actions (Empfohlen)**

### **Schritt 1: GitHub Secrets einrichten**

In eurem GitHub-Repository unter **Settings > Secrets > Actions** anlegen:

#### **AZURE_CREDENTIALS**
```bash
# Einmalig ausführen:
az ad sp create-for-rbac --name "github-deploy-sp" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/la-zeiterfassung-rg \
  --sdk-auth
```
Die ausgegebene JSON direkt als Wert von `AZURE_CREDENTIALS` speichern.

#### **ACR_LOGIN_SERVER**
```
zeiterfassungacr.azurecr.io
```

#### **ACR_USERNAME und ACR_PASSWORD**
```bash
# ACR Admin-User aktivieren:
az acr update -n zeiterfassungacr --admin-enabled true

# Credentials holen:
az acr credential show -n zeiterfassungacr
```

### **Schritt 2: ACR erstellen (falls nicht vorhanden)**
```bash
az acr create \
  --resource-group la-zeiterfassung-rg \
  --name zeiterfassungacr \
  --sku Basic \
  --admin-enabled true
```

### **Schritt 3: Web App für Container konfigurieren**
```bash
az webapp config container set \
  --resource-group la-zeiterfassung-rg \
  --name la-zeiterfassung-fyd4cge3d9e3cac4 \
  --docker-registry-server-url https://zeiterfassungacr.azurecr.io \
  --docker-registry-server-user <ACR_USERNAME> \
  --docker-registry-server-password <ACR_PASSWORD>
```

### **Schritt 4: Push to GitHub**
```bash
git add .
git commit -m "Add container deployment setup"
git push origin main
```

## 🔧 **Option 2: Manueller Fallback**

### **Schritt 1: ACR erstellen**
```bash
az acr create \
  --resource-group la-zeiterfassung-rg \
  --name zeiterfassungacr \
  --sku Basic \
  --admin-enabled true
```

### **Schritt 2: Manuelles Deployment**
```bash
./deploy_container_manual.sh
```

## 📊 **Kontrollpunkte**

### **Was Cursor berichten muss:**

- [ ] **ACR erstellt:** `zeiterfassungacr.azurecr.io`
- [ ] **GitHub Secrets gesetzt:** `AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`
- [ ] **Web App konfiguriert:** Container-Deployment aktiviert
- [ ] **Docker Image gebaut:** Tag und Größe
- [ ] **Deployment erfolgreich:** Container startet, `/health` OK, `/` liefert Inhalt
- [ ] **Logs sauber:** Keine Boot-Errors

### **Test-Commands:**
```bash
# Health Check
curl https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health

# Frontend
curl -I https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/

# Logs
az webapp log tail --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4
```

## 🔍 **Troubleshooting**

### **Container startet nicht:**
```bash
# Logs prüfen
az webapp log tail --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4

# Container-Konfiguration prüfen
az webapp config container show --resource-group la-zeiterfassung-rg --name la-zeiterfassung-fyd4cge3d9e3cac4
```

### **ACR-Login-Probleme:**
```bash
# Credentials neu holen
az acr credential show -n zeiterfassungacr

# Login testen
az acr login -n zeiterfassungacr
```

### **GitHub Actions Fehler:**
- Secrets prüfen (alle 4 müssen gesetzt sein)
- Service Principal Rechte prüfen
- ACR Admin-User aktiviert?

## 🎯 **Vorteile dieser Lösung:**

1. **✅ Umgeht ZIP-Probleme:** Keine statischen File-Konfiguration nötig
2. **✅ Automatisiert:** GitHub Actions bei jedem Push
3. **✅ Reproduzierbar:** Dockerfile definiert exakte Umgebung
4. **✅ Skalierbar:** Einfach auf andere Umgebungen übertragbar
5. **✅ Debuggbar:** Container-Logs sind detaillierter

## 📝 **Nächste Schritte:**

1. **Cursor muss ACR erstellen** (falls nicht vorhanden)
2. **GitHub Secrets setzen** (alle 4)
3. **Web App für Container konfigurieren**
4. **Test-Deployment durchführen**
5. **Logs und Funktionalität prüfen**

---

**Status:** 🚀 **Einsatzbereit** - Alle Dateien erstellt, Anleitung vollständig 