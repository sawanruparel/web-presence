# Rivve - AI-Powered Content Management Tools

**Rivve** is a standalone AI-powered content management tool that transforms markdown files into SEO-optimized, publication-ready HTML with comprehensive metadata generation using AI. It works with any markdown content, including Obsidian vaults.

## 📁 Project Structure

```
personal-site/                  # Main content directory
├── scripts/                    # Rivve tool (this directory)
│   ├── src/
│   │   ├── core/              # Core functionality
│   │   │   └── populate.properties.ts
│   │   ├── cli/               # Command-line tools
│   │   │   ├── auto-scan-and-convert.ts  # NEW: Auto-scan tool
│   │   │   ├── convert-to-html.ts
│   │   │   ├── generate-frontmatter.ts
│   │   │   ├── test-api-key.ts
│   │   │   └── update-index.ts
│   │   └── utils/             # Utility functions
│   │       ├── file-utils.ts
│   │       ├── validation-utils.ts
│   │       └── index.ts
│   ├── templates/             # NEW: Template files
│   │   └── index.html         # Index template with placeholders
│   ├── config/                # Configuration files
│   │   ├── tsconfig.json
│   │   └── vite.config.js
│   ├── examples/              # Example files
│   │   └── example-article.md
│   ├── docs/                  # Documentation
│   │   └── README.md
│   ├── html-output/           # Generated HTML files (auto-cleaned)
│   │   ├── index.html         # Generated from template
│   │   ├── *.html             # Converted markdown files
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── dist/                  # Compiled JavaScript
│   ├── node_modules/
│   ├── package.json
│   └── package-lock.json
├── templates/                 # Content templates
│   └── seo-template.md
└── *.md                       # Your markdown files
```

## 🏗️ About Rivve

**Rivve** is a standalone AI-powered content management tool that can work with any markdown content. While it's currently located in the `scripts/` directory of this Obsidian vault, it's designed to be portable and work with:

- **Any Obsidian Vault**: Process notes from any Obsidian workspace
- **Standalone Markdown Files**: Work with individual markdown files
- **Content Management Systems**: Integrate with existing workflows
- **Documentation Projects**: Transform technical docs into web-ready content

Rivve provides:
- **Auto-Scan Functionality**: Automatically finds and converts all markdown files
- **AI-Powered SEO**: Intelligent frontmatter generation and optimization
- **Template System**: Persistent index templates with dynamic content population
- **Clean Output**: Automatic cleanup of generated files for fresh builds
- **Modern Styling**: Beautiful HTML output with responsive design
- **Social Media Optimization**: Multi-platform metadata generation
- **Content Quality Analysis**: Policy enforcement and validation
- **Development Server**: Live preview with hot reloading

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation
```bash
npm install
```

### Setup
1. Create a `.env` file with your OpenAI API key:
```bash
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

2. Test your API key:
```bash
npm run test-api
```

## 📋 Available Scripts

### Core Commands
- `npm run generate-frontmatter <input-file>` - Generate AI-powered frontmatter
- `npm run convert-html <input-file>` - Convert markdown to HTML
- `npm run update-index` - Update the article index
- `npm run dev-server` - Start development server

### Auto-Scan Commands (NEW!)
- `npm run auto-scan` - Automatically scan base folder and convert all markdown files
- `npm run auto-scan-force` - Force regenerate all files (ignore timestamps)
- `npm run auto-scan-no-ai` - Auto-scan without AI processing (faster, uses existing frontmatter)
- `npm run auto-scan-and-serve` - Auto-scan all files and start dev server

### Utility Commands
- `npm run test-api` - Test OpenAI API key
- `npm run build` - Compile TypeScript
- `npm run convert-and-serve` - Full pipeline: convert → update index → serve

## 🔧 Usage Examples

### Generate Frontmatter for a Markdown File
```bash
# Process a file from your Obsidian vault
npm run generate-frontmatter "../My Article.md"

# Or process the example file
npm run generate-frontmatter examples/example-article.md
```

### Convert Markdown to HTML
```bash
# Convert a vault file to HTML
npm run convert-html "../My Article.md"

# Or convert the example
npm run convert-html examples/example-article.md
```

### Full Workflow
```bash
# 1. Generate frontmatter for your Obsidian note
npm run generate-frontmatter "../My Article.md"

# 2. Convert to HTML
npm run convert-html "../My Article.md"

# 3. Update the article index
npm run update-index

# 4. Start development server to preview
npm run dev-server
```

## 🎯 Features

### 🤖 AI-Powered Content Analysis
- Automatic title and description generation
- Keyword extraction and tag suggestion
- Content quality analysis
- Social media optimization

### 📱 Multi-Platform Social Media Support
- Open Graph (Facebook, LinkedIn)
- Twitter Cards (X)
- LinkedIn-specific metadata
- Custom social media titles and descriptions

### 🔍 SEO Optimization
- Comprehensive meta tags
- Structured data (JSON-LD)
- Canonical URLs
- Robots directives
- Sitemap integration hints

### 📊 Content Policy Enforcement
- Thin content detection
- Title/description length validation
- Environment-based indexing rules
- Content quality warnings

## ⚙️ Configuration

### Environment Variables (.env)
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

### Site Configuration
Edit the site configuration in `src/cli/generate-frontmatter.ts`:
- Base URL
- Default author
- Social media handles
- Content policies

## 📖 Development

### Project Structure
- **`src/core/`** - Core AI and content processing logic
- **`src/cli/`** - Command-line interface tools
- **`config/`** - TypeScript and Vite configuration
- **`examples/`** - Sample markdown files
- **`html-output/`** - Generated HTML files

### Building
```bash
npm run build
```

### Development Server
```bash
npm run dev-server
```
Opens at `http://localhost:3000`

## 🔍 Troubleshooting

### API Key Issues
```bash
npm run test-api
```

### Common Issues
1. **Missing API key**: Ensure `.env` file exists with `OPENAI_API_KEY`
2. **Import errors**: Check that all files are in the correct directories
3. **Build errors**: Run `npm run build` to check TypeScript compilation

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Rivve** - Transform your markdown content into publication-ready HTML with AI assistance.

A standalone AI-powered content management tool for modern content creators.
