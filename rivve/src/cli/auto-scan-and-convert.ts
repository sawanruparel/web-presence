#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, rmSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname, relative, resolve } from 'path';
import { createFrontmatter, OpenAIAIProvider, testOpenAIKey, type SiteConfig, type PolicyConfig, type ArticleInput } from '../core/populate.properties.js';
import OpenAI from 'openai';
import { marked } from 'marked';
import { parse } from 'yaml';

// Load environment variables from .env file
config();

// Configuration
const BASE_FOLDER = '../'; // Base folder to scan (relative to scripts directory)
const OUTPUT_DIR = './html-output';
const INDEX_TEMPLATE = './templates/index.html';
const SEO_TEMPLATE_PATH = '../templates/seo-template.md'; // Path to SEO template
const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'html-output', 'scripts'];

// CLI argument parsing
const args = process.argv.slice(2);
const scanPath = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || BASE_FOLDER;
const forceRegenerate = args.includes('--force') || args.includes('-f');
const skipAI = args.includes('--skip-ai') || args.includes('-s');

console.log('🔍 Rivve Auto-Scan and Convert Tool');
console.log('=====================================');
console.log(`📁 Scanning: ${resolve(scanPath)}`);
console.log(`📤 Output: ${resolve(OUTPUT_DIR)}`);
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
  baseUrl: process.env.SITE_BASE_URL || "http://localhost:3000",
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
  outputPath: string;
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
    console.warn(`⚠️  Could not read directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Check if file needs processing
 */
function needsProcessing(inputPath: string, outputPath: string): boolean {
  if (forceRegenerate) return true;
  
  if (!existsSync(outputPath)) return true;
  
  const inputStat = statSync(inputPath);
  const outputStat = statSync(outputPath);
  
  return inputStat.mtime > outputStat.mtime;
}

/**
 * Validate that a markdown file uses the SEO template
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
      if (!frontmatter.includes(`${field}:`)) {
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
      if (!frontmatter.includes(`${field}:`)) {
        missingSocialFields.push(field);
      }
    }
    
    if (missingSocialFields.length > 0) {
      warnings.push(`Missing social media fields: ${missingSocialFields.join(', ')}`);
    }
    
    // Check if file is in the base folder (not in scripts or other subdirectories)
    const relativePath = relative(scanPath, filePath);
    if (relativePath.includes('/') || relativePath.includes('\\')) {
      warnings.push('File is in a subdirectory - only files in the base folder should be processed');
    }
    
    return { 
      isValid: missingFields.length === 0 && !relativePath.includes('/') && !relativePath.includes('\\'), 
      warnings 
    };
    
  } catch (error) {
    warnings.push(`Error reading file: ${error}`);
    return { isValid: false, warnings };
  }
}

/**
 * Generate frontmatter for a markdown file
 */
async function generateFrontmatterForFile(
  filePath: string, 
  ai: OpenAIAIProvider
): Promise<{ yaml: string; data: any; policy: any } | null> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract existing frontmatter if it exists
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const existingFrontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
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
 * Convert markdown to HTML
 */
function convertToHTML(
  filePath: string, 
  frontmatter: any, 
  body: string, 
  outputPath: string
): boolean {
  try {
    const title = frontmatter?.title || basename(filePath, extname(filePath));
    const description = frontmatter?.description || '';
    const author = Array.isArray(frontmatter?.author) 
      ? frontmatter.author.join(', ') 
      : frontmatter?.author || 'Unknown Author';
    
    const tags = frontmatter?.tags || [];
    const categories = frontmatter?.categories || [];
    const keywords = frontmatter?.keywords || [];
    
    // Convert markdown to HTML
    const htmlContent = marked(body);
    
    // Generate meta tags
    const metaTags = generateMetaTags(frontmatter);
    
    // Generate structured data
    const structuredData = generateStructuredData(frontmatter, title, description, author);
    
    const html = `<!DOCTYPE html>
<html lang="${frontmatter?.lang || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${frontmatter?.robots || 'index, follow'}">
    <meta name="author" content="${escapeHtml(author)}">
    <meta name="generator" content="Rivve">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${frontmatter?.canonical_url || `http://localhost:3000/${basename(filePath, extname(filePath))}.html`}">
    ${keywords.length > 0 ? `<meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">` : ''}
    <meta name="reading-time" content="${frontmatter?.reading_time || 0}">
    <meta name="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    ${frontmatter?.tags && frontmatter.tags.length > 0 ? frontmatter.tags.map(tag => `<meta name="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter?.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${basename(filePath, extname(filePath))}.html`}">
    <meta property="og:title" content="${escapeHtml(frontmatter?.og_title || title)}">
    <meta property="og:description" content="${escapeHtml(frontmatter?.og_description || description)}">
    <meta property="og:site_name" content="${frontmatter?.og_site_name || 'Rivve'}">
    <meta property="og:locale" content="${frontmatter?.og_locale || frontmatter?.lang || 'en_US'}">
    ${frontmatter?.image ? `<meta property="og:image" content="${escapeHtml(frontmatter.image)}">` : ''}
    ${frontmatter?.image_alt ? `<meta property="og:image:alt" content="${escapeHtml(frontmatter.image_alt)}">` : ''}
    <meta property="article:author" content="${escapeHtml(author)}">
    <meta property="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta property="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="${frontmatter?.twitter_card || 'summary'}">
    <meta name="twitter:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${basename(filePath, extname(filePath))}.html`}">
    <meta name="twitter:title" content="${escapeHtml(frontmatter?.twitter_title || frontmatter?.og_title || title)}">
    <meta name="twitter:description" content="${escapeHtml(frontmatter?.twitter_description || frontmatter?.og_description || description)}">
    ${frontmatter?.twitter_image || frontmatter?.image ? `<meta name="twitter:image" content="${escapeHtml(frontmatter?.twitter_image || frontmatter?.image || '')}">` : ''}
    ${frontmatter?.twitter_site ? `<meta name="twitter:site" content="${escapeHtml(frontmatter.twitter_site)}">` : ''}
    ${frontmatter?.twitter_creator ? `<meta name="twitter:creator" content="${escapeHtml(frontmatter.twitter_creator)}">` : ''}
    
    <!-- LinkedIn -->
    <meta name="linkedin:title" content="${escapeHtml(frontmatter?.linkedin_title || frontmatter?.og_title || title)}">
    <meta name="linkedin:description" content="${escapeHtml(frontmatter?.linkedin_description || frontmatter?.og_description || description)}">
    ${frontmatter?.linkedin_image || frontmatter?.image ? `<meta name="linkedin:image" content="${escapeHtml(frontmatter?.linkedin_image || frontmatter?.image || '')}">` : ''}
    ${frontmatter?.linkedin_author ? `<meta name="linkedin:author" content="${escapeHtml(frontmatter.linkedin_author)}">` : ''}
    
    <!-- Additional SEO Meta Tags -->
    <meta name="format-detection" content="telephone=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Rivve">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
    ${metaTags}
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .meta {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .meta h3 {
            margin-top: 0;
            color: #666;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }
        .tag {
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .content {
            line-height: 1.8;
        }
        .content h1, .content h2, .content h3 {
            color: #2c3e50;
        }
        .content code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .content pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
        .content blockquote {
            border-left: 4px solid #007bff;
            margin: 0;
            padding-left: 20px;
            color: #666;
        }
    </style>
</head>
<body${frontmatter?.layout ? ` class="${escapeHtml(frontmatter.layout)}"` : ''}>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
    </div>
    
    <div class="meta">
        <h3>Article Metadata</h3>
        <p><strong>Author:</strong> ${escapeHtml(author)}</p>
        <p><strong>Published:</strong> ${frontmatter?.date || 'Not specified'}</p>
        <p><strong>Last Modified:</strong> ${frontmatter?.lastmod || 'Not specified'}</p>
        <p><strong>Reading Time:</strong> ${frontmatter?.reading_time || 0} minutes</p>
        <p><strong>Status:</strong> ${frontmatter?.draft ? 'Draft' : 'Published'}</p>
        ${frontmatter?.canonical_url ? `<p><strong>Canonical URL:</strong> <a href="${escapeHtml(frontmatter.canonical_url)}">${escapeHtml(frontmatter.canonical_url)}</a></p>` : ''}
        
        ${tags.length > 0 ? `
        <h4>Tags</h4>
        <div class="tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ` : ''}
        
        ${categories.length > 0 ? `
        <h4>Categories</h4>
        <div class="tags">
            ${categories.map(cat => `<span class="tag">${escapeHtml(cat)}</span>`).join('')}
        </div>
        ` : ''}
        
        ${keywords.length > 0 ? `
        <h4>Keywords</h4>
        <p>${keywords.map(escapeHtml).join(', ')}</p>
        ` : ''}
    </div>
    
    <div class="content">
        ${htmlContent}
    </div>
    
    ${structuredData}
</body>
</html>`;

    writeFileSync(outputPath, html, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${filePath} to HTML:`, error);
    return false;
  }
}

