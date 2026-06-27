"use client";

import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090E] text-[#E7E7F0] p-8 md:p-16 relative font-sans leading-relaxed">
      <div className="max-w-[720px] mx-auto bg-[#14141C] border border-[#1F1F2B] rounded-xl p-8 md:p-12 shadow-2xl relative z-10">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#00D4AA] hover:underline mb-8">
          ← Back to Terminal
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs font-mono text-[#7A7A8C] mb-8">Last Updated: June 27, 2026</p>
        
        <div className="space-y-6 text-[#A0A0B0] text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">1. Information Collection</h2>
            <p>
              Quantra collects only minimal platform account credentials (such as emails and hashed passwords) to authenticate access and secure user preferences. Watchlist, portfolio allocations, and custom trigger threshold preferences are stored in isolated databases.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">2. Analytical Integrity</h2>
            <p>
              No financial portfolio allocations, stock tickers, or machine learning explanations are shared with third parties. Market data is queried via public/cached Yahoo Finance interfaces anonymously.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">3. Security Gating</h2>
            <p>
              User databases are isolated via JSON Web Token auth gates and hashed credentials. Custom server-side schemas protect records from IDOR vulnerabilities, cross-contamination, or administrative leakage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">4. Rights and Controls</h2>
            <p>
              Users hold full visibility and control over their preferences. You may request account deletion or data exports by contacting the secure financial desk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
