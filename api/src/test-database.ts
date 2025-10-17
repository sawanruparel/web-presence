/**
 * Database Service Test Script
 * 
 * Run with: npx wrangler dev --test-scheduled
 * Or call endpoints after starting dev server
 */

import { createDatabaseService } from './services/database-service'
import type { D1Database } from './types/env'

export async function testDatabaseService(db: D1Database) {
  console.log('=== Testing Database Service ===\n')
  
  const dbService = createDatabaseService(db)
  
  try {
    // Test 1: Create access rules
    console.log('Test 1: Creating access rules...')
    
    const openRule = await dbService.createAccessRule({
      type: 'notes',
      slug: 'test-note',
      access_mode: 'open',
      description: 'Test open note'
    })
    console.log('✅ Created open rule:', openRule.id)
    
    const passwordRule = await dbService.createAccessRule({
      type: 'ideas',
      slug: 'test-idea',
      access_mode: 'password',
      description: 'Test password-protected idea',
      password_hash: 'test-hash'
    })
    console.log('✅ Created password rule:', passwordRule.id)
    
    const emailRule = await dbService.createAccessRule({
      type: 'publications',
      slug: 'test-pub',
      access_mode: 'email-list',
      description: 'Test email-protected publication'
    })
    console.log('✅ Created email-list rule:', emailRule.id)
    
    // Test 2: Add emails to allowlist
    console.log('\nTest 2: Adding emails to allowlist...')
    await dbService.addEmailToAllowlist(emailRule.id, 'test@example.com')
    await dbService.addEmailToAllowlist(emailRule.id, 'admin@example.com')
    console.log('✅ Added emails to allowlist')
    
    // Test 3: Query access rules
    console.log('\nTest 3: Querying access rules...')
    const allRules = await dbService.getAllAccessRules()
    console.log(`✅ Found ${allRules.length} access rules`)
    
    const noteRule = await dbService.getAccessRule('notes', 'test-note')
    console.log('✅ Retrieved note rule:', noteRule?.access_mode)
    
    // Test 4: Check email allowlist
    console.log('\nTest 4: Checking email allowlist...')
    const isAllowed = await dbService.isEmailAllowed(emailRule.id, 'test@example.com')
    console.log('✅ Email allowed:', isAllowed)
    
    const emails = await dbService.getEmailsForRule(emailRule.id)
    console.log('✅ Emails in allowlist:', emails)
    
    // Test 5: Log access attempts
    console.log('\nTest 5: Logging access attempts...')
    await dbService.logAccess({
      access_rule_id: openRule.id,
      type: 'notes',
      slug: 'test-note',
      access_granted: true,
      credential_type: 'none',
      ip_address: '127.0.0.1'
    })
    console.log('✅ Logged successful access')
    
    await dbService.logAccess({
      access_rule_id: passwordRule.id,
      type: 'ideas',
      slug: 'test-idea',
      access_granted: false,
      credential_type: 'password',
      ip_address: '127.0.0.1'
    })
    console.log('✅ Logged failed access')
    
    // Test 6: Query logs
    console.log('\nTest 6: Querying logs...')
    const recentLogs = await dbService.getRecentAccessLogs(10)
    console.log(`✅ Found ${recentLogs.length} recent logs`)
    
    const failedAttempts = await dbService.getFailedAccessAttempts(10)
    console.log(`✅ Found ${failedAttempts.length} failed attempts`)
    
    // Test 7: Update access rule
    console.log('\nTest 7: Updating access rule...')
    await dbService.updateAccessRule('notes', 'test-note', {
      description: 'Updated description'
    })
    console.log('✅ Updated access rule')
    
    // Test 8: Get rule with emails
    console.log('\nTest 8: Getting rule with emails...')
    const ruleWithEmails = await dbService.getAccessRuleWithEmails('publications', 'test-pub')
    console.log('✅ Rule with emails:', {
      mode: ruleWithEmails.rule?.access_mode,
      emails: ruleWithEmails.emails.length
    })
    
    console.log('\n=== All Tests Passed! ===')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}
