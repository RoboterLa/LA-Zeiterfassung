# RBAC (Role-Based Access Control) System

## Übersicht

Das RBAC-System implementiert eine rollenbasierte Zugriffskontrolle mit drei Hauptrollen:

### Rollen

1. **Monteur** (Standard)
   - Basiszugriff für Zeiterfassung
   - Kann eigene Einträge erstellen und bearbeiten
   - Kann Aufträge einsehen

2. **Supervisor**
   - Alle Monteur-Berechtigungen
   - Kann Zeiterfassungen freigeben/ablehnen
   - Kann Berichte einsehen
   - Kann Aufträge bearbeiten

3. **Admin**
   - Vollzugriff auf alle Funktionen
   - Benutzerverwaltung
   - Rollenverwaltung
   - Systemadministration

## Berechtigungen (Permissions)

### Monteur
- `zeiterfassung_view` - Zeiterfassung einsehen
- `zeiterfassung_edit` - Eigene Zeiterfassung bearbeiten
- `auftraege_view` - Aufträge einsehen

### Supervisor
- Alle Monteur-Berechtigungen
- `zeiterfassung_approve` - Zeiterfassungen freigeben
- `auftraege_edit` - Aufträge bearbeiten
- `reports_view` - Berichte einsehen

### Admin
- Alle Berechtigungen
- `user_management` - Benutzer verwalten
- `role_management` - Rollen verwalten
- `system_admin` - Systemadministration

## Implementierung

### Decorators

```python
@requires_role('Admin')           # Nur Admin
@requires_any_role('Supervisor', 'Admin')  # Supervisor oder Admin
@requires_permission('zeiterfassung_approve')  # Spezifische Berechtigung
```

### Utility Functions

```python
get_user_permissions(user_role)    # Berechtigungen abrufen
has_permission(user_role, permission)  # Berechtigung prüfen
can_approve_entries(user_role)     # Freigabe-Berechtigung
can_manage_users(user_role)        # User-Management-Berechtigung
```

## Geschützte Routen

### Nur Admin
- `/admin/users` - Benutzerverwaltung
- `/admin/users/new` - Neuen Benutzer erstellen
- `/admin/users/<id>` - Benutzer bearbeiten
- `/admin/users/<id>/delete` - Benutzer löschen
- `/api/users` - User API
- `/api/users/<id>/role` - Rolle ändern

### Supervisor/Admin
- `/approve_entries` - Zeiterfassungen freigeben
- `/approve_entry/<id>` - Eintrag freigeben
- `/reject_entry/<id>` - Eintrag ablehnen
- `/edit_entry_status/<id>` - Status ändern
- `/comment_entry/<id>` - Kommentar hinzufügen
- `/export` - Daten exportieren
- `/entries` - Alle Einträge anzeigen
- `/arbeitszeit/export` - Arbeitszeit exportieren
- `/api/arbeitszeit-report` - Arbeitszeit-Bericht

### Alle Benutzer
- `/` - Dashboard
- `/zeiterfassung` - Zeiterfassung
- `/meine_auftraege` - Eigene Aufträge
- `/arbeitszeit` - Arbeitszeiterfassung
- `/urlaub` - Urlaubsverwaltung

## Session Management

Die User-Session enthält RBAC-Informationen:

```python
session['user'] = {
    'id': user.id,
    'email': user.email,
    'name': user.name,
    'role': user.role,
    'is_admin': user.is_admin,
    'can_approve': user.can_approve,
    'permissions': get_user_permissions(user.role)
}
```

## Datenbank

### User Model
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    can_approve = db.Column(db.Boolean, default=False)
    azure_id = db.Column(db.String(100), unique=True, nullable=True)
    role = db.Column(db.String(50), default='Monteur')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    permissions = db.Column(db.Text, nullable=True)
```

## Migration

Die Datenbankmigration fügt fehlende Spalten hinzu:

```bash
python3 migrate_db.py
```

## Frontend Integration

Das Frontend sollte die Benutzerrolle berücksichtigen:

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'Monteur' | 'Supervisor' | 'Admin';
  is_admin: boolean;
  can_approve: boolean;
  permissions: string[];
}
```

## Sicherheitshinweise

1. **Session-Validierung**: Alle geschützten Routen prüfen die Session
2. **Rollenprüfung**: Decorators validieren Rollen vor Zugriff
3. **Berechtigungsprüfung**: Spezifische Berechtigungen werden geprüft
4. **CSRF-Schutz**: POST-Routen sollten CSRF-Token verwenden
5. **Input-Validierung**: Alle Eingaben werden validiert

## Erweiterungen

### Neue Rollen hinzufügen
1. Rolle in `ROLES` definieren
2. Berechtigungen festlegen
3. Decorators anpassen
4. Frontend aktualisieren

### Neue Berechtigungen
1. Berechtigung in `ROLES` hinzufügen
2. `@requires_permission` verwenden
3. Frontend-Logik anpassen

## Troubleshooting

### Häufige Probleme

1. **Session verloren**: User wird zu Login weitergeleitet
2. **403 Forbidden**: Unzureichende Berechtigungen
3. **Datenbankfehler**: Migration ausführen
4. **Frontend-Fehler**: Session-Status prüfen

### Debugging

```python
# Session prüfen
print(session.get('user'))

# Berechtigungen prüfen
print(get_user_permissions('Admin'))

# Rolle validieren
print(has_permission('Supervisor', 'zeiterfassung_approve'))
``` 