/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface BannerProps {
  onOpenTests: () => void;
  onExport: () => void;
  currentStep: number;
}

export const Banner: React.FC<BannerProps> = ({ onOpenTests, onExport, currentStep }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-900/60 text-white">
      {/* Top Advisory Pill Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">Explainable Security Operations Engine</span>
          <span className="hidden sm:inline text-indigo-400/80">
            &bull; Deterministic Mathematical Logic &bull; Zero Black-Box AI in Detection &bull; Pure Explainability
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-semibold text-xs border border-indigo-700 cursor-pointer transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Automated Tests</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs border border-emerald-700 cursor-pointer transition"
          >
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>AWS &amp; Cloud IAM Privilege Escalation Detection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Explainable IAM Privilege Escalation Demo
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-3xl leading-relaxed">
              Detects multi-hop credential escalation paths from unprivileged identities to administrative access using graph traversal and a calibrated logistic regression scoring model. Every step, feature, and formula is transparently calculated with full source statement verification.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl shrink-0 flex flex-col justify-center">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Walkthrough Active State
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              Step {currentStep} of 7
            </div>
            <div className="text-xs text-indigo-300 font-medium">
              Interactive Stepper Enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
