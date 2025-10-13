# Frontmatter Generator

A TypeScript CLI tool that automatically generates SEO-optimized YAML frontmatter for markdown files using AI.

## Features

- 🤖 AI-powered content analysis using OpenAI
- 📝 Automatic title and description generation
- 🏷️ Keyword and tag extraction
- 📱 Social media optimization (Open Graph, Twitter Cards)
- 🔍 SEO metadata generation
- 📊 Content quality analysis and policy enforcement
- 🖼️ Image processing and alt text generation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your actual API key
```

Or set your OpenAI API key directly:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

## Usage

### Basic Usage
Generate frontmatter for a markdown file:
```bash
npx tsx generate-frontmatter.ts input-file.md
```

### With Custom Output
Specify a different output file:
```bash
npx tsx generate-frontmatter.ts input-file.md output-file.md
```

### Using npm scripts
```bash
npm run generate-frontmatter input-file.md
```

## Examples

### Process the example article:
```bash
npx tsx generate-frontmatter.ts example-article.md
```

### Process and save to a new file:
```bash
npx tsx generate-frontmatter.ts example-article.md example-with-frontmatter.md
```

## Configuration

### Environment Variables (.env file)

You can customize the configuration using a `.env` file:

```bash
# Required
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Site Configuration
SITE_BASE_URL=https://your-site.com
SITE_DEFAULT_AUTHOR=Your Name
SITE_DEFAULT_LANG=en
SITE_TWITTER_SITE=@yourhandle
SITE_TWITTER_CREATOR=@yourhandle
```

### Code Configuration

You can also customize the site configuration and policy settings by editing the `generate-frontmatter.ts` file:

- **Site Config**: Base URL, author, social media handles, etc.
- **Policy Config**: Content quality thresholds, SEO requirements, etc.

## Output

The script will:
1. Read your markdown file
2. Generate AI-powered frontmatter
3. Replace any existing frontmatter
4. Save the result
5. Display a policy report with content analysis

## Requirements

- Node.js 18+
- OpenAI API key
- TypeScript (installed as dev dependency)
