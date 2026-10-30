/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PolicyStatement {
  sid: string;
  effect: 'Allow' | 'Deny';
  action: string | string[];
  resource: string | string[];
  condition?: Record<string, unknown>;
}

export interface TrustPolicy {
  effect: 'Allow' | 'Deny';
  principal: {
    AWS?: string | string[];
    Service?: string | string[];
  };
  action: string | string[];
  condition?: Record<string, unknown>;
}

export interface IAMPolicy {
  id: string;
  name: string;
  statements: PolicyStatement[];
}

export interface IAMUser {
  id: string;
  name: string;
  groups: string[];
  policies: string[];
  lastActiveDaysAgo?: number;
}

export interface IAMGroup {
  id: string;
  name: string;
  policies: string[];
}

export interface IAMRole {
  id: string;
  name: string;
  policies: string[];
  trustPolicy: TrustPolicy;
  isElevated?: boolean;
  lastActiveDaysAgo?: number;
}

export interface IAMSnapshot {
  users: IAMUser[];
  groups: IAMGroup[];
  roles: IAMRole[];
  policies: IAMPolicy[];
}

export interface AuditEvent {
  id: string;
  timestampHoursAgo: number;
  principalId: string;
  action: string;
  targetResource: string;
  status: 'Success' | 'Denied';
  notes?: string;
}

export type EdgeType = 'MEMBER_OF' | 'CAN_PASS' | 'CAN_ASSUME';

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'group' | 'role' | 'admin_target';
  isElevated?: boolean;
  lastActiveDaysAgo?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  sourceStatementRef: string; // sid or pointer
  policyId?: string;
  sid?: string;
  action?: string;
  description: string;
}

export interface IAMGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BFSHopSnapshot {
  hopNumber: number;
  frontierQueue: { nodeId: string; path: string[]; edgePath: GraphEdge[] }[];
  visitedNodes: string[];
  expandedNode?: string;
  newDiscoveredEdges: GraphEdge[];
  adminReached: boolean;
  logMessage: string;
}

export interface DiscoveredPath {
  path: string[];
  edgePath: GraphEdge[];
  hops: number;
  leadsToAdmin: boolean;
}

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  value: number;
  weight: number;
  unit?: string;
  formulaDescription: string;
}

export interface DecayWorkedExample {
  eventId: string;
  principalId: string;
  action: string;
  deltaTHours: number;
  halfLifeHours: number;
  lambda: number;
  decayWeight: number;
  formulaSteps: string[];
}

export interface ScoreTerm {
  featureKey: string;
  featureName: string;
  value: number;
  weight: number;
  termProduct: number;
  runningSumBefore: number;
  runningSumAfter: number;
}

export interface ScoringResult {
  intercept: number;
  terms: ScoreTerm[];
  zScore: number;
  probability: number; // 0 to 1
  threshold: number;
  isAlert: boolean;
  decisionText: 'ALERT' | 'BELOW_THRESHOLD';
}

export interface EvidencePointer {
  hopIndex: number;
  source: string;
  target: string;
  edgeType: EdgeType;
  sourceStatementRef: string;
  action: string;
  resource: string;
  verified: boolean;
  verificationReason: string;
}

export interface ReasonFidelityReport {
  pointers: EvidencePointer[];
  verifiedCount: number;
  totalCount: number;
  fidelityScore: number; // 0 to 1
  fidelityPercent: number; // 0 to 100%
}

export interface AnalystDecisionRecord {
  decision: 'Confirm' | 'Dismiss' | null;
  timestamp: string | null;
  analystId: string;
  notes: string;
}

export interface FullExportPayload {
  exportTimestamp: string;
  system: string;
  disclaimer: string;
  weightIndependenceNotice: string;
  snapshotCounts: {
    users: number;
    groups: number;
    roles: number;
    policies: number;
  };
  parameters: {
    startUser: string;
    depthLimitL: number;
    halfLifeHours: number;
    threshold: number;
    intercept: number;
    weights: Record<string, number>;
  };
  chosenPath: {
    nodes: string[];
    edgeTypes: EdgeType[];
    statementPointers: string[];
  };
  features: Record<string, number>;
  decayWorkedExample: DecayWorkedExample | null;
  scoring: {
    intercept: number;
    z: number;
    probability: number;
    threshold: number;
    status: string;
  };
  reasonFidelity: {
    verifiedPointers: number;
    totalPointers: number;
    fidelityPercent: number;
  };
  analystDecision: AnalystDecisionRecord;
}
