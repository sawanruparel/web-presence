// Type definitions for Cloudflare Workers environment

export interface Env {
  // D1 Database binding
  DB: D1Database
  
  // R2 Bucket bindings
  PROTECTED_CONTENT_BUCKET: R2Bucket
  PUBLIC_CONTENT_BUCKET: R2Bucket
  
  // Environment variables
  INTERNAL_API_KEY: string
  
  // CORS and Frontend Configuration
  FRONTEND_URL: string
  CORS_ORIGINS: string
  
  // GitHub Integration
  GITHUB_TOKEN: string
  GITHUB_WEBHOOK_SECRET: string
  GITHUB_REPO: string
  GITHUB_BRANCH: string
  
  // R2 Bucket Names (for reference)
  PROTECTED_CONTENT_BUCKET_NAME: string
  PUBLIC_CONTENT_BUCKET_NAME: string
}

// Re-export D1 types for convenience
export type D1Result<T = unknown> = {
  results: T[]
  success: true
  meta: {
    duration: number
    changes: number
    last_row_id: number
    rows_read: number
    rows_written: number
  }
}

export type D1Database = {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1Result>
  withSession(sessionId: string): D1Database
}

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown[]>(): Promise<T[]>
}
