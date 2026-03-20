"use client";

import XPWindow from "./XPWindow";

interface AboutWindowProps {
  onClose: () => void;
}

export default function AboutWindow({ onClose }: AboutWindowProps) {
  return (
    <XPWindow title="About - StrideMap" onClose={onClose} width="600px" height="auto">
      <div style={{ padding: 24, color: "var(--xp-brown)", lineHeight: 1.7, fontSize: 13 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18, color: "var(--xp-green)" }}>
          StrideMap
        </h2>
        <p style={{ margin: "0 0 12px" }}>
          <strong>15-Minute City Planning System</strong>
        </p>
        <p style={{ margin: "0 0 12px" }}>
          This tool optimizes urban accessibility by analyzing whether all residents in a district
          can reach essential services — health, education, green spaces, and work — within 15
          minutes of walking.
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Using real data from OpenStreetMap and a multi-objective optimization algorithm (NSGA-II),
          the system proposes minimal changes to service locations that maximize coverage for all
          residents.
        </p>

        <h3 style={{ margin: "16px 0 8px", fontSize: 14, color: "var(--xp-green)" }}>How it works</h3>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Select a district to analyze</li>
          <li>The system loads the pedestrian network, services, and residences</li>
          <li>It evaluates current accessibility coverage</li>
          <li>NSGA-II optimizes service placement to reach 100% coverage</li>
          <li>Compare the before and after maps side by side</li>
        </ol>

        <h3 style={{ margin: "16px 0 8px", fontSize: 14, color: "var(--xp-green)" }}>Service categories</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li><span style={{ color: "#e74c3c" }}>●</span> Health — hospitals, clinics, pharmacies</li>
          <li><span style={{ color: "#3498db" }}>●</span> Education — schools, universities</li>
          <li><span style={{ color: "#27ae60" }}>●</span> Green spaces — parks, gardens, playgrounds</li>
          <li><span style={{ color: "#8e44ad" }}>●</span> Work — offices, commercial areas, shops</li>
        </ul>

        <div style={{ marginTop: 20, padding: 12, background: "var(--xp-beige-light)", borderRadius: 4, fontSize: 11, color: "var(--xp-border)" }}>
          Built with OSMnx, NetworkX, PyMOO, and Leaflet
        </div>
      </div>
    </XPWindow>
  );
}
