/* Kei cars in Hirakata — a guided story across scales.
   MapLibre GL JS on satellite imagery with 3D terrain. No build step, no API keys. */
(function () {
const D = window.KEI;
const ORDER = ['hirakata', 'kansai', 'japan', 'world'];
const P = Object.fromEntries(D.places.map(p => [p.id, p]));
const $ = id => document.getElementById(id);
const mobile = () => innerWidth <= 820;
const PANEL_W = 440;

/* ---------- the story: a flat list of steps, outwards from the car ---------- */
const STEPS = [];
ORDER.forEach(v => {
  STEPS.push({ type: 'scale', view: v });
  D.story.order[v].forEach(id => STEPS.push({ type: 'place', view: v, id }));
});
STEPS.push({ type: 'outro', view: 'world' });
const stepOfPlace = Object.fromEntries(STEPS.map((s, i) => [s.id, i]).filter(([k]) => k));
const stepOfScale = Object.fromEntries(STEPS.map((s, i) => [s.type === 'scale' ? s.view : null, i]).filter(([k]) => k));
let step = -1, scale = null;

/* ---------- map style ---------- */
const LABEL = ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']];
const HALO = { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.75)', 'text-halo-width': 1.4, 'text-halo-blur': 0.6 };
const TERRAIN = { source: 'dem', exaggeration: 1.6 };
const style = {
  version: 8,
  projection: { type: 'globe' },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    sat: { type: 'raster', tileSize: 256, maxzoom: 19,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Imagery © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics' },
    dem: { type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 14,
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      attribution: 'Elevation: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a>' },
    omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet',
      attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#16211f' } },
    { id: 'sat', type: 'raster', source: 'sat',
      paint: { 'raster-saturation': -0.12, 'raster-contrast': 0.08, 'raster-brightness-max': 0.92, 'raster-fade-duration': 400 } },
    { id: 'buildings', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 13.5,
      paint: { 'fill-extrusion-color': '#ece6da',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15, 0.72] } },
    { id: 'borders', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['==', ['get', 'admin_level'], 2],
      paint: { 'line-color': 'rgba(255,255,255,0.35)', 'line-width': 0.8 } },
    { id: 'country-labels', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 5,
      filter: ['==', ['get', 'class'], 'country'],
      layout: { 'text-field': LABEL, 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-transform': 'uppercase', 'text-letter-spacing': 0.15 },
      paint: { ...HALO, 'text-color': 'rgba(255,255,255,0.8)' } },
    { id: 'city-labels', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 4.5, maxzoom: 12,
      filter: ['==', ['get', 'class'], 'city'],
      layout: { 'text-field': LABEL, 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 14] },
      paint: HALO },
    { id: 'town-labels', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 9, maxzoom: 15,
      filter: ['match', ['get', 'class'], ['town', 'suburb'], true, false],
      layout: { 'text-field': LABEL, 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
      paint: { ...HALO, 'text-color': 'rgba(255,255,255,0.85)' } }
  ]
};
// Start on the spinning globe (no terrain needed out there).
const map = window._map = new maplibregl.Map({
  container: 'map', style, center: [135.6, 25], zoom: mobile() ? 1.1 : 1.7, pitch: 0, maxPitch: 60,
  attributionControl: { compact: true }
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

/* ---------- geometry ---------- */
function toV([lo, la]) { const a = lo * Math.PI / 180, b = la * Math.PI / 180; return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)]; }
function toLL([x, y, z]) { return [Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI]; }
function arc(A, B, n = 80) {
  const a = toV(A), b = toV(B);
  const om = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = om < 1e-9 ? a : (() => { const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
      return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2]; })();
    pts.push(toLL(p));
  }
  for (let i = 1; i < pts.length; i++) {
    while (pts[i][0] - pts[i - 1][0] > 180) pts[i][0] -= 360;
    while (pts[i][0] - pts[i - 1][0] < -180) pts[i][0] += 360;
  }
  const [x0, y0] = pts[0], [x1, y1] = pts[n];
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, bow = L * 0.14;
  return pts.map(([x, y], i) => { const s = Math.sin(Math.PI * i / n) * bow; return [x - dy / L * s, y + dx / L * s]; });
}

