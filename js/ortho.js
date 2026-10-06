// Ortho database lives in /config/ortho.json (edit it there).
// Files must be Cloud Optimized GeoTIFFs (HTTP range requests, CORS enabled on R2).
// Fields: id, title, location, date, size, gsd, url, [isNew], [nodata]
const ORTHOS = await fetch('/config/ortho.json', { cache: 'no-cache' }).then(r => r.json()).catch(err => { console.error(err); return []; });

proj4.defs('EPSG:5514', '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:32633', '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32634', '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs');
ol.proj.proj4.register(proj4);

const MAP = {};
ORTHOS.forEach(o => { MAP[o.id] = o; });
const $ = id => document.getElementById(id);
const catalogView = $('catalog-view'), viewerView = $('viewer-view');
const listEl = $('ortho-list-container'), searchEl = $('ortho-search');
const countEl = $('ortho-count-badge'), emptyEl = $('empty-search-state');
const selectEl = $('viewer-ortho-select');
const overlay = $('loading-overlay'), errorBox = $('error-box');

let map = null, baseLayer = null, orthoLayer = null, currentId = null;

function renderList(q = '') {
q = q.toLowerCase().trim();
const f = ORTHOS.filter(o => [o.title, o.location, o.date, o.gsd].some(v => (v || '').toLowerCase().includes(q)));
const n = f.length;
countEl.innerText = `${n} ${n === 1 ? 'ortofoto' : 'ortofot'}`;
$('empty-text').innerText = ORTHOS.length ? 'Žádné ortofoto neodpovídá hledanému výrazu.' : 'Zatím nejsou k dispozici žádná ortofota.';
emptyEl.classList.toggle('hidden', n > 0);
emptyEl.classList.toggle('flex', n === 0);
listEl.innerHTML = f.map(o => `
  <div onclick="window.selectOrtho('${o.id}')" class="group flex items-center justify-between px-5 py-3 hover:bg-[#cff245]/[0.06] transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-[#cff245]">
    <div class="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
      <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#cff245]/40 group-hover:bg-[#cff245]/10 flex items-center justify-center text-gray-400 group-hover:text-[#cff245] transition shrink-0"><i class="bi bi-map text-sm"></i></div>
      <div class="min-w-0 flex flex-col">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm text-white group-hover:text-[#cff245] transition truncate">${o.title}</span>
          ${o.isNew ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#cff245]/15 text-[#cff245] border border-[#cff245]/30">NOVÝ</span>' : ''}
        </div>
        <div class="text-[11px] text-gray-500 font-mono sm:hidden truncate mt-0.5">${o.location} • ${o.date} • ${o.size}</div>
      </div>
    </div>
    <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-mono w-36 truncate pr-2"><i class="bi bi-geo-alt text-[#cff245]/70 text-[11px] shrink-0"></i><span class="truncate">${o.location}</span></div>
    <div class="hidden md:block text-xs text-gray-400 font-mono w-28 pr-2">${o.date}</div>
    <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-400 w-44 pr-2">
      <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-300 border border-white/5 shrink-0">${o.gsd || 'GeoTIFF'}</span>
      <span class="text-[11px] text-gray-400 shrink-0">${o.size}</span>
    </div>
    <div class="w-20 flex justify-end shrink-0">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] group-hover:bg-[#cff245] border border-white/10 group-hover:border-[#cff245] text-gray-300 group-hover:text-black text-xs font-mono font-medium transition duration-200"><span class="hidden sm:inline">Otevřít</span><i class="bi bi-arrow-right text-xs"></i></span>
    </div>
  </div>`).join('');
}

function initMap() {
if (map) return;
baseLayer = new ol.layer.Tile({ source: new ol.source.OSM(), className: 'basemap' });
map = new ol.Map({
  target: 'map',
  layers: [baseLayer],
  controls: [],
  view: new ol.View({ center: [1700000, 6400000], zoom: 7, maxZoom: 28 })
});
map.on('pointermove', e => {
  const [lon, lat] = ol.proj.toLonLat(e.coordinate);
  $('cursor-coords').innerText = `${lat.toFixed(6)}° N, ${lon.toFixed(6)}° E`;
});
$('btn-basemap').addEventListener('click', e => {
  baseLayer.setVisible(!baseLayer.getVisible());
  e.currentTarget.classList.toggle('active', baseLayer.getVisible());
});
$('btn-basemap').classList.add('active');
$('opacity').addEventListener('input', e => { if (orthoLayer) orthoLayer.setOpacity(e.target.value / 100); });
$('btn-reset').addEventListener('click', fitOrtho);
$('btn-zin').addEventListener('click', () => map.getView().animate({ zoom: map.getView().getZoom() + 1, duration: 200 }));
$('btn-zout').addEventListener('click', () => map.getView().animate({ zoom: map.getView().getZoom() - 1, duration: 200 }));
$('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(console.warn);
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen-icon').className = 'bi text-sm ' + (document.fullscreenElement ? 'bi-fullscreen-exit' : 'bi-fullscreen');
});
}

