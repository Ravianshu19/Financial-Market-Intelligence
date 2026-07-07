"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Search, Bell, LogOut, Activity, User, TrendingUp, TrendingDown } from "lucide-react";

export default function Topbar() {
  const { selectedSymbol, setSelectedSymbol, activeView, setActiveView, logout, token } = useApp();
  const [searchInput, setSearchInput] = useState("");

  // Get user profile info
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => api.me(),
    enabled: !!token,
  });

  // Get live ticker bar data
  const { data: tickerData } = useQuery({
    queryKey: ["tickerStrip"],
    queryFn: () => api.getTickerStrip(),
    refetchInterval: 60000, // Refresh every 1 minute
  });

  // Get alerts to check triggered rules
  const { data: alerts } = useQuery({
    queryKey: ["alerts", token],
    queryFn: () => api.getAlerts(),
    enabled: !!token,
    refetchInterval: 15000, // Refresh every 15s to catch alerts
  });

  const triggeredCount = alerts?.filter((a) => a.status === "triggered").length || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedSymbol(searchInput.trim());
      setActiveView("stock");
      setSearchInput("");
    }
  };

  // Default mock ticker items to display if loading or API fails
  const defaultTickerItems = [
    { sym: "SPX", price: 5824.12, chg_pct: 0.54, up: true },
    { sym: "NDX", price: 20318.77, chg_pct: 0.83, up: true },
    { sym: "DJI", price: 42610.2, chg_pct: 0.21, up: true },
    { sym: "RUT", price: 2189.04, chg_pct: -0.32, up: false },
    { sym: "VIX", price: 13.45, chg_pct: -2.1, up: false },
    { sym: "BTC", price: 103420, chg_pct: 3.27, up: true },
    { sym: "ETH", price: 3884, chg_pct: -0.49, up: false },
    { sym: "GOLD", price: 2684.1, chg_pct: 0.72, up: true },
  ];

  const tickerItems = tickerData?.items || defaultTickerItems;

  return (
    <div className="w-full">
      {/* MAIN TOPBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/85 border-b border-line">
        <div className="max-w-[1480px] mx-auto px-6 h-14 flex items-center gap-6">
          {/* LOGO */}
          <div 
            onClick={() => setActiveView("overview")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 17 L9 11 L13 14 L21 6" stroke="#4D9FFF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="6" r="2" fill="#00D4AA" />
            </svg>
            <span className="font-display text-[19px] tracking-tight font-extrabold">
              Quantra<span className="text-primary">.</span>
            </span>
            <span className="chip hidden sm:inline-flex bg-line text-muted-text text-[10px] px-1.5 py-0.5 rounded-full border border-line ml-1">
              v3.0 · pro
            </span>
          </div>

          {/* HORIZONTAL NAV */}
          <nav className="hidden md:flex items-center gap-1 text-[12px] text-muted-text">
            <button
              onClick={() => setActiveView("overview")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === "overview" ? "text-ink bg-card border border-line" : "hover:text-ink"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView("stock")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === "stock" ? "text-ink bg-card border border-line" : "hover:text-ink"
              }`}
            >
              Analysis ({selectedSymbol})
            </button>
            <button
              onClick={() => setActiveView("analyst")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === "analyst" ? "text-ink bg-card border border-line" : "hover:text-ink"
              }`}
            >
              AI Analyst
            </button>
            <button
              onClick={() => setActiveView("portfolio")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === "portfolio" ? "text-ink bg-card border border-line" : "hover:text-ink"
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveView("insights")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === "insights" ? "text-ink bg-card border border-line" : "hover:text-ink"
              }`}
            >
              Insights
            </button>
          </nav>

          {/* SEARCH & CONTROLS */}
          <div className="ml-auto flex items-center gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 bg-card border border-line rounded-md px-3 py-1 w-[260px] focus-within:border-primary/50 transition-colors">
              <Search className="h-3.5 w-3.5 text-muted-text" />
              <input
                placeholder="Search symbol (e.g. AAPL, TSLA)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent outline-none flex-1 text-[11px] placeholder:text-muted-text text-ink font-mono"
              />
              <button type="submit" className="hidden" />
              <span className="text-[9px] bg-line text-muted-text px-1 rounded border border-line">⏎</span>
            </form>

            {/* LIVE FEED STATUS */}
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono border border-secondary/15 bg-secondary/5 px-2.5 py-1 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary pulse-dot relative"></span>
              <span className="hidden sm:inline">LIVE</span>
            </div>

            {/* ALERTS NOTIFICATION BELL */}
            <button 
              onClick={() => setActiveView("alerts")}
              className="relative p-1.5 rounded-md border border-line hover:bg-card text-ink transition-colors cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {triggeredCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-bg text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {triggeredCount}
                </span>
              )}
            </button>

            {/* USER PROFILE & LOGOUT */}
            <div className="flex items-center gap-3 pl-3 border-l border-line">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center text-[10px] text-bg font-extrabold uppercase">
                  {userProfile?.email ? userProfile.email.slice(0, 2) : "US"}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-[11px] text-ink max-w-[120px] truncate leading-tight font-medium">
                    {userProfile?.email || "User Account"}
                  </div>
                  <div className="text-[9px] text-muted-text leading-tight uppercase tracking-wider font-semibold">
                    Quant · Pro
                  </div>
                </div>
              </div>
              
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-md border border-transparent hover:border-line hover:bg-card text-muted-text hover:text-danger transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* TICKER MARQUEE STRIP */}
      <section className="border-b border-line bg-panel/60 overflow-hidden py-2 marquee">
        <div className="ticker-animation whitespace-nowrap inline-flex gap-8 text-[11px] font-mono">
          {/* Double map to make the marquee scroll smoothly without gaps */}
          {tickerItems.concat(tickerItems).map((it, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedSymbol(it.sym); setActiveView("stock"); }}>
              <span className="text-muted-text uppercase font-semibold">{it.sym}</span>
              <span className="text-ink font-medium">{it.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`inline-flex items-center text-[10px] font-bold ${it.up ? "text-secondary" : "text-danger"}`}>
                {it.up ? <TrendingUp className="h-3 w-3 mr-0.5 inline" /> : <TrendingDown className="h-3 w-3 mr-0.5 inline" />}
                {it.chg_pct >= 0 ? "+" : ""}{it.chg_pct.toFixed(2)}%
              </span>
              <span className="text-line mx-2 font-light">|</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
