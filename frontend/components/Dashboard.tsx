import { fineRange, parseControls, riskColor, SEV_LABEL } from "@/lib/format";
import type { AnalysisSnapshot, FormState, RequestStatus, Severity } from "@/lib/types";
import { EmptyState, ErrorBanner, Loading } from "./ui";

const SEV_COLOR: Record<Severity, string> = { critical: "#E24B4A", high: "#E8B840", medium: "#3B8BEB", low: "#2EC07A" };
const SEVS: Severity[] = ["critical", "high", "medium", "low"];

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onRun: () => void;
  status: RequestStatus;
  error: string | null;
  onDismissError: () => void;
  snapshot: AnalysisSnapshot | null;
  stale: boolean;
}

export default function Dashboard({ form, setForm, onRun, status, error, onDismissError, snapshot, stale }: Props) {
  const loading = status === "loading";
  const setCompany = (k: keyof FormState["company"], v: string) => setForm({ ...form, company: { ...form.company, [k]: v } });
  const nControls = parseControls(form.controlsText).length;

  return (
    <>
      <div className="panel fade-in">
        <div className="panel-header">
          <span className="panel-dot" style={{ background: "var(--orange)", boxShadow: "0 0 6px var(--orange)" }} />
          <span className="panel-title">Run Compliance Analysis</span>
          <span className="panel-sub">Company + existing controls + regulation text</span>
        </div>
        <div className="form-body">
          <div className="form-row">
            <div>
              <label className="field-label" htmlFor="co-name">Company name *</label>
              <input id="co-name" className="field-input" maxLength={120} value={form.company.name} onChange={(e) => setCompany("name", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="co-sector">Sector</label>
              <input id="co-sector" className="field-input" maxLength={80} placeholder="e.g. Fintech" value={form.company.sector} onChange={(e) => setCompany("sector", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="co-region">Region</label>
              <input id="co-region" className="field-input" maxLength={80} placeholder="e.g. India" value={form.company.region} onChange={(e) => setCompany("region", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="controls">Existing policies &amp; controls * (one per line)</label>
            <textarea id="controls" className="field-area" placeholder={"We publish the APR in every loan agreement\nUser data is stored encrypted in AWS"} value={form.controlsText} onChange={(e) => setForm({ ...form, controlsText: e.target.value })} />
            <div className="field-hint">{nControls} control{nControls === 1 ? "" : "s"} · only controls listed here count as evidence of compliance</div>
          </div>
          <div>
            <label className="field-label" htmlFor="reg">Regulation text * (20–20,000 characters)</label>
            <textarea id="reg" className="field-area" style={{ minHeight: 150 }} placeholder="Paste the regulation, circular or clause text to assess against…" value={form.regulationText} onChange={(e) => setForm({ ...form, regulationText: e.target.value })} />
            <div className="field-hint">{form.regulationText.trim().length.toLocaleString()} characters</div>
          </div>
          {error && <ErrorBanner message={error} onRetry={onRun} onDismiss={onDismissError} />}
          <div className="btn-row">
            <button className="btn-primary" onClick={onRun} disabled={loading}>{loading ? "Analyzing…" : "▶ Run Analysis"}</button>
            {stale && snapshot && !loading && <span className="pill pill-yellow">Inputs changed since last run</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel fade-in">
          <Loading text="Running the LangGraph workflow (extract rules → assess controls → score → report). This makes several model calls and can take a minute…" />
        </div>
      ) : !snapshot ? (
        <div className="panel">
          <EmptyState icon="◈" text="No analysis yet. Fill in the form above and run an analysis to see your compliance score, gaps, risk and report." />
        </div>
      ) : (
        <Results snapshot={snapshot} />
      )}
    </>
  );
}

function Results({ snapshot }: { snapshot: AnalysisSnapshot }) {
  const { result } = snapshot;
  const rc = riskColor(result.risk_score);
  const compColor = result.compliance_score >= 75 ? "#2EC07A" : result.compliance_score >= 50 ? "#E8B840" : "#E24B4A";
  const counts = SEVS.map((s) => ({ s, n: result.gaps.filter((g) => g.severity === s).length }));
  const gaps = [...result.gaps].sort((a, b) => SEVS.indexOf(a.severity) - SEVS.indexOf(b.severity));
  const metrics = [
    { label: "Open Gaps", value: String(result.gaps.length), color: result.gaps.length ? "#E24B4A" : "#2EC07A", meta: `of ${result.rules.length} obligations` },
    { label: "Compliance Score", value: `${result.compliance_score}%`, color: compColor, meta: "severity-weighted" },
    { label: "Risk Score", value: String(result.risk_score), color: rc, meta: `${result.risk} · out of 100` },
    { label: "Obligations Checked", value: String(result.rules.length), color: "#3B8BEB", meta: `analyzed ${new Date(snapshot.ranAt).toLocaleString()}` },
  ];
  return (
    <>
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card fade-in" style={{ borderTop: `2px solid ${m.color}88` }}>
            <div className="mc-label">{m.label}</div>
            <div className="mc-value" style={{ color: m.color }}>{m.value}</div>
            <div className="mc-meta">{m.meta}</div>
          </div>
        ))}
      </div>

      <div className="panel fade-in">
        <div className="panel-header">
          <span className="panel-dot" style={{ background: "var(--yellow)", boxShadow: "0 0 5px var(--yellow)" }} />
          <span className="panel-title">Score Explanation</span>
          <span className="panel-sub">Why {result.compliance_score}% compliant?</span>
        </div>
        <div className="score-explain" style={{ margin: "12px 16px" }}>
          <div className="score-explain-title">
            {gaps.length ? "Your score is reduced by these unmet obligations:" : "All extracted obligations are covered by your stated controls."}
          </div>
          {gaps.map((g) => (
            <div className="score-reason" key={g.id}>
              <div className="score-reason-dot" style={{ background: SEV_COLOR[g.severity] }} />
              <div className="score-reason-text">
                <strong>{g.title}</strong> — {g.severity} severity, {g.status === "unknown" ? "not assessed" : g.status === "partial" ? "partially met" : "not met"}. {g.evidence}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row-2-1">
        <div className="panel fade-in">
          <div className="panel-header">
            <span className="panel-dot dot-live" />
            <span className="panel-title">Audit Report</span>
            <span className="panel-sub">Generated by Gemini from this analysis</span>
          </div>
          <div className="report-section"><div className="report-label">Executive summary</div><div className="report-text">{result.report.executive_summary}</div></div>
          <div className="report-section"><div className="report-label">Business impact</div><div className="report-text">{result.report.business_impact}</div></div>
          <div className="report-section"><div className="report-label">Risk explanation</div><div className="report-text">{result.report.risk_explanation}</div></div>
          {result.report.priorities.length > 0 && (
            <div className="report-section">
              <div className="report-label">Remediation priorities</div>
              {result.report.priorities.map((p, i) => <div className="report-text" key={i}>{i + 1}. {p}</div>)}
            </div>
          )}
          <div className="report-section">
            <div className="report-label">Indicative penalty exposure</div>
            <div className="report-text" style={{ color: "var(--red)", fontFamily: "var(--font-m)" }}>{fineRange(result.fine)}</div>
            {result.fine.items.map((f) => (
              <div className="field-hint" key={f.gap_id}>{result.gaps.find((g) => g.id === f.gap_id)?.title ?? f.gap_id}: {f.basis}</div>
            ))}
            <div className="field-hint" style={{ marginTop: 6 }}>{result.fine.disclaimer}</div>
          </div>
        </div>

        <div className="panel fade-in">
          <div className="panel-header">
            <span className="panel-dot" style={{ background: rc, boxShadow: `0 0 6px ${rc}` }} />
            <span className="panel-title">Risk Score</span>
            <span className="panel-sub">{result.risk}</span>
          </div>
          <div className="risk-body">
            <div className="risk-score-row">
              <span className="risk-score" style={{ color: rc }}>{result.risk_score}</span>
              <span className="risk-score-sub">/ 100</span>
            </div>
            <div className="risk-track"><div className="risk-fill" style={{ width: `${result.risk_score}%`, background: rc }} /></div>
            <div className="risk-labels"><span className="risk-label-item">LOW</span><span className="risk-label-item">MEDIUM</span><span className="risk-label-item">HIGH</span></div>
            <div className="risk-segments">
              {counts.map(({ s, n }) => (
                <div className="risk-seg" key={s}>
                  <div className="risk-seg-label">{SEV_LABEL[s]} gaps</div>
                  <div className="risk-seg-val" style={{ color: SEV_COLOR[s] }}>{n}</div>
                  <div className="risk-seg-bar"><div className="risk-seg-fill" style={{ width: `${result.gaps.length ? (n / result.gaps.length) * 100 : 0}%`, background: SEV_COLOR[s] }} /></div>
                </div>
              ))}
            </div>
            <div className="field-hint" style={{ marginTop: 12 }}>Each gap adds risk by severity (critical 40%, high 25%, medium 12%, low 5%); partial counts half.</div>
          </div>
        </div>
      </div>
    </>
  );
}
