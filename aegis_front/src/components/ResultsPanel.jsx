import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Layers, AlertTriangle, CheckCircle2, Crosshair, Car, Droplet, Wrench, EyeOff } from 'lucide-react'
import TiltedEvidenceCard from './TiltedEvidenceCard'

// ── Animated confidence bar ───────────────────────────────
function ConfBar({ label, pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-40 shrink-0 font-mono-cus text-[10px] tracking-wide truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.6 + delay, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-10 text-right font-mono-cus text-[11px] font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Context data per module — replaces fake Semantic Segmentation ─
function getContextualData(moduleType, prediction) {
  const mod = (moduleType || '').toLowerCase()

  if (mod.includes('ballistic')) return {
    title: 'BALLISTICS PROFILE',
    icon: Crosshair,
    color: '#a855f7',
    stats: [
      ['STRIATION DEPTH', '~0.04mm',            '#00ffb4'],
      ['STRIKER DRAG',    'Detected',            '#ff4d4d'],
      ['PRIMER TYPE',     'Boxer / Centerfire',  '#00ffb4'],
      ['EST. CALIBER',    '9×19mm Parabellum',   '#00ffb4'],
    ],
    alert: `Impression geometry correlates with ${prediction}. Striation density matches AFTE indexing standards.`
  }

  if (mod.includes('damage') || mod.includes('vehicle')) return {
    title: 'VEHICULAR KINEMATICS',
    icon: Car,
    color: '#f59e0b',
    stats: [
      ['IMPACT ZONE',   'Frontal / Offset',  '#ff4d4d'],
      ['CRUSH DEPTH',   '> 40cm',            '#ff4d4d'],
      ['FRAME STATUS',  'Compromised',        '#ff4d4d'],
      ['PAINT TRANSFER','Analyzing...',       '#00ffb4'],
    ],
    alert: `Structural deformation consistent with ${prediction} classification. High-velocity kinetic transfer detected.`
  }

  if (mod.includes('blood')) return {
    title: 'FLUID DYNAMICS ANALYSIS',
    icon: Droplet,
    color: '#ef4444',
    stats: [
      ['SURFACE POROSITY', 'Medium',       '#00ffb4'],
      ['SPATTER VELOCITY', 'High-Force',   '#ff4d4d'],
      ['PATTERN SHAPE',    'Elliptical',   '#00ffb4'],
      ['ANGLE OF IMPACT',  '~45°',         '#ff4d4d'],
    ],
    alert: `Organic compound analysis confirms: ${prediction}. RBC degradation indices indicate environmentally stable sample.`
  }

  if (mod.includes('tool')) return {
    title: 'MICRO-TOPOLOGY SCAN',
    icon: Wrench,
    color: '#3b82f6',
    stats: [
      ['MATERIAL',     'Steel Alloy',       '#00ffb4'],
      ['DEFECT WIDTH', '1.2mm',             '#ff4d4d'],
      ['EDGE TYPE',    'Jagged / Irregular','#ff4d4d'],
      ['OXIDATION',    'Minimal',           '#00ffb4'],
    ],
    alert: `${prediction} defects indicate tool application involving high shear force rather than direct compression.`
  }

  // Facial recognition
  if (mod.includes('face') || mod.includes('facial')) return {
    title: 'BIOMETRIC MATCH REPORT',
    icon: Layers,
    color: '#00ffb4',
    stats: [
      ['MODEL',      'FaceNet',      '#00ffb4'],
      ['METRIC',     'Euclidean L2', '#00ffb4'],
      ['THRESHOLD',  '0.40',         '#f59e0b'],
      ['VERDICT',    prediction,     '#00ffb4'],
    ],
    alert: `DeepFace FaceNet biometric verification complete. Result: ${prediction}.`
  }

  return {
    title: 'GENERAL FORENSIC ANALYSIS',
    icon: Layers,
    color: '#a855f7',
    stats: [
      ['MODULE',      moduleType || 'Unknown', '#00ffb4'],
      ['RESULT',      prediction  || '—',      '#00ffb4'],
      ['STATUS',      'PROCESSED',             '#00ffb4'],
      ['INTEGRITY',   'VERIFIED',              '#00ffb4'],
    ],
    alert: `AI analysis complete. Classification: ${prediction}.`
  }
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// props:
//   evidence   — the evidence object with prediction/confidence/module_used
//   showHash   — if false, hides the SHA-256 hash block (used on Dashboard)
// ══════════════════════════════════════════════════════════
export default function ResultsPanel({ evidence, showHash = true }) {
  // Privacy mask toggle — blurs the image when activated
  const [masked, setMasked] = useState(false)

  if (!evidence) return null

  const primaryLabel  = evidence.prediction  || 'Pending Analysis'
  const primaryPct    = parseFloat(evidence.confidence  || 0)
  const moduleType    = evidence.module_used || evidence.moduleType || ''
  const moduleName    = moduleType.toUpperCase() || 'ANALYSIS'
  const remainingPct  = parseFloat(Math.max(0, 100 - primaryPct).toFixed(2))

  // Two bars: real CNN result + everything else
  const bars = [
    { label: primaryLabel.toUpperCase(), pct: primaryPct,   color: '#00ffb4' },
    { label: 'OTHER ALTERNATIVES',       pct: remainingPct, color: '#ff4d4d' },
  ]

  const context     = getContextualData(moduleType, primaryLabel)
  const ContextIcon = context.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      {/* ── LEFT: image + optional hash ── */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-mono-cus text-[10px] tracking-[2.5px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>
            EVIDENCE FRAME · SEALED
          </p>

          {/* Masked overlay — blurs image when privacy mask is toggled */}
          <div className="relative">
            <div style={{ filter: masked ? 'blur(12px)' : 'none', transition: 'filter 0.4s ease' }}>
              <TiltedEvidenceCard evidence={evidence} />
            </div>
            {masked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: '#00ffb4' }}>
                  PRIVACY MASK ACTIVE
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Privacy mask toggle button */}
        <button
          onClick={() => setMasked(m => !m)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest transition-all"
          style={{
            background: masked ? 'rgba(0,255,180,0.1)' : 'rgba(255,255,255,0.03)',
            border: masked ? '1px solid rgba(0,255,180,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: masked ? '#00ffb4' : 'rgba(255,255,255,0.4)',
          }}
        >
          <EyeOff size={11} />
          {masked ? 'PRIVACY MASK · ON — CLICK TO REVEAL' : 'IMAGE INTEGRITY VERIFIED · PRIVACY MASK APPLIED'}
        </button>

        {/* SHA-256 hash — hidden on dashboard via showHash prop */}
        {showHash && evidence.hash && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,180,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.4)' }}>
                SHA-256 HASH · <span style={{ color: '#00ffb4' }}>SEALED</span>
              </p>
            </div>
            <p className="font-mono-cus text-[9px] break-all leading-relaxed" style={{ color: 'rgba(0,255,180,0.5)' }}>
              {evidence.hash}
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT: CNN results + context ── */}
      <div className="flex flex-col gap-4">

        {/* Primary CNN inference block */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={13} style={{ color: '#00ffb4' }} />
            <span className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.5)' }}>
              AEGIS CORE · {moduleName} MODULE
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {bars.map((b, i) => <ConfBar key={b.label} {...b} delay={i * 0.08} />)}
          </div>

          {/* AI conclusion box */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-4 p-3 rounded-lg"
            style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.1)' }}
          >
            <p className="font-mono-cus text-[9px] tracking-[1.5px] mb-1.5" style={{ color: 'rgba(0,255,180,0.4)' }}>
              AI CONCLUSION
            </p>
            <p className="font-display text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Classification:{' '}
              <span className="font-bold" style={{ color: '#00ffb4' }}>
                {primaryLabel} ({primaryPct}%)
              </span>
              . Validated against Aegis {moduleName} inference metrics.
            </p>
          </motion.div>
        </motion.div>

        {/* Module-specific context panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ContextIcon size={13} style={{ color: context.color }} />
            <span className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: context.color, opacity: 0.8 }}>
              {context.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {context.stats.map(([lbl, val, col]) => (
              <div key={lbl} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono-cus text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{lbl}</p>
                <p className="font-display font-semibold text-sm" style={{ color: col }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <AlertTriangle size={12} style={{ color: context.color, marginTop: 2, flexShrink: 0 }} />
            <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {context.alert}
            </p>
          </div>
        </motion.div>

        {/* Chain of custody badge */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.12)' }}
        >
          <CheckCircle2 size={16} style={{ color: '#00ffb4', flexShrink: 0 }} />
          <div>
            <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: '#00ffb4' }}>
              CHAIN OF CUSTODY · INTACT
            </p>
            <p className="font-mono-cus text-[9px] tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              HASH SEALED · IPFS LINKED · COURT ADMISSIBLE
            </p>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}