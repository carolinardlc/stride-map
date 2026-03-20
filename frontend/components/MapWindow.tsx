"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import XPWindow from "./XPWindow";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

const API = "http://localhost:8000/api";

const DISTRICTS = [
  // Lima Centro
  "Breña, Lima, Peru",
  "La Victoria, Lima, Peru",
  "Rimac, Lima, Peru",
  "San Luis, Lima, Peru",
  // Lima Moderna
  "Barranco, Lima, Peru",
  "Jesus Maria, Lima, Peru",
  "La Molina, Lima, Peru",
  "Lince, Lima, Peru",
  "Magdalena del Mar, Lima, Peru",
  "Miraflores, Lima, Peru",
  "Pueblo Libre, Lima, Peru",
  "San Borja, Lima, Peru",
  "San Isidro, Lima, Peru",
  "San Miguel, Lima, Peru",
  "Santiago de Surco, Lima, Peru",
  "Surquillo, Lima, Peru",
  // Lima Norte
  "Ancón, Lima, Peru",
  "Carabayllo, Lima, Peru",
  "Comas, Lima, Peru",
  "Independencia, Lima, Peru",
  "Los Olivos, Lima, Peru",
  "Puente Piedra, Lima, Peru",
  "San Martín de Porres, Lima, Peru",
  "Santa Rosa, Lima, Peru",
  // Lima Sur
  "Chorrillos, Lima, Peru",
  "Lurín, Lima, Peru",
  "Pachacamac, Lima, Peru",
  "Pucusana, Lima, Peru",
  "Punta Hermosa, Lima, Peru",
  "Punta Negra, Lima, Peru",
  "San Bartolo, Lima, Peru",
  "San Juan de Miraflores, Lima, Peru",
  "Santa María del Mar, Lima, Peru",
  "Villa El Salvador, Lima, Peru",
  "Villa María del Triunfo, Lima, Peru",
  // Lima Este
  "Ate, Lima, Peru",
  "Chaclacayo, Lima, Peru",
  "Cieneguilla, Lima, Peru",
  "El Agustino, Lima, Peru",
  "Lurigancho, Lima, Peru",
  "San Juan de Lurigancho, Lima, Peru",
  "Santa Anita, Lima, Peru",
  // Callao
  "Callao, Callao, Peru",
  "Bellavista, Callao, Peru",
  "Carmen de la Legua Reynoso, Callao, Peru",
  "La Perla, Callao, Peru",
  "Mi Peru, Callao, Peru",
  "Ventanilla, Callao, Peru",
];

type OutputTab = "map_before" | "map_after" | "coverage" | "evolution" | "pareto";

const OUTPUT_TABS: { key: OutputTab; label: string }[] = [
  { key: "map_before", label: "Before" },
  { key: "map_after", label: "After" },
  { key: "coverage", label: "Coverage" },
  { key: "evolution", label: "Evolution" },
  { key: "pareto", label: "Pareto" },
];

interface JobResult {
  boundary: GeoJSON.FeatureCollection;
  initial_metrics: Record<string, number>;
  final_metrics: Record<string, number>;
  comparison: Array<Record<string, unknown>>;
  homes_initial: GeoJSON.FeatureCollection;
  homes_optimized: GeoJSON.FeatureCollection;
  services_initial: Record<string, GeoJSON.FeatureCollection>;
  services_optimized: Record<string, GeoJSON.FeatureCollection>;
}

interface MapWindowProps {
  onClose: () => void;
}

