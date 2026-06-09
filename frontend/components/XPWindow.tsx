"use client";

import { ReactNode, useState } from "react";

interface XPWindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  height?: string;
}

export default function XPWindow({ title, onClose, children, width = "80vw", height = "80vh" }: XPWindowProps) {
  const [maximized, setMaximized] = useState(false);

  const windowStyle = maximized
    ? { width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh", borderRadius: 0 }
    : { width, height, maxWidth: "95vw", maxHeight: "95vh" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)", padding: maximized ? 0 : undefined }}
    >
      <div className="xp-window" style={windowStyle}>
        <div className="xp-titlebar">
          <span>{title}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="xp-titlebar-btn"
              onClick={() => setMaximized((m) => !m)}
              title={maximized ? "Restaurar" : "Maximizar"}
              aria-label={maximized ? "Restaurar" : "Maximizar"}
            >
              {maximized ? (
                <svg width="9" height="9" viewBox="0 0 10 10">
                  <rect x="1" y="2.5" width="6" height="6" fill="none" stroke="white" strokeWidth="1"/>
                  <rect x="3" y="1" width="6" height="6" fill="none" stroke="white" strokeWidth="1"/>
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 10 10">
                  <rect x="1" y="1" width="8" height="8" fill="none" stroke="white" strokeWidth="1"/>
                </svg>
              )}
            </button>
            <button className="xp-titlebar-btn" onClick={onClose} title="Cerrar" aria-label="Cerrar">✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
