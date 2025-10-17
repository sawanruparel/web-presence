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
 * Uses human-readable format: {adjective}-{noun}-{4-digit-number}
 * This allows for easy sharing while maintaining security
 */
export async function generateContentPassword(type: string, slug: string, basePassword?: string): Promise<{
  password: string
  hash: string
}> {
  // Generate password if not provided
  const password = basePassword || generateHumanReadablePassword()
  const hash = await hashPassword(password)
  
  return { password, hash }
}

/**
 * Generate a human-readable password
 * Format: {adjective}-{noun}-{4-digit-number}
 * Example: "swift-tiger-7392"
 */
function generateHumanReadablePassword(): string {
  const adjectives = [
    'swift', 'bright', 'calm', 'bold', 'wise', 'keen', 'pure', 'wild', 'free', 'true',
    'deep', 'high', 'wide', 'long', 'short', 'fast', 'slow', 'warm', 'cool', 'dark',
    'light', 'soft', 'hard', 'smooth', 'rough', 'sharp', 'round', 'square', 'clear', 'foggy',
    'happy', 'sad', 'brave', 'shy', 'proud', 'humble', 'strong', 'gentle', 'fierce', 'mild',
    'ancient', 'modern', 'young', 'old', 'fresh', 'stale', 'new', 'used', 'clean', 'dirty'
  ]
  
  const nouns = [
    'tiger', 'eagle', 'ocean', 'mountain', 'forest', 'river', 'valley', 'desert', 'island', 'cave',
    'castle', 'tower', 'bridge', 'path', 'road', 'field', 'garden', 'flower', 'tree', 'leaf',
    'stone', 'crystal', 'diamond', 'pearl', 'gold', 'silver', 'copper', 'iron', 'steel', 'wood',
    'fire', 'water', 'earth', 'wind', 'storm', 'rain', 'snow', 'ice', 'cloud', 'star',
    'moon', 'sun', 'planet', 'galaxy', 'comet', 'meteor', 'lightning', 'thunder', 'rainbow', 'dawn'
  ]
  
  // Get random adjective and noun
  const randomValues = new Uint8Array(3)
  crypto.getRandomValues(randomValues)
  
  const adjective = adjectives[randomValues[0] % adjectives.length]
  const noun = nouns[randomValues[1] % nouns.length]
  const number = Math.floor(1000 + (randomValues[2] % 9000)) // 4-digit number 1000-9999
  
  return `${adjective}-${noun}-${number}`
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

