"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, getAuthToken } from "@/services/api";

interface AppContextType {
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [activeView, setActiveView] = useState("overview");
  const [token, setToken] = useState<string | null>(() => getAuthToken());

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
