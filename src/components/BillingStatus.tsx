'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

const TIER_FEATURES: Record<string, string[]> = {
  starter:   ['1 autonomous agent', '2,500 tasks/month', 'FUB integration', 'Telegram command interface'],
  pro:       ['5 autonomous agents', '25,000 tasks/month', '3 CRM integrations', 'Full document automation'],
  brokerage: ['Unlimited agents', '100,000 tasks/month', 'Unlimited CRMs', 'White-label branding'],
}

export default function BillingStatus({ billing, usage, orgId }: { billing: any; usage: any; orgId: string }) {
  const [portalLoading, setPortalLoading] = useState(false)

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const data = await api.createPortal({ org_id: orgId, return_url: window.location.href })
      window.open((data as { url: string }).url, '_blank')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setPortalLoading(false)
    }
  }

  const tier = billing?.plan_tier || 'starter'
  const STATUS_COLORS: Record<string, string> = {
    active: 'var(--green)', trialing: 'var(--accent)',
    past_due: 'var(--red)', canceled: 'var(--red)',
  }
  const statusColor = STATUS_COLORS[billing?.stripe_status || 'active'] || 'var(--text-muted)'


  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Past Due Alert */}
      {billing?.stripe_status === 'past_due' && (
        <div style={{
          padding: '24px',
          background: 'var(--red-glow)',
          border: '1px solid var(--red)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px' }}>
            ⚠️ Payment Past Due
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Your agents continue working for the next{' '}
            <strong style={{ color: 'white' }}>{Math.ceil(billing.grace_hours_remaining || 0)} hours</strong>.
            After that, your fleet will be suspended.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fca5a5' }}>
              🔴 {billing.leads_at_risk}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'white' }}>Leads at Risk</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Will lose automated follow-up when fleet pauses</div>
            </div>
          </div>
          <button className="btn-primary" onClick={handlePortal} disabled={portalLoading}
            style={{ background: 'var(--red)', boxShadow: '0 0 20px rgba(239,68,68,0.3)', width: '100%', padding: '12px' }}>
            {portalLoading ? 'Opening…' : 'Update Payment Method →'}
          </button>
        </div>
      )}

      {/* Status Card */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '6px' }}>SUBSCRIPTION</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: '13px', color: statusColor, fontWeight: 600 }}>
                {billing?.stripe_status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
          <button className="btn-ghost" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading ? 'Opening…' : 'Manage Billing →'}
          </button>
        </div>

        {/* Plan features */}
        <div style={{ marginBottom: '20px' }}>
          {(TIER_FEATURES[tier] || []).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--green)' }}>✓</span> {f}
            </div>
          ))}
        </div>

        {/* Agent fleet summary */}
        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE AGENTS</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>
              {billing?.fleet?.active_agents ?? '—'} / {billing?.fleet?.max_active_agents ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TASKS THIS MONTH</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
              {(usage?.tasks_used ?? 0).toLocaleString()} / {(usage?.monthly_task_limit ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {tier !== 'brokerage' && (
        <div className="glass" style={{ padding: '24px', border: '1px solid rgba(59,130,246,0.3)', background: 'var(--accent-glow)' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
            🚀 Upgrade to {tier === 'starter' ? 'Pro' : 'Brokerage'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {tier === 'starter'
              ? 'Deploy 5 agents, unlock 25,000 monthly tasks and full document automation.'
              : 'Unlimited agents and 100K tasks for your entire brokerage team.'}
          </div>
          <button className="btn-primary">
            Upgrade Fleet → {tier === 'starter' ? '$599/mo' : '$1,499/mo'}
          </button>
        </div>
      )}
    </div>
  )
}
