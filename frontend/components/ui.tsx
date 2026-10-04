import type { ReactNode } from "react";

export function Gauge({ pct, color = "#2EC07A" }: { pct: number; color?: string }) {
  const r = 64;
  const c = 75;
  const circ = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * circ;
  return (
    <svg viewBox="0 0 150 150" style={{ width: "100%", height: "100%" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#1C1C22" strokeWidth="10" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ * 0.25} />
    </svg>
  );
}

export function EmptyState({ icon, text, action }: { icon: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="es-icon">{icon}</span>
      <span className="es-text">{text}</span>
      {action}
    </div>
  );
}

export function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <span>⚠</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && <button onClick={onRetry}>Retry</button>}
      {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="ai-typing" role="status">
      <div className="blink-dot" /><div className="blink-dot" /><div className="blink-dot" />
      <span>{text}</span>
    </div>
  );
}
