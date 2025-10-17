// Shared API types between frontend and backend

// Access Control Types
export type AccessMode = 'open' | 'password' | 'email-list'

export interface AccessControlRule {
  mode: AccessMode
  description: string
  allowedEmails?: string[]
}

export interface AccessControlConfig {
  contentAccessRules: {
    [type in 'notes' | 'publications' | 'ideas' | 'pages']?: {
      [slug: string]: AccessControlRule
    }
  }
}

// Authentication Request/Response Types
export interface VerifyPasswordRequest {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password?: string
  email?: string
}

export interface VerifyPasswordResponse {
  success: boolean
  token?: string
  message?: string
  accessMode?: AccessMode
}

export interface AccessCheckResponse {
  accessMode: AccessMode
  requiresPassword: boolean
  requiresEmail: boolean
  message: string
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
