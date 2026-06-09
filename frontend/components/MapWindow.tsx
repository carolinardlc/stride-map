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

type OutputTab = "map_before" | "map_after" | "coverage" | "params" | "hypervolume" | "evolution" | "pareto" | "pareto_matrix";

const OUTPUT_TABS: { key: OutputTab; label: string }[] = [
  { key: "map_before", label: "Before" },
  { key: "map_after", label: "After" },
  { key: "coverage", label: "Coverage" },
  { key: "params", label: "Parámetros" },
  { key: "hypervolume", label: "Hipervolumen" },
  { key: "evolution", label: "Evolution" },
  { key: "pareto", label: "Pareto" },
  { key: "pareto_matrix", label: "Matriz" },
];

// Hipervolumen (HV) calculado sobre los datos de San Juan de Miraflores
// (normalización min-max en marco común, ref = 1,1; ver scripts/hypervolume.py).
const HV_RESULTS: { set: string; hv: string; pct: string }[] = [
  { set: "Frente final", hv: "1,6105", pct: "100 %" },
  { set: "Espacio explorado", hv: "1,6105", pct: "100 %" },
];

// Configuración del algoritmo NSGA-II (constante en todos los distritos).
const ALGO_PARAMS: { param: string; value: string }[] = [
  { param: "Tamaño de población (pop_size)", value: "50" },
  { param: "Número de generaciones (max_gen)", value: "200" },
  { param: "Semilla aleatoria (seed)", value: "42" },
  { param: "Probabilidad de cruce (prob)", value: "0,9" },
  { param: "Probabilidad de mutación (prob)", value: "0,7" },
  { param: "Porcentaje inicial de cambios", value: "2 %" },
  { param: "Umbral peatonal (minutes)", value: "15 min" },
  { param: "Velocidad peatonal (speed_kmh)", value: "4,5 km/h" },
];

interface EvolutionPoint {
  generation: number;
  mean_exchanges: number;
  min_exchanges: number;
  max_exchanges: number;
  best_objective: number;
  mean_objective: number;
}

interface ParetoPoint {
  "1-cov_health": number;
  "1-cov_education": number;
  "1-cov_greens": number;
  "1-cov_work": number;
  change_ratio: number;
  score: number;
  solution_index: number;
}

// Punto del espacio de objetivos explorado por NSGA-II (sin score/solution_index).
interface ExploredPoint {
  "1-cov_health": number;
  "1-cov_education": number;
  "1-cov_greens": number;
  "1-cov_work": number;
  change_ratio: number;
  generation?: number;
}

