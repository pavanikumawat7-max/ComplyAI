import { fineRange } from "@/lib/format";
import type { AnalysisSnapshot, RequestStatus } from "@/lib/types";

export interface LogEvent { time: string; msg: string; color: string }

export default function Workflow({ snapshot, status, events }: { snapshot: AnalysisSnapshot | null; status: RequestStatus; events: LogEvent[] }) {
  const r = snapshot?.result;
  const count = (s: string) => r?.assessments.filter((a) => a.status === s).length ?? 0;
  const stages = [
    { name: "Ingest", icon: "◉", color: "#2EC07A", task: "Sanitises and validates the regulation and control text.", out: r && "Input validated" },
    { name: "Interpret (LLM)", icon: "⚖", color: "#E8B840", task: "Extracts atomic, testable obligations from the regulation text.", out: r && `${r.rules.length} obligations extracted` },
    { name: "Map controls (LLM)", icon: "◈", color: "#3B8BEB", task: "Judges each obligation against your stated controls.", out: r && `${count("compliant")} met · ${count("partial")} partial · ${count("gap")} gaps` },
    { name: "Score", icon: "◫", color: "#9B6DFF", task: "Computes risk and compliance scores deterministically (no model involved).", out: r && `Risk ${r.risk_score}/100 (${r.risk}) · compliance ${r.compliance_score}%` },
    { name: "Report (LLM)", icon: "✎", color: "#E8B840", task: "Writes the audit report and an indicative penalty estimate.", out: r && `Report generated · penalty ${fineRange(r.fine)}` },
  ];
  const label = status === "loading" ? "RUNNING" : snapshot ? "COMPLETE" : status === "error" ? "RUN FAILED" : "NOT RUN";
  const statusColor = status === "loading" ? "var(--yellow)" : snapshot ? "var(--blue)" : status === "error" ? "var(--red)" : "var(--muted)";
  const statusBg = status === "loading" ? "var(--yellow-dim)" : snapshot ? "var(--blue-dim)" : status === "error" ? "var(--red-dim)" : "var(--bg3)";
  const done = !!snapshot && status !== "loading";

  return (
    <div className="fade-in">
      <div className="panel">
        <div className="panel-header">
          <span className={`panel-dot${status === "loading" ? " dot-live" : ""}`} style={status === "loading" ? undefined : { background: "var(--subtle)" }} />
          <span className="panel-title">Analysis Workflow</span>
          <span className="panel-sub">LangGraph pipeline · runs on demand, not continuously</span>
        </div>
        {stages.map((s) => (
          <div className="agent-item" key={s.name}>
            <div className="agent-icon" style={{ background: s.color + "18", border: `1px solid ${s.color}33`, color: s.color, fontSize: 16 }}>{s.icon}</div>
            <div className="agent-body">
              <div className="agent-name">{s.name}</div>
              <div className="agent-task">{done && s.out ? s.out : s.task}</div>
              <div className="agent-progress"><div className="agent-progress-fill" style={{ width: done ? "100%" : "0%", background: s.color }} /></div>
            </div>
            <span className={`agent-status${status === "loading" ? " agent-active" : ""}`} style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}33` }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="row-2" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Session Activity</span><span className="panel-sub">this browser session</span></div>
          <div style={{ padding: "4px 0" }}>
            {events.length === 0 && <div style={{ padding: "14px 16px", fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)" }}>No activity yet.</div>}
            {events.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 16px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-m)", fontSize: 10 }}>
                <span style={{ color: "var(--subtle)", flexShrink: 0 }}>{l.time}</span>
                <span style={{ color: l.color }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Last Run Summary</span></div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {!r ? (
              <div style={{ fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)" }}>No completed run.</div>
            ) : (
              [
                { label: "Obligations extracted", val: String(r.rules.length), color: "#3B8BEB" },
                { label: "Obligations met", val: String(count("compliant")), color: "#2EC07A" },
                { label: "Gaps detected", val: String(r.gaps.length), color: "#E24B4A" },
                { label: "Risk score", val: `${r.risk_score}/100`, color: "#E8B840" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)" }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--font-m)", fontSize: 16, fontWeight: 300, color: s.color }}>{s.val}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
