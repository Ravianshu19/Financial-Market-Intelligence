"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LabelList,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PiggyBank, AlertTriangle } from "lucide-react";
import { UP, BLUE, AMBER, tooltipStyle, Caption, EdgeChip, MUTUAL_FUNDS, OVERLAP_FUNDS, OVERLAP, sipSeries, fmtL } from "./common";

export default function MutualFundsDesk() {
  const [fundTab, setFundTab] = useState<"returns" | "fees" | "overlap">("returns");

  const direct = sipSeries(12, 0.5);
  const regular = sipSeries(12, 1.8);
  const feeData = direct.map((v, idx) => ({ year: `Y${idx + 1}`, "Direct plan": v, "Regular plan": regular[idx] }));
  const feeGap = direct[direct.length - 1] - regular[regular.length - 1];

  const fundBars = [...MUTUAL_FUNDS].sort((a, b) => b.cagr5y - a.cagr5y).map((f) => ({ name: f.name, cagr: f.cagr5y }));

  return (
    <div className="space-y-6 font-mono">
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <PiggyBank className="h-3.5 w-3.5 text-secondary" /> Mutual Funds · India
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            {([["returns", "5Y Returns"], ["fees", "True Cost of Fees"], ["overlap", "Overlap X-Ray"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFundTab(id)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  fundTab === id ? "bg-line text-ink font-semibold" : "text-muted-text hover:text-ink hover:bg-line/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {fundTab === "returns" && (
          <>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundBars} layout="vertical" margin={{ left: 10, right: 48, top: 5, bottom: 0 }}>
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <YAxis type="category" dataKey="name" width={172} tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 9.5, fontFamily: "DM Mono" }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}% per year (5Y CAGR)`, ""]} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                  <Bar dataKey="cagr" fill={BLUE} radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="cagr" position="right" formatter={(v) => `${v}%`} style={{ fill: "#E7E7F0", fontSize: 9, fontFamily: "DM Mono", fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-text border-b border-line/40">
                  <tr className="text-left">
                    <th className="font-semibold py-1.5">Fund</th>
                    <th className="font-semibold">Category</th>
                    <th className="font-semibold text-right">NAV</th>
                    <th className="font-semibold text-right">Expense (Direct)</th>
                    <th className="font-semibold text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/20">
                  {MUTUAL_FUNDS.map((f) => (
                    <tr key={f.name} className="hover:bg-line/20">
                      <td className="py-1.5 text-ink font-bold">{f.name}</td>
                      <td className="text-muted-text">{f.cat}</td>
                      <td className="text-right text-ink">₹{f.nav.toFixed(1)}</td>
                      <td className="text-right text-ink">{f.expDirect.toFixed(2)}%</td>
                      <td className="text-right text-amber">{"★".repeat(f.rating)}<span className="text-line">{"★".repeat(5 - f.rating)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Caption>
              5Y CAGR means yearly average growth over five years — 20% CAGR roughly turns ₹1L into ₹2.5L.
              Past returns don&apos;t repeat on schedule; pair them with the fee and overlap tabs before choosing. Illustrative data.
            </Caption>
          </>
        )}

        {fundTab === "fees" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <EdgeChip />
              <span className="text-[10px] text-muted-text">₹10,000/month SIP · 15 years · 12% gross return</span>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feeData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => fmtL(Number(v))} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => fmtL(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                  <Line type="monotone" dataKey="Direct plan" stroke={UP} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Regular plan" stroke={AMBER} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <span className="text-muted-text">
                Same fund, same market — the regular plan&apos;s extra ~1.3% commission quietly eats{" "}
                <span className="text-danger font-bold">{fmtL(feeGap)}</span> of your money over 15 years.
              </span>
            </div>
            <Caption>
              Every fund has a Direct plan (you buy it yourself, low fee) and a Regular plan (a distributor
              sells it to you, higher fee). Apps that earn commissions rarely show this gap in rupees. This is why.
            </Caption>
          </>
        )}

        {fundTab === "overlap" && (
          <>
            <EdgeChip />
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center">
                <thead>
                  <tr>
                    <th />
                    {OVERLAP_FUNDS.map((f) => (
                      <th key={f} className="font-bold text-muted-text pb-2 px-1">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OVERLAP_FUNDS.map((f, i) => (
                    <tr key={f}>
                      <td className="font-bold text-muted-text text-left py-1 pr-2 whitespace-nowrap">{f}</td>
                      {OVERLAP[i].map((v, j) => (
                        <td key={j} className="p-1">
                          <span
                            className="inline-block w-14 py-1.5 rounded font-bold text-ink"
                            style={{ backgroundColor: i === j ? "rgba(122,122,140,0.12)" : `rgba(224,85,85,${(v / 100) * 0.8})` }}
                          >
                            {i === j ? "—" : `${v}%`}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <span className="text-muted-text">
                SBI Bluechip and UTI Nifty 50 overlap <span className="text-danger font-bold">72%</span> — holding
                both is paying two fees for nearly one portfolio.
              </span>
            </div>
            <Caption>
              Each cell shows how much two funds&apos; holdings are the same. Deeper red = more duplication.
              Under ~30% is genuine diversification; above ~60% you own the same stocks twice. Illustrative data.
            </Caption>
          </>
        )}
      </section>
    </div>
  );
}
