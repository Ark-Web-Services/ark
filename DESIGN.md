---
name: ARK Web Services
description: A clear service-business site in a grounded forest, warm-paper, clay, and sage palette.
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
    fontSize: "clamp(2.125rem, 4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.025em"
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
  reading-panel: "12px"
  action: "6px"
  square: "0px"
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
    rounded: "{rounded.square}"
    padding: "0.75rem"
    height: "3rem"
---

# Design System: ARK Web Services

## Overview

**Creative North Star: “The Practical Studio”**

ARK’s service-business site uses a grounded, direct visual language: forest carries the identity, warm paper supports reading, clay marks the primary action, and sage adds a quiet counterpoint. Pliant headings and Manrope body text keep the tone capable and human. The homepage moves from a concise offer and one clear review action straight into ARK’s own forest service band, making the services themselves the visual focus.

The page guides visitors from service choice to process, planning tools, answers, and direct contact. The same palette, typography, and accessibility treatment carry across service, article, and tool pages, with each page keeping its useful reading or utility layout. Client proof appears only when its configured publication and image approvals permit it.

**Key Characteristics:**
- Forest, warm paper, clay, sage, and readable ink define the active palette.
- Pliant 700 headings pair with Manrope variable body text (400–700); both are self-hosted under OFL.
- A broad native ARK service band follows the primary review action.
- Flat utility surfaces and distinct reading panels keep navigation and content easy to scan.

## Colors

The palette balances a deep green identity with warm light surfaces, one focused clay action color, and pale sage accents.

### Primary
- **Forest:** The identity color for the homepage service band, header wordmark, resources, contact area, footer, and article emphasis.
- **Clay:** The review action, focus outline, selected text, caret, and link hover color.

### Secondary
- **Pale sage:** Supporting color for process markers and the compact menu’s open state; it also softens reading-panel surfaces.

### Neutral
- **Warm paper:** The default page surface and light text on forest.
- **Ink:** Main copy and headings on light backgrounds.
- **On-forest:** Supporting copy over the forest service and resource bands.
- **On-accent:** White text on the clay review action.
- **Muted green:** Supporting copy on light surfaces.
- **Rule:** A subtle forest-to-paper mix for separators and field borders.

**The Contextual Contrast Rule.** Use on-forest text on forest sections and white on the clay action; use ink or muted green for copy on paper and sage.

## Typography

**Display Font:** Pliant (sans-serif fallback; local 700 face)
**Body Font:** Manrope (sans-serif fallback; local variable 400–700 face)

**Character:** Pliant gives headings a broad, sturdy humanist voice. Manrope carries explanatory copy with open line spacing. The older Montserrat Alternates font-face declarations remain in the stylesheet, but the active business configuration and font preloads use Pliant and Manrope.

### Hierarchy
- **Display** (700, `clamp(3rem, 6.47vw, 5.75rem)`, 0.94): The homepage heading; it tightens at smaller widths.
- **Headline** (600, `clamp(2.125rem, 4vw, 3.25rem)`, 1.14): Shared article and business page titles.
- **Title** (700, `clamp(2rem, 4vw, 3.5rem)`, 1.05): Homepage section titles and prominent passage headings.
- **Body** (400, `1rem`, 1.65): Standard copy; descriptions commonly stay within roughly 55–65ch.
- **Label** (700, `.9rem`, 1.25): Navigation and compact control labels.

## Layout

The homepage uses a centered 80rem shell, normally 85.2% of the viewport, with 1.25rem side gutters at widths up to 600px. Its paper header is 68px high on desktop and 72px in the compact layout. At desktop widths, the hero places the headline beside a concise offer and location; the clay review action and scope reassurance follow below. The forest service band begins directly after the hero, with three service paths and a separated SEO foundations row. The process section places its link to `/process/` beside the review, scope, and build steps.

At 1100px the service heading moves above its service columns; at 850px the desktop navigation gives way to the native disclosure menu; at 600px the homepage becomes a single-column flow and the main action fills the available width. The opening receives extra top space from 1600px upward. Process, tools, FAQ, and contact sections use generous vertical spacing and stack at narrower widths. Business articles keep a centered 52rem reading column; the article index uses a 90rem maximum container and changes to one column at 650px. Business, article, and tool pages inherit the shared palette, type roles, header, footer, and focus style.

