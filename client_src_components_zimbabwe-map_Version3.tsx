import React, { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface ZimbabweMapProps {
  value?: { lat: number; lng: number } | null;
  onChange?: (coords: { lat: number; lng: number } | null) => void;
  height?: string;
  zoom?: number;
}

const ZW_CENTER = { lat: -19.0154, lng: 29.1549 };

function ClickHandler({ onChange }: { onChange?: (c: { lat: number; lng: number } | null) => void }) {
  useMapEvents({
    click(e) {
      onChange?.(e.latlng);
    },
  });
  return null;
}

export default function ZimbabweMap({ value, onChange, height = "300px", zoom = 6 }: ZimbabweMapProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(value ?? null);

  useEffect(() => setMarker(value ?? null), [value]);

  const handleChange = useCallback((latlng) => {
    setMarker(latlng);
    onChange?.(latlng);
  }, [onChange]);

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : [ZW_CENTER.lat, ZW_CENTER.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickHandler onChange={handleChange} />
        {marker && <Marker position={[marker.lat, marker.lng]} />}
      </MapContainer>
    </div>
  );
}