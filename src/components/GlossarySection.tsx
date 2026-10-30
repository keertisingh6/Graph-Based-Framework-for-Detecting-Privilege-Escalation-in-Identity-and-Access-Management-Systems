/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

interface GlossaryTerm {
  term: string;
  category: 'IAM & Security' | 'Graph & Algorithms' | 'Explainable Modeling';
  definition: string;
  example?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'IAM',
    category: 'IAM & Security',
    definition:
      'Identity and Access Management: the framework of policies and security technologies that ensures appropriate people and entities have verified access to technology resources.',
    example: 'AWS IAM or Google Cloud IAM governing cloud permissions.',
  },
  {
    term: 'Principal',
    category: 'IAM & Security',
    definition:
      'A human user, service account, or automated workload identity that makes a request for an action or resource in a cloud computing environment.',
    example: 'user:dev-junior or role:cicd-runner.',
  },
  {
    term: 'Role',
    category: 'IAM & Security',
    definition:
      'An IAM identity with specific permissions that is intended to be assumed temporarily by anyone or any service that needs it, rather than having static long-term credentials.',
    example: 'role:cloud-infra-admin assumed by authorized pipeline operators.',
  },
  {
    term: 'Policy Statement',
    category: 'IAM & Security',
    definition:
      'A formal rule block inside an IAM policy specifying an Effect (Allow or Deny), an Action or set of actions, and the Target Resource to which the rule applies.',
    example: '{"Effect": "Allow", "Action": "iam:PassRole", "Resource": "arn:aws:iam::.../runner"}.',
  },
  {
    term: 'Trust Policy',
    category: 'IAM & Security',
    definition:
      'A specialized JSON policy document attached directly to an IAM role that defines which principals (e.g. AWS users, groups, external services) are trusted to assume the role.',
    example: 'Role trust policy stating "Principal": {"Service": "ec2.amazonaws.com"}.',
  },
  {
    term: 'PassRole',
    category: 'IAM & Security',
    definition:
      'An IAM action (iam:PassRole) allowing a user or service to pass a specific role to an AWS compute resource (such as EC2, Lambda, or ECS) during task launching.',
    example: 'A developer passes role:cicd-runner to an EC2 instance to execute deployment jobs.',
  },
  {
    term: 'AssumeRole',
    category: 'IAM & Security',
    definition:
      'An AWS STS API action (sts:AssumeRole) that returns a set of temporary security credentials allowing a principal to operate with the permissions of the assumed role.',
    example: 'A support engineer invokes AssumeRole to temporarily gain troubleshooting access.',
  },
  {
    term: 'Breadth-First Search',
    category: 'Graph & Algorithms',
    definition:
      'A graph traversal algorithm that explores all neighbor nodes at the present depth level before moving on to nodes at the next depth level, bounded here by maximum depth L.',
    example: 'BFS searches 1-hop group memberships, then 2-hop role transitions, etc.',
  },
  {
    term: 'Feature',
    category: 'Explainable Modeling',
    definition:
      'A measurable, quantitative property or characteristic extracted from the IAM graph and audit logs that reflects security risk (e.g., path length or wildcard exposure).',
    example: 'f1 = path length in hops; f6 = wildcard exposure ratio.',
  },
  {
    term: 'Weight',
    category: 'Explainable Modeling',
    definition:
      'A multiplier (w_j) applied to a specific feature that represents the relative contribution or risk significance of that feature in determining the overall escalation score.',
    example: 'w3 = 1.50 weight assigned to Target Elevation Level.',
  },
  {
    term: 'Intercept',
    category: 'Explainable Modeling',
    definition:
      'A baseline constant (b) added in the linear combination prior to feature terms. It calibrates the default log-odds of an alert when all features are zero.',
    example: 'Intercept b = -1.20 sets a conservative default prior.',
  },
  {
    term: 'Logistic Function',
    category: 'Explainable Modeling',
    definition:
      'The standard mathematical sigmoid curve s = 1 / (1 + exp(-z)) that maps any real-valued logit z smoothly into a normalized probability between 0 and 1.',
    example: 'Transforms z = 2.15 into s = 0.8957 (89.57% risk probability).',
  },
  {
    term: 'Threshold',
    category: 'Explainable Modeling',
    definition:
      'The cutoff value (tau) on the 0-to-1 score scale above which an escalation path is flagged as an ALERT for mandatory security analyst review.',
    example: 'Threshold tau = 0.60: paths with s >= 0.60 trigger an alert.',
  },
  {
    term: 'Reason Fidelity',
    category: 'Explainable Modeling',
    definition:
      'The ratio of verified statement pointers to total pointers in an explanation chain, confirming that generated claims reflect true, existing policy statements.',
    example: '4 verified statements out of 4 total yields 100% reason fidelity.',
  },
  {
    term: 'Audit Event',
    category: 'IAM & Security',
    definition:
      'A timestamped record of an identity activity (e.g., CloudTrail event) capturing who performed what action on which resource at a specific time.',
    example: 'Event evt-audit-101: user:dev-junior assumed support role 3.5 hours ago.',
  },
];

export const GlossarySection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filtered = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.example && item.example.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Security &amp; Explainability Glossary</h3>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search glossary terms..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['ALL', 'IAM & Security', 'Graph & Algorithms', 'Explainable Modeling'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {cat === 'ALL' ? 'All Terms (15)' : cat}
          </button>
        ))}
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((item) => (
          <div
            key={item.term}
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-white">{item.term}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {item.definition}
            </p>
            {item.example && (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-indigo-400 font-sans font-semibold">Example: </span>
                {item.example}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
