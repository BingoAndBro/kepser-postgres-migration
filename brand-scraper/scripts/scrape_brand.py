"""
brand-scraper/scripts/scrape_brand.py

Extracts brand identity from a target URL via Firecrawl API, then writes
a fully organized brand_data/ folder at the project root:

  brand_data/
  ├── {slug}_images/              ← downloaded image assets
  ├── {slug}_summary.json         ← concise machine-readable summary
  ├── {slug}_branding.md          ← colors + typography quick reference
  ├── {slug}_brand_guidelines.md  ← full design system with CSS tokens
  ├── {slug}_content.md           ← page markdown content
  └── {slug}_page.html            ← raw scraped HTML

The slug is derived from the URL hostname, e.g.:
  https://www.bps.go.id/id  →  bps_go_id

Reads FIRECRAWL_API_KEY from .env at the project root.

Usage:
  .venv\\Scripts\\python brand-scraper/scripts/scrape_brand.py <url> [--fresh]

Flags:
  --fresh   bypass Firecrawl cache (maxAge=0). Slower but always live.
"""

import sys
import re
import json
import argparse
import requests
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

# ── 1. Paths ──────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).resolve().parent   # …/brand-scraper/scripts/
SKILL_DIR    = SCRIPT_DIR.parent                 # …/brand-scraper/
PROJECT_ROOT = SKILL_DIR.parent                  # …/mvp/
BRAND_DATA   = PROJECT_ROOT / "brand_data"       # …/mvp/brand_data/

# ── 2. .env loader ────────────────────────────────────────────────────────────

def load_env(path: Path) -> dict:
    env = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env_file = PROJECT_ROOT / ".env"
if not env_file.exists():
    env_file = SKILL_DIR / ".env"
env_vars = load_env(env_file)

# ── 3. Args ───────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Brand Extractor — Firecrawl + brand_data/ output")
parser.add_argument("url", help="Target website URL")
parser.add_argument("--fresh", action="store_true", help="Bypass Firecrawl cache")
args   = parser.parse_args()

target_url = args.url
api_key    = env_vars.get("FIRECRAWL_API_KEY", "")

if not api_key:
    print(f"Error: FIRECRAWL_API_KEY not set in {env_file}")
    sys.exit(1)

# ── 4. Derive brand slug from URL ─────────────────────────────────────────────

def url_to_slug(url: str) -> str:
    """https://www.bps.go.id/id  →  bps_go_id"""
    host = urlparse(url).hostname or url
    host = re.sub(r"^www\.", "", host)          # strip www.
    slug = re.sub(r"[^a-z0-9]", "_", host.lower())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug

slug       = url_to_slug(target_url)
SLUG_DIR   = BRAND_DATA / f"{slug}_images"     # images subfolder

print(f"Target : {target_url}")
print(f"Slug   : {slug}")
print(f"Output : {BRAND_DATA}/")

# ── 5. Firecrawl API call ─────────────────────────────────────────────────────
# Formats used:
#   branding  → color palette, fonts, components, assets (1 credit)
#   html      → raw HTML for {slug}_page.html (0 extra credit)
#   markdown  → page content for {slug}_content.md (0 extra credit)
#   screenshot→ full-page visual reference (1 credit)
# Total: ~2 credits per call

API_URL = "https://api.firecrawl.dev/v2/scrape"
payload = {
    "url":    target_url,
    "formats": ["branding", "html", "markdown", "screenshot"],
    "maxAge":  0 if args.fresh else 172800000,
}
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type":  "application/json",
}

print(f"Cache  : {'bypassed (--fresh)' if args.fresh else 'enabled (2-day window)'}")
print("Calling Firecrawl API...")

try:
    resp = requests.post(API_URL, json=payload, headers=headers, timeout=120)
    resp.raise_for_status()
except requests.exceptions.HTTPError as e:
    print(f"HTTP {e.response.status_code}: {e.response.text[:300]}")
    sys.exit(1)
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
    sys.exit(1)

data     = resp.json()
if not data.get("success"):
    print("Firecrawl error:", json.dumps(data, indent=2)[:400])
    sys.exit(1)

