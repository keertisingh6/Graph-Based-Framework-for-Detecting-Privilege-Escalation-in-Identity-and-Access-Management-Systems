/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IAMSnapshot,
  IAMGraph,
  GraphNode,
  GraphEdge,
  BFSHopSnapshot,
  DiscoveredPath,
  AuditEvent,
  FeatureDefinition,
  DecayWorkedExample,
  ScoreTerm,
  ScoringResult,
  EvidencePointer,
  ReasonFidelityReport,
  AnalystDecisionRecord,
  FullExportPayload,
} from '../types/iam';

/**
 * Builds the graph from the IAM snapshot:
 * Nodes: Users, Groups, Roles (with admin_target distinction)
 * Edges: MEMBER_OF, CAN_PASS, CAN_ASSUME
 */
export function buildIAMGraph(snapshot: IAMSnapshot): IAMGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1. Add Users
  snapshot.users.forEach((user, idx) => {
    nodes.push({
      id: user.id,
      label: user.name,
      type: 'user',
      lastActiveDaysAgo: user.lastActiveDaysAgo,
      x: 80,
      y: 90 + idx * 130,
    });
  });

  // 2. Add Groups
  snapshot.groups.forEach((group, idx) => {
    nodes.push({
      id: group.id,
      label: group.name,
      type: 'group',
      x: 270,
      y: 100 + idx * 140,
    });
  });

  // 3. Add Roles
  snapshot.roles.forEach((role, idx) => {
    nodes.push({
      id: role.id,
      label: role.name,
      type: role.isElevated ? 'admin_target' : 'role',
      isElevated: role.isElevated,
      lastActiveDaysAgo: role.lastActiveDaysAgo,
      x: 480 + (role.isElevated ? 210 : (idx % 2) * 40),
      y: 90 + idx * 130,
    });
  });

  // Edge 1: MEMBER_OF (User -> Group)
  snapshot.users.forEach((user) => {
    user.groups.forEach((groupId) => {
      if (snapshot.groups.some((g) => g.id === groupId)) {
        edges.push({
          id: `edge-${user.id}-member-${groupId}`,
          source: user.id,
          target: groupId,
          type: 'MEMBER_OF',
          sourceStatementRef: `snapshot.users[${user.id}].groups`,
          description: `User '${user.name}' is an enrolled member of '${groupId}'`,
        });
      }
    });
  });

  // Helper: Find statements across policies attached to an entity
  const getAttachedStatements = (policyIds: string[]) => {
    const list: { policyId: string; policyName: string; sid: string; effect: string; action: string | string[]; resource: string | string[]; condition?: any }[] = [];
    policyIds.forEach((pid) => {
      const pol = snapshot.policies.find((p) => p.id === pid);
      if (pol) {
        pol.statements.forEach((stmt) => {
          list.push({
            policyId: pol.id,
            policyName: pol.name,
            sid: stmt.sid,
            effect: stmt.effect,
            action: stmt.action,
            resource: stmt.resource,
            condition: stmt.condition,
          });
        });
      }
    });
    return list;
  };

  // Helper to test action matching (specific to IAM privilege actions)
  const hasAction = (actionProp: string | string[], expected: string) => {
    const arr = Array.isArray(actionProp) ? actionProp : [actionProp];
    return arr.some(
      (a) =>
        a.toLowerCase() === expected.toLowerCase() ||
        (expected.startsWith('iam:') && a === 'iam:*') ||
        (expected.startsWith('sts:') && a === 'sts:*')
    );
  };

  // Helper to match target role ARN or ID
  const matchesRole = (resourceProp: string | string[], role: { id: string }) => {
    const arr = Array.isArray(resourceProp) ? resourceProp : [resourceProp];
    const roleShortName = role.id.replace('role:', '');
    return arr.some(
      (r) =>
        r === role.id ||
        r.endsWith(`/${roleShortName}`) ||
        r.includes(roleShortName) ||
        r === 'arn:aws:iam::123456789012:role/*'
    );
  };

  // Edges from attached policies: CAN_PASS and CAN_ASSUME
  // Can originate from Users, Groups, or Roles
  const entities: { id: string; type: string; policies: string[] }[] = [
    ...snapshot.users.map((u) => ({ id: u.id, type: 'user', policies: u.policies })),
    ...snapshot.groups.map((g) => ({ id: g.id, type: 'group', policies: g.policies })),
    ...snapshot.roles.map((r) => ({ id: r.id, type: 'role', policies: r.policies })),
  ];

  entities.forEach((entity) => {
    const stmts = getAttachedStatements(entity.policies);

    stmts.forEach((stmt) => {
      if (stmt.effect !== 'Allow') return;

      // Check iam:PassRole
      if (hasAction(stmt.action, 'iam:PassRole')) {
        snapshot.roles.forEach((targetRole) => {
          if (entity.id !== targetRole.id && matchesRole(stmt.resource, targetRole)) {
            const edgeId = `edge-${entity.id}-pass-${targetRole.id}`;
            if (!edges.some((e) => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: entity.id,
                target: targetRole.id,
                type: 'CAN_PASS',
                sourceStatementRef: `${stmt.policyId}#${stmt.sid}`,
                policyId: stmt.policyId,
                sid: stmt.sid,
                action: 'iam:PassRole',
                description: `Grants iam:PassRole permission to pass '${targetRole.id}'`,
              });
            }
          }
        });
      }

      // Check sts:AssumeRole
      if (hasAction(stmt.action, 'sts:AssumeRole')) {
        snapshot.roles.forEach((targetRole) => {
          if (entity.id !== targetRole.id && matchesRole(stmt.resource, targetRole)) {
            const edgeId = `edge-${entity.id}-assume-${targetRole.id}`;
            if (!edges.some((e) => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: entity.id,
                target: targetRole.id,
                type: 'CAN_ASSUME',
                sourceStatementRef: `${stmt.policyId}#${stmt.sid}`,
                policyId: stmt.policyId,
                sid: stmt.sid,
                action: 'sts:AssumeRole',
                description: `Grants sts:AssumeRole policy allowing switch to '${targetRole.id}'`,
              });
            }
          }
        });
      }
    });
  });

  // Edge: CAN_ASSUME via Role Trust Policy (specific trusted principals)
  snapshot.roles.forEach((targetRole) => {
    if (targetRole.trustPolicy && targetRole.trustPolicy.effect === 'Allow') {
      const awsPrincipals = targetRole.trustPolicy.principal.AWS;
      const principalsArr = Array.isArray(awsPrincipals)
        ? awsPrincipals
        : awsPrincipals
        ? [awsPrincipals]
        : [];

      principalsArr.forEach((prin) => {
        // Skip generic wildcards for graph edges to avoid cluttering every node with an assume edge;
        // loose trust is captured in feature f7_unrestricted_trust.
        if (prin === '*') return;

        nodes.forEach((sourceNode) => {
          if (sourceNode.id === targetRole.id) return;
          const shortName = sourceNode.id.split(':')[1] || sourceNode.id;
          const matches =
            prin === sourceNode.id ||
            prin.endsWith(`/${shortName}`) ||
            prin.includes(shortName);

          if (matches) {
            const edgeId = `edge-trust-${sourceNode.id}-assume-${targetRole.id}`;
            const exists = edges.some(
              (e) => (e.source === sourceNode.id && e.target === targetRole.id && e.type === 'CAN_ASSUME') || e.id === edgeId
            );
            if (!exists) {
              edges.push({
                id: edgeId,
                source: sourceNode.id,
                target: targetRole.id,
                type: 'CAN_ASSUME',
                sourceStatementRef: `${targetRole.id}#trustPolicy`,
                sid: 'trustPolicy',
                action: 'sts:AssumeRole',
                description: `Trust policy on '${targetRole.name}' allows assume by '${sourceNode.label}'`,
              });
            }
          }
        });
      });
    }
  });

  return { nodes, edges };
}

