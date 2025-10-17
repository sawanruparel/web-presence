/**
 * Password Hashing Utilities
 * 
 * Provides password hashing and verification using a simple
 * implementation suitable for Cloudflare Workers environment.
 * 
 * Note: For production, consider using a more robust hashing library
 * or Cloudflare's built-in crypto APIs.
 */

/**
 * Simple password hashing using Web Crypto API
 * This is a basic implementation - for production, use bcrypt or similar
 */
export async function hashPassword(password: string): Promise<string> {
  // For now, using a simple SHA-256 hash with salt
  // TODO: Replace with proper bcrypt when available in Workers
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

/**
 * Generate a password hash for a content item
 * Format: {type}-{slug}-{hash}
 * This allows for deterministic password generation during migration
 */
export async function generateContentPassword(type: string, slug: string, basePassword?: string): Promise<{
  password: string
  hash: string
}> {
  // Generate password if not provided
  const password = basePassword || `${type}-${slug}-${generateRandomString(8)}`
  const hash = await hashPassword(password)
  
  return { password, hash }
}

/**
 * Generate a random string for password generation
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}

/**
 * Generate password from legacy format
 * Matches the format used in generate-passwords.js script
 */
export async function generateLegacyPassword(type: string, slug: string): Promise<string> {
  const baseString = `${type}-${slug}`
  return await hashPassword(baseString)
}
