# 📋 **Funktionale & Design-Anforderungen - Zeiterfassung-App**

## 🎯 **1. Benutzerrollen & Authentifizierung**

### **Funktionale Anforderungen:**
- ✅ **Multi-Role-System**: Monteur, Büro, Admin
- ✅ **Session-basierte Authentifizierung** mit Cookies
- ✅ **Automatische Session-Erneuerung**
- ✅ **Logout-Funktionalität**
- ✅ **Geschützte Routen** basierend auf Benutzerrolle

### **Design-Anforderungen:**
- 🎨 **Login-Formular** mit Email/Passwort
- 🎨 **Benutzerinfo im Header** (Name, Rolle)
- 🎨 **Logout-Button** in der Navigation
- 🎨 **Fehlermeldungen** bei ungültigen Anmeldedaten

---

## ⏰ **2. Monteur-Dashboard (Hauptübersicht)**

### **Funktionale Anforderungen:**

#### **Dashboard-Übersicht:**
- ✅ **Live-Timer** mit aktueller Zeit (HH:MM:SS)
- ✅ **Wetter-Widget** für München (Temperatur, Bedingungen)
- ✅ **Schnellaktionen**: Ein-/Ausstempeln, Pause, Notfall
- ✅ **Status-Anzeige**: Arbeitsstatus, Pausenstatus, Bereitschaftsdienst
- ✅ **Nächster Auftrag**: Zeit, Typ, Standort, verbleibende Zeit

#### **Statistiken & KPIs:**
- ✅ **Heutige Arbeitszeit** in Stunden
- ✅ **Wochenarbeitszeit** gesamt
- ✅ **Überstunden** mit Warnungen
- ✅ **Verpflegungsmehraufwand** (>8h auswärts)
- ✅ **Auftrags-Statistiken**: Offen, abgeschlossen, gesamt

#### **Schnellaktionen:**
- ✅ **Einstempeln/Ausstempeln** mit Standort-Auswahl
- ✅ **Pause beginnen/beenden**
- ✅ **Notfall melden** für schnelle Erfassung
- ✅ **Navigation öffnen** mit GPS-Integration

### **Design-Anforderungen:**
- 🎨 **Apple-like Design** mit weißen Kacheln
- 🎨 **Responsive Grid-Layout**
- 🎨 **Gradient-Header** mit Lackner-Logo
- 🎨 **Kompakte Karten** für Statistiken
- 🎨 **Live-Updates** ohne Page-Reload

---

## 🏢 **3. Büro-Dashboard**

### **Funktionale Anforderungen:**

#### **Auftragsverwaltung:**
- ✅ **Alle Aufträge anzeigen** mit Status
- ✅ **Neue Aufträge erstellen** mit Details
- ✅ **Aufträge zuweisen** an Monteure
- ✅ **Status-Änderungen** (assigned, in_progress, completed)
- ✅ **Prioritäten** (low, normal, high, urgent)

#### **Notfall-Management:**
- ✅ **Notfälle erstellen** und verwalten
- ✅ **Notfall-Zuweisung** an Monteure
- ✅ **Notfall-Status** (active, resolved)
- ✅ **Dringende Benachrichtigungen**

#### **Monteur-Übersicht:**
- ✅ **Alle Monteure** mit Status
- ✅ **Verfügbarkeit** anzeigen
- ✅ **Arbeitszeiten** der Monteure
- ✅ **Auftrags-Zuweisung**

#### **Kundenverwaltung:**
- ✅ **Kundenliste** mit Details
- ✅ **Kunden-Aufträge** verknüpfen
- ✅ **Kunden-Kontaktdaten**

### **Design-Anforderungen:**
- 🎨 **Tab-Navigation** zwischen Bereichen
- 🎨 **Status-Badges** mit Farbkodierung
- 🎨 **Prioritäts-Indikatoren** (Farben)
- 🎨 **Responsive Tabellen** für Listen
- 🎨 **Formulare** für neue Einträge
- 🎨 **Dashboard-Karten** für Übersicht

---

## 📱 **4. Responsive Design**

