"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Sparkles } from "lucide-react";

function Hi({ children, tone = "ink" }: { children: React.ReactNode; tone?: "up" | "down" | "ink" | "primary" }) {
  const cls =
    tone === "up" ? "text-secondary font-bold" :
    tone === "down" ? "text-danger font-bold" :
    tone === "primary" ? "text-primary font-bold" :
    "text-ink font-bold";
  return <span className={cls}>{children}</span>;
}

export default function MorningBriefing() {
  // Same queryKeys as MarketOverview — React Query dedupes, so no extra requests
  const { data: indexHistory } = useQuery({
    queryKey: ["indexHistory"],
    queryFn: () => api.getHistory("^GSPC", "6mo", "1d"),
    refetchInterval: 300000,
  });
  const { data: movers } = useQuery({
    queryKey: ["movers"],
    queryFn: () => api.getMovers(5),
    refetchInterval: 120000,
  });
  const { data: heatmapData } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => api.getHeatmap(),
    refetchInterval: 120000,
  });
  const { data: sentiment } = useQuery({
    queryKey: ["marketSentiment"],
    queryFn: () => api.getSentiment("^GSPC"),
    refetchInterval: 300000,
  });

  const ready = indexHistory && movers && heatmapData && sentiment;

  if (!ready) {
    return (
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
        <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Morning Briefing
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-2.5 bg-line rounded w-11/12" />
          <div className="h-2.5 bg-line rounded w-9/12" />
          <div className="h-2.5 bg-line rounded w-10/12" />
        </div>
      </section>
    );
  }

  // ---- Derive briefing inputs ----
  const candles = indexHistory.candles;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const spx = last?.c ?? 0;
  const spxChgPct = prev ? ((spx - prev.c) / prev.c) * 100 : 0;
  const spxUp = spxChgPct >= 0;

  const items = heatmapData.items;
  const advancers = items.filter((i) => i.change_pct >= 0).length;
  const breadthPct = items.length ? Math.round((advancers / items.length) * 100) : 0;
  const breadthWord = breadthPct >= 65 ? "broadly constructive" : breadthPct >= 45 ? "mixed" : "defensive";

  const topGainer = movers.gainers[0];
  const secondGainer = movers.gainers[1];
  const topLoser = movers.losers[0];

  const dist = sentiment.sentiment_distribution;
  const mood = sentiment.label;
  const moodTone = mood === "positive" ? "up" : mood === "negative" ? "down" : "primary";
  const posture =
    mood === "positive" && breadthPct >= 55
      ? "Conditions favor selective risk-taking; momentum names remain in charge."
      : mood === "negative" || breadthPct < 40
        ? "Caution is warranted; consider trimming beta and tightening stops."
        : "A stock picker's tape — stay balanced and let signals confirm before adding exposure.";

  const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4 font-mono relative overflow-hidden">
      <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
        <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Morning Briefing · Generated {now}
        </div>
        <div className="flex items-center gap-1.5 text-[9px]">
          <span className={`chip px-2 py-0.5 rounded-full font-bold border ${spxUp ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-danger/10 text-danger border-danger/20"}`}>
            SPX {pct(spxChgPct)}
          </span>
          <span className="chip px-2 py-0.5 rounded-full font-bold border bg-primary/10 text-primary border-primary/20">
            Breadth {breadthPct}%↑
          </span>
          <span className={`chip px-2 py-0.5 rounded-full font-bold border uppercase ${
            mood === "positive" ? "bg-secondary/10 text-secondary border-secondary/20" :
            mood === "negative" ? "bg-danger/10 text-danger border-danger/20" :
            "bg-primary/10 text-primary border-primary/20"}`}>
            Mood: {mood}
          </span>
        </div>
      </header>

      <div className="space-y-3 text-[11px] leading-relaxed text-muted-text max-w-[880px]">
        <p>
          U.S. equities are trading <Hi tone={spxUp ? "up" : "down"}>{spxUp ? "higher" : "lower"}</Hi>{" "}
          with the S&amp;P 500 at <Hi>{fmt(spx)}</Hi> (<Hi tone={spxUp ? "up" : "down"}>{pct(spxChgPct)}</Hi>).
          Market breadth is <Hi tone="primary">{breadthWord}</Hi> — <Hi>{advancers}</Hi> of <Hi>{items.length}</Hi>{" "}
          tracked large-caps are advancing ({breadthPct}% upside participation).
        </p>
        {topGainer && topLoser && (
          <p>
            Leadership belongs to <Hi tone="up">{topGainer.ticker}</Hi> (<Hi tone="up">{pct(topGainer.change_pct)}</Hi>)
            {secondGainer && <> followed by <Hi tone="up">{secondGainer.ticker}</Hi> (<Hi tone="up">{pct(secondGainer.change_pct)}</Hi>)</>},
            while <Hi tone="down">{topLoser.ticker}</Hi> lags the basket at <Hi tone="down">{pct(topLoser.change_pct)}</Hi> on{" "}
            <Hi>{(topLoser.volume / 1e6).toFixed(1)}M</Hi> shares — worth watching for capitulation or continuation.
          </p>
        )}
        <p>
          FinBERT reads the overnight news flow as <Hi tone={moodTone as "up" | "down" | "primary"}>{mood.toUpperCase()}</Hi>{" "}
          (score {sentiment.score >= 0 ? "+" : ""}{sentiment.score.toFixed(2)}), with headlines splitting{" "}
          <Hi tone="up">{Math.round(dist.positive)}%</Hi> positive / <Hi>{Math.round(dist.neutral)}%</Hi> neutral /{" "}
          <Hi tone="down">{Math.round(dist.negative)}%</Hi> negative. {posture}
        </p>
      </div>

      <div className="text-[9px] text-muted-text/70 border-t border-line/40 pt-2.5">
        Synthesized from live movers, heatmap breadth, and FinBERT sentiment · quantra-brief-v2 · Not investment advice
      </div>
    </section>
  );
}
