export type ScenarioId = 'services' | 'supplier' | 'people' | 'property'
export type FactKey = 'legalName' | 'contactName' | 'email' | 'address' | 'reference' | 'effectiveDate' | 'scope'
export type CaseStatus = 'blocked' | 'review' | 'approved'
export type View = 'overview' | 'queue' | 'templates' | 'activity'
export type ReviewTab = 'facts' | 'sources' | 'documents' | 'audit'

export interface Scenario {
  id: ScenarioId; sector: string; title: string; description: string; color: string;
  entity: string; contact: string; email: string; address: string; reference: string;
  scope: string; output: string; initial: string;
}
export const SCENARIOS: Scenario[] = [
  { id: 'services', sector: 'Professional services', title: 'Client onboarding', description: 'From intake and client records to a consistent engagement packet.', color: '#638576', entity: 'Northstar Studio Ltd.', contact: 'Alex Morgan', email: 'alex@northstar.example', address: '82 King Street West, Toronto, ON M5H 1A1', reference: 'NS-2048', scope: 'Brand strategy and identity design', output: 'Engagement brief', initial: 'NS' },
  { id: 'supplier', sector: 'Operations & procurement', title: 'Supplier onboarding', description: 'Check supplier details before they enter your operational documents.', color: '#9B7C5B', entity: 'Meridian Supply Co.', contact: 'Taylor Brooks', email: 'taylor@meridian.example', address: '', reference: 'MS-1093', scope: 'Packaging materials · quarterly supply', output: 'Supplier record', initial: 'MS' },
  { id: 'people', sector: 'People & talent', title: 'Employee onboarding', description: 'Carry confirmed details into a clear, reviewable onboarding record.', color: '#7E79A0', entity: 'Jordan Avery', contact: 'Jordan Avery', email: 'jordan@avery.example', address: '14 Maple Avenue, Ottawa, ON K1S 2A3', reference: 'JA-0087', scope: 'Product designer · Design team', output: 'Onboarding brief', initial: 'JA' },
  { id: 'property', sector: 'Property operations', title: 'Property onboarding', description: 'Bring owner details and handover information into one checked packet.', color: '#688295', entity: 'Harbour House Management', contact: 'Jamie Ellis', email: 'jamie@harbour.example', address: '240 Lakeshore Road, Burlington, ON L7S 1A1', reference: 'HH-0314', scope: 'Operations handover · Harbour House', output: 'Management brief', initial: 'HH' },
]
export const FIELD_LABELS: Record<FactKey, string> = {
  legalName: 'Legal name', contactName: 'Primary contact', email: 'Contact email',
  address: 'Mailing address', reference: 'Record reference', effectiveDate: 'Effective date', scope: 'Scope / role',
}
export const FIELD_KEYS = Object.keys(FIELD_LABELS) as FactKey[]
export const DEFAULT_POLICIES: Record<ScenarioId, FactKey[]> = {
  services: [...FIELD_KEYS],
  supplier: FIELD_KEYS.filter(key => key !== 'effectiveDate'),
  people: FIELD_KEYS.filter(key => !['address', 'contactName'].includes(key)),
  property: [...FIELD_KEYS],
}
export const STORAGE_KEY = 'daam-document-workspace-v1'
export interface SourceDocument {
  id: string; name: string; kind: 'PDF' | 'EMAIL' | 'RECORD'; origin: string; recordedAt?: string;
  sections: { label: string; body: string }[];
}
export interface Fact { key: FactKey; value: string; sourceId: string; quote: string }
export interface Issue {
  id: string; field: FactKey; kind: 'conflict' | 'missing'; description: string;
  options: { value: string; sourceId: string; label: string }[];
  resolution?: { value: string; sourceId: string; reason?: string };
}
export interface AuditEntry { id: string; at: string; actor: string; action: string; detail: string; kind: 'system' | 'review' | 'approved' }
export interface DocumentCase {
  id: string; scenario: ScenarioId; name: string; createdAt: string; status: CaseStatus;
  sources: SourceDocument[]; facts: Fact[]; issues: Issue[]; required: FactKey[];
  audit: AuditEntry[]; approvedAt?: string; assignee: string; dueAt: string; updatedAt: string; templateVersion: string; context: { label: string; value: string }[];
}
export interface WorkspaceState {
  version: 2; cases: DocumentCase[]; policies: Record<ScenarioId, FactKey[]>;
}
export function scenarioFor(id: ScenarioId) { return SCENARIOS.find(s => s.id === id)! }
export function getFact(item: DocumentCase, key: FactKey) { return item.facts.find(f => f.key === key)?.value || '' }
export function pendingIssues(item: DocumentCase): Issue[] {
  const recorded = item.issues.filter(i => !i.resolution && (i.kind === 'conflict' || item.required.includes(i.field)))
  const absent: Issue[] = item.required.filter(key => !getFact(item, key).trim() && !recorded.some(issue => issue.field === key)).map(key => ({ id: `required-${key}`, field: key, kind: 'missing', description: `${FIELD_LABELS[key]} is required by this case's template but has not been supplied. Record the information and the evidence supporting your entry.`, options: [] }))
  return [...recorded, ...absent]
}
export function missingFields(item: DocumentCase) { return item.required.filter(k => !getFact(item, k).trim()) }
export function canApprove(item: DocumentCase) { return pendingIssues(item).length === 0 && missingFields(item).length === 0 }
function statusFor(item: DocumentCase): CaseStatus { return canApprove(item) ? 'review' : 'blocked' }
function event(actor: string, action: string, detail: string, kind: AuditEntry['kind'] = 'system'): AuditEntry {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), actor, action, detail, kind }
}

