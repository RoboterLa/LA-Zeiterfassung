'use client';

import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';

interface Order {
  id: number;
  type: string;
  description: string;
  location: string;
  coords: [number, number];
  planned_start: string;
  priority: string;
  status: string;
  customer: string;
}

interface RoutePlannerProps {
  orders: Order[];
  startLocation: [number, number];
  startAddress: string;
  startDateTime: string;
  onRouteUpdate?: (route: Order[]) => void;
  onOrderReject?: (orderId: number) => void;
  onOrderComplete?: (orderId: number) => void;
  onOrderReopen?: (orderId: number) => void;
  onTimeEntry?: (orderId: number) => void;
  forceRecalculate?: boolean; // New prop to force recalculation
}

interface RouteStationProps {
  order: Order;
  stationNumber: number;
  onReject: (orderId: number) => void;
  onComplete: (orderId: number) => void;
  onReopen?: (orderId: number) => void;
  onMoveUp: (orderId: number) => void;
  onMoveDown: (orderId: number) => void;
  isFirst: boolean;
  isLast: boolean;
  routeType: string;
  isNextStation: boolean;
  arrivalTime?: string;
  departureTime?: string;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({
  orders,
  startLocation,
  startAddress,
  startDateTime,
  onRouteUpdate,
  onOrderReject,
  onOrderComplete,
  onOrderReopen,
  onTimeEntry,
  forceRecalculate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [routeType, setRouteType] = useState<'optimal' | 'manual' | 'priority' | 'time'>('optimal');
  const [optimizedRoute, setOptimizedRoute] = useState<Order[]>([]);
  const [manualRoute, setManualRoute] = useState<Order[]>([]);

  const [routeStats, setRouteStats] = useState({
    totalDistance: 0,
    nextDistance: 0,
    estimatedTime: 0,
    nextTime: 0,
    openOrders: 0,
    completedOrders: 0
  });


  const [showFeierabend, setShowFeierabend] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [elevatorAnimation, setElevatorAnimation] = useState(false);
  const [elevatorPosition, setElevatorPosition] = useState(0);

  // Haversine formula for distance calculation (fallback)
  const haversine = (a: [number, number], b: [number, number]): number => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);

    const a_ = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a_), Math.sqrt(1 - a_));
    return R * c;
  };

  // OpenRouteService API key - REAL KEY FROM: https://openrouteservice.org/dev/#/signup
  const OPENROUTE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI4ZWQxNTRmZmU0YjQyNmNhMTRkOTlmMWZiNDlmY2FiIiwiaCI6Im11cm11cjY0In0='; // ✅ REAL API KEY

  // Get real driving distance using OpenRouteService
  const getDrivingDistance = async (origin: [number, number], destination: [number, number]): Promise<number> => {
    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            [origin[1], origin[0]], // [lon, lat] format - IMPORTANT!
            [destination[1], destination[0]]
          ],
          format: 'geojson'
        })
      });

      if (!response.ok) {
        throw new Error(`ORS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const distance = data.features[0].properties.summary.distance;
        return distance;
      } else {
        throw new Error('No route found in ORS response');
      }
    } catch (error) {
      // NO FALLBACK - show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Routenplanung fehlgeschlagen: ${errorMessage}`);
    }
  };

  // Get real driving route for multiple waypoints using OpenRouteService
  const getDrivingRoute = async (waypoints: [number, number][]): Promise<{distance: number, duration: number}> => {
    if (waypoints.length < 2) return { distance: 0, duration: 0 };
    
    try {
      // Convert waypoints to [lon, lat] format for ORS
      const coordinates = waypoints.map(wp => [wp[1], wp[0]]); // [lat, lon] -> [lon, lat]
      
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: coordinates,
          format: 'geojson'
        })
      });
      
      if (!response.ok) {
        throw new Error(`ORS API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const distance = route.properties.summary.distance; // Keep in meters
        const duration = route.properties.summary.duration; // Keep in seconds
        
        console.log('✅ ORS route received:', distance / 1000, 'km,', duration / 60, 'min');
        return { 
          distance: distance, 
          duration: duration 
        };
      } else {
        throw new Error('No route found in ORS response');
      }
    } catch (error) {
      console.error('❌ ORS route error:', error);
      // NO FALLBACK - show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Routenplanung fehlgeschlagen: ${errorMessage}`);
    }
  };

  // Calculate optimal route using nearest neighbor
  const calculateOptimalRoute = (start: [number, number], orders: Order[]): Order[] => {
    if (orders.length === 0) {
      return [];
    }

    const route: Order[] = [];
    const unvisited = [...orders];

    let current = start;
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = haversine(current, unvisited[0].coords);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = haversine(current, unvisited[i].coords);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      route.push(unvisited[nearestIndex]);
      current = unvisited[nearestIndex].coords;
      unvisited.splice(nearestIndex, 1);
    }

    return route;
  };

  // Calculate priority-based route
  const calculatePriorityRoute = (orders: Order[]): Order[] => {
    return [...orders].sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  };

  // Calculate time-based route
  const calculateTimeRoute = (orders: Order[]): Order[] => {
    return [...orders].sort((a, b) => 
      new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
    );
  };

  // Elevator animation function
  const startElevatorAnimation = () => {
    setElevatorAnimation(true);
    setElevatorPosition(0);
    
    // Get current route
    const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
    
    // Animate elevator through all stations
    const animateElevator = (stationIndex: number) => {
      if (stationIndex >= currentRoute.length) {
        // Elevator finished, show confetti
        setTimeout(() => {
          setShowFeierabend(true);
          setElevatorAnimation(false);
          setTimeout(() => setShowFeierabend(false), 5000);
        }, 1000);
        return;
      }
      
      // Move elevator to next station
      setElevatorPosition(stationIndex);
      
      // Wait 1 second, then move to next station
      setTimeout(() => {
        animateElevator(stationIndex + 1);
      }, 1000);
    };
    
    // Start animation
    setTimeout(() => animateElevator(0), 500);
  };

  // Calculate route statistics
  const calculateRouteStats = async (route: Order[]) => {
    const openOrders = route.filter(o => o.status !== 'Completed');
    const completedOrders = route.filter(o => o.status === 'Completed');
    
    // Check if all orders are completed for Feierabend animation
    if (openOrders.length === 0 && completedOrders.length > 0) {
      startElevatorAnimation();
    }
    
    if (openOrders.length === 0) {
      setRouteStats({
        totalDistance: 0,
        nextDistance: 0,
        estimatedTime: 0,
        nextTime: 0,
        openOrders: openOrders.length,
        completedOrders: completedOrders.length
      });
      return;
    }

    // Always calculate stats, starting with haversine fallback for immediate response
    let totalDistance = 0;
    let nextDistance = 0;
    let estimatedTime = 0;
    let nextTime = 0;

    // Start with haversine calculation for immediate response
    if (openOrders.length === 1) {
      nextDistance = haversine(startLocation, openOrders[0].coords) * 1.3;
      totalDistance = nextDistance;
      nextTime = Math.round(nextDistance * 2);
      estimatedTime = nextTime;
    } else if (openOrders.length > 1) {
      nextDistance = haversine(startLocation, openOrders[0].coords) * 1.3;
      totalDistance = haversine(startLocation, openOrders[0].coords) * 1.3;
      
      for (let i = 0; i < openOrders.length - 1; i++) {
        totalDistance += haversine(openOrders[i].coords, openOrders[i + 1].coords) * 1.3;
      }
      
      estimatedTime = Math.round(totalDistance * 2);
      nextTime = Math.round(nextDistance * 2);
    }

    // Set initial stats immediately
    const initialStats = {
      totalDistance: Math.round(totalDistance * 10) / 10,
      nextDistance: Math.round(nextDistance * 10) / 10,
      estimatedTime,
      nextTime,
      openOrders: openOrders.length,
      completedOrders: completedOrders.length
    };
    
    setRouteStats(initialStats);

    // Then try to get real ORS data in background
    try {
      if (openOrders.length === 1) {
        // Single order - get real driving distance
        console.log('🔄 Getting real driving distance for single order');
        const realDistance = await getDrivingDistance(startLocation, openOrders[0].coords);
        const realTime = Math.round(realDistance / 1000 * 2); // Convert meters to km, then to minutes
        
        const realStats = {
          totalDistance: Math.round(realDistance / 1000 * 10) / 10, // Convert to km
          nextDistance: Math.round(realDistance / 1000 * 10) / 10,
          estimatedTime: realTime,
          nextTime: realTime,
          openOrders: openOrders.length,
          completedOrders: completedOrders.length
        };
        
        console.log('✅ Updated with real ORS data:', realStats);
        setRouteStats(realStats);
      } else if (openOrders.length > 1) {
        // Multiple orders - get full driving route
        console.log('🔄 Getting real driving route for multiple orders');
        const waypoints = [startLocation, ...openOrders.map(o => o.coords)];
        
        try {
          const routeData = await getDrivingRoute(waypoints);
          const realNextDistance = await getDrivingDistance(startLocation, openOrders[0].coords);
          const realNextTime = Math.round(realNextDistance / 1000 * 2); // Convert to minutes
          
          const realStats = {
            totalDistance: Math.round(routeData.distance / 1000 * 10) / 10, // Convert to km
            nextDistance: Math.round(realNextDistance / 1000 * 10) / 10,
            estimatedTime: Math.round(routeData.duration / 60), // Convert seconds to minutes
            nextTime: realNextTime,
            openOrders: openOrders.length,
            completedOrders: completedOrders.length
          };
          
          console.log('✅ Updated with real ORS route data:', realStats);
          setRouteStats(realStats);
        } catch (routeError) {
          console.warn('⚠️ ORS route failed, keeping haversine data:', routeError);
        }
      }
      
      console.log('✅ ORS data update completed');
    } catch (error) {
      console.warn('⚠️ ORS failed, keeping haversine data:', error);
    }

    const stats = {
      totalDistance: Math.round(totalDistance * 10) / 10,
      nextDistance: Math.round(nextDistance * 10) / 10,
      estimatedTime,
      nextTime,
      openOrders: openOrders.length,
      completedOrders: completedOrders.length
    };
    
    console.log('Route stats calculated:', stats);
    setRouteStats(stats);
    console.log('Route stats state updated');
  };

  // Calculate arrival and departure times for each station
  const calculateStationTimes = async (route: Order[]) => {
    const openOrders = route.filter(o => o.status !== 'Completed');
    if (openOrders.length === 0) return [];
    
    const startTime = new Date(startDateTime);
    const times: Array<{arrival: string, departure: string}> = [];
    
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < openOrders.length; i++) {
      // Calculate real travel time to this station
      let travelTime = 0;
      
      if (i === 0) {
        // First order - from start location
        const distance = await getDrivingDistance(startLocation, openOrders[i].coords);
        travelTime = Math.round(distance * 2); // 2 min per km estimate
      } else {
        // Subsequent orders - from previous order
        const distance = await getDrivingDistance(openOrders[i-1].coords, openOrders[i].coords);
        travelTime = Math.round(distance * 2); // 2 min per km estimate
      }
      
      // Add travel time to current time
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
      const arrivalTime = currentTime.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Add 60 minutes work time
      currentTime = new Date(currentTime.getTime() + 60 * 60000);
      const departureTime = currentTime.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      times.push({ arrival: arrivalTime, departure: departureTime });
    }
    
    return times;
  };

  // Initialize map
  const initMap = async () => {
    if (!mapRef.current) return;

    try {
      const L = await import('leaflet');
      const Geocoder = await import('leaflet-control-geocoder');
      
      // Load Leaflet Routing Machine
      await import('leaflet-routing-machine');
      
      // Remove existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // Clear container completely
      mapRef.current.innerHTML = '';
      
      // Set container styles
      mapRef.current.style.cssText = `
        width: 100%;
        height: 384px;
        position: relative;
        z-index: 1;
        overflow: hidden;
        background: #f8f9fa;
      `;
      
      // Create map instance with all standard controls
      mapInstanceRef.current = L.map(mapRef.current, {
        center: startLocation,
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true
      });
      
      // Add multiple tile layers for different views
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 8
      });
      
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 18,
        minZoom: 8
      });
      
      const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 18,
        minZoom: 8
      });
      
      // Add base layers to map
      osmLayer.addTo(mapInstanceRef.current);
      
      // Create layer control
      const baseLayers = {
        "OpenStreetMap": osmLayer,
        "Satellit": satelliteLayer,
        "CartoDB": cartoLayer
      };
      
      L.control.layers(baseLayers).addTo(mapInstanceRef.current);
      
      // Initialize Geocoder with improved settings
      const geocoder = Geocoder.geocoder({
        defaultMarkGeocode: false,
        placeholder: 'Suche Startposition...',
        queryMinLength: 3,
        suggestMinLength: 3,
        suggestTimeout: 500
      }).on('markgeocode', function(e) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(e.geocode.bbox);
        }
        
        const newLocation: [number, number] = [
          e.geocode.center.lat,
          e.geocode.center.lng
        ];
        
        console.log('New location selected:', e.geocode.name, newLocation);
      }).addTo(mapInstanceRef.current);
      
      // Force map to render properly
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView(startLocation, 11);
          
          // Remove loading indicator
          const loadingIndicator = mapRef.current?.querySelector('.absolute');
          if (loadingIndicator) {
            loadingIndicator.remove();
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Render route on map
  const renderRoute = async () => {
    if (!mapInstanceRef.current) return;

    try {
      const L = await import('leaflet');
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Remove existing routing control
      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
      }

        const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
      const openOrders = currentRoute.filter(o => o.status !== 'Completed');
  
      if (currentRoute.length === 0) return;

      // Wait for map to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      // Add start marker with improved styling
      const startMarker = L.marker(startLocation, {
        icon: L.divIcon({
          className: 'custom-start-marker',
          html: '<div style="background:#22c55e;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:14px;">S</div>'
        })
      }).addTo(mapInstanceRef.current);
      
      startMarker.bindPopup(`
        <div style="min-width:200px;padding:8px;">
          <strong style="color:#22c55e;">Startpunkt</strong><br>
          <span style="font-size:12px;color:#6b7280;">${startAddress}</span>
        </div>
      `);
      markersRef.current.push(startMarker);

      // Add order markers with improved styling
      const routePoints = [startLocation];
      
      openOrders.forEach((order, index) => {
        const markerColor = getMarkerColor(order.type);
        const stationNumber = index + 1;
        const marker = L.marker(order.coords, {
          icon: L.divIcon({
            className: 'custom-order-marker',
            html: `<div style="background:${markerColor};color:#fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid #fff;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${stationNumber}</div>`
          })
        }).addTo(mapInstanceRef.current);
        
        marker.bindPopup(`
          <div style="min-width:250px;padding:12px;">
            <h3 style="font-weight:bold;font-size:16px;margin-bottom:8px;color:#1f2937;">Station ${stationNumber}: ${order.type}</h3>
            <p style="margin:4px 0;color:#374151;"><strong>Kunde:</strong> ${order.customer}</p>
            <p style="margin:4px 0;color:#374151;"><strong>Adresse:</strong> ${order.location}</p>
            <p style="margin:4px 0;color:#374151;"><strong>Zeit:</strong> ${new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style="margin:4px 0;color:#374151;"><strong>Priorität:</strong> ${order.priority}</p>
          </div>
        `);
        
        markersRef.current.push(marker);
        routePoints.push(order.coords);
      });

      // Add return to start marker with improved styling
      if (openOrders.length > 0) {
        const returnMarker = L.marker(startLocation, {
          icon: L.divIcon({
            className: 'custom-return-marker',
            html: '<div style="background:#ef4444;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:14px;">🏠</div>'
          })
        }).addTo(mapInstanceRef.current);
        
        returnMarker.bindPopup(`
          <div style="min-width:200px;padding:8px;">
            <strong style="color:#ef4444;">Rückkehr</strong><br>
            <span style="font-size:12px;color:#6b7280;">${startAddress}</span>
          </div>
        `);
        markersRef.current.push(returnMarker);
        routePoints.push(startLocation);
      }

      // Create routing control with OpenRouteService for real car routes
      if (routePoints.length > 1) {
        console.log('Creating routing control with points:', routePoints);
        
        // Convert coordinates to LatLng objects
        const waypoints = routePoints.map(point => L.latLng(point[0], point[1]));
        
        // Draw fallback route function
        const drawFallbackRoute = (routePoints: [number, number][]) => {
          if (routePoints.length > 1) {
            console.log('Drawing fallback route with straight lines');
            const polyline = L.polyline(routePoints, {
              color: '#0066b3',
              weight: 8,
              opacity: 0.8,
              smoothFactor: 1,
              dashArray: '15, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstanceRef.current);
            
            // Store reference for later removal
            if (!routingControlRef.current) {
              routingControlRef.current = { remove: () => polyline.remove() };
            }
          }
        };
        
        // Create custom OpenRouteService router
        const openRouteRouter = {
          route: function (waypoints: any[], callback: any) {
            const coordinates = waypoints.map((wp: any) => [wp.latLng.lng, wp.latLng.lat]);

            const requestBody = {
              coordinates: coordinates,
              format: 'geojson'
            };

            const maxRetries = 1;
            let attempt = 0;

            const tryRoute = () => {
              console.log(`🔄 ORS Routing Attempt #${attempt + 1}`, coordinates);

              fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
              })
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                  }
                  return res.json();
                })
                .then(data => {
                  if (data?.features?.length > 0) {
                    const route = data.features[0];
                    const routeCoordinates = route.geometry.coordinates.map((coord: number[]) =>
                      L.latLng(coord[1], coord[0])
                    );

                    const result = [{
                      name: 'Auto-Route',
                      coordinates: routeCoordinates,
                      summary: {
                        totalDistance: route.properties.summary.distance,
                        totalTime: route.properties.summary.duration
                      },
                      instructions: []
                    }];

                    console.log('✅ ORS Auto-Route empfangen:', result);
                    callback(null, result);
                  } else {
                    throw new Error('No route found in ORS response');
                  }
                })
                .catch(error => {
                  console.error(`❌ ORS Routing Error (Try #${attempt + 1}):`, error);
                  attempt++;
                  if (attempt <= maxRetries) {
                    console.log('🔁 Wiederhole ORS Routing...');
                    setTimeout(tryRoute, 500);
                  } else {
                    console.warn('⚠️ Routing endgültig fehlgeschlagen. Kein Fallback.');
                    callback(error, []);
                  }
                });
            };

            tryRoute();
          }
        };
        
        // Create routing control with OpenRouteService
        try {
          console.log('Creating OpenRouteService routing control');
          
          routingControlRef.current = (L as any).Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            router: openRouteRouter,
            lineOptions: {
              styles: [{ 
                color: '#0066b3', 
                weight: 8, 
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }]
            },
            show: false, // Hide instructions panel
            addWaypoints: false, // Disable adding waypoints
            fitSelectedRoutes: true,
            showAlternatives: false,
            createMarker: function(i: number, wp: any) { 
              return L.marker(wp.latLng); 
            }
          }).addTo(mapInstanceRef.current);
          
          // Add event listeners
          routingControlRef.current.on('routesfound', async (e: any) => {
            console.log('OpenRouteService route found successfully:', e.routes);
            if (e.routes && e.routes.length > 0) {
              const route = e.routes[0];
              console.log('Route details:', {
                distance: route.summary.totalDistance / 1000, // km
                duration: Math.round(route.summary.totalTime / 60), // minutes
                coordinates: route.coordinates.length
              });
              
              // Update route stats with real driving data
              const openOrders = currentRoute.filter(o => o.status !== 'Completed');
              const completedOrders = currentRoute.filter(o => o.status === 'Completed');
              
              if (openOrders.length > 0) {
                const totalDistance = route.summary.totalDistance / 1000; // km
                const estimatedTime = Math.round(route.summary.totalTime / 60); // minutes
                
                // Calculate next distance (distance to first order)
                let nextDistance = 0;
                if (openOrders.length === 1) {
                  nextDistance = totalDistance;
                } else {
                  // For multiple orders, calculate distance to first order
                  try {
                    nextDistance = await getDrivingDistance(startLocation, openOrders[0].coords);
                  } catch (error) {
                    console.warn('Failed to get next distance, using haversine');
                    nextDistance = haversine(startLocation, openOrders[0].coords) * 1.3;
                  }
                }
                
                const nextTime = Math.round(nextDistance * 2); // 2 min per km
                
                const stats = {
                  totalDistance: Math.round(totalDistance * 10) / 10,
                  nextDistance: Math.round(nextDistance * 10) / 10,
                  estimatedTime,
                  nextTime,
                  openOrders: openOrders.length,
                  completedOrders: completedOrders.length
                };
                
                console.log('Route stats updated with OpenRouteService data:', stats);
                setRouteStats(stats);
              }
            }
          });
          
          routingControlRef.current.on('routingerror', async (e: any) => {
            console.error('OpenRouteService routing error:', e.error);
            // Fallback to straight lines
            drawFallbackRoute(routePoints);
            await calculateRouteStats(currentRoute);
          });
          
          console.log('OpenRouteService routing control created successfully');
          
          // Force route stats calculation after routing control creation
          setTimeout(async () => {
            console.log('Forcing route stats calculation after routing control creation');
            await calculateRouteStats(currentRoute);
          }, 1000); // Wait 1 second for routes to be calculated
        } catch (error) {
          console.error('Failed to create OpenRouteService routing control:', error);
          // Fallback to straight lines
          drawFallbackRoute(routePoints);
          await calculateRouteStats(currentRoute);
        }
      }
        
      // Fit map to show all markers with better padding
      const bounds = L.latLngBounds(routePoints);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true
      });
      
      // Force map refresh with longer timeout
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setMaxBounds(bounds.pad(0.15));
        }
      }, 800);
      
    } catch (error) {
      console.error('Error rendering route:', error);
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

  // Handle manual route reordering
  const handleMoveUp = async (orderId: number) => {
    const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
    const currentIndex = currentRoute.findIndex(o => o.id === orderId);
    if (currentIndex > 0) {
      const newRoute = [...currentRoute];
      [newRoute[currentIndex], newRoute[currentIndex - 1]] = [newRoute[currentIndex - 1], newRoute[currentIndex]];
      
      if (routeType === 'manual') {
        setManualRoute(newRoute);
      } else {
        setOptimizedRoute(newRoute);
      }
      
      // Update route stats and trigger route update
      await calculateRouteStats(newRoute);
      onRouteUpdate?.(newRoute);
      
      // Re-render route on map
      setTimeout(() => {
        renderRoute();
      }, 100);
    }
  };

  const handleMoveDown = async (orderId: number) => {
    const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
    const currentIndex = currentRoute.findIndex(o => o.id === orderId);
    if (currentIndex < currentRoute.length - 1) {
      const newRoute = [...currentRoute];
      [newRoute[currentIndex], newRoute[currentIndex + 1]] = [newRoute[currentIndex + 1], newRoute[currentIndex]];
      
      if (routeType === 'manual') {
        setManualRoute(newRoute);
      } else {
        setOptimizedRoute(newRoute);
      }
      
      // Update route stats and trigger route update
      await calculateRouteStats(newRoute);
      onRouteUpdate?.(newRoute);
      
      // Re-render route on map
      setTimeout(() => {
        renderRoute();
      }, 100);
    }
  };

  // Handle route type change
  const handleRouteTypeChange = (type: 'optimal' | 'manual' | 'priority' | 'time') => {
    setRouteType(type);
    if (type === 'manual' && manualRoute.length === 0) {
      setManualRoute(optimizedRoute);
    }
  };

  // Force route recalculation when startLocation changes
  const recalculateRoute = async () => {
    if (orders.length > 0 && startLocation) {
      const route = calculateOptimalRoute(startLocation, orders);
      setOptimizedRoute(route);
      await calculateRouteStats(route);
      onRouteUpdate?.(route);
    }
  };

  // Initialize map on mount
  useEffect(() => {
    console.log('🗺️ Initializing map with startLocation:', startLocation);
    initMap();
  }, [startLocation]);

  // Force route recalculation when startLocation changes significantly
  useEffect(() => {
    if (startLocation && orders.length > 0) {
      recalculateRoute();
    }
  }, [startLocation]);

  // Force route recalculation when orders change
  useEffect(() => {
    if (orders.length > 0 && startLocation) {
      recalculateRoute();
    }
  }, [orders]);



  // Force recalculation when forceRecalculate prop changes
  useEffect(() => {
    if (forceRecalculate && startLocation && orders.length > 0) {
      recalculateRoute();
    }
  }, [forceRecalculate, startLocation, orders]);

  // Calculate initial route
  useEffect(() => {
    const initializeRoute = async () => {
      const route = calculateOptimalRoute(startLocation, orders);
      setOptimizedRoute(route);
      
      // Calculate initial stats immediately
      await calculateRouteStats(route);
      
      // Also trigger route update
      onRouteUpdate?.(route);
    };
    
    if (orders.length > 0 && startLocation) {
      initializeRoute();
    }
  }, [orders, startLocation, onRouteUpdate]);

  // Render route when data changes
  useEffect(() => {
    const renderRouteData = async () => {
      if (mapInstanceRef.current) {
        const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
        if (currentRoute.length > 0) {
          // Wait a bit longer for map to be ready
          setTimeout(async () => {
            await renderRoute();
          }, 1500);
        }
      }
    };
    
    // Wait for map to be fully loaded
    const timer = setTimeout(renderRouteData, 2000);
    return () => clearTimeout(timer);
  }, [optimizedRoute, manualRoute, routeType, startLocation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    // Set initial dimensions
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // RouteStation Component with expand functionality
  const RouteStation: React.FC<RouteStationProps> = ({ 
    order, 
    stationNumber, 
    onReject, 
    onComplete,
    onReopen,
    onMoveUp, 
    onMoveDown, 
    isFirst, 
    isLast,
    routeType,
    isNextStation,
    arrivalTime,
    departureTime
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getTypeColor = (type: string): string => {
      switch (type) {
        case 'Reparatur': return 'bg-red-100 text-red-800';
        case 'Wartung': return 'bg-blue-100 text-blue-800';
        case 'Neubau': return 'bg-green-100 text-green-800';
        case 'Modernisierung': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getPriorityColor = (priority: string): string => {
      switch (priority) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Compact View */}
            <div className={`p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
              isNextStation ? 'bg-orange-50 border-2 border-orange-200 shadow-md' : ''
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-3 sm:gap-4" style={{ minHeight: '60px' }}>
                                              {/* Left side - Order info */}
                 <div className="flex items-start space-x-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                     isNextStation 
                       ? 'bg-orange-500 text-white ring-2 ring-orange-300' 
                       : 'bg-blue-600 text-white'
                   }`}>
                     {stationNumber}
                   </div>
                   <div className="min-w-0 flex-1">
                     <h4 className={`font-medium text-sm sm:text-base truncate ${isNextStation ? 'text-orange-700' : 'text-gray-900'}`}>
                       {order.customer}
                       {isNextStation && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded animate-pulse">NÄCHSTE</span>}
                     </h4>
                     <p className="text-xs sm:text-sm text-gray-600 truncate">{order.location}</p>
                     <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs">
                       <p className="text-gray-500">
                         Geplant: {new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                       </p>
                       {arrivalTime && departureTime && (
                         <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-gray-400">
                           <span>Ankunft: {arrivalTime}</span>
                           <span className="hidden sm:inline">•</span>
                           <span>Abfahrt: {departureTime}</span>
                           <span className="text-xs">(60min Arbeit)</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
            
            {/* Center - Expand button */}
            <div className="flex justify-center items-center h-full">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 h-10 text-xs sm:text-sm min-w-[80px] sm:min-w-[120px]"
              >
                <span className="font-medium hidden sm:inline">
                  {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                </span>
                <span className="font-medium sm:hidden">
                  {isExpanded ? 'Weniger' : 'Mehr'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
                        {/* Right side - Type badge and sort controls */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 h-full">
              <span className={`px-2 py-1 rounded text-xs font-medium truncate ${getTypeColor(order.type)}`}>
                {order.type}
              </span>
              
              {/* Manual Sort Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(order.id);
                  }}
                  disabled={isFirst}
                  className={`p-1.5 sm:p-1 rounded ${
                    isFirst 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Nach oben"
                >
                  <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(order.id);
                  }}
                  disabled={isLast}
                  className={`p-1.5 sm:p-1 rounded ${
                    isLast 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Nach unten"
                >
                  <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Beschreibung</h5>
                <p className="text-sm text-gray-700">{order.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Adresse</h5>
                  <p className="text-sm text-gray-700">{order.location}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Geplante Zeit</h5>
                  <p className="text-sm text-gray-700">
                    {new Date(order.planned_start).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(order.type)}`}>
                    {order.type}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
                                 {/* Action Buttons - Mobile Optimized */}
                   <div className="pt-3 border-t border-gray-200">
                     {/* Mobile: Icon-only buttons in a row */}
                     <div className="flex sm:hidden items-center justify-between space-x-2 mb-3">
                       {onOrderComplete && (
                         <button
                           onClick={() => onOrderComplete(order.id)}
                           className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                           title="Abschließen"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                         </button>
                       )}
                       {onOrderReject && (
                         <button
                           onClick={() => onOrderReject(order.id)}
                           className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                           title="Ablehnen"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         </button>
                       )}
                       
                       {/* Reopen Button for rejected orders */}
                       {onOrderReopen && order.status === 'Rejected' && (
                         <button
                           onClick={() => onOrderReopen(order.id)}
                           className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                           title="Wieder öffnen"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                           </svg>
                         </button>
                       )}
                       
                       {/* Navigation Button */}
                       <button
                         onClick={() => {
                           const [lat, lng] = order.coords;
                           const destination = encodeURIComponent(order.location);
                           const url = `https://www.google.com/maps/dir/?api=1&origin=${startLocation[0]},${startLocation[1]}&destination=${lat},${lng}&travelmode=driving`;
                           window.open(url, '_blank');
                         }}
                         className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                         title="Navigation starten"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                         </svg>
                       </button>
                     </div>
                     
                     {/* Desktop: Full buttons with text */}
                     <div className="hidden sm:flex flex-row items-center justify-between space-x-3">
                       <div className="flex items-center space-x-3">
                         {onOrderComplete && (
                           <button
                             onClick={() => onOrderComplete(order.id)}
                             className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                             <span className="text-sm font-medium">Abschließen</span>
                           </button>
                         )}
                         {onOrderReject && (
                           <button
                             onClick={() => onOrderReject(order.id)}
                             className="flex items-center space-x-2 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-sm"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                             <span className="font-medium">Ablehnen</span>
                           </button>
                         )}
                         
                         {/* Reopen Button for rejected orders */}
                         {onOrderReopen && order.status === 'Rejected' && (
                           <button
                             onClick={() => onOrderReopen(order.id)}
                             className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                             </svg>
                             <span className="font-medium">Wieder öffnen</span>
                           </button>
                         )}
                       </div>
                       
                       {/* Navigation Button */}
                       <button
                         onClick={() => {
                           const [lat, lng] = order.coords;
                           const destination = encodeURIComponent(order.location);
                           const url = `https://www.google.com/maps/dir/?api=1&origin=${startLocation[0]},${startLocation[1]}&destination=${lat},${lng}&travelmode=driving`;
                           window.open(url, '_blank');
                         }}
                         className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                         </svg>
                         <span className="text-sm font-medium">Navigation starten</span>
                       </button>
                     </div>
                   </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentRoute = routeType === 'manual' ? manualRoute : optimizedRoute;
  const openOrders = currentRoute.filter(order => order.status !== 'Completed');
  const completedOrders = currentRoute.filter(order => order.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Elevator Animation */}
      {elevatorAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl max-w-md w-full mx-4">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Aufzug fährt ab...</h2>
            
            {/* Elevator Animation */}
            <div className="relative h-64 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden mb-4">
              {/* Elevator */}
              <div 
                className="absolute left-4 w-16 h-20 bg-blue-600 rounded-lg shadow-lg transition-all duration-1000 ease-in-out flex items-center justify-center"
                style={{ 
                  bottom: `${(elevatorPosition / Math.max(currentRoute.length - 1, 1)) * 200}px`,
                  transform: 'translateY(0)'
                }}
              >
                <div className="text-white text-2xl">🛗</div>
              </div>
              
              {/* Station Markers */}
              {currentRoute.map((order, index) => (
                <div 
                  key={order.id}
                  className="absolute left-24 flex items-center space-x-2"
                  style={{ 
                    bottom: `${(index / Math.max(currentRoute.length - 1, 1)) * 200}px`,
                    transform: 'translateY(50%)'
                  }}
                >
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <div className="text-xs text-gray-600 max-w-32 truncate">
                    {order.customer}
                  </div>
                  {/* Green checkmark when elevator passes */}
                  {index <= elevatorPosition && (
                    <div className="text-green-500 text-lg animate-pulse">✓</div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-gray-600">
              Station {elevatorPosition + 1} von {currentRoute.length}
            </p>
          </div>
        </div>
      )}

      {/* Feierabend Animation */}
      {showFeierabend && (
        <>
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={200}
            colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
          />
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center shadow-2xl animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Feierabend!</h2>
              <p className="text-xl text-gray-600">Alle Aufträge abgeschlossen</p>
              <p className="text-lg text-gray-500 mt-2">Schönen Abend! 👋</p>
            </div>
          </div>
        </>
      )}
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Distanz</div>
            <div className="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">Gesamt</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{routeStats.totalDistance} km</div>
          <div className="text-sm text-gray-700 border-t border-blue-200 pt-2">
            Nächster: {routeStats.nextDistance} km
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Zeit</div>
            <div className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded">Geschätzt</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{routeStats.estimatedTime} Min</div>
          <div className="text-sm text-gray-700 border-t border-green-200 pt-2">
            Nächster: {routeStats.nextTime} Min
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Offene Aufträge</div>
            <div className="text-xs text-gray-600 bg-purple-100 px-2 py-1 rounded">Status</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{routeStats.openOrders}</div>
          <div className="text-sm text-gray-700 border-t border-purple-200 pt-2">
            <span className="font-medium">Gesamt: {currentRoute.length}</span>, {routeStats.completedOrders} abgeschlossen
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96 bg-gray-100"
          style={{ minHeight: '384px' }}
        >
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066b3] mx-auto mb-2"></div>
              <p className="text-sm">Karte wird geladen...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Route Options */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Optimierte Route:</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Routenoption:</span>
            <select
              value={routeType}
              onChange={(e) => handleRouteTypeChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-[#0066b3] focus:ring-1 focus:ring-[#0066b3] bg-white text-gray-900"
            >
              <option value="optimal">Optimal</option>
              <option value="priority">Priorität</option>
              <option value="time">Zeit</option>
              <option value="manual">Manuell</option>
            </select>
          </div>
        </div>

                {/* Route List - Only Open Orders */}
        <div className="space-y-2">
          {openOrders.map((order, index) => {
            const isNextStation = index === 0; // First open order is next station
            // Note: stationTimes calculation moved to useEffect for async handling
            
            return (
              <RouteStation
                key={order.id}
                order={order}
                stationNumber={index + 1}
                onReject={onOrderReject || (() => {})}
                onComplete={onOrderComplete || (() => {})}
                onReopen={onOrderReopen}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === openOrders.length - 1}
                routeType={routeType}
                isNextStation={isNextStation}
                arrivalTime={undefined}
                departureTime={undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Completed Orders Section */}
      {completedOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Abgeschlossene Aufträge:</h3>
            <span className="text-sm text-gray-600 bg-green-100 px-2 py-1 rounded">
              {completedOrders.length} abgeschlossen
            </span>
          </div>

          <div className="space-y-2">
            {completedOrders.map((order, index) => (
              <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-green-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{order.customer}</h4>
                        <p className="text-sm text-gray-600">{order.location}</p>
                        <p className="text-xs text-gray-500">
                          Abgeschlossen: {new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.type === 'Reparatur' ? 'bg-red-100 text-red-800' :
                        order.type === 'Wartung' ? 'bg-blue-100 text-blue-800' :
                        order.type === 'Neubau' ? 'bg-green-100 text-green-800' :
                        order.type === 'Modernisierung' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.type}
                      </span>
                      
                      {/* Action Buttons - Mobile Optimized */}
                      <div>
                        {/* Mobile: Icon-only buttons in a row */}
                        <div className="flex sm:hidden items-center justify-between space-x-2">
                          {/* Time Entry Button */}
                          {onTimeEntry && (
                            <button
                              onClick={() => onTimeEntry(order.id)}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                              title="Zeiterfassung"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          
                          {/* Reopen Button */}
                          {onOrderReopen && (
                            <button
                              onClick={() => onOrderReopen(order.id)}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Wieder öffnen"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Desktop: Full buttons with text */}
                        <div className="hidden sm:flex items-center space-x-2">
                          {/* Time Entry Button */}
                          {onTimeEntry && (
                            <button
                              onClick={() => onTimeEntry(order.id)}
                              className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Zeiterfassung</span>
                            </button>
                          )}
                          
                          {/* Reopen Button */}
                          {onOrderReopen && (
                            <button
                              onClick={() => onOrderReopen(order.id)}
                              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium">Wieder öffnen</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePlanner; 