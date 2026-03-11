# Remotion Video Plan: ProducersTeachVideo

## Component Structure

1. **THEME Object**: Extracted directly from `globals.css`
   - `background`: `hsl(0, 0%, 7%)`
   - `foreground`: `hsl(214, 32%, 91%)`
   - `mutedForeground`: `hsl(218, 11%, 65%)`
   - `card`: `hsl(240, 10%, 13%)`
   - `border`: `hsl(0, 0%, 23%)`
   - `orangeAccent`: `hsl(27, 98%, 49%)` (from `--chart-5`)
   - `fontSans`: Outfit (via `@remotion/google-fonts/Outfit`)

2. **FullscreenCaption**: 
   - Shared wrapper component.
   - Handles the full-bleed dark background (`THEME.background`).
   - Centers content vertically and horizontally with `maxWidth: 900px`.
   - Manages the fast 6-frame opacity fade-in and fade-out for each beat.

3. **Text Components**:
   - `HighlightedText`: Parses `<highlight>` tags and applies `THEME.orangeAccent`.
   - `StackedSentences`: Splits text by `.` and renders each sentence on a new line (for Scene 3, Beat 2).

4. **BrandedCard**:
   - Renders the PPR card for Scene 4.
   - Uses `THEME.card` for surface, 1px `THEME.orangeAccent` border, 12px border-radius.
   - Fades in over 12 frames.

## Scene & Frame Breakdown (Total: 2550 frames / ~85s)

**Scene 1 — The Hook (600 frames)**
- Beat 1 (0 - 150): "Most producers think they're not good enough to teach." (48px, bold)
- Beat 2 (150 - 310): "...still feel like <highlight>imposters</highlight>." (40px, regular)
- Beat 3 (310 - 450): "They think they need a Grammy..." (40px, regular)
- Beat 4 (450 - 600): "But that belief keeps talented producers stuck..." (40px, muted, regular)

**Scene 2 — The Shift (420 frames)**
- Beat 1 (600 - 690): "Here's the shift." (56px, bold)
- Beat 2 (690 - 840): "You don't need to be the best in the world to teach." (44px, regular)
- Beat 3 (840 - 1020): "You only need to be <highlight>two steps ahead</highlight> of someone else." (52px, bold)

**Scene 3 — The Proof (660 frames)**
- Beat 1 (1020 - 1190): "If you've been producing for two years..." (40px, regular)
- Beat 2 (1190 - 1350): Stacked sentences: "Cleaning up low end..." (36px, muted, regular)
- Beat 3 (1350 - 1470): "To you that feels basic..." (40px, regular)
- Beat 4 (1470 - 1580): "The gap feels smaller. The steps feel clearer." (44px, medium)
- Beat 5 (1580 - 1680): "...that's <highlight>proof</highlight> you have something worth teaching." (40px, regular)

**Scene 4 — The PPR Reveal (480 frames)**
- Beat 1 (1680 - 1780): "That's actually why I built <highlight>PausePlayRepeat.com</highlight>." (44px, bold) + Card fades in.
- Beat 2 (1780 - 1980): "Instead of answering the same questions..." (40px, regular) + Card remains.
- Beat 3 (1980 - 2160): "PausePlayRepeat handles the platform..." (44px, medium) + Card fades out.

**Scene 5 — CTA + Gut Punch (390 frames)**
- Beat 1 (2160 - 2290): "...<highlight>comment PPR</highlight> and we'll DM you the creator page." (38px, regular)
- Beat 2 (2290 - 2380): "Are you holding back because you think you're not ready…" (44px, muted, regular)
- Beat 3 (2380 - 2460): "or are you ignoring people who are already asking for your help?" (44px, regular)
- Beat 4 (2460 - 2520): "You only need to be <highlight>two steps ahead</highlight>." (52px, bold)
- Beat 5 (2520 - 2550): "That's enough." (56px, bold) - Holds until end.