export const MAX_STORAGE_LENGTH = 2_000_000
export const WORKFLOW_CONTEXT: Record<ScenarioId, { label: string; value: string }[]> = {
  services: [{ label: 'Engagement owner', value: 'Guest User' }, { label: 'Agreed deliverables', value: 'Strategy workshop, identity system and brand guidelines' }],
  supplier: [{ label: 'Supplier category', value: 'Packaging & fulfillment' }, { label: 'Payment terms', value: 'Net 30 from accepted invoice' }],
  people: [{ label: 'Department', value: 'Design' }, { label: 'Reporting manager', value: 'Priya Shah' }],
  property: [{ label: 'Property address', value: '240 Lakeshore Road, Burlington, ON L7S 1A1' }, { label: 'Handover owner', value: 'Jamie Ellis' }],
}
export function bundleFor(id: ScenarioId, variant = 0): Scenario {
  const base = scenarioFor(id)
  if (variant === 0) return base
  const names: Record<ScenarioId, string[]> = {
    services: ['Eastwood Creative Ltd.', 'Cedar Strategy Group'], supplier: ['Atlas Packaging Co.', 'Willow Supply Partners'],
    people: ['Sam Rivera', 'Casey Bennett'], property: ['Cove Property Partners', 'Elm Residence Management'],
  }
  const entity = names[id][variant - 1]
  if (!entity) throw new Error('Select an available source bundle.')
  return { ...base, entity, contact: id === 'people' ? entity : base.contact, reference: `${base.initial}-${3000 + variant}`, email: `intake@${id}${variant}.example` }
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' }).format(new Date(value)) + ' · Toronto'
}
function dueDate(received: string) {
  const date = new Date(received)
  let days = 0
  while (days < 2) { date.setUTCDate(date.getUTCDate() + 1); if (![0, 6].includes(date.getUTCDay())) days++ }
  return date.toISOString()
}
export function createCase(scenario: ScenarioId, id: string, required: FactKey[] = DEFAULT_POLICIES[scenario], variant = 0): DocumentCase {
  const s = bundleFor(scenario, variant)
  const createdAt = new Date().toISOString()
  const effectiveDate = dueDate(createdAt).slice(0, 10)
  const values: Record<FactKey, string> = { legalName: s.entity, contactName: s.contact, email: s.email, address: s.address, reference: s.reference, effectiveDate, scope: s.scope }
  const recordAddress = scenario === 'services' ? '82 King Street East, Toronto, ON M5H 1A1' : s.address
  const sources: SourceDocument[] = [
    { id: 'intake', name: `${s.reference.toLowerCase()}-intake.pdf`, kind: 'PDF', origin: 'Submitted intake form', sections: FIELD_KEYS.filter(k => !['scope', 'effectiveDate'].includes(k)).map(k => ({ label: FIELD_LABELS[k], body: values[k] || 'Not supplied' })) },
    { id: 'email', name: 'onboarding-confirmation.eml', kind: 'EMAIL', origin: `Email from ${s.contact}`, sections: [{ label: 'From', body: s.email }, { label: 'Subject', body: `Onboarding confirmation · ${s.reference}` }, { label: 'Message', body: `Hello,\n\nPlease use the information in our intake form for ${s.entity}.\n\nScope / role: ${s.scope}\nEffective date: ${effectiveDate}\n\nThank you,\n${s.contact}` }] },
    { id: 'record', name: `${s.reference.toLowerCase()}-record.json`, kind: 'RECORD', origin: 'Existing business record', sections: [{ label: 'Legal name', body: s.entity }, { label: 'Primary contact', body: s.contact }, { label: 'Contact email', body: s.email }, { label: 'Mailing address', body: recordAddress || 'Not supplied' }, { label: 'Record reference', body: s.reference }] },
  ]
  const facts: Fact[] = FIELD_KEYS.map(key => ({ key, value: values[key], sourceId: ['scope', 'effectiveDate'].includes(key) ? 'email' : 'intake', quote: values[key] || 'Not supplied' }))
  const issues: Issue[] = scenario === 'services' ? [{ id: 'address-conflict', field: 'address', kind: 'conflict', description: 'The intake form says King Street West. The existing record says King Street East. A reviewer needs to confirm which address belongs in the packet.', options: [{ value: s.address, sourceId: 'intake', label: 'Submitted intake form' }, { value: recordAddress, sourceId: 'record', label: 'Existing business record' }] }] : scenario === 'supplier' ? [{ id: 'address-missing', field: 'address', kind: 'missing', description: 'A mailing address is required by this template, but neither the submitted form nor the business record contains one.', options: [] }] : []
  const item: DocumentCase = {
    id, scenario, name: s.entity, createdAt, updatedAt: createdAt, dueAt: dueDate(createdAt), assignee: 'Guest User', templateVersion: '2.0', context: WORKFLOW_CONTEXT[scenario].map(f => ({ ...f })), status: 'review', sources, facts, issues, required: [...required],
    audit: [
      event('Intake', '3 source files received', 'Intake form, confirmation email and existing record added to this case.'),
      event('DAAM document reader', 'Source facts prepared', 'Candidate values linked to their source documents for review.'),
      event('DAAM validation', 'Sources compared', issues.length ? 'A source exception needs reviewer attention.' : 'Required source details agree.'),
      event('Validation · rules', 'Template requirements checked', `${required.length} required fields. ${issues.length && required.includes('address') ? 'Packet held for review.' : 'Draft packet prepared.'}`),
    ],
  }
  item.sources = sources.map(source => ({ ...source, recordedAt: source.id === 'record' ? new Date(Date.parse(createdAt) - 30 * 86400000).toISOString() : createdAt }))
  item.sources[0].sections.push(...item.context.map(f => ({ label: f.label, body: f.value })))
  item.status = statusFor(item)
  item.audit[2].detail = pendingIssues(item).length ? 'A source exception needs reviewer attention.' : 'Required checks complete; source-linked values are ready for review.'
  item.audit[3].detail = `${required.length} required fields. ${item.status === 'blocked' ? 'Draft prepared; approval held.' : 'Draft packet prepared for review.'}`
  return item
}

