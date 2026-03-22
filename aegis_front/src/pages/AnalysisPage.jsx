import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Cpu, Layers, AlertTriangle, CheckCircle2, Clock, MapPin,
  Crosshair, FileSearch, Shield, Network, ChevronDown,
  ChevronUp, Lock, Eye, RefreshCw, Fingerprint, ScanFace,
  Image as ImageIcon
} from 'lucide-react'
import CrimeSceneMap      from '../components/CrimeSceneMap'
import LetterGlitchHash   from '../components/LetterGlitchHash'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import { useEvidenceStore } from '../hooks/useEvidenceStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function resolveImageUrl(record) {
  const raw = record?.file_path || record?.image_url || record?.url || null
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `${API_BASE}/${raw.replace(/^\/+/, '')}`
}

// ── Confidence bar ────────────────────────────────────────
function ConfBar({ label, pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono-cus text-[10px] tracking-wide shrink-0 truncate" style={{ width: 160, color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4 + delay, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="font-mono-cus text-[11px] w-9 text-right shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ── Scene SVG per module ──────────────────────────────────
function DynamicSceneReconstruction({ moduleName }) {
  const [hovered, setHovered] = useState(null)
  const mod = (moduleName || '').toLowerCase()

  let features = []
  let svgBody  = null
  let title    = 'SCENE TOPOLOGY RECONSTRUCTION'

  if (mod.includes('vehicle') || mod.includes('damage')) {
    title = 'VEHICULAR KINEMATICS MATRIX'
    features = [
      { id: 'impact', x: 290, y: 130, r: 18, color: '#ff4d4d', label: 'Primary Impact Zone',   detail: 'High-velocity crush damage detected' },
      { id: 'glass',  x: 225, y: 125, r: 11, color: '#f59e0b', label: 'Shatter Vector',         detail: 'Safety glass dispersion pattern' },
    ]
    svgBody = (
      <>
        <rect x="100" y="90" width="210" height="80" rx="20" fill="none" stroke="rgba(0,255,180,0.3)" strokeWidth="2" />
        <rect x="145" y="96" width="80" height="68" rx="10" fill="rgba(0,255,180,0.05)" stroke="rgba(0,255,180,0.5)" strokeWidth="1" />
        <line x1="145" y1="96" x2="225" y2="164" stroke="rgba(0,255,180,0.15)" strokeWidth="1" />
        <line x1="225" y1="96" x2="145" y2="164" stroke="rgba(0,255,180,0.15)" strokeWidth="1" />
        <circle cx="290" cy="130" r="26" fill="rgba(255,77,77,0.08)" stroke="#ff4d4d" strokeDasharray="4 4" />
      </>
    )
  } else if (mod.includes('ballistic') || mod.includes('casing') || mod.includes('weapon')) {
    title = 'BALLISTIC TOPOLOGY RECONSTRUCTION'
    features = [
      { id: 'pin',    x: 200, y: 130, r: 15, color: '#ff4d4d', label: 'Firing Pin Crater',       detail: 'Geometric micro-crater · High confidence' },
      { id: 'breech', x: 158, y: 130, r: 8,  color: '#00ffb4', label: 'Breech Face Striations',  detail: 'Parallel mechanical tooling marks' },
    ]
    svgBody = (
      <>
        <circle cx="200" cy="130" r="80" fill="rgba(0,255,180,0.04)" stroke="rgba(0,255,180,0.35)" strokeWidth="2" />
        <circle cx="200" cy="130" r="68" fill="none" stroke="rgba(0,255,180,0.12)" strokeWidth="1" />
        <circle cx="200" cy="130" r="20" fill="rgba(255,77,77,0.12)" stroke="#ff4d4d" strokeWidth="1" />
        {[0,1,2,3,4].map(i => <line key={i} x1="138" y1={112 + i*10} x2="178" y2={112 + i*10} stroke="#00ffb4" opacity="0.35" />)}
      </>
    )
  } else if (mod.includes('face') || mod.includes('recognition') || mod.includes('biometric')) {
    title = 'BIOMETRIC FACIAL MESH'
    features = [
      { id: 'eye', x: 172, y: 110, r: 10, color: '#00ffb4', label: 'Ocular Metric',       detail: 'Interpupillary distance matched to DB' },
      { id: 'jaw', x: 200, y: 180, r: 12, color: '#f59e0b', label: 'Mandible Structure',  detail: 'Bone structure mapping complete' },
    ]
    svgBody = (
      <>
        <ellipse cx="200" cy="130" rx="62" ry="82" fill="rgba(0,255,180,0.04)" stroke="rgba(0,255,180,0.28)" strokeWidth="1" strokeDasharray="5 5" />
        <path d="M 162 112 Q 200 152 238 112" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.45" />
        <path d="M 172 182 Q 200 210 228 182" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.45" />
        <line x1="200" y1="50" x2="200" y2="210" stroke="rgba(0,255,180,0.18)" />
        <line x1="130" y1="130" x2="270" y2="130" stroke="rgba(0,255,180,0.18)" />
      </>
    )
  } else {
    title = 'ORGANIC / CHEMICAL SCENE ANALYSIS'
    features = [
      { id: 'primary',   x: 200, y: 120, r: 13, color: '#ff4d4d', label: 'Primary Anomaly',   detail: 'Organic/chemical signature detected' },
      { id: 'secondary', x: 248, y: 138, r: 8,  color: '#a855f7', label: 'Secondary Scatter', detail: 'Peripheral dispersion pattern' },
    ]
    svgBody = (
      <>
        <ellipse cx="200" cy="140" rx="130" ry="75" fill="rgba(139,90,60,0.04)" stroke="rgba(139,90,60,0.14)" strokeWidth="1" />
        <ellipse cx="200" cy="130" rx="14" ry="8" fill="rgba(180,30,30,0.18)" stroke="#ff4d4d" strokeWidth="1" />
        <ellipse cx="248" cy="140" rx="9"  ry="6" fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="1" />
      </>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(4,8,15,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <svg viewBox="0 0 400 260" className="w-full" style={{ display: 'block' }}>
        <defs>
          <pattern id="wgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,255,180,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill="url(#wgrid)" />
        <text x="200" y="22" textAnchor="middle" fontSize="8" fontFamily="Space Mono" letterSpacing="2" fill="rgba(0,255,180,0.3)">{title}</text>
        {svgBody}
        {features.map((f, fi) => (
          <g key={f.id} onMouseEnter={() => setHovered(f.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            <motion.circle cx={f.x} cy={f.y} r={f.r} fill={`${f.color}20`} stroke={f.color}
              strokeWidth={hovered === f.id ? 2 : 1}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: fi * 0.4 }}
            />
            <motion.circle cx={f.x} cy={f.y} r={hovered === f.id ? f.r + 7 : 0}
              fill="none" stroke={f.color} strokeWidth="0.5"
              animate={{ opacity: hovered === f.id ? [0.5, 0] : 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </g>
        ))}
      </svg>
      <AnimatePresence>
        {hovered && (() => {
          const f = features.find(x => x.id === hovered)
          return (
            <motion.div key={hovered} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-3 left-3 right-3 rounded-lg p-3"
              style={{ background: 'rgba(4,8,15,0.94)', border: `1px solid ${f.color}30` }}
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

// ── Evidence card (expandable) ────────────────────────────
function EvidenceCard({ record, index, isSelected, onToggle }) {
  const st      = record.status || 'pending'
  const imgUrl  = resolveImageUrl(record)
  const stColor = st === 'verified' ? '#00ffb4' : st === 'compromised' ? '#ff4d4d' : '#a855f7'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${isSelected ? 'rgba(0,255,180,0.25)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,255,180,0.02)' : 'rgba(8,13,24,0.8)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        <span className="font-mono-cus text-[11px]" style={{ color: '#00ffb4', minWidth: 90 }}>
          {record.id || `EVD-${index + 1}`}
        </span>
        <span className="flex-1 font-display text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {record.module || 'Unknown Module'}
        </span>
        <span className="font-mono-cus text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {record.time ? new Date(record.time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono-cus text-[9px] tracking-wider"
          style={{ background: `${stColor}14`, border: `1px solid ${stColor}30`, color: stColor }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: stColor }} />
          {st.toUpperCase()}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>
          {isSelected ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 flex gap-5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Image */}
              <div
                className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center relative"
                style={{ width: 140, height: 100, background: '#04080f', border: '1px solid rgba(0,255,180,0.12)' }}
              >
                <div className="absolute top-1.5 left-1.5  w-3 h-3 border-t border-l border-[#00ffb4] opacity-40" />
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#00ffb4] opacity-40" />
                <div className="absolute bottom-1.5 left-1.5  w-3 h-3 border-b border-l border-[#00ffb4] opacity-40" />
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#00ffb4] opacity-40" />
                {imgUrl ? (
                  <img src={imgUrl} alt="evidence" className="max-w-full max-h-full object-contain opacity-90 mix-blend-screen"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
                  />
                ) : null}
                <div style={{ display: imgUrl ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="font-mono-cus text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>NO IMAGE</p>
                </div>
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,180,0.025) 2px, rgba(0,255,180,0.025) 4px)' }} />
              </div>

              {/* Meta */}
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {[
                  ['PREDICTION',  record.prediction  || '—'],
                  ['CONFIDENCE',  record.confidence != null ? `${record.confidence}%` : '—'],
                  ['OFFICER',     record.officer     || '—'],
                  ['BADGE',       record.badge       || '—'],
                  ['GPS',         record.gps?.label  || 'N/A'],
                  ['BLOCK TX',    record.blockTx     || 'PENDING'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="font-mono-cus text-[8px] tracking-[1.5px] mb-0.5" style={{ color: 'rgba(0,255,180,0.3)' }}>{k}</p>
                    <p className="font-mono-cus text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{v}</p>
                  </div>
                ))}
                {/* Hash */}
                <div className="col-span-3">
                  <p className="font-mono-cus text-[8px] tracking-[1.5px] mb-0.5" style={{ color: 'rgba(0,255,180,0.3)' }}>SHA-256</p>
                  <p className="font-mono-cus text-[9px] break-all" style={{ color: 'rgba(0,255,180,0.5)' }}>
                    {record.hash || 'Hash pending...'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Timeline item ─────────────────────────────────────────
function TimelineItem({ item, index, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 z-10" style={{ background: item.color || '#00ffb4', boxShadow: `0 0 8px ${item.color || '#00ffb4'}60` }} />
        {!isLast && <div className="flex-1 w-px mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />}
      </div>
      <div className="pb-5 flex-1">
        <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: `${item.color || '#00ffb4'}80` }}>{item.time}</p>
        <p className="font-display font-bold text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.event}</p>
        <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.detail}</p>
      </div>
    </motion.div>
  )
}

// ── Card wrapper ──────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-xl p-5 ${className}`} style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)', ...style }}>
      {children}
    </div>
  )
}
function CardHeader({ icon: Icon, iconColor = '#00ffb4', label, sub }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${iconColor}12`, border: `1px solid ${iconColor}25` }}>
        <Icon size={13} style={{ color: iconColor }} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: `${iconColor}70` }}>{label}</p>
        {sub && <p className="font-display text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Sealing lock screen ───────────────────────────────────
function SealScreen({ caseId, hash, onDone }) {
  const [t, setT] = useState(8)
  useEffect(() => {
    const iv = setInterval(() => setT(p => {
      if (p <= 1) { clearInterval(iv); onDone(); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [onDone])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
    >
      <Shield size={60} style={{ color: '#00ffb4' }} className="animate-pulse" />
      <h2 className="font-mono-cus text-2xl tracking-[4px]" style={{ color: '#00ffb4' }}>SEALING CASE {caseId}</h2>
      <div className="w-full max-w-2xl rounded-xl p-8 text-center" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,180,0.25)' }}>
        <LetterGlitchHash hash={hash || 'COMPUTING_AGGREGATE_HASH...'} />
        <p className="font-mono-cus tracking-widest text-sm mt-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          ENCRYPTING CHAIN OF CUSTODY · T-MINUS {t}s
        </p>
        <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" style={{ background: '#00ffb4' }}
            initial={{ width: '100%' }} animate={{ width: '0%' }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function AnalysisPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const params    = useParams()

  const { log, fetchLedger, isLoading } = useEvidenceStore()

  // Accept caseId from: route param → location state → first record fallback
  const routeCaseId  = params?.caseId
  const stateCaseId  = location.state?.caseId || location.state?.evidence?.caseNum || location.state?.evidence?.case_num
  const [activeCaseId, setActiveCaseId] = useState(routeCaseId || stateCaseId || null)

  const [expandedId,    setExpandedId]    = useState(null)
  const [confirmStep,   setConfirmStep]   = useState(0)   // 0=idle 1=confirm 2=sealing
  const [isReconstructing, setIsReconstructing] = useState(false)
  const [reconstructed,    setReconstructed]    = useState(false)

  // Sync ledger on mount
  useEffect(() => {
    if (fetchLedger) fetchLedger()
  }, [fetchLedger])

  const safeLog = useMemo(() => Array.isArray(log) ? log : [], [log])

  // All unique case IDs available in the ledger
  const allCaseIds = useMemo(() => {
    const ids = new Set()
    safeLog.forEach(r => {
      const id = r.caseNum || r.case_num
      if (id) ids.add(id)
    })
    return [...ids].sort()
  }, [safeLog])

  // Auto-select first case if none set yet
  useEffect(() => {
    if (!activeCaseId && allCaseIds.length > 0) {
      setActiveCaseId(allCaseIds[0])
    }
  }, [allCaseIds, activeCaseId])

  // All evidence for the active case, sorted oldest→newest
  const caseEvidence = useMemo(() => {
    if (!activeCaseId) return []
    return safeLog
      .filter(r => (r.caseNum || r.case_num) === activeCaseId)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
  }, [safeLog, activeCaseId])

  // Aggregate stats for this case
  const verified    = caseEvidence.filter(r => r.status === 'verified').length
  const compromised = caseEvidence.filter(r => r.status === 'compromised').length
  const pending     = caseEvidence.filter(r => !r.status || r.status === 'pending').length

  // Dominant module for the case (most common)
  const dominantModule = useMemo(() => {
    const freq = {}
    caseEvidence.forEach(r => { if (r.module) freq[r.module] = (freq[r.module] || 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General Forensic Model'
  }, [caseEvidence])

  // Aggregate confidence — weighted average across all records
  const avgConf = useMemo(() => {
    if (!caseEvidence.length) return 0
    const total = caseEvidence.reduce((s, r) => s + (parseFloat(r.confidence) || 0), 0)
    return Math.round(total / caseEvidence.length)
  }, [caseEvidence])

  // Dominant prediction label
  const dominantPrediction = useMemo(() => {
    const freq = {}
    caseEvidence.forEach(r => { if (r.prediction) freq[r.prediction] = (freq[r.prediction] || 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unclassified'
  }, [caseEvidence])

  // Dynamic timeline built from real evidence records
  const timeline = useMemo(() => caseEvidence.map(ev => ({
    time:   ev.time ? new Date(ev.time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'UNKNOWN',
    event:  `${(ev.module || 'EVIDENCE').toUpperCase()} LOGGED`,
    detail: `AI flagged: ${ev.prediction || 'Unknown'} (${ev.confidence || 0}%). Hash sealed.`,
    color:  ev.status === 'verified' ? '#00ffb4' : ev.status === 'compromised' ? '#ff4d4d' : '#a855f7',
  })), [caseEvidence])

  // Aggregate hash — latest non-null hash in the case, or concatenated
  const aggregateHash = useMemo(() => {
    const hashes = caseEvidence.map(r => r.hash).filter(Boolean)
    return hashes[hashes.length - 1] || null
  }, [caseEvidence])

  // ── Reconstruct handler ──────────────────────────────
  const handleReconstruct = () => {
    if (isReconstructing || reconstructed) return
    setIsReconstructing(true)
    setReconstructed(false)
    setTimeout(() => {
      setIsReconstructing(false)
      setReconstructed(true)
    }, 1800)
  }

  // ── Case switch resets reconstruction state ──────────
  const handleCaseSwitch = (id) => {
    setActiveCaseId(id)
    setReconstructed(false)
    setConfirmStep(0)
    setExpandedId(null)
  }

  // ── Sealing lock screen ──────────────────────────────
  if (confirmStep === 2) {
    return <SealScreen caseId={activeCaseId} hash={aggregateHash} onDone={() => navigate('/evidence')} />
  }

  // ── Empty ledger state ────────────────────────────────
  if (!isLoading && safeLog.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <FileSearch size={40} style={{ color: 'rgba(255,255,255,0.1)' }} />
        <p className="font-mono-cus tracking-[4px] text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>NO EVIDENCE IN LEDGER</p>
        <button onClick={() => fetchLedger && fetchLedger()} className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest"
          style={{ background: 'rgba(0,255,180,0.06)', border: '1px solid rgba(0,255,180,0.2)', color: '#00ffb4' }}>
          <RefreshCw size={11} /> SYNC LEDGER
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 pb-10">

      {/* ── Header ── */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>
            PHASE 03 · FORENSIC INTELLIGENCE
          </p>
          <h2 className="font-display font-extrabold text-3xl mb-2" style={{ letterSpacing: '-1px' }}>
            Scene <span style={{ color: '#ff4d4d' }}>Reconstruction</span>
          </h2>
          <p className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Case-level multi-record synthesis · verify before you seal
          </p>
        </div>
        <button
          onClick={() => { if (fetchLedger) fetchLedger() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest transition-all hover:bg-white/10 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} /> SYNC
        </button>
      </div>

      {/* ── Case selector ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <p className="font-mono-cus text-[9px] tracking-[2px] mr-1" style={{ color: 'rgba(255,255,255,0.2)' }}>SELECT CASE</p>
        {allCaseIds.length === 0 && (
          <span className="font-mono-cus text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No cases found in ledger</span>
        )}
        {allCaseIds.map(id => (
          <button key={id} onClick={() => handleCaseSwitch(id)}
            className="px-3 py-1.5 rounded-lg font-mono-cus text-[10px] tracking-widest transition-all"
            style={{
              background: activeCaseId === id ? 'rgba(0,255,180,0.1)'  : 'rgba(255,255,255,0.03)',
              border:     activeCaseId === id ? '1px solid rgba(0,255,180,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color:      activeCaseId === id ? '#00ffb4' : 'rgba(255,255,255,0.35)',
            }}
          >
            {id}
          </button>
        ))}
      </div>

      {/* ── Active case banner ── */}
      {activeCaseId && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: 'rgba(8,13,24,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <FileSearch size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
          <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.4)' }}>ACTIVE CASE</p>
          <span className="font-mono-cus text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.2)', color: '#00ffb4' }}>
            {activeCaseId}
          </span>
          <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {caseEvidence.length} evidence record{caseEvidence.length !== 1 ? 's' : ''} · dominant module: {dominantModule}
          </span>
          {/* Stats pills */}
          <div className="flex gap-2 ml-auto">
            {[['VERIFIED', verified, '#00ffb4'], ['COMPROMISED', compromised, '#ff4d4d'], ['PENDING', pending, '#a855f7']].map(([l, v, c]) => (
              <span key={l} className="font-mono-cus text-[9px] px-2 py-0.5 rounded" style={{ background: `${c}10`, border: `1px solid ${c}25`, color: c }}>
                {v} {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tamper alert ── */}
      <AnimatePresence>
        {compromised > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)' }}
          >
            <AlertTriangle size={15} style={{ color: '#ff4d4d', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-mono-cus text-[10px] tracking-[2px] mb-1" style={{ color: '#ff4d4d' }}>
                WARNING: TAMPER DETECTED — {compromised} RECORD{compromised > 1 ? 'S' : ''} COMPROMISED
              </p>
              <p className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Hash mismatch flagged on this case. Investigate before sealing.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All evidence for this case ── */}
      <div>
        <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
          EVIDENCE RECORDS ({caseEvidence.length})
        </p>
        {caseEvidence.length === 0 ? (
          <div className="py-12 text-center rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,13,24,0.4)' }}>
            <p className="font-mono-cus text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>NO RECORDS FOR THIS CASE</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {caseEvidence.map((rec, i) => (
              <EvidenceCard
                key={rec.id || i}
                record={rec}
                index={i}
                isSelected={expandedId === (rec.id || i)}
                onToggle={() => setExpandedId(expandedId === (rec.id || i) ? null : (rec.id || i))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Reconstruct button ── */}
      <div className="flex justify-center">
        <button
          onClick={handleReconstruct}
          disabled={isReconstructing || caseEvidence.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono-cus text-[11px] tracking-widest transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: reconstructed ? 'rgba(0,255,180,0.08)' : 'rgba(255,255,255,0.04)',
            border: reconstructed ? '1px solid rgba(0,255,180,0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: reconstructed ? '#00ffb4' : 'rgba(255,255,255,0.55)',
          }}
        >
          {isReconstructing
            ? <><RefreshCw size={13} className="animate-spin" /> RECONSTRUCTING…</>
            : reconstructed
              ? <><CheckCircle2 size={13} /> RECONSTRUCTION COMPLETE — RE-RUN</>
              : <><Eye size={13} /> RUN SCENE RECONSTRUCTION</>
          }
        </button>
      </div>

      {/* ── Reconstruction results (only shown after RUN) ── */}
      <AnimatePresence>
        {reconstructed && (
          <motion.div
            key="reconstruction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* Row: Scene SVG + AI confidence */}
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Card>
                <CardHeader icon={Crosshair} iconColor="#ff4d4d" label={`${dominantModule.toUpperCase()} VISUALIZATION`} sub="Hover callouts to inspect topological markers" />
                <DynamicSceneReconstruction moduleName={dominantModule} />
              </Card>

              <div className="flex flex-col gap-5">
                <Card>
                  <CardHeader icon={Cpu} iconColor="#00ffb4" label="AGGREGATE AI CONFIDENCE" sub={`${caseEvidence.length} record synthesis · model: ${dominantModule}`} />
                  <div className="flex flex-col gap-3.5">
                    <ConfBar label={dominantPrediction.toUpperCase()} pct={avgConf} color="#00ffb4" delay={0}    />
                    <ConfBar label="ALTERNATIVE SIGNATURE"             pct={Math.max(0, 100 - avgConf - 6)} color="#ff4d4d" delay={0.07} />
                    <ConfBar label="BACKGROUND NOISE"                  pct={4}     color="#a855f7" delay={0.14} />
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                    className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(0,255,180,0.04)', border: '1px solid rgba(0,255,180,0.1)' }}
                  >
                    <p className="font-mono-cus text-[9px] tracking-[1.5px] mb-1.5" style={{ color: 'rgba(0,255,180,0.35)' }}>AI CONCLUSION</p>
                    <p className="font-display text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      Aggregate confidence across {caseEvidence.length} record{caseEvidence.length !== 1 ? 's' : ''}: 
                      <span className="font-bold" style={{ color: '#00ffb4' }}> {dominantPrediction} ({avgConf}%)</span>.
                      {compromised > 0
                        ? ' ⚠ Tampered records detected — seal with caution.'
                        : ' Chain of custody intact. Safe to seal.'}
                    </p>
                  </motion.div>
                </Card>

                <Card>
                  <CardHeader icon={Network} iconColor="#a855f7" label="CASE CROSS-REFERENCE" sub="Intelligence linked to this case" />
                  <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {[
                      ['TOTAL EVIDENCE', `${caseEvidence.length} record(s)`, '#00ffb4'],
                      ['VERIFIED',       `${verified}`, '#00ffb4'],
                      ['COMPROMISED',    `${compromised}`, compromised > 0 ? '#ff4d4d' : '#00ffb4'],
                      ['THREAT LEVEL',   compromised > 0 ? 'Elevated' : 'Normal', compromised > 0 ? '#ff4d4d' : '#00ffb4'],
                    ].map(([k, v, c]) => (
                      <div key={k} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="font-mono-cus text-[8px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{k}</p>
                        <p className="font-display font-semibold text-xs" style={{ color: c }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Crime scene map */}
            <div>
              <p className="font-mono-cus text-[10px] tracking-[3px] mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                CRIME SCENE SPATIAL RECONSTRUCTION
              </p>
              <CrimeSceneMap />
            </div>

            {/* Timeline + payload summary */}
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
              <Card>
                <CardHeader icon={Clock} iconColor="#00ffb4" label="CASE TIMELINE" sub={`All evidence logged under ${activeCaseId}`} />
                <div className="mt-1">
                  {timeline.length > 0 ? (
                    timeline.map((item, i) => (
                      <TimelineItem key={i} item={item} index={i} isLast={i === timeline.length - 1} />
                    ))
                  ) : (
                    <p className="font-mono-cus text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No timeline data.</p>
                  )}
                </div>
              </Card>

              <div className="flex flex-col gap-4">
                <Card>
                  <p className="font-mono-cus text-[10px] tracking-[2px] mb-4" style={{ color: 'rgba(0,255,180,0.35)' }}>CASE SUMMARY</p>
                  <div className="flex flex-col gap-3">
                    {[
                      ['CASE ID',      activeCaseId,        '#00ffb4'],
                      ['RECORDS',      `${caseEvidence.length}`, '#00ffb4'],
                      ['AVG CONF.',    `${avgConf}%`,        '#00ffb4'],
                      ['PREDICTION',   dominantPrediction,   '#00ffb4'],
                      ['MODULE',       dominantModule.toUpperCase(), 'rgba(255,255,255,0.45)'],
                      ['CUSTODY',      compromised > 0 ? '⚠ REVIEW' : 'READY TO SEAL ✓', compromised > 0 ? '#ff4d4d' : '#00ffb4'],
                    ].map(([k, v, c]) => (
                      <div key={k} className="flex justify-between items-start pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="font-mono-cus text-[9px] tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{k}</span>
                        <span className="font-mono-cus text-[10px] text-right ml-2" style={{ color: c }}>{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: compromised > 0 ? 'rgba(255,77,77,0.04)' : 'rgba(0,255,180,0.04)', border: `1px solid ${compromised > 0 ? 'rgba(255,77,77,0.2)' : 'rgba(0,255,180,0.15)'}` }}
                >
                  {compromised > 0
                    ? <AlertTriangle size={15} style={{ color: '#ff4d4d', flexShrink: 0 }} />
                    : <CheckCircle2  size={15} style={{ color: '#00ffb4', flexShrink: 0 }} />}
                  <div>
                    <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: compromised > 0 ? '#ff4d4d' : '#00ffb4' }}>
                      {compromised > 0 ? 'TAMPER RISK — REVIEW FIRST' : 'CHAIN OF CUSTODY PREPARED'}
                    </p>
                    <p className="font-mono-cus text-[8px] tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {compromised > 0 ? 'FIX COMPROMISED RECORDS BEFORE SEALING' : 'AWAITING OFFICER CONFIRMATION'}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Blockchain hash preview */}
            {aggregateHash && (
              <Card>
                <CardHeader icon={Fingerprint} iconColor="#a855f7" label="AGGREGATE HASH PREVIEW" sub="SHA-256 fingerprint that will be sealed" />
                <BlockchainVisualizer hash={aggregateHash} autoPlay />
                <p className="font-mono-cus text-[10px] break-all leading-relaxed mt-4 p-3 rounded-lg"
                  style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.1)', color: 'rgba(0,255,180,0.55)' }}
                >
                  {aggregateHash}
                </p>
              </Card>
            )}

            {/* Double-confirm seal button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => confirmStep === 0 ? setConfirmStep(1) : setConfirmStep(2)}
              className="w-full py-4 rounded-xl font-bold font-mono-cus tracking-widest flex justify-center items-center gap-3 transition-all"
              style={{
                background: confirmStep === 0
                  ? 'rgba(255,255,255,0.04)'
                  : compromised > 0 ? 'rgba(255,77,77,0.85)' : 'rgba(0,255,180,0.12)',
                border: confirmStep === 0
                  ? '1px solid rgba(255,255,255,0.12)'
                  : compromised > 0 ? '1px solid rgba(255,77,77,0.6)' : '1px solid rgba(0,255,180,0.35)',
                color: confirmStep === 0
                  ? 'rgba(255,255,255,0.6)'
                  : compromised > 0 ? '#fff' : '#00ffb4',
              }}
            >
              {confirmStep === 1 && <Lock size={16} />}
              {confirmStep === 0
                ? 'VERIFY & PREPARE TO SEAL'
                : compromised > 0
                  ? `⚠ FINAL WARNING: SEAL DESPITE ${compromised} COMPROMISED RECORD${compromised > 1 ? 'S' : ''}`
                  : `CONFIRM: SEAL CASE ${activeCaseId} TO BLOCKCHAIN`
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
