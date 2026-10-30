/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { IAMUser } from '../types/iam';

interface ModelSettingsProps {
  users: IAMUser[];
  startUser: string;
  onStartUserChange: (user: string) => void;
  depthLimitL: number;
  onDepthLimitLChange: (l: number) => void;
  halfLifeHours: number;
  onHalfLifeHoursChange: (h: number) => void;
  threshold: number;
  onThresholdChange: (t: number) => void;
  intercept: number;
  onInterceptChange: (b: number) => void;
  weights: Record<string, number>;
  onWeightChange: (key: string, val: number) => void;
  onResetDefaults: () => void;
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({
  users,
  startUser,
  onStartUserChange,
  depthLimitL,
  onDepthLimitLChange,
  halfLifeHours,
  onHalfLifeHoursChange,
  threshold,
  onThresholdChange,
  intercept,
  onInterceptChange,
  weights,
  onWeightChange,
  onResetDefaults,
}) => {
  const featureLabels: Record<string, string> = {
    f1_path_length: 'f1: Path Length (Hops)',
    f2_role_transitions: 'f2: Role Transitions',
    f3_target_elevation: 'f3: Target Elevation Level',
    f4_audit_recency: 'f4: Time-Decayed Audit Activity',
    f5_dormant_principals: 'f5: Dormant Identity Count',
    f6_wildcard_exposure: 'f6: Wildcard Action/Resource',
    f7_unrestricted_trust: 'f7: Unrestricted Trust Policy',
    f8_high_risk_actions: 'f8: High-Risk IAM Actions',
    f9_path_novelty: 'f9: Path Novelty Factor',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Detection Parameters &amp; Weights Control</h3>
        </div>
        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Default Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Start Identity Selector */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Start User (Identity Root):
          </label>
          <select
            value={startUser}
            onChange={(e) => onStartUserChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Root identity where BFS traversal initiates.
          </p>
        </div>

        {/* Depth Limit L */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Depth Limit (L): <span className="text-indigo-400 font-mono">{depthLimitL} hops</span>
            </label>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={depthLimitL}
            onChange={(e) => onDepthLimitLChange(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>1 hop</span>
            <span>3 hops</span>
            <span>6 hops</span>
          </div>
        </div>

        {/* Audit Half-Life */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Audit Half-Life (t<sub>&frac12;</sub>):{' '}
            <span className="text-indigo-400 font-mono">{halfLifeHours} hrs</span>
          </label>
          <input
            type="number"
            min={1}
            max={720}
            step={1}
            value={halfLifeHours}
            onChange={(e) => onHalfLifeHoursChange(Math.max(1, parseFloat(e.target.value) || 24))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            &lambda; = ln(2)/t<sub>&frac12;</sub> = {(Math.LN2 / halfLifeHours).toFixed(6)} hr⁻¹
          </p>
        </div>

        {/* Decision Threshold */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Alert Threshold (&tau;):{' '}
              <span className="text-emerald-400 font-mono">{threshold.toFixed(2)}</span>
            </label>
          </div>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Trigger ALERT when logistic probability s &ge; &tau;.
          </p>
        </div>
      </div>

      {/* Model Weights & Intercept */}
      <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Logistic Regression Weights (w<sub>j</sub>) &amp; Base Intercept (b)
          </div>
          <div className="text-[11px] text-amber-300 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Changing inputs updates every walkthrough step immediately.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Base Intercept */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <label className="block text-[11px] font-bold text-indigo-300 mb-1 truncate">
              Intercept (b)
            </label>
            <input
              type="number"
              step={0.05}
              value={intercept}
              onChange={(e) => onInterceptChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
            />
          </div>

          {/* 9 Feature Weights */}
          {Object.keys(weights).map((key) => (
            <div key={key} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 truncate" title={featureLabels[key] || key}>
                {featureLabels[key] || key}
              </label>
              <input
                type="number"
                step={0.05}
                value={weights[key]}
                onChange={(e) => onWeightChange(key, parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
