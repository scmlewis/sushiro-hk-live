import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../leaflet-fix';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-markercluster';
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
  const isWalkIn = status.accentColor === 'emerald' && !status.isClosed;
  const color = getMarkerColor(status.accentColor);

  const label = isWalkIn ? '直入' : status.groupText;

  return L.divIcon({
    className: 'sushiro-marker',
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 9999px;
      white-space: nowrap;
      text-align: center;
      line-height: 1.3;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid rgba(255,255,255,0.8);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.02em;
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [25, 12],
  });
}

function FitBounds({ stores }: { stores: SushiroStore[] }) {
  const map = useMap();

  useEffect(() => {
    if (stores.length === 0) return;
    const bounds = L.latLngBounds(
      stores.map((s) => [s.latitude, s.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [stores, map]);

  return null;
}

function UserLocationMarker({ location }: { location: { latitude: number; longitude: number } }) {
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={L.divIcon({
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
      })}
    />
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

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] min-h-[400px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds stores={stores} />
        <MarkerClusterGroup
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          zoomToBoundsOnClick
        >
          {stores.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={createMarkerIcon(store)}
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
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {getStoreDisplayStatus(store).waitText} · {getStoreDisplayStatus(store).groupText}
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MarkerClusterGroup>
        {userLocation && <UserLocationMarker location={userLocation} />}
      </MapContainer>
      <StoreMapLegend />
    </div>
  );
};