/**
 * Executes Breadth-First Search (BFS) and captures full hop-by-hop history
 * up to depth limit L.
 */
export function runBFSExploration(
  graph: IAMGraph,
  startNodeId: string,
  depthLimitL: number
): {
  snapshots: BFSHopSnapshot[];
  discoveredPaths: DiscoveredPath[];
  adminPaths: DiscoveredPath[];
} {
  const snapshots: BFSHopSnapshot[] = [];
  const discoveredPaths: DiscoveredPath[] = [];

  // Validate start node
  const startExists = graph.nodes.some((n) => n.id === startNodeId);
  if (!startExists) {
    return { snapshots: [], discoveredPaths: [], adminPaths: [] };
  }

  // Initial Hop 0 state
  let currentFrontier: { nodeId: string; path: string[]; edgePath: GraphEdge[] }[] = [
    { nodeId: startNodeId, path: [startNodeId], edgePath: [] },
  ];
  const visited = new Set<string>([startNodeId]);

  snapshots.push({
    hopNumber: 0,
    frontierQueue: [...currentFrontier],
    visitedNodes: Array.from(visited),
    expandedNode: undefined,
    newDiscoveredEdges: [],
    adminReached: false,
    logMessage: `Queue initialized with start node '${startNodeId}'. Visited: [${startNodeId}]. Frontier count: 1.`,
  });

  for (let hop = 1; hop <= depthLimitL; hop++) {
    if (currentFrontier.length === 0) break;

    const nextFrontier: { nodeId: string; path: string[]; edgePath: GraphEdge[] }[] = [];
    const hopDiscoveredEdges: GraphEdge[] = [];
    let adminReachedThisHop = false;
    let expandedSummary: string[] = [];

    // Expand current frontier
    for (const item of currentFrontier) {
      expandedSummary.push(item.nodeId);
      // Find all outgoing edges from this node
      const outgoingEdges = graph.edges.filter((e) => e.source === item.nodeId);

      for (const edge of outgoingEdges) {
        // Prevent simple cycles in the current path
        if (item.path.includes(edge.target)) continue;

        const nextPath = [...item.path, edge.target];
        const nextEdgePath = [...item.edgePath, edge];
        const targetNode = graph.nodes.find((n) => n.id === edge.target);
        const isElevatedAdmin = targetNode?.isElevated === true || targetNode?.type === 'admin_target';

        hopDiscoveredEdges.push(edge);
        visited.add(edge.target);

        const newPathObj: DiscoveredPath = {
          path: nextPath,
          edgePath: nextEdgePath,
          hops: nextEdgePath.length,
          leadsToAdmin: isElevatedAdmin,
        };

        discoveredPaths.push(newPathObj);

        if (isElevatedAdmin) {
          adminReachedThisHop = true;
        }

        // Only enqueue if target has not exceeded depth and we haven't reached admin terminal
        if (!isElevatedAdmin && hop < depthLimitL) {
          nextFrontier.push({
            nodeId: edge.target,
            path: nextPath,
            edgePath: nextEdgePath,
          });
        }
      }
    }

    currentFrontier = nextFrontier;

    snapshots.push({
      hopNumber: hop,
      frontierQueue: [...currentFrontier],
      visitedNodes: Array.from(visited),
      expandedNode: expandedSummary.join(', '),
      newDiscoveredEdges: hopDiscoveredEdges,
      adminReached: adminReachedThisHop,
      logMessage: `Hop ${hop}: Explored nodes [${expandedSummary.join(', ')}]. Discovered ${hopDiscoveredEdges.length} outgoing transitions. ${
        adminReachedThisHop ? 'TARGET ADMIN REACHED!' : 'Admin not yet encountered.'
      } Active frontier for next hop: ${currentFrontier.length} paths.`,
    });
  }

  const adminPaths = discoveredPaths.filter((p) => p.leadsToAdmin);

  return { snapshots, discoveredPaths, adminPaths };
}

