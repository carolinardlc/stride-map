"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import XPWindow from "./XPWindow";
import { EvolutionChart } from "./MapWindow";
import { StepsDiagram, DataDiagram, GraphDiagram, NSGADijkstraFlow, OperatorsPipeline, OperatorsPanels } from "./MethodologyWindow";
import { SJM_EVOLUTION, SJM_COMPARISON } from "./seminarioData";

// Lienzo base de cada diapositiva (16:9). Todo se diseña en estas coordenadas
// y se escala para caber en la ventana.
const W = 1280;
const H = 720;

// Paleta del deck
const ORANGE = "#E0742E";      // naranja estándar (pastel, el de los separadores 3, 5, 7…)
const ACCENT = "#E0742E";      // naranja estándar — acentos (subtítulos, frases)
const GRAYBLUE = "#93a3ad";    // gris azulado de títulos serif
const INK = "#111111";

const DISPLAY = "'Playfair Display', Georgia, serif";
const CONDENSED = "'Oswald', sans-serif";
const BODY = "'Montserrat', system-ui, sans-serif";

const IMG = "/seminario";

// ---- helpers de estilo ----
const fill: React.CSSProperties = { position: "absolute", inset: 0 };
const line = (color = "#000") => ({ background: color, height: 2 } as React.CSSProperties);

function PageNum({ n, color = "#000" }: { n: number; color?: string }) {
  return (
    <div style={{ position: "absolute", right: 24, bottom: 18, fontFamily: BODY, fontSize: 18, color }}>{n}</div>
  );
}

// ============================================================
// 1 — Portada
// ============================================================
function Portada() {
  return (
    <div style={{ ...fill, background: "#0b0b0b", color: "#fff", fontFamily: BODY }}>
      {/* logo U. de Lima (blanco) */}
      <img src={`${IMG}/image1.png`} alt="Universidad de Lima" style={{ position: "absolute", left: 40, top: 40, width: 250 }} />
      {/* facultad / carrera */}
      <div style={{ position: "absolute", right: 40, top: 40, textAlign: "right", fontSize: 17, lineHeight: 1.4, letterSpacing: 0.4 }}>
        FACULTAD DE INGENIERÍA<br />CARRERA DE INGENIERÍA DE SISTEMAS
      </div>
      {/* título */}
      <div style={{
        position: "absolute", left: 90, right: 90, top: 175, textAlign: "center",
        fontWeight: 800, fontSize: 33, lineHeight: 1.25, letterSpacing: 0.5,
      }}>
        SOFTWARE AUTOMATIZADO DE PLANIFICACIÓN URBANA BASADO EN ALGORITMOS DE OPTIMIZACIÓN
      </div>
      {/* subtítulo naranja */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center", color: ACCENT, fontSize: 23 }}>
        [Algoritmos y sistemas computacionales / Ingeniería de software]
      </div>
      {/* autores */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 22, lineHeight: 1.5 }}>
        Alumno(s):<br />
        Ramirez De La Cuba, Carolina Alexandra<br />
        Angulo Suárez, Diego Alejandro<br />
        Asesor: Nina Ancco, Hernan
      </div>
      {/* badge ODS 11 */}
      <img src={`${IMG}/image12.png`} alt="ODS 11" style={{ position: "absolute", right: 40, bottom: 36, width: 175, height: 175 }} />
      {/* footer */}
      <div style={{ position: "absolute", left: 40, bottom: 36, color: ACCENT, fontSize: 17, lineHeight: 1.5 }}>
        Seminario de Investigación II<br />2025-2
      </div>
    </div>
  );
}

// ============================================================
// 2 — Índice
// ============================================================
const INDICE = [
  ["1. Introducción", "Propuesta del trabajo"],
  ["2. Problemática", "El desarrollo urbano desordenado"],
  ["3. Objetivos", "Objetivo general y objetivos específicos"],
  ["4. Justificación", "Relevancia, viabilidad y ODS"],
  ["5. Estado del arte", "Marco teórico"],
  ["6. Antecedentes", "Trabajos relacionados"],
  ["7. Metodología", "Explicación del modelo y el uso de los algoritmo"],
  ["8. Conclusiones", "Hallazgos y discusión"],
];

function Indice() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 58, ...line() }} />
      <div style={{ position: "absolute", left: 88, top: 110, fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: GRAYBLUE }}>
        Índice
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 230, bottom: 70 }}>
        {INDICE.map(([t, d], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", height: `${100 / INDICE.length}%`, borderBottom: "1px solid #b9b9b9" }}>
            <div style={{ width: 320, fontFamily: CONDENSED, fontWeight: 700, fontSize: 21, color: INK, textDecoration: "underline" }}>{t}</div>
            <div style={{ fontFamily: BODY, fontSize: 15, color: "#444" }}>{d}</div>
          </div>
        ))}
      </div>
      <PageNum n={2} />
    </div>
  );
}

// ============================================================
// Separador de sección (reutilizable) — fondo naranja
// ============================================================
function Separador({ num, title, page }: { num: string; title: string; page: number }) {
  return (
    <div style={{ ...fill, background: ORANGE }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", right: 90, top: 120, fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, color: "#000", lineHeight: 1 }}>{num}</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 320, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: title.length > 18 ? 380 : 430, fontFamily: DISPLAY, fontWeight: 900, fontSize: title.length > 18 ? 58 : 92, lineHeight: 1.05, color: "#000" }}>{title}</div>
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 60, ...line() }} />
      <PageNum n={page} />
    </div>
  );
}

// ============================================================
// 4 — Introducción (contenido)
// ============================================================
function IntroContent() {
  return (
    <div style={{ ...fill, background: "#FBF1E7", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 55, ...line() }} />
      <div style={{ position: "absolute", left: 100, top: 215, fontFamily: DISPLAY, fontWeight: 700, fontSize: 48, color: GRAYBLUE }}>
        Introducción
      </div>
      <div style={{ position: "absolute", left: 100, top: 330, width: 560, fontSize: 24, lineHeight: 1.55, color: "#444" }}>
        Este trabajo propone un sistema basado en algoritmos de optimización para la planificación urbana en Lima, asegurando el acceso a servicios esenciales en un radio de 15 minutos caminando.
      </div>
      <img src={`${IMG}/image30.png`} alt="" style={{ position: "absolute", right: 80, top: 80, width: 430, height: 205, objectFit: "cover" }} />
      <img src={`${IMG}/image10.png`} alt="" style={{ position: "absolute", right: 80, top: 320, width: 430, height: 300, objectFit: "cover" }} />
    </div>
  );
}

// ============================================================
// 6 — Problemática (contenido)
// ============================================================
const PROBLEMAS = [
  ["90% de la expansión urbana es de carácter informal", "Espinoza y Fort (2020)"],
  ["El 89.6% de las municipalidades no cuentan con un plan de desarrollo urbano", "ComexPerú (2024)"],
  ["Hay una falta de ciertas instalaciones como hospitales lo que indica un pobre uso del espacio", "Martens (2023)"],
];

