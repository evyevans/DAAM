'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Upload, Settings, Trash2, CheckCircle, AlertCircle, Plus, Zap } from 'lucide-react'
import { api } from '@/lib/api'

interface OrgTemplate {
  id: string
  name: string
  doc_type: string
  original_filename: string
  field_map: Record<string, string>
  jurisdiction_hint: string | null
  is_active: boolean
  created_at: string
}

interface FieldMapEditorProps {
  template: OrgTemplate
  orgId: string
  onSaved: () => void
  onClose: () => void
}

interface TriggerWizardProps {
  template: OrgTemplate
  orgId: string
  onClose: () => void
}

const DOC_TYPE_LABELS: Record<string, string> = {
  buyer_rep: 'Buyer Rep Agreement',
  listing: 'Listing Agreement',
  offer: 'Offer / Purchase & Sale',
  closing: 'Closing Summary',
  custom: 'Custom Document',
}

const FUB_FIELD_OPTIONS = [
  '',
  'contact.full_name',
  'contact.first_name',
  'contact.last_name',
  'contact.email',
  'contact.phone',
  'contact.address',
  'deal.address',
  'deal.price',
  'deal.close_date',
  'agent.full_name',
  'agent.email',
  'agent.phone',
  'agent.brokerage_name',
  'config.agreement_commission_rate',
  'system.today',
]

