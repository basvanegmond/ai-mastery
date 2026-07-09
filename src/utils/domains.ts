export const DOMAIN_COLORS: Record<string, string> = {
  'prompt-construction': '#2563A8',
  'context-engineering': '#0E7A8A',
  'output-evaluation': '#2A7A4F',
  'failure-diagnosis': '#7A3B8F',
  'tool-selection': '#B83A2A',
  'agentic-architecture': '#B87C0A',
  'multi-agent-orchestration': '#0E6B7A',
  'business-value-translation': '#B86020',
}

export function getDomainColor(domainId: string): string {
  return DOMAIN_COLORS[domainId] ?? '#6B6B8A'
}

export function scoreToGrade(score: number): string {
  if (score >= 4.3) return 'A+'
  if (score >= 4.0) return 'A'
  if (score >= 3.0) return 'B'
  if (score >= 2.0) return 'C'
  return 'D'
}
