/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  IAMSnapshot,
  IAMGraph,
  DiscoveredPath,
  FeatureDefinition,
  DecayWorkedExample,
  ScoringResult,
  ReasonFidelityReport,
  AnalystDecisionRecord,
  EdgeType,
  BFSHopSnapshot,
} from '../types/iam';
import { IAMGraphView } from './IAMGraphView';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  GitFork,
  Search,
  Ruler,
  Calculator,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Code2,
  Clock,
  ArrowRight,
  HelpCircle,
  Eye,
  AlertOctagon,
  Sparkles,
  Info,
} from 'lucide-react';

interface WalkthroughStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  snapshot: IAMSnapshot;
  graph: IAMGraph;
  bfsSnapshots: BFSHopSnapshot[];
  chosenPath: DiscoveredPath;
  allAdminPaths: DiscoveredPath[];
  onSelectPath: (path: DiscoveredPath) => void;
  features: Record<string, FeatureDefinition>;
  decayWorkedExample: DecayWorkedExample | null;
  scoring: ScoringResult;
  evidenceReport: ReasonFidelityReport;
  templateRationale: string;
  analystDecision: AnalystDecisionRecord;
  onRecordDecision: (decision: 'Confirm' | 'Dismiss', notes: string) => void;
  depthLimitL: number;
  halfLifeHours: number;
  startUser: string;
}

const STEP_TITLES = [
  'Read Snapshot',
  'Build Graph',
  'Search (BFS)',
  'Measure Features',
  'Score (Logistic)',
  'Explain Evidence',
  'Decide & Review',
];

