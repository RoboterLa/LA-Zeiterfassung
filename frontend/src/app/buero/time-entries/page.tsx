'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  can_approve: boolean;
}

interface TimeEntry {
  id: number;
  order_id: number | null;
  technician_id: string;
  start_time: string;
  end_time: string | null;
  duration: string | null;
  category: string;
  pauses: string | null;
  notes: string | null;
  attachments: string | null;
  overtime: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  type: string;
  description: string;
  assigned_user: string;
}

interface TimeEntryFormData {
  order_id: number | null;
  technician_id: string;
  start_time: string;
  end_time: string;
  category: string;
  notes: string;
  overtime: boolean;
}

export default function TimeEntriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    order_id: null,
    technician_id: '',
    start_time: '',
    end_time: '',
    category: 'Arbeitszeit',
    notes: '',
    overtime: false
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.role === 'Buero' || userData.role === 'Admin') {
            setUser(userData);
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Load Data
  useEffect(() => {
    if (user) {
      loadTimeEntries();
      loadOrders();
      loadAvailableUsers();
    }
  }, [user]);

  const loadTimeEntries = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/time-entries', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data);
      }
    } catch (error) {
      console.error('Failed to load time entries:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/orders', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/users/available', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingEntry 
        ? `http://localhost:5002/api/time-entries/${editingEntry.id}`
        : 'http://localhost:5002/api/time-entries';
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingEntry(null);
        setFormData({
          order_id: null,
          technician_id: '',
          start_time: '',
          end_time: '',
          category: 'Arbeitszeit',
          notes: '',
          overtime: false
        });
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      order_id: entry.order_id,
      technician_id: entry.technician_id,
      start_time: entry.start_time ? entry.start_time.slice(0, 16) : '',
      end_time: entry.end_time ? entry.end_time.slice(0, 16) : '',
      category: entry.category,
      notes: entry.notes || '',
      overtime: entry.overtime
    });
    setShowForm(true);
  };

  const handleDelete = async (entryId: number) => {
    if (confirm('Zeiteintrag wirklich löschen?')) {
      try {
        const response = await fetch(`http://localhost:5002/api/time-entries/${entryId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (response.ok) {
          loadTimeEntries();
        }
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  const getOrderDescription = (orderId: number | null) => {
    if (!orderId) return 'Freie Erfassung';
    const order = orders.find(o => o.id === orderId);
    return order ? `${order.type}: ${order.description}` : 'Unbekannter Auftrag';
  };

  const getUserName = (email: string) => {
    const user = availableUsers.find(u => u.email === email);
    return user ? user.name : email;
  };

  const filteredEntries = timeEntries.filter(entry => {
    const statusMatch = filterStatus === 'all' || entry.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || entry.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Zeiterfassung verwalten</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Neuer Zeiteintrag
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Alle</option>
                <option value="offen">Offen</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="korrigiert">Korrigiert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Alle</option>
                <option value="Arbeitszeit">Arbeitszeit</option>
                <option value="Fahrtzeit">Fahrtzeit</option>
                <option value="Pause">Pause</option>
                <option value="Vorbereitung">Vorbereitung</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time Entry Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingEntry ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auftrag (optional)
                  </label>
                  <select
                    value={formData.order_id || ''}
                    onChange={(e) => setFormData({...formData, order_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Freie Erfassung</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        #{order.id} - {order.type}: {order.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mitarbeiter *
                  </label>
                  <select
                    required
                    value={formData.technician_id}
                    onChange={(e) => setFormData({...formData, technician_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Mitarbeiter wählen</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.email}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="Arbeitszeit">Arbeitszeit</option>
                    <option value="Fahrtzeit">Fahrtzeit</option>
                    <option value="Pause">Pause</option>
                    <option value="Vorbereitung">Vorbereitung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.overtime}
                    onChange={(e) => setFormData({...formData, overtime: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Überstunden</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                    setFormData({
                      order_id: null,
                      technician_id: '',
                      start_time: '',
                      end_time: '',
                      category: 'Arbeitszeit',
                      notes: '',
                      overtime: false
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingEntry ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Time Entries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Auftrag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Mitarbeiter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ende
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Aktionen
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{entry.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={getOrderDescription(entry.order_id)}>
                        {getOrderDescription(entry.order_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUserName(entry.technician_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.start_time ? new Date(entry.start_time).toLocaleString('de-DE') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.end_time ? new Date(entry.end_time).toLocaleString('de-DE') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.duration || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'abgeschlossen' ? 'bg-green-100 text-green-800' :
                        entry.status === 'korrigiert' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 