import { SEV_CLASS, SEV_LABEL } from "@/lib/format";
import type { AnalysisSnapshot, Gap } from "@/lib/types";
import { EmptyState, Gauge } from "./ui";

export default function Compliance({ snapshot, onFix, onGoDashboard }: { snapshot: AnalysisSnapshot | null; onFix: (g: Gap) => void; onGoDashboard: () => void }) {
  if (!snapshot) {
    return (
      <div className="panel"><EmptyState icon="◉" text="No compliance data yet. Run an analysis first."
        action={<button className="fix-btn" onClick={onGoDashboard}>Go to analysis →</button>} /></div>
    );
  }
  const { result } = snapshot;
  const pct = result.compliance_score;
  const color = pct >= 75 ? "#2EC07A" : pct >= 50 ? "#E8B840" : "#E24B4A";
  const n = Math.max(result.assessments.length, 1);
  const tiers = [
    { label: "Compliant", val: result.assessments.filter((a) => a.status === "compliant").length, color: "#2EC07A" },
    { label: "Partial", val: result.assessments.filter((a) => a.status === "partial").length, color: "#E8B840" },
    { label: "Gap", val: result.assessments.filter((a) => a.status === "gap").length, color: "#E24B4A" },
  ];
  const statusOf = (id: string) => result.assessments.find((a) => a.rule_id === id)?.status ?? "gap";
  const statusColor = { compliant: "#2EC07A", partial: "#E8B840", gap: "#E24B4A" } as const;

  return (
    <div className="fade-in">
      <div className="comply-grid">
        <div className="comply-gauge-card">
          <div style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, alignSelf: "flex-start" }}>Compliance Score</div>
          <div className="gauge-wrap">
            <Gauge pct={pct} color={color} />
            <div className="gauge-center">
              <span className="gauge-pct" style={{ color }}>{pct}%</span>
              <span className="gauge-sub">obligations met</span>
            </div>
          </div>
          <div className="gauge-tiers" style={{ width: "100%" }}>
            {tiers.map((t) => (
              <div className="gauge-tier-row" key={t.label}>
                <span className="gauge-tier-label">{t.label}</span>
                <div className="gauge-tier-bar"><div className="gauge-tier-fill" style={{ width: `${(t.val / n) * 100}%`, background: t.color }} /></div>
                <span className="gauge-tier-val" style={{ color: t.color }}>{t.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="comply-card">
          <div className="comply-card-header">
            <span className="panel-dot" style={{ background: "var(--red)", boxShadow: "0 0 5px var(--red)" }} />
            <span className="panel-title">Detected Gaps</span>
            <span className="panel-sub">{result.gaps.length} issues</span>
          </div>
          <div className="comply-card-body" style={{ maxHeight: 520, overflowY: "auto" }}>
            {result.gaps.length === 0 && <div style={{ padding: "14px 0", fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)" }}>No gaps detected.</div>}
            {result.gaps.map((g) => (
              <div className="gap-item" key={g.id}>
                <span className={`gap-sev ${SEV_CLASS[g.severity]}`}>{SEV_LABEL[g.severity]}</span>
                <div style={{ flex: 1 }}>
                  <div className="gap-title">{g.title}</div>
                  <div className="gap-desc">{g.rule_text}</div>
                </div>
                <button className="gap-fix" onClick={() => onFix(g)}>Fix →</button>
              </div>
            ))}
          </div>
        </div>

        <div className="comply-card">
          <div className="comply-card-header">
            <span className="panel-dot" style={{ background: "var(--blue)", boxShadow: "0 0 5px var(--blue)" }} />
            <span className="panel-title">Obligations Evaluated</span>
            <span className="panel-sub">{result.rules.length} extracted</span>
          </div>
          <div className="comply-card-body" style={{ maxHeight: 520, overflowY: "auto" }}>
            {result.rules.map((r) => {
              const st = statusOf(r.id);
              return (
                <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{r.text}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {[r.category, r.severity].map((c) => <span key={c} style={{ fontFamily: "var(--font-m)", fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border2)" }}>{c}</span>)}
                    <span style={{ fontFamily: "var(--font-m)", fontSize: 9, padding: "2px 7px", borderRadius: 3, color: statusColor[st], border: `1px solid ${statusColor[st]}55` }}>{st}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
