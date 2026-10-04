import { useEffect, useState } from "react";
import { SEV_CLASS, SEV_LABEL } from "@/lib/format";
import type { Gap, RemediationPlan } from "@/lib/types";
import { ErrorBanner, Loading } from "./ui";

export interface FixState { gap: Gap; status: "loading" | "done" | "error"; plan?: RemediationPlan; error?: string }

type Tab = "policy" | "checklist" | "actions";

export default function RemediationModal({ fix, onClose, onRetry, onNotify }: {
  fix: FixState; onClose: () => void; onRetry: () => void; onNotify: (title: string, sub: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("policy");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const { gap, plan } = fix;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(`${plan.policy_title}\n\n${plan.policy_text}`);
      onNotify("Policy copied", "Policy text copied to clipboard");
    } catch {
      onNotify("Copy failed", "Your browser blocked clipboard access");
    }
  };
  const download = () => {
    if (!plan) return;
    const blob = new Blob([`${plan.policy_title}\n\n${plan.policy_text}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.policy_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "policy"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Remediation plan">
        <div className="modal-header">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 6px var(--orange)", display: "inline-block" }} />
          <span className="modal-title">ComplyAI Fix — {gap.title}</span>
          <span className={`gap-sev ${SEV_CLASS[gap.severity]}`} style={{ marginLeft: 8 }}>{SEV_LABEL[gap.severity]}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {fix.status === "loading" && <div style={{ padding: 8 }}><Loading text="AI generating policy, checklist, and action steps…" /></div>}
        {fix.status === "error" && <div style={{ padding: 18 }}><ErrorBanner message={fix.error ?? "Failed to generate a remediation plan."} onRetry={onRetry} /></div>}
        {fix.status === "done" && plan && (
          <div className="modal-body">
            <div className="modal-tabs">
              {(["policy", "checklist", "actions"] as Tab[]).map((t) => (
                <div key={t} className={`modal-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</div>
              ))}
            </div>
            {tab === "policy" && (
              <div>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--muted)", marginBottom: 10 }}>AI-generated draft — review with legal/compliance before adopting:</div>
                <div className="policy-block"><strong>{plan.policy_title}</strong>{"\n\n"}{plan.policy_text}</div>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="fix-btn" onClick={copy}>⧉ Copy</button>
                  <button className="fix-btn secondary" onClick={download}>⬇ Download .txt</button>
                </div>
              </div>
            )}
            {tab === "checklist" && (
              <div>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--muted)", marginBottom: 12 }}>Click items to mark complete (not saved):</div>
                {plan.checklist.map((item, i) => (
                  <div className="checklist-item" key={i}>
                    <div className={`check-box${checked[i] ? " checked" : ""}`} onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}>
                      {checked[i] && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </div>
                    <div className="check-text" style={{ textDecoration: checked[i] ? "line-through" : "none", color: checked[i] ? "var(--muted)" : "var(--text)" }}>{item.text}</div>
                    <div className="check-time">{item.timeframe}</div>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)" }}>
                  {Object.values(checked).filter(Boolean).length}/{plan.checklist.length} complete
                </div>
              </div>
            )}
            {tab === "actions" && (
              <div>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--muted)", marginBottom: 12 }}>Step-by-step remediation plan:</div>
                {plan.actions.map((a, i) => (
                  <div className="action-step" key={i}>
                    <div className="action-num">{i + 1}</div>
                    <div className="action-content">
                      <div className="action-title">{a.title}</div>
                      <div className="action-desc">{a.description}</div>
                      <span className="action-tag">{a.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
