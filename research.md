# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

Used across several recurring moments in a college student's day, on both phone and laptop:
- Morning routine, still half-awake, deciding what to wear before leaving the dorm/apartment.
- Between classes, on the phone, quick check when conditions might be changing (temperature swing, incoming rain).
- Night before, on a laptop or phone, planning ahead to lay out clothes for tomorrow.

Motivation is twofold, not purely utilitarian: (1) genuine need for guidance because Texas/college-town weather can swing significantly within a day, and it's easy to misjudge how many layers or whether to grab an umbrella from raw numbers alone; (2) the character and outfit visualization is part of the appeal — a plain forecast wouldn't be opened as often. Assumption: the User already trusts one weather provider's data and wants it translated into a decision, not a research task.

## User story

> As a college student choosing what to wear, I want a quick, at-a-glance recommendation for today's or a future day's outfit and reminders based on the weather forecast, so that I don't have to interpret raw numbers myself and don't get caught underdressed, overheated, or without an umbrella/sunscreen/water.

> As a student getting ready in the morning, I want a fast recommendation before I leave, so that I don't have to check multiple things (temperature, rain chance, wind) myself while I'm rushed.

> As a student packing for tomorrow, I want to check a future date's forecast and recommendation, so that I can lay out clothes the night before.

> As a student who checks the app daily, I want the character and outfit to feel a little different each time even for similar weather, so the app stays engaging rather than repetitive.

## References

Collect 5–10 reference images from relevant products and interfaces. Save each image in `reference/`, identify its source, and record a brief observation about what is useful, ineffective, or relevant to this project. Reference images are examples only; do not use them in the app.

1. **`reference/Screenshot 2026-09-28 at 4.54.32 PM.png`** — Stardew Valley character-creation screen. Live character preview updates immediately as sliders/arrows change skin, hair, shirt, pants, and colors. Useful: instant visual feedback tied directly to a control, which is the same pattern our recommendation state needs (one state change → character updates immediately). Less relevant: the manual customization itself — our character's appearance is driven by weather data, not free user choice.
2. **`reference/Screenshot 2026-09-28 at 5.01.47 PM.png`** — a game's "Character Creation" screen (ACC) with a two-panel layout: controls on the left/center, live preview on the right. Useful: clean separation between controls and character display, and a small full-body preview alongside a larger face/detail preview — could inform showing the character next to a compact recommendation summary.
3. **`reference/Screenshot 2026-09-28 at 5.03.25 PM.png`** — pixel-art weather icon set (sun, partly cloudy, cloudy, rain, thunderstorm, snow, wind, rainbow, moon+stars). Useful: consistent stroke weight and palette across all icons in one style/family — a good model for our own weather-icon set, and confirms icons alone (no color-only reliance) can distinguish conditions, supporting the accessibility decision above.
4. **`reference/Screenshot 2026-09-28 at 5.07.25 PM.png`** — Duolingo's owl mascot shown in 8 distinct emotional/state poses (happy, shy, unimpressed, tired, in love, singing, angry, crying), same character throughout. Useful: directly relevant model for "one character, many states" — proves a single simple character design can stay recognizable across many expressive variations, which is exactly what the outfit-variation requirement needs. Ineffective for us as-is: these are mood/expression variants, not clothing/outfit variants, so it's a style/consistency reference, not a literal template.
5. **`reference/30785-1736614468-847371284.webp`** — Stardew Valley screenshot of four different characters wearing rain gear (umbrellas, hoods, rain hats) during in-game rain. Useful: direct precedent for "outfit changes because of weather," and shows variety is achievable even within one game's art style (different hats/umbrella colors read as distinct without changing the whole character). Relevant limitation: these are player-chosen cosmetics, not weather-driven automatically, so it's a visual-variety reference rather than a data-driven-state reference.

Reference images are examples only and will not be reused in the app; the app's own art will follow the artwork-approach decision above once finalized.

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

### Accessibility

Interaction model is button-based throughout, aside from one text entry (zip code), which narrows what's load-bearing:

- **No color-only signals** — every reminder/severity state (rain, heat, cold) pairs an icon and text label with color, never color alone.
- **Real text, not text-in-images** — recommendation, temperature, and reminder content is real text/ARIA, not baked into the character or icon images, so screen readers and text-zoom work.
- **Alt text on all icons/character art** — describes the state (e.g., "light rain," "character wearing rain jacket"), not just "icon."
- **Touch target size** — buttons ≥44×44px, since one-handed phone use is already a brief requirement.
- **Contrast** — text/icons ≥4.5:1 against backgrounds.

