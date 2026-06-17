"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, CheckCircle } from "lucide-react";

export default function StockAnalysis() {
  const { selectedSymbol, token } = useApp();
  const [period, setPeriod] = useState("6mo");

  // Fetch Quote
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["quote", selectedSymbol],
    queryFn: () => api.getQuote(selectedSymbol),
    refetchInterval: 60000,
  });

  // Fetch History
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["history", selectedSymbol, period],
    queryFn: () => api.getHistory(selectedSymbol, period, "1d"),
    refetchInterval: 300000,
  });

  // Fetch Indicators
  const { data: indicators, isLoading: indicatorsLoading } = useQuery({
    queryKey: ["indicators", selectedSymbol],
    queryFn: () => api.getIndicators(selectedSymbol),
    refetchInterval: 300000,
  });

  // Format historical price data for Recharts
  const priceChartData = history?.candles.map((c, i) => {
    // Simple SMA calculation for overlays
    const slice = history.candles.slice(Math.max(0, i - 19), i + 1);
    const sma20Val = slice.reduce((acc, curr) => acc + curr.c, 0) / slice.length;
    
    const slice50 = history.candles.slice(Math.max(0, i - 49), i + 1);
    const sma50Val = slice50.reduce((acc, curr) => acc + curr.c, 0) / slice50.length;

    return {
      date: c.t,
      price: c.c,
      volume: c.v,
      sma20: Number(sma20Val.toFixed(2)),
      sma50: Number(sma50Val.toFixed(2))
    };
  }) || [];

  // Format indicator data for charts (last 80 periods for better density)
  const indChartData = indicators?.dates.map((date, idx) => ({
    date,
    rsi: indicators.rsi[idx],
    macd: indicators.macd[idx],
    signal: indicators.signal[idx],
    hist: indicators.hist[idx],
  })).slice(-80) || [];

  // Helper formats
  const fmtNum = (n: number, d = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) || "—";
  const fmtPct = (p: number) => (p >= 0 ? "+" : "") + (p || 0).toFixed(2) + "%";
  const color = (p: number) => p >= 0 ? "text-secondary" : "text-danger";

  // Consensus Split (NVDA-oriented megacap representation)
  const consensusSplit = [
    { label: "Strong Buy", count: 31, color: "#00D4AA" },
    { label: "Buy", count: 11, color: "#4D9FFF" },
    { label: "Hold", count: 4, color: "#F5A524" },
    { label: "Sell", count: 1, color: "#E05555" },
  ];
  const totalAnalysts = 47;

  // Active Signals (simulated multi-factor indicators checklist)
  const activeSignals = [
    { name: "Golden cross (50/200)", active: true, time: "12m ago", type: "trend" },
    { name: "Volume thrust > 2σ", active: true, time: "3h ago", type: "volume" },
    { name: "RSI Mean Reversion", active: false, time: "Armed", type: "oscillator" },
    { name: "MACD Bullish Cross", active: true, time: "Yesterday", type: "momentum" },
    { name: "Insider net buying (30d)", active: true, time: "7d ago", type: "fundamental" },
    { name: "Headline sentiment > 0.8", active: true, time: "24h ago", type: "sentiment" },
  ];

  if (quoteLoading || historyLoading || indicatorsLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Synchronizing live indicators and historical price matrices for {selectedSymbol}...
      </div>
    );
  }

  const currentPrice = quote?.price || 1038.21;
  const priceChange = quote?.change || 47.10;
  const priceChangePct = quote?.change_pct || 4.75;

  return (
    <div className="space-y-6">
      {/* 1. STOCK HEADER QUOTE */}
      <section className="card p-5 bg-card border border-line rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl grid place-items-center font-display text-[18px] font-extrabold text-ink bg-gradient-to-br from-primary/10 to-secondary/10 border border-line select-none">
            {selectedSymbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-[21px] font-bold text-ink">{quote?.name || selectedSymbol}</h3>
              <span className="chip bg-line text-muted-text text-[9px] px-1.5 py-0.2 rounded border border-line">
                {selectedSymbol} · NASDAQ
              </span>
              <span className="chip bg-secondary/15 text-secondary text-[9px] px-1.5 py-0.2 rounded border border-secondary/10 font-bold">
                AI SCORE: {indicators?.latest?.rsi ? Math.round(50 + (60 - indicators.latest.rsi) * 0.8) : 87}
              </span>
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              Semiconductors · Mega-cap · Market Cap {fmtNum((quote?.market_cap || 2.54e12) / 1e12)}T · Float {quote?.currency || "USD"}
            </div>
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="font-display text-[26px] font-bold text-ink leading-tight flex items-baseline gap-2 justify-end">
            {fmtNum(currentPrice)}
            <span className={`text-[13px] font-bold ${color(priceChangePct)}`}>
              {fmtPct(priceChangePct)}
            </span>
          </div>
          <div className="text-[10px] text-muted-text mt-0.5">
            Volume {(quote?.volume || 62.1e6) / 1e6 ? ((quote?.volume || 62.1e6) / 1e6).toFixed(1) + "M" : "—"} · Range {fmtNum(quote?.low || 982)} — {fmtNum(quote?.high || 1042)}
          </div>
        </div>
      </section>

      {/* 2. MAIN CHARTS & TECHNICAL DETAILS */}
      <section className="grid grid-cols-12 gap-6">
        {/* Interactive Charts Area */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-4">
          <header className="flex justify-between items-center flex-wrap gap-3">
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
              Historical Price & Moving Averages
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-text">
              {["1mo", "3mo", "6mo", "1y", "max"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 rounded transition-colors uppercase ${
                    period === p ? "bg-line text-ink font-semibold" : "hover:text-ink hover:bg-line/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </header>

          {/* Area Chart with SMA20 and SMA50 */}
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceChartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D9FFF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4D9FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }}
                />
                <YAxis 
                  domain={["auto", "auto"]} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B", borderRadius: "8px" }}
                  labelStyle={{ color: "#7A7A8C", fontSize: "10px", fontFamily: "DM Mono" }}
                  itemStyle={{ color: "#E7E7F0", fontSize: "11px", fontFamily: "DM Mono" }}
                />
                <Area type="monotone" dataKey="price" stroke="#4D9FFF" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" name="Price" />
                <Line type="monotone" dataKey="sma20" stroke="#F5A524" strokeWidth={1.2} dot={false} name="SMA 20" />
                <Line type="monotone" dataKey="sma50" stroke="#00D4AA" strokeWidth={1.2} dot={false} name="SMA 50" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume bars below price */}
          <div className="h-[50px] w-full border-t border-line/20 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceChartData}>
                <Bar dataKey="volume" fill="#1F2A3D" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Technical sub-charts: RSI and MACD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line/50">
            {/* MACD Chart */}
            <div className="card bg-panel/30 border border-line/40 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono border-b border-line pb-2 mb-2">
                <span className="text-muted-text uppercase font-bold">MACD (12, 26, 9)</span>
                <span className="chip bg-secondary/15 text-secondary px-1.5 py-0.2 rounded font-bold text-[9px]">
                  BULLISH Cross
                </span>
              </div>
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={indChartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 8 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }} />
                    <Line type="monotone" dataKey="macd" stroke="#4D9FFF" strokeWidth={1.2} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#F5A524" strokeWidth={1.2} dot={false} name="Signal" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RSI Chart */}
            <div className="card bg-panel/30 border border-line/40 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono border-b border-line pb-2 mb-2">
                <span className="text-muted-text uppercase font-bold">RSI (14)</span>
                <span className="chip bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold text-[9px]">
                  {indicators?.latest?.rsi?.toFixed(1) || "58.3"} · NEUTRAL
                </span>
              </div>
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={indChartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 8 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }} />
                    <ReferenceLine y={70} stroke="#7A7A8C" strokeDasharray="3 3" strokeWidth={0.8} />
                    <ReferenceLine y={30} stroke="#7A7A8C" strokeDasharray="3 3" strokeWidth={0.8} />
                    <Line type="monotone" dataKey="rsi" stroke="#00D4AA" strokeWidth={1.4} dot={false} name="RSI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right side Fundamentals & Consensus column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Fundamentals Grid */}
          <div className="card p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-2.5">
              Fundamentals
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 text-[11px]">
              {[
                ["P/E (ttm)", "72.4"],
                ["Fwd P/E", "38.1"],
                ["PEG Ratio", "1.42"],
                ["EV / EBITDA", "64.8"],
                ["Gross Margin", "75.3%"],
                ["Op. Margin", "62.4%"],
                ["ROE", "103.4%"],
                ["Net Debt/EBITDA", "-0.62"],
                ["Rev Growth (y/y)", "+122%"],
                ["EPS Growth (y/y)", "+168%"],
                ["FCF Yield", "1.4%"],
                ["Beta (5Y)", "1.71"]
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line/20 pb-1.5 pr-2">
                  <span className="text-muted-text">{k}</span>
                  <span className="font-bold text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Consensus */}
          <div className="card p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
            <header className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
                Analyst Consensus
              </div>
              <span className="chip bg-secondary/15 text-secondary px-1.5 py-0.2 rounded font-bold text-[9px]">
                Strong Buy
              </span>
            </header>
            <div className="text-[12px] space-y-3 pt-1">
              <div className="flex items-baseline gap-2">
                <div className="font-display text-[26px] font-bold text-ink leading-none">4.6</div>
                <div className="text-muted-text text-[10px]">/ 5 · 47 analysts consensus</div>
              </div>
              <div className="space-y-2 mt-2">
                {consensusSplit.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-[10px]">
                    <div className="w-16 text-muted-text font-medium">{c.label}</div>
                    <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${(c.count / totalAnalysts) * 100}%`, backgroundColor: c.color }} 
                      />
                    </div>
                    <div className="w-5 text-right font-bold text-ink">{c.count}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-line/30 pt-3 text-center text-[10px] mt-4">
                <div>
                  <div className="text-muted-text text-[9px] uppercase font-bold">Low target</div>
                  <div className="font-bold text-ink mt-0.5">$840</div>
                </div>
                <div>
                  <div className="text-muted-text text-[9px] uppercase font-bold">Mean price</div>
                  <div className="font-bold text-primary mt-0.5">$1,210</div>
                </div>
                <div>
                  <div className="text-muted-text text-[9px] uppercase font-bold">High target</div>
                  <div className="font-bold text-ink mt-0.5">$1,500</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Signals */}
          <div className="card p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
            <header className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
                Active Signals
              </div>
              <span className="chip bg-line text-muted-text px-1.5 py-0.2 rounded text-[9px]">
                5 / 6 firing
              </span>
            </header>
            <div className="text-[11px] divide-y divide-line/20">
              {activeSignals.map((sig) => (
                <div key={sig.name} className="flex items-center gap-2 py-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${sig.active ? "bg-secondary" : "bg-line"}`} />
                  <span className={`flex-1 ${sig.active ? "text-ink font-semibold" : "text-muted-text"}`}>
                    {sig.name}
                  </span>
                  <span className="text-muted-text text-[9px]">{sig.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
