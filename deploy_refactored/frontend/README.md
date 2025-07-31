# Zeiterfassung Frontend

Modernes React-Frontend für die Lackner Aufzüge Zeiterfassungs-App.

## 🚀 Features

- **React 18** mit TypeScript
- **Next.js 14** mit App Router
- **Tailwind CSS** für Styling
- **Responsive Design** für Desktop und Mobile
- **Real-time Updates** für Arbeitszeit-Timer
- **Accessibility** Features (ARIA-Labels, Keyboard Navigation)
- **Error Handling** und Loading States

## 📁 Projektstruktur

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # Dashboard-Hauptseite
│   │   └── layout.tsx      # Root Layout
│   ├── components/          # React-Komponenten
│   │   ├── Header.tsx      # Globale Navigation
│   │   └── ArbeitszeitTimer.tsx # Arbeitszeit-Timer
│   ├── services/           # API-Services
│   │   └── api.ts         # Backend-Kommunikation
│   └── types/             # TypeScript-Definitionen
│       └── index.ts       # App-Typen
├── public/                # Statische Assets
└── package.json          # Dependencies
```

## 🛠️ Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build
npm run build
```

## 🔧 Konfiguration

### Environment Variables

Erstelle eine `.env.local` Datei:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend-Verbindung

Das Frontend kommuniziert mit dem Flask-Backend über:

- **API Base URL**: `http://localhost:5001` (Standard)
- **Session Cookies**: Für Authentication
- **CORS**: Muss im Backend konfiguriert werden

## 🎯 Komponenten

### Header
- Globale Navigation mit Logo
- Live-Zeit und Datum
- Benachrichtigungen-Dropdown
- Burger-Menü für Mobile

### ArbeitszeitTimer
- Start/Stop Timer-Funktionalität
- Real-time Updates
- Automatische Session-Speicherung
- Notdienstwoche-Toggle
- Statistiken (Arbeitszeit, Pausen, geplantes Ende)

### Dashboard
- Übersicht aller wichtigen Daten
- Störungen-Anzeige
- Auftrags-Statistiken
- Wetter-Widget (Platzhalter)

## 🔄 API-Integration

### Dashboard API
```typescript
// Dashboard-Daten laden
const data = await dashboardApi.getDashboardData();
```

### Arbeitszeit API
```typescript
// Timer-State speichern
await arbeitszeitApi.saveSession(state);

// Neuen Eintrag erstellen
await arbeitszeitApi.addArbeitszeit(entry);
```

### Zeiterfassung API
```typescript
// Einträge laden
const entries = await zeiterfassungApi.getEntries(filters);

// Eintrag genehmigen
await zeiterfassungApi.approveEntry(id, comment);
```

## 🎨 Styling

### Tailwind CSS
- **Custom Colors**: Lackner Blau (`#0066b3`)
- **Responsive**: Mobile-first Design
- **Components**: Wiederverwendbare UI-Komponenten

### Design-System
```css
/* Primary Colors */
--lackner-blue: #0066b3;
--lackner-blue-dark: #005a9e;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

## 🚀 Deployment

### Vercel (Empfohlen)
```bash
# Vercel CLI installieren
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Entwicklung

### Code-Style
- **ESLint**: TypeScript + Next.js Regeln
- **Prettier**: Automatische Formatierung
- **TypeScript**: Strikte Typisierung

### Testing
```bash
# Unit Tests
npm test

# E2E Tests (Cypress)
npm run cypress:open
```

### Performance
- **Code Splitting**: Automatisch durch Next.js
- **Image Optimization**: Next.js Image Component
- **Bundle Analysis**: `npm run analyze`

## 📱 Mobile Support

- **Responsive Design**: Alle Komponenten mobile-optimiert
- **Touch Gestures**: Swipe-Navigation
- **Progressive Web App**: Offline-Support möglich

## 🔒 Security

- **CORS**: Backend-Konfiguration erforderlich
- **Session Management**: Cookie-basiert
- **Input Validation**: Client + Server-seitig
- **XSS Protection**: React's built-in escaping

## 🐛 Troubleshooting

### CORS-Fehler
```bash
# Backend CORS konfigurieren
pip install flask-cors
```

### API-Verbindung
```bash
# Backend-Server starten
cd ../
python3 run_local.py
```

### Build-Fehler
```bash
# Cache löschen
rm -rf .next
npm run build
```

## 📈 Monitoring

### Performance
- **Core Web Vitals**: Lighthouse Scores
- **Bundle Size**: Webpack Bundle Analyzer
- **Error Tracking**: Sentry Integration

### Analytics
- **User Tracking**: Google Analytics
- **Error Monitoring**: Sentry
- **Performance**: Vercel Analytics

## 🤝 Contributing

1. **Fork** das Repository
2. **Feature Branch** erstellen (`git checkout -b feature/amazing-feature`)
3. **Commit** Änderungen (`git commit -m 'Add amazing feature'`)
4. **Push** zum Branch (`git push origin feature/amazing-feature`)
5. **Pull Request** erstellen

## 📄 License

Dieses Projekt ist Teil der Lackner Aufzüge GmbH Zeiterfassungs-Lösung.
