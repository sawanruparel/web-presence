#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const htmlOutputDir = './html-output';
const indexPath = join(htmlOutputDir, 'index.html');

function updateIndexWithArticles() {
  try {
    // Read current index.html
    const indexContent = readFileSync(indexPath, 'utf-8');
    
    // Find all HTML files in the output directory
    const htmlFiles = readdirSync(htmlOutputDir)
      .filter(file => extname(file) === '.html' && file !== 'index.html')
      .sort();
    
    if (htmlFiles.length === 0) {
      console.log('No HTML files found in html-output directory');
      return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files:`, htmlFiles);
    
    // Update the knownArticles array in the index.html
    const updatedContent = indexContent.replace(
      /const knownArticles = \[[\s\S]*?\];/,
      `const knownArticles = [\n${htmlFiles.map(file => `            '${file}'`).join(',\n')}\n        ];`
    );
    
    // Write the updated index.html
    writeFileSync(indexPath, updatedContent, 'utf-8');
    
    console.log('✅ Index page updated successfully!');
    console.log(`📄 Added ${htmlFiles.length} articles to the index`);
    console.log('🌐 Refresh your browser to see the updated articles');
    
  } catch (error) {
    console.error('Error updating index:', error);
    process.exit(1);
  }
}

// Run the update
updateIndexWithArticles();