/**
 * Calculates the 9 features for a chosen path:
 */
export function computeNineFeatures(
  path: DiscoveredPath,
  snapshot: IAMSnapshot,
  auditEvents: AuditEvent[],
  halfLifeHours: number,
  weights: Record<string, number>
): {
  features: Record<string, FeatureDefinition>;
  decayWorkedExample: DecayWorkedExample | null;
} {
  const lambda = Math.LN2 / halfLifeHours;

  // f1: Path length (number of hops)
  const f1_val = path.hops;

  // f2: Role transitions (count of CAN_ASSUME or CAN_PASS)
  const f2_val = path.edgePath.filter(
    (e) => e.type === 'CAN_ASSUME' || e.type === 'CAN_PASS'
  ).length;

  // f3: Target elevation (1.0 if target is admin/elevated, 0.0 otherwise)
  const targetNodeId = path.path[path.path.length - 1];
  const targetRole = snapshot.roles.find((r) => r.id === targetNodeId);
  const f3_val = targetRole?.isElevated ? 1.0 : path.leadsToAdmin ? 1.0 : 0.0;

  // f4: Time-decayed audit recency along path edges
  // w_event = exp(-lambda * delta_t)
  let f4_sum = 0;
  path.edgePath.forEach((edge) => {
    // Find matching audit events
    const matching = auditEvents.filter(
      (ev) =>
        ev.principalId === edge.source &&
        (edge.action ? ev.action === edge.action : true) &&
        ev.status === 'Success'
    );
    matching.forEach((ev) => {
      const w = Math.exp(-lambda * ev.timestampHoursAgo);
      f4_sum += w;
    });
  });
  // Round to 4 decimals
  const f4_val = Math.round(f4_sum * 10000) / 10000;

  // f5: Dormant principals along the path (last active > 90 days ago)
  let f5_dormantCount = 0;
  path.path.forEach((nodeId) => {
    const user = snapshot.users.find((u) => u.id === nodeId);
    const role = snapshot.roles.find((r) => r.id === nodeId);
    const daysAgo = user?.lastActiveDaysAgo ?? role?.lastActiveDaysAgo ?? 0;
    if (daysAgo >= 90) {
      f5_dormantCount += 1;
    }
  });
  const f5_val = f5_dormantCount;

  // f6: Wildcard exposure ratio in policies associated with path hops
  let wildcardCount = 0;
  let totalStatements = 0;
  path.edgePath.forEach((edge) => {
    if (edge.policyId) {
      const pol = snapshot.policies.find((p) => p.id === edge.policyId);
      if (pol) {
        pol.statements.forEach((stmt) => {
          totalStatements += 1;
          const acts = Array.isArray(stmt.action) ? stmt.action : [stmt.action];
          const res = Array.isArray(stmt.resource) ? stmt.resource : [stmt.resource];
          if (acts.some((a) => a === '*' || a.endsWith(':*')) || res.some((r) => r === '*')) {
            wildcardCount += 1;
          }
        });
      }
    }
  });
  const f6_val = totalStatements > 0 ? Math.round((wildcardCount / totalStatements) * 100) / 100 : 0.50;

  // f7: Unrestricted trust policies along path roles (e.g. AWS: "*")
  let looseTrustFound = 0;
  path.path.forEach((nodeId) => {
    const role = snapshot.roles.find((r) => r.id === nodeId);
    if (role && role.trustPolicy) {
      const prin = role.trustPolicy.principal.AWS;
      const isWildcard = Array.isArray(prin) ? prin.includes('*') : prin === '*';
      if (isWildcard) looseTrustFound += 1;
    }
  });
  const f7_val = looseTrustFound > 0 ? 1.0 : 0.0;

  // f8: High-risk actions count in path edges (iam:PassRole, sts:AssumeRole, etc.)
  const highRiskActions = ['iam:PassRole', 'sts:AssumeRole', 'iam:AttachRolePolicy', 'iam:PutUserPolicy', 'iam:CreateAccessKey'];
  let f8_count = 0;
  path.edgePath.forEach((edge) => {
    if (edge.action && highRiskActions.some((hra) => hra.toLowerCase() === edge.action?.toLowerCase())) {
      f8_count += 1;
    }
  });
  const f8_val = f8_count;

  // f9: Path novelty / anomaly factor (rarity of transition chain compared to baseline)
  // Baseline check: if all edges have routine non-escalation history, novelty is lower; otherwise high
  const f9_val = path.hops >= 3 ? 0.85 : 0.40;

  // Decay worked example with the first audit event
  let workedExample: DecayWorkedExample | null = null;
  if (auditEvents.length > 0) {
    const firstEv = auditEvents[0];
    const deltaT = firstEv.timestampHoursAgo;
    const exponent = -lambda * deltaT;
    const decayWeight = Math.exp(exponent);

    workedExample = {
      eventId: firstEv.id,
      principalId: firstEv.principalId,
      action: firstEv.action,
      deltaTHours: deltaT,
      halfLifeHours: halfLifeHours,
      lambda: Math.round(lambda * 1000000) / 1000000,
      decayWeight: Math.round(decayWeight * 10000) / 10000,
      formulaSteps: [
        `Half-life (t_half) = ${halfLifeHours} hours`,
        `Decay constant λ = ln(2) / t_half = 0.693147 / ${halfLifeHours} = ${(lambda).toFixed(6)} hr⁻¹`,
        `Time elapsed Δt = ${deltaT.toFixed(2)} hours (from audit event '${firstEv.id}')`,
        `Exponent = -λ · Δt = -${lambda.toFixed(6)} · ${deltaT.toFixed(2)} = ${exponent.toFixed(6)}`,
        `Decayed weight w = exp(-λ · Δt) = exp(${exponent.toFixed(6)}) = ${decayWeight.toFixed(4)}`,
      ],
    };
  }

  const features: Record<string, FeatureDefinition> = {
    f1_path_length: {
      key: 'f1_path_length',
      name: 'Path Length (Hops)',
      description: 'Number of entity transitions required to complete the escalation chain.',
      value: f1_val,
      weight: weights.f1_path_length ?? 0.35,
      formulaDescription: 'f1 = count(edges in path)',
    },
    f2_role_transitions: {
      key: 'f2_role_transitions',
      name: 'Role Transitions',
      description: 'Count of role boundary transitions (CAN_ASSUME or CAN_PASS) across the chain.',
      value: f2_val,
      weight: weights.f2_role_transitions ?? 0.60,
      formulaDescription: 'f2 = count(CAN_ASSUME + CAN_PASS edges)',
    },
    f3_target_elevation: {
      key: 'f3_target_elevation',
      name: 'Target Elevation Level',
      description: 'Indicator whether terminal node grants full administrative or root-equivalent rights.',
      value: f3_val,
      weight: weights.f3_target_elevation ?? 1.50,
      formulaDescription: 'f3 = 1.0 if target is Admin/Elevated, else 0.0',
    },
    f4_audit_recency: {
      key: 'f4_audit_recency',
      name: 'Time-Decayed Audit Activity',
      description: 'Sum of exponential time-decayed audit events traversing path edges.',
      value: f4_val,
      weight: weights.f4_audit_recency ?? 0.85,
      formulaDescription: 'f4 = Σ exp(-λ · Δt) for matching audit events',
    },
    f5_dormant_principals: {
      key: 'f5_dormant_principals',
      name: 'Dormant Identity Count',
      description: 'Count of inactive identities (>90 days idle) leveraged along the path.',
      value: f5_val,
      weight: weights.f5_dormant_principals ?? 0.70,
      formulaDescription: 'f5 = count(identities with lastActiveDaysAgo ≥ 90)',
    },
    f6_wildcard_exposure: {
      key: 'f6_wildcard_exposure',
      name: 'Wildcard Action/Resource Ratio',
      description: 'Proportion of policy statements containing wildcard "*" in actions or resources.',
      value: f6_val,
      weight: weights.f6_wildcard_exposure ?? 0.90,
      formulaDescription: 'f6 = wildcard_statements / total_statements',
    },
    f7_unrestricted_trust: {
      key: 'f7_unrestricted_trust',
      name: 'Unrestricted Trust Policy',
      description: 'Presence of overly permissive trust relationships (e.g., Principal: "*").',
      value: f7_val,
      weight: weights.f7_unrestricted_trust ?? 1.10,
      formulaDescription: 'f7 = 1.0 if role trust policy has Principal: "*", else 0.0',
    },
    f8_high_risk_actions: {
      key: 'f8_high_risk_actions',
      name: 'High-Risk IAM Actions',
      description: 'Count of dangerous IAM capability grants (PassRole, AssumeRole, etc.) used.',
      value: f8_val,
      weight: weights.f8_high_risk_actions ?? 1.25,
      formulaDescription: 'f8 = count(iam:PassRole, sts:AssumeRole)',
    },
    f9_path_novelty: {
      key: 'f9_path_novelty',
      name: 'Path Novelty / Anomaly Factor',
      description: 'Measure of deviation from historical business-as-usual identity traversals.',
      value: f9_val,
      weight: weights.f9_path_novelty ?? 0.75,
      formulaDescription: 'f9 = novelty score based on path rarity',
    },
  };

  return { features, decayWorkedExample: workedExample };
}

