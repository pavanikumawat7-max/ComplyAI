import pytest

from app import scoring
from app.schemas import Assessment, Gap, Rule, RiskLevel


def gap(sev, status="gap"):
    return Gap(id="g", rule_id="R1", title="t", rule_text="r", severity=sev, status=status)


def test_no_gaps_is_zero_risk():
    assert scoring.risk_score([]) == 0
    assert scoring.risk_level(0) == RiskLevel.low


def test_single_gap_uses_severity_weight():
    assert scoring.risk_score([gap("critical")]) == 40
    assert scoring.risk_score([gap("low")]) == 5


def test_partial_counts_half():
    assert scoring.risk_score([gap("critical", "partial")]) == 20


def test_more_gaps_never_decrease_and_cap_below_100():
    gaps = [gap("critical") for _ in range(30)]
    scores = [scoring.risk_score(gaps[:n]) for n in range(1, 31)]
    assert scores == sorted(scores)
    assert scores[-1] <= 100


def test_severity_matters():
    assert scoring.risk_score([gap("critical")]) > scoring.risk_score([gap("low")])


@pytest.mark.parametrize("score,level", [(0, "LOW"), (24, "LOW"), (25, "MEDIUM"), (49, "MEDIUM"),
                                         (50, "HIGH"), (74, "HIGH"), (75, "CRITICAL"), (100, "CRITICAL")])
def test_levels(score, level):
    assert scoring.risk_level(score).value == level


def test_compliance_score_weighted():
    rules = [Rule(id="R1", text="a", category="x", severity="critical"),
             Rule(id="R2", text="b", category="x", severity="critical")]
    ass = [Assessment(rule_id="R1", status="compliant", evidence=""),
           Assessment(rule_id="R2", status="gap", evidence="")]
    assert scoring.compliance_score(rules, ass) == 50
    assert scoring.compliance_score([], []) == 100


def test_missing_assessment_counts_as_not_met():
    rules = [Rule(id="R1", text="a", category="x", severity="high")]
    assert scoring.compliance_score(rules, []) == 0
