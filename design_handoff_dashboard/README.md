# Handoff: MentorForge Dashboard — Reimagined

## Overview

This handoff covers the reimagined **MentorForge Study Plan dashboard** — specifically the top portion of the Study Plan page: the **Study Session hero** plus the **trackers** beneath it (today's docket and the 16‑day streak view).

The goal of the redesign was to keep the rigor of a calendar-first study planner while making the trackers more aesthetically intentional, more "flowing," and more honest about progress. The bottom of the page (Study Plan / Plan Summary / Study Plan weeks grid) is **out of scope** for this handoff and should be left untouched, or wired into this new top section using the existing patterns.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX** — prototypes that show intended look, layout, color, typography, and behavior. They are **not production code to copy directly**.

The task is to **recreate this design in the target codebase** (whatever framework MentorForge is built in — likely React/Next.js based on the existing app shell) using its established patterns, design tokens, and components. Use the prototype as the source of truth for visual decisions, but wire it up using the project's real data, routing, and component library.

Files included:

- `MentorForge Dashboard.html` — entry point. Loads React/Babel, mounts `<Dashboard />`.
- `dashboard.jsx` — all components in one file: `Sidebar`, `StudySessionHero`, `DayRibbon`, `StreakBars`, `Stat`, `Dashboard`.

## Fidelity

**High-fidelity (hifi).** All colors, typography, spacing, and interaction details are deliberate and final. Recreate pixel-perfectly within the existing codebase's libraries and conventions. Where the codebase already has a token (e.g. an `--ink` color or a button component), use that instead of redefining it — the values below should match.

## Brand alignment

This dashboard uses the same palette and type system as the existing `MentorForge Landing.html` and `MentorForge Signup Flow.html`. The shared tokens live in `landing/tokens.jsx` (`L_INK`, `L_PAPER`, `L_AMBER`, etc.). When porting, **reuse the existing brand tokens** — do not introduce new color names.

---

## Layout — page shell

```
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                   │
│ Sidebar  │  <main>                                           │
│  220px   │   ┌──────────────────────────────────────────┐    │
│          │   │  StudySessionHero                        │    │
│          │   └──────────────────────────────────────────┘    │
│          │   18px gap                                        │
│          │   ┌──────────────────────────────────────────┐    │
│          │   │  DayRibbon                               │    │
│          │   └──────────────────────────────────────────┘    │
│          │   18px gap                                        │
│          │   ┌──────────────────────────────────────────┐    │
│          │   │  StreakBars (1fr / 280px split)          │    │
│          │   └──────────────────────────────────────────┘    │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

- Outer container: `display: flex; height: 100%; background: #EFEBE2;` (paper2)
- `<main>`: `flex: 1; overflow: auto; padding: 28px;`
- Card gap: 18px vertical between Hero / Ribbon / Streak.
- Cards are `background: #FFFFFF; border: 1px solid #E6E4DE; border-radius: 16px;`.

---

## Screens / Views

### Sidebar (220px, full height)

**Purpose**: persistent app nav.

- Background: `#F5F2EC` (paper)
- Right border: `1px solid #E6E4DE`
- Padding: `20px 14px`
- Brand row: 28×28 ink square with serif "M" + wordmark "MentorForge" in Instrument Serif 22px
- Nav items (`Study Plan`, `Calendar Coach`, `Account`):
  - Each: `padding: 8px 10px; border-radius: 8px; gap: 10px; font-size: 13.5px;`
  - Active item: background `#EFEBE2`, font-weight 600, color `#0E1A2B`, plus a 2px-wide amber rail (`#C9842B`) on the left edge (positioned `left: -14px`)
  - Inactive: color `#3A4860`, font-weight 500
  - 15×15 stroked SVG icon per item (calendar grid, clock, user)
- Spacer flex: 1
- "Sitting" card: white, 1px hair border, padding 12px, radius 10px. Eyebrow "SITTING" (10px, 700, letter-spacing 1.2, uppercase, slate). Display "Feb 2026" in Instrument Serif 22px. Subtext "18 weeks remaining" in Inter 11.5px ink2.
- User row: 26px round ink avatar with serif initials "JL" + name "Jordan Lee" in Inter 12.5px

---

### StudySessionHero

**Purpose**: surface the next study session and today's overall allocation.

**Container**: white card, 16px radius, 1px hair border, padding `32px 36px`, `position: relative; overflow: hidden`.

**Top-right corner stamp** (absolute):
- `padding: 14px 18px`
- JetBrains Mono, 10px, color slate `#7A8699`, letter-spacing 1
- Content: `TUE · 12 MAY 2026`

**Top row** (flex, justify space-between, align flex-end, gap 28):

Left column (flex 1):
- Eyebrow: amber (`#C9842B`), Inter 10.5px / 700 / uppercase / letter-spacing 1.6. Prefixed by a 16×1px amber line (a `<span>` with width:16, height:1, background amber, margin-right 8). Text: `Next study session`
- Title: Instrument Serif, 48px, line-height 1.05, weight 400, ink, letter-spacing -0.6, margin `10px 0 0`. Text: `Equity Investments` followed by a slate-colored period.
- Meta row: Inter 13.5px, ink2, gap 12, with:
  - Clock SVG icon (13×13 stroked, ink2) + `45 min · starts 4:45 PM`
  - 3px round slate dot separator
  - `Reading 23 · DCF practice set`

Right column (Begin button):
- Pill: height 52, padding `0 24px 0 26px`, border-radius 999, no border
- Background ink `#0E1A2B`, text paper `#F5F2EC`
- Inter 15px / 600 / letter-spacing -0.1
- Box-shadow: `0 4px 14px rgba(14,26,43,0.18)`
- Trailing 14×14 right-arrow SVG (paper stroke, weight 1.8)
- Label: `Begin session`

**Bottom strip** (`margin-top: 28px; padding-top: 22px; border-top: 1px solid #E6E4DE`):

Header row (justify space-between, baseline align, font-size 11):
- Left: `TODAY'S ALLOCATION` — slate, 700, letter-spacing 1, uppercase
- Right: Instrument Serif 17px ink — `1h 30m` (weight 500) followed by `/ 2h 15m` in JetBrains Mono 12px slate

Progress track (height 8, background paper2 `#EFEBE2`, radius 2):
- Filled portion: 67% wide, ink, radius 2
- Marker: 14×14 amber circle at the 67% mark, centered (transform translateX(-7px)), with 2px white border and `box-shadow: 0 2px 6px rgba(201,132,43,0.4)`. This represents the upcoming session.

Legend row (`margin-top: 12px`, Inter 11.5px, ink2):
- 8×8 ink square + `3 sessions logged`
- 8×8 amber square + `Up next · 4:45 PM`
- Right-aligned (margin-left auto), JetBrains Mono 11px slate: `◇  Calendar synced · 2 sessions today`

---

### DayRibbon

**Purpose**: today's study sessions visualized along an actual hour timeline (6 AM → 11 PM), with a live "now" indicator, replacing the boring vertical list.

**Container**: white card, padding `26px 32px 30px`, radius 16, hair border.

**Header row** (flex, space-between, align flex-start):

Left:
- Eyebrow: amber, 10.5px / 700 / uppercase / letter-spacing 1.4 — `Today's docket`
- Title: Instrument Serif 26px, weight 400, ink, letter-spacing -0.4, margin `8px 0 4px` — `Five sessions. Three done.`
- Subtext: Inter 12.5px ink2 — `<strong>2h 15m</strong> remaining · next at 4:45 PM` (the strong portion uses ink + 600)

Right:
- Outline button: height 32, padding `0 14px`, radius 999, transparent bg, 1px hair2 border, Inter 12px / 500 ink — `+ Add session`

**Ribbon area** (`position: relative; height: 110px; margin-top: 26px`):

Hour rule + tick labels (positioned top: 50, height: 24):
- For each hour `h ∈ [6, 9, 12, 15, 18, 21]`:
  - Vertical 6px tick: `position: absolute; left: ${pct}%; top: 0; height: 6px; border-left: 1px solid #D6D2C7;`
  - Label below: JetBrains Mono 10px slate, e.g. `06:00`, `09:00`…
- Spine line at top 50: 1px hair2 horizontal line full-width
- "Done so far" overlay: 3px ink line from left edge to the NOW position, top 49

**Session pills** — for each of 5 sessions:

```js
const sessions = [
  { start: 7.0,  end: 7.75,  topic: 'Probability Distributions',  state: 'done' },
  { start: 9.5,  end: 10.0,  topic: 'Standard III · Duties',      state: 'done' },
  { start: 12.5, end: 13.25, topic: 'Pensions & PP/E',            state: 'done' },
  { start: 16.75,end: 17.5,  topic: 'Reading 23 · DCF practice',  state: 'next' },
  { start: 21.0, end: 21.5,  topic: '25 flashcards',              state: 'queued' },
];
```

Layout math (dayStart=6, dayEnd=23, span=17):
- `xfor(h) = ((h - 6) / 17) * 100` → percent
- `left: xfor(start)%`, `width: max(xfor(end) - xfor(start)%, 86px)`
- Pills alternate above/below the spine. Index 0 (and the `next` pill) sit at top:4 (above spine). Index 1, 3 sit at top:64 (below). Height: 42.

State styling:
- **done**: background ink, text paper, no border. Time-row icon: small white check (paper stroke).
- **next**: background amber `#C9842B`, text ink, 1px amber border, box-shadow `0 8px 18px rgba(201,132,43,0.35)`. Time row prefixed with a `NEXT` chip (font-weight 800, font-size 9, padding `1px 4px`, background `rgba(14,26,43,0.18)`, radius 2).
- **queued**: transparent background, 1.5px dashed hair2 border, ink2 text.

Pill internals:
- Time row: JetBrains Mono 9.5px / 700 / letter-spacing 0.5, content `HH:MM`
- Title row: Inter 11px / 500 (or 600 if next), single-line ellipsis

**NOW indicator** (vertical line at `xfor(16.2) ≈ 60%`):
- 1.5px wide, color rust `#A85A3A`, full height of the ribbon area minus 18px
- 8px round rust dot at the top
- Label "NOW" 20px above: JetBrains Mono 9.5px / 700 / letter-spacing 0.6, color rust, centered

---

### StreakBars (the 16-day tracker)

**Purpose**: replace the empty/generic 16-day calendar grid with an honest bar chart that shows *how much* you studied each day, *what* counts as a streak, and *when* you missed.

**Container**: white card, padding `28px 32px`, radius 16, hair border.
**Layout**: CSS grid `grid-template-columns: 1fr 280px; gap: 32px; align-items: stretch`. The right column is divided from the left by a 1px hair border (`border-left` on the right column with `padding-left: 28px`).

#### Left column — bars

Header (flex, space-between, align flex-start):
- Eyebrow: amber, 10.5px / 700 / uppercase / letter-spacing 1.4 — `Last sixteen days`
- Title: Instrument Serif 26px weight 400 ink letter-spacing -0.4 — content like:
  `<span amber italic>4</span> in a row, <span slate>·</span> 14 of 16 days.`
- Right meta block: JetBrains Mono 10.5px slate, line-height 1.6, right-aligned:
  - Line 1: `27 APR — 12 MAY`
  - Line 2 (ink): total hours like `19.0h logged`

Bars area (`position: relative; height: 130px; margin-top: 28px`):
- Baseline rule: 1px hair2 horizontal line at `bottom: 28px`
- Target line at 60 minutes: 1px dashed hair2 line at `bottom: 28 + (60/120)*80 = 68px`. Right-aligned label above it: JetBrains Mono 9px slate letter-spacing 0.4 — `TARGET · 60m`

Bars grid (`position: absolute; inset: 0; display: grid; grid-template-columns: repeat(16, 1fr); gap: 6px; align-items: end; padding-bottom: 28px`):

Day data:
```js
const days = [
  { d: 27, m: 'Apr', mins: 60,  weekday: 'M' },
  { d: 28, m: 'Apr', mins: 90,  weekday: 'T' },
  { d: 29, m: 'Apr', mins: 45,  weekday: 'W' },
  { d: 30, m: 'Apr', mins: 0,   weekday: 'T' }, // missed
  { d: 1,  m: 'May', mins: 75,  weekday: 'F' },
  { d: 2,  m: 'May', mins: 120, weekday: 'S' },
  { d: 3,  m: 'May', mins: 30,  weekday: 'S' },
  { d: 4,  m: 'May', mins: 90,  weekday: 'M', best: true },
  { d: 5,  m: 'May', mins: 60,  weekday: 'T' },
  { d: 6,  m: 'May', mins: 0,   weekday: 'W' }, // missed
  { d: 7,  m: 'May', mins: 45,  weekday: 'T' },
  { d: 8,  m: 'May', mins: 105, weekday: 'F' },
  { d: 9,  m: 'May', mins: 90,  weekday: 'S' },
  { d: 10, m: 'May', mins: 60,  weekday: 'S' },
  { d: 11, m: 'May', mins: 75,  weekday: 'M' },
  { d: 12, m: 'May', mins: 90,  weekday: 'T', today: true },
];
```

Per-day bar:
- Height: `(mins / 120) * 80px`, min 4px
- Color logic:
  - `mins === 0` → transparent fill, 1px dashed rust `#A85A3A` border (the "missed" tick)
  - `today` → amber
  - `inStreak` (days from end up to current streak count) → amber
  - else → ink
- `border-radius: 2`
- Today bar: 6×6 amber dot 8px above the bar top, with `box-shadow: 0 0 0 3px #F4E8D2` (amberSoft halo)
- Day with `best: true`: tiny `★ BEST` label 2px above the bar, JetBrains Mono 8.5px / 700, ink2, letter-spacing 0.5

Day label (positioned absolute, bottom 0, padding-top 8, centered, JetBrains Mono 10px):
- Two stacked spans: weekday letter (8.5px, 60% opacity) above date number
- If today: ink + 700; otherwise slate + 500

Current streak is computed from the end:
```js
let streak = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].mins > 0) streak++; else break;
}
```

#### Right column — read-out + coach note

Three `<Stat>` blocks (gap 16px, in order):

**Stat** props: `label`, `value`, `unit`, `hint`, optional `tone="amber"`.
- Label: Inter 10px / 700 / letter-spacing 1.2 / uppercase / slate
- Value: Instrument Serif 36px / letter-spacing -0.5 / line-height 1; color amber if `tone='amber'`, else ink. Unit beside it in serif italic 18px slate.
- Hint: Inter 11.5px ink2

The three stats:
1. `Current streak` · `4` · unit `days` · tone amber · hint `Best run: 9 days · May 4`
2. `Days studied` · `14/16` · no unit · hint `One miss · May 6`
3. `Hours logged` · `19.0` · unit `h` · hint `Avg 65 min per studied day`

Coach note (bottom of column):
- Padding `12px 14px`, radius 8, background paper, 1px hair border
- Body: Instrument Serif 14px italic ink2 line-height 1.5 — *"Holding above target six days running. The Feb sitting is on the calendar."*
- Caption: JetBrains Mono 9.5px slate letter-spacing 0.5 — `COACH NOTE · 12 MAY` (margin-top 6)

---

## Interactions & Behavior

The prototype is static. For implementation:

- **Begin session button** → starts the next session (route to `/session/{id}` or open a focused study mode).
- **Add session button** → opens an "add a session to today" modal (timestamp + topic + duration).
- **Sidebar nav items** → standard route changes.
- **Day ribbon pills** are interactive in the real app:
  - Hover on a `done` pill → tooltip with logged minutes and topic
  - Click `next` pill → same as Begin session
  - Click `queued` pill → opens the session preview / lets you reschedule
- **Streak bars** hover → tooltip with full date, weekday, and minutes. Today and `best` get a permanent label.
- **NOW line** should auto-update from the user's clock; in prod, recompute its `xfor(currentHour)` position every minute.
- **Allocation marker** in the hero progress bar should sit at the percentage of the day's planned minutes already done.

No animation has been spec'd; if the codebase uses Framer Motion or CSS transitions for entry, apply them sparingly (a 200–300ms ease-out fade-up on each card on first load is appropriate).

## State Management

Minimum data the dashboard needs:
- `sitting`: `{ exam: 'CFA II', date: '2026-02-15' }`
- `today`: `{ date, sessions: [{id, start, end, topic, state}] }` where `state ∈ done | next | queued | skipped`
- `nowMinutes`: derived from current time
- `last16`: array of `{ date, minutes, isPersonalBest? }`
- `derived`: `currentStreak`, `daysStudied`, `totalMinutes`, `bestStreak`

Streak rules:
- Streak = consecutive days from today (or yesterday if today's first session hasn't started) with `minutes > 0`.
- `daysStudied` = days in the 16-day window with `minutes > 0`.
- "Above target" = `minutes >= 60`.

## Design Tokens

Colors (inherit from `landing/tokens.jsx` — do not duplicate):

| Token        | Hex        | Role                                   |
|--------------|-----------|----------------------------------------|
| `L_INK`      | `#0E1A2B` | Primary text, primary fill, "Begin"    |
| `L_INK_2`    | `#3A4860` | Secondary text                         |
| `L_SLATE`    | `#7A8699` | Tertiary text, axis labels, separators |
| `L_HAIR`     | `#E6E4DE` | Card borders, dividers                 |
| `L_HAIR_2`   | `#D6D2C7` | Stronger dividers, dashed borders      |
| `L_PAPER`    | `#F5F2EC` | Sidebar bg, button text on ink         |
| `L_PAPER2`   | `#EFEBE2` | Page background                        |
| `L_CARD`     | `#FFFFFF` | Card background                        |
| `L_AMBER`    | `#C9842B` | Accent: eyebrows, "next", streak fill  |
| `L_AMBER_SOFT`| `#F4E8D2`| Amber halo / soft chip background      |
| `L_GREEN`    | `#5A7D5A` | Reserved (unused on this surface)      |
| (rust)       | `#A85A3A` | Missed-day marker, NOW line            |

Typography:
- Display serif: `"Instrument Serif"` (Google Fonts) — used for hero title, card titles, stat numbers, sitting card date.
- Editorial serif: `"Source Serif 4"` — available as a backup for body italics.
- UI sans: `"Inter"` weights 400/500/600/700.
- Mono / data: `"JetBrains Mono"` weights 400/500/700 — for time stamps, axis labels, eyebrow data, calendar header.

Spacing scale used: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36.
Border radius: 2 (bars), 6, 8 (chips, small cards, bars), 10, 16 (cards), 999 (pill buttons).
Shadows:
- Begin button: `0 4px 14px rgba(14,26,43,0.18)`
- Next-session pill: `0 8px 18px rgba(201,132,43,0.35)`
- Allocation marker: `0 2px 6px rgba(201,132,43,0.4)`
- Today's halo: `0 0 0 3px rgba(244,232,210,1)` (amberSoft glow)

## Assets

- No raster assets. All icons are inline stroked SVG (1.3px stroke for chrome, 1.6–1.8px for emphasis).
- Brand monogram: serif "M" inside a 28×28 / radius 7 ink square. Reuse from existing app shell if available.
- Fonts loaded via Google Fonts in the prototype's `<head>`. In production, self-host via `next/font` (or equivalent) to avoid layout shift.

## Files

- `MentorForge Dashboard.html` — entry harness; mounts `<Dashboard />` to a `<div id="root">`.
- `dashboard.jsx` — all components in a single file (no Babel parser support is needed in production; split into modules per the project's convention, e.g. `Sidebar.tsx`, `StudySessionHero.tsx`, `DayRibbon.tsx`, `StreakBars.tsx`, plus a `dashboard-tokens.ts` if not already centralized).

## Recommended file structure for the real codebase

```
features/dashboard/
  Dashboard.tsx             // page composition
  components/
    Sidebar.tsx             // already exists in app shell?
    StudySessionHero.tsx
    DayRibbon.tsx
    StreakBars.tsx
    Stat.tsx
  hooks/
    useTodayStudy.ts        // fetch today's sessions + nowMinutes ticker
    useSixteenDayStreak.ts  // last 16 days + derived stats
  lib/
    streak.ts               // pure helpers: currentStreak, daysStudied, etc.
```

## Out of scope for this handoff

- The Study Plan / Plan Summary section beneath the trackers (the rest of the screenshot the user shared) is unchanged. If touched, follow the existing patterns; do not restyle as part of this work.
- The Calendar Coach and Account routes — only the active sidebar state is shown.
- Mobile breakpoints — the prototype is desktop-first at 1180px. Define a tablet/mobile spec separately when needed.
