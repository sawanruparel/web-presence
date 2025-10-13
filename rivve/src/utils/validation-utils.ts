/**
 * Validation utilities for the Rivve project
 */

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate if a string is a valid slug
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validate if a string is a valid date (YYYY-MM-DD format)
 */
export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate if a string is within character limits
 */
export function isWithinCharLimit(text: string, min: number, max: number): boolean {
  return text.length >= min && text.length <= max;
}

/**
 * Validate OpenAI API key format
 */
export function isValidOpenAIKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}