function FieldMapEditor({ template, orgId, onSaved, onClose }: FieldMapEditorProps) {
  const [fieldMap, setFieldMap] = useState<Record<string, string>>(template.field_map || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateTemplate(template.id, orgId, { field_map: fieldMap })
      setSaved(true)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ width: '100%', maxWidth: '580px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Configure Field Mappings</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{template.name}</div>
        </div>

        {/* Field list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Map each placeholder found in your template to a CRM field. Leave blank to fill manually.
          </p>
          {Object.keys(fieldMap).length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No placeholders detected in this template.
            </div>
          )}
          {Object.entries(fieldMap).map(([placeholder, fubField]) => (
            <div key={placeholder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <div style={{
                padding: '8px 12px', background: 'var(--bg-primary)',
                borderRadius: '6px', border: '1px solid var(--border)',
                fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)',
              }}>
                {`{{${placeholder}}}`}
              </div>
              <select
                value={fubField}
                onChange={e => setFieldMap(prev => ({ ...prev, [placeholder]: e.target.value }))}
                style={{
                  padding: '8px 12px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: fubField ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px', cursor: 'pointer', outline: 'none',
                }}
              >
                {FUB_FIELD_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt || '— not mapped —'}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '13px' }}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: '13px', minWidth: '80px',
              background: saved ? 'var(--green)' : undefined,
            }}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Mappings'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TriggerWizard({ template, orgId, onClose }: TriggerWizardProps) {
  const [triggers, setTriggers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // New trigger form
  const [source, setSource] = useState('telegram')
  const [eventType, setEventType] = useState('message')
  const [routingTier, setRoutingTier] = useState('HOLD_FOR_APPROVAL')
  const [conditionField, setConditionField] = useState('')
  const [conditionValue, setConditionValue] = useState('')

  const loadTriggers = async () => {
    try {
      const res = await api.getTemplateTriggers(template.id, orgId)
      setTriggers(res.triggers || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTriggers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    try {
      await api.createTemplateTrigger(template.id, orgId, {
        source,
        event_type: eventType,
        routing_tier: routingTier,
        condition_field: conditionField || null,
        condition_value: conditionValue || null,
      })
      setConditionField('')
      setConditionValue('')
      await loadTriggers()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDelete = async (triggerId: string) => {
    try {
      await api.deleteTemplateTrigger(template.id, triggerId, orgId)
      setTriggers(prev => prev.filter(t => t.id !== triggerId))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Trigger Wizard</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{template.name}</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '6px 10px', fontSize: '12px' }}>Close</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* List existing */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>ACTIVE TRIGGERS</h4>
            {loading ? (
              <div className="skeleton" style={{ height: '50px', borderRadius: '6px' }} />
            ) : triggers.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                No triggers configured. This document can only be generated manually.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {triggers.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: 'var(--bg-primary)',
                    border: '1px solid var(--border)', borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t.source} &rarr; {t.event_type}
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--amber-glow)', color: 'var(--amber)', borderRadius: '4px' }}>
                          {t.routing_tier}
                        </span>
                      </div>
                      {(t.condition_field || t.condition_value) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          If <span className="mono">{t.condition_field}</span> == <span className="mono">{t.condition_value}</span>
                        </div>
                      )}
                    </div>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer' }} onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 600 }}>Add New Trigger</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SOURCE</label>
                <select value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '12px' }}>
                  <option value="telegram">Telegram</option>
                  <option value="webhook">Webhook (CRM)</option>
                  <option value="dashboard">Dashboard (Manual)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>EVENT TYPE</label>
                <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="e.g. message, stage_change" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ROUTING TIER (Approval required?)</label>
              <select value={routingTier} onChange={e => setRoutingTier(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '12px' }}>
                <option value="HOLD_FOR_APPROVAL">Hold for Approval (Recommended)</option>
                <option value="AUTO_SEND">Auto-Send (Fully Autonomous)</option>
                <option value="NOTIFY_AND_SEND">Notify & Send</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CONDITION FIELD (Optional)</label>
                <input value={conditionField} onChange={e => setConditionField(e.target.value)} placeholder="e.g. data.intent" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CONDITION VALUE (Optional)</label>
                <input value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="e.g. generate_doc" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button className="btn-primary" onClick={handleCreate} style={{ fontSize: '12px', width: '100%' }}>Add Trigger</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPanel({ orgId }: { orgId: string }) {
  const [templates, setTemplates] = useState<OrgTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<OrgTemplate | null>(null)
  const [wizardTemplate, setWizardTemplate] = useState<OrgTemplate | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [uploadName, setUploadName] = useState('')
  const [uploadDocType, setUploadDocType] = useState('buyer_rep')
  const [uploadJurisdiction, setUploadJurisdiction] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadGoogleUrl, setUploadGoogleUrl] = useState(false)
  const [googleUrlInput, setGoogleUrlInput] = useState('')

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates(orgId)
      setTemplates(data.templates || [])
    } catch {
      // Backend unreachable — demo mode
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTemplates() }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (!uploadName) setUploadName(file.name.replace(/\.(docx|pdf)$/i, ''))
  }

  const handleUpload = async () => {
    if ((!uploadGoogleUrl && !selectedFile) || (uploadGoogleUrl && !googleUrlInput) || !uploadName) return
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    formData.append('org_id', orgId)
    formData.append('name', uploadName)
    formData.append('doc_type', uploadDocType)
    formData.append('jurisdiction_hint', uploadJurisdiction)
    
    if (uploadGoogleUrl) {
      formData.append('google_doc_url', googleUrlInput)
    } else if (selectedFile) {
      formData.append('file', selectedFile)
    }

    try {
      const result = await api.uploadTemplate(formData)
      setUploadSuccess(
        `Uploaded successfully. Found ${result.placeholders_found} placeholders, ` +
        `${result.mapped_fields} auto-mapped.`
      )
      setShowUploadForm(false)
      setSelectedFile(null)
      setGoogleUrlInput('')
      setUploadName('')
      setUploadDocType('buyer_rep')
      setUploadJurisdiction('')
      await loadTemplates()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (tmpl: OrgTemplate) => {
    if (!confirm(`Delete "${tmpl.name}"? This will stop agents from using this template.`)) return
    try {
      await api.deleteTemplate(tmpl.id, orgId)
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id))
    } catch {
      // ignore
    }
  }

  const MISSING_TYPES = Object.keys(DOC_TYPE_LABELS).filter(
    dt => !templates.some(t => t.doc_type === dt && t.is_active)
  )

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Document Templates</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Upload your jurisdiction-compliant forms. Agents auto-fill them with CRM data at runtime.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowUploadForm(true); setUploadError(''); setUploadSuccess('') }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          <Plus size={14} /> Upload Template
        </button>
      </div>

      {/* Compliance notice */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)',
      }}>
        <strong style={{ color: 'var(--amber)' }}>Compliance:</strong> By uploading a template you confirm it complies with applicable laws in your jurisdiction. DAAM provides automation only and does not provide legal advice.
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ fontWeight: 600, marginBottom: '16px' }}>New Template</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                TEMPLATE NAME
              </label>
              <input
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="Buyer Rep Agreement — Ontario 2024"
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                DOCUMENT TYPE
              </label>
              <select
                value={uploadDocType}
                onChange={e => setUploadDocType(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              JURISDICTION (optional — informational only)
            </label>
            <input
              value={uploadJurisdiction}
              onChange={e => setUploadJurisdiction(e.target.value)}
              placeholder="e.g. Ontario, Canada · California, USA · Queensland, AU"
              style={{
                width: '100%', padding: '9px 12px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" name="uploadType" checked={!uploadGoogleUrl} onChange={() => setUploadGoogleUrl(false)} />
              File Upload (.docx, .pdf)
            </label>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" name="uploadType" checked={uploadGoogleUrl} onChange={() => setUploadGoogleUrl(true)} />
              Google Doc URL
            </label>
          </div>

          {!uploadGoogleUrl ? (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${selectedFile ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '8px', padding: '24px', textAlign: 'center',
                  cursor: 'pointer', marginBottom: '16px',
                  background: selectedFile ? 'var(--accent-glow)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={20} color={selectedFile ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', color: selectedFile ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                  {selectedFile ? selectedFile.name : 'Click to select .docx or .pdf'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Max 20 MB</div>
              </div>
              <input ref={fileInputRef} type="file" accept=".docx,.pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
            </>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                GOOGLE DOC URL
              </label>
              <input
                value={googleUrlInput}
                onChange={e => setGoogleUrlInput(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-ghost" style={{ fontSize: '13px' }} onClick={() => setShowUploadForm(false)}>Cancel</button>
            <button
              className="btn-primary"
              style={{ fontSize: '13px' }}
              onClick={handleUpload}
              disabled={uploading || ((!uploadGoogleUrl && !selectedFile) || (uploadGoogleUrl && !googleUrlInput)) || !uploadName}
            >
              {uploading ? 'Parsing & Uploading…' : 'Upload Template'}
            </button>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--green-glow)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '13px', color: 'var(--green)' }}>
          <CheckCircle size={14} /> {uploadSuccess}
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '10px' }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>No templates uploaded yet</div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Upload your jurisdiction-compliant DOCX or PDF templates. Agents will auto-fill them with lead data from your CRM.
          </p>
          <button className="btn-primary" style={{ fontSize: '13px' }} onClick={() => setShowUploadForm(true)}>
            Upload Your First Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {templates.map(t => {
            const mapped = Object.values(t.field_map || {}).filter(Boolean).length
            const total = Object.keys(t.field_map || {}).length
            return (
              <div key={t.id} className="glass" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '8px', flexShrink: 0,
                  background: 'var(--accent-glow)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {t.name}
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', letterSpacing: '0.06em',
                    }}>
                      {DOC_TYPE_LABELS[t.doc_type] || t.doc_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {total > 0 ? `${mapped}/${total} fields mapped` : 'No placeholders detected'}
                    {t.jurisdiction_hint && ` · ${t.jurisdiction_hint}`}
                    {' · '}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{t.original_filename}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setWizardTemplate(t)}
                  >
                    <Zap size={13} /> Triggers
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setEditingTemplate(t)}
                  >
                    <Settings size={13} /> Fields
                  </button>
                  <button
                    style={{
                      padding: '6px 10px', background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                      color: 'var(--red)', cursor: 'pointer', fontSize: '12px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                    onClick={() => handleDelete(t)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Missing doc types hint */}
      {templates.length > 0 && MISSING_TYPES.length > 0 && (
        <div className="glass" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            No template uploaded for:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MISSING_TYPES.map(dt => (
              <span
                key={dt}
                onClick={() => { setUploadDocType(dt); setShowUploadForm(true) }}
                style={{
                  padding: '4px 12px', background: 'var(--bg-primary)',
                  border: '1px dashed var(--border)', borderRadius: '20px',
                  fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                + {DOC_TYPE_LABELS[dt]}
              </span>
            ))}
          </div>
        </div>
      )}

      {editingTemplate && (
        <FieldMapEditor
          template={editingTemplate}
          orgId={orgId}
          onSaved={loadTemplates}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {wizardTemplate && (
        <TriggerWizard
          template={wizardTemplate}
          orgId={orgId}
          onClose={() => setWizardTemplate(null)}
        />
      )}
    </div>
  )
}
