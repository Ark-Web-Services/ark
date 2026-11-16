---
name: ARK Web Services
description: Practical, readable web services presented in a grounded forest, warm-paper, clay, and sage palette.
colors:
  forest: "#163d36"
  paper: "#f3ede2"
  clay: "#bd4e2f"
  sage: "#d9e6dd"
  ink: "#202a26"
  on-forest: "#e0eae3"
  on-accent: "#ffffff"
  muted: "#435b52"
  rule: "color-mix(in srgb, #163d36 24%, #f3ede2)"
typography:
  display:
    fontFamily: "Pliant, sans-serif"
    fontSize: "clamp(3rem, 6.47vw, 5.75rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pliant, sans-serif"
    fontSize: "clamp(2.125rem, 4.5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Pliant, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  showcase: "12px"
  action: "6px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "clamp(56px, 7vw, 96px)"
components:
  button-primary:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.action}"
    padding: "0.8rem 1.75rem"
    height: "3.5rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "0.75rem"
    height: "3rem"
---

# Design System: ARK Web Services

## Overview

**Creative North Star: “The Practical Studio”**

ARK’s service-business site uses a grounded, direct visual language: forest provides structure, warm paper keeps long-form reading comfortable, and clay marks the key action. Humanist sans typography, broad color fields, and spacious service groupings make the work feel capable and approachable. The chosen Practical Studio direction is expressed in the homepage’s real owned-product showcase and service passages; that composition belongs to the homepage, while the color, type, and interaction language carry across the business site.

The site favors clear contact paths and truthful work context. The Overflow Sites image is labeled as a related owned product, with its handoff graphic identified as illustrative rather than a client result. Article and tool pages inherit the same palette and font roles while using their own reading and utility layouts.

**Key Characteristics:**
- Forest, warm paper, clay, sage, and readable ink define the active palette.
- Pliant 700 headings pair with Manrope variable body text (400–700); both are self-hosted under OFL.
- Rounded showcase and reading surfaces sit beside compact, tactile actions.
- Genuine ownership context and verified publication approvals govern any proof content.

## Colors

The palette balances a deep green structure with warm light surfaces, a focused clay action color, and pale sage passages.

### Primary
- **Forest:** The main structural color for the header wordmark, dark resource and contact regions, footer, and article headings.
- **Clay:** Reserved for the primary review action, service markers, focus indication, selection, and link hover.

### Secondary
- **Pale sage:** A broad service-section surface and a quiet supporting tone for process markers and selected menu state.

### Neutral
- **Warm paper:** The default page surface and a light foreground against forest.
- **Ink:** Body and supporting text on light surfaces.
- **On-forest:** Supporting copy and links on forest surfaces.
- **On-accent:** White text on the clay primary action, preserving readable button contrast.
- **Muted green:** Supporting copy on light backgrounds.
- **Rule:** A low-contrast forest-to-paper mix used for separators and boundaries.

**The Contextual Contrast Rule.** Use the light-on-forest and white-on-clay text colors only on their matching dark and action backgrounds; retain ink or muted green for copy on paper and sage.

## Typography

**Display Font:** Pliant (sans-serif fallback; local 700 face)
**Body Font:** Manrope (sans-serif fallback; local variable 400–700 face)

**Character:** Pliant gives headings a broad, sturdy humanist voice. Manrope carries the denser explanatory copy with open line spacing. The older Montserrat Alternates font-face declarations remain in the stylesheet, but the active business configuration and font preloads use Pliant and Manrope.

### Hierarchy
- **Display** (700, `clamp(3rem, 6.47vw, 5.75rem)`, 0.94): The wide homepage opening heading; it tightens at smaller widths.
- **Headline** (700, `clamp(2.125rem, 4.5vw, 3.5rem)`, 1.08): Shared business page, article, and tool headings.
- **Title** (700, `clamp(2rem, 4vw, 3.5rem)`, 1.05): Homepage section titles, with narrower-screen overrides where needed.
- **Body** (400, `1rem`, 1.65): Default explanatory copy; content commonly keeps paragraphs within roughly 55–65ch.
- **Label** (700, `.9rem`, 1.25): Compact navigation and control labels.

## Layout

The homepage uses a centered shell at 80rem wide, normally 85.2% of the viewport, with 1.25rem side gutters at widths up to 600px. Its desktop header is 68px high and its compact header is 72px; inner pages keep the shared layout’s base header sizing. The opening places its large heading and supporting offer side by side, then the action and reassurance before the owned-product image crosses into a forest field. At 1100px the service overview simplifies; at 850px navigation changes to a native disclosure and major two-column passages stack; at 600px the homepage becomes a single-column flow with full-width review action and a top-cropped showcase. The opening receives extra top space from 1600px upward.

