const BASE_URL = import.meta.env.VITE_API_URL || ''

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Request failed: ${res.statusText}`)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface Lead {
  id: string
  title: string
  source: string
  budgetText: string
  stackText: string
  description: string
  status: string
  fitScore: number | null
  redFlags: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ScoreResult {
  score: number
  reasons: string[]
  redFlags: string[]
}

export interface ChecklistTemplate {
  id: string
  name: string
  category: string
  description: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  severity: string
  status: 'pass' | 'warning' | 'fail' | 'not_checked'
  evidence: string
  category: string
}

export interface DeploymentInfo {
  version: string
  commitSha: string
  environment: string
  uptime: number
  dbStatus: string
  redisStatus: string
}

export interface HealthInfo {
  status: string
  timestamp: string
  uptime: number
}

export interface LoginResponse {
  token: string
  user: User
}

export interface PaginatedLeads {
  leads: Lead[]
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(): Promise<User> {
  return request<User>('/api/me')
}

export async function getLeads(params?: {
  status?: string
  source?: string
  search?: string
}): Promise<PaginatedLeads> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.source) qs.set('source', params.source)
  if (params?.search) qs.set('search', params.search)
  const query = qs.toString()
  return request<PaginatedLeads>(`/api/leads${query ? `?${query}` : ''}`)
}

export async function createLead(data: Partial<Lead>): Promise<{ lead: Lead }> {
  return request<{ lead: Lead }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<{ lead: Lead }> {
  return request<{ lead: Lead }>(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function scoreLead(id: string): Promise<ScoreResult> {
  return request<ScoreResult>(`/api/leads/${id}/score`, {
    method: 'POST',
  })
}

export async function getChecklists(): Promise<{ templates: ChecklistTemplate[] }> {
  return request<{ templates: ChecklistTemplate[] }>('/api/checklists')
}

export async function updateChecklistItem(data: {
  itemId: string
  status: string
  evidence: string
}): Promise<{ item: ChecklistItem }> {
  return request<{ item: ChecklistItem }>('/api/checklists', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getDeploymentStatus(): Promise<DeploymentInfo> {
  return request<DeploymentInfo>('/api/deployments/status')
}

export async function getHealth(): Promise<HealthInfo> {
  return request<HealthInfo>('/health')
}
