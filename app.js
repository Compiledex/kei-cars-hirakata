/* Kei cars in Hirakata — a map across scales.
   MapLibre GL JS on Esri satellite imagery. No build step, no API keys. */
(function () {
const D = window.KEI;
const ORDER = ['hirakata', 'kansai', 'japan', 'world'];
const P = Object.fromEntries(D.places.map(p => [p.id, p]));
const $ = id => document.getElementById(id);
const mobile = () => innerWidth <= 820;
let current = null, focus = 'ALL';

/* ---------- map ---------- */
const style = {
  version: 8,
  projection: { type: 'globe' },
  sources: {
    sat: { type: 'raster', tileSize: 256, maxzoom: 19,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Imagery © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics' },
    lbl: { type: 'raster', tileSize: 256, maxzoom: 19,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'] },
    // Elevation (AWS Terrain Tiles, public, no key) for real 3D relief
    dem: { type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 14,
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      attribution: 'Elevation: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a>' },
    // OpenStreetMap buildings (OpenFreeMap) for 3D blocks at street scale
    omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet',
      attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }
  },
  terrain: { source: 'dem', exaggeration: 1.6 },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#05070d' } },
    { id: 'sat', type: 'raster', source: 'sat' },
    { id: 'buildings', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 13.5,
      paint: { 'fill-extrusion-color': '#e9e4da',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15, 0.7] } },
    { id: 'lbl', type: 'raster', source: 'lbl', paint: { 'raster-opacity': 0.95 } }
  ]
};
const map = window._map = new maplibregl.Map({
  container: 'map', style, center: D.views.world.camera.center, zoom: 1.2, maxPitch: 60,
  attributionControl: { compact: true }
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), 'bottom-right');

/* ---------- connection lines ---------- */
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
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, bow = L * 0.12;
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
  try { map.setSky({ 'sky-color': '#0a1530', 'horizon-color': '#3a5a8c', 'fog-color': '#0a1530',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }); } catch (e) {}
  map.addSource('conn', { type: 'geojson', data: lines() });
  map.addLayer({ id: 'conn-casing', type: 'line', source: 'conn', layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#000', 'line-opacity': 0.45, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 10, 4.5] } });
  map.addLayer({ id: 'conn', type: 'line', source: 'conn',
    paint: { 'line-color': '#ffffff', 'line-opacity': 0.85, 'line-dasharray': [2, 2],
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 10, 2.2] } });
  map.addLayer({ id: 'conn-focus', type: 'line', source: 'conn', filter: ['==', ['get', 'thread'], '__none'],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': '#f5c518', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 10, 4.5] } });
  addPins();
  setView(viewFromHash() || 'hirakata', 4200);
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
      : `<span class="dot">${dim.letter}</span><span class="lbl">${p.name}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); openPlace(p.id); });
    pins[p.id] = new maplibregl.Marker({ element: el, anchor: 'left', offset: [-14, 0] }).setLngLat(p.coord).addTo(map);
  });
}

/* ---------- views ---------- */
function setView(v, duration = 3000) {
  current = v;
  const V = D.views[v];
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === v)));
  Object.entries(pins).forEach(([id, m]) => m.getElement().classList.toggle('far', P[id].view !== v));
  popup.remove();
  const here = D.places.filter(p => p.view === v);
  const i = ORDER.indexOf(v), next = ORDER[i + 1];
  $('side').innerHTML = `<div class="step">SCALE ${i + 1} OF 4</div>
    <h2>${V.title} <span class="jp">${V.jp}</span></h2><p>${V.intro}</p>
    <ul class="places">${here.map(p => `<li><button data-place="${p.id}"><i style="background:${D.dims[p.dim].color}"></i>
      <span><b>${p.name}</b><small>${p.jp}${p.anchor ? ' · representative place' : ''}</small></span></button></li>`).join('')}</ul>
    <button class="next" id="nextScale">${next ? `Zoom out to ${D.views[next].tab} →` : 'Back to Hirakata ↺'}</button>`;
  $('side').querySelectorAll('[data-place]').forEach(b => b.onclick = () => openPlace(b.dataset.place, true));
  $('nextScale').onclick = () => setView(next || 'hirakata');
  $('side').scrollTop = 0;
  try { history.replaceState(null, '', '#' + v); } catch (e) {}
  const cam = { ...V.camera };
  if (mobile()) cam.zoom = V.mobileZoom;
  map.flyTo({ ...cam, duration, essential: true,
    padding: mobile() ? { top: 0, bottom: innerHeight * 0.35, left: 0, right: 0 } : { left: 400, top: 60, right: 0, bottom: 0 } });
  settleAfterMove();
}
// After a long flight with 3D terrain, nudge the camera once so terrain tiles refresh.
function settleAfterMove() {
  map.once('moveend', () => setTimeout(() => { map.jumpTo({ bearing: map.getBearing() + 0.01 }); map.triggerRepaint(); }, 250));
}
function viewFromHash() { const h = location.hash.slice(1); return ORDER.includes(h) ? h : null; }

/* ---------- Google Earth / Street View links (open in a new tab; no API key needed) ---------- */
const NO_STREET = new Set(['atacama', 'greenbushes', 'sulawesi', 'kolwezi', 'malaysia']);
function earthUrl(p) {
  const [lon, lat] = p.coord;
  const dist = p.view === 'hirakata' ? 700 : p.view === 'world' ? 6000 : 2500;
  return `https://earth.google.com/web/@${lat},${lon},50a,${dist}d,35y,0h,55t,0r`;
}
function streetUrl(p) {
  const [lon, lat] = p.coord;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
}

/* ---------- place popup ---------- */
const popup = new maplibregl.Popup({ maxWidth: '360px', offset: 18, closeButton: true, focusAfterOpen: false });
function openPlace(id, pan) {
  const p = P[id], dim = D.dims[p.dim];
  if (p.view !== current) setView(p.view, 2200);
  else if (pan) map.easeTo({ center: p.coord, duration: 900 });
  let rel = '';
  Object.entries(D.threads).forEach(([k, t]) => {
    const i = t.chain.indexOf(id); if (i < 0) return;
    const nb = [];
    if (i > 0) nb.push(t.chain[i - 1]);
    if (i < t.chain.length - 1) nb.push(t.chain[i + 1]);
    rel += `<div class="rel"><span>${t.name}</span>${nb.map(n => `<button data-go="${n}">${P[n].name}</button>`).join('')}</div>`;
  });
  const photo = p.car ? 'assets/kei.jpg' : `assets/photos/${p.id}.jpg`;
  const html = `<div class="pop">
    <div class="tag" style="--c:${dim.color}">${dim.name}</div>
    <h3>${p.name}</h3><div class="jp">${p.jp}</div>
    <img src="${photo}" alt="Photo: ${p.name}" onerror="this.remove()">
    <p>${p.text}</p>
    ${p.anchor ? '<p class="note">Representative place: this relation is not tied to one exact spot.</p>' : ''}
    ${rel ? `<div class="relh">Connected to</div>${rel}` : ''}
    <button class="zoom" data-zoom="${id}">🔍 See it from above</button>
    <div class="ext">
      <a href="${earthUrl(p)}" target="_blank" rel="noopener">🌏 Google Earth 3D</a>
      ${NO_STREET.has(p.id) ? '' : `<a href="${streetUrl(p)}" target="_blank" rel="noopener">🚶 Street View</a>`}
    </div></div>`;
  setTimeout(() => {
    popup.setLngLat(p.coord).setHTML(html).addTo(map);
    const el = popup.getElement();
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => openPlace(b.dataset.go, true));
    el.querySelector('[data-zoom]').onclick = () => { map.flyTo({ center: p.coord, zoom: p.view === 'world' ? 12 : 16.2, pitch: 58,
      bearing: map.getBearing(), duration: 2600, essential: true }); settleAfterMove(); };
  }, p.view !== current ? 2300 : 0);
}

/* ---------- controls ---------- */
ORDER.forEach((v, i) => {
  const V = D.views[v], b = document.createElement('button');
  b.dataset.view = v; b.setAttribute('role', 'tab');
  b.innerHTML = `<small>${i + 1}</small>${V.tab} <span class="jp">${V.jp}</span>`;
  b.onclick = () => setView(v);
  $('tabs').appendChild(b);
  if (i < ORDER.length - 1) { const s = document.createElement('span'); s.className = 'arrow'; s.setAttribute('aria-hidden', 'true'); s.textContent = '›'; $('tabs').appendChild(s); }
});
$('dimList').innerHTML = Object.values(D.dims).map(d => `<li><i style="background:${d.color}">${d.letter}</i>${d.name}</li>`).join('');
$('thread').innerHTML = `<option value="ALL">All connections</option>` +
  Object.entries(D.threads).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('') +
  `<option value="NONE">Hide connections</option>`;
$('thread').onchange = e => {
  focus = e.target.value;
  const t = D.threads[focus];
  map.setPaintProperty('conn', 'line-opacity', focus === 'ALL' ? 0.85 : focus === 'NONE' ? 0 : 0.25);
  map.setPaintProperty('conn-casing', 'line-opacity', focus === 'NONE' ? 0 : 0.45);
  map.setFilter('conn-focus', ['==', ['get', 'thread'], t ? focus : '__none']);
  $('threadText').innerHTML = t ? `${t.text}<br><span class="chain">${t.chain.map(id => P[id].name).join(' → ')}</span>` : '';
  if (t) {
    const views = new Set(t.chain.map(id => P[id].view));
    const widest = ORDER.filter(v => views.has(v)).pop();
    if (ORDER.indexOf(widest) > ORDER.indexOf(current)) setView(widest);
  }
};
$('legendToggle').onclick = () => { const c = $('legend').classList.toggle('collapsed'); $('legendToggle').setAttribute('aria-expanded', String(!c)); };
$('legend').classList.add('collapsed'); $('legendToggle').setAttribute('aria-expanded', 'false');
$('srcList').innerHTML = D.sources.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
$('bSources').onclick = () => $('modal').classList.add('on');
$('mClose').onclick = () => $('modal').classList.remove('on');
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.remove('on'); });
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('select,input')) return;
  if (e.key === 'Escape') { $('modal').classList.remove('on'); popup.remove(); }
  const i = ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && i < ORDER.length - 1) setView(ORDER[i + 1]);
  if (e.key === 'ArrowLeft' && i > 0) setView(ORDER[i - 1]);
});
addEventListener('hashchange', () => { const v = viewFromHash(); if (v && v !== current) setView(v); });
})();
