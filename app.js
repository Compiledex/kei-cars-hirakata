/* Kei cars in Hirakata — a map across scales.
   MapLibre GL JS on satellite imagery with 3D terrain. No build step, no API keys. */
(function () {
const D = window.KEI;
const ORDER = ['hirakata', 'kansai', 'japan', 'world'];
const P = Object.fromEntries(D.places.map(p => [p.id, p]));
const $ = id => document.getElementById(id);
const mobile = () => innerWidth <= 820;
let current = null;

/* ---------- map style ---------- */
const LABEL = ['coalesce', ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']];
const HALO = { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.75)', 'text-halo-width': 1.4, 'text-halo-blur': 0.6 };
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
  terrain: { source: 'dem', exaggeration: 1.6 },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#04060b' } },
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
const map = window._map = new maplibregl.Map({
  container: 'map', style, center: [150, 20], zoom: 1.1, maxPitch: 60,
  attributionControl: { compact: true }
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

/* ---------- connection arcs ---------- */
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
function lines() {
  const f = [];
  Object.entries(D.threads).forEach(([k, t]) => {
    for (let i = 0; i < t.chain.length - 1; i++)
      f.push({ type: 'Feature', properties: { thread: k },
        geometry: { type: 'LineString', coordinates: arc(P[t.chain[i]].coord, P[t.chain[i + 1]].coord) } });
  });
  return { type: 'FeatureCollection', features: f };
}

map.on('load', () => {
  try { map.setSky({
    'sky-color': '#7fb0dc', 'horizon-color': '#dfe9f2', 'fog-color': '#d6e2ee',
    'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.5, 'fog-ground-blend': 0.6,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }); } catch (e) {}
  map.addSource('conn', { type: 'geojson', data: lines() });
  map.addLayer({ id: 'conn-glow', type: 'line', source: 'conn', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffcf5a', 'line-blur': 5, 'line-opacity': 0.35,
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 5, 10, 10] } });
  map.addLayer({ id: 'conn', type: 'line', source: 'conn', layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffe39a', 'line-opacity': 0.9,
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 10, 2.4] } });
  addPins();
  setView(viewFromHash() || 'hirakata', 6500);
  setTimeout(() => $('intro').classList.add('gone'), 3800);
});

/* ---------- pins ---------- */
const pins = {};
function addPins() {
  D.places.forEach(p => {
    const dim = D.dims[p.dim];
    const el = document.createElement('button');
    el.className = p.car ? 'pin car' : 'pin';
    el.style.setProperty('--c', dim.color);
    el.setAttribute('aria-label', `${p.name}. ${dim.name}`);
    el.innerHTML = p.car
      ? `<span class="plate">軽</span><span class="lbl">${p.name}</span>`
      : `<span class="dot"></span><span class="lbl">${p.name}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); openPlace(p.id); });
    pins[p.id] = new maplibregl.Marker({ element: el, anchor: 'left', offset: p.car ? [-18, 0] : [-9, 0] }).setLngLat(p.coord).addTo(map);
  });
}

/* ---------- views ---------- */
function setView(v, duration = 3200) {
  current = v;
  const V = D.views[v];
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === v)));
  Object.entries(pins).forEach(([id, m]) => m.getElement().classList.toggle('far', P[id].view !== v));
  popup.remove();
  const here = D.places.filter(p => p.view === v);
  const i = ORDER.indexOf(v), next = ORDER[i + 1];
  const [head, sub] = V.title.split(':');
  $('side').innerHTML = `<div class="step">Scale ${i + 1} / 4</div>
    <h2>${head}<span class="jp">${V.jp}</span></h2>
    <div class="sub">${(sub || '').trim()}</div>
    <p>${V.intro}</p>
    <ul class="places">${here.map(p => `<li><button data-place="${p.id}" style="--c:${D.dims[p.dim].color}"><i></i>
      <span><b>${p.name}</b><small>${p.jp}${p.anchor ? ' · representative place' : ''}</small></span></button></li>`).join('')}</ul>
    <button class="next" id="nextScale">${next ? `Zoom out to ${D.views[next].tab} <span aria-hidden="true">→</span>` : 'Back to Hirakata <span aria-hidden="true">↺</span>'}</button>`;
  $('side').querySelectorAll('[data-place]').forEach(b => b.onclick = () => openPlace(b.dataset.place, true));
  $('nextScale').onclick = () => setView(next || 'hirakata');
  $('side').scrollTop = 0;
  try { history.replaceState(null, '', '#' + v); } catch (e) {}
  const cam = { ...V.camera };
  if (mobile()) cam.zoom = V.mobileZoom;
  map.flyTo({ ...cam, duration, curve: 1.6, essential: true,
    padding: mobile() ? { top: 0, bottom: innerHeight * 0.35, left: 0, right: 0 } : { left: 420, top: 40, right: 0, bottom: 0 } });
  settleAfterMove();
}
// After a long flight with 3D terrain, nudge the camera once so terrain tiles refresh.
function settleAfterMove() {
  map.once('moveend', () => setTimeout(() => { map.jumpTo({ bearing: map.getBearing() + 0.01 }); map.triggerRepaint(); }, 250));
}
function viewFromHash() { const h = location.hash.slice(1); return ORDER.includes(h) ? h : null; }

/* ---------- place popup ---------- */
const popup = new maplibregl.Popup({ maxWidth: '380px', offset: 20, closeButton: true, focusAfterOpen: false, className: 'glass-pop' });
function openPlace(id, pan) {
  const p = P[id], dim = D.dims[p.dim];
  if (p.view !== current) setView(p.view, 2400);
  else if (pan) map.easeTo({ center: p.coord, duration: 900 });
  let rel = '';
  Object.entries(D.threads).forEach(([k, t]) => {
    const i = t.chain.indexOf(id); if (i < 0) return;
    const nb = [];
    if (i > 0) nb.push(t.chain[i - 1]);
    if (i < t.chain.length - 1) nb.push(t.chain[i + 1]);
    rel += `<div class="rel"><span>${t.name}</span>${nb.map(n => `<button data-go="${n}" style="--c:${D.dims[P[n].dim].color}">${P[n].name}</button>`).join('')}</div>`;
  });
  const photo = p.car ? 'assets/kei.jpg' : `assets/photos/${p.id}.jpg`;
  const html = `<div class="pop" style="--c:${dim.color}">
    <div class="tag">${dim.name}</div>
    <h3>${p.name}</h3><div class="jp">${p.jp}</div>
    <img src="${photo}" alt="Photo: ${p.name}" onerror="this.remove()">
    <p>${p.text}</p>
    ${p.anchor ? '<p class="note">Representative place: this relation is not tied to one exact spot.</p>' : ''}
    ${rel ? `<div class="relh">Connected to</div>${rel}` : ''}
    <button class="zoom" data-zoom="${id}">See it from above</button></div>`;
  setTimeout(() => {
    popup.setLngLat(p.coord).setHTML(html).addTo(map);
    const el = popup.getElement();
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => openPlace(b.dataset.go, true));
    el.querySelector('[data-zoom]').onclick = () => { map.flyTo({ center: p.coord, zoom: p.view === 'world' ? 12 : 16.2, pitch: 58,
      bearing: map.getBearing(), duration: 2800, essential: true }); settleAfterMove(); };
  }, p.view !== current ? 2500 : 0);
}

/* ---------- controls ---------- */
ORDER.forEach((v, i) => {
  const V = D.views[v], b = document.createElement('button');
  b.dataset.view = v; b.setAttribute('role', 'tab');
  b.innerHTML = `<span class="n">${i + 1}</span>${V.tab}<span class="jp">${V.jp}</span>`;
  b.onclick = () => setView(v);
  $('tabs').appendChild(b);
});
$('dimList').innerHTML = Object.values(D.dims).map(d => `<li><i style="--c:${d.color}"></i>${d.name}</li>`).join('');
$('threadList').innerHTML = `<li><button data-t="ALL" aria-pressed="true">All connections</button></li>` +
  Object.entries(D.threads).map(([k, t]) => `<li><button data-t="${k}" aria-pressed="false">${t.name}</button></li>`).join('') +
  `<li><button data-t="NONE" aria-pressed="false">Hide connections</button></li>`;
$('threadList').querySelectorAll('button').forEach(b => b.onclick = () => {
  const k = b.dataset.t, t = D.threads[k];
  $('threadList').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const op = t ? ['case', ['==', ['get', 'thread'], k], 1, 0.08] : (k === 'NONE' ? 0 : 0.9);
  const gop = t ? ['case', ['==', ['get', 'thread'], k], 0.7, 0.03] : (k === 'NONE' ? 0 : 0.35);
  map.setPaintProperty('conn', 'line-opacity', op);
  map.setPaintProperty('conn-glow', 'line-opacity', gop);
  $('threadText').innerHTML = t ? `${t.text}<span class="chain">${t.chain.map(id => P[id].name).join(' → ')}</span>` : '';
  if (t) {
    const views = new Set(t.chain.map(id => P[id].view));
    const widest = ORDER.filter(v => views.has(v)).pop();
    if (ORDER.indexOf(widest) > ORDER.indexOf(current)) setView(widest);
  }
});
$('legendToggle').onclick = () => { const c = $('legend').classList.toggle('collapsed'); $('legendToggle').setAttribute('aria-expanded', String(!c)); };
$('srcList').innerHTML = D.sources.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
$('bSources').onclick = () => $('modal').classList.add('on');
$('mClose').onclick = () => $('modal').classList.remove('on');
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.remove('on'); });
$('intro').addEventListener('click', () => $('intro').classList.add('gone'));
addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('modal').classList.remove('on'); popup.remove(); }
  const i = ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && i < ORDER.length - 1) setView(ORDER[i + 1]);
  if (e.key === 'ArrowLeft' && i > 0) setView(ORDER[i - 1]);
});
addEventListener('hashchange', () => { const v = viewFromHash(); if (v && v !== current) setView(v); });
})();
