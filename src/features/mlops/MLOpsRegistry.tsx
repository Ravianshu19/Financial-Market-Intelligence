"use client";

import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Database, RefreshCw, BarChart2, ShieldAlert, Cpu } from "lucide-react";

// Generate mock drift stats (40 runs)
const driftData = Array.from({ length: 40 }, (_, idx) => {
  const val = Number((Math.abs(Math.sin(idx / 4)) * 0.3 + Math.random() * 0.2).toFixed(2));
  return {
    run: `R-${40 - idx}`,
    drift: val,
    isDriftAlert: val > 0.4
  };
});

// Generate mock latency stats (40 requests, between 250ms and 360ms)
const latencyData = Array.from({ length: 40 }, (_, idx) => ({
  req: `Q-${40 - idx}`,
  latency: Number((280 + Math.sin(idx / 3) * 45 + Math.random() * 35).toFixed(0))
}));

export default function MLOpsRegistry() {

  // Registered Model versions logs
  const registeredModels = [
    { name: "forecast_nvda", version: "v32", stage: "Production", metric: "MAE 0.91%", color: "#00D4AA" },
    { name: "forecast_spy", version: "v18", stage: "Production", metric: "MAE 0.42%", color: "#00D4AA" },
    { name: "sentiment_finbert", version: "v11", stage: "Production", metric: "F1 0.88", color: "#00D4AA" },
    { name: "regime_hmm", version: "v05", stage: "Staging", metric: "AUC 0.79", color: "#4D9FFF" },
    { name: "risk_var_lstm", version: "v07", stage: "Shadow", metric: "VaR cov 94%", color: "#F5A524" },
    { name: "anomaly_isof", version: "v02", stage: "Staging", metric: "P@5 0.81", color: "#4D9FFF" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. MLOPS REGISTRY STATS HEADER */}
      <section className="card p-6 bg-card border border-line rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
        <div>
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Pipeline Analytics
          </div>
          <h3 className="font-display text-[21px] font-bold text-ink mt-1 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Model Registry & MLOps
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono border border-secondary/15 bg-secondary/5 px-2.5 py-1 rounded-md">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary pulse-dot relative"></span>
          <span>HEALTHY</span>
        </div>
      </section>

      {/* Overview Stat tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        {[
          { k: "Registered Models", v: "42", s: "XGBoost + LSTM" },
          { k: "Active in Prod", v: "9", s: "142ms average response" },
          { k: "Feature Drift Alerts", v: "1", s: "1 anomaly detected (forecast_nvda)" }
        ].map((item) => (
          <div key={item.k} className="card bg-panel/30 border border-line/40 p-4 rounded-xl">
            <div className="label text-[9px] text-muted-text font-bold uppercase">{item.k}</div>
            <div className="text-2xl font-bold text-ink mt-1">{item.v}</div>
            <div className="text-[10px] text-muted-text mt-0.5">{item.s}</div>
          </div>
        ))}
      </section>

      {/* 2. REGISTRY LOGS & PLOTS GRID */}
      <section className="grid grid-cols-12 gap-6">
        {/* Model logs list */}
        <div className="card col-span-12 lg:col-span-6 p-5 bg-card border border-line rounded-xl space-y-4 font-mono">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
            Registered Models (MLflow log)
          </div>
          
          <div className="divide-y divide-line/20">
            {registeredModels.map((m) => (
              <div key={m.name} className="flex items-center justify-between py-2.5 hover:bg-line/10 rounded px-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <div>
                    <span className="font-bold text-ink text-[12px]">{m.name}</span>
                    <span className="text-muted-text text-[9px] ml-1.5 font-bold">{m.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-muted-text">{m.metric}</span>
                  <span className="chip bg-line text-muted-text border border-line text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                    {m.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drift & Latency Charts block */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Drift Chart */}
          <div className="card p-4 bg-card border border-line rounded-xl space-y-3 font-mono">
            <div className="label text-[8px] text-muted-text font-bold uppercase tracking-wider flex justify-between border-b border-line pb-2">
              <span>Feature Drift (60d)</span>
              <span className="text-danger font-bold text-[8px]">PSI ALERT</span>
            </div>
            
            <div className="h-[110px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driftData}>
                  <Tooltip contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }} />
                  {/* Dynamic coloring for bars: red if alert, primary otherwise */}
                  <Bar 
                    dataKey="drift" 
                    fill="var(--color-primary)" 
                    radius={[1, 1, 0, 0]}
                  >
                    {driftData.map((entry, idx) => (
                      <Cell 
                        key={idx} 
                        fill={entry.isDriftAlert ? "var(--color-danger)" : "var(--color-primary)"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latency Chart */}
          <div className="card p-4 bg-card border border-line rounded-xl space-y-3 font-mono">
            <div className="label text-[8px] text-muted-text font-bold uppercase tracking-wider flex justify-between border-b border-line pb-2">
              <span>p95 Latency (ms)</span>
              <span className="text-secondary font-bold text-[8px]">142ms Avg</span>
            </div>
            
            <div className="h-[110px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <Tooltip contentStyle={{ backgroundColor: "#0E0E15", borderColor: "#1F1F2B" }} />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="var(--color-secondary)" 
                    strokeWidth={1.5} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