function Problematica() {
  return (
    <div style={{ ...fill, background: "#ffffff", fontFamily: BODY }}>
      <img src={`${IMG}/image3.png`} alt="" style={{ position: "absolute", right: 28, top: 26, width: 42 }} />
      <img src={`${IMG}/image14.png`} alt="" style={{ position: "absolute", left: 24, top: 215, width: 530, height: 330, objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 600, right: 40, top: 90, bottom: 60, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        {PROBLEMAS.map(([txt, cite], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.3, color: ACCENT }}>{txt}</div>
            <div style={{ fontSize: 16, color: "#222", marginTop: 8 }}>{cite}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Etiquetas verticales GOALS / STRATEGY / RESULTS (borde derecho)
function SideLabels() {
  return (
    <div style={{ position: "absolute", right: 12, top: 110, bottom: 80, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}>
      {["RESULTS", "STRATEGY", "GOALS"].map((t) => (
        <span key={t} style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: CONDENSED, fontWeight: 700, fontSize: 18, color: "#111", letterSpacing: 1 }}>{t}</span>
      ))}
    </div>
  );
}

// Íconos de línea minimalistas (gris) para objetivos específicos
const ic = { fill: "none", stroke: "#777", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IcoNet() { return (<svg width="40" height="40" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="5" rx="1" {...ic} /><rect x="2" y="17" width="6" height="5" rx="1" {...ic} /><rect x="16" y="17" width="6" height="5" rx="1" {...ic} /><path d="M12 7v4M5 17v-3h14v3" {...ic} /></svg>); }
function IcoDB() { return (<svg width="40" height="40" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3" {...ic} /><path d="M5 5v8c0 1.7 3.1 3 7 3M19 5v6" {...ic} /><path d="M15 19l2 2 4-4" {...ic} /></svg>); }
function IcoChart() { return (<svg width="40" height="40" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="1" {...ic} /><path d="M6 13l3-3 2 2 4-5M9 21h6M12 17v4" {...ic} /></svg>); }
function IcoLeaf() { return (<svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 21V9M12 9c-4 0-6-2-6-5 3 0 6 1 6 5zM12 11c4 0 6-2 6-5-3 0-6 1-6 5z" {...ic} /></svg>); }
function IcoThumb() { return (<svg width="40" height="40" viewBox="0 0 24 24"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM7 11l4-8a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 1.5H7" {...ic} /></svg>); }
function IcoSliders() { return (<svg width="40" height="40" viewBox="0 0 24 24"><path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2" {...ic} /><circle cx="14" cy="6" r="2" {...ic} /><circle cx="8" cy="12" r="2" {...ic} /><circle cx="16" cy="18" r="2" {...ic} /></svg>); }
function IcoMap() { return (<svg width="40" height="40" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" {...ic} /><path d="M9 4v14M15 6v14" {...ic} /></svg>); }
function IcoScale() { return (<svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 4v16M7 20h10M4 8h16" {...ic} /><circle cx="12" cy="5" r="1.6" {...ic} /><path d="M4 8 1.8 13.5a2.6 2.6 0 0 0 4.4 0L4 8zM20 8l-2.2 5.5a2.6 2.6 0 0 0 4.4 0L20 8z" {...ic} /></svg>); }

// 8 — Objetivo General
function ObjetivoGeneral() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>
      <img src={`${IMG}/image3.png`} alt="" style={{ position: "absolute", right: 28, top: 26, width: 42 }} />
      <div style={{ position: "absolute", left: 110, top: 330, fontWeight: 800, fontSize: 34, color: "#111" }}>Objetivo General</div>
      <div style={{ position: "absolute", left: 110, top: 405, width: 560, fontSize: 23, lineHeight: 1.5, color: "#111" }}>
        ●&nbsp;&nbsp;Proponer un sistema para planificación urbana con el propósito de reestructurar la ciudad de Lima.
      </div>
      <img src={`${IMG}/image11.png`} alt="" style={{ position: "absolute", right: 70, top: 210, width: 450, height: 300, objectFit: "cover" }} />
    </div>
  );
}

// 9 — Objetivos específicos
const ESP: [string, () => React.ReactElement][] = [
  ["Diseñar e implementar un protocolo de validación cuantitativa, con el fin de contrastar la pertinencia urbana y la viabilidad práctica de las soluciones generadas por el algoritmo NSGA-II.", IcoThumb],
  ["Realizar un análisis de sensibilidad del modelo frente a variaciones en los parámetros clave (umbral temporal, velocidad peatonal, factor de penalización del cambio territorial, tasas de cruce y mutación), para evaluar la robustez de las soluciones y su dependencia de las decisiones paramétricas.", IcoSliders],
  ["Caracterizar la diversidad de soluciones no dominadas del frente de Pareto final mediante métricas de calidad de la optimización multiobjetivo (hipervolumen, spread, distancia generacional), para evaluar el desempeño del algoritmo más allá de la solución óptima seleccionada.", IcoChart],
  ["Refinar el sistema de clasificación de servicios urbanos en subcategorías de mayor granularidad.", IcoNet],
  ["Validar la coherencia del modelo contrastando las soluciones generadas con los patrones reales de distribución de servicios en otros distritos consolidados de Lima Metropolitana, evaluando la transferibilidad metodológica del enfoque.", IcoMap],
  ["Comparar el desempeño de NSGA-II frente a algoritmos multiobjetivo alternativos (NSGA-III) en el mismo problema, para identificar el método más adecuado en problemas de reordenamiento territorial con restricciones de conservación (mantener constante el número de elementos de cada categoría, sin agregar ni eliminar infraestructura).", IcoScale],
];
function EspItem({ x, y, w, n, text, Icon }: { x: number; y: number; w: number; n: number; text: string; Icon: () => React.ReactElement }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", gap: 12 }}>
      <div style={{ flexShrink: 0, transform: "scale(0.85)", transformOrigin: "top left" }}><Icon /></div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: ACCENT, marginBottom: 2 }}>{n}.</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.34, color: "#222" }}>{text}</div>
      </div>
    </div>
  );
}
function ObjetivosEspecificos() {
  const COL = [380, 822];
  const ROW = [78, 300, 522];
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 330, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 40, lineHeight: 1.12, padding: "0 30px" }}>Objetivos específicos</div>
      </div>
      <img src={`${IMG}/image3.png`} alt="" style={{ position: "absolute", right: 24, top: 22, width: 34 }} />
      {ESP.map(([text, Icon], k) => (
        <EspItem key={k} x={COL[k % 2]} y={ROW[Math.floor(k / 2)]} w={400} n={k + 1} text={text} Icon={Icon} />
      ))}
    </div>
  );
}

// 11 — Justificación
const JUST: [string, string][] = [
  ["Relevancia", "Este trabajo propone un enfoque innovador basado en NSGA-II para optimizar la planificación urbana en Lima, asegurando el acceso equitativo a servicios esenciales dentro de un radio de 15 minutos, lo que mejora la accesibilidad, la sostenibilidad y la calidad de vida en el contexto del crecimiento urbano desordenado."],
  ["Viabilidad", "Se sustenta en la disponibilidad de grandes conjuntos de datos urbanos y herramientas digitales aplicables."],
  ["Contribución a los ODS", "Apoya el ODS 11 (Ciudades y comunidades sostenibles), promoviendo una planificación más eficiente, inclusiva y resiliente."],
];
function Justificacion() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>
      <img src={`${IMG}/image3.png`} alt="" style={{ position: "absolute", right: 28, top: 26, width: 38 }} />
      <div style={{ position: "absolute", left: 60, top: 120, fontWeight: 700, fontSize: 30, color: ACCENT }}>Justificación</div>
      <img src={`${IMG}/image13.png`} alt="" style={{ position: "absolute", left: 60, top: 210, width: 480, height: 300, objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 600, top: 200, right: 50, display: "flex", flexDirection: "column", gap: 16, fontSize: 16, lineHeight: 1.45, color: "#222" }}>
        {JUST.map(([lbl, txt]) => (
          <div key={lbl}><span style={{ color: ACCENT }}>● </span><strong>{lbl}</strong>: {txt}</div>
        ))}
      </div>
    </div>
  );
}

// 13 — Contextualización del trabajo
function Contextualizacion() {
  return (
    <div style={{ ...fill, background: "#FBF1E7", fontFamily: BODY }}>
      <img src={`${IMG}/image33.jpg`} alt="" style={{ position: "absolute", left: 0, top: 0, width: 560, height: H, objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 620, right: 80, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 620, right: 80, bottom: 55, ...line() }} />
      <div style={{ position: "absolute", left: 620, top: 110, right: 80, fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: GRAYBLUE, lineHeight: 1.15 }}>
        Contextualización del trabajo
      </div>
      <div style={{ position: "absolute", left: 620, top: 290, right: 80, fontSize: 22, lineHeight: 1.5, color: "#444" }}>
        ●&nbsp;&nbsp;Propuesta de optimización urbana en Lima usando NSGA-II para garantizar acceso a servicios esenciales en un radio de 15 minutos caminando, promoviendo ciudades más sostenibles y accesibles.
      </div>
      <PageNum n={13} />
    </div>
  );
}

// 15 / 16 — Trabajos relacionados (tabla autores + propuesta)
const TRAB1: [string, string][] = [
  ["Boyukliyski & Hristov (2022)", "Usar NSGA-II para optimizar la distribución del uso del suelo en barrios, equilibrando funciones como residenciales, oficinas, educación, salud y áreas verdes."],
  ["Liu et al. (2021)", "Optimizar el uso del suelo urbano con un modelo mejorado de NSGA-II, enfocándose en la reducción de emisiones, eficiencia espacial y beneficios económicos."],
  ["Jiang et al. (2023)", "Revisar el uso de diseño urbano generativo apoyado por algoritmos evolutivos como el NSGA-II para generar soluciones sostenibles y equilibradas en la planificación urbana."],
  ["Zhou et al. (2024)", "Optimizar infraestructuras verdes en áreas urbanas densas usando NSGA-II/III para mejorar el escurrimiento, la calidad del agua y reducir costos."],
  ["Lima et al. (2022)", "Optimización del diseño urbano y localización de servicios mediante algoritmos evolutivos multiobjetivo"],
];
const TRAB2: [string, string][] = [
  ["Carot & Villalba (2024)", "Evaluar el acceso a servicios en la \"ciudad de 15 minutos\" utilizando el algoritmo de Dijkstra en un análisis de redes urbanas, con el objetivo de mejorar la equidad en la distribución de servicios"],
  ["Abdel-Ghany et al. (2022)", "Optimizar la planificación urbana usando NSGA-II para mejorar la compatibilidad, compacidad y beneficios económicos, generando escenarios de distribución del uso del suelo."],
  ["Maleki et al. (2022)", "Mejorar la eficiencia en la optimización urbana con el HNSGA-III, utilizado en problemas complejos de distribución del uso del suelo"],
  ["Akbari et al. (2024)", "Optimizar la planificación ecoturística en Zrebar usando NSGA-II y técnicas de superposición, promoviendo un desarrollo más sostenible y preciso en áreas aptas para ecoturismo."],
  ["Ma.H et al. (2024)", "Realizar un análisis detallado de NSGA-II y sus versiones modificadas, evaluando su rendimiento en la optimización multiobjetivo con el objetivo de mejorar la calidad de las soluciones en la planificación urbana."],
];
function Trabajos({ rows, page }: { rows: [string, string][]; page: number }) {
  const top = 250, gap = 86;
  return (
    <div style={{ ...fill, background: "#FBF1E7", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, top: 90, fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: GRAYBLUE }}>Trabajos relacionados</div>
      <div style={{ position: "absolute", left: 300, top: 165, fontFamily: CONDENSED, fontWeight: 700, fontSize: 18 }}>Autores</div>
      <div style={{ position: "absolute", left: 870, top: 165, fontFamily: CONDENSED, fontWeight: 700, fontSize: 18 }}>Propuesta</div>
      {/* columna de tiles naranjas */}
      {rows.map((_, i) => (
        <div key={`tile${i}`} style={{ position: "absolute", left: 110, top: top - 8 + i * gap, width: 60, height: 60, background: ORANGE, opacity: 1 - i * 0.13, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IcoChartWhite />
        </div>
      ))}
      {rows.map(([author, prop], i) => {
        const y = top + i * gap;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: 170, top: y + 22, width: 110, ...line("#000"), height: 1.5 }} />
            <div style={{ position: "absolute", left: 290, top: y, width: 230, fontFamily: DISPLAY, fontWeight: 700, fontSize: 18, color: GRAYBLUE, lineHeight: 1.2 }}>{author}</div>
            <div style={{ position: "absolute", left: 560, top: y, width: 560, fontSize: 14.5, lineHeight: 1.35, color: "#222" }}>{prop}</div>
          </React.Fragment>
        );
      })}
      <SideLabels />
      <PageNum n={page} />
    </div>
  );
}
function IcoChartWhite() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="13" rx="1" /><path d="M7 12l3-3 2 2 4-5M12 16v3M9 22h6" /></svg>);
}

// 17 — Limitaciones
const LIMIT: [string, string, string][] = [
  ["01.", "Falta de Consideración de Dimensiones Sociales y Comportamentales", "Reduciendo la capacidad de los modelos para representar la complejidad real del entorno."],
  ["02.", "Elevado Costo Computacional de NSGA-II/III", "Este costo restringe la escalabilidad y la aplicabilidad práctica de los algoritmos en contextos urbanos de gran tamaño"],
  ["03.", "Limitaciones de NSGA-II y NSGA-III en Escenarios Complejos", "Pudiendo generar resultados defectuosos, condicionando fuertemente las soluciones obtenidas y afectando la calidad de los resultados."],
];
function Limitaciones() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, top: 95, fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: GRAYBLUE }}>Limitaciones</div>
      {LIMIT.map(([num, title, body], i) => {
        const y = 200 + i * 160;
        return (
          <div key={i} style={{ position: "absolute", left: 90, right: 150, top: y }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, color: GRAYBLUE }}>{num}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 28, color: GRAYBLUE }}>{title}</span>
            </div>
            <div style={{ borderBottom: "1.5px solid #000", margin: "6px 0 8px" }} />
            <div style={{ fontSize: 16, lineHeight: 1.4, color: "#333" }}>{body}</div>
          </div>
        );
      })}
      <SideLabels />
      <PageNum n={17} />
    </div>
  );
}

