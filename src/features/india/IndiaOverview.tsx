"use client";

import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { IndianRupee, RefreshCw, Sparkles, PiggyBank, Layers, Rocket } from "lucide-react";
import { BLUE, tooltipStyle, Caption, NSE_STOCKS, pctSigned } from "./common";

export default function IndiaOverview() {
  const { setSelectedSymbol, setActiveView } = useApp();

  const { data: nifty } = useQuery({ queryKey: ["inQuote", "^NSEI"], queryFn: () => api.getQuote("^NSEI"), refetchInterval: 120000 });
  const { data: sensex } = useQuery({ queryKey: ["inQuote", "^BSESN"], queryFn: () => api.getQuote("^BSESN"), refetchInterval: 120000 });
  const { data: niftyHist, isLoading: histLoading } = useQuery({
    queryKey: ["inHistory", "^NSEI"],
    queryFn: () => api.getHistory("^NSEI", "6mo", "1d"),
    refetchInterval: 300000,
  });
  const stockQueries = useQueries({
    queries: NSE_STOCKS.map((t) => ({ queryKey: ["inQuote", t], queryFn: () => api.getQuote(t), refetchInterval: 120000 })),
  });

  const chartData = niftyHist?.candles.map((c) => ({ date: c.t, close: c.c })) ?? [];

  return (
    <div className="space-y-6 font-mono">
      {/* 1. HERO: INDICES + WHAT'S DIFFERENT */}
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-primary" /> India Overview · NSE / BSE
          </div>
          <span className="chip bg-secondary/10 text-secondary border border-secondary/10 text-[9px] px-2 py-0.5 rounded-full font-bold">
            Market hours 09:15–15:30 IST
          </span>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "NIFTY 50", q: nifty },
            { n: "SENSEX", q: sensex },
          ].map(({ n, q }) => (
            <div key={n} className="card !bg-panel/40 border border-line/60 p-3.5 rounded-xl">
              <div className="text-muted-text text-[9px] uppercase font-bold">{n}</div>
              <div className="text-[20px] font-bold text-ink tracking-tight mt-0.5">
                {q ? q.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "…"}
              </div>
              {q && (
                <div className={`text-[10px] font-bold ${q.change_pct >= 0 ? "text-secondary" : "text-danger"}`}>
                  {pctSigned(q.change_pct)} today
                </div>
              )}
            </div>
          ))}
          <div className="card col-span-2 !bg-panel/40 border border-amber/20 p-3.5 rounded-xl">
            <div className="text-amber text-[9px] uppercase font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> What today&apos;s apps don&apos;t show you
            </div>
            <ul className="text-[9px] text-muted-text mt-1.5 space-y-0.5 leading-relaxed">
              <li>· The <span className="text-ink font-bold">₹ cost of fund fees</span> compounded over years — see Mutual Funds</li>
              <li>· <span className="text-ink font-bold">Overlap between your funds</span> — 2 funds ≠ 2× diversification</li>
              <li>· <span className="text-ink font-bold">IPO hype vs reality</span> — GMP buzz next to actual listing returns</li>
            </ul>
          </div>
        </div>

        {/* NIFTY chart */}
        {histLoading ? (
          <div className="h-[200px] flex items-center justify-center text-muted-text text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading NIFTY 50 candles...
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -5, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="niftyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="close" name="NIFTY 50" stroke={BLUE} strokeWidth={1.8} fill="url(#niftyFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <Caption>
          The NIFTY 50 is the pulse of the Indian stock market — India&apos;s 50 biggest companies in one number.
          When this line climbs steadily, most diversified Indian portfolios climb with it.
        </Caption>
      </section>

      {/* 2. TOP NSE STOCKS */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
          Bluechip Watch · NSE Large Caps
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {NSE_STOCKS.map((t, i) => {
            const q = stockQueries[i].data;
            const name = t.replace(".NS", "");
            return (
              <button
                key={t}
                onClick={() => { setSelectedSymbol(t); setActiveView("stock"); }}
                className="card !bg-panel/40 border border-line/60 hover:border-primary/40 p-3 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="text-ink text-[11px] font-bold uppercase">{name}</div>
                {q ? (
                  <>
                    <div className="text-[14px] font-bold text-ink mt-0.5">₹{q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                    <div className={`text-[10px] font-bold ${q.change_pct >= 0 ? "text-secondary" : "text-danger"}`}>{pctSigned(q.change_pct)}</div>
                  </>
                ) : (
                  <div className="text-[10px] text-muted-text mt-1">loading…</div>
                )}
              </button>
            );
          })}
        </div>
        <Caption>
          Live prices for the stocks that steer the index. Tap any card for the full AI analysis —
          forecasts, technicals, and news sentiment — exactly like US tickers.
        </Caption>
      </section>

      {/* 3. QUICK LINKS TO INDIA DESKS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "funds", icon: PiggyBank, title: "Mutual Funds", desc: "5Y returns, the true ₹ cost of fees, and fund overlap X-ray", color: "text-secondary" },
          { id: "etfs", icon: Layers, title: "ETFs", desc: "Index investing on the exchange — expense ratios that matter", color: "text-primary" },
          { id: "ipos", icon: Rocket, title: "IPO Desk", desc: "Live pipeline, GMP buzz, and hype-vs-reality after listing", color: "text-amber" },
        ].map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => setActiveView(d.id)}
              className="card p-4 bg-card border border-line hover:border-primary/40 rounded-xl text-left transition-colors cursor-pointer space-y-1.5"
            >
              <div className={`flex items-center gap-2 text-[12px] font-bold ${d.color}`}>
                <Icon className="h-4 w-4" /> {d.title} →
              </div>
              <p className="text-[10px] text-muted-text leading-relaxed">{d.desc}</p>
            </button>
          );
        })}
      </section>
    </div>
  );
}