export function resolveIssue(item: DocumentCase, issueId: string, input: string, reason = ''): DocumentCase {
  if (item.status === 'approved') throw new Error('An approved packet cannot be changed. Start a new case instead.')
  const issue = item.issues.find(i => i.id === issueId) || pendingIssues(item).find(i => i.id === issueId)
  if (!issue) throw new Error('This exception does not exist.')
  const value = input.trim()
  if (!value || value.length > 500) throw new Error('Enter a value between 1 and 500 characters.')
  const option = issue.options.find(o => o.value === value)
  if (issue.kind === 'conflict' && !option) throw new Error('Choose a value from the source evidence.')
  if (reason.trim().length < 3 || reason.length > 500) throw new Error('Enter a decision reason between 3 and 500 characters.')
  const sourceId = option?.sourceId || 'reviewer'
  const next: DocumentCase = {
    ...item, name: issue.field === 'legalName' ? value : item.name, updatedAt: new Date().toISOString(),
    facts: item.facts.map(f => f.key === issue.field ? { ...f, value, sourceId, quote: value } : f),
    issues: item.issues.some(i => i.id === issueId) ? item.issues.map(i => i.id === issueId ? { ...i, resolution: { value, sourceId, reason: reason.trim() } } : i) : [...item.issues, { ...issue, resolution: { value, sourceId, reason: reason.trim() } }],
    audit: [...item.audit, event(item.assignee || 'Guest User', `${issue.resolution ? 'Revised' : 'Recorded'} ${FIELD_LABELS[issue.field].toLowerCase()}`, `${value} · ${option?.label || 'Reviewer supplied'}. Reason: ${reason.trim()}`, 'review')],
  }
  next.status = statusFor(next)
  return next
}

