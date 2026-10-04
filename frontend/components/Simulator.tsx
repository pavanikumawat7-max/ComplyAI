import { fineRange, riskColor, SEV_CLASS, SEV_LABEL } from "@/lib/format";
import type { AnalysisSnapshot, Gap, RequestStatus, SimForm, SimulationResult } from "@/lib/types";
import { EmptyState, ErrorBanner } from "./ui";

interface Props {
  snapshot: AnalysisSnapshot | null;
  form: SimForm;
  setForm: (f: SimForm) => void;
  status: RequestStatus;
  error: string | null;
  result: SimulationResult | null;
  onRun: () => void;
  onDismissError: () => void;
  onFix: (g: Gap) => void;
  onAsk: (r: SimulationResult) => void;
  onGoDashboard: () => void;
}

export default function Simulator({ snapshot, form, setForm, status, error, result, onRun, onDismissError, onFix, onAsk, onGoDashboard }: Props) {
  if (!snapshot) {
    return (
      <div className="panel"><EmptyState icon="⬢" text="The simulator layers a hypothetical regulation on top of your current gaps, so it needs a baseline. Run an analysis first."
        action={<button className="fix-btn" onClick={onGoDashboard}>Go to analysis →</button>} /></div>
    );
  }
  const loading = status === "loading";
  const red = "rgba(226,75,74,0.3)";
  return (
    <div className="fade-in">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-dot" style={{ background: "var(--purple)", boxShadow: "0 0 5px var(--purple)" }} />
          <span className="panel-title">What-If Simulator</span>
          <span className="panel-sub">Model a new regulation against your current controls</span>
        </div>
        <div className="sim-body">
          <div className="sim-grid">
            <div className="sim-controls">
              <label className="sim-label" htmlFor="sim-name">Scenario name</label>
              <input id="sim-name" className="field-input" style={{ marginBottom: 12 }} maxLength={200} placeholder="e.g. RBI Digital Lending v3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label className="sim-label" htmlFor="sim-text">Regulation text (20–20,000 chars)</label>
              <textarea id="sim-text" className="field-area" style={{ marginBottom: 12, minHeight: 160 }} placeholder="Paste the proposed regulation…" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              <div className="sim-label">Company</div>
              <div style={{ fontSize: 12, marginBottom: 12 }}>{snapshot.company.name} · {snapshot.controls.length} controls</div>
              <button className="sim-run-btn" onClick={onRun} disabled={loading}>{loading ? "Simulating…" : "▶ Run Simulation"}</button>
              <div style={{ marginTop: 12, padding: 10, background: "var(--bg3)", borderRadius: 5, fontFamily: "var(--font-m)", fontSize: 9, color: "var(--subtle)", lineHeight: 1.6 }}>
                Extracts obligations from this text, checks them against the controls from your last analysis, and adds any new gaps to its {snapshot.result.gaps.length} current gaps to recompute risk.
              </div>
            </div>
            <div className="sim-impact">
              {error && <ErrorBanner message={error} onRetry={onRun} onDismiss={onDismissError} />}
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 80 }} />)
              ) : result ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="sim-impact-card" style={{ borderColor: red }}>
                      <div className="sim-impact-label">Risk Change</div>
                      <div className="sim-impact-val" style={{ color: riskColor(result.risk_after) }}>{result.risk_delta >= 0 ? "+" : ""}{result.risk_delta} pts</div>
                      <div className="sim-impact-delta" style={{ color: riskColor(result.risk_after) }}>{result.risk_before} → {result.risk_after}/100 · {result.risk_level_after}</div>
                    </div>
                    <div className="sim-impact-card" style={{ borderColor: red }}>
                      <div className="sim-impact-label">Scenario Compliance</div>
                      <div className="sim-impact-val" style={{ color: result.scenario_compliance_score >= 75 ? "#2EC07A" : "#E24B4A" }}>{result.scenario_compliance_score}%</div>
                      <div className="sim-impact-delta" style={{ color: "var(--muted)" }}>of {result.new_rules.length} new obligations met</div>
                    </div>
                    <div className="sim-impact-card" style={{ borderColor: red }}>
                      <div className="sim-impact-label">Added Penalty Exposure</div>
                      <div className="sim-impact-val" style={{ color: "#E24B4A", fontSize: 16 }}>{fineRange(result.additional_fine)}</div>
                      <div className="sim-impact-delta" style={{ color: "var(--muted)" }}>indicative model estimate</div>
                    </div>
                    <div className="sim-impact-card" style={{ borderColor: red }}>
                      <div className="sim-impact-label">Policies At Risk</div>
                      <div className="sim-impact-val" style={{ color: "#E8B840" }}>{result.policies_at_risk.length}</div>
                      <div className="sim-impact-delta" style={{ color: "var(--muted)" }}>{result.policies_at_risk.join(", ") || "none identified"}</div>
                    </div>
                  </div>
                  <div className="sim-impact-card">
                    <div className="sim-broken-label">New gaps this regulation would create</div>
                    {result.new_gaps.length === 0 && <div className="sim-broken-item">No new gaps: your listed controls satisfy all {result.new_rules.length} extracted obligations.</div>}
                    {result.new_gaps.map((g) => (
                      <div className="sim-broken-item" key={g.id}>
                        <span className={`gap-sev ${SEV_CLASS[g.severity]}`}>{SEV_LABEL[g.severity]}</span>
                        <span>{g.title}</span>
                        <button className="gap-fix" style={{ marginLeft: "auto" }} onClick={() => onFix(g)}>Fix with AI</button>
                      </div>
                    ))}
                  </div>
                  <button className="sim-run-btn" onClick={() => onAsk(result)} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}>Ask AI for Detailed Analysis →</button>
                </>
              ) : (
                !error && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, flexDirection: "column", gap: 10, color: "var(--subtle)" }}>
                    <span style={{ fontSize: 32 }}>⬢</span>
                    <span style={{ fontFamily: "var(--font-m)", fontSize: 10 }}>Enter a scenario and run the simulation</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
