import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import StatsBar             from '../components/StatsBar'
import AnimatedUploadZone   from '../components/AnimatedUploadZone'
import ResultsPanel         from '../components/ResultsPanel'
import PhaseTimeline        from '../components/PhaseTimeline'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import { useEvidenceStore } from '../hooks/useEvidenceStore'
import { analyzeEvidenceAtBackend } from '../utils/api'

export default function Dashboard() {
  const [evidence,     setEvidence]     = useState(null)
  const [isAnalyzing,  setIsAnalyzing]  = useState(false)

  // Pull live count from store so it updates dynamically
  const { add, log, fetchLedger } = useEvidenceStore()
  const navigate = useNavigate()

  // Fetch ledger on mount so stats are accurate
  useEffect(() => { fetchLedger() }, [fetchLedger])

  const handleFile = async (uploadData) => {
    setIsAnalyzing(true)
    setEvidence(null)

    try {
      // Call backend CNN immediately with the selected module
      const aiResults = await analyzeEvidenceAtBackend(
        uploadData.file,
        uploadData.moduleType,
        'Field Operator',
        'CAS-QUICK'
      )

      // Merge CNN results into the evidence object
      const enriched = {
        ...uploadData,
        prediction:  aiResults.prediction,
        confidence:  aiResults.confidence,
        module_used: aiResults.module_used,
        file_path:   aiResults.file_path,
      }

      // Save to store
      add({
        officer:    'Field Operator',
        caseNum:    'CAS-QUICK',
        hash:       uploadData.hash,
        prediction: aiResults.prediction,
        confidence: aiResults.confidence,
        module:     aiResults.module_used,
        filename:   uploadData.name,
        file_path:  aiResults.file_path,
      })

      setEvidence(enriched)
    } catch (err) {
      console.error('Quick analysis failed:', err)
      alert(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-10"
    >
      {/* ── Hero ── */}
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

      {/* ── Upload zone or CNN results ── */}
      {!evidence ? (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full">
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-4 text-center" style={{ color: 'rgba(0,255,180,0.3)' }}>
            PHASE 01 · DROP EVIDENCE TO BEGIN
          </p>

          {/* Show spinner while CNN is running */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl"
              style={{ border: '1px solid rgba(0,255,180,0.15)', background: 'rgba(0,255,180,0.02)' }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,180,0.5)', borderTopColor: 'transparent' }} />
              <p className="font-mono-cus text-[10px] tracking-[3px] animate-pulse" style={{ color: '#00ffb4' }}>
                AEGIS CNN PROCESSING...
              </p>
            </div>
          ) : (
            <AnimatedUploadZone onFile={handleFile} />
          )}

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
              <p className="font-mono-cus text-[10px] tracking-[3px]" style={{ color: 'rgba(0,255,180,0.4)' }}>
                CNN ANALYSIS COMPLETE
              </p>
              <p className="font-display font-bold text-lg mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Evidence processed · {evidence.prediction}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Proceed to full capture flow */}
              <button
                onClick={() => navigate('/capture', { state: { prefill: enriched } })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest"
                style={{ background: '#00ffb4', color: '#04080f', fontWeight: 700 }}
              >
                PROCEED TO PHASE 2 →
              </button>
              <button
                onClick={() => setEvidence(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              >
                <RotateCcw size={11} /> NEW
              </button>
            </div>
          </div>

          {/* Results panel — no hash shown here */}
          <ResultsPanel evidence={evidence} showHash={false} />

          {/* Blockchain flow */}
          <div className="mt-8">
            <p className="font-mono-cus text-[10px] tracking-[3px] mb-4" style={{ color: 'rgba(0,255,180,0.3)' }}>
              PHASE 02 · BLOCKCHAIN TRANSACTION
            </p>
            <BlockchainVisualizer hash={evidence.hash} />
          </div>
        </motion.div>
      )}

      {/* ── Quick links — dynamic count, now includes Verify ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          { to: '/evidence', label: 'View Evidence Log',  sub: `${log.length} records sealed`,           color: '#a855f7' },
          { to: '/analysis', label: 'Forensic Analysis',  sub: 'CNN · Segmentation · Timeline',           color: '#ff4d4d' },
          { to: '/verify',   label: 'Verify & Authenticate', sub: 'Hash check · Suspect ID · Integrity', color: '#00ffb4' },
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
