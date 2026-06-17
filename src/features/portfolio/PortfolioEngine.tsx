"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, Plus, Trash2, RefreshCw, BarChart2 } from "lucide-react";

export default function PortfolioEngine() {
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

  // Process data for growth chart (growth of 1M simulated over time)
  // Mock data representing historical performance
  const pnlData = [
    { name: "Jan", val: 1000000 },
    { name: "Feb", val: 1050000 },
    { name: "Mar", val: 1020000 },
    { name: "Apr", val: 1110000 },
    { name: "May", val: 1180000 },
    { name: "Jun", val: 1284910 },
  ];

  // Process data for sector allocation donut chart
  // Group current holdings by sectors (simulated mapping)
  const holdings = portfolio?.holdings || [];
  const sectorAllocation = [
    { name: "Info Tech", value: 38, color: "#4D9FFF" },
    { name: "Communication", value: 16, color: "#00D4AA" },
    { name: "Healthcare", value: 12, color: "#F5A524" },
    { name: "Financials", value: 11, color: "#E05555" },
    { name: "Consumer Disc.", value: 9, color: "#A78BFA" },
    { name: "Energy", value: 6, color: "#22D3EE" },
    { name: "Other", value: 8, color: "#7A7A8C" },
  ];

  const fmtNum = (n: number, d = 2) => n?.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) || "0.00";
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

  const totalVal = portfolio?.total_value || 0;
  const totalChange = portfolio?.daily_change || 0;
  const totalChangePct = portfolio?.daily_change_pct || 0;

  return (
    <div className="space-y-6">
      {/* 1. PORTFOLIO TOP VALUATION SUMMARY */}
      <section className="card p-6 bg-card border border-line rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
        <div>
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Portfolio Value · {portfolio?.name || "Growth Account"}
          </div>
          <h3 className="font-display text-[26px] font-bold text-ink leading-tight flex items-baseline gap-2 mt-1">
            ${fmtNum(totalVal)}
            <span className={`text-[12px] font-bold ${totalChange >= 0 ? "text-secondary" : "text-danger"}`}>
              {totalChange >= 0 ? "+" : ""}${fmtNum(totalChange)} ({fmtPct(totalChangePct)})
            </span>
          </h3>
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
                  placeholder="e.g. AAPL"
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
                <label className="text-[9px] text-muted-text block mb-1">Avg Cost ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="180.00"
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

      {/* 2. AREA GROWTH & SECTOR DONUT CHART ROW */}
      <section className="grid grid-cols-12 gap-6">
        {/* Growth history chart */}
        <div className="card col-span-12 lg:col-span-8 p-5 bg-card border border-line rounded-xl space-y-4">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Portfolio Growth History
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9 }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${(v / 1e6).toFixed(2)}M`}
                  tick={{ fill: "#7A7A8C", fontSize: 9 }} 
                />
                <Tooltip contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }} />
                <Area type="monotone" dataKey="val" stroke="#00D4AA" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" name="Net Liquidity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line/20 font-mono text-center">
            {[
              { k: "YTD Performance", v: "+22.40%", c: "text-secondary" },
              { k: "1Y Return", v: "+38.10%", c: "text-secondary" },
              { k: "Portfolio Beta", v: "1.18", c: "text-primary" },
              { k: "Sharpe Ratio", v: "1.62", c: "text-primary" }
            ].map((metric) => (
              <div key={metric.k} className="card !bg-panel/40 p-2 rounded-lg border border-line/50">
                <div className="text-muted-text text-[8px] uppercase font-bold">{metric.k}</div>
                <div className={`font-bold text-[12px] mt-0.5 ${metric.c}`}>{metric.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Allocation Donut */}
        <div className="card col-span-12 lg:col-span-4 p-5 bg-card border border-line rounded-xl space-y-3 font-mono">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-2 mb-2">
            Sector Allocation
          </div>
          
          {/* Recharts Pie Donut */}
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
            Active Holdings
          </div>

          {holdings.length === 0 ? (
            <div className="py-12 text-center text-muted-text text-xs font-mono">
              Portfolio empty. Click &quot;Modify Holding&quot; above to allocate capital.
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
                {holdings.map((h) => (
                  <tr key={h.ticker} className="hover:bg-line/20">
                    <td className="py-3 font-bold text-ink uppercase">{h.ticker}</td>
                    <td className="text-ink">{fmtNum(h.shares)}</td>
                    <td className="text-ink">${fmtNum(h.avg_cost)}</td>
                    <td className="text-ink">${fmtNum(h.current_price)}</td>
                    <td className="text-right text-ink font-bold">${fmtNum(h.market_value)}</td>
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
            <span className="chip bg-danger/10 text-danger border border-danger/10 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
              Concentrated
            </span>
          </header>

          <div className="space-y-3 text-[11px] pt-1">
            {[
              { k: "VaR (1d, 95%)", v: "-1.84%", w: 58, c: "var(--color-danger)" },
              { k: "CVaR (1d, 95%)", v: "-2.71%", w: 70, c: "var(--color-danger)" },
              { k: "Max Drawdown", v: "-12.40%", w: 62, c: "var(--color-amber)" },
              { k: "Single-Name Concentration", v: "NVDA 18.2%", w: 74, c: "var(--color-amber)" },
              { k: "Realised Vol (30d)", v: "22.40%", w: 46, c: "var(--color-primary)" },
              { k: "Correlation to SPX", v: "0.82", w: 82, c: "var(--color-primary)" }
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

          <div className="text-[10px] text-muted-text border-t border-line/20 pt-3 leading-relaxed">
            <span className="text-amber font-bold">Recommendation:</span> Trim NVDA by 4 percentage points and reallocate to VXX hedges. This decreases portfolio CVaR to -2.18% with minimal impact on projected Sharpe ratios.
          </div>
        </div>
      </section>
    </div>
  );
}
