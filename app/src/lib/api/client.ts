const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// ============================================================
// snake_case → camelCase deep transform
// ============================================================

function snakeToCamelStr(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Recursively converts all object keys from snake_case to camelCase.
 * Leaves primitives, arrays, and Date values untouched (just recurses into arrays).
 */
function toCamel(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      out[snakeToCamelStr(key)] = toCamel(val);
    }
    return out;
  }
  return obj;
}

// Fields that represent lamport/token amounts and should be parsed as BigInt
const BIGINT_FIELDS = new Set([
  'totalTipsReceived',
  'totalAmountReceivedLamports',
  'totalAmountReceivedSpl',
  'minTipAmount',
  'balance',
  'totalDeposited',
  'totalWithdrawn',
  'targetAmount',
  'currentAmount',
  'amountPerInterval',
  'totalPaid',
  'amountLamports',
  'totalAmount',
  'goalId',
]);

/**
 * Convert numeric-string fields to BigInt where the frontend expects it.
 */
function parseBigInts(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(parseBigInts);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (BIGINT_FIELDS.has(key) && typeof val === 'string' && /^\d+$/.test(val)) {
        out[key] = BigInt(val);
      } else {
        out[key] = parseBigInts(val);
      }
    }
    return out;
  }
  return obj;
}

/**
 * Full response transform: snake_case → camelCase + BigInt parsing.
 */
function transformResponse<T>(data: unknown): T {
  return parseBigInts(toCamel(data)) as T;
}

// ============================================================
// Wallet Auth Token
// ============================================================

/**
 * Set the wallet auth token for authenticated requests.
 * Called by useWalletAuth hook after signing.
 * Format: `<base58_signature>.<base58_pubkey>.<timestamp>`
 */
let _walletAuthToken: string | null = null;

export function setWalletAuthToken(token: string | null) {
  _walletAuthToken = token;
  if (token) {
    localStorage.setItem('soltip_token', token);
  } else {
    localStorage.removeItem('soltip_token');
  }
}

export function getWalletAuthToken(): string | null {
  return _walletAuthToken || localStorage.getItem('soltip_token');
}

// ============================================================
// Core HTTP client
// ============================================================

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip the snake→camel transform (for POST responses that are just confirmations) */
  raw?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, raw } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const search = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        search.set(key, String(val));
      }
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getWalletAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  const json = await res.json();
  return raw ? json : transformResponse<T>(json);
}

// ============================================================
// Profile endpoints
// ============================================================
export const profileApi = {
  getProfile: (address: string) =>
    request<any>(`/profiles/${address}`),

  listProfiles: (params?: {
    search?: string;
    sort_by?: string;
    sort_order?: string;
    only_verified?: boolean;
    page?: number;
    page_size?: number;
  }) => request<any>('/profiles', { params: params as any }),

  createProfile: (data: {
    owner_address: string;
    username: string;
    display_name: string;
    description: string;
    image_url: string;
  }) => request<any>('/profiles', { method: 'POST', body: data }),

  updateProfile: (address: string, data: {
    display_name?: string;
    description?: string;
    image_url?: string;
    min_tip_amount?: number;
    withdrawal_fee_bps?: number;
    accept_anonymous?: boolean;
    preset_amounts?: number[];
    social_links?: string;
    webhook_url?: string;
  }) => request<any>(`/profiles/${address}`, { method: 'PUT', body: data }),

  getLeaderboard: (address: string) =>
    request<any>(`/profiles/${address}/leaderboard`),
};

// ============================================================
// Vault endpoints
// ============================================================
export const vaultApi = {
  getVault: (profilePda: string) =>
    request<any>(`/vault/${profilePda}`),

  initialize: (data: { owner_address: string; vault_pda: string; profile_pda: string; tx_signature: string }) =>
    request<any>('/vault/initialize', { method: 'POST', body: data, raw: true }),

  recordWithdrawal: (data: { owner_address: string; amount: number; tx_signature: string }) =>
    request<any>('/vault/withdraw', { method: 'POST', body: data, raw: true }),
};

// ============================================================
// Tips endpoints
// ============================================================
export const tipsApi = {
  recordTip: (data: {
    tx_signature: string;
    tipper_address: string;
    recipient_address: string;
    amount_lamports: number;
    message?: string;
    is_anonymous?: boolean;
  }) => request<any>('/tips', { method: 'POST', body: data, raw: true }),

  recordTipSpl: (data: {
    tx_signature: string;
    tipper_address: string;
    recipient_address: string;
    token_mint: string;
    amount: number;
    message?: string;
    is_anonymous?: boolean;
  }) => request<any>('/tips/spl', { method: 'POST', body: data, raw: true }),

  recordTipSplit: (data: {
    tx_signature: string;
    tipper_address: string;
    recipient_address: string;
    amount_lamports: number;
    message?: string;
  }) => request<any>('/tips/split', { method: 'POST', body: data, raw: true }),

  getHistory: (address: string, params?: { page?: number; page_size?: number }) =>
    request<any>(`/tips/history/${address}`, { params: params as any }),
};

