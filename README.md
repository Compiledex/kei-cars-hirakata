# Kei cars in Hirakata: relations of relations

**Live map:** https://compiledex.github.io/kei-cars-hirakata/

Assignment 3 for my ethnography class: a visual map of the *relations of relations* around one infrastructure, the kei car (軽自動車), Japan's smallest legal class of car, as I encountered it in Hirakata, Osaka.

The map moves through **four scales**, from small to large:

1. **Hirakata (枚方)**, the street: city hall, the station, Kuzuha Mall, narrow lanes, home charging
2. **Kansai (関西)**, the region: Daihatsu's headquarters and plants, Honda Suzuka, the Port of Osaka, farms and gas stations in Wakayama
3. **Japan (日本)**, the nation: the ministries in Tokyo, the first kei factories, Daihatsu Kyushu, Mizushima, depopulating towns from Shimane to Hokkaido
4. **World (世界)**, the planet: India's Maruti 800, BYD in Shenzhen, kei-truck fights in US states, lithium, nickel and cobalt mines

Pin colours show the six dimensions of the assignment (histories, geographies, infrastructures, social relations, human and environmental realities). Dashed lines are the **relations of relations**: five threads that link places across scales. Pick one under *Legend & connections* to highlight it.

## How to use it

Click the scale tabs at the top, or **Zoom out to …** in the side panel (the arrow keys also work). Click any pin or list item to read about it, follow its connections, use **See it from above** to fly down to the satellite view, or open the exact spot in **Google Earth 3D** or **Street View** (new tab).

Pins marked *representative place* show relations that are not tied to one exact spot.

## Adding photos

- `assets/kei.jpg` appears on the kei car pin.
- `assets/photos/<id>.jpg` appears on any other pin (ids are in `data.js`, e.g. `assets/photos/cityhall.jpg`).

## Tech

Plain HTML/CSS/JS with no build step. [MapLibre GL JS](https://maplibre.org/) 5.24 with globe projection and 3D terrain. Satellite imagery and labels © Esri, Maxar, Earthstar Geographics; elevation from AWS Terrain Tiles; 3D buildings from OpenStreetMap via OpenFreeMap. All content is in `data.js`.
