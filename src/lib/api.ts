const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Real estate doc automation context: agents handle listing agreements,
// purchase contracts, lease agreements for real estate brokerages.

const MOCK_FLEET = {
  fleet: [
    {
      id: 'persona_aria_001',
      codename: 'ARIA',
      display_name: 'ARIA',
      role: 'lead_qualifier',
      avatar_emoji: '🏠',
      persona_prompt: 'You are ARIA, an Automated Real estate Intelligence Agent. Qualify inbound buyer and seller leads, score intent, and route high-confidence leads to the appropriate document workflow.',
      hitl_threshold: { confidence: 0.82, dollar_amount: 50000 },
      escalation_channel: 'slack',
      is_active: true,
      status: 'idle',
      total_tasks_completed: 847,
    },
    {
      id: 'persona_maxwell_002',
      codename: 'MAXWELL',
      display_name: 'MAXWELL',
      role: 'escrow_specialist',
      avatar_emoji: '⚖️',
      persona_prompt: 'You are MAXWELL, an escrow and transaction coordination specialist. Monitor escrow timelines, flag contingency deadlines, and generate escrow instruction documents from CRM data.',
      hitl_threshold: { confidence: 0.90, dollar_amount: 10000 },
      escalation_channel: 'slack',
      is_active: true,
      status: 'processing',
      total_tasks_completed: 1203,
    },
    {
      id: 'persona_reagan_003',
      codename: 'REAGAN',
      display_name: 'REAGAN',
      role: 'listing_coordinator',
      avatar_emoji: '📋',
      persona_prompt: 'You are REAGAN, a listing coordination agent. Generate listing agreements, coordinate showing schedules, and track MLS status changes to trigger document workflows.',
      hitl_threshold: { confidence: 0.85, dollar_amount: 25000 },
      escalation_channel: 'telegram',
      is_active: false,
      status: 'paused',
      total_tasks_completed: 342,
    },
    {
      id: 'persona_cassidy_004',
      codename: 'CASSIDY',
      display_name: 'CASSIDY',
      role: 'contract_processor',
      avatar_emoji: '📝',
      persona_prompt: 'You are CASSIDY, a purchase contract processing specialist and the fleet top performer. Handle offer preparation, counter-offer workflows, and addendum generation with the highest throughput.',
      hitl_threshold: { confidence: 0.78, dollar_amount: 75000 },
      escalation_channel: 'slack',
      is_active: true,
      status: 'idle',
      total_tasks_completed: 2891,
    },
    {
      id: 'persona_nova_005',
      codename: 'NOVA',
      display_name: 'NOVA',
      role: 'lease_manager',
      avatar_emoji: '🔑',
      persona_prompt: 'You are NOVA, a residential lease management agent. Generate lease agreements, process rental applications, and coordinate move-in documentation for property management clients.',
      hitl_threshold: { confidence: 0.88, dollar_amount: 5000 },
      escalation_channel: 'telegram',
      is_active: false,
      status: 'offline',
      total_tasks_completed: 56,
    },
  ]
}

const MOCK_USAGE = {
  tasks_used: 4180,
  monthly_task_limit: 6000,
  tasks_remaining: 1820,
  usage_pct: 70,
  month: '2026-06',
  breakdown: {
    total: 4180,
    completed: 3847,
    escalated: 231,
    pending: 102,
  },
  quota: { used: 4180, limit: 6000 },
}

const MOCK_BILLING = {
  plan: 'Professional',
  status: 'active',
  next_billing_date: '2026-07-17',
  amount: 349.00,
  currency: 'USD',
  seats: 5,
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString()
}
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60 * 1000).toISOString()
}

