import { useEffect, useRef, useState } from "react";

export interface ChatItem { role: "user" | "assistant"; content: string; error?: boolean }

const SUGGESTIONS = [
  "Are we compliant with the regulation we analyzed?",
  "What's our biggest compliance risk right now?",
  "Generate a summary for the board",
];

interface Props { messages: ChatItem[]; loading: boolean; hasAnalysis: boolean; onSend: (text: string) => void }

export default function Chat({ messages, loading, hasAnalysis, onSend }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="fade-in">
      <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="panel-header">
          <span className="panel-dot" style={{ background: "var(--orange)", boxShadow: "0 0 5px var(--orange)" }} />
          <span className="panel-title">Ask ComplyAI</span>
          <span className="panel-sub">{hasAnalysis ? "Gemini · grounded in your latest analysis" : "Gemini · no analysis run yet"}</span>
        </div>
        <div className="chat-body">
          <div className="chat-messages">
            <div className="chat-msg ai">
              <div className="msg-label">ComplyAI</div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {hasAnalysis
                  ? "Ask me about your latest analysis: gaps, risk, priorities, or how to explain them. I only know what is in that analysis and general compliance knowledge, not live deadlines."
                  : "Run an analysis first so I can answer questions about your gaps and risk. I can still answer general compliance questions."}
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.error ? "err" : m.role === "user" ? "user" : "ai"}`}>
                {m.role === "assistant" && !m.error && <div className="msg-label">ComplyAI</div>}
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg ai">
                <div className="msg-label">ComplyAI</div>
                <div className="ai-typing" style={{ padding: 0 }}>
                  <div className="blink-dot" /><div className="blink-dot" /><div className="blink-dot" />
                  <span>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--border)" }}>
            {SUGGESTIONS.map((s) => <button key={s} className="chat-suggestion" disabled={loading} onClick={() => submit(s)}>{s}</button>)}
          </div>
          <div className="chat-input-row">
            <input className="chat-input" maxLength={4000} placeholder="Ask about your findings, risk, or remediation…" value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit(input)} />
            <button className="chat-send" disabled={loading || !input.trim()} onClick={() => submit(input)}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