export function approveCase(item: DocumentCase): DocumentCase {
  if (item.status === 'approved') return item
  if (!canApprove(item)) throw new Error('Resolve the required exceptions before approving this packet.')
  return { ...item, status: 'approved', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), audit: [...item.audit, event(item.assignee || 'Guest User', 'Packet approved', 'Both documents approved for local download. No documents were sent or signed.', 'approved')] }
}

export function initialWorkspace(): WorkspaceState {
  const policies = Object.fromEntries(SCENARIOS.map(s => [s.id, [...DEFAULT_POLICIES[s.id]]])) as Record<ScenarioId, FactKey[]>
  const cases = SCENARIOS.map((s, i) => {
    let item = createCase(s.id, `DA-${2048 + i}`)
    if (s.id === 'property') item = approveCase(item)
    const received = new Date()
    for (let day = 0; day <= i; day++) { do { received.setUTCDate(received.getUTCDate() - 1) } while ([0, 6].includes(received.getUTCDay())) }
    received.setUTCHours(14, 15 + i * 10, 0, 0)
    const start = received.getTime()
    const createdAt = new Date(start).toISOString()
    const audit = item.audit.map((entry, index) => ({ ...entry, at: new Date(start + index * 120000).toISOString() }))
    return { ...item, createdAt, dueAt: dueDate(createdAt), updatedAt: audit[audit.length - 1].at, ...(item.status === 'approved' ? { approvedAt: audit[audit.length - 1].at } : {}), audit, sources: item.sources.map(source => ({ ...source, recordedAt: new Date(start - (source.id === 'record' ? 30 * 86400000 : 0)).toISOString() })) }
  })
  return { version: 2, cases, policies }
}
export function updatePolicy(state: WorkspaceState, scenario: ScenarioId, key: FactKey, required: boolean): WorkspaceState {
  if (['legalName', 'reference'].includes(key) && !required) throw new Error('Legal name and record reference are always required.')
  const keys = state.policies[scenario].filter(k => k !== key)
  if (required) keys.push(key)
  return { ...state, policies: { ...state.policies, [scenario]: FIELD_KEYS.filter(k => keys.includes(k)) } }
}

