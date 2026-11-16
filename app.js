/* Kei cars in Hirakata — relations of relations
   MapLibre GL + OpenFreeMap tiles. No build step, no API keys. */
(function(){
const D = window.KEI;
const NODES = Object.fromEntries(D.nodes.map(n => [n.id, n]));
const T = D.threads;
const primary = id => T[NODES[id].threads[0]].color;
const shortTitle = id => NODES[id].title.split(' · ').pop();
const isMobile = () => innerWidth <= 820;

const state = { ch: 0, focus: null, selected: null, hiddenCats: new Set(), spinning: true };
const $ = id => document.getElementById(id);

/* ---------- geometry helpers ---------- */
function toVec([lon, lat]){ const a = lon*Math.PI/180, b = lat*Math.PI/180; return [Math.cos(b)*Math.cos(a), Math.cos(b)*Math.sin(a), Math.sin(b)]; }
function toLL([x,y,z]){ return [Math.atan2(y,x)*180/Math.PI, Math.atan2(z, Math.hypot(x,y))*180/Math.PI]; }
function arc(A, B, n = 96){
  const va = toVec(A), vb = toVec(B);
  const dot = Math.min(1, Math.max(-1, va[0]*vb[0]+va[1]*vb[1]+va[2]*vb[2]));
  const om = Math.acos(dot); const pts = [];
  for(let i=0;i<=n;i++){
    const t = i/n;
    let p;
    if(om < 1e-6) p = va; else {
      const s1 = Math.sin((1-t)*om)/Math.sin(om), s2 = Math.sin(t*om)/Math.sin(om);
      p = [va[0]*s1+vb[0]*s2, va[1]*s1+vb[1]*s2, va[2]*s1+vb[2]*s2];
    }
    pts.push(toLL(p));
  }
  for(let i=1;i<pts.length;i++){ // unwrap the antimeridian
    while(pts[i][0]-pts[i-1][0] > 180) pts[i][0] -= 360;
    while(pts[i][0]-pts[i-1][0] < -180) pts[i][0] += 360;
  }
  // bow the line sideways so overlapping threads stay visible
  const [x0,y0] = pts[0], [x1,y1] = pts[pts.length-1];
  const dx = x1-x0, dy = y1-y0, len = Math.hypot(dx,dy) || 1;
  const px = -dy/len, py = dx/len, bow = len*0.18;
  return pts.map(([x,y],i) => { const s = Math.sin(Math.PI*i/n)*bow; return [x+px*s, y+py*s]; });
}
function circle([lon,lat], r){ // r in metres
  const pts = [], k = r/111320;
  for(let i=0;i<=32;i++){ const a = i/32*Math.PI*2; pts.push([lon + k*Math.cos(a)/Math.cos(lat*Math.PI/180), lat + k*Math.sin(a)]); }
  return [pts];
}

/* ---------- data layers ---------- */
function arcFeatures(){
  const f = [];
  Object.entries(T).forEach(([k,t],ti) => {
    for(let i=0;i<t.chain.length-1;i++){
      const a = NODES[t.chain[i]], b = NODES[t.chain[i+1]];
      f.push({ type:'Feature', properties:{ thread:k, color:t.color },
        geometry:{ type:'LineString', coordinates: arc(a.coord, b.coord) } });
    }
  });
  return { type:'FeatureCollection', features:f };
}
function towerFeatures(){
  const f = D.nodes.map((n,i) => ({ type:'Feature',
    properties:{ id:n.id, cat:n.cat, color:primary(n.id), h: 160 + n.threads.length*140 + (i%4)*60 },
    geometry:{ type:'Polygon', coordinates: circle(n.coord, 55) } }));
  f.push({ type:'Feature', properties:{ id:'CAR', cat:'CAR', color:'#f5c518', h: 60 },
    geometry:{ type:'Polygon', coordinates: circle(D.car.coord, 30) } });
  return { type:'FeatureCollection', features:f };
}

/* ---------- map ---------- */
let map;
async function start(){
  let style = 'https://tiles.openfreemap.org/styles/dark';
  try { const r = await fetch(style); if(!r.ok) throw new Error(); } catch(e){ style = 'https://tiles.openfreemap.org/styles/liberty'; }
  map = new maplibregl.Map({
    container:'map', style, center:[150,25], zoom:1.4, pitch:0, maxPitch:78,
    attributionControl:{ compact:true }
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch:true }), 'bottom-right');

  map.on('style.load', () => {
    try { map.setProjection({ type:'globe' }); } catch(e){}
    try { map.setSky({ 'sky-color':'#0b1120', 'horizon-color':'#1f3157', 'fog-color':'#0b1120',
      'sky-horizon-blend':0.6, 'horizon-fog-blend':0.6, 'fog-ground-blend':0.4,
      'atmosphere-blend':['interpolate',['linear'],['zoom'],0,1,5,1,8,0] }); } catch(e){}
    addBuildings();
  });
  map.on('load', () => { addLayers(); addMarkers(); go(chapterFromHash(), false); animateDash(); });

  ['mousedown','touchstart','wheel'].forEach(ev => map.on(ev, () => { state.spinning = false; }));
  map.on('moveend', spin);
}

function addBuildings(){
  const s = map.getStyle();
  if(s.layers.some(l => l.type === 'fill-extrusion')) return;
  const src = Object.entries(s.sources).find(([,v]) => v.type === 'vector');
  if(!src) return;
  const firstSymbol = s.layers.find(l => l.type === 'symbol');
  map.addLayer({ id:'kei-buildings', type:'fill-extrusion', source:src[0], 'source-layer':'building', minzoom:13,
    paint:{ 'fill-extrusion-color':'#26324c',
      'fill-extrusion-height':['coalesce',['get','render_height'],8],
      'fill-extrusion-base':['coalesce',['get','render_min_height'],0],
      'fill-extrusion-opacity':['interpolate',['linear'],['zoom'],13,0,14.5,0.85] } }, firstSymbol && firstSymbol.id);
}

function addLayers(){
  map.addSource('arcs', { type:'geojson', data: arcFeatures() });
  map.addSource('towers', { type:'geojson', data: towerFeatures() });
  map.addLayer({ id:'towers', type:'fill-extrusion', source:'towers', minzoom:10,
    paint:{ 'fill-extrusion-color':['get','color'], 'fill-extrusion-height':['get','h'], 'fill-extrusion-base':0,
      'fill-extrusion-opacity':0.9 } });
  map.addLayer({ id:'arc-glow', type:'line', source:'arcs', layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{ 'line-color':['get','color'], 'line-blur':6,
      'line-width':['interpolate',['linear'],['zoom'],1,5,6,9,14,16], 'line-opacity':0.35 } });
  map.addLayer({ id:'arc-line', type:'line', source:'arcs', layout:{ 'line-join':'round' },
    paint:{ 'line-color':['get','color'],
      'line-width':['interpolate',['linear'],['zoom'],1,1.6,6,2.6,14,5], 'line-opacity':0.95,
      'line-dasharray':[0,4,3] } });
  map.addLayer({ id:'arc-hit', type:'line', source:'arcs', paint:{ 'line-color':'#000', 'line-opacity':0, 'line-width':14 } });
  map.on('click','arc-hit', e => { const k = e.features[0].properties.thread; openThread(k, true); });
  map.on('mouseenter','arc-hit', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave','arc-hit', () => map.getCanvas().style.cursor = '');
}

const DASH = [[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,0.5,3,3.5],[0,1,3,3],[0,1.5,3,2.5],[0,2,3,2],[0,2.5,3,1.5],[0,3,3,1],[0,3.5,3,0.5]];
function animateDash(){
  let step = 0;
  setInterval(() => { if(!map.getLayer('arc-line')) return; step = (step+1) % DASH.length; map.setPaintProperty('arc-line','line-dasharray', DASH[step]); }, 70);
}
function spin(){
  if(!state.spinning || map.getZoom() > 3) return;
  const c = map.getCenter(); c.lng -= 8;
  map.easeTo({ center:c, duration:2000, easing:n => n });
}

/* ---------- markers ---------- */
const markers = {};
const popup = new maplibregl.Popup({ closeButton:false, closeOnClick:false, offset:22 });
function addMarkers(){
  D.nodes.forEach(n => {
    const el = document.createElement('button');
    el.className = 'mk'; el.textContent = n.id;
    el.style.background = primary(n.id); el.style.color = primary(n.id);
    el.innerHTML = `<span style="color:#0b1120">${n.id}</span>`;
    el.setAttribute('aria-label', `${n.id}: ${n.title}, ${n.place}`);
    el.addEventListener('click', e => { e.stopPropagation(); openNode(n.id, true); });
    el.addEventListener('mouseenter', () => popup.setLngLat(n.coord).setHTML(`<b>${n.id}</b> · ${shortTitle(n.id)}`).addTo(map));
    el.addEventListener('mouseleave', () => popup.remove());
    markers[n.id] = new maplibregl.Marker({ element:el }).setLngLat(n.coord).addTo(map);
  });
  const car = document.createElement('button');
  car.className = 'carmk'; car.setAttribute('aria-label','The kei car in Hirakata: open the object');
  car.innerHTML = `<svg width="54" height="34" viewBox="0 0 54 34" aria-hidden="true"><rect x="3" y="12" width="48" height="13" rx="3" fill="#a8e6cf" stroke="#111" stroke-width="2"/><path d="M8 12 V5 a3 3 0 0 1 3-3 H38 l7 10 Z" fill="#a8e6cf" stroke="#111" stroke-width="2"/><rect x="12" y="5" width="11" height="6" rx="1" fill="#1a2438"/><rect x="26" y="5" width="10" height="6" rx="1" fill="#1a2438"/><rect x="21" y="17" width="12" height="5" fill="#f5c518" stroke="#111"/><circle cx="14" cy="27" r="5" fill="#111"/><circle cx="40" cy="27" r="5" fill="#111"/></svg><span class="badge">軽 THE KEI CAR</span>`;
  car.addEventListener('click', e => { e.stopPropagation(); go(1); });
  new maplibregl.Marker({ element:car, anchor:'bottom' }).setLngLat(D.car.coord).addTo(map);
}

/* ---------- focus & filters ---------- */
function applyFocus(keys){ // keys: array of thread keys or null
  state.focus = keys && keys.length ? keys : null;
  const f = state.focus;
  const op = f ? ['case',['in',['get','thread'],['literal',f]],0.95,0.06] : 0.95;
  const gop = f ? ['case',['in',['get','thread'],['literal',f]],0.45,0.03] : 0.35;
  if(map.getLayer('arc-line')){ map.setPaintProperty('arc-line','line-opacity',op); map.setPaintProperty('arc-glow','line-opacity',gop); }
  const inSet = f ? new Set(f.flatMap(k => T[k].chain)) : null;
  Object.entries(markers).forEach(([id,m]) => m.getElement().classList.toggle('dim', !!inSet && !inSet.has(id)));
  document.querySelectorAll('[data-trow]').forEach(b => b.classList.toggle('on', !!f && f.includes(b.dataset.trow)));
}
function highlight(ids){
  if(!ids){ return; }
  const s = new Set(ids);
  Object.entries(markers).forEach(([id,m]) => m.getElement().classList.toggle('dim', !s.has(id)));
}
function applyCats(){
  Object.entries(markers).forEach(([id,m]) => m.getElement().classList.toggle('hidden', state.hiddenCats.has(NODES[id].cat)));
  const hidden = [...state.hiddenCats];
  if(map.getLayer('towers')) map.setFilter('towers', hidden.length ? ['!',['in',['get','cat'],['literal',hidden]]] : null);
  document.querySelectorAll('[data-crow]').forEach(b => { const off = state.hiddenCats.has(b.dataset.crow); b.classList.toggle('off', off); b.setAttribute('aria-pressed', String(!off)); });
}
function select(id){
  if(state.selected && markers[state.selected]) markers[state.selected].getElement().classList.remove('sel');
  state.selected = id;
  if(id && markers[id]) markers[id].getElement().classList.add('sel');
}

/* ---------- camera ---------- */
function pad(){ return isMobile() ? { top:80, bottom: innerHeight*0.5, left:30, right:30 } : { top:110, bottom:60, left:500, right:120 }; }
function fly(view){
  const p = pad();
  map.flyTo({ ...view, duration: 3200, essential:true, padding: isMobile() ? { top:0, bottom: innerHeight*0.35, left:0, right:0 } : { left:380, top:0, right:0, bottom:0 } });
}
function showChain(ids){
  const pts = ids.map(id => NODES[id].coord.slice());
  for(let i=1;i<pts.length;i++){ while(pts[i][0]-pts[0][0] > 180) pts[i][0]-=360; while(pts[i][0]-pts[0][0] < -180) pts[i][0]+=360; }
  const lons = pts.map(p=>p[0]), lats = pts.map(p=>p[1]);
  const span = Math.max(...lons)-Math.min(...lons);
  if(span > 50){
    const c = [(Math.max(...lons)+Math.min(...lons))/2, (Math.max(...lats)+Math.min(...lats))/2];
    fly({ center:[((c[0]+540)%360)-180, Math.max(-30,Math.min(40,c[1]))], zoom: isMobile()?0.9:1.35, pitch:0, bearing:0 });
  } else {
    map.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]], { padding: pad(), pitch:35, bearing:0, duration:3000, maxZoom:14 });
  }
}

