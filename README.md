# Zeiterfassung System

Ein Flask-basiertes Zeiterfassungssystem mit Microsoft 365 Integration und SQLite-Datenbank.

## Features

- Microsoft 365 OAuth Login
- SQLite-Datenbank für Zeiteinträge, Aufträge und Arbeitszeit
- Dashboard mit Übersicht
- Zeiterfassung mit verschiedenen Aktivitätstypen
- Auftragsverwaltung
- Urlaubsverwaltung
- Genehmigungssystem für Zeiteinträge
- Export-Funktionen

## Installation

1. **Abhängigkeiten installieren:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Umgebungsvariablen setzen (optional):**
   ```bash
   export FLASK_SECRET_KEY="your-secret-key"
   export CLIENT_ID="your-ms365-client-id"
   export CLIENT_SECRET="your-ms365-client-secret"
   ```

3. **Anwendung starten:**
   ```bash
   python app.py
   ```

## MS365 Konfiguration

Die Anwendung ist bereits mit folgenden MS365-Einstellungen konfiguriert:

- **Client ID**: `bce7f739-d799-4c57-8758-7b6b21999678`
- **Redirect URI**: `https://la-zeiterfassung-fyd4cge3d9e3cac4.germanywestcentral-01.azurewebsites.net/auth/callback`
- **Authority**: `https://login.microsoftonline.com/3efb4b34-9ef2-4200-b749-2a501b2aaee6`

## Datenbank

Die Anwendung verwendet eine SQLite-Datenbank (`zeiterfassung.db`) mit folgenden Tabellen:

- **User**: Benutzerinformationen
- **TimeEntry**: Zeiteinträge
- **Auftrag**: Aufträge
- **Arbeitszeit**: Arbeitszeit-Einträge

## Routen

- `/` - Dashboard (erfordert Login)
- `/login` - Login-Seite
- `/login_ms365` - MS365 OAuth-Initiation
- `/auth/callback` - OAuth-Callback
- `/logout` - Logout
- `/zeiterfassung` - Zeiterfassung
- `/approve_entries` - Genehmigung von Einträgen
- `/urlaub` - Urlaubsverwaltung
- `/arbeitszeit` - Arbeitszeit-Verwaltung

## Sicherheit

- Session-basierte Authentifizierung
- MS365 OAuth 2.0 Integration
- Benutzerberechtigungen (Admin, Genehmiger)
- Sichere Token-Verwaltung 