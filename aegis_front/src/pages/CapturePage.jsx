import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import AnimatedUploadZone   from '../components/AnimatedUploadZone'
import BlockchainVisualizer from '../components/BlockchainVisualizer'
import LetterGlitchHash     from '../components/LetterGlitchHash'
import TiltedEvidenceCard   from '../components/TiltedEvidenceCard'
import { useEvidenceStore } from '../hooks/useEvidenceStore'
import { CheckCircle2, MapPin, User, FileDigit } from 'lucide-react'
import { analyzeEvidenceAtBackend } from '../utils/api'

// ── Small metadata field display ──────────────────────────
function Field({ label, value, mono = false, dim = false }) {
  return (
    <div>
      <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(0,255,180,0.35)' }}>{label}</p>
      <p className={`text-sm ${mono ? 'font-mono-cus' : 'font-display font-semibold'}`}
        style={{ color: dim ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)' }}>
        {value}
      </p>
    </div>
  )
}

// ── Grab GPS + timestamp + device from browser ────────────
const captureBrowserMetadata = () => {
  return new Promise((resolve) => {
    const metadata = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      deviceType: /Mobile|Android|iP(ad|hone)/.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Workstation',
      location: 'Locating...'
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          metadata.location = `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`
          resolve(metadata)
        },
        () => { metadata.location = 'Location Access Denied'; resolve(metadata) },
        { timeout: 5000 }
      )
    } else {
      metadata.location = 'GPS Unavailable'
      resolve(metadata)
    }
  })
}

