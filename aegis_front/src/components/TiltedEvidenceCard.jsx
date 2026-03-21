import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ZoomIn, Maximize2, CheckCircle2 } from 'lucide-react'

const STIFFNESS = 120
const DAMPING   = 18

export default function TiltedEvidenceCard({ evidence }) {
  const cardRef   = useRef(null)
  const [hovered, setHovered] = useState(false)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const springX = useSpring(rawX, { stiffness: STIFFNESS, damping: DAMPING })
  const springY = useSpring(rawY, { stiffness: STIFFNESS, damping: DAMPING })

  const rotateX  = useTransform(springY, [-0.5,  0.5], [ 12, -12])
  const rotateY  = useTransform(springX, [-0.5,  0.5], [-12,  12])
  const glowX    = useTransform(springX, [-0.5,  0.5], ['0%', '100%'])
  const glowY    = useTransform(springY, [-0.5,  0.5], ['0%', '100%'])

  const onMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    rawX.set((e.clientX - rect.left)  / rect.width  - 0.5)
    rawY.set((e.clientY - rect.top)   / rect.height - 0.5)
  }

  const onLeave = () => {
    rawX.set(0); rawY.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1,  y:  0 }}
      transition={{ delay: 0.15, duration: 0.7, ease: [0.16,1,0.3,1] }}
      className="w-full"
    >
      {/* 3D perspective wrapper */}
      <div style={{ perspective: '900px', perspectiveOrigin: 'center' }}>
        <motion.div
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          onMouseMove={onMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={onLeave}
          className="relative rounded-xl overflow-hidden cursor-crosshair"
          whileHover={{ scale: 1.015 }}
          transition={{ scale: { duration: 0.3 } }}
        >
          {/* Dynamic glare */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: hovered
                ? `radial-gradient(circle at ${glowX.get() * 100}% ${glowY.get() * 100}%, rgba(0,255,180,0.12) 0%, transparent 60%)`
                : 'none',
              zIndex: 10,
            }}
          />

          {/* Image */}
          <div className="relative" style={{ aspectRatio: '16/10' }}>
            <img
              src={evidence.url}
              alt={evidence.name}
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />

            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
              }}
            />

            {/* Corner brackets */}
            {[
              'top-2 left-2 border-t border-l',
              'top-2 right-2 border-t border-r',
              'bottom-2 left-2 border-b border-l',
              'bottom-2 right-2 border-b border-r',
            ].map((cls, i) => (
              <span
                key={i}
                className={`absolute w-4 h-4 ${cls}`}
                style={{ borderColor: 'rgba(0,255,180,0.5)' }}
              />
            ))}

            {/* HUD labels */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 font-mono-cus text-[9px] tracking-[2px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(0,255,180,0.7)', border: '1px solid rgba(0,255,180,0.15)' }}>
              EVIDENCE FRAME
            </div>

            {/* Zoom indicator on hover */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#00ffb4', border: '1px solid rgba(0,255,180,0.2)' }}
            >
              <ZoomIn size={10} />
              <span className="font-mono-cus text-[9px] tracking-widest">INSPECT</span>
            </motion.div>
          </div>

          {/* Card footer */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'rgba(4,8,15,0.95)', borderTop: '1px solid rgba(0,255,180,0.1)' }}
          >
            <div>
              <p className="font-mono-cus text-[10px] tracking-widest mb-0.5" style={{ color: 'rgba(0,255,180,0.5)' }}>
                FILE
              </p>
              <p className="font-display text-sm font-semibold text-white/80 truncate max-w-[200px]">
                {evidence.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono-cus text-[10px] tracking-widest mb-0.5" style={{ color: 'rgba(0,255,180,0.5)' }}>
                SIZE
              </p>
              <p className="font-mono-cus text-sm" style={{ color: '#00ffb4' }}>
                {(evidence.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(0,255,180,0.05)', border: '1px solid rgba(0,255,180,0.1)' }}
      >
        <CheckCircle2 size={13} style={{ color: '#00ffb4', flexShrink: 0 }} />
        <span className="font-mono-cus text-[10px] tracking-[2px]" style={{ color: 'rgba(0,255,180,0.7)' }}>
          IMAGE INTEGRITY VERIFIED · PRIVACY MASK APPLIED
        </span>
      </motion.div>
    </motion.div>
  )
}