const MOCK_ACTIVITY = {
  workforce_history: [
    {
      id: 'evt_001',
      agent_name: 'CASSIDY',
      agent_codename: 'CASSIDY',
      category: 'contract_processor',
      agent_role: 'Contract Processor',
      action_label: 'DOC.GENERATED',
      event_type: 'doc_generated',
      severity: 'success',
      message: 'Purchase contract generated for 4821 Crestwood Drive — $1,275,000. Sent to Jennifer Marks via DocuSign. Awaiting buyer signatures.',
      created_at: minutesAgo(3),
    },
    {
      id: 'evt_002',
      agent_name: 'ARIA',
      agent_codename: 'ARIA',
      category: 'lead_qualifier',
      agent_role: 'Lead Qualifier',
      action_label: 'LEAD.QUALIFIED',
      event_type: 'lead_qualified',
      severity: 'success',
      message: 'Inbound lead Marcus Thompson qualified. Intent score: 0.91. Pre-approval confirmed $850k. Routed to CASSIDY for buyer agency agreement generation.',
      created_at: minutesAgo(11),
    },
    {
      id: 'evt_003',
      agent_name: 'MAXWELL',
      agent_codename: 'MAXWELL',
      category: 'escrow_specialist',
      agent_role: 'Escrow Specialist',
      action_label: 'SYS.ESCALATE',
      event_type: 'system_error',
      severity: 'warning',
      message: 'Escrow contingency deadline in 48h for 1102 Sunrise Blvd. Inspection response not received. Escalated to broker for manual review.',
      created_at: minutesAgo(28),
    },
    {
      id: 'evt_004',
      agent_name: 'CASSIDY',
      agent_codename: 'CASSIDY',
      category: 'contract_processor',
      agent_role: 'Contract Processor',
      action_label: 'CRM.UPDATED',
      event_type: 'crm_updated',
      severity: 'info',
      message: 'HubSpot deal stage updated: "Under Contract" for 7734 Maple Ridge Court. Commission field auto-populated: $38,250 (3%).',
      created_at: minutesAgo(45),
    },
    {
      id: 'evt_005',
      agent_name: 'ARIA',
      agent_codename: 'ARIA',
      category: 'lead_qualifier',
      agent_role: 'Lead Qualifier',
      action_label: 'WEBHOOK.RECV',
      event_type: 'webhook_received',
      severity: 'info',
      message: 'Follow Up Boss webhook received: new lead from Zillow inquiry — 9 Parkside Lane. Score 0.74. Sequence initiated: Day-1 SMS + listing PDF.',
      created_at: minutesAgo(62),
    },
    {
      id: 'evt_006',
      agent_name: 'MAXWELL',
      agent_codename: 'MAXWELL',
      category: 'escrow_specialist',
      agent_role: 'Escrow Specialist',
      action_label: 'APPROVAL.SENT',
      event_type: 'approval_sent',
      severity: 'info',
      message: 'Escrow amendment for 2290 Hollister Ave sent to Slack #closings for broker approval. Waiting on confirmation before filing with title company.',
      created_at: hoursAgo(2),
    },
    {
      id: 'evt_007',
      agent_name: 'CASSIDY',
      agent_codename: 'CASSIDY',
      category: 'contract_processor',
      agent_role: 'Contract Processor',
      action_label: 'TASK.DONE',
      event_type: 'task_completed',
      severity: 'success',
      message: 'Counter-offer addendum executed. Final sale price $1,195,000. All parties signed. Transaction file archived to Google Drive /Closed/2026-Q2.',
      created_at: hoursAgo(3),
    },
    {
      id: 'evt_008',
      agent_name: 'ARIA',
      agent_codename: 'ARIA',
      category: 'lead_qualifier',
      agent_role: 'Lead Qualifier',
      action_label: 'SEQ.STEP',
      event_type: 'sequence_step',
      severity: 'info',
      message: 'Day-3 follow-up triggered for lead Sandra Okonkwo. SMS delivered via Twilio. GoHighLevel stage advanced to "Nurturing — Active".',
      created_at: hoursAgo(5),
    },
    {
      id: 'evt_009',
      agent_name: 'MAXWELL',
      agent_codename: 'MAXWELL',
      category: 'escrow_specialist',
      agent_role: 'Escrow Specialist',
      action_label: 'DOC.GENERATED',
      event_type: 'doc_generated',
      severity: 'success',
      message: 'Residential listing agreement auto-generated for 553 Valencia Street, San Francisco CA. Commission rate 2.5% applied. Sent to seller for e-signature.',
      created_at: hoursAgo(8),
    },
    {
      id: 'evt_010',
      agent_name: 'ARIA',
      agent_codename: 'ARIA',
      category: 'lead_qualifier',
      agent_role: 'Lead Qualifier',
      action_label: 'LEAD.QUALIFIED',
      event_type: 'lead_qualified',
      severity: 'success',
      message: 'Seller lead Patricia Nguyen scored 0.88. Property valuation $2.1M estimated. Routed to REAGAN for listing agreement preparation.',
      created_at: hoursAgo(12),
    },
  ]
}

