# Environment Setup

This document explains how to configure environment variables for the password protection feature.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Development flag
VITE_DEV_MODE=true

# Mock API mode (optional - defaults to true in dev if no API_BASE_URL)
VITE_USE_MOCK_API=true
```

## Configuration Options

### VITE_API_BASE_URL
- **Description**: Base URL for the password protection backend API
- **Default**: `http://localhost:3001`
- **Development**: `http://localhost:3001` (or your local backend URL)
- **Production**: `https://your-backend-api.vercel.app` (or your production backend URL)

### VITE_DEV_MODE
- **Description**: Development mode flag for additional logging and debugging
- **Default**: `true`
- **Development**: `true`
- **Production**: `false`

### VITE_USE_MOCK_API
- **Description**: Use mock API server for development (no backend required)
- **Default**: `true` (in dev mode if no API_BASE_URL set)
- **Development**: `true` (for testing without backend) or `false` (to use real API)
- **Production**: `false` (always uses real API)

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your specific values:
   ```bash
   # For local development
   VITE_API_BASE_URL=http://localhost:3001
   VITE_DEV_MODE=true
   
   # For production
   VITE_API_BASE_URL=https://your-backend-api.vercel.app
   VITE_DEV_MODE=false
   ```

3. **Restart your development server** after making changes:
   ```bash
   npm run dev
   ```

## Configuration File

The environment variables are managed through `src/config/environment.ts`. This file:

- Provides default values for all configuration options
- Exports helper functions for checking environment state
- Logs configuration in development mode
- Centralizes all environment-related logic

## Mock API for Development

When `VITE_USE_MOCK_API=true` (default in development), the frontend uses a built-in mock API server that:

- **No Backend Required**: Test password protection without setting up a backend
- **Pre-configured Content**: Includes sample protected content for testing
- **Realistic Responses**: Mimics the real API responses and error handling
- **Easy Testing**: Pre-defined passwords for quick testing

### Mock API Features

- **Sample Protected Content**: `sample-protected-idea` with password `test123`
- **Password Verification**: `/api/verify-password` endpoint
- **Content Retrieval**: `/api/protected-content/:type/:slug` endpoint
- **Health Check**: `/api/health` endpoint
- **Session Tokens**: JWT-like tokens for session management

### Testing with Mock API

1. Start the development server: `npm run dev`
2. Navigate to `/ideas/sample-protected-idea`
3. Enter password: `test123`
4. View the protected content

## Backend API Requirements

The frontend expects the backend API to be available at the configured `VITE_API_BASE_URL` with the following endpoints:

- `POST /api/verify-password` - Password verification
- `GET /api/protected-content/:type/:slug` - Protected content retrieval
- `GET /api/health` - Health check (optional)

See `docs/api-contract.md` for detailed API specifications.

## Troubleshooting

### API Connection Issues
- Verify the `VITE_API_BASE_URL` is correct
- Ensure the backend API is running
- Check network connectivity
- Look for CORS issues in browser console

### Development Mode
- Set `VITE_DEV_MODE=true` for additional logging
- Check browser console for configuration details
- Use browser dev tools to inspect API requests

### Production Deployment
- Set `VITE_DEV_MODE=false` for production
- Ensure `VITE_API_BASE_URL` points to production backend
- Verify all environment variables are set in your deployment platform
