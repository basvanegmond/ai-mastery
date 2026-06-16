import { useState } from 'react'
import { useMasteryStore } from '../../store/masteryStore'

export function SettingsScreen() {
  const store = useMasteryStore()
  const [tokenInput, setTokenInput] = useState(store.githubToken)
  const [tokenSaved, setTokenSaved] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [importDone, setImportDone] = useState(false)

  function saveToken() {
    store.setGithubToken(tokenInput.trim())
    setTokenSaved(true)
    setTimeout(() => setTokenSaved(false), 2000)
    if (tokenInput.trim()) {
      setTimeout(() => store.syncFromGithub(), 100)
    }
  }

  function handleExport() {
    const data = {
      version: store.version,
      lastActiveAt: store.lastActiveAt,
      domainProgress: store.domainProgress,
      exerciseHistory: store.exerciseHistory,
      weaknessTags: store.weaknessTags,
      patternAnalyses: store.patternAnalyses,
      githubSha: store.githubSha,
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setExportCopied(true)
    setTimeout(() => setExportCopied(false), 2000)
  }

  function handleImport() {
    try {
      const data = JSON.parse(importText)
      store.loadFromData(data)
      setImportText('')
      setImportDone(true)
      setTimeout(() => setImportDone(false), 3000)
    } catch {
      alert('Invalid JSON — paste the full export content')
    }
  }

  function handleManualSync() {
    if (store.githubToken) {
      store.syncFromGithub()
    }
  }

  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined

  return (
    <div className="space-y-6">
      <h2 className="text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Settings</h2>

      {/* GitHub sync */}
      <section
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
      >
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
            GitHub sync
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', lineHeight: '1.6' }}>
            Progress is saved to <code style={{ background: 'var(--bg2)', padding: '1px 4px', borderRadius: '3px' }}>data/progress.json</code> in this repository.
            Provide a GitHub Personal Access Token with <strong>contents: write</strong> scope on basvanegmond/ai-mastery.
          </p>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=AI+Mastery+sync"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mt-1 inline-block"
            style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}
          >
            Create token on GitHub →
          </a>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--bg2)',
              boxShadow: 'var(--neo-inset)',
              color: 'var(--text-primary)',
              fontFamily: 'DM Mono, monospace',
              border: 'none',
            }}
          />
          <button
            onClick={saveToken}
            className="px-4 rounded-lg text-sm transition-neo"
            style={{
              boxShadow: 'var(--neo-raised)',
              background: 'var(--surface)',
              color: tokenSaved ? 'var(--success)' : 'var(--text-primary)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {tokenSaved ? '✓ saved' : 'save'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Sync status:{' '}
            <span
              style={{
                color:
                  store.syncStatus === 'idle' ? 'var(--success)'
                  : store.syncStatus === 'syncing' ? 'var(--gold)'
                  : 'var(--danger)',
              }}
            >
              {store.syncStatus === 'conflict' ? 'conflict — reload to sync' : store.syncStatus}
            </span>
          </div>
          {store.githubToken && (
            <button
              onClick={handleManualSync}
              className="text-xs px-3 py-1 rounded-lg transition-neo"
              style={{
                boxShadow: 'var(--neo-raised)',
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              sync now
            </button>
          )}
        </div>
        {store.syncError && store.syncStatus !== 'idle' && (
          <div className="text-xs" style={{ color: 'var(--danger)', fontFamily: 'DM Mono, monospace' }}>
            {store.syncError}
          </div>
        )}
      </section>

      {/* Cloudflare Worker */}
      <section
        className="rounded-xl p-5 space-y-3"
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
      >
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
          Claude API proxy
        </div>
        <div
          className="flex items-center gap-2 text-xs"
          style={{ fontFamily: 'DM Mono, monospace', color: workerUrl ? 'var(--success)' : 'var(--danger)' }}
        >
          <span>{workerUrl ? '●' : '○'}</span>
          <span>{workerUrl ? `Configured: ${workerUrl}` : 'Not configured — Quick exercises disabled'}</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', lineHeight: '1.6' }}>
          Deploy the Cloudflare Worker from <code style={{ background: 'var(--bg2)', padding: '1px 4px', borderRadius: '3px' }}>cloudflare-worker/worker.js</code>, add your <code style={{ background: 'var(--bg2)', padding: '1px 4px', borderRadius: '3px' }}>ANTHROPIC_API_KEY</code> as a Worker secret, then add the Worker URL as <code style={{ background: 'var(--bg2)', padding: '1px 4px', borderRadius: '3px' }}>VITE_WORKER_URL</code> in GitHub Actions secrets and rebuild.
        </p>
      </section>

      {/* Manual backup */}
      <section
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
      >
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
          Manual backup
        </div>

        <button
          onClick={handleExport}
          className="w-full py-2 rounded-lg text-sm transition-neo"
          style={{
            boxShadow: 'var(--neo-raised)',
            background: 'var(--surface)',
            color: exportCopied ? 'var(--success)' : 'var(--text-primary)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          {exportCopied ? '✓ copied to clipboard' : 'Export JSON (copy to clipboard)'}
        </button>

        <div className="space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported JSON here to restore…"
            rows={4}
            className="w-full rounded-lg p-3 text-xs resize-none outline-none"
            style={{
              background: 'var(--bg2)',
              boxShadow: 'var(--neo-inset)',
              color: 'var(--text-primary)',
              fontFamily: 'DM Mono, monospace',
              border: 'none',
            }}
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-2 rounded-lg text-sm transition-neo"
            style={{
              boxShadow: importText ? 'var(--neo-raised)' : 'none',
              background: importText ? 'var(--surface)' : 'transparent',
              color: importDone ? 'var(--success)' : importText ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'DM Mono, monospace',
              border: !importText ? '1px dashed rgba(255,255,255,0.1)' : 'none',
            }}
          >
            {importDone ? '✓ imported' : 'Import JSON'}
          </button>
        </div>
      </section>

      {/* Stats */}
      <section
        className="rounded-xl p-5"
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
      >
        <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
          Data summary
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          <div>Exercises logged: <span style={{ color: 'var(--text-primary)' }}>{store.exerciseHistory.length}</span></div>
          <div>Imports: <span style={{ color: 'var(--text-primary)' }}>{store.patternAnalyses.length}</span></div>
          <div>Last active: <span style={{ color: 'var(--text-primary)' }}>{new Date(store.lastActiveAt).toLocaleDateString()}</span></div>
          <div>GitHub SHA: <span style={{ color: 'var(--text-primary)' }}>{store.githubSha ? store.githubSha.slice(0, 8) : 'none'}</span></div>
        </div>
      </section>
    </div>
  )
}
