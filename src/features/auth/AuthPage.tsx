"use client";

import React, { useState } from "react";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { login } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        await api.signup({ email, password });
        // Auto-login after signup
        const loginRes = await api.login({ email, password });
        login(loginRes.access_token);
      } else {
        // Sign In
        const loginRes = await api.login({ email, password });
        login(loginRes.access_token);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090E] flex flex-col justify-between p-6">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none z-0" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-center pt-8 sm:pt-10 select-none">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 17 L9 11 L13 14 L21 6" stroke="#4D9FFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="21" cy="6" r="2" fill="#00D4AA" />
          </svg>
          <span className="text-3xl font-display font-extrabold tracking-tight text-ink">
            Quantra<span className="text-primary">.</span>
          </span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto my-auto w-full">
        {/* Title */}
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.0] tracking-tighter text-ink"
          style={{ letterSpacing: "-1.5px" }}
        >
          Beyond <span className="text-muted-text font-normal italic">silence,</span><br/>
          we build <span className="text-primary">the intelligence.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm sm:text-base text-muted-text mt-5 max-w-md leading-relaxed font-mono">
          {isSignUp 
            ? "Create your Quantra account. Harness model forecasts, news sentiment, and risk analysis in real time." 
            : "Sign in to your research desk. Analyze market technicals, model registries, and portfolio health."
          }
        </p>

        {/* Error Alert */}
        {error && (
          <div className="w-full max-w-[380px] mt-6 p-3 rounded-lg border border-danger/20 bg-danger/10 text-danger text-[11px] text-left font-mono">
            {error}
          </div>
        )}

        {/* Form Container */}
        <div className="w-full max-w-[380px] mt-8 font-mono">
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {/* Email Field */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-full border border-line bg-card/60 pl-11 pr-4 py-3 text-xs text-ink placeholder:text-muted-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-full border border-line bg-card/60 pl-11 pr-11 py-3 text-xs text-ink placeholder:text-muted-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-ink transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-xs font-semibold bg-primary text-bg hover:bg-primary/90 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                isSignUp ? "Create Account" : "Access Dashboard"
              )}
            </button>
          </form>

          {/* Toggle signup/login */}
          <div className="text-center text-xs text-muted-text mt-5">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={loading}
              className="font-bold text-primary hover:underline hover:text-primary/95 transition-all cursor-pointer bg-transparent border-none outline-none"
            >
              {isSignUp ? "Sign In" : "Sign up"}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 w-full text-center py-4 text-[10px] text-muted-text font-mono border-t border-line/20">
        Quantra Intelligence © 2026 · Secured by AES-256 & JWT
      </footer>
    </div>
  );
}
