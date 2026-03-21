import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Copy, CheckCheck } from 'lucide-react'

const CHARS = '0123456789abcdef'

// Each character scrambles then resolves to its true value
function useGlitchReveal(target, delay = 0) {
  const [display, setDisplay] = useState(() => ' '.repeat(target.length))
  const [done,    setDone]    = useState(false)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!target) return
    setDone(false)
    setDisplay(' '.repeat(target.length))

    let started = false
    const timeout = setTimeout(() => {
      started = true
      let iteration = 0
      const totalFrames = target.length * 4 // frames to reveal all chars

      const tick = () => {
        const revealedCount = Math.floor(iteration / 4)
        const next = target
          .split('')
          .map((ch, i) => {
            if (i < revealedCount) return ch  // already resolved
            if (i === revealedCount) {
              // Currently scrambling
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)] // still scrambling
          })
          .join('')

        setDisplay(next)
        iteration++

        if (iteration <= totalFrames + 4) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          setDisplay(target)
          setDone(true)
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, delay])

  return { display, done }
}

export default function LetterGlitchHash({ hash }) {
  const { display, done } = useGlitchReveal(hash, 200)
  const [copied, setCopied] = useState(false)

  const copyHash = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Split into 4 groups of 16 for visual legibility
  const groups = []
  for (let i = 0; i < display.length; i += 16) {
    groups.push(display.slice(i, i + 16))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.16,1,0.3,1] }}
      className="rounded-xl p-5"
      style={{
        background: 'rgba(4,8,15,0.8)',
        border: '1px solid rgba(0,255,180,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono-cus text-[10px] tracking-[2.5px]" style={{ color: 'rgba(0,255,180,0.45)' }}>
            SHA-256 HASH
          </span>
          {done && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono-cus tracking-widest"
              style={{ background: 'rgba(0,255,180,0.1)', color: '#00ffb4', border: '1px solid rgba(0,255,180,0.2)' }}
            >
              SEALED
            </motion.span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyHash}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono-cus tracking-widest transition-all"
          style={{
            background: copied ? 'rgba(0,255,180,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${copied ? 'rgba(0,255,180,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: copied ? '#00ffb4' : 'rgba(255,255,255,0.4)',
          }}
        >
          {copied
            ? <><CheckCheck size={10} /> COPIED</>
            : <><Copy size={10} /> COPY</>
          }
        </motion.button>
      </div>

      {/* Hash display — groups of 16 */}
      <div className="flex flex-col gap-1">
        {groups.map((chunk, gi) => (
          <div key={gi} className="flex gap-1 flex-wrap">
            {chunk.split('').map((ch, ci) => {
              const charIdx = gi * 16 + ci
              const isResolved = hash[charIdx] === ch
              return (
                <motion.span
                  key={ci}
                  className="font-mono-cus text-sm leading-none"
                  style={{
                    color: isResolved
                      ? (done ? '#00ffb4' : 'rgba(0,255,180,0.85)')
                      : `rgba(0,255,180,${0.15 + Math.random() * 0.2})`,
                    textShadow: isResolved && done ? '0 0 8px rgba(0,255,180,0.4)' : 'none',
                    transition: 'color 0.05s, text-shadow 0.3s',
                    letterSpacing: '0.1em',
                  }}
                >
                  {ch}
                </motion.span>
              )
            })}
          </div>
        ))}
      </div>

      {/* Progress bar while revealing */}
      {!done && (
        <div className="mt-4 h-px w-full rounded-full overflow-hidden" style={{ background: 'rgba(0,255,180,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #00ffb4)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: (hash.length * 4) / 60, ease: 'linear' }}
          />
        </div>
      )}

      {/* Blockchain log line */}
      {done && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(0,255,180,0.06)' }}
        >
          <span className="font-mono-cus text-[9px] tracking-widest" style={{ color: 'rgba(0,255,180,0.35)' }}>
            BLOCK PENDING CHAIN CONFIRMATION…
          </span>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#00ffb4' }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
