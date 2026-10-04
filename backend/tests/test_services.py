from app import services
from app.schemas import (ActionStep, ChatRequest, ChecklistItem, Gap, RemediationPlan,
                          RemediationRequest, SimulateRequest)
from tests.conftest import COMPANY, CONTROLS, make_llm


def baseline_gap():
    return Gap(id="gap-R1", rule_id="R1", title="old", rule_text="old", severity="high", status="gap")


def test_simulation_is_dynamic_and_adds_to_baseline():
    llm = make_llm()
    base = [baseline_gap()]
    res = services.simulate(llm, SimulateRequest(
        company=COMPANY, controls=CONTROLS, scenario_name="New Rule", regulation_text="r" * 40, baseline_gaps=base))
    assert res.risk_before == 25
    assert res.risk_after > res.risk_before
    assert res.risk_delta == res.risk_after - res.risk_before
    assert [g.id for g in res.new_gaps] == ["sim-S2", "sim-S3", "sim-S4"]
    assert res.additional_fine.max_total > 0
    assert res.policies_at_risk == ["Privacy Policy"]


def test_simulation_with_compliant_company_changes_nothing():
    llm = make_llm({f"R{i}": "compliant" for i in range(1, 5)})
    res = services.simulate(llm, SimulateRequest(
        company=COMPANY, controls=CONTROLS, scenario_name="X", regulation_text="r" * 40))
    assert res.risk_delta == 0 and res.new_gaps == [] and res.scenario_compliance_score == 100


def test_remediation_includes_gap_context():
    llm = make_llm()
    plan = RemediationPlan(policy_title="P", policy_text="body",
                           checklist=[ChecklistItem(text="a", timeframe="Day 1")],
                           actions=[ActionStep(title="t", description="d", effort="1h")])
    llm.handlers[RemediationPlan] = lambda p: plan
    out = services.remediate(llm, RemediationRequest(company=COMPANY, controls=CONTROLS, gap=baseline_gap()))
    assert out.policy_title == "P"
    assert "old" in llm.calls[-1][1]


def test_chat_passes_history_and_context():
    llm = make_llm()
    llm.chat_reply = "answer"
    req = ChatRequest(messages=[{"role": "user", "content": "hi"}, {"role": "assistant", "content": "yo"},
                                {"role": "user", "content": "what is my risk?"}],
                      context={"gaps": [baseline_gap().model_dump()], "risk_score": 25})
    assert services.chat(llm, req) == "answer"
    call = llm.chat_calls[0]
    assert len(call["messages"]) == 3
    assert "Risk score: 25/100" in call["system"] and "old" in call["system"]
