import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileImage, AlertCircle, Crosshair } from 'lucide-react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']

// Local hash generator for immediate UI feedback before backend transmission
async function computeLocalHash(file) {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function AnimatedUploadZone({ onFile }) {
  const [isDragActive, setDragActive]   = useState(false)
  const [isDragReject, setDragReject]   = useState(false)
  const [isProcessing, setProcessing]   = useState(false)
  const [moduleType, setModuleType]     = useState('bloodstain')

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const types = [...(e.dataTransfer?.items || [])].map(i => i.type)
    if (e.type === 'dragenter' || e.type === 'dragover') {
      const valid = types.length === 0 || types.some(t => ACCEPTED.includes(t))
      setDragActive(true)
      setDragReject(!valid)
    } else {
      setDragActive(false)
      setDragReject(false)
    }
  }, [])

  const processFile = useCallback(async (file) => {
    if (!file || !ACCEPTED.includes(file.type)) return
    setProcessing(true)
    
    try {
      // 1. Generate local preview URL
      const url = URL.createObjectURL(file)
      
      // 2. Generate initial cryptographic hash for the UI
      const localHash = await computeLocalHash(file)

      // 3. Pass data UP to CapturePage (CapturePage handles the API call now)
      onFile({ 
        file, 
        url, 
        hash: localHash, 
        name: file.name, 
        size: file.size,
        moduleType: moduleType // Pass the selected AI module up
      })
    } catch (error) {
      console.error("Local processing failed:", error);
      alert("Failed to read file.");
    } finally {
      setProcessing(false)
    }
  }, [onFile, moduleType])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    setDragReject(false)
    const file = e.dataTransfer?.files?.[0]
    processFile(file)
  }, [processFile])

  const handleInput = useCallback((e) => {
    processFile(e.target.files?.[0])
    e.target.value = ''
  }, [processFile])

  const borderColor = isDragReject
    ? 'rgba(255,77,77,0.6)'
    : isDragActive
      ? 'rgba(0,255,180,0.7)'
      : 'rgba(0,255,180,0.15)'

  const bgColor = isDragReject
    ? 'rgba(255,77,77,0.04)'
    : isDragActive
      ? 'rgba(0,255,180,0.06)'
      : 'rgba(0,255,180,0.02)'

  return (
    <div className="flex flex-col gap-4">
      
      {/* MODULE SELECTOR DROPDOWN */}
      <div className="flex items-center justify-between bg-ink-950/50 p-3 rounded-lg border border-[rgba(0,255,180,0.2)]">
        <div className="flex items-center gap-2">
          <Crosshair size={18} className="text-[#00ffb4]" />
          <span className="font-mono-cus text-xs tracking-widest text-[#00ffb4]/80">TARGET AI MODULE:</span>
        </div>
        <select 
          value={moduleType} 
          onChange={(e) => setModuleType(e.target.value)}
          disabled={isProcessing}
          className="bg-transparent text-white font-mono-cus text-sm outline-none border-b border-[#00ffb4]/30 pb-1 cursor-pointer focus:border-[#00ffb4]"
        >
          <option value="bloodstain" className="bg-[#04080f] text-white">Biological / Bloodstain</option>
          <option value="ballistics" className="bg-[#04080f] text-white">Ballistics & Casings</option>
          <option value="damage" className="bg-[#04080f] text-white">Vehicle Damage</option>
          <option value="toolmarks" className="bg-[#04080f] text-white">Microscopic Toolmarks</option>
          <option value="facial_recognition" className="bg-[#04080f] text-white">Facial Recognition (DeepFace)</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16,1,0.3,1] }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative rounded-xl overflow-hidden cursor-pointer select-none"
        style={{
          border: `1px solid ${borderColor}`,
          background: bgColor,
          transition: 'border-color 0.25s, background 0.25s',
          boxShadow: isDragActive
            ? `0 0 40px rgba(0,255,180,0.15), inset 0 0 40px rgba(0,255,180,0.05)`
            : 'none',
        }}
      >
        {/* Corner accents */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <span
            key={i}
            className={`absolute w-3 h-3 ${pos}`}
            style={{
              borderTop:    i < 2   ? `1.5px solid ${isDragActive ? '#00ffb4' : 'rgba(0,255,180,0.35)'}` : 'none',
              borderBottom: i >= 2  ? `1.5px solid ${isDragActive ? '#00ffb4' : 'rgba(0,255,180,0.35)'}` : 'none',
              borderLeft:   i%2===0 ? `1.5px solid ${isDragActive ? '#00ffb4' : 'rgba(0,255,180,0.35)'}` : 'none',
              borderRight:  i%2===1 ? `1.5px solid ${isDragActive ? '#00ffb4' : 'rgba(0,255,180,0.35)'}` : 'none',
              transition: 'border-color 0.25s',
            }}
          />
        ))}

        {/* Scanline when drag active */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ top: '-4px', opacity: 0.8 }}
              animate={{ top: '100%', opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, #00ffb4, transparent)', zIndex: 10 }}
            />
          )}
        </AnimatePresence>

        <label className="flex flex-col items-center justify-center gap-5 py-16 px-8 cursor-pointer">
          <input
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={handleInput}
            disabled={isProcessing}
          />

          {/* Icon */}
          <motion.div
            animate={isDragActive ? { scale: 1.15, rotate: [-2, 2, -2] } : { scale: 1, rotate: 0 }}
            transition={isDragActive ? { duration: 0.4, repeat: Infinity } : {}}
            className="relative"
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{
                background: isDragReject
                  ? 'rgba(255,77,77,0.1)'
                  : 'rgba(0,255,180,0.06)',
                border: `1px solid ${isDragReject ? 'rgba(255,77,77,0.3)' : 'rgba(0,255,180,0.2)'}`,
                transition: 'all 0.25s',
              }}
            >
              {isDragReject
                ? <AlertCircle size={28} style={{ color: '#ff4d4d' }} />
                : isDragActive
                  ? <FileImage size={28} style={{ color: '#00ffb4' }} />
                  : <UploadCloud size={28} style={{ color: 'rgba(0,255,180,0.7)' }} />
              }
            </div>
            {isDragActive && !isDragReject && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(0,255,180,0.15), transparent 70%)', filter: 'blur(6px)' }}
              />
            )}
          </motion.div>

          {/* Text */}
          <div className="text-center">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.p key="proc"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="font-mono-cus text-xs tracking-widest"
                  style={{ color: '#00ffb4' }}
                >
                  PREPARING EVIDENCE ENCRYPTION...
                </motion.p>
              ) : isDragReject ? (
                <motion.p key="rej"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="font-mono-cus text-xs tracking-widest" style={{ color: '#ff4d4d' }}
                >
                  INVALID FILE TYPE
                </motion.p>
              ) : isDragActive ? (
                <motion.p key="drop"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="font-mono-cus text-xs tracking-widest text-glow" style={{ color: '#00ffb4' }}
                >
                  RELEASE TO INITIATE SCAN
                </motion.p>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-display font-semibold text-base mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Drop crime scene image here
                  </p>
                  <p className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.4)' }}>
                    OR CLICK TO BROWSE · JPG / PNG / TIFF
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Processing bar */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ width: 0, opacity: 1 }}
                animate={{ width: '80%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="h-px rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #00ffb4, transparent)' }}
              />
            )}
          </AnimatePresence>
        </label>
      </motion.div>
    </div>
  )
}