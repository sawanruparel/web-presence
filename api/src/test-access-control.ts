/**
 * Test Access Control Service
 * 
 * Tests the database-backed access control service
 */

import { createAccessControlService } from './services/access-control-service'
import { createDatabaseService } from './services/database-service'
import type { D1Database } from './types/env'
import { hashPassword } from './utils/password'

// This will run against the local D1 database
async function testAccessControlService(db: D1Database) {
  console.log('🧪 Testing Access Control Service')
  console.log('=' .repeat(60))
  
  const accessControlService = createAccessControlService(db)
  const dbService = createDatabaseService(db)
  
  try {
    // ============================================================
    // Test 1: Setup - Create test access rules
    // ============================================================
    console.log('\n📝 Test 1: Creating test access rules...')
    
    // Create open access rule
    await dbService.createAccessRule({
      type: 'notes',
      slug: 'public-note',
      access_mode: 'open',
      description: 'Public note'
    })
    console.log('✅ Created open access rule')
    
    // Create password-protected rule
    const passwordHash = await hashPassword('secret123')
    await dbService.createAccessRule({
      type: 'ideas',
      slug: 'private-idea',
      access_mode: 'password',
      description: 'Password protected idea',
      password_hash: passwordHash
    })
    console.log('✅ Created password-protected rule')
    
    // Create email-list rule
    const emailRule = await dbService.createAccessRule({
      type: 'publications',
      slug: 'restricted-pub',
      access_mode: 'email-list',
      description: 'Email restricted publication'
    })
    await dbService.addEmailToAllowlist(emailRule.id, 'allowed@example.com')
    await dbService.addEmailToAllowlist(emailRule.id, 'admin@example.com')
    console.log('✅ Created email-list rule with 2 emails')
    
    // ============================================================
    // Test 2: Check public accessibility
    // ============================================================
    console.log('\n📝 Test 2: Testing public accessibility...')
    
    const isPublic = await accessControlService.isPubliclyAccessible('notes', 'public-note')
    console.log(`   Public note accessible: ${isPublic}`)
    if (!isPublic) throw new Error('Public note should be accessible')
    
    const isPrivate = await accessControlService.isPubliclyAccessible('ideas', 'private-idea')
    console.log(`   Private idea accessible: ${isPrivate}`)
    if (isPrivate) throw new Error('Private idea should not be accessible')
    
    console.log('✅ Public accessibility checks passed')
    
    // ============================================================
    // Test 3: Verify password
    // ============================================================
    console.log('\n📝 Test 3: Testing password verification...')
    
    // Test correct password
    const validPassword = await accessControlService.verifyPassword(
      'secret123',
      'ideas',
      'private-idea',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Correct password: ${validPassword}`)
    if (!validPassword) throw new Error('Correct password should be valid')
    
    // Test incorrect password
    const invalidPassword = await accessControlService.verifyPassword(
      'wrongpassword',
      'ideas',
      'private-idea',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Incorrect password: ${invalidPassword}`)
    if (invalidPassword) throw new Error('Incorrect password should be invalid')
    
    // Test password on non-password content
    const wrongMode = await accessControlService.verifyPassword(
      'anypassword',
      'notes',
      'public-note',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Password on open content: ${wrongMode}`)
    if (wrongMode) throw new Error('Password should not work on open content')
    
    console.log('✅ Password verification tests passed')
    
    // ============================================================
    // Test 4: Verify email
    // ============================================================
    console.log('\n📝 Test 4: Testing email verification...')
    
    // Test allowed email
    const allowedEmail = await accessControlService.verifyEmail(
      'allowed@example.com',
      'publications',
      'restricted-pub',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Allowed email: ${allowedEmail}`)
    if (!allowedEmail) throw new Error('Allowed email should be valid')
    
    // Test not allowed email
    const notAllowedEmail = await accessControlService.verifyEmail(
      'notallowed@example.com',
      'publications',
      'restricted-pub',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Not allowed email: ${notAllowedEmail}`)
    if (notAllowedEmail) throw new Error('Not allowed email should be invalid')
    
    // Test email on non-email-list content
    const wrongEmailMode = await accessControlService.verifyEmail(
      'any@example.com',
      'notes',
      'public-note',
      '127.0.0.1',
      'test-agent'
    )
    console.log(`   Email on open content: ${wrongEmailMode}`)
    if (wrongEmailMode) throw new Error('Email should not work on open content')
    
    console.log('✅ Email verification tests passed')
    
    // ============================================================
    // Test 5: Get access mode
    // ============================================================
    console.log('\n📝 Test 5: Testing access mode retrieval...')
    
    const openMode = await accessControlService.getAccessMode('notes', 'public-note')
    console.log(`   Open content mode: ${openMode}`)
    if (openMode !== 'open') throw new Error('Should return open mode')
    
    const passwordMode = await accessControlService.getAccessMode('ideas', 'private-idea')
    console.log(`   Password content mode: ${passwordMode}`)
    if (passwordMode !== 'password') throw new Error('Should return password mode')
    
    const emailMode = await accessControlService.getAccessMode('publications', 'restricted-pub')
    console.log(`   Email-list content mode: ${emailMode}`)
    if (emailMode !== 'email-list') throw new Error('Should return email-list mode')
    
    // Non-existent content should default to open
    const nonExistent = await accessControlService.getAccessMode('notes', 'does-not-exist')
    console.log(`   Non-existent content mode: ${nonExistent}`)
    if (nonExistent !== 'open') throw new Error('Non-existent should default to open')
    
    console.log('✅ Access mode retrieval tests passed')
    
    // ============================================================
    // Test 6: Get access rule
    // ============================================================
    console.log('\n📝 Test 6: Testing access rule retrieval...')
    
    const rule = await accessControlService.getAccessRule('publications', 'restricted-pub')
    console.log(`   Retrieved rule:`, JSON.stringify(rule, null, 2))
    if (!rule) throw new Error('Should retrieve rule')
    if (rule.mode !== 'email-list') throw new Error('Wrong mode')
    if (!rule.allowedEmails || rule.allowedEmails.length !== 2) {
      throw new Error('Should have 2 allowed emails')
    }
    
    console.log('✅ Access rule retrieval tests passed')
    
    // ============================================================
    // Test 7: Generate token
    // ============================================================
    console.log('\n📝 Test 7: Testing token generation...')
    
    const token = await accessControlService.generateToken({
      type: 'ideas',
      slug: 'private-idea',
      verifiedAt: new Date().toISOString()
    })
    console.log(`   Generated token length: ${token.length}`)
    if (!token || token.length < 10) throw new Error('Token should be generated')
    
    // Decode and verify token
    const decodedToken = JSON.parse(atob(token))
    console.log(`   Token payload:`, JSON.stringify(decodedToken, null, 2))
    if (decodedToken.type !== 'ideas') throw new Error('Wrong type in token')
    if (decodedToken.slug !== 'private-idea') throw new Error('Wrong slug in token')
    
    console.log('✅ Token generation tests passed')
    
    // ============================================================
    // Test 8: Log open access
    // ============================================================
    console.log('\n📝 Test 8: Testing open access logging...')
    
    await accessControlService.logOpenAccess(
      'notes',
      'public-note',
      '127.0.0.1',
      'test-agent'
    )
    
    // Verify log was created
    const logs = await dbService.getAccessLogsForContent('notes', 'public-note', 10)
    console.log(`   Logs created: ${logs.length}`)
    if (logs.length === 0) throw new Error('Log should be created')
    
    const latestLog = logs[0]
    console.log(`   Latest log:`, JSON.stringify(latestLog, null, 2))
    if (!latestLog.access_granted) throw new Error('Access should be granted')
    if (latestLog.credential_type !== 'none') throw new Error('Should be none credential')
    
    console.log('✅ Open access logging tests passed')
    
    // ============================================================
    // Test 9: Check access logs
    // ============================================================
    console.log('\n📝 Test 9: Checking access logs...')
    
    // Get recent logs
    const recentLogs = await dbService.getRecentAccessLogs(20)
    console.log(`   Total recent logs: ${recentLogs.length}`)
    
    // Get failed attempts
    const failedLogs = await dbService.getFailedAccessAttempts(10)
    console.log(`   Failed attempts: ${failedLogs.length}`)
    
    // Should have failed attempts from our tests
    if (failedLogs.length === 0) {
      console.log('   ⚠️  Warning: Expected some failed attempts from tests')
    } else {
      console.log(`   Failed attempts found:`)
      failedLogs.forEach((log, i) => {
        console.log(`      ${i + 1}. ${log.type}/${log.slug} - ${log.credential_type}`)
      })
    }
    
    console.log('✅ Access log checks passed')
    
    // ============================================================
    // Test 10: Get access statistics
    // ============================================================
    console.log('\n📝 Test 10: Testing access statistics...')
    
    const stats = await dbService.getAccessStats()
    console.log(`   Total attempts: ${stats.total}`)
    console.log(`   Granted: ${stats.granted}`)
    console.log(`   Denied: ${stats.denied}`)
    console.log(`   By content type:`, JSON.stringify(stats.byType, null, 2))
    console.log(`   By access mode:`, JSON.stringify(stats.byMode, null, 2))
    
    if (stats.total === 0) throw new Error('Should have access attempts')
    
    console.log('✅ Access statistics tests passed')
    
    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('✅ All Access Control Service tests passed!')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  }
}

// Export for use in wrangler environment
export { testAccessControlService }

// If running directly with D1 binding
declare global {
  const DB: D1Database
}

if (typeof DB !== 'undefined') {
  testAccessControlService(DB).catch(console.error)
}
