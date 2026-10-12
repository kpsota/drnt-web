// Data catalog lives in /config/catalog.json (edit it there); this viewer shows items with type "ortho".
// Files must be Cloud Optimized GeoTIFFs (HTTP range requests, CORS enabled on R2).
// Fields: id, type, title, location, date, size, gsd, url, [isNew], [nodata]
const ORTHOS = await fetch('/config/catalog.json', { cache: 'no-cache' }).then(r => r.json()).then(a => a.filter(i => i.type === 'ortho')).catch(err => { console.error(err); return []; });

proj4.defs('EPSG:5514', '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:32633', '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32634', '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs');
ol.proj.proj4.register(proj4);

const MAP = {};
ORTHOS.forEach(o => { MAP[o.id] = o; });
const $ = id => document.getElementById(id);
const viewerView = $('viewer-view');
const selectEl = $('viewer-ortho-select');
const overlay = $('loading-overlay'), errorBox = $('error-box');

let map = null, orthoLayer = null, currentId = null;
let measureSource = null, measureDraw = null, measureMode = null;

const fmtLen = m => m >= 1000 ? `${(m / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 3 })} km` : `${m.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} m`;
const fmtArea = m2 => m2 >= 1e6 ? `${(m2 / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 3 })} km²`
  : `${m2.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} m²` + (m2 >= 10000 ? ` (${(m2 / 10000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ha)` : '');

// Planar measurement when the map CRS is metric (S-JTSK, UTM), geodesic otherwise.
function measureGeom(geom) {
  const proj = map.getView().getProjection();
  const metric = proj.getUnits() === 'm' && proj.getCode() !== 'EPSG:3857';
  if (geom instanceof ol.geom.Polygon) return fmtArea(metric ? geom.getArea() : ol.sphere.getArea(geom, { projection: proj }));
  return fmtLen(metric ? geom.getLength() : ol.sphere.getLength(geom, { projection: proj }));
}

function updateLabel(f) {
  f.set('label', measureGeom(f.getGeometry()));
}

function setMeasureMode(mode) {
  if (measureDraw) { map.removeInteraction(measureDraw); measureDraw = null; }
  measureMode = measureMode === mode ? null : mode;
  $('btn-measure-dist').classList.toggle('active', measureMode === 'dist');
  $('btn-measure-area').classList.toggle('active', measureMode === 'area');
  map.getTargetElement().style.cursor = measureMode ? 'crosshair' : '';
  if (!measureMode) return;
  measureDraw = new ol.interaction.Draw({
    source: measureSource,
    type: measureMode === 'area' ? 'Polygon' : 'LineString',
    style: measureStyle
  });
  measureDraw.on('drawstart', e => {
    const f = e.feature;
    updateLabel(f);
    f.getGeometry().on('change', () => updateLabel(f));
  });
  map.addInteraction(measureDraw);
}

const measureStroke = new ol.style.Stroke({ color: '#cff245', width: 2.5 });
const measureVertex = new ol.style.Circle({ radius: 4, fill: new ol.style.Fill({ color: '#0d0e11' }), stroke: new ol.style.Stroke({ color: '#cff245', width: 2 }) });
function measureStyle(f) {
  const g = f.getGeometry();
  const styles = [new ol.style.Style({ stroke: measureStroke, fill: new ol.style.Fill({ color: 'rgba(207,242,69,0.15)' }) })];
  const coords = g instanceof ol.geom.Polygon ? g.getCoordinates()[0] : g.getCoordinates?.();
  if (coords) styles.push(new ol.style.Style({ image: measureVertex, geometry: new ol.geom.MultiPoint(coords) }));
  const label = f.get('label');
  if (label) {
    const pos = g instanceof ol.geom.Polygon ? g.getInteriorPoint().getCoordinates().slice(0, 2) : g.getLastCoordinate?.();
    if (pos) styles.push(new ol.style.Style({
      geometry: new ol.geom.Point(pos),
      text: new ol.style.Text({
        text: label, font: '600 12px Inter, sans-serif', fill: new ol.style.Fill({ color: '#0d0e11' }),
        backgroundFill: new ol.style.Fill({ color: '#cff245' }), padding: [3, 6, 3, 6],
        offsetY: g instanceof ol.geom.Polygon ? 0 : -16
      })
    }));
  }
  return styles;
}

function clearMeasurements() { if (measureSource) measureSource.clear(); }


function initMap() {
  if (map) return;
  map = new ol.Map({ target: 'map', layers: [], controls: [] });
  measureSource = new ol.source.Vector();
  map.addLayer(new ol.layer.Vector({ source: measureSource, style: measureStyle, zIndex: 10 }));
  $('btn-measure-dist').addEventListener('click', () => setMeasureMode('dist'));
  $('btn-measure-area').addEventListener('click', () => setMeasureMode('area'));
  $('btn-measure-clear').addEventListener('click', clearMeasurements);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && measureDraw) measureDraw.abortDrawing(); });
  map.on('pointermove', e => {
    const [lon, lat] = ol.proj.transform(e.coordinate, map.getView().getProjection(), 'EPSG:4326');
    $('cursor-coords').innerText = `${lat.toFixed(6)}° N, ${lon.toFixed(6)}° E`;
  });
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
  const ext = orthoLayer && orthoLayer.get('extent');
  if (ext) map.getView().fit(ext, { padding: [60, 60, 100, 60], duration: 400 });
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

  clearMeasurements();
  if (orthoLayer) { map.removeLayer(orthoLayer); orthoLayer.dispose(); orthoLayer = null; }

  // Rendered in the file's native CRS (no reprojection) - cheapest for the browser.
  const source = new ol.source.GeoTIFF({
    sources: [{ url: o.url, nodata: o.nodata }],
    convertToRGB: 'auto',
    interpolate: true,
    normalize: true
  });
  const layer = new ol.layer.WebGLTile({ source, opacity: $('opacity').value / 100 });
  orthoLayer = layer;

  source.getView().then(vc => {
    if (currentId !== id) return;
    layer.set('extent', vc.extent);
    map.setView(new ol.View({ ...vc, showFullExtent: true, constrainOnlyCenter: true }));
    map.addLayer(layer);
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
viewerView.classList.remove('hidden'); viewerView.classList.add('flex');
document.body.classList.add('overflow-hidden');
if (updateHistory) history.pushState({ id }, '', `${location.pathname}?id=${id}`);
setTimeout(() => { initMap(); map.updateSize(); loadOrtho(id); }, 30);
};

window.showCatalog = function () {
window.location.href = '/data/';
};

window.retryLoad = function () {
const id = currentId; currentId = null;
if (id) loadOrtho(id); else location.reload();
};

function route() {
const p = (new URLSearchParams(location.search).get('id') || location.hash.replace('#', '')).toLowerCase();
if (p && MAP[p]) window.selectOrtho(p, false); else window.location.replace('/data/');
}

selectEl.innerHTML = ORTHOS.map(o => `<option value="${o.id}">${o.title} (${o.date})</option>`).join('');
window.addEventListener('popstate', route);
route();
