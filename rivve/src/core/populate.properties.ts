/* ============================================================================
  Frontmatter Creator + Policy Layer (TypeScript)
  - AI provider: OpenAI official SDK (Responses API)
  - Policy layer: env safety, thin-content & metadata checks, auto robots
  - Emits: YAML frontmatter + a policy report
============================================================================ */

import OpenAI from "openai";

/* ================================ Types ================================ */

type Env = "dev" | "staging" | "prod";

export interface SiteConfig {
  baseUrl: string;                 // "https://example.com"
  defaultAuthor?: string;
  defaultLang?: string;
  env?: Env;                       // default: "prod"
  twitterSite?: string;            // "@brand"
  twitterCreator?: string;         // "@author"
  defaultChangefreq?: "always"|"hourly"|"daily"|"weekly"|"monthly"|"yearly"|"never";
  defaultPriority?: number;        // 0..1
}

export interface ArticleInput {
  body: string;                    // Markdown or HTML
  titleHint?: string;              // optional author hint
  dateISO?: string;                // publish date (YYYY-MM-DD)
  locale?: string;                 // "en", "en-US"
  imageUrls?: string[];            // candidate hero images
  pathHint?: string;               // optional path context
}

export interface Frontmatter {
  title: string;
  description: string;
  slug: string;
  date: string;
  lastmod: string;
  draft: boolean;
  canonical_url: string;
  robots: string;

  author?: string | string[];
  tags?: string[];
  categories?: string[];
  series?: string;
  reading_time?: number;
  keywords?: string[];

  image?: string;
  image_alt?: string;
  
  // Open Graph fields
  og_title?: string;
  og_description?: string;
  og_type?: "website"|"article"|"product"|"video"|"profile";
  og_url?: string;
  og_site_name?: string;
  og_locale?: string;

  // Twitter fields
  twitter_card?: "summary"|"summary_large_image";
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_site?: string;
  twitter_creator?: string;

  lang?: string;
  hreflang?: { lang: string; url: string }[];

  schema_type?: "Article"|"BlogPosting"|"NewsArticle"|"FAQPage"|"HowTo"|"Product"|"Event"|"VideoObject";
  schema_overrides?: string;

  changefreq?: SiteConfig["defaultChangefreq"];
  priority?: number;

  layout?: string;
  cssclass?: string;
  toc?: boolean;
  
  // URL Management
  redirect_from?: string[];
  canonical_variants?: string[];
  
  // Build/Publish flags
  noindex_reason?: string;
  stage?: string;
  expires?: string;
  
  // Media/Video
  video?: {
    url?: string;
    duration?: string;
    thumbnail?: string;
    upload_date?: string;
  };
}

/* ============================== Policy Layer ============================== */

export interface PolicyConfig {
  enforceNoindexOnNonProd?: boolean;   // default true
  thinContentWordThreshold?: number;   // default 300 words
  minTitleChars?: number;              // default 15
  maxTitleChars?: number;              // default 60
  minDescChars?: number;               // default 50
  maxDescChars?: number;               // default 155
  requireImageForSocial?: boolean;     // default false
  blockIfMissingTitleOrDesc?: boolean; // default true
}

export interface PolicyReport {
  env: Env;
  wordCount: number;
  titleLength: number;
  descriptionLength: number;
  actions: string[];     // e.g., ["SET robots=noindex,nofollow", "TRUNCATE title"]
  warnings: string[];    // non-fatal
  errors: string[];      // fatal (if any)
  decidedRobots?: string;
}

/* =============================== AI Provider ============================== */

/**
 * Test OpenAI API key with a simple request
 */
