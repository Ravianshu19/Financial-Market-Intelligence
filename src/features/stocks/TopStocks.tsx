"use client";

import React, { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Flame, ArrowRight } from "lucide-react";
import { Caption } from "../india/common";

type Tier = "large" | "mid" | "small";

const TIERS: Record<"global" | "india", Record<Tier, string[]>> = {
  global: {
    large: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META"],
    mid: ["UBER", "PLTR", "SHOP", "SNAP", "ROKU", "DKNG"],
    small: ["SOFI", "IONQ", "RKLB", "UPST", "CHPT", "PTON"],
  },
  india: {
    large: ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "BHARTIARTL.NS"],
    mid: ["TATAPOWER.NS", "PERSISTENT.NS", "CUMMINSIND.NS", "ASHOKLEY.NS", "AUROPHARMA.NS", "FEDERALBNK.NS"],
    small: ["SUZLON.NS", "TRIDENT.NS", "HFCL.NS", "TANLA.NS", "IRCON.NS", "BSOFT.NS"],
  },
};

const TIER_META: Record<Tier, { label: string; desc: string; tone: string }> = {
  large: { label: "Large Cap", desc: "Giants — stability, dividends, slow-and-steady compounding", tone: "text-primary" },
  mid: { label: "Mid Cap", desc: "Growth phase — bigger swings, bigger upside than giants", tone: "text-amber" },
  small: { label: "Small Cap", desc: "Rocket fuel — highest growth potential, highest risk of blowups", tone: "text-danger" },
};

export default function TopStocks() {
  const { market, setSelectedSymbol, setActiveView } = useApp();
  const [tier, setTier] = useState<Tier>("large");

  const symbols = TIERS[market][tier];
  const quotes = useQueries({
    queries: symbols.map((t) => ({
      queryKey: ["tsQuote", t],
      queryFn: () => api.getQuote(t),
      refetchInterval: 120000,
      staleTime: 60000,
    })),
  });

  const cur = market === "india" ? "₹" : "$";
  const fmtCap = (mc?: number) => {
    if (!mc) return "—";
    if (market === "india") {
      return mc >= 1e12 ? `₹${(mc / 1e12).toFixed(1)}L Cr` : `₹${(mc / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
    }
    return mc >= 1e12 ? `$${(mc / 1e12).toFixed(2)}T` : mc >= 1e9 ? `$${(mc / 1e9).toFixed(1)}B` : `$${(mc / 1e6).toFixed(0)}M`;
  };

  return (
    <div className="space-y-6 font-mono">
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber" /> Top Stocks · {market === "india" ? "NSE" : "US Markets"} · by Market Cap
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            {(Object.keys(TIER_META) as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  tier === t ? "bg-line text-ink font-semibold" : "text-muted-text hover:text-ink hover:bg-line/40"
                }`}
              >
                {TIER_META[t].label}
              </button>
            ))}
          </div>
        </header>

        <p className={`text-[10px] ${TIER_META[tier].tone} font-semibold`}>{TIER_META[tier].desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {symbols.map((t, i) => {
            const q = quotes[i].data;
            const name = t.replace(".NS", "");
            const up = (q?.change_pct ?? 0) >= 0;
            return (
              <div key={t} className="card !bg-panel/40 border border-line/60 hover:border-primary/40 p-4 rounded-xl transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-ink text-[12px] font-bold uppercase">{name}</div>
                    <div className="text-[9px] text-muted-text truncate max-w-[150px]">{q?.name || "…"}</div>
                  </div>
                  {q && (
                    <span className={`chip text-[9px] px-1.5 py-0.5 rounded font-bold ${up ? "bg-secondary/10 text-secondary" : "bg-danger/10 text-danger"}`}>
                      {up ? "+" : ""}{q.change_pct.toFixed(2)}%
                    </span>
                  )}
                </div>

                {q ? (
                  <>
                    <div className="text-[17px] font-bold text-ink">
                      {cur}{q.price.toLocaleString(market === "india" ? "en-IN" : undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-text">
                      <span>MCap {fmtCap(q.market_cap)}</span>
                      <span>P/E {q.fundamentals?.pe_ttm?.toFixed(1) ?? "—"}</span>
                      <span>Vol {(q.volume / 1e6).toFixed(1)}M</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-muted-text py-3">loading…</div>
                )}

                <button
                  onClick={() => { setSelectedSymbol(t); setActiveView("stock"); }}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Analyze {name} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        <Caption>
          Market cap is a company&apos;s total price tag ({market === "india" ? "₹2L Cr means two lakh crore rupees" : "a $1T company is a trillion-dollar business"}).
          Large caps anchor a portfolio, mid caps grow it, small caps can multiply it — or halve it. Tap
          Analyze on any stock for the full AI workup: price forecast, technicals, and news sentiment.
        </Caption>
      </section>
    </div>
  );
}
