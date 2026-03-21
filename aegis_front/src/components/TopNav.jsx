import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Radio } from 'lucide-react'

const NAV_LINKS = [
  { label: 'DASHBOARD', to: '/' },
  { label: 'CAPTURE',   to: '/capture' },
  { label: 'EVIDENCE',  to: '/evidence' },
  { label: 'ANALYSIS',  to: '/analysis' },
]

export default function TopNav() {
  const { pathname } = useLocation()

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14"
      style={{
        background: 'rgba(4,8,15,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,255,180,0.07)',
      }}
    >
      <Link to="/" className="flex items-center gap-3 no-underline" style={{ textDecoration: 'none' }}>
        <div className="relative">
          <Shield size={19} style={{ color: '#00ffb4' }} strokeWidth={1.5} />
        </div>
        <span className="font-display font-extrabold tracking-[0.2em] text-sm" style={{ color: '#00ffb4' }}>AEGIS</span>
        <span className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
        <span className="font-display font-bold tracking-[0.2em] text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>FORENSICS</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map((link, i) => {
          const isActive = pathname === link.to
          return (
            <motion.div key={link.to} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Link
                to={link.to}
                style={{
                  display: 'block', padding: '6px 16px', borderRadius: 6,
                  fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '1.5px',
                  color: isActive ? '#00ffb4' : 'rgba(255,255,255,0.35)',
                  background: isActive ? 'rgba(0,255,180,0.08)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >{link.label}</Link>
            </motion.div>
          )
        })}
      </nav>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-3">
        <div className="flex items-center gap-2" style={{ fontFamily: 'Space Mono', fontSize: 10, letterSpacing: 1, color: 'rgba(0,255,180,0.6)' }}>
          <Radio size={11} style={{ color: '#00ffb4' }} />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[6, 10, 14].map((h, i) => (
            <motion.span key={i} className="block w-0.5 rounded-full" style={{ background: '#00ffb4', height: h }}
              animate={{ scaleY: [1, 1.4, 1] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </div>
      </motion.div>
    </motion.header>
  )
}
