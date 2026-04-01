# Brand Guidelines: Badan Pusat Statistik Indonesia

> **Source**: https://www.bps.go.id/id
> **Scraped**: 2026-04-02 | **Color Scheme**: Light (white body, deep navy header)
> **Method**: Browser DOM inspection (Firecrawl blocked by site)

---

## 🎨 Color Palette

| Token | HEX | Usage |
|---|---|---|
| `--color-primary` | `#003B73` | Header bg, primary buttons, footer, nav active border |
| `--color-secondary` | `#0096D9` | Notification bar, info elements, links |
| `--color-accent-green` | `#7ABF3C` | Star/bookmark FAB, success states, category tags |
| `--color-accent-orange` | `#F39200` | Scroll-to-top FAB, highlighted nav items |
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-surface` | `#F5F7FA` | Card / panel background |
| `--color-border` | `#E0E4EA` | Dividers, card borders, input strokes |
| `--color-text-primary` | `#333333` | Body text |
| `--color-text-on-dark` | `#FFFFFF` | Text on navy/dark backgrounds |
| `--color-text-secondary` | `#666666` | Captions, dates, meta |
| `--color-link` | `#0096D9` | Hyperlinks |
| `--color-success` | `#7ABF3C` | Success / positive states |
| `--color-warning` | `#F39200` | Warning states |
| `--color-error` | `#DC3545` | Error / destructive states |

---

## 🔤 Typography

**Font Import (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono&display=swap" rel="stylesheet">
```

| Role | Family | Fallback |
|---|---|---|
| Primary / Body | `Inter` | `sans-serif` |
| Heading / Display | `Inter` | `sans-serif` |
| Code / Monospace | `Roboto Mono` | `monospace` |

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| H1 | `36px` | `700` | `1.2` | Hero headings, page titles |
| H2 | `28px` | `700` | `1.3` | Section headings |
| H3 | `22px` | `600` | `1.35` | Card / sub-section titles |
| H4 | `18px` | `600` | `1.4` | Labels, small headers |
| Body | `16px` | `400` | `1.6` | Paragraph text |
| Small | `14px` | `400` | `1.5` | Captions, dates, meta |
| Nav | `16px` | `500` | `1` | Navigation items |

---

## 🖼️ Visual Assets

| Asset | Local Path | Source URL |
|---|---|---|
| Logo | `bps_go_id_images/logo.png` | https://www.bps.go.id/assets/logo-bps.png |
| Favicon | `bps_go_id_images/favicon.ico` | https://www.bps.go.id/favicon.ico |
| OG Image | `bps_go_id_images/og_image.png` | https://www.bps.go.id/images/og-image.jpg |
| Hero API | N/A (dynamic) | https://web-api.bps.go.id/cover.php |

---

## 🧩 UI Components

### Header / Navbar
```css
.navbar {
  background-color: #003B73;
  color: #FFFFFF;
  height: 70px;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.navbar a { color: #FFFFFF; font-weight: 500; text-decoration: none; }
.navbar a.active { border-bottom: 3px solid #0096D9; }
```

### Notification Bar
```css
.notification-bar {
  background-color: #0096D9;
  color: #FFFFFF;
  padding: 12px 24px;
  font-size: 14px;
}
```

### Primary Button
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
  cursor: pointer;
  transition: background-color 150ms ease;
}
.btn-primary:hover { background-color: #002a56; }
```

### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: #003B73;
  border: 1.5px solid #003B73;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 150ms ease;
}
.btn-secondary:hover { background-color: #003B73; color: #FFFFFF; }
```

### Card / Surface
```css
.card {
  background-color: #F5F7FA;
  border: 1px solid #E0E4EA;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
```

### FAB (Floating Action Button)
```css
.fab-green  { background-color: #7ABF3C; color: #FFFFFF; border-radius: 50%; }
.fab-orange { background-color: #F39200; color: #FFFFFF; border-radius: 50%; }
```

---

## 📐 Spacing & Layout

| Token | Value | Note |
|---|---|---|
| `--space-base` | `8px` | Base unit |
| `--space-xs` | `4px` | Tight internal padding |
| `--space-sm` | `8px` | Compact spacing |
| `--space-md` | `16px` | Default gap |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `48px` | Large section spacing |
| `--space-2xl` | `80px` | Full-page section gaps |
| `--radius-sm` | `4px` | Tags, badges |
| `--radius-md` | `6px` | Buttons, inputs |
| `--radius-lg` | `12px` | Cards, modals |
| Container max-width | `1280px` | — |
| Nav height | `70px` | — |

---

## 🎭 Brand Personality

| Attribute | Value |
|---|---|
| Tone | Formal, authoritative, informative |
| Energy | Calm, structured, data-driven |
| Target Audience | Government officials, researchers, public, journalists |
| Visual Character | Institutional trust — navy blue dominant, clean whitespace |

---

## 📋 CSS Custom Properties (Design Tokens)

```css
:root {
  /* ── Colors ─────────────────────────────────────────── */
  --color-primary:          #003B73;
  --color-secondary:        #0096D9;
  --color-accent-green:     #7ABF3C;
  --color-accent-orange:    #F39200;
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

  /* ── Typography ──────────────────────────────────────── */
  --font-primary: 'Inter', sans-serif;
  --font-heading: 'Inter', sans-serif;
  --font-mono:    'Roboto Mono', monospace;

  /* ── Spacing ─────────────────────────────────────────── */
  --space-base: 8px;
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   48px;
  --space-2xl:  80px;

  /* ── Border Radius ───────────────────────────────────── */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   12px;
  --radius-full: 9999px;

  /* ── Transitions ─────────────────────────────────────── */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```
