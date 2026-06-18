"use client";

import React, { useState } from "react";
import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Mail, Lock, Eye, EyeOff, Loader2, Key, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const { login } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification screen states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Password checks for strong password indicator
  const passwordChecks = {
    length: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up request
        const res = await api.signup({ email, password });
        if (res.status === "registered") {
          // Bypassed OTP directly (e.g. for testing)
          const loginRes = await api.login({ email, password });
          login(loginRes.access_token);
        } else {
          // OTP code sent
          setOtpEmail(email);
          setOtpMessage(res.message || "");
          setShowOtpScreen(true);
        }
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifySignupOtp({ email: otpEmail, otp: otpCode });
      login(res.access_token);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "OTP Verification failed. Please check the code.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090E] flex flex-col justify-between p-6">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-auth-glow pointer-events-none z-0" />

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
          {showOtpScreen ? (
            <>Verify <span className="text-primary">your identity.</span></>
          ) : (
            <>Beyond <span className="text-muted-text font-normal italic">silence,</span><br/>we build <span className="text-primary">the intelligence.</span></>
          )}
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm sm:text-base text-muted-text mt-5 max-w-md leading-relaxed font-mono">
          {showOtpScreen
            ? otpMessage || `We sent a 6-digit verification code to ${otpEmail}. Please enter it below to complete your registration.`
            : isSignUp 
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
          {showOtpScreen ? (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
              {/* OTP Field */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  className="w-full rounded-full border border-line bg-card/60 pl-11 pr-4 py-3 text-xs text-ink placeholder:text-muted-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 tracking-[0.25em] text-center font-bold font-mono transition-all duration-200"
                />
              </div>

              {/* Submit OTP Button */}
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full rounded-full px-6 py-3 text-xs font-semibold bg-secondary text-bg hover:bg-secondary/90 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-secondary/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Log In"
                )}
              </button>

              {loading && (
                <p className="mt-2 text-[10px] text-muted-text text-center leading-normal animate-pulse select-none font-mono">
                  Verifying credentials and waking up database...
                </p>
              )}

              {/* Go Back button */}
              <button
                type="button"
                onClick={() => {
                  setShowOtpScreen(false);
                  setError(null);
                  setOtpCode("");
                  setOtpMessage("");
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-text hover:text-ink transition-colors cursor-pointer bg-transparent border-none mt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign Up
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                {/* Email Field */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="username"
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
                    id={isSignUp ? "new-password" : "password"}
                    name={isSignUp ? "new-password" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder="Password"
                    required
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

                {/* Password Strength Indicator */}
                {isSignUp && password && (
                  <div className="mt-2.5 p-3.5 rounded-xl border border-line bg-panel/30 text-left font-mono text-[10px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-text uppercase font-semibold">Password Strength</span>
                      <span className={
                        passwordScore <= 2 ? "text-danger font-bold" :
                        passwordScore <= 4 ? "text-amber font-bold" :
                        "text-secondary font-bold"
                      }>
                        {passwordScore <= 2 ? "Weak" : passwordScore <= 4 ? "Medium" : "Strong"}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-1 bg-line rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div 
                          key={step} 
                          className={`h-full flex-1 transition-colors ${
                            step <= passwordScore 
                              ? passwordScore <= 2 ? "bg-danger" 
                                : passwordScore <= 4 ? "bg-amber" 
                                : "bg-secondary"
                              : "bg-line/40"
                          }`} 
                        />
                      ))}
                    </div>

                    {/* Requirements list */}
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[9px] text-muted-text">
                      {[
                        { label: "8+ characters", met: passwordChecks.length },
                        { label: "Lowercase letter", met: passwordChecks.hasLower },
                        { label: "Uppercase letter", met: passwordChecks.hasUpper },
                        { label: "Number", met: passwordChecks.hasNumber },
                        { label: "Special character", met: passwordChecks.hasSpecial },
                      ].map((req, i) => (
                        <li key={i} className="flex items-center gap-1.5 select-none">
                          {req.met ? (
                            <span className="text-secondary font-bold">✓</span>
                          ) : (
                            <span className="text-muted-text/30 font-bold">•</span>
                          )}
                          <span className={req.met ? "text-ink transition-colors font-medium" : "text-muted-text/50"}>{req.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (isSignUp && passwordScore < 5)}
                  className="w-full rounded-full px-6 py-3 text-xs font-semibold bg-primary text-bg hover:bg-primary/90 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {isSignUp ? "Sending Code..." : "Logging In..."}
                    </>
                  ) : (
                    isSignUp ? "Send Verification Code" : "Access Dashboard"
                  )}
                </button>

                {loading && (
                  <p className="mt-3 text-[10px] text-muted-text text-center leading-normal animate-pulse select-none font-mono">
                    Waking up research desk... First load after inactivity may take up to 60 seconds on Render free tier.
                  </p>
                )}
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
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 w-full text-center py-4 text-[10px] text-muted-text font-mono border-t border-line/20">
        Quantra Intelligence © 2026 · Secured by AES-256 & JWT
      </footer>
    </div>
  );
}
