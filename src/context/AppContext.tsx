"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, getAuthToken } from "@/services/api";

export type Market = "global" | "india";

// Views that only exist in one market mode
const GLOBAL_ONLY_VIEWS = new Set<string>([]);
const INDIA_ONLY_VIEWS = new Set(["funds", "etfs"]);

interface AppContextType {
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  market: Market;
  setMarket: (m: Market) => void;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [activeView, setActiveView] = useState("overview");
  const [market, setMarketState] = useState<Market>("global");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAuthToken());
    const saved = typeof window !== "undefined" ? localStorage.getItem("quantra_market") : null;
    if (saved === "india") {
      setMarketState("india");
      setSelectedSymbol("RELIANCE.NS");
    }
  }, []);

  const setMarket = (m: Market) => {
    if (m === market) return;
    setMarketState(m);
    if (typeof window !== "undefined") localStorage.setItem("quantra_market", m);
    // App-like context switch: sensible default symbol per market
    setSelectedSymbol(m === "india" ? "RELIANCE.NS" : "NVDA");
    // Leave views that don't exist in the new market
    if (m === "india" && GLOBAL_ONLY_VIEWS.has(activeView)) setActiveView("overview");
    if (m === "global" && INDIA_ONLY_VIEWS.has(activeView)) setActiveView("overview");
  };

  const login = (newToken: string) => {
    setAuthToken(newToken);
    setToken(newToken);
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setActiveView("overview");
  };

  return (
    <AppContext.Provider
      value={{
        selectedSymbol,
        setSelectedSymbol: (sym) => setSelectedSymbol(sym.toUpperCase()),
        activeView,
        setActiveView,
        market,
        setMarket,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
