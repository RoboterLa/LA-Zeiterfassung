// Benutzer-Typen
export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  can_approve: boolean;
  location?: string;
}

// Zeiterfassungs-Eintrag
export interface TimeEntry {
  id: string;
  elevator_id: string;
  location: string;
  date: string;
  activity_type: string;
  other_activity?: string;
  start_time: string;
  end_time: string;
  emergency_week: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  mitarbeiter: string;
  comment?: string;
  history?: string;
}

// Auftrag-Typen
export interface Auftrag {
  id: string;
  art: string;
  uhrzeit: string;
  standort: string;
  coords?: [number, number];
  details?: string;
  done: boolean;
}

// Arbeitszeit-Eintrag
export interface Arbeitszeit {
  id: string;
  datum: string;
  start: string;
  stop: string;
  dauer: string;
  notdienstwoche: '0' | '1';
  quelle: 'manuell' | 'dashboard';
  bemerkung?: string;
  time?: Date; // Timer-Daten
}

// Urlaub-Eintrag
export interface Urlaub {
  id: string;
  start: string;
  end: string;
  comment?: string;
}

export interface UrlaubForm {
  start: string;
  end: string;
  comment: string;
}

// Dashboard-Daten
export interface DashboardData {
  user: User;
  dashboard_data: {
    stoerungen: Array<{
      art: string;
      adresse: string;
      deadline: string;
      coords: [number, number];
    }>;
    auftraege: Auftrag[];
    heutige_arbeitszeit: Arbeitszeit[];
    urlaub: Urlaub[];
    offene_zeiteintraege: TimeEntry[];
    letzte_zeiteintraege: TimeEntry[];
    auftraege_offen: number;
    auftraege_erledigt: number;
    auftragsarten: Record<string, { offen: number; gesamt: number }>;
    naechster_auftrag_uhrzeit?: string;
    naechster_auftrag_art?: string;
    naechster_auftrag_standort?: string;
    naechster_auftrag_coords?: [number, number];
    verbleibende_zeit?: string;
    pending_count: number;
    resturlaub: number;
    tage_verbraucht?: number;
    tage_verplant?: number;
    tage_uebrig?: number;
    aktueller_urlaub?: Urlaub;
    naechster_urlaub?: Urlaub;
  };
}

// Arbeitszeit-Timer-State
export interface ArbeitszeitState {
  start: Date | null;
  gesamt: number;
  events: Array<{
    type: 'start' | 'stop' | 'pause' | 'resume';
    time: Date;
  }>;
}

// API-Response-Typen
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Form-Validierung
export interface ZeiterfassungForm {
  elevator_id: string;
  location: string;
  entry_date: string;
  activity_type: string;
  other_activity: string;
  start_time: string;
  end_time: string;
  emergency_week: string;
  notes: string;
}

export interface ArbeitszeitForm {
  datum: string;
  start: string;
  stop: string;
  dauer: string;
  notdienstwoche: '0' | '1';
  bemerkung?: string;
}

// Neue erweiterte Arbeitszeiterfassung
export interface ArbeitszeitErfassung {
  id: number;
  order_id?: number;
  start_time: string;
  end_time?: string;
  duration?: string;
  category: string;
  pauses: Array<{
    start: string;
    end?: string;
    duration?: string;
  }>;
  notes?: string;
  attachments: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  overtime: boolean;
  status: string;
  created_at: string;
}

export interface TimeReport {
  period: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  overtime_hours: number;
  entries_count: number;
}

export interface ArbeitszeitErfassungForm {
  order_id?: number;
  category: string;
  notes?: string;
  start_time?: string;
} 