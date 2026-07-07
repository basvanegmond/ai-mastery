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
  why: string
}

export const TIPS: Tip[] = [
  {
    badge: '/btw',
    text: 'Ask a quick side question mid-task without interrupting the main conversation flow.',
    why: 'Keeps your primary thread intact and avoids costly context switches when curiosity strikes.',
  },
  {
    badge: 'CLAUDE.md',
    text: 'Add a CLAUDE.md at your project root for persistent instructions Claude reads every session.',
    why: 'Eliminates repetitive setup prompts and ensures consistent behavior across every conversation without extra tokens.',
  },
  {
    badge: '@file',
    text: 'Reference any file in your workspace by name — Claude reads it in full context before answering.',
    why: 'Gets you accurate, code-aware answers without copy-pasting file contents, saving time and reducing errors.',
  },
  {
    badge: '/clear',
    text: 'Clear conversation context when switching tasks. Stale context causes subtle errors.',
    why: 'A fresh context window reduces hallucinations and keeps Claude sharply focused on the task at hand.',
  },
  {
    badge: 'hooks',
    text: 'Wire Claude Code PostToolUse hooks to auto-run type checks after every file edit.',
    why: "Catches type errors the moment they're introduced rather than at build time, cutting debug cycles significantly.",
  },
  {
    badge: 'subagents',
    text: 'Dispatch focused sub-agents for parallel research while your main session continues.',
    why: 'Parallelises work that would otherwise run serially — faster results without sacrificing quality or context.',
  },
  {
    badge: '/memory',
    text: 'Claude Code persists facts across sessions. Ask it to remember key project decisions.',
    why: 'Builds a knowledge base of your preferences so you never repeat the same setup instructions twice.',
  },
  {
    badge: 'Shift+Tab',
    text: 'Toggle auto-accept mode for long autonomous sequences — faster than confirming each step.',
    why: 'Speeds up large trusted tasks by 3–5× without giving up control over the final result.',
  },
]