// Helpers para diapositivas de metodología (cajas grises + títulos serif)
function StageTitle({ top, children }: { top: number; children: React.ReactNode }) {
  return <div style={{ position: "absolute", left: 90, right: 90, top, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, color: GRAYBLUE, lineHeight: 1.15 }}>{children}</div>;
}
function GrayBoxRow({ top, h, items }: { top: number; h: number; items: string[] }) {
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top, height: h, display: "flex", gap: 18 }}>
      {items.map((t, i) => (
        <div key={i} style={{ flex: 1, border: "1px solid #888", background: "#ECECEC", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 16, padding: 8, color: "#222", lineHeight: 1.3 }}>{t}</div>
      ))}
    </div>
  );
}
const topBot = (<>
  <div style={{ position: "absolute", left: 90, right: 90, top: 40, ...line() }} />
  <div style={{ position: "absolute", left: 90, right: 90, bottom: 40, ...line() }} />
</>);

// 19 — Diagrama de flujo de la metodología (componente StepsDiagram del proyecto)
function MetodFlujo() {
  return (
    <div style={{ ...fill, background: "#fff" }}>
      <StepsDiagram />
    </div>
  );
}
// 20 — Modelo geoespacial base + Clasificación
function MetodBase() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>{topBot}
      <StageTitle top={70}>Construcción y procesamiento del modelo<br />geoespacial base</StageTitle>
      <GrayBoxRow top={190} h={72} items={["Recolección y elaboración del mapa base", "Digitalización de elementos urbanos", "Integración de datos en el modelo", "Cálculo de tiempo en viaje"]} />
      <StageTitle top={360}>Clasificación automática de Infraestructura<br />Socioeconómica</StageTitle>
      <GrayBoxRow top={500} h={72} items={["Estructura del clasificador de servicios", "Obtención de hogares y edificios residenciales", "Normalización de la base socioespacial"]} />
    </div>
  );
}
// 21 — Evaluación de la accesibilidad urbana
function MetodAcces() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>{topBot}
      <StageTitle top={80}>Evaluación de la accesibilidad urbana</StageTitle>
      <div style={{ position: "absolute", left: 150, top: 200, width: 250, height: 70, border: "1px solid #888", background: "#ECECEC", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 16 }}>Asociacion de puntos a la red vial</div>
      <div style={{ position: "absolute", right: 150, top: 200, width: 250, height: 70, border: "1px solid #888", background: "#ECECEC", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 16 }}>Cálculo de tiempos mínimos y cobertura</div>
      <img src={`${IMG}/image16.png`} alt="" style={{ position: "absolute", left: "50%", top: 300, transform: "translateX(-50%)", width: 420, height: 280, objectFit: "contain" }} />
    </div>
  );
}
// 22 — Generación óptima (3 cajas + fórmulas)
// Fórmulas en código (nítidas)
const MATH: React.CSSProperties = { fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", color: "#111" };
function Frac({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 5px" }}>
      <span style={{ padding: "0 5px", lineHeight: 1.1 }}>{a}</span>
      <span style={{ padding: "0 5px", lineHeight: 1.1, borderTop: "1.4px solid #111" }}>{b}</span>
    </span>
  );
}
function MetodGen() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>{topBot}
      <StageTitle top={70}>Generación óptima de accesibilidad a servicios<br />públicos usando algoritmos de evolutivos</StageTitle>
      <GrayBoxRow top={230} h={70} items={["Formulación del problema", "Estructura operativa del algoritmo evolutivo", "Ejecución y selección de soluciones"]} />

      {/* Columna 1 — Formulación */}
      <div style={{ position: "absolute", left: 90, top: 360, width: 360, textAlign: "center", ...MATH }}>
        <div style={{ fontSize: 24 }}>x = (x<sub>1</sub>, x<sub>2</sub>, …, x<sub>n</sub>)</div>
        <div style={{ fontSize: 24, marginTop: 26 }}>f<sub>c</sub> = 1 − cov<sub>c</sub></div>
        <div style={{ fontSize: 17, marginTop: 26 }}>
          change_ratio = <Frac a="1" b="n" /> <span style={{ fontStyle: "normal", fontSize: 22 }}>Σ</span> 𝟙[x<sub>i</sub> ≠ x<sub>i</sub><sup>(0)</sup>]
        </div>
      </div>

      {/* Columna 2 — Vector objetivo */}
      <div style={{ position: "absolute", left: 470, top: 360, width: 330, ...MATH, fontSize: 20, lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>F(x) =</span>
          <span style={{ fontSize: 96, fontStyle: "normal", lineHeight: 0.8 }}>(</span>
          <div>
            f<sub>salud</sub>,<br />
            f<sub>educación</sub>,<br />
            f<sub>áreas verdes</sub>,<br />
            f<sub>trabajo</sub>, f<sub>change</sub>
          </div>
        </div>
      </div>

      {/* Columna 3 — Normalización y score */}
      <div style={{ position: "absolute", left: 820, top: 360, width: 400, ...MATH }}>
        <div style={{ fontSize: 16, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          f<sub>k</sub><sup>norm</sup> =
          <Frac a={<>f<sub>k</sub> − f<sub>k</sub><sup>min</sup></>} b={<>f<sub>k</sub><sup>max</sup> − f<sub>k</sub><sup>min</sup></>} />
        </div>
        <div style={{ fontSize: 12.5, fontStyle: "normal", marginTop: 4, color: "#555" }}>k ∈ {"{salud, educ, verdes, trab, change}"}</div>
        <div style={{ fontSize: 15.5, marginTop: 26, lineHeight: 1.4 }}>
          score(x) = f<sub>salud</sub><sup>norm</sup> + f<sub>educ</sub><sup>norm</sup> + f<sub>verdes</sub><sup>norm</sup> + f<sub>trab</sub><sup>norm</sup> + 5 f<sub>change</sub><sup>norm</sup>
        </div>
      </div>
    </div>
  );
}
// 23 / 30 — mapa de resultados
function MetodVis() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>{topBot}
      <StageTitle top={70}>Visualización de los resultados y el juicio de expertos</StageTitle>
      <div style={{ position: "absolute", left: 150, top: 150, width: 230, height: 64, border: "1px solid #888", background: "#ECECEC", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 15 }}>visualización y validación de resultados</div>
      <div style={{ position: "absolute", right: 180, top: 150, width: 230, height: 64, border: "1px solid #888", background: "#ECECEC", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 15 }}>Juicio de expertos</div>
      <img src={`${IMG}/image25.png`} alt="" style={{ position: "absolute", left: "50%", top: 250, transform: "translateX(-50%)", width: 880, height: 400, objectFit: "contain" }} />
    </div>
  );
}

// 25 — Experimentación (lista con tiles de íconos)
const EXPER: [string, string][] = [
  ["Área de estudio y recolección de datos", "El experimento se desarrolló sobre un sector digitalizado de San Juan de Miraflores, que permitió representar su tejido urbano y ejecutar el modelo de optimización."],
  ["Implementación práctica del sistema", "La implementación ejecutó el modelo sobre la red peatonal y los servicios de SJM, asignando cada punto a su nodo más cercano y evaluando las coberturas iniciales con Dijkstra multi-fuente."],
  ["Parámetros finales aplicados al experimento", "El experimento empleó NSGA-II con 50 individuos, 200 generaciones, cruce de 0.9, mutación de 0.7 y un umbral de accesibilidad de 15 minutos a 4.5 km/h."],
  ["Validación del experimento", "La validación confirmó que todas las 10,000 soluciones mantuvieron las cantidades originales por categoría, que las coberturas coinciden al recalcular externamente con Dijkstra, que los mapas muestran mejoras reales en accesibilidad"],
];
function Experimentacion() {
  const tiles = ["#3a3a3a", "#F08A4B", "#3a3a3a", "#F4B183"];
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, top: 90, fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, color: GRAYBLUE }}>Experimentación e Implementación</div>
      {EXPER.map(([title, body], i) => {
        const y = 175 + i * 128;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: 50, top: y, width: 64, height: 64, background: tiles[i], display: "flex", alignItems: "center", justifyContent: "center" }}><IcoChartWhite /></div>
            <div style={{ position: "absolute", left: 140, top: y + 4, width: 20, ...line("#000"), height: 1.5 }} />
            <div style={{ position: "absolute", left: 320, top: y, width: 280, fontFamily: DISPLAY, fontWeight: 700, fontSize: 21, color: GRAYBLUE, lineHeight: 1.15 }}>{title}</div>
            <div style={{ position: "absolute", left: 640, top: y, right: 60, fontSize: 15.5, lineHeight: 1.4, color: "#222" }}>{body}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// 27 — Resultados (6.1 y 6.2)
function Resultados() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, top: 95, fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, color: GRAYBLUE }}>Resultados</div>
      <div style={{ position: "absolute", left: 90, right: 150, top: 220 }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: "#111" }}>6.1 Análisis de la Situación Inicial</div>
        <div style={{ borderBottom: "1.5px solid #000", margin: "8px 0 10px" }} />
        <div style={{ fontSize: 16, lineHeight: 1.45, color: "#333" }}>El escenario inicial revela fuertes desigualdades en accesibilidad: salud alcanza 91.72%, educación 98.21%, trabajo 100%, pero áreas verdes solo 26.62%, lo que reduce la cobertura integral también a 26.62% y deja a más de 1,060 hogares sin parques cercanos, concentrando los déficits en zonas periféricas y evidenciando la necesidad de optimizar la distribución urbana.</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 150, top: 470 }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, color: "#111" }}>6.2 Resultados de la Optimización con NSGA-II</div>
        <div style={{ borderBottom: "1.5px solid #000", margin: "8px 0 10px" }} />
        <div style={{ fontSize: 16, lineHeight: 1.45, color: "#333" }}>El algoritmo mostró una convergencia clara: pasó de ~126 intercambios con alta variabilidad en las primeras generaciones a ~32–40 intercambios con variabilidad casi nula en la generación 200, evidenciando una transición estable de exploración a explotación y la obtención de soluciones de mayor calidad.</div>
      </div>
      <SideLabels />
      <PageNum n={27} />
    </div>
  );
}
// 28 — Charts de evolución (componente React con datos reales de SJM)
function ResultadosCharts() {
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>{topBot}
      <div style={{ position: "absolute", left: 100, right: 100, top: 70, height: 470 }}>
        <EvolutionChart data={SJM_EVOLUTION} />
      </div>
      <div style={{ position: "absolute", left: 90, bottom: 95, fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, color: GRAYBLUE }}>6.2 Resultados de la Optimización con NSGA-II</div>
    </div>
  );
}
// 29 — Comparación antes/después
const COMP: string[] = [
  "La cobertura de áreas verdes pasó de 26.62% a 100%, sumando 1,065 hogares con acceso y logrando una mejora absoluta de 73.38 puntos porcentuales.",
  "La salud subió de 91.72% a 100% (+8.28 pp), educación mejoró +1.79 pp y la cobertura integral pasó de 26.62% a 100%, logrando que los 1,452 hogares accedan simultáneamente a los cuatro servicios esenciales.",
  "Aproximadamente el 83% de los hogares mejoraron su acceso a servicios, un impacto notable logrado solo mediante redistribución espacial.",
];
const COV_LABEL: Record<string, string> = { cov_health: "Salud", cov_education: "Educación", cov_greens: "Áreas verdes", cov_work: "Trabajo", cov_all: "Todas" };
function CoverageBars({ data }: { data: { metric: string; initial: number; final: number }[] }) {
  const VW = 760, VH = 380, P = { l: 48, r: 20, t: 28, b: 56 };
  const iw = VW - P.l - P.r, ih = VH - P.t - P.b;
  const band = iw / data.length, bw = band * 0.28;
  const yOf = (v: number) => P.t + ih - v * ih;
  const C_INI = "#E15D52", C_FIN = "#4FA85F";
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto" }}>
      <text x={VW / 2} y={16} textAnchor="middle" fontSize={14} fontWeight={700} fill="#333" fontFamily={BODY}>Cobertura por categoría (%)</text>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={P.l} x2={VW - P.r} y1={yOf(g)} y2={yOf(g)} stroke="#ddd" />
          <text x={P.l - 6} y={yOf(g) + 4} textAnchor="end" fontSize={10} fill="#666" fontFamily={BODY}>{g * 100}</text>
        </g>
      ))}
      {data.map((c, i) => {
        const cx = P.l + band * i + band / 2;
        const lbl = (COV_LABEL[c.metric] || c.metric);
        return (
          <g key={c.metric}>
            <rect x={cx - bw - 3} y={yOf(c.initial)} width={bw} height={ih * c.initial} fill={C_INI} />
            <rect x={cx + 3} y={yOf(c.final)} width={bw} height={ih * c.final} fill={C_FIN} />
            <text x={cx - bw / 2 - 3} y={yOf(c.initial) - 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#333" fontFamily={BODY}>{(c.initial * 100).toFixed(0)}%</text>
            <text x={cx + bw / 2 + 3} y={yOf(c.final) - 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#333" fontFamily={BODY}>{(c.final * 100).toFixed(0)}%</text>
            <text x={cx} y={VH - P.b + 18} textAnchor="middle" fontSize={11} fill="#333" fontFamily={BODY}>{lbl}</text>
          </g>
        );
      })}
      {/* leyenda */}
      <g fontFamily={BODY} fontSize={11}>
        <rect x={P.l} y={VH - 18} width={12} height={12} fill={C_INI} /><text x={P.l + 18} y={VH - 8} fill="#333">Estado inicial</text>
        <rect x={P.l + 140} y={VH - 18} width={12} height={12} fill={C_FIN} /><text x={P.l + 158} y={VH - 8} fill="#333">Estado optimizado</text>
      </g>
    </svg>
  );
}
function Comparacion() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 55, ...line() }} />
      <div style={{ position: "absolute", left: 40, top: 150, width: 360, fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, color: GRAYBLUE, lineHeight: 1.15 }}>6.3 Comparación Antes/Después de la Optimización</div>
      <div style={{ position: "absolute", right: 60, top: 85, width: 760 }}><CoverageBars data={SJM_COMPARISON} /></div>
      <div style={{ position: "absolute", left: 110, right: 60, top: 420, display: "flex", flexDirection: "column", gap: 12, fontSize: 16, lineHeight: 1.4, color: "#222" }}>
        {COMP.map((t, i) => (<div key={i}><span style={{ color: ACCENT }}>● </span>{t}</div>))}
      </div>
    </div>
  );
}
// Resultados · Situación inicial — texto nítido + mapa en alta resolución
// (capturado del mapa real de StrideMap, distrito San Juan de Miraflores).
function ResultadoInicial() {
  const M: [string, string, string][] = [
    ["Salud", "91,7 %", "#D55E00"],
    ["Educación", "98,2 %", "#0072B2"],
    ["Áreas verdes", "26,6 %", "#009E73"],
    ["Trabajo", "100 %", "#CC79A7"],
  ];
  const Lg = ({ c, t }: { c: string; t: string }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 11, height: 11, borderRadius: "50%", background: c, flexShrink: 0 }} />{t}
    </span>
  );
  return (
    <div style={{ ...fill, background: "#fff", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 56, top: 44, display: "flex", alignItems: "center" }}>
        <Pin />
        <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 13, letterSpacing: 3, color: ACCENT, textTransform: "uppercase" }}>Resultados · Situación inicial</span>
      </div>
      <div style={{ position: "absolute", left: 56, top: 70, fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: "#222" }}>Análisis de la situación inicial</div>

      {/* Panel izquierdo — coberturas por categoría */}
      <div style={{ position: "absolute", left: 56, top: 178, width: 372 }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 600, fontSize: 14, letterSpacing: 1.2, color: "#8a8a8a", textTransform: "uppercase", marginBottom: 6 }}>Cobertura inicial · 1 450 hogares</div>
        {M.map(([lbl, val, col]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #ededed" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 17, color: "#333" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: col, flexShrink: 0 }} />{lbl}
            </span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, color: "#222" }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 26 }}>
          <div style={{ fontFamily: CONDENSED, fontSize: 14, letterSpacing: 1.2, color: "#8a8a8a", textTransform: "uppercase" }}>Cobertura total</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 66, color: ACCENT, lineHeight: 1 }}>26,6 %</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: "#777", marginTop: 8 }}>Determinada por el déficit de áreas verdes: un hogar cuenta como cubierto solo si alcanza las cuatro categorías a 15 min a pie.</div>
        </div>
      </div>

      {/* Mapa en alta resolución */}
      <div style={{ position: "absolute", left: 462, right: 48, top: 150, bottom: 86, borderRadius: 10, overflow: "hidden", border: "1px solid #dddddd", boxShadow: "0 3px 12px rgba(0,0,0,0.12)" }}>
        <img src={`${IMG}/mapa_inicial.png`} alt="Mapa de la situación inicial de San Juan de Miraflores" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "47% center" }} />
      </div>
      {/* Leyenda */}
      <div style={{ position: "absolute", left: 470, bottom: 40, right: 48, display: "flex", gap: 22, flexWrap: "wrap", fontSize: 12.5, color: "#444" }}>
        <Lg c="#009E73" t="Hogar cubierto" />
        <Lg c="#D55E00" t="Hogar sin cobertura" />
        <Lg c="#0072B2" t="Servicios (educación)" />
        <Lg c="#CC79A7" t="Servicios (trabajo)" />
        <span style={{ color: "#999", fontStyle: "italic" }}>Datos OpenStreetMap · contorno del distrito (línea discontinua)</span>
      </div>
    </div>
  );
}
// 30 — Discusión (mapa)
function DiscusionMapa() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>{topBot}
      <div style={{ position: "absolute", left: 90, top: 60, fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, color: GRAYBLUE }}>Discusión de los resultados</div>
      <img src={`${IMG}/image25.png`} alt="" style={{ position: "absolute", left: "50%", top: 150, transform: "translateX(-50%)", width: 1080, height: 500, objectFit: "contain" }} />
    </div>
  );
}
// 31 — Discusión (dominó, fondo naranja)
function DiscusionDomino() {
  return (
    <div style={{ ...fill, background: ORANGE }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 130, ...line() }} />
      <img src={`${IMG}/image28.png`} alt="" style={{ position: "absolute", left: "50%", top: 75, transform: "translateX(-50%)", height: 450, objectFit: "contain" }} />
      <div style={{ position: "absolute", left: 90, bottom: 55, fontFamily: DISPLAY, fontWeight: 900, fontSize: 36, color: "#000" }}>Discusión de los resultados</div>
    </div>
  );
}
// 32 — Enfoque general / discusión (4 ítems)
const ENFOQUE: [string, string, string[]][] = [
  ["01.", "Enfoque general", ["La discusión interpreta los resultados dentro del marco de la ciudad de 15 minutos, analizando implicancias, viabilidad y limitaciones del modelo."]],
  ["02.", "Mejoras en accesibilidad", ["La cobertura universal lograda refleja una optimización espacial efectiva, aunque sin considerar calidad o capacidad de los servicios."]],
  ["03.", "Viabilidad práctica", ["La reubicación es técnicamente posible pero su implementación real depende de costos, infraestructura y complejidad de cada tipo de servicio."]],
  ["04.", "Limitaciones del modelo", [
    "El modelo no diferencia capacidades, tamaños, calidad ni horarios de los servicios.",
    "Todos los hogares son tratados como equivalentes, sin considerar diferencias sociales o demográficas.",
    "El modelo solo reubica servicios existentes, sin permitir la creación de nueva infraestructura que podría ser más eficiente.",
  ]],
];
function EnfoqueGeneral() {
  return (
    <div style={{ ...fill, background: "#FBF1E7", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 45, ...line() }} />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 30, ...line() }} />
      {ENFOQUE.map(([num, title, body], i) => {
        const y = 70 + i * 158;
        return (
          <div key={i} style={{ position: "absolute", left: 90, right: 90, top: y }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 30, color: "#111" }}>{num}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, color: "#111" }}>{title}</span>
            </div>
            <div style={{ borderBottom: "1.5px solid #000", margin: "5px 0 7px" }} />
            {body.length === 1
              ? <div style={{ fontSize: 15, lineHeight: 1.35, color: "#333" }}>{body[0]}</div>
              : <ul style={{ margin: 0, paddingLeft: 22, fontSize: 14, lineHeight: 1.35, color: "#333" }}>{body.map((b, j) => <li key={j}>{b}</li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}
// 33 — Conclusiones y trabajos futuros
function Conclusiones() {
  return (
    <div style={{ ...fill, background: "#ECECEC", fontFamily: BODY }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 55, ...line() }} />
      <div style={{ position: "absolute", left: 90, top: 230, width: 600, fontFamily: DISPLAY, fontWeight: 900, fontSize: 72, color: GRAYBLUE, lineHeight: 1.05 }}>Conclusiones y trabajos futuros</div>
      <img src={`${IMG}/image31.png`} alt="" style={{ position: "absolute", right: 70, top: 230, width: 480, height: 320, objectFit: "cover" }} />
      <PageNum n={33} />
    </div>
  );
}
// 34 — Gracias
function Gracias() {
  return (
    <div style={{ ...fill, background: "#000" }}>
      <img src={`${IMG}/image32.png`} alt="" style={{ ...fill, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: "#000", letterSpacing: 1 }}>
        GRACIAS POR SU ATENCION
      </div>
    </div>
  );
}

// ============================================================
// Láminas renovadas: Estado del arte / Marco teórico / Limitaciones
// (estilo del PDF EstadoArte_y_MarcoTeorico)
// ============================================================
const AR_BG = "#F3F3F4", AR_ORG = "#E0742E", AR_DARK = "#2B3A40", AR_RED = "#C0413A", AR_PEACH = "#FBE6DC";
const os = { fill: "none", stroke: AR_ORG, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Clock = () => (<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...os} /><path d="M12 7v5l3 2" {...os} /></svg>);
const Walk = () => (<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="2" {...os} /><path d="M13 7l-1.5 4.5 3 2.5 1.5 5M11.5 11.5L8 13M13 8.5l4 1.5" {...os} /></svg>);
const Net2 = () => (<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2.3" {...os} /><circle cx="19" cy="6" r="2.3" {...os} /><circle cx="12" cy="18" r="2.3" {...os} /><path d="M7 7l4 9M17 7l-4 9" {...os} /></svg>);
const Tree = () => (<svg width="30" height="30" viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="4.5" rx="1" {...os} /><rect x="3" y="16" width="6" height="4.5" rx="1" {...os} /><rect x="15" y="16" width="6" height="4.5" rx="1" {...os} /><path d="M12 7v4M6 16v-2.5h12V16" {...os} /></svg>);
const MapPin = () => (<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z" {...os} /><path d="M9 4v14M15 6v14" {...os} /></svg>);
const Route = () => (<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.2" {...os} /><circle cx="18" cy="18" r="2.2" {...os} /><path d="M8 6h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h4" {...os} /></svg>);
const Building = () => (<svg width="28" height="28" viewBox="0 0 24 24"><rect x="4" y="3" width="9" height="18" {...os} /><rect x="13" y="9" width="7" height="12" {...os} /><path d="M7 7h3M7 11h3M7 15h3M16 13h1M16 17h1" {...os} /></svg>);
const Scale = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M5 7h14M5 7l-2.5 5h5zM19 7l-2.5 5h5z" {...os} /><path d="M12 3l-7 4M12 3l7 4" {...os} /></svg>);
const DNA = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path d="M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9s10 3 10 9" {...os} /><path d="M8 6h8M8 18h8M9 9h6M9 15h6" {...os} /></svg>);
const Globe = () => (<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...os} /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" {...os} /></svg>);
const Layers = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 16.5l9 5 9-5" {...os} /></svg>);

function Pin() {
  return (<svg width="26" height="26" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill={AR_ORG} /><circle cx="12" cy="9" r="2.6" fill="#fff" /></svg>);
}
function ARHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div style={{ position: "absolute", left: 56, top: 46, display: "flex", alignItems: "center" }}>
        <Pin />
        <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 13, letterSpacing: 3, color: AR_ORG, textTransform: "uppercase" }}>{kicker}</span>
      </div>
      <div style={{ position: "absolute", left: 56, top: 70, fontFamily: DISPLAY, fontWeight: 700, fontSize: 48, color: AR_DARK }}>{title}</div>
    </>
  );
}
function ICircle({ children, size = 60 }: { children: React.ReactNode; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: AR_PEACH, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{children}</span>;
}

// Estado del arte — línea de tiempo
const TIMELINE: { year: string; author: string; tag: string; desc: string; Icon: () => React.ReactElement }[] = [
  { year: "2021", author: "Moreno et al.", tag: "Paradigma fundacional", desc: "Formulan el paradigma de la Ciudad de 15 Minutos: seis funciones esenciales (vivir, trabajar, abastecerse, salud, educación y ocio) accesibles a pie en 15 min.", Icon: Clock },
  { year: "2022", author: "Delgado-Enales et al.", tag: "Santander, España", desc: "Combinan OSMnx + Dijkstra + NSGA-II para optimizar la accesibilidad peatonal de adultos mayores: reducen el tiempo de tránsito en 46 %. Antecedente más cercano.", Icon: Walk },
  { year: "2022", author: "Wang et al.", tag: "Eindhoven, Países Bajos", desc: "Integran Dijkstra + NSGA-II sobre 5 451 celdas: mejoran la compacidad 13,41 %, la compatibilidad 7,02 % y la accesibilidad 18,07 %.", Icon: Net2 },
  { year: "2022", author: "Lima et al.", tag: "Chicago, EE. UU.", desc: "Optimizan barrios de 15 minutos con NSGA-II: 25 000 configuraciones y un frente de Pareto de 50 soluciones; reducen 14 650 m de red vial (≈ 27,4 M USD).", Icon: Tree },
  { year: "2024", author: "Carot y Villalba", tag: "Valencia, España", desc: "Evalúan la accesibilidad a recursos urbanos con OSMnx + Dijkstra de forma isócrona, mediante 21 KPIs en 4 dimensiones para los 70 barrios de Valencia.", Icon: MapPin },
  { year: "2025", author: "Barbosa et al.", tag: "Oporto, Portugal", desc: "Combinan Dijkstra + NSGA-II (DS-NSGA-II) sembrando la población con soluciones de Dijkstra: logran hasta ≈ 8× más soluciones de Pareto e hipervolumen del 95,7 %.", Icon: Route },
];
function EstadoArteTimeline() {
  const cols = TIMELINE.length, x0 = 40, span = 1200, cw = span / cols;
  const lineY = 232;
  return (
    <div style={{ ...fill, background: AR_BG, fontFamily: BODY }}>
      <ARHeader kicker="Revisión de literatura · Línea de tiempo" title="Estado del arte" />
      <div style={{ position: "absolute", left: x0 + cw / 2, right: x0 + cw / 2, top: lineY, height: 2, background: AR_ORG, opacity: 0.5 }} />
      {TIMELINE.map((t, i) => {
        const cx = x0 + cw * i + cw / 2;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: cx - 60, top: 178, width: 120, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, color: AR_ORG }}>{t.year}</div>
            <div style={{ position: "absolute", left: cx - 8, top: lineY - 7, width: 16, height: 16, borderRadius: "50%", background: AR_ORG }} />
            <div style={{ position: "absolute", left: cx - 1, top: lineY + 9, width: 2, height: 48, background: "#cfcfcf" }} />
            <div style={{ position: "absolute", left: cx - 92, top: 290, width: 184, height: 372, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "18px 12px", boxSizing: "border-box", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><ICircle size={56}><t.Icon /></ICircle></div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: AR_DARK, marginBottom: 8 }}>{t.author}</div>
              <div style={{ fontFamily: BODY, fontStyle: "italic", fontSize: 11.5, color: AR_ORG, borderBottom: "1px solid #e0d2c8", paddingBottom: 8, marginBottom: 10 }}>{t.tag}</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.35, color: "#555", textAlign: "left" }}>{t.desc}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 26, textAlign: "center", fontStyle: "italic", fontSize: 13, color: "#777" }}>
        Stack OSMnx · Dijkstra · NSGA-II → operacionalización de la Ciudad de 15 Minutos → hibridación Dijkstra + NSGA-II como frontera del estado del arte
      </div>
    </div>
  );
}

