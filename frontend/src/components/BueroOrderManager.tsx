'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Order {
  id: number;
  type: string;
  description: string;
  assigned_user: string;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
  elevator_id: number | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface OrderFormData {
  type: string;
  description: string;
  assigned_user: string;
  planned_start: string;
  planned_end: string;
  status: string;
  elevator_id: number | null;
  priority: string;
}

const BueroOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    type: '',
    description: '',
    assigned_user: '',
    planned_start: '',
    planned_end: '',
    status: 'Open',
    elevator_id: null,
    priority: 'Medium'
  });

  // API-Konfiguration
  const api = axios.create({
    baseURL: 'http://localhost:5002',
    withCredentials: true,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  // Daten laden mit Error-Handling
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallele API-Calls
      const [ordersResponse, usersResponse] = await Promise.all([
        api.get('/api/orders'),
        api.get('/api/users/available')
      ]);

      setOrders(ordersResponse.data);
      setUsers(usersResponse.data);
      
    } catch (err: any) {
      console.error('Fehler beim Laden der Daten:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Automatisches Laden und Re-Fetch
  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Order erstellen/bearbeiten
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingOrder) {
        // Update
        await api.put(`/api/orders/${editingOrder.id}`, formData);
      } else {
        // Create
        await api.post('/api/orders', formData);
      }
      
      // Form zurücksetzen und Re-Fetch
      setShowForm(false);
      setEditingOrder(null);
      setFormData({
        type: '',
        description: '',
        assigned_user: '',
        planned_start: '',
        planned_end: '',
        status: 'Open',
        elevator_id: null,
        priority: 'Medium'
      });
      
      // Force Re-Fetch
      setRefreshKey(prev => prev + 1);
      
    } catch (err: any) {
      console.error('Fehler beim Speichern:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  // Order bearbeiten
  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      type: order.type,
      description: order.description,
      assigned_user: order.assigned_user,
      planned_start: order.planned_start || '',
      planned_end: order.planned_end || '',
      status: order.status,
      elevator_id: order.elevator_id,
      priority: order.priority
    });
    setShowForm(true);
  };

  // Order stornieren (Soft-Delete)
  const handleCancel = async (orderId: number) => {
    if (!confirm('Möchten Sie diesen Auftrag wirklich stornieren?')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/api/orders/${orderId}`);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Fehler beim Stornieren:', err);
      setError(err.response?.data?.error || 'Fehler beim Stornieren');
    } finally {
      setLoading(false);
    }
  };

  // Status-Farbe
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prioritäts-Farbe
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Aufträge verwalten</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Neuer Auftrag
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">
            {editingOrder ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  <option value="Reparatur">Reparatur</option>
                  <option value="Wartung">Wartung</option>
                  <option value="Modernisierung">Modernisierung</option>
                  <option value="Neubau">Neubau</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zugewiesener Mitarbeiter
                </label>
                <select
                  value={formData.assigned_user}
                  onChange={(e) => setFormData({...formData, assigned_user: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Bitte wählen...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.email}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="Open">Offen</option>
                  <option value="In Progress">In Bearbeitung</option>
                  <option value="Completed">Abgeschlossen</option>
                  <option value="Cancelled">Storniert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorität
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="Low">Niedrig</option>
                  <option value="Medium">Mittel</option>
                  <option value="High">Hoch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geplanter Start
                </label>
                <input
                  type="datetime-local"
                  value={formData.planned_start}
                  onChange={(e) => setFormData({...formData, planned_start: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geplantes Ende
                </label>
                <input
                  type="datetime-local"
                  value={formData.planned_end}
                  onChange={(e) => setFormData({...formData, planned_end: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Beschreibung des Auftrags..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingOrder(null);
                  setFormData({
                    type: '',
                    description: '',
                    assigned_user: '',
                    planned_start: '',
                    planned_end: '',
                    status: 'Open',
                    elevator_id: null,
                    priority: 'Medium'
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Speichern...' : (editingOrder ? 'Aktualisieren' : 'Erstellen')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Aufträge ({orders.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zugewiesen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorität
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geplant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={order.description}>
                      {order.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.assigned_user || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.planned_start ? (
                      <div>
                        <div>{new Date(order.planned_start).toLocaleDateString('de-DE')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.planned_start).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Bearbeiten
                      </button>
                      {order.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Stornieren
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BueroOrderManager; 