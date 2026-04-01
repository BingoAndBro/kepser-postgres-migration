---
name: brand-guidelines
description: Living reference document containing extracted brand guidelines from websites scraped by the brand-scraper skill. Consult this skill whenever you need brand colors, typography, UI component styles, or visual assets for a website you are building. Use it when the user says things like "use the brand we scraped", "apply those colors", "what were the fonts from X?", or when building any UI that should match a previously extracted brand. Each scraped brand has its own section. The CSS Custom Properties block at the bottom always reflects the most recently active brand.
---

# Brand Guidelines Reference

> This file is automatically updated by the **brand-scraper** skill.
> Run `python brand-scraper/scripts/scrape_brand.py <url>` and the agent will populate the relevant section below.
>
> **How to use:** Reference the section matching your target brand. Copy the CSS Custom Properties block into your project's `index.css` as the design token foundation.

---

## BPS (Badan Pusat Statistik) — https://www.bps.go.id/id

> Scraped: 2026-04-02 | Color scheme: **Light** (white body, deep navy header)
> Site title: Badan Pusat Statistik Indonesia
> Brand personality: Professional, Institutional, Data-driven, Modern

### 🎨 Colors

| Token | HEX | Role |
|---|---|---|
| `--color-primary` | `#003B73` | Deep institutional navy — header, primary buttons, footer bg |
| `--color-secondary` | `#0096D9` | Bright cyan-blue — notification bars, sub-headers, links |
| `--color-accent-green` | `#7ABF3C` | BPS Green — interactive star/bookmark button, success states |
| `--color-accent-orange` | `#F39200` | BPS Orange — scroll-to-top FAB, navigational highlights |
| `--color-bg` | `#FFFFFF` | Main page background |
| `--color-surface` | `#F5F7FA` | Card / panel surfaces |
| `--color-border` | `#E0E4EA` | Dividers, card borders |
| `--color-text-primary` | `#333333` | Body text, dark content areas |
| `--color-text-on-dark` | `#FFFFFF` | Text on navy/dark backgrounds (header, footer) |
| `--color-text-secondary` | `#666666` | Captions, meta, secondary labels |
| `--color-link` | `#0096D9` | Hyperlinks |

### 🔤 Typography

| Role | Family | Fallback |
|---|---|---|
| Primary / Body | `Inter` | `sans-serif` |
| Heading | `Inter` | `sans-serif` |
| Code / Data | `Roboto Mono` | `monospace` |

**All fonts detected:** Inter, sans-serif

#### Type Scale

| Element | Size | Weight | Usage |
|---|---|---|---|
| H1 | `36px` | `700` | Page hero titles |
| H2 | `28px` | `700` | Section headings |
| H3 | `22px` | `600` | Card / sub-section headings |
| Body | `16px` | `400` | Paragraph text |
| Small | `14px` | `400` | Captions, dates, meta |
| Nav | `16px` | `500` | Navigation links |

### 🖼️ Visual Assets

| Asset | URL | Notes |
|---|---|---|
| Logo (header) | `https://www.bps.go.id/assets/logo-bps.png` | Blue + multi-color BPS symbol + wordmark |
| Hero/Cover API | `https://web-api.bps.go.id/cover.php` | Dynamic contextual background |
| Favicon | `https://www.bps.go.id/favicon.ico` | BPS icon |

> ⚠️ Screenshot expired (24h Firecrawl limit) — see `brand-scraper/output/` for local copy if run fresh.

### 🧩 UI Components

#### Primary Button
```css
.btn-primary {
  background-color: #003B73;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
}
.btn-primary:hover {
  background-color: #002a56; /* darken 15% */
}
```

#### Secondary / Outline Button
```css
.btn-secondary {
  background-color: transparent;
  color: #003B73;
  border: 1.5px solid #003B73;
  border-radius: 6px;
  padding: 10px 20px;
}
.btn-secondary:hover {
  background-color: #003B73;
  color: #FFFFFF;
}
```

#### Notification / Info Bar
```css
.notification-bar {
  background-color: #0096D9;
  color: #FFFFFF;
  padding: 12px 20px;
  font-size: 14px;
}
```

#### Nav / Header
```css
.navbar {
  background-color: #003B73;
  color: #FFFFFF;
  height: 70px;
  padding: 0 24px;
}
.navbar a {
  color: #FFFFFF;
  font-weight: 500;
}
.navbar a.active {
  border-bottom: 3px solid #0096D9;
}
```

### 📐 Spacing & Layout

| Property | Value |
|---|---|
| Base spacing unit | `8px` |
| Default border radius | `6px` |
| Container max-width | `1280px` |
| Nav height | `~70px` |
| Section padding | `48px 0` |

### 🎭 Brand Personality

| Attribute | Value |
|---|---|
| Tone | Formal, authoritative, informative |
| Energy | Calm, structured, data-driven |
| Target audience | Government officials, researchers, public, media |
| Visual character | Institutional trust — navy blue dominant, clean whitespace, minimal decoration |

---

## 🎨 Active Brand: CSS Custom Properties

> **Currently active: BPS — Badan Pusat Statistik Indonesia**
> Copy this block into your `index.css` to apply the BPS brand as design tokens.

```css
:root {
  /* ── Colors ────────────────────────────────────────────── */
  --color-primary:          #003B73;  /* Deep institutional navy */
  --color-secondary:        #0096D9;  /* Bright cyan-blue */
  --color-accent-green:     #7ABF3C;  /* BPS Green */
  --color-accent-orange:    #F39200;  /* BPS Orange */
  --color-bg:               #FFFFFF;
  --color-surface:          #F5F7FA;
  --color-border:           #E0E4EA;
  --color-text-primary:     #333333;
  --color-text-on-dark:     #FFFFFF;
  --color-text-secondary:   #666666;
  --color-link:             #0096D9;
  --color-success:          #7ABF3C;
  --color-warning:          #F39200;
  --color-error:            #DC3545;

  /* ── Typography ─────────────────────────────────────────── */
  --font-primary: 'Inter', sans-serif;
  --font-heading: 'Inter', sans-serif;
  --font-mono:    'Roboto Mono', monospace;

  /* ── Spacing ────────────────────────────────────────────── */
  --space-base: 8px;
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   48px;
  --space-2xl:  80px;

  /* ── Border Radius ──────────────────────────────────────── */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   12px;
  --radius-full: 9999px;

  /* ── Transitions ────────────────────────────────────────── */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```

---

## 📋 Brand Sections Format Reference

> When the agent populates a new brand section, it follows this structure:

```
## [Brand Name] — [URL]
> Scraped: YYYY-MM-DD | Color scheme: light | dark

### 🎨 Colors         → table of token + HEX + role
### 🔤 Typography     → font families + type scale table
### 🖼️ Visual Assets  → logo, favicon, hero URLs
### 🧩 UI Components  → CSS snippets for buttons, nav, cards
### 📐 Spacing        → base unit, border radius, container width
### 🎭 Personality    → tone, energy, audience
```
