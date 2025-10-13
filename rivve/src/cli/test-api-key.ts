#!/usr/bin/env node

import { config } from 'dotenv';
import { testOpenAIKey } from '../core/populate.properties.js';

// Load environment variables from .env file
config();

async function testAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found in .env file');
    console.error('Create a .env file with: OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  console.log('🔑 Testing OpenAI API key...');
  console.log(`   Key: ${apiKey.substring(0, 20)}...`);
  console.log('');
  
  // Test with different models
  const models = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4'];
  
  for (const model of models) {
    console.log(`Testing with ${model}...`);
    const result = await testOpenAIKey(apiKey, model);
    
    if (result.success) {
      console.log(`✅ ${model}: Working`);
    } else {
      console.log(`❌ ${model}: ${result.error}`);
    }
    console.log('');
  }
}

testAPIKey().catch(console.error);