### **Funktionale Anforderungen:**
- ✅ **Mobile-First** Ansatz
- ✅ **Touch-Gesten** unterstützen
- ✅ **Offline-Funktionalität** für mobile Nutzung
- ✅ **Progressive Web App** Features

### **Design-Anforderungen:**
- 🎨 **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1200px)
- 🎨 **Flexible Grid-System**
- 🎨 **Touch-optimierte Buttons** (min. 44px)
- 🎨 **Mobile Navigation** (Hamburger-Menu)
- 🎨 **Optimierte Formulare** für Touch-Eingabe

---

## 🎨 **5. Design-System**

### **Farbschema:**
- 🎨 **Primärfarbe**: Blau (#667eea, #764ba2)
- 🎨 **Sekundärfarbe**: Grau (#f8fafc, #e2e8f0)
- 🎨 **Akzentfarbe**: Grün (#10b981), Rot (#ef4444)
- 🎨 **Text**: Dunkelgrau (#1e293b)

### **Typografie:**
- 🎨 **Headings**: 2.5rem, 2rem, 1.5rem
- 🎨 **Body**: 1rem, 0.875rem
- 🎨 **Font-Family**: System-Fonts (San Francisco, Segoe UI)

### **Komponenten:**
- 🎨 **Buttons**: Primary, Secondary, Danger, Small
- 🎨 **Cards**: Mit Schatten und Border-Radius
- 🎨 **Forms**: Input-Felder mit Focus-States
- 🎨 **Modals**: Overlay mit Backdrop-Blur
- 🎨 **Badges**: Status- und Prioritäts-Indikatoren

---

## 🔧 **6. Backend-API**

### **Funktionale Anforderungen:**

#### **Authentifizierung:**
- ✅ **POST /api/auth/login** - Benutzer anmelden
- ✅ **POST /api/auth/logout** - Benutzer abmelden
- ✅ **GET /api/auth/me** - Aktueller Benutzer

#### **Monteur-APIs:**
- ✅ **GET /api/monteur/time-entries** - Zeiteinträge abrufen
- ✅ **POST /api/monteur/time-entries** - Neuen Eintrag erstellen
- ✅ **PUT /api/monteur/time-entries/{id}** - Eintrag bearbeiten
- ✅ **DELETE /api/monteur/time-entries/{id}** - Eintrag löschen
- ✅ **POST /api/monteur/clock-in** - Einstempeln
- ✅ **POST /api/monteur/clock-out** - Ausstempeln
- ✅ **GET /api/monteur/current-status** - Aktueller Status
- ✅ **GET /api/monteur/orders** - Aufträge abrufen

#### **Büro-APIs:**
- ✅ **GET /api/buero/orders** - Alle Aufträge
- ✅ **POST /api/buero/orders** - Neuen Auftrag erstellen
- ✅ **GET /api/buero/emergencies** - Notfälle abrufen
- ✅ **POST /api/buero/emergencies** - Notfall erstellen
- ✅ **GET /api/buero/customers** - Kunden abrufen
- ✅ **GET /api/buero/users** - Benutzer abrufen

### **Technische Anforderungen:**
- ✅ **CORS-Unterstützung** für Frontend/Backend
- ✅ **Session-Management** mit Cookies
- ✅ **Error-Handling** mit HTTP-Status-Codes
- ✅ **JSON-Response** Format
- ✅ **Health-Check** Endpoint

---

## 📊 **7. Datenbank-Schema**

### **Tabellen:**
- ✅ **users**: id, email, password, name, role
- ✅ **time_entries**: id, user_id, start_time, end_time, description, order_id
- ✅ **orders**: id, title, description, customer, location, order_type, priority, status, assigned_to
- ✅ **emergencies**: id, title, description, location, priority, status, assigned_to, reported_at
- ✅ **customers**: id, name, address, contact_info

### **Beziehungen:**
- ✅ **Foreign Keys** zwischen Tabellen
- ✅ **Indexes** für Performance
- ✅ **Constraints** für Datenintegrität

---

## 🚀 **8. Deployment & Infrastruktur**

### **Funktionale Anforderungen:**
- ✅ **Azure App Service** Deployment
- ✅ **PostgreSQL** Datenbank
- ✅ **Static File Serving** für React-Build
- ✅ **Environment Variables** für Konfiguration
- ✅ **Health-Check** Endpoints

### **Technische Anforderungen:**
- ✅ **HTTPS** für Produktion
- ✅ **Domain-Konfiguration**
- ✅ **Backup-Strategie**
- ✅ **Monitoring** und Logging
- ✅ **Error-Tracking**

---

## 📱 **9. Mobile-Features**

### **Funktionale Anforderungen:**
- ✅ **Progressive Web App** (PWA)
- ✅ **Offline-Funktionalität** mit Service Worker
- ✅ **Push-Benachrichtigungen** für Notfälle
- ✅ **Touch-Optimierung** für alle Interaktionen
- ✅ **GPS-Integration** für Standort-Erfassung

### **Design-Anforderungen:**
- 🎨 **Mobile-First** Responsive Design
- 🎨 **Touch-Gesten** (Swipe, Tap, Long-Press)
- 🎨 **Optimierte Navigation** für kleine Bildschirme
- 🎨 **Keyboard-Optimierung** für Eingabefelder

---

## 🔒 **10. Sicherheit & Compliance**

### **Funktionale Anforderungen:**
- ✅ **Passwort-Hashing** mit bcrypt
- ✅ **Session-Sicherheit** mit Secret Key
- ✅ **CSRF-Schutz** für Formulare
- ✅ **Input-Validierung** auf Server-Seite
- ✅ **SQL-Injection-Schutz** mit Parameterized Queries

### **Compliance:**
- ✅ **DSGVO-Konformität** für personenbezogene Daten
- ✅ **Arbeitszeit-Gesetze** (8h-Regel, Pausen)
- ✅ **Daten-Audit** für Änderungen
- ✅ **Backup-Strategie** für Datenverlust-Schutz

---

## 📈 **11. Performance & Skalierbarkeit**

### **Funktionale Anforderungen:**
- ✅ **Lazy Loading** für große Listen
- ✅ **Pagination** für Datenbank-Abfragen
- ✅ **Caching** für statische Inhalte
- ✅ **API-Rate-Limiting** für Missbrauch-Schutz
- ✅ **Database-Indexing** für schnelle Abfragen

### **Technische Anforderungen:**
- ✅ **CDN** für statische Assets
- ✅ **Gzip-Kompression** für API-Responses
- ✅ **Image-Optimization** für Logos/Bilder
- ✅ **Bundle-Optimization** für JavaScript
- ✅ **Database-Connection-Pooling**

---

## 🎯 **12. Benutzerfreundlichkeit (UX)**

### **Funktionale Anforderungen:**
- ✅ **Intuitive Navigation** ohne Schulung
- ✅ **Schnelle Eingabe** mit Shortcuts
- ✅ **Auto-Save** für Formulare
- ✅ **Undo/Redo** für Aktionen
- ✅ **Keyboard-Navigation** für Barrierefreiheit

### **Design-Anforderungen:**
- 🎨 **Konsistente UI-Patterns**
- 🎨 **Klare visuelle Hierarchie**
- 🎨 **Adequate Kontraste** für Lesbarkeit
- 🎨 **Loading-Indikatoren** für Feedback
- 🎨 **Tooltips** für komplexe Funktionen

---

## 🎯 **13. Monteur-Bereiche (Spezifische Funktionsbereiche)**

### **13.1 Zeiterfassungen (Kundenarbeiten)**

#### **Funktionale Anforderungen:**
- ✅ **Kundenaufträge**: Name, Adresse, Auftragsnummer
- ✅ **Arbeitsarten**: Reparatur, Wartung, Installation, Sonstiges
- ✅ **Zeit-Erfassung**: Stunden und Materialkosten
- ✅ **Beschreibung**: Detaillierte Arbeitsbeschreibung
- ✅ **CRUD-Operationen**: Erstellen, Bearbeiten, Löschen, Anzeigen
- ✅ **Statistik**: Gesamtstunden, Einträge, Gesamtwert
- ✅ **Filter**: Heute, Diese Woche, Dieser Monat

#### **Design-Anforderungen:**
- 🎨 **Tabellarische Übersicht** mit kompakten Informationen
- 🎨 **Formulare** für neue/bearbeitete Einträge
- 🎨 **Statistik-Karten** für Übersicht
- 🎨 **Filter-Interface** für Zeiträume

### **13.2 Arbeitszeit (Personalzeiterfassung)**

#### **Funktionale Anforderungen:**
- ✅ **Echtzeit-Timer** mit Kategorie-Auswahl (Arbeit, Urlaub, Krankheit, Training, Sonstiges)
- ✅ **Stempeln & Erfassen**: Ein-/Ausstempeln mit Standort-Auswahl
- ✅ **Schnellerfassung**: One-Click für Urlaub/Krankheit/Training
- ✅ **Manueller Eintrag**: Vollständiges Formular mit Validierung
- ✅ **Notizfeld**: Persistente Notizen für alle Einträge
- ✅ **Überstunden-Warnungen**: 8h und 10h Alarme
- ✅ **Offline-Support**: Lokale Speicherung und Sync
- ✅ **Filter & Listen**: Zeitfilter und tabellarische Ansicht

#### **Design-Anforderungen:**
- 🎨 **Große digitale Uhr** für Timer-Anzeige
- 🎨 **Kategorie-Badges** mit Farbkodierung
- 🎨 **Modal-Formulare** für Eingaben
- 🎨 **Loading-States** mit Spinner

### **13.3 Aufträge**

#### **Funktionale Anforderungen:**
- ✅ **Auftragsübersicht**: Alle zugewiesenen Aufträge
- ✅ **Status-Filter**: Offen, in Bearbeitung, abgeschlossen
- ✅ **Prioritäts-Anzeige**: Farbkodierte Prioritäten
- ✅ **Auftragsdetails**: Vollständige Informationen und Beschreibung
- ✅ **Auftrags-Management**: Status ändern, Notizen, Fotos, Material
- ✅ **Navigation**: GPS-Integration und Routenplanung

#### **Design-Anforderungen:**
- 🎨 **Auftrags-Karten** mit Status-Indikatoren
- 🎨 **Prioritäts-Badges** mit Farben
- 🎨 **Detail-Ansicht** für vollständige Informationen
- 🎨 **Karten-Integration** für Standorte

### **13.4 Profil**

#### **Funktionale Anforderungen:**
- ✅ **Persönliche Informationen**: Name, Email, Telefonnummer
- ✅ **Arbeitszeit-Einstellungen**: Standard-Arbeitszeiten, Pausen, Limits
- ✅ **Präferenzen**: Sprache, Zeitzone, Theme, Dashboard-Layout
- ✅ **Statistiken & Berichte**: Persönliche Auswertungen und Export

#### **Design-Anforderungen:**
- 🎨 **Profil-Formular** mit Avatar-Upload
- 🎨 **Einstellungs-Panels** für verschiedene Bereiche
- 🎨 **Statistik-Diagramme** für persönliche Auswertungen
- 🎨 **Export-Funktionen** für Daten

### **13.5 Navigation & Layout**

#### **Funktionale Anforderungen:**
- ✅ **Konsistente Navigation**: Header mit Benutzerinfo und Logout
- ✅ **Tab-Navigation**: Dashboard, Zeiterfassungen, Arbeitszeit, Aufträge, Profil
- ✅ **Responsive Design**: Mobile-freundlich
- ✅ **Aktive Tabs**: Hervorhebung der aktuellen Seite

#### **Design-Anforderungen:**
- 🎨 **Apple-like Design**: Weiß-graue Kacheln, hellblaue Akzente
- 🎨 **Konsistente Komponenten**: Cards, Buttons, Forms
- 🎨 **Professionelle Typografie**: Klare Hierarchie
- 🎨 **Responsive Grid**: Anpassung an verschiedene Bildschirmgrößen

---

Diese Anforderungen bilden die Grundlage für eine vollständige, benutzerfreundliche und skalierbare Zeiterfassung-App! 🚀
