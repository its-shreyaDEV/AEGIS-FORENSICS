import { motion } from 'framer-motion'
import { Cpu, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react'
import TiltedEvidenceCard from './TiltedEvidenceCard'
import LetterGlitchHash   from './LetterGlitchHash'

const WEAPON_MATCHES = [
  { label: 'Serrated blade',   pct: 87, color: '#00ffb4' },
  { label: 'Smooth blade',     pct:  8, color: '#ff4d4d' },
  { label: 'Blunt instrument', pct:  3, color: '#a855f7' },
  { label: 'Projectile (9mm)', pct:  2, color: '#a855f7' },
]

function ConfBar({ label, pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-32 shrink-0 font-mono-cus text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.6 + delay, duration: 0.9, ease: [0.16,1,0.3,1] }}
        />
      </div>
      <span className="w-8 text-right font-mono-cus text-[10px]" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

export default function ResultsPanel({ evidence }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      {/* LEFT — image + hash */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-mono-cus text-[10px] tracking-[2.5px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>
            EVIDENCE FRAME · SEALED
          </p>
          <TiltedEvidenceCard evidence={evidence} />
        </div>
        <LetterGlitchHash hash={evidence.hash} />
      </div>

      {/* RIGHT — AI analysis */}
      <div className="flex flex-col gap-4">

        {/* Weapon match */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={13} style={{ color: '#00ffb4' }} />
            <span className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.5)' }}>
              CNN · WOUND ANALYSIS
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {WEAPON_MATCHES.map((w, i) => (
              <ConfBar key={w.label} {...w} delay={i * 0.08} />
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-4 p-3 rounded-lg"
            style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.1)' }}
          >
            <p className="font-mono-cus text-[9px] tracking-[1.5px] mb-1" style={{ color: 'rgba(0,255,180,0.4)' }}>
              AI CONCLUSION
            </p>
            <p className="font-display text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              High confidence: <span className="font-bold" style={{ color: '#00ffb4' }}>serrated blade (87%)</span>.
              Wound edge geometry consistent with 3–4mm serration interval. Entry angle suggests right-handed assailant.
            </p>
          </motion.div>
        </motion.div>

        {/* Environmental context */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers size={13} style={{ color: '#a855f7' }} />
            <span className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(168,85,247,0.6)' }}>
              SEMANTIC SEGMENTATION
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              ['SOIL TYPE',    'Laterite + Forest', '#00ffb4'],
              ['SURFACE',      'Asphalt (road)',    '#ff4d4d'],
              ['BLOOD PATTERN','Cast-off',          '#00ffb4'],
              ['BODY MOVED',   'YES · ~200m',       '#ff4d4d'],
            ].map(([lbl, val, col]) => (
              <div key={lbl} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono-cus text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{lbl}</p>
                <p className="font-display font-semibold text-sm" style={{ color: col }}>{val}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg"
            style={{ background: 'rgba(255,77,77,0.04)', border: '1px solid rgba(255,77,77,0.15)' }}>
            <AlertTriangle size={12} style={{ color: '#ff4d4d', marginTop: 2, flexShrink: 0 }} />
            <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Forest soil on victim's clothing mismatches asphalt scene.{' '}
              <span style={{ color: '#ff4d4d', fontWeight: 700 }}>Body moved post-mortem</span>
              {' '}from forested area ~200m east.
            </p>
          </div>
        </motion.div>

        {/* Chain of custody status */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.12)' }}
        >
          <CheckCircle2 size={16} style={{ color: '#00ffb4', flexShrink: 0 }} />
          <div>
            <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: '#00ffb4' }}>
              CHAIN OF CUSTODY · INTACT
            </p>
            <p className="font-mono-cus text-[9px] tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              HASH SEALED ON BLOCKCHAIN · IPFS RECORD LINKED · COURT ADMISSIBLE
            </p>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
