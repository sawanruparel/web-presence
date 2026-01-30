#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, extname, relative, resolve } from 'path';
import { createFrontmatter, OpenAIAIProvider, testOpenAIKey, type SiteConfig, type PolicyConfig, type ArticleInput } from '../core/populate.properties.js';
import OpenAI from 'openai';
import { parse } from 'yaml';

// Load environment variables from .env file
config();

// Configuration
const BASE_FOLDER = '../'; // Base folder to scan (relative to scripts directory)
const SEO_TEMPLATE_PATH = '../templates/seo-template.md'; // Path to SEO template
const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'scripts'];

// CLI argument parsing
const args = process.argv.slice(2);
const scanPath = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || BASE_FOLDER;
const forceRegenerate = args.includes('--force') || args.includes('-f');
const skipAI = args.includes('--skip-ai') || args.includes('-s');

console.log('🔍 Rivve Frontmatter Generator');
console.log('================================');
console.log(`📁 Scanning: ${resolve(scanPath)}`);
console.log(`🔄 Force regenerate: ${forceRegenerate}`);
console.log(`🤖 Skip AI processing: ${skipAI}`);
console.log('');

// Check for OpenAI API key (only if not skipping AI)
if (!skipAI && !process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  console.error('Create a .env file with: OPENAI_API_KEY="your-api-key-here"');
  console.error('Or use --skip-ai flag to skip AI processing');
  process.exit(1);
}

// Site configuration
const siteConfig: SiteConfig = {
  baseUrl: process.env.SITE_BASE_URL || "https://sawanruparel.com",
  defaultAuthor: process.env.SITE_DEFAULT_AUTHOR || "Editorial Team",
  defaultLang: process.env.SITE_DEFAULT_LANG || "en",
  env: "prod",
  twitterSite: process.env.SITE_TWITTER_SITE || "@thisissawan",
  twitterCreator: process.env.SITE_TWITTER_CREATOR || "@thisissawan",
  defaultChangefreq: "weekly",
  defaultPriority: 0.7
};

// Policy configuration
const policyConfig: PolicyConfig = {
  enforceNoindexOnNonProd: false,
  thinContentWordThreshold: 300,
  minTitleChars: 15,
  maxTitleChars: 60,
  minDescChars: 50,
  maxDescChars: 155,
  requireImageForSocial: false,
  blockIfMissingTitleOrDesc: true
};

interface ProcessedFile {
  inputPath: string;
  title: string;
  hasFrontmatter: boolean;
  processed: boolean;
  error?: string;
}

/**
 * Find markdown files only in the base directory (not subdirectories)
 */
function findMarkdownFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip all subdirectories - only process files in the base folder
        console.log(`⏭️  Skipping subdirectory: ${item}`);
        continue;
      } else if (stat.isFile()) {
        const ext = extname(item).toLowerCase();
        if (MARKDOWN_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Check if file needs processing based on timestamp
 */
function needsProcessing(filePath: string): boolean {
  if (forceRegenerate) {
    return true;
  }

  // For now, always process if force is not set, we'll check frontmatter freshness later
  return true;
}

/**
 * Validate SEO template compliance
 */
function validateSEOTemplate(filePath: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');

    // Check if file has frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      warnings.push('No frontmatter found - file should use seo-template.md as template');
      return { isValid: false, warnings };
    }

    const frontmatter = frontmatterMatch[1];

    // Check for required SEO template fields
    const requiredFields = [
      'title',
      'description',
      'slug',
      'date',
      'lastmod',
      'canonical_url',
      'robots'
    ];

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!frontmatter || !frontmatter.includes(`${field}:`)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      warnings.push(`Missing required SEO template fields: ${missingFields.join(', ')}`);
    }

    // Check for social media fields
    const socialFields = ['og_title', 'og_description', 'twitter_card', 'linkedin_title'];
    const missingSocialFields: string[] = [];
    for (const field of socialFields) {
      if (!frontmatter || !frontmatter.includes(`${field}:`)) {
        missingSocialFields.push(field);
      }
    }

    if (missingSocialFields.length > 0) {
      warnings.push(`Missing social media fields: ${missingSocialFields.join(', ')}`);
    }

    return { isValid: warnings.length === 0, warnings };
  } catch (error) {
    warnings.push(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, warnings };
  }
}

/**
 * Generate frontmatter for a file using AI
 */
async function generateFrontmatterForFile(
  filePath: string,
  ai: OpenAIAIProvider
): Promise<{ yaml: string; data: any; policy: any } | null> {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Extract body content (skip existing frontmatter)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const bodyContent = frontmatterMatch ? (frontmatterMatch[2] || content) : content;

    // Create article input
    const article: ArticleInput = {
      body: bodyContent,
      locale: "en-US"
    };

    // Generate frontmatter
    const result = await createFrontmatter(article, {
      ai,
      site: siteConfig,
      policy: policyConfig
    });

    return result;
  } catch (error) {
    console.error(`❌ Error generating frontmatter for ${filePath}:`, error);
    return null;
  }
}

