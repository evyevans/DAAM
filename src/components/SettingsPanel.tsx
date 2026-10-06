'use client'
import { useState, useEffect } from 'react'
import { Shield, Key, Check, Info, AlertTriangle, Save, Loader2, Palette } from 'lucide-react'
import { api } from '@/lib/api'
import { ThemeSwitcher } from './ThemeSwitcher'
import { BrandIcon, BRANDS } from './BrandIcon'

interface ServiceConfig {
    key: string
    label: string
    placeholder: string
    desc: string
    docs?: string
    category?: string
}

const CONFIG_SCHEMA: ServiceConfig[] = [
    // CRM
    {
        key: 'hubspot_api_key',
        label: 'HubSpot Private App Token',
        placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        desc: 'Universal CRM integration for B2B and Enterprise pipelines.',
        docs: 'https://app.hubspot.com/l/private-apps',
        category: 'Customer Relationship Management (CRM)'
    },
    {
        key: 'gohighlevel_api_key',
        label: 'GoHighLevel API Key',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        desc: 'Universal CRM integration for Agencies and SMBs.',
        docs: 'https://app.gohighlevel.com/settings/company',
        category: 'Customer Relationship Management (CRM)'
    },
    {
        key: 'fub_api_key',
        label: 'Follow Up Boss API Key',
        placeholder: 'fub_live_xxxxxxxxxxxxxxxxxxxxxxxx',
        desc: 'Real Estate niche CRM integration.',
        docs: 'https://app.followupboss.com/2/api',
        category: 'Customer Relationship Management (CRM)'
    },
    
    // Comms
    {
        key: 'slack_bot_token',
        label: 'Slack Bot Token',
        placeholder: 'xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
        desc: 'Universal team communication and HITL (Human-in-the-loop) approvals.',
        docs: 'https://api.slack.com/apps',
        category: 'Team Communication & Support'
    },
    {
        key: 'telegram_bot_token',
        label: 'Telegram Bot Token',
        placeholder: '123456789:ABCDefghIJKLmnopQRSTuvwxYZ',
        desc: 'Niche/Crypto team communication.',
        docs: 'https://t.me/BotFather',
        category: 'Team Communication & Support'
    }
]

export default function SettingsPanel({ orgId }: { orgId: string }) {
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<Record<string, { configured: boolean; value: string }>>({})
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getConfig() // Gets masked keys
                setStatus(data.keys || {})
            } catch (e) {
                console.error("Failed to load config", e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [orgId])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            // Only send non-masked keys (where the user actually typed something)
            const updates: Record<string, string> = {}
            Object.entries(keys).forEach(([k, v]) => {
                if (v && !v.includes('****')) {
                    updates[k] = v
                }
            })

            if (Object.keys(updates).length === 0) {
                setMessage({ type: 'error', text: 'No changes detected. Type a new key to update.' })
                setSaving(false)
                return
            }

            await api.saveKeys(updates)
            setMessage({ type: 'success', text: 'Your keys have been securely updated and encrypted in our vault.' })
            setKeys({}) // Clean inputs
            
            // Re-load masked status
            const data = await api.getConfig()
            setStatus(data.keys || {})
        } catch (e: any) {
            setMessage({ type: 'error', text: `Save failed: ${e.message}` })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="spin" size={32} /></div>

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Shield size={20} color="var(--color-accent, var(--accent))" />
                    <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Your Profile</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary, var(--text-secondary))', fontSize: '14px' }}>
                    These preferences filter all views across the platform.
                </p>
            </div>

            <div className="glass" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}><Palette size={20} color="var(--accent)" /></div>
                    <label style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary, var(--text-primary))' }}>
                        Layout Customization
                    </label>
                    <Info size={14} color="var(--color-text-tertiary, var(--text-muted))" style={{ cursor: 'help' }} />
                </div>
                <ThemeSwitcher />
            </div>

            <div style={{ marginBottom: '24px', marginTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Key size={20} color="var(--color-accent, var(--accent))" />
                    <h2 style={{ fontSize: '22px', fontWeight: 700 }}>API Vault & Connections</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary, var(--text-secondary))', fontSize: '14px' }}>
                    Connect your individual API credentials to power your universal agent fleet. 
                    All keys are encrypted at-rest using AES-256 and never logged or exposed.
                </p>
            </div>

            <form onSubmit={handleSave} className="glass" style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gap: '40px' }}>
                    {Array.from(new Set(CONFIG_SCHEMA.map(s => s.category))).map(category => (
                        <div key={category || 'General'}>
                            {category && (
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    {category.toUpperCase()}
                                </h3>
                            )}
                            <div style={{ display: 'grid', gap: '28px' }}>
                                {CONFIG_SCHEMA.filter(s => s.category === category).map(s => (
                                    <div key={s.key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <BrandIcon brand={BRANDS[s.key]} size={18} />
                                                {s.label}
                                            </label>
                                            {status[s.key]?.configured ? (
                                                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={12} /> CONFIGURED ({status[s.key]?.value})
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MISSING</span>
                                            )}
                                        </div>
                                        
                                        <input
                                            type="text"
                                            placeholder={status[s.key]?.configured ? '••••••••••••••••' : s.placeholder}
                                            value={keys[s.key] || ''}
                                            onChange={e => setKeys(prev => ({ ...prev, [s.key]: e.target.value }))}
                                            style={{
                                                width: '100%', padding: '14px 16px',
                                                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                                borderRadius: '10px', color: 'var(--text-primary)',
                                                fontSize: '14px', fontFamily: 'var(--font-mono)',
                                                outline: 'none', transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                        />
                                        
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <Info size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span>{s.desc}</span>
                                                {s.docs && (
                                                    <a href={s.docs} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                                                        Get your key here &rarr;
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                   {message && (
                        <div style={{ 
                            padding: '12px 16px', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            marginBottom: '20px',
                            background: message.type === 'success' ? 'var(--green-glow)' : 'var(--red-glow)',
                            color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            display: 'flex', gap: '8px'
                        }}>
                             {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                             {message.text}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button 
                            type="button" 
                            className="btn-ghost"
                            onClick={() => setKeys({})}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={saving}
                            style={{ minWidth: '160px' }}
                        >
                            {saving ? <Loader2 className="spin" size={18} /> : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={18} /> Save Credentials
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <div className="glass" style={{ marginTop: '24px', padding: '20px', display: 'flex', gap: '16px', borderColor: 'var(--amber)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}><AlertTriangle size={24} color="var(--amber)" /></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--amber)', marginBottom: '4px' }}>Security Advisory</div>
                    Updating your API keys will cause a 2-second &quot;Warm-up&quot; phase for your fleet as they reload the new context. 
                    Ensure your Follow Up Boss key has &quot;Admin&quot; permissions for full automation capabilities.
                </div>
            </div>
        </div>
    )
}
