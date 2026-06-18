"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import AuthPage from "@/features/auth/AuthPage";
import MarketOverview from "@/features/dashboard/MarketOverview";
import StockAnalysis from "@/features/stock/StockAnalysis";
import AIAnalyst from "@/features/analyst/AIAnalyst";
import PortfolioEngine from "@/features/portfolio/PortfolioEngine";
import AlertCenter from "@/features/alerts/AlertCenter";
import MLOpsRegistry from "@/features/mlops/MLOpsRegistry";

export default function Page() {
  const { token, activeView } = useApp();

  // 1. If unauthenticated, redirect to Vulnora-styled auth page
  if (!token) {
    return <AuthPage />;
  }

  // 2. Render view component matching context selection
  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <MarketOverview />;
      case "stock":
        return <StockAnalysis />;
      case "analyst":
        return <AIAnalyst />;
      case "portfolio":
        return <PortfolioEngine />;
      case "alerts":
        return <AlertCenter />;
      case "mlops":
        return <MLOpsRegistry />;
      default:
        return <MarketOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink relative">
      {/* Background visual details */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none z-0" />
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none z-0" />

      {/* TOPBAR NAVIGATION & MARQUEE TICKER */}
      <div className="relative z-10">
        <Topbar />
      </div>

      {/* MAIN LAYOUT */}
      <main className="relative z-10 max-w-[1480px] w-full mx-auto px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR NAVIGATION & WATCHLIST */}
        <Sidebar />

        {/* WORKSPACE VIEWS */}
        <section className="flex-1 min-w-0">
          {renderActiveView()}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-line mt-10 bg-panel/30">
        <div className="max-w-[1480px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-muted-text font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="chip bg-secondary/10 text-secondary border border-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <span className="h-1 w-1 rounded-full bg-secondary pulse-dot" /> All systems operational
            </span>
            <span>API p50 142ms · ML p95 612ms · Drift 0.03σ · Next.js 15 App Router</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Quantra © 2026 · Fused yfinance & XGBoost</span>
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink transition-colors">Terms</a>
            <a href="#" className="hover:text-ink transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
