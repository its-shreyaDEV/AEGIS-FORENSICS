import { useState, useCallback } from 'react'
import { EVIDENCE_LOG } from '../utils/data'

// Simple in-memory store (replace with Zustand/Redux for production)
let _log = [...EVIDENCE_LOG]
const _listeners = new Set()

function notify() { _listeners.forEach(fn => fn([..._log])) }

export function addEvidence(entry) {
  _log = [entry, ..._log]
  notify()
}

export function useEvidenceStore() {
  const [log, setLog] = useState([..._log])

  const subscribe = useCallback(() => {
    _listeners.add(setLog)
    return () => _listeners.delete(setLog)
  }, [])

  useState(subscribe)  // subscribe on mount, unsubscribe on unmount

  const add = useCallback((entry) => {
    const newEntry = {
      id: `EVD-${String(_log.length + 43).padStart(4, '0')}`,
      officer: entry.officer || 'Unknown',
      badge: entry.badge || '—',
      time: new Date().toISOString(),
      gps: entry.gps || { lat: 0, lng: 0, label: '0.0000°N, 0.0000°E' },
      hash: entry.hash || '',
      status: 'verified',
      phase: 1,
      weaponMatch: { label: 'Pending', confidence: null },
      bodyMoved: false,
      blockTx: null,
      ipfsCid: null,
    }
    addEvidence(newEntry)
    return newEntry
  }, [])

  return { log, add }
}
