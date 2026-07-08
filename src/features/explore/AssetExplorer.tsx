"use client";

import React, { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Database, Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Caption } from "../india/common";

type Tab = "stocks" | "etfs" | "funds";
const PAGE_SIZE = 12;

// ---------------- Universes (metadata static; prices fetched live) ----------------
const IN_STOCKS: { t: string; name: string; sector: string }[] = [
  { t: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy" },
  { t: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { t: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { t: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { t: "INFY.NS", name: "Infosys", sector: "IT" },
  { t: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { t: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { t: "ITC.NS", name: "ITC", sector: "FMCG" },
  { t: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { t: "LT.NS", name: "Larsen & Toubro", sector: "Infra" },
  { t: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "NBFC" },
  { t: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { t: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { t: "SUNPHARMA.NS", name: "Sun Pharma", sector: "Pharma" },
  { t: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { t: "TITAN.NS", name: "Titan Company", sector: "Consumer" },
  { t: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement" },
  { t: "NTPC.NS", name: "NTPC", sector: "Power" },
  { t: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { t: "ONGC.NS", name: "ONGC", sector: "Energy" },
  { t: "ADANIENT.NS", name: "Adani Enterprises", sector: "Conglomerate" },
  { t: "ADANIPORTS.NS", name: "Adani Ports", sector: "Infra" },
  { t: "POWERGRID.NS", name: "Power Grid Corp", sector: "Power" },
  { t: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto" },
  { t: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { t: "COALINDIA.NS", name: "Coal India", sector: "Mining" },
  { t: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals" },
  { t: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals" },
  { t: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG" },
  { t: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer" },
  { t: "TECHM.NS", name: "Tech Mahindra", sector: "IT" },
  { t: "DRREDDY.NS", name: "Dr. Reddy's Labs", sector: "Pharma" },
  { t: "HINDALCO.NS", name: "Hindalco", sector: "Metals" },
  { t: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto" },
  { t: "EICHERMOT.NS", name: "Eicher Motors", sector: "Auto" },
  { t: "CIPLA.NS", name: "Cipla", sector: "Pharma" },
  { t: "BRITANNIA.NS", name: "Britannia", sector: "FMCG" },
  { t: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Healthcare" },
  { t: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto" },
  { t: "BPCL.NS", name: "BPCL", sector: "Energy" },
  { t: "TATAPOWER.NS", name: "Tata Power", sector: "Power" },
  { t: "ZOMATO.NS", name: "Zomato (Eternal)", sector: "New Age" },
  { t: "PAYTM.NS", name: "Paytm (One97)", sector: "New Age" },
  { t: "SUZLON.NS", name: "Suzlon Energy", sector: "Renewables" },
  { t: "IRCTC.NS", name: "IRCTC", sector: "Travel" },
  { t: "PERSISTENT.NS", name: "Persistent Systems", sector: "IT" },
  { t: "HAL.NS", name: "Hindustan Aeronautics", sector: "Defence" },
  { t: "BEL.NS", name: "Bharat Electronics", sector: "Defence" },
];

const IN_ETFS: { t: string; name: string; tracks: string; exp: number }[] = [
  { t: "NIFTYBEES.NS", name: "Nippon India Nifty BeES", tracks: "NIFTY 50", exp: 0.04 },
  { t: "SETFNIF50.NS", name: "SBI Nifty 50 ETF", tracks: "NIFTY 50", exp: 0.04 },
  { t: "JUNIORBEES.NS", name: "Nippon Nifty Next 50 BeES", tracks: "NIFTY Next 50", exp: 0.17 },
  { t: "BANKBEES.NS", name: "Nippon Bank BeES", tracks: "NIFTY Bank", exp: 0.19 },
  { t: "GOLDBEES.NS", name: "Nippon Gold BeES", tracks: "Gold", exp: 0.82 },
  { t: "SILVERBEES.NS", name: "Nippon Silver BeES", tracks: "Silver", exp: 0.51 },
  { t: "MON100.NS", name: "Motilal Nasdaq 100 ETF", tracks: "NASDAQ 100", exp: 0.58 },
  { t: "ITBEES.NS", name: "Nippon IT BeES", tracks: "NIFTY IT", exp: 0.22 },
  { t: "PHARMABEES.NS", name: "Nippon Pharma BeES", tracks: "NIFTY Pharma", exp: 0.21 },
  { t: "CPSEETF.NS", name: "CPSE ETF", tracks: "CPSE Index", exp: 0.05 },
  { t: "LIQUIDBEES.NS", name: "Nippon Liquid BeES", tracks: "Overnight Rate", exp: 0.69 },
  { t: "MAFANG.NS", name: "Mirae FANG+ ETF", tracks: "NYSE FANG+", exp: 0.66 },
];

const GL_ETFS: { t: string; name: string; tracks: string; exp: number }[] = [
  { t: "SPY", name: "SPDR S&P 500", tracks: "S&P 500", exp: 0.09 },
  { t: "VOO", name: "Vanguard S&P 500", tracks: "S&P 500", exp: 0.03 },
  { t: "QQQ", name: "Invesco QQQ", tracks: "NASDAQ 100", exp: 0.2 },
  { t: "VTI", name: "Vanguard Total Market", tracks: "US Total Market", exp: 0.03 },
  { t: "IWM", name: "iShares Russell 2000", tracks: "Russell 2000", exp: 0.19 },
  { t: "DIA", name: "SPDR Dow Jones", tracks: "Dow 30", exp: 0.16 },
  { t: "GLD", name: "SPDR Gold Shares", tracks: "Gold", exp: 0.4 },
  { t: "SLV", name: "iShares Silver Trust", tracks: "Silver", exp: 0.5 },
  { t: "TLT", name: "iShares 20+Y Treasury", tracks: "Long Treasuries", exp: 0.15 },
  { t: "XLK", name: "Technology Select SPDR", tracks: "S&P Tech", exp: 0.09 },
  { t: "XLE", name: "Energy Select SPDR", tracks: "S&P Energy", exp: 0.09 },
  { t: "ARKK", name: "ARK Innovation", tracks: "Disruptive Tech", exp: 0.75 },
];

const IN_FUNDS = [
  { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap", nav: 92.4, cagr5y: 21.8, exp: 0.63 },
  { name: "Quant Small Cap", cat: "Small Cap", nav: 284.1, cagr5y: 31.2, exp: 0.77 },
  { name: "HDFC Mid-Cap Opportunities", cat: "Mid Cap", nav: 212.7, cagr5y: 26.4, exp: 0.74 },
  { name: "Nippon India Small Cap", cat: "Small Cap", nav: 198.6, cagr5y: 29.8, exp: 0.68 },
  { name: "Axis ELSS Tax Saver", cat: "ELSS", nav: 108.3, cagr5y: 14.9, exp: 0.96 },
  { name: "SBI Bluechip", cat: "Large Cap", nav: 96.8, cagr5y: 17.2, exp: 0.86 },
  { name: "Mirae Asset Large Cap", cat: "Large Cap", nav: 118.4, cagr5y: 16.8, exp: 0.54 },
  { name: "UTI Nifty 50 Index", cat: "Index", nav: 178.5, cagr5y: 16.1, exp: 0.17 },
  { name: "HDFC Index Sensex", cat: "Index", nav: 742.1, cagr5y: 15.9, exp: 0.2 },
  { name: "ICICI Pru Balanced Advantage", cat: "Hybrid", nav: 72.3, cagr5y: 12.4, exp: 0.87 },
  { name: "HDFC Hybrid Equity", cat: "Hybrid", nav: 112.9, cagr5y: 13.6, exp: 1.02 },
  { name: "Kotak Emerging Equity", cat: "Mid Cap", nav: 134.2, cagr5y: 24.1, exp: 0.37 },
  { name: "SBI Gold Fund", cat: "Gold FoF", nav: 28.4, cagr5y: 14.2, exp: 0.42 },
  { name: "Bandhan Liquid Fund", cat: "Liquid", nav: 3124.5, cagr5y: 5.9, exp: 0.12 },
];

const GL_FUNDS = [
  { name: "Vanguard Total Stock Mkt (VTSAX)", cat: "Index", nav: 152.4, cagr5y: 15.2, exp: 0.04 },
  { name: "Fidelity 500 Index (FXAIX)", cat: "Index", nav: 218.7, cagr5y: 15.8, exp: 0.015 },
  { name: "Vanguard S&P 500 (VFIAX)", cat: "Index", nav: 584.2, cagr5y: 15.7, exp: 0.04 },
  { name: "Schwab S&P 500 (SWPPX)", cat: "Index", nav: 92.1, cagr5y: 15.6, exp: 0.02 },
  { name: "Fidelity Contrafund (FCNTX)", cat: "Large Growth", nav: 22.8, cagr5y: 18.9, exp: 0.39 },
  { name: "T. Rowe Price Blue Chip (TRBCX)", cat: "Large Growth", nav: 186.3, cagr5y: 16.4, exp: 0.7 },
  { name: "Vanguard Target 2050 (VFIFX)", cat: "Target Date", nav: 54.6, cagr5y: 11.8, exp: 0.08 },
  { name: "PIMCO Income (PONAX)", cat: "Bond", nav: 10.9, cagr5y: 4.1, exp: 0.62 },
];

export default function AssetExplorer() {
  const { market, setSelectedSymbol, setActiveView } = useApp();
  const [tab, setTab] = useState<Tab>("stocks");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const isIndia = market === "india";
  const cur = isIndia ? "₹" : "$";
  const q = search.trim().toLowerCase();

  // ---- Stocks universe ----
  // Global: the heatmap endpoint already returns ~48 live-priced large caps in one call
  const { data: heatmap } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => api.getHeatmap(),
    refetchInterval: 120000,
    enabled: !isIndia && tab === "stocks",
  });

  const inStocksFiltered = IN_STOCKS.filter(
    (s) => !q || s.t.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
  );
  const glStocksFiltered = (heatmap?.items ?? []).filter((s) => !q || s.ticker.toLowerCase().includes(q));

  const totalPages = isIndia ? Math.max(1, Math.ceil(inStocksFiltered.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const inPageRows = inStocksFiltered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // ---- ETFs ----
  const etfList = (isIndia ? IN_ETFS : GL_ETFS).filter(
    (e) => !q || e.t.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.tracks.toLowerCase().includes(q)
  );

  // ---- Live quotes for whatever the current tab needs ----
  const quoteSymbols =
    tab === "stocks" && isIndia ? inPageRows.map((r) => r.t)
    : tab === "etfs" ? etfList.map((e) => e.t)
    : [];
  const quoteQueries = useQueries({
    queries: quoteSymbols.map((t) => ({
      queryKey: ["exQuote", t],
      queryFn: () => api.getQuote(t),
      refetchInterval: 180000,
      staleTime: 120000,
    })),
  });
  const quoteFor = (t: string) => quoteQueries[quoteSymbols.indexOf(t)]?.data;

  // ---- Funds ----
  const fundList = (isIndia ? IN_FUNDS : GL_FUNDS).filter(
    (f) => !q || f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q)
  );

  const fmtPrice = (n?: number) =>
    n === undefined ? "…" : `${cur}${n.toLocaleString(isIndia ? "en-IN" : undefined, { maximumFractionDigits: 2 })}`;
  const chg = (p?: number) =>
    p === undefined ? <span className="text-muted-text">…</span> : (
      <span className={`font-bold ${p >= 0 ? "text-secondary" : "text-danger"}`}>{p >= 0 ? "+" : ""}{p.toFixed(2)}%</span>
    );

  const analyze = (t: string) => { setSelectedSymbol(t); setActiveView("stock"); };

  const counts: Record<Tab, number> = {
    stocks: isIndia ? inStocksFiltered.length : glStocksFiltered.length,
    etfs: etfList.length,
    funds: fundList.length,
  };

  return (
    <div className="space-y-6 font-mono">
      <section className="card p-5 md:p-6 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-primary" /> Explore All · {isIndia ? "India (NSE/BSE + AMCs)" : "US Markets"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            {(["stocks", "etfs", "funds"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(0); }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer capitalize ${
                  tab === t ? "bg-line text-ink font-semibold" : "text-muted-text hover:text-ink hover:bg-line/40"
                }`}
              >
                {t === "funds" ? "Mutual Funds" : t.toUpperCase() === "ETFS" ? "ETFs" : "Stocks"} ({counts[t]})
              </button>
            ))}
          </div>
        </header>

        {/* Search */}
        <div className="flex items-center gap-2 bg-panel/40 border border-line rounded-lg px-3 py-2 max-w-md focus-within:border-primary/50 transition-colors">
          <Search className="h-3.5 w-3.5 text-muted-text" />
          <input
            placeholder={`Search ${tab === "funds" ? "funds by name or category" : tab === "etfs" ? "ETFs by name or index" : "stocks by symbol, name, or sector"}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent outline-none flex-1 text-[11px] placeholder:text-muted-text text-ink"
          />
        </div>

        {/* STOCKS TAB */}
        {tab === "stocks" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-text border-b border-line/40">
                  <tr className="text-left">
                    <th className="font-semibold py-1.5">Symbol</th>
                    {isIndia && <th className="font-semibold">Company</th>}
                    {isIndia && <th className="font-semibold">Sector</th>}
                    <th className="font-semibold text-right">Price</th>
                    <th className="font-semibold text-right">Change</th>
                    <th className="font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/20">
                  {isIndia
                    ? inPageRows.map((s) => {
                        const quote = quoteFor(s.t);
                        return (
                          <tr key={s.t} className="hover:bg-line/20">
                            <td className="py-2 text-ink font-bold uppercase">{s.t.replace(".NS", "")}</td>
                            <td className="text-muted-text">{s.name}</td>
                            <td><span className="chip bg-line text-muted-text text-[8px] px-1.5 py-0.5 rounded">{s.sector}</span></td>
                            <td className="text-right text-ink font-bold">{fmtPrice(quote?.price)}</td>
                            <td className="text-right">{chg(quote?.change_pct)}</td>
                            <td className="text-right">
                              <button onClick={() => analyze(s.t)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[9px] font-bold transition-colors cursor-pointer">
                                Analyze <ArrowRight className="h-2.5 w-2.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    : glStocksFiltered.map((s) => (
                        <tr key={s.ticker} className="hover:bg-line/20">
                          <td className="py-2 text-ink font-bold uppercase">{s.ticker}</td>
                          <td className="text-right text-ink font-bold">{fmtPrice(s.price)}</td>
                          <td className="text-right">{chg(s.change_pct)}</td>
                          <td className="text-right">
                            <button onClick={() => analyze(s.ticker)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[9px] font-bold transition-colors cursor-pointer">
                              Analyze <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {counts.stocks === 0 && (
                <div className="py-10 text-center text-muted-text text-xs">No matches — try a different search.</div>
              )}
            </div>

            {/* India pagination */}
            {isIndia && totalPages > 1 && (
              <div className="flex items-center justify-between text-[10px] text-muted-text pt-1">
                <span>Page {safePage + 1} of {totalPages} · {inStocksFiltered.length} stocks</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                    className="p-1.5 rounded border border-line disabled:opacity-30 hover:bg-line text-ink transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage(safePage + 1)}
                    className="p-1.5 rounded border border-line disabled:opacity-30 hover:bg-line text-ink transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ETFS TAB */}
        {tab === "etfs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead className="text-muted-text border-b border-line/40">
                <tr className="text-left">
                  <th className="font-semibold py-1.5">ETF</th>
                  <th className="font-semibold">Tracks</th>
                  <th className="font-semibold text-right">Expense</th>
                  <th className="font-semibold text-right">Price</th>
                  <th className="font-semibold text-right">Change</th>
                  <th className="font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {etfList.map((e) => {
                  const quote = quoteFor(e.t);
                  return (
                    <tr key={e.t} className="hover:bg-line/20">
                      <td className="py-2">
                        <div className="text-ink font-bold">{e.name}</div>
                        <div className="text-[8px] text-muted-text uppercase">{e.t.replace(".NS", "")}</div>
                      </td>
                      <td className="text-muted-text">{e.tracks}</td>
                      <td className="text-right">
                        <span className={`font-bold ${e.exp <= 0.1 ? "text-secondary" : e.exp <= 0.5 ? "text-ink" : "text-amber"}`}>{e.exp.toFixed(2)}%</span>
                      </td>
                      <td className="text-right text-ink font-bold">{fmtPrice(quote?.price)}</td>
                      <td className="text-right">{chg(quote?.change_pct)}</td>
                      <td className="text-right">
                        <button onClick={() => analyze(e.t)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[9px] font-bold transition-colors cursor-pointer">
                          Analyze <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {etfList.length === 0 && (
              <div className="py-10 text-center text-muted-text text-xs">No matches — try a different search.</div>
            )}
          </div>
        )}

        {/* MUTUAL FUNDS TAB */}
        {tab === "funds" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead className="text-muted-text border-b border-line/40">
                <tr className="text-left">
                  <th className="font-semibold py-1.5">Fund</th>
                  <th className="font-semibold">Category</th>
                  <th className="font-semibold text-right">NAV</th>
                  <th className="font-semibold text-right">5Y CAGR</th>
                  <th className="font-semibold text-right">Expense (Direct)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {fundList.map((f) => (
                  <tr key={f.name} className="hover:bg-line/20">
                    <td className="py-2 text-ink font-bold">{f.name}</td>
                    <td><span className="chip bg-line text-muted-text text-[8px] px-1.5 py-0.5 rounded">{f.cat}</span></td>
                    <td className="text-right text-ink">{cur}{f.nav.toLocaleString(isIndia ? "en-IN" : undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                    <td className="text-right font-bold text-secondary">+{f.cagr5y.toFixed(1)}%</td>
                    <td className="text-right">
                      <span className={`font-bold ${f.exp <= 0.2 ? "text-secondary" : f.exp <= 0.8 ? "text-ink" : "text-amber"}`}>{f.exp.toFixed(2)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fundList.length === 0 && (
              <div className="py-10 text-center text-muted-text text-xs">No matches — try a different search.</div>
            )}
          </div>
        )}

        <Caption>
          {tab === "stocks" && (
            <>Every listed stock is searchable from the top bar too — type any symbol{isIndia ? " (add .NS for NSE)" : ""} and hit enter.
            This shelf shows the most-traded names with live prices; Analyze opens the full AI workup.</>
          )}
          {tab === "etfs" && (
            <>ETFs trade like stocks but hold a whole index. Prices are live; the expense column is what the fund
            keeps every year — green means under 0.10%, which is nearly free.</>
          )}
          {tab === "funds" && (
            <>Mutual fund NAVs update once daily after market close, unlike live stock prices. 5Y CAGR is the average
            yearly growth; expense is the yearly fee on Direct plans. Illustrative data — verify NAV on the AMC site.</>
          )}
        </Caption>
      </section>
    </div>
  );
}
