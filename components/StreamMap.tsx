import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Feature, LineString } from 'geojson';
import { GeoPoint, StreamParams } from '../types';

// Fix for default Leaflet icon not showing in browser ESM environments
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};
fixLeafletIcons();

interface StreamMapProps {
  params: StreamParams;
  meanderGeo: Feature<LineString>;
  onPointMove: (index: number, point: GeoPoint) => void;
  onPointAdd: (point: GeoPoint) => void;
  onPointDelete: (index: number) => void;
}

const FitBounds = ({ meanderGeo }: { meanderGeo: Feature<LineString> }) => {
  const map = useMap();
  
  useEffect(() => {
    if (meanderGeo && meanderGeo.geometry.coordinates.length > 0) {
      const coords = meanderGeo.geometry.coordinates.map(c => [c[1], c[0]] as L.LatLngExpression);
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [100, 100], animate: false });
    }
  }, []); // Run once on mount
  return null;
};

// Component to handle map clicks
const MapEvents = ({ onAdd }: { onAdd: (pt: GeoPoint) => void }) => {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Draggable Marker Component
const DraggableMarker = ({ 
  position, 
  index,
  total,
  onDragEnd,
  onDelete
}: { 
  position: GeoPoint, 
  index: number,
  total: number,
  onDragEnd: (pt: GeoPoint) => void,
  onDelete: () => void
}) => {
  const markerRef = useRef<L.Marker>(null);
  
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onDragEnd({ lat, lng });
        }
      },
      contextmenu() {
        // Right click to delete
        onDelete();
      }
    }),
    [onDragEnd, onDelete],
  );

  let label = `Point ${index + 1}`;
  let color = "text-slate-800";
  if (index === 0) { label = "Start (Upstream)"; color = "text-blue-600"; }
  if (index === total - 1) { label = "End (Downstream)"; color = "text-red-600"; }

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
      zIndexOffset={1000}
      title="Drag to move, Right-click to delete"
    >
      <Popup minWidth={90}>
        <div className="text-center">
          <span className={`font-bold ${color}`}>{label}</span>
          <br/>
          <span className="text-xs text-slate-500">Right-click marker to remove</span>
        </div>
      </Popup>
    </Marker>
  );
};

const StreamMap: React.FC<StreamMapProps> = ({ params, meanderGeo, onPointMove, onPointAdd, onPointDelete }) => {
  const valleyPositions: L.LatLngExpression[] = params.valleyLine.map(p => [p.lat, p.lng]);
  const meanderPositions: L.LatLngExpression[] = meanderGeo.geometry.coordinates.map(c => [c[1], c[0]]);

  // Calculate center based on first point, or fallback
  const center: L.LatLngExpression = params.valleyLine.length > 0 
    ? [params.valleyLine[0].lat, params.valleyLine[0].lng] 
    : [-29.356, 29.997];

  return (
    <MapContainer 
      center={center} 
      zoom={15} 
      className="w-full h-full rounded-xl shadow-inner outline-none"
      scrollWheelZoom={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenTopoMap (Terrain)">
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite Imagery">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Standard Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <MapEvents onAdd={onPointAdd} />

      {/* Valley Line (Degraded / Axis) */}
      <Polyline 
        positions={valleyPositions} 
        pathOptions={{ color: '#ef4444', dashArray: '8, 8', opacity: 0.6, weight: 2 }} 
      />
      
      {/* Meander Line (Restored) */}
      <Polyline 
        positions={meanderPositions} 
        pathOptions={{ color: '#06b6d4', weight: params.bankfullWidth > 5 ? 5 : 3, opacity: 1.0, lineJoin: 'round' }} 
      />

      {/* Render All Control Points */}
      {params.valleyLine.map((pt, idx) => (
        <DraggableMarker 
          key={`${idx}-${pt.lat}-${pt.lng}`}
          index={idx}
          total={params.valleyLine.length}
          position={pt} 
          onDragEnd={(newPt) => onPointMove(idx, newPt)} 
          onDelete={() => onPointDelete(idx)}
        />
      ))}
      
      <FitBounds meanderGeo={meanderGeo} />
    </MapContainer>
  );
};

export default StreamMap;