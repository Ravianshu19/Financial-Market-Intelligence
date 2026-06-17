"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Plus, Trash2, Bell, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";

export default function AlertCenter() {
  const [ticker, setTicker] = useState("");
  const [conditionType, setConditionType] = useState("price_above");
  const [threshold, setThreshold] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
    refetchInterval: 10000, // Refresh every 10s to see triggered state
  });

  // Mutations
  const createAlertMutation = useMutation({
    mutationFn: (args: { ticker: string; cond: string; thresh: number }) => 
      api.createAlert(args.ticker, args.cond, args.thresh),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setTicker("");
      setThreshold("");
      setShowAddForm(false);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: number) => api.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const triggerAlertMutation = useMutation({
    mutationFn: (id: number) => api.triggerAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(threshold);
    if (ticker.trim() && !isNaN(val)) {
      createAlertMutation.mutate({
        ticker: ticker.trim().toUpperCase(),
        cond: conditionType,
        thresh: val
      });
    }
  };

  const getCondLabel = (c: string) => {
    switch(c) {
      case "price_above": return "Price Above >";
      case "price_below": return "Price Below <";
      case "rsi_above": return "RSI(14) Overbought >";
      case "rsi_below": return "RSI(14) Oversold <";
      default: return c;
    }
  };

  if (isLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-muted-text text-sm font-mono border border-line bg-card rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin mb-3 text-primary" />
        Reading active alert conditions and triggers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <section className="card p-6 bg-card border border-line rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
        <div>
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest">
            Notifications Dashboard
          </div>
          <h3 className="font-display text-[21px] font-bold text-ink mt-1 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Alert Engine
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-bg hover:bg-primary/95 transition-all cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Rule
        </button>
      </section>

      {/* CREATE ALERT FORM */}
      {showAddForm && (
        <section className="card p-5 bg-panel border border-line rounded-xl font-mono max-w-md">
          <h4 className="text-[12px] text-ink font-bold uppercase border-b border-line pb-2 mb-3">Add Notification Rule</h4>
          <form onSubmit={handleCreateAlert} className="space-y-3.5 text-[11px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-muted-text block mb-1">Ticker / Symbol</label>
                <input
                  placeholder="e.g. TSLA"
                  required
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full bg-card border border-line rounded p-2 text-xs text-ink uppercase"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-text block mb-1">Target Threshold</label>
                <input
                  type="number"
                  step="any"
                  placeholder="250.00"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-card border border-line rounded p-2 text-xs text-ink"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-muted-text block mb-1">Condition Trigger</label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="w-full bg-card border border-line rounded p-2 text-xs text-ink focus:outline-none focus:border-primary/50"
              >
                <option value="price_above">Price Above Target (&gt;)</option>
                <option value="price_below">Price Below Target (&lt;)</option>
                <option value="rsi_above">RSI (14) Overbought (&gt; 70)</option>
                <option value="rsi_below">RSI (14) Oversold (&lt; 30)</option>
              </select>
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
                Save Rule
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ALERTS RULES TABLE */}
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest border-b border-line pb-3">
          Armed Notification Protocols
        </div>

        {alerts.length === 0 ? (
          <div className="py-12 text-center text-muted-text text-xs font-mono">
            No active alert protocols. Click &quot;Create Rule&quot; above to armed triggers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono text-left">
              <thead className="text-muted-text border-b border-line/40">
                <tr>
                  <th className="font-semibold py-2">Symbol</th>
                  <th className="font-semibold">Condition</th>
                  <th className="font-semibold">Target value</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold">Created time</th>
                  <th className="font-semibold text-center">Dev Action</th>
                  <th className="font-semibold text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {alerts.map((rule) => (
                  <tr key={rule.id} className="hover:bg-line/20">
                    <td className="py-3 font-bold text-ink uppercase">{rule.ticker}</td>
                    <td className="text-muted-text">{getCondLabel(rule.condition_type)}</td>
                    <td className="text-ink font-semibold">{rule.threshold}</td>
                    <td>
                      <span className={`chip px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                        rule.status === "triggered" 
                          ? "bg-danger/10 text-danger border-danger/20 animate-pulse" 
                          : "bg-secondary/10 text-secondary border-secondary/20"
                      }`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="text-muted-text">
                      {new Date(rule.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="text-center">
                      {rule.status === "armed" ? (
                        <button
                          onClick={() => triggerAlertMutation.mutate(rule.id)}
                          className="px-2 py-1 rounded bg-line border border-line hover:border-muted-text text-[10px] text-ink font-bold transition-all cursor-pointer"
                        >
                          Trigger Test
                        </button>
                      ) : (
                        <span className="text-muted-text text-[10px] italic">Triggered</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => deleteAlertMutation.mutate(rule.id)}
                        className="text-muted-text hover:text-danger p-1 rounded transition-colors cursor-pointer"
                        title="Delete alert"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