const MOCK_TEMPLATES = {
  templates: [
    {
      id: 'tmpl_listing_ca_001',
      name: 'Listing Agreement — California (RLA-A)',
      doc_type: 'listing',
      original_filename: 'CAR_RLA_A_2024.docx',
      field_map: {
        seller_name: 'contact.full_name',
        seller_email: 'contact.email',
        seller_phone: 'contact.phone',
        property_address: 'deal.address',
        listing_price: 'deal.price',
        commission_rate: 'config.agreement_commission_rate',
        listing_date: 'system.today',
        agent_name: 'agent.full_name',
        agent_brokerage: 'agent.brokerage_name',
        agent_license: '',
      },
      jurisdiction_hint: 'California, USA',
      is_active: true,
      created_at: '2026-04-15T10:23:00Z',
    },
    {
      id: 'tmpl_buyer_agency_002',
      name: 'Buyer Agency Agreement (Exclusive)',
      doc_type: 'buyer_rep',
      original_filename: 'Buyer_Agency_Exclusive_2024.docx',
      field_map: {
        buyer_name: 'contact.full_name',
        buyer_email: 'contact.email',
        buyer_phone: 'contact.phone',
        agreement_date: 'system.today',
        agent_name: 'agent.full_name',
        agent_email: 'agent.email',
        brokerage_name: 'agent.brokerage_name',
        max_purchase_price: '',
        expiry_date: '',
      },
      jurisdiction_hint: 'California, USA',
      is_active: true,
      created_at: '2026-04-22T14:05:00Z',
    },
    {
      id: 'tmpl_purchase_003',
      name: 'Residential Purchase Contract (PRDS)',
      doc_type: 'offer',
      original_filename: 'PRDS_Residential_Purchase_2024.docx',
      field_map: {
        buyer_name: 'contact.full_name',
        buyer_email: 'contact.email',
        property_address: 'deal.address',
        purchase_price: 'deal.price',
        close_of_escrow: 'deal.close_date',
        earnest_money: '',
        loan_amount: '',
        seller_name: '',
        agent_name: 'agent.full_name',
        agent_phone: 'agent.phone',
        offer_date: 'system.today',
      },
      jurisdiction_hint: 'California, USA',
      is_active: true,
      created_at: '2026-05-01T09:00:00Z',
    },
    {
      id: 'tmpl_lease_resi_004',
      name: 'Residential Lease Agreement (1-Year)',
      doc_type: 'custom',
      original_filename: 'CA_Residential_Lease_2024.docx',
      field_map: {
        tenant_name: 'contact.full_name',
        tenant_email: 'contact.email',
        property_address: 'deal.address',
        monthly_rent: 'deal.price',
        lease_start_date: 'system.today',
        lease_end_date: '',
        security_deposit: '',
        landlord_name: 'agent.full_name',
        landlord_brokerage: 'agent.brokerage_name',
      },
      jurisdiction_hint: 'California, USA',
      is_active: true,
      created_at: '2026-05-10T11:30:00Z',
    },
  ]
}

const MOCK_TOOLS = {
  tools: [
    { id: 'tool_fub_001',    tool_name: 'fub_api',      is_enabled: true,  quota_used: 2841, quota_limit: 5000 },
    { id: 'tool_ai_002',     tool_name: 'anthropic_ai', is_enabled: true,  quota_used: null, quota_limit: null },
    { id: 'tool_tg_003',     tool_name: 'telegram_bot', is_enabled: true,  quota_used: null, quota_limit: null },
    { id: 'tool_gdrive_004', tool_name: 'google_drive', is_enabled: true,  quota_used: 312,  quota_limit: 1000 },
    { id: 'tool_twilio_005', tool_name: 'twilio_sms',   is_enabled: false, quota_used: 0,    quota_limit: null },
    { id: 'tool_openai_006', tool_name: 'openai',       is_enabled: false, quota_used: 0,    quota_limit: null },
  ]
}