Excluded from scope: reduced-motion handling and explicit keyboard-navigation work. Semantic `<button>` elements get basic keyboard operability for free, so no extra effort is being budgeted for it beyond using real buttons; no animated transitions are planned, so reduced-motion has nothing to guard against right now. Revisit both if outfit-change animations or a non-button control get added later.

### Weather provider

Brief constraint (`brief.md`): current and forecast data must come from **one** live weather provider — ruling out combining providers even for a single variable like UV index.

Options compared:

| Provider | Cost / key | Coverage | UV index | Attribution |
|---|---|---|---|---|
| [National Weather Service](https://weather-gov.github.io/api/) (`api.weather.gov`) | Free, no API key, no published rate limit | US only | Not available in the core forecast API | None required |
| [Open-Meteo](https://open-meteo.com/) | Free (non-commercial), no API key, 10,000 calls/day | Global (incl. US) | Included | CC BY 4.0 credit line |
| [OpenWeatherMap](https://openweathermap.org/full-price) | Free tier, requires email signup + API key | Global | Included (One Call product) | ODbL — attribution *and* share-alike |
| [WeatherAPI.com](https://www.weatherapi.com/) | Free tier, requires API key | Global | Included | Link-back attribution required |

Every UV-capable free option requires attribution; NWS is the only attribution-free option but has no UV index endpoint. Since the brief already requires an info screen crediting the weather-data source, attribution is not extra overhead.

### Apparel guidance

- [NWS — Understanding Wind Chill](https://www.weather.gov/safety/cold-wind-chill-chart): official formula and chart mapping air temperature + wind speed to "feels-like" temperature and frostbite exposure time. Only defined for ≤50°F and wind >3 mph. Authoritative for a *safety* floor (e.g., when to flag "extra layer" or a cold-weather warning), but doesn't map to clothing categories itself.
- General layering guides (e.g., [Fit The Forecast](https://fittheforecast.com/blog/what-to-wear-by-temperature)): informal consensus, not a single authoritative source, but converges on similar bands assuming dry, low-wind, brief outdoor exposure:
  - ~60°F+: one light layer (t-shirt/light long-sleeve), light jacket optional if windy/overcast
  - ~45–55°F: two layers (base + real jacket)
  - ~35–45°F: three layers (base, mid, insulated/wind-resistant outer)
  - <35°F: heavy coat, non-negotiable extra layers
  - Wind and rain shift the effective band down (a windy/wet 55°F dresses like ~48°F); full sun shifts it up.

**Limitation:** the layering bands come from lifestyle/fashion sources, not a peer-reviewed or governmental standard — treat them as a reasonable starting point for category boundaries, not a precise rule. The wind chill chart is the one authoritative, safety-grade number available and is the better anchor for a "cold" threshold specifically.

**Decision:** Open-Meteo — no signup/API key friction, sufficient free daily call volume, includes UV index (needed for sunscreen reminders) alongside current/forecast data in the same single-provider call, and its geocoding companion API covers location lookup. Attribution requirement (CC BY 4.0 credit line) is satisfied by the info screen the brief already requires.

### Reminder and accessory thresholds

- [EPA — UV Index Scale](https://www.epa.gov/sunsafety/uv-index-scale-0): 1–2 Low, 3–5 Moderate, 6–7 High, 8–10 Very High, 11+ Extreme. SPF 30+ recommended starting at Moderate (3+); EPA also recommends hat/sunglasses/shade as part of sun protection, not just sunscreen — so UV index can drive an accessory (sunglasses/hat) as well as a sunscreen reminder.
- [NWS — Heat Forecast Tools / Heat Index](https://www.weather.gov/safety/heat-index): heat index ≥103°F is NWS "Danger" (heat exhaustion likely, heat stroke possible); lower bands step down through "Extreme Caution" and "Caution" with hydration guidance ("drink water frequently, even if not thirsty" scaling up to "10 gulps every 20 minutes" at Danger). Heat index assumes shade/light wind — full sun can add up to 15°F, relevant since Open-Meteo's `apparent_temperature` (its feels-like value, combining heat index and wind chill into one field) is the practical field to threshold against rather than raw air temperature.
- [NWS — Probability of Precipitation (PoP)](https://www.weather.gov/bgm/forecast_terms): a "40% chance of rain" means 40% confidence *some* measurable rain (≥0.01in) falls somewhere in the forecast area — not "it will rain 40% of the time." Useful for setting an umbrella-reminder threshold (e.g., trigger at PoP ≥ some cutoff), but it's a probability, not a certainty, so the reminder should be framed as "chance of rain" rather than an absolute statement.

**Thresholds (decided):**
- Umbrella reminder: PoP ≥40% for the selected day.
- Sunscreen + sunglasses/hat accessory: UV index ≥3 (Moderate) — directly EPA's own scale boundary.
- Hydration reminder: apparent temperature ≥80°F — catches early NWS heat-index caution, not just extreme danger.

**Limitation:** EPA/NWS scales are authoritative for *what the numbers mean and general safety guidance*, but they don't prescribe a single "correct" app-reminder cutoff — the draft thresholds above are a reasonable interpretation, and exact cutoffs are a Decision to finalize, not a research fact.

### Privacy

- [MDN — Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) and general best-practice guidance: the browser itself requires explicit user permission before releasing device location, so consent is enforced by the platform, not just the app. Best practice is to request location only on explicit user action (e.g., tapping "use my location"), not automatically on page load, and to make manual entry (zip code) an equally easy alternative — which the brief already requires.
- Disclosure norms (privacy-law and API-practice sources): apps should clearly state what location data is collected, why, how long it's kept, and whether it's sent anywhere — content that belongs on the brief-required info screen's privacy section.
- [Cookies vs. localStorage comparison](https://www.geeksforgeeks.org/javascript/local-storage-vs-cookies/): localStorage is browser/device-only and never automatically transmitted to a server, unlike cookies. Since the brief requires saving only the most recent location *on the device*, localStorage (not a server database or cookie) is the fitting mechanism — it keeps the "on device only" promise literally true because there is no server involved to send it to.

**Decision (privacy):** No backend/server component for this app — the browser calls Open-Meteo directly, and the only persisted data (most recent location) lives in the device's localStorage, never transmitted or stored elsewhere. Location is requested only when the User chooses "use my location," with manual zip entry always available as the alternative. The info screen states this plainly (no account, no server storage, no data shared beyond the weather API call itself).

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

**Weather provider:** Open-Meteo (see Weather provider subsection above).

**Forecast range:** 7 days (today + 6 days ahead). Matches typical weekly-forecast expectations and keeps the date picker simple; forecast accuracy degrades notably past a week, so extending to Open-Meteo's full 16-day max risked showing a confident-looking recommendation off of low-confidence data.

**Deployment method:** GitHub Pages, per the brief's recommendation. Free static hosting with HTTPS by default, and fits the no-backend architecture already decided under Privacy — the client calls Open-Meteo directly, so no server is needed regardless of host.

**Recommendation categories (decided):**
- Temperature bands (4), outfit only, driven by `apparent_temperature`: Hot/warm (60°F+), Mild (45–55°F), Cool (35–45°F), Cold (<35°F). These conventional bands are the **default**.
- Rain/wind is a reminder, not a separate outfit category — keeps categories at 4, not multiplied.
- Reminder types (3): Umbrella (PoP-driven), Sun protection — sunscreen + sunglasses/hat bundled (UV-index-driven), Hydration (apparent-temperature-driven).

**One additional feature (decided): user-adjustable temperature sensitivity.** A simple preference (e.g., "runs cold / average / runs hot") shifts the default band thresholds by an offset, since personal cold/heat tolerance varies and a fixed band doesn't fit everyone equally. Persisted on-device (localStorage) alongside the saved location. Satisfies the brief's "one additional feature justified by research" requirement. Exact control type (toggle vs. slider) and offset amounts are a `spec.md` detail.

**Art estimate (draft):**
- Character + outfits: 4 categories × 3 variations = 12 outfit images (or 1 base character + 12 sets of swappable clothing layers, depending on build approach).
- Weather icons: ~6–8, covering Open-Meteo's main condition groups (clear, partly cloudy, cloudy, rain, thunderstorm, snow, fog).
- Reminder icons: 3 (umbrella, sun protection, hydration) — icon stays fixed per reminder type; only the wording varies across the 3 required text variations.
- Total: roughly 21–23 unique visual assets.

**Artwork approach (decided):** AI-generated. Chosen over hand-drawn/licensed given the ~21–23-asset volume — a single consistent prompt/style template (informed by the Duolingo and pixel-icon references above) is the fastest way to hit that count while keeping the character recognizable across all 12 outfit variants. Requires care to keep the character consistent across generations (fixed character description and/or reference image per generation); credited as AI-generated art on the info screen.

**Deferred to `spec.md`:** screen structure, visual direction, and the one additional feature depend on the hand-drawn phone/laptop screen designs the brief requires for specification — these will be defined there rather than guessed at here.

## Revisions

Record new evidence or changed decisions and explain why they changed.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
