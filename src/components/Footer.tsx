/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Lock, FileText, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-200 font-bold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Explainable IAM Privilege Escalation Detection System</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-lg">
            Built with deterministic breadth-first graph traversal, time-decayed audit recency, and transparent logistic regression. Zero black-box AI models in the detection path.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pure Deterministic Logic</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Traceable Evidence Pointers</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Auditable Analyst Decisions</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
        <div>
          Advisory Detection Demo &bull; All evaluations are advisory and subject to human analyst review.
        </div>
        <div>
          Model weights remain fixed &amp; invariant to analyst decisions.
        </div>
      </div>
    </footer>
  );
};