function fitOrtho() {
if (!orthoLayer || !orthoLayer.get('viewConfig')) return;
const vc = orthoLayer.get('viewConfig');
const ext = vc.extent;
if (ext) map.getView().fit(ol.proj.transformExtent(ext, vc.projection, map.getView().getProjection()), { padding: [60, 60, 100, 60], duration: 400 });
}

function showError(msg) {
errorBox.classList.remove('hidden'); errorBox.classList.add('flex');
$('error-msg').innerText = msg;
$('loading-status').innerText = 'Načtení selhalo';
$('spinner').classList.remove('animate-spin');
}

function loadOrtho(id) {
const o = MAP[id];
if (!o) return;
if (currentId === id && orthoLayer) { fitOrtho(); return; }
initMap();
currentId = id;
selectEl.value = id;
document.title = `${o.title} | Ortofoto DRONAUT`;
$('hud-title').innerText = o.title;
$('hud-loc').innerText = o.location;
$('hud-date').innerText = o.date;
$('hud-gsd').innerText = o.gsd || '–';
$('hud-size').innerText = o.size;
$('hud-coords').innerText = '–';
$('loading-title').innerText = `Načítání ortofota: ${o.title}`;
$('loading-subtitle').innerText = `${o.location} • GeoTIFF`;
$('loading-status').innerText = 'Čtu metadata GeoTIFF...';
$('spinner').classList.add('animate-spin');
errorBox.classList.add('hidden'); errorBox.classList.remove('flex');
overlay.style.display = 'flex'; overlay.style.opacity = '1';

if (orthoLayer) { map.removeLayer(orthoLayer); orthoLayer.dispose(); orthoLayer = null; }

const source = new ol.source.GeoTIFF({
  sources: [{ url: o.url, nodata: o.nodata }],
  convertToRGB: 'auto',
  interpolate: true,
  normalize: true
});
const layer = new ol.layer.WebGLTile({ source, opacity: $('opacity').value / 100 });
orthoLayer = layer;
map.addLayer(layer);

source.getView().then(vc => {
  if (currentId !== id) return;
  layer.set('viewConfig', vc);
  const [x0, y0, x1, y1] = ol.proj.transformExtent(vc.extent, vc.projection, 'EPSG:4326');
  $('hud-coords').innerText = `${((y0 + y1) / 2).toFixed(4)}°, ${((x0 + x1) / 2).toFixed(4)}°`;
  fitOrtho();
  overlay.style.opacity = '0';
  setTimeout(() => { if (currentId === id) overlay.style.display = 'none'; }, 500);
}).catch(err => {
  console.error('GeoTIFF error:', err);
  if (currentId === id) showError('Chyba při čtení GeoTIFF (zkontrolujte CORS, COG a souřadnicový systém).');
});
source.on('error', err => { console.error(err); if (currentId === id) showError('Chyba při načítání dlaždic ortofota.'); });
}

window.selectOrtho = function (id, updateHistory = true) {
if (!MAP[id]) return;
catalogView.classList.add('hidden');
viewerView.classList.remove('hidden'); viewerView.classList.add('flex');
document.body.classList.add('overflow-hidden');
if (updateHistory) history.pushState({ id }, '', `${location.pathname}?ortho=${id}`);
setTimeout(() => { initMap(); map.updateSize(); loadOrtho(id); }, 30);
};

window.showCatalog = function (updateHistory = true) {
viewerView.classList.remove('flex'); viewerView.classList.add('hidden');
catalogView.classList.remove('hidden');
document.body.classList.remove('overflow-hidden');
document.title = 'Ortofoto | DRONAUT';
if (updateHistory) history.pushState(null, '', location.pathname);
};

window.retryLoad = function () {
const id = currentId; currentId = null;
if (id) loadOrtho(id); else location.reload();
};

function route() {
const p = (new URLSearchParams(location.search).get('ortho') || location.hash.replace('#', '')).toLowerCase();
if (p && MAP[p]) window.selectOrtho(p, false); else window.showCatalog(false);
}

selectEl.innerHTML = ORTHOS.map(o => `<option value="${o.id}">${o.title} (${o.date})</option>`).join('');
renderList();
searchEl.addEventListener('input', e => renderList(e.target.value));
window.addEventListener('popstate', route);
route();
