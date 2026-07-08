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
import { UP, DOWN, BLUE, AMBER, tooltipStyle, Caption, NSE_STOCKS } from "../india/common";

const NEUTRAL = "#7A7A8C";
const RACE = [
  { sym: "^NSEI", label: "NIFTY 50", color: BLUE },
  { sym: "GC=F", label: "Gold", color: AMBER },
  { sym: "BTC-USD", label: "Bitcoin", color: UP },
];

export default function IndiaInsights() {
  const { setSelectedSymbol, setActiveView } = useApp();

  const stockQueries = useQueries({
    queries: NSE_STOCKS.map((t) => ({ queryKey: ["inQuote", t], queryFn: () => api.getQuote(t), refetchInterval: 120000 })),
  });
  const { data: sentiment, isLoading: snLoading } = useQuery({
    queryKey: ["inSentiment", "^NSEI"],
    queryFn: () => api.getSentiment("^NSEI"),
    refetchInterval: 300000,
  });
  const raceQueries = useQueries({
    queries: RACE.map((s) => ({ queryKey: ["inRace", s.sym], queryFn: () => api.getHistory(s.sym, "3mo", "1d") })),
  });

  const quotesLoading = stockQueries.some((q) => q.isLoading);
  const quotes = stockQueries.map((q, i) => ({ ticker: NSE_STOCKS[i], q: q.data })).filter((x) => x.q);

  if (quotesLoading || snLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Painting the India market picture...
      </div>
    );
  }

  // ---- Breadth across tracked NSE large caps ----
  const advancers = quotes.filter((x) => (x.q!.change_pct ?? 0) > 0.05).length;
  const decliners = quotes.filter((x) => (x.q!.change_pct ?? 0) < -0.05).length;
  const flat = quotes.length - advancers - decliners;
  const breadthPct = quotes.length ? Math.round((advancers / quotes.length) * 100) : 0;

  // ---- Movers bars ----
  const moverBars = quotes
    .map((x) => ({ ticker: x.ticker.replace(".NS", ""), full: x.ticker, chg: +(x.q!.change_pct ?? 0).toFixed(2) }))
    .sort((a, b) => b.chg - a.chg);

  // ---- Race: NIFTY vs Gold vs Bitcoin (normalized) ----
  const raceLoading = raceQueries.some((q) => q.isLoading);
  const maps = raceQueries.map((q) => {
    const m = new Map<string, number>();
    q.data?.candles.forEach((c) => m.set(c.t, c.c));
    return m;
  });
  let raceData: Record<string, string | number>[] = [];
  if (!raceLoading && maps.every((m) => m.size > 1)) {
    const commonDates = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d)));
    if (commonDates.length > 1) {
      const bases = maps.map((m) => m.get(commonDates[0])!);
      raceData = commonDates.map((d) => {
        const row: Record<string, string | number> = { date: d };
        RACE.forEach((s, i) => {
          row[s.label] = +(((maps[i].get(d)! / bases[i]) - 1) * 100).toFixed(2);
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

  return (
    <div className="space-y-6 font-mono">
      {/* 1. BREADTH TILES + COMPOSITION BAR */}
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <Gauge className="h-3.5 w-3.5 text-primary" /> India Market Health · {quotes.length} NSE large-caps tracked
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

        <div className="space-y-1.5">
          <div className="flex h-6 w-full rounded-md overflow-hidden gap-0.5">
            {advancers > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-bg" style={{ width: `${(advancers / quotes.length) * 100}%`, backgroundColor: UP }}>
                {advancers}
              </div>
            )}
            {flat > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-ink" style={{ width: `${(flat / quotes.length) * 100}%`, backgroundColor: "#1F1F2B" }}>
                {flat}
              </div>
            )}
            {decliners > 0 && (
              <div className="flex items-center justify-center text-[9px] font-bold text-bg" style={{ width: `${(decliners / quotes.length) * 100}%`, backgroundColor: DOWN }}>
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
          This bar splits the NIFTY heavyweights into rising, flat, and falling. Broad green means the rally
          has legs; if the index is up but this bar is mostly red, a few giants are carrying everyone.
        </Caption>
      </section>

      {/* 2. BLUECHIP MOVES + NEWS MOOD */}
      <section className="grid grid-cols-12 gap-6">
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" /> Bluechip Moves Today
          </header>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moverBars} layout="vertical" margin={{ left: 10, right: 42, top: 5, bottom: 0 }}>
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="ticker" width={78} tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 10, fontFamily: "DM Mono", fontWeight: 700 }} />
                <Tooltip {...tooltipStyle} formatter={(v) => { const n = Number(v); return [`${n >= 0 ? "+" : ""}${n}%`, "Change today"]; }} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                <ReferenceLine x={0} stroke="#1F1F2B" />
                <Bar dataKey="chg" radius={[0, 4, 4, 0]} barSize={14} onClick={(d) => { const t = (d as { full?: string }).full; if (t) { setSelectedSymbol(t); setActiveView("stock"); } }} className="cursor-pointer">
                  {moverBars.map((m) => (
                    <Cell key={m.ticker} fill={m.chg >= 0 ? UP : DOWN} />
                  ))}
                  <LabelList dataKey="chg" position="right" formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }} style={{ fill: "#E7E7F0", fontSize: 9, fontFamily: "DM Mono", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Caption>
            Green bars gained today, red bars fell — longer means bigger. Click any bar to open that
            stock&apos;s full analysis with forecasts and technicals.
          </Caption>
        </div>

        {/* News mood donut */}
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-3">
          <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
            <Newspaper className="h-3.5 w-3.5 text-primary" /> India News Mood (FinBERT AI)
          </header>

          {donutData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-text text-xs text-center px-6">
              No India market headlines scored in the last 24h — sentiment resumes with the news cycle.
            </div>
          ) : (
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
                  AI scores the tone of NIFTY-related headlines. Score:{" "}
                  <span className="text-ink font-bold">{(sentiment?.score ?? 0) >= 0 ? "+" : ""}{(sentiment?.score ?? 0).toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          <Caption>
            The ring shows what share of the last 24h of India market news reads good, bad, or neutral.
            A mostly-green ring supports buying; mostly red says be careful this week.
          </Caption>
        </div>
      </section>

      {/* 3. NIFTY vs GOLD vs BITCOIN */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <LineChartIcon className="h-3.5 w-3.5 text-amber" /> Where Should Money Sit? · NIFTY vs Gold vs Bitcoin — 3 months
        </header>

        {raceLoading ? (
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
                {RACE.map((s) => (
                  <Line key={s.sym} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <Caption>
          The three places Indian savings usually go — stocks, gold, and (increasingly) crypto — all rebased
          to 0% three months ago. The highest line grew your money the most; the gap between them shows what
          picking the &quot;wrong&quot; asset costs.
        </Caption>
      </section>
    </div>
  );
}