export async function testOpenAIKey(apiKey: string, model: string = "gpt-3.5-turbo"): Promise<{ success: boolean; error?: string; model?: string }> {
  try {
    const client = new OpenAI({ apiKey });
    
    // Make a simple test request
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: "Say 'API key test successful' and nothing else." }
      ],
      max_tokens: 10,
      temperature: 0
    });
    
    const content = response.choices[0]?.message?.content?.trim();
    
    if (content && content.includes("successful")) {
      return { success: true, model: model };
    } else {
      return { success: false, error: "Unexpected response from API" };
    }
  } catch (error: any) {
    let errorMessage = "Unknown error";
    
    if (error.status === 401) {
      errorMessage = "Invalid API key";
    } else if (error.status === 429) {
      errorMessage = "Rate limit exceeded or quota exceeded. Check your billing at https://platform.openai.com/account/billing";
    } else if (error.status === 403) {
      errorMessage = "API key doesn't have access to this model or account is suspended";
    } else if (error.code === 'insufficient_quota') {
      errorMessage = "Insufficient quota. Please add credits to your OpenAI account";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

export interface AIProvider {
  summarize(content: string, maxChars: number): Promise<string>;
  generateTitle(content: string, maxChars: number, hint?: string): Promise<string>;
  extractKeywords(content: string, count: number): Promise<string[]>;
  suggestTags(content: string, count: number): Promise<string[]>;
  socialTitle(baseTitle: string): Promise<string>;
  socialDescription(summary: string, maxChars: number): Promise<string>;
  linkedinTitle(baseTitle: string): Promise<string>;
  linkedinDescription(summary: string, maxChars: number): Promise<string>;
  detectSchemaType(content: string): Promise<Frontmatter["schema_type"]>;
  captionImage(url: string, context: string): Promise<string>;
}

/** OpenAI-backed AIProvider (Responses API). */
export class OpenAIAIProvider implements AIProvider {
  constructor(
    private client: OpenAI,
    private model: string = "gpt-4.1-mini"
  ) {}

  private async json<T>(system: string, user: string): Promise<T> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.3
    });
    const text = r.choices[0]?.message?.content ?? "";
    
    // Best-effort JSON extraction:
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch (e) {
        // If JSON parsing fails, try to extract the value directly
        console.warn('JSON parsing failed, attempting direct extraction');
        return this.extractValueDirectly(text) as T;
      }
    }
    
    // If no JSON found, try to parse the whole text
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      // Last resort: try to extract value directly
      return this.extractValueDirectly(text) as T;
    }
  }

  private extractValueDirectly(text: string): any {
    // For cases where AI returns plain text instead of JSON
    // Try to extract the first meaningful line
    const lines = text.split('\n').filter(line => line.trim());
    const firstLine = lines[0]?.trim();
    
    if (firstLine) {
      // Return as a simple object with the text as the value
      return { [this.guessKeyFromContext()]: firstLine };
    }
    
    return { value: text.trim() };
  }

  private guessKeyFromContext(): string {
    // This is a fallback - in practice, we know what key we're looking for
    return 'value';
  }

  async summarize(content: string, maxChars: number): Promise<string> {
    const result = await this.json<{summary:string} | {value: string} | string>(
      "Return a concise meta description under the given character limit. Respond with JSON: {\"summary\": \"your description here\"}",
      `CHAR_LIMIT=${maxChars}\nCONTENT:\n${content}`
    );
    const summary = (result as any).summary || (result as any).value || result;
    return String(summary).slice(0, maxChars).trim();
  }

  async generateTitle(content: string, maxChars: number, hint?: string): Promise<string> {
    const result = await this.json<{title:string} | {value: string} | string>(
      "Return an SEO-friendly page title under the given character limit. Prefer user hint if present. Respond with JSON: {\"title\": \"your title here\"}",
      `CHAR_LIMIT=${maxChars}\nHINT=${hint ?? ""}\nCONTENT:\n${content}`
    );
    const title = (result as any).title || (result as any).value || result;
    return String(title).slice(0, maxChars).trim();
  }

  async extractKeywords(content: string, count: number): Promise<string[]> {
    const result = await this.json<{keywords:string[]} | {value: string} | string>(
      "Extract important non-trivial SEO keywords/phrases. Respond with JSON: {\"keywords\": [\"keyword1\", \"keyword2\"]}",
      `COUNT=${count}\nCONTENT:\n${content}`
    );
    const keywords = (result as any).keywords || (result as any).value || result;
    if (Array.isArray(keywords)) {
      return keywords.slice(0, count);
    }
    // If it's a string, split by common delimiters
    const keywordString = String(keywords);
    return keywordString.split(/[,\n;]/).map(k => k.trim()).filter(k => k).slice(0, count);
  }

  async suggestTags(content: string, count: number): Promise<string[]> {
    const result = await this.json<{tags:string[]} | {value: string} | string>(
      "Suggest high-level tags for site taxonomy. Respond with JSON: {\"tags\": [\"tag1\", \"tag2\"]}",
      `COUNT=${count}\nCONTENT:\n${content}`
    );
    const tags = (result as any).tags || (result as any).value || result;
    if (Array.isArray(tags)) {
      return tags.slice(0, count);
    }
    // If it's a string, split by common delimiters
    const tagString = String(tags);
    return tagString.split(/[,\n;]/).map(t => t.trim()).filter(t => t).slice(0, count);
  }

  async socialTitle(baseTitle: string): Promise<string> {
    const result = await this.json<{title:string} | {value: string} | string>(
      "Rewrite for social share if helpful; keep under 60 chars; if already optimal, return as-is. Respond with JSON: {\"title\": \"your title here\"}",
      baseTitle
    );
    const title = (result as any).title || (result as any).value || result;
    return String(title).trim();
  }

  async socialDescription(summary: string, maxChars: number): Promise<string> {
    const result = await this.json<{description:string} | {value: string} | string>(
      "Make this summary slightly more engaging for social share; keep within char limit. Respond with JSON: {\"description\": \"your description here\"}",
      `CHAR_LIMIT=${maxChars}\nSUMMARY:\n${summary}`
    );
    const description = (result as any).description || (result as any).value || result;
    return String(description).slice(0, maxChars).trim();
  }

  async linkedinTitle(baseTitle: string): Promise<string> {
    const result = await this.json<{title:string} | {value: string} | string>(
      "Rewrite this title for LinkedIn professional audience; keep under 100 chars; make it more professional and industry-focused. Respond with JSON: {\"title\": \"your title here\"}",
      baseTitle
    );
    const title = (result as any).title || (result as any).value || result;
    return String(title).trim();
  }

  async linkedinDescription(summary: string, maxChars: number): Promise<string> {
    const result = await this.json<{description:string} | {value: string} | string>(
      "Make this summary more professional and engaging for LinkedIn audience; focus on business value and professional insights; keep within char limit. Respond with JSON: {\"description\": \"your description here\"}",
      `CHAR_LIMIT=${maxChars}\nSUMMARY:\n${summary}`
    );
    const description = (result as any).description || (result as any).value || result;
    return String(description).slice(0, maxChars).trim();
  }

  async detectSchemaType(content: string): Promise<Frontmatter["schema_type"]> {
    const result = await this.json<{type: Frontmatter["schema_type"]} | {value: string} | string>(
      "From the content, pick a schema.org type: Article, BlogPosting, NewsArticle, FAQPage, HowTo, Product, Event, VideoObject. Return 'Article' if unsure. Respond with JSON: {\"type\": \"Article\"}",
      content
    );
    const type = (result as any).type || (result as any).value || result;
    const validTypes = ["Article", "BlogPosting", "NewsArticle", "FAQPage", "HowTo", "Product", "Event", "VideoObject"];
    return validTypes.includes(String(type)) ? String(type) as Frontmatter["schema_type"] : "Article";
  }

  async captionImage(url: string, context: string): Promise<string> {
    const result = await this.json<{alt:string} | {value: string} | string>(
      "Write a concise, descriptive alt text for this image in the page context. Respond with JSON: {\"alt\": \"your alt text here\"}",
      `URL=${url}\nCONTEXT:\n${context}`
    );
    const alt = (result as any).alt || (result as any).value || result;
    return String(alt).trim();
  }
}

