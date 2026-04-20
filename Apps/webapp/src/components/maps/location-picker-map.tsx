"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = {
  lat: number;
  lng: number;
};

interface LocationPickerMapProps {
  center: LatLng;
  onLocationChange: (coords: LatLng) => void;
}

function RecenterMap({ center }: { center: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);

  return null;
}

function ClickHandler({ onLocationChange }: { onLocationChange: (coords: LatLng) => void }) {
  useMapEvents({
    click: (event) => {
      onLocationChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export function LocationPickerMap({ center, onLocationChange }: LocationPickerMapProps) {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<div style="width:18px;height:18px;border-radius:9999px;background:#4f46e5;border:3px solid white;box-shadow:0 6px 12px rgba(79,70,229,0.45)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: "100%", height: "280px" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[center.lat, center.lng]}
          draggable
          icon={markerIcon}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const latLng = marker.getLatLng();
              onLocationChange({ lat: latLng.lat, lng: latLng.lng });
            },
          }}
        />

        <ClickHandler onLocationChange={onLocationChange} />
        <RecenterMap center={center} />
      </MapContainer>
    </div>
  );
}