export const WalkthroughStepper: React.FC<WalkthroughStepperProps> = ({
  currentStep,
  onStepChange,
  snapshot,
  graph,
  bfsSnapshots,
  chosenPath,
  allAdminPaths,
  onSelectPath,
  features,
  decayWorkedExample,
  scoring,
  evidenceReport,
  templateRationale,
  analystDecision,
  onRecordDecision,
  depthLimitL,
  halfLifeHours,
  startUser,
}) => {
  // Sub-states for specific steps
  const [showRawJson, setShowRawJson] = useState(false);
  const [graphEdgeFilter, setGraphEdgeFilter] = useState<EdgeType | 'ALL'>('ALL');
  const [activeBfsHopIndex, setActiveBfsHopIndex] = useState(0);
  const [analystNotesInput, setAnalystNotesInput] = useState(analystDecision.notes);

  const activeBfsHop = bfsSnapshots[activeBfsHopIndex] || bfsSnapshots[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Interactive Guided Walkthrough (7 Steps)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            How Privilege Escalation Detection Works
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs font-mono font-medium text-slate-400 px-2">
            Step {currentStep} of 7
          </span>
          <button
            onClick={() => onStepChange(Math.min(7, currentStep + 1))}
            disabled={currentStep === 7}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-indigo-600/30"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;

            return (
              <button
                key={title}
                onClick={() => onStepChange(stepNum)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : isDone
                    ? 'bg-slate-800/80 text-indigo-300 hover:bg-slate-800'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-white text-indigo-700'
                      : isDone
                      ? 'bg-indigo-900 text-indigo-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
                    Step {stepNum}
                  </div>
                  <div className="text-xs font-semibold truncate">{title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content */}
      <div className="p-6">
        {/* STEP 1: READ THE SNAPSHOT */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <Database className="w-4 h-4" />
                <span>Step 1: Read the Snapshot</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The engine ingests a complete Cloud IAM state snapshot containing all configured principals, groups, roles, and authorization policies. It verifies entity schemas and indexes relationships before graph compilation. This forms the ground truth for identity permissions.
              </p>
            </div>

            {/* Live Data Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Users (Principals)
                </div>
                <div className="text-3xl font-extrabold text-sky-400 mt-1">
                  {snapshot.users.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {snapshot.users.map((u) => u.name.split(' ')[0]).join(', ')}
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  IAM Groups
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {snapshot.groups.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {snapshot.groups.map((g) => g.id.replace('group:', '')).join(', ')}
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  IAM Roles
                </div>
                <div className="text-3xl font-extrabold text-purple-400 mt-1">
                  {snapshot.roles.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {snapshot.roles.filter((r) => r.isElevated).length} elevated administrator role
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Policy Documents
                </div>
                <div className="text-3xl font-extrabold text-amber-400 mt-1">
                  {snapshot.policies.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {snapshot.policies.reduce((acc, p) => acc + p.statements.length, 0)} discrete statements
                </div>
              </div>
            </div>

            {/* Collapsible Raw JSON */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Inspect Live IAM Snapshot Raw JSON</span>
                </div>
                <span className="text-indigo-400 text-xs">
                  {showRawJson ? 'Hide JSON [-]' : 'Show Collapsible Raw JSON [+]'}
                </span>
              </button>

              {showRawJson && (
                <div className="p-4 border-t border-slate-800 max-h-80 overflow-y-auto font-mono text-xs text-slate-300">
                  <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: BUILD THE GRAPH */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <GitFork className="w-4 h-4" />
                <span>Step 2: Build the Graph</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Entities are converted into nodes (Users, Groups, Roles, and Admin Targets), and permissions are parsed into three explicit edge types. Each edge maintains a direct pointer to its backing policy statement or trust policy document for full audit traceability.
              </p>
            </div>

            {/* Edge Type Filters and Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setGraphEdgeFilter('MEMBER_OF')}
                className={`p-3 rounded-xl border text-left transition ${
                  graphEdgeFilter === 'MEMBER_OF'
                    ? 'border-emerald-500 bg-emerald-950/40'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">1. MEMBER_OF</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    {graph.edges.filter((e) => e.type === 'MEMBER_OF').length} edges
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Represents identity inclusion in an IAM group, inheriting group-attached policies.
                </p>
              </button>

              <button
                onClick={() => setGraphEdgeFilter('CAN_PASS')}
                className={`p-3 rounded-xl border text-left transition ${
                  graphEdgeFilter === 'CAN_PASS'
                    ? 'border-amber-500 bg-amber-950/40'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">2. CAN_PASS (PassRole)</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    {graph.edges.filter((e) => e.type === 'CAN_PASS').length} edges
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Grants permission to pass an IAM role to an AWS compute service or runner (iam:PassRole).
                </p>
              </button>

              <button
                onClick={() => setGraphEdgeFilter('CAN_ASSUME')}
                className={`p-3 rounded-xl border text-left transition ${
                  graphEdgeFilter === 'CAN_ASSUME'
                    ? 'border-purple-500 bg-purple-950/40'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">3. CAN_ASSUME (AssumeRole)</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                    {graph.edges.filter((e) => e.type === 'CAN_ASSUME').length} edges
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Grants temporary credential assumption (sts:AssumeRole) via identity or role trust policy.
                </p>
              </button>
            </div>

            {/* Edge Statements Pointer Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Source Statement Pointers Table ({graph.edges.length} Total Edges)</span>
                <button
                  onClick={() => setGraphEdgeFilter('ALL')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-normal cursor-pointer"
                >
                  Show All Edge Types
                </button>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2">Source Node</th>
                      <th className="px-3 py-2">Edge Type</th>
                      <th className="px-4 py-2">Target Node</th>
                      <th className="px-4 py-2">Source Statement Pointer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {graph.edges
                      .filter(
                        (e) => graphEdgeFilter === 'ALL' || e.type === graphEdgeFilter
                      )
                      .map((e) => (
                        <tr key={e.id} className="hover:bg-slate-900/60 transition">
                          <td className="px-4 py-2 text-sky-400">{e.source}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                e.type === 'MEMBER_OF'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : e.type === 'CAN_PASS'
                                  ? 'bg-amber-950 text-amber-400'
                                  : 'bg-purple-950 text-purple-400'
                              }`}
                            >
                              {e.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-purple-300">{e.target}</td>
                          <td className="px-4 py-2 text-indigo-300 font-bold">
                            {e.sourceStatementRef}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Embedded Visual Graph Highlight */}
            <IAMGraphView
              graph={graph}
              highlightedEdgeType={graphEdgeFilter}
              activePath={chosenPath.path}
            />
          </div>
        )}

        {/* STEP 3: SEARCH (BFS) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <Search className="w-4 h-4" />
                <span>Step 3: Search (Breadth-First Search)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Breadth-first search traverses the identity graph outward layer by layer from the starting user identity up to depth limit L={depthLimitL}. At each hop, the active queue frontier explores accessible target nodes while tracking visited identities to prevent cyclical loops. When an administrative target node is encountered, the escalation path is captured.
              </p>
            </div>

            {/* Live BFS Hop Stepper Controls */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Frontier Hop:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {bfsSnapshots.map((snap, sIdx) => (
                      <button
                        key={snap.hopNumber}
                        onClick={() => setActiveBfsHopIndex(sIdx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                          activeBfsHopIndex === sIdx
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {snap.hopNumber}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveBfsHopIndex(Math.max(0, activeBfsHopIndex - 1))}
                    disabled={activeBfsHopIndex === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous Hop
                  </button>
                  <button
                    onClick={() =>
                      setActiveBfsHopIndex(
                        Math.min(bfsSnapshots.length - 1, activeBfsHopIndex + 1)
                      )
                    }
                    disabled={activeBfsHopIndex === bfsSnapshots.length - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next Hop &rarr;
                  </button>
                </div>
              </div>

              {/* Hop Status Log */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-300 mb-4 flex items-center justify-between">
                <span>{activeBfsHop.logMessage}</span>
                {activeBfsHop.adminReached && (
                  <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    ADMIN TARGET REACHED
                  </span>
                )}
              </div>

              {/* Live Queue & Visited Set Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Frontier Queue Contents</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeBfsHop.frontierQueue.length} paths in queue
                    </span>
                  </div>
                  {activeBfsHop.frontierQueue.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">
                      Frontier queue empty (search concluded or terminal node reached).
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-xs text-slate-300">
                      {activeBfsHop.frontierQueue.map((item, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center gap-1.5"
                        >
                          <span className="text-indigo-400 font-bold">[{qIdx + 1}]</span>
                          <span className="text-slate-400">{item.path.join(' \u2192 ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Visited Identities Set</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeBfsHop.visitedNodes.length} nodes visited
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {activeBfsHop.visitedNodes.map((nId) => (
                      <span
                        key={nId}
                        className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-2 py-1 rounded text-[11px] font-mono"
                      >
                        {nId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Found Paths Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Discovered Escalation Paths to Admin ({allAdminPaths.length})</span>
                <span className="text-xs text-indigo-400 font-normal">
                  Start user: <code className="bg-slate-900 px-1 py-0.5 rounded">{startUser}</code>, Limit L: {depthLimitL}
                </span>
              </div>
              {allAdminPaths.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 p-3 rounded-lg">
                  No escalation path to administrator exists from &apos;{startUser}&apos; within depth limit L={depthLimitL}. Try increasing depth limit L or selecting a different starting identity.
                </div>
              ) : (
                <div className="space-y-2">
                  {allAdminPaths.map((pathObj, pIdx) => {
                    const isSelected = pathObj.path.join(',') === chosenPath.path.join(',');
                    return (
                      <div
                        key={pIdx}
                        onClick={() => onSelectPath(pathObj)}
                        className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        <div className="font-mono text-xs flex items-center gap-1.5 text-slate-200">
                          <span className="text-indigo-400 font-bold">Path #{pIdx + 1}:</span>
                          <span>{pathObj.path.join(' \u2192 ')}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 ml-2">
                            {pathObj.hops} hops
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded">
                            Active Chosen Path
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual graph with BFS hop highlight */}
            <IAMGraphView
              graph={graph}
              highlightedNodeIds={activeBfsHop.visitedNodes}
              highlightedEdgeIds={activeBfsHop.newDiscoveredEdges.map((e) => e.id)}
              adminReached={activeBfsHop.adminReached}
              activePath={chosenPath.path}
            />
          </div>
        )}

        {/* STEP 4: MEASURE FEATURES */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <Ruler className="w-4 h-4" />
                <span>Step 4: Measure Features</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                For the chosen escalation path, nine quantitative features are evaluated directly from the IAM snapshot and audit logs. The audit recency feature applies an exponential decay function so that recent security events carry greater weight than historical events. All calculations are fully deterministic and inspectable.
              </p>
            </div>

            {/* 9 Features Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>The 9 Explainable Model Features for Chosen Path</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Path: {chosenPath.path.join(' \u2192 ')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Feature</th>
                      <th className="px-4 py-2.5">Plain-English Meaning</th>
                      <th className="px-3 py-2.5">Formula / Basis</th>
                      <th className="px-3 py-2.5 text-right font-mono">Computed Value</th>
                      <th className="px-3 py-2.5 text-right font-mono">Weight (w_j)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.values(features).map((feat, idx) => (
                      <tr key={feat.key} className="hover:bg-slate-900/40 transition">
                        <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">
                          <span className="text-indigo-400 font-mono mr-1.5">f{idx + 1}</span>
                          {feat.name}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          {feat.description}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">
                          {feat.formulaDescription}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                          {feat.value}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-indigo-300">
                          {feat.weight.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time-Decay Worked Example Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                <span>Audit Activity Time-Decay Formula &amp; Worked Example</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed mb-4">
                Audit event influence decays exponentially over time using formula:
                <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded mx-1 font-mono font-bold">
                  w = exp(-&lambda; &middot; &Delta;t)
                </code>
                where
                <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded mx-1 font-mono font-bold">
                  &lambda; = ln(2) / half-life
                </code>
                and &Delta;t is the elapsed time in hours since the audit event occurred.
              </div>

              {decayWorkedExample ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-indigo-400 font-bold">
                    Worked Example using First Audit Event: &apos;{decayWorkedExample.eventId}&apos;
                  </div>
                  <div className="text-slate-400">
                    Principal: <span className="text-sky-300">{decayWorkedExample.principalId}</span> |
                    Action: <span className="text-amber-300">{decayWorkedExample.action}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 space-y-1">
                    {decayWorkedExample.formulaSteps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="text-indigo-500 font-bold">&bull;</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-400 font-bold">
                    Resulting audit event weight contribution: w = {decayWorkedExample.decayWeight}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No audit events currently loaded.</div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: SCORE (LOGISTIC) */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <Calculator className="w-4 h-4" />
                <span>Step 5: Score (Logistic Sigmoid Running Sum)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The logit z is computed as the base intercept b plus each weighted feature term added one at a time. The resulting z is then mapped through the standard logistic function s = 1/(1+exp(-z)) to yield a normalized probability between 0 and 1. If s &ge; threshold, the system flags an ALERT.
              </p>
            </div>

            {/* Running Sum Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Running Sum Accumulation: z = b + &Sigma; (w_j &middot; f_j)</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Base Intercept b = {scoring.intercept.toFixed(2)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Step</th>
                      <th className="px-4 py-2">Feature Added</th>
                      <th className="px-3 py-2 text-right font-mono">Value (f_j)</th>
                      <th className="px-3 py-2 text-right font-mono">Weight (w_j)</th>
                      <th className="px-3 py-2 text-right font-mono">Term (w_j &middot; f_j)</th>
                      <th className="px-4 py-2 text-right font-mono text-indigo-300">Running Sum &rarr;</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr className="bg-slate-900/40 text-slate-400">
                      <td className="px-3 py-2 font-bold text-slate-500">0</td>
                      <td className="px-4 py-2 font-sans font-semibold text-slate-300">
                        Initial Base Intercept (b)
                      </td>
                      <td className="px-3 py-2 text-right">-</td>
                      <td className="px-3 py-2 text-right">-</td>
                      <td className="px-3 py-2 text-right">{scoring.intercept.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-200">
                        {scoring.intercept.toFixed(4)}
                      </td>
                    </tr>
                    {scoring.terms.map((t, idx) => (
                      <tr key={t.featureKey} className="hover:bg-slate-900/40 transition">
                        <td className="px-3 py-2 font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2 font-sans font-semibold text-white">
                          <span className="text-indigo-400 font-mono mr-1">f{idx + 1}:</span>
                          {t.featureName}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-400">{t.value}</td>
                        <td className="px-3 py-2 text-right text-indigo-300">{t.weight.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-400">
                          +{t.termProduct.toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-300 bg-slate-900/30">
                          {t.runningSumAfter.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-950/40 border-t-2 border-indigo-800 text-white">
                      <td colSpan={5} className="px-4 py-2.5 font-sans font-bold text-indigo-300">
                        Final Accumulated Logit (z)
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-extrabold text-indigo-300 text-sm">
                        {scoring.zScore.toFixed(4)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logistic Function Transformation & Visual Scale */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Logistic Sigmoid Mapping
                  </div>
                  <div className="font-mono text-sm text-slate-200 mt-1">
                    s = 1 / (1 + exp(-z)) = 1 / (1 + exp(-{scoring.zScore.toFixed(4)})) ={' '}
                    <span className="font-extrabold text-lg text-emerald-400">
                      {scoring.probability.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      scoring.isAlert
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {scoring.isAlert ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {scoring.decisionText} (Threshold &tau; = {scoring.threshold.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* 0-to-1 Visual Scale */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>0.00 (Minimal Risk)</span>
                  <span className="text-amber-400 font-bold">
                    Threshold &tau; = {scoring.threshold.toFixed(2)}
                  </span>
                  <span>1.00 (Extreme Risk)</span>
                </div>
                <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  {/* Threshold split background */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-emerald-950/60"
                    style={{ width: `${scoring.threshold * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-rose-950/60"
                    style={{ width: `${(1 - scoring.threshold) * 100}%` }}
                  />

                  {/* Threshold mark line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10"
                    style={{ left: `${scoring.threshold * 100}%` }}
                    title={`Threshold = ${scoring.threshold}`}
                  />

                  {/* Score Indicator Pointer */}
                  <div
                    className="absolute top-0 bottom-0 w-3 bg-white border-2 border-indigo-600 rounded-full -ml-1.5 z-20 shadow-md shadow-white/50"
                    style={{ left: `${Math.min(100, Math.max(0, scoring.probability * 100))}%` }}
                  />
                </div>
                <div className="mt-2 text-center text-xs text-slate-300">
                  Calculated score <strong className="text-white">{scoring.probability.toFixed(4)}</strong> is{' '}
                  <strong className={scoring.isAlert ? 'text-rose-400' : 'text-emerald-400'}>
                    {scoring.isAlert ? 'above' : 'below'}
                  </strong>{' '}
                  the advisory detection threshold ({scoring.threshold.toFixed(2)}).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: EXPLAIN EVIDENCE */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <FileCheck className="w-4 h-4" />
                <span>Step 6: Explain (Evidence Chain &amp; Reason Fidelity)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explainability verifies that every claim in the escalation detection links directly back to verified policy statements. The evidence chain maps each hop to its backing statement pointer. Reason fidelity calculates the percentage of verified pointers to prevent false or hallucinated explanations.
              </p>
            </div>

            {/* Template Rationale Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                Template Rationale (Plain-English Explanation)
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                &ldquo;{templateRationale}&rdquo;
              </p>
            </div>

            {/* Reason Fidelity Metric Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reason Fidelity Calculation
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  <span className="text-emerald-400">{evidenceReport.fidelityPercent}%</span>{' '}
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({evidenceReport.verifiedCount} of {evidenceReport.totalCount} pointers verified)
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-300 max-w-sm">
                Fidelity measures the integrity of the evidence pointers: every edge must match an authentic &apos;Allow&apos; statement in the snapshot.
              </div>
            </div>

            {/* Evidence Chain Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs font-semibold text-slate-200">
                Evidence Chain Hops &amp; Statement Pointers
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Hop</th>
                      <th className="px-3 py-2">Transition</th>
                      <th className="px-3 py-2">Action / Type</th>
                      <th className="px-4 py-2">Source Statement Pointer</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-4 py-2">Verification Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {evidenceReport.pointers.map((ptr) => (
                      <tr key={ptr.hopIndex} className="hover:bg-slate-900/40 transition">
                        <td className="px-3 py-2 font-bold text-slate-400">#{ptr.hopIndex}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-200">
                          {ptr.source} &rarr; {ptr.target}
                        </td>
                        <td className="px-3 py-2 text-amber-300">{ptr.action}</td>
                        <td className="px-4 py-2 text-indigo-300 font-bold">
                          {ptr.sourceStatementRef}
                        </td>
                        <td className="px-3 py-2">
                          {ptr.verified ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                              <Check className="w-3 h-3" /> VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold">
                              <X className="w-3 h-3" /> UNVERIFIED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-300 font-sans text-xs">
                          {ptr.verificationReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: DECIDE & REVIEW */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Step 7: Decide &amp; Review (Advisory Alert &amp; Human-in-the-Loop)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The computed score provides an advisory risk signal to assist security operations. By design, the automated evaluation does not automatically revoke access. A human analyst reviews the evidence chain and records a formal triage determination.
              </p>
            </div>

            {/* Advisory Alert Banner */}
            <div
              className={`p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                scoring.isAlert
                  ? 'bg-rose-950/40 border-rose-800/80'
                  : 'bg-emerald-950/40 border-emerald-800/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      scoring.isAlert
                        ? 'bg-rose-900 text-rose-200'
                        : 'bg-emerald-900 text-emerald-200'
                    }`}
                  >
                    System Output: {scoring.decisionText}
                  </span>
                  <span className="text-xs text-slate-400">
                    Calculated Score: {scoring.probability.toFixed(4)} vs Threshold {scoring.threshold.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {scoring.isAlert
                    ? 'Advisory Alert: Privilege Escalation Chain Detected'
                    : 'Advisory Notice: Below Detection Threshold'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {scoring.isAlert
                    ? 'Path allows unprivileged identity to assume administrative privileges. Actionable human triage is advised.'
                    : 'Risk score does not exceed the configured alert threshold. Path may represent normal or bounded access.'}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 px-4 py-3 rounded-lg text-xs text-slate-300 max-w-xs">
                <div className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Important Governance Policy:</span>
                </div>
                Analyst decisions are stored for audit logging and triage reporting. Recording a decision{' '}
                <strong className="text-white">DOES NOT modify model weights</strong>.
              </div>
            </div>

            {/* Record Analyst Decision Form */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-2">
                Record Analyst Decision (Stored in memory and exported report)
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Confirm whether this escalation chain constitutes a genuine unauthorized threat (Confirm) or authorized business delegation (Dismiss).
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Analyst Assessment Notes:
                  </label>
                  <textarea
                    value={analystNotesInput}
                    onChange={(e) => setAnalystNotesInput(e.target.value)}
                    rows={2}
                    placeholder="Enter analyst justification, ticket reference, or mitigating controls..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onRecordDecision('Confirm', analystNotesInput)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      analystDecision.decision === 'Confirm'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                        : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Confirm (True Threat)
                  </button>

                  <button
                    onClick={() => onRecordDecision('Dismiss', analystNotesInput)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      analystDecision.decision === 'Dismiss'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Dismiss (Authorized / Benign)
                  </button>

                  {analystDecision.decision && (
                    <div className="text-xs text-slate-300 font-mono ml-auto">
                      Recorded: <strong className="text-indigo-400">{analystDecision.decision}</strong> by{' '}
                      <span className="text-slate-400">{analystDecision.analystId}</span> at{' '}
                      <span className="text-slate-400">
                        {analystDecision.timestamp ? new Date(analystDecision.timestamp).toLocaleTimeString() : 'now'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Footer Controls */}
      <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Step <strong className="text-white">{currentStep}</strong> of 7:{' '}
          <span className="text-indigo-300 font-medium">{STEP_TITLES[currentStep - 1]}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            &larr; Previous Step
          </button>
          <span>|</span>
          <button
            onClick={() => onStepChange(Math.min(7, currentStep + 1))}
            disabled={currentStep === 7}
            className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Next Step &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
