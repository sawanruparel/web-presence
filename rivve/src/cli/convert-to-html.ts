#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { marked } from 'marked';
import { parse } from 'yaml';

// CLI argument parsing
const args = process.argv.slice(2);
const inputFile = args[0];
const outputDir = args[1] || './html-output';

if (!inputFile) {
  console.error('Usage: npx tsx convert-to-html.ts <input-markdown-file> [output-directory]');
  console.error('Example: npx tsx convert-to-html.ts article.md');
  console.error('Example: npx tsx convert-to-html.ts article.md ./html-output');
  process.exit(1);
}

if (!existsSync(inputFile)) {
  console.error(`Error: Input file '${inputFile}' does not exist`);
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

interface Frontmatter {
  title?: string;
  description?: string;
  slug?: string;
  date?: string;
  lastmod?: string;
  draft?: boolean;
  canonical_url?: string;
  robots?: string;
  author?: string | string[];
  tags?: string[];
  categories?: string[];
  reading_time?: number;
  keywords?: string[];
  image?: string;
  image_alt?: string;
  og_title?: string;
  og_description?: string;
  og_type?: string;
  og_url?: string;
  og_site_name?: string;
  og_locale?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_site?: string;
  twitter_creator?: string;
  linkedin_title?: string;
  linkedin_description?: string;
  linkedin_image?: string;
  linkedin_author?: string;
  lang?: string;
  schema_type?: string;
  changefreq?: string;
  priority?: number;
  layout?: string;
  cssclass?: string;
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { frontmatter: null, body: content };
  }
  
  const frontmatterYaml = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  
  try {
    const frontmatter = parse(frontmatterYaml) as Frontmatter;
    return { frontmatter, body };
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter YAML:', error);
    return { frontmatter: null, body: content };
  }
}

function generateHTML(frontmatter: Frontmatter | null, body: string, filename: string): string {
  const title = frontmatter?.title || basename(filename, extname(filename));
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
  
  return `<!DOCTYPE html>
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
    <link rel="canonical" href="${frontmatter?.canonical_url || `http://localhost:3000/${basename(filename, extname(filename))}.html`}">
    ${keywords.length > 0 ? `<meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">` : ''}
    <meta name="reading-time" content="${frontmatter?.reading_time || 0}">
    <meta name="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    ${frontmatter?.tags && frontmatter.tags.length > 0 ? frontmatter.tags.map(tag => `<meta name="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter?.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${basename(filename, extname(filename))}.html`}">
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
    <meta name="twitter:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${basename(filename, extname(filename))}.html`}">
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
}

function generateMetaTags(frontmatter: Frontmatter | null): string {
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

function generateStructuredData(frontmatter: Frontmatter | null, title: string, description: string, author: string): string {
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

async function convertMarkdownToHTML(inputPath: string, outputDir: string) {
  try {
    console.log(`Reading markdown file: ${inputPath}`);
    
    // Read the markdown file
    const markdownContent = readFileSync(inputPath, 'utf-8');
    
    // Parse frontmatter and body
    const { frontmatter, body } = parseFrontmatter(markdownContent);
    
    if (frontmatter) {
      console.log('✅ Found frontmatter with metadata');
      console.log(`   Title: ${frontmatter.title || 'Not specified'}`);
      console.log(`   Description: ${frontmatter.description ? frontmatter.description.substring(0, 100) + '...' : 'Not specified'}`);
      console.log(`   Author: ${Array.isArray(frontmatter.author) ? frontmatter.author.join(', ') : frontmatter.author || 'Not specified'}`);
      console.log(`   Tags: ${frontmatter.tags?.length || 0} tags`);
    } else {
      console.log('⚠️  No frontmatter found - using basic metadata');
    }
    
    // Generate HTML
    const filename = basename(inputPath);
    const html = generateHTML(frontmatter, body, filename);
    
    // Determine output file path
    const outputFilename = basename(inputPath, extname(inputPath)) + '.html';
    const outputPath = join(outputDir, outputFilename);
    
    // Write the HTML file
    writeFileSync(outputPath, html, 'utf-8');
    
    console.log(`✅ HTML generated successfully!`);
    console.log(`📄 Output written to: ${outputPath}`);
    console.log(`🌐 Open in browser: file://${outputPath}`);
    
    // Display social media preview info
    if (frontmatter) {
      console.log('\n📱 Social Media Previews:');
      if (frontmatter.og_title || frontmatter.twitter_title || frontmatter.linkedin_title) {
        console.log(`   Open Graph Title: ${frontmatter.og_title || frontmatter.title || 'Not set'}`);
        console.log(`   Twitter Title: ${frontmatter.twitter_title || frontmatter.og_title || frontmatter.title || 'Not set'}`);
        console.log(`   LinkedIn Title: ${frontmatter.linkedin_title || frontmatter.og_title || frontmatter.title || 'Not set'}`);
      }
      if (frontmatter.image || frontmatter.twitter_image || frontmatter.linkedin_image) {
        console.log(`   Featured Image: ${frontmatter.image || frontmatter.twitter_image || frontmatter.linkedin_image || 'Not set'}`);
      }
    }
    
  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

// Run the script
convertMarkdownToHTML(inputFile, outputDir);
