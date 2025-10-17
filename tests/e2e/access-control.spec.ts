import { test, expect } from '@playwright/test';

test.describe('Access Control System', () => {
  test('should check access requirements for open content', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/auth/access/notes/physical-interfaces');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('accessMode', 'open');
    expect(data).toHaveProperty('requiresPassword', false);
    expect(data).toHaveProperty('requiresEmail', false);
    expect(data).toHaveProperty('message');
  });

  test('should check access requirements for password-protected content', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/auth/access/ideas/local-first-ai');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('accessMode', 'password');
    expect(data).toHaveProperty('requiresPassword', true);
    expect(data).toHaveProperty('requiresEmail', false);
    expect(data).toHaveProperty('message');
  });

  test('should check access requirements for email-list content', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/auth/access/publications/decisionrecord-io');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('accessMode', 'email-list');
    expect(data).toHaveProperty('requiresPassword', false);
    expect(data).toHaveProperty('requiresEmail', true);
    expect(data).toHaveProperty('message');
  });

  test('should verify password for protected content', async ({ request }) => {
    const response = await request.post('https://web-presence-api.quoppo.workers.dev/auth/verify', {
      data: {
        type: 'ideas',
        slug: 'local-first-ai',
        password: 'ideas-local-first-ai-n1wvs8'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('accessMode', 'password');
    expect(data.token).toBeTruthy();
  });

  test('should reject invalid password', async ({ request }) => {
    const response = await request.post('https://web-presence-api.quoppo.workers.dev/auth/verify', {
      data: {
        type: 'ideas',
        slug: 'local-first-ai',
        password: 'wrong-password'
      }
    });
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Invalid password');
  });

  test('should verify email for email-list content', async ({ request }) => {
    const response = await request.post('https://web-presence-api.quoppo.workers.dev/auth/verify', {
      data: {
        type: 'publications',
        slug: 'decisionrecord-io',
        email: 'admin@example.com'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('accessMode', 'email-list');
    expect(data.token).toBeTruthy();
  });

  test('should reject unauthorized email', async ({ request }) => {
    const response = await request.post('https://web-presence-api.quoppo.workers.dev/auth/verify', {
      data: {
        type: 'publications',
        slug: 'decisionrecord-io',
        email: 'unauthorized@example.com'
      }
    });
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('not authorized');
  });

  test('should get protected content with valid token', async ({ request }) => {
    // First get a token
    const verifyResponse = await request.post('https://web-presence-api.quoppo.workers.dev/auth/verify', {
      data: {
        type: 'ideas',
        slug: 'local-first-ai',
        password: 'ideas-local-first-ai-n1wvs8'
      }
    });
    
    const verifyData = await verifyResponse.json();
    expect(verifyData.success).toBe(true);
    
    // Then get the protected content
    const contentResponse = await request.get('https://web-presence-api.quoppo.workers.dev/auth/content/ideas/local-first-ai', {
      headers: {
        'Authorization': `Bearer ${verifyData.token}`
      }
    });
    
    expect(contentResponse.status()).toBe(200);
    
    const contentData = await contentResponse.json();
    expect(contentData).toHaveProperty('slug', 'local-first-ai');
    expect(contentData).toHaveProperty('title');
    expect(contentData).toHaveProperty('content');
    expect(contentData).toHaveProperty('html');
  });

  test('should reject protected content request without token', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/auth/content/ideas/local-first-ai');
    
    expect(response.status()).toBe(401);
  });

  test('should reject protected content request with invalid token', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/auth/content/ideas/local-first-ai', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    expect(response.status()).toBe(401);
  });
});
