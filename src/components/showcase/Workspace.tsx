'use client'

/* eslint-disable react-hooks/set-state-in-effect -- Restore browser navigation and preferences after SSR. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Activity as ActivityIcon, ArrowRight, Check, ChevronRight, CircleAlert, CircleHelp, FileText, Fingerprint, FolderOpen, LayoutGrid, Menu, Moon, Plus, RotateCcw, Search, ShieldCheck, Sun, X } from 'lucide-react'
import { bundleFor, canApprove, createCase, FIELD_LABELS, getFact, packetHTML, pendingIssues, SCENARIOS, scenarioFor } from '@/lib/showcase'
import type { CaseStatus, ScenarioId, View } from '@/lib/showcase'
import { useWorkspace } from './useWorkspace'
import { Overview } from './Overview'
import { CaseReview } from './CaseReview'
import { Activity, Queue, Templates } from './Library'
import { Modal } from './Modal'
import './showcase.css'

const NAV = [{ id: 'overview', label: 'Overview', icon: LayoutGrid }, { id: 'queue', label: 'Document queue', icon: FolderOpen }, { id: 'templates', label: 'Templates', icon: FileText }, { id: 'activity', label: 'Activity', icon: ActivityIcon }] as const
type Route = { view: View; caseId: string | null; status: CaseStatus | 'all' | 'open'; query: string; workflow: ScenarioId | 'all' }
const DEFAULT_ROUTE: Route = { view: 'overview', caseId: null, status: 'all', query: '', workflow: 'all' }
function readRoute(): Route {
  const p = new URLSearchParams(location.search)
  return { view: NAV.some(v => v.id === p.get('view')) ? p.get('view') as View : 'overview', caseId: p.get('case'), status: ['blocked', 'review', 'approved', 'open'].includes(p.get('status') || '') ? p.get('status') as CaseStatus | 'open' : 'all', query: p.get('q') || '', workflow: SCENARIOS.some(s => s.id === p.get('workflow')) ? p.get('workflow') as ScenarioId : 'all' }
}
function subscribeToViewport(callback: () => void) { const q = window.matchMedia('(max-width: 800px)'); q.addEventListener('change', callback); return () => q.removeEventListener('change', callback) }
function mobileViewport() { return window.matchMedia('(max-width: 800px)').matches }
function serverViewport() { return false }

export default function Workspace() {
  const { state, dispatch, storageAvailable, hydrated, recoveryNeeded, stale, loadLatest, downloadStoredData } = useWorkspace()
  const [route, setRoute] = useState(DEFAULT_ROUTE)
  const [dialog, setDialog] = useState<'about' | 'sample' | 'approve' | 'reset' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [scenario, setScenario] = useState<ScenarioId>('services')
  const [variant, setVariant] = useState(0)
  const [acknowledged, setAcknowledged] = useState(false)
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null)
  const mainRef = useRef<HTMLElement>(null), sidebarRef = useRef<HTMLElement>(null)
  const mobile = useSyncExternalStore(subscribeToViewport, mobileViewport, serverViewport)
  const item = state.cases.find(c => c.id === route.caseId)
  const blockedCount = state.cases.filter(c => c.status === 'blocked').length
  const bundle = bundleFor(scenario, variant)
  const existing = state.cases.find(c => getFact(c, 'reference') === bundle.reference)
  const blockedWrite = !hydrated || recoveryNeeded || stale

  useEffect(() => {
    setRoute(readRoute())
    const restore = () => setRoute(readRoute())
    window.addEventListener('popstate', restore)
    try { if (localStorage.getItem('daam-showcase-theme') === 'dark') setTheme('dark') } catch { /* Use the default theme. */ }
    return () => window.removeEventListener('popstate', restore)
  }, [])
  useEffect(() => {
    if (hydrated && window.parent !== window) window.parent.postMessage({ type: 'daam:ready', version: 2 }, '*')
  }, [hydrated])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 6000); return () => clearTimeout(timer) }, [toast])
  function go(next: Route, replace = false) {
    setRoute(next); setMenuOpen(false)
    const p = new URLSearchParams()
    if (next.view !== 'overview') p.set('view', next.view)
    if (next.caseId) p.set('case', next.caseId)
    if (next.status !== 'all') p.set('status', next.status)
    if (next.query) p.set('q', next.query)
    if (next.workflow !== 'all') p.set('workflow', next.workflow)
    history[replace ? 'replaceState' : 'pushState'](null, '', `${location.pathname}${p.size ? '?' + p : ''}${location.hash}`)
  }
  function navigate(view: View) { go({ ...route, view, caseId: null }); mainRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }) }
  function openCase(id: string) { go({ ...route, view: 'queue', caseId: id }); mainRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }) }
  function openNew(id: ScenarioId = 'services') {
    setMenuOpen(false); setScenario(id)
    setVariant([0, 1, 2].find(v => !state.cases.some(c => getFact(c, 'reference') === bundleFor(id, v).reference)) ?? 0)
    setDialog('sample')
  }
  function safely(work: () => void) {
    try { work() } catch (error) { setToast({ text: error instanceof Error ? error.message : 'Unable to complete this action.', error: true }) }
  }
  function create() {
    if (existing) { openCase(existing.id); setDialog(null); return }
    safely(() => {
      const prepared = createCase(scenario, `DA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, state.policies[scenario], variant)
      dispatch({ type: 'add', item: prepared }); openCase(prepared.id); setDialog(null)
      setToast({ text: pendingIssues(prepared).length ? 'Case created. Resolve the source exception before approval.' : 'Case created. Your packet is ready for review.' })
    })
  }
  function showApproval() { if (!item || !canApprove(item) || blockedWrite) return; setAcknowledged(false); setDialog('approve') }
  function approve() {
    if (!item || !acknowledged) return
    safely(() => { const result = dispatch({ type: 'approve', id: item.id }); setDialog(null); setToast({ text: result.saved ? 'Packet approved and saved. Both documents are ready to download.' : 'Packet approved for this visit. Browser storage is unavailable.' }) })
  }
  function download() {
    if (!item) return
    safely(() => {
      const url = URL.createObjectURL(new Blob([packetHTML(item)], { type: 'text/html;charset=utf-8' }))
      const a = document.createElement('a'); a.href = url; a.download = `${item.id.toLowerCase()}-document-packet.html`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      setToast({ text: 'HTML packet downloaded. Open it and use Print to save as PDF.' })
    })
  }
  function toggleTheme() { const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); try { localStorage.setItem('daam-showcase-theme', next) } catch { /* Keep the preference for this visit. */ } }
  useEffect(() => {
    function keyboard(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !dialog) {
        e.preventDefault(); navigate('queue'); requestAnimationFrame(() => document.getElementById('queue-search')?.focus())
      }
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard)
  })
  useEffect(() => {
    if (!mobile || !menuOpen) return
    const previous = document.activeElement as HTMLElement | null, oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const body = document.querySelector<HTMLElement>('.workspace-body'); if (body) body.inert = true
    const controls = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') || [])
    sidebarRef.current?.querySelector<HTMLButtonElement>('.sidebar-mobile-close')?.focus()
    const contain = (e: KeyboardEvent) => { if (e.key !== 'Tab') return; const nodes = controls(), first = nodes[0], last = nodes.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() } }
    document.addEventListener('keydown', contain)
    return () => { document.body.style.overflow = oldOverflow; if (body) body.inert = false; document.removeEventListener('keydown', contain); if (previous?.isConnected) previous.focus() }
  }, [mobile, menuOpen])

  return <div className="daam-app" data-theme={theme}>
    <a href="#workspace-main" className="skip-link">Skip to workspace</a>
    {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <aside ref={sidebarRef} inert={mobile && !menuOpen} role={mobile && menuOpen ? 'dialog' : undefined} aria-modal={mobile && menuOpen ? true : undefined} className={`workspace-sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
      <button className="brand" onClick={() => navigate('overview')} aria-label="DAAM overview"><span className="brand-symbol"><span /><i /></span><span>DAAM<span className="brand-period">.</span><small>DOCUMENT OPERATIONS</small></span></button>
      <button className="sidebar-mobile-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button>
      <div className="workspace-selector"><span className="workspace-avatar">O</span><span><b>Operations team</b><small>Document operations</small></span></div>
      <span className="nav-section-label">WORKSPACE</span><nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${route.view === id ? 'active' : ''}`} onClick={() => navigate(id)} aria-current={route.view === id ? 'page' : undefined}><Icon size={17} /><span>{label}</span>{id === 'queue' && blockedCount > 0 && <span className="nav-count">{blockedCount}</span>}</button>)}</nav>
      <div className="sidebar-callout"><h3>Approval stays human.</h3><p>Sources linked.<br />Exceptions surfaced.<br />Your team makes the call.</p></div>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => { setMenuOpen(false); setDialog('about') }}><CircleHelp size={16} />Help & guidance</button><div className="sidebar-person"><span className="person-avatar">GU</span><span><b>Guest User</b><small>Operations reviewer</small></span><button className="icon-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={toggleTheme}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button></div></div>
    </aside>
    <div className="workspace-body">
      <header className="workspace-topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} /></button><span className="topbar-workspace">Workspace</span><ChevronRight size={12} /><span>{item ? 'Document review' : NAV.find(n => n.id === route.view)?.label}</span></div><div className="topbar-actions"><button className="topbar-search" aria-label="Search cases" onClick={() => { navigate('queue'); requestAnimationFrame(() => document.getElementById('queue-search')?.focus()) }}><Search size={15} /><span>Search cases</span><kbd>⌘ K</kbd></button><button className="topbar-new" aria-label="New case" onClick={() => openNew()} disabled={blockedWrite}><Plus size={15} /><span>New case</span></button></div></header>
      <main id="workspace-main" ref={mainRef} tabIndex={-1} className="workspace-main">
        <div className="environment-note"><span>Example workspace · fictional records</span><span>{!hydrated ? 'Loading records…' : recoveryNeeded ? 'Stored records need recovery' : stale ? 'Another tab has newer records' : storageAvailable ? 'Actions saved in this browser' : 'Changes last for this visit'}</span></div>
        {!storageAvailable && <div className="storage-note" role="status"><CircleAlert size={16} />Browser storage is unavailable. Your changes will last for this visit.</div>}
        {recoveryNeeded && <div className="storage-note recovery-note" role="alert"><span>Stored records could not be read. The original data has been preserved.</span><button className="button secondary small" onClick={() => safely(downloadStoredData)}>Download stored data</button><button className="button secondary small" onClick={() => setDialog('reset')}>Restore starting records</button></div>}
        {stale && <div className="storage-note" role="alert"><span>Another tab changed these records. Load the latest version before making changes.</span><button className="button secondary small" onClick={loadLatest}>Load latest records</button></div>}
        {!hydrated ? <div className="empty-state" role="status">Loading workspace records…</div> : recoveryNeeded ? <div className="empty-state"><h2>Stored records need recovery.</h2><p>Download the preserved data or explicitly restore starting records above.</p></div> : route.caseId && !item ? <div className="empty-state"><FolderOpen size={28} /><h2>Case unavailable in this browser.</h2><p>This link refers to records that are not stored here.</p><button className="button secondary" onClick={() => navigate('queue')}>Open document queue</button></div> : item ? <CaseReview key={item.id} item={item} onBack={() => navigate('queue')} onResolve={(issue, value, reason) => safely(() => { dispatch({ type: 'resolve', id: item.id, issue, value, reason }); setToast({ text: 'Decision recorded. Both documents reflect the updated value.' }) })} onApprove={showApproval} onDownload={download} readOnly={blockedWrite} /> : route.view === 'overview' ? <Overview cases={state.cases} openCase={openCase} onQueue={(status = 'all') => go({ ...route, view: 'queue', caseId: null, status, query: '', workflow: 'all' })} /> : route.view === 'queue' ? <Queue cases={state.cases} openCase={openCase} onRun={() => openNew()} filters={route} onFilter={changes => go({ ...route, ...changes }, true)} /> : route.view === 'templates' ? <Templates state={state} onPolicy={(scenario, key, required) => safely(() => { dispatch({ type: 'policy', scenario, key, required }); setToast({ text: `${FIELD_LABELS[key]} is ${required ? 'required' : 'optional'} for new cases.` }) })} onRun={openNew} /> : <Activity cases={state.cases} openCase={openCase} />}
      </main>
    </div>
    {dialog === 'about' && <Modal title="Documents move. Judgment stays human." eyebrow="DOCUMENT, AUTOMATED, AI, MANAGER" onClose={() => setDialog(null)} wide><div className="about-body"><p className="modal-lead">Bring related information together, resolve what does not agree, and approve a consistent document packet.</p><div className="about-workflow">{[{ title: 'Source-linked facts', text: 'Each mapped value keeps a reference to its source extract.' }, { title: 'Exceptions first', text: 'Missing requirements and conflicting values hold approval until a reviewer decides.' }, { title: 'Reusable templates', text: 'Required-field policies apply to new cases; existing packets retain their original requirements.' }, { title: 'Human approval', text: 'Review both documents, record approval, then download the printable packet.' }].map(step => <div key={step.title}><h3>{step.title}</h3><p>{step.text}</p></div>)}</div><div className="about-boundaries"><ShieldCheck size={20} /><div><h3>About this workspace</h3><p>Business records are fictional. Source extracts and their mappings are provided examples; no live OCR or AI model runs here. Changes are saved in this browser when storage is available.</p><p>A client deployment connects approved sources, access controls, processing and durable records. This workspace does not send or sign documents.</p></div></div><div className="about-footer"><span>Example records and local settings</span><button className="button secondary" onClick={() => setDialog('reset')}><RotateCcw size={15} />Restore starting records</button></div></div></Modal>}
    {dialog === 'sample' && <Modal title="New document case" eyebrow="SOURCE BUNDLE" onClose={() => setDialog(null)} wide><div className="sample-body"><p className="modal-lead">Choose a workflow and its provided source bundle. Required-field checks prepare a draft for your review.</p><div className="sample-scenarios">{SCENARIOS.map(s => <button className={`sample-scenario ${scenario === s.id ? 'selected' : ''}`} key={s.id} aria-pressed={scenario === s.id} onClick={() => { setScenario(s.id); setVariant([0, 1, 2].find(v => !state.cases.some(c => getFact(c, 'reference') === bundleFor(s.id, v).reference)) ?? 0) }}><span className="eyebrow">{s.sector}</span><h3>{s.title}</h3><p>{s.description}</p></button>)}</div><label className="bundle-field">Source bundle<select aria-label="Source bundle" value={variant} onChange={e => setVariant(Number(e.target.value))}>{[0, 1, 2].map(v => { const b = bundleFor(scenario, v); return <option key={v} value={v}>{b.entity} · {b.reference}</option> })}</select></label><div className="bundle-summary"><FolderOpen size={20} /><div><b>{bundle.entity}</b><p>Intake extract · confirmation email extract · business record extract</p><small>Assigned to Guest User · {scenarioFor(scenario).output} + verification record</small></div></div>{existing && <p className="storage-note">This business reference already has a case. Open it to continue working.</p>}{state.cases.length >= 100 && !existing && <p className="storage-note">Capacity reached: 100 cases. Restore starting records in Help to make space.</p>}<div className="sample-footer"><span>Fictional source bundles · local preparation</span><button className="button primary" onClick={create} disabled={blockedWrite || (!existing && state.cases.length >= 100)}>{existing ? 'Open existing case' : 'Create case'}<ArrowRight size={15} /></button></div></div></Modal>}
    {dialog === 'approve' && item && <Modal title="Approve document packet" eyebrow="HUMAN REVIEW" onClose={() => setDialog(null)}><div className="approval-body"><p className="modal-lead">Review the information and both documents for {item.name}.</p><div className="approval-summary"><FileText size={22} /><div><b>{scenarioFor(item.scenario).output}</b><span>+ verification record · Template {item.templateVersion}</span></div></div><div className="approval-checks"><span><Check size={14} />Required fields present</span><span><Check size={14} />Required exceptions resolved</span><span><Check size={14} />Source references included</span></div><label className="approval-checkbox"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>I have reviewed the source facts and both prepared documents.</span></label><p className="approval-disclosure">Approval records Guest User’s decision and enables download. Documents are not sent or signed.</p><div className="modal-actions"><button className="button secondary" onClick={() => setDialog(null)}>Keep reviewing</button><button className="button primary" disabled={!acknowledged || blockedWrite || !canApprove(item)} onClick={approve}><Fingerprint size={16} />Approve packet</button></div></div></Modal>}
    {dialog === 'reset' && <Modal title="Restore the starting records?" eyebrow="LOCAL RECORDS" onClose={() => setDialog(null)}><div className="reset-body"><p>This replaces the cases, decisions and template changes stored in this browser with four starting records. Download any records you need before restoring.</p><div className="modal-actions"><button className="button secondary" onClick={() => safely(downloadStoredData)}>Download stored data</button><button className="button secondary" onClick={() => setDialog(null)}>Keep my records</button><button className="button primary" onClick={() => safely(() => { dispatch({ type: 'reset' }); navigate('overview'); setDialog(null); setToast({ text: 'Starting records restored.' }) })}>Restore records</button></div></div></Modal>}
    {toast && <div className={`workspace-toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <CircleAlert size={17} /> : <Check size={17} />}<span>{toast.text}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={14} /></button></div>}
  </div>
}
