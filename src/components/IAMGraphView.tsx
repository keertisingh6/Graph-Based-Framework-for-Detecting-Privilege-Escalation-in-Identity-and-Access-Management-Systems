/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IAMGraph, GraphNode, GraphEdge, EdgeType } from '../types/iam';
import { Shield, Key, Eye, Filter, Sparkles, Layers } from 'lucide-react';

interface IAMGraphViewProps {
  graph: IAMGraph;
  highlightedEdgeType?: EdgeType | 'ALL' | null;
  highlightedEdgeIds?: string[];
  highlightedNodeIds?: string[];
  adminReached?: boolean;
  activePath?: string[];
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edge: GraphEdge) => void;
}

export const IAMGraphView: React.FC<IAMGraphViewProps> = ({
  graph,
  highlightedEdgeType = 'ALL',
  highlightedEdgeIds = [],
  highlightedNodeIds = [],
  adminReached = false,
  activePath = [],
  onSelectNode,
  onSelectEdge,
}) => {
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [focusPathMode, setFocusPathMode] = useState<boolean>(activePath.length > 1);
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);

  // Group nodes by column for clean, spacious alignment
  const users = graph.nodes.filter((n) => n.type === 'user');
  const groups = graph.nodes.filter((n) => n.type === 'group');
  const nonAdminRoles = graph.nodes.filter((n) => n.type === 'role' && !n.isElevated);
  const adminRoles = graph.nodes.filter((n) => n.isElevated || n.type === 'admin_target');

  const getNodePos = (node: GraphNode): { x: number; y: number } => {
    if (node.type === 'user') {
      const idx = users.findIndex((u) => u.id === node.id);
      return { x: 130, y: 100 + idx * 135 };
    }
    if (node.type === 'group') {
      const idx = groups.findIndex((g) => g.id === node.id);
      return { x: 390, y: 100 + idx * 135 };
    }
    if (node.isElevated || node.type === 'admin_target') {
      const idx = adminRoles.findIndex((a) => a.id === node.id);
      return { x: 890, y: 165 + idx * 135 };
    }
    // regular role
    const idx = nonAdminRoles.findIndex((r) => r.id === node.id);
    return { x: 640, y: 110 + idx * 135 };
  };

  const nodeMap = new Map<string, { x: number; y: number; node: GraphNode }>();
  graph.nodes.forEach((n) => {
    nodeMap.set(n.id, { ...getNodePos(n), node: n });
  });

  // Calculate active path edge IDs
  const activePathEdgeIds = new Set<string>();
  if (activePath.length > 1) {
    for (let i = 0; i < activePath.length - 1; i++) {
      const u = activePath[i];
      const v = activePath[i + 1];
      const matched = graph.edges.find((e) => e.source === u && e.target === v);
      if (matched) activePathEdgeIds.add(matched.id);
    }
  }

  const getEdgeStyle = (edge: GraphEdge) => {
    const isHovered = hoveredEdgeId === edge.id || selectedEdge?.id === edge.id;
    const isExplicitlyHighlighted = highlightedEdgeIds.includes(edge.id);
    const isTypeFilterMatched = highlightedEdgeType && highlightedEdgeType !== 'ALL' && edge.type === highlightedEdgeType;
    const isPathEdge = activePathEdgeIds.has(edge.id);

    const isImportant = isHovered || isExplicitlyHighlighted || isTypeFilterMatched || isPathEdge;

    // In focus mode, dim out non-important edges
    const isDimmed = focusPathMode && !isImportant;

    let stroke = '#64748b';
    let strokeDasharray = 'none';
    let strokeWidth = isImportant ? 3.5 : 1.75;
    let opacity = isDimmed ? 0.12 : isImportant ? 1.0 : 0.65;
    let labelBg = '#1e293b';

    if (edge.type === 'MEMBER_OF') {
      stroke = isImportant ? '#10b981' : '#059669';
      strokeDasharray = '5,4';
      labelBg = '#064e3b';
    } else if (edge.type === 'CAN_PASS') {
      stroke = isImportant ? '#f59e0b' : '#d97706';
      strokeDasharray = '6,4';
      labelBg = '#78350f';
    } else if (edge.type === 'CAN_ASSUME') {
      stroke = isImportant ? '#a855f7' : '#7c3aed';
      strokeDasharray = 'none';
      labelBg = '#581c87';
    }

    if (isPathEdge) {
      strokeWidth = 4;
      stroke = edge.type === 'CAN_ASSUME' ? '#c084fc' : edge.type === 'CAN_PASS' ? '#fbbf24' : '#34d399';
    }

    return { stroke, strokeDasharray, strokeWidth, opacity, isImportant, isPathEdge, isHovered, labelBg };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Clean Control Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <Key className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">IAM Transition Graph</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            ({graph.nodes.length} entities &bull; {graph.edges.length} valid transitions)
          </span>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2">
          {activePath.length > 1 && (
            <button
              onClick={() => setFocusPathMode(!focusPathMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                focusPathMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{focusPathMode ? 'Focus: Active Path' : 'Show All Context'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAllLabels(!showAllLabels)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              showAllLabels
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAllLabels ? 'Labels: All' : 'Labels: Clean'}</span>
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="bg-slate-900/90 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-400 inline-block"></span>
            MEMBER_OF
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-400 inline-block"></span>
            CAN_PASS
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-3 h-0.5 bg-purple-400 inline-block"></span>
            CAN_ASSUME
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-semibold">
            <Shield className="w-3 h-3 text-rose-400" />
            ADMIN TARGET
          </span>
        </div>
        <div className="text-[11px] text-slate-500 italic">
          Hover any line or node to inspect permissions &amp; statements.
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto p-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <svg
          viewBox="0 0 1020 460"
          className="w-full min-w-[850px] h-auto select-none font-sans"
        >
          <defs>
            <marker
              id="arrow-generic"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-assume"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
            </marker>
            <marker
              id="arrow-pass"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-member"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Column Category Headers */}
          <g opacity="0.35">
            <text x="130" y="28" fill="#94a3b8" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.05em">
              USERS (Principals)
            </text>
            <text x="390" y="28" fill="#94a3b8" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.05em">
              GROUPS
            </text>
            <text x="640" y="28" fill="#94a3b8" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.05em">
              ROLES (Workloads)
            </text>
            <text x="890" y="28" fill="#f43f5e" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="0.05em">
              ADMIN TARGET
            </text>
          </g>

          {/* Render Smooth Edges */}
          {graph.edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const style = getEdgeStyle(edge);

            // Connect from right edge of source card to left edge of target card
            const startX = src.x + 75;
            const startY = src.y;
            const endX = tgt.x - 75;
            const endY = tgt.y;

            const dx = Math.max(30, (endX - startX) * 0.45);
            // Cubic bezier curve for natural, elegant flow
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

            // Midpoint for optional label placement
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2 + (edge.type === 'CAN_PASS' ? 14 : edge.type === 'MEMBER_OF' ? -12 : 0);

            const markerId =
              edge.type === 'CAN_ASSUME'
                ? 'url(#arrow-assume)'
                : edge.type === 'CAN_PASS'
                ? 'url(#arrow-pass)'
                : 'url(#arrow-member)';

            // Only show floating text badges if:
            // 1. It is hovered
            // 2. It is on the active path
            // 3. showAllLabels is toggled on AND edge is highlighted
            const shouldRenderBadge =
              style.isHovered ||
              (style.isPathEdge && (focusPathMode || showAllLabels)) ||
              (showAllLabels && style.isImportant);

            return (
              <g
                key={edge.id}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: style.opacity }}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onClick={() => {
                  setSelectedEdge(edge);
                  onSelectEdge?.(edge);
                }}
              >
                {/* Wider invisible stroke for effortless mouse hover */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                />

                {/* Visible smooth spline */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                  markerEnd={markerId}
                />

                {/* Uncluttered Edge Label Badge (rendered only when meaningful) */}
                {shouldRenderBadge && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-38"
                      y="-8"
                      width="76"
                      height="16"
                      rx="4"
                      fill={style.labelBg}
                      stroke={style.stroke}
                      strokeWidth={1.5}
                      className="shadow-md"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="700"
                    >
                      {edge.type}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {graph.nodes.map((node) => {
            const pos = nodeMap.get(node.id);
            if (!pos) return null;

            const isHighlighted =
              highlightedNodeIds.includes(node.id) || activePath.includes(node.id);
            const isAdmin = node.isElevated || node.type === 'admin_target';
            const isDormant = (node.lastActiveDaysAgo ?? 0) >= 90;
            const isSelected = selectedNode?.id === node.id;

            let nodeFill = '#0f172a';
            let nodeStroke = '#334155';
            let badgeText = node.type.toUpperCase();

            if (node.type === 'user') {
              nodeStroke = isHighlighted ? '#38bdf8' : '#0284c7';
              nodeFill = isHighlighted ? '#082f49' : '#0f172a';
            } else if (node.type === 'group') {
              nodeStroke = isHighlighted ? '#34d399' : '#059669';
              nodeFill = isHighlighted ? '#064e3b' : '#0f172a';
            } else if (isAdmin) {
              nodeStroke = adminReached || isHighlighted ? '#f43f5e' : '#e11d48';
              nodeFill = adminReached || isHighlighted ? '#4c0519' : '#2a0812';
              badgeText = 'ADMIN TARGET';
            } else {
              nodeStroke = isHighlighted ? '#c084fc' : '#7e22ce';
              nodeFill = isHighlighted ? '#3b0764' : '#0f172a';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedNode(node);
                  onSelectNode?.(node.id);
                }}
              >
                {/* Node Box */}
                <rect
                  x="-75"
                  y="-26"
                  width="150"
                  height="52"
                  rx="8"
                  fill={nodeFill}
                  stroke={isSelected ? '#ffffff' : nodeStroke}
                  strokeWidth={isHighlighted || isSelected ? 2.5 : 1.5}
                  filter={isAdmin && adminReached ? 'drop-shadow(0 0 10px #f43f5e)' : undefined}
                />

                {/* Node Type Accessibility Badge */}
                <rect
                  x="-75"
                  y="-34"
                  width="68"
                  height="14"
                  rx="3"
                  fill={isAdmin ? '#e11d48' : '#334155'}
                />
                <text
                  x="-41"
                  y="-24.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="7.5"
                  fontWeight="700"
                >
                  {badgeText}
                </text>

                {/* Dormant Badge */}
                {isDormant && (
                  <g transform="translate(15, -34)">
                    <rect x="0" y="0" width="56" height="14" rx="3" fill="#b45309" />
                    <text x="28" y="9.5" textAnchor="middle" fill="#fef3c7" fontSize="7" fontWeight="bold">
                      DORMANT
                    </text>
                  </g>
                )}

                {/* Node Label Text */}
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="10.5"
                  fontWeight="600"
                >
                  {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                </text>
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Edge or Node Inspector Popup Bar */}
      {(selectedEdge || selectedNode || hoveredEdgeId) && (
        <div className="bg-slate-950 p-3 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
          {(selectedEdge || (hoveredEdgeId && graph.edges.find((e) => e.id === hoveredEdgeId))) && (
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const targetEdge = selectedEdge || graph.edges.find((e) => e.id === hoveredEdgeId)!;
                return (
                  <>
                    <span className="font-semibold text-amber-400">Transition:</span>
                    <span className="text-slate-200 font-mono">
                      {targetEdge.source} &rarr; {targetEdge.target}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        targetEdge.type === 'MEMBER_OF'
                          ? 'bg-emerald-950 text-emerald-300'
                          : targetEdge.type === 'CAN_PASS'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-purple-950 text-purple-300'
                      }`}
                    >
                      {targetEdge.type}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Backing Statement: <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">{targetEdge.sourceStatementRef}</code>
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          {selectedNode && !selectedEdge && !hoveredEdgeId && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-400">Identity:</span>
              <span className="text-slate-200 font-medium">{selectedNode.label}</span>
              <span className="text-slate-400 font-mono">({selectedNode.id})</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                {selectedNode.type}
              </span>
              {selectedNode.isElevated && (
                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-800">
                  ADMINISTRATOR ELEVATION
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setSelectedEdge(null);
              setSelectedNode(null);
              setHoveredEdgeId(null);
            }}
            className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer ml-auto"
          >
            Clear inspection
          </button>
        </div>
      )}
    </div>
  );
};
