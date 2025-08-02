# 📚 API-Dokumentation - Zeiterfassung System

## Übersicht

Die Zeiterfassung-API ist eine RESTful API, die auf Flask basiert und JWT für die Authentifizierung verwendet.

**Base URL:** `https://zeiterfassung-app.azurewebsites.net/api`

## 🔐 Authentifizierung

Alle API-Endpoints (außer `/auth/login`) erfordern einen gültigen JWT-Token im Authorization-Header.

```http
Authorization: Bearer <jwt-token>
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "monteur1",
  "password": "Demo123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "monteur1",
    "name": "Max Mustermann",
    "email": "max.mustermann@example.com",
    "role": "monteur",
    "vacation_days_remaining": 25,
    "weekly_hours": 40
  }
}
```

### Me (Current User)

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "monteur1",
    "name": "Max Mustermann",
    "email": "max.mustermann@example.com",
    "role": "monteur",
    "vacation_days_remaining": 25,
    "weekly_hours": 40,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## ⏰ Zeiterfassung

### Einstempeln

```http
POST /api/timeclock/clock-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Arbeitsbeginn"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Erfolgreich eingestempelt",
  "time_record": {
    "id": 123,
    "user_id": 1,
    "clock_in": "2024-01-15T08:00:00Z",
    "clock_out": null,
    "total_break_minutes": 0,
    "status": "active",
    "notes": "Arbeitsbeginn"
  }
}
```

### Ausstempeln

```http
POST /api/timeclock/clock-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Arbeitsende"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Erfolgreich ausgestempelt",
  "time_record": {
    "id": 123,
    "user_id": 1,
    "clock_in": "2024-01-15T08:00:00Z",
    "clock_out": "2024-01-15T17:00:00Z",
    "total_break_minutes": 45,
    "status": "completed",
    "notes": "Arbeitsende",
    "total_hours": 8.25
  }
}
```

### Status abfragen

```http
GET /api/timeclock/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "is_clocked_in": true,
  "current_record": {
    "id": 123,
    "clock_in": "2024-01-15T08:00:00Z",
    "total_break_minutes": 30,
    "current_duration": "06:30:00"
  },
  "warnings": []
}
```

### Pause starten

```http
POST /api/timeclock/break/start
Authorization: Bearer <token>
```

### Pause beenden

```http
POST /api/timeclock/break/end
Authorization: Bearer <token>
```

### Heutige Einträge

```http
GET /api/timeclock/today
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "id": 123,
      "clock_in": "2024-01-15T08:00:00Z",
      "clock_out": "2024-01-15T17:00:00Z",
      "total_break_minutes": 45,
      "total_hours": 8.25,
      "status": "completed"
    }
  ],
  "total_hours": 8.25,
  "warnings": []
}
```

## 📊 Tagesberichte

### Bericht erstellen

```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "job_site_id": 1,
  "task_type": "wartung",
  "units": 2,
  "emergency_service": false,
  "notes": "Routine-Wartung durchgeführt"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tagesbericht erfolgreich erstellt",
  "report": {
    "id": 456,
    "user_id": 1,
    "date": "2024-01-15",
    "job_site_id": 1,
    "task_type": "wartung",
    "units": 2,
    "factor": 1.0,
    "emergency_service": false,
    "notes": "Routine-Wartung durchgeführt",
    "status": "draft",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Bericht einreichen

```http
POST /api/reports/456/submit
Authorization: Bearer <token>
```

### Berichte abrufen

```http
GET /api/reports?user_id=1&status=submitted&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": 456,
      "user_id": 1,
      "date": "2024-01-15",
      "job_site": {
        "id": 1,
        "name": "Hauptbahnhof",
        "address": "Bahnhofstraße 1, 12345 Stadt"
      },
      "task_type": "wartung",
      "units": 2,
      "factor": 1.0,
      "emergency_service": false,
      "notes": "Routine-Wartung durchgeführt",
      "status": "submitted",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Bericht genehmigen (Meister/Admin)

```http
POST /api/reports/456/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Bericht genehmigt"
}
```

### Bericht ablehnen (Meister/Admin)

```http
POST /api/reports/456/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Unvollständige Angaben"
}
```

## 🏖️ Abwesenheitsverwaltung

### Antrag erstellen

