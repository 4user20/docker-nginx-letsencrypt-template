export interface CreateLeadInput {
  title: string
  source?: string
  budgetText?: string | null
  stackText?: string | null
  description?: string | null
  redFlags?: string | null
  notes?: string | null
}

export interface UpdateLeadInput {
  title?: string
  source?: string
  budgetText?: string | null
  stackText?: string | null
  description?: string | null
  status?: string
  redFlags?: string | null
  notes?: string | null
}

export interface LeadResponse {
  id: string
  title: string
  source: string
  budgetText: string | null
  stackText: string | null
  description: string | null
  status: string
  fitScore: number
  redFlags: string | null
  notes: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
  memory: number
}

export interface ChecklistTemplateResponse {
  id: string
  name: string
  category: string
  description: string
  items: ChecklistItemResponse[]
  createdAt: string
}

export interface ChecklistItemResponse {
  id: string
  templateId: string
  title: string
  description: string | null
  severity: string
  status: string
  evidence: string | null
  createdAt: string
  updatedAt: string
}

export interface ScoreResponse {
  score: number
  reasons: string[]
  redFlags: string[]
}

export interface DeploymentStatusResponse {
  version: string
  commitSha: string
  environment: string
  uptime: number
  dbStatus: string
  redisStatus: string
}

export interface UserResponse {
  id: string
  email: string
  name: string
  role: string
}
