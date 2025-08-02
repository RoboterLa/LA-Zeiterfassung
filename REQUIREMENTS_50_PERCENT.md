# Requirements-Kurzfassung – Monteur-Web-App für Aufzugsfirma mit Azure Deployment

## 1. Ziel

Webbasierte Anwendung zur rechtskonformen **Zeiterfassung**, **Prämienlohnerfassung**, **Abwesenheitsverwaltung** und **Auftragssteuerung** für Monteure im Außendienst sowie Büro-/Verwaltungsmitarbeitende. Zwei Frontends: mobil für Monteure, Desktop für Büro/Meister/Admin. Deployment in Azure mit klarer Trennung von Frontend/Backend.

---

## 2. Rollen & Berechtigungen

* **Monteur**: Stempeln (Ein/Aus), Tagesberichte (Leistungseinträge), Urlaubs-/Krankheitsanträge, Einsicht eigener Zeiten, Warnungen (über 8h/10h), Auftragsliste + Karte, Benachrichtigungen bei Ablehnung.
* **Meister (Vorgesetzter)**: Freigabe/Ablehnung von Tagesberichten und Abwesenheiten, Einsicht in Team-Übersicht, Eingabe von Boni/Urlaubsgeld/Weihnachtsgeld, Notdienstverwaltung, Gesamtstatistiken, Karte mit Aufträgen.
* **Büroangestellter**: Einfaches Ein-/Ausstempeln, Soll-Ist-Vergleich, Urlaubs-/Krankheitsanträge, Monatsübersicht mit Überstunden.
* **Lohnbuchhaltung**: Lesezugriff auf freigegebene Berichte, Exporte (CSV/XLSX/PDF), keine Bearbeitung.
* **Admin**: Vollzugriff, Benutzerverwaltung (Demo-Logins), Systemparameter (z. B. Notdienstpauschale), Eingriffe, Deployment-Überblick.

RBAC: Jede API- und UI-Aktion prüft Rolle; unberechtigte Zugriffe werden geblockt.

---

## 3. Wesentliche funktionale Anforderungen (gekürzt)

### 3.1 Benutzerverwaltung & Authentifizierung

* Demo-Login mit Benutzername/Passwort.
* Rollen-Zuordnung beim Benutzer.
* Admin kann Benutzer anlegen, Rolle zuweisen, Urlaubskontingente setzen.
* Profilansicht mit Resturlaub, Wochen-/Monatsübersicht.

### 3.2 Auftragsliste + Karte

* Verwaltung von Standorten/Aufträgen mit Adresse, Koordinaten, Fabriknummer, Projekt-/Auftragsnummer.
* Interaktive Karte (Leaflet/OpenStreetMap o.ä.) im Admin/Meister-Frontend mit Markern und Details.
* Filterbare Listenansicht, ggf. Zuweisung von Monteuren (optional).
* Mobile Ansicht für Monteure: einfache Navigation zum Einsatzort.

### 3.3 Zeiterfassung

#### Monteure:

* Einstempeln/Ausstempeln mit laufendem Timer.
* Automatische Pausenanpassung gemäß Gesetz (ab 6h, 9h etc.); manuelle Pausen möglich.
* Warnung ab 8h, Sperre bzw. prominent rote Meldung ab 10h; E-Mail an Vorgesetzten bei Überschreitung.
* Verpflegungsmehraufwand automatisch bei >8h Außendienst-Tagen.
* Tagesnotiz pro Tag.
* Überstundenantrag nach 8h.

#### Büroangestellte:

* Kommen/Gehen (morgens/abends), Soll-Ist-Vergleich anhand definierter Wochenarbeitszeit.
* Überstundenübersicht, Monatsbericht mit Bonusfeldern.

### 3.4 Prämienlohn / Tagesberichte

* Tägliche Leistungserfassung mit: Datum, Standort, Fabriknummer, Einheit/Faktor, Aufgabentyp (z. B. Wartung → Faktor standardmäßig 1,25), Notdienst (mit Start/Ende), Projektnummer.
* Freigabeprozess: Meister genehmigt oder lehnt ab (mit Kommentar). Monteur kann bis max. 3 Tage nach Einreichung bearbeiten, solange nicht freigegeben.
* Monatsbericht: aggregierte Einheiten, Notdienst, Spesen, Bonus, Urlaubsgeld/Weihnachtsgeld, Gesamtvergütung.