/* ---------- story ---------- */
const chip = id => `<button class="chip" data-node="${id}"><b style="background:${primary(id)}">${id}</b>${shortTitle(id)}</button>`;
function renderChapter(i){
  const c = D.chapters[i]; let html = '';
  if(c.thread){
    const t = T[c.thread];
    html = `<div class="kick" style="color:${t.color}">THREAD · RELATIONS OF RELATIONS</div><h2>${t.name}</h2>
      <p class="q">${t.insight}</p><div class="chips">${t.chain.map(chip).join('<span aria-hidden="true" style="color:var(--muted);align-self:center">→</span>')}</div>`;
  } else if(c.theme){
    const t = D.themes[c.theme];
    html = `<div class="kick" style="color:var(--plate)">THEME · ${t.name.toUpperCase()}</div><h2>${t.head}</h2><p>${t.body}</p><p class="q">${t.q}</p>
      <div class="chips">${t.threads.map(k=>`<button class="chip" data-thread="${k}"><b style="background:${T[k].color}">&nbsp;</b>${T[k].name}</button>`).join('')}</div>`;
  } else {
    html = `<div class="kick">${c.kicker}</div><h2>${c.title}</h2>
      ${c.photo ? `<img class="photo" src="assets/kei.jpg" alt="A kei car photographed in Hirakata" onerror="this.remove()">` : ''}
      <p>${c.text}</p>${c.show ? `<div class="chips">${c.show.map(chip).join('')}</div>` : ''}`;
  }
  $('storyBody').innerHTML = html;
  bindLinks($('storyBody'));
  $('dots').querySelectorAll('button').forEach((d,j) => d.setAttribute('aria-selected', String(j===i)));
  $('prev').disabled = i === 0;
  $('next').textContent = i === D.chapters.length-1 ? 'Start over ↺' : (i === 0 ? 'Begin →' : 'Next →');
}
function go(i, animate = true){
  state.ch = Math.max(0, Math.min(D.chapters.length-1, i));
  const c = D.chapters[state.ch];
  state.spinning = state.ch === 0;
  closePanel(); renderChapter(state.ch);
  try { history.replaceState(null,'', state.ch ? '#chapter-'+state.ch : location.pathname); } catch(e){}
  if(c.thread){ applyFocus([c.thread]); showChain(T[c.thread].chain); return; }
  if(c.theme){ applyFocus(D.themes[c.theme].threads); fly(c.view); return; }
  applyFocus(null);
  if(c.show) highlight(c.show);
  if(animate) fly(c.view); else map.jumpTo(c.view);
  if(state.ch === 0) setTimeout(spin, 400);
}
function chapterFromHash(){ const m = location.hash.match(/^#chapter-(\d+)$/); return m ? +m[1] : 0; }

/* ---------- details panel ---------- */
function openPanel(html){ $('pBody').innerHTML = html; $('panel').classList.add('open'); bindLinks($('pBody')); $('panel').scrollTop = 0; }
function closePanel(){ $('panel').classList.remove('open'); select(null); }
function bindLinks(root){
  root.querySelectorAll('[data-node]').forEach(b => b.onclick = () => openNode(b.dataset.node, true));
  root.querySelectorAll('[data-thread]').forEach(b => b.onclick = () => openThread(b.dataset.thread, true));
}
const link = (id, note) => `<button class="link" data-node="${id}"><b style="background:${primary(id)}">${id}</b>${shortTitle(id)}<small>${note||''}</small></button>`;
function openNode(id, doFly){
  const n = NODES[id]; select(id); state.spinning = false;
  if(doFly){
    const urban = /Hirakata|Tokyo|Ikeda|Ōyamazaki|Ryūō|Port of Osaka/.test(n.place);
    map.flyTo({ center:n.coord, zoom: urban ? 15.6 : 9.5, pitch: urban ? 62 : 45, bearing: (Math.random()*60)-30, duration:2600, essential:true,
      padding: isMobile() ? { bottom: innerHeight*0.45 } : { right: 420, left: 0 } });
  }
  let rel = '';
  n.threads.forEach(k => { const c = T[k].chain, i = c.indexOf(id); if(i<0) return;
    if(i>0) rel += link(c[i-1], '← '+T[k].name); if(i<c.length-1) rel += link(c[i+1], T[k].name+' →'); });
  const cat = D.categories[n.cat];
  openPanel(`<div class="kick" style="color:${primary(id)}">${cat.num} · ${cat.name.toUpperCase()}</div>
    <h2>${n.title}</h2>
    <div class="place"><span aria-hidden="true">📍</span><span>${n.place}${n.anchor ? '<span class="tag" title="Pinned to a representative place">ANCHOR</span>' : ''}</span></div>
    <p>${n.body}</p><div>${n.threads.map(k=>`<span class="pill" style="color:${T[k].color}">${T[k].name}</span>`).join('')}</div>
    ${rel ? `<h3>Relations of relations</h3>${rel}` : ''}
    <h3>Follow a whole thread</h3>${n.threads.map(k=>`<button class="link" data-thread="${k}"><i style="width:18px;height:4px;border-radius:2px;background:${T[k].color}"></i>${T[k].name}</button>`).join('')}`);
}
function openThread(k, doFly){
  const t = T[k]; applyFocus([k]); select(null);
  if(doFly) showChain(t.chain);
  openPanel(`<div class="kick" style="color:${t.color}">THREAD · RELATIONS OF RELATIONS</div><h2>${t.name}</h2><p>${t.insight}</p>
    <h3>The chain, in order</h3>${t.chain.map((id,i)=>link(id, `${i+1} · ${NODES[id].place.split(',')[0]}`)).join('')}
    <p class="muted" style="font-size:14px">Other threads are dimmed. Click the thread again in Layers to show everything.</p>`);
}

/* ---------- controls ---------- */
function buildUI(){
  D.chapters.forEach((c,i) => { const d = document.createElement('button'); d.setAttribute('role','tab');
    d.setAttribute('aria-label', 'Chapter '+(i+1)); d.onclick = () => go(i); $('dots').appendChild(d); });
  $('prev').onclick = () => go(state.ch-1);
  $('next').onclick = () => go(state.ch === D.chapters.length-1 ? 0 : state.ch+1);
  Object.entries(T).forEach(([k,t]) => { const b = document.createElement('button'); b.className='row'; b.dataset.trow=k; b.style.color=t.color;
    b.innerHTML = `<i style="background:${t.color}"></i><span style="color:var(--ink)">${t.name}</span>`;
    b.onclick = () => { if(state.focus && state.focus.length===1 && state.focus[0]===k){ applyFocus(null); closePanel(); } else openThread(k, true); };
    $('threadList').appendChild(b); });
  Object.entries(D.categories).forEach(([k,c]) => { const b = document.createElement('button'); b.className='row'; b.dataset.crow=k; b.setAttribute('aria-pressed','true');
    b.innerHTML = `<span class="num">${c.num}</span><span>${c.name}</span>`;
    b.onclick = () => { state.hiddenCats.has(k) ? state.hiddenCats.delete(k) : state.hiddenCats.add(k); applyCats(); };
    $('catList').appendChild(b); });
  $('layersToggle').onclick = () => { const c = $('layers').classList.toggle('collapsed'); $('layersToggle').setAttribute('aria-expanded', String(!c)); };
  if(isMobile()){ $('layers').classList.add('collapsed'); $('layersToggle').setAttribute('aria-expanded','false'); }
  $('pClose').onclick = closePanel;
  $('srcList').innerHTML = D.sources.map(([t,u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
  $('bSources').onclick = () => $('modal').classList.add('on');
  $('mClose').onclick = () => $('modal').classList.remove('on');
  $('modal').addEventListener('click', e => { if(e.target === $('modal')) $('modal').classList.remove('on'); });
  addEventListener('keydown', e => {
    if(e.target.closest && e.target.closest('input,textarea')) return;
    if(e.key === 'Escape'){ $('modal').classList.remove('on'); closePanel(); }
    if(e.key === 'ArrowRight') $('next').click();
    if(e.key === 'ArrowLeft' && state.ch > 0) go(state.ch-1);
  });
}

buildUI();
start();
})();
