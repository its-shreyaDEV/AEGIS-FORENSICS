import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Layers, AlertTriangle, CheckCircle2,
  Clock, MapPin, Crosshair, FileSearch,
} from 'lucide-react'
import CrimeSceneMap from '../components/CrimeSceneMap'
import { TIMELINE }  from '../utils/data'
import { useEvidenceStore } from '../hooks/useEvidenceStore'

// ── Confidence bar row ─────────────────────────────────────
function ConfBar({ label, pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="font-mono-cus text-[10px] tracking-wide shrink-0"
        style={{ width: 136, color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5 + delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span
        className="font-mono-cus text-[11px] w-8 text-right shrink-0"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  )
}

// ── Wound diagram – SVG illustration ──────────────────────
function WoundDiagram() {
  const [hovered, setHovered] = useState(null)

  const features = [
    { id: 'entry',     x: 200, y: 120, r: 12, color: '#ff4d4d',  label: 'Entry wound',       detail: '18mm diameter · clean edge · downward 42° angle' },
    { id: 'serration', x: 248, y: 135, r: 8,  color: '#f59e0b',  label: 'Serration marks',   detail: '3–4mm interval · 7 visible marks · right-to-left drag' },
    { id: 'tissue',    x: 160, y: 145, r: 10, color: '#a855f7',  label: 'Tissue displacement',detail: 'Radial tearing consistent with curved blade entry' },
  ]

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(4,8,15,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <svg viewBox="0 0 400 260" className="w-full" style={{ display: 'block' }}>
        {/* Background grid */}
        <defs>
          <pattern id="wgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,255,180,0.04)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="skinGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(139,90,60,0.15)" />
            <stop offset="100%" stopColor="rgba(80,40,20,0.05)" />
          </radialGradient>
        </defs>
        <rect width="400" height="260" fill="url(#wgrid)" />

        {/* Skin surface representation */}
        <ellipse cx="200" cy="140" rx="130" ry="75"
          fill="url(#skinGrad)" stroke="rgba(139,90,60,0.15)" strokeWidth="1" />

        {/* Wound body */}
        <ellipse cx="200" cy="130" rx="14" ry="8"
          fill="rgba(180,30,30,0.35)" stroke="#ff4d4d" strokeWidth="1" />

        {/* Serration marks */}
        {[0,1,2,3,4,5,6].map(i => (
          <line key={i}
            x1={235 + i * 4} y1={128 + i * 1.5}
            x2={238 + i * 4} y2={143 + i * 1.5}
            stroke="#f59e0b" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"
          />
        ))}

        {/* Tissue displacement lines */}
        {[-20,-10,10,20].map((dx, i) => (
          <motion.line key={i}
            x1={175 + dx} y1={135}
            x2={162 + dx * 0.5} y2={148}
            stroke="#a855f7" strokeWidth="0.7" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
          />
        ))}

        {/* Measurement lines */}
        <line x1="186" y1="155" x2="214" y2="155" stroke="rgba(0,255,180,0.25)" strokeWidth="0.5" />
        <text x="200" y="164" textAnchor="middle" fontSize="7" fontFamily="Space Mono" fill="rgba(0,255,180,0.4)">28mm</text>

        {/* Callout dots */}
        {features.map(f => (
          <g key={f.id}
            onMouseEnter={() => setHovered(f.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <motion.circle
              cx={f.x} cy={f.y} r={f.r}
              fill={`${f.color}20`} stroke={f.color} strokeWidth={hovered === f.id ? 2 : 1}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: features.indexOf(f) * 0.4 }}
            />
            <motion.circle
              cx={f.x} cy={f.y}
              r={hovered === f.id ? f.r + 6 : 0}
              fill="none" stroke={f.color} strokeWidth="0.5"
              animate={{ opacity: hovered === f.id ? [0.5, 0] : 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </g>
        ))}

        {/* Angle indicator */}
        <line x1="200" y1="70" x2="220" y2="130" stroke="rgba(0,255,180,0.2)" strokeWidth="0.8" strokeDasharray="3 2" />
        <text x="226" y="100" fontSize="8" fontFamily="Space Mono" fill="rgba(0,255,180,0.4)">42°</text>

        {/* Labels */}
        <text x="200" y="24" textAnchor="middle" fontSize="9" fontFamily="Space Mono" letterSpacing="2" fill="rgba(0,255,180,0.35)">
          MORPHOLOGICAL WOUND ANALYSIS
        </text>
        <text x="200" y="245" textAnchor="middle" fontSize="7.5" fontFamily="Space Mono" fill="rgba(255,255,255,0.2)">
          CNN segmentation · case EVD-0042
        </text>
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (() => {
          const f = features.find(x => x.id === hovered)
          return (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-3 right-3 rounded-lg p-3"
              style={{ background: 'rgba(4,8,15,0.92)', border: `1px solid ${f.color}30` }}
            >
              <p className="font-display font-bold text-xs mb-0.5" style={{ color: f.color }}>{f.label}</p>
              <p className="font-mono-cus text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.detail}</p>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

// ── Timeline item ──────────────────────────────────────────
const TL_COLORS = { crime: '#ff4d4d', move: '#f59e0b', suspect: '#a855f7', seal: '#00ffb4' }

function TimelineItem({ item, index }) {
  const color = TL_COLORS[item.type]
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4"
    >
      {/* Left spine */}
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 z-10"
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        />
        {index < TIMELINE.length - 1 && (
          <div className="flex-1 w-px mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1">
        <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: `${color}90` }}>
          {item.time}
        </p>
        <p className="font-display font-bold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {item.event}
        </p>
        <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {item.detail}
        </p>
      </div>
    </motion.div>
  )
}

// ── Section card wrapper ───────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)', ...style }}
    >
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, iconColor = '#00ffb4', label, sub }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${iconColor}12`, border: `1px solid ${iconColor}25` }}
      >
        <Icon size={13} style={{ color: iconColor }} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: `${iconColor}70` }}>{label}</p>
        {sub && <p className="font-display text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function AnalysisPage() {
  const { log } = useEvidenceStore()
  const featured = log.find(r => r.id === 'EVD-0042') || log[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <div>
        <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>
          PHASE 03 · FORENSIC INTELLIGENCE
        </p>
        <h2 className="font-display font-extrabold text-3xl mb-3" style={{ letterSpacing: '-1px' }}>
          AI <span style={{ color: '#ff4d4d' }}>Analysis</span>
        </h2>
        <p className="font-display text-sm max-w-xl" style={{ color: 'rgba(255,255,255,0.35)' }}>
          CNN wound-weapon matching · semantic scene segmentation · reconstructed crime timeline
        </p>
      </div>

      {/* Case selector strip */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(8,13,24,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <FileSearch size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
        <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.4)' }}>ACTIVE CASE</p>
        <span
          className="font-mono-cus text-[11px] px-2 py-0.5 rounded"
          style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.2)', color: '#00ffb4' }}
        >
          {featured?.id}
        </span>
        <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {featured?.officer} · {featured?.gps?.label}
        </span>
      </div>

      {/* Row 1: wound diagram + weapon CNN + env context */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* Wound diagram */}
        <Card>
          <CardHeader icon={Crosshair} iconColor="#ff4d4d" label="MORPHOLOGICAL WOUND ANALYSIS" sub="Hover callouts to inspect" />
          <WoundDiagram />
        </Card>

        {/* CNN confidence + conclusion */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader icon={Cpu} iconColor="#00ffb4" label="CNN · WEAPON CLASS PREDICTION" sub="Trained on forensic pathology dataset" />
            <div className="flex flex-col gap-3.5">
              <ConfBar label="Serrated blade"    pct={87} color="#00ffb4" delay={0}    />
              <ConfBar label="Smooth blade"      pct={8}  color="#ff4d4d" delay={0.07} />
              <ConfBar label="Blunt instrument"  pct={3}  color="#a855f7" delay={0.14} />
              <ConfBar label="Projectile (9mm)"  pct={2}  color="#a855f7" delay={0.21} />
            </div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
              className="mt-4 p-3 rounded-lg"
              style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.1)' }}
            >
              <p className="font-mono-cus text-[9px] tracking-[1.5px] mb-1.5" style={{ color: 'rgba(0,255,180,0.35)' }}>
                AI CONCLUSION
              </p>
              <p className="font-display text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                High confidence: <span className="font-bold" style={{ color: '#00ffb4' }}>serrated blade (87%)</span>.
                Wound geometry shows 3–4mm serration interval, 7 visible marks,
                right-handed downward thrust at 42°.
              </p>
            </motion.div>
          </Card>

          {/* Environmental context */}
          <Card>
            <CardHeader icon={Layers} iconColor="#a855f7" label="SEMANTIC SEGMENTATION" sub="Background environmental analysis" />
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                ['SOIL TYPE',     'Laterite + Forest', '#00ffb4'],
                ['BODY SURFACE',  'Asphalt (road)',    '#ff4d4d'],
                ['BLOOD PATTERN', 'Cast-off',          '#00ffb4'],
                ['BODY MOVED',    'YES · ~200m ⚠',    '#f59e0b'],
              ].map(([k, v, c]) => (
                <div
                  key={k}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="font-mono-cus text-[8px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{k}</p>
                  <p className="font-display font-semibold text-xs" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
            <div
              className="flex items-start gap-2 mt-3 p-3 rounded-lg"
              style={{ background: 'rgba(255,77,77,0.04)', border: '1px solid rgba(255,77,77,0.15)' }}
            >
              <AlertTriangle size={11} style={{ color: '#ff4d4d', flexShrink: 0, marginTop: 2 }} />
              <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Forest soil on victim's clothing mismatches asphalt scene.{' '}
                <span style={{ color: '#ff4d4d', fontWeight: 700 }}>Body moved post-mortem</span>{' '}
                from forested area ~200m east (GPS 20.2944°N, 85.8198°E).
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Crime scene map — full width */}
      <div>
        <p className="font-mono-cus text-[10px] tracking-[3px] mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          CRIME SCENE SPATIAL RECONSTRUCTION
        </p>
        <CrimeSceneMap />
      </div>

      {/* Row 3: Timeline + case summary */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* Timeline */}
        <Card>
          <CardHeader icon={Clock} iconColor="#00ffb4" label="RECONSTRUCTED CRIME TIMELINE" sub="GPS · wound analysis · environmental markers" />
          <div className="mt-1">
            {TIMELINE.map((item, i) => (
              <TimelineItem key={item.time} item={item} index={i} />
            ))}
          </div>
        </Card>

        {/* Case summary panel */}
        <div className="flex flex-col gap-4">
          <Card>
            <p className="font-mono-cus text-[10px] tracking-[2px] mb-4" style={{ color: 'rgba(0,255,180,0.35)' }}>
              CASE SUMMARY
            </p>
            <div className="flex flex-col gap-3">
              {[
                ['CASE ID',        featured?.id,                          '#00ffb4'],
                ['WEAPON CLASS',   'Serrated blade',                      '#00ffb4'],
                ['CONFIDENCE',     '87%',                                 '#00ffb4'],
                ['BODY MOVED',     'YES · ~200m',                         '#f59e0b'],
                ['PRIMARY SCENE',  '20.2944°N, 85.8198°E',              'rgba(255,255,255,0.45)'],
                ['DISCOVERY SITE', featured?.gps?.label,                 'rgba(255,255,255,0.45)'],
                ['CUSTODY CHAIN',  'INTACT ✓',                           '#00ffb4'],
              ].map(([k, v, c]) => (
                <div
                  key={k}
                  className="flex justify-between items-start pb-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-mono-cus text-[9px] tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{k}</span>
                  <span className="font-mono-cus text-[10px] text-right ml-2" style={{ color: c }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chain of custody badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.15)' }}
          >
            <CheckCircle2 size={15} style={{ color: '#00ffb4', flexShrink: 0 }} />
            <div>
              <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: '#00ffb4' }}>
                CHAIN OF CUSTODY · INTACT
              </p>
              <p className="font-mono-cus text-[8px] tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                HASH SEALED · IPFS LINKED · COURT ADMISSIBLE
              </p>
            </div>
          </motion.div>

          {/* Legend */}
          <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'rgba(8,13,24,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>TIMELINE LEGEND</p>
            {[
              ['✕', '#ff4d4d', 'Crime / assault'],
              ['→', '#f59e0b', 'Body movement'],
              ['◈', '#a855f7', 'Suspect activity'],
              ['◎', '#00ffb4', 'Evidence sealing'],
            ].map(([icon, color, label]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-mono-cus text-[10px]" style={{ color, width: 14 }}>{icon}</span>
                <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
