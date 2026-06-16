/**
 * farmaze-agent API client (Phase G).
 *
 * Replaces the old OpenAI + MCP client architecture with direct HTTP calls
 * to the farmaze-agent service (Claude-powered Procurement + Insights agents).
 */
import { agentAxios } from './agentAxios';

// ── Request types ────────────────────────────────────────────

export interface AgentChatRequest {
  message: string;
  channel?: string;
  client_id: string;
  client_name: string;
  conversation_history?: { role: string; content: string }[];
}

export interface AgentInsightRequest {
  client_id: string;
  client_name: string;
  tab_type: 'overview' | 'spend' | 'volume';
  time_period: string;
  analytics_data: Record<string, unknown>;
}

// ── Response types ───────────────────────────────────────────

export interface AgentChatResponse {
  status: string;
  response: string;
  route: 'order' | 'question';
  iterations: number;
  error: string;
}

export interface SmartInsight {
  type: 'positive' | 'warning' | 'negative';
  title: string;
  description: string;
  metric?: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence?: number;
}

export interface AgentInsightResponse {
  status: string;
  insights: SmartInsight[];
  error: string;
}

// ── Streaming types ─────────────────────────────────────────

export interface AgentStreamEvent {
  type: 'thinking' | 'tool_start' | 'tool_end' | 'response' | 'done' | 'error';
  message: string;
  tool?: string;
  route?: string;
}

// ── API calls ────────────────────────────────────────────────

/** Send a chat message to the unified agent endpoint (auto-routes order vs question) */
export const agentChat = (req: AgentChatRequest) =>
  agentAxios.post<AgentChatResponse>('/chat', {
    ...req,
    channel: req.channel || 'dashboard',
  });

/**
 * Stream a chat message via SSE — emits tool_start/tool_end/response/done events.
 * Uses fetch + ReadableStream (not EventSource) since we need POST body.
 * Returns a cleanup function to abort the stream.
 */
export function agentChatStream(
  req: AgentChatRequest,
  onEvent: (event: AgentStreamEvent) => void,
  onError: (error: Error) => void,
): () => void {
  const controller = new AbortController();
  const baseUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090';

  const token = localStorage.getItem('farmaze_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`${baseUrl}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...req, channel: req.channel || 'dashboard' }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const parsed = JSON.parse(trimmed.slice(6)) as AgentStreamEvent;
            onEvent(parsed);
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6)) as AgentStreamEvent;
          onEvent(parsed);
        } catch {
          // Ignore
        }
      }
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    });

  return () => controller.abort();
}

/** Generate structured insights from dashboard analytics data */
export const agentGenerateInsights = (req: AgentInsightRequest) =>
  agentAxios.post<AgentInsightResponse>('/insights/generate', req);

/** Health check */
export const agentHealth = () =>
  agentAxios.get('/health');

// ── Onboarding invoice parser ─────────────────────────────────────────────

export interface OnboardParseEvent {
  type: 'status' | 'progress' | 'extracted' | 'warning' | 'done' | 'error';
  message: string;
  current?: number;
  total?: number;
  filename?: string;
  vendor?: string;
  branch?: string;
  date?: string;
  item_count?: number;
  result?: OnboardParseResult;
}

export interface ParsedVendor {
  name: string;
  branches: string[];
  invoice_count: number;
  total_spend: number;
  product_count: number;
  products: Array<{
    name: string;
    unit: string;
    avg_qty: number;
    frequency: number;
    rate: number;
  }>;
}

export interface RuleOverride {
  days: boolean[];
  per_day: string;
  channel: string;
  cutoff: string;
}

export interface OnboardParseResult {
  vendors: ParsedVendor[];
  branches: string[];
  total_invoices: number;
  date_range: { from: string | null; to: string | null };
  rule_overrides?: Record<string, RuleOverride>;
  branch_mapping?: Record<string, string>; // session branch name → DB branch_id
}

/**
 * Stream invoice parsing progress from a Google Drive folder.
 * Returns a cleanup function to abort the stream.
 */
