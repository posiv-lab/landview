
# Gangnamunni Design System

강남언니 (Gangnamunni) is the flagship consumer brand of **힐링페이퍼 (Healingpaper)**, a Korean medtech
company founded in July 2012 by 홍승일 (Hong Seung-il). It is a cosmetic-surgery / dermatology
discovery platform — hospital and doctor search, reviews, price transparency, booking — serving
Korea, Japan, Thailand and other markets (the overseas-only arm is branded **Unni**). The company
crossed pre-unicorn status by 2021 and closed a ₩428억 Series D in Feb 2025.

The brand runs **two named design systems**, per its own engineering blog:
- **Cell** — mobile-first (iOS / Android / mobile web). This is the consumer-facing system and what
  this project reproduces. Token prefix on the live site: `--cell-base-*`, `--cell-semantic-*`.
- **Welchis** — the PC back-office system used by partner clinics (Welchis Design + Welchis UI,
  Figma + Storybook handoff). Not reproduced here — no source material was provided for it beyond
  the narrative description.

## Sources

This system was built entirely from a structured brand brief (OmD-format prose notes) pasted into
this project — **no Figma file, codebase, or screenshot set was attached.** Everything here is
**prose-derived**: colors, type sizes, component specs and copy voice were transcribed from that
document, not measured from live DOM/CSS. Tier-1 sources cited in the brief:
- https://www.gangnamunni.com/ (live DOM inspection cited in the brief, 2026-05-13)
- production CSS bundle (`d246c5b2edcb00b6.css`) cited as the origin of the `--cell-base-*` /
  `--cell-semantic-*` token map
- https://blog.gangnamunni.com/post/welchis/ (Cell + Welchis architecture)
- funding/company facts: Hankook Ilbo, TheVC, Rocketpunch (see brief §11)

**No logo file was provided.** The brief only references a favicon-service URL
(`google.com/s2/favicons?domain=gangnamunni.com`), which this environment cannot fetch as a binary
asset, and which is a low-res favicon proxy, not a brand mark. Per design-system policy, **no logo
was created or approximated.** Anywhere a wordmark would go, the brand name renders in plain type
(Pretendard, weight 700). If you have the real logo (SVG/PNG), attach it and it will be dropped into
`assets/` and wired into the header/footer.

**Font substitution note:** no Pretendard font files were attached. Pretendard JP Variable is loaded
from its author's own public CDN distribution (jsDelivr — `orioncactus/pretendard`), which is the
real typeface, not a fallback. If jsDelivr is unreachable in your environment, the stack falls back
to system sans fonts — ask the team for the licensed `.woff2` files if you'd rather self-host.

## Index

- `styles.css` — root stylesheet, `@import`s everything below. Link this one file.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css` (also holds radius/shadow/motion), `fonts.css`
- `guidelines/` — specimen cards for the Design System tab (colors, type, spacing, radius, shadow, motion)
- `components/` — reusable primitives: `forms/` (Button, Input), `data/` (Table, Card, Badge), `navigation/` (Tabs), `feedback/` (Dialog)
- `ui_kits/consumer-web/` — click-through recreation of the consumer web/app surface (home search → hospital list → hospital detail → booking confirmation)
- `assets/` — brand imagery (currently empty — see logo note above)
- `SKILL.md` — Claude Code / Agent Skills-compatible entry point

## Content fundamentals

**Voice:** the careful clinician who's on your side — informational first, reassuring second, never
sales-y. Korean is the primary voice (English/Japanese/Thai are translations of it, not parallel
targets). Sentences end with `.`; CTA buttons don't. No emoji anywhere on product surfaces.

- **Exact numerals over rounding.** `350,000원` not `약 35만원`. `0.4km` not `근거리`. `후기 7,300건`
  not `후기 많음`. Ranges show both endpoints: `300,000 – 450,000원`.
- **CTAs are imperative + concrete object, no exclamation marks.** `병원 예약하기`, `후기 작성하기`,
  `쿠폰 받기`. Never `지금 시작하기!`.
- **Errors are specific and blameless**, never generic. `이메일 형식을 확인해주세요.` not
  `오류가 발생했습니다.`
- **Card titles read like factual indexes, not beauty-media hooks.** `종아리 보톡스 맞으면 발목
  두꺼워져? 효과·부작용·용량·주기` — question + mid-dot list of exactly what's covered.
- **Regulatory disclosure is a design element, not a footnote.** `의료광고 사전심의필` and
  `보건복지부 지침` callouts are typeset with the same care as any UI label, always visible near
  the action they qualify — never buried in a sub-modal.
- **Forbidden:** `예뻐지세요!`, exclamation-marked CTAs, rounded pricing, generic error copy,
  cosmetic-only framing of surgery, sales-hype ("초특가", "100만원 할인!!") outside flagged hot-deal
  badges.

## Visual foundations

- **One brand hue.** Orange `#d54300` (semantic strong) / `#f66336` (regular) / raw accent `#ff540f`
  for time-limited flags. No second brand hue, ever. Status colors (green/red/yellow/blue) are
  strictly semantic and never substitute for brand.
