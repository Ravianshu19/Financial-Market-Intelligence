"use client";

import React from "react";
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
  Bar 
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, Flame, Grid, Newspaper } from "lucide-react";

export default function MarketOverview() {
  const { setSelectedSymbol, setActiveView, token } = useApp();

  // Get index history (S&P 500)
  const { data: indexHistory, isLoading: indexLoading } = useQuery({
    queryKey: ["indexHistory"],
    queryFn: () => api.getHistory("^GSPC", "6mo", "1d"),
    refetchInterval: 300000,
  });

  // Get movers
  const { data: movers, isLoading: moversLoading } = useQuery({
    queryKey: ["movers"],
    queryFn: () => api.getMovers(5),
    refetchInterval: 120000,
  });

  // Get heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => api.getHeatmap(),
    refetchInterval: 120000,
  });

  // Get broad market news/sentiment using S&P 500 (^GSPC)
  const { data: sentiment, isLoading: sentimentLoading } = useQuery({
    queryKey: ["marketSentiment"],
    queryFn: () => api.getSentiment("^GSPC"),
    refetchInterval: 300000,
  });

  // Format historical candles for Recharts
  const chartData = indexHistory?.candles.map(c => ({
    date: c.t,
    close: c.c,
    volume: c.v
  })) || [];

  // Sector Data Mock (represents real index holdings performance)
  const sectors = [
    { name: "Information Technology", chg: 1.42, w: 84, up: true },
    { name: "Communication Services", chg: 0.97, w: 71, up: true },
    { name: "Consumer Discretionary", chg: 0.61, w: 58, up: true },
    { name: "Financials", chg: 0.18, w: 42, up: true },
    { name: "Industrials", chg: -0.06, w: 38, up: false },
    { name: "Healthcare", chg: -0.34, w: 28, up: false },
    { name: "Energy", chg: -1.12, w: 14, up: false },
  ];

  // Helper formatting functions
  const fmtNum = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtPct = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";

  // Last close statistics
  const lastCandle = indexHistory?.candles[indexHistory.candles.length - 1];
  const prevCandle = indexHistory?.candles[indexHistory.candles.length - 2];
  const lastClose = lastCandle?.c || 5824.12;
  const change = prevCandle ? lastClose - prevCandle.c : 31.42;
  const changePct = prevCandle ? (change / prevCandle.c) * 100 : 0.54;

  return (
    <div className="space-y-6">
      {/* 1. HERO BRANDING & STATS PANEL */}
      <section className="card softgrad p-6 md:p-8 relative overflow-hidden rounded-xl border border-line">
        
        <div className="grid md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-muted-text font-mono">
              <span className="chip bg-secondary/15 text-secondary px-2 py-0.5 rounded-full border border-secondary/10 flex items-center gap-1 font-semibold">
                <span className="h-1 w-1 rounded-full bg-secondary pulse-dot" /> Market open · NYSE
              </span>
              <span>Session: 14:22 EST · Jun 2026</span>
            </div>
            
            <h1 className="font-display text-3xl md:text-5xl tracking-tighter leading-none text-ink font-bold">
              Intelligence that<br />
              <span className="gradient-text font-extrabold">moves with the tape.</span>
            </h1>
            
            <p className="text-muted-text text-xs leading-relaxed max-w-[560px] font-mono">
              A multi-factor research desk that fuses XGBoost forecasts, FinBERT news sentiment, technical 
              regimes, and portfolio risk analysis into a single decision surface. Explainable. Real-time.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button 
                onClick={() => { setSelectedSymbol("NVDA"); setActiveView("stock"); }}
                className="btn btn-primary px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-bg hover:bg-primary/95 transition-all cursor-pointer shadow-lg shadow-primary/10"
              >
                Analyze NVIDIA (NVDA) →
              </button>
              <button 
                onClick={() => setActiveView("portfolio")}
                className="btn px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:border-muted-text bg-card hover:bg-line text-ink transition-all cursor-pointer"
              >
                Review Portfolio
              </button>
            </div>
          </div>

          {/* Mini Indexes Grid */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3 font-mono">
            {[
              { n: "S&P 500", p: 5824.12, chg: 0.54, up: true, desc: "+31.42" },
              { n: "NASDAQ 100", p: 20318.77, chg: 0.83, up: true, desc: "+167.30" },
              { n: "VIX INDEX", p: 13.45, chg: -2.10, up: false, desc: "-0.29" },
              { n: "BTC / USD", p: 103420, chg: 3.27, up: true, desc: "+3,278" },
            ].map((idx) => (
              <div key={idx.n} className="card !bg-panel/40 border border-line/60 p-3.5 rounded-xl hover:border-line transition-colors">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-muted-text uppercase font-semibold">{idx.n}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${idx.up ? "bg-secondary/10 text-secondary" : "bg-danger/10 text-danger"}`}>
                    {idx.chg >= 0 ? "+" : ""}{idx.chg}%
                  </span>
                </div>
                <div className="text-[17px] font-bold text-ink tracking-tight mt-1">
                  {idx.p.toLocaleString(undefined, { maximumFractionDigits: idx.p > 1000 ? 0 : 2 })}
                </div>
                <div className={`text-[10px] font-semibold ${idx.up ? "text-secondary" : "text-danger"}`}>
                  {idx.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM METRICS BAR */}
        <div className="border-t border-line mt-6 pt-5 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line font-mono">
          {[
            { k: "Models tracked", v: "42", s: "+3 this week" },
            { k: "Signals today", v: "1,284", s: "active streams" },
            { k: "Forecast MAE (5d)", v: "0.93%", s: "▼ 0.06 sigma" },
            { k: "Sentiment Coverage", v: "9,420", s: "articles (24h)" }
          ].map((item, idx) => (
            <div key={item.k} className={`p-3 ${idx > 1 ? "pt-3 md:pt-0" : ""} md:pl-5`}>
              <div className="label text-[9px] tracking-wider text-muted-text font-bold uppercase">{item.k}</div>
              <div className="text-[20px] font-bold text-ink tracking-tight mt-1">{item.v}</div>
              <div className="text-[10px] text-muted-text">{item.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. AREA CHART & SECTORS ROW */}
      <section className="grid grid-cols-12 gap-6">
        {/* Market Overview Chart */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-4">
          <header className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
                Market Overview · S&P 500 Index
              </div>
              <h2 className="text-[20px] font-bold text-ink flex items-center gap-2 mt-1">
                {fmtNum(lastClose)}{" "}
                <span className={`text-[12px] font-semibold flex items-center ${change >= 0 ? "text-secondary" : "text-danger"}`}>
                  {change >= 0 ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                  {change >= 0 ? "+" : ""}{fmtNum(change)} ({fmtPct(changePct)})
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-text">
              {["1D", "5D", "1M", "3M", "YTD", "6M"].map((t) => (
                <button 
                  key={t}
                  className={`px-2 py-1 rounded transition-colors ${
                    t === "6M" ? "bg-line text-ink font-semibold" : "hover:text-ink hover:bg-line/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </header>

          {indexLoading ? (
            <div className="h-[320px] flex items-center justify-center text-muted-text text-xs font-mono">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading live S&P 500 index candles...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4D9FFF" stopOpacity={0.2} />
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
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#4D9FFF" 
                      strokeWidth={1.8} 
                      fillOpacity={1} 
                      fill="url(#colorClose)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Bar Chart */}
              <div className="h-[50px] w-full border-t border-line/20 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="volume" fill="#1F2A3D" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Indicators Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-line/50 font-mono">
            {[
              { k: "RSI(14)", v: "58.3", desc: "neutral", w: 58, c: "var(--color-primary)" },
              { k: "MACD", v: "+12.4", desc: "bullish cross", w: 74, c: "var(--color-secondary)" },
              { k: "ATR(14)", v: "24.80", desc: "vol rising", w: 62, c: "var(--color-amber)" },
              { k: "ADX(14)", v: "27.1", desc: "strong trend", w: 71, c: "var(--color-primary)" }
            ].map((ind) => (
              <div key={ind.k} className="card bg-panel/30 border border-line/40 p-2.5 rounded-xl">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-text uppercase font-bold">{ind.k}</span>
                  <span className="font-bold" style={{ color: ind.c }}>{ind.v}</span>
                </div>
                <div className="text-[9px] text-muted-text mt-0.5">{ind.desc}</div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full" style={{ width: `${ind.w}%`, backgroundColor: ind.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector returns */}
        <div className="card col-span-12 lg:col-span-4 p-5 bg-card border border-line rounded-xl space-y-4">
          <header className="flex justify-between items-center border-b border-line pb-3">
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-primary" /> Sector Returns · Today
            </div>
            <span className="chip bg-line text-muted-text text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold">
              RTH
            </span>
          </header>
          
          <div className="space-y-3 font-mono text-[11px]">
            {sectors.map((sec) => (
              <div key={sec.name} className="flex items-center justify-between gap-3 py-1 border-b border-line/20">
                <div className="w-28 truncate text-muted-text font-medium" title={sec.name}>
                  {sec.name}
                </div>
                <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${sec.w}%`, 
                      backgroundColor: sec.up ? "var(--color-secondary)" : "var(--color-danger)" 
                    }} 
                  />
                </div>
                <div className={`w-14 text-right font-bold ${sec.up ? "text-secondary" : "text-danger"}`}>
                  {fmtPct(sec.chg)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. GAINERS & LOSERS TABLES */}
      <section className="grid grid-cols-12 gap-6 font-mono">
        {/* Gainers Column */}
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="flex items-center gap-2 border-b border-line pb-3">
            <span className="h-2 w-2 rounded-full bg-secondary pulse-dot" />
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
              Top Gainers · S&P Basket
            </div>
          </header>

          {moversLoading ? (
            <div className="py-12 text-center text-muted-text text-xs">Loading gainers...</div>
          ) : (
            <table className="w-full text-[11px]">
              <thead className="text-muted-text">
                <tr className="text-left border-b border-line/30">
                  <th className="font-semibold py-1.5">Symbol</th>
                  <th className="font-semibold">Last Price</th>
                  <th className="font-semibold text-right">Change %</th>
                  <th className="font-semibold text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {movers?.gainers.map((g) => (
                  <tr 
                    key={g.ticker} 
                    onClick={() => { setSelectedSymbol(g.ticker); setActiveView("stock"); }}
                    className="hover:bg-line/30 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-ink uppercase">{g.ticker}</td>
                    <td className="font-medium text-ink">{fmtNum(g.price)}</td>
                    <td className="text-right font-extrabold text-secondary">{fmtPct(g.change_pct)}</td>
                    <td className="text-right text-muted-text">{(g.volume / 1e6).toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Losers Column */}
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="flex items-center gap-2 border-b border-line pb-3">
            <span className="h-2 w-2 rounded-full bg-danger pulse-dot" />
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
              Top Losers · S&P Basket
            </div>
          </header>

          {moversLoading ? (
            <div className="py-12 text-center text-muted-text text-xs">Loading losers...</div>
          ) : (
            <table className="w-full text-[11px]">
              <thead className="text-muted-text">
                <tr className="text-left border-b border-line/30">
                  <th className="font-semibold py-1.5">Symbol</th>
                  <th className="font-semibold">Last Price</th>
                  <th className="font-semibold text-right">Change %</th>
                  <th className="font-semibold text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {movers?.losers.map((l) => (
                  <tr 
                    key={l.ticker}
                    onClick={() => { setSelectedSymbol(l.ticker); setActiveView("stock"); }}
                    className="hover:bg-line/30 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-ink uppercase">{l.ticker}</td>
                    <td className="font-medium text-ink">{fmtNum(l.price)}</td>
                    <td className="text-right font-extrabold text-danger">{fmtPct(l.change_pct)}</td>
                    <td className="text-right text-muted-text">{(l.volume / 1e6).toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 4. HEATMAP */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <header className="flex justify-between items-center border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Grid className="h-3.5 w-3.5 text-secondary" /> Heatmap · Performance Weighted by Market Cap
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-text">
            <span>-3%</span>
            <span className="h-2.5 w-5 bg-danger/90 rounded-sm" />
            <span className="h-2.5 w-5 bg-danger/20 rounded-sm" />
            <span className="h-2.5 w-5 bg-card border border-line rounded-sm" />
            <span className="h-2.5 w-5 bg-secondary/20 rounded-sm" />
            <span className="h-2.5 w-5 bg-secondary/90 rounded-sm" />
            <span>+3%</span>
          </div>
        </header>

        {heatmapLoading ? (
          <div className="py-12 text-center text-muted-text text-xs">Loading heatmap layout...</div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1 text-center font-mono">
            {heatmapData?.items.map((it) => {
              const chg = it.change_pct;
              const absVal = Math.min(Math.abs(chg) / 3, 1);
              const isUp = chg >= 0;
              // Compute dynamic background color relative to daily move size
              const bgStyle = isUp 
                ? `rgba(0, 212, 170, ${0.12 + absVal * 0.78})`
                : `rgba(224, 85, 85, ${0.12 + absVal * 0.78})`;

              return (
                <div
                  key={it.ticker}
                  onClick={() => { setSelectedSymbol(it.ticker); setActiveView("stock"); }}
                  style={{ backgroundColor: bgStyle }}
                  title={`${it.ticker} · ${fmtPct(chg)}`}
                  className="aspect-square rounded-md p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.05] hover:z-10 text-bg"
                >
                  <div className="font-display font-extrabold text-[10px] tracking-tight uppercase">
                    {it.ticker}
                  </div>
                  <div className="text-[8px] font-bold opacity-85">
                    {fmtPct(chg)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. REAL-TIME MARKET NEWS & SENTIMENT DESK */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4 font-mono">
        <header className="flex justify-between items-center border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Newspaper className="h-3.5 w-3.5 text-primary" />
            Real-time Market News & Sentiment (FinBERT)
          </div>
          {sentiment && (
            <span className={`chip text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
              sentiment.label === "positive" 
                ? "bg-secondary/15 text-secondary border-secondary/20" 
                : sentiment.label === "negative" 
                  ? "bg-danger/15 text-danger border-danger/20" 
                  : "bg-primary/10 text-primary border-primary/20"
            }`}>
              Overall: {sentiment.label.toUpperCase()} ({(sentiment.score >= 0 ? "+" : "") + sentiment.score.toFixed(2)})
            </span>
          )}
        </header>

        {sentimentLoading ? (
          <div className="py-12 text-center text-muted-text text-xs">Loading market sentiment feed...</div>
        ) : !sentiment?.news || sentiment.news.length === 0 ? (
          <div className="py-12 text-center text-muted-text text-xs">
            No market news sentiment signals found in the last 24h.
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Distribution chart/summary */}
            <div className="col-span-12 md:col-span-4 space-y-4 border-r border-line/30 pr-0 md:pr-6">
              <h4 className="text-xs font-bold text-ink uppercase">Sentiment Distribution</h4>
              <div className="space-y-3">
                {[
                  { label: "Positive", val: sentiment.sentiment_distribution.positive, color: "var(--color-secondary)" },
                  { label: "Neutral", val: sentiment.sentiment_distribution.neutral, color: "var(--color-primary)" },
                  { label: "Negative", val: sentiment.sentiment_distribution.negative, color: "var(--color-danger)" }
                ].map((s) => (
                  <div key={s.label} className="text-[10px] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-muted-text">{s.label}</span>
                      <span className="text-ink">{Math.round(s.val)}%</span>
                    </div>
                    <div className="h-1.5 bg-line rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.val}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-panel/30 border border-line rounded-lg text-[10px] text-muted-text leading-relaxed">
                <span className="font-bold text-ink uppercase block mb-1">Broad-Market NLP Strategy</span>
                Incoming financial headlines from broad-market streams are processed in real-time by the FinBERT sentiment model. Scores above +0.08 indicate a positive/bullish market mood, while scores below -0.08 indicate warning signs.
              </div>
            </div>

            {/* News List */}
            <div className="col-span-12 md:col-span-8 space-y-3 max-h-[350px] overflow-y-auto pr-2 scroll-hide">
              {sentiment.news.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-panel/20 border border-line/50 hover:border-line hover:bg-panel/40 rounded-xl transition-all flex justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-muted-text uppercase font-semibold">{item.publisher}</span>
                      <span className="text-[9px] text-muted-text">·</span>
                      <span className="text-[9px] text-muted-text">{new Date(item.date * 1000).toLocaleDateString()}</span>
                    </div>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-ink hover:text-primary hover:underline transition-colors line-clamp-2"
                    >
                      {item.title}
                    </a>
                  </div>
                  <div className="flex flex-col items-end justify-center min-w-[70px]">
                    <span className={`chip text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                      item.label === "positive" 
                        ? "bg-secondary/10 text-secondary border-secondary/20" 
                        : item.label === "negative" 
                          ? "bg-danger/10 text-danger border-danger/20" 
                          : "bg-line text-muted-text border-line"
                    }`}>
                      {item.label}
                    </span>
                    <span className="text-[8px] text-muted-text mt-1.5 font-mono">Score: {item.score >= 0 ? "+" : ""}{item.score.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