export default function CapturePage() {
  const [evidence,     setEvidence]     = useState(null)
  const [officer,      setOfficer]      = useState('')
  const [badge,        setBadge]        = useState('')
  const [caseNum,      setCaseNum]      = useState('')
  const [sealed,       setSealed]       = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)


  const location = useLocation()
  useEffect(() => {
    if (location.state?.prefill) {
      setEvidence(location.state.prefill)
    }
  }, [])
  

  // Metadata shown in right panel
  const [metaInfo, setMetaInfo] = useState({
    timestamp:  new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    location:   'Awaiting Capture...',
    deviceType: 'Scanning...'
  })

  const { add }  = useEvidenceStore()
  const navigate = useNavigate()

  // ── Step 1: File selected → show preview ──────────────
  const handleFile = async (uploadData) => {
    setEvidence(uploadData)
    setSealed(false)
    const browserMeta = await captureBrowserMetadata()
    setMetaInfo(browserMeta)
  }

  // ── Step 2: Officer clicks SEAL ───────────────────────
  const handleSeal = async () => {
    if (!evidence) return
    if (!officer || !badge || !caseNum) {
      alert('CRITICAL: All Officer Details (Name, Badge, Case #) must be filled before sealing evidence.')
      return
    }

    setIsProcessing(true)
    setSealed(true)

    try {
      // Send image to Python backend → CNN inference
      const aiResults = await analyzeEvidenceAtBackend(
        evidence.file,
        evidence.moduleType,
        `${officer} (${badge})`,
        caseNum
      )

      // Save to local store with ALL fields including CNN results
      add({
        officer:    officer,
        badge:      badge,
        caseNum:    caseNum,
        gps:        { label: metaInfo.location },
        hash:       evidence.hash,
        prediction: aiResults.prediction,   // ← CNN label e.g. "Biological / Bloodstain Confirmed"
        confidence: aiResults.confidence,   // ← CNN score e.g. 94.2
        module:     aiResults.module_used,  // ← which model ran
        filename:   evidence.name,
        file_path:  aiResults.file_path,    // ← URL to saved image on server
      })

      // Build final payload for analysis page
      const finalizedEvidence = {
        ...evidence,
        officer,
        badge,
        caseNum,
        browserMetadata: metaInfo,
        exifMetadata:    aiResults.metadata,
        prediction:      aiResults.prediction,
        confidence:      aiResults.confidence,
        module_used:     aiResults.module_used,
        bounding_box:    aiResults.bounding_box || null,
      }

      // Wait for blockchain visualizer to finish, then route to analysis
      setTimeout(() => {
        navigate('/analysis', { state: { evidence: finalizedEvidence } })
      }, 3500)

    } catch (error) {
      console.error('Pipeline Error:', error)
      alert(error.message)
      setSealed(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">

      {/* ── Header ── */}
      <div>
        <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>PHASE 01</p>
        <h2 className="font-display font-extrabold text-3xl" style={{ letterSpacing: '-1px' }}>
          Smart Evidence <span style={{ color: '#00ffb4' }}>Capture</span>
        </h2>
        <p className="font-display text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Every photo is GPS-stamped, privacy-masked, and SHA-256 sealed the instant it's taken.
        </p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>

        {/* ── Left: upload zone or evidence preview ── */}
        <div className="flex flex-col gap-5">
          {!evidence ? (
            <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
              <AnimatedUploadZone onFile={handleFile} />
            </div>
          ) : (
            <>
              {/* 3D tilt card showing the uploaded image */}
              <TiltedEvidenceCard evidence={evidence} />

              {/* SHA-256 glitch hash reveal */}
              <LetterGlitchHash hash={evidence.hash} />

              {/* Seal button or transmission status */}
              {!sealed ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSeal}
                  className="w-full py-4 rounded-xl font-display font-bold text-sm tracking-widest transition-all"
                  style={{ background: '#00ffb4', color: '#04080f', letterSpacing: '2px' }}
                >
                  ◎  SEAL & TRANSMIT TO AEGIS CORE
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-mono-cus text-[11px] tracking-widest"
                  style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.25)', color: '#00ffb4' }}
                >
                  {isProcessing
                    ? <span className="animate-pulse">TRANSMITTING SECURE PAYLOAD...</span>
                    : <><CheckCircle2 size={14} /> EVIDENCE SEALED · ROUTING TO ANALYSIS</>
                  }
                </motion.div>
              )}

              {/* Reset button */}
              {!sealed && (
                <button
                  onClick={() => { setEvidence(null); setSealed(false) }}
                  className="font-mono-cus text-[10px] tracking-widest text-center mt-2"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  CAPTURE NEW EVIDENCE →
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Right: officer fields + auto metadata ── */}
        <div className="flex flex-col gap-4">

          {/* Officer details form */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
              <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.45)' }}>OFFICER DETAILS</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'OFFICER NAME', val: officer,  set: setOfficer,  ph: 'Off. R. Sharma'   },
                { label: 'BADGE NUMBER', val: badge,    set: setBadge,    ph: 'OD-4471'          },
                { label: 'CASE NUMBER',  val: caseNum,  set: setCaseNum,  ph: 'CAS-2024-0042'    },
              ].map(f => (
                <div key={f.label}>
                  <p className="font-mono-cus text-[9px] tracking-[2px] mb-1" style={{ color: 'rgba(0,255,180,0.3)' }}>{f.label}</p>
                  <input
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    disabled={sealed}
                    className="w-full rounded-lg px-3 py-2 font-mono-cus text-xs outline-none transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,255,180,0.3)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Auto-captured metadata (GPS, time, device) */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={12} style={{ color: 'rgba(0,255,180,0.5)' }} />
              <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.45)' }}>AUTO-CAPTURED METADATA</p>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="GPS COORDINATES" value={metaInfo.location}                         mono />
              <Field label="TIMESTAMP (UTC)"  value={metaInfo.timestamp}                        mono />
              <Field label="DEVICE"           value={`AEGIS NODE · ${metaInfo.deviceType}`}         />
            </div>
          </div>

          {/* Privacy mask notice */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,255,180,0.03)', border: '1px solid rgba(0,255,180,0.1)' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileDigit size={12} style={{ color: '#00ffb4' }} />
              <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.5)' }}>PRIVACY MASK · ACTIVE</p>
            </div>
            <p className="font-display text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Medical image processing automatically detects and masks sensitive regions.
              Encrypted full-resolution copy retained for authorized personnel only.
            </p>
          </div>
        </div>
      </div>

      {/* ── Blockchain visualizer — shown after sealing ── */}
      {sealed && evidence && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono-cus text-[10px] tracking-[3px] mb-4" style={{ color: 'rgba(0,255,180,0.3)' }}>
            PHASE 02 · BLOCKCHAIN TRANSACTION IN PROGRESS
          </p>
          <BlockchainVisualizer hash={evidence.hash} autoPlay={true} />
        </motion.div>
      )}

    </motion.div>
  )
}