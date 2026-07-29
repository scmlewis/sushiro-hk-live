import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../leaflet-fix';
import 'leaflet/dist/leaflet.css';
import { SushiroStore, StoreQueueMap } from '../types';
import { getStoreDisplayStatus, getMarkerColor } from '../utils/status';
import { StoreMapLegend } from './StoreMapLegend';

interface StoreMapProps {
  stores: SushiroStore[];
  queues: StoreQueueMap;
  userLocation: { latitude: number; longitude: number } | null;
  onSelectStore: (store: SushiroStore) => void;
}

function createMarkerIcon(store: SushiroStore): L.DivIcon {
  const status = getStoreDisplayStatus(store);
  const color = getMarkerColor(status.accentColor);
  const label = status.waitText;

  return L.divIcon({
    className: 'sushiro-marker',
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-weight: 900;
      padding: 4px 8px;
      border-radius: 9999px;
      white-space: nowrap;
      text-align: center;
      line-height: 1.2;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      border: 2px solid rgba(255,255,255,0.9);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.02em;
      min-width: 30px;
      transition: transform 0.15s ease, opacity 0.15s ease;
      will-change: transform, opacity;
    ">${label}</div>`,
    iconSize: [36, 18],
    iconAnchor: [18, 9],
  });
}

function FitBoundsOnce({ stores }: { stores: SushiroStore[] }) {
  const map = useMap();
  const fitted = React.useRef(false);

  useEffect(() => {
    if (fitted.current || stores.length === 0) return;
    fitted.current = true;

    const HK_BOUNDS = [[22.45, 114.05], [22.65, 114.35]];
    const hkBounds = L.latLngBounds(HK_BOUNDS as [[number, number], [number, number]]);
    const storeBounds = L.latLngBounds(stores.map(s => [s.latitude, s.longitude] as [number, number]));

    const combined = hkBounds.extend(storeBounds.getCenter());
    map.fitBounds(combined, { padding: [40, 40], maxZoom: 14 });

    if (map.getZoom() < 10) {
      map.setZoom(10);
    }
  }, [stores, map]);

  return null;
}

function UserLocationMarker({ location }: { location: { latitude: number; longitude: number } }) {
  const icon = useMemo(() => L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      width: 16px;
      height: 16px;
      background: #3b82f6;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
    "/>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  }), []);

  return <Marker position={[location.latitude, location.longitude]} icon={icon} />;
}

function ScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col gap-1">
      <button
        onClick={() => map.setZoom(map.getZoom() - 1)}
        className="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow"
      >
        <span className="text-lg font-bold">−</span>
      </button>
      <button
        onClick={() => map.setZoom(map.getZoom() + 1)}
        className="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow"
      >
        <span className="text-lg font-bold">+</span>
      </button>
    </div>
  );
}

function ZoomSlider() {
  const map = useMap();
  const [show, setShow] = useState(false);
  const tapCount = React.useRef(0);

  useEffect(() => {
    const container = map.getContainer();
    const handleTouch = () => {
      tapCount.current++;
      if (tapCount.current >= 6) {
        setShow(true);
        setTimeout(() => { setShow(false); tapCount.current = 0; }, 3000);
      }
    };
    const handleTouchEnd = () => { tapCount.current = 0; };
    container.addEventListener('touchstart', handleTouch);
    container.addEventListener('touchend', handleTouchEnd);
    return () => {
      container.removeEventListener('touchstart', handleTouch);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [map]);

  if (!show) return null;

  return (
    <div className="absolute top-20 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">縮放</label>
      <input
        type="range"
        min={10}
        max={18}
        step={1}
        value={Math.round(map.getZoom())}
        onChange={(e) => map.setZoom(Number(e.target.value))}
        className="w-40"
      />
    </div>
  );
}

export const StoreMap: React.FC<StoreMapProps> = ({
  stores,
  queues,
  userLocation,
  onSelectStore,
}) => {
  const center = useMemo<[number, number]>(() => {
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    return [22.32, 114.17];
  }, [userLocation]);

  const markerIcons = useMemo(() => {
    const m = new Map<number, L.DivIcon>();
    stores.forEach((s) => m.set(s.id, createMarkerIcon(s)));
    return m;
  }, [stores]);

  return (
    <div className="fixed inset-0 z-20 bg-neutral-950">
      <ScrollLock />
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBoundsOnce stores={stores} />
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={markerIcons.get(store.id)}
            eventHandlers={{
              click: () => onSelectStore(store),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -15]}
              opacity={1}
              permanent={false}
              className="sushiro-tooltip"
            >
              <div style={{ fontWeight: 900, fontSize: '12px', marginBottom: '2px' }}>
                {store.name}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {getStoreDisplayStatus(store).waitText} · {getStoreDisplayStatus(store).groupText}
              </div>
            </Tooltip>
          </Marker>
        ))}
        {userLocation && <UserLocationMarker location={userLocation} />}
        <ZoomControls />
        <ZoomSlider />
      </MapContainer>
      <StoreMapLegend />
    </div>
  );
};