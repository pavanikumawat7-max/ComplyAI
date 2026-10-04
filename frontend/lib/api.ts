import type {
  AnalysisResult,
  ChatMessage,
  CompanyProfile,
  Gap,
  Health,
  RemediationPlan,
  SimulationResult,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const TIMEOUT_MS = 180_000; // analysis makes several sequential model calls

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const loc = Array.isArray(d?.loc) ? d.loc.filter((p: unknown) => p !== "body").join(".") : "";
        return loc ? `${loc}: ${d?.msg ?? "invalid"}` : String(d?.msg ?? "invalid");
      })
      .join("; ");
  }
  return "Unexpected error";
}

async function request<T>(path: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    } catch (e) {
      if (timedOut) throw new ApiError(0, "The request timed out. The model may be overloaded; try again.");
      if (isAbort(e)) throw e;
      throw new ApiError(0, `Cannot reach the backend at ${API_URL}. Is it running, and is CORS_ORIGINS set for this origin?`);
    }
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        msg = detailToMessage((await res.json()).detail);
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, msg);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, signal);
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/health", { method: "GET" }, signal),

  analyze: (
    body: { company: CompanyProfile; controls: string[]; regulation_text: string },
    signal?: AbortSignal,
  ) => post<AnalysisResult>("/api/analyze", body, signal),

  remediation: (body: { company: CompanyProfile; controls: string[]; gap: Gap }, signal?: AbortSignal) =>
    post<RemediationPlan>("/api/remediation", body, signal),

  simulate: (
    body: {
      company: CompanyProfile;
      controls: string[];
      scenario_name: string;
      regulation_text: string;
      baseline_gaps: Gap[];
    },
    signal?: AbortSignal,
  ) => post<SimulationResult>("/api/simulate", body, signal),

  chat: (
    body: {
      messages: ChatMessage[];
      context: { company?: CompanyProfile; gaps: Gap[]; risk_score?: number; compliance_score?: number };
    },
    signal?: AbortSignal,
  ) => post<{ reply: string }>("/api/chat", body, signal),
};
