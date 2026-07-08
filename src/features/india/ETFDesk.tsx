"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Caption, ETFS } from "./common";

export default function ETFDesk() {
  return (
    <div className="space-y-6 font-mono">
      <section className="card p-5 bg-card border border-line rounded-xl space-y-3">
        <header className="label text-[9px] text-muted-text font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-3">
          <Layers className="h-3.5 w-3.5 text-primary" /> ETFs · Index Investing on the Exchange
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-muted-text border-b border-line/40">
              <tr className="text-left">
                <th className="font-semibold py-1.5">ETF</th>
                <th className="font-semibold">Tracks</th>
                <th className="font-semibold text-right">Expense</th>
                <th className="font-semibold text-right">AUM</th>
                <th className="font-semibold text-right">Why it matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {ETFS.map((e) => (
                <tr key={e.name} className="hover:bg-line/20">
                  <td className="py-2 text-ink font-bold">{e.name}</td>
                  <td className="text-muted-text">{e.tracks}</td>
                  <td className="text-right">
                    <span className={`font-bold ${e.exp <= 0.1 ? "text-secondary" : e.exp <= 0.6 ? "text-ink" : "text-amber"}`}>
                      {e.exp < 0.01 ? "0.0005%" : `${e.exp.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="text-right text-ink">{e.aum}</td>
                  <td className="text-right text-muted-text">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Caption>
          An ETF is a mutual fund you trade like a stock. The expense column is the whole story: green means
          the fund keeps almost nothing of your return — a NIFTY ETF at 0.04% beats most active funds at 1%+ after fees.
        </Caption>
      </section>
    </div>
  );
}