```http
POST /api/absences
Authorization: Bearer <token>
Content-Type: application/json

{
  "absence_type": "urlaub",
  "start_date": "2024-08-15",
  "end_date": "2024-08-22",
  "reason": "Sommerurlaub"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Abwesenheitsantrag erfolgreich erstellt",
  "absence_request": {
    "id": 789,
    "user_id": 1,
    "absence_type": "urlaub",
    "start_date": "2024-08-15",
    "end_date": "2024-08-22",
    "reason": "Sommerurlaub",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Anträge abrufen

```http
GET /api/absences?user_id=1&status=pending&absence_type=urlaub
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "absence_requests": [
    {
      "id": 789,
      "user_id": 1,
      "absence_type": "urlaub",
      "start_date": "2024-08-15",
      "end_date": "2024-08-22",
      "reason": "Sommerurlaub",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Antrag genehmigen (Meister/Admin)

```http
POST /api/absences/789/approve
Authorization: Bearer <token>
```

### Antrag ablehnen (Meister/Admin)

```http
POST /api/absences/789/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Urlaubskontingent erschöpft"
}
```

## 📍 Job Sites

### Sites abrufen

```http
GET /api/sites?active=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "sites": [
    {
      "id": 1,
      "name": "Hauptbahnhof",
      "address": "Bahnhofstraße 1, 12345 Stadt",
      "region": "Nord",
      "priority": "high",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Site Details

```http
GET /api/sites/1
Authorization: Bearer <token>
```

### Site erstellen (Admin/Meister)

```http
POST /api/sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Neuer Standort",
  "address": "Musterstraße 123, 12345 Stadt",
  "region": "Süd",
  "priority": "medium"
}
```

### Site aktualisieren (Admin/Meister)

```http
PUT /api/sites/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Aktualisierter Standort",
  "priority": "high"
}
```

### Site löschen (Admin)

```http
DELETE /api/sites/1
Authorization: Bearer <token>
```

## 📈 Dashboard

### Statistiken

```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "daily_hours": 8.25,
    "weekly_hours": 42.5,
    "monthly_hours": 168.0,
    "overtime_hours": 2.5,
    "pending_reports": 3,
    "pending_absences": 1,
    "vacation_days_remaining": 25
  }
}
```

### Ausstehende Genehmigungen (Meister/Admin)

```http
GET /api/dashboard/pending-approvals
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "pending_reports": [
    {
      "id": 456,
      "user": {
        "id": 1,
        "name": "Max Mustermann"
      },
      "date": "2024-01-15",
      "task_type": "wartung",
      "submitted_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pending_absences": [
    {
      "id": 789,
      "user": {
        "id": 2,
        "name": "Anna Schmidt"
      },
      "absence_type": "urlaub",
      "start_date": "2024-08-15",
      "end_date": "2024-08-22",
      "submitted_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Team-Status (Meister/Admin)

```http
GET /api/dashboard/team-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "team_members": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "is_clocked_in": true,
      "clock_in_time": "2024-01-15T08:00:00Z",
      "daily_hours": 6.5,
      "status": "active"
    },
    {
      "id": 2,
      "name": "Anna Schmidt",
      "is_clocked_in": false,
      "daily_hours": 0,
      "status": "offline"
    }
  ]
}
```

## 👥 Benutzerverwaltung (Admin)

### Benutzer abrufen

```http
GET /api/auth/users
Authorization: Bearer <token>
```

### Benutzer erstellen

```http
POST /api/auth/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "neuer_monteur",
  "name": "Neuer Monteur",
  "email": "neuer.monteur@example.com",
  "password": "SicheresPasswort123!",
  "role": "monteur",
  "vacation_days_remaining": 25,
  "weekly_hours": 40
}
```

### Benutzer aktualisieren

```http
PUT /api/auth/users/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Aktualisierter Name",
  "role": "meister",
  "vacation_days_remaining": 30
}
```

### Passwort ändern

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "AltesPasswort123!",
  "new_password": "NeuesPasswort456!"
}
```

## 📊 Export

### Zeiterfassung exportieren

```http
GET /api/export/time-records?user_id=1&date_from=2024-01-01&date_to=2024-01-31&format=csv
Authorization: Bearer <token>
```

### Berichte exportieren

```http
GET /api/export/reports?status=approved&date_from=2024-01-01&date_to=2024-01-31&format=excel
Authorization: Bearer <token>
```

### Abwesenheiten exportieren

```http
GET /api/export/absences?absence_type=urlaub&year=2024&format=pdf
Authorization: Bearer <token>
```

## 🔍 Fehlerbehandlung

### Standard-Fehler-Response

```json
{
  "success": false,
  "error": "error_code",
  "message": "Beschreibung des Fehlers",
  "details": {}
}
```

### Häufige Fehlercodes

| Code | HTTP Status | Beschreibung |
|------|-------------|--------------|
| `AUTH_REQUIRED` | 401 | Authentifizierung erforderlich |
| `INVALID_TOKEN` | 401 | Ungültiger oder abgelaufener Token |
| `INSUFFICIENT_PERMISSIONS` | 403 | Unzureichende Berechtigungen |
| `RESOURCE_NOT_FOUND` | 404 | Ressource nicht gefunden |
| `VALIDATION_ERROR` | 400 | Validierungsfehler |
| `ALREADY_CLOCKED_IN` | 409 | Bereits eingestempelt |
| `NOT_CLOCKED_IN` | 409 | Nicht eingestempelt |
| `INSUFFICIENT_VACATION_DAYS` | 400 | Unzureichende Urlaubstage |

### Beispiel-Fehler

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Ungültige Eingabedaten",
  "details": {
    "field": "email",
    "issue": "Ungültiges E-Mail-Format"
  }
}
```

## 📝 Pagination

Endpoints, die Listen zurückgeben, unterstützen Pagination:

```http
GET /api/reports?page=1&per_page=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🔄 Rate Limiting

Die API implementiert Rate Limiting:

- **Standard:** 100 Requests pro Minute
- **Login:** 5 Versuche pro Minute
- **Export:** 10 Requests pro Stunde

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## 📋 Filterung & Sortierung

### Filter-Parameter

```http
GET /api/reports?status=submitted&user_id=1&date_from=2024-01-01&date_to=2024-01-31
```

### Sortierung

```http
GET /api/reports?sort=date&order=desc
```

### Suchparameter

```http
GET /api/sites?search=bahnhof&region=nord
```

## 🔐 Sicherheit

### CORS

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Content Security Policy

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### HTTPS

Alle Produktions-Endpoints sind über HTTPS verfügbar und erzwingen sichere Verbindungen.

---

**API Version:** v1.0  
**Letzte Aktualisierung:** 2024-01-15 