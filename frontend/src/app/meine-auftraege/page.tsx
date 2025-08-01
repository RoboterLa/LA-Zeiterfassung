'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import RoutePlanner from '@/components/RoutePlanner';
import { auftraegeApi } from '@/services/api';
import { Auftrag } from '@/types';

// Erweiterte Typen für das neue Feature
interface OrderDetails {
  id: number;
  type: 'Reparatur' | 'Modernisierung' | 'Neubau' | 'Wartung';
  description: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  required_parts?: Array<{part_id: number, quantity: number, name: string}>;
  notes?: string;
  photos?: string[];
  customer: {
    name: string;
    contact_person: string;
    phone: string;
    address: string;
  };
  elevator: {
    id: number;
    manufacturer: string;
    model: string;
    type: string;
    installation_date: string;
    last_maintenance: string;
    status: string;
    location_address: string;
    location_gps: [number, number];
    capacity: number;
    floors: number;
    health_score: number;
  };
  technician: {
    id: number;
    name: string;
    email: string;
    phone: string;
    current_location?: [number, number];
    skills: string[];
  };
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  original?: string;
}

interface TimeEntryForm {
  order_id: number;
  start_time: string;
  end_time?: string;
  duration?: string;
  notes?: string;
}

export default function MeineAuftraegePage() {
  // State für Aufträge und Navigation
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showPartsRequest, setShowPartsRequest] = useState(false);
  
  // State für Karte und Navigation
  const [startCoords, setStartCoords] = useState<[number, number]>([48.1351, 11.5820]);
  const [startAddress, setStartAddress] = useState('Betriebshof, München');
  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return `${today}T08:00`; // Default to 8:00 AM today
  });
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [forceRecalculate, setForceRecalculate] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OrderDetails[]>([]);
  

  
  // State für UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  // State für neue Aufträge
  const [newOrderForm, setNewOrderForm] = useState({
    type: 'Reparatur' as OrderDetails['type'],
    description: '',
    planned_start: '',
    planned_end: '',
    priority: 'Medium' as const,
    customer_name: '',
    contact_person: '',
    phone: '',
    address: '',
    manufacturer: 'ThyssenKrupp',
    model: 'TE-GL',
    elevator_type: 'Personenaufzug',
    capacity: 1000,
    floors: 8,
    notes: ''
  });
  
  // State für Zeiterfassung
  const [timeEntryForm, setTimeEntryForm] = useState<TimeEntryForm>({
    order_id: 0,
    start_time: '',
    end_time: '',
    notes: ''
  });
  
  // State für Fotos und Dokumente
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoNotes, setPhotoNotes] = useState('');
  
  // State für Teile-Anforderung
  const [selectedParts, setSelectedParts] = useState<Array<{part_id: number, quantity: number, name: string}>>([]);
  const [partsRequestNotes, setPartsRequestNotes] = useState('');
  
  // Refs für Karte
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  // Haversine distance calculation
  const haversine = (a: [number, number], b: [number, number]): number => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const x = dLat/2, y = dLon/2;
    const h = Math.sin(x)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(y)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  };

  // Geocode address using OpenStreetMap Nominatim
  const geocodeAddress = async (address: string): Promise<[number, number]> => {
    try {
      // Add Munich region bias for better local results
      const searchQuery = `${address}, München, Bayern, Deutschland`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=de&viewbox=11.3,48.0,11.8,48.2&bounded=1&limit=1`);
      const data = await response.json();
      
      // Filter for German results
      const germanResults = data.filter((item: any) => {
        const displayName = item.display_name.toLowerCase();
        return displayName.includes('deutschland') || displayName.includes('germany') || displayName.includes('bayern') || displayName.includes('münchen') || displayName.includes('muenchen');
      });
      
      if (germanResults && germanResults[0]) {
        return [parseFloat(germanResults[0].lat), parseFloat(germanResults[0].lon)];
      } else if (data && data[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      } else {
        throw new Error('Adresse nicht gefunden!');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return [48.1351, 11.5820]; // Fallback to München
    }
  };

  // Show address suggestions
  const showAddressSuggestions = async (query: string) => {
    const input = query.trim();
    
    if (input.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=5&addressdetails=1&countrycodes=de`;
      
      const response = await fetch(nominatimUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const suggestions = data.map((item: any) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        }));
        
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
        
        // Auto-select if only one suggestion
        if (suggestions.length === 1) {
          handleAddressSelect(suggestions[0]);
        }
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Load orders from API
  const loadOrders = async (forceReload = false) => {
    try {
      // Nur laden wenn nicht bereits geladen oder forceReload true ist
      if (orders.length > 0 && !forceReload) {
        return;
      }
      
      setLoading(true);
      
      // Lade echte Daten vom Backend
      const csvOrders = await auftraegeApi.getAuftraege();
      
      // Konvertiere CSV-Daten in OrderDetails Format
      const realOrders: OrderDetails[] = csvOrders.map((csvOrder: any) => ({
        id: parseInt(csvOrder.id),
        type: csvOrder.art as any,
        description: csvOrder.details || 'Keine Beschreibung verfügbar',
        planned_start: `2025-07-27T${csvOrder.uhrzeit}:00`,
        planned_end: `2025-07-27T${csvOrder.uhrzeit}:00`,
        priority: 'Medium',
        status: csvOrder.done ? 'Completed' : 'Open',
        customer: {
          name: csvOrder.standort.split(',')[0] || 'Unbekannter Kunde',
          contact_person: 'Kontakt',
          phone: '+49 89 123456',
          address: csvOrder.standort
        },
        elevator: {
          id: parseInt(csvOrder.id),
          manufacturer: 'Unbekannt',
          model: 'Standard',
          type: 'Personenaufzug',
          installation_date: '2020-01-01',
          last_maintenance: '2025-06-15',
          status: csvOrder.done ? 'Erledigt' : 'Offen',
          location_address: csvOrder.standort,
          location_gps: csvOrder.coords || [48.1351, 11.5820],
          capacity: 1000,
          floors: 8,
          health_score: 85
        },
        technician: {
          id: 1,
          name: 'Robert Lackner',
          email: 'robert.lackner@lackner-aufzuege.com',
          phone: '+49 89 987654',
          skills: ['Reparatur', 'Wartung', 'Modernisierung']
        }
      }));
      
      setOrders(realOrders);
      setFilteredOrders(realOrders);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Aufträge:', err);
      setError('Fehler beim Laden der Aufträge');
      
      // Fallback zu Mock-Daten wenn API fehlschlägt
      const mockOrders: OrderDetails[] = [
        {
          id: 1,
          type: 'Reparatur',
          description: 'Türkontakt defekt - Notruf ausgelöst',
          planned_start: '2025-07-27T08:00:00',
          planned_end: '2025-07-27T12:00:00',
          priority: 'High',
          status: 'Open',
          customer: {
            name: 'Münchner Hauptbahnhof',
            contact_person: 'Herr Schmidt',
            phone: '+49 89 123456',
            address: 'Bayerstraße 10a, 80335 München'
          },
          elevator: {
            id: 101,
            manufacturer: 'ThyssenKrupp',
            model: 'TE-GL',
            type: 'Personenaufzug',
            installation_date: '2018-03-15',
            last_maintenance: '2025-06-15',
            status: 'Betriebsbereit',
            location_address: 'Bayerstraße 10a, 80335 München',
            location_gps: [48.1402, 11.5586],
            capacity: 1000,
            floors: 8,
            health_score: 85
          },
          technician: {
            id: 1,
            name: 'Robert Lackner',
            email: 'robert.lackner@lackner-aufzuege.com',
            phone: '+49 89 987654',
            skills: ['Reparatur', 'Wartung', 'Modernisierung']
          }
        }
      ];
      
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          setStartCoords(coords);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
              setStartAddress(data.display_name);
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Initialize map
  const initMap = async () => {
    if (!mapRef.current) return;

    try {
      const L = await import('leaflet');
      
      mapInstanceRef.current = L.map(mapRef.current).setView(startCoords, 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      
      // Add current location marker
      if (currentLocation) {
        L.marker(currentLocation, {
          icon: L.divIcon({
            className: 'custom-current-marker',
            html: '<div style="background:#0066b3;color:#fff;border-radius:50%;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff;">📍</div>'
          })
        }).addTo(mapInstanceRef.current);
      }
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Render orders on map
  const renderOrdersOnMap = async () => {
    if (!mapInstanceRef.current) return;

    try {
      const L = await import('leaflet');
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add markers for each order
      filteredOrders.forEach((order, index) => {
        const markerColor = getMarkerColor(order.type);
        const marker = L.marker(order.elevator.location_gps, {
          icon: L.divIcon({
            className: 'custom-order-marker',
            html: `<div style="background:${markerColor};color:#fff;border-radius:50%;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff;">${index + 1}</div>`
          })
        }).addTo(mapInstanceRef.current);
        
        // Add popup
        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${order.type}</h3>
            <p class="text-sm"><strong>Adresse:</strong> ${order.elevator.location_address}</p>
            <p class="text-sm"><strong>Kunde:</strong> ${order.customer.name}</p>
            <p class="text-sm"><strong>Zeit:</strong> ${new Date(order.planned_start).toLocaleString('de-DE')}</p>
            <p class="text-sm"><strong>Priorität:</strong> ${order.priority}</p>
            <button onclick="window.selectOrder(${order.id})" class="mt-2 bg-[#0066b3] text-white px-2 py-1 rounded text-xs">
              Details anzeigen
            </button>
          </div>
        `);
        
        // Add click handler
        marker.on('click', () => {
          setSelectedOrder(order);
          setShowOrderDetails(true);
        });
        
        markersRef.current.push(marker);
      });
      
    } catch (error) {
      console.error('Error rendering orders:', error);
    }
  };

  // Get marker color based on order type
  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'Reparatur': return '#dc2626'; // Red
      case 'Wartung': return '#0066b3'; // Blue
      case 'Neubau': return '#059669'; // Green
      case 'Modernisierung': return '#d97706'; // Yellow
      default: return '#6b7280'; // Gray
    }
  };



  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: OrderDetails['status']) => {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      // Call backend API to update the status
      const isDone = newStatus === 'Completed';
      console.log(`Sending API request: orderId=${orderId}, done=${isDone}`);
      
      const response = await auftraegeApi.updateAuftrag(orderId.toString(), { done: isDone });
      console.log('API response:', response);
      
      // Reload orders from backend to ensure consistency
      console.log('Reloading orders from backend...');
      await loadOrders(true);
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Handle order reopen (change status back to Open)
  const handleOrderReopen = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId, 'Open');
      console.log(`Order ${orderId} reopened successfully`);
    } catch (error) {
      console.error('Error reopening order:', error);
    }
  };

  // Handle time entry
  const handleTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would call your API to save the time entry
      console.log('Time entry saved:', timeEntryForm);
      setShowTimeEntry(false);
      setTimeEntryForm({ order_id: 0, start_time: '', end_time: '', notes: '' });
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would upload photos to your server
      console.log('Photos uploaded:', uploadedPhotos);
      setShowPhotoUpload(false);
      setUploadedPhotos([]);
      setPhotoNotes('');
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  // Handle parts request
  const handlePartsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would send the parts request
      console.log('Parts request:', { selectedParts, partsRequestNotes });
      setShowPartsRequest(false);
      setSelectedParts([]);
      setPartsRequestNotes('');
    } catch (error) {
      console.error('Error requesting parts:', error);
    }
  };

  // Handle address input
  const handleAddressInput = (value: string) => {
    setStartAddress(value);
    
    if (value.length >= 2) {
      showAddressSuggestions(value);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle manual address entry (when user types and presses Enter or loses focus)
  const handleAddressBlur = async () => {
    if (startAddress && startAddress.trim().length > 0) {
      try {
        const coords = await geocodeAddress(startAddress);
        setStartCoords(coords);
      } catch (error) {
        // Silent fail
      }
    }
  };

  // Handle address selection
  const handleAddressSelect = async (suggestion: AddressSuggestion) => {
    setStartAddress(suggestion.display_name);
    
    const coords = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)] as [number, number];
    setStartCoords(coords);
    setShowSuggestions(false);
  };

  // Initialize on mount
  useEffect(() => {
    loadOrders();
    // Don't automatically get current location on mount
    // getCurrentLocation();
    initMap();
  }, []);

  // Auto-start route when orders are loaded (only once)
  useEffect(() => {
    if (filteredOrders.length > 0 && !routeStarted) {
      setRouteStarted(true);
      setForceRecalculate(true);
    }
  }, [filteredOrders.length, routeStarted]);

  // Re-render map when orders change (debounced)
  useEffect(() => {
    if (mapInstanceRef.current && filteredOrders.length > 0) {
      const timeoutId = setTimeout(() => {
        renderOrdersOnMap();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [filteredOrders.length]);



  // Make selectOrder available globally for map popups
  useEffect(() => {
    (window as any).selectOrder = (orderId: number) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetails(true);
      }
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066b3] mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Aufträge...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => loadOrders(true)}
              className="mt-4 bg-[#0066b3] text-white px-4 py-2 rounded"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 relative">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meine Aufträge</h1>
          <p className="text-gray-600">Verwalten Sie Ihre täglichen Aufträge und optimieren Sie Ihre Route</p>
        </div>

        {/* Start Box - Normal positioning */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Start</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
            {/* Start Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Startposition</label>
              <div className="relative">
                <input
                  type="text"
                  value={startAddress}
                  onChange={(e) => {
                    handleAddressInput(e.target.value);
                  }}
                  onFocus={() => {
                    if (startAddress.length >= 2) {
                      handleAddressInput(startAddress);
                    }
                  }}
                  onBlur={handleAddressBlur}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddressBlur();
                    }
                  }}
                  placeholder="z.B. Landsberger Straße, München"
                  className="w-full pr-12 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
                />
                <button
                  onClick={getCurrentLocation}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#0066b3] bg-white rounded-md border border-gray-200 hover:border-[#0066b3] transition-colors"
                  title="Aktuellen Standort verwenden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                
                
                {showSuggestions && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-[#0066b3]/10 border-b border-gray-100 last:border-b-0 text-gray-900 text-sm"
                        onClick={() => handleAddressSelect(suggestion)}
                      >
                        {suggestion.display_name}
                      </div>
                    ))}
                    {addressSuggestions.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Keine Vorschläge gefunden
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Startdatum</label>
              <input
                type="date"
                value={startDateTime.split('T')[0]}
                onChange={(e) => {
                  const time = startDateTime.split('T')[1] || '08:00';
                  setStartDateTime(`${e.target.value}T${time}`);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Startzeit</label>
              <select
                value={startDateTime.split('T')[1] || '08:00'}
                onChange={(e) => {
                  const date = startDateTime.split('T')[0];
                  setStartDateTime(`${date}T${e.target.value}`);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
              >
                {Array.from({ length: 145 }, (_, i) => {
                  // 6:00 to 18:00 with 5-minute intervals
                  const totalMinutes = 6 * 60 + i * 5; // Start at 6:00, 5-minute steps
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                  const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} Uhr`;
                  return (
                    <option key={timeStr} value={timeStr}>
                      {displayTime}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          
          {/* Buttons under the input fields */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={async () => {
                if (startAddress && startDateTime) {
                  // If coordinates are not set, try to geocode the address
                  if (!startCoords || (startCoords[0] === 48.1351 && startCoords[1] === 11.5820)) {
                    try {
                      const coords = await geocodeAddress(startAddress);
                      setStartCoords(coords);
                      
                      // Wait a bit for state to update, then start route
                      setTimeout(() => {
                        setRouteStarted(true);
                        setForceRecalculate(true); // Force recalculation
                      }, 100);
                    } catch (error) {
                      alert('Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.');
                      return;
                    }
                  } else {
                    setRouteStarted(true);
                    setForceRecalculate(true); // Force recalculation
                  }
                  
                  // Reset route to force recalculation
                  setOptimizedRoute([]);
                } else {
                  alert('Bitte geben Sie eine Startposition und Zeit ein.');
                }
              }}
              disabled={!startAddress || !startDateTime}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                startAddress && startDateTime
                  ? 'bg-[#0066b3] text-white hover:bg-[#0056a3]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {routeStarted ? 'Route neu starten' : 'Starten'}
            </button>
            <button
              onClick={() => {
                setRouteStarted(false);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Ändern
            </button>
          </div>
          

        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Route Planner with integrated order list */}

          
          <RoutePlanner
            orders={filteredOrders.map(order => ({
              id: order.id,
              type: order.type,
              description: order.description,
              location: order.elevator.location_address,
              coords: order.elevator.location_gps,
              planned_start: order.planned_start,
              priority: order.priority,
              status: order.status,
              customer: order.customer.name
            }))}
            startLocation={startCoords}
            startAddress={startAddress}
            startDateTime={startDateTime}
            forceRecalculate={forceRecalculate}
            key={`route-${startCoords[0]}-${startCoords[1]}-${routeStarted}-${forceRecalculate}`} // Force re-render when coords change
            onRouteUpdate={(route: any) => {
              // Reset forceRecalculate after route is updated
              setForceRecalculate(false);
            }}
            onOrderReject={(orderId: number) => {
              // Remove order from filtered orders
              setFilteredOrders(prev => prev.filter(order => order.id !== orderId));
            }}
            onOrderComplete={(orderId: number) => {
              // Update order status to completed
              setFilteredOrders(prev => prev.map(order => 
                order.id === orderId ? { ...order, status: 'Completed' } : order
              ));
            }}
            onTimeEntry={(orderId: number) => {
              // Handle time entry for completed orders
              // Here you can open a modal or navigate to time entry page
            }}
            onOrderReopen={handleOrderReopen}
          />
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Auftrag #{selectedOrder.id} - {selectedOrder.type}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Allgemeine Informationen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                      <p className="text-sm text-gray-900">{selectedOrder.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Geplante Zeit</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedOrder.planned_start).toLocaleString('de-DE')} - 
                        {new Date(selectedOrder.planned_end).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priorität</label>
                      <p className="text-sm text-gray-900">{selectedOrder.priority}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900">{selectedOrder.status}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kundeninformationen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kunde</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ansprechpartner</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.contact_person}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefon</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Elevator Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Anlageninformationen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hersteller</label>
                      <p className="text-sm text-gray-900">{selectedOrder.elevator.manufacturer}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Modell</label>
                      <p className="text-sm text-gray-900">{selectedOrder.elevator.model}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Typ</label>
                      <p className="text-sm text-gray-900">{selectedOrder.elevator.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Health Score</label>
                      <p className="text-sm text-gray-900">{selectedOrder.elevator.health_score}%</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setTimeEntryForm({
                          order_id: selectedOrder.id,
                          start_time: new Date().toISOString().slice(0, 16),
                          end_time: '',
                          notes: ''
                        });
                        setShowTimeEntry(true);
                        setShowOrderDetails(false);
                      }}
                      className="w-full bg-[#0066b3] text-white px-4 py-2 rounded hover:bg-[#005a9e]"
                    >
                      Zeit erfassen
                    </button>
                    <button
                      onClick={() => {
                        setShowPhotoUpload(true);
                        setShowOrderDetails(false);
                      }}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Fotos hochladen
                    </button>
                    <button
                      onClick={() => {
                        setShowPartsRequest(true);
                        setShowOrderDetails(false);
                      }}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                      Teile anfordern
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'Completed')}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Auftrag abschließen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Entry Modal */}
      {showTimeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Zeit erfassen</h2>
              <form onSubmit={handleTimeEntry}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
                    <input
                      type="datetime-local"
                      value={timeEntryForm.start_time}
                      onChange={(e) => setTimeEntryForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endzeit (optional)</label>
                    <input
                      type="datetime-local"
                      value={timeEntryForm.end_time}
                      onChange={(e) => setTimeEntryForm(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                    <textarea
                      value={timeEntryForm.notes}
                      onChange={(e) => setTimeEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-[#0066b3] text-white px-4 py-2 rounded hover:bg-[#005a9e]"
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeEntry(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fotos hochladen</h2>
              <form onSubmit={handlePhotoUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos auswählen</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedPhotos(files);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notizen zu den Fotos</label>
                    <textarea
                      value={photoNotes}
                      onChange={(e) => setPhotoNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-[#0066b3] text-white px-4 py-2 rounded hover:bg-[#005a9e]"
                  >
                    Hochladen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPhotoUpload(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Parts Request Modal */}
      {showPartsRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Teile anfordern</h2>
              <form onSubmit={handlePartsRequest}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benötigte Teile</label>
                    <div className="space-y-2">
                                             {[
                         { part_id: 1, name: 'Türschalter', quantity: 2 },
                         { part_id: 2, name: 'Motor', quantity: 1 },
                         { part_id: 3, name: 'Kabel', quantity: 5 },
                         { part_id: 4, name: 'Sicherung', quantity: 3 }
                       ].map(part => (
                         <div key={part.part_id} className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             id={`part-${part.part_id}`}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedParts(prev => [...prev, part]);
                               } else {
                                 setSelectedParts(prev => prev.filter(p => p.part_id !== part.part_id));
                               }
                             }}
                             className="rounded border-gray-300 text-[#0066b3] focus:ring-[#0066b3]"
                           />
                           <label htmlFor={`part-${part.part_id}`} className="text-sm text-gray-700">
                             {part.name} (x{part.quantity})
                           </label>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zusätzliche Notizen</label>
                    <textarea
                      value={partsRequestNotes}
                      onChange={(e) => setPartsRequestNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-[#0066b3] text-white px-4 py-2 rounded hover:bg-[#005a9e]"
                  >
                    Anfordern
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPartsRequest(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 