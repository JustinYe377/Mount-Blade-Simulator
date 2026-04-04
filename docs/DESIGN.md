<!-- Game design document — core loop definition, feature list, and development priorities -->

## Pass 1 Visual Direction

Visual language established in the first polish pass. All future UI work should stay consistent with these principles.

- **Parchment + iron + heraldry** — dark warm parchment panels (`#1c1810`), bronze/gold borders, faction crests on every marker
- **Muted medieval palette** — desaturated terrain colors with subtle noise variation; no neon or pure primaries; text hierarchy in warm gold / tan / slate
- **Readable map first, realism second** — coastline shadow outlines, forest canopy dots, mountain ridge highlights, and inter-town roads all serve legibility, not photorealism
- **UI consistency over feature quantity** — every panel shares one `panelBg()` path; every clickable element goes through `createStyledButton()` with the same hover/press states; minimap frame matches panel border color
- **No raw debug text** — bracket labels like `[Buy]`, `[Inv]`, `[P]arty` replaced with clean serif-font buttons; section headers use size/color hierarchy instead of emoji prefixes
- **Theme source of truth** — `src/config.js` exports the `THEME` object; `src/ui/Panel.js` exports the four drawing helpers (`drawPanelBg`, `createStyledButton`, `drawMinimapFrame`, `drawMinimapBorder`). Change a color in one place, it propagates everywhere.
