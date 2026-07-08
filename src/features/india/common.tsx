"use client";

import React from "react";

export const UP = "#00D4AA";
export const DOWN = "#E05555";
export const BLUE = "#4D9FFF";
export const AMBER = "#F5A524";

export const tooltipStyle = {
  contentStyle: { backgroundColor: "#0E0E15", borderColor: "#1F1F2B", borderRadius: "8px" },
  labelStyle: { color: "#7A7A8C", fontSize: "10px", fontFamily: "DM Mono" },
  itemStyle: { color: "#E7E7F0", fontSize: "11px", fontFamily: "DM Mono" },
};

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-muted-text leading-relaxed border-t border-line/30 pt-3">
      <span className="text-primary font-bold uppercase">How to read this · </span>
      {children}
    </p>
  );
}

export function EdgeChip() {
  return (
    <span className="chip bg-amber/10 text-amber border border-amber/20 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
      Quantra Edge · most apps hide this
    </span>
  );
}

// ---------------- Curated datasets (illustrative, July 2026) ----------------
export const NSE_STOCKS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS", "TATAMOTORS.NS"];

export const MUTUAL_FUNDS = [
  { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap", nav: 92.4, cagr5y: 21.8, expDirect: 0.63, expRegular: 1.33, rating: 5 },
  { name: "Quant Small Cap", cat: "Small Cap", nav: 284.1, cagr5y: 31.2, expDirect: 0.77, expRegular: 1.78, rating: 5 },
  { name: "HDFC Mid-Cap Opportunities", cat: "Mid Cap", nav: 212.7, cagr5y: 26.4, expDirect: 0.74, expRegular: 1.42, rating: 4 },
  { name: "Axis ELSS Tax Saver", cat: "ELSS", nav: 108.3, cagr5y: 14.9, expDirect: 0.96, expRegular: 1.55, rating: 3 },
  { name: "SBI Bluechip", cat: "Large Cap", nav: 96.8, cagr5y: 17.2, expDirect: 0.86, expRegular: 1.49, rating: 4 },
  { name: "UTI Nifty 50 Index", cat: "Index", nav: 178.5, cagr5y: 16.1, expDirect: 0.17, expRegular: 0.30, rating: 4 },
];

// Pairwise portfolio overlap %, symmetric (top holdings in common, weight-adjusted)
export const OVERLAP_FUNDS = ["Parag Parikh", "SBI Bluechip", "UTI Nifty 50", "HDFC Mid-Cap", "Quant Small"];
export const OVERLAP = [
  [100, 34, 31, 9, 4],
  [34, 100, 72, 12, 3],
  [31, 72, 100, 8, 2],
  [9, 12, 8, 100, 18],
  [4, 3, 2, 18, 100],
];

export const ETFS = [
  { name: "Nippon India Nifty BeES", tracks: "NIFTY 50", exp: 0.04, aum: "₹42,800 Cr", note: "Most liquid equity ETF" },
  { name: "SBI Nifty 50 ETF", tracks: "NIFTY 50", exp: 0.04, aum: "₹2.1L Cr", note: "Largest by AUM (EPFO money)" },
  { name: "Nippon India Gold BeES", tracks: "Gold", exp: 0.82, aum: "₹18,400 Cr", note: "Digital gold without lockers" },
  { name: "Bharat Bond ETF 2033", tracks: "PSU Bonds", exp: 0.0005, aum: "₹12,100 Cr", note: "Near-zero fee debt" },
  { name: "Motilal Nasdaq 100 ETF", tracks: "NASDAQ 100", exp: 0.58, aum: "₹9,600 Cr", note: "US tech from India" },
];

export const IPOS = [
  { name: "Reliance Jio Platforms", status: "Upcoming", band: "₹1,215–1,280", gmp: 22, sub: null, listedGain: null, sinceIssue: null, date: "Aug 2026" },
  { name: "PhonePe", status: "Open", band: "₹745–786", gmp: 31, sub: 18.4, listedGain: null, sinceIssue: null, date: "Closes Jul 11" },
  { name: "Zepto", status: "Upcoming", band: "₹310–328", gmp: 12, sub: null, listedGain: null, sinceIssue: null, date: "Sep 2026" },
  { name: "Lenskart", status: "Listed", band: "₹382", gmp: null, sub: 28.3, listedGain: 33.1, sinceIssue: -4.2, date: "Nov 2025" },
  { name: "Groww (Billionbrains)", status: "Listed", band: "₹100", gmp: null, sub: 17.8, listedGain: 12.4, sinceIssue: 41.6, date: "Nov 2025" },
  { name: "Tata Capital", status: "Listed", band: "₹326", gmp: null, sub: 1.95, listedGain: 1.2, sinceIssue: -8.9, date: "Oct 2025" },
];

// SIP fee-eater: ₹10,000/month for 15 years at a gross return, net of expenses
export function sipSeries(grossPct: number, expensePct: number) {
  const monthly = 10000;
  const i = Math.pow(1 + (grossPct - expensePct) / 100, 1 / 12) - 1;
  const out: number[] = [];
  let fv = 0;
  for (let m = 1; m <= 180; m++) {
    fv = (fv + monthly) * (1 + i);
    if (m % 12 === 0) out.push(Math.round(fv));
  }
  return out;
}

export const fmtL = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
export const pctSigned = (p: number) => (p >= 0 ? "+" : "") + p.toFixed(2) + "%";
