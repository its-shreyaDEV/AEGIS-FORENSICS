import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldAlert, CheckCircle2, Clock, X } from 'lucide-react'
import EvidenceTable        from '../components/EvidenceTable'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import { useEvidenceStore } from '../hooks/useEvidenceStore'

// ── Stat cell ─────────────────────────────────────────────
function StatCell({ label, value, color = '#00ffb4', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl p-5"
      style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p
        className="font-mono-cus leading-none mb-2"
        style={{ fontSize: 28, fontWeight: 700, color }}
      >
        {value}
      </p>
      <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </p>
    </motion.div>
  )
}

// ── Blockchain drill-down modal ────────────────────────────
function BlockchainModal({ record, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: '#080d18', border: '1px solid rgba(0,255,180,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="font-mono-cus text-[10px] tracking-[2px] mb-0.5" style={{ color: 'rgba(0,255,180,0.45)' }}>
              BLOCKCHAIN RECORD
            </p>
            <p className="font-display font-bold text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {record.id} · {record.officer}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        {/* Meta grid */}
        <div
          className="grid px-6 py-5 gap-4"
          style={{ gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {[
            ['TIMESTAMP',    new Date(record.time).toLocaleString('en-IN')],
            ['GPS',          record.gps.label],
            ['STATUS',       record.status.toUpperCase()],
            ['BLOCK TX',     record.blockTx || 'PENDING'],
            ['IPFS CID',     record.ipfsCid || 'UPLOADING…'],
            ['WEAPON MATCH', record.weaponMatch?.confidence
              ? `${record.weaponMatch.label} · ${record.weaponMatch.confidence}%`
              : record.weaponMatch?.label || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(0,255,180,0.3)' }}>{k}</p>
              <p className="font-mono-cus text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Blockchain visualizer */}
        <div className="p-6">
          <BlockchainVisualizer hash={record.hash} autoPlay />
        </div>

        {/* Hash */}
        <div className="px-6 pb-6">
          <p className="font-mono-cus text-[9px] tracking-[2px] mb-2" style={{ color: 'rgba(0,255,180,0.3)' }}>
            SHA-256 FINGERPRINT
          </p>
          <p
            className="font-mono-cus text-[10px] break-all leading-relaxed p-3 rounded-lg"
            style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.08)', color: 'rgba(0,255,180,0.45)' }}
          >
            {record.hash}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────
export default function EvidencePage() {
  const { log } = useEvidenceStore()
  const navigate = useNavigate()
  const [modalRecord, setModalRecord] = useState(null)

  const verified    = log.filter(r => r.status === 'verified').length
  const compromised = log.filter(r => r.status === 'compromised').length
  const pending     = log.filter(r => r.phase < 3).length

  const handleSelect = (record) => setModalRecord(record)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <div>
        <p
          className="font-mono-cus text-[10px] tracking-[3px] mb-2"
          style={{ color: 'rgba(0,255,180,0.4)' }}
        >
          PHASE 02 · BLOCKCHAIN LOG
        </p>
        <h2
          className="font-display font-extrabold text-3xl mb-3"
          style={{ letterSpacing: '-1px' }}
        >
          Evidence <span style={{ color: '#a855f7' }}>Ledger</span>
        </h2>
        <p className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Every record immutably sealed. Hash mismatch = instant tamper flag.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCell label="TOTAL RECORDS"   value={log.length}  color="#00ffb4" delay={0}    />
        <StatCell label="VERIFIED"        value={verified}    color="#00ffb4" delay={0.06} />
        <StatCell label="COMPROMISED"     value={compromised} color="#ff4d4d" delay={0.12} />
        <StatCell label="PENDING ANALYSIS"value={pending}     color="#a855f7" delay={0.18} />
      </div>

      {/* Tamper alert banner — only if any compromised */}
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
                ⚠ TAMPER DETECTED — {compromised} RECORD{compromised > 1 ? 'S' : ''} COMPROMISED
              </p>
              <p className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Hash mismatch flagged. Investigate EVD-0040 immediately. Original blockchain record preserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <EvidenceTable data={log} onSelect={handleSelect} />

      {/* How the blockchain works — quick explainer strip */}
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

      {/* Blockchain drill-down modal */}
      <AnimatePresence>
        {modalRecord && (
          <BlockchainModal record={modalRecord} onClose={() => setModalRecord(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
