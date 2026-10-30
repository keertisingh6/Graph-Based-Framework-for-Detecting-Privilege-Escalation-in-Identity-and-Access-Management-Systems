/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  IAMSnapshot,
  AuditEvent,
  DiscoveredPath,
  AnalystDecisionRecord,
} from './types/iam';
import {
  INITIAL_SNAPSHOT,
  INITIAL_AUDIT_EVENTS,
  DEFAULT_WEIGHTS,
  DEFAULT_INTERCEPT,
  DEFAULT_THRESHOLD,
  DEFAULT_HALF_LIFE_HOURS,
  DEFAULT_DEPTH_LIMIT_L,
} from './data/sampleIAM';
import {
  buildIAMGraph,
  runBFSExploration,
  computeNineFeatures,
  computeScoring,
  generateEvidenceReport,
  buildExportPayload,
} from './utils/iamLogic';
import { Banner } from './components/Banner';
import { WalkthroughStepper } from './components/WalkthroughStepper';
import { IAMGraphView } from './components/IAMGraphView';
import { ModelSettings } from './components/ModelSettings';
import { SnapshotInspector } from './components/SnapshotInspector';
import { GlossarySection } from './components/GlossarySection';
import { TestSuiteModal } from './components/TestSuiteModal';
import { Footer } from './components/Footer';
import {
  Download,
  Copy,
  Check,
  Sliders,
  Database,
  BookOpen,
  GitFork,
  X,
  FileJson,
} from 'lucide-react';

