// Mirrors backend/app/schemas.py. Keep in sync with the API.
export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type GapStatus = "partial" | "gap" | "unknown";

export interface CompanyProfile {
  name: string;
  sector: string;
  provider: string;
  description: string;
}

export interface Rule {
  id: string;
  text: string;
  category: string;
  severity: Severity;
}

export interface Assessment {
  rule_id: string;
  status: "compliant" | "partial" | "gap";
  evidence: string;
  gap_title: string;
  affected_policies: string[];
}

export interface Gap {
  id: string;
  rule_id: string;
  title: string;
  rule_text: string;
  severity: Severity;
  status: GapStatus;
  evidence: string;
  affected_policies: string[];
}

export interface FineItem {
  gap_id: string;
  min_inr: number;
  max_inr: number;
  basis: string;
}

export interface FineEstimate {
  currency: "INR";
  min_total: number;
  max_total: number;
  items: FineItem[];
  disclaimer: string;
}

export interface Report {
  executive_summary: string;
  business_impact: string;
  risk_explanation: string;
  priorities: string[];
}

export interface AnalysisResult {
  rules: Rule[];
  assessments: Assessment[];
  gaps: Gap[];
  risk: RiskLevel;
  risk_score: number;
  compliance_score: number;
  report: Report;
  fine: FineEstimate;
}

export interface RemediationPlan {
  policy_title: string;
  policy_text: string;
  checklist: { text: string; timeframe: string }[];
  actions: { title: string; description: string; effort: string }[];
}

export interface SimulationResult {
  scenario_name: string;
  new_rules: Rule[];
  new_gaps: Gap[];
  scenario_compliance_score: number;
  risk_before: number;
  risk_after: number;
  risk_delta: number;
  risk_level_after: RiskLevel;
  additional_fine: FineEstimate;
  policies_at_risk: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Health {
  status: string;
  llm_configured: boolean;
  model: string | null;
  provider: string;
}

/** The inputs an analysis was run with; reused for remediation / simulation. */
export interface AnalysisSnapshot {
  result: AnalysisResult;
  company: CompanyProfile;
  controls: string[];
  ranAt: string;
}

export interface FormState {
  company: CompanyProfile;
  controlsText: string;
  regulationText: string;
}

export interface SimForm {
  name: string;
  text: string;
}

export type RequestStatus = "idle" | "loading" | "error";
