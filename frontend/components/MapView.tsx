"use client";

import { MapContainer, TileLayer, CircleMarker, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";

const SERVICE_COLORS: Record<string, string> = {
  health: "#D55E00",
  education: "#0072B2",
  greens: "#009E73",
  work: "#CC79A7",
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

function MapController({ homes, boundary }: { homes: FeatureCollection; boundary: FeatureCollection }) {
  const map = useMap();

  useEffect(() => {
    // Prefer the district boundary so the map always stays centered on the area,
    // falling back to the homes if no boundary geometry is available.
    const fit = () => {
      const source = boundary.features.length > 0 ? boundary : homes;
      if (source.features.length === 0) return;
      const bounds = L.geoJSON(source).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    };

    // Leaflet measures the container size once at mount. Inside a window/modal
    // that opens dynamically the initial size can be 0, leaving the tiles blank
    // until the size is recalculated — so force a recompute on mount, shortly
    // after, and whenever the container resizes (drag/maximize).
    map.invalidateSize();
    fit();
    const t = setTimeout(() => { map.invalidateSize(); fit(); }, 200);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());

    return () => { clearTimeout(t); ro.disconnect(); };
  }, [homes, boundary, map]);

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
            color: covered ? "#009E73" : "#D55E00",
            fillColor: covered ? "#009E73" : "#D55E00",
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
      const color = SERVICE_COLORS[cat] || "#999999";
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController homes={homes} boundary={boundary} />
        <GeoJSON
          data={boundary}
          style={{
            color: "#333333",
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
        background: "#F7F7F7",
        border: "1px solid #BFBFBF",
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
        minWidth: 180,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#333333" }}>{title}</div>
        {covAll && (
          <div style={{ marginBottom: 8, fontSize: 11, color: "#333333" }}>
            <strong>Total coverage: {covAll}%</strong>
          </div>
        )}
        <div style={{ borderTop: "1px solid #E6E6E6", paddingTop: 6, marginBottom: 4 }}>
          <span style={{ color: "#009E73" }}>●</span> Covered home
        </div>
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#D55E00" }}>●</span> Uncovered home
        </div>
        <div style={{ borderTop: "1px solid #E6E6E6", paddingTop: 6 }}>
          {Object.entries(SERVICE_LABELS).map(([cat, label]) => (
            <div key={cat} style={{ marginBottom: 2 }}>
              <span style={{ color: SERVICE_COLORS[cat] }}>●</span> {label}{" "}
              <span style={{ color: "#BFBFBF", fontSize: 10 }}>
                ({services[cat]?.features.length || 0})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
