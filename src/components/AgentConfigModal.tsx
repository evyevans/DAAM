'use client'

import { useState, useEffect } from 'react'
import { X, Save, Sliders } from 'lucide-react'
import { api } from '@/lib/api'

interface AgentConfigModalProps {
  persona: {
    id: string
    codename: string
    display_name: string
    role: string
    avatar_emoji: string
    persona_prompt: string
    hitl_threshold: Record<string, number>
    escalation_channel: string
    is_active: boolean
  }
  onClose: () => void
  onSaved: () => void
}

const ESCALATION_CHANNELS = ['telegram', 'sms', 'email', 'dashboard']

export default function AgentConfigModal({ persona, onClose, onSaved }: AgentConfigModalProps) {
  const [prompt, setPrompt] = useState(persona.persona_prompt || '')
  const [confidenceThreshold, setConfidenceThreshold] = useState(
    (persona.hitl_threshold?.confidence_below ?? 0.7) * 100
  )
  const [dollarThreshold, setDollarThreshold] = useState(
    persona.hitl_threshold?.dollar_above ?? 50000
  )
  const [escalationChannel, setEscalationChannel] = useState(persona.escalation_channel || 'telegram')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAgent(persona.id, {
        persona_prompt: prompt,
        hitl_threshold: {
          confidence_below: confidenceThreshold / 100,
          dollar_above: dollarThreshold,
        },
        escalation_channel: escalationChannel,
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); onSaved() }, 1200)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Trap escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass" style={{
        width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid var(--border-bright)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{persona.avatar_emoji}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)' }}>
                  {persona.codename}
                </span>
                <Sliders size={12} color="var(--text-muted)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{persona.display_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Persona Prompt */}
          <div>
            <label style={labelStyle}>BEHAVIORAL INSTRUCTIONS</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Custom instructions that shape how this agent responds and makes decisions.
            </p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={5}
              placeholder={`You are ${persona.display_name}. Prioritize leads with high intent signals. Always verify with the human before making offers above $500k...`}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)',
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                resize: 'vertical', outline: 'none',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* HITL Thresholds */}
          <div>
            <label style={labelStyle}>HUMAN-IN-THE-LOOP (HITL) THRESHOLDS</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              The agent will escalate to you before acting when these thresholds are crossed.
            </p>

            {/* Confidence */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Escalate when confidence below</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--amber)' }}>
                  {Math.round(confidenceThreshold)}%
                </span>
              </div>
              <input
                type="range" min={10} max={95} value={confidenceThreshold}
                onChange={e => setConfidenceThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>10% (almost never)</span><span>95% (almost always)</span>
              </div>
            </div>

            {/* Dollar threshold */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Escalate for deals above</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>
                  ${dollarThreshold.toLocaleString()}
                </span>
              </div>
              <input
                type="range" min={0} max={2000000} step={25000} value={dollarThreshold}
                onChange={e => setDollarThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>$0 (all deals)</span><span>$2M+</span>
              </div>
            </div>
          </div>

          {/* Escalation Channel */}
          <div>
            <label style={labelStyle}>ESCALATION CHANNEL</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Where this agent sends HITL approval requests.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {ESCALATION_CHANNELS.map(ch => {
                const icons: Record<string, string> = { telegram: '💬', sms: '📱', email: '📧', dashboard: '🖥️' }
                return (
                  <button
                    key={ch}
                    onClick={() => setEscalationChannel(ch)}
                    style={{
                      padding: '10px 8px', borderRadius: '8px', cursor: 'pointer',
                      background: escalationChannel === ch ? 'var(--accent-glow)' : 'var(--bg-primary)',
                      border: `1px solid ${escalationChannel === ch ? 'var(--accent)' : 'var(--border)'}`,
                      color: escalationChannel === ch ? 'var(--accent-bright)' : 'var(--text-muted)',
                      fontSize: '13px', fontWeight: escalationChannel === ch ? 600 : 400,
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    } as React.CSSProperties}
                  >
                    <span style={{ fontSize: '18px' }}>{icons[ch]}</span>
                    <span style={{ textTransform: 'capitalize' }}>{ch}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          position: 'sticky', bottom: 0, background: 'var(--bg-card)',
        }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: saved ? 'var(--green)' : undefined,
              boxShadow: saved ? '0 0 20px rgba(16,185,129,0.3)' : undefined,
            }}
          >
            <Save size={14} />
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: '6px',
}
