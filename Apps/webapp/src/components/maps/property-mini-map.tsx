"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

type LatLng = {
  lat: number;
  lng: number;
};

interface PropertyMiniMapProps {
  center: LatLng;
  label?: string;
  height?: number;
}

function RecenterMap({ center }: { center: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);

  return null;
}

export function PropertyMiniMap({ center, label, height = 240 }: PropertyMiniMapProps) {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:linear-gradient(135deg,#4f46e5,#0ea5e9);border:3px solid white;box-shadow:0 10px 20px rgba(79,70,229,0.28)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: "100%", height: `${height}px` }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[center.lat, center.lng]} icon={markerIcon}>
          <Popup>
            <div className="text-sm font-medium text-slate-700">{label || "Property location"}</div>
          </Popup>
        </Marker>

        <RecenterMap center={center} />
      </MapContainer>
    </div>
  );
}