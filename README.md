# Mount & Blade Simulator — Warbands

A browser-based 2D strategy game inspired by Mount & Blade, built with [Phaser 3](https://phaser.io/). Command a party across a procedurally generated medieval world — recruit troops, trade goods, fight lords, and carve out a kingdom.

## Features

- Procedural overworld terrain with 9 biome types (Perlin noise + FBM)
- Threat-aware A\* pathfinding — NPCs flee stronger parties
- Auto-resolve combat based on troop tier, count, and tactics skill
- Economy simulation — supply/demand, caravan trade routes, daily wages
- Faction & diplomacy system — war, peace, truces, tribute
- Player kingdom — fiefs, policies, clan management
- Quest system with NPC dialogue
- Full save/load via localStorage

## Project Structure

```
Mount-Blade-Simulator/
├── index.html              # Entry point, loads Phaser + main.js
├── src/
│   ├── main.js             # Phaser game config and boot
│   ├── config.js           # Global constants and balance numbers
│   ├── scenes/             # Phaser scenes (World, Town, Battle, Menu, etc.)
│   ├── systems/            # Core systems (combat, economy, pathfinding, save, etc.)
│   ├── entities/           # Party classes (Player, Lord, Bandit, Caravan, etc.)
│   ├── models/             # Data models (Troop, Item, Town, Faction, etc.)
│   ├── ai/                 # AI decision trees (Lord, Bandit, Diplomacy, Economy)
│   ├── ui/                 # UI components (HUD, panels, minimap, tooltips)
│   ├── world/              # Terrain generation and map placement
│   └── utils/              # Shared math, noise, and event bus
├── data/                   # JSON data files (troops, items, factions, dialogue, etc.)
├── assets/                 # Sprites, audio, fonts, UI frames
├── docs/                   # Design doc, roadmap, systems notes, balance sheet
└── tools/map-editor/       # Future browser-based map editor
```

## Getting Started

Just open `index.html` in a browser — no build step required.

> For local development a simple HTTP server is recommended to avoid CORS issues with asset loading:
> ```bash
> npx serve .
> ```

## Tech Stack

- [Phaser 3](https://phaser.io/) — game framework
- Vanilla JavaScript (ES6+)
- No build tools required

## Docs

- [DESIGN.md](docs/DESIGN.md) — core loop, features, priorities
- [ROADMAP.md](docs/ROADMAP.md) — milestone plan
- [SYSTEMS.md](docs/SYSTEMS.md) — technical notes per system
- [BALANCE.md](docs/BALANCE.md) — troop stats and economy tuning
