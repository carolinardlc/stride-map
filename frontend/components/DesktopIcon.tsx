"use client";

const IconSVGs: Record<string, React.ReactNode> = {
  document: (
    <svg width="48" height="48" viewBox="0 0 48 48">
      {/* Page */}
      <path d="M10 4h20l10 10v30H10V4z" fill="#f5f0e6" stroke="#8c7e6a" strokeWidth="1.5"/>
      {/* Fold */}
      <path d="M30 4v10h10" fill="#e0d8c8" stroke="#8c7e6a" strokeWidth="1.5"/>
      {/* Lines */}
      <line x1="16" y1="20" x2="34" y2="20" stroke="#c4b8a0" strokeWidth="1.5"/>
      <line x1="16" y1="25" x2="34" y2="25" stroke="#c4b8a0" strokeWidth="1.5"/>
      <line x1="16" y1="30" x2="28" y2="30" stroke="#c4b8a0" strokeWidth="1.5"/>
      <line x1="16" y1="35" x2="32" y2="35" stroke="#c4b8a0" strokeWidth="1.5"/>
      {/* Green accent bar */}
      <rect x="14" y="12" width="14" height="3" rx="1" fill="#4a7c59"/>
    </svg>
  ),
  presentation: (
    <svg width="48" height="48" viewBox="0 0 48 48">
      {/* Board */}
      <rect x="6" y="6" width="36" height="28" rx="2" fill="#f5f0e6" stroke="#8c7e6a" strokeWidth="1.5"/>
      {/* Top bar */}
      <rect x="6" y="6" width="36" height="6" rx="2" fill="#4a7c59"/>
      {/* Chart bars */}
      <rect x="12" y="26" width="6" height="4" rx="1" fill="#e74c3c" opacity="0.8"/>
      <rect x="21" y="20" width="6" height="10" rx="1" fill="#3498db" opacity="0.8"/>
      <rect x="30" y="16" width="6" height="14" rx="1" fill="#4a7c59" opacity="0.8"/>
      {/* Stand */}
      <line x1="24" y1="34" x2="24" y2="42" stroke="#8c7e6a" strokeWidth="2"/>
      <line x1="16" y1="42" x2="32" y2="42" stroke="#8c7e6a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  map: (
    <svg width="48" height="48" viewBox="0 0 48 48">
      {/* Map fold */}
      <path d="M6 8l12 4v28l-12-4V8z" fill="#6a9c79" stroke="#3d6b4a" strokeWidth="1"/>
      <path d="M18 12l12-4v28l-12 4V12z" fill="#f5f0e6" stroke="#8c7e6a" strokeWidth="1"/>
      <path d="M30 8l12 4v28l-12-4V8z" fill="#e8dcc8" stroke="#8c7e6a" strokeWidth="1"/>
      {/* Pin */}
      <circle cx="24" cy="20" r="4" fill="#e74c3c" stroke="#c0392b" strokeWidth="1"/>
      <circle cx="24" cy="20" r="1.5" fill="white"/>
      <path d="M24 24l0 5" stroke="#c0392b" strokeWidth="1.5"/>
      {/* Route line */}
      <path d="M12 20c4 6 8-4 12 0" stroke="#4a7c59" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
    </svg>
  ),
};

interface DesktopIconProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function DesktopIcon({ icon, label, onClick }: DesktopIconProps) {
  return (
    <div className="desktop-icon" onDoubleClick={onClick}>
      <div style={{ width: 48, height: 48 }}>
        {IconSVGs[icon] || IconSVGs.document}
      </div>
      <span className="desktop-icon-label">{label}</span>
    </div>
  );
}
