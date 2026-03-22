import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanFace, ShieldCheck, ShieldAlert, ShieldX, Upload,
  RefreshCw, ChevronDown, User, Fingerprint, AlertTriangle,
  CheckCircle2, Lock, Hash, Database, Search, XCircle,
  FileWarning, Eye
} from 'lucide-react'
import { verifySuspect, listSuspects, verifyEvidenceIntegrity, verifyCaseIntegrity, getLedger } from '../utils/api'

const BACKEND_URL = 'http://127.0.0.1:8000'

// ── Verdict configs ───────────────────────────────────────────────
const FACE_VERDICT = {
  VERIFIED:        { icon: ShieldCheck, color: '#00ffb4', bg: 'rgba(0,255,180,0.06)',  border: 'rgba(0,255,180,0.25)',  label: 'IDENTITY VERIFIED',       sub: 'FaceNet confirms biometric match within threshold.' },
  'PROBABLE MATCH':{ icon: ShieldAlert, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', label: 'PROBABLE MATCH',           sub: 'Low-confidence match. Manual review recommended.' },
  'NOT VERIFIED':  { icon: ShieldX,     color: '#ff4d4d', bg: 'rgba(255,77,77,0.06)',  border: 'rgba(255,77,77,0.25)',  label: 'IDENTITY NOT VERIFIED',    sub: 'Distance exceeds threshold. No match confirmed.' },
}

const INTEGRITY_VERDICT = {
  INTACT:   { icon: ShieldCheck,  color: '#00ffb4', bg: 'rgba(0,255,180,0.06)',  border: 'rgba(0,255,180,0.25)',  label: 'EVIDENCE INTACT',         sub: 'SHA-256 matches original capture hash. File unaltered.' },
  TAMPERED: { icon: FileWarning,  color: '#ff4d4d', bg: 'rgba(255,77,77,0.08)',  border: 'rgba(255,77,77,0.3)',   label: 'TAMPERING DETECTED',       sub: 'Hash mismatch. File modified after capture. FLAGGED.' },
  MISSING:  { icon: XCircle,      color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', label: 'FILE MISSING',             sub: 'Evidence file no longer exists on disk.' },
}

// ── Shared sub-components ─────────────────────────────────────────
function ConfidenceRing({ value, color, size = 110 }) {
  const r    = (size / 2) - 8
  const circ = 2 * Math.PI * r
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (value / 100) * circ }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-mono-cus font-bold" style={{ fontSize: 20, color, lineHeight: 1 }}>{value}</p>
        <p className="font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>%</p>
      </div>
    </div>
  )
}

function DistanceBar({ distance, threshold }) {
  const max   = threshold * 2.2
  const pct   = Math.min(100, (distance / max) * 100)
  const tPct  = (threshold / max) * 100
  const color = distance <= threshold ? '#00ffb4' : '#ff4d4d'
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.3)' }}>EUCLIDEAN DISTANCE</p>
        <span className="font-mono-cus text-[11px]" style={{ color }}>{distance.toFixed(4)}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute top-[-3px] h-[calc(100%+6px)] w-0.5 rounded-full"
          style={{ left: `${tPct}%`, background: 'rgba(255,255,255,0.4)' }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>0.00</span>
        <span className="font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>threshold {threshold.toFixed(2)}</span>
        <span className="font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{max.toFixed(2)}</span>
      </div>
    </div>
  )
}