// Limitaciones de los enfoques actuales (4 tarjetas)
const LIM4: { n: string; title: string; body: string; cite: string; Icon: () => React.ReactElement }[] = [
  { n: "01", title: "Supuesto de suelo libre", body: "Varios enfoques asumen suelo libre o permiten cambios de uso irrestrictos entre celdas, supuestos incompatibles con los distritos consolidados del Sur Global.", cite: "Boyukliyski (2022); Abdel-Ghany (2022); Wang (2022)", Icon: Building },
  { n: "02", title: "Predominio de lo cuantitativo", body: "Se privilegian los objetivos cuantitativos sobre dimensiones cualitativas como el carácter local y la cohesión social, lo que reduce la capacidad de los modelos para representar la complejidad real del entorno.", cite: "Jiang et al. (2024)", Icon: Scale },
  { n: "03", title: "NSGA-II con muchos objetivos", body: "Pierde eficacia con más de cinco objetivos por la menor presión de selección en su crowding distance; con un número moderado de objetivos supera a NSGA-III en diversidad de soluciones.", cite: "Maleki (2022); Zhou (2024)", Icon: DNA },
  { n: "04", title: "Evidencia geográficamente sesgada", body: "La evidencia empírica se concentra en Europa, Norteamérica y Asia Oriental; el Sur Global permanece subrepresentado.", cite: "Omwamba (2025); Moreno et al. (2021)", Icon: Globe },
];
function LimitacionesGap() {
  return (
    <div style={{ ...fill, background: AR_BG, fontFamily: BODY }}>
      <ARHeader kicker="Revisión de literatura · Brecha de investigación" title="Limitaciones de los enfoques actuales" />
      {LIM4.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 56 + col * 590, y = 170 + row * 248;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 555, height: 220, background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: 26, boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 50, height: 50, borderRadius: "50%", background: AR_ORG, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, flexShrink: 0 }}>{c.n}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: AR_DARK, flex: 1 }}>{c.title}</span>
              <ICircle size={50}><c.Icon /></ICircle>
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.4, color: "#555", marginTop: 16 }}>{c.body}</div>
            <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#999", marginTop: 12 }}>{c.cite}</div>
          </div>
        );
      })}
    </div>
  );
}

