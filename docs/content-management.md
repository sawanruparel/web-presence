# Content Management Documentation

This document describes the content management system, including markdown processing, frontmatter handling, and Rivve AI integration.

## 📝 Content Structure

### Content Types

The project supports four main content types:

1. **Notes** (`/content/notes/`) - Personal notes and thoughts
2. **Publications** (`/content/publications/`) - Articles and papers
3. **Ideas** (`/content/ideas/`) - Creative concepts and proposals
4. **Pages** (`/content/pages/`) - Static pages (About, Contact)

### File Organization

```
content/
├── notes/
│   ├── physical-interfaces.md
│   └── ...
├── publications/
│   ├── decisionrecord-io.md
│   └── ...
├── ideas/
│   ├── extending-carplay.md
│   ├── local-first-ai.md
│   └── ...
└── pages/
    ├── about.md
    ├── contact.md
    └── ...
```

## 📄 Markdown Format

### Basic Structure

Each content file follows this structure:

```markdown
---
# YAML Frontmatter
title: "Content Title"
date: "2024-01-01"
type: "note"  # note, publication, idea, page
description: "Brief description"
author: "Author Name"
tags: ["tag1", "tag2"]
---

# Content Title

Your markdown content here...
```

### Frontmatter Fields

#### Required Fields
- **`title`** - Content title
- **`date`** - Publication date (YYYY-MM-DD format)
- **`type`** - Content type (note, publication, idea, page)

#### Optional Fields
- **`description`** - Brief description for SEO
- **`author`** - Author name
- **`tags`** - Array of tags
- **`categories`** - Array of categories
- **`keywords`** - Array of keywords
- **`readTime`** - Estimated reading time
- **`draft`** - Boolean, mark as draft
- **`featured`** - Boolean, mark as featured

#### SEO Fields
- **`canonical_url`** - Canonical URL
- **`og_title`** - Open Graph title
- **`og_description`** - Open Graph description
- **`og_image`** - Open Graph image
- **`twitter_title`** - Twitter card title
- **`twitter_description`** - Twitter card description
- **`twitter_image`** - Twitter card image

#### Advanced Fields
- **`lang`** - Content language (default: en)
- **`lastmod`** - Last modified date
- **`reading_time`** - Reading time in minutes
- **`status`** - Publication status

## 🤖 Rivve AI Integration

### Overview

Rivve is an AI-powered content management tool that enhances markdown content with:
- Automatic SEO metadata generation
- Content quality analysis
- Social media optimization
- Keyword extraction and tagging

### Rivve Configuration

**Location:** `/rivve/` directory
**API Key:** Required OpenAI API key in `.env`

```bash
# .env file
OPENAI_API_KEY=your-openai-api-key-here
```

### Rivve Workflow

1. **Content Analysis** - AI analyzes markdown content
2. **Metadata Generation** - Generates SEO-optimized frontmatter
3. **HTML Generation** - Creates SEO-optimized HTML files
4. **Quality Validation** - Ensures content meets standards

### Using Rivve

#### Auto-Scan All Content
```bash
cd rivve
npm run auto-scan
```

#### Process Individual File
```bash
cd rivve
npm run generate-frontmatter "../content/notes/my-note.md"
npm run convert-html "../content/notes/my-note.md"
```

#### Development Server
```bash
cd rivve
npm run dev-server
```

## 🔄 Content Processing Pipeline

### 1. Content Discovery & Comparison
 
 **Script:** `web/scripts/fetch-content-from-r2.ts`
 
 The web build process does **not** process local markdown files directly. Instead, it interacts with the web-presence-api, which serves as the central source of truth.
 
 #### Modes:
 
 1.  **Fast Fetch (Default)**: `npm run build:content`
     *   Fetches current content metadata from `/api/content/catalog`.
     *   Uses this metadata to generate `src/data/content-metadata.json` and static HTML files.
     *   Fast, but requires content to be already synced to the API/database.
 
 2.  **Sync & Fetch**: `npm run build:content:sync`
     *   Triggers a manual sync on the API: `POST /api/internal/content-sync/manual`.
     *   The API fetches the latest markdown from **GitHub**, converts it to HTML using `mdtohtml`, and updates its database and R2 storage.
     *   Once sync is complete, the script proceeds to fetch the fresh content.
     *   **Note**: Requires `BUILD_API_KEY` environment variable.
 
 ### 2. Frontmatter Parsing & HTML Conversion (API Side)
 
 All markdown processing happens within the **API** workspace (using the `mdtohtml` shared package), specifically in `ContentProcessingService`.
 
 ```typescript
 // api/src/services/content-processing-service.ts
 import { convertMarkdownToHtml, parseFrontmatter } from 'mdtohtml'
 
 async function processContentFile(filePath, content) {
   // 1. Parse Frontmatter
   const { frontmatter, body } = parseFrontmatter(content)
   
   // 2. Convert to HTML
   const html = convertMarkdownToHtml(body)
   
   // 3. Determine Access Control
   const { isProtected, accessMode } = await determineAccessMode(filePath, frontmatter)
   
   return {
     slug,
     title,
     html,
     accessMode,
     // ...
   }
 }
 ```
 
 ### 3. Metadata Generation
 
 The API generates metadata objects that are consumed by the frontend:
 
 ```typescript
 interface ContentMetadata {
   slug: string
   title: string
   date: string
   readTime: string
   type: string // 'note', 'publication', 'idea', 'page'
   excerpt: string
   // ...
 }
 ```

