import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const STATUS_STYLE = {
  verified:    { bg: 'rgba(0,255,180,0.08)',   border: 'rgba(0,255,180,0.2)',   color: '#00ffb4',  dot: '#00ffb4' },
  compromised: { bg: 'rgba(255,77,77,0.08)',   border: 'rgba(255,77,77,0.2)',   color: '#ff4d4d',  dot: '#ff4d4d' },
  pending:     { bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.2)',  color: '#a855f7',  dot: '#a855f7' },
}

const FILTERS = ['ALL', 'VERIFIED', 'COMPROMISED', 'PENDING']

export default function EvidenceTable({ data, onSelect }) {
  const [filter,  setFilter]  = useState('ALL')
  const [query,   setQuery]   = useState('')
  const [sortKey, setSortKey] = useState('time')
  const [sortDir, setSortDir] = useState('desc')
  const [expanded, setExpanded] = useState(null)

  const filtered = useMemo(() => {
    let rows = [...data]
    if (filter !== 'ALL') rows = rows.filter(r => r.status === filter.toLowerCase())
    if (query) {
      const q = query.toLowerCase()
      rows = rows.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.officer.toLowerCase().includes(q) ||
        r.hash.toLowerCase().includes(q) ||
        r.gps.label.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (sortKey === 'time') { av = new Date(av); bv = new Date(bv) }
      if (sortKey === 'phase') { av = Number(av); bv = Number(bv) }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return rows
  }, [data, filter, query, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
    : <ChevronDown size={10} style={{ opacity: 0.2 }} />

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter pills */}
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg font-mono-cus text-[9px] tracking-[1.5px] transition-all"
              style={{
                background: filter === f ? 'rgba(0,255,180,0.08)' : 'rgba(255,255,255,0.03)',
                border:     filter === f ? '1px solid rgba(0,255,180,0.25)' : '1px solid rgba(255,255,255,0.06)',
                color:      filter === f ? '#00ffb4' : 'rgba(255,255,255,0.35)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-40 rounded-lg px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={11} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search ID, officer, hash…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 font-mono-cus text-[11px] placeholder:opacity-30"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          />
        </div>

        <span className="font-mono-cus text-[9px] tracking-widest ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {filtered.length} RECORDS
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Head */}
        <div
          className="grid font-mono-cus text-[9px] tracking-[2px] px-4 py-3"
          style={{
            gridTemplateColumns: '100px 1fr 1fr 80px 90px 70px',
            color: 'rgba(255,255,255,0.25)',
            background: 'rgba(8,13,24,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {[
            { label: 'CASE ID',  key: 'id' },
            { label: 'OFFICER',  key: 'officer' },
            { label: 'TIMESTAMP',key: 'time' },
            { label: 'PHASE',    key: 'phase' },
            { label: 'STATUS',   key: 'status' },
            { label: 'WEAPON',   key: null },
          ].map(col => (
            <button
              key={col.label}
              onClick={() => col.key && toggleSort(col.key)}
              className="flex items-center gap-1 text-left hover:opacity-70 transition-opacity"
              style={{ cursor: col.key ? 'pointer' : 'default' }}
            >
              {col.label}
              {col.key && <SortIcon k={col.key} />}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div>
          <AnimatePresence>
            {filtered.length === 0 && (
              <div className="py-12 text-center font-mono-cus text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                NO RECORDS MATCH FILTER
              </div>
            )}
            {filtered.map((row, i) => {
              const st = STATUS_STYLE[row.status] || STATUS_STYLE.pending
              const isExp = expanded === row.id
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Main row */}
                  <div
                    onClick={() => setExpanded(isExp ? null : row.id)}
                    className="grid items-center px-4 py-3 cursor-pointer transition-all"
                    style={{
                      gridTemplateColumns: '100px 1fr 1fr 80px 90px 70px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isExp ? 'rgba(0,255,180,0.02)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
                    onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span className="font-mono-cus text-[11px]" style={{ color: '#00ffb4' }}>{row.id}</span>
                    <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.officer}</span>
                    <span className="font-mono-cus text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(row.time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className="font-mono-cus text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {row.phase}/3
                    </span>
                    <span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono-cus text-[9px] tracking-widest"
                        style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: st.dot }} />
                        {row.status.toUpperCase()}
                      </span>
                    </span>
                    <span className="font-mono-cus text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {row.weaponMatch?.label || '—'}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden', borderBottom: '1px solid rgba(0,255,180,0.08)' }}
                      >
                        <div className="px-6 py-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(0,255,180,0.02)' }}>
                          {[
                            ['GPS',          row.gps.label],
                            ['BADGE',        row.badge],
                            ['SHA-256',      row.hash.slice(0, 20) + '…'],
                            ['BLOCK TX',     row.blockTx || 'NOT SEALED'],
                            ['IPFS CID',     row.ipfsCid || 'NOT UPLOADED'],
                            ['BODY MOVED',   row.bodyMoved ? 'YES ⚠' : 'NO'],
                            ['WEAPON CONF.', row.weaponMatch?.confidence ? `${row.weaponMatch.confidence}%` : '—'],
                            ['SCENE',        row.primaryScene?.label || 'CURRENT LOCATION'],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p className="font-mono-cus text-[8px] tracking-[2px] mb-0.5" style={{ color: 'rgba(0,255,180,0.35)' }}>{k}</p>
                              <p className="font-mono-cus text-[10px]" style={{ color: v.includes('⚠') ? '#f59e0b' : 'rgba(255,255,255,0.55)' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="px-6 pb-4 flex gap-2" style={{ background: 'rgba(0,255,180,0.02)' }}>
                          <button
                            onClick={() => onSelect?.(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-cus text-[9px] tracking-widest transition-all"
                            style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.2)', color: '#00ffb4' }}
                          >
                            <ExternalLink size={9} /> FULL ANALYSIS
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
