"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { 
  BarChart2, 
  Activity, 
  Star, 
  Cpu, 
  TrendingUp, 
  PieChart, 
  ShieldAlert,
  Database,
  Plus,
  Trash2,
  Bookmark,
  ArrowLeftRight
} from "lucide-react";

export default function Sidebar() {
  const { selectedSymbol, setSelectedSymbol, activeView, setActiveView, token } = useApp();
  const [newSymbol, setNewSymbol] = useState("");
  const queryClient = useQueryClient();

  // Fetch watchlist
  const { data: watchlist = [], isLoading: wlLoading } = useQuery({
    queryKey: ["watchlist", token],
    queryFn: () => api.getWatchlist(),
    enabled: !!token,
  });

  // Watchlist mutations
  const addSymbolMutation = useMutation({
    mutationFn: (sym: string) => api.addToWatchlist(sym),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setNewSymbol("");
    },
  });

  const removeSymbolMutation = useMutation({
    mutationFn: (sym: string) => api.removeFromWatchlist(sym),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      addSymbolMutation.mutate(newSymbol.trim().toUpperCase());
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "stock", label: "Stock Analysis", icon: Activity },
    { id: "analyst", label: "AI Analyst", icon: Cpu },
    { id: "compare", label: "Compare", icon: ArrowLeftRight },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
    { id: "alerts", label: "Active Alerts", icon: ShieldAlert },
    { id: "mlops", label: "MLOps", icon: Database },
  ];

  return (
    <aside className="w-full lg:w-[220px] shrink-0">
      <div className="card p-3 sticky top-22 bg-card border border-line rounded-xl space-y-4">
        {/* Navigation Section */}
        <div>
          <div className="px-2 py-1.5 label text-[10px] tracking-widest text-muted-text uppercase font-semibold">
            Workspace
          </div>
          <nav className="text-[12px] space-y-0.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/25 font-semibold"
                      : "hover:bg-line text-muted-text hover:text-ink border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === "stock" && (
                    <span className="chip bg-primary/10 text-primary text-[9px] px-1 py-0.2 rounded border border-primary/10 ml-auto font-mono">
                      {selectedSymbol}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Watchlist Section */}
        <div className="border-t border-line pt-3">
          <div className="px-2 py-1.5 flex items-center justify-between label text-[10px] tracking-widest text-muted-text uppercase font-semibold">
            <span>Watchlist</span>
            <span className="chip bg-line text-muted-text text-[9px] px-1.5 py-0.2 rounded font-mono">
              {watchlist.length}
            </span>
          </div>

          <div className="text-[12px] space-y-1 mt-1 max-h-[220px] overflow-y-auto scroll-hide">
            {watchlist.length === 0 ? (
              <div className="text-center py-4 text-muted-text text-[10px] font-mono">
                No items on watchlist
              </div>
            ) : (
              watchlist.map((ticker) => {
                const isSelected = selectedSymbol === ticker;
                return (
                  <div
                    key={ticker}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors border group ${
                      isSelected
                        ? "bg-line border-line/40 text-ink"
                        : "hover:bg-line/40 border-transparent text-muted-text hover:text-ink"
                    }`}
                  >
                    <span
                      onClick={() => {
                        setSelectedSymbol(ticker);
                        setActiveView("stock");
                      }}
                      className="flex-1 cursor-pointer font-bold uppercase"
                    >
                      {ticker}
                    </span>
                    <button
                      onClick={() => removeSymbolMutation.mutate(ticker)}
                      className="opacity-0 group-hover:opacity-100 hover:text-danger p-0.5 rounded transition-all cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddSymbol} className="mt-3 flex items-center gap-1">
            <input
              placeholder="Add sym..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="bg-panel/40 border border-line rounded px-2 py-1.5 text-[10px] flex-1 font-mono outline-none text-ink focus:border-primary/45"
            />
            <button
              type="submit"
              className="p-1.5 bg-line border border-line hover:border-muted-text rounded text-ink transition-colors cursor-pointer"
              title="Add Ticker"
            >
              <Plus className="h-3 w-3" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
