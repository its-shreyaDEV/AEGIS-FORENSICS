import { motion } from 'framer-motion'
import { Shield, Cpu, Radio } from 'lucide-react'

export default function TopNav() {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14"
      style={{
        background: 'rgba(4,8,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,255,180,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield size={20} className="text-teal" strokeWidth={1.5} />
          <span
            className="absolute inset-0 rounded-full animate-pulse-slow"
            style={{ background: 'rgba(0,255,180,0.12)', filter: 'blur(6px)' }}
          />
        </div>
        <span
          className="font-display font-extrabold tracking-[0.2em] text-sm"
          style={{ color: '#00ffb4' }}
        >
          AEGIS
        </span>
        <span className="text-white/20 font-display text-sm">·</span>
        <span className="font-display font-bold tracking-[0.2em] text-sm text-white/60">
          FORENSICS
        </span>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {['DASHBOARD', 'CAPTURE', 'EVIDENCE', 'ANALYSIS'].map((item, i) => (
          <motion.button
            key={item}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="px-4 py-1.5 text-[10px] tracking-[2px] font-display font-semibold rounded-md transition-all duration-200"
            style={{
              color: i === 0 ? '#00ffb4' : 'rgba(255,255,255,0.35)',
              background: i === 0 ? 'rgba(0,255,180,0.08)' : 'transparent',
            }}
            onMouseEnter={e => { if (i !== 0) { e.target.style.color = '#00ffb4'; e.target.style.background = 'rgba(0,255,180,0.05)' } }}
            onMouseLeave={e => { if (i !== 0) { e.target.style.color = 'rgba(255,255,255,0.35)'; e.target.style.background = 'transparent' } }}
          >
            {item}
          </motion.button>
        ))}
      </nav>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 text-[10px] tracking-[1.5px] font-mono-cus"
          style={{ color: 'rgba(0,255,180,0.6)' }}>
          <Radio size={11} className="text-teal" />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block w-1 rounded-full bg-teal-400"
              style={{ background: '#00ffb4', height: 6 + i * 4 }}
              animate={{ scaleY: [1, 1.5 + i * 0.3, 1] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </motion.header>
  )
}