### 5. HTML Generation

**Rivve HTML Generation:**
- SEO-optimized HTML structure
- Comprehensive meta tags
- Social media optimization
- Structured data (JSON-LD)

**Template Processing:**
- Asset path resolution
- React integration
- Error handling

## 📊 Content Metadata

### Generated Metadata Structure

```json
{
  "notes": [
    {
      "slug": "physical-interfaces",
      "title": "Physical Interfaces",
      "date": "2024-01-01",
      "readTime": "5 min",
      "type": "note",
      "excerpt": "Exploring the future of physical interfaces...",
      "content": "# Physical Interfaces\n\n...",
      "html": "<h2>Introduction</h2>\n<p>..."
    }
  ],
  "publications": [...],
  "ideas": [...],
  "pages": [...],
  "latest": [...]  // Combined recent content
}
```

### Content Indexing

**Location:** `/src/data/content-metadata.json`
**Usage:** React components load content from this file
**Generation:** Updated during build process

## 🎨 Content Display

### React Components

**ContentPage Component:**
```typescript
interface ContentPageProps {
  content: ContentItem
  type: 'note' | 'publication' | 'idea' | 'page'
}
```

**Features:**
- Markdown rendering
- SEO metadata injection
- Social sharing buttons
- Reading time display
- Tag/category display

### Static HTML Pages

**Generated for each content item:**
- SEO-optimized HTML
- Social media meta tags
- Structured data
- Asset integration

## 🔧 Content Management Workflow

### Adding New Content

1. **Create Markdown File**
   ```bash
   touch content/notes/my-new-note.md
   ```

2. **Add Frontmatter**
   ```yaml
   ---
   title: "My New Note"
   date: "2024-01-01"
   type: "note"
   description: "A brief description"
   tags: ["tag1", "tag2"]
   ---
   
   # My New Note
   
   Content here...
   ```

3. **Process Content** (Optional - AI enhancement)
   ```bash
   cd rivve
   npm run generate-frontmatter "../content/notes/my-new-note.md"
   ```

4. **Build and Preview**
   ```bash
   npm run build:content
   npm run dev
   ```

### Updating Existing Content

1. **Edit Markdown File**
   - Update content in `/content/`
   - Modify frontmatter as needed

2. **Regenerate Content**
   ```bash
   npm run build:content
   ```

3. **Preview Changes**
   ```bash
   npm run dev
   ```

### Content Organization

**Best Practices:**
- Use descriptive filenames (kebab-case)
- Include comprehensive frontmatter
- Organize by content type
- Use consistent tagging
- Write clear, engaging excerpts

## 🚀 SEO Optimization

### Automatic SEO Features

**Meta Tags:**
- Title and description
- Open Graph (Facebook, LinkedIn)
- Twitter Cards
- Canonical URLs
- Author information

**Structured Data:**
- Article schema
- Author schema
- Organization schema
- Breadcrumb navigation

**Content Optimization:**
- Reading time calculation
- Excerpt generation
- Keyword extraction
- Content quality analysis

### Manual SEO Optimization

**Frontmatter Fields:**
```yaml
---
title: "SEO-Optimized Title"
description: "Compelling meta description under 160 characters"
canonical_url: "https://yoursite.com/notes/my-note"
og_title: "Social Media Title"
og_description: "Social media description"
og_image: "https://yoursite.com/images/og-image.jpg"
tags: ["relevant", "keywords"]
keywords: ["additional", "search", "terms"]
---
```

## 🔍 Content Validation

### Frontmatter Validation

**Required Fields Check:**
- Title present and non-empty
- Date in correct format
- Type matches content directory

**Content Quality Checks:**
- Minimum content length
- Title length optimization
- Description length validation
- Tag relevance analysis

### Build-Time Validation

**Error Handling:**
- Invalid YAML frontmatter
- Missing required fields
- File permission issues
- Content processing errors

## 📈 Content Analytics

### Built-in Metrics

**Content Statistics:**
- Total content count by type
- Average reading time
- Content freshness
- Tag distribution

**Performance Metrics:**
- Build time per content type
- File size analysis
- Processing efficiency

### Custom Analytics

**Integration Points:**
- Google Analytics
- Content engagement tracking
- Search performance monitoring
- Social media metrics

---

This content management system provides a powerful, flexible foundation for managing and publishing content with AI-enhanced SEO optimization.