// Marco teórico (5 tarjetas)
const TEORIA: { n: string; title: string; body: string; Icon: () => React.ReactElement }[] = [
  { n: "01", title: "Sistemas de Información Geográfica (GIS)", body: "Plataforma para integrar y analizar información georreferenciada. El modelo vectorial preserva la morfología de calles y servicios, y convierte fuentes abiertas como OpenStreetMap en grafos ponderados.", Icon: Layers },
  { n: "02", title: "Teoría de grafos y rutas mínimas", body: "La red peatonal se modela como un grafo no dirigido G = (V, E): nodos (intersecciones) y aristas (tramos). Dijkstra (1959) halla el camino más corto con pesos no negativos.", Icon: Net2 },
  { n: "03", title: "Optimización multiobjetivo", body: "Optimiza varias funciones en conflicto sin una única solución. La dominancia de Pareto define el conjunto eficiente y la frontera de soluciones de compromiso.", Icon: Scale },
  { n: "04", title: "Algoritmos evolutivos y NSGA-II", body: "Inspirados en la selección natural (selección, cruce, mutación). NSGA-II aproxima el frente de Pareto con ordenamiento no dominado y crowding distance, bajo esquema elitista.", Icon: DNA },
  { n: "05", title: "Paradigma de la Ciudad de 15 Minutos", body: "Moreno et al. (2021): la calidad de vida urbana se mide por el acceso peatonal a las funciones esenciales en un umbral de 15 minutos.", Icon: Clock },
];
function MarcoTeoricoCards() {
  const pos = [[56, 170], [466, 170], [876, 170], [261, 415], [671, 415]];
  return (
    <div style={{ ...fill, background: AR_BG, fontFamily: BODY }}>
      <ARHeader kicker="Fundamentos conceptuales del modelo" title="Marco teórico" />
      {TEORIA.map((c, i) => {
        const [x, y] = pos[i];
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 348, height: 218, background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: 22, boxSizing: "border-box" }}>
            <div style={{ position: "absolute", right: 16, top: 12, fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, color: "#d9d9d9" }}>{c.n}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ICircle size={48}><c.Icon /></ICircle>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, color: AR_DARK, lineHeight: 1.15, paddingRight: 30 }}>{c.title}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: "#555", marginTop: 14 }}>{c.body}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 24, textAlign: "center", fontStyle: "italic", fontSize: 13, color: "#777" }}>
        Del grafo georreferenciado al cálculo de accesibilidad con Dijkstra y la optimización con NSGA-II, bajo el paradigma de la Ciudad de 15 Minutos.
      </div>
    </div>
  );
}

