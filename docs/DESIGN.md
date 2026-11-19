---
name: LendLoop
description: Borrow what you need. Lend what you don't. A warm, soft neighborhood tool board where colour only appears when it means something.
colors:
  ground: "#f3eee5"
  surface: "#fcfbf8"
  soft: "#f1ece2"
  soft-strong: "#e8e1d4"
  line: "#e7e1d5"
  field: "#857e71"
  free-edge: "#d8d0c0"
  ink: "#1c1b18"
  ink-strong: "#34322c"
  muted: "#5e5a51"
  booked: "#6e675c"
  mustard: "#e8c14a"
  mustard-ink: "#3d3518"
  mustard-tint: "#f6e6ae"
  mustard-chip: "#f6e3a0"
  mustard-edge: "#d9ae2e"
  moss: "#2f5e47"
  moss-tint: "#dfeae1"
  tomato: "#b9432a"
  tomato-tint: "#f6d8ce"
  late: "#a8361f"
  tint-1: "#e9d3be"
  tint-2: "#cfddea"
  tint-3: "#ddd3ec"
  tint-4: "#d7e6dc"
  tint-5: "#f1d9c9"
  tint-6: "#e6dfb8"
typography:
  display:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  h1:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
  body:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.45rem"
  label:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: "1.25rem"
  caption:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
rounded:
  day: "0.6875rem"
  tile: "1rem"
  field: "1rem"
  card: "1.75rem"
  loan-card: "1.875rem"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "2.5rem"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-strong}"
  button-primary-lg:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "3.25rem"
    padding: "0 28px"
  button-secondary:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "2.5rem"
    padding: "0 18px"
  button-secondary-hover:
    backgroundColor: "{colors.soft-strong}"
  button-raised:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "2.5rem"
    padding: "0 18px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "3rem"
    padding: "10px 16px"
  tool-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  loan-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.loan-card}"
    padding: "24px"
  loan-card-ask:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.loan-card}"
    padding: "24px"
  nav-pill:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    height: "42px"
    padding: "0 20px"
  nav-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
  badge:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "1.75rem"
    padding: "0 12px"
  stage-chip:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "2rem"
  day-free:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.day}"
    height: "34px"
  day-booked:
    backgroundColor: "{colors.booked}"
    textColor: "#ffffff"
    rounded: "{rounded.day}"
    height: "34px"
  day-mine:
    backgroundColor: "{colors.mustard-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.day}"
    height: "34px"
  day-late:
    backgroundColor: "{colors.tomato}"
    textColor: "#ffffff"
    rounded: "{rounded.day}"
    height: "34px"
  category-glyph:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    size: "3rem"
  avatar:
    backgroundColor: "{colors.tint-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "2rem"
---

# Design System: LendLoop

## Overview

**Creative North Star: "The Porch Noticeboard"**

A warm cream page with big, softly rounded cards resting on it, like index cards pinned to a neighborhood board. Navigation is a floating pill with the active tab filled in ink. Type is Urbanist, a friendly geometric sans, round enough to match the cards and clear at body size. The app is minimal on purpose (the brief asks for it): few colours, generous radius, one soft shadow.

Colour is a signal, not decoration. Most of the screen is cream, white-ish surface, ink and a quiet brown-grey. Mustard, moss and tomato each have one job and are never used just to brighten a screen. Meaning is always also in words and icons, so the app reads without colour.

