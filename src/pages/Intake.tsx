import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import { findDomainSet } from '../data/assessment'
import type { AssessmentDomainSet, AssessmentQuestion } from '../data/assessment'
import type { Domain } from '../types'
import {
  buildDomainInsight,
  buildFocusPlan,
  levelForScore,
  scoreFromCorrectCount,
} from '../utils/assessment'
import type { AnsweredQuestion } from '../utils/assessment'
import { submitDomainScore } from '../utils/baselineSubmit'
import { getDomainColor, scoreToGrade } from '../utils/domains'

type Screen = 'welcome' | 'question' | 'summary' | 'results'

interface DomainRun {
  domain: Domain
  set: AssessmentDomainSet
}

interface DomainResult {
  domain: Domain
  answered: AnsweredQuestion[]
  score: number
}

export default function Intake(): JSX.Element {
  const { state, refetch } = useApp()
  const navigate = useNavigate()

  const runs = useMemo<DomainRun[]>(() => {
    if (state === null) return []
    return state.domains
      .filter((d) => d.graded)
      .map((domain) => ({ domain, set: findDomainSet(domain.id) }))
      .filter((x): x is DomainRun => x.set !== undefined)
  }, [state])

  const totalQuestions = runs.reduce((sum, r) => sum + r.set.questions.length, 0)

  const [screen, setScreen] = useState<Screen>('welcome')
  const [domainIdx, setDomainIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [domainAnswers, setDomainAnswers] = useState<AnsweredQuestion[]>([])
  const [results, setResults] = useState<DomainResult[]>([])
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})

  const resultScores = useMemo(() => {
    const scores: Record<string, number> = {}
    for (const r of results) scores[r.domain.id] = r.score
    return scores
  }, [results])

  useEffect(() => {
    if (screen !== 'results') return
    refetch()
  }, [screen, refetch])

  if (state === null || runs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ambient text-white/60">
        Loading assessment…
      </div>
    )
  }

  const currentRun = runs[domainIdx]!
  const currentQuestion: AssessmentQuestion | undefined = currentRun.set.questions[questionIdx]
  const questionsAnsweredSoFar =
    runs.slice(0, domainIdx).reduce((sum, r) => sum + r.set.questions.length, 0) + questionIdx + 1

  function selectOption(i: number): void {
    if (selectedIndex !== null || currentQuestion === undefined) return
    setSelectedIndex(i)
    setDomainAnswers((prev) => [...prev, { question: currentQuestion, correct: i === currentQuestion.correct }])
  }

  function goNextQuestion(): void {
    if (questionIdx < currentRun.set.questions.length - 1) {
      setQuestionIdx((i) => i + 1)
      setSelectedIndex(null)
      return
    }
    // Domain complete — compute and store its result, show summary.
    const correctCount = domainAnswers.filter((a) => a.correct).length
    const score = scoreFromCorrectCount(correctCount, domainAnswers.length)
    const domainId = currentRun.domain.id
    setResults((prev) => [...prev, { domain: currentRun.domain, answered: domainAnswers, score }])
    setScreen('summary')

    setSaveStatus((prev) => ({ ...prev, [domainId]: 'saving' }))
    void submitDomainScore(domainId, score).then((ok) => {
      setSaveStatus((prev) => ({ ...prev, [domainId]: ok ? 'saved' : 'error' }))
    })
  }

  function goNextDomain(): void {
    setDomainAnswers([])
    setSelectedIndex(null)
    setQuestionIdx(0)
    if (domainIdx < runs.length - 1) {
      setDomainIdx((i) => i + 1)
      setScreen('question')
    } else {
      setScreen('results')
    }
  }

  const lastResult = results[results.length - 1]

  return (
    <div className="flex min-h-screen flex-col bg-ambient">
      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-white/6 bg-sidebar px-4 py-3 sm:gap-5 sm:px-8 sm:py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-trypan to-[#0053EC] text-[10px] font-extrabold text-white">
            AI
          </div>
          <span className="hidden text-[13px] font-bold text-white/90 sm:inline">AI Mastery</span>
        </div>
        <div className="flex-1" />
        {screen !== 'welcome' && screen !== 'results' && (
          <div className="flex max-w-[200px] flex-1 flex-col gap-1.5 sm:w-80 sm:max-w-none sm:flex-none">
            <div className="hidden justify-between sm:flex">
              <span className="text-[10px] uppercase tracking-wide text-white/40">Baseline Assessment</span>
              <span className="text-[10px] text-white/30">
                Domain {domainIdx + 1} of {runs.length}
              </span>
            </div>
            <div className="flex gap-1">
              {runs.map((r, i) => (
                <div
                  key={r.domain.id}
                  className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${
                    i < domainIdx ? 'bg-trypan' : i === domainIdx ? 'bg-[#0053EC]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (results.length > 0) refetch()
            navigate('/')
          }}
          className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/40 hover:bg-white/8 hover:text-white/70 sm:px-3"
        >
          Exit
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-28">
        <div className="w-full max-w-[680px]">
          {screen === 'welcome' && (
            <div className="rounded-2xl bg-white px-6 pb-8 pt-9 text-center shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:px-12 sm:pb-10 sm:pt-12">
              <h1 className="mb-2.5 text-xl font-extrabold leading-tight text-ink sm:text-[26px]">
                First, let's see where you actually stand
              </h1>
              <p className="mx-auto mb-8 max-w-[420px] text-sm leading-relaxed text-ink-sub sm:text-[15px]">
                {totalQuestions} questions across {runs.length} domains. Real scenarios — you either
                know it or you don't. You'll see how you did after each section. About{' '}
                {Math.round(totalQuestions * 0.6)} minutes.
              </p>
              <div className="mb-8 flex justify-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[22px] font-bold text-trypan">{runs.length}</div>
                  <div className="text-[11px] font-medium text-ink-sub">domains</div>
                </div>
                <div className="w-px self-stretch bg-edge" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[22px] font-bold text-trypan">{totalQuestions}</div>
                  <div className="text-[11px] font-medium text-ink-sub">questions</div>
                </div>
                <div className="w-px self-stretch bg-edge" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[22px] font-bold text-trypan">
                    ~{Math.round(totalQuestions * 0.6)}
                  </div>
                  <div className="text-[11px] font-medium text-ink-sub">minutes</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreen('question')}
                className="w-full rounded-[10px] bg-trypan py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-trypan/90"
              >
                Start →
              </button>
            </div>
          )}

          {screen === 'question' && currentQuestion !== undefined && (
            <div>
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3.5 py-3 sm:mb-5 sm:gap-3.5 sm:px-5 sm:py-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-[14px]"
                  style={{ backgroundColor: getDomainColor(currentRun.domain.id) }}
                >
                  {currentRun.domain.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-white/90 sm:text-[13px]">
                    {currentRun.domain.name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/35 sm:text-[11px]">
                    Domain {domainIdx + 1} of {runs.length} · Q{questionIdx + 1} of{' '}
                    {currentRun.set.questions.length}
                    <span className="hidden sm:inline">
                      {' '}
                      · {questionsAnsweredSoFar} of {totalQuestions} overall
                    </span>
                  </div>
                </div>
                <div className="hidden shrink-0 gap-1.5 sm:flex">
                  {currentRun.set.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className={`h-2 w-2 rounded-full ${
                        i < questionIdx
                          ? 'bg-trypan'
                          : i === questionIdx
                            ? 'h-2.5 w-2.5 border-2 border-[#0053EC]/30 bg-[#0053EC]'
                            : 'bg-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-5 pb-6 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:px-9 sm:pb-7 sm:pt-8">
                <div className="mb-3.5 text-[10px] font-bold uppercase tracking-wider text-ink-sub">
                  Scenario
                </div>
                <div className="mb-6 text-base font-bold leading-snug text-ink sm:text-[18px]">
                  {currentQuestion.text}
                </div>
                <div className="flex flex-col gap-2.5">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = selectedIndex === i
                    const isCorrectOpt = i === currentQuestion.correct
                    const revealed = selectedIndex !== null
                    let cls = 'border-edge bg-white hover:border-trypan hover:bg-trypan-light'
                    if (revealed) {
                      if (isSelected && isCorrectOpt) cls = 'border-emerald-500 bg-emerald-50'
                      else if (isSelected) cls = 'border-red-500 bg-red-50'
                      else if (isCorrectOpt) cls = 'border-emerald-500 bg-emerald-50'
                      else cls = 'border-edge bg-white opacity-60'
                    }
                    let letterCls = 'bg-canvas-sub text-ink-sub'
                    if (revealed && isCorrectOpt) letterCls = 'bg-emerald-500 text-white'
                    else if (revealed && isSelected) letterCls = 'bg-red-500 text-white'
                    else if (isSelected) letterCls = 'bg-trypan text-white'

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectOption(i)}
                        disabled={revealed}
                        className={`flex items-start gap-3 rounded-[10px] border-[1.5px] px-4 py-3.5 text-left transition-colors ${cls}`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${letterCls}`}
                        >
                          {'ABCD'[i]}
                        </span>
                        <span className="pt-0.5 text-sm leading-snug text-[#2A2460]">{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedIndex !== null && (
                  <p className="mt-4 text-[13px] leading-relaxed text-ink-sub">
                    {currentQuestion.explanation}
                  </p>
                )}

                <div className="mt-6 flex justify-end border-t border-[#F0EEF5] pt-5">
                  <button
                    type="button"
                    onClick={goNextQuestion}
                    disabled={selectedIndex === null}
                    className="w-full rounded-[9px] bg-trypan px-7 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-trypan/90 disabled:pointer-events-none disabled:opacity-0 sm:w-auto"
                  >
                    {questionIdx < currentRun.set.questions.length - 1
                      ? 'Next question →'
                      : 'See domain results →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {screen === 'summary' && lastResult !== undefined && (
            <div className="rounded-2xl bg-white px-5 pb-6 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:px-10 sm:pb-8 sm:pt-9">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg"
                  style={{ backgroundColor: getDomainColor(lastResult.domain.id) }}
                >
                  {lastResult.domain.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold text-ink sm:text-[20px]">
                    {lastResult.domain.name}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-sub">
                    Domain {domainIdx + 1} of {runs.length} complete
                  </div>
                </div>
              </div>

              <div className="mb-6 flex gap-2 sm:gap-3">
                <div className="flex-1 rounded-[10px] border border-edge bg-canvas-sub p-2.5 text-center sm:p-3.5">
                  <div className="text-xl font-extrabold leading-none text-trypan sm:text-[28px]">
                    {lastResult.answered.filter((a) => a.correct).length}/{lastResult.answered.length}
                  </div>
                  <div className="mt-1 text-[9px] font-medium text-ink-sub sm:text-[10px]">Questions correct</div>
                </div>
                <div className="flex-1 rounded-[10px] border border-edge bg-canvas-sub p-2.5 text-center sm:p-3.5">
                  <div className="text-sm font-bold text-trypan">{scoreToGrade(lastResult.score)}</div>
                  <div className="mt-1 text-[9px] font-medium text-ink-sub sm:text-[10px]">Starting grade</div>
                </div>
                <div className="flex-1 rounded-[10px] border border-edge bg-canvas-sub p-2.5 text-center sm:p-3.5">
                  <div className="text-sm font-bold text-[#0E7A8A]">{levelForScore(lastResult.score)}</div>
                  <div className="mt-1 text-[9px] font-medium text-ink-sub sm:text-[10px]">Skill level</div>
                </div>
              </div>

              <div className="mb-5 rounded-[10px] border-l-[3px] border-trypan bg-trypan-light px-4 py-3.5">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-trypan">
                  Key insight
                </div>
                <div className="text-[13px] leading-relaxed text-[#2A2460]">
                  {buildDomainInsight(lastResult.answered, findDomainSet(lastResult.domain.id)!.masteryInsight)}
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-sub">
                  Your answers
                </div>
                {lastResult.answered.map((a, i) => (
                  <div
                    key={a.question.id}
                    className={`flex items-center gap-2.5 py-2 text-xs text-[#3A3060] ${
                      i < lastResult.answered.length - 1 ? 'border-b border-[#F0EEF5]' : ''
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        a.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {a.correct ? '✓' : '✗'}
                    </span>
                    <span className="flex-1">{a.question.text.slice(0, 60)}…</span>
                  </div>
                ))}
              </div>

              {saveStatus[lastResult.domain.id] === 'error' && (
                <p className="mb-4 text-[11px] text-amber-600">
                  Couldn't save this score after a few tries — your local results are fine, but your dashboard
                  may not reflect it yet.
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <span className="text-[11px] text-ink-sub">
                  {domainIdx < runs.length - 1
                    ? `Up next: ${runs[domainIdx + 1]!.domain.name}`
                    : 'Last domain — see your full results'}
                </span>
                <button
                  type="button"
                  onClick={goNextDomain}
                  className="w-full rounded-[9px] bg-trypan px-7 py-2.5 text-sm font-bold text-white hover:bg-trypan/90 sm:w-auto"
                >
                  {domainIdx < runs.length - 1 ? 'Continue →' : 'See my baseline →'}
                </button>
              </div>
            </div>
          )}

          {screen === 'results' && (
            <div className="rounded-2xl bg-white px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:px-10 sm:py-9">
              <div className="mb-6 text-center sm:mb-8">
                <h2 className="mb-1.5 text-xl font-extrabold text-ink sm:text-2xl">Your AI Mastery Baseline</h2>
                <p className="text-[13px] text-ink-sub">
                  Done. Here's where you stand across all {runs.length} domains.
                  {Object.values(saveStatus).some((s) => s === 'saving') && ' Saving your last result…'}
                  {!Object.values(saveStatus).some((s) => s === 'saving') &&
                    results.some((r) => saveStatus[r.domain.id] === 'error') && (
                      <span className="text-amber-600">
                        {' '}
                        Couldn't save:{' '}
                        {results
                          .filter((r) => saveStatus[r.domain.id] === 'error')
                          .map((r) => r.domain.name)
                          .join(', ')}
                        .
                      </span>
                    )}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {results.map((r) => (
                  <div key={r.domain.id} className="rounded-lg border border-edge bg-canvas-sub p-2 text-center">
                    <div
                      className="text-lg font-extrabold"
                      style={{ color: getDomainColor(r.domain.id) }}
                    >
                      {scoreToGrade(r.score)}
                    </div>
                    <div className="mt-0.5 text-[8px] leading-tight text-ink-sub">{r.domain.name}</div>
                  </div>
                ))}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-edge bg-canvas-sub p-4">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-sub">
                    Skill Radar
                  </div>
                  <RadarChart domains={results.map((r) => r.domain)} radarScores={resultScores} />
                </div>
                <div>
                  <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-sub">
                    Focus Plan — Start here
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {buildFocusPlan(
                      results.map((r) => r.domain),
                      resultScores,
                    ).map((item, i) => (
                      <div
                        key={item.domainId}
                        className="rounded-[10px] border border-edge bg-canvas-sub p-3"
                        style={{ borderLeft: `3px solid ${getDomainColor(item.domainId)}` }}
                      >
                        <div
                          className="mb-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ color: getDomainColor(item.domainId) }}
                        >
                          Priority {i + 1}
                        </div>
                        <div className="mb-0.5 text-[13px] font-bold text-ink">{item.domainName}</div>
                        <div className="text-[11px] leading-relaxed text-ink-sub">{item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full rounded-[10px] bg-trypan px-12 py-3.5 text-[15px] font-bold text-white hover:bg-trypan/90 sm:w-auto"
                >
                  Start training →
                </button>
                <p className="mt-2.5 text-[11px] text-ink-sub">
                  Your dashboard is set. Come back and retake this whenever you want to check progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
