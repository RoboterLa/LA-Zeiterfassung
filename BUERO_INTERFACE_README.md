# Büro-Interface Dokumentation

## Übersicht

Das Büro-Interface ist ein vollständig implementiertes React-Frontend für die Verwaltung von Aufträgen und Stammdaten für Aufzugsanlagen. Es ist speziell für die Rolle "Büro" und "Admin" konzipiert.

## 🚀 Schnellstart

### 1. Backend starten
```bash
python3 run_local.py
```
- Läuft auf: http://localhost:5002
- Dev-Login: http://localhost:5002/dev_login

### 2. Datenbank-Migration ausführen
```bash
python3 migrate_db.py
```

### 3. Frontend starten
```bash
cd frontend
npm run dev
```
- Läuft auf: http://localhost:3000

### 4. Büro-Interface aufrufen
- URL: http://localhost:3000/buero
- Login mit: `buero@lackner-aufzuege.com` (Rolle: Büro)

## 📋 Funktionen

### Dashboard (`/buero`)
- **Schnellübersicht**: Statistiken zu Aufträgen
- **Schnellaktionen**: Neue Aufträge/Anlagen erstellen
- **Letzte Aktivitäten**: Timeline der letzten Aktionen

### Aufträge verwalten (`/buero/orders`)
- **Auftragsliste**: Alle Aufträge in übersichtlicher Tabelle
- **CRUD-Operationen**: Erstellen, Bearbeiten, Stornieren
- **Filterung**: Nach Status, Priorität, Zuweisung
- **Zuweisung**: Monteure zu Aufträgen zuweisen

### Stammdaten verwalten (`/buero/elevators`)
- **Anlagenliste**: Alle Aufzugsanlagen
- **CRUD-Operationen**: Erstellen, Bearbeiten, Löschen
- **Suche**: Nach Hersteller, Adresse, Modell
- **Komponenten**: JSON-basierte Komponentenverwaltung

## 🔐 Sicherheit & RBAC

### Rollen
- **Büro**: Vollzugriff auf Aufträge und Stammdaten
- **Admin**: Zusätzlich User-Management
- **Monteur**: Nur eigene Aufträge sichtbar
- **Supervisor**: Freigaben und Berichte

### API-Schutz
- Alle Endpunkte mit `@requires_any_role('Buero', 'Admin')` geschützt
- Server-seitige Filterung nach User-Rolle
- Session-basierte Authentifizierung

## 📊 Datenmodell

### Order (Aufträge)
```sql
- id (PK)
- type (Reparatur, Modernisierung, Neubau, Wartung)
- description (TEXT)
- assigned_user (Azure AD Email)
- planned_start/end (DATETIME)
- status (Open, In Progress, Completed, Cancelled)
- elevator_id (FK)
- priority (High, Medium, Low)
```

### Elevator (Aufzugsanlagen)
```sql
- id (PK)
- manufacturer (VARCHAR)
- model (VARCHAR)
- type (Passenger, Freight, Hydraulic, Traction)
- installation_date (DATE)
- location_address (VARCHAR)
- components (JSON)
```

## 🛠️ Technische Details

### Backend (Flask)
- **API-Endpunkte**: `/api/orders`, `/api/elevators`
- **Datenbank**: SQLAlchemy mit SQLite
- **Authentifizierung**: Session-basiert
- **RBAC**: Rollen-basierte Zugriffskontrolle

### Frontend (React + TypeScript)
- **Framework**: Next.js 15 mit App Router
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API-Calls**: Fetch API
- **Routing**: Next.js App Router

### Datenbank
- **SQLite**: Für lokale Entwicklung
- **Migration**: Automatische Tabellenerstellung
- **Test-Daten**: Automatisch erstellt

## 🔧 API-Endpunkte

### Aufträge
```
GET    /api/orders          - Liste aller Aufträge
POST   /api/orders          - Neuen Auftrag erstellen
GET    /api/orders/{id}     - Einzelnen Auftrag abrufen
PUT    /api/orders/{id}     - Auftrag bearbeiten
DELETE /api/orders/{id}     - Auftrag stornieren (Soft-Delete)
```

