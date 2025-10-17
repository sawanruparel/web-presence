import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  test('API should be healthy and accessible', async ({ request }) => {
    const response = await request.get('https://web-presence-api.quoppo.workers.dev/health');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version', '1.0.0');
  });

  test('API should respond to CORS preflight requests', async ({ request }) => {
    const response = await request.fetch('https://web-presence-api.quoppo.workers.dev/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    });
    
    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  });
});
