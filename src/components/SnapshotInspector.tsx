/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IAMSnapshot, AuditEvent } from '../types/iam';
import { Database, Plus, RefreshCw, Check, AlertTriangle, FileCode } from 'lucide-react';

interface SnapshotInspectorProps {
  snapshot: IAMSnapshot;
  onSnapshotChange: (newSnapshot: IAMSnapshot) => void;
  auditEvents: AuditEvent[];
  onAuditEventsChange: (events: AuditEvent[]) => void;
  onResetSampleData: () => void;
}

export const SnapshotInspector: React.FC<SnapshotInspectorProps> = ({
  snapshot,
  onSnapshotChange,
  auditEvents,
  onAuditEventsChange,
  onResetSampleData,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(snapshot, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // New audit event form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState('user:dev-junior');
  const [newAction, setNewAction] = useState('sts:AssumeRole');
  const [newHoursAgo, setNewHoursAgo] = useState(1.5);
  const [newTarget, setNewTarget] = useState('arn:aws:iam::123456789012:role/support-troubleshooter');

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.users || !parsed.groups || !parsed.roles || !parsed.policies) {
        throw new Error('Snapshot must contain users, groups, roles, and policies arrays.');
      }
      onSnapshotChange(parsed);
      setJsonError(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleAddAuditEvent = () => {
    const newEv: AuditEvent = {
      id: `evt-audit-${Date.now().toString().slice(-4)}`,
      timestampHoursAgo: newHoursAgo,
      principalId: newPrincipal,
      action: newAction,
      targetResource: newTarget,
      status: 'Success',
      notes: 'Manually simulated audit event in inspector',
    };
    onAuditEventsChange([newEv, ...auditEvents]);
    setShowAddEvent(false);
  };

  const handleDeleteAuditEvent = (id: string) => {
    onAuditEventsChange(auditEvents.filter((e) => e.id !== id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">IAM Snapshot &amp; Audit Logs Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onResetSampleData();
              setJsonText(JSON.stringify(snapshot, null, 2));
              setJsonError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Default IAM Snapshot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Editable IAM Snapshot JSON</span>
            </div>
            <div className="flex items-center gap-2">
              {isSaved && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> Snapshot updated!
                </span>
              )}
              <button
                onClick={handleApplyJson}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-sm"
              >
                Apply JSON Changes
              </button>
            </div>
          </div>

          {jsonError && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            placeholder="Paste IAM snapshot JSON..."
          />
        </div>

        {/* Audit Events Manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Live CloudTrail Audit Logs ({auditEvents.length} Events)
            </div>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Audit Event
            </button>
          </div>

          {showAddEvent && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-200">Inject Simulated Audit Event</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Principal ID</label>
                  <input
                    type="text"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Action (e.g. sts:AssumeRole)</label>
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Hours Ago (&Delta;t)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newHoursAgo}
                    onChange={(e) => setNewHoursAgo(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Target Role ARN</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAuditEvent}
                  className="px-3 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-500"
                >
                  Save Event
                </button>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-2">
            {auditEvents.map((ev, idx) => (
              <div
                key={ev.id}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold">{ev.id}</span>
                    {idx === 0 && (
                      <span className="bg-amber-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded border border-amber-800 font-bold">
                        1st Event (Decay Example)
                      </span>
                    )}
                    <span className="text-slate-400 font-mono">
                      {ev.timestampHoursAgo.toFixed(1)} hrs ago (&Delta;t)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                    <span className="text-sky-300">{ev.principalId}</span> &rarr;{' '}
                    <span className="text-amber-300">{ev.action}</span>
                  </div>
                  {ev.notes && (
                    <div className="text-[10px] text-slate-500 italic mt-0.5">{ev.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteAuditEvent(ev.id)}
                  className="text-slate-500 hover:text-rose-400 text-xs px-2 py-1 cursor-pointer"
                  title="Remove event"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
