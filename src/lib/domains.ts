import type { DomainDefinition, DomainKey } from '../types'

export const DOMAINS: DomainDefinition[] = [
  {
    key: 'prompt_construction',
    label: 'Prompt Construction',
    shortLabel: 'Prompts',
    baseline: 3.5,
    target: 4.0,
    color: '#6c8ebf',
    description: 'Front-load clarity, scope intent precisely, eliminate iterative correction loops',
  },
  {
    key: 'output_evaluation',
    label: 'Output Evaluation',
    shortLabel: 'Evaluation',
    baseline: 2.5,
    target: 4.0,
    color: '#82b366',
    description: 'Challenge AI outputs, surface assumptions, pressure-test logic',
  },
  {
    key: 'agentic_architecture',
    label: 'Agentic Architecture',
    shortLabel: 'Architecture',
    baseline: 1.5,
    target: 4.0,
    color: '#d6a420',
    description: 'Design agent systems: orchestrators, sub-agents, tool calls, failure modes',
  },
  {
    key: 'tool_selection',
    label: 'Tool Selection',
    shortLabel: 'Tools',
    baseline: 2.0,
    target: 3.8,
    color: '#b85450',
    description: 'Deliberate mental model for when each tool wins and why',
  },
  {
    key: 'failure_diagnosis',
    label: 'Failure Diagnosis',
    shortLabel: 'Diagnosis',
    baseline: 2.0,
    target: 3.5,
    color: '#9673a6',
    description: 'Narrate what went wrong without outsourcing the thinking',
  },
  {
    key: 'multi_agent_orchestration',
    label: 'Multi-Agent Orchestration',
    shortLabel: 'Orchestration',
    baseline: 1.0,
    target: 3.5,
    color: '#23b0a8',
    description: 'State management, routing logic, session persistence, escalation handling',
  },
  {
    key: 'business_value_translation',
    label: 'Business Value Translation',
    shortLabel: 'Biz Value',
    baseline: 3.0,
    target: 4.3,
    color: '#e06c3c',
    description: 'Move from capability to a board-ready value thesis',
  },
]

export const DOMAIN_MAP = Object.fromEntries(
  DOMAINS.map((d) => [d.key, d])
) as Record<DomainKey, DomainDefinition>

// Grade label → numeric score
export const GRADE_SCORES: Record<string, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  'A+': 4.3,
}

// Score → ring label for radar
export const RADAR_RINGS = [
  { score: 1.0, label: 'D' },
  { score: 2.0, label: 'C' },
  { score: 3.0, label: 'B' },
  { score: 4.0, label: 'A' },
  { score: 4.3, label: 'A+' },
] as const

export const MAX_SCORE = 5.0
