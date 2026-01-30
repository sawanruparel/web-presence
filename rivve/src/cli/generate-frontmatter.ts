#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createFrontmatter, OpenAIAIProvider, testOpenAIKey, type SiteConfig, type PolicyConfig, type ArticleInput } from '../core/populate.properties.js';
import OpenAI from 'openai';

// Load environment variables from .env file
config();

// CLI argument parsing
const args = process.argv.slice(2);
const inputFile = args[0];
const outputFile = args[1];

if (!inputFile) {
  console.error('Usage: npx tsx generate-frontmatter.ts <input-markdown-file> [output-file]');
  console.error('Example: npx tsx generate-frontmatter.ts article.md');
  console.error('Example: npx tsx generate-frontmatter.ts article.md article-with-frontmatter.md');
  process.exit(1);
}

if (!existsSync(inputFile)) {
  console.error(`Error: Input file '${inputFile}' does not exist`);
  process.exit(1);
}

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  console.error('Create a .env file with: OPENAI_API_KEY="your-api-key-here"');
  console.error('Or set it with: export OPENAI_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Default site configuration (can be overridden by .env file)
const siteConfig: SiteConfig = {
  baseUrl: process.env.SITE_BASE_URL || "https://sawanruparel.com",
  defaultAuthor: process.env.SITE_DEFAULT_AUTHOR || "Editorial Team",
  defaultLang: process.env.SITE_DEFAULT_LANG || "en",
  env: "prod", // Set to prod to allow indexing
  twitterSite: process.env.SITE_TWITTER_SITE || "@thisissawan",
  twitterCreator: process.env.SITE_TWITTER_CREATOR || "@thisissawan",
  defaultChangefreq: "weekly",
  defaultPriority: 0.7
};

// Default policy configuration
const policyConfig: PolicyConfig = {
  enforceNoindexOnNonProd: false, // Allow indexing for testing
  thinContentWordThreshold: 300,
  minTitleChars: 15,
  maxTitleChars: 60,
  minDescChars: 50,
  maxDescChars: 155,
  requireImageForSocial: false,
  blockIfMissingTitleOrDesc: true
};

async function processMarkdownFile(inputPath: string, outputPath?: string) {
  try {
    console.log(`Reading markdown file: ${inputPath}`);

    // Read the markdown file
    const markdownContent = readFileSync(inputPath, 'utf-8');

    // Extract frontmatter if it exists
    const frontmatterMatch = markdownContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const existingFrontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    let bodyContent = frontmatterMatch ? (frontmatterMatch[2] || markdownContent) : markdownContent;

    // Check if the body content is just template structure (starts with --- or # ========== CORE ==========)
    const isTemplateStructure = bodyContent.trim().startsWith('---') || bodyContent.trim().startsWith('# ========== CORE ==========');

    if (isTemplateStructure) {
      console.log('Detected template structure in body content - will be replaced with actual content');
      console.log('Template structure detected:', bodyContent.substring(0, 100) + '...');
    } else {
      console.log('Body content preview:', bodyContent.substring(0, 100) + '...');
    }

    if (existingFrontmatter) {
      console.log('Found existing frontmatter, will be completely replaced with AI-generated version');
      console.log('💡 Tip: If you want to preserve some existing fields, edit the file manually first');
    }

    // Test OpenAI API key first
    console.log('Testing OpenAI API key...');
    const testResult = await testOpenAIKey(process.env.OPENAI_API_KEY!, process.env.OPENAI_MODEL || "gpt-3.5-turbo");

    if (!testResult.success) {
      console.error('❌ OpenAI API key test failed:');
      console.error(`   Error: ${testResult.error}`);
      console.error('');
      console.error('Please check:');
      console.error('1. Your API key is correct');
      console.error('2. You have credits in your OpenAI account');
      console.error('3. Your account has access to the model');
      console.error('4. Visit https://platform.openai.com/account/billing to check billing');
      process.exit(1);
    }

    console.log(`✅ OpenAI API key test successful (using ${testResult.model})`);

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const ai = new OpenAIAIProvider(openai, process.env.OPENAI_MODEL || "gpt-3.5-turbo");

    console.log('Generating frontmatter with AI...');

    // Create article input
    const article: ArticleInput = {
      body: bodyContent,
      locale: "en-US"
    };

    // Generate frontmatter
    const { yaml, data, policy: report } = await createFrontmatter(article, {
      ai,
      site: siteConfig,
      policy: policyConfig
    });

    // Create output content
    let finalBodyContent = bodyContent;

    // If the original body was template structure, replace it with actual content
    if (isTemplateStructure) {
      finalBodyContent = `# ${data.title || 'Untitled'}\n\n${data.description || 'No description available.'}`;
    }

    const outputContent = yaml + '\n' + finalBodyContent;

    // Determine output file path
    const finalOutputPath = outputPath || inputPath;

    // Write the output
    writeFileSync(finalOutputPath, outputContent, 'utf-8');

    console.log(`✅ Frontmatter generated successfully!`);
    console.log(`📄 Output written to: ${finalOutputPath}`);

    // Display policy report
    console.log('\n📊 Policy Report:');
    console.log(`   Environment: ${report.env}`);
    console.log(`   Word count: ${report.wordCount}`);
    console.log(`   Title length: ${report.titleLength} chars`);
    console.log(`   Description length: ${report.descriptionLength} chars`);

    if (report.actions.length > 0) {
      console.log(`   Actions: ${report.actions.join(', ')}`);
    }

    if (report.warnings.length > 0) {
      console.log(`   Warnings: ${report.warnings.join(', ')}`);
    }

    if (report.errors.length > 0) {
      console.log(`   Errors: ${report.errors.join(', ')}`);
    }

    // Display generated frontmatter
    console.log('\n📋 Generated Frontmatter:');
    console.log(yaml);

    // Show template compliance information
    console.log('\n📋 SEO Template Compliance:');
    console.log('   - All fields from seo-template.md are included to maintain consistency');
    console.log('   - Social media fields are generated with platform-specific optimization');
    console.log('   - This ensures all markdown files follow the same structure');

  } catch (error) {
    console.error('Error processing file:', error);
    process.exit(1);
  }
}

// Run the script
processMarkdownFile(inputFile, outputFile);