interface JobResult {
  boundary: GeoJSON.FeatureCollection;
  initial_metrics: Record<string, number>;
  final_metrics: Record<string, number>;
  comparison: Array<Record<string, unknown>>;
  homes_initial: GeoJSON.FeatureCollection;
  homes_optimized: GeoJSON.FeatureCollection;
  services_initial: Record<string, GeoJSON.FeatureCollection>;
  services_optimized: Record<string, GeoJSON.FeatureCollection>;
  evolution?: EvolutionPoint[];
  pareto?: ParetoPoint[];
  explored?: ExploredPoint[];
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
              color: "#D55E00",
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
            // Tabla sobria estilo paper académico: solo blanco y negro, tipografía
            // serif y reglas horizontales (booktabs). Sin colores ni fondos.
            <div style={{
              padding: 32,
              height: "100%",
              overflow: "auto",
              background: "#ffffff",
              color: "#000000",
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
            }}>
              <h3 style={{
                margin: "0 0 14px",
                color: "#000000",
                fontSize: 15,
                fontWeight: "bold",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
              }}>
                Comparación de cobertura
              </h3>
              <table style={{
                borderCollapse: "collapse",
                fontSize: 13,
                color: "#000000",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
                minWidth: 460,
              }}>
                <thead>
                  <tr style={{ borderTop: "2px solid #000000", borderBottom: "1px solid #000000" }}>
                    <th style={{ padding: "6px 16px 6px 0", textAlign: "left", fontWeight: "bold" }}>Métrica</th>
                    <th style={{ padding: "6px 16px", textAlign: "right", fontWeight: "bold" }}>Antes</th>
                    <th style={{ padding: "6px 16px", textAlign: "right", fontWeight: "bold" }}>Después</th>
                    <th style={{ padding: "6px 0 6px 16px", textAlign: "right", fontWeight: "bold" }}>Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row, i) => {
                    const imp = row.improvement as number;
                    const sign = imp > 0 ? "+" : imp < 0 ? "−" : "";
                    const isLast = i === result.comparison.length - 1;
                    return (
                      <tr key={i} style={{ borderBottom: isLast ? "2px solid #000000" : "none" }}>
                        <td style={{ padding: "5px 16px 5px 0", textAlign: "left" }}>{String(row.metric)}</td>
                        <td style={{ padding: "5px 16px", textAlign: "right" }}>{((row.initial as number) * 100).toFixed(1)}%</td>
                        <td style={{ padding: "5px 16px", textAlign: "right" }}>{((row.final as number) * 100).toFixed(1)}%</td>
                        <td style={{ padding: "5px 0 5px 16px", textAlign: "right" }}>
                          {sign}{Math.abs(imp * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result && activeTab === "params" && (
            // Misma estética que Coverage: blanco y negro, serif, reglas booktabs.
            <div style={{
              padding: 32,
              height: "100%",
              overflow: "auto",
              background: "#ffffff",
              color: "#000000",
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
            }}>
              <h3 style={{
                margin: "0 0 14px",
                color: "#000000",
                fontSize: 15,
                fontWeight: "bold",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
              }}>
                Parámetros del algoritmo NSGA-II
              </h3>
              <table style={{
                borderCollapse: "collapse",
                fontSize: 13,
                color: "#000000",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
                minWidth: 460,
              }}>
                <thead>
                  <tr style={{ borderTop: "2px solid #000000", borderBottom: "1px solid #000000" }}>
                    <th style={{ padding: "6px 16px 6px 0", textAlign: "left", fontWeight: "bold" }}>Parámetro</th>
                    <th style={{ padding: "6px 0 6px 16px", textAlign: "right", fontWeight: "bold" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {ALGO_PARAMS.map((row, i) => {
                    const isLast = i === ALGO_PARAMS.length - 1;
                    return (
                      <tr key={i} style={{ borderBottom: isLast ? "2px solid #000000" : "none" }}>
                        <td style={{ padding: "5px 16px 5px 0", textAlign: "left" }}>{row.param}</td>
                        <td style={{ padding: "5px 0 5px 16px", textAlign: "right" }}>{row.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result && activeTab === "hypervolume" && (
            // Misma estética que Coverage/Parámetros: blanco y negro, serif, booktabs.
            <div style={{
              padding: 32,
              height: "100%",
              overflow: "auto",
              background: "#ffffff",
              color: "#000000",
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
            }}>
              <h3 style={{
                margin: "0 0 14px",
                color: "#000000",
                fontSize: 15,
                fontWeight: "bold",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
              }}>
                Hipervolumen del frente de Pareto y del espacio explorado
              </h3>
              <table style={{
                borderCollapse: "collapse",
                fontSize: 13,
                color: "#000000",
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
                minWidth: 460,
              }}>
                <thead>
                  <tr style={{ borderTop: "2px solid #000000", borderBottom: "1px solid #000000" }}>
                    <th style={{ padding: "6px 16px 6px 0", textAlign: "left", fontWeight: "bold" }}>Conjunto</th>
                    <th style={{ padding: "6px 16px", textAlign: "right", fontWeight: "bold" }}>HV</th>
                    <th style={{ padding: "6px 0 6px 16px", textAlign: "right", fontWeight: "bold" }}>% del máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {HV_RESULTS.map((row, i) => {
                    const isLast = i === HV_RESULTS.length - 1;
                    return (
                      <tr key={i} style={{ borderBottom: isLast ? "2px solid #000000" : "none" }}>
                        <td style={{ padding: "5px 16px 5px 0", textAlign: "left" }}>{row.set}</td>
                        <td style={{ padding: "5px 16px", textAlign: "right" }}>{row.hv}</td>
                        <td style={{ padding: "5px 0 5px 16px", textAlign: "right" }}>{row.pct}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result && activeTab === "evolution" && (
            <EvolutionChart data={result.evolution ?? []} />
          )}

          {result && activeTab === "pareto" && (
            <ParetoChart data={result.pareto ?? []} />
          )}

          {result && activeTab === "pareto_matrix" && (
            <ParetoMatrix data={result.pareto ?? []} explored={result.explored ?? []} />
          )}
        </div>
      </div>
    </XPWindow>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "var(--xp-border)",
      fontSize: 13,
    }}>
      {message}
    </div>
  );
}

export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="No evolution data — rerun the optimization to populate this view." />;
  }

  const W = 760;
  const H = 380;
  const P = { top: 30, right: 60, bottom: 50, left: 60 };
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  const gens = data.map((d) => d.generation);
  const xMin = Math.min(...gens);
  const xMax = Math.max(...gens);
  const xSpan = Math.max(1, xMax - xMin);

  const exMax = Math.max(...data.map((d) => d.max_exchanges));
  const exMin = 0;
  const exSpan = Math.max(1, exMax - exMin);

  const objs = data.map((d) => d.best_objective);
  const objMin = Math.min(...objs);
  const objMax = Math.max(...objs);
  const objSpan = Math.max(1e-9, objMax - objMin);

  const xScale = (g: number) => P.left + ((g - xMin) / xSpan) * innerW;
  const yEx = (v: number) => P.top + innerH - ((v - exMin) / exSpan) * innerH;
  const yObj = (v: number) => P.top + innerH - ((v - objMin) / objSpan) * innerH;

  const bandPath = [
    ...data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.generation)},${yEx(d.max_exchanges)}`),
    ...data.slice().reverse().map((d) => `L${xScale(d.generation)},${yEx(d.min_exchanges)}`),
    "Z",
  ].join(" ");

  const meanPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.generation)},${yEx(d.mean_exchanges)}`).join(" ");
  const bestPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.generation)},${yObj(d.best_objective)}`).join(" ");

  const xTicks = 6;
  const yTicks = 5;

  return (
    <div style={{ padding: 12, height: "100%", overflow: "auto" }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#333333" }}>
        NSGA-II progress across {data.length} generations
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        <rect x={P.left} y={P.top} width={innerW} height={innerH} fill="#fff" stroke="#BFBFBF" />

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = exMin + ((exMax - exMin) * i) / yTicks;
          const y = yEx(v);
          return (
            <g key={`yl-${i}`}>
              <line x1={P.left} x2={P.left + innerW} y1={y} y2={y} stroke="#eee" />
              <text x={P.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#333333">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = objMin + ((objMax - objMin) * i) / yTicks;
          const y = yObj(v);
          return (
            <text key={`yr-${i}`} x={P.left + innerW + 6} y={y + 4} textAnchor="start" fontSize="10" fill="#CC79A7">
              {v.toFixed(3)}
            </text>
          );
        })}

        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const v = xMin + ((xMax - xMin) * i) / xTicks;
          const x = xScale(v);
          return (
            <g key={`xl-${i}`}>
              <line x1={x} x2={x} y1={P.top} y2={P.top + innerH} stroke="#EEEEEE" />
              <text x={x} y={P.top + innerH + 16} textAnchor="middle" fontSize="10" fill="#333333">
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        <path d={bandPath} fill="#009E73" opacity={0.15} />
        <path d={meanPath} fill="none" stroke="#009E73" strokeWidth={2} />
        <path d={bestPath} fill="none" stroke="#CC79A7" strokeWidth={2} strokeDasharray="4 3" />

        <text x={P.left + innerW / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#333333">
          Generation
        </text>
        <text x={14} y={P.top + innerH / 2} textAnchor="middle" fontSize="11" fill="#009E73" transform={`rotate(-90 14 ${P.top + innerH / 2})`}>
          Exchanges per individual
        </text>
        <text x={W - 14} y={P.top + innerH / 2} textAnchor="middle" fontSize="11" fill="#CC79A7" transform={`rotate(90 ${W - 14} ${P.top + innerH / 2})`}>
          Best objective (lower is better)
        </text>

        <g transform={`translate(${P.left + 10}, ${P.top + 10})`}>
          <rect width="220" height="48" fill="#fff" stroke="#BFBFBF" opacity={0.95} />
          <rect x={8} y={10} width={14} height={10} fill="#009E73" opacity={0.3} />
          <line x1={8} x2={22} y1={15} y2={15} stroke="#009E73" strokeWidth={2} />
          <text x={28} y={19} fontSize="11" fill="#333333">mean exchanges (min–max band)</text>
          <line x1={8} x2={22} y1={35} y2={35} stroke="#CC79A7" strokeWidth={2} strokeDasharray="4 3" />
          <text x={28} y={39} fontSize="11" fill="#333333">best objective</text>
        </g>
      </svg>
    </div>
  );
}

function ParetoChart({ data }: { data: ParetoPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="No Pareto front — rerun the optimization to populate this view." />;
  }

  const W = 760;
  const H = 420;
  const P = { top: 30, right: 30, bottom: 60, left: 70 };
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  const points = data.map((p) => {
    const meanCov = 1 - (p["1-cov_health"] + p["1-cov_education"] + p["1-cov_greens"] + p["1-cov_work"]) / 4;
    return { ...p, meanCov };
  });

  const xs = points.map((p) => p.change_ratio);
  const ys = points.map((p) => p.meanCov);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = Math.max(1e-9, xMax - xMin);
  const ySpan = Math.max(1e-9, yMax - yMin);

  const pad = 0.05;
  const xScale = (v: number) => P.left + ((v - xMin) / xSpan) * innerW * (1 - 2 * pad) + innerW * pad;
  const yScale = (v: number) => P.top + innerH - (((v - yMin) / ySpan) * innerH * (1 - 2 * pad) + innerH * pad);

  const scores = points.map((p) => p.score);
  const scoreMin = Math.min(...scores);
  const scoreMax = Math.max(...scores);
  const scoreSpan = Math.max(1e-9, scoreMax - scoreMin);

  const bestIdx = points.reduce((best, p, i) => (p.score < points[best].score ? i : best), 0);

  const xTicks = 6;
  const yTicks = 5;

  return (
    <div style={{ padding: 12, height: "100%", overflow: "auto" }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#333333" }}>
        {points.length} Pareto-optimal solutions — selected best in green
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
        <rect x={P.left} y={P.top} width={innerW} height={innerH} fill="#fff" stroke="#BFBFBF" />

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = yMin + ((yMax - yMin) * i) / yTicks;
          const y = yScale(v);
          return (
            <g key={`yl-${i}`}>
              <line x1={P.left} x2={P.left + innerW} y1={y} y2={y} stroke="#eee" />
              <text x={P.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#333333">
                {(v * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}

        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const v = xMin + ((xMax - xMin) * i) / xTicks;
          const x = xScale(v);
          return (
            <g key={`xl-${i}`}>
              <line x1={x} x2={x} y1={P.top} y2={P.top + innerH} stroke="#EEEEEE" />
              <text x={x} y={P.top + innerH + 16} textAnchor="middle" fontSize="10" fill="#333333">
                {(v * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const t = (p.score - scoreMin) / scoreSpan;
          const isBest = i === bestIdx;
          const fill = isBest ? "#009E73" : `rgba(0, 114, 178, ${0.85 - 0.55 * t})`;
          return (
            <circle
              key={i}
              cx={xScale(p.change_ratio)}
              cy={yScale(p.meanCov)}
              r={isBest ? 7 : 4}
              fill={fill}
              stroke={isBest ? "#00785A" : "#005685"}
              strokeWidth={isBest ? 2 : 0.5}
            >
              <title>
                {`Solution #${p.solution_index}\nChange ratio: ${(p.change_ratio * 100).toFixed(2)}%\nMean coverage: ${(p.meanCov * 100).toFixed(2)}%\nhealth: ${((1 - p["1-cov_health"]) * 100).toFixed(1)}%\neducation: ${((1 - p["1-cov_education"]) * 100).toFixed(1)}%\ngreens: ${((1 - p["1-cov_greens"]) * 100).toFixed(1)}%\nwork: ${((1 - p["1-cov_work"]) * 100).toFixed(1)}%\nscore: ${p.score.toFixed(3)}`}
              </title>
            </circle>
          );
        })}

        <text x={P.left + innerW / 2} y={H - 18} textAnchor="middle" fontSize="11" fill="#333333">
          Change ratio (fraction of locations swapped)
        </text>
        <text x={18} y={P.top + innerH / 2} textAnchor="middle" fontSize="11" fill="#333333" transform={`rotate(-90 18 ${P.top + innerH / 2})`}>
          Mean coverage across categories
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// Matriz 5x5 de scatter plots del frente de Pareto (estilo Han & Xia 2024).
// Mismo contenido que scripts/pareto_matrix.py, pero renderizado en el front
// para editarlo aquí sin re-ejecutar Python.
// ============================================================
function ParetoMatrix({ data, explored }: { data: ParetoPoint[]; explored?: ExploredPoint[] }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="No hay frente de Pareto — vuelve a ejecutar la optimización para llenar esta vista." />;
  }

  // Nube = espacio de objetivos explorado por NSGA-II (todas las generaciones).
  // Si no hay datos explorados (corrida antigua), cae al frente final.
  const fullCloud: ExploredPoint[] = explored && explored.length > 0 ? explored : data;
  // Submuestreo para que el SVG siga fluido (el PNG de matplotlib usa todo).
  const MAX_PTS = 1500;
  const cloud: ExploredPoint[] =
    fullCloud.length > MAX_PTS
      ? fullCloud.filter((_, i) => i % Math.ceil(fullCloud.length / MAX_PTS) === 0)
      : fullCloud;

  // 5 objetivos (clave en los datos -> etiqueta en español). 'change_ratio' ya
  // se guarda crudo (F[:,4]/5 en optimization.py), así que se grafica tal cual.
  const VARS: { key: keyof ParetoPoint; label: string }[] = [
    { key: "1-cov_health", label: "Salud" },
    { key: "1-cov_education", label: "Educación" },
    { key: "1-cov_greens", label: "Áreas verdes" },
    { key: "1-cov_work", label: "Trabajo" },
    { key: "change_ratio", label: "Cambio territorial" },
  ];

  // Paleta de la tesis (coherente con el script de matplotlib)
  const COLOR_FRONT = "#5a8caf";
  const COLOR_BEST = "#c14242";
  const COLOR_AXES = "#cccccc";
  const COLOR_DIAG_BG = "#f2f2f2";
  const INK = "#333333";

  const n = VARS.length;

  // Solución óptima = mínimo score compuesto (sec. 4.1.3.8)
  const bestIdx = data.reduce((b, p, i) => (p.score < data[b].score ? i : b), 0);
  const best = data[bestIdx];

  // Rango por variable + padding e nº de decimales según la escala.
  // Se calcula sobre la nube completa para que toda la exploración quepa.
  const stats: Record<string, { min: number; max: number; lo: number; hi: number; dec: number }> = {};
  for (const { key } of VARS) {
    const vals = fullCloud.map((p) => p[key] as number);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min;
    const pad = span > 0 ? span * 0.08 : (Math.abs(max) * 0.08 || 0.01);
    const dec = (span > 0 ? span : Math.abs(max) || 1) < 0.1 ? 3 : 2;
    stats[key as string] = { min, max, lo: min - pad, hi: max + pad, dec };
  }

  // Geometría
  const CELL = 120, GAP = 10, INSET = 8;
  const M = { top: 56, right: 24, bottom: 64, left: 80 };
  const STEP = CELL + GAP;
  const W = M.left + n * CELL + (n - 1) * GAP + M.right;
  const H = M.top + n * CELL + (n - 1) * GAP + M.bottom;
  const cellX = (c: number) => M.left + c * STEP;
  const cellY = (r: number) => M.top + r * STEP;
  const sx = (key: string, x0: number, v: number) => {
    const s = stats[key]; const span = s.hi - s.lo || 1;
    return x0 + INSET + ((v - s.lo) / span) * (CELL - 2 * INSET);
  };
  const sy = (key: string, y0: number, v: number) => {
    const s = stats[key]; const span = s.hi - s.lo || 1;
    return y0 + CELL - INSET - ((v - s.lo) / span) * (CELL - 2 * INSET);
  };
  const ticksOf = (key: string) => {
    const s = stats[key];
    return s.max === s.min ? [s.min] : [s.min, (s.min + s.max) / 2, s.max];
  };
  const fmt = (key: string, v: number) => v.toFixed(stats[key].dec);

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x0 = cellX(c), y0 = cellY(r);
      if (r === c) {
        cells.push(
          <g key={`d-${r}`}>
            <rect x={x0 + 10} y={y0 + CELL * 0.32} width={CELL - 20} height={CELL * 0.36}
                  fill={COLOR_DIAG_BG} stroke={COLOR_AXES} strokeWidth={0.8} rx={3} />
            <text x={x0 + CELL / 2} y={y0 + CELL / 2 + 4} textAnchor="middle"
                  fontSize={11} fontWeight="bold" fill={INK}>{VARS[r].label}</text>
          </g>
        );
      } else {
        const xk = VARS[c].key as string, yk = VARS[r].key as string;
        cells.push(
          <g key={`c-${r}-${c}`}>
            <rect x={x0} y={y0} width={CELL} height={CELL} fill="#ffffff" stroke={COLOR_AXES} strokeWidth={0.8} />
            {cloud.map((p, i) => (
              <circle key={i} cx={sx(xk, x0, p[VARS[c].key] as number)} cy={sy(yk, y0, p[VARS[r].key] as number)}
                      r={1.8} fill={COLOR_FRONT} opacity={0.4} />
            ))}
            <circle cx={sx(xk, x0, best[VARS[c].key] as number)} cy={sy(yk, y0, best[VARS[r].key] as number)}
                    r={4.3} fill={COLOR_BEST} stroke="#ffffff" strokeWidth={0.6} />
            {r === n - 1 && ticksOf(xk).map((v, ti) => (
              <text key={`tx-${ti}`} x={sx(xk, x0, v)} y={y0 + CELL + 12} textAnchor="middle"
                    fontSize={7} fill={INK}>{fmt(xk, v)}</text>
            ))}
            {c === 0 && ticksOf(yk).map((v, ti) => (
              <text key={`ty-${ti}`} x={x0 - 5} y={sy(yk, y0, v) + 3} textAnchor="end"
                    fontSize={7} fill={INK}>{fmt(yk, v)}</text>
            ))}
          </g>
        );
      }
    }
  }

  const edges: React.ReactElement[] = [];
  for (let c = 0; c < n; c++) {
    edges.push(
      <text key={`xl-${c}`} x={cellX(c) + CELL / 2} y={H - 30} textAnchor="middle"
            fontSize={10} fill={INK}>{VARS[c].label}</text>
    );
  }
  for (let r = 0; r < n; r++) {
    const yc = cellY(r) + CELL / 2;
    edges.push(
      <text key={`yl-${r}`} x={22} y={yc} textAnchor="middle" fontSize={10} fill={INK}
            transform={`rotate(-90 22 ${yc})`}>{VARS[r].label}</text>
    );
  }

  return (
    // overflow:hidden + flex centra y deja que el SVG escale para caber COMPLETO
    // (ancho y alto) en la ventana, sin scroll → entra en una sola captura.
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ marginBottom: 6, fontSize: 12, color: INK, flexShrink: 0 }}>
        {explored && explored.length > 0
          ? `Espacio de objetivos explorado por NSGA-II (${fullCloud.length} puntos); óptima (mín. score) en rojo`
          : `${data.length} soluciones del frente; óptima (mín. score) en rojo`}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
             style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" }}>
          <text x={W / 2} y={26} textAnchor="middle" fontSize={15} fontWeight="bold" fill={INK}>
            Matriz del frente de Pareto resultante de NSGA-II
          </text>
          <g>
            <circle cx={W - M.right - 168} cy={42} r={2.5} fill={COLOR_FRONT} opacity={0.4} />
            <text x={W - M.right - 160} y={45} fontSize={9} fill={INK}>
              {explored && explored.length > 0 ? `Espacio explorado (${fullCloud.length})` : `Frente de Pareto (n = ${data.length})`}
            </text>
            <circle cx={W - M.right - 168} cy={53} r={4.3} fill={COLOR_BEST} stroke="#fff" strokeWidth={0.6} />
            <text x={W - M.right - 160} y={56} fontSize={9} fill={INK}>Solución óptima (mín. score)</text>
          </g>
          {cells}
          {edges}
        </svg>
      </div>
    </div>
  );
}
