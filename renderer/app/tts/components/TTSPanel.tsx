// app/tts/features/components/TTSPanel.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  Volume2, Sparkles, Loader2, Play, Pause, Download, Trash2,
  Languages as LanguagesIcon, UserSquare2, Wand2, History, Copy
} from 'lucide-react'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import { synthesizeTTSEx } from '@/app/tts/api/synthesize'

/* ────────────────────────────────────────────────────────────────
   작은 글로시 슬라이더
   ──────────────────────────────────────────────────────────────── */
type PrettySliderProps = {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  suffix?: string
}
function PrettySlider({ label, min, max, step = 1, value, onChange, suffix }: PrettySliderProps) {
  const pct = useMemo(() => ((value - min) / (max - min)) * 100, [value, min, max])
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-indigo-100/90">{label}</span>
        <span className="text-xs text-indigo-200/80">{value.toFixed(step < 1 ? 2 : 0)}{suffix}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/20 overflow-hidden border border-white/30">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(153,246,228,.9), rgba(167,139,250,.9), rgba(251,113,133,.9))'
          }}
        />
        <div
          className="absolute -top-[6px] -translate-x-1/2 w-4 h-4 rounded-full bg-white/95 border border-white/70 shadow"
          style={{ left: `calc(${pct}% )` }}
        />
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   StarGlow 헤더 (오비트 + 리플렉션)  — .font-RosieBrown 사용
   ──────────────────────────────────────────────────────────────── */
function StarGlowHeader() {
  const title = 'ARIELLE TTS PANEL'
  return (
    <div className="relative select-none">
      {/* 오비트 */}
      <svg viewBox="0 0 800 180" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
        <g className="origin-center animate-[spin_24s_linear_infinite]">
          <ellipse cx="400" cy="90" rx="340" ry="58" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.2"/>
          <ellipse cx="400" cy="90" rx="260" ry="44" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.2"/>
        </g>
      </svg>

      {/* 타이틀 */}
      <div className="relative text-center">
        <div
          className={clsx(
            'font-RosieBrown tracking-[0.22em]',
            'text-[28px] sm:text-[34px] md:text-[40px] font-extrabold',
            'text-transparent bg-clip-text',
            'bg-gradient-to-b from-white via-white to-white/80 drop-shadow'
          )}
          style={{ textShadow: '0 1px 0 rgba(255,255,255,.4), 0 0 20px rgba(255,255,255,.5)' }}
        >
          <span className="relative z-10">{title}</span>
          {/* 리플렉션 */}
          <span
            aria-hidden
            className="absolute left-1/2 -bottom-4 -translate-x-1/2 scale-y-[-1] text-white/80 blur-[0.3px] pointer-events-none"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(255,255,255,.35), transparent 60%)',
              maskImage: 'linear-gradient(to bottom, rgba(255,255,255,.35), transparent 60%)'
            }}
          >
            {title}
          </span>
        </div>
        <p className="mt-1 text-xs md:text-sm text-indigo-200/80">
          엘프의 속삭임을 별빛으로 합성합니다.
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   메인 TTS 패널
   ──────────────────────────────────────────────────────────────── */
type Language = 'JP' | 'EN' | 'KO' | 'ZH'
type Style = 'Neutral' | 'Cheerful' | 'Sad' | 'Serious' | 'Whisper'
type Voice = { id: number; label: string }
const VOICES: Voice[] = [
  { id: 0, label: 'Arielle' },
  { id: 1, label: 'Noir' },
  { id: 2, label: 'Lily' },
]

type HistoryItem = { id: string; text: string; url: string; at: string }

