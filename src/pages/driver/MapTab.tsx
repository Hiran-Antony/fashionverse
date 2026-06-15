// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Map Tab (colorful world map)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// Fix default icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });
import { Crosshair, Maximize, Minimize } from 'lucide-react';
import { useDriverStore } from '../../store/driverStore';
import { getOrderCoords } from '../../hooks/useDriver';

// Custom driver icon (pulsing effect)
const driverIcon = L.divIcon({
  html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,200,83,0.2);animation:dh-pulse-ring 2s infinite"></div>
    <div style="width:16px;height:16px;border-radius:50%;background:#00C853;border:3px solid #fff;position:relative;z-index:1"></div>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Delivery drop icon
const dropIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#2979FF;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(41,121,255,0.5);font-size:12px">🏠</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Available order icon
const availableIcon = L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#D4A032;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(212,160,50,0.5);font-size:10px">⭐</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapTab() {
  const { driverLocation, activeDeliveries, availableOrders, setDriverLocation, activeTab } = useDriverStore();
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialise Leaflet map once
  useEffect(() => {
    if (mapRef.current) return; // prevent double init

    const map = L.map('driver-map', {
      center: [0, 0], // world view
      zoom: 2,
      zoomControl: false,
    });

    // Colorful OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add driver marker via geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const marker = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
        driverMarkerRef.current = marker;
        map.setView([lat, lng], 15);
        setDriverLocation([lat, lng]);
      });
    }

    // Add delivery markers (active deliveries)
    activeDeliveries.forEach((o) => {
      const pos = o.drop_lat && o.drop_lng ? [o.drop_lat, o.drop_lng] : getOrderCoords(o.id, driverLocation[0], driverLocation[1]);
      const marker = L.marker(pos as [number, number], { icon: dropIcon })
        .bindPopup(`<strong>Drop: #${o.id.slice(0, 8).toUpperCase()}</strong><br/>${o.address?.city || 'Customer'}<br/>₹${o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)}`)
        .addTo(map);
    });

    // Add available order markers (limited to 20)
    availableOrders.slice(0, 20).forEach((o) => {
      const pos = o.drop_lat && o.drop_lng ? [o.drop_lat, o.drop_lng] : getOrderCoords(o.id, driverLocation[0], driverLocation[1]);
      const marker = L.marker(pos as [number, number], { icon: availableIcon })
        .bindPopup(`<strong>Available: #${o.id.slice(0, 8).toUpperCase()}</strong><br/>${o.address?.city || 'City'}<br/>₹${o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)}`)
        .addTo(map);
    });

    // Draw real route lines from driver location to active deliveries using OSRM API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const driverPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        activeDeliveries.forEach(async (o) => {
          const dropPos = o.drop_lat && o.drop_lng ? [o.drop_lat, o.drop_lng] : getOrderCoords(o.id, driverPos[0], driverPos[1]);
          
          try {
            // Route from Driver to Drop
            const startLng = driverPos[1];
            const startLat = driverPos[0];
            const endLng = dropPos[1];
            const endLat = dropPos[0];
            
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
              const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
              
              L.polyline(coordinates, {
                color: '#2979FF',
                weight: 5,
                opacity: 0.9,
              }).addTo(map);
            } else {
              // Fallback to straight line
              L.polyline([driverPos, dropPos as [number, number]], {
                color: '#2979FF',
                weight: 4,
                opacity: 0.5,
                dashArray: '10, 10'
              }).addTo(map);
            }
          } catch (err) {
            console.error('OSRM Routing Error:', err);
            // Fallback to straight line
            L.polyline([driverPos, dropPos as [number, number]], {
              color: '#2979FF',
              weight: 4,
              opacity: 0.5,
              dashArray: '10, 10'
            }).addTo(map);
          }
        });
      });
    }

    setTimeout(() => map.invalidateSize(), 300);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
    };
  }, []);

  // Recenter button – updates driver location and map view
  const recenter = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setDriverLocation(loc);
        mapRef.current?.flyTo(loc, 15, { animate: true });
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng(loc);
        } else {
          const marker = L.marker(loc, { icon: driverIcon }).addTo(mapRef.current);
          driverMarkerRef.current = marker;
        }
      }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
    }
  };

  // Resize map when this tab becomes active or fullscreen is toggled
  useEffect(() => {
    if ((activeTab === 'map' || isFullscreen) && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 150);
    }
  }, [activeTab, isFullscreen]);

  return (
    <div>
      {/* Header (hidden in fullscreen) */}
      {!isFullscreen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '4px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Live Map</h2>
            <p style={{ fontSize: '12px', color: 'var(--dh-muted)', marginTop: '2px' }}>
              {activeDeliveries.length} active · {availableOrders.length} available
            </p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        className={isFullscreen ? "map-fullscreen" : ""}
        style={
          isFullscreen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                background: '#000',
              }
            : {
                width: '100%',
                height: 'calc(100dvh - 56px - 64px - 40px)',
                minHeight: '400px',
                position: 'relative',
                zIndex: 1,
              }
        }
      >
        <div id="driver-map" style={{ width: '100%', height: '100%' }} />

        {/* Map Overlays: Recenter and Fullscreen toggle */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={recenter}
            style={{
              width: '44px',
              height: '44px',
              background: 'var(--dh-card)',
              border: '1px solid var(--dh-border)',
              borderRadius: '12px',
              color: 'var(--dh-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <Crosshair size={20} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              width: '44px',
              height: '44px',
              background: isFullscreen ? 'var(--dh-green)' : 'var(--dh-card)',
              border: '1px solid var(--dh-border)',
              borderRadius: '12px',
              color: isFullscreen ? '#000' : 'var(--dh-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
