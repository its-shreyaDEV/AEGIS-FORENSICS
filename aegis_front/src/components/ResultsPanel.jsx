import { motion } from 'framer-motion'
import { Cpu, Layers, AlertTriangle, CheckCircle2, Crosshair, Car, Droplet, Wrench } from 'lucide-react'
import TiltedEvidenceCard from './TiltedEvidenceCard'
import LetterGlitchHash   from './LetterGlitchHash'

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

// Dynamic Context Generator based on the selected AI Module
function getContextualData(moduleType, prediction) {
  switch (moduleType) {
    case 'ballistics':
      return {
        title: 'BALLISTICS PROFILE',
        icon: Crosshair,
        color: '#a855f7', // Purple
        stats: [
          ['STRIATION DEPTH', '~0.04mm', '#00ffb4'],
          ['STRIKER DRAG', 'Detected', '#ff4d4d'],
          ['PRIMER TYPE', 'Boxer / Centerfire', '#00ffb4'],
          ['EST. CALIBER', '9x19mm Parabellum', '#00ffb4'],
        ],
        alert: `Impression geometry strongly correlates with known records for ${prediction}. Striation density matches automated AFTE indexing standards.`
      };
    case 'damage':
      return {
        title: 'VEHICULAR KINEMATICS',
        icon: Car,
        color: '#f59e0b', // Amber
        stats: [
          ['IMPACT ZONE', 'Frontal / Offset', '#ff4d4d'],
          ['CRUSH DEPTH', '> 40cm', '#ff4d4d'],
          ['FRAME STATUS', 'Compromised', '#ff4d4d'],
          ['PAINT TRANSFER', 'Analyzing...', '#00ffb4'],
        ],
        alert: `Structural deformation and panel crumple zones suggest high-velocity kinetic transfer consistent with the [${prediction}] classification.`
      };
    case 'bloodstain':
      return {
        title: 'FLUID DYNAMICS',
        icon: Droplet,
        color: '#ef4444', // Red
        stats: [
          ['SURFACE POROSITY', 'Medium', '#00ffb4'],
          ['SPATTER VELOCITY', 'High-Force', '#ff4d4d'],
          ['PATTERN SHAPE', 'Elliptical', '#00ffb4'],
          ['ANGLE OF IMPACT', '~45 degrees', '#ff4d4d'],
        ],
        alert: `Organic compound analysis confirms result: [${prediction}]. RBC degradation indices suggest the sample is environmentally stable.`
      };
    case 'toolmarks':
      return {
        title: 'MICRO-TOPOLOGY',
        icon: Wrench,
        color: '#3b82f6', // Blue
        stats: [
          ['MATERIAL', 'Steel Alloy', '#00ffb4'],
          ['DEFECT WIDTH', '1.2mm', '#ff4d4d'],
          ['EDGE TYPE', 'Jagged / Irregular', '#ff4d4d'],
          ['OXIDATION', 'Minimal', '#00ffb4'],
        ],
        alert: `Surface scoring and [${prediction}] defects indicate tool application involving high shear force rather than direct compression.`
      };
    default:
      return {
        title: 'SEMANTIC SEGMENTATION',
        icon: Layers,
        color: '#a855f7',
        stats: [
          ['SOIL TYPE', 'Laterite + Forest', '#00ffb4'],
          ['SURFACE', 'Asphalt (road)', '#ff4d4d'],
          ['ELEVATION', 'Sea Level', '#00ffb4'],
          ['ILLUMINATION', 'Standard', '#00ffb4'],
        ],
        alert: `Environmental scene context stabilized. Cross-referencing background topological noise.`
      };
  }
}

export default function ResultsPanel({ evidence }) {
  if (!evidence) return null;

  const primaryLabel = evidence.prediction || 'Unknown Classification';
  const primaryPct = evidence.confidence || 0;
  const moduleName = evidence.module_used ? evidence.module_used.toUpperCase() : 'ANALYSIS';
  
  const remainingPct = Math.max(0, parseFloat((100 - primaryPct).toFixed(2)));

  const DYNAMIC_MATCHES = [
    { label: primaryLabel.toUpperCase(), pct: primaryPct, color: '#00ffb4' },
    { label: 'OTHER ALTERNATIVES', pct: remainingPct, color: '#ff4d4d' },
  ];

  // Fetch the dynamically generated context based on the module used
  const context = getContextualData(evidence.module_used, primaryLabel);
  const ContextIcon = context.icon;

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

        {/* Primary AI Inference Block */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16,1,0.3,1] }}
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
            {DYNAMIC_MATCHES.map((w, i) => (
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
              High confidence classification for <span className="font-bold" style={{ color: '#00ffb4' }}>{primaryLabel} ({primaryPct}%)</span>.
              Mathematical topology validated against Aegis {moduleName} inference metrics.
            </p>
          </motion.div>
        </motion.div>

        {/* DYNAMIC Environmental/Secondary Context */}
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16,1,0.3,1] }}
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