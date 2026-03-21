import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STATS = [
  { label: 'CASES SEALED',  value: 2847, suffix: '' },
  { label: 'HASH VERIFIED', value: 100,  suffix: '%' },
  { label: 'TAMPER ALERTS', value: 8,    suffix: '',  accent: 'red' },
  { label: 'BLOCKCHAIN TXS',value: 9412, suffix: '' },
]

function useCountUp(target, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.floor(ease * target))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(target)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return val
}

function StatCell({ stat, index }) {
  const val = useCountUp(stat.value, 1200, 400 + index * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1,  y:  0 }}
      transition={{ delay: 0.2 + index * 0.07, duration: 0.5, ease: [0.16,1,0.3,1] }}
      className="flex flex-col justify-center px-6 py-5"
      style={{ borderRight: index < STATS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
    >
      <p
        className="font-mono-cus text-2xl font-bold leading-none mb-1"
        style={{ color: stat.accent === 'red' ? '#ff4d4d' : '#00ffb4' }}
      >
        {val.toLocaleString()}{stat.suffix}
      </p>
      <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {stat.label}
      </p>
    </motion.div>
  )
}

export default function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="grid mb-8 rounded-xl overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${STATS.length}, 1fr)`,
        background: 'rgba(8,13,24,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {STATS.map((s, i) => <StatCell key={s.label} stat={s} index={i} />)}
    </motion.div>
  )
}
