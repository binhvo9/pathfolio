# How to publish the PathFolio UX case study on Behance

This folder is everything a human or another agent needs to create and
publish the Behance project for PathFolio — no need to go back into
Figma or the codebase. Read this file top to bottom, then follow the
steps in order.

## What's in this folder

```
behance-package/
├── INSTRUCTIONS.md          <- this file
├── case-study-text.md       <- copy-pasteable text for every Behance module
├── links.md                 <- every URL you'll need (Figma file, prototype, GitHub)
└── images/                  <- 8 exported PNGs, in the order they go on the page
    ├── 00-cover-research.png
    ├── 01-user-flow.png
    ├── 02-signin.png
    ├── 03-onboarding-question.png
    ├── 04-onboarding-result.png
    ├── 05-dashboard.png
    ├── 06-new-scenario.png
    └── 07-compare.png
```

All 8 images are real exports from the actual Figma file (2560px wide,
except the User Flow diagram which is a wide strip at 2560×168) —
nothing here is a placeholder or mockup-of-a-mockup.

## Before you start

You need:
- A Behance account (behance.net) logged in
- Nothing else — everything else is in this folder

## Step-by-step

### 1. Start a new project

Behance → "Add project" (or Projects → New) → this opens the project
editor.

### 2. Cover image

Behance asks for a cover image separately from the body modules. Use
`images/00-cover-research.png` as the cover (or crop it in Behance's
cover editor — it's a landscape image, Behance will let you position
the crop). If you'd rather have a punchier cover, `images/02-signin.png`
(the polished sign-in screen with the gradient background) also works
well as a cover — pick whichever one looks better once you see both in
the editor.

### 3. Project title, description, tags

Copy these directly from `links.md` / `case-study-text.md`:

- **Title:** `PathFolio — Simple Investing Guidance for Beginners`
- **Short description** (Behance's one-line summary field): copy the
  "Short description" line from `case-study-text.md`
- **Tags:** `ui ux`, `UX Case Study`, `Web app`, `Fintech`,
  `product design`, `Figma`, `user experience`, `ui design`, `prototype`
  (same tag style as the two reference case studies — copy these
  exactly, Behance's tag field autocompletes on exact matches)
- **Fields/Industry:** UX/UI, Web Design (whatever Behance's category
  picker offers closest to these)

### 4. Add the modules, in this order

Behance projects are built as a vertical stack of "modules" (image,
text, embed). Add them in this order:

1. **Image module** — `images/00-cover-research.png` (the problem
   statement + persona, shown as the opening story beat)
2. **Text module** — paste the "Role / Tools / Scope" block from
   `case-study-text.md`
3. **Text module** — paste "The problem" + "Meet the user" sections
4. **Image module** — `images/01-user-flow.png`
5. **Text module** — paste "The process" section (the 4 numbered steps —
   this is the part that shows your actual process, including the two
   real mistakes caught and fixed; keep that honesty in, it's a
   strength not a weakness)
6. **Image module** — `images/02-signin.png`
7. **Image module** — `images/03-onboarding-question.png`
8. **Image module** — `images/04-onboarding-result.png`
9. **Image module** — `images/05-dashboard.png`
10. **Image module** — `images/06-new-scenario.png`
11. **Image module** — `images/07-compare.png`
12. **Embed module** — paste the prototype URL from `links.md`. Behance
    auto-detects Figma prototype links and renders a clickable embed
    (same as the two reference case studies both did) — if Behance
    shows a plain link instead of an embed, use its "Embed" button and
    paste the URL there explicitly.
13. **Text module** — paste "Outcome" section from `case-study-text.md`

### 5. Before publishing — double check

- [ ] The Figma prototype link in the embed actually loads for a
      logged-out visitor (open it in an incognito window to confirm —
      this was already verified once during the build, but re-check
      after any Figma file changes)
- [ ] Every image is right-side-up and not stretched/cropped oddly by
      Behance's layout
- [ ] Tags match exactly what's listed above (Behance is picky about
      exact tag matches for discoverability)

### 6. Publish

Behance → "Publish" (top right of the project editor). That's it — this
is the one step nobody but the account owner can do; no API/agent
access exists for this.

## If something looks off

- **Images look small/blurry on Behance:** Behance recompresses large
  images; the sources here are already 2560px wide which is comfortably
  above Behance's recommended minimum, so this shouldn't happen. If it
  does, re-export at a higher scale from the Figma file directly
  (file linked in `links.md`) rather than upscaling these PNGs.
- **The prototype embed doesn't show a live player:** paste the URL
  into Behance's dedicated "Embed" module type rather than a plain text
  module — Behance's embed detection is per-module-type, not automatic
  text-parsing.
- **Need a different image (e.g. a different screen, or a higher-res
  export):** the Figma file link in `links.md` is the source of truth —
  open it, select the frame, and use Figma's own Export panel (or ask a
  Claude session with the Figma MCP connector to re-export via
  `download_assets`).
