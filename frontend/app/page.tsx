"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Chat, { type ChatItem } from "@/components/Chat";
import Compliance from "@/components/Compliance";
import Dashboard from "@/components/Dashboard";
import Findings from "@/components/Findings";
import RemediationModal, { type FixState } from "@/components/RemediationModal";
import Simulator from "@/components/Simulator";
import Workflow, { type LogEvent } from "@/components/Workflow";
import { api, API_URL, ApiError, isAbort } from "@/lib/api";
import { fineRange, parseControls } from "@/lib/format";
import { css } from "@/lib/styles";
import type {
  AnalysisSnapshot, ChatMessage, FormState, Gap, Health, RemediationPlan, RequestStatus, SimForm, SimulationResult,
} from "@/lib/types";

const STORAGE_KEY = "complyai:v1";
const EMPTY_FORM: FormState = { company: { name: "", sector: "", region: "", description: "" }, controlsText: "", regulationText: "" };

type NavId = "dashboard" | "findings" | "workflow" | "compliance" | "chat" | "simulator";
const NAV: { label: string; icon: string; id: NavId }[] = [
  { label: "Dashboard", icon: "▣", id: "dashboard" },
  { label: "Findings", icon: "◈", id: "findings" },
  { label: "Workflow", icon: "⬡", id: "workflow" },
  { label: "Compliance", icon: "◉", id: "compliance" },
  { label: "Chat", icon: "◫", id: "chat" },
  { label: "Simulator", icon: "⬢", id: "simulator" },
];

interface Toast { id: number; title: string; sub: string; color: string }

function errMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unexpected error";
}

function validateInputs(name: string, controls: string[], regulation: string): string | null {
  if (!name.trim()) return "Company name is required.";
  if (controls.length === 0) return "Add at least one existing policy or control (one per line).";
  if (controls.length > 100) return "At most 100 controls are allowed.";
  if (controls.some((c) => c.length > 600)) return "Each control must be at most 600 characters.";
  const n = regulation.trim().length;
  if (n < 20) return "Regulation text must be at least 20 characters.";
  if (n > 20000) return "Regulation text must be at most 20,000 characters.";
  return null;
}

