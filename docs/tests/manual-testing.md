# Manual Testing Guide

Comprehensive manual testing procedures for the Web Presence application.

## Overview

This guide provides step-by-step manual testing procedures to verify the application functionality across different access modes and user scenarios.

## Prerequisites

- Backend API running at `https://web-presence-api.quoppo.workers.dev`
- Frontend application accessible
- Test credentials and content available

## Test Environment Setup

### Backend API
- **URL**: `https://web-presence-api.quoppo.workers.dev`
- **Health Check**: `GET /health`
- **Status**: Should return `{"status":"ok"}`

### Frontend Application
- **URL**: `http://localhost:5173` (development) or deployed URL
- **Status**: Should load without errors

## Test Cases

### 1. API Health Check

**Objective**: Verify API is accessible and responding

**Steps**:
1. Open terminal/command prompt
2. Run: `curl https://web-presence-api.quoppo.workers.dev/health`
3. Verify response: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

**Expected Result**: API returns successful health status

### 2. Open Access Content

**Objective**: Verify open access content loads without authentication

**Test Content**: `ideas/local-first-ai`

**Steps**:
1. Navigate to frontend application
2. Go to Ideas section
3. Click on "Local-First AI" content
4. Verify content loads immediately without modal

**Expected Result**: Content displays without authentication prompt

### 3. Password-Protected Content

**Objective**: Verify password-protected content requires authentication

**Test Content**: `ideas/sample-protected-idea`
**Password**: `ideas-sample-protected-idea-xyz123`

**Steps**:
1. Navigate to Ideas section
2. Click on "Sample Protected Idea" content
3. Verify access modal appears
4. Enter password: `ideas-sample-protected-idea-xyz123`
5. Click "Access Content"
6. Verify content loads after authentication

**Expected Result**: Content requires password and loads after correct authentication

### 4. Email-List Protected Content

**Objective**: Verify email-list protected content requires email verification

**Test Content**: `publications/decisionrecord-io`
**Authorized Email**: `admin@example.com`
**Unauthorized Email**: `unauthorized@example.com`

**Steps**:
1. Navigate to Publications section
2. Click on "Decision Record IO" content
3. Verify access modal appears with email input
4. Enter unauthorized email: `unauthorized@example.com`
5. Click "Access Content"
6. Verify access is denied
7. Enter authorized email: `admin@example.com`
8. Click "Access Content"
9. Verify content loads after authentication

**Expected Result**: Content requires authorized email and loads after correct verification

### 5. Invalid Password Handling

**Objective**: Verify error handling for invalid passwords

**Test Content**: `ideas/sample-protected-idea`

**Steps**:
1. Navigate to Ideas section
2. Click on "Sample Protected Idea" content
3. Enter invalid password: `wrong-password`
4. Click "Access Content"
5. Verify error message appears
6. Verify modal remains open
7. Enter correct password: `ideas-sample-protected-idea-xyz123`
8. Click "Access Content"
9. Verify content loads

**Expected Result**: Invalid password shows error, correct password allows access

### 6. Invalid Email Handling

**Objective**: Verify error handling for invalid emails

**Test Content**: `publications/decisionrecord-io`

**Steps**:
1. Navigate to Publications section
2. Click on "Decision Record IO" content
3. Enter invalid email: `unauthorized@example.com`
4. Click "Access Content"
5. Verify error message appears
6. Verify modal remains open
7. Enter authorized email: `admin@example.com`
8. Click "Access Content"
9. Verify content loads

**Expected Result**: Invalid email shows error, authorized email allows access

### 7. Session Persistence

**Objective**: Verify authentication persists across page navigation

**Test Content**: `ideas/sample-protected-idea`

**Steps**:
1. Navigate to Ideas section
2. Click on "Sample Protected Idea" content
3. Enter password: `ideas-sample-protected-idea-xyz123`
4. Click "Access Content"
5. Verify content loads
6. Navigate to another section (e.g., Publications)
7. Navigate back to Ideas section
8. Click on "Sample Protected Idea" content again
9. Verify content loads without re-authentication

**Expected Result**: Authentication persists across navigation

### 8. Token Expiration

**Objective**: Verify token expiration handling

**Test Content**: `ideas/sample-protected-idea`

