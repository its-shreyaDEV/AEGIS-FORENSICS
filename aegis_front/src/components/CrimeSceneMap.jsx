import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, AlertTriangle, Navigation } from 'lucide-react'

const SCENE_POINTS = [
  {
    id: 'primary',
    x: 220, y: 180,
    label: 'Primary Scene',
    sub: 'Forest · 20.2944°N',
    color: '#ff4d4d',
    type: 'crime',
    detail: 'Assault location. Laterite soil, dense canopy. Serrated blade wounds consistent with right-handed downward thrust.',
  },
  {
    id: 'trail',
    x: 300, y: 220,
    label: 'Drag Trail',
    sub: '~200m path',
    color: '#f59e0b',
    type: 'move',
    detail: 'Drag marks visible in soil. Blood smear pattern confirms direction of movement (west-to-east).',
  },
  {
    id: 'secondary',
    x: 420, y: 160,
    label: 'Discovery Site',
    sub: 'Roadside · 20.2961°N',
    color: '#00ffb4',
    type: 'discovery',
    detail: 'Body placed post-mortem on asphalt surface. No secondary blood splatter. Officer EVD-0042 capture point.',
  },
  {
    id: 'vehicle',
    x: 500, y: 240,
    label: 'Tire Marks',
    sub: 'SW direction · 22:58',
    color: '#a855f7',
    type: 'suspect',
    detail: 'Vehicle tire marks heading south-west. CCTV gap confirmed at 22:58 UTC. Match pending forensic cast analysis.',
  },
]

const TYPE_ICONS = { crime: '✕', move: '→', discovery: '◎', suspect: '◈' }

