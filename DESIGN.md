---
name: ARK Web Services
description: Clear service information and direct contact in Ark's restrained black, paper, and gray identity.
colors:
  paper: "#f7f7f6"
  ink: "#111111"
  accent: "#111111"
  muted: "#555555"
typography:
  display:
    fontFamily: "'Montserrat Alternates', sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "'Montserrat Alternates', sans-serif"
    fontSize: "clamp(2.125rem, 4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.14
  title:
    fontFamily: "'Montserrat Alternates', sans-serif"
    fontSize: "clamp(1.85rem, 3.5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  square: "0px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: ".75rem 1.3rem"
    height: "3.25rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: ".75rem"
    height: "3rem"
---

# Design System: ARK Web Services

## Overview

ARK keeps its understated black, paper, and gray identity. Typography, open space, and fine rules organize service information. Montserrat Alternates supplies the heading character; the body stack is configured as DM Sans with a sans-serif fallback. The source includes licensed self-hosted Montserrat Alternates Regular and SemiBold files; it does not include a self-hosted DM Sans file.

The design serves direct service discovery and contact. Responsive navigation and content layouts keep the site usable on narrow screens, with visible keyboard focus and reduced-motion behavior.

**Key Characteristics:**
- Paper, near-black, and readable gray from the existing business configuration.
- Montserrat Alternates headings and a configured DM Sans/sans-serif body stack.
- Open spacing, fine rules, square controls, and centered article reading width.
- Client quotes and portraits appear only with their respective approval flags.

## Colors

The palette remains Ark's configured near-black, soft paper, and muted gray; the accent is the same near-black.

### Primary
- **Near-black accent:** Primary actions, focus and selection treatments, and links inherit the configured dark accent.

### Neutral
- **Soft paper:** Main business-site background and light foreground for dark actions.
- **Near-black ink:** Main text and structural foreground.
- **Readable gray:** Supporting copy and secondary information.

## Typography

**Display Font:** Montserrat Alternates (sans-serif fallback; self-hosted Regular 400 and SemiBold 600 files)
**Body Font:** DM Sans (sans-serif fallback; configured stack, with no self-hosted DM Sans file in the source)

**Character:** Geometric, restrained headings carry hierarchy; body copy stays readable and relatively open.

### Hierarchy
- **Display** (600, `clamp(2.6rem, 6vw, 4.5rem)`, 1.1): Large homepage hero headings. A narrow-screen override lowers the hero size to `clamp(2.125rem, 8.5vw, 3.5rem)`.
- **Headline** (600, `clamp(2.125rem, 4vw, 3.25rem)`, 1.14): Shared inner-page, article, and tool page H1 scale.
- **Title** (400, `clamp(1.85rem, 3.5vw, 3rem)`, 1.15): Homepage section H2 headings.
- **Body** (400, `1rem`, 1.65): Standard business-site body copy; supporting paragraphs commonly use a readable maximum line length.

## Layout

The business homepage and article index use a centered 90rem maximum container with responsive horizontal gutters; the mobile gutter is 1.25rem. Homepage sections use compact-to-open vertical padding (`clamp(3rem, 6vw, 5rem)`), with finer separation inside service and process lists. Business articles sit in a centered 52rem reading column with responsive side padding. Tool and inner-page headings use the shared page-title scale. At narrower widths, navigation, service rows, process steps, testimonials, forms, and article cards reflow into single-column layouts.

## Elevation & Depth

The business site is flat at rest. Borders and restrained tonal mixing distinguish sections and controls; article cards, callouts, and contents panels have no shadow. The neutral rule is a 24% ink-to-paper mix, while exact surface colors continue to come from the business configuration.

## Shapes

Controls, article cards, callouts, and the table of contents use square corners. Hairline borders establish separation. Keyboard focus uses a visible outline with a small corner radius, as an accessibility treatment.

## Components

### Buttons
- **Primary:** Square, dark-filled action with light text and comfortable touch height (`3.25rem`); padding is `.75rem 1.3rem`.
- **Secondary:** Transparent fill with dark text and a dark outline.
- **Hover:** Primary clears its fill; secondary inverts to dark fill and light text.
- **Focus:** Visible high-contrast outline with offset.

### Cards / Containers
- **Article cards:** Square corners, a fine mixed-ink rule, and no shadow or lift on hover.
- **Callouts / Contents:** Transparent, square, fine-rule panels. Contents links and toggle have a minimum `44px` target height.
- **Article reading column:** Centered and capped at `52rem` with responsive inline padding.

### Inputs / Fields
- **Style:** Transparent field surface, square corners, and a fine mixed-ink border; inputs have a `3rem` minimum height.
- **Focus:** Visible outline with offset.
- **Inquiry behavior:** The form appears only when inquiry delivery and its verification key are configured; otherwise the page offers direct email and phone contact.

### Navigation
- **Style:** Text links with the current page indicated by a fine underline. Narrow layouts wrap navigation and preserve a `44px` minimum link target.

### Testimonials
- **Publication:** Legacy quotes render only when `publicationApproved` is `true`; portraits additionally require `imageApproved` to be `true`. Both flags default to `false` in the retained records.

## Do's and Don'ts

### Do:
- **Do** keep business colors and fonts tied to the business configuration.
- **Do** preserve visible keyboard focus and reduced-motion behavior.
- **Do** use the configured direct email and phone fallback while inquiry delivery is disabled.
- **Do** show client quotes and portraits only with their respective approvals.

### Don't:
- **Don't** invent client proof, ratings, prices, credentials, or portfolio photography.
- **Don't** promise rankings, traffic, leads, or delivery timelines without approved evidence.
- **Don't** send names, email addresses, or message contents to analytics.
- **Don't** show inquiry success until storage and message delivery are working.
