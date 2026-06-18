const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("quantra_token");
  }
  return null;
}

export function setAuthToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("quantra_token", token);
    } else {
      localStorage.removeItem("quantra_token");
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = "Request failed";
    try {
      const data = await response.json();
      errMsg = data.error || data.detail || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

// ========================================== TYPES ==========================================

export interface TickerItem {
  sym: string;
  price: number;
  chg_pct: number;
  up: boolean;
}

export interface TickerStripResponse {
  items: TickerItem[];
  asof: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  prev_close: number;
  market_cap: number;
  currency: string;
  fundamentals?: {
    pe_ttm: number;
    fwd_pe: number;
    peg_ratio: number;
    ev_ebitda: number;
    gross_margin: number;
    op_margin: number;
    roe: number;
    debt_ebitda: number;
    rev_growth: number;
    eps_growth: number;
    fcf_yield: number;
    beta: number;
    analyst_rating: string;
    analyst_score: number;
    analyst_count: number;
    target_low: number;
    target_mean: number;
    target_high: number;
  };
}

export interface MlopsModel {
  name: string;
  version: string;
  stage: string;
  metric: string;
  color: string;
}

export interface DriftItem {
  run: string;
  drift: number;
  isDriftAlert: boolean;
}

export interface LatencyItem {
  req: string;
  latency: number;
}

export interface SentimentNewsItem {
  title: string;
  publisher: string;
  date: number;
  link: string;
  score: number;
  label: "positive" | "negative" | "neutral";
}

export interface SentimentResponse {
  ticker: string;
  score: number;
  label: "positive" | "negative" | "neutral";
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  news: SentimentNewsItem[];
}

export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface HistoryResponse {
  ticker: string;
  period: string;
  interval: string;
  candles: Candle[];
}

export interface Mover {
  ticker: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
}

export interface MoversResponse {
  gainers: Mover[];
  losers: Mover[];
  asof: number;
}

export interface HeatmapItem {
  ticker: string;
  change_pct: number;
  price: number;
}

export interface HeatmapResponse {
  items: HeatmapItem[];
  asof: number;
}

export interface ForecastStep {
  step: number;
  mean: number;
  lo: number;
  hi: number;
  pred_logret?: number;
}

export interface ForecastResponse {
  ticker: string;
  model: string;
  horizon: number;
  last_close: number;
  forecast: ForecastStep[];
  metrics: {
    mae_cv: number;
    dir_acc: number;
    n_train: number;
  };
}

export interface ShapDriver {
  feature: string;
  label: string;
  value: number;
  shap: number;
}

export interface ShapResponse {
  ticker: string;
  base_value: number;
  prediction_logret: number;
  prediction_pct: number;
  top: ShapDriver[];
  all: ShapDriver[];
}

export interface IndicatorsResponse {
  ticker: string;
  dates: string[];
  close: number[];
  sma20: number[];
  sma50: number[];
  macd: number[];
  signal: number[];
  hist: number[];
  rsi: number[];
  atr: number[];
  latest: {
    rsi: number;
    macd: number;
    signal: number;
    atr: number;
    sma20: number;
    sma50: number;
  };
}

export interface AIAnalystNarrative {
  ticker: string;
  stance: "constructive" | "defensive" | "neutral";
  conviction: number;
  horizon: {
    "5d_pct": number;
    "20d_pct": number;
  };
  summary: string;
  bullets: string[];
  drivers_up: ShapDriver[];
  drivers_down: ShapDriver[];
}

export interface AnalystResponse {
  forecast: ForecastResponse;
  explain: ShapResponse;
  narrative: AIAnalystNarrative;
}

export interface UserResponse {
  id: number;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface PortfolioResponse {
  name: string;
  total_value: number;
  total_cost: number;
  daily_change: number;
  daily_change_pct: number;
  holdings: PortfolioHolding[];
}

export interface AlertRule {
  id: number;
  user_id: number;
  ticker: string;
  condition_type: string;
  threshold: number;
  status: "armed" | "triggered";
  created_at: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface GenericStatusResponse {
  status: string;
}

export interface WatchlistStatusResponse {
  status: string;
  ticker?: string;
}

export interface AlertTriggerResponse {
  status: string;
  alert_status: string;
}

// ========================================== API CALLS ==========================================

export const api = {
  // Auth
  signup: (body: UserCredentials) => request<UserResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: UserCredentials) => request<LoginResponse>("/api/auth/login-json", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<UserResponse>("/api/auth/me"),

  // Market Data
  getTickerStrip: () => request<TickerStripResponse>("/api/ticker"),
  getQuote: (ticker: string) => request<StockQuote>(`/api/quote/${encodeURIComponent(ticker)}`),
  getHistory: (ticker: string, period = "6mo", interval = "1d") => 
    request<HistoryResponse>(`/api/history/${encodeURIComponent(ticker)}?period=${period}&interval=${interval}`),
  getMovers: (limit = 5) => request<MoversResponse>(`/api/movers?limit=${limit}`),
  getHeatmap: () => request<HeatmapResponse>("/api/heatmap"),
  
  // Analytics & ML
  getIndicators: (ticker: string) => request<IndicatorsResponse>(`/api/indicators/${encodeURIComponent(ticker)}`),
  getForecast: (ticker: string, horizon = 20) => request<ForecastResponse>(`/api/forecast/${encodeURIComponent(ticker)}?horizon=${horizon}`),
  getExplain: (ticker: string, topK = 6) => request<ShapResponse>(`/api/explain/${encodeURIComponent(ticker)}?top_k=${topK}`),
  getAnalyst: (ticker: string) => request<AnalystResponse>(`/api/analyst/${encodeURIComponent(ticker)}`),

  // User Watchlist
  getWatchlist: () => request<string[]>("/api/watchlist"),
  addToWatchlist: (ticker: string) => request<WatchlistStatusResponse>("/api/watchlist", { method: "POST", body: JSON.stringify({ ticker }) }),
  removeFromWatchlist: (ticker: string) => request<GenericStatusResponse>(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" }),

  // User Portfolio
  getPortfolio: () => request<PortfolioResponse>("/api/portfolio"),
  addHolding: (ticker: string, shares: number, avgCost: number) => 
    request<GenericStatusResponse>("/api/portfolio/holdings", { method: "POST", body: JSON.stringify({ ticker, shares, avg_cost: avgCost }) }),
  removeHolding: (ticker: string) => request<GenericStatusResponse>(`/api/portfolio/holdings/${encodeURIComponent(ticker)}`, { method: "DELETE" }),

  // User Alerts
  getAlerts: () => request<AlertRule[]>("/api/alerts"),
  createAlert: (ticker: string, conditionType: string, threshold: number) => 
    request<AlertRule>("/api/alerts", { method: "POST", body: JSON.stringify({ ticker, condition_type: conditionType, threshold }) }),
  deleteAlert: (id: number) => request<GenericStatusResponse>(`/api/alerts/${id}`, { method: "DELETE" }),
  triggerAlert: (id: number) => request<AlertTriggerResponse>(`/api/alerts/${id}/trigger`, { method: "POST" }),

  // Sentiment & MLOps
  getSentiment: (ticker: string) => request<SentimentResponse>(`/api/sentiment/${encodeURIComponent(ticker)}`),
  getMlopsModels: () => request<MlopsModel[]>("/api/mlops/models"),
  getMlopsDrift: () => request<DriftItem[]>("/api/mlops/drift"),
  getMlopsLatency: () => request<LatencyItem[]>("/api/mlops/latency"),
};
