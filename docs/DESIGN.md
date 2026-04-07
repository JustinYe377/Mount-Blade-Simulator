<!-- Game design document — core loop definition, feature list, and development priorities -->

## Pass 1 Visual Direction

Visual language established in the first polish pass. All future UI work should stay consistent with these principles.

- **Parchment + iron + heraldry** — dark warm parchment panels (`#1c1810`), bronze/gold borders, faction crests on every marker
- **Muted medieval palette** — desaturated terrain colors with subtle noise variation; no neon or pure primaries; text hierarchy in warm gold / tan / slate
- **Readable map first, realism second** — coastline shadow outlines, forest canopy dots, mountain ridge highlights, and inter-town roads all serve legibility, not photorealism
- **UI consistency over feature quantity** — every panel shares one `panelBg()` path; every clickable element goes through `createStyledButton()` with the same hover/press states; minimap frame matches panel border color
- **No raw debug text** — bracket labels like `[Buy]`, `[Inv]`, `[P]arty` replaced with clean serif-font buttons; section headers use size/color hierarchy instead of emoji prefixes
- **Theme source of truth** — `src/config.js` exports the `THEME` object; `src/ui/Panel.js` exports the four drawing helpers (`drawPanelBg`, `createStyledButton`, `drawMinimapFrame`, `drawMinimapBorder`). Change a color in one place, it propagates everywhere.

## Pass A–E  World Simulation (Bannerlord overworld core)

Basic living-world simulation layer on top of the visual map.

- **Villages as production nodes** — each village (tier 0) is bound to its nearest town/city. Villages generate 1–2 goods per day (`production[]`, rate scales with `prosperity`). `goods` dict accumulates on the village object.
- **Villager parties** — one per village. Carry goods from their village to the `boundTown`, update town stock and recruitPool on delivery, reload cargo and return home. Loop indefinitely. Bandits can raid and loot their cargo.
- **Caravan trade loop** — one caravan per town/city (tier ≥ 1). Loads the highest-stock good from home town (reducing town stock), travels to a random destination, delivers cargo (adding to dest stock, boosting prosperity), picks a new destination and reloads. Creates real supply-demand flow.
- **Lord AI state machine** — lords have four states decided daily: `recruit` (troops < 15 → move to nearest friendly town and hire militia), `defend` (enemy/bandit within 180px of friendly settlement → intercept), `attack` (war faction, 25% chance → move toward enemy territory), `patrol` (default, wander near faction towns). All states drive `npcPickTarget` routing.
- **Faction war/peace** — `FACTION_RELATIONS` matrix in config.js. Kingdom vs Empire vs Rebels at war; Rebels and Bandits at peace with each other. `factionsAtWar(f1,f2)` used by NPC-vs-NPC battle loop and `isHostile()`. Player's faction (`player.faction='Kingdom'`) determines who is a hostile encounter vs who offers trade/social options.
- **Settlement safety** — each settlement has a `safety` value (0–100) that decays when hostile parties are nearby and regenerates daily. Displayed in the town panel.
- **Troop XP and upgrades** — `player.troopXP[id]` accumulates after wins (proportional to enemy losses). Town panel shows an "Upgrade Troops" section with XP progress and a gold cost to promote any ready troop stack to the next tier. Upgrade paths: Villager→Militia→Footman→Man-at-Arms, Scout Cavalry→Light Cavalry→Knight, Archer→Trained Archer→Longbowman.
- **Sell goods in town** — town panel now shows both Buy and Sell buttons. Selling adds stock to the town and boosts prosperity slightly.

## Pass 2 World Realism

Focused improvements to roads, biome coherence, and settlement hierarchy. No new gameplay systems added.

- **Roads** — replaced straight-line roads with terrain-weighted A* routing (`roadAStar`). Water and mountains are expensive/blocked; grass is preferred. Paths are thinned then Chaikin-smoothed (2 passes) before rendering. Cities connect to 3 neighbours, towns to 2, villages to 1 — producing a natural hub-and-spoke road network.
- **Biome coherence** — added two low-frequency macro noise layers to `generateTerrain()`: a moisture layer (scale 0.010, 2 octaves) that shifts the forest/grass threshold over large regions, and a highland layer (scale 0.009, 2 octaves) that adds elevation bias in large zones. Result: large coherent forest belts, open plains regions, and mountain belts instead of scattered noise patches.
- **Settlement hierarchy** — towns carry a `tier` field (0=village, 1=town, 2=city). Faction capitals are cities, mid-range are towns, rebel outposts are villages. Markers differ visually: villages are small 7×7 squares; towns are the Pass 1 castle design; cities are large 14×13 walled keeps with 5 merlons, double glow rings, and a gold cap. Minimap markers scale accordingly. Town panel title shows "Name · City · Faction".