/* ---------- the car as hub: graph of relations ---------- */
const EDGES = [];
Object.values(D.threads).forEach(t => { for (let i = 0; i < t.chain.length - 1; i++) EDGES.push([t.chain[i], t.chain[i + 1]]); });
D.places.filter(p => p.view === 'hirakata' && !p.car).forEach(p => EDGES.push(['car', p.id, 'spoke']));
EDGES.push(['car', 'suzuka', 'spoke']); // the car I photographed is an N-BOX, built at Honda Suzuka
EDGES.push(['car', 'norway', 'spoke']); // where I come from: why I noticed the car at all
const ADJ = {};
EDGES.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || new Set()).add(b); (ADJ[b] = ADJ[b] || new Set()).add(a); });
const PATH = { car: ['car'] };
(function bfs() { const q = ['car'];
  while (q.length) { const x = q.shift(); (ADJ[x] || []).forEach(y => { if (!PATH[y]) { PATH[y] = [...PATH[x], y]; q.push(y); } }); } })();
const steps = id => (PATH[id] ? PATH[id].length - 1 : null);
const fc = f => ({ type: 'FeatureCollection', features: f });
function allLines() {
  const f = [];
  Object.entries(D.threads).forEach(([k, t]) => { for (let i = 0; i < t.chain.length - 1; i++)
    f.push({ type: 'Feature', properties: { thread: k }, geometry: { type: 'LineString', coordinates: arc(P[t.chain[i]].coord, P[t.chain[i + 1]].coord) } }); });
  EDGES.filter(e => e[2] === 'spoke').forEach(([a, b]) =>
    f.push({ type: 'Feature', properties: { thread: 'SPOKE' }, geometry: { type: 'LineString', coordinates: arc(P[a].coord, P[b].coord, 40) } }));
  return fc(f);
}
function pathLines(id) {
  const ids = PATH[id] || [], f = [];
  for (let i = 0; i < ids.length - 1; i++)
    f.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: arc(P[ids[i]].coord, P[ids[i + 1]].coord) } });
  return fc(f);
}

/* ---------- camera ---------- */
function pad() {
  return mobile() ? { top: 60, bottom: innerHeight * 0.48, left: 10, right: 10 } : { left: PANEL_W + 30, top: 70, right: 40, bottom: 30 };
}
// Long flights load far fewer tiles with terrain off; it comes back when the camera lands.
function fly(opts, long) {
  map.stop();
  if (long) map.setTerrain(null);
  map.flyTo({ ...opts, padding: pad(), essential: true });
  map.once('moveend', () => setTimeout(() => {
    if (map.getZoom() > 5) map.setTerrain(TERRAIN); else map.setTerrain(null);
    map.jumpTo({ bearing: map.getBearing() + 0.01 }); map.triggerRepaint();
  }, 150));
}
function camFor(v) { const c = { ...D.views[v].camera }; if (mobile()) c.zoom = D.views[v].mobileZoom; return c; }
function placeCam(p) {
  const c = camFor(p.view);
  const zoom = { hirakata: mobile() ? 13.4 : 14.6, kansai: mobile() ? 8.2 : 9.2, japan: mobile() ? 5.2 : 6.2, world: mobile() ? 1.6 : 2.6 }[p.view];
  return { center: p.coord, zoom, pitch: c.pitch, bearing: p.view === 'world' ? 0 : c.bearing };
}

/* ---------- spinning globe for the opening ---------- */
let spinning = true;
function spin() {
  if (!spinning) return;
  const c = map.getCenter(); c.lng += 10;
  map.easeTo({ center: c, duration: 3000, easing: t => t });
}
map.on('moveend', () => { if (spinning) spin(); });

