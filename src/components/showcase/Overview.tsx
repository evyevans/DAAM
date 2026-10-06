import { ArrowRight, ArrowUpRight, CheckCheck, FileCheck2, FileText, Fingerprint, Layers3 } from 'lucide-react'
import { formatDate, pendingIssues, scenarioFor } from '@/lib/showcase'
import type { CaseStatus, DocumentCase } from '@/lib/showcase'

export function Status({ status }: { status: DocumentCase['status'] }) {
  return <span className={`case-status ${status}`}><span />{status === 'blocked' ? 'Needs attention' : status === 'review' ? 'Ready for review' : 'Approved'}</span>
}
export function EntityMark({ item }: { item: DocumentCase }) {
  const scenario = scenarioFor(item.scenario)
  return <span className="entity-mark" style={{ '--entity-color': scenario.color } as React.CSSProperties}>{scenario.initial}</span>
}
export function Overview({ cases, openCase, onQueue }: { cases: DocumentCase[]; openCase: (id: string) => void; onQueue: (status?: CaseStatus | 'all' | 'open') => void }) {
  const held = cases.filter(c => c.status === 'blocked')
  const review = cases.filter(c => c.status === 'review')
  const approved = cases.filter(c => c.status === 'approved')
  const byDue = (a: DocumentCase, b: DocumentCase) => Date.parse(a.dueAt) - Date.parse(b.dueAt)
  const featured = [...held].sort(byDue)[0] || [...review].sort(byDue)[0]
  const issueCount = cases.reduce((sum, item) => sum + pendingIssues(item).length, 0)

  return <div className="view-enter client-overview">
    <section className="overview-intro client-overview-intro">
      <div>
        <div className="eyebrow"><span className="sage-dot" /> DOCUMENT OPERATIONS <span className="workspace-context">CASE OPERATIONS</span></div>
        <h1>Document operations<span>.</span></h1>
        <p>{held.length} case{held.length === 1 ? '' : 's'} need attention · {review.length} packet{review.length === 1 ? '' : 's'} ready for review</p>
      </div>
    </section>

    <section className="metric-grid client-metrics" aria-label="Current document workflow status">
      {[
        { value: String(cases.filter(c => c.status !== 'approved').length).padStart(2, '0'), label: 'Open cases', detail: 'Awaiting review or approval', icon: Layers3, status: 'open' as const },
        { value: String(held.length).padStart(2, '0'), label: 'Held for your input', detail: 'An exception needs your judgment', icon: Fingerprint, type: 'amber', status: 'blocked' as const },
        { value: String(review.length).padStart(2, '0'), label: 'Ready to review', detail: 'Documents ready for review', icon: FileCheck2, status: 'review' as const },
        { value: String(approved.length).padStart(2, '0'), label: 'Packets approved', detail: 'Approved for download', icon: CheckCheck, status: 'approved' as const },
      ].map(({ value, label, detail, icon: Icon, type, status }) => <button type="button" onClick={() => onQueue(status)} className={`metric-card ${type || ''}`} key={label}><div className="metric-top"><span>{label}</span><Icon size={17} /></div><div className="metric-value">{value}<span>{Number(value) === 1 ? 'case' : 'cases'}</span></div><p>{detail}</p></button>)}
    </section>

    <div className="overview-bottom client-work-queue">
      <section className="recent-panel">
        <header className="panel-heading"><div><span className="eyebrow">WORK IN MOTION</span><h2>Recent cases</h2></div><button className="text-button" onClick={() => onQueue()}>Open document queue <ArrowRight size={14} /></button></header>
        <div className="recent-list">{[...cases].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4).map(item => <button className="recent-row" key={item.id} onClick={() => openCase(item.id)}><EntityMark item={item} /><span className="recent-name"><b>{item.name}</b><small>{scenarioFor(item.scenario).title} <span>· {item.id}</span><br />{item.assignee} · Due {formatDate(item.dueAt)}</small></span><Status status={item.status} /><ArrowUpRight size={16} className="recent-arrow" /></button>)}</div>
      </section>

      <section className="attention-panel client-next-action">
        <div className="attention-kicker"><Fingerprint size={18} /><span>{held.length ? 'A PERSON IS NEEDED HERE' : featured ? 'NEXT IN THE QUEUE' : 'REVIEW COMPLETE'}</span></div>
        {featured ? <>
          <span className="next-case-name">{featured.name}</span>
          <h2>{pendingIssues(featured).length ? 'One detail needs a decision.' : featured.status === 'review' ? 'A packet is ready for review.' : 'Your approved packet is ready.'}</h2>
          <p>{pendingIssues(featured).length ? `This case has ${pendingIssues(featured).length} source exception${pendingIssues(featured).length === 1 ? '' : 's'}. Compare the source extracts, then choose what belongs in the document.` : 'Review the source facts and prepared documents before taking the next step.'}</p>
          <button onClick={() => openCase(featured.id)}>{pendingIssues(featured).length ? 'Review source evidence' : 'Open this case'} <ArrowRight size={16} /></button>
          <span className="attention-footnote">Approval unlocks the packet download. Documents are not sent or signed.</span>
        </> : <><h2>No cases need your review.</h2><p>Your approved packets remain available in the document queue.</p><button onClick={() => onQueue('approved')}>View approved packets <ArrowRight size={16} /></button></>}
      </section>
    </div>

    <section className="client-operating-note" aria-label="How DAAM handles review">
      <FileText size={17} />
      <p><b>Routine checks run by rule.</b> Unclear source information comes to a person. Each confirmed value keeps a trail back to its source.</p>
      <span>{issueCount} open exception{issueCount === 1 ? '' : 's'}</span>
    </section>

    <footer className="workspace-footer"><span>DAAM · DOCUMENT, AUTOMATED, AI, MANAGER</span><span>Source-linked facts · human approval</span></footer>
  </div>
}
