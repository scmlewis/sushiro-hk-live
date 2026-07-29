import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const HK_BOUNDS = L.latLngBounds(
  [[22.45, 114.05], [22.65, 114.35]] as [[number, number], [number, number]]
);

function createMarkerIcon(store: SushiroStore): L.DivIcon {
  const status = getStoreDisplayStatus(store);
  const color = getMarkerColor(status.accentColor);
  const label = status.waitText;
  const isBusy = !status.isClosed && store.waitingGroup > 0;

  return L.divIcon({
    className: 'sushiro-marker',
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 12px;
      font-weight: 900;
      padding: 5px 10px;
      border-radius: 9999px;
      white-space: nowrap;
      text-align: center;
      line-height: 1.3;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.9);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.02em;
      min-width: 42px;
      transition: transform 0.15s ease, opacity 0.15s ease;
      will-change: transform, opacity;
    ">${label}</div>`,
    iconSize: [46, 22],
    iconAnchor: [23, 11],
  });
}

function FitBoundsOnce({ stores }: { stores: SushiroStore[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || stores.length === 0) return;
    fitted.current = true;

    const storeBounds = L.latLngBounds(stores.map(s => [s.latitude, s.longitude] as [number, number]));
    const combined = HK_BOUNDS.extend(storeBounds.getCenter());
    map.fitBounds(combined, { padding: [40, 40], maxZoom: 14 });

    if (map.getZoom() < 10) {
      map.setZoom(10);
    }
  }, [stores, map]);

  return null;
}

function MaxBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(HK_BOUNDS);
  }, [map]);
  return null;
}

function UserLocationMarker({ location }: { location: { latitude: number; longitude: number } }) {
  const icon = useMemo(() => L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
    "/>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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
        className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow border border-neutral-200"
      >
        <span className="text-lg font-bold">−</span>
      </button>
      <button
        onClick={() => map.setZoom(map.getZoom() + 1)}
        className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow border border-neutral-200"
      >
        <span className="text-lg font-bold">+</span>
      </button>
    </div>
  );
}

function SwipeZoom() {
  const map = useMap();
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startZoom = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startZoom.current = map.getZoom();
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const deltaY = startY.current - e.clientY;
    const newZoom = Math.min(18, Math.max(10, startZoom.current + deltaY * 0.01));
    map.setZoom(newZoom);
  };

  const onPointerUp = () => setDragging(false);

  useEffect(() => {
    const container = map.getContainer();
    container.addEventListener('pointerdown', onPointerDown as unknown as EventListener);
    container.addEventListener('pointermove', onPointerMove as unknown as EventListener);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown as unknown as EventListener);
      container.removeEventListener('pointermove', onPointerMove as unknown as EventListener);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
    };
  }, [map, dragging]);

  return null;
}

function MapReinit({ stores }: { stores: SushiroStore[] }) {
  const map = useMap();
  const prevCount = useRef(stores.length);

  useEffect(() => {
    if (prevCount.current !== stores.length) {
      prevCount.current = stores.length;
      map.invalidateSize();
    }
  }, [stores, map]);

  return null;
}

function StorePinPulse({ storeId }: { storeId: number }) {
  const map = useMap();
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [pulsing, setPulsing] = useState(true);

  // Find the marker element in the DOM and pulse it
  useEffect(() => {
    if (!pulsing) return;
    const timer = setTimeout(() => setPulsing(false), 1500);
    return () => clearTimeout(timer);
  }, [pulsing]);

  return null;
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

  const [previewId, setPreviewId] = useState<number | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMarkerClick = (store: SushiroStore) => {
    if (previewId === store.id) {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      setPreviewId(null);
      onSelectStore(store);
    } else {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      setPreviewId(store.id);
      previewTimer.current = setTimeout(() => {
        setPreviewId(null);
        previewTimer.current = null;
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-20 bg-neutral-950" style={{ minHeight: '100dvh', minWidth: '100vw' }}>
      <ScrollLock />
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
        maxBounds={HK_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={10}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MaxBounds />
        <FitBoundsOnce stores={stores} />
        <MapReinit stores={stores} />
        <SwipeZoom />
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={markerIcons.get(store.id)}
            eventHandlers={{
              click: () => handleMarkerClick(store),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -20]}
              opacity={1}
              permanent={false}
              className="sushiro-tooltip"
            >
              <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '3px' }}>
                {store.name}
              </div>
              <div style={{ fontSize: '11px', color: '#bbb' }}>
                {getStoreDisplayStatus(store).waitText} · {getStoreDisplayStatus(store).groupText}
              </div>
            </Tooltip>
          </Marker>
        ))}
        {userLocation && <UserLocationMarker location={userLocation} />}
        <ZoomControls />
      </MapContainer>
      <StoreMapLegend />
    </div>
  );
};