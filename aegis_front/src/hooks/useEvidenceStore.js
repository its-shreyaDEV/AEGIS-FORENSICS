
/*
import { useState, useCallback, useEffect } from 'react'
import { EVIDENCE_LOG } from '../utils/data'

let _log = [...EVIDENCE_LOG]
const _listeners = new Set()

function notify() { _listeners.forEach(fn => fn([..._log])) }

export function useEvidenceStore() {
  const [log, setLog] = useState([..._log])
  const [isLoading, setIsLoading] = useState(false)

  const subscribe = useCallback(() => {
    _listeners.add(setLog)
    return () => _listeners.delete(setLog)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe()
    return unsubscribe
  }, [subscribe])

  const fetchLedger = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/get-ledger')
      if (response.ok) {
        const dbData = await response.json()
        
        // Map the Python SQLite rows into the format your React UI expects
        // Make sure to map the new 'case_num' and 'file_path' columns!
        const mappedLog = dbData.map(row => ({
          id: `EVD-${String(row.id).padStart(4, '0')}`,
          case_num: row.case_num,        // IMPORTANT: Mapping this for your dynamic filter
          officer: row.officer_name,
          time: row.timestamp,
          hash: row.sha256_hash,
          prediction: row.prediction,
          confidence: row.confidence,
          module: row.module_used,
          filename: row.filename,
          file_path: row.file_path,      // IMPORTANT: Mapping this so the Modal can find the image
          status: 'verified',
          gps: { label: 'Extracted via EXIF/Node' } 
        }))

        _log = mappedLog
        notify()
      }
    } catch (error) {
      console.error("Failed to fetch ledger from Aegis Core:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const add = useCallback((entry) => {
    const newEntry = {
      id: entry.case || `EVD-${String(_log.length + 43).padStart(4, '0')}`,
      case_num: entry.case_num || 'CAS-UNKNOWN',
      file_path: entry.file_path || '',
      officer: entry.officer || 'Unknown',
      time: new Date().toISOString(),
      hash: entry.hash || '',
      status: 'verified',
    }
    _log = [newEntry, ..._log]
    notify()
    return newEntry
  }, [])

  return { log, add, fetchLedger, isLoading }
}
*/

import { useState, useCallback, useEffect } from 'react'

// Global in-memory store — shared across all components
let _log = []
const _listeners = new Set()
function notify() { _listeners.forEach(fn => fn([..._log])) }

export function useEvidenceStore() {
  const [log, setLog]           = useState([..._log])
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe this component to store updates
  useEffect(() => {
    _listeners.add(setLog)
    return () => _listeners.delete(setLog)
  }, [])

  // Pull real data from backend — fixes port 8000→10000
  const fetchLedger = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:10000/get-ledger')
      if (!res.ok) return
      const dbData = await res.json()

      // Map SQLite rows → UI shape
      _log = dbData.map(row => ({
        id:         `EVD-${String(row.id).padStart(4, '0')}`,
        rawId:      row.id,
        caseNum:    row.case_num,
        case_num:   row.case_num,
        officer:    row.officer_name,
        badge:      row.badge       || '—',
        time:       row.timestamp,
        hash:       row.sha256_hash,
        prediction: row.prediction  || '—',        // ← CNN result
        confidence: row.confidence  || 0,           // ← CNN confidence
        module:     row.module_used || '—',         // ← which AI module
        filename:   row.filename,
        file_path:  row.file_path,
        status:     row.integrity === 'compromised' ? 'compromised' : 'verified',
        gps:        { label: 'N/A' },
      }))
      notify()
    } catch (e) {
      console.error('fetchLedger failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add a new entry locally after capture — now saves ALL fields
  const add = useCallback((entry) => {
    const newEntry = {
      id:         `EVD-${String(_log.length + 1).padStart(4, '0')}`,
      rawId:      null,
      caseNum:    entry.caseNum    || entry.case || 'CAS-UNKNOWN',
      case_num:   entry.caseNum    || entry.case || 'CAS-UNKNOWN',
      officer:    entry.officer    || 'Unknown',
      badge:      entry.badge      || '—',
      time:       new Date().toISOString(),
      hash:       entry.hash       || '',
      prediction: entry.prediction || '—',          // ← now saved
      confidence: entry.confidence || 0,             // ← now saved
      module:     entry.module     || '—',           // ← now saved
      filename:   entry.filename   || '',
      file_path:  entry.file_path  || '',
      status:     'verified',
      gps:        entry.gps        || { label: 'N/A' },
    }
    _log = [newEntry, ..._log]
    notify()
    return newEntry
  }, [])

  return { log, add, fetchLedger, isLoading }
}