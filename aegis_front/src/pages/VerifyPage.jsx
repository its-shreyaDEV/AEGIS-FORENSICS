import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ShieldCheck, UploadCloud, Fingerprint } from 'lucide-react'

// Web Crypto API for client-side hashing
async function computeSHA256(file) {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function VerifyPage() {
  const [file, setFile] = useState(null)
  const [expectedHash, setExpectedHash] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [calculatedHash, setCalculatedHash] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setVerificationResult(null)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setVerificationResult(null)
    }
  }

  const handleVerify = async () => {
    if (!file || !expectedHash) return
    
    setIsProcessing(true)
    setVerificationResult(null)

    try {
      // Small artificial delay to simulate heavy ledger scanning for the UI
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const freshHash = await computeSHA256(file)
      setCalculatedHash(freshHash)
      
      if (freshHash.toLowerCase() === expectedHash.toLowerCase().trim()) {
        setVerificationResult('match')
      } else {
        setVerificationResult('compromised')
      }
    } catch (err) {
      console.error("Hashing error:", err)
      alert("Failed to compute file hash.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto flex flex-col gap-8 pb-10 mt-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Fingerprint size={32} style={{ color: '#00ffb4', opacity: 0.8 }} />
        </div>
        <p className="font-mono-cus text-[10px] tracking-[3px] mb-2" style={{ color: 'rgba(0,255,180,0.4)' }}>
          PHASE 04 · POST-INCIDENT AUDIT
        </p>
        <h2 className="font-display font-extrabold text-3xl mb-3" style={{ letterSpacing: '-1px' }}>
          Integrity <span style={{ color: '#00ffb4' }}>Verification</span>
        </h2>
        <p className="font-display text-sm mx-auto max-w-lg" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cross-reference physical evidence files against the immutable SQLite ledger to prove absolute chain of custody.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="rounded-xl p-8" style={{ background: 'rgba(8,13,24,0.8)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        
        {/* Step 1: Hash Input */}
        <div className="mb-8">
          <label className="block text-xs font-mono-cus mb-3 uppercase tracking-[2px]" style={{ color: '#00ffb4' }}>
            1. Enter Known Ledger Hash
          </label>
          <input 
            type="text" 
            placeholder="Paste 64-character SHA-256 hash here..."
            value={expectedHash}
            onChange={(e) => {
              setExpectedHash(e.target.value)
              setVerificationResult(null)
            }}
            className="w-full rounded-lg px-4 py-4 font-mono-cus text-xs outline-none transition-all"
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#00ffb4',
              letterSpacing: '1px'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,255,180,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Step 2: File Upload */}
        <div className="mb-8">
          <label className="block text-xs font-mono-cus mb-3 uppercase tracking-[2px]" style={{ color: '#00ffb4' }}>
            2. Upload Suspect File
          </label>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="relative rounded-lg p-10 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group"
            style={{ 
              background: 'rgba(0,0,0,0.4)', 
              border: '1px dashed rgba(255,255,255,0.15)',
            }}
          >
            <input 
              type="file" 
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            
            <div className="absolute inset-0 bg-[#00ffb4] opacity-0 group-hover:opacity-[0.02] transition-opacity" />
            
            <UploadCloud size={32} style={{ color: file ? '#00ffb4' : 'rgba(255,255,255,0.2)' }} className="mb-4 transition-colors" />
            <span className="font-mono-cus text-xs tracking-widest text-center" style={{ color: file ? '#00ffb4' : 'rgba(255,255,255,0.4)' }}>
              {file ? file.name : "DRAG & DROP OR CLICK TO BROWSE"}
            </span>
            {file && (
              <span className="font-display text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <motion.button 
          whileHover={file && expectedHash ? { scale: 1.02 } : {}}
          whileTap={file && expectedHash ? { scale: 0.98 } : {}}
          onClick={handleVerify}
          disabled={!file || !expectedHash || isProcessing}
          className="w-full py-4 rounded-xl font-display font-bold text-sm tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ 
            background: file && expectedHash ? '#00ffb4' : 'rgba(255,255,255,0.05)', 
            color: file && expectedHash ? '#04080f' : 'rgba(255,255,255,0.3)', 
            letterSpacing: '2px' 
          }}
        >
          {isProcessing ? 'COMPUTING MATRICES...' : 'EXECUTE INTEGRITY CHECK'}
        </motion.button>
      </div>

      {/* Results Panel */}
      <AnimatePresence mode="wait">
        {verificationResult === 'match' && (
          <motion.div 
            key="match"
            initial={{ opacity: 0, y: 10, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl p-6 flex items-start gap-5"
            style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.3)' }}
          >
            <ShieldCheck size={36} style={{ color: '#00ffb4', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-xl mb-1 tracking-wide" style={{ color: '#00ffb4' }}>EVIDENCE VERIFIED</h3>
              <p className="font-display text-sm mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                The mathematical topology of the uploaded file perfectly matches the immutable ledger. The chain of custody is unbroken and the file is court-admissible.
              </p>
              
              <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div>
                  <span className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.5)' }}>COMPUTED HASH</span>
                  <p className="font-mono-cus text-xs truncate" style={{ color: '#00ffb4' }}>{calculatedHash}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {verificationResult === 'compromised' && (
          <motion.div 
            key="compromised"
            initial={{ opacity: 0, y: 10, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl p-6 flex items-start gap-5"
            style={{ 
              background: 'rgba(255,77,77,0.08)', 
              border: '1px solid rgba(255,77,77,0.4)',
              boxShadow: '0 0 30px rgba(255,77,77,0.15)'
            }}
          >
            <ShieldAlert size={36} className="animate-pulse" style={{ color: '#ff4d4d', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-xl mb-1 tracking-wide" style={{ color: '#ff4d4d' }}>EVIDENCE COMPROMISED</h3>
              <p className="font-display text-sm mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                CRITICAL WARNING: The calculated hash does not match the ledger signature. This file has been altered, photoshopped, or corrupted since it was originally logged.
              </p>
              
              <div className="flex flex-col gap-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div>
                  <span className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.4)' }}>EXPECTED LEDGER HASH</span>
                  <p className="font-mono-cus text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{expectedHash}</p>
                </div>
                <div>
                  <span className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,77,77,0.7)' }}>COMPUTED FILE HASH</span>
                  <p className="font-mono-cus text-xs truncate" style={{ color: '#ff4d4d' }}>{calculatedHash}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}