# Web Deployment

Deployment and configuration guide for the frontend.

## Prerequisites

- Node.js 18+
- npm or yarn
- Static hosting service account (Vercel, Netlify, etc.)

## Local Development

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8787

# Development flag
VITE_DEV_MODE=true

# Mock API mode (optional - defaults to true in dev if no API_BASE_URL)
VITE_USE_MOCK_API=true
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Test the Application

```bash
# Test content loading
curl http://localhost:5173

# Test API integration
curl http://localhost:5173/api/health
```

## Production Build

### 1. Build the Application

```bash
npm run build
```

This will:
- Process all content files
- Generate static HTML files
- Bundle React application
- Optimize assets
- Create production-ready output in `/dist`

### 2. Test Production Build

```bash
# Serve the built application locally
npx serve dist

# Or use any static file server
python -m http.server 8000 --directory dist
```

### 3. Verify Build Output

Check that the following files exist in `/dist`:
- `index.html` - Main React application
- `assets/` - Optimized JavaScript and CSS
- `content-metadata.json` - Content index
- `notes/`, `publications/`, `ideas/` - Static HTML files

## Deployment Options

### Vercel (Recommended)

**Automatic Deployment:**

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `web`

3. **Set Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add:
     - `VITE_API_BASE_URL` - Your production API URL
     - `VITE_DEV_MODE` - `false`

4. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - Custom domains can be configured in project settings

**Manual Deployment:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd web
vercel --prod

# Follow prompts to configure
```

### Netlify

**Automatic Deployment:**

1. **Connect Repository:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your repository

2. **Configure Build Settings:**
   - Build Command: `cd web && npm run build`
   - Publish Directory: `web/dist`
   - Node Version: 18

3. **Set Environment Variables:**
   - Go to Site Settings > Environment Variables
   - Add:
     - `VITE_API_BASE_URL` - Your production API URL
     - `VITE_DEV_MODE` - `false`

4. **Deploy:**
   - Netlify will automatically deploy on every push to main branch

**Manual Deployment:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd web
npm run build
netlify deploy --prod --dir=dist

# Follow prompts to configure
```

### GitHub Pages

**GitHub Actions Workflow:**

1. **Create Workflow File:**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: cd web && npm ci
         - run: cd web && npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./web/dist
   ```

2. **Enable GitHub Pages:**
   - Go to Repository Settings > Pages
   - Source: GitHub Actions
   - The workflow will automatically deploy

### AWS S3 + CloudFront

**S3 Setup:**

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Configure for Static Website:**
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
   ```

3. **Upload Files:**
   ```bash
   cd web
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

**CloudFront Setup:**

1. **Create Distribution:**
   - Origin: S3 bucket
   - Default Root Object: `index.html`
   - Error Pages: Redirect 404 to `/index.html` (for SPA routing)

2. **Configure Caching:**
   - Static assets: Long-term caching
   - HTML files: Short-term caching

### Custom Server

**Express.js Server:**

```javascript
const express = require('express')
const path = require('path')
const app = express()

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')))

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

## Environment Configuration

### Development Environment

**File: `.env.local`**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8787

# Development flag
VITE_DEV_MODE=true

# Mock API mode
VITE_USE_MOCK_API=true
```

### Staging Environment

**File: `.env.staging`**
```bash
# API Configuration
VITE_API_BASE_URL=https://staging-api.example.com

# Development flag
VITE_DEV_MODE=false

# Mock API mode
VITE_USE_MOCK_API=false
```

### Production Environment

**File: `.env.production`**
```bash
# API Configuration
VITE_API_BASE_URL=https://api.example.com

# Development flag
VITE_DEV_MODE=false

# Mock API mode
VITE_USE_MOCK_API=false
```

## Build Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "node scripts/generate-static-content.js",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { htmlPagesPlugin } from './scripts/vite-plugin-html-pages'

export default defineConfig({
  plugins: [
    react(),
    htmlPagesPlugin({
      contentDir: './content',
      outputDir: './dist',
      rivveOutputDir: './rivve/html-output'
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
})
```

## Performance Optimization

### Bundle Optimization

**Code Splitting:**
```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  )
}
```

**Tree Shaking:**
```typescript
// Import only what you need
import { Button } from '@/components/Button'
// Instead of
import * as Components from '@/components'
```

### Asset Optimization

**Image Optimization:**
```typescript
// Use optimized images
import heroImage from '@/assets/hero.webp'

// Lazy load images
<img 
  src={heroImage} 
  loading="lazy" 
  alt="Hero image"
/>
```

**CSS Optimization:**
```typescript
// Tailwind purging
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  // Remove unused styles in production
}
```

## Monitoring and Analytics

### Performance Monitoring

**Web Vitals:**
```typescript
// Measure Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

**Error Tracking:**
```typescript
// Error boundary with tracking
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Send to error tracking service
    errorTracker.captureException(error, {
      extra: errorInfo
    })
  }
}
```

### Analytics

**Google Analytics:**
```typescript
// Google Analytics 4
import { gtag } from 'ga-gtag'

// Track page views
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href
})
```

**Custom Analytics:**
```typescript
// Track custom events
const trackEvent = (action, category, label) => {
  gtag('event', action, {
    event_category: category,
    event_label: label
  })
}
```

## Security Considerations

### Content Security Policy

**CSP Header:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

### Environment Variables

**Secure Configuration:**
```typescript
// Only expose necessary variables
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  // Don't expose sensitive data
}
```

### HTTPS

**Force HTTPS:**
```typescript
// Redirect HTTP to HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace('https:' + window.location.href.substring(window.location.protocol.length))
}
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify environment variables
- Check content file structure
- Review plugin configuration

**Deployment Issues:**
- Verify build output directory
- Check environment variables
- Review hosting service configuration
- Test locally with production build

**Performance Issues:**
- Analyze bundle size
- Check for memory leaks
- Monitor Core Web Vitals
- Optimize images and assets

### Debug Mode

**Enable Debug Logging:**
```bash
# Set debug mode
export VITE_DEV_MODE=true
npm run dev
```

**Build Analysis:**
```bash
# Analyze bundle
npm run build -- --analyze

# Check dependencies
npm run build -- --report
```

## Maintenance

### Regular Updates

**Update Dependencies:**
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions
npm install package@latest
```

**Security Updates:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Monitoring

**Health Checks:**
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
})
```

**Uptime Monitoring:**
- Use services like UptimeRobot or Pingdom
- Monitor API endpoints
- Set up alerts for downtime

## Backup and Recovery

### Content Backup

**Backup Content:**
```bash
# Backup content files
tar -czf content-backup.tar.gz content/

# Backup generated files
tar -czf dist-backup.tar.gz dist/
```

**Version Control:**
- Keep content files in Git
- Use Git hooks for automated backups
- Regular commits and pushes

### Disaster Recovery

**Recovery Plan:**
1. Restore from Git repository
2. Rebuild application
3. Redeploy to hosting service
4. Verify functionality
5. Update DNS if needed

**Documentation:**
- Keep deployment documentation updated
- Document recovery procedures
- Maintain contact information for hosting services
