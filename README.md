# Kei cars in Hirakata: relations of relations

**Live map:** https://compiledex.github.io/kei-cars-hirakata/

Assignment 3 for my ethnography class: a visual map of the *relations of relations* around one infrastructure, the kei car (軽自動車), Japan's smallest legal class of car, as I encountered it in Hirakata, Osaka.

The map follows the kei car across:

- **histories and geographies**: the 1949 law that created the class, the factories nearby in Kansai, depopulating villages, US states debating imported kei trucks
- **infrastructures and social relations**: tax, parking rules, gas stations, chargers; households, farmers, factory workers, enthusiasts abroad
- **human and environmental realities**: aging drivers, affordability, safety risk; fuel, batteries, mines and second lives

Markers are relations. The animated lines are four **threads** that link relations to each other across places and scales:

| Thread | What it traces |
|---|---|
| State-made smallness | How a postwar rule still shapes streets and budgets |
| Depopulation | Kei as the replacement for vanishing buses, and what happens when pumps and drivers disappear |
| Carbon & energy | Fuel-saving kei, closing gas stations, the electric kei and the mines behind it |
| Circulation & afterlives | Production in Kansai, the Daihatsu scandal, export and second lives abroad |

## How to use it

Use **Next →** (or the arrow keys) to go through the 13 chapters, which move from the street up to the planet. Click any marker, line or chip to open it. In **Layers** you can focus one thread or hide a dimension.

Some relations (a law, a tax rate) are not tied to one spot. These are pinned to a representative place and labelled **ANCHOR**.

## Adding the field photo

Put the photo at `assets/kei.jpg` and it will appear in chapter 2.

## Tech

Plain HTML/CSS/JS with no build step. [MapLibre GL JS](https://maplibre.org/) with globe projection and 3D buildings, tiles from [OpenFreeMap](https://openfreemap.org/), map data © OpenStreetMap contributors. All content is in `data.js`.
