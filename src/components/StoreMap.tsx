import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER } from '../config';
import { SushiroStore, StoreQueueMap } from '../types';
import { getStoreDisplayStatus, getMarkerColor } from '../utils/status';
import { StoreMapLegend } from './StoreMapLegend';

const ZOOM_THRESHOLD = 13;

interface StoreMapProps {
  stores: SushiroStore[];
  queues: StoreQueueMap;
  userLocation: { latitude: number; longitude: number } | null;
  onSelectStore: (store: SushiroStore) => void;
}

const HK_BOUNDS = L.latLngBounds(
  [[22.15, 113.85], [22.65, 114.40]] as [[number, number], [number, number]]
);

function createMarkerDot(color: string, isPreview = false): L.DivIcon {
   const previewRing = isPreview
     ? `box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4); animation: marker-pulse 1s ease-in-out infinite;`
     : `box-shadow: 0 2px 8px rgba(0,0,0,0.4);`;

   return L.divIcon({
     className: 'sushiro-marker',
     html: `<div style="
       background: ${color};
       width: 32px;
       height: 32px;
       border-radius: 50%;
       ${previewRing}
       border: 2px solid rgba(255,255,255,0.9);
       transition: transform 0.15s ease, opacity 0.15s ease;
       will-change: transform, opacity;
     "/>`,
     iconSize: [32, 32],
     iconAnchor: [16, 16],
   });
 }

 function createMarkerIcon(store: SushiroStore, zoom: number, isPreview = false): L.DivIcon {
    if (zoom < ZOOM_THRESHOLD) {
      return createMarkerDot(getMarkerColor(getStoreDisplayStatus(store).accentColor), isPreview);
    }
    const status = getStoreDisplayStatus(store);
    const color = getMarkerColor(status.accentColor);
    const label = !status.isClosed ? `${store.waitingGroup}組` : status.waitText;
    const previewRing = isPreview
      ? `box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4); animation: marker-pulse 1s ease-in-out infinite;`
      : `box-shadow: 0 2px 8px rgba(0,0,0,0.4);`;

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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        ${previewRing}
        border: 2px solid rgba(255,255,255,0.9);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        letter-spacing: 0.02em;
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

 function PreviewTooltip({ store }: { store: SushiroStore }) {
   const map = useMap();
   const status = getStoreDisplayStatus(store);
   const pos = useMemo(() => L.latLng(store.latitude, store.longitude), [store.latitude, store.longitude]);
   const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

   useEffect(() => {
     const update = () => {
       const pt = map.latLngToContainerPoint(pos);
       setOffset({ x: pt.x, y: pt.y - 36 });
     };
     update();
     map.on('move zoom resize', update);
     return () => { map.off('move zoom resize', update); };
   }, [map, pos]);

   return ReactDOM.createPortal(
     <div
       className="pointer-events-none absolute z-[1000]"
       style={{
         left: offset.x,
         top: offset.y,
         transform: 'translate(-50%, -100%)',
       }}
     >
       <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-xl px-3 py-2 shadow-xl">
         <div className="text-[11px] font-black text-white leading-tight">{store.name}</div>
         <div className="text-[10px] font-bold text-neutral-400 mt-0.5">{status.waitText}</div>
       </div>
       <div className="flex justify-center">
         <div className="w-2 h-2 bg-neutral-900/95 rotate-45 -mt-1 border-r border-b border-neutral-700" />
       </div>
     </div>,
     map.getContainer(),
   );
 }

 function MapZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
   const map = useMap();
   useEffect(() => {
     onZoomChange(map.getZoom());
     const handler = () => onZoomChange(map.getZoom());
     map.on('zoomend', handler);
     return () => { map.off('zoomend', handler); };
   }, [map, onZoomChange]);
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
     return MAP_CENTER;
   }, [userLocation]);

   const [zoom, setZoom] = useState(11);
   const [previewId, setPreviewId] = useState<number | null>(null);
   const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   const previewStore = useMemo(
     () => (previewId !== null ? stores.find((s) => s.id === previewId) ?? null : null),
     [stores, previewId],
   );

   const markerIcons = useMemo(() => {
     const m = new Map<number, L.DivIcon>();
     stores.forEach((s) => m.set(s.id, createMarkerIcon(s, zoom, previewId === s.id)));
     return m;
   }, [stores, zoom, previewId]);

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
        zoomControl={false}
        attributionControl={false}
        maxBounds={HK_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={10}
        maxZoom={18}
        dragging={true}
        touchZoom={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MaxBounds />
        <FitBoundsOnce stores={stores} />
        <MapReinit stores={stores} />
        <MapZoomTracker onZoomChange={setZoom} />
         {stores.map((store) => (
           <Marker
             key={store.id}
             position={[store.latitude, store.longitude]}
             icon={markerIcons.get(store.id)}
             eventHandlers={{
               click: () => handleMarkerClick(store),
             }}
           />
         ))}
        {userLocation && <UserLocationMarker location={userLocation} />}
        {previewStore && <PreviewTooltip store={previewStore} />}
      </MapContainer>
      <StoreMapLegend />
    </div>
  );
};