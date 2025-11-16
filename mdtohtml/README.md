# mdtohtml

Shared markdown to HTML converter library used by both the API and Rivve projects for consistent HTML output and frontmatter handling.

## Features

- **Consistent Markdown Conversion:** Standardized markdown to HTML conversion using `marked` library
- **Frontmatter Support:** Comprehensive frontmatter parsing and validation
- **SEO Optimization:** Complete meta tag generation (Open Graph, Twitter Cards, LinkedIn)
- **JSON-LD Structured Data:** Schema.org structured data generation based on `schema_type`
- **HTML Template Generation:** Full HTML document generation with all SEO elements

## Installation

```bash
npm install
```

## Usage

### Convert Markdown to HTML

```typescript
import { convertMarkdownToHtml } from 'mdtohtml'

const html = convertMarkdownToHtml('# Hello World\n\nThis is markdown.')
```

### Parse Frontmatter

```typescript
import { parseFrontmatter } from 'mdtohtml'

const { frontmatter, body } = parseFrontmatter(markdownContent)
```

### Generate HTML Template

```typescript
import { generateHtmlTemplate } from 'mdtohtml'

const html = generateHtmlTemplate({
  frontmatter: {
    title: 'My Article',
    description: 'Article description',
    // ... other frontmatter fields
  },
  htmlContent: '<p>Article content</p>',
  baseUrl: 'https://example.com'
})
```

### Generate JSON-LD

```typescript
import { generateJsonLd } from 'mdtohtml'

const jsonLd = generateJsonLd(frontmatter, {
  baseUrl: 'https://example.com',
  publisherName: 'My Site'
})
```

## Frontmatter Fields

Supports all frontmatter fields including:
- Basic: title, description, slug, date, lastmod, draft
- SEO: canonical_url, robots, keywords, tags
- Open Graph: og_title, og_description, og_type, og_url, og_site_name, og_locale, og_image
- Twitter: twitter_card, twitter_title, twitter_description, twitter_image, twitter_site, twitter_creator
- LinkedIn: linkedin_title, linkedin_description, linkedin_image, linkedin_author
- Schema: schema_type, schema_overrides
- And more...

## JSON-LD Support

Generates comprehensive JSON-LD structured data based on `schema_type`:
- Article, BlogPosting, NewsArticle
- FAQPage, HowTo, Product
- Event, VideoObject

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Type Checking

```bash
npm run type-check
```