export default function CrimeSceneMap() {
  const [selected, setSelected] = useState(null)
  const [hovered,  setHovered]  = useState(null)

  const sel = SCENE_POINTS.find(p => p.id === selected)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(4,8,15,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Navigation size={12} style={{ color: 'rgba(0,255,180,0.6)' }} />
          <span className="font-mono-cus text-[10px] tracking-[2.5px]" style={{ color: 'rgba(0,255,180,0.45)' }}>
            CRIME SCENE RECONSTRUCTION · BHUBANESWAR
          </span>
        </div>
        <span className="font-mono-cus text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          SEMANTIC SEGMENTATION v2.1
        </span>
      </div>

      <div className="flex" style={{ minHeight: 340 }}>
        {/* SVG Map */}
        <div className="flex-1 relative">
          <svg
            viewBox="0 0 620 340"
            className="w-full h-full"
            style={{ minHeight: 280 }}
          >
            {/* Grid */}
            <defs>
              <pattern id="mapgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0,255,180,0.04)" strokeWidth="0.5" />
              </pattern>
              <marker id="arrowMap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              </marker>
            </defs>
            <rect width="620" height="340" fill="url(#mapgrid)" />

            {/* Terrain zones */}
            <ellipse cx="230" cy="185" rx="110" ry="80" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.08)" strokeWidth="1" strokeDasharray="4 3" />
            <text x="155" y="115" fill="rgba(34,197,94,0.3)" fontSize="9" fontFamily="Space Mono" letterSpacing="2">FOREST ZONE</text>

            <rect x="320" y="80" width="240" height="200" rx="4" fill="rgba(100,116,139,0.04)" stroke="rgba(100,116,139,0.08)" strokeWidth="1" strokeDasharray="4 3" />
            <text x="330" y="100" fill="rgba(100,116,139,0.3)" fontSize="9" fontFamily="Space Mono" letterSpacing="2">ROADSIDE</text>

            {/* Road line */}
            <line x1="330" y1="80" x2="330" y2="280" stroke="rgba(100,116,139,0.2)" strokeWidth="12" strokeLinecap="round" />
            <line x1="330" y1="80" x2="330" y2="280" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="8 6" />

            {/* Trail / path */}
            <motion.path
              d="M 220 180 Q 280 200 330 160 Q 370 140 420 160"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.5"
              marker-end="url(#arrowMap)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
            />

            {/* Distance label */}
            <text x="295" y="208" fill="rgba(245,158,11,0.5)" fontSize="9" fontFamily="Space Mono" textAnchor="middle">~200m</text>

            {/* Scene points */}
            {SCENE_POINTS.map((pt) => {
              const isHov = hovered === pt.id
              const isSel = selected === pt.id
              return (
                <g
                  key={pt.id}
                  onClick={() => setSelected(isSel ? null : pt.id)}
                  onMouseEnter={() => setHovered(pt.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulse ring */}
                  <motion.circle
                    cx={pt.x} cy={pt.y} r={18}
                    fill="none" stroke={pt.color} strokeWidth="0.5"
                    animate={{ r: [14, 22, 14], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: SCENE_POINTS.indexOf(pt) * 0.5 }}
                  />

                  {/* Main dot */}
                  <motion.circle
                    cx={pt.x} cy={pt.y}
                    r={isHov || isSel ? 9 : 7}
                    fill={isSel ? pt.color : `${pt.color}30`}
                    stroke={pt.color}
                    strokeWidth={isSel ? 2 : 1.5}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Icon char */}
                  <text
                    x={pt.x} y={pt.y + 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill={pt.color}
                    fontFamily="monospace"
                  >
                    {TYPE_ICONS[pt.type]}
                  </text>

                  {/* Label */}
                  <text
                    x={pt.x} y={pt.y - 14}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill={isHov || isSel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'}
                    fontFamily="Syne, sans-serif"
                    fontWeight="600"
                    style={{ transition: 'fill 0.2s' }}
                  >
                    {pt.label}
                  </text>
                  <text
                    x={pt.x} y={pt.y - 5}
                    textAnchor="middle"
                    fontSize="7"
                    fill={pt.color}
                    fontFamily="Space Mono, monospace"
                    opacity="0.6"
                  >
                    {pt.sub}
                  </text>
                </g>
              )
            })}

            {/* Compass */}
            <g transform="translate(575, 40)">
              <circle cx="0" cy="0" r="14" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="0" y="-4" textAnchor="middle" fontSize="8" fill="rgba(0,255,180,0.7)" fontFamily="Space Mono">N</text>
              <line x1="0" y1="-2" x2="0" y2="-10" stroke="#00ffb4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="2"  x2="0" y2="10"  stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Detail panel */}
        <div
          className="w-52 shrink-0 p-4 flex flex-col gap-3"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="font-mono-cus text-[9px] tracking-[2px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            SCENE POINTS
          </p>

          {SCENE_POINTS.map(pt => (
            <button
              key={pt.id}
              onClick={() => setSelected(selected === pt.id ? null : pt.id)}
              className="flex items-start gap-2 text-left rounded-lg p-2 transition-all"
              style={{
                background: selected === pt.id ? `${pt.color}0f` : 'transparent',
                border: `1px solid ${selected === pt.id ? `${pt.color}30` : 'transparent'}`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: pt.color }} />
              <div>
                <p className="font-display font-semibold text-[11px]" style={{ color: selected === pt.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
                  {pt.label}
                </p>
                <p className="font-mono-cus text-[9px]" style={{ color: `${pt.color}80` }}>
                  {pt.sub}
                </p>
              </div>
            </button>
          ))}

          {/* Detail card */}
          <AnimatePresence mode="wait">
            {sel && (
              <motion.div
                key={sel.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-auto p-3 rounded-lg"
                style={{ background: `${sel.color}08`, border: `1px solid ${sel.color}20` }}
              >
                <p className="font-mono-cus text-[8px] tracking-widest mb-1.5" style={{ color: `${sel.color}80` }}>
                  ANALYST NOTE
                </p>
                <p className="font-display text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {sel.detail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!sel && (
            <p className="mt-auto font-mono-cus text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Click a point to inspect
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