raw      = data.get("data", {})
branding = raw.get("branding") or {}
html     = raw.get("html", "")
markdown = raw.get("markdown", "")
screenshot = raw.get("screenshot")
metadata = raw.get("metadata", {})

# ── 6. Create output directories ──────────────────────────────────────────────

BRAND_DATA.mkdir(parents=True, exist_ok=True)
SLUG_DIR.mkdir(parents=True, exist_ok=True)

# ── 7. Helper ─────────────────────────────────────────────────────────────────

def get(obj, *keys, fallback="N/A"):
    for k in keys:
        if not isinstance(obj, dict):
            return fallback
        obj = obj.get(k)
        if obj is None:
            return fallback
    return obj if obj not in (None, "", []) else fallback

def download_image(url: str, dest: Path) -> bool:
    """Download an image to dest. Returns True on success."""
    if not url or url == "N/A":
        return False
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        dest.write_bytes(r.content)
        return True
    except Exception:
        return False

# ── 8. Extract brand fields ───────────────────────────────────────────────────

colors      = branding.get("colors") or {}
typo        = branding.get("typography") or {}
fonts_list  = branding.get("fonts") or []
spacing     = branding.get("spacing") or {}
components  = branding.get("components") or {}
images      = branding.get("images") or {}
personality = branding.get("personality") or {}

font_fam   = typo.get("fontFamilies") or {}
font_sizes = typo.get("fontSizes") or {}
font_wts   = typo.get("fontWeights") or {}

font_primary = font_fam.get("primary") or (fonts_list[0]["family"] if fonts_list else "N/A")
font_heading = font_fam.get("heading") or font_primary
font_code    = font_fam.get("code") or "monospace"

btn1 = components.get("buttonPrimary") or {}
btn2 = components.get("buttonSecondary") or {}

site_title   = metadata.get("title") or target_url
color_scheme = branding.get("colorScheme") or "N/A"
scraped_at   = datetime.now().strftime("%Y-%m-%d %H:%M")

logo_url    = images.get("logo") or metadata.get("ogImage") or "N/A"
favicon_url = images.get("favicon") or "N/A"
og_url      = images.get("ogImage") or metadata.get("ogImage") or "N/A"

# ── 9. Download images ────────────────────────────────────────────────────────

downloaded = []
assets = [
    ("logo",     logo_url,    SLUG_DIR / "logo.png"),
    ("favicon",  favicon_url, SLUG_DIR / "favicon.ico"),
    ("og_image", og_url,      SLUG_DIR / "og_image.png"),
]
for name, url, dest in assets:
    if download_image(url, dest):
        downloaded.append(name)
        print(f"Downloaded: {name} → {dest.name}")
    else:
        print(f"Skipped   : {name} (no URL or failed)")

# ── 10. Write {slug}_summary.json ────────────────────────────────────────────

summary = {
    "slug":         slug,
    "url":          target_url,
    "site_title":   site_title,
    "scraped_at":   scraped_at,
    "color_scheme": color_scheme,
    "colors": {
        "primary":        colors.get("primary", "N/A"),
        "secondary":      colors.get("secondary", "N/A"),
        "accent":         colors.get("accent", "N/A"),
        "background":     colors.get("background", "N/A"),
        "textPrimary":    colors.get("textPrimary", "N/A"),
        "textSecondary":  colors.get("textSecondary", "N/A"),
        "link":           colors.get("link", "N/A"),
        "success":        colors.get("success", "N/A"),
        "warning":        colors.get("warning", "N/A"),
        "error":          colors.get("error", "N/A"),
    },
    "typography": {
        "fontPrimary": font_primary,
        "fontHeading": font_heading,
        "fontCode":    font_code,
        "allFonts":    [f["family"] for f in fonts_list],
        "sizes":       font_sizes,
        "weights":     font_wts,
    },
    "spacing": {
        "baseUnit":    spacing.get("baseUnit", "N/A"),
        "borderRadius": spacing.get("borderRadius", "N/A"),
    },
    "components": {
        "buttonPrimary":   btn1,
        "buttonSecondary": btn2,
    },
    "assets": {
        "logo":       logo_url,
        "favicon":    favicon_url,
        "ogImage":    og_url,
        "screenshot": screenshot or "N/A",
        "downloaded": downloaded,
    },
    "personality": personality,
}

