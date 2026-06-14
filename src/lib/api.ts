/**
 * Typed API client for the QOC Accreditation Portal backend.
 * Base URL is read from NEXT_PUBLIC_API_URL (defaults to http://localhost:5000).
 */

import { toast } from "sonner";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const V1   = `${BASE}/api/v1`;

/**
 * Resolve a stored file URL to something the browser can open.
 * Local-disk storage returns root-relative paths like "/uploads/x.jpeg" which
 * would resolve against the frontend origin (404). Prepend the API origin so
 * the backend's static-file middleware serves them. Absolute / data URLs pass through.
 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Surface an API/network error as a toast popup (no-op during SSR). */
function notifyApiError(message: string) {
  if (typeof window === "undefined") return;
  toast.error(message);
}

function synthError<T>(message: string, statusCode: number): ApiResponse<T> {
  return { success: false, message, data: null, errors: [], statusCode };
}

// ── Shared response wrapper ────────────────────────────────────────────────
export interface ApiResponse<T> {
  success:    boolean;
  message:    string;
  data:       T | null;
  errors:     string[];
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items:           T[];
  totalCount:      number;
  pageNumber:      number;
  pageSize:        number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

// ── Token storage helpers ──────────────────────────────────────────────────
const STORAGE_KEY = "qoc_tokens";

export interface StoredTokens {
  accessToken:  string;
  refreshToken: string;
}

export function saveTokens(t: StoredTokens) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  // Write access token as cookie so Next.js middleware can verify it server-side
  const maxAge = 60 * 60 * 24 * 30; // 30 days (refresh token handles renewal)
  document.cookie = `access_token=${t.accessToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function clearAccessTokenCookie() {
  if (typeof window !== "undefined")
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Strict";
}

export function loadTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  clearAccessTokenCookie();
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────
async function request<T>(
  url:     string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const tokens = loadTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (tokens?.accessToken)
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    const msg = "Network error — please check your connection and try again.";
    notifyApiError(msg);
    return synthError<T>(msg, 0);
  }

  // 401 → attempt token refresh once
  if (res.status === 401 && tokens?.refreshToken) {
    const refreshed = await attemptRefresh(tokens.refreshToken);
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed}`;
      try {
        res = await fetch(url, { ...options, headers });
      } catch {
        const msg = "Network error — please try again.";
        notifyApiError(msg);
        return synthError<T>(msg, 0);
      }
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      // Redirecting — don't toast (a flash before navigation looks broken).
      return synthError<T>("Your session has expired. Please sign in again.", 401);
    }
  }

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch {
    const msg = res.ok ? "Unexpected response from the server." : `Request failed (${res.status}).`;
    notifyApiError(msg);
    return synthError<T>(msg, res.status);
  }

  // Any unsuccessful API response surfaces as a popup automatically.
  if (data && data.success === false) {
    notifyApiError(data.message || data.errors?.[0] || "Something went wrong. Please try again.");
  }

  return data;
}

