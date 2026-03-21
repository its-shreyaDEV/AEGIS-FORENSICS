import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HyperspeedBackground from './components/HyperspeedBackground'
import TopNav               from './components/TopNav'
import StatsBar             from './components/StatsBar'
import AnimatedUploadZone   from './components/AnimatedUploadZone'
import ResultsPanel         from './components/ResultsPanel'
import { RotateCcw }        from 'lucide-react'

export default function App() {
  const [evidence, setEvidence] = useState(null)

  return (
    <div className="relative min-h-screen" style={{ background: '#04080f' }}>
      {/* Animated canvas background */}
      <HyperspeedBackground />

      {/* Top nav */}
      <TopNav />

      {/* Page content */}
      <main
        className="relative mx-auto px-8 pt-24 pb-20"
        style={{ maxWidth: '1200px', zIndex: 1 }}
      >

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="mb-10"
        >
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-3" style={{ color: 'rgba(0,255,180,0.4)' }}>
            AUTOMATED EVIDENCE GUARD & IDENTIFICATION SYSTEM
          </p>
          <h1
            className="font-display font-extrabold leading-none mb-4"
            style={{ fontSize: 'clamp(40px, 6vw, 72px)', letterSpacing: '-2px' }}
          >
            Forensic Evidence{' '}
            <span style={{ color: '#00ffb4', textShadow: '0 0 40px rgba(0,255,180,0.35)' }}>
              Secured.
            </span>
          </h1>
          <p className="font-display text-sm max-w-xl leading-loose" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Blockchain-verified capture · real-time face detection · CNN wound-weapon matching ·
            immutable chain of custody
          </p>
        </motion.div>

        {/* Stats */}
        <StatsBar />

        {/* Upload / Results */}
        <AnimatePresence mode="wait">
          {!evidence ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
            >
              <div className="max-w-2xl mx-auto">
                <p className="font-mono-cus text-[10px] tracking-[3px] mb-4 text-center" style={{ color: 'rgba(0,255,180,0.35)' }}>
                  PHASE 01 · SMART EVIDENCE CAPTURE
                </p>
                <AnimatedUploadZone onFile={setEvidence} />

                {/* Feature chips */}
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {[
                    'SHA-256 HASH',
                    'GPS STAMP',
                    'PRIVACY MASK',
                    'BLOCKCHAIN SEAL',
                    'FACE DETECTION',
                  ].map(feat => (
                    <span
                      key={feat}
                      className="px-3 py-1 rounded-full font-mono-cus text-[9px] tracking-[1.5px]"
                      style={{
                        background: 'rgba(0,255,180,0.04)',
                        border: '1px solid rgba(0,255,180,0.12)',
                        color: 'rgba(0,255,180,0.5)',
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono-cus text-[10px] tracking-[3px]" style={{ color: 'rgba(0,255,180,0.4)' }}>
                    PHASE 03 · FORENSIC ANALYSIS COMPLETE
                  </p>
                  <p className="font-display font-bold text-lg mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Evidence processed and sealed
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEvidence(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono-cus text-[10px] tracking-widest transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,180,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,255,180,0.2)'; e.currentTarget.style.color = 'rgba(0,255,180,0.8)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
                >
                  <RotateCcw size={11} />
                  NEW EVIDENCE
                </motion.button>
              </div>

              <ResultsPanel evidence={evidence} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="relative border-t flex items-center justify-between px-8 py-5 font-mono-cus text-[9px] tracking-[1.5px]"
        style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', zIndex: 1 }}
      >
        <span>AEGIS-FORENSICS v1.0 · AUTOMATED EVIDENCE GUARD & IDENTIFICATION SYSTEM</span>
        <span>SECURE · IMMUTABLE · ADMISSIBLE</span>
      </footer>
    </div>
  )
}
