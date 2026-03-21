import { motion } from 'framer-motion'
import { Camera, Link, Brain, ChevronRight } from 'lucide-react'

const PHASES = [
  {
    num: '01',
    label: 'Smart Capture',
    color: '#00ffb4',
    colorDim: 'rgba(0,255,180,0.1)',
    colorBorder: 'rgba(0,255,180,0.2)',
    Icon: Camera,
    items: ['GPS + timestamp', 'Privacy masking', 'SHA-256 hash', 'Face detection'],
  },
  {
    num: '02',
    label: 'Blockchain Lock',
    color: '#a855f7',
    colorDim: 'rgba(168,85,247,0.1)',
    colorBorder: 'rgba(168,85,247,0.2)',
    Icon: Link,
    items: ['Smart contract', 'IPFS storage', 'Tamper detection', 'Chain of custody'],
  },
  {
    num: '03',
    label: 'Forensic Intel',
    color: '#ff4d4d',
    colorDim: 'rgba(255,77,77,0.1)',
    colorBorder: 'rgba(255,77,77,0.2)',
    Icon: Brain,
    items: ['CNN wound match', 'Weapon class', 'Semantic segmentation', 'Timeline rebuild'],
  },
]

export default function PhaseTimeline({ activePhase = null }) {
  return (
    <div className="relative flex items-stretch gap-0">
      {PHASES.map((phase, i) => (
        <div key={phase.num} className="flex items-stretch flex-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-xl p-5 relative overflow-hidden"
            style={{
              background: activePhase === i + 1 ? phase.colorDim : 'rgba(8,13,24,0.7)',
              border: `1px solid ${activePhase === i + 1 ? phase.colorBorder : 'rgba(255,255,255,0.06)'}`,
              transition: 'background 0.3s, border-color 0.3s',
            }}
          >
            {/* Glow blob */}
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${phase.colorDim} 0%, transparent 70%)`, filter: 'blur(12px)' }}
            />

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: phase.colorDim, border: `1px solid ${phase.colorBorder}` }}
              >
                <phase.Icon size={15} style={{ color: phase.color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: `${phase.color}80` }}>
                  PHASE {phase.num}
                </p>
                <p className="font-display font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {phase.label}
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-2">
              {phase.items.map((item, j) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 + j * 0.04 }}
                  className="flex items-center gap-2 font-mono-cus text-[10px] tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: phase.color, opacity: 0.6 }} />
                  {item}
                </motion.li>
              ))}
            </ul>

            {/* Active indicator */}
            {activePhase === i + 1 && (
              <motion.div
                layoutId="activePhase"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                style={{ background: `linear-gradient(90deg, transparent, ${phase.color}, transparent)` }}
              />
            )}
          </motion.div>

          {/* Arrow connector */}
          {i < PHASES.length - 1 && (
            <div className="flex items-center px-2">
              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
