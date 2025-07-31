import axios from 'axios';
import { 
  DashboardData, 
  TimeEntry, 
  Arbeitszeit, 
  Auftrag, 
  Urlaub,
  UrlaubForm,
  ArbeitszeitState,
  ApiResponse,
  ZeiterfassungForm,
  ArbeitszeitForm,
  ArbeitszeitErfassung,
  ArbeitszeitErfassungForm,
  TimeReport
} from '@/types';

// API-Basis-URL - Azure Production
const API_BASE_URL = 'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net';

// Axios-Instanz mit Standard-Konfiguration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Für Session-Cookies
});

// Request Interceptor für Auth-Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor für Error-Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await api.get('/', {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback-Daten zurückgeben
      return {
        user: {
          id: '1',
          name: 'Dev User',
          email: 'dev@example.com',
          is_admin: true,
          can_approve: true
        },
        dashboard_data: {
          stoerungen: [],
          auftraege: [
            {
              id: '1',
              art: 'Reparatur',
              uhrzeit: '07:30',
              standort: 'Hauptbahnhof, München',
              coords: [48.1402, 11.5586],
              details: 'Aufzug klemmt, Notruf ausgelöst.',
              done: false
            },
            {
              id: '2',
              art: 'Wartung',
              uhrzeit: '08:15',
              standort: 'Sendlinger Tor, München',
              coords: [48.1325, 11.5674],
              details: 'Regelmäßige Wartung, Ölwechsel.',
              done: false
            },
            {
              id: '3',
              art: 'Modernisierung',
              uhrzeit: '09:00',
              standort: 'Odeonsplatz, München',
              coords: [48.1421, 11.5802],
              details: 'Umbau Steuerung, neue Kabine.',
              done: false
            }
          ],
          heutige_arbeitszeit: [],
          urlaub: [],
          offene_zeiteintraege: [],
          letzte_zeiteintraege: [],
          auftraege_offen: 1,
          auftraege_erledigt: 0,
          auftragsarten: {},
          naechster_auftrag_uhrzeit: '07:30',
          naechster_auftrag_art: 'Reparatur',
          naechster_auftrag_standort: 'Hauptbahnhof, München',
          naechster_auftrag_coords: [48.1402, 11.5586],
          verbleibende_zeit: '2:30h',
          pending_count: 0,
          resturlaub: 30,
          tage_verbraucht: undefined,
          tage_verplant: undefined,
          tage_uebrig: undefined,
          aktueller_urlaub: undefined,
          naechster_urlaub: undefined
        }
      };
    }
  },
};

// Zeiterfassung API
export const zeiterfassungApi = {
  getEntries: async (filters?: {
    filter_text?: string;
    filter_activity?: string;
    filter_elevator?: string;
    filter_date_type?: string;
    filter_date_start?: string;
    filter_date_end?: string;
  }): Promise<TimeEntry[]> => {
    try {
      const response = await api.get('/entries', { params: filters });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching entries:', error);
      return [];
    }
  },

  addEntry: async (entry: ZeiterfassungForm): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.post('/add_entry', entry);
    return response.data;
  },

  editEntry: async (id: string, entry: ZeiterfassungForm): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.post(`/edit_entry/${id}`, entry);
    return response.data;
  },

  deleteEntry: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/delete_entry/${id}`);
    return response.data;
  },

  approveEntry: async (id: string, comment?: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/approve_entry/${id}`, { comment });
    return response.data;
  },

  rejectEntry: async (id: string, comment?: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/reject_entry/${id}`, { comment });
    return response.data;
  },
};

// Arbeitszeit API
export const arbeitszeitApi = {
  getArbeitszeit: async (filters?: {
    q?: string;
    month?: number;
    year?: number;
  }): Promise<Arbeitszeit[]> => {
    try {
      const response = await api.get('/arbeitszeit', { 
        params: filters,
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching arbeitszeit:', error);
      return [];
    }
  },

  addArbeitszeit: async (entry: ArbeitszeitForm): Promise<ApiResponse<Arbeitszeit>> => {
    try {
      const response = await api.post('/arbeitszeit', entry, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding arbeitszeit:', error);
      return { status: 'error', message: 'Fehler beim Hinzufügen des Eintrags' };
    }
  },

  editArbeitszeit: async (id: string, entry: ArbeitszeitForm): Promise<ApiResponse<Arbeitszeit>> => {
    try {
      const response = await api.post(`/arbeitszeit/edit/${id}`, entry, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error editing arbeitszeit:', error);
      return { status: 'error', message: 'Fehler beim Bearbeiten des Eintrags' };
    }
  },

  deleteArbeitszeit: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post(`/arbeitszeit/delete/${id}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting arbeitszeit:', error);
      return { status: 'error', message: 'Fehler beim Löschen des Eintrags' };
    }
  },

  saveSession: async (state: ArbeitszeitState): Promise<ApiResponse<void>> => {
    const response = await api.post('/arbeitszeit/save_session', {
      arbeitszeit_data: {
        start: state.start?.toISOString(),
        gesamt: state.gesamt,
        events: state.events.map(ev => ({
          ...ev,
          time: ev.time.toISOString()
        }))
      }
    });
    return response.data;
  },
};

