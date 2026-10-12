24 PNG assets, generated via ChatGPT image generation, pixel-art style, transparent backgrounds:

- 12 outfit sprites (*-front.png): single front-facing pose, cropped from the original 3-view reference sheets (kept in sheets/ for backup/credit). Temperature groups: cold <35 F, cool 35-45 F, mild 45-55 F, warm 60+ F.
- 7 weather condition icons: clear-sun, partly-cloudy, cloudy, rain, thunderstorm, snow, fog. Snow is a single snowflake. Partly cloudy reuses the clear sun sprite with nearest-neighbor scaling and a cloud overlay.
- 3 reminder icons: umbrella, sunscreen, water.
- 2 UI icons: settings (gear), location (pin).

Backgrounds were originally solid white; converted to transparent via a flood-fill script that clears only the background region connected to the image edges, preserving internal white highlights in the art. Use CSS image-rendering: pixelated when scaling.
