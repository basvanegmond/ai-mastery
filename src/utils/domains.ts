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

export interface Tip {
  badge: string
  text: string
}

export const TIPS: Tip[] = [
  {
    badge: '/btw',
    text: 'Ask a quick side question mid-task without interrupting the main conversation flow.',
  },
  {
    badge: 'CLAUDE.md',
    text: 'Add a CLAUDE.md at your project root for persistent instructions Claude reads every session.',
  },
  {
    badge: '@file',
    text: 'Reference any file in your workspace by name — Claude reads it in full context before answering.',
  },
  {
    badge: '/clear',
    text: 'Clear conversation context when switching tasks. Stale context causes subtle errors.',
  },
  {
    badge: 'hooks',
    text: 'Wire Claude Code PostToolUse hooks to auto-run type checks after every file edit.',
  },
  {
    badge: 'subagents',
    text: 'Dispatch focused sub-agents for parallel research while your main session continues.',
  },
  {
    badge: '/memory',
    text: 'Claude Code persists facts across sessions. Ask it to remember key project decisions.',
  },
  {
    badge: 'Shift+Tab',
    text: 'Toggle auto-accept mode for long autonomous sequences — faster than confirming each step.',
  },
]