export function onboardParseStream(
  driveLink: string,
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
  onEvent: (event: OnboardParseEvent) => void,
  onError: (error: Error) => void,
  sessionId?: string | null,
): () => void {
  const controller = new AbortController();
  const baseUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090';
  const token = localStorage.getItem('farmaze_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`${baseUrl}/onboard/parse/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      drive_link: driveLink,
      client_id: clientId,
      date_from: dateFrom ?? undefined,
      date_to: dateTo ?? undefined,
      session_id: sessionId ?? undefined,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Parse stream failed: ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            onEvent(JSON.parse(trimmed.slice(6)) as OnboardParseEvent);
          } catch { /* ignore malformed lines */ }
        }
      }
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') onError(err);
    });

  return () => controller.abort();
}

// ── Onboarding session (persistence + step audit) ─────────────────────────

export interface OnboardSession {
  id: string;
  client_id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  result: OnboardParseResult | null;
  error_msg: string | null;
  current_step: string | null;
  created_at: string;
  updated_at: string;
}

/** Return the most recent onboarding session for a client (null if none). */
export const getOnboardSession = (clientId: string) =>
  agentAxios.get<{ session: OnboardSession | null }>(`/onboard/session/${clientId}`);

/** Rename a branch in the persisted session result (updates DB in-place). */
export const renameBranchInSession = (
  clientId: string,
  sessionId: string,
  oldName: string,
  newName: string,
) =>
  agentAxios.post(`/onboard/session/${clientId}/rename-branch`, {
    session_id: sessionId,
    old_name: oldName,
    new_name: newName,
  });

/** Update (or create) a rule override for a vendor+branch pair in the session. */
export const updateRuleInSession = (
  clientId: string,
  sessionId: string,
  rule: { vendor: string; branch: string; days: boolean[]; per_day: string; channel: string; cutoff: string },
) =>
  agentAxios.post(`/onboard/session/${clientId}/update-rule`, { session_id: sessionId, ...rule });

/** Add or update a product in a vendor's catalogue in the session. */
export const upsertProductInSession = (
  clientId: string,
  sessionId: string,
  product: { vendor: string; original_name: string; name: string; unit: string; rate: number },
) =>
  agentAxios.post(`/onboard/session/${clientId}/update-product`, { session_id: sessionId, ...product });

/** Remove a product from a vendor's catalogue in the session. */
export const deleteProductInSession = (
  clientId: string,
  sessionId: string,
  vendor: string,
  name: string,
) =>
  agentAxios.post(`/onboard/session/${clientId}/delete-product`, { session_id: sessionId, vendor, name });

/** Save session-branch-name → DB-branch-id mapping to the session. */
export const updateBranchMapping = (
  clientId: string,
  sessionId: string,
  mapping: Record<string, string>,
) =>
  agentAxios.post(`/onboard/session/${clientId}/update-branch-mapping`, {
    session_id: sessionId,
    mapping,
  });

/** Log a wizard step advance for audit and analytics. */
export const saveOnboardStep = (
  clientId: string,
  step: string,
  event: string,
  sessionId?: string | null,
  data?: Record<string, unknown>,
) =>
  agentAxios.post(`/onboard/session/${clientId}/step`, {
    step,
    event,
    session_id: sessionId ?? null,
    data,
  });

/**
 * Stream invoice parsing from directly uploaded files (PDF, images, screenshots, or ZIP).
 * Returns a cleanup function to abort the stream.
 */
export function onboardUploadStream(
  files: File[],
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
  onEvent: (event: OnboardParseEvent) => void,
  onError: (error: Error) => void,
  sessionId?: string | null,
): () => void {
  const controller = new AbortController();
  const baseUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090';
  const token = localStorage.getItem('farmaze_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('client_id', clientId);
  if (dateFrom) formData.append('date_from', dateFrom);
  if (dateTo) formData.append('date_to', dateTo);
  if (sessionId) formData.append('session_id', sessionId);

  fetch(`${baseUrl}/onboard/upload/stream`, {
    method: 'POST',
    headers,
    body: formData,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Upload stream failed: ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            onEvent(JSON.parse(trimmed.slice(6)) as OnboardParseEvent);
          } catch { /* ignore malformed lines */ }
        }
      }
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') onError(err);
    });

  return () => controller.abort();
}