export function readWorkspace(raw: string | null): WorkspaceState | null {
  if (!raw || raw.length > MAX_STORAGE_LENGTH) return null
  try {
    const state = JSON.parse(raw) as WorkspaceState
    const string = (v: unknown) => typeof v === 'string' && v.length <= 10000
    const validDate = (v: unknown) => string(v) && Number.isFinite(Date.parse(v as string))
    if (![1, 2].includes(state.version) || !state.policies || !Array.isArray(state.cases) || state.cases.length < 1 || state.cases.length > 100) return null
    for (const s of SCENARIOS) {
      const policy = state.policies[s.id]
      if (!Array.isArray(policy) || !policy.every(k => FIELD_KEYS.includes(k)) || !['legalName', 'reference'].every(k => policy.includes(k as FactKey))) return null
    }
    const ids = new Set<string>()
    for (const c of state.cases) {
      if (!string(c.id) || ids.has(c.id) || !string(c.name) || !validDate(c.createdAt) || !SCENARIOS.some(s => s.id === c.scenario)) return null
      ids.add(c.id)
      if (!['review', 'blocked', 'approved'].includes(c.status) || !Array.isArray(c.required) || !c.required.every(k => FIELD_KEYS.includes(k)) || !['legalName', 'reference'].every(k => c.required.includes(k as FactKey))) return null
      if (!Array.isArray(c.facts) || c.facts.length !== FIELD_KEYS.length || !FIELD_KEYS.every(k => c.facts.filter(f => f.key === k).length === 1)) return null
      if (!c.facts.every(f => string(f.value) && string(f.quote) && string(f.sourceId))) return null
      if (!Array.isArray(c.sources) || c.sources.length !== 3 || !c.sources.every(s => string(s.id) && string(s.name) && string(s.origin) && ['PDF', 'EMAIL', 'RECORD'].includes(s.kind) && Array.isArray(s.sections) && s.sections.every(p => string(p.label) && string(p.body)))) return null
      if (!c.facts.every(f => f.sourceId === 'reviewer' || c.sources.some(s => s.id === f.sourceId))) return null
      if (!Array.isArray(c.issues) || !c.issues.every(i => string(i.id) && FIELD_KEYS.includes(i.field) && ['conflict', 'missing'].includes(i.kind) && string(i.description) && Array.isArray(i.options) && i.options.every(o => string(o.value) && string(o.label) && c.sources.some(s => s.id === o.sourceId)) && (!i.resolution || (string(i.resolution.value) && c.facts.some(f => f.key === i.field && f.value === i.resolution!.value && f.sourceId === i.resolution!.sourceId))))) return null
      if (!Array.isArray(c.audit) || !c.audit.every(a => string(a.id) && validDate(a.at) && string(a.actor) && string(a.action) && string(a.detail) && ['system', 'review', 'approved'].includes(a.kind))) return null
      if (c.status === 'approved' ? !validDate(c.approvedAt) || !canApprove(c) || c.audit.filter(a => a.kind === 'approved').length !== 1 : c.status !== statusFor(c)) return null
    }
    const legacy = (state.version as number) === 1
    for (const c of state.cases) {
      if (!legacy && (!string(c.assignee) || !validDate(c.dueAt) || !validDate(c.updatedAt) || !string(c.templateVersion) || !Array.isArray(c.context) || !c.context.every(f => string(f.label) && string(f.value)))) return null
      if (legacy) { c.assignee = 'Guest User'; c.dueAt = dueDate(c.createdAt); c.updatedAt = c.audit.at(-1)?.at || c.createdAt; c.templateVersion = '1.0'; c.context = [] }
      c.assignee = 'Guest User'
      c.context = c.context.map(f => ({ ...f, value: f.label === 'Engagement owner' ? 'Guest User' : f.value }))
      c.audit = c.audit.map(entry => ({ ...entry, actor: entry.kind === 'review' || entry.kind === 'approved' ? 'Guest User' : entry.actor }))
      if (!c.sources.every(source => !source.recordedAt || validDate(source.recordedAt))) return null
      if (!c.issues.every(issue => !issue.resolution?.reason || string(issue.resolution.reason))) return null
    }
    for (const c of state.cases) {
      for (const issue of c.issues) {
        if (!issue.resolution) continue
        if (!issue.resolution.value.trim()) return null
        if (issue.kind === 'conflict' && !issue.options.some(option => option.value === issue.resolution!.value && option.sourceId === issue.resolution!.sourceId)) return null
        if (issue.kind === 'missing' && issue.resolution.sourceId !== 'reviewer') return null
        if (!legacy && c.templateVersion !== '1.0' && (!issue.resolution.reason || issue.resolution.reason.trim().length < 3)) return null
      }
    }
    return { ...state, version: 2 }
  } catch { return null }
}

