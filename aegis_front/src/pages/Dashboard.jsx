import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import StatsBar           from '../components/StatsBar'
import AnimatedUploadZone from '../components/AnimatedUploadZone'
import ResultsPanel       from '../components/ResultsPanel'
import PhaseTimeline      from '../components/PhaseTimeline'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import { useEvidenceStore } from '../hooks/useEvidenceStore'

export default function Dashboard() {
  const [evidence, setEvidence] = useState(null)
  const { add } = useEvidenceStore()

  const handleFile = (ev) => {
    setEvidence(ev)
    // persist to store
    add({
      officer: 'Off. Field Operator',
      gps: { lat: 20.2961, lng: 85.8245, label: '20.2961°N, 85.8245°E' },
      hash: ev.hash,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-10"
    >
      {/* Hero */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-mono-cus text-[10px] tracking-[3px] mb-3"
          style={{ color: 'rgba(0,255,180,0.4)' }}
        >
          AUTOMATED EVIDENCE GUARD & IDENTIFICATION SYSTEM
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="font-display font-extrabold leading-none mb-4"
          style={{ fontSize: 'clamp(36px,5.5vw,68px)', letterSpacing: '-2px' }}
        >
          Forensic Evidence{' '}
          <span style={{ color: '#00ffb4', textShadow: '0 0 40px rgba(0,255,180,0.3)' }}>Secured.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="font-display text-sm max-w-lg leading-loose"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Blockchain-verified capture · real-time face detection · CNN wound-weapon
          matching · immutable chain of custody
        </motion.p>
      </div>

      <StatsBar />
      <PhaseTimeline activePhase={evidence ? 3 : null} />

      {/* Upload or Results */}
      {!evidence ? (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full">
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-4 text-center" style={{ color: 'rgba(0,255,180,0.3)' }}>
            PHASE 01 · DROP EVIDENCE TO BEGIN
          </p>
          <AnimatedUploadZone onFile={handleFile} />
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {['SHA-256 HASH', 'GPS STAMP', 'PRIVACY MASK', 'BLOCKCHAIN SEAL', 'FACE DETECTION'].map(f => (
              <span key={f} className="px-3 py-1 rounded-full font-mono-cus text-[9px] tracking-[1.5px]"
                style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.1)', color: 'rgba(0,255,180,0.4)' }}>
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-mono-cus text-[10px] tracking-[3px]" style={{ color: 'rgba(0,255,180,0.4)' }}>ANALYSIS COMPLETE</p>
              <p className="font-display font-bold text-lg mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Evidence processed and sealed</p>
            </div>
            <button
              onClick={() => setEvidence(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              <RotateCcw size={11} /> NEW EVIDENCE
            </button>
          </div>
          <ResultsPanel evidence={evidence} />

          {/* Blockchain flow */}
          <div className="mt-8">
            <p className="font-mono-cus text-[10px] tracking-[3px] mb-4" style={{ color: 'rgba(0,255,180,0.3)' }}>
              PHASE 02 · BLOCKCHAIN TRANSACTION
            </p>
            <BlockchainVisualizer hash={evidence.hash} />
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {[
          { to: '/evidence', label: 'View Evidence Log', sub: `${5} records sealed`, color: '#a855f7' },
          { to: '/analysis', label: 'Forensic Analysis', sub: 'CNN · Segmentation · Timeline', color: '#ff4d4d' },
        ].map(card => (
          <Link
            key={card.to} to={card.to}
            className="rounded-xl p-5 block no-underline transition-all"
            style={{ background: 'rgba(8,13,24,0.7)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${card.color}30`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
          >
            <p className="font-display font-bold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{card.label}</p>
            <p className="font-mono-cus text-[10px]" style={{ color: `${card.color}80` }}>{card.sub}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