Homepage sections alternate paper, sage, and forest fields with generous vertical spacing (commonly `clamp(3.5rem, 7vw, 6rem)` for process, resources, FAQ, and contact). Service rows and lists use separators instead of a grid of elevated cards. Business articles inherit the font and color system but sit in a centered 52rem reading column; the article index uses a 90rem maximum container and changes to one column at 650px. Inner pages, tools, and articles retain their own content layouts while using the shared business header, footer, colors, focus treatment, and type roles.

## Elevation & Depth

The system is flat at rest. Large color fields, image scale, and fine rules establish hierarchy; the homepage showcase is framed by its forest field rather than a floating card. The compact navigation disclosure alone uses a soft shadow (`0 12px 24px rgb(22 61 54 / 12%)`) to separate the open menu from the page. The showcase image enters with a short upward reveal (0.5s, `cubic-bezier(.16, 1, .3, 1)`); the reveal is omitted when reduced motion is requested.

**The Quiet Depth Rule.** Keep shadows limited to the open compact navigation; use color, spacing, image scale, and borders for the rest of the hierarchy.

## Shapes

Showcase imagery, caption panels, article cards, callouts, and the contents panel use gently rounded corners (12px). Actions and compact menu controls use tighter corners (6px). Hairline rules and borders separate content without enclosing every service in a card. The service path marker is a narrow 1px clay bar; the numbered process markers are circular. Keyboard focus keeps a distinct 3px outline with a 4px offset and a small 2px corner.

## Components

### Buttons
- **Primary:** The site-review link uses a clay fill, white text, 6px corners, and a 56px minimum height. The homepage action has 1.75rem horizontal padding; it fills the available width on small screens.
- **Hover / Focus:** Primary actions shift to forest on hover. Keyboard focus uses the visible clay outline; dark regions switch the outline to sage for contrast.
- **Text links:** Service and resource links remain typographic, use arrows as directional cues, and have 44px minimum targets where they serve as repeated navigation.

### Cards / Containers
- **Homepage showcase:** A linked, cover-cropped real Overflow Sites image with a 12px corner and attached paper caption. Caption it as a related owned product and identify its illustrative handoff graphic as not a client result.
- **Service paths:** Open columns on sage, separated with a thin clay side marker. Keep their descriptions as text rather than putting each path in a card.
- **Article cards / callouts / contents:** Rounded 12px and a pale paper–sage mixed surface, with restrained borders and no resting shadow. Contents links and toggle have 44px minimum height.

### Inputs / Fields
- **Style:** Existing generic inquiry fields use transparent surfaces, a fine mixed-ink border, compact 6px corners, and a 48px minimum height.
- **Focus:** Retain the visible 3px outline and 4px offset.
- **Availability:** The inquiry form remains disabled in this configuration. The contact section provides direct email and phone fallback; do not show a successful-submission state until delivery is operational.

### Navigation
- **Homepage desktop:** A compact 68px paper header with the ARK wordmark at left and plain text links at right. The current page receives a fine clay underline; inner page templates retain the shared header sizing.
- **Compact:** At 850px and below, use the existing native `details`/`summary` menu. Its summary and links keep a 44px target; the open menu uses paper, a fine rule, 12px corners, and the single permitted shadow.
- **Footer:** Forest field with paper brand text, on-forest supporting copy, and direct contact links.

### FAQ Disclosure
- Native disclosure rows use fine rules, clear question weight, and open copy in a readable column. Keep the summary target at least 44px high.

### Article Reading Surface
- Business articles inherit the Practical Studio colors and typography in a centered 52rem reading column. The table of contents and callouts use a rounded pale mixed surface; maintain comfortable link targets and body measure.

## Do's and Don'ts

### Do:
- **Do** preserve the palette and active Pliant/Manrope pairing from `business.config.ts` and the local OFL font files.
- **Do** keep the showcase ownership caption and the explicit note that the handoff graphic is illustrative, not a client result.
- **Do** preserve visible keyboard focus, the 44px targets used by homepage navigation, compact-menu links, and footer links, and reduced-motion behavior.
- **Do** keep articles within the shared visual system while preserving their narrower reading layout.
- **Do** use direct email and phone fallback while inquiry delivery is disabled.
- **Do** publish client quotes and portraits only when their respective approval flags allow them.

### Don't:
- **Don't** present the owned-product image as client work or imply outcomes, rankings, leads, prices, or timelines without approved evidence.
- **Don't** enable inquiry capture before its storage, verification, and email delivery dependencies are ready.
- **Don't** send names, email addresses, or message contents to analytics; GA4 remains gated on explicit acceptance.
- **Don't** replace the broad grounded palette with the showcased product's unrelated lime colors.