/* ============================ Frontmatter Creator ============================ */

export interface CreateFrontmatterOptions {
  ai: AIProvider;
  site: SiteConfig;
  policy?: PolicyConfig;
  nowISO?: string;            // for tests
  preferFirstImage?: boolean; // default true
  maxDescChars?: number;      // default 155
  socialDescChars?: number;   // default 180
  keywordCount?: number;      // default 8
  tagCount?: number;          // default 6
}

export async function createFrontmatter(
  article: ArticleInput,
  opts: CreateFrontmatterOptions
): Promise<{ yaml: string; data: Frontmatter; policy: PolicyReport }> {
  const {
    ai,
    site,
    policy = {},
    nowISO = new Date().toISOString(),
    preferFirstImage = true,
    maxDescChars = policy.maxDescChars ?? 155,
    socialDescChars = 180,
    keywordCount = 8,
    tagCount = 6
  } = opts;

  const env: Env = site.env ?? "prod";
  const dateISO = (article.dateISO ?? nowISO.slice(0, 10));
  const lastmod = nowISO.slice(0, 10);

  // ---- AI-derived
  const title = truncate(await ai.generateTitle(article.body, policy.maxTitleChars ?? 60, article.titleHint), policy.maxTitleChars ?? 60);
  const description = truncate(await ai.summarize(article.body, maxDescChars), maxDescChars);
  const keywords = await ai.extractKeywords(article.body, keywordCount);
  const tags = await ai.suggestTags(article.body, tagCount);
  const schema_type = await ai.detectSchemaType(article.body);

  // ---- System-derived
  const slug = toSlug(title || article.titleHint || firstWords(stripMd(article.body), 6) || "untitled");
  const canonical_url = absolutize(`${site.baseUrl.replace(/\/+$/, "")}/${slug}`);
  const reading_time = Math.max(1, Math.ceil(wordCount(stripMd(article.body)) / 200));
  const primaryImage = pickImage(article.imageUrls, preferFirstImage);
  const absoluteImage = primaryImage ? ensureAbsolute(primaryImage, site.baseUrl) : undefined;
  const image_alt = absoluteImage ? await ai.captionImage(absoluteImage, article.body) : undefined;
  
  // Generate social media titles and descriptions
  const og_title = await ai.socialTitle(title);
  const og_description = await ai.socialDescription(description, socialDescChars);
  
  // Generate Twitter-specific versions
  const twitter_title = await ai.socialTitle(title);
  const twitter_description = await ai.socialDescription(description, socialDescChars);

  // Provisional robots (policy will finalize)
  let robots = "index, follow";
  if ((policy.enforceNoindexOnNonProd ?? true) && env !== "prod") {
    robots = "noindex, nofollow";
  }

  const data: Frontmatter = {
    title,
    description,
    slug,
    date: dateISO,
    lastmod,
    draft: false,
    canonical_url,
    robots,

    ...(site.defaultAuthor && { author: site.defaultAuthor }),
    tags,
    reading_time,
    keywords,

    ...(absoluteImage && { image: absoluteImage }),
    ...(image_alt && { image_alt }),
    
    // Open Graph fields - updated structure
    og_title,
    og_description,
    og_type: schema_type === "Article" || schema_type === "BlogPosting" || schema_type === "NewsArticle" ? "article" : "website",
    og_url: canonical_url,
    og_site_name: "Rivve",
    og_locale: "en_US",

    // Twitter fields - updated structure
    twitter_card: absoluteImage ? "summary_large_image" : "summary",
    twitter_title,
    twitter_description,
    ...(absoluteImage && { twitter_image: absoluteImage }),
    ...(site.twitterSite && { twitter_site: site.twitterSite }),
    ...(site.twitterCreator && { twitter_creator: site.twitterCreator }),

    lang: article.locale ?? site.defaultLang ?? "en",

    ...(schema_type && { schema_type }),

    changefreq: site.defaultChangefreq ?? "weekly",
    priority: clamp(site.defaultPriority ?? 0.7, 0, 1),

    layout: "default"
  };

  // ---- Policy pass
  const report = applyPolicy(article.body, data, env, policy);

  // Apply policy-decided robots & any truncations already captured in report
  if (report.decidedRobots) data.robots = report.decidedRobots;

  const yaml = toYAML(cleanUndefined(data));
  return { yaml, data, policy: report };
}

