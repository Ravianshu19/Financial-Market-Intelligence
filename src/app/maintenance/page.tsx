"use client";

import React from "react";

export default function MaintenancePage() {
  const handleRetry = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#09090E] text-[#E7E7F0] flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,170,0.05),transparent_60%)] pointer-events-none" />
      <div className="max-w-[480px] w-full bg-[#14141C] border border-[#1F1F2B] rounded-xl p-8 text-center shadow-2xl relative z-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] mb-6 animate-pulse">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Quantra<span className="text-[#00D4AA]">.</span></h1>
        <p className="text-[#00D4AA] text-xs font-mono mb-6 uppercase tracking-widest font-semibold">Under Scheduled Maintenance</p>
        <p className="text-[#7A7A8C] text-sm leading-relaxed mb-8">
          The Quantra research terminal and forecasting pipelines are currently undergoing scheduled upgrades to optimize execution latency and improve forecasting models. We should be back shortly.
        </p>
        <button
          onClick={handleRetry}
          className="w-full py-3 px-4 rounded-lg bg-[#00D4AA] hover:bg-[#00B894] text-[#09090E] font-bold text-sm transition-all shadow-md cursor-pointer hover:shadow-lg"
        >
          Check Connection
        </button>
      </div>
    </div>
  );
}