(BRAND_DATA / f"{slug}_summary.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
)
print(f"Written: {slug}_summary.json")

# ── 11. Write {slug}_content.md ───────────────────────────────────────────────

content_md = f"# Page Content: {site_title}\n\n> Source: {target_url}\n> Scraped: {scraped_at}\n\n---\n\n{markdown or '_No markdown content returned._'}\n"
(BRAND_DATA / f"{slug}_content.md").write_text(content_md, encoding="utf-8")
print(f"Written: {slug}_content.md")

# ── 12. Write {slug}_page.html ────────────────────────────────────────────────

(BRAND_DATA / f"{slug}_page.html").write_text(html or "<!-- No HTML returned -->", encoding="utf-8")
print(f"Written: {slug}_page.html")

# ── 13. Write {slug}_branding.md ─────────────────────────────────────────────

def color_row(label, hex_val):
    return f"| {label} | `{hex_val or 'N/A'}` |"

branding_md = f"""# Branding: {site_title}

> Source: {target_url} | Scraped: {scraped_at} | Scheme: {color_scheme}

## Colors

| Role | HEX |
|---|---|
{color_row("Primary", colors.get("primary"))}
{color_row("Secondary", colors.get("secondary"))}
{color_row("Accent", colors.get("accent"))}
{color_row("Background", colors.get("background"))}
{color_row("Text Primary", colors.get("textPrimary"))}
{color_row("Text Secondary", colors.get("textSecondary"))}
{color_row("Link", colors.get("link"))}
{color_row("Success", colors.get("success"))}
{color_row("Warning", colors.get("warning"))}
{color_row("Error", colors.get("error"))}

## Typography

| Role | Family |
|---|---|
| Primary / Body | `{font_primary}` |
| Heading | `{font_heading}` |
| Code | `{font_code}` |

All fonts: {", ".join(f['family'] for f in fonts_list) or "N/A"}

## Type Scale

| Element | Size | Weight |
|---|---|---|
| H1 | {font_sizes.get("h1", "N/A")} | {font_wts.get("bold", "N/A")} |
| H2 | {font_sizes.get("h2", "N/A")} | {font_wts.get("bold", "N/A")} |
| H3 | {font_sizes.get("h3", "N/A")} | {font_wts.get("medium", "N/A")} |
| Body | {font_sizes.get("body", "N/A")} | {font_wts.get("regular", "N/A")} |

## Buttons

**Primary**: bg `{btn1.get("background", "N/A")}` / text `{btn1.get("textColor", "N/A")}` / radius `{btn1.get("borderRadius", spacing.get("borderRadius", "N/A"))}`
**Secondary**: bg `{btn2.get("background", "N/A")}` / text `{btn2.get("textColor", "N/A")}` / border `{btn2.get("borderColor", "N/A")}`

## Assets

| Asset | URL |
|---|---|
| Logo | {logo_url} |
| Favicon | {favicon_url} |
| OG Image | {og_url} |
| Screenshot | {screenshot or "N/A"} |

## Personality

- Tone: {get(personality, "tone")}
- Energy: {get(personality, "energy")}
- Audience: {get(personality, "targetAudience")}
"""

(BRAND_DATA / f"{slug}_branding.md").write_text(branding_md, encoding="utf-8")
print(f"Written: {slug}_branding.md")

# ── 14. Write {slug}_brand_guidelines.md ─────────────────────────────────────