### 3.5 Abwesenheitsverwaltung

* Antragssystem für Urlaub, Krankheit, Freistellungen.
* Genehmigung durch Vorgesetzten.
* Kalenderdarstellung mit Farbkodierung (z. B. rot=krank, blau=Urlaub; schraffiert = noch offen).
* Resturlaubberechnung (Jahresanspruch + anteilig bei Eintritt).
* Benachrichtigungen über Statuswechsel (genehmigt/abgelehnt).

### 3.6 Dashboard & Benachrichtigungen

* Rollenbasiertes Dashboard mit:
  * Aktuelle Arbeitszeit / Teamstatus
  * Offene Freigaben
  * Warnungen (z. B. Überschreitungen)
  * Bevorstehende Abwesenheiten
  * Aktive Aufträge
* Benachrichtigungen in-App (und optional per E-Mail) für:
  * Ablehnung/Genehmigung
  * Anträge gestellt
  * Überschreitung von Grenzen
  * Erinnerungen (z. B. vergessenes Ausstempeln)

### 3.7 Export & Reports

* Monatsberichte (Einzelperson + aggregiert).
* Export: CSV, XLSX, PDF (Zeiten, Tagesberichte, Abwesenheiten).
* Archivierte Berichte (freigegeben) abrufbar.
* Daten für Lohnbuchhaltung strukturiert verfügbar.

### 3.8 Datenarchivierung

* Alle Daten mindestens 10 Jahre verfügbar (Arbeitszeit-, Abwesenheits-, Leistungsdaten).
* Revisionssicher: Freigaben/Änderungen protokolliert.
* Backup & Restore (über Azure-Mechanismen).

---

## 4. Nichtfunktionale Anforderungen (komprimiert)

* **Gesetzeskonform:** ArbZG (max. 8/10h), Aufbewahrungspflichten, DSGVO (Zugriffskontrolle, Protokollierung).
* **Performance:** Schnelle API-Antworten, responsive UI. Skalierbarkeit über Azure.
* **Sicherheit:** HTTPS, Rollenbasierte Autorisierung, Eingabevalidierung, Passwort-Hashes, Auditing (Log von kritischen Aktionen).
* **Wartbarkeit:** Trennung Frontend/Backend, Konfigurierbar via Env, Logging (Azure Monitor/App Insights).
* **Usability:** Mobile-optimiert für Monteure, Desktop für Büro; sichtbare Kernaktionen, klare Rückmeldungen.
* **Erweiterbarkeit:** Modularer Aufbau (z. B. spätere Auth-Erweiterung, externe Payroll-Anbindung).

---

## 5. Datenmodell (kompakt)

Kernentitäten:

* **User**: Rolle, Urlaubskonto, Vorgesetzter, Login-Daten.
* **TimeRecord**: Einstempel-/Ausstempelzeit, Pausen, Status, Notiz.
* **WorkReport**: Tagesbericht mit Einheit, Aufgabentyp, Notdienst, Freigabestatus.
* **AbsenceRequest**: Urlaub/Krankheit/Freistellung mit Zeitraum und Status.
* **JobSite**: Standort/Auftrag mit Adresse, Koordinaten, Fabriknummer.
* **Notification**: Nachricht an Nutzer, gelesen/ungelesen.
* **Setting**: Systemparameter (z. B. Notdienstpauschale).
* **AuditLog**: Protokoll wichtiger Aktionen.

Relationale DB (z. B. PostgreSQL oder Azure SQL), Beziehungen: User → viele TimeRecords/WorkReports/AbsenceRequests; JobSite → viele WorkReports.

---

## 6. Beispielhafte API-Endpunkte

* `POST /api/login`
* `GET /api/users`, `POST /api/users` (Admin)
* `POST /api/timeclock/clock-in`, `POST /api/timeclock/clock-out`, `GET /api/timeclock/today`
* `POST /api/reports`, `POST /api/reports/{id}/approve`, `POST /api/reports/{id}/reject`
* `POST /api/absences`, `POST /api/absences/{id}/approve`, `POST /api/absences/{id}/reject`
* `GET /api/sites`, `GET /api/sites/{id}`
* `GET /api/notifications`, `POST /api/notifications/{id}/read`
* `GET /api/reports/monthly?format=pdf`, `GET /api/export/timesheets?format=csv`

