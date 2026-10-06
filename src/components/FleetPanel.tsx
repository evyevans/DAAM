'use client'
import { useState } from 'react'
import { Power, Settings, Bot, Users, FileText, Send, Crosshair } from 'lucide-react'
import { api } from '@/lib/api'
import AgentConfigModal from '@/components/AgentConfigModal'

interface AgentPersona {
  id: string
  codename: string
  display_name: string
  role: string
  avatar_emoji: string
  persona_prompt: string
  hitl_threshold: Record<string, number>
  escalation_channel: string
  is_active: boolean
  status: string
  total_tasks_completed: number
}

const STATUS_COLOR: Record<string, string> = {
  idle: 'var(--green)',
  processing: 'var(--accent)',
  paused: 'var(--amber)',
  error: 'var(--red)',
  offline: 'var(--text-muted)',
}

const PULSE_CLASS: Record<string, string> = {
  idle: 'pulse-green',
  processing: 'pulse-green',
  paused: 'pulse-amber',
  error: 'pulse-red',
  offline: '',
}

export default function FleetPanel({
  fleet,
  orgId: _orgId,
  onRefresh,
  compact = false,
}: {
  fleet: AgentPersona[]
  orgId: string
  onRefresh: () => void
  compact?: boolean
}) {
  const [toggling, setToggling] = useState<string | null>(null)
  const [configAgent, setConfigAgent] = useState<AgentPersona | null>(null)

  const handleToggle = async (personaId: string) => {
    setToggling(personaId)
    try {
      await api.toggleAgent(personaId)
      await onRefresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Toggle failed')
    } finally {
      setToggling(null)
    }
  }

  if (fleet.length === 0) {
    return (
      <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Bot size={36} color="var(--text-muted)" /></div>
        <div style={{ fontWeight: 600, marginBottom: '6px' }}>No Agents Provisioned</div>
        <div style={{ fontSize: '13px' }}>Complete onboarding to deploy your fleet</div>
      </div>
    )
  }

  const displayed = compact ? fleet.slice(0, 5) : fleet

  return (
    <>
      <div className="glass" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
            AGENT FLEET — {fleet.filter(a => a.is_active).length}/{fleet.length} ONLINE
          </div>
          {compact && fleet.length > 5 && (
            <span style={{ fontSize: '12px', color: 'var(--accent)' }}>+{fleet.length - 5} more</span>
          )}
        </div>

        {/* Agent List */}
        <div>
          {displayed.map((agent, i) => (
            <div
              key={agent.id}
              style={{
                padding: '14px 20px',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Status Dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: STATUS_COLOR[agent.status] || 'var(--text-muted)',
              }}
                className={PULSE_CLASS[agent.status] || ''}
              />

              {/* Icon */}
              <div style={{ flexShrink: 0, padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {agent.role.includes('Qualification') ? <Crosshair size={18} color="var(--accent)" /> :
                 agent.role.includes('Sequence') ? <Send size={18} color="var(--green)" /> :
                 agent.role.includes('Document') ? <FileText size={18} color="var(--purple)" /> :
                 agent.role.includes('CRM') ? <Users size={18} color="var(--amber)" /> :
                 <Bot size={18} color="var(--text-secondary)" />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                    {agent.codename}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.display_name}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {agent.total_tasks_completed?.toLocaleString() ?? 0} tasks · {agent.role?.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Config button */}
              {!compact && (
                <button
                  onClick={() => setConfigAgent(agent)}
                  title="Configure agent"
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
                    color: 'var(--text-muted)', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Settings size={13} />
                </button>
              )}

              {/* Toggle */}
              <button
                onClick={() => handleToggle(agent.id)}
                disabled={toggling === agent.id}
                style={{
                  background: agent.is_active ? 'var(--green-glow)' : 'var(--red-glow)',
                  border: `1px solid ${agent.is_active ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: agent.is_active ? 'var(--green)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: toggling === agent.id ? 0.5 : 1,
                }}
              >
                <Power size={11} />
                {toggling === agent.id ? '…' : agent.is_active ? 'Online' : 'Offline'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Config Modal */}
      {configAgent && (
        <AgentConfigModal
          persona={configAgent}
          onClose={() => setConfigAgent(null)}
          onSaved={() => { setConfigAgent(null); onRefresh() }}
        />
      )}
    </>
  )
}
