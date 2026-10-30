/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAMSnapshot, AuditEvent } from '../types/iam';

export const INITIAL_SNAPSHOT: IAMSnapshot = {
  users: [
    {
      id: 'user:dev-junior',
      name: 'Bob (Junior Developer)',
      groups: ['group:developers'],
      policies: ['policy:dev-basic'],
      lastActiveDaysAgo: 2,
    },
    {
      id: 'user:contractor-alex',
      name: 'Alex (External Contractor)',
      groups: ['group:contractors'],
      policies: ['policy:contractor-ro'],
      lastActiveDaysAgo: 110, // Dormant identity (>90 days)
    },
    {
      id: 'user:admin-alice',
      name: 'Alice (Core Admin)',
      groups: ['group:admins'],
      policies: ['policy:admin-full'],
      lastActiveDaysAgo: 1,
    },
  ],
  groups: [
    {
      id: 'group:developers',
      name: 'Developers Group',
      policies: ['policy:developer-assume-support'],
    },
    {
      id: 'group:contractors',
      name: 'External Contractors Group',
      policies: ['policy:contractor-ro'],
    },
    {
      id: 'group:admins',
      name: 'Full Administrators Group',
      policies: ['policy:admin-full'],
    },
  ],
  roles: [
    {
      id: 'role:support-troubleshooter',
      name: 'Support Troubleshooter Role',
      policies: ['policy:support-pass-cicd'],
      isElevated: false,
      lastActiveDaysAgo: 5,
      trustPolicy: {
        effect: 'Allow',
        principal: {
          AWS: ['arn:aws:iam::123456789012:group/developers'],
        },
        action: 'sts:AssumeRole',
      },
    },
    {
      id: 'role:cicd-runner',
      name: 'CI/CD Pipeline Runner Role',
      policies: ['policy:cicd-assume-admin'],
      isElevated: false,
      lastActiveDaysAgo: 1,
      trustPolicy: {
        effect: 'Allow',
        principal: {
          Service: 'ec2.amazonaws.com',
          AWS: ['*'], // Loose trust principal
        },
        action: 'sts:AssumeRole',
      },
    },
    {
      id: 'role:cloud-infra-admin',
      name: 'Cloud Infrastructure Administrator',
      policies: ['policy:admin-full'],
      isElevated: true, // Elevates to full cloud administrator
      lastActiveDaysAgo: 3,
      trustPolicy: {
        effect: 'Allow',
        principal: {
          AWS: ['arn:aws:iam::123456789012:role/cicd-runner'],
        },
        action: 'sts:AssumeRole',
      },
    },
  ],
  policies: [
    {
      id: 'policy:dev-basic',
      name: 'Developer Basic Read Access',
      statements: [
        {
          sid: 'stmt-dev-read',
          effect: 'Allow',
          action: ['ec2:DescribeInstances', 's3:ListAllMyBuckets'],
          resource: '*',
        },
      ],
    },
    {
      id: 'policy:developer-assume-support',
      name: 'Developer Assume Support Role Policy',
      statements: [
        {
          sid: 'stmt-dev-assume-support',
          effect: 'Allow',
          action: 'sts:AssumeRole',
          resource: 'arn:aws:iam::123456789012:role/support-troubleshooter',
        },
      ],
    },
    {
      id: 'policy:support-pass-cicd',
      name: 'Support Pass Role to Deployment CI/CD',
      statements: [
        {
          sid: 'stmt-support-pass-cicd',
          effect: 'Allow',
          action: 'iam:PassRole',
          resource: 'arn:aws:iam::123456789012:role/cicd-runner',
        },
        {
          sid: 'stmt-support-logs',
          effect: 'Allow',
          action: ['logs:GetLogEvents', 'logs:FilterLogEvents'],
          resource: '*',
        },
      ],
    },
    {
      id: 'policy:cicd-assume-admin',
      name: 'CI/CD Assume Admin Policy',
      statements: [
        {
          sid: 'stmt-cicd-assume-admin',
          effect: 'Allow',
          action: 'sts:AssumeRole',
          resource: 'arn:aws:iam::123456789012:role/cloud-infra-admin',
        },
      ],
    },
    {
      id: 'policy:contractor-ro',
      name: 'Contractor Read-Only Policy',
      statements: [
        {
          sid: 'stmt-contractor-audit',
          effect: 'Allow',
          action: 's3:GetObject',
          resource: 'arn:aws:s3:::contractor-shared-docs/*',
        },
      ],
    },
    {
      id: 'policy:admin-full',
      name: 'Administrator Full Access',
      statements: [
        {
          sid: 'stmt-admin-master',
          effect: 'Allow',
          action: '*',
          resource: '*',
        },
      ],
    },
  ],
};

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-audit-101',
    timestampHoursAgo: 3.5,
    principalId: 'user:dev-junior',
    action: 'sts:AssumeRole',
    targetResource: 'arn:aws:iam::123456789012:role/support-troubleshooter',
    status: 'Success',
    notes: 'Bob assumed support troubleshooter role outside standard working hours',
  },
  {
    id: 'evt-audit-102',
    timestampHoursAgo: 2.1,
    principalId: 'role:support-troubleshooter',
    action: 'iam:PassRole',
    targetResource: 'arn:aws:iam::123456789012:role/cicd-runner',
    status: 'Success',
    notes: 'PassRole invoked to assign CI/CD role to a newly launched task',
  },
  {
    id: 'evt-audit-103',
    timestampHoursAgo: 0.8,
    principalId: 'role:cicd-runner',
    action: 'sts:AssumeRole',
    targetResource: 'arn:aws:iam::123456789012:role/cloud-infra-admin',
    status: 'Success',
    notes: 'CI/CD runner assumed high-privilege infrastructure admin role',
  },
  {
    id: 'evt-audit-104',
    timestampHoursAgo: 72.0,
    principalId: 'user:contractor-alex',
    action: 's3:GetObject',
    targetResource: 'arn:aws:s3:::contractor-shared-docs/report.pdf',
    status: 'Success',
    notes: 'Routine document view by contractor',
  },
];

export const DEFAULT_WEIGHTS: Record<string, number> = {
  f1_path_length: 0.35,
  f2_role_transitions: 0.60,
  f3_target_elevation: 1.50,
  f4_audit_recency: 0.85,
  f5_dormant_principals: 0.70,
  f6_wildcard_exposure: 0.90,
  f7_unrestricted_trust: 1.10,
  f8_high_risk_actions: 1.25,
  f9_path_novelty: 0.75,
};

export const DEFAULT_INTERCEPT = -1.20;
export const DEFAULT_THRESHOLD = 0.60;
export const DEFAULT_HALF_LIFE_HOURS = 24.0;
export const DEFAULT_DEPTH_LIMIT_L = 4;
