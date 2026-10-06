'use client'
import { useEffect, useState } from 'react'
import { Home, MessageCircle, Smartphone, Brain, Folder, Zap, Mail, Plug, Wrench } from 'lucide-react'
import { api } from '@/lib/api'

const TOOL_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  fub_api:       { label: 'Follow Up Boss', icon: <Home size={22} color="var(--accent)" />, desc: 'CRM data sync and webhook automation' },
  telegram_bot:  { label: 'Telegram Bot',   icon: <MessageCircle size={22} color="var(--blue)" />, desc: 'Human command channel and HITL approvals' },
  twilio_sms:    { label: 'Twilio SMS',     icon: <Smartphone size={22} color="var(--green)" />, desc: 'Outbound SMS for lead follow-up sequences' },
  anthropic_ai:  { label: 'Claude AI',      icon: <Brain size={22} color="var(--purple)" />, desc: 'AI reasoning for lead scoring and document generation' },
  google_drive:  { label: 'Google Drive',   icon: <Folder size={22} color="var(--amber)" />, desc: 'Document storage and template management' },
  openai:        { label: 'OpenAI',         icon: <Zap size={22} color="var(--text-primary)" />, desc: 'Embedding and reasoning fallback' },
  gmail_oauth:   { label: 'Gmail',          icon: <Mail size={22} color="var(--red)" />, desc: 'Inbox monitoring and email agent' },
}

export default function ToolsPanel({ orgId }: { orgId: string }) {
  const [tools, setTools] = useState<any[]>([])
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await api.getTools(orgId)
      setTools(data.tools || [])
    } catch { /* backend offline */ }
  }

  useEffect(() => { load() }, [orgId])

  const handleToggle = async (toolName: string) => {
    setToggling(toolName)
    try {
      await api.toggleTool(toolName, orgId)
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setToggling(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
        TOOL REGISTRY — {tools.filter(t => t.is_enabled).length}/{tools.length} ENABLED
      </div>

      {tools.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Wrench size={36} color="var(--text-muted)" /></div>
          <div>No tools registered. Complete onboarding to provision your tool stack.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {tools.map((tool: any) => {
            const meta = TOOL_META[tool.tool_name] || { label: tool.tool_name, icon: <Plug size={22} color="var(--text-muted)" />, desc: '' }
            return (
              <div
                key={tool.id}
                className="glass"
                style={{
                  padding: '18px',
                  borderColor: tool.is_enabled ? 'var(--border-bright)' : 'var(--border)',
                  opacity: tool.is_enabled ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px' }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{meta.label}</div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tool.tool_name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(tool.tool_name)}
                    disabled={toggling === tool.tool_name}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${tool.is_enabled ? 'var(--green)' : 'var(--border)'}`,
                      background: tool.is_enabled ? 'var(--green-glow)' : 'transparent',
                      color: tool.is_enabled ? 'var(--green)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {toggling === tool.tool_name ? '…' : tool.is_enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{meta.desc}</div>
                {tool.quota_limit && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Quota</span>
                      <span>{tool.quota_used}/{tool.quota_limit}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min((tool.quota_used / tool.quota_limit) * 100, 100)}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
