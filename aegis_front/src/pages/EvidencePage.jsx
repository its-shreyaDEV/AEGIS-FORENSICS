import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldAlert, CheckCircle2, Clock, X, RefreshCw, Fingerprint, ScanFace } from 'lucide-react'
import EvidenceTable        from '../components/EvidenceTable'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import { useEvidenceStore } from '../hooks/useEvidenceStore'

// ✅ Resolve image URL from whatever the backend sends.
// Handles: full URL, "/uploads/..." path, or bare "uploads/..." filename.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function resolveImageUrl(record) {
  const raw = record?.file_path || record?.image_url || record?.url || null
  if (!raw) return null
  // Already a full URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  // Relative path — prepend the API base, normalise double slashes
  return `${API_BASE}/${raw.replace(/^\/+/, '')}`
}

// ─────────────────────────────────────────────
// Stat cell
// ─────────────────────────────────────────────
function StatCell({ label, value, color = '#00ffb4', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl p-5"
      style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="font-mono-cus leading-none mb-2" style={{ fontSize: 28, fontWeight: 700, color }}>
        {value}
      </p>
      <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </p>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Blockchain drill-down modal with Image Viewer
// ─────────────────────────────────────────────
function BlockchainModal({ record, onClose }) {
  const timestamp     = record?.time ? new Date(record.time).toLocaleString('en-US') : 'UNKNOWN TIME'
  const predictionText = record?.prediction ? `${record.prediction} (${record.confidence || 0}%)` : 'PENDING ANALYSIS'
  const imageUrl      = resolveImageUrl(record)   // ✅ robust URL resolution

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(4,8,15,0.90)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,255,180,0.1)]"
        style={{ background: '#080d18', border: '1px solid rgba(0,255,180,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT COLUMN — Image Viewer */}
        <div
          className="w-full md:w-2/5 p-6 relative flex flex-col"
          style={{ background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono-cus text-[10px] tracking-[3px]" style={{ color: 'rgba(0,255,180,0.6)' }}>
              VISUAL EVIDENCE
            </p>
            <ScanFace size={14} style={{ color: 'rgba(0,255,180,0.4)' }} />
          </div>

          <div
            className="relative flex-grow rounded-lg overflow-hidden flex items-center justify-center"
            style={{ border: '1px solid rgba(0,255,180,0.15)', background: '#04080f', minHeight: 220 }}
          >
            {/* Corner crosshairs */}
            <div className="absolute top-2 left-2  w-4 h-4 border-t border-l border-[#00ffb4] opacity-50" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#00ffb4] opacity-50" />
            <div className="absolute bottom-2 left-2  w-4 h-4 border-b border-l border-[#00ffb4] opacity-50" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#00ffb4] opacity-50" />

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Forensic Evidence"
                className="max-w-full max-h-full object-contain mix-blend-screen opacity-90"
                // ✅ Fallback if image fails to load (broken URL, CORS, etc.)
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}

            {/* ✅ Always rendered but hidden when image loads fine */}
            <div
              className="text-center"
              style={{ display: imageUrl ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <ShieldAlert size={32} className="mx-auto mb-2 opacity-20" />
              <p className="font-mono-cus text-[10px] tracking-widest text-white/30">
                IMAGE DATA CORRUPTED OR UNAVAILABLE
              </p>
            </div>

            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,180,0.03) 2px, rgba(0,255,180,0.03) 4px)' }}
            />
          </div>

          <div className="mt-4 flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <Fingerprint size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p className="font-mono-cus text-[9px] tracking-widest text-white/30">AEGIS WATERMARK VERIFIED</p>
            </div>
            <p className="font-mono-cus text-[9px] tracking-widest text-[#00ffb4]/50">SECURE ENCLAVE</p>
          </div>
        </div>

        {/* RIGHT COLUMN — Metadata & Blockchain */}
        <div className="w-full md:w-3/5 flex flex-col">
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <p className="font-mono-cus text-[10px] tracking-[2px] mb-0.5" style={{ color: 'rgba(0,255,180,0.45)' }}>
                BLOCKCHAIN RECORD
              </p>
              <p className="font-display font-bold text-lg" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {record.id || 'EVD-UNKNOWN'} · {record.officer || 'SYSTEM'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <X size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          {/* Meta grid */}
          <div
            className="grid px-6 py-5 gap-4"
            style={{ gridTemplateColumns: 'repeat(2,1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {[
              ['TIMESTAMP',    timestamp],
              ['AI MODULE',    record.module  ? record.module.toUpperCase()  : 'UNKNOWN'],
              ['STATUS',       record.status  ? record.status.toUpperCase()  : 'PENDING'],
              ['BLOCK TX',     record.blockTx  || 'PENDING NETWORK CONFIRMATION'],
              ['IPFS CID',     record.ipfsCid  || 'UPLOADING TO IPFS...'],
              ['AI PREDICTION', predictionText],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(0,255,180,0.3)' }}>{k}</p>
                <p className="font-mono-cus text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Blockchain visualizer */}
          <div className="px-6 pt-5 pb-2 flex-grow">
            <BlockchainVisualizer
              hash={record.hash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
              autoPlay
            />
          </div>

          {/* Hash */}
          <div className="px-6 pb-6 mt-auto">
            <p className="font-mono-cus text-[9px] tracking-[2px] mb-2" style={{ color: 'rgba(0,255,180,0.3)' }}>
              IMMUTABLE SHA-256 FINGERPRINT
            </p>
            <p
              className="font-mono-cus text-[10px] break-all leading-relaxed p-3 rounded-lg border-l-2"
              style={{
                background: 'rgba(0,255,180,0.03)',
                borderLeftColor: '#00ffb4',
                borderTop:    '1px solid rgba(0,255,180,0.08)',
                borderRight:  '1px solid rgba(0,255,180,0.08)',
                borderBottom: '1px solid rgba(0,255,180,0.08)',
                color: 'rgba(0,255,180,0.6)',
              }}
            >
              {record.hash || 'Hash calculation pending...'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function EvidencePage() {
  const { log, fetchLedger, isLoading } = useEvidenceStore()
  const navigate = useNavigate()
  const [modalRecord, setModalRecord] = useState(null)

  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (fetchLedger && isMounted) fetchLedger()
    }, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [fetchLedger])

  const safeLog    = Array.isArray(log) ? log : []
  const verified   = safeLog.filter(r => r.status === 'verified').length
  const compromised = safeLog.filter(r => r.status === 'compromised').length
  const pending    = safeLog.filter(r => r.status === 'pending' || !r.status).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>
            PHASE 02 · BLOCKCHAIN LOG
          </p>
          <h2 className="font-display font-extrabold text-3xl mb-3" style={{ letterSpacing: '-1px' }}>
            Evidence <span style={{ color: '#a855f7' }}>Ledger</span>
          </h2>
          <p className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Every record immutably sealed. Hash mismatch = instant tamper flag.
          </p>
        </div>

        <button
          onClick={() => fetchLedger && fetchLedger()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest transition-all hover:bg-white/10 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          SYNC LEDGER
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCell label="TOTAL RECORDS"    value={safeLog.length} color="#00ffb4" delay={0}    />
        <StatCell label="VERIFIED"         value={verified}       color="#00ffb4" delay={0.06} />
        <StatCell label="COMPROMISED"      value={compromised}    color="#ff4d4d" delay={0.12} />
        <StatCell label="PENDING ANALYSIS" value={pending}        color="#a855f7" delay={0.18} />
      </div>

      {/* Tamper alert */}
      <AnimatePresence>
        {compromised > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)' }}
          >
            <ShieldAlert size={15} style={{ color: '#ff4d4d', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-mono-cus text-[10px] tracking-[2px] mb-1" style={{ color: '#ff4d4d' }}>
                WARNING: TAMPER DETECTED — {compromised} RECORD{compromised > 1 ? 'S' : ''} COMPROMISED
              </p>
              <p className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Hash mismatch flagged. Investigate compromised records immediately. Original blockchain record preserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {isLoading ? (
        <div
          className="h-64 flex items-center justify-center font-mono-cus text-[#00ffb4] text-xs tracking-widest animate-pulse border rounded-xl"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(8,13,24,0.4)' }}
        >
          SYNCING DECENTRALIZED LEDGER...
        </div>
      ) : (
        <EvidenceTable data={safeLog} onSelect={setModalRecord} />
      )}

      {/* How immutability works */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(8,13,24,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Database size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
          <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.4)' }}>
            HOW IMMUTABILITY WORKS
          </p>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            {
              Icon: CheckCircle2,
              color: '#00ffb4',
              title: 'Hash Sealing',
              body: 'SHA-256 fingerprint computed the instant a photo is captured. Any single-pixel edit changes the hash completely.',
            },
            {
              Icon: Database,
              color: '#a855f7',
              title: 'Smart Contract',
              body: 'A self-executing contract records who, when, where, and the hash. No human can alter or delete this entry.',
            },
            {
              Icon: Clock,
              color: '#f59e0b',
              title: 'IPFS + Chain',
              body: 'Full-resolution images live on decentralized IPFS. The CID is anchored to the blockchain — no single point of deletion.',
            },
          ].map(({ Icon, color, title, body }) => (
            <div key={title} className="flex gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}
              >
                <Icon size={12} style={{ color }} />
              </div>
              <div>
                <p className="font-display font-bold text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{title}</p>
                <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalRecord && (
          <BlockchainModal record={modalRecord} onClose={() => setModalRecord(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
