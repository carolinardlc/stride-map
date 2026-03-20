"use client";

import { useState } from "react";
import DesktopIcon from "@/components/DesktopIcon";
import AboutWindow from "@/components/AboutWindow";
import MapWindow from "@/components/MapWindow";

type OpenWindow = "about" | "presentation" | "maps" | null;

export default function Desktop() {
  const [openWindow, setOpenWindow] = useState<OpenWindow>(null);

  return (
    <div className="desktop-bg" style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>

      {/* XP Bliss-inspired landscape */}
      <svg
        style={{ position: "absolute", bottom: 34, left: 0, width: "100%", height: "70%", pointerEvents: "none" }}
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8cfe0" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#d4c9b5" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7aab8a"/>
            <stop offset="100%" stopColor="#5d8c6b"/>
          </linearGradient>
          <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6a9c79"/>
            <stop offset="100%" stopColor="#4a7c59"/>
          </linearGradient>
          <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5d8c6b"/>
            <stop offset="100%" stopColor="#3d6b4a"/>
          </linearGradient>
        </defs>

        {/* Soft sky wash */}
        <rect width="1440" height="600" fill="url(#sky)"/>

        {/* Clouds - soft, sketchy */}
        <ellipse cx="300" cy="180" rx="120" ry="35" fill="#e8e0d0" opacity="0.4"/>
        <ellipse cx="340" cy="170" rx="80" ry="30" fill="#ede5d5" opacity="0.35"/>
        <ellipse cx="900" cy="150" rx="100" ry="28" fill="#e8e0d0" opacity="0.35"/>
        <ellipse cx="940" cy="142" rx="65" ry="22" fill="#ede5d5" opacity="0.3"/>
        <ellipse cx="1200" cy="200" rx="90" ry="25" fill="#e8e0d0" opacity="0.3"/>

        {/* Far hills - lightest */}
        <path d="M0 420 Q200 340 400 380 Q600 320 800 360 Q1000 300 1200 350 Q1350 330 1440 370 L1440 600 L0 600Z" fill="url(#hill1)" opacity="0.5"/>

        {/* Middle hills */}
        <path d="M0 480 Q150 400 350 430 Q500 390 700 420 Q850 380 1050 410 Q1250 370 1440 420 L1440 600 L0 600Z" fill="url(#hill2)" opacity="0.6"/>

        {/* Front hills - darkest, the classic Bliss curve */}
        <path d="M0 520 Q180 460 400 490 Q550 450 750 480 Q950 440 1100 470 Q1300 445 1440 480 L1440 600 L0 600Z" fill="url(#hill3)" opacity="0.7"/>

        {/* Grass texture lines */}
        <g stroke="#3d6b4a" strokeWidth="0.5" opacity="0.15">
          <path d="M100 530 Q120 520 140 530" fill="none"/>
          <path d="M300 510 Q320 500 340 510" fill="none"/>
          <path d="M500 500 Q520 490 540 500" fill="none"/>
          <path d="M700 490 Q720 480 740 490" fill="none"/>
          <path d="M900 495 Q920 485 940 495" fill="none"/>
          <path d="M1100 485 Q1120 475 1140 485" fill="none"/>
          <path d="M200 550 Q220 540 240 550" fill="none"/>
          <path d="M600 540 Q620 530 640 540" fill="none"/>
          <path d="M1000 530 Q1020 520 1040 530" fill="none"/>
          <path d="M1300 510 Q1320 500 1340 510" fill="none"/>
        </g>
      </svg>

      {/* Left icons */}
      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        zIndex: 10,
      }}>
        <DesktopIcon icon="document" label="About" onClick={() => setOpenWindow("about")} />
        <DesktopIcon icon="presentation" label="Presentation" onClick={() => setOpenWindow("presentation")} />
      </div>

      {/* Right icons */}
      <div style={{
        position: "absolute",
        top: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        zIndex: 10,
      }}>
        <DesktopIcon icon="map" label="StrideMap" onClick={() => setOpenWindow("maps")} />
      </div>

      {/* Taskbar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        background: "linear-gradient(180deg, #7aab8a 0%, #4a7c59 40%, #3d6b4a 100%)",
        borderTop: "1px solid #8dbc9d",
        display: "flex",
        alignItems: "center",
        padding: "0 6px",
        zIndex: 40,
        boxShadow: "0 -1px 4px rgba(0,0,0,0.15)",
      }}>
        {/* Start button */}
        <button style={{
          padding: "3px 14px 3px 8px",
          background: "linear-gradient(180deg, #7aab8a 0%, #3d6b4a 100%)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 3,
          color: "white",
          fontWeight: "bold",
          fontSize: 11,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: 0.3,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="#e74c3c"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="#3498db"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="#27ae60"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#f39c12"/>
          </svg>
          StrideMap
        </button>

        {/* Open window tab */}
        {openWindow && (
          <div style={{
            marginLeft: 6,
            padding: "3px 10px",
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 2,
            color: "white",
            fontSize: 11,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>
            {openWindow === "about" ? "About" : openWindow === "maps" ? "StrideMap" : "Presentation"}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* System tray */}
        <div style={{
          padding: "2px 10px",
          borderLeft: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          fontSize: 11,
        }}>
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Windows */}
      {openWindow === "about" && <AboutWindow onClose={() => setOpenWindow(null)} />}

      {openWindow === "presentation" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="xp-window" style={{ width: 400 }}>
            <div className="xp-titlebar">
              <span>Presentation</span>
              <button className="xp-titlebar-btn" onClick={() => setOpenWindow(null)}>✕</button>
            </div>
            <div style={{ padding: 32, textAlign: "center", color: "var(--xp-border)", fontSize: 13 }}>
              Presentation content coming soon
            </div>
          </div>
        </div>
      )}

      {openWindow === "maps" && <MapWindow onClose={() => setOpenWindow(null)} />}
    </div>
  );
}
