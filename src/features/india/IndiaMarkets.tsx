"use client";

import React, { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LabelList,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { IndianRupee, Rocket, Layers, PiggyBank, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

const UP = "#00D4AA";
const DOWN = "#E05555";
const BLUE = "#4D9FFF";
const AMBER = "#F5A524";

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

function EdgeChip() {
  return (
    <span className="chip bg-amber/10 text-amber border border-amber/20 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
      Quantra Edge · most apps hide this
    </span>
  );
}

// ---------------- Curated datasets (illustrative, July 2026) ----------------
const NSE_STOCKS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS", "TATAMOTORS.NS"];

const MUTUAL_FUNDS = [
  { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap", nav: 92.4, cagr5y: 21.8, expDirect: 0.63, expRegular: 1.33, rating: 5 },
  { name: "Quant Small Cap", cat: "Small Cap", nav: 284.1, cagr5y: 31.2, expDirect: 0.77, expRegular: 1.78, rating: 5 },
  { name: "HDFC Mid-Cap Opportunities", cat: "Mid Cap", nav: 212.7, cagr5y: 26.4, expDirect: 0.74, expRegular: 1.42, rating: 4 },
  { name: "Axis ELSS Tax Saver", cat: "ELSS", nav: 108.3, cagr5y: 14.9, expDirect: 0.96, expRegular: 1.55, rating: 3 },
  { name: "SBI Bluechip", cat: "Large Cap", nav: 96.8, cagr5y: 17.2, expDirect: 0.86, expRegular: 1.49, rating: 4 },
  { name: "UTI Nifty 50 Index", cat: "Index", nav: 178.5, cagr5y: 16.1, expDirect: 0.17, expRegular: 0.30, rating: 4 },
];

// Pairwise portfolio overlap %, symmetric (top holdings in common, weight-adjusted)
const OVERLAP_FUNDS = ["Parag Parikh", "SBI Bluechip", "UTI Nifty 50", "HDFC Mid-Cap", "Quant Small"];
const OVERLAP = [
  [100, 34, 31, 9, 4],
  [34, 100, 72, 12, 3],
  [31, 72, 100, 8, 2],
  [9, 12, 8, 100, 18],
  [4, 3, 2, 18, 100],
];

const ETFS = [
  { name: "Nippon India Nifty BeES", tracks: "NIFTY 50", exp: 0.04, aum: "₹42,800 Cr", note: "Most liquid equity ETF" },
  { name: "SBI Nifty 50 ETF", tracks: "NIFTY 50", exp: 0.04, aum: "₹2.1L Cr", note: "Largest by AUM (EPFO money)" },
  { name: "Nippon India Gold BeES", tracks: "Gold", exp: 0.82, aum: "₹18,400 Cr", note: "Digital gold without lockers" },
  { name: "Bharat Bond ETF 2033", tracks: "PSU Bonds", exp: 0.0005, aum: "₹12,100 Cr", note: "Near-zero fee debt" },
  { name: "Motilal Nasdaq 100 ETF", tracks: "NASDAQ 100", exp: 0.58, aum: "₹9,600 Cr", note: "US tech from India" },
];

const IPOS = [
  { name: "Reliance Jio Platforms", status: "Upcoming", band: "₹1,215–1,280", gmp: 22, sub: null, listedGain: null, sinceIssue: null, date: "Aug 2026" },
  { name: "PhonePe", status: "Open", band: "₹745–786", gmp: 31, sub: 18.4, listedGain: null, sinceIssue: null, date: "Closes Jul 11" },
  { name: "Zepto", status: "Upcoming", band: "₹310–328", gmp: 12, sub: null, listedGain: null, sinceIssue: null, date: "Sep 2026" },
  { name: "Lenskart", status: "Listed", band: "₹382", gmp: null, sub: 28.3, listedGain: 33.1, sinceIssue: -4.2, date: "Nov 2025" },
  { name: "Groww (Billionbrains)", status: "Listed", band: "₹100", gmp: null, sub: 17.8, listedGain: 12.4, sinceIssue: 41.6, date: "Nov 2025" },
  { name: "Tata Capital", status: "Listed", band: "₹326", gmp: null, sub: 1.95, listedGain: 1.2, sinceIssue: -8.9, date: "Oct 2025" },
];

// SIP fee-eater: ₹10,000/month for 15 years, 12% gross return
function sipSeries(grossPct: number, expensePct: number) {
  const monthly = 10000;
  const i = Math.pow(1 + (grossPct - expensePct) / 100, 1 / 12) - 1;
  const out: number[] = [];
  let fv = 0;
  for (let m = 1; m <= 180; m++) {
    fv = (fv + monthly) * (1 + i);
    if (m % 12 === 0) out.push(Math.round(fv));
  }
  return out;
}

const fmtL = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

export default function IndiaMarkets() {
  const { setSelectedSymbol, setActiveView } = useApp();
  const [fundTab, setFundTab] = useState<"returns" | "fees" | "overlap">("returns");

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

  // Fee-eater series
  const direct = sipSeries(12, 0.5);
  const regular = sipSeries(12, 1.8);
  const feeData = direct.map((v, idx) => ({ year: `Y${idx + 1}`, "Direct plan": v, "Regular plan": regular[idx] }));
  const feeGap = direct[direct.length - 1] - regular[regular.length - 1];

  const fundBars = [...MUTUAL_FUNDS].sort((a, b) => b.cagr5y - a.cagr5y).map((f) => ({ name: f.name, cagr: f.cagr5y }));

  const pct = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";

  return (
    <div className="space-y-6 font-mono">
      {/* 1. HERO: INDICES + WHAT'S DIFFERENT */}
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-primary" /> India Markets · NSE / BSE
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
                  {pct(q.change_pct)} today
                </div>
              )}
            </div>
          ))}
          <div className="card col-span-2 !bg-panel/40 border border-amber/20 p-3.5 rounded-xl">
            <div className="text-amber text-[9px] uppercase font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> What today&apos;s apps don&apos;t show you
            </div>
            <ul className="text-[9px] text-muted-text mt-1.5 space-y-0.5 leading-relaxed">
              <li>· The <span className="text-ink font-bold">₹ cost of fund fees</span> compounded over years — not a % footnote</li>
              <li>· <span className="text-ink font-bold">Overlap between your funds</span> — 2 funds ≠ 2× diversification</li>
              <li>· <span className="text-ink font-bold">IPO hype vs reality</span> — GMP buzz next to what listing actually returned</li>
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
                    <div className={`text-[10px] font-bold ${q.change_pct >= 0 ? "text-secondary" : "text-danger"}`}>{pct(q.change_pct)}</div>
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

      {/* 3. MUTUAL FUNDS with tabs: returns / fee-eater / overlap */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <PiggyBank className="h-3.5 w-3.5 text-secondary" /> Mutual Funds
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            {([["returns", "5Y Returns"], ["fees", "True Cost of Fees"], ["overlap", "Overlap X-Ray"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFundTab(id)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  fundTab === id ? "bg-line text-ink font-semibold" : "text-muted-text hover:text-ink hover:bg-line/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {fundTab === "returns" && (
          <>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundBars} layout="vertical" margin={{ left: 10, right: 48, top: 5, bottom: 0 }}>
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <YAxis type="category" dataKey="name" width={172} tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 9.5, fontFamily: "DM Mono" }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}% per year (5Y CAGR)`, ""]} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                  <Bar dataKey="cagr" fill={BLUE} radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="cagr" position="right" formatter={(v) => `${v}%`} style={{ fill: "#E7E7F0", fontSize: 9, fontFamily: "DM Mono", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-text border-b border-line/40">
                  <tr className="text-left">
                    <th className="font-semibold py-1.5">Fund</th>
                    <th className="font-semibold">Category</th>
                    <th className="font-semibold text-right">NAV</th>
                    <th className="font-semibold text-right">Expense (Direct)</th>
                    <th className="font-semibold text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/20">
                  {MUTUAL_FUNDS.map((f) => (
                    <tr key={f.name} className="hover:bg-line/20">
                      <td className="py-1.5 text-ink font-bold">{f.name}</td>
                      <td className="text-muted-text">{f.cat}</td>
                      <td className="text-right text-ink">₹{f.nav.toFixed(1)}</td>
                      <td className="text-right text-ink">{f.expDirect.toFixed(2)}%</td>
                      <td className="text-right text-amber">{"★".repeat(f.rating)}<span className="text-line">{"★".repeat(5 - f.rating)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              5Y CAGR means yearly average growth over five years — 20% CAGR roughly turns ₹1L into ₹2.5L.
              Past returns don&apos;t repeat on schedule; pair them with the fee and overlap tabs before choosing. Illustrative data.
            </Caption>
          </>
        )}

        {fundTab === "fees" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EdgeChip />
              <span className="text-[10px] text-muted-text">₹10,000/month SIP · 15 years · 12% gross return</span>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feeData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => fmtL(Number(v))} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => fmtL(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                  <Line type="monotone" dataKey="Direct plan" stroke={UP} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Regular plan" stroke={AMBER} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <span className="text-muted-text">
                Same fund, same market — the regular plan&apos;s extra ~1.3% commission quietly eats{" "}
                <span className="text-danger font-bold">{fmtL(feeGap)}</span> of your money over 15 years.
              </span>
            </div>
            <Caption>
              Every fund has a Direct plan (you buy it yourself, low fee) and a Regular plan (a distributor
              sells it to you, higher fee). Apps that earn commissions rarely show this gap in rupees. This is why.
            </Caption>
          </>
        )}

        {fundTab === "overlap" && (
          <>
            <EdgeChip />
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center">
                <thead>
                  <tr>
                    <th />
                    {OVERLAP_FUNDS.map((f) => (
                      <th key={f} className="font-bold text-muted-text pb-2 px-1">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OVERLAP_FUNDS.map((f, i) => (
                    <tr key={f}>
                      <td className="font-bold text-muted-text text-left py-1 pr-2 whitespace-nowrap">{f}</td>
                      {OVERLAP[i].map((v, j) => (
                        <td key={j} className="p-1">
                          <span
                            className="inline-block w-14 py-1.5 rounded font-bold text-ink"
                            style={{ backgroundColor: i === j ? "rgba(122,122,140,0.12)" : `rgba(224,85,85,${(v / 100) * 0.8})` }}
                          >
                            {i === j ? "—" : `${v}%`}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <span className="text-muted-text">
                SBI Bluechip and UTI Nifty 50 overlap <span className="text-danger font-bold">72%</span> — holding
                both is paying two fees for nearly one portfolio.
              </span>
            </div>
            <Caption>
              Each cell shows how much two funds&apos; holdings are the same. Deeper red = more duplication.
              Under ~30% is genuine diversification; above ~60% you own the same stocks twice. Illustrative data.
            </Caption>
          </>
        )}
      </section>

      {/* 4. ETFs */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <Layers className="h-3.5 w-3.5 text-primary" /> ETFs · Index Investing on the Exchange
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-muted-text border-b border-line/40">
              <tr className="text-left">
                <th className="font-semibold py-1.5">ETF</th>
                <th className="font-semibold">Tracks</th>
                <th className="font-semibold text-right">Expense</th>
                <th className="font-semibold text-right">AUM</th>
                <th className="font-semibold text-right">Why it matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {ETFS.map((e) => (
                <tr key={e.name} className="hover:bg-line/20">
                  <td className="py-2 text-ink font-bold">{e.name}</td>
                  <td className="text-muted-text">{e.tracks}</td>
                  <td className="text-right">
                    <span className={`font-bold ${e.exp <= 0.1 ? "text-secondary" : e.exp <= 0.6 ? "text-ink" : "text-amber"}`}>
                      {e.exp < 0.01 ? "0.0005%" : `${e.exp.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="text-right text-ink">{e.aum}</td>
                  <td className="text-right text-muted-text">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Caption>
          An ETF is a mutual fund you trade like a stock. The expense column is the whole story: green means
          the fund keeps almost nothing of your return — a NIFTY ETF at 0.04% beats most active funds at 1%+ after fees.
        </Caption>
      </section>

      {/* 5. IPO DESK: pipeline + hype vs reality */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Rocket className="h-3.5 w-3.5 text-amber" /> IPO Desk
          </div>
          <EdgeChip />
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-muted-text border-b border-line/40">
              <tr className="text-left">
                <th className="font-semibold py-1.5">Company</th>
                <th className="font-semibold">Status</th>
                <th className="font-semibold">Price / Band</th>
                <th className="font-semibold text-right">GMP (hype)</th>
                <th className="font-semibold text-right">Subscribed</th>
                <th className="font-semibold text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {IPOS.map((ipo) => (
                <tr key={ipo.name} className="hover:bg-line/20">
                  <td className="py-2 text-ink font-bold">{ipo.name}</td>
                  <td>
                    <span className={`chip text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      ipo.status === "Open"
                        ? "bg-secondary/10 text-secondary border-secondary/20"
                        : ipo.status === "Upcoming"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-line text-muted-text border-line"
                    }`}>
                      {ipo.status}
                    </span>
                  </td>
                  <td className="text-ink">{ipo.band}</td>
                  <td className="text-right">{ipo.gmp !== null ? <span className="text-amber font-bold">+{ipo.gmp}%</span> : <span className="text-muted-text">—</span>}</td>
                  <td className="text-right text-ink">{ipo.sub !== null ? `${ipo.sub}×` : "—"}</td>
                  <td className="text-right text-muted-text">{ipo.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hype vs reality for listed IPOs */}
        <div className="pt-2">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest mb-2">
            Hype vs Reality · recent listings
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={IPOS.filter((i) => i.status === "Listed").map((i) => ({ name: i.name.split(" ")[0], "Listing-day pop": i.listedGain, "Return since issue": i.sinceIssue }))}
                margin={{ left: -5, right: 10, top: 5, bottom: 0 }}
                barGap={2}
              >
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 10, fontFamily: "DM Mono", fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <Tooltip {...tooltipStyle} formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                <ReferenceLine y={0} stroke="#1F1F2B" />
                <Bar dataKey="Listing-day pop" fill={BLUE} radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="Return since issue" fill={AMBER} radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Caption>
          GMP (grey market premium) is the pre-listing hype number every IPO app headlines. The blue-vs-amber
          pairs show why it misleads: Lenskart popped +33% on day one but trades below issue price now, while
          &quot;boring&quot; Groww quietly compounded +42%. Hype tells you about day one; only the amber bar is your actual return. Illustrative data.
        </Caption>
      </section>
    </div>
  );
}