/* ============================== Policy Engine ============================== */

function applyPolicy(
  rawContent: string,
  fm: Frontmatter,
  env: Env,
  cfg: PolicyConfig
): PolicyReport {
  const p: Required<PolicyConfig> = {
    enforceNoindexOnNonProd: cfg.enforceNoindexOnNonProd ?? true,
    thinContentWordThreshold: cfg.thinContentWordThreshold ?? 300,
    minTitleChars: cfg.minTitleChars ?? 15,
    maxTitleChars: cfg.maxTitleChars ?? 60,
    minDescChars: cfg.minDescChars ?? 50,
    maxDescChars: cfg.maxDescChars ?? 155,
    requireImageForSocial: cfg.requireImageForSocial ?? false,
    blockIfMissingTitleOrDesc: cfg.blockIfMissingTitleOrDesc ?? true
  };

  const wc = wordCount(stripMd(rawContent));
  const actions: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // baseline robots for env
  let decidedRobots = (p.enforceNoindexOnNonProd && env !== "prod") ? "noindex, nofollow" : "index, follow";

  // fatal metadata presence
  if (p.blockIfMissingTitleOrDesc) {
    if (!fm.title || !fm.title.trim()) errors.push("Missing title");
    if (!fm.description || !fm.description.trim()) errors.push("Missing description");
  }

  // thin content
  if (wc < p.thinContentWordThreshold) {
    warnings.push(`Thin content: ${wc} words < ${p.thinContentWordThreshold}`);
    // prefer to noindex thin pages unless explicitly allowed
    decidedRobots = "noindex, nofollow";
    actions.push("SET robots=noindex,nofollow (thin content)");
  }

  // title/description length guidance
  if (fm.title.length < p.minTitleChars) warnings.push(`Short title (${fm.title.length} chars < ${p.minTitleChars})`);
  if (fm.title.length > p.maxTitleChars) {
    warnings.push(`Long title (${fm.title.length} > ${p.maxTitleChars}) — truncated upstream`);
  }
  if (fm.description.length < p.minDescChars) warnings.push(`Short description (${fm.description.length} < ${p.minDescChars})`);
  if (fm.description.length > p.maxDescChars) {
    warnings.push(`Long description (${fm.description.length} > ${p.maxDescChars}) — truncated upstream`);
  }

  // social image policy
  if (p.requireImageForSocial && !fm.image) {
    warnings.push("Missing social image; policy requires one");
    // Do not force noindex for missing image; just warn
  }

  // canonical sanity
  if (!/^https?:\/\//i.test(fm.canonical_url)) {
    errors.push("Canonical URL must be absolute");
  }

  return {
    env,
    wordCount: wc,
    titleLength: fm.title.length,
    descriptionLength: fm.description.length,
    actions,
    warnings,
    errors,
    decidedRobots
  };
}