// Metodología propuesta (recreación del PDF Metodologia_proceso) — proceso completo
const PBOX = "#FBE6DC", PBORDER = "#f1d8c9", PCIRC = "#E0561F";
function ProcBox({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, background: PBOX, border: `1px solid ${PBORDER}`, borderRadius: 6, padding: "9px 8px", textAlign: "center", fontSize: 12.5, color: "#555", lineHeight: 1.25, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}
function PArrow({ d = "right" }: { d?: "right" | "left" }) {
  return <div style={{ flexShrink: 0, width: 34, display: "flex", alignItems: "center", justifyContent: "center", color: AR_ORG, fontSize: 22, fontWeight: 700 }}>{d === "left" ? "←" : "→"}</div>;
}
function PRow({ items, dir = "right" }: { items: string[]; dir?: "right" | "left" }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", marginTop: 8 }}>
      {items.map((t, i) => (<React.Fragment key={i}>{i > 0 && <PArrow d={dir} />}<ProcBox>{t}</ProcBox></React.Fragment>))}
    </div>
  );
}
function ProcPanel({ n, title, top, height, children }: { n: string; title: string; top: number; height: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 56, right: 56, top, height, background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", padding: "13px 22px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", background: PCIRC, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>{n}</span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: AR_DARK }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
function MetodologiaPropuesta() {
  return (
    <div style={{ ...fill, background: AR_BG, fontFamily: BODY }}>
      <ARHeader kicker="Modelo de reordenamiento urbano · Proceso propuesto" title="Metodología propuesta" />
      <ProcPanel n="1" title="Construcción del modelo geoespacial base" top={150} height={108}>
        <PRow items={["Recolección y digitalización de datos", "Integración de datos en el modelo", "Clasificación de infraestructura socioeconómica"]} />
      </ProcPanel>
      <ProcPanel n="2" title="Evaluación de la accesibilidad urbana" top={270} height={118}>
        <PRow items={["Representación de la red peatonal como grafo", "Cálculo del tiempo de viaje", "Cálculo de tiempos mínimos con Dijkstra multifuente", "Determinación de cobertura"]} />
      </ProcPanel>
      <ProcPanel n="3" title="Optimización del reordenamiento territorial mediante NSGA-II" top={400} height={210}>
        <PRow items={["Esquema general", "Población inicial", "Funciones objetivo", "Operadores genéticos"]} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "calc((100% - 102px) / 4)", textAlign: "center", color: AR_ORG, fontSize: 20, fontWeight: 700, padding: "1px 0" }}>↓</div>
        </div>
        <PRow items={["Selección final desde el frente de Pareto", "Criterio de parada", "Reemplazo elitista", "Selección por torneo binario"]} dir="left" />
      </ProcPanel>
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 22, textAlign: "center", fontStyle: "italic", fontSize: 13, color: "#777" }}>
        El modelo no construye ni elimina edificaciones: re-asigna la función de cada ubicación, preservando los conteos por categoría.
      </div>
    </div>
  );
}