// ============================================================
// Goals endpoints
// ============================================================
export const goalsApi = {
  listGoals: (profilePda: string) =>
    request<any>(`/goals/${profilePda}`),

  createGoal: (data: {
    owner_address: string;
    goal_id: number;
    title: string;
    description: string;
    target_amount: number;
    token_mint: string;
    deadline?: number;
  }) => request<any>('/goals', { method: 'POST', body: data }),

  contribute: (goalPda: string, data: {
    contributor_address: string;
    amount_lamports: number;
    message?: string;
    tx_signature: string;
  }) => request<any>(`/goals/${goalPda}/contribute`, { method: 'POST', body: data, raw: true }),

  closeGoal: (goalPda: string) =>
    request<any>(`/goals/${goalPda}`, { method: 'DELETE', raw: true }),
};

// ============================================================
// Subscriptions endpoints
// ============================================================
export const subscriptionsApi = {
  create: (data: {
    subscriber_address: string;
    recipient_address: string;
    amount_per_interval: number;
    interval_seconds: number;
    is_spl: boolean;
    token_mint: string;
    tx_signature: string;
  }) => request<any>('/subscriptions', { method: 'POST', body: data }),

  getBySubscriber: (address: string) =>
    request<any>(`/subscriptions/subscriber/${address}`),

  cancel: (subscriptionPda: string) =>
    request<any>(`/subscriptions/${subscriptionPda}`, { method: 'DELETE', raw: true }),
};

// ============================================================
// Splits endpoints
// ============================================================
export const splitsApi = {
  getSplit: (profilePda: string) =>
    request<any>(`/splits/${profilePda}`),

  configure: (data: {
    owner_address: string;
    recipients: { wallet: string; share_bps: number; label: string }[];
  }) => request<any>('/splits', { method: 'POST', body: data, raw: true }),
};

// ============================================================
// Admin endpoints
// ============================================================
export const adminApi = {
  getPlatformConfig: () =>
    request<any>('/admin/config'),

  pause: (data: { authority_address: string; paused: boolean }) =>
    request<any>('/admin/pause', { method: 'POST', body: data, raw: true }),

  verifyCreator: (data: { authority_address: string; creator_address: string; verified: boolean }) =>
    request<any>('/admin/verify', { method: 'POST', body: data, raw: true }),
};

// ============================================================
// Polls endpoints (v3)
// ============================================================
export const pollsApi = {
  list: (profilePda: string, activeOnly = true) =>
    request<any>(`/polls/${profilePda}`, { params: { active_only: activeOnly } }),

  create: (data: {
    poll_id: number;
    title: string;
    description?: string;
    options: string[];
    deadline?: number;
  }) => request<any>('/polls', { method: 'POST', body: data }),

  vote: (pollPda: string, data: {
    option_index: number;
    amount?: number;
    tx_signature?: string;
  }) => request<any>(`/polls/${pollPda}/vote`, { method: 'POST', body: data, raw: true }),

  close: (pollPda: string) =>
    request<any>(`/polls/${pollPda}/close`, { method: 'DELETE', raw: true }),
};

// ============================================================
// Content Gates endpoints (v3)
// ============================================================
export const contentGatesApi = {
  list: (profilePda: string, activeOnly = true) =>
    request<any>(`/content-gates/${profilePda}`, { params: { active_only: activeOnly } }),

  create: (data: {
    gate_id: number;
    title: string;
    content_url: string;
    required_amount: number;
  }) => request<any>('/content-gates', { method: 'POST', body: data }),

  verify: (gatePda: string) =>
    request<any>(`/content-gates/${gatePda}/verify`, { method: 'POST', raw: true }),

  close: (gatePda: string) =>
    request<any>(`/content-gates/${gatePda}/close`, { method: 'DELETE', raw: true }),
};

// ============================================================
// Referrals endpoints (v3)
// ============================================================
export const referralsApi = {
  register: (data: {
    referee_profile_pda: string;
    fee_share_bps?: number;
  }) => request<any>('/referrals', { method: 'POST', body: data }),

  getByReferrer: (address: string) =>
    request<any>(`/referrals/referrer/${address}`),

  getByProfile: (profilePda: string) =>
    request<any>(`/referrals/profile/${profilePda}`),
};

// ============================================================
// Analytics endpoints (v3)
// ============================================================
export const analyticsApi = {
  getAnalytics: (profilePda: string, days = 30) =>
    request<any>(`/analytics/${profilePda}`, { params: { days } }),

  getWindowLeaderboard: (profilePda: string, window: 'weekly' | 'monthly' | 'yearly') =>
    request<any>(`/leaderboard/${profilePda}/${window}`),

  getSolPrice: () =>
    request<{ token: string; priceUsd: number; updatedAt: number }>('/price/sol'),
};

// ============================================================
// Widget & Overlay endpoints (v3)
// ============================================================
export const widgetApi = {
  getConfig: (username: string) =>
    request<any>(`/widget/${username}`),

  getOverlay: (username: string) =>
    request<any>(`/overlay/${username}`),

  exportTips: (profilePda: string) =>
    `${API_BASE}/export/${profilePda}/tips`,
};

// ============================================================
// Health
// ============================================================
export const healthApi = {
  check: () => request<{ status: string; service: string; version: string }>('/health'),
};
