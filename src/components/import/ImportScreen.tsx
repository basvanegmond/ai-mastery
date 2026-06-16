import { useRef, useState } from 'react'
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis'
import type { PatternAnalysis } from '../../types'
import { DOMAIN_MAP } from '../../lib/domains'

export function ImportScreen() {
  const { analyseFile, analysePaste, loading, error } = usePatternAnalysis()
  const [result, setResult] = useState<PatternAnalysis | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = await analyseFile(file)
    if (r) setResult(r)
  }

  async function handlePaste() {
    const r = await analysePaste(pasteText)
    if (r) { setResult(r); setPasteText(''); setPasteMode(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Usage Analysis</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          Import your Claude.ai conversation export to identify usage patterns and update your training focus.
        </p>
      </div>

      {/* How to export */}
      <div
        className="rounded-xl p-4 text-xs space-y-1"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}
      >
        <div className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>How to export from Claude.ai</div>
        <div>1. Go to claude.ai → Settings → Account</div>
        <div>2. Click "Export data"</div>
        <div>3. Download the ZIP, open conversations.json</div>
        <div>4. Upload it below (or paste its content)</div>
      </div>

      {/* Upload / Paste toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="interactive flex-1 py-3 rounded-xl text-sm"
          style={{
            background: 'var(--gold)',
            color: 'white',
            fontFamily: 'DM Mono, monospace',
            border: 'none',
          }}
        >
          {loading ? 'Analysing…' : '↑ Upload conversations.json'}
        </button>
        <button
          onClick={() => setPasteMode(!pasteMode)}
          className="interactive px-4 py-3 rounded-xl text-sm"
          style={{
            background: pasteMode ? 'var(--active-bg)' : 'var(--surface)',
            color: pasteMode ? 'var(--gold)' : 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
            border: pasteMode ? '1px solid var(--gold)' : '1px solid var(--border)',
          }}
        >
          paste
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      </div>

      {/* Paste area */}
      {pasteMode && (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='Paste the contents of conversations.json here…'
            rows={6}
            className="w-full rounded-xl p-3 text-xs resize-none outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'DM Mono, monospace',
            }}
          />
          <button
            onClick={handlePaste}
            disabled={loading || !pasteText.trim()}
            className="interactive w-full py-2 rounded-xl text-sm"
            style={{
              background: pasteText ? 'var(--gold)' : 'transparent',
              color: pasteText ? 'white' : 'var(--text-muted)',
              fontFamily: 'DM Mono, monospace',
              border: pasteText ? 'none' : '1px dashed var(--border)',
            }}
          >
            {loading ? 'Analysing…' : 'Analyse'}
          </button>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.3)', color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Analysed {result.conversationCount} conversations from {result.filename}
          </div>
          {result.findings.map((finding) => {
            const domain = DOMAIN_MAP[finding.domain]
            if (!domain) return null
            return (
              <div
                key={finding.domain}
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: domain.color, fontFamily: 'Syne, sans-serif' }}>
                    {domain.label}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {finding.weaknessTags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'DM Mono, monospace', border: '1px solid var(--gold)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', lineHeight: '1.6' }}>
                  {finding.summary}
                </p>
              </div>
            )
          })}
          <p className="text-xs text-center" style={{ color: 'var(--success)', fontFamily: 'DM Mono, monospace' }}>
            ✓ Weakness tags updated — training exercises will now focus on these areas
          </p>
        </div>
      )}
    </div>
  )
}
