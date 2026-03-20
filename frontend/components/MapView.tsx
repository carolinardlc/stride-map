"use client";

import { MapContainer, TileLayer, CircleMarker, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";

const SERVICE_COLORS: Record<string, string> = {
  health: "#e74c3c",
  education: "#3498db",
  greens: "#27ae60",
  work: "#8e44ad",
};

const SERVICE_LABELS: Record<string, string> = {
  health: "Salud",
  education: "Educacion",
  greens: "Areas Verdes",
  work: "Trabajo",
};

interface MapViewProps {
  boundary: FeatureCollection;
  homes: FeatureCollection;
  services: Record<string, FeatureCollection>;
  title: string;
  metrics: Record<string, number>;
}

function FitBounds({ homes }: { homes: FeatureCollection }) {
  const map = useMap();

  useEffect(() => {
    if (homes.features.length === 0) return;
    const bounds = L.geoJSON(homes).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [homes, map]);

  return null;
}

export default function MapView({ boundary, homes, services, title, metrics }: MapViewProps) {
  const covAll = metrics.cov_all != null ? (metrics.cov_all * 100).toFixed(1) : null;

  const homeMarkers = useMemo(() => {
    return homes.features.map((feature, i) => {
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      const covered = feature.properties?.covered_all;
      return (
        <CircleMarker
          key={`home-${i}`}
          center={[coords[1], coords[0]]}
          radius={3}
          pathOptions={{
            color: covered ? "#2ecc71" : "#e74c3c",
            fillColor: covered ? "#2ecc71" : "#e74c3c",
            fillOpacity: 0.7,
            weight: 1,
          }}
        />
      );
    });
  }, [homes]);

  const serviceMarkers = useMemo(() => {
    const markers: React.ReactElement[] = [];
    Object.entries(services).forEach(([cat, geojson]) => {
      const color = SERVICE_COLORS[cat] || "#95a5a6";
      geojson.features.forEach((feature, i) => {
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        markers.push(
          <CircleMarker
            key={`svc-${cat}-${i}`}
            center={[coords[1], coords[0]]}
            radius={5}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 1.5,
            }}
          />
        );
      });
    });
    return markers;
  }, [services]);

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <MapContainer
        center={[-12.16, -76.97]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution="OpenStreetMap HOT"
        />
        <FitBounds homes={homes} />
        <GeoJSON
          data={boundary}
          style={{
            color: "#4a3525",
            weight: 3,
            opacity: 0.8,
            fillColor: "transparent",
            fillOpacity: 0,
            dashArray: "6, 4",
          }}
        />
        {homeMarkers}
        {serviceMarkers}
      </MapContainer>

      {/* Legend overlay */}
      <div style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "var(--xp-cream)",
        border: "1px solid var(--xp-border)",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        boxShadow: "2px 2px 8px var(--xp-shadow)",
        minWidth: 180,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--xp-green)" }}>{title}</div>
        {covAll && (
          <div style={{ marginBottom: 8, fontSize: 11, color: "var(--xp-brown)" }}>
            <strong>Total coverage: {covAll}%</strong>
          </div>
        )}
        <div style={{ borderTop: "1px solid var(--xp-beige)", paddingTop: 6, marginBottom: 4 }}>
          <span style={{ color: "#2ecc71" }}>●</span> Covered home
        </div>
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#e74c3c" }}>●</span> Uncovered home
        </div>
        <div style={{ borderTop: "1px solid var(--xp-beige)", paddingTop: 6 }}>
          {Object.entries(SERVICE_LABELS).map(([cat, label]) => (
            <div key={cat} style={{ marginBottom: 2 }}>
              <span style={{ color: SERVICE_COLORS[cat] }}>●</span> {label}{" "}
              <span style={{ color: "var(--xp-border)", fontSize: 10 }}>
                ({services[cat]?.features.length || 0})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
