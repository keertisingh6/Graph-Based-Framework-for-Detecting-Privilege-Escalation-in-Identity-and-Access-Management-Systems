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
import { CollapsibleSidebar, SidebarPanelType } from './components/CollapsibleSidebar';
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
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
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

  // Collapsible Sidebar State (Settings, Snapshot, Glossary)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<SidebarPanelType>('settings');

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

  const handleOpenSidebar = (panel: SidebarPanelType) => {
    if (isSidebarOpen && activeSidebarPanel === panel) {
      setIsSidebarOpen(false);
    } else {
      setActiveSidebarPanel(panel);
      setIsSidebarOpen(true);
    }
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
      {/* Top Banner with actions & sidebar triggers */}
      <Banner
        onOpenTests={() => setIsTestModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
        currentStep={currentStep}
        onOpenPanel={handleOpenSidebar}
        activePanel={activeSidebarPanel}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Primary Workspace (Occupies Full Viewport Width with Zero Overcrowding) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Primary Workspace Header & Secondary Panel Launchers */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <GitFork className="w-4 h-4 text-indigo-400" />
              <span>Full Identity Graph Canvas</span>
            </div>
            <span className="text-slate-500 text-xs hidden sm:inline">&bull;</span>
            <div className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2">
              <span>Root: <strong className="text-indigo-400">{startUser}</strong></span>
              <span>&bull;</span>
              <span>Limit L: <strong className="text-slate-200">{depthLimitL}</strong></span>
              <span>&bull;</span>
              <span>Escalation: <strong className={bfsResult.adminPaths.length > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{bfsResult.adminPaths.length > 0 ? 'REACHED' : 'NONE'}</strong></span>
            </div>
          </div>

          {/* Quick-Access Collapsible Sidebar Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenSidebar('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isSidebarOpen && activeSidebarPanel === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Parameters &amp; Weights</span>
            </button>

            <button
              onClick={() => handleOpenSidebar('snapshot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isSidebarOpen && activeSidebarPanel === 'snapshot'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Snapshot JSON &amp; Logs</span>
            </button>

            <button
              onClick={() => handleOpenSidebar('glossary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isSidebarOpen && activeSidebarPanel === 'glossary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Glossary (15 Terms)</span>
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer ml-1"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4 text-indigo-400" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Full Viewport-Width IAM Graph */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <IAMGraphView
            graph={graph}
            activePath={chosenPath.path}
            highlightedEdgeIds={chosenPath.edgePath.map((e) => e.id)}
            adminReached={chosenPath.leadsToAdmin}
          />
        </div>
      </main>

      {/* Collapsible Sidebar for Secondary Panels */}
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePanel={activeSidebarPanel}
        onSelectPanel={(panel) => setActiveSidebarPanel(panel)}
      >
        {activeSidebarPanel === 'settings' && (
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

        {activeSidebarPanel === 'snapshot' && (
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

        {activeSidebarPanel === 'glossary' && <GlossarySection />}
      </CollapsibleSidebar>

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