/* ---------- layers & pins ---------- */
map.on('load', () => {
  try { map.setSky({
    'sky-color': '#7fb0dc', 'horizon-color': '#dfe9f2', 'fog-color': '#d6e2ee',
    'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.5, 'fog-ground-blend': 0.6,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }); } catch (e) {}
  map.addSource('conn', { type: 'geojson', data: allLines() });
  map.addLayer({ id: 'conn-glow', type: 'line', source: 'conn', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffcf5a', 'line-blur': 5, 'line-opacity': 0.3, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 5, 10, 10] } });
  map.addLayer({ id: 'conn', type: 'line', source: 'conn', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffe39a', 'line-opacity': 0.75, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.1, 10, 2.2] } });
  map.addSource('path', { type: 'geojson', data: fc([]) });
  map.addLayer({ id: 'path-glow', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-blur': 6, 'line-opacity': 0.55, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 8, 10, 14] } });
  map.addLayer({ id: 'path', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 10, 4] } });
  addPins();
  loadWikiImages();
  spin();
  const h = stepFromHash();
  if (h !== null) begin(h);
});

const pins = {};
function addPins() {
  D.places.forEach(p => {
    const dim = D.dims[p.dim], el = document.createElement('button');
    el.className = p.car ? 'pin car' : 'pin';
    el.style.setProperty('--c', dim.color);
    el.setAttribute('aria-label', `${p.name}. ${dim.name}`);
    el.innerHTML = p.car ? `<span class="plate">軽</span><span class="lbl">${p.name}</span>` : `<span class="dot"></span><span class="lbl">${p.name}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); if (step < 0) begin(stepOfPlace[p.id]); else go(stepOfPlace[p.id]); });
    pins[p.id] = new maplibregl.Marker({ element: el, anchor: 'left', offset: p.car ? [-18, 0] : [-9, 0] }).setLngLat(p.coord).addTo(map);
  });
}
function setPins(focusIds, selected) {
  Object.entries(pins).forEach(([id, m]) => {
    const el = m.getElement();
    el.classList.toggle('far', P[id].view !== scale && id !== selected);
    el.classList.toggle('dim', !!focusIds && !focusIds.has(id));
    el.classList.toggle('sel', id === selected);
  });
}
let threadFocus = 'ALL';
function lineOpacity(dimmed) {
  const k = threadFocus, t = D.threads[k];
  const base = dimmed ? 0.16 : 0.75, gbase = dimmed ? 0.04 : 0.3;
  map.setPaintProperty('conn', 'line-opacity', t ? ['case', ['==', ['get', 'thread'], k], 1, 0.06] : (k === 'NONE' ? 0 : base));
  map.setPaintProperty('conn-glow', 'line-opacity', t ? ['case', ['==', ['get', 'thread'], k], 0.7, 0.02] : (k === 'NONE' ? 0 : gbase));
}
function showPath(id) {
  map.getSource('path').setData(id && id !== 'car' ? pathLines(id) : fc([]));
  lineOpacity(!!id);
}

/* ---------- story navigation ---------- */
function begin(i) {
  spinning = false; map.stop();
  document.body.classList.add('story');
  $('intro').classList.add('gone');
  go(i == null ? 1 : i, true);
}
function go(i, fromGlobe) {
  i = Math.max(0, Math.min(STEPS.length - 1, i));
  const s = STEPS[i], prevScale = scale;
  step = i; scale = s.view;
  const long = fromGlobe || prevScale !== s.view;
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === scale)));
  $('progress').style.width = ((i + 1) / STEPS.length * 100) + '%';
  $('count').textContent = `${i + 1} / ${STEPS.length}`;
  $('prev').disabled = i === 0;
  $('next').innerHTML = i === STEPS.length - 1 ? 'Start again <span aria-hidden="true">↺</span>' : 'Next <span aria-hidden="true">→</span>';
  try { history.replaceState(null, '', '#step-' + (i + 1)); } catch (e) {}
  if (s.type === 'scale') renderScale(s.view, long);
  else if (s.type === 'place') renderPlace(s.id, long);
  else renderOutro(long);
  $('story').scrollTop = 0;
}
function stepFromHash() { const m = location.hash.match(/^#step-(\d+)$/); return m ? +m[1] - 1 : null; }

function renderScale(v, long) {
  const V = D.views[v], i = ORDER.indexOf(v), [head, sub] = V.title.split(':');
  const here = D.story.order[v];
  $('story').innerHTML = `<div class="chapter">Chapter ${i + 1} of 4 · ${i === 0 ? 'Start with the object' : 'Zooming out'}</div>
    <h2 class="big">${head}<span class="jp">${V.jp}</span></h2><div class="sub">${(sub || '').trim()}</div>
    ${v === 'hirakata' ? `<button class="object" data-go="car"><img src="assets/kei.jpg" alt="The kei car I photographed in Hirakata: a white Honda N-BOX at a crosswalk" onerror="this.parentNode.remove()"><span><small>My object</small>The kei car in Hirakata →</span></button>` : ''}
    <p class="lead">${V.intro}</p>
    <div class="relh">In this chapter</div>
    <ol class="toc">${here.map(id => `<li><button data-go="${id}" style="--c:${D.dims[P[id].dim].color}"><i></i><span><b>${P[id].name}</b><small>${P[id].jp}</small></span>
      <em title="Steps from the kei car">${P[id].car ? '軽' : steps(id)}</em></button></li>`).join('')}</ol>`;
  bind();
  setPins(null, null); showPath(null);
  fly({ ...camFor(v), duration: long ? 3600 : 1800, curve: 1.5 }, long);
}

function renderPlace(id, long) {
  const p = P[id], dim = D.dims[p.dim], V = D.views[p.view];
  const ids = PATH[id] || [];
  let rel = '';
  Object.entries(D.threads).forEach(([k, t]) => {
    const i = t.chain.indexOf(id); if (i < 0) return;
    const nb = []; if (i > 0) nb.push(t.chain[i - 1]); if (i < t.chain.length - 1) nb.push(t.chain[i + 1]);
    rel += `<div class="rel"><span>${t.name}</span>${nb.map(n => `<button data-go="${n}" style="--c:${D.dims[P[n].dim].color}">${P[n].name}</button>`).join('')}</div>`;
  });
  const pathBlock = p.car
    ? `<div class="relh">Start here</div><p class="small">This is the object. Every pin on the map links back to this car: first the street around it, then the region, the nation and the world. Press <b>Next</b> to walk outwards, or click any pin to jump.</p>`
    : `<div class="relh">How it connects to the kei car · ${ids.length - 1} step${ids.length > 2 ? 's' : ''}</div>
      <ol class="path">${ids.map(n => `<li><button data-go="${n}" style="--c:${n === 'car' ? '#f5c518' : D.dims[P[n].dim].color}" ${n === id ? 'aria-current="true"' : ''}>
        ${n === 'car' ? '<span class="mini">軽</span>' : ''}${P[n].name}<small>${D.views[P[n].view].tab}</small></button></li>`).join('')}</ol>`;
  $('story').innerHTML = `<div class="chapter">Chapter ${ORDER.indexOf(p.view) + 1} · ${V.tab} <span class="jp">${V.jp}</span></div>
    <figure class="hero" data-hero="${id}"><div class="shimmer"></div></figure>
    <div class="tag" style="--c:${dim.color}">${dim.name}</div>
    <h2>${p.name}</h2><div class="jp name-jp">${p.jp}</div>
    <p class="body">${p.text}</p>
    ${p.anchor ? '<p class="note">Representative place: this relation is not tied to one exact spot.</p>' : ''}
    ${pathBlock}
    ${rel ? `<div class="relh">Also connected to</div>${rel}` : ''}
    <button class="above" data-above="${id}">See it from above</button>`;
  bind();
  loadPhoto(id, $('story').querySelector('[data-hero]'));
  const on = new Set(p.car ? ['car', ...(ADJ.car || [])] : ids);
  setPins(on, id); showPath(id);
  fly({ ...placeCam(p), duration: long ? 3400 : 1700, curve: 1.4 }, long);
}

function renderOutro(long) {
  const S = D.story.outro;
  $('story').innerHTML = `<div class="chapter">The end of the walk</div>
    <h2 class="big">${S.title}</h2>
    <p class="lead">${S.text}</p>
    <div class="relh">The threads</div>
    <div class="threads">${Object.entries(D.threads).map(([k, t]) => `<button class="thread" data-thread="${k}"><b>${t.name}</b><span>${t.text}</span></button>`).join('')}</div>
    <div class="relh">Rhythms and timeframes</div>
    <ol class="rhythms">${(S.rhythms || []).map(([x, y]) => `<li><b>${x}</b><span>${y}</span></li>`).join('')}</ol>
    <div class="relh">Two ways to read it</div>
    ${Object.values(D.themes).map(t => `<div class="theme"><small>${t.name}</small><b>${t.head}</b><p>${t.body}</p><p class="q">${t.q}</p></div>`).join('')}
    <div class="relh">Questions for further research</div>
    <ul class="questions">${(S.questions || []).map(q => `<li>${q}</li>`).join('')}</ul>`;
  bind();
  setPins(null, null); showPath(null);
  fly({ center: [150, 18], zoom: mobile() ? 0.9 : 1.8, pitch: 0, bearing: 0, duration: long ? 3600 : 2000, curve: 1.4 }, true);
}

function bind() {
  $('story').querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(stepOfPlace[b.dataset.go]));
  $('story').querySelectorAll('[data-thread]').forEach(b => b.onclick = () => setThread(b.dataset.thread));
  $('story').querySelectorAll('[data-above]').forEach(b => b.onclick = () => {
    const p = P[b.dataset.above];
    fly({ center: p.coord, zoom: p.view === 'world' ? 12 : 16.4, pitch: 58, bearing: map.getBearing(), duration: 2800 }, true);
  });
}
function setThread(k) {
  threadFocus = k;
  document.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.t === k)));
  document.querySelectorAll('[data-thread]').forEach(x => x.classList.toggle('on', x.dataset.thread === k));
  lineOpacity(false); map.getSource('path').setData(fc([]));
  const t = D.threads[k];
  $('threadText').innerHTML = t ? `${t.text}<span class="chain">${t.chain.map(id => P[id].name).join(' → ')}</span>` : '';
  if (t) setPins(new Set(t.chain), null);
  else setPins(null, null);
}

/* ---------- card photos ---------- */
// 1) your own photo in assets/ if it exists, 2) otherwise the lead photo of a Wikipedia article (Wikimedia Commons).
const photoCache = {};
function tryImage(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(src); i.onerror = no; i.src = src; }); }
let wikiImages = null;
function loadWikiImages() {
  if (wikiImages) return wikiImages;
  const titles = [...new Set(Object.values(D.photos).flat())], batches = [];
  for (let i = 0; i < titles.length; i += 45) batches.push(titles.slice(i, i + 45));
  wikiImages = Promise.all(batches.map(async list => {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages|info&inprop=url'
      + '&piprop=thumbnail&pithumbsize=960&titles=' + encodeURIComponent(list.join('|'));
    try {
      const j = await (await fetch(url)).json(), q = j.query || {}, out = {};
      const norm = Object.fromEntries((q.normalized || []).map(n => [n.from, n.to]));
      const redir = Object.fromEntries((q.redirects || []).map(n => [n.from, n.to]));
      const byTitle = Object.fromEntries(Object.values(q.pages || {}).map(p => [p.title, p]));
      list.forEach(t => { let k = norm[t] || t; k = redir[k] || k; if (byTitle[k]) out[t] = byTitle[k]; });
      return out;
    } catch (e) { return {}; }
  })).then(parts => Object.assign({}, ...parts));
  return wikiImages;
}
async function findPhoto(id) {
  if (photoCache[id] !== undefined) return photoCache[id];
  const own = id === 'car' ? 'assets/kei.jpg' : `assets/photos/${id}.jpg`;
  try { await tryImage(own); return (photoCache[id] = { src: own, credit: 'Photo: my fieldwork, Hirakata', own: true }); } catch (e) {}
  const imgs = await loadWikiImages();
  for (const title of (D.photos[id] || [])) {
    const pg = imgs[title], src = pg && pg.thumbnail && pg.thumbnail.source;
    if (!src || /\.svg|logo|flag|seal|coat_of_arms|emblem/i.test(src)) continue;
    return (photoCache[id] = { src, credit: `Photo: Wikimedia Commons · <a href="${pg.fullurl || 'https://en.wikipedia.org/wiki/' + title}" target="_blank" rel="noopener">${pg.title}</a>` });
  }
  return (photoCache[id] = null);
}
async function loadPhoto(id, fig) {
  if (!fig) return;
  const ph = await findPhoto(id);
  if (!fig.isConnected) return;
  if (!ph) { fig.remove(); return; }
  const img = new Image();
  img.alt = 'Photo: ' + P[id].name;
  if (ph.own) img.className = 'own';
  img.onload = () => { if (!fig.isConnected) return; fig.innerHTML = ''; fig.appendChild(img); fig.insertAdjacentHTML('beforeend', `<figcaption>${ph.credit}</figcaption>`); };
  img.onerror = () => fig.remove();
  img.src = ph.src;
}

/* ---------- controls ---------- */
$('introTitle').textContent = D.story.title;
$('introSub').textContent = D.story.subtitle;
$('introText').textContent = D.story.welcome;
$('begin').onclick = () => begin(0);
ORDER.forEach((v, i) => {
  const V = D.views[v], b = document.createElement('button');
  b.dataset.view = v; b.setAttribute('role', 'tab');
  b.innerHTML = `<span class="n">${i + 1}</span>${V.tab}<span class="jp">${V.jp}</span>`;
  b.onclick = () => (step < 0 ? begin(stepOfScale[v]) : go(stepOfScale[v]));
  $('tabs').appendChild(b);
});
$('prev').onclick = () => go(step - 1);
$('next').onclick = () => go(step === STEPS.length - 1 ? 0 : step + 1);
$('dimList').innerHTML = Object.values(D.dims).map(d => `<li><i style="--c:${d.color}"></i>${d.name}</li>`).join('');
$('threadList').innerHTML = `<li><button data-t="ALL" aria-pressed="true">All connections</button></li>` +
  Object.entries(D.threads).map(([k, t]) => `<li><button data-t="${k}" aria-pressed="false">${t.name}</button></li>`).join('') +
  `<li><button data-t="NONE" aria-pressed="false">Hide connections</button></li>`;
$('threadList').querySelectorAll('button').forEach(b => b.onclick = () => setThread(b.dataset.t));
$('legendToggle').onclick = () => { const c = $('legend').classList.toggle('collapsed'); $('legendToggle').setAttribute('aria-expanded', String(!c)); };
$('srcList').innerHTML = D.sources.map(([t, u]) => u ? `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>` : `<li>${t}</li>`).join('');
$('bSources').onclick = () => $('modal').classList.add('on');
$('mClose').onclick = () => $('modal').classList.remove('on');
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.remove('on'); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') $('modal').classList.remove('on');
  if (step < 0) { if (e.key === 'Enter' || e.key === 'ArrowRight') begin(0); return; }
  if (e.key === 'ArrowRight') $('next').click();
  if (e.key === 'ArrowLeft' && step > 0) go(step - 1);
});
})();