/* ================================ Utilities ================================ */

function stripMd(s: string): string {
  return s
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>`#>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function firstWords(s: string, n: number): string {
  return s.split(/\s+/).slice(0, n).join(" ");
}
function wordCount(s: string): number {
  return (s.match(/\S+/g) || []).length;
}
function toSlug(s: string): string {
  const ascii = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return ascii.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function ensureAbsolute(url: string, base: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const b = base.replace(/\/+$/, "");
  const u = url.replace(/^\/+/, "");
  return `${b}/${u}`;
}
function absolutize(u: string): string {
  if (!/^https?:\/\//.test(u)) throw new Error(`canonical_url must be absolute: ${u}`);
  return u;
}
function pickImage(urls?: string[], preferFirst = true): string | undefined {
  if (!urls || urls.length === 0) return undefined;
  return preferFirst ? urls[0] : urls[0];
}
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}
function cleanUndefined<T extends object>(obj: T): T {
  const out: any = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined) return;
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = cleanUndefined(v as any);
    else out[k] = v;
  });
  return out;
}
function toYAML(obj: any): string {
  const lines: string[] = ["---"];
  emitYAML(obj, 0, lines);
  lines.push("---");
  return lines.join("\n");
}
function emitYAML(value: any, indent: number, out: string[], key?: string) {
  const pad = "  ".repeat(indent);
  const writeKV = (k: string, v: string) => out.push(`${pad}${k}: ${v}`);
  if (key === undefined) {
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) emitYAML(v, indent, out, k);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) { writeKV(key, "[]"); return; }
    out.push(`${pad}${key}:`);
    for (const item of value) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        out.push(`${pad}-`);
        emitYAML(item, indent + 1, out);
      } else {
        out.push(`${pad}- ${scalar(item)}`);
      }
    }
  } else if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) { writeKV(key, "{}"); return; }
    out.push(`${pad}${key}:`);
    for (const [k, v] of entries) emitYAML(v, indent + 1, out, k);
  } else {
    writeKV(key, scalar(value));
  }
}
function scalar(v: any): string {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v == null) return '""';
  const s = String(v);
  const needsQuotes = /[:#,\[\]{}&*!|>'"%@`]|^\s|\s$|\n/.test(s);
  return needsQuotes ? JSON.stringify(s) : s;
}

/* ============================== Example Usage ==============================

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const ai = new OpenAIAIProvider(openai, "gpt-4.1-mini");

const site: SiteConfig = {
  baseUrl: "https://example.com",
  defaultAuthor: "Editorial Team",
  defaultLang: "en",
  env: "prod",
  twitterSite: "@example",
  twitterCreator: "@editor",
  defaultChangefreq: "weekly",
  defaultPriority: 0.7
};

const policy: PolicyConfig = {
  enforceNoindexOnNonProd: true,
  thinContentWordThreshold: 300,
  minTitleChars: 15,
  maxTitleChars: 60,
  minDescChars: 50,
  maxDescChars: 155,
  requireImageForSocial: false,
  blockIfMissingTitleOrDesc: true
};

(async () => {
  const article: ArticleInput = {
    body: `# Obsidian as a CMS
Use frontmatter, Git, and a static site generator to publish...`,
    imageUrls: ["/images/obsidian-cms.png"],
    locale: "en-US"
  };

  const { yaml, data, policy: report } =
    await createFrontmatter(article, { ai, site, policy });

  console.log(yaml);
  console.log(report);
})();

============================================================================ */