export default function App() {
  // Core Configuration State
  const [snapshot, setSnapshot] = useState<IAMSnapshot>(INITIAL_SNAPSHOT);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(INITIAL_AUDIT_EVENTS);
  const [startUser, setStartUser] = useState<string>('user:dev-junior');
  const [depthLimitL, setDepthLimitL] = useState<number>(DEFAULT_DEPTH_LIMIT_L);
  const [halfLifeHours, setHalfLifeHours] = useState<number>(DEFAULT_HALF_LIFE_HOURS);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [intercept, setIntercept] = useState<number>(DEFAULT_INTERCEPT);
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);

  // Walkthrough & UI state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userSelectedPath, setUserSelectedPath] = useState<DiscoveredPath | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'settings' | 'snapshot' | 'glossary'>('graph');

  // Analyst Decision (Recorded in memory & export)
  const [analystDecision, setAnalystDecision] = useState<AnalystDecisionRecord>({
    decision: null,
    timestamp: null,
    analystId: 'analyst-secops-01',
    notes: '',
  });

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // 1. Build Graph from snapshot
  const graph = useMemo(() => buildIAMGraph(snapshot), [snapshot]);

  // 2. Run BFS exploration
  const bfsResult = useMemo(
    () => runBFSExploration(graph, startUser, depthLimitL),
    [graph, startUser, depthLimitL]
  );

  // 3. Determine active path (user selected or primary admin path or first path)
  const chosenPath = useMemo<DiscoveredPath>(() => {
    if (userSelectedPath) return userSelectedPath;
    if (bfsResult.adminPaths.length > 0) return bfsResult.adminPaths[0];
    if (bfsResult.discoveredPaths.length > 0) return bfsResult.discoveredPaths[0];
    return {
      path: [startUser],
      edgePath: [],
      hops: 0,
      leadsToAdmin: false,
    };
  }, [userSelectedPath, bfsResult, startUser]);

  // 4. Compute 9 Features & Decay Worked Example
  const { features, decayWorkedExample } = useMemo(
    () => computeNineFeatures(chosenPath, snapshot, auditEvents, halfLifeHours, weights),
    [chosenPath, snapshot, auditEvents, halfLifeHours, weights]
  );

  // 5. Compute Scoring & Running Sum
  const scoring = useMemo(
    () => computeScoring(intercept, features, threshold),
    [intercept, features, threshold]
  );

  // 6. Generate Evidence Chain & Reason Fidelity
  const { evidenceReport, templateRationale } = useMemo(
    () => generateEvidenceReport(chosenPath, snapshot),
    [chosenPath, snapshot]
  );

  // 7. Full JSON Export Payload
  const exportPayload = useMemo(
    () =>
      buildExportPayload(
        snapshot,
        startUser,
        depthLimitL,
        halfLifeHours,
        threshold,
        intercept,
        weights,
        chosenPath,
        features,
        decayWorkedExample,
        scoring,
        evidenceReport,
        analystDecision
      ),
    [
      snapshot,
      startUser,
      depthLimitL,
      halfLifeHours,
      threshold,
      intercept,
      weights,
      chosenPath,
      features,
      decayWorkedExample,
      scoring,
      evidenceReport,
      analystDecision,
    ]
  );

  // Handlers
  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetDefaults = () => {
    setStartUser('user:dev-junior');
    setDepthLimitL(DEFAULT_DEPTH_LIMIT_L);
    setHalfLifeHours(DEFAULT_HALF_LIFE_HOURS);
    setThreshold(DEFAULT_THRESHOLD);
    setIntercept(DEFAULT_INTERCEPT);
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleResetSampleData = () => {
    setSnapshot(INITIAL_SNAPSHOT);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
    setUserSelectedPath(null);
  };

  const handleRecordDecision = (decision: 'Confirm' | 'Dismiss', notes: string) => {
    setAnalystDecision({
      decision,
      timestamp: new Date().toISOString(),
      analystId: 'analyst-secops-01',
      notes,
    });
  };

  const handleCopyExportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleDownloadExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `iam-escalation-audit-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner with actions */}
      <Banner
        onOpenTests={() => setIsTestModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
        currentStep={currentStep}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* GUIDED "HOW IT WORKS" WALKTHROUGH (7 Steps at Top of Page) */}
        <WalkthroughStepper
          currentStep={currentStep}
          onStepChange={(s) => setCurrentStep(s)}
          snapshot={snapshot}
          graph={graph}
          bfsSnapshots={bfsResult.snapshots}
          chosenPath={chosenPath}
          allAdminPaths={bfsResult.adminPaths}
          onSelectPath={(p) => setUserSelectedPath(p)}
          features={features}
          decayWorkedExample={decayWorkedExample}
          scoring={scoring}
          evidenceReport={evidenceReport}
          templateRationale={templateRationale}
          analystDecision={analystDecision}
          onRecordDecision={handleRecordDecision}
          depthLimitL={depthLimitL}
          halfLifeHours={halfLifeHours}
          startUser={startUser}
        />

        {/* Workspace Subpanel Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Full Identity Graph &amp; Traversal</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Parameters &amp; Weights (Live Inputs)</span>
            </button>

            <button
              onClick={() => setActiveTab('snapshot')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'snapshot'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>IAM Snapshot JSON &amp; Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'glossary'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Security &amp; Explainability Glossary (15 Terms)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Start: <span className="text-indigo-400 font-bold">{startUser}</span> | Limit L: {depthLimitL} | Target Admin: {bfsResult.adminPaths.length > 0 ? 'REACHED' : 'NOT FOUND'}
          </div>
        </div>

        {/* Active Subpanel Views */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Full IAM Identity Graph</h3>
                  <p className="text-xs text-slate-400">
                    Accessible visual representation with dual-coding (color + explicit text badges). Click any node or edge to inspect statements.
                  </p>
                </div>
                {bfsResult.adminPaths.length > 0 && (
                  <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800">
                    &bull; {bfsResult.adminPaths.length} Admin Escalation Path(s) Discovered
                  </span>
                )}
              </div>
              <IAMGraphView
                graph={graph}
                activePath={chosenPath.path}
                highlightedEdgeIds={chosenPath.edgePath.map((e) => e.id)}
                adminReached={chosenPath.leadsToAdmin}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <ModelSettings
            users={snapshot.users}
            startUser={startUser}
            onStartUserChange={(u) => {
              setStartUser(u);
              setUserSelectedPath(null);
            }}
            depthLimitL={depthLimitL}
            onDepthLimitLChange={(l) => {
              setDepthLimitL(l);
              setUserSelectedPath(null);
            }}
            halfLifeHours={halfLifeHours}
            onHalfLifeHoursChange={setHalfLifeHours}
            threshold={threshold}
            onThresholdChange={setThreshold}
            intercept={intercept}
            onInterceptChange={setIntercept}
            weights={weights}
            onWeightChange={handleWeightChange}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'snapshot' && (
          <SnapshotInspector
            snapshot={snapshot}
            onSnapshotChange={(newSnap) => {
              setSnapshot(newSnap);
              setUserSelectedPath(null);
            }}
            auditEvents={auditEvents}
            onAuditEventsChange={setAuditEvents}
            onResetSampleData={handleResetSampleData}
          />
        )}

        {activeTab === 'glossary' && <GlossarySection />}
      </main>

      {/* Attribution Footer */}
      <Footer />

      {/* Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        currentSnapshot={snapshot}
        currentWeights={weights}
        currentIntercept={intercept}
      />

      {/* Export JSON Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Export Comprehensive Audit &amp; Triage Report (JSON)
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">Governance &amp; Audit Notice:</div>
                <p>{exportPayload.weightIndependenceNotice}</p>
                <div className="text-emerald-400 font-mono mt-1">
                  Recorded Decision: {analystDecision.decision ? `${analystDecision.decision} (${analystDecision.timestamp})` : 'Pending review in Step 7'}
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto">
                  {JSON.stringify(exportPayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                Payload Size: {JSON.stringify(exportPayload).length} bytes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyExportJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedExport ? 'Copied to Clipboard!' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownloadExportJson}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