// Aufträge API
export const auftraegeApi = {
  getAuftraege: async (): Promise<Auftrag[]> => {
    try {
      const response = await api.get('/api/auftraege', {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching auftraege:', error);
      return [];
    }
  },

  addAuftrag: async (auftrag: Omit<Auftrag, 'id'>): Promise<ApiResponse<Auftrag>> => {
    const response = await api.post('/api/auftraege', auftrag);
    return response.data;
  },

  updateAuftrag: async (id: string, updates: Partial<Auftrag>): Promise<ApiResponse<Auftrag>> => {
    const response = await api.post('/api/auftraege', { id, ...updates });
    return response.data;
  },

  deleteAuftrag: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/auftraege/${id}`);
    return response.data;
  },
};

// Urlaub API
export const urlaubApi = {
  getUrlaube: async (): Promise<Urlaub[]> => {
    try {
      const response = await api.get('/urlaub', {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching urlaub:', error);
      return [];
    }
  },

  addUrlaub: async (urlaub: UrlaubForm): Promise<ApiResponse<Urlaub>> => {
    try {
      const response = await api.post('/urlaub', urlaub, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding urlaub:', error);
      return { status: 'error', message: 'Fehler beim Hinzufügen des Urlaubs' };
    }
  },

  updateUrlaub: async (id: string, updates: UrlaubForm): Promise<ApiResponse<Urlaub>> => {
    try {
      const response = await api.put(`/urlaub/${id}`, updates, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating urlaub:', error);
      return { status: 'error', message: 'Fehler beim Bearbeiten des Urlaubs' };
    }
  },

  deleteUrlaub: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/urlaub/${id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting urlaub:', error);
      return { status: 'error', message: 'Fehler beim Löschen des Urlaubs' };
    }
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/api/user');
    return response.data;
  },
};

// Utility-Funktionen
export const formatTime = (time: string): string => {
  return time.slice(0, 5); // "HH:MM" Format
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('de-DE');
};

export const calculateDuration = (start: string, end: string): string => {
  const startTime = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
};

// Neue erweiterte Arbeitszeiterfassung API
export const arbeitszeitErfassungApi = {
  getEntries: async (): Promise<ArbeitszeitErfassung[]> => {
    try {
      const response = await api.get('/api/arbeitszeit-erfassung');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching arbeitszeit erfassung:', error);
      return [];
    }
  },

  createEntry: async (entry: ArbeitszeitErfassungForm): Promise<ApiResponse<ArbeitszeitErfassung>> => {
    try {
      const response = await api.post('/api/arbeitszeit-erfassung', entry);
      return response.data;
    } catch (error) {
      console.error('Error creating arbeitszeit erfassung:', error);
      return { status: 'error', message: 'Fehler beim Erstellen der Erfassung' };
    }
  },

  updateEntry: async (id: number, updates: Partial<ArbeitszeitErfassung>): Promise<ApiResponse<ArbeitszeitErfassung>> => {
    try {
      const response = await api.put(`/api/arbeitszeit-erfassung/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating arbeitszeit erfassung:', error);
      return { status: 'error', message: 'Fehler beim Aktualisieren der Erfassung' };
    }
  },

  deleteEntry: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/api/arbeitszeit-erfassung/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting arbeitszeit erfassung:', error);
      return { status: 'error', message: 'Fehler beim Löschen der Erfassung' };
    }
  },

  startPause: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post(`/api/arbeitszeit-erfassung/${id}/pause`, { action: 'start' });
      return response.data;
    } catch (error) {
      console.error('Error starting pause:', error);
      return { status: 'error', message: 'Fehler beim Starten der Pause' };
    }
  },

  stopPause: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post(`/api/arbeitszeit-erfassung/${id}/pause`, { action: 'stop' });
      return response.data;
    } catch (error) {
      console.error('Error stopping pause:', error);
      return { status: 'error', message: 'Fehler beim Beenden der Pause' };
    }
  },

  getReports: async (period?: string): Promise<TimeReport[]> => {
    try {
      const params = period ? { period } : {};
      const response = await api.get('/api/arbeitszeit-report', { params });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },
}; 