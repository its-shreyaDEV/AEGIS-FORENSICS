import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Hash, Cloud, Cpu, Box, Shield, Check } from 'lucide-react'
import { BLOCKCHAIN_STEPS } from '../utils/data'

const ICONS = { camera: Camera, hash: Hash, cloud: Cloud, cpu: Cpu, box: Box, shield: Shield }

const STEP_DELAY = 900  // ms between each step auto-advancing

export default function BlockchainVisualizer({ autoPlay = true, hash = null }) {
  const [activeStep, setActiveStep] = useState(-1)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (!autoPlay) return
    setActiveStep(-1)
    setDone(false)
    let step = 0
    const tick = () => {
      setActiveStep(step)
      step++
      if (step < BLOCKCHAIN_STEPS.length) {
        setTimeout(tick, STEP_DELAY)
      } else {
        setTimeout(() => setDone(true), 400)
      }
    }
    const t = setTimeout(tick, 600)
    return () => clearTimeout(t)
  }, [autoPlay, hash])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(4,8,15,0.9)', border: '1px solid rgba(0,255,180,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono-cus text-[10px] tracking-[2.5px]" style={{ color: 'rgba(0,255,180,0.45)' }}>
          BLOCKCHAIN TRANSACTION FLOW
        </span>
        <AnimatePresence>
          {done && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded font-mono-cus text-[9px] tracking-widest"
              style={{ background: 'rgba(0,255,180,0.1)', color: '#00ffb4', border: '1px solid rgba(0,255,180,0.2)' }}
            >
              <Check size={9} /> IMMUTABLE
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Steps — horizontal scroll on mobile, full row on desktop */}
      <div className="p-5">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {BLOCKCHAIN_STEPS.map((step, i) => {
            const Icon = ICONS[step.icon]
            const isActive   = activeStep >= i
            const isCurrent  = activeStep === i
            const isLast     = i === BLOCKCHAIN_STEPS.length - 1

            return (
              <div key={step.id} className="flex items-center shrink-0">
                {/* Node */}
                <motion.div
                  animate={{
                    scale:  isCurrent ? [1, 1.08, 1] : 1,
                    opacity: isActive ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-2"
                  style={{ minWidth: 80 }}
                >
                  {/* Circle */}
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isActive ? 'rgba(0,255,180,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? 'rgba(0,255,180,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isCurrent ? '0 0 20px rgba(0,255,180,0.2)' : 'none',
                      transition: 'all 0.35s',
                    }}
                  >
                    <Icon size={15} style={{ color: isActive ? '#00ffb4' : 'rgba(255,255,255,0.2)', transition: 'color 0.35s' }} strokeWidth={1.5} />

                    {/* Pulse ring for current */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ border: '1px solid rgba(0,255,180,0.5)' }}
                      />
                    )}
                    {/* Check for completed */}
                    {isActive && !isCurrent && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: '#00ffb4' }}
                      >
                        <Check size={8} style={{ color: '#04080f' }} strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p
                      className="font-display font-semibold text-[10px] leading-tight mb-0.5"
                      style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', transition: 'color 0.35s' }}
                    >
                      {step.label}
                    </p>
                    <p
                      className="font-mono-cus text-[8px] tracking-wide leading-tight max-w-[76px] truncate"
                      style={{ color: isActive ? 'rgba(0,255,180,0.5)' : 'rgba(255,255,255,0.15)', transition: 'color 0.35s' }}
                    >
                      {step.sub}
                    </p>
                  </div>
                </motion.div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 mx-1 mb-8" style={{ minWidth: 20 }}>
                    <div
                      className="h-px rounded-full relative overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)', minWidth: 20 }}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        animate={{ width: activeStep > i ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        style={{ background: 'linear-gradient(90deg, #00ffb4, rgba(0,255,180,0.3))' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Hash display at bottom */}
        <AnimatePresence>
          {activeStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg font-mono-cus text-[10px] break-all leading-relaxed"
              style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.08)', color: 'rgba(0,255,180,0.4)' }}
            >
              <span style={{ color: 'rgba(0,255,180,0.25)' }}>SHA-256 · </span>
              {hash || 'a3f9c2e1d847b650f2318a94cc71e302b8456d91e0f3a7285c6b4d019e8f3a21'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