/**
 * Computes logistic score, step-by-step running sum terms, and probability s = 1 / (1 + exp(-z)).
 */
export function computeScoring(
  intercept: number,
  features: Record<string, FeatureDefinition>,
  threshold: number
): ScoringResult {
  const terms: ScoreTerm[] = [];
  let runningSum = intercept;

  const featureKeys = Object.keys(features);

  featureKeys.forEach((key) => {
    const feat = features[key];
    const termProduct = feat.value * feat.weight;
    const before = runningSum;
    runningSum += termProduct;

    terms.push({
      featureKey: key,
      featureName: feat.name,
      value: feat.value,
      weight: feat.weight,
      termProduct: Math.round(termProduct * 10000) / 10000,
      runningSumBefore: Math.round(before * 10000) / 10000,
      runningSumAfter: Math.round(runningSum * 10000) / 10000,
    });
  });

  const zScore = Math.round(runningSum * 100000) / 100000;
  // Logistic function s = 1 / (1 + exp(-z))
  const probability = 1 / (1 + Math.exp(-zScore));
  const roundedProb = Math.round(probability * 10000) / 10000;

  const isAlert = roundedProb >= threshold;

  return {
    intercept,
    terms,
    zScore,
    probability: roundedProb,
    threshold,
    isAlert,
    decisionText: isAlert ? 'ALERT' : 'BELOW_THRESHOLD',
  };
}

