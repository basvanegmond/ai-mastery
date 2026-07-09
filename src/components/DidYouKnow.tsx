import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../contexts/AppContext'
import type { Tip } from '../types'
import { selectTips } from '../utils/tips'

const FS_DURATION_MS = 8000
const COMMAND_PATTERN = /\/\w+|CLAUDE\.md|Shift\+Tab|@\w+/g

/** Wraps command-like tokens (/btw, CLAUDE.md, @file, Shift+Tab) in inline code styling. */
function withInlineCode(text: string): ReactNode[] {
  const parts = text.split(COMMAND_PATTERN)
  const matches = text.match(COMMAND_PATTERN) ?? []
  const nodes: React.ReactNode[] = []
  parts.forEach((part, i) => {
    if (part) nodes.push(part)
    const match = matches[i]
    if (match) {
      nodes.push(
        <code key={i} className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[0.9em]">
          {match}
        </code>,
      )
    }
  })
  return nodes
}

export function DidYouKnow(): JSX.Element | null {
  const { state } = useApp()
  const tips = useMemo<Tip[]>(
    () => (state ? selectTips(state.domains, state.radarScores) : []),
    [state],
  )

  const [index, setIndex] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [paused, setPaused] = useState(false)

  const fillRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (index >= tips.length) setIndex(0)
  }, [tips.length, index])

  // New tip in ambient mode → reset the countdown.
  useEffect(() => {
    if (!fullscreen) return
    elapsedRef.current = 0
    if (fillRef.current) fillRef.current.style.width = '0%'
  }, [index, fullscreen])

  // Drive the pill-fill animation. Pausing freezes elapsed time; resuming continues from it.
  useEffect(() => {
    if (!fullscreen || paused || tips.length === 0) return
    startRef.current = performance.now()

    function tick(): void {
      const elapsed = elapsedRef.current + (performance.now() - startRef.current)
      const progress = Math.min(elapsed / FS_DURATION_MS, 1)
      if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`
      if (progress >= 1) {
        setIndex((i) => (i + 1) % tips.length)
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      elapsedRef.current += performance.now() - startRef.current
    }
  }, [fullscreen, paused, index, tips.length])

  // Escape closes ambient mode.
  useEffect(() => {
    if (!fullscreen) return
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fullscreen])

  if (tips.length === 0) return null

  const tip = tips[index]!
  const prev = (): void => setIndex((i) => (i - 1 + tips.length) % tips.length)
  const next = (): void => setIndex((i) => (i + 1) % tips.length)

  return (
    <div className="mt-3">
      {/* State 0: slim bright bar */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        className={`flex h-11 w-full items-center gap-3.5 border border-white/10 bg-trypan px-5 text-left transition-colors hover:bg-trypan/90 ${
          panelOpen ? 'rounded-t-xl' : 'rounded-xl'
        }`}
      >
        <code className="shrink-0 rounded bg-white/18 px-2 py-0.5 font-mono text-xs font-bold text-white">
          {tip.badge}
        </code>
        <span className="min-w-0 flex-1 truncate text-[13px] text-white/85">{tip.short}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/40">
          Learn more
          <span
            className={`inline-block transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </span>
      </button>

      {/* State 1: expanded panel */}
      {panelOpen && (
        <div className="rounded-b-xl border border-t-0 border-white/10 bg-trypan px-5 pb-[18px]">
          <div className="mb-4 h-px bg-white/10" />
          <div className="grid grid-cols-3 items-start gap-4">
            <div>
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
                What it is
              </div>
              <div className="mb-1.5 text-[15px] font-bold leading-snug text-white">
                {tip.heading}
              </div>
              <div className="text-xs leading-relaxed text-white/65">{withInlineCode(tip.what)}</div>
            </div>
            <div>
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
                When to use
              </div>
              <div className="text-xs leading-relaxed text-white/65">{tip.when}</div>
            </div>
            <div>
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
                Why it matters
              </div>
              <div className="text-xs leading-relaxed text-white/65">{withInlineCode(tip.why)}</div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous tip"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/15 text-sm text-white"
              >
                ‹
              </button>
              <span className="text-[11px] tabular-nums text-white/40">
                {index + 1} / {tips.length}
              </span>
              <button
                type="button"
                onClick={next}
                aria-label="Next tip"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/15 text-sm text-white"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setFullscreen(true)
                setPaused(false)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/12 px-3.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/20"
            >
              ⊞ Ambient mode — full screen
            </button>
          </div>
        </div>
      )}

      {/* State 2: fullscreen ambient overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0B2B] px-20 py-16"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaused((p) => !p)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Ambient tip display"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFullscreen(false)
            }}
            className="fixed right-7 top-6 rounded-lg border border-white/12 bg-white/8 px-3.5 py-1.5 text-xs text-white/50 hover:bg-white/14 hover:text-white"
          >
            ✕ Exit ambient
          </button>

          <div className="mb-12 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[2px] text-white/25">
            <span className="h-px w-20 bg-white/8" />
            AI Mastery · Did you know
            <span className="h-px w-20 bg-white/8" />
          </div>

          <div className="mb-9 rounded-xl border border-trypan/50 bg-trypan/40 px-5 py-2 font-mono text-[28px] font-bold text-[#9B8FFF]">
            {tip.badge}
          </div>

          <h2
            onClick={(e) => {
              e.stopPropagation()
              setPaused((p) => !p)
            }}
            className="mb-6 max-w-3xl text-center text-[42px] font-bold leading-tight text-white"
          >
            {tip.short}
          </h2>
          <p
            onClick={(e) => {
              e.stopPropagation()
              setPaused((p) => !p)
            }}
            className="mb-14 max-w-2xl text-center text-xl leading-relaxed text-white/50"
          >
            {tip.what}
          </p>

          <div className="mb-12 flex items-center gap-2">
            {tips.map((t, i) => (
              <div
                key={t.id}
                className={`h-2 flex-shrink-0 overflow-hidden rounded-full bg-white/15 transition-all duration-300 ${
                  i === index ? 'w-[72px] rounded bg-trypan/30' : 'w-2'
                }`}
              >
                {i === index && <div ref={fillRef} className="h-full w-0 rounded bg-trypan" />}
              </div>
            ))}
          </div>

          <p
            onClick={(e) => {
              e.stopPropagation()
              setPaused((p) => !p)
            }}
            className="text-center text-[11px] tracking-wide text-white/20"
          >
            {paused ? 'Paused — click to resume' : 'Auto-advancing every 8 seconds · Click anywhere to pause'}
          </p>
        </div>
      )}
    </div>
  )
}
