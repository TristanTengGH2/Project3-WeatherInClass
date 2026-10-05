# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

Help a college student quickly decide what to wear and what to bring (umbrella, sunscreen, water) for today or an upcoming day, without having to interpret raw weather numbers themselves — and make checking back genuinely appealing rather than a chore, through a character whose outfit visibly reflects the forecast.

Defines the need from `research.md`'s user stories:
- The broad daily-decision story (quick recommendation for today/a future date)
- The morning-rush story (fast check before leaving)
- The plan-ahead story (checking a future date the night before)
- The repeat-use/variety story (recommendation feels different each time, stays engaging)

## Screen designs

- **Main screen** (phone + laptop): [`reference/IMG_3102.JPG`](reference/IMG_3102.JPG), refined in [`reference/IMG_3103.JPG`](reference/IMG_3103.JPG) and [`reference/IMG_3104.JPG`](reference/IMG_3104.JPG). Character centered with weather cloud/condition above it, temperature below; UV and wind speed flank the character; a Mon–Sun forecast-day selector; reminders list (e.g., "Dress for rain — jacket, umbrella") on laptop's side panel; a gear icon opens Settings/Info. Zip-code text box + location icon sits top-left on laptop, centered at top on phone (per `IMG_3104.JPG`).
- **Settings/Info screen** (tabbed: Settings | Info): [`reference/IMG_3103.JPG`](reference/IMG_3103.JPG) and [`reference/IMG_3104.JPG`](reference/IMG_3104.JPG), bottom sketch. Settings tab holds a single slider from "cold" to "hot" with 3 discrete positions, plus a °F/°C toggle. Info tab (content not sketched, text-only) holds creator, weather-data source, recommendation methods/sources, privacy practices, and art credits per the brief. The hydration-sensitivity-offset toggle (decided after these sketches) also belongs on the Settings tab, not yet drawn.

## Requirements

Translate every fixed brief requirement and the selected research-driven feature into a testable requirement. Define the chosen behavior, content, controls, current and forecast data, responsive layout, accessibility, error handling, privacy, credits, and deployment. The main screen should make clear the location, date, units, data source, and whether conditions are current or forecast. Include an acceptance check for each requirement.

### Main screen clarity

1. **Location.** A zip-code text box + "use my location" icon button sit top-left on laptop, centered at top on phone (per hand-drawn layout). The current location's name/zip is always visible near the entry point once set. A zip code that isn't a valid 5-digit US zip (or doesn't resolve via Open-Meteo's geocoding) shows small red text directly under the text box reading "Invalid zip code" — text present alongside the red color, not color alone. If the User taps "use my location" and the browser denies/blocks permission, an inline message appears near the location icon reading "Location access denied — enter your zip code instead," and focus moves into the zip text box.
   - *Check:* with a location set, its zip/name is visible on screen without opening any other screen; entering a malformed or non-US zip shows the red error text under the box and does not update the recommendation state; denying the browser's location permission prompt shows the inline message and moves focus to the zip box.
2. **Date / current vs. forecast.** The Mon–Sun day-selector row lets the User pick today or any of the next 6 days. The selected day is visually highlighted (filled/bordered), and a text label elsewhere on the main screen reads "Today" when today is selected, or "Forecast for [Day]" otherwise — never color/highlight alone.
   - *Check:* selecting a non-today day changes the visible label to "Forecast for [Day]"; selecting today changes it back to "Today"; a screen-reader pass confirms the label (not just the highlight) is announced.
3. **Units.** Temperature is shown with its unit (°F or °C, per the Settings toggle) everywhere a temperature appears on the main screen.
   - *Check:* temperature text includes the degree symbol and unit letter, both before and after toggling units in Settings.
4. **Data source.** A small credit line (e.g., "Data: Open-Meteo") appears on the main screen, in addition to the full attribution on the Info tab.
   - *Check:* the credit text is visible on the main screen without navigating away.

### Loading, missing data, and errors

5. **Loading state.** While weather data is being fetched (initial load, or after changing location/date), a semi-transparent white overlay covers the screen with a centered loading spinner, and all controls (text box, buttons, day selector) are disabled/non-interactive until the fetch completes.
   - *Check:* during a fetch, clicking any control has no effect and the overlay + spinner are visible; once data arrives, the overlay disappears and controls respond normally.
6. **Service errors / missing data.** If the Open-Meteo request fails (network error, API error, or a forecast day returns missing required fields), the character/weather area is replaced with an error message (e.g., "Couldn't load the forecast right now.") and a "Retry" button. No recommendation state is shown or guessed at from partial data.
   - *Check:* simulating a failed/blocked request shows the error message and Retry button in place of the character; tapping Retry re-attempts the fetch and, on success, replaces the error with the normal recommendation state.

### Responsive layout and accessibility

7. **One-handed phone use.** Zip text box, location icon, and gear (Settings/Info) icon sit at the top of the phone layout, centered, since they're interacted with rarely (once per session, typically) — keeping them out of the way of the main character/forecast content rather than needing to be within thumb-reach. All touch targets, top or not, remain ≥44×44px.
   - *Check:* on a phone-width viewport, the top controls are each ≥44×44px and reachable with a thumb stretch (not requiring a second hand to steady the device); the day-selector and any frequently-used control are reachable one-handed without top placement being required for those.