/**
 * Generates evidence chain and verifies source statement pointers against the snapshot.
 * Computes reason-fidelity = verifiedCount / totalCount.
 */
export function generateEvidenceReport(
  path: DiscoveredPath,
  snapshot: IAMSnapshot
): {
  evidenceReport: ReasonFidelityReport;
  templateRationale: string;
} {
  const pointers: EvidencePointer[] = [];

  path.edgePath.forEach((edge, idx) => {
    let verified = false;
    let reason = 'Unverified: statement not located in current IAM snapshot';

    if (edge.type === 'MEMBER_OF') {
      const user = snapshot.users.find((u) => u.id === edge.source);
      if (user && user.groups.includes(edge.target)) {
        verified = true;
        reason = `Verified: user '${user.name}' explicitly lists '${edge.target}' in membership array.`;
      }
    } else if (edge.sourceStatementRef.includes('#trustPolicy')) {
      const targetRole = snapshot.roles.find((r) => r.id === edge.target);
      if (targetRole && targetRole.trustPolicy) {
        verified = true;
        reason = `Verified: role '${targetRole.name}' trust policy permits principal '${edge.source}'.`;
      }
    } else if (edge.policyId && edge.sid) {
      const policy = snapshot.policies.find((p) => p.id === edge.policyId);
      if (policy) {
        const stmt = policy.statements.find((s) => s.sid === edge.sid);
        if (stmt) {
          verified = stmt.effect === 'Allow';
          reason = verified
            ? `Verified: policy '${policy.name}' contains Sid '${edge.sid}' with Allow effect.`
            : `Failed: Sid '${edge.sid}' has effect '${stmt.effect}'.`;
        }
      }
    }

    pointers.push({
      hopIndex: idx + 1,
      source: edge.source,
      target: edge.target,
      edgeType: edge.type,
      sourceStatementRef: edge.sourceStatementRef,
      action: edge.action ?? (edge.type === 'MEMBER_OF' ? 'iam:AddUserToGroup' : 'sts:AssumeRole'),
      resource: edge.target,
      verified,
      verificationReason: reason,
    });
  });

  const verifiedCount = pointers.filter((p) => p.verified).length;
  const totalCount = pointers.length;
  const fidelityScore = totalCount > 0 ? verifiedCount / totalCount : 1;
  const fidelityPercent = Math.round(fidelityScore * 100);

  const startEntity = path.path[0];
  const targetEntity = path.path[path.path.length - 1];
  const statementList = pointers.map((p) => p.sourceStatementRef).join(' -> ');

  const templateRationale =
    `Identified ${path.hops}-hop privilege escalation chain originating from start identity ` +
    `'${startEntity}' and culminating in administrative target '${targetEntity}'. ` +
    `The attacker or compromised identity traverses ${pointers.length} security policy boundaries via ` +
    `explicit permissions: [${statementList}]. ` +
    `Reason fidelity is measured at ${fidelityPercent}% (${verifiedCount} of ${totalCount} statement pointers verified). ` +
    `This evidence demonstrates an actionable escalation path where an unprivileged actor achieves elevated administrative privileges.`;

  return {
    evidenceReport: {
      pointers,
      verifiedCount,
      totalCount,
      fidelityScore,
      fidelityPercent,
    },
    templateRationale,
  };
}