**Steps**:
1. Navigate to Ideas section
2. Click on "Sample Protected Idea" content
3. Enter password: `ideas-sample-protected-idea-xyz123`
4. Click "Access Content"
5. Verify content loads
6. Wait for token expiration (24 hours) or manually expire token
7. Try to access content again
8. Verify re-authentication is required

**Expected Result**: Expired tokens require re-authentication

### 9. Responsive Design

**Objective**: Verify application works on different screen sizes

**Steps**:
1. Open application in desktop browser
2. Test all access modes on desktop
3. Resize browser to tablet size (768px)
4. Test all access modes on tablet
5. Resize browser to mobile size (375px)
6. Test all access modes on mobile
7. Verify modals and content are properly sized

**Expected Result**: Application works correctly on all screen sizes

### 10. Cross-Browser Compatibility

**Objective**: Verify application works across different browsers

**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Steps**:
1. Open application in each browser
2. Test all access modes in each browser
3. Verify consistent behavior across browsers
4. Check for any browser-specific issues

**Expected Result**: Application works consistently across all browsers

## Test Data Reference

### Content Access Modes

| Content | Type | Access Mode | Credentials |
|---------|------|-------------|-------------|
| `ideas/local-first-ai` | Ideas | Open | None |
| `ideas/sample-protected-idea` | Ideas | Password | `ideas-sample-protected-idea-xyz123` |
| `publications/decisionrecord-io` | Publications | Email-List | `admin@example.com` |

### Test Emails

| Email | Status | Access Level |
|-------|--------|--------------|
| `admin@example.com` | Authorized | Full access to email-list content |
| `unauthorized@example.com` | Not Authorized | No access to email-list content |

### Test Passwords

| Content | Password |
|---------|----------|
| `ideas/sample-protected-idea` | `ideas-sample-protected-idea-xyz123` |

## Troubleshooting

### Common Issues

#### API Not Responding
- Check if API is running: `curl https://web-presence-api.quoppo.workers.dev/health`
- Verify network connectivity
- Check for CORS issues in browser console

#### Content Not Loading
- Check browser console for errors
- Verify content exists in the system
- Check if content is properly configured

#### Authentication Issues
- Verify credentials are correct
- Check if tokens are being stored properly
- Clear browser storage and try again

#### Modal Not Appearing
- Check if JavaScript is enabled
- Verify modal component is loaded
- Check for CSS conflicts

### Debug Information

#### Browser Console
- Open browser developer tools
- Check Console tab for errors
- Check Network tab for failed requests

#### API Logs
- Check API logs for authentication attempts
- Verify access control rules are correct
- Check for rate limiting issues

#### Frontend Logs
- Check browser console for frontend errors
- Verify API calls are being made correctly
- Check for JavaScript errors

## Test Reporting

### Test Results Template

```
Manual Test Results - [Date]

Environment:
- Backend API: [URL]
- Frontend: [URL]
- Browser: [Browser/Version]
- Screen Size: [Desktop/Tablet/Mobile]

Test Cases:
1. API Health Check: [PASS/FAIL]
2. Open Access Content: [PASS/FAIL]
3. Password-Protected Content: [PASS/FAIL]
4. Email-List Protected Content: [PASS/FAIL]
5. Invalid Password Handling: [PASS/FAIL]
6. Invalid Email Handling: [PASS/FAIL]
7. Session Persistence: [PASS/FAIL]
8. Token Expiration: [PASS/FAIL]
9. Responsive Design: [PASS/FAIL]
10. Cross-Browser Compatibility: [PASS/FAIL]

Issues Found:
- [List any issues or bugs found]

Overall Result: [PASS/FAIL]
```

### Bug Reporting

When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and version
- Screenshots if applicable
- Console errors if any

## Maintenance

### Regular Testing Schedule
- **Daily**: Smoke tests (API health, basic functionality)
- **Weekly**: Full test suite
- **Before Release**: Complete regression testing
- **After Changes**: Affected functionality testing

### Test Data Updates
- Update test credentials when access rules change
- Verify test content is still available
- Update test procedures when UI changes

### Documentation Updates
- Update test procedures when features change
- Add new test cases for new features
- Remove obsolete test cases
