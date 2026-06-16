/**
 * onboardingApi — Client for the W2.1 backend onboarding + supplier endpoints.
 *
 * Backed by:
 *   GET  /api/v1/users/me/onboarding
 *   PATCH /api/v1/users/me/onboarding
 *   POST /api/v1/b2bclients/my/suppliers   (product/vendor import gap closer)
 *
 * All endpoints require a JWT in the Authorization header.
 */
import axios, { AxiosError } from "axios";
import { API__BASE_URL } from "./url_config";

const backendApi = axios.create({
  baseURL: API__BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("farmaze_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface OnboardingStatus {
  step: OnboardingStep;
  horeca_type: string | null;
  profile_summary: {
    company_name?: string;
    contact_name?: string;
    email?: string;
    phone_number?: string;
  };
  branch_count: number;
}

export interface PatchOnboardingPayload {
  step: OnboardingStep;
  patch: Record<string, unknown>;
}

export interface PatchOnboardingResponse {
  step: OnboardingStep;
  horeca_type: string | null;
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  categories: string[];
  notes?: string;
}

export interface CreateSupplierResponse {
  supplier_id: string;
  name: string;
  categories: string[];
}

// ─── Handlers ──────────────────────────────────────────────────────────────

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await backendApi.get<OnboardingStatus>("/api/v1/users/me/onboarding");
  return res.data;
}

export async function patchOnboarding(
  payload: PatchOnboardingPayload
): Promise<PatchOnboardingResponse> {
  const res = await backendApi.patch<PatchOnboardingResponse>(
    "/api/v1/users/me/onboarding",
    payload
  );
  return res.data;
}

export async function createMySupplier(
  payload: CreateSupplierPayload
): Promise<CreateSupplierResponse> {
  const res = await backendApi.post<CreateSupplierResponse>(
    "/api/v1/b2bclients/my/suppliers",
    payload
  );
  return res.data;
}

// ─── Error helpers ─────────────────────────────────────────────────────────

export function isAxiosError(err: unknown): err is AxiosError<{ error?: string }> {
  return axios.isAxiosError(err);
}

export function extractErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error;
    }
    if (err.response?.statusText) return err.response.statusText;
  }
  return fallback;
}
