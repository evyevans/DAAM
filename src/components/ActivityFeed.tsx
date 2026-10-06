'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const SEVERITY_COLOR: Record<string, string> = {
  info: 'var(--text-muted)',
  success: 'var(--green)',
  warning: 'var(--amber)',
  error: 'var(--red)',
}

const SEVERITY_BG: Record<string, string> = {
  info: 'transparent',
  success: 'rgba(16,185,129,0.04)',
  warning: 'rgba(245,158,11,0.04)',
  error: 'rgba(239,68,68,0.04)',
}

// Military-format event type labels
const EVENT_LABEL: Record<string, string> = {
  lead_qualified: 'LEAD.QUALIFIED',
  doc_generated:  'DOC.GENERATED',
  webhook_received: 'WEBHOOK.RECV',
  sequence_step:  'SEQ.STEP',
  crm_updated:    'CRM.UPDATED',
  approval_sent:  'APPROVAL.SENT',
  system_error:   'SYS.ERROR',
  task_completed: 'TASK.DONE',
}

// Demo feed removed for production
const DEMO_FEED: any[] = []

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityFeed({ orgId: _orgId, compact = false }: { orgId: string; compact?: boolean }) {
  const [entries, setEntries] = useState<any[]>(DEMO_FEED)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getActivity(_orgId, `limit=${compact ? 10 : 50}`)
        if (data?.workforce_history) setEntries(data.workforce_history)
      } catch (e) {
        console.error('Failed to load activity', e)
        if (entries === DEMO_FEED) setEntries([]) // Clear demo data if error
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [compact, _orgId])

  const displayed = compact ? entries.slice(0, 6) : entries

  return (
    <div className="glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: compact ? '380px' : '600px' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
          AGENT ACTIVITY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} className="pulse-green" />
          <span className="mono" style={{ fontSize: '10px', color: 'var(--green)', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.map((entry: any, i: number) => {
          const codename = entry.agent_name || entry.agent_codename || 'DAAM-CORE'
          const role = entry.category || entry.agent_role || 'System'
          const evtLabel = entry.action_label || EVENT_LABEL[entry.event_type] || entry.event_type?.replace(/_/g, '.').toUpperCase() || 'EVENT'
          const color = SEVERITY_COLOR[entry.severity] || 'var(--text-muted)'
          const bg = SEVERITY_BG[entry.severity] || 'transparent'

          return (
            <div
              key={entry.id}
              className="feed-entry"
              style={{
                padding: '8px 16px',
                borderBottom: i < displayed.length - 1 ? '1px solid rgba(30,45,69,0.4)' : 'none',
                background: bg,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '10px',
                alignItems: 'start',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {/* Left: codename + event type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  [{codename} · {role}]
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {evtLabel}
                </span>
              </div>

              {/* Middle: message */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, paddingTop: '1px', overflow: 'hidden' }}>
                {entry.message}
              </div>

              {/* Right: time */}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: '1px', textAlign: 'right' }}>
                <div>{formatTime(entry.created_at)}</div>
                <div style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{timeAgo(entry.created_at)} ago</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