/** Backend requires alternating-safe history: drop error bubbles, merge same-role runs, start with a user turn. */
function buildHistory(items: ChatItem[]): ChatMessage[] {
  const merged: ChatMessage[] = [];
  for (const m of items) {
    if (m.error) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`;
    else merged.push({ role: m.role, content: m.content });
  }
  const tail = merged.slice(-20).map((m) => ({ ...m, content: m.content.slice(-4000) }));
  while (tail.length && tail[0].role !== "user") tail.shift();
  return tail;
}

export default function ComplyAI() {
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [timeStr, setTimeStr] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | "offline" | null>(null);
  const [events, setEvents] = useState<LogEvent[]>([]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<RequestStatus>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [fix, setFix] = useState<FixState | null>(null);

  const [simForm, setSimForm] = useState<SimForm>({ name: "", text: "" });
  const [simStatus, setSimStatus] = useState<RequestStatus>("idle");
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const [chat, setChat] = useState<ChatItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<ChatItem[]>([]);

  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(0);
  const analysisAbort = useRef<AbortController | null>(null);
  const simAbort = useRef<AbortController | null>(null);
  const fixAbort = useRef<AbortController | null>(null);
  const chatAbort = useRef<AbortController | null>(null);
  const fixCache = useRef(new Map<string, RemediationPlan>());

  // ── restore / persist (browser-only; the backend is stateless)
  // Reading localStorage must happen after mount (not during render) to avoid an SSR hydration mismatch,
  // so setState inside this one-shot effect is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.form?.company && typeof p.form.controlsText === "string") setForm(p.form);
        if (p?.snapshot?.result?.gaps && p.snapshot.company) setSnapshot(p.snapshot);
        if (p?.simForm && typeof p.simForm.name === "string") setSimForm(p.simForm);
        if (p?.simResult?.new_gaps) setSimResult(p.simResult);
      }
    } catch {
      /* corrupt storage: start fresh */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, snapshot, simForm, simResult }));
    } catch {
      /* quota / private mode: persistence is best-effort */
    }
  }, [hydrated, form, snapshot, simForm, simResult]);

  // ── clock + backend health
  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const check = () => api.health(ac.signal).then(setHealth).catch((e) => { if (!isAbort(e)) setHealth("offline"); });
    check();
    const t = setInterval(check, 30000);
    return () => { clearInterval(t); ac.abort(); };
  }, []);

  useEffect(() => () => {
    [analysisAbort, simAbort, fixAbort, chatAbort].forEach((r) => r.current?.abort());
  }, []);

  const addToast = useCallback((title: string, sub: string, color = "#2EC07A") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, title, sub, color }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }, []);

  const logEvent = useCallback((msg: string, color: string) => {
    setEvents((p) => [{ time: new Date().toLocaleTimeString("en-GB"), msg, color }, ...p].slice(0, 50));
  }, []);

  // ── analysis
  async function runAnalysis() {
    const controls = parseControls(form.controlsText);
    const invalid = validateInputs(form.company.name, controls, form.regulationText);
    if (invalid) { setAnalysisError(invalid); setAnalysisStatus("error"); return; }
    analysisAbort.current?.abort();
    const ac = new AbortController();
    analysisAbort.current = ac;
    const company = { ...form.company, name: form.company.name.trim() };
    setAnalysisStatus("loading");
    setAnalysisError(null);
    logEvent(`Analysis started for ${company.name}`, "#E8B840");
    try {
      const result = await api.analyze({ company, controls, regulation_text: form.regulationText.trim() }, ac.signal);
      if (ac.signal.aborted) return;
      fixCache.current.clear();
      setSnapshot({ result, company, controls, ranAt: new Date().toISOString() });
      setSimResult(null);
      setSimStatus("idle");
      setAnalysisStatus("idle");
      logEvent(`Analysis complete: ${result.gaps.length} gaps, risk ${result.risk_score}/100`, "#2EC07A");
      addToast("Analysis complete", `${result.gaps.length} gaps · risk ${result.risk_score}/100 · ${result.compliance_score}% compliant`);
    } catch (e) {
      if (isAbort(e) || ac.signal.aborted) return;
      setAnalysisError(errMsg(e));
      setAnalysisStatus("error");
      logEvent(`Analysis failed: ${errMsg(e)}`, "#E24B4A");
    }
  }

  // ── remediation
  async function loadFix(gap: Gap) {
    if (!snapshot) return;
    fixAbort.current?.abort();
    const ac = new AbortController();
    fixAbort.current = ac;
    const key = `${snapshot.ranAt}|${gap.id}|${gap.rule_text}`;
    const cached = fixCache.current.get(key);
    if (cached) { setFix({ gap, status: "done", plan: cached }); return; }
    setFix({ gap, status: "loading" });
    try {
      const plan = await api.remediation({ company: snapshot.company, controls: snapshot.controls, gap }, ac.signal);
      if (ac.signal.aborted) return;
      fixCache.current.set(key, plan);
      setFix({ gap, status: "done", plan });
      logEvent(`Remediation plan generated: ${gap.title}`, "#9B6DFF");
    } catch (e) {
      if (isAbort(e) || ac.signal.aborted) return;
      setFix({ gap, status: "error", error: errMsg(e) });
    }
  }
  function closeFix() { fixAbort.current?.abort(); setFix(null); }

  // ── simulation
  async function runSimulation() {
    if (!snapshot) return;
    const text = simForm.text.trim();
    if (!simForm.name.trim()) { setSimError("Give the scenario a name."); setSimStatus("error"); return; }
    if (text.length < 20 || text.length > 20000) { setSimError("Regulation text must be between 20 and 20,000 characters."); setSimStatus("error"); return; }
    simAbort.current?.abort();
    const ac = new AbortController();
    simAbort.current = ac;
    setSimStatus("loading");
    setSimError(null);
    setSimResult(null);
    try {
      const result = await api.simulate({
        company: snapshot.company, controls: snapshot.controls, scenario_name: simForm.name.trim(),
        regulation_text: text, baseline_gaps: snapshot.result.gaps,
      }, ac.signal);
      if (ac.signal.aborted) return;
      setSimResult(result);
      setSimStatus("idle");
      logEvent(`Simulation "${result.scenario_name}": risk ${result.risk_before} → ${result.risk_after}`, "#9B6DFF");
      addToast("Simulation complete", `Impact of "${result.scenario_name}" modeled`, "#9B6DFF");
    } catch (e) {
      if (isAbort(e) || ac.signal.aborted) return;
      setSimError(errMsg(e));
      setSimStatus("error");
      logEvent(`Simulation failed: ${errMsg(e)}`, "#E24B4A");
    }
  }

  // ── chat
  async function sendChat(text: string) {
    const content = text.trim().slice(0, 4000);
    if (!content || chatLoading) return;
    const withUser = [...chatRef.current, { role: "user" as const, content }];
    chatRef.current = withUser;
    setChat(withUser);
    setChatLoading(true);
    chatAbort.current?.abort();
    const ac = new AbortController();
    chatAbort.current = ac;
    try {
      const { reply } = await api.chat({
        messages: buildHistory(withUser),
        context: {
          company: snapshot?.company,
          gaps: snapshot?.result.gaps ?? [],
          risk_score: snapshot?.result.risk_score,
          compliance_score: snapshot?.result.compliance_score,
        },
      }, ac.signal);
      if (ac.signal.aborted) return;
      chatRef.current = [...chatRef.current, { role: "assistant", content: reply }];
    } catch (e) {
      if (isAbort(e) || ac.signal.aborted) return;
      chatRef.current = [...chatRef.current, { role: "assistant", content: errMsg(e), error: true }];
    }
    setChat(chatRef.current);
    setChatLoading(false);
  }

  function askAboutSimulation(r: SimulationResult) {
    const gaps = r.new_gaps.map((g) => `${g.title} (${g.severity})`).join("; ") || "none";
    const msg = `Explain the impact of the "${r.scenario_name}" scenario on our compliance. Simulation: risk ${r.risk_before} → ${r.risk_after} (${r.risk_delta >= 0 ? "+" : ""}${r.risk_delta}), added penalty exposure ${fineRange(r.additional_fine)}. New gaps: ${gaps}.`;
    setActiveNav("chat");
    void sendChat(msg);
  }

  function newAnalysis() {
    if (snapshot && !window.confirm("Start a new analysis? Current results will be cleared.")) return;
    analysisAbort.current?.abort();
    setSnapshot(null);
    setSimResult(null);
    setSimStatus("idle");
    setAnalysisStatus("idle");
    setAnalysisError(null);
    setForm((f) => ({ ...f, regulationText: "" }));
    fixCache.current.clear();
    setActiveNav("dashboard");
  }

  const stale = !!snapshot && (
    form.company.name.trim() !== snapshot.company.name ||
    form.company.sector !== snapshot.company.sector ||
    form.company.region !== snapshot.company.region ||
    parseControls(form.controlsText).join("\n") !== snapshot.controls.join("\n")
  );
  const goDashboard = () => setActiveNav("dashboard");
  const gapCount = snapshot?.result.gaps.length ?? 0;
  const comp = snapshot?.result.compliance_score;

  function renderPage() {
    switch (activeNav) {
      case "findings": return <Findings snapshot={snapshot} onFix={loadFix} onGoDashboard={goDashboard} />;
      case "workflow": return <Workflow snapshot={snapshot} status={analysisStatus} events={events} />;
      case "compliance": return <Compliance snapshot={snapshot} onFix={loadFix} onGoDashboard={goDashboard} />;
      case "chat": return <Chat messages={chat} loading={chatLoading} hasAnalysis={!!snapshot} onSend={sendChat} />;
      case "simulator":
        return (
          <Simulator snapshot={snapshot} form={simForm} setForm={setSimForm} status={simStatus} error={simError} result={simResult}
            onRun={runSimulation} onDismissError={() => { setSimError(null); setSimStatus("idle"); }}
            onFix={loadFix} onAsk={askAboutSimulation} onGoDashboard={goDashboard} />
        );
      default:
        return (
          <Dashboard form={form} setForm={setForm} onRun={runAnalysis} status={analysisStatus} error={analysisError}
            onDismissError={() => { setAnalysisError(null); setAnalysisStatus("idle"); }} snapshot={snapshot} stale={stale} />
        );
    }
  }

  const healthPill =
    health === null ? <span className="pill pill-muted">Backend: checking…</span>
    : health === "offline" ? <span className="pill pill-red" title={API_URL}>● Backend offline</span>
    : !health.llm_configured ? <span className="pill pill-yellow" title="Set GEMINI_API_KEY on the backend">● Gemini not configured</span>
    : <span className="pill pill-green" title={`${health.model} · ${health.provider}`}>● Backend online</span>;

  const navItem = (item: (typeof NAV)[number]) => (
    <div key={item.id} className={`sb-item${activeNav === item.id ? " active" : ""}`} onClick={() => setActiveNav(item.id)}>
      <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
      {item.id === "findings" && gapCount > 0 && <span className="sb-badge">{gapCount}</span>}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-mark">ComplyAI</div>
            <div className="sb-logo-sub">Compliance Intelligence</div>
          </div>
          <button className="sb-new-btn" onClick={newAnalysis}><span style={{ fontSize: 14 }}>+</span> New Analysis</button>
          <div className="sb-section">
            <div className="sb-group-label">Monitor</div>
            {NAV.slice(0, 3).map(navItem)}
          </div>
          <div className="sb-divider" />
          <div className="sb-section">
            <div className="sb-group-label">Manage</div>
            {NAV.slice(3).map(navItem)}
          </div>
          <div className="sb-footer">
            <div className="sb-footer-label">Workspace</div>
            <div className="sb-footer-org">{form.company.name.trim() || "No company set"}</div>
            <div className="sb-footer-env">API · {API_URL.replace(/^https?:\/\//, "")}</div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <span className="topbar-breadcrumb">ComplyAI ›</span>
            <span className="topbar-title">{NAV.find((n) => n.id === activeNav)?.label}</span>
            <div className="topbar-right">
              {healthPill}
              {snapshot && <span className={`pill ${gapCount ? "pill-red" : "pill-green"}`}>● {gapCount} Open Gap{gapCount === 1 ? "" : "s"}</span>}
              {comp !== undefined && <span className={`pill ${comp >= 75 ? "pill-green" : comp >= 50 ? "pill-yellow" : "pill-red"}`}>{comp}% Compliant</span>}
              <span className="pill pill-orange" style={{ cursor: "pointer" }} onClick={() => setActiveNav("simulator")}>⬢ What-If</span>
              <span className="topbar-time">{timeStr ?? ""}</span>
            </div>
          </header>
          <div className="content">{renderPage()}</div>
        </div>
      </div>

      {fix && <RemediationModal key={fix.gap.id} fix={fix} onClose={closeFix} onRetry={() => loadFix(fix.gap)} onNotify={(t, s) => addToast(t, s)} />}

      <div className="toast-container">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <div className="toast-icon" style={{ background: t.color + "18", border: `1px solid ${t.color}33`, color: t.color }}>●</div>
            <div>
              <div className="toast-title">{t.title}</div>
              <div className="toast-sub">{t.sub}</div>
            </div>
            <button className="toast-dismiss" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
