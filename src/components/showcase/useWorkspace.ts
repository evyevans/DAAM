'use client'

/* eslint-disable react-hooks/set-state-in-effect -- Hydrate browser-local records after the consistent server render. */
import { useEffect, useRef, useState } from 'react'
import { approveCase, getFact, initialWorkspace, MAX_STORAGE_LENGTH, readWorkspace, resolveIssue, STORAGE_KEY, updatePolicy } from '@/lib/showcase'
import type { DocumentCase, FactKey, ScenarioId, WorkspaceState } from '@/lib/showcase'

type Action = { type: 'add'; item: DocumentCase } | { type: 'resolve'; id: string; issue: string; value: string; reason: string } | { type: 'approve'; id: string } | { type: 'policy'; scenario: ScenarioId; key: FactKey; required: boolean } | { type: 'reset' }
function reduce(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'add':
      if (state.cases.length >= 100) throw new Error('This workspace holds up to 100 cases. Restore starting records in Help to make space.')
      if (state.cases.some(c => c.id === action.item.id || getFact(c, 'reference') === getFact(action.item, 'reference'))) throw new Error('This business reference already has a case. Open the existing case.')
      return { ...state, cases: [action.item, ...state.cases] }
    case 'resolve': return { ...state, cases: state.cases.map(c => c.id === action.id ? resolveIssue(c, action.issue, action.value, action.reason) : c) }
    case 'approve': return { ...state, cases: state.cases.map(c => c.id === action.id ? approveCase(c) : c) }
    case 'policy': return updatePolicy(state, action.scenario, action.key, action.required)
    case 'reset': return initialWorkspace()
  }
}
export function useWorkspace() {
  const [state, setState] = useState(initialWorkspace)
  const stateRef = useRef(state)
  const lastRaw = useRef<string | null>(null)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [recoveryNeeded, setRecoveryNeeded] = useState(false)
  const [stale, setStale] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  function adopt(next: WorkspaceState) { stateRef.current = next; setState(next) }
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      lastRaw.current = raw
      const saved = readWorkspace(raw)
      if (saved) { stateRef.current = saved; setState(saved) }
      else if (raw !== null) setRecoveryNeeded(true)
      else {
        const initial = JSON.stringify(stateRef.current)
        localStorage.setItem(STORAGE_KEY, initial); lastRaw.current = initial
      }
    } catch { setStorageAvailable(false) }
    setHydrated(true)
    const changed = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) setStale(true) }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  function dispatch(action: Action) {
    if (!hydrated) throw new Error('Please wait for your records to load.')
    if (recoveryNeeded && action.type !== 'reset') throw new Error('Recover the stored records before making changes. The original data has been preserved.')
    let currentRaw: string | null = lastRaw.current
    if (storageAvailable) {
      try { currentRaw = localStorage.getItem(STORAGE_KEY) } catch { setStorageAvailable(false) }
      if (currentRaw !== lastRaw.current) { setStale(true); throw new Error('Another tab changed these records. Load the latest records before continuing.') }
    }
    if (stale) throw new Error('Load the latest records before continuing.')
    const next = reduce(stateRef.current, action), raw = JSON.stringify(next)
    if (raw.length > MAX_STORAGE_LENGTH) throw new Error('This change exceeds browser storage capacity. Your previously saved records are preserved.')
    let saved = storageAvailable
    if (storageAvailable) {
      try { localStorage.setItem(STORAGE_KEY, raw); lastRaw.current = raw }
      catch { saved = false; setStorageAvailable(false) }
    }
    adopt(next)
    if (action.type === 'reset') setRecoveryNeeded(false)
    return { saved }
  }
  function loadLatest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY), saved = readWorkspace(raw)
      lastRaw.current = raw
      if (saved) { adopt(saved); setRecoveryNeeded(false) }
      else setRecoveryNeeded(true)
      setStale(false)
    } catch { setStorageAvailable(false) }
  }
  function downloadStoredData() {
    const url = URL.createObjectURL(new Blob([lastRaw.current || '{}'], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'daam-stored-records.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return { state, dispatch, storageAvailable, hydrated, recoveryNeeded, stale, loadLatest, downloadStoredData }
}