/**
 * Process a single markdown file - generate/enhance frontmatter only
 */
async function processFile(
  filePath: string,
  ai: OpenAIAIProvider | null
): Promise<ProcessedFile> {
  const relativePath = relative(scanPath, filePath);

  const result: ProcessedFile = {
    inputPath: filePath,
    title: basename(filePath, extname(filePath)),
    hasFrontmatter: false,
    processed: false
  };

  try {
    // Validate SEO template usage
    console.log(`📄 Processing: ${relativePath}`);
    const validation = validateSEOTemplate(filePath);

    if (!validation.isValid) {
      console.log(`  ⚠️  SEO Template Validation Failed:`);
      validation.warnings.forEach(warning => {
        console.log(`     - ${warning}`);
      });
    } else {
      console.log(`  ✅ SEO Template validation passed`);
    }

    // Check if processing is needed
    if (!needsProcessing(filePath)) {
      result.processed = true;
      result.title = 'Skipped (up to date)';
      return result;
    }

    // Read the markdown file
    const content = readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const existingFrontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const bodyContent = frontmatterMatch ? (frontmatterMatch[2] || content) : content;

    result.hasFrontmatter = !!existingFrontmatter;

    let frontmatter: any = null;
    let finalContent = content;

    if (ai && !skipAI) {
      // Generate AI frontmatter
      console.log(`  🤖 Generating AI frontmatter...`);
      const aiResult = await generateFrontmatterForFile(filePath, ai);

      if (aiResult) {
        frontmatter = aiResult.data;
        finalContent = aiResult.yaml + '\n' + bodyContent;
        console.log(`  ✅ AI frontmatter generated`);

        // Write back to the file (in-place update)
        writeFileSync(filePath, finalContent, 'utf-8');
        result.processed = true;
        result.title = frontmatter?.title || basename(filePath, extname(filePath));
        console.log(`  💾 Frontmatter updated in file`);
      } else {
        console.log(`  ⚠️  AI frontmatter generation failed`);
        result.error = 'AI frontmatter generation failed';
      }
    } else if (existingFrontmatter) {
      // Use existing frontmatter
      try {
        frontmatter = parse(existingFrontmatter);
        console.log(`  📋 Using existing frontmatter`);
        result.processed = true;
      } catch (error) {
        console.log(`  ⚠️  Could not parse existing frontmatter`);
        result.error = 'Could not parse existing frontmatter';
      }
    } else {
      console.log(`  ⚠️  No frontmatter found and AI processing skipped`);
      result.error = 'No frontmatter and AI skipped';
    }

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ❌ Error: ${result.error}`);
  }

  return result;
}

/**
 * Check if SEO template exists and provide guidance
 */
function checkSEOTemplate(): void {
  if (!existsSync(SEO_TEMPLATE_PATH)) {
    console.error(`❌ SEO template not found at: ${SEO_TEMPLATE_PATH}`);
    console.error('Please ensure seo-template.md exists in the templates/ directory');
    console.error('This template should be used as a reference for all markdown files');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  checkSEOTemplate();

  // Initialize AI provider if not skipping
  let ai: OpenAIAIProvider | null = null;
  if (!skipAI) {
    console.log('Testing OpenAI API key...');
    const testResult = await testOpenAIKey(process.env.OPENAI_API_KEY!, process.env.OPENAI_MODEL || "gpt-3.5-turbo");

    if (!testResult.success) {
      console.error('❌ OpenAI API key test failed:');
      console.error(`   Error: ${testResult.error}`);
      process.exit(1);
    }

    console.log(`✅ OpenAI API key test successful (using ${testResult.model})`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    ai = new OpenAIAIProvider(openai, process.env.OPENAI_MODEL || "gpt-3.5-turbo");
  }

  // Find markdown files
  console.log('\n🔍 Finding markdown files...');
  const files = findMarkdownFiles(scanPath, scanPath);
  console.log(`Found ${files.length} markdown file(s)\n`);

  if (files.length === 0) {
    console.log('No markdown files found. Exiting.');
    return;
  }

  // Process each file
  const processedFiles: ProcessedFile[] = [];
  for (const file of files) {
    const result = await processFile(file, ai);
    processedFiles.push(result);
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total files: ${processedFiles.length}`);
  console.log(`   Processed: ${processedFiles.filter(f => f.processed).length}`);
  console.log(`   Skipped: ${processedFiles.filter(f => !f.processed && !f.error).length}`);
  console.log(`   Errors: ${processedFiles.filter(f => f.error).length}`);

  if (processedFiles.some(f => f.error)) {
    console.log('\n❌ Files with errors:');
    processedFiles.filter(f => f.error).forEach(f => {
      console.log(`   - ${relative(scanPath, f.inputPath)}: ${f.error}`);
    });
  }

  console.log('\n✅ Frontmatter generation complete!');
  console.log('💡 Tip: Use mdtohtml or your build system to convert markdown to HTML');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
