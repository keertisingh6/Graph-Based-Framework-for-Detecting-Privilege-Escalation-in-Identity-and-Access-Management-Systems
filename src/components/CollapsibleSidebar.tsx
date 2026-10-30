/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  Database,
  BookOpen,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

export type SidebarPanelType = 'settings' | 'snapshot' | 'glossary';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePanel: SidebarPanelType;
  onSelectPanel: (panel: SidebarPanelType) => void;
  children: React.ReactNode;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onClose,
  activePanel,
  onSelectPanel,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile screens */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar Panel Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[480px] lg:w-[500px] xl:w-[540px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="font-bold text-sm text-white uppercase tracking-wider">
              Control Panel
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-xs"
              title="Collapse sidebar"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">Collapse</span>
            </button>
          </div>
        </div>

        {/* Panel Switcher Tabs */}
        <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800 flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => onSelectPanel('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activePanel === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameters &amp; Weights</span>
          </button>

          <button
            onClick={() => onSelectPanel('snapshot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activePanel === 'snapshot'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>IAM Snapshot &amp; Logs</span>
          </button>

          <button
            onClick={() => onSelectPanel('glossary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              activePanel === 'glossary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Glossary</span>
          </button>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        {/* Sidebar Footer */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>Real-time sync enabled</span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            Done &amp; Close &times;
          </button>
        </div>
      </aside>
    </>
  );
};