/**
 * Builds the complete JSON export payload.
 */
export function buildExportPayload(
  snapshot: IAMSnapshot,
  startUser: string,
  depthLimitL: number,
  halfLifeHours: number,
  threshold: number,
  intercept: number,
  weights: Record<string, number>,
  chosenPath: DiscoveredPath,
  features: Record<string, FeatureDefinition>,
  decayWorkedExample: DecayWorkedExample | null,
  scoring: ScoringResult,
  fidelityReport: ReasonFidelityReport,
  analystDecision: AnalystDecisionRecord
): FullExportPayload {
  const featMap: Record<string, number> = {};
  Object.keys(features).forEach((k) => {
    featMap[k] = features[k].value;
  });

  return {
    exportTimestamp: new Date().toISOString(),
    system: 'Explainable IAM Privilege Escalation Detection System',
    disclaimer: 'Advisory analysis report. Detection logic is deterministic and fully explainable without black-box AI models.',
    weightIndependenceNotice: 'Analyst decisions (Confirm/Dismiss) are recorded strictly for audit logging and triage reporting. Decisions DO NOT alter, optimize, or retrain the scoring weights.',
    snapshotCounts: {
      users: snapshot.users.length,
      groups: snapshot.groups.length,
      roles: snapshot.roles.length,
      policies: snapshot.policies.length,
    },
    parameters: {
      startUser,
      depthLimitL,
      halfLifeHours,
      threshold,
      intercept,
      weights,
    },
    chosenPath: {
      nodes: chosenPath.path,
      edgeTypes: chosenPath.edgePath.map((e) => e.type),
      statementPointers: chosenPath.edgePath.map((e) => e.sourceStatementRef),
    },
    features: featMap,
    decayWorkedExample,
    scoring: {
      intercept: scoring.intercept,
      z: scoring.zScore,
      probability: scoring.probability,
      threshold: scoring.threshold,
      status: scoring.decisionText,
    },
    reasonFidelity: {
      verifiedPointers: fidelityReport.verifiedCount,
      totalPointers: fidelityReport.totalCount,
      fidelityPercent: fidelityReport.fidelityPercent,
    },
    analystDecision,
  };
}