export function escapeHTML(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)) }
export function documentHTML(item: DocumentCase, index = 0): string {
  const esc = escapeHTML, scenario = scenarioFor(item.scenario), approved = item.status === 'approved'
  const reviewer = item.audit.find(entry => entry.kind === 'approved')?.actor || item.assignee
  const approval = approved ? `Approved by ${reviewer} on ${formatDate(item.approvedAt!)} · source references included` : 'Draft · review required · source references included'
  const fieldRows = item.facts.map(f => {
    const held = pendingIssues(item).some(issue => issue.field === f.key)
    const decision = item.issues.find(issue => issue.field === f.key)?.resolution
    const source = f.sourceId === 'reviewer' ? 'Reviewer supplied' : item.sources.find(source => source.id === f.sourceId)?.name || ''
    return `<div class="document-field"><dt>${esc(FIELD_LABELS[f.key])}</dt><dd>${esc(f.value.trim() || (item.required.includes(f.key) ? 'Awaiting information' : 'Not supplied · optional'))}${held ? '<span class="draft-warning">Unresolved</span>' : ''}<small>${esc(decision ? `Reviewer selected · ${source}` : source)}${decision?.reason ? `<br>Decision reason: ${esc(decision.reason)}` : ''}</small></dd></div>`
  }).join('')
  const contextRows = (item.context || []).map(f => `<div class="document-field"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<small>Submitted intake form</small></dd></div>`).join('')
  const content = index === 0 ? `<div class="document-entity"><span class="mini-label">PREPARED FOR</span><h3>${esc(getFact(item, 'legalName'))}</h3><span>${esc(getFact(item, 'reference'))} · Template ${esc(item.templateVersion || '1.0')}</span></div><dl class="document-fields">${fieldRows}${contextRows}</dl>` : `<div class="verification-summary"><div class="verification-stats"><span><b>${item.sources.length}</b>Source extracts</span><span><b>${item.facts.length}</b>Mapped facts</span><span><b>${item.issues.filter(issue => issue.resolution).length}</b>Reviewer decisions</span></div><dl class="document-fields">${fieldRows}</dl><h3>Approval record</h3><p>${approved ? esc(approval) : 'Human approval is pending.'}</p><h3>Case activity</h3><ol class="document-history">${item.audit.map(entry => `<li><b>${esc(entry.action)}</b><p>${esc(entry.detail)}</p><small>${esc(entry.actor)} · ${esc(formatDate(entry.at))}</small></li>`).join('')}</ol></div>`
  return `<article class="document-preview" aria-label="${esc(index === 0 ? scenario.output : 'Verification record')}"><header class="document-letterhead"><div class="document-brand">DAAM<span>DOCUMENT OPERATIONS</span></div><div>${esc(item.id)}<br><span>Document 0${index + 1} / 02</span></div></header><div class="document-meta">${esc(scenario.sector)}<span>${approved ? 'APPROVED FOR DOWNLOAD' : 'DRAFT · REVIEW REQUIRED'}</span></div><h2>${esc(index === 0 ? scenario.output : 'Verification record')}.</h2><p class="document-description">${index === 0 ? esc(approved ? `Reviewed information for ${scenario.title.toLowerCase()}.` : `Draft information for ${scenario.title.toLowerCase()}. Review unresolved fields before approval.`) : 'Source references, exception decisions and approval history for this packet.'}</p>${content}<div class="document-approval ${approved ? 'approved' : ''}"><div><b>${approved ? 'Human approval recorded' : 'Human approval required'}</b><span>${approved ? 'The approved snapshot is ready for download.' : 'This document remains a draft until the packet is approved.'}</span></div></div><footer class="document-foot"><span>${esc(approval)}</span><span>Document ${index + 1} / 2</span></footer></article>`
}
export function packetHTML(item: DocumentCase): string {
  if (item.status !== 'approved' || !canApprove(item)) throw new Error('Approve the packet before downloading.')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(item.name)} · DAAM packet</title><style>body{font:15px/1.65 system-ui,sans-serif;color:#26332c;background:#f6f7f4;margin:0;padding:24px}.document-preview{max-width:850px;margin:0 auto 28px;padding:40px;background:#fffefa;break-after:page}.document-letterhead{display:flex;justify-content:space-between;border-bottom:2px solid #365b46;padding-bottom:18px}.document-brand{font-weight:700;font-size:25px}.document-brand span{display:block;font-size:12px}.document-meta{display:flex;justify-content:space-between;gap:16px;font-size:12px;margin:24px 0}h2{font-size:32px}.document-fields{margin:24px 0}.document-field{display:grid;grid-template-columns:30% 1fr;gap:16px;padding:14px 0;border-bottom:1px solid #d9ded4}dt{font-weight:600}dd{margin:0}small,.document-field small{display:block;color:#52604e;font-size:12px}.document-approval{border:1px solid #ccd6c4;padding:16px}.document-approval span{display:block}.document-foot{display:flex;justify-content:space-between;gap:20px;font-size:12px;margin-top:24px}.document-history{padding-left:20px}.document-history li{margin:16px 0}.verification-stats{display:flex;gap:30px}.verification-stats span{display:grid}.verification-stats b{font-size:28px}@media print{body{background:white;padding:0}.document-preview{padding:0;max-width:none}.document-preview:last-of-type{break-after:auto}}@media(max-width:600px){.document-preview{padding:20px}.document-field{grid-template-columns:1fr;gap:6px}.document-meta{flex-wrap:wrap}}</style></head><body>${documentHTML(item, 0)}${documentHTML(item, 1)}<p style="max-width:850px;margin:auto">Example workspace · fictional records · source references included, files not attached. Use your browser’s Print command to save as PDF.</p></body></html>`
}
