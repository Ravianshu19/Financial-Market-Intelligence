"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Database, RefreshCw, BarChart2, ShieldAlert, Cpu } from "lucide-react";

export default function MLOpsRegistry() {
  const { data: registeredModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["mlops-models"],
    queryFn: () => api.getMlopsModels(),
    refetchInterval: 30000,
  });

  const { data: driftData = [], isLoading: driftLoading } = useQuery({
    queryKey: ["mlops-drift"],
    queryFn: () => api.getMlopsDrift(),
    refetchInterval: 30000,
  });

  const { data: latencyData = [], isLoading: latencyLoading } = useQuery({
    queryKey: ["mlops-latency"],
    queryFn: () => api.getMlopsLatency(),
    refetchInterval: 30000,
  });

  if (modelsLoading || driftLoading || latencyLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Retrieving active registry schemas and tracking telemetry from MLflow registry...
      </div>
    );
  }

  // Calculate average latency
  const avgLatency = latencyData.length > 0 
    ? Math.round(latencyData.reduce((acc, curr) => acc + curr.latency, 0) / latencyData.length)
    : 142;

  const hasSeed = latencyData.some((item) => item.is_real === false);

  const driftAlerts = driftData.filter((d) => d.isDriftAlert).length;

  const statsItems = [
    { k: "Registered Models", v: String(registeredModels.length), s: "XGBoost + LSTM" },
    { k: "Active in Prod", v: String(registeredModels.filter(m => m.stage === "Production").length), s: `${avgLatency}ms average response` },
    { k: "Feature Drift Alerts", v: String(driftAlerts), s: driftAlerts > 0 ? `${driftAlerts} anomaly detected` : "No anomalies detected" }
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
        {statsItems.map((item) => (
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
              <span>
                p95 Latency (ms)
                {hasSeed && (
                  <span className="text-amber-500 font-bold ml-1.5 lowercase normal-case text-[8px]">
                    (cold start / padded)
                  </span>
                )}
              </span>
              <span className="text-secondary font-bold text-[8px]">{avgLatency}ms Avg</span>
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
