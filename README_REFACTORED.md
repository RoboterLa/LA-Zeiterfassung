# Zeiterfassung System - Refactored

## 🚀 Neue Architektur

Die Anwendung wurde in eine skalierbare Struktur mit React-Frontend und Flask-API-Backend refactored.

### 📁 Projektstruktur

```
zeiterfassung Prod/
├── backend/                    # Flask API Backend
│   ├── models/                # SQLAlchemy Models
│   ├── controllers/           # API Blueprints
│   ├── services/             # Business Logic
│   ├── utils/                # Helpers
│   ├── config.py             # Konfiguration
│   ├── app.py                # Flask App Factory
│   ├── run.py                # Start-Script
│   └── requirements.txt      # Python Dependencies
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable Components
│   │   ├── pages/           # Views
│   │   ├── services/        # API Helpers
│   │   ├── hooks/           # Custom Hooks
│   │   ├── context/         # React Context
│   │   └── assets/          # Static Assets
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── .cursorrules              # Projektregeln
```

## 🔧 Installation & Start

### Backend (Flask API)

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Backend läuft auf: http://localhost:5000

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

Frontend läuft auf: http://localhost:3000

## 🏗️ Architektur-Prinzipien

### Backend
- **MVC-Struktur**: Models, Views (API), Controllers
- **Kein HTML-Rendering**: Nur API-Endpunkte
- **GenericCrudService**: Wiederverwendbare CRUD-Operationen
- **Type-Hints**: Vollständige Typisierung
- **Modular**: Kleine, fokussierte Dateien (<1000 Zeilen)

### Frontend
- **React Hooks**: Functional Components
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Generic Components**: Wiederverwendbare CRUD-Komponenten
- **AuthContext**: Zentrale Authentifizierung

## 🔄 API-Endpunkte

### Authentifizierung
- `POST /api/login` - Anmeldung
- `POST /api/logout` - Abmeldung
- `GET /api/me` - Aktueller Benutzer

### CRUD-APIs
- `GET/POST /api/arbeitszeit` - Arbeitszeit verwalten
- `GET/POST /api/urlaub` - Urlaub verwalten
- `GET/POST /api/auftraege` - Aufträge verwalten
- `GET/POST /api/zeiterfassung` - Zeiterfassung verwalten

### Status
- `GET /health` - Health Check
- `GET /api/status` - API Status

## 🧪 Tests

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Azure)
```bash
cd backend
# Build und Deploy nach Azure
```

### Frontend (Build)
```bash
cd frontend
npm run build
# Build wird von Flask geserved
```

## 📋 Features

### ✅ Implementiert
- [x] Backend-Refactoring mit Blueprints
- [x] GenericCrudService für alle Entitäten
- [x] React-Frontend mit Hooks
- [x] AuthContext für Authentifizierung
- [x] GenericCrudTable und GenericForm
- [x] Arbeitszeit-Verwaltung
- [x] Login/Logout-System
- [x] Tailwind CSS Styling

### 🔄 In Entwicklung
- [ ] Urlaub-Verwaltung
- [ ] Aufträge-Verwaltung
- [ ] Zeiterfassung-Verwaltung
- [ ] Admin-Dashboard
- [ ] Tests

## 🔧 Entwicklung

### Neue CRUD-Entität hinzufügen

1. **Backend Service erstellen**:
```python
# backend/services/crud_service.py
class NeueEntitaetService(GenericCrudService):
    def __init__(self):
        super().__init__('neue_entitaet')
```

2. **API Controller hinzufügen**:
```python
# backend/controllers/api.py
@api_bp.route('/neue-entitaet', methods=['GET', 'POST'])
def api_neue_entitaet():
    # Implementation
```

3. **Frontend API Service**:
```javascript
// frontend/src/services/api.js
export const neueEntitaetAPI = {
  getAll: () => api.get('/api/neue-entitaet'),
  create: (data) => api.post('/api/neue-entitaet', data),
  // ...
};
```

4. **React Page erstellen**:
```javascript
// frontend/src/pages/NeueEntitaetPage.js
// Verwende GenericCrudTable und GenericForm
```

## 🎯 Nächste Schritte

1. **Urlaub-Verwaltung implementieren**
2. **Aufträge-Verwaltung implementieren**
3. **Admin-Dashboard erstellen**
4. **Tests schreiben**
5. **Deployment automatisieren**

## 📞 Support

Bei Fragen zur neuen Architektur oder Problemen beim Setup, siehe `.cursorrules` für Projektregeln. 