### Aufzugsanlagen
```
GET    /api/elevators       - Liste aller Anlagen
POST   /api/elevators       - Neue Anlage erstellen
GET    /api/elevators/{id}  - Einzelne Anlage abrufen
PUT    /api/elevators/{id}  - Anlage bearbeiten
DELETE /api/elevators/{id}  - Anlage löschen
```

### User-Management
```
GET    /api/users/available - Verfügbare User für Zuweisung
GET    /api/auth/me         - Aktuelle Session prüfen
```

## 🎨 UI/UX Features

### Responsive Design
- **Mobile-first**: Optimiert für Tablets und Smartphones
- **Desktop**: Vollständige Funktionalität
- **Touch-friendly**: Große Buttons und Touch-Targets

### Benutzerfreundlichkeit
- **Loading States**: Spinner während API-Calls
- **Error Handling**: Benutzerfreundliche Fehlermeldungen
- **Confirmation Dialogs**: Bestätigung für kritische Aktionen
- **Search & Filter**: Schnelle Suche in Tabellen

### Visual Feedback
- **Status-Badges**: Farbkodierte Status-Anzeigen
- **Priority Indicators**: Farbkodierte Prioritäten
- **Hover Effects**: Interaktive Elemente
- **Toast Messages**: Erfolgs-/Fehlermeldungen

## 🧪 Test-Daten

### Test-User
- `admin@lackner-aufzuege.com` (Admin)
- `buero@lackner-aufzuege.com` (Büro)
- `supervisor@lackner-aufzuege.com` (Supervisor)
- `monteur@lackner-aufzuege.com` (Monteur)

### Test-Aufzugsanlagen
- Schindler 5500 (Passenger)
- Kone MonoSpace (Passenger)
- Otis Gen2 (Freight)

### Test-Aufträge
- Wartung (Medium Priority)
- Reparatur (High Priority)
- Modernisierung (High Priority)

## 🚀 Deployment

### Lokale Entwicklung
1. Backend: `python3 run_local.py`
2. Frontend: `cd frontend && npm run dev`
3. Migration: `python3 migrate_db.py`

### Produktion
1. **Backend**: Flask-App auf Azure App Service
2. **Frontend**: Next.js auf Azure Static Web Apps
3. **Datenbank**: Azure SQL Database
4. **Authentifizierung**: Azure AD Integration

## 🔄 Workflow

### Auftragserstellung
1. **Büro** erstellt neuen Auftrag
2. **Zuweisung** an Monteur
3. **Monteur** sieht Auftrag in seiner Liste
4. **Zeiterfassung** wird verknüpft
5. **Status-Updates** durch Monteur/Büro

### Stammdaten-Pflege
1. **Büro** legt neue Aufzugsanlage an
2. **Komponenten** werden dokumentiert
3. **Aufträge** können verknüpft werden
4. **Wartungshistorie** wird erstellt

## 📈 Erweiterte Features

### Geplante Erweiterungen
- **Push-Benachrichtigungen**: Web Push API
- **Offline-Support**: Service Worker
- **PDF-Export**: Auftragsberichte
- **Kalender-Integration**: Outlook/Google Calendar
- **Mobile App**: React Native

### Integration
- **Microsoft Graph API**: User-Management
- **Azure AD**: Single Sign-On
- **Power BI**: Berichte und Analytics
- **Teams**: Benachrichtigungen

## 🛡️ Sicherheitsaspekte

### DSGVO-Compliance
- **Audit-Logs**: Alle Änderungen protokolliert
- **Datenlöschung**: Automatische Löschung nach Frist
- **Zugriffskontrolle**: Rollen-basierte Berechtigungen

### Datenschutz
- **HTTPS**: Verschlüsselte Kommunikation
- **Session-Management**: Sichere Session-Handling
- **Input-Validation**: Server-seitige Validierung

## 📞 Support

### Entwicklung
- **Backend**: Flask + SQLAlchemy
- **Frontend**: React + TypeScript + Tailwind
- **Datenbank**: SQLite (Dev) / Azure SQL (Prod)

### Dokumentation
- **API-Docs**: Swagger/OpenAPI
- **Code-Docs**: TypeScript Interfaces
- **User-Guide**: Schritt-für-Schritt Anleitung

---

**Status**: ✅ Vollständig implementiert und getestet
**Version**: 1.0.0
**Letzte Aktualisierung**: Juli 2025 