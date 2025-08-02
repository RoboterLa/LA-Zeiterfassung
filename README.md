# 🕐 Zeiterfassung System - Monteur-Web-App

Eine moderne Web-Anwendung für die Zeiterfassung und Auftragsverwaltung einer Aufzugsfirma mit separaten Frontends für Monteure (Mobile) und Büro/Admin (Desktop).

## 📋 Inhaltsverzeichnis

- [Übersicht](#-übersicht)
- [Features](#-features)
- [Architektur](#-architektur)
- [Installation](#-installation)
- [Entwicklung](#-entwicklung)
- [Deployment](#-deployment)
- [API-Dokumentation](#-api-dokumentation)
- [Datenbank-Schema](#-datenbank-schema)
- [Demo-Zugänge](#-demo-zugänge)
- [Roadmap](#-roadmap)

## 🎯 Übersicht

Das Zeiterfassung-System ist eine vollständige Web-Anwendung für die Verwaltung von Arbeitszeiten, Aufträgen und Abwesenheiten. Es unterstützt verschiedene Benutzerrollen mit spezifischen Berechtigungen und Funktionen.

### 🎭 Benutzerrollen

- **Monteur**: Zeiterfassung, Tagesberichte, Abwesenheitsanträge
- **Meister**: Team-Verwaltung, Berichts-Freigabe, Urlaubsgenehmigung
- **Admin**: Vollzugriff, Benutzerverwaltung, System-Konfiguration
- **Büro**: Berichte, Export, Übersichten

## ✨ Features

### 🔐 Authentifizierung & Sicherheit
- JWT-basierte Authentifizierung
- Rollenbasierte Zugriffskontrolle (RBAC)
- Sichere Passwort-Hashing mit bcrypt
- Session-Management

### ⏰ Zeiterfassung
- Ein-/Ausstempeln mit Zeitstempel
- Automatische Pausenberechnung
- Überstunden-Warnungen (ab 8h)
- Sperre bei 10h+ Arbeitszeit
- Offline-Synchronisation

### 📊 Tagesberichte
- Erfassung von Arbeitsleistungen
- Einheiten-basierte Berechnung
- Notdienst-Status
- Freigabe-Workflow
- Automatische Faktor-Berechnung

### 🏖️ Abwesenheitsverwaltung
- Urlaubsanträge
- Krankmeldungen
- Freistellungen
- Genehmigungs-Workflow
- Urlaubskonto-Verwaltung

### 📍 Auftragsverwaltung
- Job-Site-Management
- Standort-Verwaltung
- Prioritäts-System
- Karten-Integration (geplant)

### 📈 Dashboard & Berichte
- Rollenbasierte Dashboards
- Echtzeit-Statistiken
- Export-Funktionen
- Benachrichtigungen

## 🏗️ Architektur

### Backend (Flask)
```
backend/
├── app.py                 # Flask App Factory
├── config.py             # Konfiguration
├── requirements.txt      # Python Dependencies
├── models/              # SQLAlchemy Models
│   ├── __init__.py
│   └── models.py
├── controllers/         # API Blueprints
│   ├── __init__.py
│   ├── auth.py         # Authentifizierung
│   └── api.py          # Haupt-API
├── services/           # Business Logic
│   ├── __init__.py
│   └── crud_service.py # Generic CRUD Services
└── utils/              # Utilities
    ├── __init__.py
    ├── auth.py         # Auth Manager
    └── db.py           # Database Manager
```

### Frontend (React)
```
frontend/
├── package.json
├── public/
├── src/
│   ├── components/     # Reusable Components
│   │   ├── Header.tsx
│   │   ├── Dashboard.tsx
│   │   ├── WorkReportForm.tsx
│   │   ├── AbsenceRequestForm.tsx
│   │   ├── AbsenceCalendar.tsx
│   │   └── JobSiteMap.tsx
│   ├── pages/         # Page Components
│   │   ├── LoginPage.js
│   │   ├── UrlaubPage.js
│   │   └── ...
│   ├── services/      # API Services
│   │   └── api.js
│   ├── context/       # React Context
│   │   └── AuthContext.js
│   └── utils/         # Utilities
```

## 🚀 Installation

### Voraussetzungen
- Python 3.11+
- Node.js 18+
- Git

### 1. Repository klonen
```bash
git clone <repository-url>
cd zeiterfassung-system
```

### 2. Backend Setup
```bash
# Virtual Environment erstellen
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate     # Windows

# Dependencies installieren
pip install -r backend/requirements.txt

# Umgebungsvariablen setzen
export FLASK_ENV=development
export FLASK_SECRET_KEY=your-secret-key
export CLIENT_ID=your-client-id
export CLIENT_SECRET=your-client-secret
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Datenbank initialisieren
```bash
cd backend
python app.py
```

### 5. Entwicklungsserver starten

**Backend:**
```bash
cd backend
python app.py
# Server läuft auf http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm start
# App läuft auf http://localhost:3000
```

## 🛠️ Entwicklung

### Backend Development

#### Neue API-Endpoints hinzufügen:
```python
# In controllers/api.py
@api_bp.route('/new-endpoint', methods=['GET'])
@require_auth
def new_endpoint():
    return jsonify({"message": "Success"})
```

#### Neue Services erstellen:
```python
# In services/crud_service.py
class NewService(GenericCrudService):
    def __init__(self):
        super().__init__(NewModel)
    
    def custom_method(self):
        # Custom business logic
        pass
```

#### Neue Models hinzufügen:
```python
# In models/__init__.py
class NewModel(Base):
    __tablename__ = 'new_model'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Frontend Development

#### Neue Komponenten erstellen:
```jsx
// In src/components/NewComponent.tsx
import React from 'react';

const NewComponent = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

#### API-Services erweitern:
```javascript
// In src/services/api.js
export const newAPI = {
  getAll: () => axios.get('/api/new'),
  create: (data) => axios.post('/api/new', data),
  update: (id, data) => axios.put(`/api/new/${id}`, data),
  delete: (id) => axios.delete(`/api/new/${id}`)
};
```

## 🚀 Deployment

### Azure App Service

#### 1. Azure CLI Setup
```bash
az login
az account set --subscription <subscription-id>
```

#### 2. Resource Group erstellen
```bash
az group create --name zeiterfassung-rg --location centralus
```

#### 3. App Service Plan erstellen
```bash
az appservice plan create --name zeiterfassung-plan --resource-group zeiterfassung-rg --sku F1 --is-linux
```

#### 4. Web App erstellen
```bash
az webapp create --resource-group zeiterfassung-rg --plan zeiterfassung-plan --name zeiterfassung-app --runtime "PYTHON|3.11"
```

#### 5. Konfiguration
```bash
# Python Version
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --linux-fx-version "PYTHON|3.11"

# Startup Command
az webapp config set --resource-group zeiterfassung-rg --name zeiterfassung-app --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 backend.app:app"

# Environment Variables
az webapp config appsettings set --resource-group zeiterfassung-rg --name zeiterfassung-app --settings \
  FLASK_ENV=production \
  FLASK_SECRET_KEY=$(openssl rand -hex 32) \
  CLIENT_ID=azure-client-id \
  CLIENT_SECRET=azure-client-secret
```

#### 6. Deployment
```bash
# Frontend builden
cd frontend && npm run build

# Static files kopieren
mkdir -p backend/static
cp -r frontend/build/* backend/static/

# Package erstellen
zip -r app.zip backend/ -x "backend/__pycache__/*" "backend/*.pyc"

# Deployen
az webapp deployment source config-zip --resource-group zeiterfassung-rg --name zeiterfassung-app --src app.zip
```

### Alternative: Render.com

```yaml
# render.yaml
services:
  - type: web
    name: zeiterfassung-app
    env: python
    buildCommand: |
      cd frontend && npm install && npm run build
      cd ../backend && pip install -r requirements.txt
    startCommand: gunicorn backend.app:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FLASK_SECRET_KEY
        generateValue: true
```

## 📚 API-Dokumentation

### Authentifizierung

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "monteur1",
  "password": "Demo123!"
}
```

#### Response
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "monteur1",
    "name": "Max Mustermann",
    "role": "monteur",
    "email": "max.mustermann@example.com"
  }
}
```

### Zeiterfassung

#### Einstempeln
```http
POST /api/timeclock/clock-in
Authorization: Bearer <token>
```

#### Ausstempeln
```http
POST /api/timeclock/clock-out
Authorization: Bearer <token>
```

#### Status abfragen
```http
GET /api/timeclock/status
Authorization: Bearer <token>
```

### Tagesberichte

#### Bericht erstellen
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

#### Berichte abrufen
```http
GET /api/reports?user_id=1&status=submitted
Authorization: Bearer <token>
```

### Abwesenheitsverwaltung

#### Antrag erstellen
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

#### Anträge abrufen
```http
GET /api/absences?user_id=1
Authorization: Bearer <token>
```

## 🗄️ Datenbank-Schema

### Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    vacation_days_remaining INTEGER DEFAULT 25,
    weekly_hours INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TimeRecords
```sql
CREATE TABLE time_records (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    total_break_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WorkReports
```sql
CREATE TABLE work_reports (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    job_site_id INTEGER REFERENCES job_sites(id),
    task_type VARCHAR(50) NOT NULL,
    units INTEGER DEFAULT 1,
    factor DECIMAL(3,2) DEFAULT 1.0,
    emergency_service BOOLEAN DEFAULT FALSE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AbsenceRequests
```sql
CREATE TABLE absence_requests (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    absence_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 👥 Demo-Zugänge

### Test-Benutzer
| Username | Password | Rolle | Beschreibung |
|----------|----------|-------|--------------|
| `monteur1` | `Demo123!` | Monteur | Feldtechniker |
| `meister1` | `Demo123!` | Meister | Teamleiter |
| `admin` | `Demo123!` | Admin | Systemadministrator |
| `buero1` | `Demo123!` | Büro | Büroangestellter |

### Features pro Rolle

#### Monteur
- ✅ Zeiterfassung (Ein-/Ausstempeln)
- ✅ Tagesberichte erstellen
- ✅ Abwesenheitsanträge
- ✅ Dashboard mit persönlichen Statistiken

#### Meister
- ✅ Alle Monteur-Features
- ✅ Team-Übersicht
- ✅ Berichts-Freigabe
- ✅ Urlaubsgenehmigung
- ✅ Team-Statistiken

#### Admin
- ✅ Alle Features
- ✅ Benutzerverwaltung
- ✅ System-Konfiguration
- ✅ Vollständige Berichte

#### Büro
- ✅ Berichte einsehen
- ✅ Export-Funktionen
- ✅ Übersichten
- ✅ Datenverwaltung

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] Authentifizierung & RBAC
- [x] Zeiterfassung
- [x] Tagesberichte
- [x] Abwesenheitsverwaltung
- [x] Dashboard

### Phase 2: Advanced Features ✅
- [x] Job-Site-Management
- [x] Berichts-Freigabe
- [x] Urlaubsgenehmigung
- [x] Export-Funktionen

### Phase 3: Production Ready 🚧
- [ ] Offline-Synchronisation
- [ ] Push-Benachrichtigungen
- [ ] Geofencing
- [ ] Mobile App (PWA)

### Phase 4: Enterprise Features 📋
- [ ] Azure AD Integration
- [ ] Multi-Tenant Support
- [ ] Advanced Reporting
- [ ] API für externe Systeme

### Phase 5: AI & Automation 🤖
- [ ] Automatische Disposition
- [ ] Predictive Analytics
- [ ] Chatbot Support
- [ ] Voice Commands

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📊 Monitoring

### Health Checks
- `/health` - System-Status
- `/api/status` - API-Status

### Logs
```bash
# Azure App Service Logs
az webapp log tail --resource-group zeiterfassung-rg --name zeiterfassung-app
```

### Metrics
- Aktive Benutzer
- API-Latenz
- Fehlerquoten
- Überstunden-Warnungen

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 📞 Support

Bei Fragen oder Problemen:

1. Erstelle ein Issue im GitHub Repository
2. Kontaktiere das Entwicklungsteam
3. Konsultiere die Dokumentation

---

**Entwickelt mit ❤️ für moderne Zeiterfassung**
