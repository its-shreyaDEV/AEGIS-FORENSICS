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