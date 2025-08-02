# Release Pipeline Dokumentation

## Übersicht
- **Pipeline:** GitHub Actions (getrennte Build/Deploy-Jobs)
- **Versionierung:** semantic-release (Conventional Commits erforderlich)
- **Hosting:** Azure App Service, Plan: B1 (kostenpflichtig, ~$54.75/Monat)
- **Deployment:** Nur gebautes Artefakt
- **Error-Handling:** Keine generelle Unterdrückung, nur explizit tolerierte Steps
- **Security:** Service Principal mit minimalen Rechten

## Commit Konventionen
- `feat:` neue Funktion (minor)
- `fix:` Bugfix (patch)
- `feat!:` breaking change (major)
- `docs:` Dokumentation
- `style:` Formatierung
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Wartung

## Pipeline Flow
1. **Build Job:** Frontend bauen, semantic-release, Artefakt erstellen
2. **Deploy Job:** Azure Login, Artefakt extrahieren, Deploy

## Azure Konfiguration
- **Resource Group:** zeiterfassung-rg
- **App Service Plan:** zeiterfassung-plan (B1)
- **Web App:** zeiterfassung-app
- **Runtime:** Python 3.11
- **Port:** 8000

## Troubleshooting

### Keine Version
- **Problem:** Commits passen nicht zu Conventional Format
- **Lösung:** Commits im Format `feat:`, `fix:`, etc. schreiben

### Build-Fehler
- **Problem:** npm ci, Node-Version
- **Lösung:** Node.js 20+ verwenden, package-lock.json committen

### Deploy-Fehler
- **Problem:** AZURE_CREDENTIALS prüfen
- **Lösung:** Service Principal neu erstellen

### Azure App Service Fehler
- **Problem:** 503 Service Unavailable
- **Lösung:** Startup Command prüfen, Logs analysieren

## Monitoring
- **GitHub Actions:** https://github.com/RoboterLa/LA-Zeiterfassung/actions
- **Azure Portal:** https://portal.azure.com
- **App URL:** https://zeiterfassung-app.azurewebsites.net

## Kosten
- **B1 Plan:** ~$54.75/Monat
- **Azure Storage:** ~$0.02/GB/Monat
- **Bandwidth:** ~$0.087/GB

## Security
- **Service Principal:** Minimal Rechte (Contributor auf Resource Group)
- **Secrets:** GitHub Secrets für AZURE_CREDENTIALS
- **HTTPS:** Automatisch aktiviert
- **CORS:** Konfiguriert für Frontend

## Rollback
- **GitHub:** Tag-basiertes Rollback
- **Azure:** Deployment Slots (optional)
- **Database:** SQLite Backup (lokale Datei)

---

**Letzte Aktualisierung:** 2024-01-15
**Pipeline Version:** v1.0 