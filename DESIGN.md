---
name: ARK Web Services
description: A precise studio site that connects website symptoms to services and a free site review.
colors:
  white: "#ffffff"
  ink: "#0d1117"
  cool-gray: "#eef0f3"
  footer: "#080b0f"
  safety-orange: "#ff5a1f"
  muted: "#47515e"
  muted-on-ink: "#c0c9d4"
  rule: "#b9c1cb"
  rule-on-ink: "#465160"
  control: "#677382"
  control-on-ink: "#919ca9"
  accent-hover: "color-mix(in srgb, #ff5a1f 85%, #ffffff)"
  accent-active: "color-mix(in srgb, #ff5a1f 92%, #0d1117)"
  link-hover: "color-mix(in srgb, #ff5a1f 65%, #0d1117)"
  focus-on-gray: "color-mix(in srgb, #ff5a1f 90%, #0d1117)"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontSize: "5rem"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "3rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  action:
    fontFamily: "Geist, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.25
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  control: "4px"
  square: "0px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  grid-gap: "40px"
  gutter: "48px"
  band: "128px"
  band-compact: "80px"
components:
  button-primary:
    backgroundColor: "{colors.safety-orange}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "8px 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-primary-active:
    backgroundColor: "{colors.accent-active}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "8px 24px"
    height: "56px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "48px"
  symptom-panel:
    backgroundColor: "{colors.cool-gray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "{spacing.lg}"
  analytics-choice:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
---

# ARK Web Services Design System

## Overview

The site is the proof. Clear type, precise alignment, and direct language let a business owner recognize a website problem, find the matching service, and request a free review. Keep the assurance about written scope and project price close to the review action.

## Colors

White is the reading surface. Full-width ink bands mark services and the closing review invitation. Cool gray groups planning tools, the symptom panel, and supporting content. The footer uses a deeper ink.

Safety orange marks primary actions and interactive states. Ink on the orange button has a 6.07:1 contrast ratio. Use ink and muted text on light surfaces and white and muted-on-ink text on dark surfaces. Use the rule colors for dividers and the stronger control colors for field and secondary-button borders.

## Typography

Use self-hosted Geist for headings, body copy, and controls. Geist Mono carries numbered section headings, process steps, and compact service indices. The desktop scale uses 80px display headings, 48px section headings, 28px subheads, and 18px body copy. At 40rem and below, these become 44px, 34px, 22px, and 17px. Compact metadata stays at 14px or above. Keep prose within about 65 characters per line.

## Layout

The business shell caps at 1280px. Gutters step from 48px to 32px at 74rem and to 24px at 40rem. Use an 8px spacing rhythm, with 128px block padding on desktop bands and 80px from 58rem down.

The opening uses 12 columns. The headline, offer, review action, and scope line take seven. The symptom panel takes five. At 58rem the opening stacks with the offer first and the header switches to its disclosure menu. The services grid goes from four columns to two at 74rem and to one at 40rem. At 40rem the process, planning tools, closing invitation, and footer also stack. FAQ and article wrappers cap at 760px.

## Elevation & Depth

Use flat surfaces. Full-width color bands, inset gray panels, and fine rules create separation. Interactive colors transition over 150ms, with transitions and animation disabled for reduced motion.

## Shapes

Use 4px corners for actions, inputs, filters, and inset panels. Keep full-width bands and article index entries square. Use 1px rules and borders. Keyboard focus uses a 3px outline with a 3px offset, with a deeper orange on cool gray.

## Components

- **Review actions** use ink on orange with a 56px minimum height. The header version uses 48px. Secondary buttons use an outlined treatment. Standard text links are underlined, with an arrow where the link leads to a service, next step, or tool.
- **Symptom panel** uses four rule-separated links, each at least 64px tall. Each symptom leads to its corresponding service. A final text link leads to planning tools.
- **Services and process** use open grid columns with numbered headings and rules. The process steps run Review, Scope, Build, followed by a gray strip with the scope and pricing assurance.
- **Navigation** combines the ARK wordmark with plain desktop links and a review action. Underline the current page. The mobile menu and FAQ use native disclosures with 48px navigation targets and 64px question rows.
- **Tools and articles** use gray inset results, callouts, and contents panels. The article index uses rule-separated entries and outlined filters, with an ink fill for the selected filter.
- **Forms and contact** use white fields with 48px minimum height and visible labels. The review path currently opens a prefilled email draft on the contact page and shows direct email and phone links.
- **Analytics preferences** use a bordered white panel and equally weighted Allow and Decline buttons with 44px minimum targets. Tracking requires explicit acceptance.

## Do's and Don'ts

- Reserve orange for the primary action, focus, and interaction feedback.
- Use numbered headings where they help readers follow the page or a process.
- Keep keyboard focus visible, interactive targets at least 44px high in navigation and controls, and text readable when the layout stacks.
- Publish client quotes and portraits with their respective approvals. Use the scope and pricing language in [PRODUCT.md](PRODUCT.md).