8. **Laptop layout.** Uses the larger screen for a side panel (reminders list) alongside the centered character, rather than a stretched/centered copy of the phone layout, per the hand-drawn laptop sketch.
   - *Check:* at laptop width, the reminders list renders as a visible side panel, not stacked below the character as on phone.
9. **Accessibility baseline** (per `research.md`): no color-only signals (every colored state pairs an icon/text label), real text/ARIA for all recommendation content (not baked into images), alt text on all character/icon images describing the state, ≥4.5:1 text/icon contrast. Reduced-motion and keyboard-navigation are explicitly out of scope per the research decision (semantic buttons retain default keyboard operability; no animated transitions are planned).
   - *Check:* a screen-reader pass announces temperature, recommendation text, and reminder text as real content; a color-blindness simulation still allows distinguishing all reminder/severity states via icon+text; a contrast checker confirms ≥4.5:1 on body text and icons.

## Recommendation state and data flow

**Inputs** (from Open-Meteo, for the selected location + date): `apparent_temperature`, UV index, precipitation probability (PoP).

**User preference inputs** (from Settings, device-stored): temperature-sensitivity offset (cold/average/hot → fixed °F offset applied to all 4 band thresholds), a toggle for whether that offset also applies to the hydration reminder threshold (default **off**), display unit (°F/°C, display-only).

**Recommendation rules** (per `research.md`, thresholds in °F before sensitivity offset):
- Outfit category (one of 4), from `apparent_temperature` + sensitivity offset: Cold (<35°F), Cool (35–45°F), Mild (45–55°F), Hot/warm (60°F+).
- Umbrella reminder: active when PoP ≥40% (not temperature-based; sensitivity offset never applies).
- Sun protection reminder: active when UV index ≥3 (not temperature-based; sensitivity offset never applies).
- Hydration reminder: active when `apparent_temperature` ≥80°F, adjusted by the sensitivity offset only if the Settings toggle for it is on. Off by default, since heat risk is safety-driven rather than comfort-driven.

**Shared state:** one recommendation-state object per (location, date) combination holds: the outfit category, which reminders are active, and the randomly-chosen outfit/wording variation indices (see Content variation). The character art, weather icon, written recommendation text, and all active reminder text are all read from this single object — none are computed independently elsewhere.

## Content variation

- Each of the 4 outfit categories has 3 outfit-art variations; each of the 3 reminder types has 3 wording variations.
- When a recommendation state is first computed for a given (location, date) pair, one outfit variation index (1–3) and one wording-variation index (1–3) per *active* reminder are chosen independently at random and stored in that pair's state object.
- Returning to a previously selected date (within the same tab session) reuses the stored state object rather than re-rolling — same outfit variation, same reminder wording.
- Per Developer decision: this persistence is **in-memory only** (lasts as long as the tab stays open); it does not survive a page reload. Only the most-recent *location* persists across reloads (via localStorage, per `research.md`'s privacy decision) — the specific variation shown does not.
- Changing the sensitivity or unit preference does not re-roll variations; it only affects which category/thresholds apply going forward.

## Assets

All visual assets are **AI-generated** (per `research.md`'s decision), PNG format with transparent background, credited as AI-generated art on the Info tab.

| Asset | Count | Appears on |
|---|---|---|
| Character, Cold outfit (3 variations) | 3 | Main screen |
| Character, Cool outfit (3 variations) | 3 | Main screen |
| Character, Mild outfit (3 variations) | 3 | Main screen |
| Character, Hot/warm outfit (3 variations) | 3 | Main screen |
| Weather condition icons (clear, partly cloudy, cloudy, rain, thunderstorm, snow, fog — 7) | 7 | Main screen, near/above character |
| Reminder icons (umbrella, sun protection, hydration) | 3 | Main screen reminder list |
| Settings gear icon | 1 | Main screen |
| Location icon | 1 | Main screen |
| **Total** | **23** | |

Reminder and weather icons use one shared icon-art style (informed by the pixel-icon reference in `reference/`); outfit variations keep the same character design across all 12 so the character stays recognizable (informed by the Duolingo reference). Exact style (e.g., pixel art, or another single style) is left to the generation tool/process at build time, but whichever is chosen must be applied uniformly across all 23 assets — no mixing styles between the character, weather icons, and reminder icons.

## Out of scope

- **Multiple weather providers.** Open-Meteo only, per the brief's "one live weather provider" constraint — no fallback provider if Open-Meteo is down.
- **Forecast beyond 7 days.** Capped at today + 6 days; Open-Meteo's longer-range data is not used, since accuracy degrades past a week (`research.md`).
- **Separate rain/wind outfit category.** Rain and wind surface only as the umbrella reminder, not as distinct outfit art layered on top of the temperature-based outfit.
- **Reduced-motion and keyboard-navigation handling.** No animated transitions are planned, and the interaction model is button-based, so neither gets dedicated implementation effort beyond what semantic HTML provides for free (per `research.md`).
- **Account system / cross-device sync.** No login, no server-side storage; the saved location lives only in that device's browser (localStorage).
- **Per-threshold sensitivity controls.** One combined slider shifts all 4 outfit bands together; no separate sliders per band boundary.
- **Sensitivity offset applied to umbrella/sun-protection reminders.** Those stay fixed (PoP/UV-based, not temperature-based); only the hydration reminder has an opt-in toggle for the sensitivity offset.
- **Offline support / caching weather data for later use.** Each view requires a live fetch; no service worker or offline fallback.

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
