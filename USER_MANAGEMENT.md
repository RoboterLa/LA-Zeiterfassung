# Benutzerverwaltung und Rollenbasierte Zugriffssteuerung (RBAC)

## Übersicht

Die Anwendung implementiert ein vollständiges Benutzerverwaltungssystem mit rollenbasierter Zugriffssteuerung (RBAC). Das System ist für die Integration mit Azure AD vorbereitet, funktioniert aber auch lokal für Entwicklung und Testing.

## Rollen-System

### Verfügbare Rollen

1. **Monteur**
   - **Beschreibung:** Basiszugriff für Monteure
   - **Berechtigungen:**
     - `zeiterfassung_view` - Zeiterfassung anzeigen
     - `zeiterfassung_edit` - Zeiterfassung bearbeiten
     - `auftraege_view` - Aufträge anzeigen

2. **Supervisor**
   - **Beschreibung:** Freigaben für Zeiterfassung und Überwachung
   - **Berechtigungen:** Alle Monteur-Berechtigungen plus:
     - `zeiterfassung_approve` - Zeiterfassung freigeben
     - `auftraege_edit` - Aufträge bearbeiten
     - `reports_view` - Berichte anzeigen

3. **Admin**
   - **Beschreibung:** Vollzugriff, inkl. Rollenverwaltung
   - **Berechtigungen:** Alle Supervisor-Berechtigungen plus:
     - `user_management` - Benutzer verwalten
     - `role_management` - Rollen verwalten
     - `system_admin` - System-Administration

## Datenbank-Schema

### User-Tabelle

```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    azure_id VARCHAR(100) UNIQUE,  -- Azure AD Object ID
    role VARCHAR(50) DEFAULT 'Monteur',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    permissions TEXT  -- JSON für spezielle Berechtigungen
);
```

## Backend-Implementierung

### Decorators für Zugriffskontrolle

```python
# Rollen-basierte Zugriffskontrolle
@requires_role('Admin')
def admin_panel():
    return "Admin Panel"

# Berechtigungs-basierte Zugriffskontrolle
@requires_permission('zeiterfassung_approve')
def approve_time_entry():
    return "Zeiterfassung freigeben"
```

### User Management Funktionen

```python
# Benutzer erstellen
create_user(email, name, role='Monteur', azure_id=None)

# Benutzer-Rolle aktualisieren
update_user_role(user_id, new_role)

# Benutzer nach E-Mail finden
get_user_by_email(email)

# Benutzer nach Azure ID finden
get_user_by_azure_id(azure_id)
```

## Frontend-Implementierung

### React-Komponenten

- **Admin Users Page:** `/admin/users` - Benutzerverwaltung
- **User Edit Modal:** Inline-Bearbeitung von Benutzerdaten
- **Role Management:** Dropdown für Rollenzuweisung

### API-Endpunkte

```typescript
// Benutzer abrufen
GET /api/users

// Benutzer-Rolle aktualisieren
PUT /api/users/{user_id}/role

// Benutzer löschen
POST /admin/users/{user_id}/delete

// Neuen Benutzer erstellen
POST /admin/users/new
```

## Azure AD Integration (Zukunft)

### Vorbereitung für Azure AD

1. **App Registration in Azure Portal**
   - Name: "ZeiterfassungApp"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `http://localhost:5001/getAToken` (Dev)

2. **App Roles definieren**
   - Monteur, Supervisor, Admin
   - Optional: Feingranulare Berechtigungen

3. **MSAL Integration**
   ```python
   import msal
   
   # MSAL Client Setup
   msal_client = msal.ConfidentialClientApplication(
       CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
   )
   ```

### Login-Flow

```python
def handle_azure_login(azure_user_info):
    """Behandelt Azure AD Login und erstellt/aktualisiert lokale User"""
    azure_id = azure_user_info.get('oid')
    email = azure_user_info.get('email')
    name = azure_user_info.get('name')
    
    # Suche nach Azure ID oder Email
    user = get_user_by_azure_id(azure_id) or get_user_by_email(email)
    
    if not user:
        # Erstelle neuen User mit Standard-Rolle
        user = create_user(email, name, 'Monteur', azure_id)
    
    # Session setzen
    session['user'] = {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'is_admin': user.is_admin,
        'can_approve': user.can_approve,
        'azure_id': user.azure_id
    }
    
    return user
```

## Lokales Testing

### Dev-Login

Für lokales Testing steht ein Dev-Login zur Verfügung:

```
http://localhost:5001/dev_login
```

Dies erstellt automatisch Test-Benutzer:
- **Admin:** admin@lackner-aufzuege.com
- **Supervisor:** supervisor@lackner-aufzuege.com  
- **Monteur:** monteur@lackner-aufzuege.com

### Test-Benutzer

```python
test_users = [
    ('monteur@lackner-aufzuege.com', 'Max Monteur', 'Monteur'),
    ('supervisor@lackner-aufzuege.com', 'Anna Supervisor', 'Supervisor'),
    ('admin@lackner-aufzuege.com', 'System Administrator', 'Admin')
]
```

## Sicherheitsaspekte

### Zugriffskontrolle

1. **Session-basierte Authentifizierung**
2. **Rollen-basierte Autorisierung**
3. **Berechtigungs-basierte Feinsteuerung**
4. **Selbstlöschung verhindert**

### Best Practices

1. **Principle of Least Privilege:** Benutzer erhalten nur notwendige Berechtigungen
2. **Role-based Access Control:** Rollen statt individueller Berechtigungen
3. **Audit Trail:** Login-Zeiten und Änderungen protokolliert
4. **Secure Session Management:** Sichere Session-Handhabung

## Deployment

### Umgebungsvariablen

```bash
# Azure AD Configuration (für Produktion)
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret

# App Configuration
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

### Datenbank-Migration

```bash
# SQLite (Entwicklung)
flask db upgrade

# PostgreSQL (Produktion)
alembic upgrade head
```

## Monitoring und Logging

### Logging

```python
import logging

# User-Aktivitäten loggen
app.logger.info(f"User {user.email} logged in with role {user.role}")
app.logger.warning(f"Unauthorized access attempt to {request.endpoint}")
```

### Monitoring

- **Login-Aktivitäten:** Erfolgreiche/fehlgeschlagene Logins
- **Berechtigungsverletzungen:** 403-Fehler protokollieren
- **Benutzer-Aktionen:** Wichtige Aktionen tracken

## Troubleshooting

### Häufige Probleme

1. **403 Forbidden:** Benutzer hat keine ausreichenden Berechtigungen
2. **Session verloren:** Benutzer muss sich neu anmelden
3. **Rolle nicht gefunden:** Datenbank-Synchronisation prüfen

### Debug-Modus

```python
# Debug-Informationen aktivieren
app.config['DEBUG'] = True
app.logger.setLevel(logging.DEBUG)
```

## Erweiterungen

### Zukünftige Features

1. **Gruppen-Management:** Azure AD Groups Integration
2. **Feingranulare Berechtigungen:** Individuelle Berechtigungen pro Benutzer
3. **Audit-Log:** Detaillierte Protokollierung aller Aktionen
4. **Multi-Tenant:** Unterstützung für mehrere Organisationen
5. **SSO:** Single Sign-On mit anderen Systemen

### API-Erweiterungen

```python
# Benutzer-Gruppen verwalten
@app.route('/api/groups', methods=['GET', 'POST'])
@requires_role('Admin')
def manage_groups():
    pass

# Berechtigungen direkt verwalten
@app.route('/api/users/<int:user_id>/permissions', methods=['PUT'])
@requires_role('Admin')
def update_user_permissions(user_id):
    pass
``` 