## Elevation & Depth

The site is flat at rest. Broad forest and paper regions, spacing, and fine rules establish hierarchy. The open compact navigation uses the single soft shadow (`0 12px 24px rgb(22 61 54 / 12%)`) to separate it from page content. Buttons transition their colors over `.2s`; reduced-motion settings disable smooth scrolling and shorten transitions and animations.

**The Quiet Depth Rule.** Keep shadows limited to the open compact navigation; use color, spacing, and rules for the rest of the hierarchy.

## Shapes

Actions and compact menu controls use gently rounded corners (6px). Article cards, callouts, and the contents panel use 12px corners; generic utility cards, form fields, and filters remain square. The forest service band uses open columns rather than individual cards. Its path marker is a fine sage line (1px). Keyboard focus uses a visible 3px outline with a 4px offset and small corner radius.

## Components

### Buttons
- **Primary:** The homepage review link is the one primary action: clay fill, white text, 6px corners, and a 56px minimum height. It uses 1.75rem horizontal padding on the homepage and fills the available width on narrow screens.
- **Hover / Focus:** The action shifts to forest on hover. Keyboard focus stays visible with a clay outline; dark sections use sage focus indication.
- **Text links:** Service paths, the SEO foundation row, resource links, and the `/process/` link remain typographic and use arrows as directional cues where shown.

### Cards / Containers
- **Service band:** One broad forest region directly below the hero. It contains ARK’s three primary service paths, with the SEO foundations link in a separated row.
- **Service paths:** Open columns with paper headings, on-forest descriptions, and a narrow sage marker.
- **Reading panels:** Generic editorial cards stay square and flat. Article cards, callouts, and the contents panel use a pale paper–sage surface, 12px corners, and restrained borders.

### Inputs / Fields
- **Style:** Existing generic inquiry fields use transparent surfaces, fine mixed-ink borders, square corners, and a 48px minimum height.
- **Focus:** Retain the visible 3px outline and 4px offset.
- **Availability:** Inquiry capture remains disabled in this configuration. Use the direct email and phone fallback; do not show a successful submission until delivery is operational.

### Navigation
- **Desktop:** A compact paper header with the ARK wordmark and plain text links. The main navigation includes Services and Process; Process links to `/process/`. The current page receives a fine clay underline.
- **Compact:** At 850px and below, use the native `details`/`summary` menu. Its summary and links keep a 44px target; the open menu uses paper, a fine rule, 12px corners, and the single permitted shadow.
- **Footer:** Forest with paper brand text, on-forest supporting copy, direct contact links, and site navigation.

### FAQ Disclosure

Native disclosure rows use fine rules, clear question weight, and open copy in a readable column. Keep the summary target at least 44px high.

### Article Reading Surface

Business articles inherit the Practical Studio palette and typography in a centered 52rem reading column. Their cards, callouts, and table of contents use the rounded pale reading-panel treatment; generic utility cards keep the square source style. Preserve comfortable link targets and body measure.

## Do's and Don'ts

### Do:
- **Do** preserve the palette and active Pliant/Manrope pairing from `business.config.ts` and the local OFL font files.
- **Do** lead with ARK’s own services and keep the free site review as the single primary action.
- **Do** preserve visible keyboard focus, the 44px targets used by homepage navigation, compact-menu links, and footer links, and reduced-motion behavior.
- **Do** keep article cards, callouts, and contents panels distinct from square generic utility cards.
- **Do** use direct email and phone fallback while inquiry delivery is disabled.
- **Do** publish client quotes and portraits only when their respective approval flags allow them.

### Don't:
- **Don't** let secondary content compete with the free site review action.
- **Don't** invent client proof, ratings, prices, or credentials.
- **Don't** promise rankings, traffic, leads, or delivery timelines without approved evidence.
- **Don't** send names, email addresses, or message contents to analytics; GA4 remains gated on explicit acceptance.
- **Don't** show inquiry success until storage and message delivery are working.
