# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

**Structure:** Static site, plain HTML/CSS/JS, no build step, no backend — deploys directly to GitHub Pages. Rough file layout: `index.html`, `styles.css`, a few JS modules (API/geocoding calls, recommendation-rule logic, rendering, state/persistence), and an `assets/` folder for the 23 art files.

**Data flow:** User sets a location (zip entry or "use my location") → resolved to lat/lon via Open-Meteo's geocoding API → forecast fetched from Open-Meteo for 7 days (`apparent_temperature`, UV index, PoP) → for the selected (location, date), a recommendation-state object is computed (outfit category, active reminders, randomly-chosen variation indices) per the rules in `spec.md` → every visual/text element on the main screen renders from that one state object. Settings (sensitivity offset, hydration-offset toggle, display unit) and the most-recent location persist in `localStorage`; the per-date variation state is in-memory only (per `spec.md`).

**Dependencies:** Open-Meteo (forecast + geocoding endpoints, single provider, no API key), browser Geolocation API, `localStorage`, GitHub Pages for hosting. No external JS libraries required.

**Task order (high level):** get a minimal deploy pipeline working first (so GitHub Pages is never a last-minute blocker) → build the weather/geocoding integration and its loading/error states, since everything else depends on live data → build the recommendation-rule engine and variation logic against placeholder art, so logic can be tested before final assets exist → wire the main screen UI to that state → build the Settings/Info tabbed screen → add persistence (localStorage) → accessibility and responsive/one-handed passes → swap in final AI-generated assets → full requirement verification against `spec.md` → usability testing → one revision → final redeploy. Asset creation itself can run in parallel starting early, since it doesn't block logic work.

**Main risks:**
- Keeping AI-generated art visually consistent across all 12 outfit variants + 10 icons (flagged in `research.md`) — may take several generation passes.
- Open-Meteo is a single point of failure by design (brief requires one provider, no fallback) — error-state handling needs to be solid rather than an afterthought.
- Zip-code → lat/lon geocoding accuracy for less common US zips.
- Keeping recommendation logic centralized in one state object rather than letting individual UI pieces compute their own version of "what to show."

## Checklist

### Approvals

- [ ] Research approved
- [ ] Specification approved
- [ ] Plan approved

### Build

- [ ] Create or source the assets listed in `spec.md`, starting early (runs in parallel with the tasks below)
- [ ] Scaffold the static site (`index.html`, `styles.css`, JS modules) and deploy an empty/placeholder page to GitHub Pages, so the deploy pipeline is proven before any feature work
- [ ] Build the Open-Meteo geocoding + forecast fetch (zip → lat/lon → 7-day forecast with `apparent_temperature`, UV index, PoP), with the loading overlay and service-error/retry states from `spec.md`
- [ ] Build the recommendation-rule engine: temperature-band categories, reminder thresholds, sensitivity offset (incl. hydration toggle), unit conversion — testable against placeholder art before final assets exist
- [ ] Build in-memory per-(location, date) state with independent random variation selection and reuse-on-reselect, per `spec.md`'s Content variation section
- [ ] Build the main screen UI (character, weather icon, temperature, reminders, Mon–Sun forecast selector, zip box + location icon) wired to the recommendation state, using the approved screen drawings for layout
- [ ] Build the Settings/Info tabbed screen (sensitivity slider, hydration-offset toggle, units toggle, Info tab content: creator, data source, recommendation methods, privacy, art credits) — include the hydration-sensitivity toggle flagged as a build-time addition not shown in the sketches
- [ ] Add `localStorage` persistence for the saved location and Settings preferences
- [ ] Implement the invalid-zip and location-permission-denied messaging from `spec.md`
- [ ] Pass: accessibility baseline (no color-only signals, real text/ARIA, alt text, contrast, touch targets)
- [ ] Pass: responsive layout (laptop side panel vs. phone stacked layout, one-handed phone reachability)
- [ ] Swap in final AI-generated assets once ready, confirming consistent style across all 23
- [ ] Test and fix each checkpoint against the specification before starting the next
- [ ] Commit meaningful working checkpoints
- [ ] Deploy to a public HTTPS URL (GitHub Pages)

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [ ] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [ ] Verify that returning to a previously selected date shows the same variations
- [ ] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

## Usability testing

**Purpose:** Confirm the recommendation (character, weather, reminders) reads clearly at a glance, the location/date controls are discoverable without instruction, and the Settings/Info screen doesn't get lost behind the gear icon.

**Tasks (given to each tester, one at a time, no further hints unless they're fully stuck):**
1. "Find out what the weather app recommends you wear today." (tests: discoverability of the main recommendation, whether it reads as one clear answer)
2. "Check what it recommends for [a specific day later this week]." (tests: forecast-day selector discoverability, current-vs-forecast clarity)
3. "Set your location to a zip code of your choice." (tests: zip entry flow, including recovering from a typo if one happens naturally)
4. "Find out where the weather data comes from." (tests: Info tab discoverability)
5. "You run warmer than most people — see if there's a way to tell the app that." (tests: Settings discoverability, sensitivity slider comprehension)

**Non-leading prompts if a tester hesitates:** "What would you try next?" / "What are you looking for?" — never "Have you tried the gear icon?" or similar.

**Note format (per session):** non-identifying label (e.g., "Tester 1"), then for each task: what they did/said, whether they succeeded, any barrier or question they voiced, and any change the Developer is considering as a result — kept in a separate column/line from the raw observation, not blended into it.

After all three sessions, summarize the strongest findings and the improvement they support.

## Revisions

Record material plan changes and why they were made.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
