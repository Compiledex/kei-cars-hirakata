# Kei cars in Hirakata: relations of relations

**Live map:** https://compiledex.github.io/kei-cars-hirakata/

Assignment 3 for my ethnography class: a visual map of the *relations of relations* around one infrastructure, the kei car (軽自動車), Japan's smallest legal class of car, as I encountered it in Hirakata, Osaka.

The map moves through **four scales**, from small to large:

1. **Hirakata (枚方)**, the street: city hall, the station, Kuzuha Mall, narrow lanes, home charging
2. **Kansai (関西)**, the region: Daihatsu's headquarters and plants, Honda Suzuka, the Port of Osaka, farms and gas stations in Wakayama
3. **Japan (日本)**, the nation: the ministries in Tokyo, the first kei factories, Daihatsu Kyushu, Mizushima, depopulating towns from Shimane to Hokkaido
4. **World (世界)**, the planet: India's Maruti 800, BYD in Shenzhen, kei-truck fights in US states, lithium, nickel and cobalt mines

Pin colours show the six dimensions of the assignment (histories, geographies, infrastructures, social relations, human and environmental realities). Glowing gold arcs are the **relations of relations**: five threads that link places across scales. Pick one under *Legend & connections* to highlight it.

## How to use it

Click the scale tabs at the top, or **Zoom out to …** in the side panel (the arrow keys also work). Click any pin or list item to read about it, follow its connections, or use **See it from above** to fly down into the 3D satellite view.

Pins marked *representative place* show relations that are not tied to one exact spot.

## The kei car as the hub

Everything starts with the object: the kei car I photographed in Hirakata (a Honda N-BOX). Every street-scale place links straight to it, and every other place links back to it through the threads. Click any place and its card shows **how it connects to the kei car**, step by step, while that path lights up on the map. The numbers in the side list show how many steps away each place is.

## Photos

- `assets/kei.jpg` is my own field photo of the object.
- Other cards show the lead photo of a related Wikipedia article (Wikimedia Commons), credited on each card. The articles are listed under `photos` in `data.js`.
- To use your own photo for any pin, add `assets/photos/<id>.jpg` (ids are in `data.js`, e.g. `assets/photos/cityhall.jpg`); it takes priority.

## Tech

Plain HTML/CSS/JS with no build step. [MapLibre GL JS](https://maplibre.org/) 5.24 with globe projection and 3D terrain. Satellite imagery and labels © Esri, Maxar, Earthstar Geographics; elevation from AWS Terrain Tiles; 3D buildings from OpenStreetMap via OpenFreeMap. All content is in `data.js`.