export default function MapWindow({ onClose }: MapWindowProps) {
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
  const [activeTab, setActiveTab] = useState<OutputTab>("map_before");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState<Array<{ phase: string; message: string }>>([]);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  // Check cache when district changes
  useEffect(() => {
    let cancelled = false;
    setCached(false);
    setResult(null);
    setStatus("idle");
    setError(null);

    const checkCache = async () => {
      try {
        const res = await fetch(`${API}/cache?place=${encodeURIComponent(selectedDistrict)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setResult(data);
          setCached(true);
          setStatus("done");
          setActiveTab("map_before");
        }
      } catch {
        // No cache, that's fine
      }
    };
    checkCache();
    return () => { cancelled = true; };
  }, [selectedDistrict]);

  const runOptimization = useCallback(async () => {
    setStatus("starting");
    setProgress([]);
    setResult(null);
    setError(null);
    setCached(false);
    setActiveTab("map_before");

    try {
      const res = await fetch(`${API}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: selectedDistrict }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to start optimization");
      }
      const { job_id } = await res.json();
      setJobId(job_id);
      setStatus("running");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("failed");
    }
  }, [selectedDistrict]);

  // Poll job status
  useEffect(() => {
    if (!jobId || status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/jobs/${jobId}`);
        const data = await res.json();
        setProgress(data.progress || []);

        if (data.status === "done") {
          setStatus("done");
          // Fetch full result
          const resultRes = await fetch(`${API}/jobs/${jobId}/result`);
          const resultData = await resultRes.json();
          setResult(resultData);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.error || "Optimization failed");
          clearInterval(interval);
        }
      } catch {
        // Network error, keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isRunning = status === "running" || status === "starting";
  const lastProgress = progress.length > 0 ? progress[progress.length - 1] : null;

  return (
    <XPWindow title="StrideMap" onClose={onClose} width="90vw" height="90vh">
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Toolbar */}
        <div style={{
          padding: "8px 12px",
          background: "var(--xp-beige-light)",
          borderBottom: "1px solid var(--xp-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          position: "relative",
          zIndex: 1100,
        }}>
          {/* Custom dropdown */}
          <div style={{ position: "relative", flex: 1, maxWidth: 350 }}>
            <button
              onClick={() => !isRunning && setDropdownOpen(!dropdownOpen)}
              disabled={isRunning}
              style={{
                width: "100%",
                padding: "6px 28px 6px 10px",
                borderRadius: 4,
                border: "1px solid var(--xp-border)",
                background: "white",
                fontSize: 12,
                color: "var(--xp-brown)",
                textAlign: "left",
                cursor: isRunning ? "not-allowed" : "pointer",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              {selectedDistrict.split(",")[0]}
              <span style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 10,
                color: "var(--xp-border)",
              }}>
                ▼
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 2,
                  background: "var(--xp-cream)",
                  border: "1px solid var(--xp-border)",
                  borderRadius: 4,
                  boxShadow: "3px 3px 10px var(--xp-shadow)",
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: 100,
                }}>
                  {DISTRICTS.map((d) => (
                    <div
                      key={d}
                      onClick={() => { setSelectedDistrict(d); setDropdownOpen(false); }}
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        color: d === selectedDistrict ? "white" : "var(--xp-brown)",
                        background: d === selectedDistrict ? "var(--xp-green)" : "transparent",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--xp-beige-light)",
                      }}
                      onMouseEnter={(e) => {
                        if (d !== selectedDistrict) {
                          e.currentTarget.style.background = "var(--xp-beige-light)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (d !== selectedDistrict) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {d.split(",")[0]}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={runOptimization}
            disabled={isRunning}
            style={{
              padding: "6px 16px",
              borderRadius: 4,
              border: "1px solid var(--xp-green)",
              background: isRunning ? "var(--xp-border)" : "var(--xp-green)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: isRunning ? "wait" : "pointer",
            }}
          >
            {isRunning ? "Running..." : cached ? "Re-run" : "Optimize"}
          </button>

          {isRunning && lastProgress && (
            <span style={{ fontSize: 11, color: "var(--xp-border)", marginLeft: 8 }}>
              {lastProgress.message}
            </span>
          )}
        </div>

        {/* Output tabs */}
        {result && (
          <div style={{
            padding: "8px 12px",
            display: "flex",
            gap: 6,
            flexShrink: 0,
            background: "var(--xp-beige-light)",
            borderBottom: "1px solid var(--xp-border)",
            overflowX: "auto",
          }}>
            {OUTPUT_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`output-bubble ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {status === "idle" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--xp-border)",
              fontSize: 14,
            }}>
              Select a district and click Optimize to begin
            </div>
          )}

          {isRunning && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 16,
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: "3px solid var(--xp-beige)",
                borderTop: "3px solid var(--xp-green)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <span style={{ color: "var(--xp-brown)", fontSize: 13 }}>
                {lastProgress?.message || "Starting..."}
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {status === "failed" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#c0392b",
              fontSize: 13,
            }}>
              {error || "Something went wrong"}
            </div>
          )}

          {result && (activeTab === "map_before" || activeTab === "map_after") && (
            <MapView
              boundary={result.boundary}
              homes={activeTab === "map_before" ? result.homes_initial : result.homes_optimized}
              services={activeTab === "map_before" ? result.services_initial : result.services_optimized}
              title={activeTab === "map_before" ? "Before Optimization" : "After Optimization"}
              metrics={activeTab === "map_before" ? result.initial_metrics : result.final_metrics}
            />
          )}

          {result && activeTab === "coverage" && (
            <div style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", color: "var(--xp-green)", fontSize: 16 }}>Coverage Comparison</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--xp-beige-light)" }}>
                    <th style={{ padding: 8, textAlign: "left", borderBottom: "2px solid var(--xp-border)" }}>Metric</th>
                    <th style={{ padding: 8, textAlign: "right", borderBottom: "2px solid var(--xp-border)" }}>Before</th>
                    <th style={{ padding: 8, textAlign: "right", borderBottom: "2px solid var(--xp-border)" }}>After</th>
                    <th style={{ padding: 8, textAlign: "right", borderBottom: "2px solid var(--xp-border)" }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--xp-beige)" }}>
                      <td style={{ padding: 8, color: "var(--xp-brown)" }}>{String(row.metric)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{((row.initial as number) * 100).toFixed(1)}%</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{((row.final as number) * 100).toFixed(1)}%</td>
                      <td style={{
                        padding: 8,
                        textAlign: "right",
                        color: (row.improvement as number) > 0 ? "var(--xp-green)" : "var(--xp-brown)",
                        fontWeight: 600,
                      }}>
                        {(row.improvement as number) > 0 ? "+" : ""}{((row.improvement as number) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result && (activeTab === "evolution" || activeTab === "pareto") && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--xp-border)",
              fontSize: 13,
            }}>
              Chart visualization coming soon
            </div>
          )}
        </div>
      </div>
    </XPWindow>
  );
}
