"use client";

import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, RefreshCw, Newspaper, Gauge, LineChart as LineChartIcon } from "lucide-react";

const UP = "#00D4AA";
const DOWN = "#E05555";
const NEUTRAL = "#7A7A8C";
const INDEX_COLORS = ["#4D9FFF", "#00D4AA", "#F5A524"]; // fixed order: S&P 500, NASDAQ 100, Bitcoin
const INDEX_SYMBOLS = [
  { sym: "^GSPC", label: "S&P 500" },
  { sym: "^NDX", label: "NASDAQ 100" },
  { sym: "BTC-USD", label: "Bitcoin" },
];

const tooltipStyle = {
  contentStyle: { backgroundColor: "#0E0E15", borderColor: "#1F1F2B", borderRadius: "8px" },
  labelStyle: { color: "#7A7A8C", fontSize: "10px", fontFamily: "DM Mono" },
  itemStyle: { color: "#E7E7F0", fontSize: "11px", fontFamily: "DM Mono" },
};

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-muted-text leading-relaxed border-t border-line/30 pt-3">
      <span className="text-primary font-bold uppercase">How to read this · </span>
      {children}
    </p>
  );
}

export default function MarketInsights() {
  const { setSelectedSymbol, setActiveView } = useApp();

  const { data: heatmap, isLoading: hmLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => api.getHeatmap(),
    refetchInterval: 120000,
  });
  const { data: movers, isLoading: mvLoading } = useQuery({
    queryKey: ["movers"],
    queryFn: () => api.getMovers(5),
    refetchInterval: 120000,
  });
  const { data: sentiment, isLoading: snLoading } = useQuery({
    queryKey: ["marketSentiment"],
    queryFn: () => api.getSentiment("^GSPC"),
    refetchInterval: 300000,
  });
  const indexQueries = useQueries({
    queries: INDEX_SYMBOLS.map((s) => ({
      queryKey: ["insHistory", s.sym],
      queryFn: () => api.getHistory(s.sym, "3mo", "1d"),
    })),
  });

  if (hmLoading || mvLoading || snLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Painting the market picture...
      </div>
    );
  }

  // ---- Breadth ----
  const items = heatmap?.items ?? [];
  const advancers = items.filter((i) => i.change_pct > 0.05).length;
  const decliners = items.filter((i) => i.change_pct < -0.05).length;
  const flat = items.length - advancers - decliners;
  const breadthPct = items.length ? Math.round((advancers / items.length) * 100) : 0;

  // ---- Movers diverging bar data ----
  const moverBars = [...(movers?.gainers ?? []), ...(movers?.losers ?? [])]
    .sort((a, b) => b.change_pct - a.change_pct)
    .map((m) => ({ ticker: m.ticker, chg: +m.change_pct.toFixed(2) }));

  // ---- Index race (normalized to 0% at period start) ----
  const seriesMaps = indexQueries.map((q) => {
    const m = new Map<string, number>();
    q.data?.candles.forEach((c) => m.set(c.t, c.c));
    return m;
  });
  const indicesLoading = indexQueries.some((q) => q.isLoading);
  let raceData: Record<string, string | number>[] = [];
  if (!indicesLoading && seriesMaps.every((m) => m.size > 1)) {
    const commonDates = [...seriesMaps[0].keys()].filter((d) => seriesMaps.every((m) => m.has(d)));
    if (commonDates.length > 1) {
      const bases = seriesMaps.map((m) => m.get(commonDates[0])!);
      raceData = commonDates.map((d) => {
        const row: Record<string, string | number> = { date: d };
        INDEX_SYMBOLS.forEach((s, i) => {
          row[s.label] = +(((seriesMaps[i].get(d)! / bases[i]) - 1) * 100).toFixed(2);
        });
        return row;
      });
    }
  }

  // ---- Sentiment donut ----
  const dist = sentiment?.sentiment_distribution;
  const donutData = dist
    ? [
        { name: "Positive", value: Math.round(dist.positive), color: UP },
        { name: "Neutral", value: Math.round(dist.neutral), color: NEUTRAL },
        { name: "Negative", value: Math.round(dist.negative), color: DOWN },
      ]
    : [];

  const pct = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";

  return (
    <div className="space-y-6 font-mono">
      {/* 1. BREADTH STAT TILES + COMPOSITION BAR */}
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <Gauge className="h-3.5 w-3.5 text-primary" /> Market Health Today · {items.length} large-caps tracked
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { k: "Rising", v: advancers, c: "text-secondary", s: "stocks up today ▲" },
            { k: "Falling", v: decliners, c: "text-danger", s: "stocks down today ▼" },
            { k: "Flat", v: flat, c: "text-ink", s: "little or no change" },
            { k: "Breadth", v: `${breadthPct}%`, c: breadthPct >= 50 ? "text-secondary" : "text-danger", s: "share of stocks rising" },
          ].map((t) => (
            <div key={t.k} className="card !bg-panel/40 border border-line/60 p-3.5 rounded-xl">
              <div className="text-muted-text text-[9px] uppercase font-bold">{t.k}</div>
              <div className={`text-[24px] font-bold tracking-tight mt-0.5 ${t.c}`}>{t.v}</div>
              <div className="text-[9px] text-muted-text">{t.s}</div>
            </div>
          ))}
        </div>

        {/* Composition bar */}
        <div className="space-y-1.5">
          <div className="flex h-6 w-full rounded-md overflow-hidden gap-0.5">
            {advancers > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-bg" style={{ width: `${(advancers / items.length) * 100}%`, backgroundColor: UP }}>
                {advancers}
              </div>
            )}
            {flat > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-ink" style={{ width: `${(flat / items.length) * 100}%`, backgroundColor: "#1F1F2B" }}>
                {flat}
              </div>
            )}
            {decliners > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-bg" style={{ width: `${(decliners / items.length) * 100}%`, backgroundColor: DOWN }}>
                {decliners}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-[9px] text-muted-text">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: UP }} /> Rising</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-line" /> Flat</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: DOWN }} /> Falling</span>
          </div>
        </div>

        <Caption>
          This bar splits today&apos;s market into rising, flat, and falling stocks. When the green part dominates,
          gains are broad and healthy; when a few big names rise but this bar stays red, the rally is fragile.
        </Caption>
      </section>

      {/* 2. TODAY'S BIGGEST MOVES — diverging bars */}
      <section className="grid grid-cols-12 gap-6">
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" /> Today&apos;s Biggest Moves
          </header>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moverBars} layout="vertical" margin={{ left: 10, right: 42, top: 5, bottom: 0 }}>
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="ticker" width={48} tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 10, fontFamily: "DM Mono", fontWeight: 700 }} />
                <Tooltip {...tooltipStyle} formatter={(v) => { const n = Number(v); return [`${n >= 0 ? "+" : ""}${n}%`, "Change today"]; }} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                <ReferenceLine x={0} stroke="#1F1F2B" />
                <Bar dataKey="chg" radius={[0, 4, 4, 0]} barSize={16} onClick={(d) => { const t = (d as { ticker?: string }).ticker; if (t) { setSelectedSymbol(t); setActiveView("stock"); } }} className="cursor-pointer">
                  {moverBars.map((m) => (
                    <Cell key={m.ticker} fill={m.chg >= 0 ? UP : DOWN} />
                  ))}
                  <LabelList dataKey="chg" position="right" formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }} style={{ fill: "#E7E7F0", fontSize: 9, fontFamily: "DM Mono", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Caption>
            Bars pointing right (green) are today&apos;s strongest gainers; bars pointing left (red) fell hardest.
            Longer bar = bigger move. Click any bar to open that stock&apos;s full analysis.
          </Caption>
        </div>

        {/* 3. NEWS MOOD DONUT */}
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
            <Newspaper className="h-3.5 w-3.5 text-primary" /> News Mood (FinBERT AI)
          </header>

          <div className="flex items-center gap-6">
            <div className="relative h-[190px] w-[190px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={58} outerRadius={85} paddingAngle={3} dataKey="value" stroke="#14141C" strokeWidth={2}>
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}% of headlines`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-[15px] font-bold uppercase ${
                  sentiment?.label === "positive" ? "text-secondary" : sentiment?.label === "negative" ? "text-danger" : "text-ink"
                }`}>
                  {sentiment?.label ?? "—"}
                </span>
                <span className="text-[9px] text-muted-text">overall mood</span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1 text-[11px]">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-text flex-1">{d.name} headlines</span>
                  <span className="text-ink font-bold">{d.value}%</span>
                </div>
              ))}
              <p className="text-[9px] text-muted-text leading-relaxed pt-1">
                AI reads every incoming financial headline and scores its tone. Score:{" "}
                <span className="text-ink font-bold">{(sentiment?.score ?? 0) >= 0 ? "+" : ""}{(sentiment?.score ?? 0).toFixed(2)}</span>
              </p>
            </div>
          </div>

          <Caption>
            The ring shows what fraction of the last 24h of market news reads as good, bad, or neutral.
            A mostly-green ring means the news flow supports buying; mostly red warns of trouble ahead.
          </Caption>
        </div>
      </section>

      {/* 4. INDEX RACE */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <LineChartIcon className="h-3.5 w-3.5 text-amber" /> The Race · Stocks vs Tech vs Crypto — last 3 months
        </header>

        {indicesLoading ? (
          <div className="h-[280px] flex items-center justify-center text-muted-text text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Lining up the runners...
          </div>
        ) : raceData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-text text-xs">
            Not enough overlapping history to draw the race.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={raceData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <Tooltip {...tooltipStyle} formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                <ReferenceLine y={0} stroke="#1F1F2B" strokeDasharray="4 4" />
                {INDEX_SYMBOLS.map((s, i) => (
                  <Line key={s.sym} type="monotone" dataKey={s.label} stroke={INDEX_COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <Caption>
          All three start at 0% three months ago, so you can compare them fairly even though a Bitcoin costs
          $100k+ and an index point doesn&apos;t. Whichever line is highest has grown your money the most since then.
        </Caption>
      </section>
    </div>
  );
}
