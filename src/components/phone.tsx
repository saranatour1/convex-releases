import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react'
import { MicIcon, SquareIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { Sphere, type Mode } from '~/components/sphere'
import { cn } from '~/lib/utils'

const LABEL: Record<Mode, string> = {
  idle: 'Tap the mic to talk',
  listening: 'Go ahead, I’m listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
}

const RATE = 16000
const SPEECH_LEVEL = 0.03 // RMS above this counts as you talking
const PAUSE_MS = 650 // this much quiet ends your turn
const MAX_FRAMES = 400 // ~17 s at 48 kHz, well under the 2 MB upload cap

// Mono 16 kHz WAV: the format the AI SDK can identify by its bytes.
function toWav(pcm: Float32Array, rate: number) {
  const ratio = rate / RATE
  const out = new Int16Array(Math.floor(pcm.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const a = Math.floor(i * ratio)
    const b = Math.max(a + 1, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = a; j < b; j++) sum += pcm[j]
    out[i] = Math.max(-1, Math.min(1, sum / (b - a))) * 0x7fff
  }
  const view = new DataView(new ArrayBuffer(44 + out.length * 2))
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + out.length * 2, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, RATE, true)
  view.setUint32(28, RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, out.length * 2, true)
  new Int16Array(view.buffer, 44).set(out)
  return view.buffer
}

export function Phone() {
  const convex = useConvex()
  const { isAuthenticated } = useConvexAuth()
  const turns = useQuery(api.models.list, isAuthenticated ? {} : 'skip')
  const budget = useQuery(api.models.status, isAuthenticated ? {} : 'skip')
  const clear = useMutation(api.models.clear)

  const [mode, setMode] = useState<Mode>('idle')
  const stopSession = useRef<() => void>(undefined)
  const player = useRef<HTMLAudioElement>(undefined)
  const log = useRef<HTMLDivElement>(null)
  const live = mode !== 'idle'

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [turns?.length])
  useEffect(() => () => stopSession.current?.(), [])

  // One turn is one action. Your words and the reply appear in the chat live as
  // they are saved; the voice comes back as MP3 bytes.
  const turn = async (wav: ArrayBuffer) => {
    setMode('thinking')
    const bytes = await convex.action(api.models.talk, { audio: wav })
    const audio = new Audio(
      URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' })),
    )
    player.current = audio
    setMode('speaking')
    await new Promise((done) => {
      audio.onended = audio.onerror = done
      audio.play().catch(done)
    })
  }

  // Hands-free: the mic stays open, we cut your turn at a pause, answer, then
  // listen again. The gateway has no two-way live audio, so this is as live as it gets.
  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch {
      return toast.error(
        'Microphone blocked. Allow it in your browser to talk.',
      )
    }
    const ctx = new AudioContext()
    const mic = ctx.createMediaStreamSource(stream)
    const tap = ctx.createScriptProcessor(2048, 1, 1)
    mic.connect(tap)
    tap.connect(ctx.destination)

    let frames: Float32Array[] = []
    let talking = false
    let busy = false
    let firstVoice = 0
    let lastVoice = 0
    let deaf = 0 // ignore the mic until then, so we don't hear our own reply

    const stop = () => {
      tap.onaudioprocess = null
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
      player.current?.pause()
      stopSession.current = undefined
      setMode('idle')
    }
    stopSession.current = stop
    setMode('listening')

    tap.onaudioprocess = (e) => {
      const now = performance.now()
      if (busy || now < deaf) return
      const frame = new Float32Array(e.inputBuffer.getChannelData(0))
      const level = Math.sqrt(
        frame.reduce((n, x) => n + x * x, 0) / frame.length,
      )
      frames.push(frame)
      if (level > SPEECH_LEVEL) {
        lastVoice = now
        if (!talking) [talking, firstVoice] = [true, now]
      }
      if (!talking) return void (frames = frames.slice(-8)) // keep a little lead-in

      const paused = now - lastVoice > PAUSE_MS
      if (!paused && frames.length < MAX_FRAMES) return
      const long = lastVoice - firstVoice > 250
      const pcm = new Float32Array(frames.reduce((n, f) => n + f.length, 0))
      frames.reduce((at, f) => (pcm.set(f, at), at + f.length), 0)
      frames = []
      talking = false
      if (!long) return // a cough, not a question

      busy = true
      turn(toWav(pcm, ctx.sampleRate))
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : String(err))
          if (/budget/i.test(String(err))) stop()
        })
        .finally(() => {
          busy = false
          deaf = performance.now() + 400
          if (stopSession.current) setMode('listening')
        })
    }
  }

  const reset = async () => {
    player.current?.pause()
    await clear()
  }

  return (
    <div className="mx-auto w-[22rem] max-w-full">
      <div className="relative flex h-[40rem] flex-col overflow-hidden rounded-[2.75rem] border-[6px] border-foreground/90 bg-card shadow-2xl">
        <div className="mx-auto mt-2 h-6 w-24 shrink-0 rounded-full bg-foreground/90">
          <span className="ml-16 mt-2.5 block size-1.5 rounded-full bg-convex-yellow" />
        </div>
        <div className="flex shrink-0 justify-center pt-4">
          <Sphere mode={mode} />
        </div>

        <div
          ref={log}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-2"
          aria-live="polite"
        >
          {turns?.map((t) => (
            <p
              key={t._id}
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm',
                t.role === 'user'
                  ? 'ml-auto bg-foreground text-background'
                  : 'bg-muted text-foreground',
              )}
            >
              {t.text}
            </p>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-6 pt-3">
          <button
            onClick={reset}
            aria-label="Clear conversation"
            className="grid size-12 place-items-center rounded-full bg-muted shadow-md hover:bg-accent"
          >
            <XIcon className="size-5" />
          </button>
          <span
            className={cn(
              'text-sm',
              mode === 'idle'
                ? 'text-muted-foreground'
                : 'text-convex-purple dark:text-convex-yellow',
            )}
          >
            {isAuthenticated ? LABEL[mode] : 'Signing in…'}
          </span>
          <button
            onClick={() => (live ? stopSession.current?.() : void start())}
            disabled={!isAuthenticated}
            aria-label={live ? 'End conversation' : 'Start talking'}
            className={cn(
              'grid size-12 place-items-center rounded-full shadow-md transition-colors disabled:opacity-50',
              live
                ? 'bg-convex-red text-white'
                : 'bg-convex-yellow text-black hover:brightness-95',
            )}
          >
            {live ? (
              <SquareIcon className="size-4 fill-current" />
            ) : (
              <MicIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
      {budget && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          AI budget:{' '}
          <span className="font-medium text-foreground">{budget.left}</span> of{' '}
          {budget.limit} calls left. A turn uses 3.
        </p>
      )}
    </div>
  )
}
