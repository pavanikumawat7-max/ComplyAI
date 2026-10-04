import { SEV_CLASS, SEV_LABEL } from "@/lib/format";
import type { AnalysisSnapshot, Gap, Severity } from "@/lib/types";
import { EmptyState } from "./ui";

const ORDER: Severity[] = ["critical", "high", "medium", "low"];
const STATUS_TEXT = { gap: "not met", partial: "partially met", unknown: "not assessed" } as const;

export default function Findings({ snapshot, onFix, onGoDashboard }: { snapshot: AnalysisSnapshot | null; onFix: (g: Gap) => void; onGoDashboard: () => void }) {
  if (!snapshot) {
    return (
      <div className="panel"><EmptyState icon="◈" text="No findings yet. Run an analysis to see the compliance gaps found against your controls."
        action={<button className="fix-btn" onClick={onGoDashboard}>Go to analysis →</button>} /></div>
    );
  }
  const { result } = snapshot;
  const gaps = [...result.gaps].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
  const critical = gaps.filter((g) => g.severity === "critical").length;
  return (
    <div className="fade-in">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-dot" style={{ background: "var(--red)", boxShadow: "0 0 5px var(--red)" }} />
          <span className="panel-title">All Findings</span>
          <span className="panel-sub">{gaps.length} total · {critical} critical · Fix with AI generates a remediation plan</span>
        </div>
        {gaps.length === 0 ? (
          <EmptyState icon="✓" text={`No gaps: all ${result.rules.length} extracted obligations are covered by the controls you listed.`} />
        ) : (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {gaps.map((g) => {
              const category = result.rules.find((r) => r.id === g.rule_id)?.category;
              return (
                <div className="finding-card" key={g.id}>
                  <div className="finding-header">
                    <span className={`finding-sev ${SEV_CLASS[g.severity]}`}>{SEV_LABEL[g.severity]}</span>
                    <div className="finding-title">{g.title}</div>
                  </div>
                  <div className="finding-desc" style={{ fontSize: 10 }}>{g.rule_text}</div>
                  {g.evidence && <div className="finding-desc">Evidence: {g.evidence}</div>}
                  <div className="finding-footer">
                    {category && <span style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--subtle)", background: "var(--bg3)", padding: "3px 7px", borderRadius: 3, border: "1px solid var(--border2)" }}>{category}</span>}
                    <span style={{ fontFamily: "var(--font-m)", fontSize: 9, color: "var(--subtle)", marginLeft: 6 }}>{STATUS_TEXT[g.status]}</span>
                    <button className="fix-btn" style={{ marginLeft: "auto" }} onClick={() => onFix(g)}>✦ Fix with AI</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