export default function TTSPanel() {
  const notify = useNotificationStore((s) => s.show)

  // 프리셋
  const [voice, setVoice] = useState<Voice>(VOICES[0])
  const [lang, setLang] = useState<Language>('JP')
  const [style, setStyle] = useState<Style>('Neutral')

  // 파라미터
  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(1.0)  // UI만. 백엔드 연동 시 전달
  const [pitch, setPitch] = useState(0)    // UI만. 백엔드 연동 시 전달

  // 상태
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastUrlRef = useRef<string | null>(null)

  useEffect(() => () => { if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current) }, [])

  const canSynthesize = text.trim().length > 0 && !isSynthesizing

  const onSynthesize = useCallback(async () => {
    if (!canSynthesize) return
    setIsSynthesizing(true)
    setProgress(0)

    if (lastUrlRef.current) {
      URL.revokeObjectURL(lastUrlRef.current)
      lastUrlRef.current = null
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const { url } = await synthesizeTTSEx(text, {
        modelId: 0,
        speakerId: voice.id,
        style,
        language: lang,
        timeoutMs: 20000,
        signal: ctrl.signal,
        onDownloadProgress: (e) => {
          if (!e.total) return
          setProgress(Math.max(1, Math.round((e.loaded / e.total) * 100)))
        },
      })

      setAudioUrl(url)
      lastUrlRef.current = url
      setProgress(100)
      notify('TTS 합성이 완료되었습니다.', 'success')

      // 히스토리
      setHistory((prev) => {
        const next = [{ id: Date.now().toString(), text, url, at: new Date().toISOString() }, ...prev]
        return next.slice(0, 5)
      })

      // 자동재생
      requestAnimationFrame(() => audioRef.current?.play().catch(() => {}))
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.message?.includes('canceled')) {
        notify('합성을 취소했습니다.', 'info')
      } else {
        console.error('[TTS 합성 실패]', err)
        notify(err?.message || 'TTS 합성 중 오류가 발생했습니다.', 'error')
      }
    } finally {
      setIsSynthesizing(false)
      setTimeout(() => setProgress(null), 600)
    }
  }, [canSynthesize, text, voice.id, style, lang, notify])

  const onCancel = useCallback(() => abortRef.current?.abort(), [])
  const onClear = useCallback(() => setText(''), [])
  const onDownload = useCallback(() => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `tts_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.wav`
    a.click()
  }, [audioUrl])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }, [])

  return (
    <section
      className={clsx(
        'relative w-full rounded-2xl border border-white/15 overflow-hidden',
        'bg-gradient-to-br from-[#0f1024]/60 via-[#141333]/70 to-[#0d0d1f]/60 backdrop-blur-xl'
      )}
      aria-label="Arielle TTS Panel"
    >
      {/* 오로라 글로우 */}
      <div className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl"
           style={{ background: 'radial-gradient(60% 40% at 30% 20%, #9b8cfa44, transparent 70%), radial-gradient(50% 50% at 80% 20%, #ff7acb33, transparent 70%)' }} />

      <div className="relative p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-white/10 border border-white/20">
              <Volume2 className="w-5 h-5 text-indigo-200" />
            </div>
            <StarGlowHeader />
          </div>

          {/* 프리셋 */}
          <div className="hidden md:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-sm text-indigo-100/90 flex items-center gap-2">
              <UserSquare2 className="w-4 h-4" />
              <select
                className="bg-transparent focus:outline-none"
                value={voice.id}
                onChange={(e) => setVoice(VOICES.find(v => v.id === Number(e.target.value)) || VOICES[0])}
                aria-label="Voice"
              >
                {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-sm text-indigo-100/90 flex items-center gap-2">
              <LanguagesIcon className="w-4 h-4" />
              <select
                className="bg-transparent focus:outline-none"
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label="Language"
              >
                <option value="JP">일본어</option>
                <option value="EN">영어</option>
                <option value="KO">한국어</option>
                <option value="ZH">중국어</option>
              </select>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-sm text-indigo-100/90 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              <select
                className="bg-transparent focus:outline-none"
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
                aria-label="Style"
              >
                <option value="Neutral">Neutral</option>
                <option value="Cheerful">Cheerful</option>
                <option value="Sad">Sad</option>
                <option value="Serious">Serious</option>
                <option value="Whisper">Whisper</option>
              </select>
            </div>
          </div>
        </div>

        {/* 입력/컨트롤 카드 */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <textarea
            className="w-full min-h-[120px] rounded-md bg-white/70 text-sm text-gray-900 placeholder-gray-500 p-3 border border-white/60 shadow-sm focus:outline-none"
            placeholder="엘프의 음성을 담을 문장을 속삭여 주세요… (⌘/Ctrl+Enter 합성)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                onSynthesize()
              }
            }}
            spellCheck={false}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <PrettySlider label="속도" min={0.5} max={1.5} step={0.05} value={speed} onChange={setSpeed} />
            <PrettySlider label="피치" min={-6} max={6} step={1} value={pitch} onChange={setPitch} suffix=" st" />
          </div>

          {/* 진행바 */}
          {progress !== null && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-300 via-indigo-300 to-pink-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* 액션 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={isSynthesizing ? onCancel : onSynthesize}
              disabled={!canSynthesize}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white shadow',
                canSynthesize
                  ? isSynthesizing
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-indigo-300 cursor-not-allowed'
              )}
              title={isSynthesizing ? '합성 취소' : '음성 합성하기'}
            >
              {isSynthesizing ? (<><Loader2 className="w-4 h-4 animate-spin" />합성 중… (취소)</>) : (<><Sparkles className="w-4 h-4" />음성 합성하기</>)}
            </button>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white/70 hover:bg-white text-gray-800 border border-white/60"
            >
              <Trash2 className="w-4 h-4" />
              지우기
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!audioUrl}
                className={clsx(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border',
                  audioUrl ? 'bg-white/70 hover:bg-white text-gray-800 border-white/60' : 'bg-white/50 text-gray-400 border-white/50 cursor-not-allowed'
                )}
              >
                {(audioRef.current && !audioRef.current.paused) ? (<><Pause className="w-4 h-4" />일시정지</>) : (<><Play className="w-4 h-4" />재생</>)}
              </button>
              <button
                type="button"
                onClick={onDownload}
                disabled={!audioUrl}
                className={clsx(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border',
                  audioUrl ? 'bg-white/70 hover:bg-white text-gray-800 border-white/60' : 'bg-white/50 text-gray-400 border-white/50 cursor-not-allowed'
                )}
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
            </div>
          </div>
        </div>

        {/* 플레이어 */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <audio ref={audioRef} src={audioUrl ?? undefined} className="w-full" controls />
        </div>

        {/* 히스토리 (최근 5개) */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-indigo-100/90">최근 합성</span>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-indigo-200/70">아직 합성 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {history.map(h => (
                <li key={h.id} className="group flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10">
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded border bg-white/70 hover:bg-white text-gray-800 border-white/60"
                    onClick={() => {
                      setAudioUrl(h.url)
                      requestAnimationFrame(() => audioRef.current?.play().catch(() => {}))
                    }}
                  >
                    재생
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded border bg-white/60 hover:bg-white text-gray-800 border-white/60"
                    onClick={() => navigator.clipboard.writeText(h.text)}
                    title="텍스트 복사"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-indigo-100/90 truncate">{h.text}</span>
                  <span className="ml-auto text-[10px] text-indigo-200/60">
                    {new Date(h.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
