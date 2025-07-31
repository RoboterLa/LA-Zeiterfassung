'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Elevator {
  id: number;
  manufacturer: string;
  model: string;
  type: string;
  installation_date: string | null;
  location_address: string;
  components: string | null;
  created_at: string;
  updated_at: string;
}

export default function ElevatorsPage() {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingElevator, setEditingElevator] = useState<Elevator | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchElevators();
  }, []);

  const fetchElevators = async () => {
    try {
      const response = await fetch('/api/elevators');
      if (response.ok) {
        const data = await response.json();
        setElevators(data);
      }
    } catch (error) {
      console.error('Error fetching elevators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (elevatorId: number) => {
    if (!confirm('Möchten Sie diese Aufzugsanlage wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/elevators/${elevatorId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchElevators();
      }
    } catch (error) {
      console.error('Error deleting elevator:', error);
    }
  };

  const filteredElevators = elevators.filter(elevator =>
    elevator.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elevator.location_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elevator.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Passenger': return 'bg-blue-100 text-blue-800';
      case 'Freight': return 'bg-green-100 text-green-800';
      case 'Hydraulic': return 'bg-purple-100 text-purple-800';
      case 'Traction': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Aufzugsanlagen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/buero" className="text-blue-200 hover:text-white mr-4">
                ← Zurück
              </Link>
              <h1 className="text-2xl font-bold">Stammdaten verwalten</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            >
              Neue Aufzugsanlage anlegen
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <Link 
              href="/buero"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/buero/orders"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 font-medium"
            >
              Aufträge verwalten
            </Link>
            <Link 
              href="/buero/elevators"
              className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 font-medium"
            >
              Stammdaten verwalten
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Suche nach Hersteller, Adresse oder Modell..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredElevators.length} von {elevators.length} Anlagen
          </div>
        </div>

        {/* Elevators Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alle Aufzugsanlagen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hersteller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modell
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Installation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredElevators.map((elevator) => (
                  <tr key={elevator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{elevator.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {elevator.manufacturer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {elevator.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(elevator.type)}`}>
                        {elevator.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={elevator.location_address}>
                        {elevator.location_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {elevator.installation_date ? new Date(elevator.installation_date).toLocaleDateString('de-DE') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingElevator(elevator)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(elevator.id)}
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

        {/* Elevator Form Modal */}
        {showForm && (
          <ElevatorForm
            elevator={editingElevator}
            onClose={() => {
              setShowForm(false);
              setEditingElevator(null);
            }}
            onSave={() => {
              fetchElevators();
              setShowForm(false);
              setEditingElevator(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

// Elevator Form Component
function ElevatorForm({ 
  elevator, 
  onClose, 
  onSave 
}: { 
  elevator: Elevator | null; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [formData, setFormData] = useState({
    manufacturer: elevator?.manufacturer || '',
    model: elevator?.model || '',
    type: elevator?.type || '',
    installation_date: elevator?.installation_date ? elevator.installation_date.split('T')[0] : '',
    location_address: elevator?.location_address || '',
    components: elevator?.components || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = elevator ? `/api/elevators/${elevator.id}` : '/api/elevators';
      const method = elevator ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          installation_date: formData.installation_date || null,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving elevator:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {elevator ? 'Aufzugsanlage bearbeiten' : 'Neue Aufzugsanlage anlegen'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hersteller</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Modell</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Typ</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Bitte wählen</option>
                <option value="Passenger">Personenaufzug</option>
                <option value="Freight">Lastenaufzug</option>
                <option value="Hydraulic">Hydraulikaufzug</option>
                <option value="Traction">Treibscheibenaufzug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Installationsdatum</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({...formData, installation_date: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({...formData, location_address: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Komponenten (JSON)</label>
              <textarea
                value={formData.components}
                onChange={(e) => setFormData({...formData, components: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder='[{"name": "Tür", "install_date": "2023-01-01"}]'
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                {elevator ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 