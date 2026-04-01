---
name: brand-extractor
description: Scrapes any target website using the Firecrawl API to extract comprehensive brand guidelines — colors, typography, assets, UI components, and personality — then automatically creates a structured brand_data/ folder and updates brand-guidelines/SKILL_brandguidelines.md. Use this skill whenever the user mentions a URL and wants to extract, clone, or reference a brand's visual identity. Trigger even for casual phrases like "grab the brand from X", "scrape the design of Y", "I want to build something that looks like Z", or "extract the brand guideline from this link".
---

# Brand Extractor

Scrapes a target website and produces a fully organized `brand_data/` folder plus updates `brand-guidelines/SKILL_brandguidelines.md`. One command, complete brand package.

## Output Structure

For a URL like `https://www.example.com`, a slug `example_com` is derived. All files are written to the **project root `brand_data/` folder** with that slug as prefix:

```
brand_data/
├── example_com_images/              ← downloaded image assets (logo, hero, OG)
│   ├── logo.png
│   ├── og_image.png
│   └── favicon.ico
├── example_com_summary.json         ← concise extracted data (colors, fonts, assets)
├── example_com_branding.md          ← colors + typography reference
├── example_com_brand_guidelines.md  ← full design system with CSS tokens
├── example_com_content.md           ← page markdown content
└── example_com_page.html            ← raw scraped HTML
```

Multiple brands coexist in `brand_data/` — each with its own prefixed files.

## Workflow (do in order)

### Step 1 — Check prerequisites

- `.env` at project root must contain `FIRECRAWL_API_KEY=fc-...`
- Python venv must be activated: `.venv\Scripts\python` (Windows) or `.venv/bin/python` (Mac/Linux)
- If packages missing: `.venv\Scripts\pip install requests`

### Step 2 — Run the scraper script

```bash
# Windows (from project root)
.venv\Scripts\python brand-scraper/scripts/scrape_brand.py <url>

# With --fresh to bypass cache (slower but always live data)
.venv\Scripts\python brand-scraper/scripts/scrape_brand.py <url> --fresh
```

The script:
1. Derives a `brand_slug` from the URL (e.g. `bps_go_id`)
2. Calls Firecrawl with formats `["branding", "html", "markdown", "screenshot"]`
3. Downloads image assets (logo, OG image, favicon) into `brand_data/{slug}_images/`
4. Writes all `brand_data/{slug}_*` files
5. Prints a summary for the agent

### Step 3 — Update the brand guidelines skill

After the script completes, the agent reads `brand_data/{slug}_summary.json` and merges into `brand-guidelines/SKILL_brandguidelines.md`:
- Append a new `## Brand Name — URL` section (preserve existing brands)
- Update the **Active Brand CSS Custom Properties** block

### Step 4 — Report to the user

```
✅ Brand extracted: [Brand Name]
   Source       : [URL]
   Slug         : [brand_slug]
   Color scheme : light | dark
   Primary color: #______
   Heading font : ______

📁 brand_data/
   ├── [slug]_summary.json
   ├── [slug]_branding.md
   ├── [slug]_brand_guidelines.md
   ├── [slug]_content.md
   ├── [slug]_page.html
   └── [slug]_images/ (N assets)

📄 brand-guidelines/SKILL_brandguidelines.md → updated
```

## Edge Cases

- **Firecrawl 500 / timeout**: Site blocks scrapers. Fall back to the browser to manually extract colors/fonts via DevTools, then write the `brand_data/` files manually using the extracted data.
- **Missing images**: Skip download gracefully, note `N/A` in summary.
- **Partial branding data**: Write what's available; use `N/A` for missing fields.
- **Multiple brands**: Each run appends a new slug-prefixed set of files — never overwrites existing brands.
