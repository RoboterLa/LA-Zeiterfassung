import React, { useState, useEffect } from 'react';
import GenericCrudTable from '../components/GenericCrudTable';
import GenericForm from '../components/GenericForm';
import { arbeitszeitAPI } from '../services/api';

const ArbeitszeitPage = () => {
  const [arbeitszeit, setArbeitszeit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadArbeitszeit();
  }, []);

  const loadArbeitszeit = async () => {
    try {
      setLoading(true);
      const response = await arbeitszeitAPI.getAll();
      setArbeitszeit(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Arbeitszeit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      try {
        await arbeitszeitAPI.delete(item.id);
        await loadArbeitszeit();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await arbeitszeitAPI.update(editingItem.id, formData);
      } else {
        await arbeitszeitAPI.create(formData);
      }
      setShowForm(false);
      await loadArbeitszeit();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      throw error;
    }
  };

  const columns = [
    { key: 'datum', label: 'Datum', type: 'date' },
    { key: 'start', label: 'Start', type: 'time' },
    { key: 'ende', label: 'Ende', type: 'time' },
    { key: 'pause', label: 'Pause', type: 'time' },
    { key: 'gesamt', label: 'Gesamt', type: 'time' },
    { key: 'mitarbeiter', label: 'Mitarbeiter', type: 'text' },
  ];

  const formFields = [
    {
      name: 'datum',
      label: 'Datum',
      type: 'date',
      required: true,
    },
    {
      name: 'start',
      label: 'Startzeit',
      type: 'time',
      required: true,
    },
    {
      name: 'ende',
      label: 'Endzeit',
      type: 'time',
      required: false,
    },
    {
      name: 'pause',
      label: 'Pause',
      type: 'time',
      required: false,
      help: 'Format: HH:MM (z.B. 00:30 für 30 Minuten)',
    },
    {
      name: 'gesamt',
      label: 'Gesamtzeit',
      type: 'time',
      required: false,
      help: 'Wird automatisch berechnet',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Arbeitszeit</h1>
        <p className="mt-2 text-gray-600">
          Verwalten Sie Ihre Arbeitszeiten und Pausen
        </p>
      </div>

      {showForm ? (
        <div className="mb-8">
          <GenericForm
            fields={formFields}
            onSubmit={handleSubmit}
            initialData={editingItem}
            title={editingItem ? 'Arbeitszeit bearbeiten' : 'Neue Arbeitszeit'}
            submitText={editingItem ? 'Aktualisieren' : 'Erstellen'}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <GenericCrudTable
          data={arbeitszeit}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          title="Arbeitszeit Einträge"
          addButtonText="Neue Arbeitszeit"
        />
      )}
    </div>
  );
};

export default ArbeitszeitPage; 