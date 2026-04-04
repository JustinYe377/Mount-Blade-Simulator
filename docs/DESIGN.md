<!-- Game design document — core loop definition, feature list, and development priorities -->

## Pass 1 Visual Direction

Visual language established in the first polish pass. All future UI work should stay consistent with these principles.

- **Parchment + iron + heraldry** — dark warm parchment panels (`#1c1810`), bronze/gold borders, faction crests on every marker
- **Muted medieval palette** — desaturated terrain colors with subtle noise variation; no neon or pure primaries; text hierarchy in warm gold / tan / slate
- **Readable map first, realism second** — coastline shadow outlines, forest canopy dots, mountain ridge highlights, and inter-town roads all serve legibility, not photorealism
- **UI consistency over feature quantity** — every panel shares one `panelBg()` path; every clickable element goes through `createStyledButton()` with the same hover/press states; minimap frame matches panel border color
- **No raw debug text** — bracket labels like `[Buy]`, `[Inv]`, `[P]arty` replaced with clean serif-font buttons; section headers use size/color hierarchy instead of emoji prefixes
- **Theme source of truth** — `src/config.js` exports the `THEME` object; `src/ui/Panel.js` exports the four drawing helpers (`drawPanelBg`, `createStyledButton`, `drawMinimapFrame`, `drawMinimapBorder`). Change a color in one place, it propagates everywhere.

## Pass 2 World Realism

Focused improvements to roads, biome coherence, and settlement hierarchy. No new gameplay systems added.

- **Roads** — replaced straight-line roads with terrain-weighted A* routing (`roadAStar`). Water and mountains are expensive/blocked; grass is preferred. Paths are thinned then Chaikin-smoothed (2 passes) before rendering. Cities connect to 3 neighbours, towns to 2, villages to 1 — producing a natural hub-and-spoke road network.
- **Biome coherence** — added two low-frequency macro noise layers to `generateTerrain()`: a moisture layer (scale 0.010, 2 octaves) that shifts the forest/grass threshold over large regions, and a highland layer (scale 0.009, 2 octaves) that adds elevation bias in large zones. Result: large coherent forest belts, open plains regions, and mountain belts instead of scattered noise patches.
- **Settlement hierarchy** — towns carry a `tier` field (0=village, 1=town, 2=city). Faction capitals are cities, mid-range are towns, rebel outposts are villages. Markers differ visually: villages are small 7×7 squares; towns are the Pass 1 castle design; cities are large 14×13 walled keeps with 5 merlons, double glow rings, and a gold cap. Minimap markers scale accordingly. Town panel title shows "Name · City · Faction".
