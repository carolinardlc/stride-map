"use client";

import XPWindow from "./XPWindow";
import { useState } from "react";

interface MethodologyWindowProps {
  onClose: () => void;
}

// Okabe-Ito color-blind-safe palette (de facto standard for scientific figures).
// Each service category maps to a distinct, print- and grayscale-safe hue.
const CAT_COLORS = {
  home: "#4D4D4D",
  health: "#D55E00",
  education: "#0072B2",
  greens: "#009E73",
  work: "#CC79A7",
};

const CAT_LABEL: Record<string, string> = {
  home: "Hogar (0)",
  health: "Salud (1)",
  education: "Educación (2)",
  greens: "Áreas verdes (3)",
  work: "Trabajo (4)",
};

const SECTIONS = [
  { id: "steps", label: "Pasos metodológicos" },
  { id: "pipeline", label: "1. Pipeline general" },
  { id: "data", label: "2. Datos OSM" },
  { id: "graph", label: "3. Accesibilidad" },
  { id: "chromosome", label: "4. Cromosoma" },
  { id: "operators", label: "5. Operadores GA" },
  { id: "objectives", label: "6. Funciones objetivo" },
  { id: "pareto", label: "7. Selección Pareto" },
  { id: "nsga_generic", label: "8. NSGA-II (teórico)" },
  { id: "nsga_flow", label: "9. NSGA-II + Dijkstra" },
];

export default function MethodologyWindow({ onClose }: MethodologyWindowProps) {
  const [active, setActive] = useState("steps");

  return (
    <XPWindow title="Methodology Charts - StrideMap" onClose={onClose} width="92vw" height="90vh">
      <div style={{ display: "flex", height: "100%", background: "white" }}>
        {/* Sidebar nav */}
        <div style={{
          width: 200,
          background: "#F2F2F2",
          borderRight: "1px solid #BFBFBF",
          padding: 12,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#333333", marginBottom: 8, letterSpacing: 0.3 }}>
            Etapas metodológicas
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 10px",
                marginBottom: 3,
                fontSize: 11,
                background: active === s.id ? "#333333" : "transparent",
                color: active === s.id ? "white" : "#333333",
                border: active === s.id ? "1px solid #333333" : "1px solid transparent",
                borderRadius: 3,
                cursor: "pointer",
                fontWeight: active === s.id ? "bold" : "normal",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px", color: "#333333", background: "white" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {active === "steps" && <StepsDiagram />}
            {active === "pipeline" && <PipelineDiagram />}
            {active === "data" && <DataDiagram />}
            {active === "graph" && <GraphDiagram />}
            {active === "chromosome" && <ChromosomeDiagram />}
            {active === "operators" && <OperatorsDiagram />}
            {active === "objectives" && <ObjectivesDiagram />}
            {active === "pareto" && <ParetoDiagram />}
            {active === "nsga_generic" && <NSGAGenericFlow />}
            {active === "nsga_flow" && <NSGADijkstraFlow />}
          </div>
        </div>
      </div>
    </XPWindow>
  );
}

// ============================================================
// SECTION 0 — Pasos metodológicos (recreación de pasos_metodologia.png)
// ============================================================
function StepBox({ x, y, w, h, lines }: { x: number; y: number; w: number; h: number; lines: string[] }) {
  const cx = x + w / 2;
  const lh = 14;
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2 + 4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#ffffff" stroke="#000000" strokeWidth={0.9} />
      {lines.map((ln, i) => (
        <text key={i} x={cx} y={startY + i * lh} textAnchor="middle" fontSize={12} fill="#000000">{ln}</text>
      ))}
    </g>
  );
}

function StepArrow({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  // Flecha vertical (descendente) entre etapas
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 6} stroke="#000000" strokeWidth={1.2} />
      <polygon points={`${x},${y2} ${x - 5},${y2 - 7} ${x + 5},${y2 - 7}`} fill="#000000" />
    </g>
  );
}

