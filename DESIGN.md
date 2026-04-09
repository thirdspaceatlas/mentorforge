# Design System — MentorForge

## Product Context
- **What this is:** CFA study planning and pacing app with Calendar Coach, an intelligent scheduling agent that finds study windows in your real calendar
- **Who it's for:** Working professionals preparing for CFA exams, especially those in financial services with demanding schedules and multiple calendars
- **Space/industry:** Exam prep, productivity tools. Peers: Schweser, Kaplan, AnalystPrep (content-focused); Motion, Reclaim (calendar AI). MentorForge sits at the intersection: calendar-aware study scheduling
- **Project type:** Web app (Next.js) with PWA capabilities, designed mobile-first for on-the-go study sessions
- **Neurodiversity-aware:** Built for how your brain actually works. No streaks, no guilt, no punishment for missed days. Quiet confidence over gamification pressure

## Aesthetic Direction
- **Direction:** Refined minimal. Clean, professional, warm. Not clinical, not playful. The feel of a well-organized desk, not a corporate dashboard
- **Decoration level:** Intentional. Typography and spacing do most of the work. Subtle warmth in the background tone (#fafaf9 light). No decorative blobs, no gradients as decoration
- **Mood:** Calm competence. The app should feel like a smart, supportive colleague who has your schedule figured out. Never anxious, never nagging
- **Single-surface principle:** Dashboard uses one hero card (the primary interaction) with everything else as sections on a clean surface, separated by typography and spacing, not card borders. This prevents visual overwhelm for users who are already juggling complexity

## Typography
- **Display/Hero:** Fraunces 600 — editorial serif that adds warmth and personality without being stuffy. Used for session topics, dashboard hero, timer display, completion messages. Loaded via `next/font/google`
- **Body:** Plus Jakarta Sans 400/500/600/700 — geometric sans that reads clean at all sizes. Used for all body copy, UI labels, navigation, buttons. Loaded via `next/font/google`
- **UI/Labels:** Plus Jakarta Sans 600, text-sm, uppercase tracking-wide for section labels
- **Data/Tables:** Plus Jakarta Sans 500 with `font-variant-numeric: tabular-nums` for aligned numbers
- **Code:** JetBrains Mono (if needed in future)
- **Loading:** Google Fonts via `next/font/google` (automatic optimization, no layout shift)
- **CSS variables:** `--font-sans` (Plus Jakarta Sans), `--font-display` (Fraunces)
- **Scale:**
  - Timer: Fraunces 700, text-5xl (tabular-nums)
  - Display heading: Fraunces 600, text-2xl
  - Section label: Plus Jakarta Sans 600, text-sm uppercase tracking-wide, slate-500
  - Body: Plus Jakarta Sans 400, text-base
  - Stats: Plus Jakarta Sans 500, text-sm, slate-600 / dark:slate-400
  - Small/meta: Plus Jakarta Sans 400, text-xs

## Color
- **Approach:** Restrained. Emerald is the single accent, used sparingly for actions and success states. Color is meaningful, not decorative
- **Primary accent:** emerald-700 (#047857) light / emerald-400 (#34d399) dark — represents progress, action, "go"
- **Accent hover:** emerald-800 (#065f46) light / emerald-500 (#10b981) dark
- **Accent subtle:** emerald-100 (#d1fae5) light / emerald-900 (#064e3b) dark
- **Accent foreground:** white light / slate-900 (#0f172a) dark
- **CSS variables (RGB triplets for alpha compositing):**
  - `--mf-accent`: `4 120 87` / dark: `52 211 153`
  - `--mf-accent-hover`: `6 95 70` / dark: `16 185 129`
  - `--mf-accent-foreground`: `255 255 255` / dark: `15 23 42`
  - `--mf-accent-subtle`: `209 250 229` / dark: `6 78 59`
- **Neutrals:** Slate scale (cool gray). Background: #fafaf9 (stone-50, warm) light / slate-950 dark
- **Semantic:**
  - Success: emerald-500 (#10b981) — completed sessions, checkmarks
  - Warning: amber-500 (#f59e0b) — current/active windows
  - Error: red-500 (#ef4444) — error states, destructive actions
  - Info: blue-500 (#3b82f6) — informational notices
- **Window states:** emerald (done), amber-500 (current), slate-300 (upcoming)
- **Dark mode:** Class-based (`.dark`). Surfaces darken to slate-950, accent flips to lighter emerald for contrast. All custom properties swap via `.dark` selector
- **Selection:** slate-900/10 on light, white/20 on dark

## Spacing
- **Base unit:** 4px (Tailwind default)
- **Density:** Comfortable. Generous padding on cards and sections, tighter within component groups
- **Card padding:** p-6 (24px) desktop / p-4 (16px) mobile
- **Section gap:** space-y-6 (24px)
- **Inline gap:** gap-3 (12px)
- **Page padding:** px-4 py-8 mobile / px-8 py-14 desktop
- **Safe area:** Bottom padding respects `env(safe-area-inset-bottom)` for PWA/notch devices

## Layout
- **Approach:** Hybrid. Clean single-column for app views, responsive grid for dashboard
- **Max content width:** 1200px
- **Dashboard breakpoints:**
  - Desktop (≥1024px): two-column (hero 60% left, timeline + heatmap 40% right)
  - Tablet (640-1024px): single column, hero with more horizontal padding
  - Mobile (<640px): single column, hero card full-width, sections stack below
- **Session page:** Centered card (max-w-md), no nav bar, no sidebar, no chrome. Full-screen feel on mobile
- **Border radius:** Tailwind defaults. lg: 0.5rem (8px), md: 0.375rem (6px), sm: 0.25rem (4px)
- **Elevation:**
  - Hero card ONLY: shadow-sm + border border-slate-200 dark:border-slate-700
  - Everything else: no shadow, no border (single surface principle)
  - Nav: custom shadow (`shadow-nav` / `shadow-nav-dark`)

## Buttons
- **Primary:** px-6 py-3 rounded-lg font-semibold, emerald bg, white text. Used for main actions (Start Now, Done, Submit)
- **Ghost:** px-4 py-2 transparent, slate text, hover:bg-slate-100. Used for secondary actions
- **Safe exit:** px-4 py-2 slate-200, intentionally muted. Used for "I got interrupted" and similar low-priority escapes
- **All interactive elements:** min 44x44px touch target (WCAG 2.5.8)

## Badges
- **Study type badges:** px-2 py-0.5 rounded-full text-xs font-medium
  - Review: slate-200 bg / slate-700 text
  - New material: emerald-100 bg / emerald-800 text
  - Practice: amber-100 bg / amber-800 text
- **Quick Win:** emerald-100 bg / emerald-800 text, "⚡ Quick Win" — shown for sessions under 10 minutes

## Motion
- **Approach:** Intentional. Animations aid comprehension and provide micro-feedback. Never decorative, never blocking
- **Hero entrance:** Staggered fade-up (`landing-hero-in`), 0.55s ease, 70ms stagger between elements
- **Session completion:** Emerald checkmark with subtle scale-up, "Session logged." in Fraunces. 1s delay before next-window info slides in
- **Easing:** ease (entrance), ease-in (exit), ease-in-out (movement)
- **Duration:** Micro: 50-100ms (hover states). Short: 150-250ms (toggles, badges). Medium: 250-400ms (page transitions). Long: 400-700ms (hero entrance)
- **Haptic:** `navigator.vibrate([100, 50, 100])` on session completion (not supported on iOS Safari, sound-only fallback)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animations, elements appear instantly

## Accessibility
- **Keyboard:** Enter to start/complete sessions, Escape to exit, Tab through interactive elements
- **Screen readers:** aria-live="polite" on timer (announce every minute), descriptive aria-labels on heatmap cells, window status, badges
- **Color contrast:** Emerald-700 on white: 4.76:1 (AA pass). Verify emerald-500 on slate-900 ≥ 4.5:1
- **Touch targets:** All interactive elements min 44x44px, including muted "I got interrupted" button

## Notification Copy
- **Standard window:** Title: time-aware context ("12 min before your next meeting"). Body: topic + type
- **Calendar opened up:** Title: casual, specific ("Your 3pm freed up"). Body: window + topic suggestion. Tone: smart friend, not app nagging
- **Snooze reminder:** Title: simple callback. Body: window still available
- **Weekly digest:** Minimal text email, no heavy HTML template. Subject: "Your week: 5 sessions, 47 minutes." Active week: "Nice week." Quiet week: "Quiet week, no worries."

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-07 | Fraunces + Plus Jakarta Sans | Editorial warmth (Fraunces) paired with clean readability (Jakarta). Distinct from generic SaaS (Inter/Roboto) |
| 2026-04-07 | Emerald accent, restrained palette | Green = progress/go, aligns with "on track" mental model. Single accent prevents visual noise |
| 2026-04-08 | Single-surface dashboard | ADHD-aware: card grids create visual overwhelm. One hero card earns card treatment, rest flows naturally |
| 2026-04-08 | Streak-free progress (ActivityHeatmap) | Anti-Duolingo thesis. Minutes-based shading over 14 days. No streak counter, no punishment for gaps |
| 2026-04-08 | Quiet completion UX | Emerald checkmark + "Session logged." No stats, no comparisons. Micro-dopamine without pressure |
| 2026-04-08 | Intentional motion with reduced-motion support | Staggered entrance adds polish. Reduced-motion override ensures no barriers |
| 2026-04-08 | Design system formalized | Created by /design-consultation from CEO plan + design review decisions |