// Fases detalladas de metodología (imágenes renderizadas del PDF Metodologia_detalle)
function FaseImg({ n }: { n: number }) {
  return (
    <div style={{ ...fill, background: "#fff" }}>
      <img src={`${IMG}/metod/fase${n}.png`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}
// Fase 1 — usa el componente real DataDiagram (vectorial, alta calidad) + badges
function MetFase1() {
  const badge: React.CSSProperties = { background: "#fff", border: `1px solid ${AR_ORG}`, color: AR_ORG, borderRadius: 20, padding: "5px 16px", fontSize: 13, fontFamily: BODY, fontWeight: 600 };
  return (
    <div style={{ ...fill, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 760, transform: "scale(0.9)", transformOrigin: "center" }}>
        <DataDiagram />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {["9 132 nodos", "27 806 aristas", "1 452 viviendas", "1 748 servicios"].map((b) => <span key={b} style={badge}>{b}</span>)}
      </div>
    </div>
  );
}

// Fase 2 — usa el componente real GraphDiagram (grafo + Dijkstra), vectorial
function MetFase2() {
  return (
    <div style={{ ...fill, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 960, transform: "scale(0.74)", transformOrigin: "center" }}>
        <GraphDiagram />
      </div>
    </div>
  );
}

// Fase 3 (esquema general) — usa el componente real NSGADijkstraFlow, vectorial
function MetFase4() {
  return (
    <div style={{ ...fill, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 760, transform: "scale(0.82)", transformOrigin: "center" }}>
        <NSGADijkstraFlow />
      </div>
    </div>
  );
}

// Fase 3 (operadores) — solo los paneles de operadores (Sampling/Crossover/Mutation/Repair)
function MetFase5() {
  return (
    <div style={{ ...fill, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", padding: "0 90px", boxSizing: "border-box" }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, color: GRAYBLUE, marginBottom: 6 }}>Operadores genéticos especializados</div>
      <div style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.45, color: "#555", maxWidth: 1080, marginBottom: 10 }}>
        Cada panel muestra cómo un operador transforma el <strong>cromosoma</strong> (el vector de usos de suelo, una categoría por celda). Las filas son ejemplos «antes → después» y las celdas resaltadas marcan los genes modificados. Todos los operadores <strong>preservan los conteos por categoría</strong> mediante intercambios; el operador de <em>repair</em> corrige cualquier desbalance, garantizando soluciones factibles.
      </div>
      <div style={{ width: 980, transform: "scale(0.74)", transformOrigin: "top left" }}>
        <OperatorsPanels />
      </div>
    </div>
  );
}
// Fase 3 (flujo) — solo el Pipeline del ciclo evolutivo por generación
function MetFase6() {
  return (
    <div style={{ ...fill, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 720, transform: "scale(1.55)", transformOrigin: "center" }}>
        <OperatorsPipeline />
      </div>
    </div>
  );
}

// Experimentos y resultados (imágenes renderizadas del PDF Experimentos_y_Resultados)
function ExpImg({ n }: { n: number }) {
  return (
    <div style={{ ...fill, background: "#fff" }}>
      <img src={`${IMG}/exp/p${n}.png`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

// ============================================================
// Motor de diapositivas
// ============================================================
const SLIDES: { render: () => React.ReactElement; label: string }[] = [
  { render: () => <Portada />, label: "Portada" },
  { render: () => <Indice />, label: "Índice" },
  { render: () => <Separador num="01." title="Introducción" page={3} />, label: "01 Introducción" },
  { render: () => <IntroContent />, label: "Introducción" },
  { render: () => <Separador num="02." title="Problemática" page={5} />, label: "02 Problemática" },
  { render: () => <Problematica />, label: "Problemática" },
  { render: () => <Separador num="03." title="Objetivos" page={7} />, label: "03 Objetivos" },
  { render: () => <ObjetivoGeneral />, label: "Objetivo general" },
  { render: () => <ObjetivosEspecificos />, label: "Objetivos específicos" },
  { render: () => <Separador num="04." title="Justificación" page={10} />, label: "04 Justificación" },
  { render: () => <Justificacion />, label: "Justificación" },
  { render: () => <Separador num="05." title="Marco teórico" page={12} />, label: "05 Marco teórico" },
  { render: () => <MarcoTeoricoCards />, label: "Marco teórico" },
  { render: () => <Separador num="06." title="Estado del arte" page={14} />, label: "06 Estado del arte" },
  { render: () => <EstadoArteTimeline />, label: "Estado del arte" },
  { render: () => <LimitacionesGap />, label: "Limitaciones" },
  { render: () => <Separador num="07." title="Metodología" page={18} />, label: "07 Metodología" },
  { render: () => <MetodologiaPropuesta />, label: "Metodología propuesta" },
  { render: () => <MetFase1 />, label: "Fase 1 · Datos" },
  { render: () => <MetFase2 />, label: "Fase 2 · Accesibilidad" },
  { render: () => <FaseImg n={3} />, label: "Fase 3 · Representación de la solución" },
  { render: () => <MetFase4 />, label: "Fase 3 · Esquema general" },
  { render: () => <MetFase5 />, label: "Fase 3 · Operadores genéticos" },
  { render: () => <MetFase6 />, label: "Fase 3 · Flujo (pipeline)" },
  { render: () => <FaseImg n={7} />, label: "Fase 3 · Evolución y selección" },
  { render: () => <Separador num="08." title="Experimentación e Implementación" page={24} />, label: "08 Experimentación" },
  { render: () => <ExpImg n={1} />, label: "Configuración del experimento" },
  { render: () => <Separador num="09." title="Resultados" page={26} />, label: "09 Resultados" },
  { render: () => <ResultadoInicial />, label: "Situación inicial" },
  { render: () => <ExpImg n={3} />, label: "Convergencia del algoritmo" },
  { render: () => <ExpImg n={4} />, label: "Frente de Pareto factible" },
  { render: () => <ExpImg n={5} />, label: "Comparación antes/después" },
  { render: () => <ExpImg n={6} />, label: "Demostración en vivo (video)" },
  { render: () => <Conclusiones />, label: "Conclusiones" },
  { render: () => <Gracias />, label: "Gracias" },
];

export default function SeminarioWindow({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const n = SLIDES.length;

  // Transición Push + zoom: actualiza i, prev y dir EN EL MISMO commit para que
  // el slide saliente y el entrante se rendericen juntos desde el primer frame
  // (si prev se fijara en un efecto posterior habría un frame en blanco → titileo).
  const iRef = useRef(0);
  const go = useCallback((d: number) => {
    const cur = iRef.current;
    const next = Math.max(0, Math.min(n - 1, cur + d));
    if (next === cur) return;
    setDir(d >= 0 ? 1 : -1);
    setPrev(cur);
    setI(next);
    iRef.current = next;
  }, [n]);

  // Descarta el slide saliente cuando termina la animación (~320 ms).
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 320);
    return () => clearTimeout(t);
  }, [prev, i]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  // escalar el lienzo 1280x720 para caber en el área disponible
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / W, height / H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <XPWindow title="Seminario II — Presentación" onClose={onClose} width="92vw" height="92vh">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2f2f2f" }}>
        {/* escenario */}
        <div ref={stageRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 10 }}>
          <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "center", position: "relative", flexShrink: 0, boxShadow: "0 3px 18px rgba(0,0,0,0.5)", overflow: "hidden", background: "#fff" }}>
            {prev !== null && prev !== i && (
              <div
                key={`out-${prev}`}
                className={dir >= 0 ? "slide-push-out-left" : "slide-push-out-right"}
                style={{ position: "absolute", inset: 0 }}
              >
                {SLIDES[prev].render()}
              </div>
            )}
            <div
              key={`in-${i}`}
              className={dir >= 0 ? "slide-push-in-right" : "slide-push-in-left"}
              style={{ position: "absolute", inset: 0, zIndex: 2 }}
            >
              {SLIDES[i].render()}
            </div>
          </div>
        </div>
        {/* barra de control */}
        <div style={{
          flexShrink: 0, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          background: "var(--xp-beige-light)", borderTop: "1px solid var(--xp-border)", fontFamily: BODY,
        }}>
          <button onClick={() => go(-1)} disabled={i === 0} style={navBtn(i === 0)}>◀</button>
          <span style={{ fontSize: 13, color: "var(--xp-brown)", minWidth: 160, textAlign: "center" }}>
            {i + 1} / {n} · {SLIDES[i].label}
          </span>
          <button onClick={() => go(1)} disabled={i === n - 1} style={navBtn(i === n - 1)}>▶</button>
        </div>
      </div>
    </XPWindow>
  );
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "4px 16px", borderRadius: 4, border: "1px solid var(--xp-border)",
    background: disabled ? "#ddd" : "var(--xp-green)", color: disabled ? "#999" : "#fff",
    fontSize: 14, cursor: disabled ? "default" : "pointer",
  };
}