- **Bluegray neutrals, not gray.** Every neutral — border, caption, body, heading — comes from a
  cool bluegray 9-step ramp (`#131517` → `#f7f9fa`). No warm gray, no pure black text (`#000` is
  reserved for text overlaid directly on rich media/photos).
  Vibe: clinical-warm — white canvas, cool neutrals, one warm accent doing all the brand signaling.
- **Type: Pretendard JP Variable everywhere**, weights 400–700 on-product (300 exists in the ramp
  but isn't used for headlines — no display-light experiments, no negative letter-spacing). Numbers
  (prices, review counts, distances) are always bolder (700) than surrounding text — that weight
  contrast is the primary way information gets highlighted.
- **Elevation = hairline borders + tinted surfaces, not shadows.** Resting cards, inputs, and
  headers use a 1px `#d8dfe6` border. Section breaks use `bluegray-50`/`bluegray-100` or
  `orange-50` washes. Drop shadows (`--shadow-soft`, `--shadow-modal`) appear only on things that
  literally float — popovers, bottom sheets, modals — never on resting cards. This is the system's
  strictest rule.
- **Backgrounds:** flat white canvas, no gradients, no textures, no illustrations, no hand-drawn
  motifs. The one heavy structural element in the whole system is the footer's `4px solid #d6d6d6`
  top divider on a `#f5f5f5` band — used exactly once, as the strongest "you've reached the bottom"
  signal in the layout.
- **Corner radii:** 4px micro (badges/tags) → 12px workhorse (cards, inputs) → 16px default chrome
  (buttons, pills, sign-in CTA — this is the one to reach for by default) → 20–24px large sheets →
  `9999px` full (search bars, avatars, icon buttons, category pills).
  Radii are never mixed within one component family — chrome takes 16px, cards/inputs take 12px.
- **Cards:** white or tinted background, 1px hairline border (or none on grid layouts where the
  page's bluegray-50 wash already separates them), 12px radius, 16px padding, **zero shadow**. Hover
  = background tints to bluegray-50, no shadow or scale change.
- **Hover states:** background tint shift (white → bluegray-50 or orange-50), never a darken/lighten
  overlay on the same hue, never scale. **Press states:** slightly deeper tint/shade of the same
  token (e.g. orange-500 → orange-600 → orange-700 pressed) — no shrink/scale on press.
  **Disabled:** background collapses to a fixed pale token (`orange-200` for brand CTAs,
  `bluegray-400` text / `bluegray-150` border for outline buttons) — geometry never changes.
- **Motion:** no spring, no bounce, no overshoot, anywhere — deliberately, to avoid a "consumer-app
  delight" register in a medical context. Standard durations 150/250/350ms with `ease-enter` for
  things arriving (sheets, toasts, success states), `ease-exit` for dismissals, `ease-standard` for
  two-way transitions (tabs, accordions). `prefers-reduced-motion` collapses everything to instant.
- **Transparency/blur:** used only for modal backdrops (60% black scrim) and the mobile bottom-nav
  translucency on native iOS — not used decoratively elsewhere.
- **Imagery color vibe:** not specified by source beyond "no illustrations, icon-grid-driven home" —
  UI kit uses neutral gray image placeholders rather than invented photography.

## Iconography

The source brief doesn't enumerate a specific icon library or ship any icon assets, and explicitly
warns against replacing category icons with stock photography. No SVG/icon-font files were provided
to copy. Per policy, this system does **not** invent brand icons. The UI kit and components use
plain geometric placeholder shapes (circles/squares) wherever the live product would show a category
or action icon, clearly distinguishable as placeholders — swap in the brand's real icon set when
available. No emoji is used anywhere, per brand policy.

## Intentional additions

None of the seven components listed in the brief's "Included Components" needed an unlisted sibling.
`Table` is included because the brief lists it explicitly (used for structured medical/price data),
even though no table styling was given in the component-stylings section — its styling was inferred
conservatively from the hairline-border-and-bluegray system used everywhere else, and should be
treated as lower-confidence than the other six.