function FaceMesh({ color = '#00ffb4', pulse = false }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
      <ellipse cx="100" cy="100" rx="58" ry="78" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="5 5" opacity="0.4" />
      <line x1="42" y1="100" x2="158" y2="100" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <line x1="100" y1="22"  x2="100" y2="178" stroke={color} strokeWidth="0.4" opacity="0.2" />
      {[[68,84],[132,84]].map(([x,y],i) => (
        <motion.rect key={i} x={x-12} y={y-8} width="24" height="16" rx="3"
          fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"
          animate={pulse ? { opacity: [0.3, 0.7, 0.3] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      <path d="M100 106 L93 127 Q100 131 107 127 Z" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M83 150 Q100 161 117 150" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      {[[42,42],[158,42],[42,158],[158,158]].map(([x,y],i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x+(x<100?7:-7)} y2={y} stroke={color} strokeWidth="1.5" opacity="0.6" />
          <line x1={x} y1={y} x2={x} y2={y+(y<100?7:-7)} stroke={color} strokeWidth="1.5" opacity="0.6" />
        </g>
      ))}
    </svg>
  )
}

function HashDiff({ original, recomputed }) {
  if (!original || !recomputed) return null
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(4,8,15,0.8)', border: '1px solid rgba(255,77,77,0.2)' }}>
      <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(255,77,77,0.5)' }}>HASH COMPARISON</p>
      {[['SEALED AT CAPTURE', original, '#00ffb4'], ['RECOMPUTED NOW', recomputed, '#ff4d4d']].map(([label, hash, color]) => (
        <div key={label}>
          <p className="font-mono-cus text-[8px] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
          <p className="font-mono-cus text-[9px] break-all leading-relaxed px-2 py-1.5 rounded"
            style={{ background: `${color}08`, border: `1px solid ${color}20`, color }}>
            {hash}
          </p>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// TAB 1 — SUSPECT VERIFICATION
// ══════════════════════════════════════════════════════════════════
function SuspectTab() {
  const fileRef = useRef(null)
  const [suspects, setSuspects]   = useState([])
  const [selKey,   setSelKey]     = useState('')
  const [officer,  setOfficer]    = useState('')
  const [caseNum,  setCaseNum]    = useState('')
  const [probe,    setProbe]      = useState(null)
  const [preview,  setPreview]    = useState(null)
  const [dropOpen, setDropOpen]   = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [progress, setProgress]   = useState(0)
  const [result,   setResult]     = useState(null)
  const [error,    setError]      = useState(null)

  useEffect(() => {
    listSuspects()
      .then(d => { setSuspects(d.suspects || []); if (d.suspects?.[0]) setSelKey(d.suspects[0].key) })
      .catch(() => setError('Cannot reach suspect database. Is the API running?'))
  }, [])

  const handleFile = f => {
    if (!f) return
    setProbe(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null)
  }

  const run = async () => {
    if (!probe)   return setError('Upload a probe image first.')
    if (!selKey)  return setError('Select a suspect.')
    setLoading(true); setError(null); setResult(null); setProgress(0)
    const iv = setInterval(() => setProgress(p => Math.min(p + 2, 88)), 60)
    try {
      const data = await verifySuspect(probe, selKey, officer || 'Unknown Officer', caseNum || 'CAS-UNKNOWN')
      clearInterval(iv); setProgress(100)
      setTimeout(() => setResult(data), 250)
    } catch(e) {
      clearInterval(iv); setError(e.message)
    } finally { setLoading(false) }
  }

  const reset = () => { setProbe(null); setPreview(null); setResult(null); setError(null); setProgress(0) }

  const sel    = suspects.find(s => s.key === selKey)
  const vcfg   = result ? (FACE_VERDICT[result.verdict] || FACE_VERDICT['NOT VERIFIED']) : null
  const VIcon  = vcfg?.icon || ShieldX

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* LEFT */}
      <div className="flex flex-col gap-4">
        {/* Probe upload */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>PROBE IMAGE</p>
          <div
            className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
            style={{ height: 210, background: preview ? '#04080f' : 'rgba(255,255,255,0.02)',
                     border: preview ? '1px solid rgba(0,255,180,0.2)' : '2px dashed rgba(255,255,255,0.07)' }}
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
            onDragOver={e => e.preventDefault()}
          >
            {preview ? (
              <>
                <img src={preview} alt="probe" className="max-w-full max-h-full object-contain opacity-90" />
                <FaceMesh pulse={!loading && !result} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,180,0.02) 2px,rgba(0,255,180,0.02) 4px)' }} />
                {[['top-2 left-2','t','l'],['top-2 right-2','t','r'],['bottom-2 left-2','b','l'],['bottom-2 right-2','b','r']].map(([pos,v,h]) => (
                  <div key={pos} className={`absolute ${pos} w-4 h-4 border-${v} border-${h} border-[#00ffb4] opacity-50`} />
                ))}
              </>
            ) : (
              <div className="text-center select-none">
                <Upload size={26} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 8px' }} />
                <p className="font-mono-cus text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>DROP OR CLICK</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          {probe && <p className="font-mono-cus text-[8px] mt-2 truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>{probe.name}</p>}
        </div>

        {/* Suspect picker */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>SUSPECT DATABASE</p>
          {suspects.length === 0
            ? <p className="font-mono-cus text-[10px]" style={{ color: '#ff4d4d' }}>No suspects — add images to suspect_database/</p>
            : (
              <div className="relative">
                <button onClick={() => setDropOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                  <div className="flex items-center gap-2">
                    <User size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
                    <span className="font-mono-cus text-[11px]">{sel?.name || 'SELECT SUSPECT'}</span>
                  </div>
                  <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)', transform: dropOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                <AnimatePresence>
                  {dropOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-20 w-full mt-1 rounded-lg overflow-hidden"
                      style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {suspects.map(s => (
                        <button key={s.key} onClick={() => { setSelKey(s.key); setDropOpen(false); setResult(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5"
                          style={{ background: selKey === s.key ? 'rgba(0,255,180,0.06)' : 'transparent',
                                   borderBottom: '1px solid rgba(255,255,255,0.04)',
                                   color: selKey === s.key ? '#00ffb4' : 'rgba(255,255,255,0.5)' }}>
                          <User size={10} /><span className="font-mono-cus text-[11px]">{s.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }
        </div>

        {/* Metadata */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>CASE METADATA</p>
          <div className="flex flex-col gap-3">
            {[['OFFICER NAME', officer, setOfficer, 'Officer Name'], ['CASE NUMBER', caseNum, setCaseNum, 'CAS-XXXX']].map(([l, v, s, p]) => (
              <div key={l}>
                <p className="font-mono-cus text-[8px] tracking-[2px] mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{l}</p>
                <input type="text" value={v} onChange={e => s(e.target.value)} placeholder={p}
                  className="w-full rounded-lg px-3 py-2 font-mono-cus text-[11px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,180,0.3)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
              </div>
            ))}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={run}
          disabled={loading || !probe || !selKey}
          className="w-full py-4 rounded-xl font-mono-cus font-bold tracking-widest flex items-center justify-center gap-3 disabled:opacity-40"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.28)', color: '#a855f7' }}>
          {loading ? <><RefreshCw size={14} className="animate-spin" /> RUNNING FACENET…</> : <><ScanFace size={14} /> RUN BIOMETRIC VERIFICATION</>}
        </motion.button>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#a855f7,#00ffb4)' }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="font-mono-cus text-[9px] tracking-widest text-center mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                COMPUTING 128-D EMBEDDINGS · {progress}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.2)' }}>
            <AlertTriangle size={12} style={{ color: '#ff4d4d' }} />
            <p className="font-mono-cus text-[10px]" style={{ color: '#ff4d4d' }}>{error}</p>
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div>
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="rounded-xl flex flex-col items-center justify-center gap-3 h-full"
              style={{ border: '1px dashed rgba(255,255,255,0.05)', background: 'rgba(8,13,24,0.4)', minHeight: 460 }}>
              <Fingerprint size={36} style={{ color: 'rgba(255,255,255,0.07)' }} />
              <p className="font-mono-cus text-[9px] tracking-[3px]" style={{ color: 'rgba(255,255,255,0.12)' }}>AWAITING BIOMETRIC SCAN</p>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4">
              {/* Verdict banner */}
              <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: vcfg.bg, border: `1px solid ${vcfg.border}` }}>
                <VIcon size={30} style={{ color: vcfg.color, flexShrink: 0 }} />
                <div>
                  <p className="font-mono-cus text-[11px] tracking-[2.5px]" style={{ color: vcfg.color }}>{vcfg.label}</p>
                  <p className="font-display text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{vcfg.sub}</p>
                </div>
              </div>

              {/* Image comparison */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono-cus text-[8px] tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>BIOMETRIC COMPARISON</p>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="relative rounded-lg overflow-hidden w-full" style={{ height: 110, background: '#04080f', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <img src={preview} alt="probe" className="w-full h-full object-cover opacity-90" />
                      <FaceMesh color={vcfg.color} />
                    </div>
                    <p className="font-mono-cus text-[7px] tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>PROBE</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>VS</span>
                    <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="relative rounded-lg overflow-hidden w-full" style={{ height: 110, background: '#04080f', border: `1px solid ${vcfg.border}` }}>
                      {/* FIX: use reference_url (served from /suspects/) not /uploads/ */}
                      <img src={result.reference_url} alt="reference" className="w-full h-full object-cover opacity-90"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                      <FaceMesh color={vcfg.color} />
                    </div>
                    <p className="font-mono-cus text-[7px] tracking-widest" style={{ color: vcfg.color }}>{result.suspect_name}</p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono-cus text-[8px] tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>VERIFICATION METRICS</p>
                <div className="flex items-center gap-5">
                  <ConfidenceRing value={result.confidence} color={vcfg.color} />
                  <div className="flex-1 flex flex-col gap-3">
                    <DistanceBar distance={result.distance} threshold={result.threshold} />
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      {[['DISTANCE', result.distance.toFixed(4)],['THRESHOLD', result.threshold.toFixed(2)],['CASE', result.case_num],['OFFICER', result.officer_name]].map(([k,v]) => (
                        <div key={k}>
                          <p className="font-mono-cus text-[7px] tracking-[1.5px] mb-0.5" style={{ color: 'rgba(0,255,180,0.3)' }}>{k}</p>
                          <p className="font-mono-cus text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sealed */}
              <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.1)' }}>
                <Lock size={12} style={{ color: 'rgba(0,255,180,0.5)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono-cus text-[8px] tracking-[2px] mb-0.5" style={{ color: 'rgba(0,255,180,0.4)' }}>SEALED TO LEDGER</p>
                  <p className="font-mono-cus text-[8px] truncate" style={{ color: 'rgba(0,255,180,0.3)' }}>{result.probe_hash}</p>
                </div>
              </div>

              <button onClick={reset} className="w-full py-2.5 rounded-lg font-mono-cus text-[9px] tracking-widest"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
                RUN NEW VERIFICATION
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// TAB 2 — EVIDENCE INTEGRITY
// ══════════════════════════════════════════════════════════════════
function IntegrityTab() {
  const [ledger,      setLedger]      = useState([])
  const [loading,     setLoading]     = useState(false)
  const [checking,    setChecking]    = useState(null)   // 'single' | 'batch'
  const [selId,       setSelId]       = useState('')
  const [caseNum,     setCaseNum]     = useState('')
  const [officer,     setOfficer]     = useState('')
  const [singleResult, setSingle]     = useState(null)
  const [batchResult,  setBatch]      = useState(null)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    getLedger()
      .then(rows => { setLedger(rows); setLoading(false) })
      .catch(() => { setError('Cannot load ledger.'); setLoading(false) })
  }, [])

  const allCases = [...new Set(ledger.map(r => r.case_num).filter(Boolean))].sort()

  const runSingle = async () => {
    if (!selId) return setError('Select an evidence record first.')
    setChecking('single'); setError(null); setSingle(null); setBatch(null)
    try {
      const data = await verifyEvidenceIntegrity(parseInt(selId), officer || 'Unknown Officer', caseNum || 'CAS-UNKNOWN')
      setSingle(data)
      // Update local ledger status
      setLedger(l => l.map(r => r.id === parseInt(selId) ? { ...r, integrity: data.integrity } : r))
    } catch(e) { setError(e.message) }
    finally { setChecking(null) }
  }

  const runBatch = async () => {
    if (!caseNum) return setError('Enter or select a case number.')
    setChecking('batch'); setError(null); setSingle(null); setBatch(null)
    try {
      const data = await verifyCaseIntegrity(caseNum, officer || 'Unknown Officer')
      setBatch(data)
      // Update local integrity for all records in that case
      setLedger(l => l.map(r => {
        const upd = data.records?.find(x => x.evidence_id === r.id)
        return upd ? { ...r, integrity: upd.integrity } : r
      }))
    } catch(e) { setError(e.message) }
    finally { setChecking(null) }
  }

  const integrityColor = s => s === 'verified' ? '#00ffb4' : s === 'compromised' ? '#ff4d4d' : s === 'missing' ? '#f59e0b' : 'rgba(255,255,255,0.25)'
  const integrityBg    = s => s === 'verified' ? 'rgba(0,255,180,0.06)' : s === 'compromised' ? 'rgba(255,77,77,0.08)' : s === 'missing' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)'

  // Single result config
  const src  = singleResult ? (INTEGRITY_VERDICT[singleResult.result] || INTEGRITY_VERDICT['MISSING']) : null
  const SIcon = src?.icon || Hash

  return (
    <div className="flex flex-col gap-5">
      {/* Controls row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Single record */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>SINGLE RECORD CHECK</p>
          <p className="font-display text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Select one evidence record to re-hash and verify against the sealed SHA-256.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-mono-cus text-[8px] tracking-[2px] mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>EVIDENCE RECORD</p>
              <select value={selId} onChange={e => { setSelId(e.target.value); setSingle(null) }}
                className="w-full rounded-lg px-3 py-2 font-mono-cus text-[10px] outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                <option value="">— Select record —</option>
                {ledger.map(r => (
                  <option key={r.id} value={r.id}>
                    #{r.id} · {r.case_num} · {r.filename?.slice(0, 20)} [{r.integrity || 'unverified'}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="font-mono-cus text-[8px] tracking-[2px] mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>OFFICER</p>
              <input value={officer} onChange={e => setOfficer(e.target.value)} placeholder="Officer Name"
                className="w-full rounded-lg px-3 py-2 font-mono-cus text-[10px] outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,255,180,0.3)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={runSingle}
              disabled={checking !== null || !selId}
              className="w-full py-2.5 rounded-lg font-mono-cus text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.2)', color: '#00ffb4' }}>
              {checking === 'single'
                ? <><RefreshCw size={11} className="animate-spin" /> CHECKING…</>
                : <><Hash size={11} /> VERIFY HASH</>}
            </motion.button>
          </div>
        </div>

        {/* Batch case check */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(168,85,247,0.5)' }}>BATCH CASE INTEGRITY CHECK</p>
          <p className="font-display text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Re-hash every evidence file in a case and flag any that don't match their sealed hash.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-mono-cus text-[8px] tracking-[2px] mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>CASE NUMBER</p>
              <div className="flex gap-2">
                <input value={caseNum} onChange={e => setCaseNum(e.target.value)} placeholder="CAS-XXXX"
                  className="flex-1 rounded-lg px-3 py-2 font-mono-cus text-[10px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                {allCases.length > 0 && (
                  <select onChange={e => setCaseNum(e.target.value)} value=""
                    className="rounded-lg px-2 font-mono-cus text-[9px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                    <option value="">Pick</option>
                    {allCases.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div>
              <p className="font-mono-cus text-[8px] tracking-[2px] mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>OFFICER</p>
              <input value={officer} onChange={e => setOfficer(e.target.value)} placeholder="Officer Name"
                className="w-full rounded-lg px-3 py-2 font-mono-cus text-[10px] outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={runBatch}
              disabled={checking !== null || !caseNum}
              className="w-full py-2.5 rounded-lg font-mono-cus text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}>
              {checking === 'batch'
                ? <><RefreshCw size={11} className="animate-spin" /> SCANNING ALL FILES…</>
                : <><Database size={11} /> RUN BATCH INTEGRITY SCAN</>}
            </motion.button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.2)' }}>
          <AlertTriangle size={12} style={{ color: '#ff4d4d' }} />
          <p className="font-mono-cus text-[10px]" style={{ color: '#ff4d4d' }}>{error}</p>
        </div>
      )}

      {/* Single result */}
      <AnimatePresence>
        {singleResult && src && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: src.bg, border: `1px solid ${src.border}` }}>
              <SIcon size={28} style={{ color: src.color, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="font-mono-cus text-[11px] tracking-[2.5px]" style={{ color: src.color }}>{src.label}</p>
                <p className="font-display text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{src.sub}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono-cus text-[8px] mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>EVIDENCE ID</p>
                <p className="font-mono-cus text-[13px]" style={{ color: src.color }}>#{singleResult.evidence_id}</p>
              </div>
            </div>
            {singleResult.result === 'TAMPERED' && (
              <HashDiff original={singleResult.original_hash} recomputed={singleResult.recomputed_hash} />
            )}
            {singleResult.result === 'INTACT' && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono-cus text-[8px] tracking-[2px] mb-2" style={{ color: 'rgba(0,255,180,0.3)' }}>VERIFIED HASH</p>
                <p className="font-mono-cus text-[9px] break-all" style={{ color: 'rgba(0,255,180,0.5)' }}>{singleResult.original_hash}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch result */}
      <AnimatePresence>
        {batchResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            {/* Summary */}
            <div className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: batchResult.all_clear ? 'rgba(0,255,180,0.06)' : 'rgba(255,77,77,0.06)',
                       border: `1px solid ${batchResult.all_clear ? 'rgba(0,255,180,0.25)' : 'rgba(255,77,77,0.3)'}` }}>
              {batchResult.all_clear
                ? <ShieldCheck size={28} style={{ color: '#00ffb4', flexShrink: 0 }} />
                : <FileWarning  size={28} style={{ color: '#ff4d4d', flexShrink: 0 }} />}
              <div className="flex-1">
                <p className="font-mono-cus text-[11px] tracking-[2.5px]" style={{ color: batchResult.all_clear ? '#00ffb4' : '#ff4d4d' }}>
                  {batchResult.all_clear ? 'ALL EVIDENCE INTACT' : `${batchResult.tampered + batchResult.missing} RECORD(S) FLAGGED`}
                </p>
                <p className="font-display text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Case {batchResult.case_num} · {batchResult.total} records scanned
                </p>
              </div>
              <div className="flex gap-3 text-center shrink-0">
                {[['INTACT', batchResult.intact, '#00ffb4'], ['TAMPERED', batchResult.tampered, '#ff4d4d'], ['MISSING', batchResult.missing, '#f59e0b']].map(([l,v,c]) => (
                  <div key={l}>
                    <p className="font-mono-cus font-bold" style={{ fontSize: 18, color: c, lineHeight: 1 }}>{v}</p>
                    <p className="font-mono-cus text-[7px] tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-record table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid px-4 py-2.5 font-mono-cus text-[8px] tracking-[2px]"
                style={{ gridTemplateColumns: '50px 1fr 80px 80px 1fr', color: 'rgba(255,255,255,0.2)',
                         background: 'rgba(8,13,24,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>ID</span><span>FILENAME</span><span>RESULT</span><span>STATUS</span><span>HASH (original)</span>
              </div>
              {batchResult.records.map((r, i) => (
                <div key={r.evidence_id}
                  className="grid items-center px-4 py-2.5 font-mono-cus text-[9px]"
                  style={{ gridTemplateColumns: '50px 1fr 80px 80px 1fr',
                           borderBottom: i < batchResult.records.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                           background: r.flagged ? 'rgba(255,77,77,0.03)' : 'transparent' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>#{r.evidence_id}</span>
                  <span className="truncate pr-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{r.filename || '—'}</span>
                  <span style={{ color: integrityColor(r.integrity) }}>{r.result}</span>
                  <span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] tracking-wider"
                      style={{ background: integrityBg(r.integrity), color: integrityColor(r.integrity),
                               border: `1px solid ${integrityColor(r.integrity)}30` }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: integrityColor(r.integrity) }} />
                      {(r.integrity || 'unverified').toUpperCase()}
                    </span>
                  </span>
                  <span className="truncate font-mono-cus text-[8px]" style={{ color: r.flagged ? '#ff4d4d' : 'rgba(0,255,180,0.4)' }}>
                    {r.original_hash?.slice(0, 16)}…
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live ledger preview */}
      {ledger.length > 0 && !batchResult && !singleResult && (
        <div>
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
            LEDGER INTEGRITY STATUS ({ledger.length} records)
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {ledger.slice(0, 10).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 font-mono-cus text-[9px]"
                style={{ borderBottom: i < Math.min(ledger.length, 10) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: 32 }}>#{r.id}</span>
                <span className="flex-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.filename || '—'}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', minWidth: 70 }}>{r.case_num}</span>
                <span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] tracking-wider"
                    style={{ background: integrityBg(r.integrity), color: integrityColor(r.integrity),
                             border: `1px solid ${integrityColor(r.integrity)}25` }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: integrityColor(r.integrity) }} />
                    {(r.integrity || 'unverified').toUpperCase()}
                  </span>
                </span>
              </div>
            ))}
            {ledger.length > 10 && (
              <div className="px-4 py-2 text-center font-mono-cus text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                +{ledger.length - 10} more records
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ROOT PAGE
// ══════════════════════════════════════════════════════════════════
export default function VerifyPage() {
  const [tab, setTab] = useState('suspect')

  const TABS = [
    { id: 'suspect',   icon: ScanFace,  label: 'SUSPECT VERIFICATION',  color: '#a855f7' },
    { id: 'integrity', icon: Hash,      label: 'EVIDENCE INTEGRITY',     color: '#00ffb4' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-7 pb-10">

      {/* Header */}
      <div>
        <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>
          PHASE 04 · VERIFICATION SUITE
        </p>
        <h2 className="font-display font-extrabold text-3xl mb-2" style={{ letterSpacing: '-1px' }}>
          Verify & <span style={{ color: '#a855f7' }}>Authenticate</span>
        </h2>
        <p className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          FaceNet 1-to-1 biometric verification · SHA-256 evidence integrity checks
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono-cus text-[10px] tracking-[1.5px] transition-all"
              style={{
                background: active ? `${t.color}10` : 'rgba(255,255,255,0.02)',
                border:     active ? `1px solid ${t.color}35` : '1px solid rgba(255,255,255,0.06)',
                color:      active ? t.color : 'rgba(255,255,255,0.35)',
              }}>
              <Icon size={13} />{t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {tab === 'suspect'   && <SuspectTab />}
          {tab === 'integrity' && <IntegrityTab />}
        </motion.div>
      </AnimatePresence>

      {/* Footer explainer */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <p className="font-mono-cus text-[9px] tracking-[2px] mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
          {tab === 'suspect' ? 'HOW FACENET VERIFICATION WORKS' : 'HOW EVIDENCE INTEGRITY WORKS'}
        </p>
        {(() => {
          const footerItems = tab === 'suspect' ? [
            { color: '#00ffb4', icon: ScanFace,    title: 'Embedding Extraction', body: 'FaceNet encodes every face into 128 numbers representing biometric structure — not pixels.' },
            { color: '#a855f7', icon: Eye,          title: 'Euclidean Distance',   body: 'L2 distance between two embeddings. Lower = more similar. Distance ≤ 0.40 = confirmed match.' },
            { color: '#f59e0b', icon: Lock,         title: 'Sealed to Ledger',     body: 'Every verification — pass or fail — is immutably written to the evidence ledger with a hash.' },
          ] : [
            { color: '#00ffb4', icon: Hash,         title: 'Original Hash',        body: 'SHA-256 fingerprint computed the instant a photo is captured and sealed to the SQLite ledger.' },
            { color: '#ff4d4d', icon: FileWarning,  title: 'Re-Hash on Demand',    body: 'The file on disk is re-hashed at verification time. Any edit — even 1 byte — changes the hash.' },
            { color: '#a855f7', icon: Database,     title: 'Audit Trail',          body: 'Every integrity check is written to integrity_checks table. Tampered records are flagged in the ledger.' },
          ]
          return (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {footerItems.map(({ color, icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <Icon size={12} style={{ color }} />
              </div>
              <div>
                <p className="font-display font-bold text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{title}</p>
                <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
          )
        })()}
      </div>

    </motion.div>
  )
}
