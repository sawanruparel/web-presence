// Shared API types between frontend and backend

export interface VerifyPasswordRequest {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password: string
}

export interface VerifyPasswordResponse {
  success: boolean
  token?: string
  message?: string
}

export interface ProtectedContentResponse {
  slug: string
  title: string
  date: string
  readTime: string
  type: string
  excerpt: string
  content: string
  html: string
}

export interface ApiError {
  error: string
  message?: string
}

export interface HealthResponse {
  status: 'ok'
  timestamp: string
  version: string
}
