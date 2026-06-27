"use client";

import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090E] text-[#E7E7F0] p-8 md:p-16 relative font-sans leading-relaxed">
      <div className="max-w-[720px] mx-auto bg-[#14141C] border border-[#1F1F2B] rounded-xl p-8 md:p-12 shadow-2xl relative z-10">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#00D4AA] hover:underline mb-8">
          ← Back to Terminal
        </a>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-xs font-mono text-[#7A7A8C] mb-8">Last Updated: June 27, 2026</p>
        
        <div className="space-y-6 text-[#A0A0B0] text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">1. Acceptance of Terms</h2>
            <p>
              By accessing the Quantra Terminal dashboard, users agree to be bound by these Terms of Service. If you do not agree, you must immediately terminate access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">2. Analytical Tools</h2>
            <p>
              All machine learning forecasts, technical analysis indicators, and sentiment metrics displayed within Quantra are provided exclusively for computational and informational research. None of these indicators constitute investment recommendations, financial advice, or endorsement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">3. Liability Disclaimer</h2>
            <p>
              Under no circumstances shall Quantra or its contributors be held liable for trading losses, analytical inaccuracies, model drift, or latency anomalies arising from system integrations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#E7E7F0] mb-2 font-mono">4. Usage Policies</h2>
            <p>
              Abusive behavior, automated scraping of analytical outputs, or attempts to disrupt API servers will result in prompt account termination.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