function StepArrowH({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  // Flecha horizontal entre pasos; la punta apunta hacia x2 (derecha o izquierda)
  const dir = x2 > x1 ? 1 : -1;
  const tip = x2;
  const tail = x2 - dir * 6;
  return (
    <g>
      <line x1={x1} y1={y} x2={tail} y2={y} stroke="#000000" strokeWidth={1.2} />
      <polygon points={`${tip},${y} ${tail},${y - 4} ${tail},${y + 4}`} fill="#000000" />
    </g>
  );
}

export function StepsDiagram() {
  // Estética de figura académica: monocromo (negro/gris) + tipografía serif.
  const CONTAINER = "#666666"; // gris neutro para agrupar las etapas
  const SERIF = 'Georgia, "Times New Roman", Times, serif';
  const c4 = [28, 268, 508, 748]; const W4 = 205; // 4 columnas (anchas)
  const c3 = [40, 360, 680]; const W3 = 240;       // 3 columnas (anchas)
  const r = (i: number, w: number) => c4[i] + w; // borde derecho
  const CX = 490; // centro horizontal (lienzo 980)

  return (
    <div style={{ padding: 12, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: SERIF, color: "#000000" }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#000000", fontStyle: "italic", fontFamily: SERIF }}>
        Figura. Esquema general de la metodología y flujo entre pasos.
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 980 362" preserveAspectRatio="xMidYMid meet"
             style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}>
          {/* ETAPA 1 */}
          <rect x={10} y={8} width={960} height={84} fill="none" stroke={CONTAINER} strokeWidth={1.2} />
          <text x={CX} y={26} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#000000">
            Construcción y procesamiento del modelo geoespacial base
          </text>
          <StepBox x={c3[0]} y={40} w={W3} h={42} lines={["Recolección y digitalización", "de datos"]} />
          <StepBox x={c3[1]} y={40} w={W3} h={42} lines={["Integración de datos en el modelo"]} />
          <StepBox x={c3[2]} y={40} w={W3} h={42} lines={["Clasificación de infraestructura", "socioeconómica"]} />
          <StepArrowH x1={c3[0] + W3} x2={c3[1]} y={61} />
          <StepArrowH x1={c3[1] + W3} x2={c3[2]} y={61} />

          <StepArrow x={CX} y1={92} y2={106} />

          {/* ETAPA 2 */}
          <rect x={10} y={106} width={960} height={84} fill="none" stroke={CONTAINER} strokeWidth={1.2} />
          <text x={CX} y={124} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#000000">
            Evaluación de la accesibilidad urbana
          </text>
          <StepBox x={c4[0]} y={138} w={W4} h={44} lines={["Representación de la red", "peatonal como grafo"]} />
          <StepBox x={c4[1]} y={138} w={W4} h={44} lines={["Cálculo del tiempo de viaje"]} />
          <StepBox x={c4[2]} y={138} w={W4} h={44} lines={["Cálculo de tiempos mínimos", "con Dijkstra multi-fuente"]} />
          <StepBox x={c4[3]} y={138} w={W4} h={44} lines={["Determinación de cobertura"]} />
          <StepArrowH x1={r(0, W4)} x2={c4[1]} y={160} />
          <StepArrowH x1={r(1, W4)} x2={c4[2]} y={160} />
          <StepArrowH x1={r(2, W4)} x2={c4[3]} y={160} />

          <StepArrow x={CX} y1={190} y2={204} />

          {/* ETAPA 3 — flujo en serpentina (fila 1 →, baja, fila 2 ←) */}
          <rect x={10} y={204} width={960} height={150} fill="none" stroke={CONTAINER} strokeWidth={1.2} />
          <text x={CX} y={222} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#000000">
            Optimización del reordenamiento territorial mediante NSGA-II
          </text>
          {/* Fila 1 (izq → der) */}
          <StepBox x={c4[0]} y={236} w={W4} h={42} lines={["Esquema general"]} />
          <StepBox x={c4[1]} y={236} w={W4} h={42} lines={["Población inicial"]} />
          <StepBox x={c4[2]} y={236} w={W4} h={42} lines={["Funciones objetivo"]} />
          <StepBox x={c4[3]} y={236} w={W4} h={42} lines={["Operadores genéticos"]} />
          <StepArrowH x1={r(0, W4)} x2={c4[1]} y={257} />
          <StepArrowH x1={r(1, W4)} x2={c4[2]} y={257} />
          <StepArrowH x1={r(2, W4)} x2={c4[3]} y={257} />
          {/* Conector hacia la fila 2 (baja en la columna derecha) */}
          <StepArrow x={c4[3] + W4 / 2} y1={278} y2={292} />
          {/* Fila 2 (der → izq) */}
          <StepBox x={c4[3]} y={292} w={W4} h={42} lines={["Selección por torneo binario"]} />
          <StepBox x={c4[2]} y={292} w={W4} h={42} lines={["Reemplazo elitista"]} />
          <StepBox x={c4[1]} y={292} w={W4} h={42} lines={["Criterio de parada"]} />
          <StepBox x={c4[0]} y={292} w={W4} h={42} lines={["Selección final desde", "el frente de pareto"]} />
          <StepArrowH x1={c4[3]} x2={r(2, W4)} y={313} />
          <StepArrowH x1={c4[2]} x2={r(1, W4)} y={313} />
          <StepArrowH x1={c4[1]} x2={r(0, W4)} y={313} />
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// SECTION 1 — Pipeline general
// ============================================================
function PipelineDiagram() {
  // Process stages use a neutral gray ramp (left→right). Saturated palette hues
  // are reserved exclusively for data categories elsewhere.
  const stages = [
    { title: "OpenStreetMap", sub: "Datos geoespaciales", color: "#808080" },
    { title: "Grafo peatonal", sub: "OSMnx + travel_time", color: "#737373" },
    { title: "POIs por categoría", sub: "Salud, edu, verde, trabajo", color: "#666666" },
    { title: "Cobertura inicial", sub: "Dijkstra 15 min", color: "#595959" },
    { title: "NSGA-II", sub: "200 gen · 50 pop", color: "#4D4D4D" },
    { title: "Frente de Pareto", sub: "Soluciones no dominadas", color: "#404040" },
    { title: "Solución óptima", sub: "Min score agregado", color: "#333333" },
  ];
  return (
    <div>
      <SectionTitle>Pipeline general del modelo</SectionTitle>
      <SectionLead>
        Flujo de datos completo desde la descarga geoespacial hasta la solución urbana óptima. Cada
        etapa transforma la representación del problema hasta llegar a una propuesta de reordenamiento.
      </SectionLead>

      <svg viewBox="0 0 1100 320" style={{ width: "100%", maxWidth: 1100, height: "auto" }}>
        {stages.map((s, i) => {
          const x = 30 + i * 152;
          const y = 110;
          return (
            <g key={i}>
              <rect x={x} y={y} width={130} height={80} rx={6} fill={s.color} stroke="#333333" strokeWidth="1"/>
              <text x={x + 65} y={y + 32} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {s.title}
              </text>
              <text x={x + 65} y={y + 52} textAnchor="middle" fill="white" fontSize="9" opacity="0.9">
                {s.sub.split(" ").slice(0, 3).join(" ")}
              </text>
              <text x={x + 65} y={y + 64} textAnchor="middle" fill="white" fontSize="9" opacity="0.9">
                {s.sub.split(" ").slice(3).join(" ")}
              </text>
              {i < stages.length - 1 && (
                <>
                  <line x1={x + 130} y1={y + 40} x2={x + 152} y2={y + 40} stroke="#333333" strokeWidth="2"/>
                  <polygon points={`${x + 152},${y + 40} ${x + 146},${y + 36} ${x + 146},${y + 44}`} fill="#333333"/>
                </>
              )}
            </g>
          );
        })}

        {/* Annotations top */}
        <text x={106} y={70} fill="#333333" fontSize="10" fontStyle="italic">Entrada</text>
        <text x={258} y={70} fill="#333333" fontSize="10" fontStyle="italic">Preprocesamiento</text>
        <text x={714} y={70} fill="#333333" fontSize="10" fontStyle="italic">Optimización evolutiva</text>
        <text x={1006} y={70} fill="#333333" fontSize="10" fontStyle="italic">Salida</text>
        <line x1={30} y1={80} x2={160} y2={80} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 2"/>
        <line x1={182} y1={80} x2={486} y2={80} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 2"/>
        <line x1={638} y1={80} x2={942} y2={80} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 2"/>
        <line x1={964} y1={80} x2={1094} y2={80} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 2"/>

        {/* Bottom: outputs */}
        <text x={550} y={240} textAnchor="middle" fill="#333333" fontSize="11" fontWeight="bold">
          Salidas del sistema
        </text>
        <rect x={300} y={250} width={150} height={40} rx={4} fill="#F2F2F2" stroke="#808080"/>
        <text x={375} y={266} textAnchor="middle" fill="#333333" fontSize="10">homes_optimized.geojson</text>
        <text x={375} y={279} textAnchor="middle" fill="#333333" fontSize="9" opacity="0.8">+ services_*.geojson</text>

        <rect x={475} y={250} width={150} height={40} rx={4} fill="#F2F2F2" stroke="#808080"/>
        <text x={550} y={266} textAnchor="middle" fill="#333333" fontSize="10">before.html / after.html</text>
        <text x={550} y={279} textAnchor="middle" fill="#333333" fontSize="9" opacity="0.8">Mapas Folium</text>

        <rect x={650} y={250} width={150} height={40} rx={4} fill="#F2F2F2" stroke="#808080"/>
        <text x={725} y={266} textAnchor="middle" fill="#333333" fontSize="10">pareto_front.csv</text>
        <text x={725} y={279} textAnchor="middle" fill="#333333" fontSize="9" opacity="0.8">Métricas evolutivas</text>
      </svg>
    </div>
  );
}

// ============================================================
// SECTION 2 — Datos OSM
// ============================================================
export function DataDiagram() {
  const cats = [
    {
      name: "Hogares",
      color: "#4D4D4D",
      tags: ["building = residential", "apartments", "house", "…"],
    },
    {
      name: "Salud",
      color: "#D55E00",
      tags: ["amenity = hospital", "clinic", "pharmacy", "…"],
    },
    {
      name: "Educación",
      color: "#0072B2",
      tags: ["amenity = school", "university", "kindergarten", "…"],
    },
    {
      name: "Áreas verdes",
      color: "#009E73",
      tags: ["leisure = park", "garden", "playground", "…"],
    },
    {
      name: "Trabajo",
      color: "#CC79A7",
      tags: ["amenity = office", "landuse = commercial", "shop = *", "…"],
    },
  ];

  return (
    <div>
      <SectionTitle>Pipeline de adquisición y clasificación de datos OSM</SectionTitle>
      <SectionLead>
        El sistema sigue una cadena lineal de tres etapas: parte de la base de datos pública de
        OpenStreetMap, extrae las entidades geoespaciales contenidas dentro del polígono del distrito
        y las clasifica en cinco grupos (hogares más los cuatro tipos de servicios urbanos).
      </SectionLead>

      <div style={{ maxWidth: 440, margin: "0 auto" }}>
      {/* ===== STAGE 1: BASE DE DATOS ===== */}
      <StageHeader number="1" title="Base de datos" color="#808080"/>
      <div style={{
        background: "#4D4D4D",
        color: "white",
        padding: 10,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        boxShadow: "1px 1px 4px rgba(0,0,0,0.12)",
      }}>
        <svg width="40" height="40" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
          <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/>
          <path d="M14 30 Q22 18 28 28 Q36 38 44 26" fill="none" stroke="white" strokeWidth="2"/>
          <circle cx="14" cy="30" r="3" fill="white"/>
          <circle cx="28" cy="28" r="3" fill="white"/>
          <circle cx="44" cy="26" r="3" fill="white"/>
        </svg>
        <div style={{ fontWeight: "bold", fontSize: 14 }}>OpenStreetMap (OSM)</div>
      </div>

      <FlowArrow label="Consulta espacial al área de estudio"/>

      {/* ===== STAGE 2: EXTRACCIÓN ===== */}
      <StageHeader number="2" title="Extracción de datos" color="#666666"/>
      <div style={{
        background: "#F7F7F7",
        border: "2px solid #666666",
        borderRadius: 6,
        padding: 10,
        fontSize: 11,
        lineHeight: 1.4,
        color: "#333333",
      }}>
        Se recuperan <strong>geometrías geoespaciales</strong> (puntos, polígonos, multipolígonos) y sus atributos OSM dentro del polígono del distrito, posteriormente <strong>homogeneizadas a puntos</strong> en EPSG:4326.
      </div>

      <FlowArrow label="Aplicación de filtros por tipo de etiqueta OSM"/>

      {/* ===== STAGE 3: CLASIFICACIÓN ===== */}
      <StageHeader number="3" title="Clasificación en 5 grupos" color="#595959"/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
        {/* Homes block */}
        <div style={{
          background: cats[0].color + "12",
          border: `2px solid ${cats[0].color}`,
          borderRadius: 5,
          padding: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: cats[0].color,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}>
            ⌂
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: cats[0].color, fontSize: 12 }}>{cats[0].name}</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {cats[0].tags.map((t) => (
                <span key={t} style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  background: "white",
                  border: `1px solid ${cats[0].color}`,
                  color: cats[0].color,
                  padding: "1px 5px",
                  borderRadius: 3,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Services grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {cats.slice(1).map((c) => (
            <div key={c.name} style={{
              background: c.color + "12",
              border: `2px solid ${c.color}`,
              borderRadius: 5,
              padding: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color }}/>
                <strong style={{ color: c.color, fontSize: 12 }}>{c.name}</strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {c.tags.map((t) => (
                  <span key={t} style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    background: "white",
                    border: `1px solid ${c.color}`,
                    color: c.color,
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function StageHeader({ number, title, color }: { number: string; title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, marginTop: 2 }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: 11,
        boxShadow: "1px 1px 2px rgba(0,0,0,0.2)",
      }}>
        {number}
      </div>
      <h3 style={{ margin: 0, fontSize: 12, color, fontWeight: "bold" }}>{title}</h3>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "6px 0",
      gap: 2,
    }}>
      <div style={{
        width: 3,
        height: 12,
        background: "#333333",
      }}/>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontStyle: "italic",
        color: "#333333",
        padding: "4px 14px",
        background: "transparent",
        fontWeight: 500,
      }}>
        <span>{label}</span>
      </div>
      <div style={{
        width: 3,
        height: 6,
        background: "#333333",
      }}/>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: "10px solid #333333",
      }}/>
    </div>
  );
}

// ============================================================
// SECTION 3 — Grafo peatonal
// ============================================================
export function GraphDiagram() {
  return (
    <div>
      <SectionTitle>Cálculo de accesibilidad sobre el grafo peatonal</SectionTitle>
      <SectionLead>
        La red peatonal del distrito se modela como un grafo dirigido <strong>G = (V, E)</strong>, donde
        cada <strong>nodo</strong> v ∈ V representa una intersección de calles y cada <strong>arista</strong> (u, v) ∈ E
        un tramo caminable. A cada arista se le asigna su <strong>longitud geodésica</strong> en metros
        (calculada por OSMnx siguiendo la geometría real del tramo) y un <strong>tiempo de viaje</strong> en segundos
        derivado de una velocidad caminable de 4,5 km/h. Sobre este grafo se ejecutan los cálculos de
        accesibilidad de la siguiente etapa.
      </SectionLead>

      <svg viewBox="0 0 900 360" style={{ width: "100%", maxWidth: 900 }}>
        {/* 1. Edges first (at the back) */}
        {[
          { x1: 100, y1: 140, x2: 250, y2: 90 },
          { x1: 250, y1: 90, x2: 380, y2: 180 },
          { x1: 100, y1: 140, x2: 250, y2: 250 },
          { x1: 250, y1: 250, x2: 380, y2: 180 },
          { x1: 380, y1: 180, x2: 520, y2: 110 },
          { x1: 380, y1: 180, x2: 540, y2: 250 },
        ].map((e, i) => (
          <line key={`l${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#808080" strokeWidth="2"/>
        ))}

        {/* 2. Edge labels with white pill background */}
        {[
          { x1: 100, y1: 140, x2: 250, y2: 90, label: "120 m / 96 s" },
          { x1: 250, y1: 90, x2: 380, y2: 180, label: "85 m / 68 s" },
          { x1: 100, y1: 140, x2: 250, y2: 250, label: "140 m / 112 s" },
          { x1: 250, y1: 250, x2: 380, y2: 180, label: "95 m / 76 s" },
          { x1: 380, y1: 180, x2: 520, y2: 110, label: "110 m / 88 s" },
          { x1: 380, y1: 180, x2: 540, y2: 250, label: "130 m / 104 s" },
        ].map((e, i) => {
          const cx = (e.x1 + e.x2) / 2;
          const cy = (e.y1 + e.y2) / 2;
          const w = e.label.length * 6.2 + 10;
          const h = 16;
          return (
            <g key={`lbl${i}`}>
              <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={3} fill="white" stroke="#BFBFBF" strokeWidth="0.5"/>
              <text x={cx} y={cy + 4} textAnchor="middle" fill="#333333" fontSize="10.5" fontWeight="600">
                {e.label}
              </text>
            </g>
          );
        })}

        {/* 3. Nodes on top (so letters always visible) */}
        {[
          { id: "A", x: 100, y: 140 },
          { id: "B", x: 250, y: 90 },
          { id: "C", x: 380, y: 180 },
          { id: "D", x: 250, y: 250 },
          { id: "E", x: 520, y: 110 },
          { id: "F", x: 540, y: 250 },
        ].map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={13} fill="#595959" stroke="#595959" strokeWidth="1.5"/>
            <text x={n.x} y={n.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" style={{ paintOrder: "stroke" }}>
              {n.id}
            </text>
          </g>
        ))}

        {/* Pin: home (snapped to A) */}
        <g transform="translate(70, 110)">
          <circle cx={0} cy={0} r={5} fill="#D55E00" stroke="#A23E00"/>
          <line x1={0} y1={5} x2={30} y2={30} stroke="#D55E00" strokeWidth="1" strokeDasharray="2 2"/>
          <text x={-10} y={-10} fill="#A23E00" fontSize="10" fontWeight="bold">Hogar</text>
        </g>

        {/* Pin: service (snapped to F) */}
        <g transform="translate(570, 220)">
          <rect x={-6} y={-6} width={12} height={12} fill="#009E73" stroke="#00785A"/>
          <line x1={0} y1={0} x2={-30} y2={30} stroke="#009E73" strokeWidth="1" strokeDasharray="2 2"/>
          <text x={-15} y={-12} fill="#00785A" fontSize="10" fontWeight="bold">Servicio</text>
        </g>

        {/* Distance metrics comparison (replaces the code box) */}
        <g transform="translate(610, 20)">
          <rect width={200} height={250} fill="#F7F7F7" stroke="#808080" strokeWidth="1" rx={4}/>
          <text x={100} y={18} textAnchor="middle" fill="#333333" fontSize="10.5" fontWeight="bold">¿Qué métrica de distancia?</text>
          <line x1={10} y1={26} x2={190} y2={26} stroke="#808080" strokeWidth="0.5"/>

          {/* Mini graph 1: Euclidean */}
          <g transform="translate(14, 40)">
            <text x={0} y={0} fill="#D55E00" fontSize="10" fontWeight="bold">✗ Euclidiana</text>
            <line x1={6} y1={12} x2={56} y2={36} stroke="#BFBFBF" strokeWidth="1.5" strokeDasharray="3 3"/>
            <circle cx={6} cy={12} r={4} fill="#D55E00"/>
            <rect x={52} y={32} width={8} height={8} fill="#009E73"/>
            <text x={72} y={20} fill="#333333" fontSize="9" fontStyle="italic">línea recta;</text>
            <text x={72} y={32} fill="#333333" fontSize="9" fontStyle="italic">ignora calles</text>
          </g>

          {/* Mini graph 2: Manhattan */}
          <g transform="translate(14, 95)">
            <text x={0} y={0} fill="#D55E00" fontSize="10" fontWeight="bold">✗ Manhattan</text>
            <path d="M 6 12 L 56 12 L 56 36" stroke="#BFBFBF" strokeWidth="1.5" strokeDasharray="3 3" fill="none"/>
            <circle cx={6} cy={12} r={4} fill="#D55E00"/>
            <rect x={52} y={32} width={8} height={8} fill="#009E73"/>
            <text x={72} y={20} fill="#333333" fontSize="9" fontStyle="italic">cuadrícula;</text>
            <text x={72} y={32} fill="#333333" fontSize="9" fontStyle="italic">no aplica a SJM</text>
          </g>

          {/* Mini graph 3: Graph distance (used) */}
          <g transform="translate(14, 150)">
            <text x={0} y={0} fill="#00785A" fontSize="10" fontWeight="bold">✓ De red (usada)</text>
            <line x1={6} y1={12} x2={22} y2={22} stroke="#808080" strokeWidth="1.5"/>
            <line x1={22} y1={22} x2={40} y2={12} stroke="#808080" strokeWidth="1.5"/>
            <line x1={40} y1={12} x2={56} y2={36} stroke="#808080" strokeWidth="1.5"/>
            <path d="M 6 12 L 22 22 L 40 12 L 56 36" stroke="#009E73" strokeWidth="2.5" fill="none" opacity="0.6"/>
            <circle cx={6} cy={12} r={4} fill="#D55E00"/>
            <circle cx={22} cy={22} r={2.5} fill="#595959"/>
            <circle cx={40} cy={12} r={2.5} fill="#595959"/>
            <rect x={52} y={32} width={8} height={8} fill="#009E73"/>
            <text x={72} y={20} fill="#333333" fontSize="9" fontStyle="italic">camino real,</text>
            <text x={72} y={32} fill="#333333" fontSize="9" fontStyle="italic">Dijkstra</text>
          </g>

          <line x1={10} y1={210} x2={190} y2={210} stroke="#808080" strokeWidth="0.5"/>
          <text x={14} y={224} fill="#333333" fontSize="8.5" fontStyle="italic">
            travel_time = length / speed
          </text>
          <text x={14} y={238} fill="#333333" fontSize="8.5" fontStyle="italic">
            speed = 4,5 km/h ≈ 1,25 m/s
          </text>
        </g>

        {/* Mini-legend */}
        <g transform="translate(20, 290)">
          <rect width={580} height={48} fill="#F7F7F7" stroke="#D9D9D9" strokeWidth="1" rx={4}/>

          {/* Home */}
          <g transform="translate(20, 24)">
            <circle cx={0} cy={0} r={6} fill="#D55E00" stroke="#A23E00"/>
            <text x={14} y={4} fill="#333333" fontSize="11" fontWeight="bold">Hogar</text>
            <text x={14} y={17} fill="#333333" fontSize="9" fontStyle="italic">snapped al nodo más cercano</text>
          </g>

          {/* Service */}
          <g transform="translate(190, 24)">
            <rect x={-6} y={-6} width={12} height={12} fill="#009E73" stroke="#00785A"/>
            <text x={14} y={4} fill="#333333" fontSize="11" fontWeight="bold">Servicio</text>
            <text x={14} y={17} fill="#333333" fontSize="9" fontStyle="italic">snapped al nodo más cercano</text>
          </g>

          {/* Node */}
          <g transform="translate(370, 24)">
            <circle cx={0} cy={0} r={8} fill="#595959" stroke="#595959"/>
            <text x={0} y={3} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">A</text>
            <text x={14} y={4} fill="#333333" fontSize="11" fontWeight="bold">Nodo del grafo</text>
            <text x={14} y={17} fill="#333333" fontSize="9" fontStyle="italic">intersección de calles (v ∈ V)</text>
          </g>
        </g>
      </svg>

      {/* ===== Segundo gráfico: selección del servicio más cercano ===== */}
      <h3 style={{ margin: "16px 0 4px", fontSize: 13, color: "#333333", fontWeight: "bold" }}>
        Selección del servicio más cercano por hogar
      </h3>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#333333", lineHeight: 1.4 }}>
        Cuando hay varios servicios de la misma categoría dentro del distrito, <code>multi_source_dijkstra</code> calcula
        el tiempo desde <strong>todos los servicios simultáneamente</strong> y para cada hogar retiene <strong>solo el
        servicio más cercano</strong>. Los servicios más lejanos se descartan en la métrica de cobertura.
      </p>

      <svg viewBox="0 0 900 360" style={{ width: "100%", maxWidth: 900 }}>
        {/* Edges first */}
        {[
          { x1: 80, y1: 150, x2: 180, y2: 150 },   // Home → A
          { x1: 180, y1: 150, x2: 300, y2: 110 },  // A → B
          { x1: 300, y1: 110, x2: 420, y2: 150 },  // B → C
          { x1: 420, y1: 150, x2: 560, y2: 110 },  // C → F (Service 1)
          { x1: 180, y1: 150, x2: 300, y2: 230 },  // A → D
          { x1: 300, y1: 230, x2: 420, y2: 230 },  // D → X
          { x1: 420, y1: 230, x2: 540, y2: 230 },  // X → E
          { x1: 540, y1: 230, x2: 660, y2: 240 },  // E → Service 2
          { x1: 420, y1: 150, x2: 540, y2: 230 },  // C → X (cross connection)
        ].map((e, i) => (
          <line key={`e2_${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#808080" strokeWidth="2"/>
        ))}

        {/* Accepted path (Service 1) - highlighted */}
        <path d="M 80 150 L 180 150 L 300 110 L 420 150 L 560 110"
              stroke="#009E73" strokeWidth="5" fill="none" opacity="0.45"/>

        {/* Rejected path (Service 2) - dashed red */}
        <path d="M 80 150 L 180 150 L 300 230 L 420 230 L 540 230 L 660 240"
              stroke="#D55E00" strokeWidth="3" fill="none" opacity="0.5" strokeDasharray="6 4"/>

        {/* Edge labels with length / travel_time */}
        {[
          { x1: 80, y1: 150, x2: 180, y2: 150, label: "94 m / 75 s" },     // Home → A
          { x1: 180, y1: 150, x2: 300, y2: 110, label: "125 m / 100 s" },  // A → B
          { x1: 300, y1: 110, x2: 420, y2: 150, label: "120 m / 96 s" },   // B → C
          { x1: 420, y1: 150, x2: 560, y2: 110, label: "131 m / 105 s" },  // C → S1
          { x1: 180, y1: 150, x2: 300, y2: 230, label: "163 m / 130 s" },  // A → D
          { x1: 300, y1: 230, x2: 420, y2: 230, label: "125 m / 100 s" },  // D → X
          { x1: 420, y1: 230, x2: 540, y2: 230, label: "138 m / 110 s" },  // X → E
          { x1: 540, y1: 230, x2: 660, y2: 240, label: "131 m / 105 s" },  // E → S2
        ].map((e, i) => {
          const cx = (e.x1 + e.x2) / 2;
          const cy = (e.y1 + e.y2) / 2;
          const w = e.label.length * 6.2 + 10;
          const h = 16;
          return (
            <g key={`lbl2_${i}`}>
              <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={3} fill="white" stroke="#BFBFBF" strokeWidth="0.5"/>
              <text x={cx} y={cy + 4} textAnchor="middle" fill="#333333" fontSize="10" fontWeight="600">
                {e.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {[
          { id: "A", x: 180, y: 150 },
          { id: "B", x: 300, y: 110 },
          { id: "C", x: 420, y: 150 },
          { id: "D", x: 300, y: 230 },
          { id: "X", x: 420, y: 230 },
          { id: "E", x: 540, y: 230 },
        ].map((n) => (
          <g key={`n2_${n.id}`}>
            <circle cx={n.x} cy={n.y} r={12} fill="#595959" stroke="#595959" strokeWidth="1.5"/>
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{n.id}</text>
          </g>
        ))}

        {/* Home pin */}
        <g transform="translate(80, 150)">
          <circle cx={0} cy={0} r={9} fill="#4D4D4D" stroke="#333333" strokeWidth="1.5"/>
          <circle cx={0} cy={0} r={3} fill="white"/>
          <text x={0} y={-18} textAnchor="middle" fill="#333333" fontSize="11" fontWeight="bold">Hogar</text>
        </g>

        {/* Service 1 (accepted) */}
        <g transform="translate(560, 110)">
          <rect x={-10} y={-10} width={20} height={20} fill="#009E73" stroke="#00785A" strokeWidth="1.5"/>
          <text x={0} y={5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">S₁</text>
          <text x={0} y={-18} textAnchor="middle" fill="#00785A" fontSize="11" fontWeight="bold">Servicio 1</text>
          <text x={0} y={-32} textAnchor="middle" fill="#00785A" fontSize="10">(más cercano)</text>
        </g>

        {/* Service 2 (rejected) */}
        <g transform="translate(660, 240)">
          <rect x={-10} y={-10} width={20} height={20} fill="#BFBFBF" stroke="#808080" strokeWidth="1.5"/>
          <text x={0} y={5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">S₂</text>
          <text x={0} y={-18} textAnchor="middle" fill="#595959" fontSize="11" fontWeight="bold">Servicio 2</text>
          <text x={0} y={-32} textAnchor="middle" fill="#595959" fontSize="10">(más lejos)</text>
        </g>

        {/* Time badges */}
        <g>
          <rect x={595} y={75} width={70} height={20} rx={10} fill="#009E73" stroke="#00785A"/>
          <text x={630} y={89} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">✓ 376 s</text>
        </g>
        <g>
          <rect x={695} y={205} width={80} height={20} rx={10} fill="white" stroke="#D55E00" strokeWidth="1.5"/>
          <text x={735} y={219} textAnchor="middle" fill="#D55E00" fontSize="10.5" fontWeight="bold">✗ 520 s desc.</text>
        </g>

        {/* Legend */}
        <g transform="translate(40, 300)">
          <rect width={820} height={42} fill="#F7F7F7" stroke="#D9D9D9" strokeWidth="1" rx={4}/>
          {/* Accepted */}
          <line x1={20} y1={16} x2={60} y2={16} stroke="#009E73" strokeWidth="5" opacity="0.45"/>
          <text x={70} y={20} fill="#00785A" fontSize="11" fontWeight="bold">Camino retenido</text>
          <text x={70} y={33} fill="#333333" fontSize="9.5">tiempo mínimo asignado al hogar</text>

          {/* Rejected */}
          <line x1={310} y1={16} x2={350} y2={16} stroke="#D55E00" strokeWidth="3" opacity="0.5" strokeDasharray="6 4"/>
          <text x={360} y={20} fill="#A23E00" fontSize="11" fontWeight="bold">Camino descartado</text>
          <text x={360} y={33} fill="#333333" fontSize="9.5">servicio más lejano de la misma categoría</text>

          {/* Multi-source note */}
          <text x={600} y={20} fill="#333333" fontSize="10" fontWeight="bold">multi_source_dijkstra:</text>
          <text x={600} y={33} fill="#333333" fontSize="9.5" fontStyle="italic">retiene <tspan fontWeight="bold">min(t_S1, t_S2, …)</tspan> por hogar</text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// SECTION 4 — Cromosoma
// ============================================================
function ChromosomeDiagram() {
  // Example chromosome: 24 genes representing 24 fixed locations
  const example = [0, 0, 1, 3, 0, 4, 2, 0, 0, 1, 3, 0, 2, 0, 0, 4, 0, 3, 1, 0, 0, 2, 0, 4];
  const labels = ["home", "home", "health", "greens", "home", "work", "education", "home", "home", "health", "greens", "home", "education", "home", "home", "work", "home", "greens", "health", "home", "home", "education", "home", "work"];

  return (
    <div>
      <SectionTitle>Representación del cromosoma</SectionTitle>
      <SectionLead>
        Cada cromosoma es un vector entero de longitud <code>n_var</code> (ubicaciones físicas del
        distrito). El <strong>índice</strong> identifica una coordenada fija; el <strong>valor</strong> indica
        qué tipo de uso se asigna en esa solución candidata.
      </SectionLead>

      {/* Chromosome row */}
      <div style={{ display: "flex", gap: 2, marginBottom: 2, overflowX: "auto" }}>
        {example.map((v, i) => (
          <div key={i} style={{
            width: 32,
            minWidth: 32,
            height: 44,
            background: CAT_COLORS[labels[i] as keyof typeof CAT_COLORS],
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontSize: 12,
            fontWeight: "bold",
            border: "1px solid rgba(0,0,0,0.2)",
            borderRadius: 3,
          }}>
            <div style={{ fontSize: 14 }}>{v}</div>
            <div style={{ fontSize: 7, marginTop: 1, opacity: 0.85 }}>idx {i}</div>
          </div>
        ))}
      </div>

      {/* Position label row */}
      <div style={{ display: "flex", gap: 2, marginBottom: 8, overflowX: "auto" }}>
        {example.map((_, i) => (
          <div key={i} style={{
            width: 32,
            minWidth: 32,
            fontSize: 8,
            textAlign: "center",
            color: "#333333",
            fontFamily: "monospace",
          }}>
            P{i}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        padding: 6,
        background: "#F2F2F2",
        borderRadius: 3,
        marginBottom: 6,
      }}>
        {Object.entries(CAT_LABEL).map(([k, lbl]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
            <div style={{
              width: 14, height: 14,
              background: CAT_COLORS[k as keyof typeof CAT_COLORS],
              borderRadius: 2,
            }}/>
            <span>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{
        padding: 8,
        background: "#F2F2F2",
        border: "1px solid #D9D9D9",
        borderRadius: 3,
        fontSize: 10,
        lineHeight: 1.45,
      }}>
        <strong>Interpretación:</strong> El cromosoma del ejemplo (24 ubicaciones) asigna {example.filter(v => v === 0).length} hogares,{" "}
        {example.filter(v => v === 1).length} centros de salud, {example.filter(v => v === 2).length} de
        educación, {example.filter(v => v === 3).length} áreas verdes y {example.filter(v => v === 4).length} de
        trabajo. <strong>Las ubicaciones físicas (P0…P23) no cambian</strong>: el algoritmo solo prueba
        distintas formas de <em>reetiquetar</em> el uso de cada una.
      </div>

      {/* Constraint table */}
      <div style={{ marginTop: 6, padding: 8, background: "#F2F2F2", borderRadius: 3, fontSize: 10 }}>
        <strong>Restricciones de factibilidad:</strong> conteo por categoría debe respetar el objetivo inicial (margen ≈ 1%). Ejemplo SJM:
        <table style={{ marginTop: 4, borderCollapse: "collapse", fontFamily: "monospace", fontSize: 9 }}>
          <thead>
            <tr style={{ background: "#E6E6E6" }}>
              <th style={cellHeader}>Categoría</th>
              <th style={cellHeader}>n objetivo</th>
              <th style={cellHeader}>Margen</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={cell}>Hogar</td><td style={cell}>1,452</td><td style={cell}>±14</td></tr>
            <tr><td style={cell}>Salud</td><td style={cell}>204</td><td style={cell}>±2</td></tr>
            <tr><td style={cell}>Educación</td><td style={cell}>570</td><td style={cell}>±2</td></tr>
            <tr><td style={cell}>Áreas verdes</td><td style={cell}>357</td><td style={cell}>±2</td></tr>
            <tr><td style={cell}>Trabajo</td><td style={cell}>616</td><td style={cell}>±2</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// SECTION 5 — Operadores genéticos
// ============================================================
export function OperatorsPipeline() {
  return (
    <div style={{ padding: "10px 12px", background: "white" }}>
      <div style={{ fontSize: 14, fontWeight: "bold", color: "#333333", marginBottom: 10 }}>
        Pipeline del ciclo evolutivo por generación
      </div>
      <svg viewBox="0 0 720 180" style={{ width: "100%", maxWidth: 720, display: "block" }}>
          {/* Row 1: Sampling → Repair → Torneo → Crossover */}
          <PipelineNode x={10}  y={20} w={90} h={36} color="#808080" label="Sampling" sub="init. ~2%" />
          <PipelineArrow x1={100} y1={38} x2={130} y2={38} />
          <PipelineNode x={130} y={20} w={70} h={36} color="#595959" label="Repair" />
          <PipelineArrow x1={200} y1={38} x2={230} y2={38} />
          <PipelineNode x={230} y={20} w={140} h={36} color="#808080" label="Torneo binario" sub="NSGA-II + crowding" />
          <PipelineArrow x1={370} y1={38} x2={400} y2={38} />
          <PipelineNode x={400} y={20} w={150} h={36} color="#595959" label="Crossover" sub="p = 0.9 · 30% genes dif." />

          {/* Down arrow on the right */}
          <line x1={475} y1={56} x2={475} y2={92} stroke="#333333" strokeWidth="2"/>
          <polygon points="475,98 470,90 480,90" fill="#333333"/>

          {/* Row 2: Mutation */}
          <PipelineNode x={400} y={98} w={150} h={36} color="#4D4D4D" label="Mutation" sub="p = 0.7 · swap 5%" />

          {/* Down arrow */}
          <line x1={475} y1={134} x2={475} y2={148} stroke="#333333" strokeWidth="2"/>
          <polygon points="475,154 470,146 480,146" fill="#333333"/>

          {/* Row 3: Repair → Evaluación (right-aligned with above) */}
          <PipelineNode x={320} y={148} w={70} h={26} color="#595959" label="Repair" small />
          <PipelineArrow x1={390} y1={161} x2={420} y2={161} />
          <PipelineNode x={420} y={148} w={130} h={26} color="#595959" label="Evaluación" sub="5 obj. + 5 restr." small />

          {/* Loop back arrow */}
          <path d="M 320 161 Q 200 161 200 120 Q 200 90 230 50" stroke="#333333" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
          <polygon points="230,50 220,52 226,58" fill="#333333"/>
          <text x={155} y={115} fill="#333333" fontSize="9" fontStyle="italic">próxima generación</text>
        </svg>
    </div>
  );
}

export function OperatorsPanels() {
  return (
    <div>
      {/* Sampling */}
      <OperatorPanel title="Sampling — Inicialización (≈2% de cambios)" desc="Cada individuo arranca como copia de la configuración inicial real y se le aplican intercambios aleatorios entre dos categorías." bg="white">
        <ChromosomeRow values={[0, 0, 1, 3, 0, 4, 2, 0, 0, 1, 3, 0]} highlight={[]} label="Inicial (config. de Lima)" />
        <Arrow text="swap" />
        <ChromosomeRow values={[0, 0, 3, 3, 0, 4, 2, 0, 0, 1, 1, 0]} highlight={[2, 10]} label="Individuo de la población" />
      </OperatorPanel>

      {/* Crossover */}
      <OperatorPanel title="Crossover — Intercambio de ~30% de los genes diferentes" desc="Identifica los índices donde los padres difieren y copia un subconjunto del otro padre. Repair corrige los conteos si se desbalancean.">
        <ChromosomeRow values={[0, 0, 1, 3, 0, 4, 2, 0, 0, 1, 3, 0]} highlight={[]} label="Padre 1" />
        <ChromosomeRow values={[0, 3, 0, 1, 0, 4, 2, 0, 1, 3, 0, 0]} highlight={[]} label="Padre 2" />
        <Arrow text="cross" />
        <ChromosomeRow values={[0, 3, 1, 1, 0, 4, 2, 0, 0, 3, 3, 0]} highlight={[1, 3, 9]} label="Hijo (genes resaltados copiados de Padre 2)" />
      </OperatorPanel>

      {/* Mutation */}
      <OperatorPanel title="Mutation — Swap entre dos categorías (5% de cada)" desc="Elige aleatoriamente dos categorías e intercambia el 5% de las posiciones que tienen una con el 5% que tienen la otra. No cambia los conteos.">
        <ChromosomeRow values={[0, 3, 1, 1, 0, 4, 2, 0, 0, 3, 3, 0]} highlight={[]} label="Antes" />
        <Arrow text="mutate" />
        <ChromosomeRow values={[0, 3, 3, 1, 0, 4, 2, 0, 0, 1, 3, 0]} highlight={[2, 9]} label="Después (1 ↔ 3)" />
      </OperatorPanel>

      {/* Repair */}
      <OperatorPanel title="Repair — Reparación de conteos" desc="Si una categoría queda con exceso o déficit, convierte posiciones aleatorias para restaurar los conteos objetivo. Garantiza factibilidad estricta.">
        <ChromosomeRow values={[0, 3, 1, 1, 1, 4, 2, 0, 0, 1, 3, 0]} highlight={[]} label="Cromosoma desbalanceado: 4 salud (debe ser 3)" />
        <Arrow text="repair" />
        <ChromosomeRow values={[0, 3, 1, 2, 1, 4, 2, 0, 0, 1, 3, 0]} highlight={[3]} label="Una salud (idx 3) convertida a educación" />
      </OperatorPanel>
    </div>
  );
}

export function OperatorsDiagram() {
  return (
    <div>
      <SectionTitle>Operadores genéticos del NSGA-II</SectionTitle>
      <SectionLead>
        Los operadores manipulan cromosomas <strong>preservando los conteos por categoría</strong> mediante
        intercambios. El operador de <em>repair</em> corrige cualquier desbalance que surja.
      </SectionLead>
      <OperatorsPipeline />
      <OperatorsPanels />
    </div>
  );
}

function OperatorPanel({ title, desc, children, bg }: { title: string; desc: string; children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      marginBottom: 8,
      padding: 8,
      background: bg ?? "white",
      border: "1px solid #D9D9D9",
      borderRadius: 5,
    }}>
      <div style={{ fontWeight: "bold", fontSize: 11, color: "#333333", marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 10, color: "#333333", marginBottom: 6, lineHeight: 1.35 }}>
        {desc}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {children}
      </div>
    </div>
  );
}

function ChromosomeRow({ values, highlight, label }: { values: number[]; highlight: number[]; label: string }) {
  const labels = ["home", "health", "education", "greens", "work"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {values.map((v, i) => (
          <div key={i} style={{
            width: 28,
            height: 28,
            background: CAT_COLORS[labels[v] as keyof typeof CAT_COLORS],
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: "bold",
            border: highlight.includes(i) ? "2px solid #E69F00" : "1px solid rgba(0,0,0,0.2)",
            boxShadow: highlight.includes(i) ? "0 0 6px rgba(255,215,0,0.7)" : "none",
            borderRadius: 2,
          }}>
            {v}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 10, color: "#333333", fontStyle: "italic" }}>{label}</span>
    </div>
  );
}

function Arrow({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 100, color: "#333333", margin: 0 }}>
      <span style={{ fontSize: 12, lineHeight: 1 }}>↓</span>
      <span style={{ fontSize: 9, fontStyle: "italic" }}>{text}</span>
    </div>
  );
}

// ============================================================
// SECTION 6 — Funciones objetivo
// ============================================================
function ObjectivesDiagram() {
  const objectives = [
    { name: "f₁", desc: "1 − cobertura_health(x)", color: "#D55E00", expl: "Fracción de hogares SIN salud a 15 min" },
    { name: "f₂", desc: "1 − cobertura_education(x)", color: "#0072B2", expl: "Fracción de hogares SIN educación a 15 min" },
    { name: "f₃", desc: "1 − cobertura_greens(x)", color: "#009E73", expl: "Fracción de hogares SIN áreas verdes a 15 min" },
    { name: "f₄", desc: "1 − cobertura_work(x)", color: "#CC79A7", expl: "Fracción de hogares SIN trabajo a 15 min" },
    { name: "f₅", desc: "5 · (n_cambios / n_var)", color: "#E69F00", expl: "Proporción del territorio reasignado (peso ×5)" },
  ];

  return (
    <div>
      <SectionTitle>Las 5 funciones objetivo (todas a minimizar)</SectionTitle>
      <SectionLead>
        El algoritmo busca soluciones que minimicen simultáneamente cuatro déficits de cobertura y la
        proporción del territorio que debe ser modificada respecto al estado actual de la ciudad.
      </SectionLead>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {objectives.map((o) => (
          <div key={o.name} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 6,
            background: o.color + "10",
            border: `1px solid ${o.color}`,
            borderRadius: 5,
          }}>
            <div style={{
              minWidth: 36,
              fontSize: 18,
              fontWeight: "bold",
              color: o.color,
              fontFamily: "Georgia, serif",
            }}>{o.name}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#333333" }}>
                {o.desc}
              </div>
              <div style={{ fontSize: 10, color: "#333333", marginTop: 1, fontStyle: "italic" }}>
                {o.expl}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Score formula */}
      <div style={{
        padding: 10,
        background: "linear-gradient(180deg, #F2F2F2, #F2F2F2)",
        border: "2px solid #333333",
        borderRadius: 6,
      }}>
        <div style={{ fontSize: 11, fontWeight: "bold", color: "#333333", marginBottom: 5 }}>
          Selección final entre soluciones del frente de Pareto
        </div>
        <div style={{
          padding: 8,
          background: "white",
          border: "1px dashed #BFBFBF",
          borderRadius: 3,
          fontFamily: "Georgia, serif",
          fontSize: 13,
          textAlign: "center",
          color: "#333333",
        }}>
          score = f̂₁ + f̂₂ + f̂₃ + f̂₄ + <strong style={{ color: "#E69F00" }}>5.0 · ĉr</strong>
        </div>
        <div style={{ fontSize: 10, marginTop: 5, color: "#333333", lineHeight: 1.4 }}>
          • f̂ᵢ : normalización <strong>min-max</strong> de cada cobertura sobre el frente.<br/>
          • ĉr : <code>change_ratio</code> normalizado por su máximo. • Peso ×5 prioriza soluciones <strong>realistas</strong>.<br/>
          • Se elige la solución de <strong>menor score</strong>.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION 7 — Frente de Pareto
// ============================================================
function ParetoDiagram() {
  // Synthetic Pareto front points for illustration (2D projection: cobertura vs cambios)
  const points = [
    { x: 0.05, y: 0.02, label: "" },
    { x: 0.12, y: 0.06, label: "" },
    { x: 0.18, y: 0.08, label: "" },
    { x: 0.22, y: 0.10, label: "" },
    { x: 0.28, y: 0.13, label: "" },
    { x: 0.35, y: 0.16, label: "" },
    { x: 0.45, y: 0.22, label: "" },
    { x: 0.58, y: 0.30, label: "" },
    { x: 0.72, y: 0.40, label: "" },
  ];
  const dominated = [
    { x: 0.30, y: 0.30 },
    { x: 0.45, y: 0.45 },
    { x: 0.60, y: 0.50 },
    { x: 0.20, y: 0.40 },
    { x: 0.50, y: 0.25 },
  ];
  const optimal = { x: 0.18, y: 0.08 };

  const W = 600, H = 360, pad = 50;
  const xScale = (v: number) => pad + v * (W - pad - 30);
  const yScale = (v: number) => H - pad - v * (H - pad - 30);

  return (
    <div>
      <SectionTitle>Frente de Pareto y selección de la solución óptima</SectionTitle>
      <SectionLead>
        Cada punto representa una solución del NSGA-II en el espacio (déficit promedio de cobertura,
        cambio territorial). El frente está formado por las soluciones <strong>no dominadas</strong>.
      </SectionLead>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 600, background: "#F7F7F7", borderRadius: 4, border: "1px solid #BFBFBF" }}>
          {/* Axes */}
          <line x1={pad} y1={H - pad} x2={W - 20} y2={H - pad} stroke="#333333" strokeWidth="1.5"/>
          <line x1={pad} y1={H - pad} x2={pad} y2={20} stroke="#333333" strokeWidth="1.5"/>

          {/* Grid */}
          {[0.2, 0.4, 0.6, 0.8].map((v) => (
            <g key={v}>
              <line x1={xScale(v)} y1={H - pad} x2={xScale(v)} y2={20} stroke="#D9D9D9" strokeWidth="0.5" strokeDasharray="2 3"/>
              <line x1={pad} y1={yScale(v)} x2={W - 20} y2={yScale(v)} stroke="#D9D9D9" strokeWidth="0.5" strokeDasharray="2 3"/>
              <text x={xScale(v)} y={H - pad + 14} textAnchor="middle" fill="#333333" fontSize="9">{v.toFixed(1)}</text>
              <text x={pad - 8} y={yScale(v) + 3} textAnchor="end" fill="#333333" fontSize="9">{v.toFixed(1)}</text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={W / 2} y={H - 10} textAnchor="middle" fill="#333333" fontSize="11" fontWeight="bold">
            Déficit promedio de cobertura (1 − cov_all)
          </text>
          <text x={15} y={H / 2} textAnchor="middle" fill="#333333" fontSize="11" fontWeight="bold" transform={`rotate(-90, 15, ${H / 2})`}>
            change_ratio (cambios / n_var)
          </text>

          {/* Dominated solutions */}
          {dominated.map((p, i) => (
            <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} fill="#BFBFBF" opacity="0.7"/>
          ))}

          {/* Pareto front */}
          <path d={`M ${points.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(" L ")}`}
                fill="none" stroke="#595959" strokeWidth="2" strokeDasharray="4 3"/>
          {points.map((p, i) => (
            <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={6} fill="#595959" stroke="#595959" strokeWidth="1"/>
          ))}

          {/* Optimal point */}
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r={10} fill="#D55E00" stroke="#A23E00" strokeWidth="2"/>
          <circle cx={xScale(optimal.x)} cy={yScale(optimal.y)} r={16} fill="none" stroke="#D55E00" strokeWidth="1" opacity="0.5"/>
          <text x={xScale(optimal.x) + 20} y={yScale(optimal.y) - 10} fill="#D55E00" fontSize="11" fontWeight="bold">
            ★ Solución óptima
          </text>
          <text x={xScale(optimal.x) + 20} y={yScale(optimal.y) + 4} fill="#333333" fontSize="9">
            (min score)
          </text>
        </svg>

        {/* Side legend */}
        <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ padding: 6, background: "#F2F2F2", borderRadius: 3, fontSize: 10, lineHeight: 1.35 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#BFBFBF" }}/>
              <strong>Dominadas</strong>
            </div>
            Existe otra solución mejor en todos los objetivos.
          </div>

          <div style={{ padding: 6, background: "#EEEEEE", borderRadius: 3, fontSize: 10, lineHeight: 1.35 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#595959" }}/>
              <strong>Frente de Pareto</strong>
            </div>
            Ninguna otra las domina en todos los objetivos: compromiso óptimo.
          </div>

          <div style={{ padding: 6, background: "#F7F7F7", borderRadius: 3, fontSize: 10, lineHeight: 1.35 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#D55E00" }}/>
              <strong>Solución elegida ★</strong>
            </div>
            Minimiza el <code>score</code> con peso ×5 al cambio.
          </div>

          <div style={{ padding: 6, background: "#F2F2F2", border: "1px dashed #BFBFBF", borderRadius: 3, fontSize: 9, fontStyle: "italic", lineHeight: 1.35 }}>
            Nota: el espacio real tiene 5 dimensiones; esta vista colapsa las 4 coberturas en un promedio para fines ilustrativos.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
// ============================================================
// SECTION 8 — NSGA-II generic flowchart (theoretical)
// ============================================================
function NSGAGenericFlow() {
  return (
    <div>
      <SectionTitle>Flujo general del algoritmo NSGA-II</SectionTitle>
      <SectionLead>
        Vista conceptual del algoritmo NSGA-II en su forma clásica: inicialización, evaluación, operadores
        genéticos, ordenamiento por dominancia de Pareto con crowding distance, y verificación de la
        condición de parada. Esta versión es independiente de la implementación específica del problema.
      </SectionLead>

      <svg viewBox="0 0 600 620" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
        {/* Title */}
        <text x={300} y={26} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif" letterSpacing="0.3">
          Flujo general del algoritmo NSGA-II
        </text>

        {/* ===== 1. Inicialización ===== */}
        <g>
          <rect x={180} y={54} width={240} height={58} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={5}/>
          <text x={300} y={76} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">
            Inicialización de la población
          </text>
          <text x={300} y={96} textAnchor="middle" fontSize="10" fill="#333333" fontStyle="italic">
            Generación de N individuos factibles
          </text>
        </g>

        {/* Arrow */}
        <line x1={300} y1={112} x2={300} y2={130} stroke="#333333" strokeWidth="1.5"/>
        <polygon points="300,135 295,128 305,128" fill="#333333"/>

        {/* ===== 2. Evaluación de fitness ===== */}
        <g>
          <rect x={180} y={136} width={240} height={58} fill="#F2F2F2" stroke="#808080" strokeWidth="1.5" rx={5}/>
          <text x={300} y={158} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333333" fontFamily="Georgia, serif">
            Evaluación de las funciones objetivo
          </text>
          <text x={300} y={178} textAnchor="middle" fontSize="10" fill="#333333" fontStyle="italic">
            Cálculo del vector F(x) para cada individuo
          </text>
        </g>

        {/* Arrow */}
        <line x1={300} y1={194} x2={300} y2={212} stroke="#333333" strokeWidth="1.5"/>
        <polygon points="300,217 295,210 305,210" fill="#333333"/>

        {/* ===== 3. Selección + Crossover + Mutación ===== */}
        <g>
          <rect x={180} y={218} width={240} height={58} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={5}/>
          <text x={300} y={240} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">
            Selección + Crossover + Mutación
          </text>
          <text x={300} y={260} textAnchor="middle" fontSize="10" fill="#333333" fontStyle="italic">
            Generación de descendientes
          </text>
        </g>

        {/* Arrow */}
        <line x1={300} y1={276} x2={300} y2={294} stroke="#333333" strokeWidth="1.5"/>
        <polygon points="300,299 295,292 305,292" fill="#333333"/>

        {/* ===== 4. Ordenamiento por dominancia de Pareto + crowding (NSGA-II specific - highlighted) ===== */}
        <g>
          <rect x={140} y={300} width={320} height={70} fill="#F7F7F7" stroke="#E69F00" strokeWidth="2" rx={5}/>
          <text x={300} y={324} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#B57A00" fontFamily="Georgia, serif">
            Ordenamiento por dominancia de Pareto
          </text>
          <text x={300} y={342} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#B57A00" fontFamily="Georgia, serif">
            + crowding distance
          </text>
          <text x={300} y={359} textAnchor="middle" fontSize="9.5" fill="#333333" fontStyle="italic">
            Clasificación de la población combinada (μ + λ)
          </text>
        </g>

        {/* Arrow */}
        <line x1={300} y1={370} x2={300} y2={388} stroke="#333333" strokeWidth="1.5"/>
        <polygon points="300,393 295,386 305,386" fill="#333333"/>

        {/* ===== 5. DIAMOND: condición de parada ===== */}
        <g>
          <polygon points="300,395 410,455 300,515 190,455"
                   fill="#F7F7F7" stroke="#595959" strokeWidth="1.5"/>
          <text x={300} y={448} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">
            ¿Se alcanzó el número
          </text>
          <text x={300} y={465} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">
            de generaciones?
          </text>
        </g>

        {/* "Sí" arrow downward */}
        <line x1={300} y1={515} x2={300} y2={535} stroke="#333333" strokeWidth="1.5"/>
        <polygon points="300,540 295,533 305,533" fill="#333333"/>
        <text x={314} y={528} fontSize="11" fontWeight="bold" fill="#595959" fontStyle="italic" fontFamily="Georgia, serif">Sí</text>

        {/* "No" loop-back arrow (right side, up) */}
        <path d="M 410 455 L 510 455 L 510 165 L 420 165"
              stroke="#333333" strokeWidth="1.5" fill="none"/>
        <polygon points="420,165 428,162 428,168" fill="#333333"/>
        <text x={418} y={448} fontSize="11" fontWeight="bold" fill="#595959" fontStyle="italic" fontFamily="Georgia, serif">No</text>

        {/* ===== 6. SALIDA ===== */}
        <g>
          <rect x={180} y={542} width={240} height={58} fill="#F7F7F7" stroke="#E69F00" strokeWidth="1.5" rx={5}/>
          <text x={300} y={564} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#B57A00" fontFamily="Georgia, serif">
            Salida: Frente de Pareto F*
          </text>
          <text x={300} y={584} textAnchor="middle" fontSize="10" fill="#333333" fontStyle="italic">
            Conjunto de soluciones no dominadas
          </text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// SECTION 9 — NSGA-II + Dijkstra flow (application-specific)
// ============================================================
export function NSGADijkstraFlow() {
  return (
    <div>
      <SectionTitle>Flujo del algoritmo NSGA-II con Dijkstra como subrutina de evaluación</SectionTitle>
      <SectionLead>
        Dijkstra mide la accesibilidad de cada configuración candidata; NSGA-II busca la mejor
        configuración entre todas las posibles. El bucle generacional se repite T = 200 veces, y dentro
        de cada iteración Dijkstra se ejecuta como subrutina interna para evaluar la población completa.
      </SectionLead>

      <svg viewBox="0 0 720 660" style={{ width: "100%", display: "block" }}>
        {/* ===== 1. INPUTS ===== */}
        <g>
          <rect x={80} y={14} width={560} height={66} fill="#F2F2F2" stroke="#808080" strokeWidth="1.5" rx={6}/>
          <text x={96} y={34} fontSize="12" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">1. INPUTS</text>
          <line x1={96} y1={41} x2={624} y2={41} stroke="#808080" strokeWidth="0.5"/>
          <text x={96} y={58} fontSize="10.5" fill="#333333">• Grafo peatonal <tspan fontFamily="monospace">G = (V, E)</tspan> y configuración inicial <tspan fontFamily="monospace">x⁰</tspan></text>
          <text x={96} y={74} fontSize="10.5" fill="#333333">• Parámetros del algoritmo (población, generaciones, umbral)</text>
        </g>

        {/* Arrow */}
        <line x1={360} y1={80} x2={360} y2={96} stroke="#333333" strokeWidth="2"/>
        <polygon points="360,101 354,93 366,93" fill="#333333"/>

        {/* ===== 2. INICIALIZACIÓN ===== */}
        <g>
          <rect x={160} y={104} width={400} height={50} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={6}/>
          <text x={176} y={124} fontSize="12" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">2. INICIALIZACIÓN</text>
          <line x1={176} y1={131} x2={544} y2={131} stroke="#808080" strokeWidth="0.5"/>
          <text x={176} y={148} fontSize="10.5" fill="#333333">• <tspan fontWeight="bold">FeasibleSampling</tspan> genera una población inicial factible</text>
        </g>

        {/* Arrow */}
        <line x1={360} y1={154} x2={360} y2={170} stroke="#333333" strokeWidth="2"/>
        <polygon points="360,175 354,167 366,167" fill="#333333"/>

        {/* ===== 3. LOOP CONTAINER ===== */}
        <g>
          <rect x={30} y={178} width={660} height={350} fill="none" stroke="#E69F00" strokeWidth="2" strokeDasharray="8 4" rx={10}/>

          {/* Loop header label */}
          <rect x={42} y={188} width={300} height={24} fill="#E69F00" rx={4}/>
          <text x={52} y={205} fontSize="11" fontWeight="bold" fill="white" fontFamily="Georgia, serif">
            3. BUCLE GENERACIONAL — t = 1, ..., T
          </text>

          {/* --- 3.1 SELECCIÓN --- */}
          <g>
            <rect x={130} y={224} width={460} height={42} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={6}/>
            <text x={146} y={241} fontSize="11" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">3.1 SELECCIÓN</text>
            <text x={146} y={259} fontSize="10" fill="#333333">• Torneo binario + frente de Pareto + crowding distance</text>
          </g>

          {/* Arrow */}
          <line x1={360} y1={266} x2={360} y2={280} stroke="#333333" strokeWidth="2"/>
          <polygon points="360,285 354,277 366,277" fill="#333333"/>

          {/* --- 3.2 OPERADORES GENÉTICOS --- */}
          <g>
            <rect x={130} y={288} width={460} height={48} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={6}/>
            <text x={146} y={305} fontSize="11" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">3.2 OPERADORES GENÉTICOS</text>
            <text x={146} y={324} fontSize="10" fill="#333333">• <tspan fontWeight="bold">Crossover</tspan> · <tspan fontWeight="bold">Mutation</tspan> · <tspan fontWeight="bold">Repair</tspan></text>
          </g>

          {/* Arrow */}
          <line x1={360} y1={336} x2={360} y2={350} stroke="#333333" strokeWidth="2"/>
          <polygon points="360,355 354,347 366,347" fill="#333333"/>

          {/* --- 3.3 DIJKSTRA — KEY HIGHLIGHTED BOX --- */}
          <g>
            <rect x={70} y={358} width={580} height={80} fill="#F7F7F7" stroke="#E69F00" strokeWidth="2.5" rx={6}/>

            {/* Subroutine badge */}
            <rect x={494} y={365} width={148} height={20} fill="#E69F00" rx={3}/>
            <text x={568} y={379} textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="white">SUBRUTINA INTERNA</text>

            <text x={86} y={380} fontSize="12" fontWeight="bold" fill="#B57A00" fontFamily="Georgia, serif">3.3 EVALUACIÓN MEDIANTE DIJKSTRA</text>
            <line x1={86} y1={388} x2={480} y2={388} stroke="#E69F00" strokeWidth="0.5"/>

            <rect x={86} y={397} width={500} height={20} fill="white" stroke="#E69F00" strokeWidth="1" rx={3}/>
            <text x={94} y={412} fontSize="10.5" fontFamily="monospace" fill="#B57A00" fontWeight="bold">
              multi_source_dijkstra(G, fuentes_c) → cov_c
            </text>

            <rect x={86} y={420} width={500} height={20} fill="white" stroke="#E69F00" strokeWidth="1" rx={3}/>
            <text x={94} y={435} fontSize="10.5" fontFamily="monospace" fill="#B57A00" fontWeight="bold">
              F(x) = (f_health, f_education, f_greens, f_work, f_change)
            </text>
          </g>

          {/* Arrow */}
          <line x1={360} y1={440} x2={360} y2={454} stroke="#333333" strokeWidth="2"/>
          <polygon points="360,459 354,451 366,451" fill="#333333"/>

          {/* --- 3.4 SELECCIÓN ELITISTA --- */}
          <g>
            <rect x={130} y={462} width={460} height={42} fill="#EEEEEE" stroke="#808080" strokeWidth="1.5" rx={6}/>
            <text x={146} y={479} fontSize="11" fontWeight="bold" fill="#595959" fontFamily="Georgia, serif">3.4 SELECCIÓN ELITISTA (μ + λ)</text>
            <text x={146} y={497} fontSize="10" fill="#333333">• Retiene los mejores entre padres + hijos</text>
          </g>

          {/* Loop-back arrow (right side) */}
          <path d="M 590 483 L 640 483 L 640 245 L 595 245"
                stroke="#E69F00" strokeWidth="2.5" fill="none"/>
          <polygon points="595,245 605,241 605,249" fill="#E69F00"/>

          {/* Loop label (vertical) */}
          <text x={660} y={365} fontSize="10.5" fontWeight="bold" fill="#E69F00" fontStyle="italic"
                transform="rotate(-90, 660, 365)" textAnchor="middle">
            t ← t + 1
          </text>
        </g>

        {/* Arrow out of loop */}
        <line x1={360} y1={528} x2={360} y2={544} stroke="#333333" strokeWidth="2"/>
        <polygon points="360,549 354,541 366,541" fill="#333333"/>

        {/* ===== 4. SALIDA ===== */}
        <g>
          <rect x={80} y={552} width={560} height={78} fill="#F7F7F7" stroke="#E69F00" strokeWidth="1.5" rx={6}/>
          <text x={96} y={572} fontSize="12" fontWeight="bold" fill="#B57A00" fontFamily="Georgia, serif">4. SALIDA</text>
          <line x1={96} y1={580} x2={624} y2={580} stroke="#E69F00" strokeWidth="0.5"/>

          <text x={96} y={598} fontSize="10.5" fill="#333333">• <tspan fontWeight="bold">Frente de Pareto F*</tspan> + selección por score compuesto</text>
          <text x={96} y={618} fontSize="10.5" fill="#333333">• <tspan fontWeight="bold">Mapa optimizado del distrito</tspan></text>
        </g>
      </svg>
    </div>
  );
}

function PipelineNode({ x, y, w, h, color, label, sub, small }: {
  x: number; y: number; w: number; h: number; color: string; label: string; sub?: string; small?: boolean;
}) {
  const labelSize = small ? 10 : 11;
  const subSize = small ? 7.5 : 8.5;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8"/>
      <text x={x + w / 2} y={y + (sub ? h / 2 - 1 : h / 2 + 4)} textAnchor="middle" fill="white" fontSize={labelSize} fontWeight="bold">
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fill="white" fontSize={subSize} opacity="0.9">
          {sub}
        </text>
      )}
    </g>
  );
}

function PipelineArrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 6} y2={y2} stroke="#333333" strokeWidth="2"/>
      <polygon points={`${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`} fill="#333333"/>
    </g>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: "0 0 4px",
      fontSize: 16,
      color: "#333333",
      borderBottom: "2px solid #333333",
      paddingBottom: 3,
    }}>{children}</h2>
  );
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: "0 0 8px",
      fontSize: 11,
      color: "#333333",
      lineHeight: 1.4,
      maxWidth: 900,
    }}>{children}</p>
  );
}

const cellHeader: React.CSSProperties = {
  padding: "4px 10px",
  textAlign: "left",
  border: "1px solid #BFBFBF",
  fontWeight: "bold",
};

const cell: React.CSSProperties = {
  padding: "3px 10px",
  border: "1px solid #D9D9D9",
};
