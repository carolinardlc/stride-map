"use client";

import { ReactNode } from "react";

interface XPWindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  height?: string;
}

export default function XPWindow({ title, onClose, children, width = "80vw", height = "80vh" }: XPWindowProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="xp-window" style={{ width, height, maxWidth: "95vw", maxHeight: "95vh" }}>
        <div className="xp-titlebar">
          <span>{title}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="xp-titlebar-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
