"use client";

import React, { useState } from "react";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, Plus, Trash2, RefreshCw } from "lucide-react";

const isIndian = (t: string) => t.endsWith(".NS") || t.endsWith(".BO");

export default function PortfolioEngine() {
  const { market } = useApp();
  const [tickerInput, setTickerInput] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Portfolio details
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => api.getPortfolio(),
  });

  const holdings = portfolio?.holdings || [];
  // The book follows the market mode: ₹ holdings in India mode, $ elsewhere
  const activeHoldings = holdings.filter((h) => (market === "india" ? isIndian(h.ticker) : !isIndian(h.ticker)));
  const otherCount = holdings.length - activeHoldings.length;
  const cur = market === "india" ? "₹" : "$";

  // Rebuild the real portfolio value history from each holding's 6mo candles
  const histQueries = useQueries({
    queries: activeHoldings.slice(0, 8).map((h) => ({
      queryKey: ["pfHist", h.ticker],
      queryFn: () => api.getHistory(h.ticker, "6mo", "1d"),
      staleTime: 300000,
    })),
  });

  // Mutations
  const addHoldingMutation = useMutation({
    mutationFn: (args: { ticker: string; shares: number; cost: number }) =>
      api.addHolding(args.ticker, args.shares, args.cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      setTickerInput("");
      setSharesInput("");
      setCostInput("");
      setShowAddForm(false);
    },
  });

  const removeHoldingMutation = useMutation({
    mutationFn: (ticker: string) => api.removeHolding(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const shares = parseFloat(sharesInput);
    const cost = parseFloat(costInput);
    if (tickerInput.trim() && !isNaN(shares) && !isNaN(cost)) {
      addHoldingMutation.mutate({
        ticker: tickerInput.trim().toUpperCase(),
        shares,
        cost
      });
    }
  };

  // ---- Portfolio value series over common trading days ----
  const tracked = activeHoldings.slice(0, 8);
  const histLoading = histQueries.some((q) => q.isLoading);
  let growthData: { date: string; val: number }[] = [];
  if (tracked.length > 0 && !histLoading) {
    const maps = histQueries.map((q) => {
      const m = new Map<string, number>();
      q.data?.candles.forEach((c) => m.set(c.t, c.c));
      return m;
    });
    if (maps.every((m) => m.size > 1)) {
      const commonDates = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d)));
      growthData = commonDates.map((d) => ({
        date: d,
        val: tracked.reduce((sum, h, i) => sum + h.shares * (maps[i].get(d) ?? 0), 0),
      }));
    }
  }

  const risk = portfolio?.risk || {
    var_95: -0.0184,
    cvar_95: -0.0271,
    realised_vol: 0.224,
    beta: 1.18,
    correlation: 0.82,
    sector_allocation: [
      { name: "Info Tech", value: 38, color: "#4D9FFF" },
      { name: "Communication", value: 16, color: "#00D4AA" },
      { name: "Healthcare", value: 12, color: "#F5A524" },
      { name: "Financials", value: 11, color: "#E05555" },
      { name: "Consumer Disc.", value: 9, color: "#A78BFA" },
      { name: "Energy", value: 6, color: "#22D3EE" },
      { name: "Other", value: 8, color: "#7A7A8C" },
    ],
    concentration: "NVDA 18.2%",
    max_drawdown: -0.124,
    sharpe: 1.62,
    recommendation: "Trim the largest position and reallocate toward hedges or index exposure to reduce tail risk.",
  };

  const sectorAllocation = risk.sector_allocation;

  const fmtNum = (n: number, d = 2) => n?.toLocaleString(market === "india" ? "en-IN" : undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) || "0.00";
  const fmtMoneyShort = (n: number) => {
    if (market === "india") {
      if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
      if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
      return `₹${(n / 1e3).toFixed(0)}k`;
    }
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${(n / 1e3).toFixed(1)}k`;
  };
  const fmtPct = (p: number) => (p >= 0 ? "+" : "") + (p || 0).toFixed(2) + "%";
  const color = (p: number) => p >= 0 ? "text-secondary" : "text-danger";

  if (isLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Evaluating portfolio exposures and VaR matrices...
      </div>
    );
  }

  // ---- Live totals computed from the active book (no cross-currency mixing) ----
  const totalVal = activeHoldings.reduce((s, h) => s + h.market_value, 0);
  const totalCost = activeHoldings.reduce((s, h) => s + h.shares * h.avg_cost, 0);
  const totalGain = totalVal - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dayChange = growthData.length >= 2 ? growthData[growthData.length - 1].val - growthData[growthData.length - 2].val : 0;
  const dayChangePct = growthData.length >= 2 && growthData[growthData.length - 2].val > 0
    ? (dayChange / growthData[growthData.length - 2].val) * 100
    : 0;
  const periodReturnPct = growthData.length >= 2 && growthData[0].val > 0
    ? ((growthData[growthData.length - 1].val - growthData[0].val) / growthData[0].val) * 100
    : 0;

  // ---- Composite risk score from vol, tail risk, concentration & beta ----
  const weights = activeHoldings
    .map((h) => ({ ticker: h.ticker, w: totalVal > 0 ? (h.market_value / totalVal) * 100 : 0 }))
    .sort((a, b) => b.w - a.w);
  const maxWeight = weights[0]?.w ?? (parseFloat(risk.concentration.split(" ")[1]) || 0);
  const volScore = Math.min((risk.realised_vol * 100) / 40, 1);
  const varScore = Math.min(Math.abs(risk.var_95 * 100) / 5, 1);
  const concScore = Math.min(maxWeight / 50, 1);
  const betaScore = Math.min(Math.abs(risk.beta) / 2, 1);
  const riskScore = Math.round((volScore * 0.35 + varScore * 0.25 + concScore * 0.25 + betaScore * 0.15) * 100);
  const riskTone =
    riskScore < 35
      ? { label: "Conservative", color: "#00D4AA", chip: "bg-secondary/10 text-secondary border-secondary/10" }
      : riskScore < 65
        ? { label: "Balanced", color: "#F5A524", chip: "bg-amber/10 text-amber border-amber/10" }
        : { label: "Aggressive", color: "#E05555", chip: "bg-danger/10 text-danger border-danger/10" };

  const barColor = (w: number) => (w > 25 ? "var(--color-danger)" : w > 15 ? "var(--color-amber)" : "var(--color-primary)");

  return (
    <div className="space-y-6">
      {/* 1. PORTFOLIO TOP VALUATION SUMMARY */}
      <section className="card p-6 bg-card border border-line rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
        <div>
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Portfolio Value · {market === "india" ? "India (₹) Book" : "Global ($) Book"} · {portfolio?.name || "Growth Account"}
          </div>
          <h3 className="font-display text-[26px] font-bold text-ink leading-tight flex items-baseline gap-2 mt-1">
            {cur}{fmtNum(totalVal)}
            <span className={`text-[12px] font-bold ${totalGain >= 0 ? "text-secondary" : "text-danger"}`}>
              {totalGain >= 0 ? "+" : "-"}{cur}{fmtNum(Math.abs(totalGain))} ({fmtPct(totalGainPct)} all-time)
            </span>
          </h3>
          {otherCount > 0 && (
            <div className="text-[9px] text-muted-text mt-1.5">
              + {otherCount} holding{otherCount > 1 ? "s" : ""} in the {market === "india" ? "Global $" : "India ₹"} book — flip the market switch to view
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-bg hover:bg-primary/95 transition-all cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Modify Holding
        </button>
      </section>

      {/* Quick Add Form Overlay */}
      {showAddForm && (
        <section className="card p-5 bg-panel border border-line rounded-xl font-mono max-w-md">
          <h4 className="text-[12px] text-ink font-bold uppercase border-b border-line pb-2 mb-3">Add / Update Position</h4>
          <form onSubmit={handleAddHolding} className="space-y-3 text-[11px]">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-muted-text block mb-1">Ticker</label>
                <input
                  placeholder={market === "india" ? "e.g. TCS.NS" : "e.g. AAPL"}
                  required
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  className="w-full bg-card border border-line rounded p-2 text-xs text-ink uppercase"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-text block mb-1">Shares</label>
                <input
                  type="number"
                  step="any"
                  placeholder="10.5"
                  required
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  className="w-full bg-card border border-line rounded p-2 text-xs text-ink"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-text block mb-1">Avg Cost ({cur})</label>
                <input
                  type="number"
                  step="any"
                  placeholder={market === "india" ? "3200.00" : "180.00"}
                  required
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full bg-card border border-line rounded p-2 text-xs text-ink"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded border border-line hover:bg-card text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-primary text-bg hover:bg-primary/90 transition-colors font-bold cursor-pointer"
              >
                Save Position
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 2. REAL GROWTH CHART & SECTOR DONUT */}
      <section className="grid grid-cols-12 gap-6">
        {/* Growth history rebuilt from actual holdings */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-4">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Portfolio Value · last 6 months · computed from your actual holdings
          </div>
          {activeHoldings.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-muted-text text-xs font-mono text-center px-6">
              No {market === "india" ? "₹" : "$"} holdings yet. Add a position above and this chart rebuilds
              your portfolio&apos;s value day by day from real price history.
            </div>
          ) : histLoading ? (
            <div className="h-[180px] flex items-center justify-center text-muted-text text-xs font-mono">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Rebuilding value history from holdings...
            </div>
          ) : (
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => fmtMoneyShort(Number(v))}
                    tick={{ fill: "#7A7A8C", fontSize: 9 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }}
                    formatter={(v) => [`${cur}${fmtNum(Number(v))}`, "Portfolio value"]}
                  />
                  <Area type="monotone" dataKey="val" stroke="#00D4AA" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" name="Portfolio value" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line/20 font-mono text-center">
            {[
              { k: "6M Return", v: activeHoldings.length ? fmtPct(periodReturnPct) : "—", c: periodReturnPct >= 0 ? "text-secondary" : "text-danger" },
              { k: "Today", v: activeHoldings.length && growthData.length >= 2 ? `${dayChange >= 0 ? "+" : "-"}${cur}${fmtNum(Math.abs(dayChange), 0)} (${fmtPct(dayChangePct)})` : "—", c: dayChange >= 0 ? "text-secondary" : "text-danger" },
              { k: "Portfolio Beta", v: risk.beta.toFixed(2), c: "text-primary" },
              { k: "Sharpe Ratio", v: risk.sharpe.toFixed(2), c: "text-primary" }
            ].map((metric) => (
              <div key={metric.k} className="card !bg-panel/40 p-2 rounded-lg border border-line/50">
                <div className="text-muted-text text-[8px] uppercase font-bold">{metric.k}</div>
                <div className={`font-bold text-[11px] mt-0.5 ${metric.c}`}>{metric.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Allocation Donut */}
        <div className="card col-span-12 lg:col-span-4 p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-2 mb-2">
            Sector Allocation
          </div>

          <div className="h-[120px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorAllocation}
                  innerRadius={36}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorAllocation.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-[10px]">
            {sectorAllocation.slice(0, 5).map((sec) => (
              <div key={sec.name} className="flex items-center gap-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sec.color }} />
                <span className="flex-1 text-muted-text">{sec.name}</span>
                <span className="text-ink font-bold">{sec.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOLDINGS & RISK MATRIX */}
      <section className="grid grid-cols-12 gap-6">
        {/* Positions table */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-4">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
            Active Holdings · {market === "india" ? "₹ India" : "$ Global"} book
          </div>

          {activeHoldings.length === 0 ? (
            <div className="py-12 text-center text-muted-text text-xs font-mono">
              No positions in this book. Click &quot;Modify Holding&quot; above to allocate capital
              {otherCount > 0 ? ` — or switch the market toggle to see your other ${otherCount} holding${otherCount > 1 ? "s" : ""}.` : "."}
            </div>
          ) : (
            <table className="w-full text-[11px] font-mono">
              <thead className="text-muted-text border-b border-line/40">
                <tr className="text-left">
                  <th className="font-semibold py-2">Symbol</th>
                  <th className="font-semibold">Shares</th>
                  <th className="font-semibold">Avg Cost</th>
                  <th className="font-semibold">Current Price</th>
                  <th className="font-semibold text-right">Market Value</th>
                  <th className="font-semibold text-right">Gain / Loss</th>
                  <th className="font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {activeHoldings.map((h) => (
                  <tr key={h.ticker} className="hover:bg-line/20">
                    <td className="py-3 font-bold text-ink uppercase">{h.ticker.replace(".NS", "")}</td>
                    <td className="text-ink">{fmtNum(h.shares)}</td>
                    <td className="text-ink">{cur}{fmtNum(h.avg_cost)}</td>
                    <td className="text-ink">{cur}{fmtNum(h.current_price)}</td>
                    <td className="text-right text-ink font-bold">{cur}{fmtNum(h.market_value)}</td>
                    <td className={`text-right font-extrabold ${color(h.gain_loss_pct)}`}>
                      {fmtPct(h.gain_loss_pct)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => removeHoldingMutation.mutate(h.ticker)}
                        className="text-muted-text hover:text-danger p-1 rounded transition-colors cursor-pointer"
                        title="Remove position"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Risk metrics */}
        <div className="card col-span-12 lg:col-span-4 p-5 bg-card border border-line rounded-xl space-y-4 font-mono">
          <header className="flex justify-between items-center border-b border-line pb-3">
            <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber" /> Risk Engine
            </div>
            <span className={`chip border text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${riskTone.chip}`}>
              {riskTone.label}
            </span>
          </header>

          {/* Composite risk gauge */}
          <div className="flex items-center justify-center pt-1">
            <div className="relative">
              <svg width="150" height="86" viewBox="0 0 150 86">
                <path d="M 15 78 A 60 60 0 0 1 135 78" fill="none" stroke="#1F1F2B" strokeWidth="10" strokeLinecap="round" />
                <path
                  d="M 15 78 A 60 60 0 0 1 135 78"
                  fill="none"
                  stroke={riskTone.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(riskScore / 100) * 188.5} 188.5`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0 text-center">
                <div className="text-[22px] font-bold leading-none" style={{ color: riskTone.color }}>{riskScore}</div>
                <div className="text-[8px] text-muted-text uppercase font-bold tracking-widest">Risk Score / 100</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-[11px] pt-1">
            {[
              { k: "VaR (1d, 95%)", v: (risk.var_95 * 100).toFixed(2) + "%", w: Math.min(Math.abs(risk.var_95 * 100) * 10, 100), c: "var(--color-danger)" },
              { k: "CVaR (1d, 95%)", v: (risk.cvar_95 * 100).toFixed(2) + "%", w: Math.min(Math.abs(risk.cvar_95 * 100) * 10, 100), c: "var(--color-danger)" },
              { k: "Max Drawdown", v: (risk.max_drawdown * 100).toFixed(2) + "%", w: Math.min(Math.abs(risk.max_drawdown * 100) * 5, 100), c: "var(--color-amber)" },
              { k: "Realised Vol (30d)", v: (risk.realised_vol * 100).toFixed(2) + "%", w: Math.min(Math.abs(risk.realised_vol * 100) * 3.3, 100), c: "var(--color-primary)" },
              { k: "Correlation to Index", v: risk.correlation.toFixed(2), w: Math.abs(risk.correlation) * 100, c: "var(--color-primary)" }
            ].map((r) => (
              <div key={r.k} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-text">{r.k}</span>
                  <span className="font-bold text-ink" style={{ color: r.c }}>{r.v}</span>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.w}%`, backgroundColor: r.c }} />
                </div>
              </div>
            ))}
          </div>

          {/* Per-position concentration */}
          {weights.length > 0 && (
            <div className="border-t border-line/20 pt-3 space-y-2">
              <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
                Concentration by Position
              </div>
              {weights.slice(0, 6).map((h) => (
                <div key={h.ticker} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-ink font-bold uppercase">{h.ticker.replace(".NS", "")}</span>
                    <span className="text-muted-text">{h.w.toFixed(1)}% of book</span>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(h.w, 100)}%`, backgroundColor: barColor(h.w) }} />
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-muted-text/80 leading-relaxed pt-1">
                Positions above <span className="text-amber font-bold">15%</span> raise concentration risk; above{" "}
                <span className="text-danger font-bold">25%</span> a single earnings miss dominates portfolio P&amp;L.
              </p>
            </div>
          )}

          <div className="text-[10px] text-muted-text border-t border-line/20 pt-3 leading-relaxed">
            <span className="text-amber font-bold">Recommendation:</span> {risk.recommendation}
          </div>
        </div>
      </section>
    </div>
  );
}
