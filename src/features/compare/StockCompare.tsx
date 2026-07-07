"use client";

import React, { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { ArrowLeftRight, Plus, X, RefreshCw } from "lucide-react";

const COLORS = ["#4D9FFF", "#00D4AA", "#F5A524"];
const MAX_TICKERS = 3;
const PERIODS = ["1mo", "3mo", "6mo", "1y"];

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

function fmtCap(mc: number): string {
  if (!mc) return "—";
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
  return `$${(mc / 1e6).toFixed(0)}M`;
}

export default function StockCompare() {
  const { selectedSymbol } = useApp();
  const [tickers, setTickers] = useState<string[]>(() =>
    [...new Set([selectedSymbol || "NVDA", "AAPL"])].slice(0, MAX_TICKERS)
  );
  const [input, setInput] = useState("");
  const [period, setPeriod] = useState("6mo");

  const historyQueries = useQueries({
    queries: tickers.map((t) => ({
      queryKey: ["cmpHistory", t, period],
      queryFn: () => api.getHistory(t, period, "1d"),
    })),
  });
  const quoteQueries = useQueries({
    queries: tickers.map((t) => ({
      queryKey: ["cmpQuote", t],
      queryFn: () => api.getQuote(t),
    })),
  });
  const sentimentQueries = useQueries({
    queries: tickers.map((t) => ({
      queryKey: ["cmpSentiment", t],
      queryFn: () => api.getSentiment(t),
    })),
  });

  const addTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (sym && !tickers.includes(sym) && tickers.length < MAX_TICKERS) {
      setTickers([...tickers, sym]);
    }
    setInput("");
  };
  const removeTicker = (sym: string) => {
    if (tickers.length > 1) setTickers(tickers.filter((t) => t !== sym));
  };

  const histLoading = historyQueries.some((q) => q.isLoading);

  // ---- Normalized performance series over common dates ----
  const seriesMaps = historyQueries.map((q) => {
    const m = new Map<string, number>();
    q.data?.candles.forEach((c) => m.set(c.t, c.c));
    return m;
  });

  let chartData: Record<string, string | number>[] = [];
  let returnsByTicker: number[][] = [];
  if (!histLoading && seriesMaps.every((m) => m.size > 1)) {
    const commonDates = [...seriesMaps[0].keys()].filter((d) => seriesMaps.every((m) => m.has(d)));
    if (commonDates.length > 1) {
      const bases = seriesMaps.map((m) => m.get(commonDates[0])!);
      chartData = commonDates.map((d) => {
        const row: Record<string, string | number> = { date: d };
        tickers.forEach((t, i) => {
          row[t] = +(((seriesMaps[i].get(d)! / bases[i]) - 1) * 100).toFixed(2);
        });
        return row;
      });
      returnsByTicker = tickers.map((_, i) =>
        commonDates.slice(1).map((d, j) => {
          const prevClose = seriesMaps[i].get(commonDates[j])!;
          return (seriesMaps[i].get(d)! - prevClose) / prevClose;
        })
      );
    }
  }

  // Pairwise correlation matrix
  const corr = tickers.map((_, i) =>
    tickers.map((_, j) =>
      i === j ? 1 : returnsByTicker.length ? pearson(returnsByTicker[i], returnsByTicker[j]) : 0
    )
  );

  const fundamentalsRows: { label: string; get: (i: number) => string; tone?: (i: number) => string }[] = [
    { label: "Last Price", get: (i) => quoteQueries[i].data ? `$${quoteQueries[i].data!.price.toFixed(2)}` : "—" },
    {
      label: "Change (1d)",
      get: (i) => quoteQueries[i].data ? `${quoteQueries[i].data!.change_pct >= 0 ? "+" : ""}${quoteQueries[i].data!.change_pct.toFixed(2)}%` : "—",
      tone: (i) => (quoteQueries[i].data?.change_pct ?? 0) >= 0 ? "text-secondary" : "text-danger",
    },
    { label: "Market Cap", get: (i) => fmtCap(quoteQueries[i].data?.market_cap ?? 0) },
    { label: "P/E (TTM)", get: (i) => quoteQueries[i].data?.fundamentals?.pe_ttm?.toFixed(1) ?? "—" },
    { label: "Forward P/E", get: (i) => quoteQueries[i].data?.fundamentals?.fwd_pe?.toFixed(1) ?? "—" },
    { label: "PEG Ratio", get: (i) => quoteQueries[i].data?.fundamentals?.peg_ratio?.toFixed(2) ?? "—" },
    { label: "ROE", get: (i) => quoteQueries[i].data?.fundamentals ? `${(quoteQueries[i].data!.fundamentals!.roe * 100).toFixed(1)}%` : "—" },
    { label: "Op Margin", get: (i) => quoteQueries[i].data?.fundamentals ? `${(quoteQueries[i].data!.fundamentals!.op_margin * 100).toFixed(1)}%` : "—" },
    { label: "Rev Growth", get: (i) => quoteQueries[i].data?.fundamentals ? `${(quoteQueries[i].data!.fundamentals!.rev_growth * 100).toFixed(1)}%` : "—" },
    { label: "Beta", get: (i) => quoteQueries[i].data?.fundamentals?.beta?.toFixed(2) ?? "—" },
    { label: "Analyst Rating", get: (i) => quoteQueries[i].data?.fundamentals?.analyst_rating ?? "—" },
    { label: "Target (Mean)", get: (i) => quoteQueries[i].data?.fundamentals ? `$${quoteQueries[i].data!.fundamentals!.target_mean.toFixed(2)}` : "—" },
    {
      label: "News Sentiment",
      get: (i) => {
        const s = sentimentQueries[i].data;
        return s ? `${s.label.toUpperCase()} (${s.score >= 0 ? "+" : ""}${s.score.toFixed(2)})` : "—";
      },
      tone: (i) => {
        const l = sentimentQueries[i].data?.label;
        return l === "positive" ? "text-secondary" : l === "negative" ? "text-danger" : "text-primary";
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & TICKER SELECTION */}
      <section className="card p-5 bg-card border border-line rounded-xl font-mono space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary" /> Stock Compare · Relative Performance Lab
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-text">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer uppercase ${
                  p === period ? "bg-line text-ink font-semibold" : "hover:text-ink hover:bg-line/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <div className="flex items-center gap-2 flex-wrap">
          {tickers.map((t, i) => (
            <span
              key={t}
              className="chip flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-panel/40 text-[11px] font-bold text-ink uppercase"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              {t}
              {tickers.length > 1 && (
                <button
                  onClick={() => removeTicker(t)}
                  className="text-muted-text hover:text-danger cursor-pointer ml-0.5"
                  title={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          {tickers.length < MAX_TICKERS && (
            <form onSubmit={addTicker} className="flex items-center gap-1">
              <input
                placeholder="Add ticker..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-panel/40 border border-line rounded-lg px-2.5 py-1.5 text-[11px] w-28 font-mono outline-none text-ink uppercase focus:border-primary/45"
              />
              <button
                type="submit"
                className="p-1.5 bg-line border border-line hover:border-muted-text rounded-lg text-ink transition-colors cursor-pointer"
                title="Add to comparison"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
          <span className="text-[9px] text-muted-text ml-auto">up to {MAX_TICKERS} symbols</span>
        </div>
      </section>

      {/* 2. NORMALIZED PERFORMANCE CHART */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
        <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
          Normalized Return · rebased to 0% at start of {period.toUpperCase()}
        </div>
        {histLoading ? (
          <div className="h-[280px] flex items-center justify-center text-muted-text text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Aligning price series...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-text text-xs">
            No overlapping trading days for the selected symbols.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <Tooltip
                  formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }}
                  contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B", borderRadius: "8px" }}
                  labelStyle={{ color: "#7A7A8C", fontSize: "10px", fontFamily: "DM Mono" }}
                  itemStyle={{ fontSize: "11px", fontFamily: "DM Mono" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                <ReferenceLine y={0} stroke="#1F1F2B" strokeDasharray="4 4" />
                {tickers.map((t, i) => (
                  <Line key={t} type="monotone" dataKey={t} stroke={COLORS[i]} strokeWidth={1.8} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* 3. CORRELATION & FUNDAMENTALS */}
      <section className="grid grid-cols-12 gap-6 font-mono">
        {/* Correlation matrix */}
        <div className="card col-span-12 lg:col-span-4 p-5 bg-card border border-line rounded-xl space-y-4">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
            Daily-Return Correlation · {period.toUpperCase()}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-center">
              <thead>
                <tr>
                  <th />
                  {tickers.map((t, i) => (
                    <th key={t} className="font-bold uppercase pb-2" style={{ color: COLORS[i] }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((t, i) => (
                  <tr key={t}>
                    <td className="font-bold uppercase text-left py-1.5" style={{ color: COLORS[i] }}>{t}</td>
                    {tickers.map((u, j) => {
                      const c = corr[i][j];
                      const bg = i === j ? "rgba(122,122,140,0.15)" : c >= 0 ? `rgba(0,212,170,${Math.abs(c) * 0.35})` : `rgba(224,85,85,${Math.abs(c) * 0.35})`;
                      return (
                        <td key={u} className="py-1.5">
                          <span className="inline-block w-14 py-1 rounded font-bold text-ink" style={{ backgroundColor: bg }}>
                            {c.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-muted-text leading-relaxed border-t border-line/30 pt-3">
            Pearson correlation of overlapping daily returns. Values near +1.00 move together — pairing them adds
            little diversification. Low or negative values hedge each other.
          </p>
        </div>

        {/* Fundamentals table */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
            Fundamentals Face-Off
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-muted-text">
                <tr className="text-left border-b border-line/30">
                  <th className="font-semibold py-2">Metric</th>
                  {tickers.map((t, i) => (
                    <th key={t} className="font-bold uppercase text-right" style={{ color: COLORS[i] }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {fundamentalsRows.map((row) => (
                  <tr key={row.label} className="hover:bg-line/20">
                    <td className="py-2 text-muted-text">{row.label}</td>
                    {tickers.map((t, i) => (
                      <td key={t} className={`text-right font-bold ${row.tone ? row.tone(i) : "text-ink"}`}>
                        {quoteQueries[i].isLoading ? "…" : row.get(i)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
