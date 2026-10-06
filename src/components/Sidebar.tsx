'use client'
import { LayoutDashboard, Bot, Activity, Wrench, FileText, Settings } from 'lucide-react'
import type { ActiveView } from '@/app/page'

const NAV = [
  { id: 'command',   label: 'Command',   icon: LayoutDashboard },
  { id: 'fleet',     label: 'Fleet',     icon: Bot },
  { id: 'activity',  label: 'Activity',  icon: Activity },
  { id: 'tools',     label: 'Tools',     icon: Wrench },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'settings',  label: 'API Settings',   icon: Settings },
] as const

export default function Sidebar({
  activeView,
  setActiveView,
}: {
  activeView: ActiveView
  setActiveView: (v: ActiveView) => void
}) {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>DAAM</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>COMMAND CENTER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id as ActiveView)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '2px',
                background: active ? 'var(--accent-glow)' : 'transparent',
                color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                textAlign: 'left',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          v2.0 · AaaS
        </div>
      </div>
    </aside>
  )
}
