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

interface Order {
  id: number;
  type: string;
  description: string;
  assigned_user: string;
  planned_start: string;
  planned_end: string;
  status: string;
  elevator_id: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface OrderFormData {
  type: string;
  description: string;
  assigned_user: string;
  planned_start: string;
  planned_end: string;
  priority: string;
  elevator_id?: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    type: '',
    description: '',
    assigned_user: '',
    planned_start: '',
    planned_end: '',
    priority: 'Medium'
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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
      loadOrders();
      loadAvailableUsers();
    }
  }, [user]);

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
      const url = editingOrder 
        ? `http://localhost:5002/api/orders/${editingOrder.id}`
        : 'http://localhost:5002/api/orders';
      
      const method = editingOrder ? 'PUT' : 'POST';
      
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
        setEditingOrder(null);
        setFormData({
          type: '',
          description: '',
          assigned_user: '',
          planned_start: '',
          planned_end: '',
          priority: 'Medium'
        });
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      type: order.type,
      description: order.description,
      assigned_user: order.assigned_user,
      planned_start: order.planned_start ? order.planned_start.slice(0, 16) : '',
      planned_end: order.planned_end ? order.planned_end.slice(0, 16) : '',
      priority: order.priority
    });
    setShowForm(true);
  };

  const handleCancel = async (orderId: number) => {
    if (confirm('Auftrag wirklich stornieren?')) {
      try {
        const response = await fetch(`http://localhost:5002/api/orders/${orderId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (response.ok) {
          loadOrders();
        }
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const typeMatch = filterType === 'all' || order.type === filterType;
    return statusMatch && typeMatch;
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
          <h1 className="text-3xl font-bold text-gray-900">Aufträge verwalten</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Neuer Auftrag
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
                <option value="Open">Offen</option>
                <option value="In Progress">In Bearbeitung</option>
                <option value="Completed">Abgeschlossen</option>
                <option value="Cancelled">Storniert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Alle</option>
                <option value="Reparatur">Reparatur</option>
                <option value="Modernisierung">Modernisierung</option>
                <option value="Neubau">Neubau</option>
                <option value="Wartung">Wartung</option>
              </select>
            </div>
          </div>
        </div>

        {/* Order Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingOrder ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Typ wählen</option>
                    <option value="Reparatur">Reparatur</option>
                    <option value="Modernisierung">Modernisierung</option>
                    <option value="Neubau">Neubau</option>
                    <option value="Wartung">Wartung</option>
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zugewiesener Mitarbeiter
                  </label>
                  <select
                    value={formData.assigned_user}
                    onChange={(e) => setFormData({...formData, assigned_user: e.target.value})}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geplante Startzeit
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
                    Geplante Endzeit
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.planned_end}
                    onChange={(e) => setFormData({...formData, planned_end: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
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
                      priority: 'Medium'
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
                  {editingOrder ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Zugewiesen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Priorität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Aktionen
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
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
                      {order.assigned_user || 'Nicht zugewiesen'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.priority === 'High' ? 'bg-red-100 text-red-800' :
                        order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.priority}
                      </span>
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
    </div>
  );
} 