guidelines_md = f"""# Brand Guidelines: {site_title}

> Source: {target_url}
> Scraped: {scraped_at} | Color Scheme: {color_scheme}

---

## 🎨 Color Palette

| Token | HEX | Usage |
|---|---|---|
| `--color-primary` | `{colors.get("primary", "N/A")}` | Primary actions, header, key UI |
| `--color-secondary` | `{colors.get("secondary", "N/A")}` | Supporting elements |
| `--color-accent` | `{colors.get("accent", "N/A")}` | Highlights, badges |
| `--color-bg` | `{colors.get("background", "N/A")}` | Page background |
| `--color-text-primary` | `{colors.get("textPrimary", "N/A")}` | Body text |
| `--color-text-secondary` | `{colors.get("textSecondary", "N/A")}` | Captions, meta |
| `--color-link` | `{colors.get("link", "N/A")}` | Hyperlinks |
| `--color-success` | `{colors.get("success", "N/A")}` | Success states |
| `--color-warning` | `{colors.get("warning", "N/A")}` | Warnings |
| `--color-error` | `{colors.get("error", "N/A")}` | Errors, destructive |

---

## 🔤 Typography

**Fonts:** {", ".join(f['family'] for f in fonts_list) or "N/A"}

| Role | Family |
|---|---|
| Primary | `{font_primary}` |
| Heading | `{font_heading}` |
| Code | `{font_code}` |

---

## 🖼️ Visual Assets

| Asset | Path / URL |
|---|---|
| Logo | `{slug}_images/logo.png` → {logo_url} |
| Favicon | `{slug}_images/favicon.ico` → {favicon_url} |
| OG Image | `{slug}_images/og_image.png` → {og_url} |
| Screenshot | {screenshot or "N/A"} *(expires 24h)* |

---

## 🧩 UI Components

### Primary Button
```css
.btn-primary {{
  background-color: {btn1.get("background", colors.get("primary", "/* N/A */"))};
  color: {btn1.get("textColor", "#FFFFFF")};
  border-radius: {btn1.get("borderRadius", spacing.get("borderRadius", "6px"))};
}}
```

### Secondary Button
```css
.btn-secondary {{
  background-color: transparent;
  color: {btn2.get("textColor", colors.get("primary", "/* N/A */"))};
  border: 1.5px solid {btn2.get("borderColor", colors.get("primary", "/* N/A */"))};
}}
```

---

## 📐 Spacing

| Token | Value |
|---|---|
| Base unit | `{spacing.get("baseUnit", "N/A")}px` |
| Border radius | `{spacing.get("borderRadius", "N/A")}` |

---

## 🎭 Brand Personality

| Attribute | Value |
|---|---|
| Tone | {get(personality, "tone")} |
| Energy | {get(personality, "energy")} |
| Audience | {get(personality, "targetAudience")} |

---

## 📋 CSS Custom Properties

```css
:root {{
  /* Colors */
  --color-primary:          {colors.get("primary", "/* N/A */")};
  --color-secondary:        {colors.get("secondary", "/* N/A */")};
  --color-accent:           {colors.get("accent", "/* N/A */")};
  --color-bg:               {colors.get("background", "/* N/A */")};
  --color-text-primary:     {colors.get("textPrimary", "/* N/A */")};
  --color-text-secondary:   {colors.get("textSecondary", "/* N/A */")};
  --color-link:             {colors.get("link", "/* N/A */")};
  --color-success:          {colors.get("success", "/* N/A */")};
  --color-warning:          {colors.get("warning", "/* N/A */")};
  --color-error:            {colors.get("error", "/* N/A */")};

  /* Typography */
  --font-primary: '{font_primary}', sans-serif;
  --font-heading: '{font_heading}', sans-serif;
  --font-mono:    '{font_code}', monospace;

  /* Spacing */
  --space-base: {spacing.get("baseUnit", "8")}px;
  --radius-md:  {spacing.get("borderRadius", "6px")};
}}
```
"""

(BRAND_DATA / f"{slug}_brand_guidelines.md").write_text(guidelines_md, encoding="utf-8")
print(f"Written: {slug}_brand_guidelines.md")

# ── 15. Final summary ─────────────────────────────────────────────────────────

print(f"""
✅ Brand extracted: {site_title}
   Source       : {target_url}
   Slug         : {slug}
   Color scheme : {color_scheme}
   Primary color: {colors.get("primary", "N/A")}
   Heading font : {font_heading}
   Body font    : {font_primary}

📁 brand_data/
   ├── {slug}_summary.json
   ├── {slug}_branding.md
   ├── {slug}_brand_guidelines.md
   ├── {slug}_content.md
   ├── {slug}_page.html
   └── {slug}_images/ ({len(downloaded)} assets downloaded)

Next step: update brand-guidelines/SKILL_brandguidelines.md
""")