async function attemptRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${V1}/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data: ApiResponse<{ accessToken: string; refreshToken: string; userInfo: UserInfo }> = await res.json();
    if (data.success && data.data) {
      saveTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface UserInfo {
  id:          string;
  userName:    string;
  firstName:   string;
  lastName:    string;
  email:       string;
  role:        string;   // role code e.g. "SUPER_ADMIN"
  roleId:      string;
  roleCode:    string;
  permissions: string[];
}

export interface TokenResponse {
  accessToken:  string;
  refreshToken: string;
  userInfo:     UserInfo;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<TokenResponse>(`${V1}/auth/login`, {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    }),

  logout: (refreshToken: string) =>
    request<boolean>(`${V1}/auth/logout`, {
      method: "POST",
      body:   JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    request<boolean>(`${V1}/auth/forgot-password`, {
      method: "POST",
      body:   JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<boolean>(`${V1}/auth/reset-password`, {
      method: "POST",
      body:   JSON.stringify({ token, password }),
    }),
};

// ── Events ──────────────────────────────────────────────────────────────────
export interface EventDto {
  id:             string;
  name:           string;
  description?:   string;
  startDate:      string;
  endDate:        string;
  venue:          string;
  location?:      string;
  status:         string;
  moiRequired:    boolean;
  eventCode:      string;
  theme?:         string;
  coverImageUrl?: string;
  accreditations: number;
  createdAt:      string;
}

export const eventsApi = {
  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<EventDto>>(`${V1}/events?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  get: (id: string) =>
    request<EventDto>(`${V1}/events/${id}`),

  create: (body: Partial<EventDto>) =>
    request<EventDto>(`${V1}/events`, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<EventDto>) =>
    request<EventDto>(`${V1}/events/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<boolean>(`${V1}/events/${id}`, { method: "DELETE" }),
};

// ── Accreditation Requests ──────────────────────────────────────────────────
export interface RequestDto {
  id:              string;
  accreditationId: string;
  eventId:         string;
  eventName:       string;
  requestorId:     string;
  requestorName:   string;
  role:            string;
  firstName:       string;
  lastName:        string;
  fullName:        string;
  nationality:     string;
  dateOfBirth:     string;
  passportNumber:  string;
  email:           string;
  phone?:          string;
  organization?:   string;
  position?:       string;
  assignedVenue?:  string;
  zoneAccess?:     string;
  currentStage:    number;
  isRejected:      boolean;
  isInfoRequested: boolean;
  infoRequestNote?: string;
  rejectionReason?: string;
  status:          string;
  documents:       DocumentDto[];
  reviews:         ReviewDto[];
  pass?:           PassSummaryDto;
  createdAt:       string;
  updatedAt?:      string;
}

export interface DocumentDto {
  id:            string;
  fileName:      string;
  blobUrl:       string;
  type:          string;
  fileSizeBytes: number;
  createdAt:     string;
}

export interface ReviewDto {
  id:           string;
  stage:        number;
  decision:     string;
  notes?:       string;
  reviewerName: string;
  reviewedAt:   string;
}

export interface PassSummaryDto {
  id:        string;
  passNumber: string;
  isRevoked: boolean;
  validFrom: string;
  validTo:   string;
}

export const requestsApi = {
  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<RequestDto>>(`${V1}/requests?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  mine: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<RequestDto>>(`${V1}/requests/my?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  get: (id: string) =>
    request<RequestDto>(`${V1}/requests/${id}`),

  create: (body: object) =>
    request<RequestDto>(`${V1}/requests`, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: object) =>
    request<RequestDto>(`${V1}/requests/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  uploadDocument: (id: string, body: object) =>
    request<DocumentDto>(`${V1}/requests/${id}/documents`, { method: "POST", body: JSON.stringify(body) }),
};

// ── Pipeline ────────────────────────────────────────────────────────────────
export interface QueueItemDto {
  requestId:       string;
  accreditationId: string;
  applicantName:   string;
  role:            string;
  eventName:       string;
  stage:           number;
  status:          string;
  submittedAt:     string;
}

export const pipelineApi = {
  queue: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<QueueItemDto>>(`${V1}/pipeline/queue?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  review: (body: { requestId: string; decision: string; notes?: string; zoneAccess?: string; assignedVenue?: string }) =>
    request<RequestDto>(`${V1}/pipeline/review`, { method: "POST", body: JSON.stringify(body) }),

  respondInfo: (body: { requestId: string; responseNote: string }) =>
    request<RequestDto>(`${V1}/pipeline/respond-info`, { method: "POST", body: JSON.stringify(body) }),
};

// ── Passes ──────────────────────────────────────────────────────────────────
export interface PassDto {
  id:             string;
  passNumber:     string;
  qrPayload:      string;
  zoneAccess:     string;
  venueName:      string;
  validFrom:      string;
  validTo:        string;
  issuedAt:       string;
  isRevoked:      boolean;
  revokedReason?: string;
  applicantName:  string;
  role:           string;
  eventName:      string;
  nationality:    string;
  passportNumber: string;
  invitedByName?: string;
  invitedByEmail?: string;
}

export const passesApi = {
  mine: () =>
    request<PassDto[]>(`${V1}/passes/my`),

  get: (id: string) =>
    request<PassDto>(`${V1}/passes/${id}`),

  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<PassDto>>(`${V1}/passes?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  revoke: (id: string, reason: string) =>
    request<boolean>(`${V1}/passes/${id}/revoke`, { method: "POST", body: JSON.stringify({ reason }) }),
};

// ── Invitations ─────────────────────────────────────────────────────────────
export interface InvitationDto {
  id:              string;
  email:           string;
  eventName?:      string;
  eventId?:        string;
  suggestedRole?:  string;
  status:          string;
  sentByName:      string;
  expiresAt:       string;
  acceptedAt?:     string;
  personalMessage?: string;
  createdAt:       string;
  inviteLink:      string;
}

export const invitationsApi = {
  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<InvitationDto>>(`${V1}/invitations?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  send: (body: object) =>
    request<InvitationDto>(`${V1}/invitations`, { method: "POST", body: JSON.stringify(body) }),

  byToken: (token: string) =>
    request<InvitationDto>(`${V1}/invitations/accept/${token}`),

  accept: (token: string, password: string, firstName: string, lastName: string) =>
    request<boolean>(`${V1}/invitations/accept`, { method: "POST", body: JSON.stringify({ token, password, firstName, lastName }) }),

  revoke: (id: string) =>
    request<boolean>(`${V1}/invitations/${id}`, { method: "DELETE" }),
};

// ── Users ────────────────────────────────────────────────────────────────────
export interface UserDto {
  id:         string;
  firstName:  string;
  lastName:   string;
  fullName:   string;
  email:      string;
  phone?:     string;
  role:       string | null;
  roleName:   string | null;
  isActive:   boolean;
  createdAt:  string;
}

export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<UserDto>>(`${V1}/users?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  get: (id: string) =>
    request<UserDto>(`${V1}/users/${id}`),

  create: (body: object) =>
    request<UserDto>(`${V1}/users`, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: object) =>
    request<UserDto>(`${V1}/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<boolean>(`${V1}/users/${id}`, { method: "DELETE" }),
};

// ── Venues ───────────────────────────────────────────────────────────────────
export interface VenueZoneDto {
  id?:          string;
  label:        string;
  description?: string;
  color:        string;
  x:            number;
  y:            number;
  width:        number;
  height:       number;
}

export interface VenueDto {
  id:           string;
  name:         string;
  description?: string;
  location?:    string;
  createdAt:    string;
  zones:        VenueZoneDto[];
}

export interface SaveVenuePayload {
  name:         string;
  description?: string;
  location?:    string;
  zones:        Omit<VenueZoneDto, "id">[];
}

export const venuesApi = {
  list: () =>
    request<VenueDto[]>(`${V1}/venues`),

  get: (id: string) =>
    request<VenueDto>(`${V1}/venues/${id}`),

  create: (body: SaveVenuePayload) =>
    request<VenueDto>(`${V1}/venues`, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: SaveVenuePayload) =>
    request<VenueDto>(`${V1}/venues/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<boolean>(`${V1}/venues/${id}`, { method: "DELETE" }),
};

// ── Roles ────────────────────────────────────────────────────────────────────
export interface RoleDto {
  id:           string;
  name:         string;
  code:         string;
  description?: string;
  userCount?:   number;
}

export const rolesApi = {
  list: () => request<RoleDto[]>(`${V1}/roles`),
};

// ── Bulk Upload ──────────────────────────────────────────────────────────────
export interface BulkUploadRow {
  rowNumber:     number;
  firstName:     string;
  lastName:      string;
  email:         string;
  nationality:   string;
  passportNo:    string;
  dateOfBirth:   string;
  role:          string;
  phone?:        string | null;
  organization?: string | null;
  venue?:        string | null;
  isValid:       boolean;
  error?:        string | null;
}

export interface BulkUploadPreviewResponse {
  totalRows:   number;
  validRows:   number;
  invalidRows: number;
  rows:        BulkUploadRow[];
}

export interface BulkUploadProcessResponse {
  created: number;
  skipped: number;
  errors:  string[];
}

export const bulkUploadApi = {
  preview: (base64Content: string, eventId: string) =>
    request<BulkUploadPreviewResponse>(`${V1}/bulk-upload/preview`, {
      method: "POST",
      body:   JSON.stringify({ base64Content, eventId }),
    }),

  process: (eventId: string, rows: BulkUploadRow[]) =>
    request<BulkUploadProcessResponse>(`${V1}/bulk-upload/process`, {
      method: "POST",
      body:   JSON.stringify({ eventId, rows }),
    }),
};

// ── Notifications ────────────────────────────────────────────────────────────
export interface NotificationDto {
  id:          string;
  title:       string;
  message?:    string;
  type?:       string;
  read?:       boolean;
  createdAt?:  string;
  redirectUrl?: string;
}

export const notificationsApi = {
  list: (params?: Record<string, string | number>) =>
    request<PaginatedResponse<NotificationDto>>(`${V1}/notifications?${new URLSearchParams(params as Record<string, string> ?? {})}`),

  count: () =>
    request<number>(`${V1}/notifications/count`),

  markAllRead: () =>
    request<boolean>(`${V1}/notifications/mark-all-read`, { method: "PUT" }),

  markRead: (id: string) =>
    request<boolean>(`${V1}/notifications/${id}/mark-read`, { method: "PUT" }),
};

// ── Pass Access (email link landing) ────────────────────────────────────────
export interface PassAccessCheckDto {
  email:           string;
  holderName:      string;
  eventName:       string;
  accreditationId: string;
  hasAccount:      boolean;
}

export type PassStatus = "Valid" | "Expired" | "NotYetValid" | "Revoked";

export interface PassVerifyDto {
  holderName:      string;
  role:            string;
  eventName:       string;
  venueName:       string;
  zoneAccess:      string;
  accreditationId: string;
  passNumber:      string;
  nationality:     string;
  validFrom:       string;
  validTo:         string;
  issuedAt:        string;
  status:          PassStatus;
  isRevoked:       boolean;
  revokedReason?:  string;
}

/** Public URL encoded into a pass's QR code. Scanning it opens the verify page. */
export function passVerifyUrl(passId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify/${passId}`;
}

export const passAccessApi = {
  /** Validate the one-time token from the approval email. */
  check: (token: string) =>
    request<PassAccessCheckDto>(`${V1}/pass-access/check?token=${encodeURIComponent(token)}`),

  /** First-time registration using the email locked to the approved request. */
  activate: (token: string, firstName: string, lastName: string, password: string) =>
    request<boolean>(`${V1}/pass-access/activate`, {
      method: "POST",
      body:   JSON.stringify({ token, firstName, lastName, password }),
    }),

  /** Public pass verification by pass id (powers the QR-code landing page). */
  verify: (id: string) =>
    request<PassVerifyDto>(`${V1}/pass-access/verify/${id}`),
};