function generateMetaTags(frontmatter: any): string {
  if (!frontmatter) return '';
  
  let tags = '';
  
  if (frontmatter.changefreq) {
    tags += `    <meta name="changefreq" content="${escapeHtml(frontmatter.changefreq)}">\n`;
  }
  
  if (frontmatter.priority !== undefined) {
    tags += `    <meta name="priority" content="${frontmatter.priority}">\n`;
  }
  
  if (frontmatter.schema_type) {
    tags += `    <meta name="schema-type" content="${escapeHtml(frontmatter.schema_type)}">\n`;
  }
  
  return tags;
}

function generateStructuredData(frontmatter: any, title: string, description: string, author: string): string {
  if (!frontmatter) return '';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": frontmatter.schema_type || "Article",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": frontmatter.date,
    "dateModified": frontmatter.lastmod || frontmatter.date,
    "publisher": {
      "@type": "Organization",
      "name": "Rivve"
    }
  };
  
  if (frontmatter.image) {
    structuredData["image"] = frontmatter.image;
  }
  
  if (frontmatter.canonical_url) {
    structuredData["url"] = frontmatter.canonical_url;
  }
  
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    structuredData["keywords"] = frontmatter.tags.join(', ');
  }
  
  return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Process a single markdown file
 */
async function processFile(
  filePath: string, 
  ai: OpenAIAIProvider | null
): Promise<ProcessedFile> {
  const relativePath = relative(scanPath, filePath);
  const outputFilename = basename(filePath, extname(filePath)) + '.html';
  const outputPath = join(OUTPUT_DIR, outputFilename);
  
  const result: ProcessedFile = {
    inputPath: filePath,
    outputPath: outputPath,
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
      
      // For now, we'll continue processing but log warnings
      // You can change this to `return result;` if you want to skip invalid files
    } else {
      console.log(`  ✅ SEO Template validation passed`);
    }
    
    // Check if processing is needed
    if (!needsProcessing(filePath, outputPath)) {
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
      } else {
        console.log(`  ⚠️  AI frontmatter generation failed, using existing`);
      }
    } else if (existingFrontmatter) {
      // Use existing frontmatter
      try {
        frontmatter = parse(existingFrontmatter);
        console.log(`  📋 Using existing frontmatter`);
      } catch (error) {
        console.log(`  ⚠️  Could not parse existing frontmatter`);
      }
    }
    
    // Convert to HTML
    console.log(`  🔄 Converting to HTML...`);
    const success = convertToHTML(filePath, frontmatter, bodyContent, outputPath);
    
    if (success) {
      result.processed = true;
      result.title = frontmatter?.title || basename(filePath, extname(filePath));
      console.log(`  ✅ Converted successfully`);
    } else {
      result.error = 'HTML conversion failed';
      console.log(`  ❌ Conversion failed`);
    }
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ❌ Error: ${result.error}`);
  }
  
  return result;
}

/**
 * Create or update the index.html file using the template
 */
function updateIndex(processedFiles: ProcessedFile[]): void {
  const indexPath = join(OUTPUT_DIR, 'index.html');
  const templatePath = INDEX_TEMPLATE;
  
  // Check if template exists
  if (!existsSync(templatePath)) {
    console.error(`❌ Index template not found: ${templatePath}`);
    return;
  }
  
  // Get list of successfully processed HTML files
  const htmlFiles = processedFiles
    .filter(file => file.processed)
    .map(file => basename(file.outputPath))
    .sort();
  
  try {
    // Read the template
    const templateContent = readFileSync(templatePath, 'utf-8');
    
    // Replace the placeholder with actual article list
    const articlesList = htmlFiles.map(file => `            '${file}'`).join(',\n');
    const indexContent = templateContent.replace('{{ARTICLES_LIST}}', articlesList);
    
    // Write the populated index file
    writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`📋 Created/updated index with ${htmlFiles.length} articles`);
    
  } catch (error) {
    console.error('❌ Error creating/updating index:', error);
  }
}

/**
 * Clean output directory
 */
function cleanOutputDirectory(): void {
  if (existsSync(OUTPUT_DIR)) {
    console.log(`🧹 Cleaning output directory: ${OUTPUT_DIR}`);
    try {
      rmSync(OUTPUT_DIR, { recursive: true, force: true });
      console.log(`✅ Output directory cleaned`);
    } catch (error) {
      console.warn(`⚠️  Could not clean output directory: ${error}`);
    }
  }
  
  // Recreate the directory
  console.log(`📁 Creating output directory: ${OUTPUT_DIR}`);
  mkdirSync(OUTPUT_DIR, { recursive: true });
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
  } else {
    console.log(`✅ SEO template found: ${SEO_TEMPLATE_PATH}`);
  }
}

/**
 * Main processing function
 */
async function main() {
  try {
    // Check if SEO template exists
    checkSEOTemplate();
    
    // Clean and recreate output directory
    cleanOutputDirectory();
    
    // Find all markdown files
    console.log('🔍 Scanning for markdown files...');
    const markdownFiles = findMarkdownFiles(scanPath, scanPath);
    
    if (markdownFiles.length === 0) {
      console.log('❌ No markdown files found');
      return;
    }
    
    console.log(`📄 Found ${markdownFiles.length} markdown files`);
    console.log('');
    
    // Initialize AI if not skipping
    let ai: OpenAIAIProvider | null = null;
    if (!skipAI) {
      console.log('🤖 Testing OpenAI API key...');
      const testResult = await testOpenAIKey(process.env.OPENAI_API_KEY!, process.env.OPENAI_MODEL || "gpt-3.5-turbo");
      
      if (!testResult.success) {
        console.error('❌ OpenAI API key test failed:', testResult.error);
        console.error('Use --skip-ai flag to skip AI processing');
        process.exit(1);
      }
      
      console.log(`✅ OpenAI API key test successful (using ${testResult.model})`);
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      ai = new OpenAIAIProvider(openai, process.env.OPENAI_MODEL || "gpt-3.5-turbo");
    }
    
    console.log('');
    
    // Process each file
    const processedFiles: ProcessedFile[] = [];
    
    for (const filePath of markdownFiles) {
      const result = await processFile(filePath, ai);
      processedFiles.push(result);
      console.log('');
    }
    
    // Update index
    console.log('📋 Updating index...');
    updateIndex(processedFiles);
    
    // Summary
    console.log('📊 Processing Summary');
    console.log('===================');
    
    const successful = processedFiles.filter(f => f.processed).length;
    const failed = processedFiles.filter(f => !f.processed).length;
    const skipped = processedFiles.filter(f => f.title.includes('Skipped')).length;
    
    console.log(`✅ Successfully processed: ${successful}`);
    console.log(`⏭️  Skipped (up to date): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    
    // Check for SEO template validation issues
    const validationIssues = processedFiles.filter(f => {
      const validation = validateSEOTemplate(f.inputPath);
      return !validation.isValid;
    });
    
    if (validationIssues.length > 0) {
      console.log(`\n⚠️  SEO Template Validation Issues: ${validationIssues.length}`);
      validationIssues.forEach(f => {
        const validation = validateSEOTemplate(f.inputPath);
        console.log(`   - ${relative(scanPath, f.inputPath)}:`);
        validation.warnings.forEach(warning => {
          console.log(`     • ${warning}`);
        });
      });
      console.log('\n💡 Tip: Use seo-template.md as a template for all markdown files');
    }
    
    if (failed > 0) {
      console.log('\n❌ Failed files:');
      processedFiles
        .filter(f => !f.processed && !f.title.includes('Skipped'))
        .forEach(f => console.log(`   - ${relative(scanPath, f.inputPath)}: ${f.error}`));
    }
    
    console.log(`\n🌐 Start dev server: npm run dev-server`);
    console.log(`📁 Output directory: ${resolve(OUTPUT_DIR)}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
