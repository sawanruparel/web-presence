import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

/**
 * Safely read a file with error handling
 */
export function safeReadFile(filePath: string, encoding: 'utf-8' | 'ascii' | 'base64' = 'utf-8'): string | null {
  try {
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    return readFileSync(filePath, encoding);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Safely write a file with error handling
 */
export function safeWriteFile(filePath: string, content: string, encoding: 'utf-8' | 'ascii' | 'base64' = 'utf-8'): boolean {
  try {
    writeFileSync(filePath, content, encoding);
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Get file extension without the dot
 */
export function getFileExtension(filePath: string): string {
  return extname(filePath).slice(1);
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExt(filePath: string): string {
  return basename(filePath, extname(filePath));
}

/**
 * Ensure directory exists
 */
export function ensureDirExists(dirPath: string): boolean {
  try {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}
