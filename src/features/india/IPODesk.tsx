"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { Rocket } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BLUE, AMBER, tooltipStyle, Caption, EdgeChip, IPOS } from "./common";

// Curated global IPO pipeline (illustrative, July 2026)
const GLOBAL_IPOS = [
  { name: "Stripe", status: "Upcoming", band: "Est. $91B valuation", gmp: null, sub: null, listedGain: null, sinceIssue: null, date: "Q4 2026" },
  { name: "Databricks", status: "Open", band: "$55–62B target", gmp: null, sub: 11.2, listedGain: null, sinceIssue: null, date: "Books close Jul 15" },
  { name: "Canva", status: "Upcoming", band: "Est. $34B valuation", gmp: null, sub: null, listedGain: null, sinceIssue: null, date: "Sep 2026" },
  { name: "Revolut", status: "Upcoming", band: "Est. $45B valuation", gmp: null, sub: null, listedGain: null, sinceIssue: null, date: "2026" },
  { name: "CoreWeave", status: "Listed", band: "$40", gmp: null, sub: 8.9, listedGain: -2.5, sinceIssue: 168.0, date: "Mar 2025" },
  { name: "Reddit", status: "Listed", band: "$34", gmp: null, sub: 12.4, listedGain: 48.3, sinceIssue: 94.1, date: "Mar 2024" },
  { name: "Arm Holdings", status: "Listed", band: "$51", gmp: null, sub: 10.1, listedGain: 24.7, sinceIssue: 112.5, date: "Sep 2023" },
];

export default function IPODesk() {
  const { market } = useApp();
  const isIndia = market === "india";
  const rows = isIndia ? IPOS : GLOBAL_IPOS;
  const listed = rows.filter((i) => i.status === "Listed");

  return (
    <div className="space-y-6 font-mono">
      <section className="card p-5 bg-card border border-line rounded-xl space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Rocket className="h-3.5 w-3.5 text-amber" /> IPO Desk · {isIndia ? "India (NSE/BSE)" : "US Markets"}
          </div>
          <EdgeChip />
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-muted-text border-b border-line/40">
              <tr className="text-left">
                <th className="font-semibold py-1.5">Company</th>
                <th className="font-semibold">Status</th>
                <th className="font-semibold">{isIndia ? "Price / Band" : "Price / Valuation"}</th>
                {isIndia && <th className="font-semibold text-right">GMP (hype)</th>}
                <th className="font-semibold text-right">Subscribed</th>
                <th className="font-semibold text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {rows.map((ipo) => (
                <tr key={ipo.name} className="hover:bg-line/20">
                  <td className="py-2 text-ink font-bold">{ipo.name}</td>
                  <td>
                    <span className={`chip text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      ipo.status === "Open"
                        ? "bg-secondary/10 text-secondary border-secondary/20"
                        : ipo.status === "Upcoming"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-line text-muted-text border-line"
                    }`}>
                      {ipo.status}
                    </span>
                  </td>
                  <td className="text-ink">{ipo.band}</td>
                  {isIndia && (
                    <td className="text-right">{ipo.gmp !== null ? <span className="text-amber font-bold">+{ipo.gmp}%</span> : <span className="text-muted-text">—</span>}</td>
                  )}
                  <td className="text-right text-ink">{ipo.sub !== null ? `${ipo.sub}×` : "—"}</td>
                  <td className="text-right text-muted-text">{ipo.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hype vs reality for listed IPOs */}
        <div className="pt-2">
          <div className="label text-[9px] text-muted-text font-bold uppercase tracking-widest mb-2">
            Hype vs Reality · recent listings
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={listed.map((i) => ({ name: i.name.split(" ")[0], "Listing-day pop": i.listedGain, "Return since issue": i.sinceIssue }))}
                margin={{ left: -5, right: 10, top: 5, bottom: 0 }}
                barGap={2}
              >
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#E7E7F0", fontSize: 10, fontFamily: "DM Mono", fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: "#7A7A8C", fontSize: 9, fontFamily: "DM Mono" }} />
                <Tooltip {...tooltipStyle} formatter={(v) => { const n = Number(v); return `${n >= 0 ? "+" : ""}${n}%`; }} cursor={{ fill: "#1F1F2B", opacity: 0.35 }} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "DM Mono" }} />
                <ReferenceLine y={0} stroke="#1F1F2B" />
                <Bar dataKey="Listing-day pop" fill={BLUE} radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="Return since issue" fill={AMBER} radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Caption>
          {isIndia ? (
            <>
              GMP (grey market premium) is the pre-listing hype number every IPO app headlines. The blue-vs-amber
              pairs show why it misleads: Lenskart popped +33% on day one but trades below issue price now, while
              &quot;boring&quot; Groww quietly compounded +42%. Only the amber bar is your actual return. Illustrative data.
            </>
          ) : (
            <>
              Day-one pops make headlines; the amber bar is what you actually earned holding from the issue price.
              CoreWeave listed flat and then tripled — Reddit popped and kept going — proof that the first-day
              number tells you almost nothing. Illustrative data.
            </>
          )}
        </Caption>
      </section>
    </div>
  );
}
