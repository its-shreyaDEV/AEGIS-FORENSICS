import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HyperspeedBackground from './components/HyperspeedBackground'
import TopNav               from './components/TopNav'
import Dashboard    from './pages/Dashboard'
import CapturePage  from './pages/CapturePage'
import EvidencePage from './pages/EvidencePage'
import AnalysisPage from './pages/AnalysisPage'
import VerifyPage   from './pages/VerifyPage'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<Dashboard />}    />
        <Route path="/capture"  element={<CapturePage />}  />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/verify"   element={<VerifyPage />}   />
        <Route path="*"         element={<NotFound />}     />
      </Routes>
    </AnimatePresence>
  )
}

function NotFound() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' }}>
      <p style={{ fontFamily:'Space Mono,monospace', fontSize:10, letterSpacing:'3px', color:'rgba(0,255,180,0.35)', marginBottom:16 }}>404 · NOT FOUND</p>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:48, color:'rgba(255,255,255,0.12)', letterSpacing:'-2px', marginBottom:20 }}>No record.</h2>
      <a href="/" style={{ fontFamily:'Space Mono,monospace', fontSize:11, letterSpacing:'2px', color:'#00ffb4', textDecoration:'none' }}>← RETURN TO DASHBOARD</a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <HyperspeedBackground />
      <TopNav />
      <main style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'80px 32px 80px' }}>
        <AnimatedRoutes />
      </main>
      <footer style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 32px', borderTop:'1px solid rgba(255,255,255,0.05)', fontFamily:'Space Mono,monospace', fontSize:9, letterSpacing:'1.5px', color:'rgba(255,255,255,0.18)' }}>
        <span>AEGIS-FORENSICS v2.0 · AUTOMATED EVIDENCE GUARD & IDENTIFICATION SYSTEM</span>
        <span>SECURE · IMMUTABLE · ADMISSIBLE</span>
      </footer>
    </BrowserRouter>
  )
}