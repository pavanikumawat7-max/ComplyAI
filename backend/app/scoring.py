"""Deterministic risk/compliance scoring (no LLM involved, fully testable)."""
from app.schemas import Assessment, Gap, Rule, RiskLevel, Severity

# Probability-like weight of a single unmet obligation by severity.
SEVERITY_WEIGHT = {
    Severity.critical: 0.40,
    Severity.high: 0.25,
    Severity.medium: 0.12,
    Severity.low: 0.05,
}
# Fraction of the weight applied by status. "unknown" = no evidence either way;
# treated conservatively as half a gap.
STATUS_FACTOR = {"gap": 1.0, "partial": 0.5, "unknown": 0.5}
# Credit toward the compliance score by assessment status.
COMPLIANCE_CREDIT = {"compliant": 1.0, "partial": 0.5, "gap": 0.0, "unknown": 0.0}


def risk_score(gaps: list[Gap]) -> int:
    """Combine gap risks as independent events: 100 * (1 - prod(1 - p_i))."""
    survive = 1.0
    for g in gaps:
        survive *= 1.0 - SEVERITY_WEIGHT[g.severity] * STATUS_FACTOR[g.status]
    return round(100 * (1.0 - survive))


def risk_level(score: int) -> RiskLevel:
    if score < 25:
        return RiskLevel.low
    if score < 50:
        return RiskLevel.medium
    if score < 75:
        return RiskLevel.high
    return RiskLevel.critical


def compliance_score(rules: list[Rule], assessments: list[Assessment]) -> int:
    """Severity-weighted share of obligations met (0-100)."""
    by_rule = {a.rule_id: a.status for a in assessments}
    total = sum(SEVERITY_WEIGHT[r.severity] for r in rules)
    if total == 0:
        return 100
    earned = sum(SEVERITY_WEIGHT[r.severity] * COMPLIANCE_CREDIT[by_rule.get(r.id, "unknown")] for r in rules)
    return round(100 * earned / total)