**Key Characteristics:**
- Cream ground (#f3eee5), near-white cards (#fcfbf8), warm ink (#1c1b18), never pure black or white-on-white.
- Large radii: cards 28px, loan cards 30px, tiles 16px, controls fully pill-shaped.
- One shadow vocabulary, soft and warm-tinted. No borders on cards.
- Urbanist only, bold headings with negative tracking, sentence case everywhere.
- Mustard means "you must act", moss means free or out/coming up, tomato means late.

## Colors

A warm neutral base with three meaning colours. Hex values in the frontmatter are normative.

### Primary
- **Ink** (#1c1b18): text, the solid primary button, the active nav pill, focus ring, the "accent" badge. The one strong colour in the system. Ink-strong (#34322c) is its hover.

### Secondary (meaning colours)
- **Mustard** (#e8c14a): the viewer must act. The one solid mustard card (a pending request the lender has to answer) and the waiting-count dot in the nav. Mustard-ink (#3d3518) is the secondary text on it. Mustard-tint (#f6e6ae) fills "waiting" chips and the viewer's own requested days; mustard-chip (#f6e3a0) is the "Needs your answer" chip; mustard-edge (#d9ae2e) outlines the viewer's request day.
- **Moss** (#2f5e47): free, coming up, out now. Free-state sentence, Trusted Lender mark, "Coming up" chip (on moss-tint #dfeae1), solid moss for "Out now" and "Due today".
- **Tomato** (#b9432a): late only. Fill for the late chip and the late day pill (white text). Late text (#a8361f) is the readable red for sentences on cream. Tomato-tint (#f6d8ce) backs the icon tile on the error page.

### Neutral
- **Ground** (#f3eee5): page background.
- **Surface** (#fcfbf8): cards, nav bar, inputs.
- **Soft** (#f1ece2) and **Soft-strong** (#e8e1d4): quiet fills (secondary button, free day pill, glyph tiles, past and neutral chips) and their hover.
- **Line** (#e7e1d5): hairline dividers inside cards.
- **Field** (#857e71): the edge of inputs, selects, textareas and checkboxes, and the scrollbar.
- **Free-edge** (#d8d0c0): the inset edge on the free swatch in the board legend.
- **Muted** (#5e5a51): secondary text. **Booked** (#6e675c): booked day pills, with white text.
- **Avatar tints 1 to 6** (#e9d3be, #cfddea, #ddd3ec, #d7e6dc, #f1d9c9, #e6dfb8): one tint per neighbor, chosen from a hash of the first name so a person keeps the same tint everywhere. Ink text on all.

### Measured contrast (WCAG 2.1, from globals.css)
On surface #fcfbf8 / ground #f3eee5:
- Ink 16.6 / 14.9. Muted 6.6 / 5.9 (5.8 on soft). Moss 7.2 / 6.5. Late text 6.3 / 5.7.
- Field edge (control boundary) 3.9 / 3.5, above the 3:1 minimum.
On fills:
- White on ink 17.2, on booked 5.6, on moss 7.5, on tomato 5.4.
- Ink on mustard 10.0, mustard-ink on mustard 7.1, ink on mustard-tint 13.8, moss on moss-tint 6.0, ink on avatar tints 11.9 or better.
- Outline button edge (ink at 0.55): 3.25 on mustard, 3.8 on surface.
- Avoided on purpose: muted (4.0), moss (4.3) and late text (3.8) on mustard. The mustard card uses ink and mustard-ink only.

### Named Rules
**The Act-Now Rule.** Mustard appears only where the viewer must act: the one solid mustard card, its Approve as the one solid primary on the screen, the "Needs your answer" chip and the waiting count in the nav. Waiting for someone else gets a light mustard-tint chip, never the solid card.

**The Late-Only Tomato Rule.** Tomato and late-red mean late and nothing else. Do not use red for errors that are not about lateness, or for emphasis.

**The Moss Rule.** Moss means free, out now, coming up, returned and Trusted Lender. It is a calm "all is as it should be" colour.

**The Never-Alone Rule.** Colour is never the only carrier of meaning. Every chip has a word and an icon, every day pill has a sentence beneath it, and the Trusted mark has a shield plus the word.

## Typography

**Font:** Urbanist (loaded with next/font, variable `--font-urbanist`, `display: swap`), fallback `ui-sans-serif, system-ui, sans-serif`. One family for everything.

**Character:** Friendly and geometric, round enough for the soft cards. Weight and size do the hierarchy, not extra fonts.

### Hierarchy
- **Display** (700, 4rem, line-height 1, tracking -0.03em): page title from the sm breakpoint up.
- **H1** (700, 2.75rem, line-height 1, tracking -0.03em, balanced): page title on phones. Page description below it is 1.125rem muted, max prose width.
- **H2** (700, 1.75rem / 2rem, tracking -0.02em): loan section headings, each followed by a white count pill.
- **H3** (700, 1.25rem / 1.5rem, tracking -0.01em): tool and loan names on cards.
- **Title** (700, 1.375rem): the LendLoop wordmark. No line height of its own.
- **Body** (400, 1rem / 1.45rem): default text. Card secondary text is 0.9375rem.
- **Label** (600, 0.9375rem / 1.25rem): form labels, sentence case. Nav tabs and buttons are 0.9375rem (semibold and bold).
- **Caption** (700, 0.8125rem): badges, day numbers, the Trusted mark. Weekday initials are text-xs.

### Named Rules
**The Sentence-Case Rule.** All copy is sentence case. No uppercase labels, no eyebrows above headings.

**The Tabular-Dates Rule.** Dates and day numbers use tabular numerals so ranges line up.

## Layout

Single column of cards on phones, a card grid on wider screens (board of tools, groups of loans). Content max width 90rem with 16px gutters on phones, 32px from sm, 56px from xl. The header is a three-column grid at lg (wordmark, centred pill nav, account button); below lg the pills take their own row and wrap so no tab or waiting count is ever hidden. A skip link leads to `main`. Card padding is 20px, 24px from sm. Loan groups are stacked with 16px between cards; a group with no items renders nothing so the grid closes up.

## Elevation & Depth

Hybrid, mostly tonal: depth comes from light cards on a darker cream ground plus one soft shadow. No borders around cards.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 1px 2px rgb(70 55 30 / 0.05), 0 10px 30px -6px rgb(70 55 30 / 0.09)`): every card, the nav bar, the raised button, count pills.
- **Press** (`box-shadow: 0 6px 16px -6px rgb(28 27 24 / 0.45)`): X ring** (`0 0 0 3px surface, shadow-soft`): the account avatar button.

### Named Rules
**The One Shadow Rule.** Cards use the soft shadow and nothing heavier. The solid mustard card sits on the same shadow as light cards; its colour, not extra elevation, is what lifts it.

## Shapes

Round everything that is touched. Pills for buttons, nav tabs, badges and chips (full radius). Cards 1.75rem (28px); loan cards 1.875rem (30px); icon tiles 1rem (16px); inputs 1rem (rounded-2xl); day pills 0.6875rem (11px); avatars and count dots are circles; the wordmark mark is a 12px rounded square in ink. Icons are lucide-react, outline style, stroke 1.75 to 2, always decorative (`aria-hidden`) because a word sits beside them.

## Components

### Buttons
Always a real `<button>` with `type="button"` by default; links reuse the same classes. Fully pill-shaped, bold, 150ms colour transition, 50% opacity when disabled.
- **Primary:** solid ink, white text, hover ink-strong. md is 40px high with 18px side padding; lg is 52px high with 28px padding. One solid primary per screen decision.
- **Secondary:** soft fill, ink text, hover soft-strong. The quiet action.
- **Outline:** transparent with a 1.5px inset ink edge at 0.55 alpha (3.25:1 on mustard, 3.8:1 on surface). The secondary on the mustard card, where a soft fill would vanish (Decline beside Approve).
- **Raised:** surface fill with the soft shadow, for a quiet action off-card (the landing top bar).

### Cards / Containers
- **Tool card:** surface, 28px radius, soft shadow. Category glyph and name, category and condition line, two-line description, availability strip, then a divider and the lender (avatar, name, Trusted mark) with the request action. Own tools show "Manage" instead.
- **Loan card:** surface, 30px radius, soft shadow. Stage chip on top, glyph plus tool name and date span, optional stage sentence, other party with avatar, actions, then one quiet automation line (a failed delivery always stays visible; older events sit in a collapsible "Automation history").
- **Empty state:** surface card, 28px radius, centred title (h3), hint and one next-step action.
- **Section count:** white pill with the soft shadow beside each group heading.

### Inputs / Fields
Label wrapped around the control, so every input is labelled without ids; label above in label style, hint below in small muted text. Controls are 48px high, 16px radius, surface fill, 1px field-colour border (#857e71, 3.9:1 on cards and 3.5:1 on the ground), muted placeholder, hover border turns ink. Focus is the global ring.

### Focus
Every interactive element: 2px solid ink outline with 2px offset, visible on cream and on mustard. Text selection is mustard-tint with ink text. Accent and caret colour are ink.

### Navigation
A surface-coloured floating pill bar with the soft shadow and 5px padding. Tabs are 42px high pills: muted text with soft hover; the active tab is solid ink with white text and `aria-current="page"`. The Incoming tab shows a mustard count dot (ink number) with screen-reader text "N waiting for your answer". Admin tab appears only for admins. Below sm the bar takes a 26px radius and wraps.

### Badges and chips
Badge: 28px high pill, caption type. Tones: neutral (soft, ink), good (moss-tint, moss), warn (mustard-tint, ink), accent (ink, white). Words carry the meaning.

### Availability strip (signature component)
The next 14 days of a tool as rounded day pills (34px high, 11px radius), each with a narrow weekday initial above and the date number inside. States:
- **Free:** soft fill, ink text.
- **Booked:** booked fill (#6e675c), white text.
- **Your request:** mustard-tint with a 1.5px mustard-edge inset ring, ink text. Only the viewer's own pending request, never anyone else's.
- **Late today:** tomato fill, white text, only on today's pill when the tool is late.
Today has an ink outline (2px, offset 2px) and an ink weekday initial. Seven columns, so two rows of seven when the card is narrow and one row of fourteen when the container is 20rem or wider (container query), so the dates never shrink. The pills are `aria-hidden`; the sentence under them is the accessible text, led by an icon: free in moss with a check ("Free now. Booked 25 to 27 Nov", the first part in colour, the rest muted), out in ink with a clock ("Out, back Fri 20 Nov"), late in late-red with an alert icon ("3 days late, was due 15 Nov"), plus ". You asked for ..." when the viewer has a pending request. The board legend shares the same fills.

### Loan stages
Each loan has one stage (pending, expired, upcoming, out, due today, late, returned, declined, cancelled), grouped as Waiting, Upcoming, Out and Past. The stage chip is 32px high with an icon and a word:
- **Waiting for the viewer (lender side):** the solid mustard card with the "Needs your answer" chip (mustard-chip, ink), mustard-ink secondary text, a glyph tile of white at 45%, and a big solid ink Approve beside an outline Decline.
- **Waiting for someone else:** light card, mustard-tint chip with an hourglass; the chip carries the name ("Waiting for Cara") and the sentence is not repeated.
- **Not answered (expired), returned, declined, cancelled:** soft chip, ink text.
- **Coming up:** moss-tint chip, moss text. The date line under the title already says when, so no extra sentence.
- **Out now, due today:** solid moss chip, white text; the sentence names the borrower to the lender ("With Ben, back Fri 20 Nov").
- **Late:** solid tomato chip, white text, sentence in late-red ("3 days late, was due 15 Nov").
- **Past:** not full cards. Compact rows inside one surface card, divided by line hairlines, newest first, three shown with a "show all" toggle. Each row is tool name, outcome in the stage colour, and the other party with dates. A failed e-mail stays visible on its row. Returned outcomes are moss, late is red, everything else muted.

### Small marks
- **Category glyph:** 48px rounded tile (16px radius), soft fill, lucide icon at 22px: power tools Drill, hand tools Wrench, garden Sprout, kitchen ChefHat, camping Tent, cleaning SprayCan, other Package.
- **Avatar:** first letter in a tinted circle, 32px, decorative; the name is always written beside it.
- **Trusted Lender mark:** moss shield icon and the word "Trusted", with hidden text explaining it is set by the neighborhood admin. On the mustard card it takes mustard-ink, because moss is too faint there.

### Privacy rule for the board
Tool cards on the shared board never name a borrower. They show only availability (free, booked, late, or the viewer's own request). Who has a tool appears only to the people in that loan, in the viewer's own rail and in loan cards, and to the admin. The public landing and its examples show tool name and category only, never owner details.

## Motion

Almost none, by design. The only transitions are 150ms ease-out colour, background and border changes on buttons, nav tabs and inputs, and a disclosure chevron that rotates when "Automation history" opens. Nothing moves on its own: no entrance animation, no scroll effects, no looping. Under `prefers-reduced-motion: reduce` all transitions are switched off.

## Do's and Don'ts

### Do:
- **Do** keep the ground cream (#f3eee5) and cards near-white (#fcfbf8) with the single soft shadow.
- **Do** make Approve the one solid ink primary on a mustard card, with Decline as the outline variant.
- **Do** give every status a word and an icon as well as a colour.
- **Do** use ink text (and mustard-ink for secondary text) on mustard, and keep control boundaries at 3:1 or better.
- **Do** keep cards, chips and controls fully rounded to the existing radii.
- **Do** write the availability sentence for every strip; it is the accessible version of the pills.
- **Do** write sentence-case copy and tabular dates.

### Don't:
- **Don't** use mustard for decoration or for waiting-on-someone-else; the solid mustard card is only for what the viewer must answer.
- **Don't** use tomato or late-red for anything but late.
- **Don't** put muted, moss or late-red text on mustard (4.0, 4.3 and 3.8, below 4.5).
- **Don't** name a borrower on a tool card on the board.
- **Don't** add a second solid primary to a decision, or a second solid mustard card style.
- **Don't** add heavier shadows, card borders, uppercase eyebrows, extra typefaces or animation.
- **Don't** let colour be the only signal, and don't rely on the day pills for screen-reader meaning.