const MOCK_CONFIG = {
  keys: {
    hubspot_api_key:     { configured: true,  value: 'pat-na1-••••••5f2a' },
    gohighlevel_api_key: { configured: false, value: '' },
    fub_api_key:         { configured: true,  value: 'fub_live_••••••c91d' },
    slack_bot_token:     { configured: true,  value: 'xoxb-••••••7f3b' },
    telegram_bot_token:  { configured: true,  value: '••••••:ABCD••••' },
  }
}

function getMockData(path: string): unknown {
  if (path.startsWith('/api/agents/fleet'))             return MOCK_FLEET
  if (path.startsWith('/api/agents/usage'))             return MOCK_USAGE
  if (path.startsWith('/api/billing/status'))           return MOCK_BILLING
  if (path.startsWith('/api/agents/workforce/history')) return MOCK_ACTIVITY
  if (path.startsWith('/api/templates'))                return MOCK_TEMPLATES
  if (path.startsWith('/api/agents/tools'))             return MOCK_TOOLS
  if (path.startsWith('/api/setup/config'))             return MOCK_CONFIG
  if (path.startsWith('/health'))                       return { status: 'ok' }
  return { ok: true }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 180))
    return getMockData(path)
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  getFleet: async (orgId: string) => apiFetch(`/api/agents/fleet?org_id=${orgId}`),
  toggleAgent: async (personaId: string) => apiFetch(`/api/agents/${personaId}/toggle`, { method: 'POST' }),
  updateAgent: async (personaId: string, body: object) => apiFetch(`/api/agents/${personaId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getUsage: async (orgId: string) => apiFetch(`/api/agents/usage?org_id=${orgId}`),
  getTools: async (orgId: string) => apiFetch(`/api/agents/tools?org_id=${orgId}`),
  toggleTool: async (toolName: string, orgId: string) => apiFetch(`/api/agents/tools/${toolName}/toggle?org_id=${orgId}`, { method: 'POST' }),

  getBillingStatus: async (orgId: string) => apiFetch(`/api/billing/status/${orgId}`),
  createCheckout: async (_body: object) => ({ url: '#' }),
  createPortal: async (_body: object) => ({ url: '#' }),

  getActivity: async (orgId: string, params?: string) => {
    const qs = params ? `&${params}` : ''
    return apiFetch(`/api/agents/workforce/history?org_id=${orgId}${qs}`)
  },

  getTemplates: async (orgId: string, docType?: string) => apiFetch(`/api/templates?org_id=${orgId}${docType ? `&doc_type=${docType}` : ''}`),
  uploadTemplate: async (formData: FormData) => apiFetch(`/api/templates/upload`, { method: 'POST', body: formData }),
  updateTemplate: async (templateId: string, orgId: string, body: object) => apiFetch(`/api/templates/${templateId}?org_id=${orgId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTemplate: async (templateId: string, orgId: string) => apiFetch(`/api/templates/${templateId}?org_id=${orgId}`, { method: 'DELETE' }),
  getTemplatePreview: async (templateId: string, orgId: string) => apiFetch(`/api/templates/${templateId}/preview?org_id=${orgId}`),
  createTemplateTrigger: async (templateId: string, orgId: string, body: object) => apiFetch(`/api/templates/${templateId}/triggers?org_id=${orgId}`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTemplateTrigger: async (templateId: string, triggerId: string, orgId: string) => apiFetch(`/api/templates/${templateId}/triggers/${triggerId}?org_id=${orgId}`, { method: 'DELETE' }),
  getTemplateTriggers: async (templateId: string, orgId: string) => apiFetch(`/api/templates/${templateId}/triggers?org_id=${orgId}`),

  getHealth: async () => apiFetch('/health'),
  getConfig: async () => apiFetch('/api/setup/config'),
  saveKeys: async (keys: Record<string, string>) => apiFetch('/api/api-keys', { method: 'POST', body: JSON.stringify(keys) }),
}
