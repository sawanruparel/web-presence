# Rivve - AI-Powered Frontmatter Generator

**Rivve** is an AI-powered tool that generates and enhances frontmatter metadata for markdown files. It focuses solely on creating comprehensive, SEO-optimized frontmatter using AI, including image generation when needed. HTML generation is handled by `mdtohtml` or your build system.

## 📁 Project Structure

```
rivve/
├── src/
│   ├── core/              # Core functionality
│   │   └── populate.properties.ts  # AI frontmatter generation
│   ├── cli/               # Command-line tools
│   │   ├── auto-scan-and-convert.ts  # Auto-scan and generate frontmatter
│   │   ├── generate-frontmatter.ts    # Generate frontmatter for single file
│   │   └── test-api-key.ts           # Test OpenAI API key
│   └── utils/             # Utility functions
├── config/                # Configuration files
│   └── tsconfig.json
├── examples/              # Example files
├── docs/                  # Documentation
├── package.json
└── README.md
```

## 🏗️ About Rivve

**Rivve** is a focused AI-powered frontmatter generator that works with any markdown content:

- **Any Markdown Files**: Process individual or multiple markdown files
- **Obsidian Vaults**: Enhance notes from Obsidian workspaces
- **Content Management Systems**: Integrate with existing workflows
- **Documentation Projects**: Generate metadata for technical docs

Rivve provides:
- **AI-Powered Frontmatter Generation**: Intelligent metadata creation using OpenAI
- **Auto-Scan Functionality**: Automatically finds and processes all markdown files
- **SEO Optimization**: Comprehensive frontmatter with all SEO fields
- **Social Media Optimization**: Multi-platform metadata (Open Graph, Twitter, LinkedIn)
- **Image Generation**: AI-powered image suggestions and captions
- **Content Quality Analysis**: Policy enforcement and validation
- **In-Place Updates**: Updates frontmatter directly in markdown files

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
- `npm run generate-frontmatter <input-file> [output-file]` - Generate AI-powered frontmatter for a single file
- `npm run test-api` - Test OpenAI API key

### Auto-Scan Commands
- `npm run auto-scan` - Automatically scan folder and generate/enhance frontmatter for all markdown files
- `npm run auto-scan-force` - Force regenerate all files (ignore existing frontmatter)
- `npm run auto-scan-no-ai` - Auto-scan without AI processing (validates existing frontmatter only)

## 🔧 Usage Examples

### Generate Frontmatter for a Single File
```bash
# Process a file and update it in-place
npm run generate-frontmatter "../My Article.md"

# Process a file and save to a new file
npm run generate-frontmatter "../My Article.md" "../My Article-enhanced.md"
```

### Auto-Scan Multiple Files
```bash
# Scan and generate frontmatter for all markdown files
npm run auto-scan

# Force regenerate all frontmatter (overwrites existing)
npm run auto-scan-force

# Validate existing frontmatter without AI processing
npm run auto-scan-no-ai
```

## 🎯 Features

### 🤖 AI-Powered Frontmatter Generation
- Automatic title and description generation
- Keyword extraction and tag suggestion
- Content quality analysis
- Social media optimization
- Image suggestions and captions

### 📱 Multi-Platform Social Media Support
- Open Graph (Facebook, LinkedIn)
- Twitter Cards (using twitter:* format)
- LinkedIn-specific metadata
- Custom social media titles and descriptions

### 🔍 SEO Optimization
- Comprehensive meta tags in frontmatter
- Canonical URLs
- Robots directives
- Schema.org structured data types
- Reading time calculation

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
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo, etc.
```

### Site Configuration
Edit the site configuration in `src/cli/generate-frontmatter.ts` or `src/cli/auto-scan-and-convert.ts`:
- Base URL
- Default author
- Social media handles
- Content policies

## 📖 Development

### Project Structure
- **`src/core/`** - Core AI and frontmatter generation logic
- **`src/cli/`** - Command-line interface tools
- **`config/`** - TypeScript configuration

### Building
```bash
npm run build
```

## 🔍 Troubleshooting

### API Key Issues
```bash
npm run test-api
```

### Common Issues
1. **Missing API key**: Ensure `.env` file exists with `OPENAI_API_KEY`
2. **Import errors**: Check that all files are in the correct directories
3. **Build errors**: Run `npm run build` to check TypeScript compilation

## 📝 Notes

- **HTML Generation**: Rivve does NOT generate HTML. Use `mdtohtml` or your build system for HTML conversion.
- **In-Place Updates**: By default, Rivve updates frontmatter directly in the source markdown files.
- **Frontmatter Only**: Rivve focuses solely on generating and enhancing frontmatter metadata.

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Rivve** - Generate comprehensive, SEO-optimized frontmatter for your markdown content with AI assistance.

A focused AI-powered frontmatter generator for modern content creators.