Alle Endpoints sind auth-geschützt; Rolle bestimmt Zugriff.

---

## 7. Azure Deployment (Kernpunkte)

### Struktur

```
/frontend       # React App
/backend        # Flask API
/infra          # CI/CD Scripts, Dockerfiles
```

### Hosting

* **Frontend:** Azure Static Web App oder Serve über Flask (build in `frontend/build`).
* **Backend:** Azure App Service (Linux) oder Container (Docker) mit Gunicorn z. B.:
  `gunicorn -w 4 -b 0.0.0.0:8000 app:app`
* **Datenbank:** Azure Database for PostgreSQL oder Azure SQL.
* **Storage:** Azure Blob für Berichte/PDFs.
* **Monitoring:** Application Insights / Azure Monitor.

### Deployment

* CI/CD: Build Frontend (`npm run build`), Backend (`pip install` + Tests), Deployment via Azure CLI oder Pipeline.
* Environment Variables: `DATABASE_URL`, `SECRET_KEY`, Mail-Konfig, etc. in App Settings.
* Logging: Echtzeit-Log-Tailing, Healthchecks (`/api/health`).
* Skalierung: App Service Plan Auto/Manual, Container horizontal.
* Backup: DB Point-in-Time / regelmäßige Backups.

---

## 8. UI/UX-Hinweise (Kurz)

* **Monteur-Frontend:** Groß, klar, mobile-first; Stempeln prominent; Warnungen visuell deutlich.
* **Admin/Meister:** Tabellen, Filter, Karte, Freigaben-Übersicht.
* **Farbcodierte Kalender:** Urlaub (blau), krank (rot), schraffiert = offen.
* **Dashboard:** Rollenbasierte Widgets (Arbeitszeit, offene Aufgaben, Abwesenheiten, Warnungen).
* **Feedback:** Erfolg/Misserfolg bei Aktionen sichtbar, Confirmation bei kritischen Löschungen.

---

## 9. Next Steps & Implementation Plan

### Phase 1: Core Infrastructure (Woche 1-2)
1. **Datenbank-Schema** implementieren (SQLAlchemy Models)
2. **Auth-System** mit Rollen (JWT + RBAC)
3. **Basis-API** (Login, User CRUD, TimeClock)
4. **Frontend-Routing** und Auth-Context

### Phase 2: Core Features (Woche 3-4)
1. **Zeiterfassung** (Ein/Aus, Timer, Warnungen)
2. **Tagesberichte** (Erfassung + Freigabe-Workflow)
3. **Dashboard** (rollenbasiert)
4. **Mobile UI** für Monteure

### Phase 3: Advanced Features (Woche 5-6)
1. **Abwesenheitsverwaltung** (Urlaub/Krankheit)
2. **Auftragsliste + Karte** (Leaflet Integration)
3. **Export/Reports** (PDF/CSV)
4. **Benachrichtigungen**

### Phase 4: Azure Deployment (Woche 7-8)
1. **Docker-Container** für Backend
2. **Azure App Service** Setup
3. **CI/CD Pipeline** (GitHub Actions)
4. **Monitoring** (Application Insights)

### Phase 5: Testing & Polish (Woche 9-10)
1. **End-to-End Tests**
2. **Performance-Optimierung**
3. **Security-Audit**
4. **User-Acceptance-Testing**

---

## 10. Technische Stack (Bestätigung)

**Backend:**
- Flask (Python) - bereits vorhanden
- SQLAlchemy (ORM)
- JWT für Auth
- Gunicorn (Production)

**Frontend:**
- React (TypeScript) - bereits vorhanden
- Tailwind CSS - bereits vorhanden
- React Router
- Axios für API-Calls

**Deployment:**
- Azure App Service
- Azure Database for PostgreSQL
- Docker Container
- GitHub Actions CI/CD

**Monitoring:**
- Azure Application Insights
- Azure Monitor
- Custom Health Checks

---

*Dieses 50%-Requirements-Dokument dient als Basis für die direkte Implementation. Alle Kernfunktionen sind definiert, die technische Architektur ist klar, und die Deployment-Strategie ist festgelegt.* 