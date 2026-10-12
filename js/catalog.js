// Unified data catalog: lists everything from /config/catalog.json (edit it there).
// Item fields: id, type ("model" | "ortho"), title, location, date, size, url, [isNew],
//   model: format, method, up, fullTitle   ortho: gsd, nodata
// Each type opens in its own viewer; add a new type by extending TYPES.
const TYPES = {
  model: { label: '3D modely', icon: 'bi-box', viewer: id => `/models/?model=${id}`, info: i => i.format || 'GLB' },
  ortho: { label: 'Ortofota', icon: 'bi-map', viewer: id => `/ortho/?ortho=${id}`, info: i => i.gsd || 'GeoTIFF' }
};

const ITEMS = await fetch('/config/catalog.json', { cache: 'no-cache' }).then(r => r.json()).catch(err => { console.error(err); return []; });

// Dates are stored as "d. m. yyyy"; newest first.
const dateKey = d => { const m = /(\d+)\.\s*(\d+)\.\s*(\d+)/.exec(d || ''); return m ? +m[3] * 372 + +m[2] * 31 + +m[1] : 0; };
ITEMS.sort((a, b) => dateKey(b.date) - dateKey(a.date));

const $ = id => document.getElementById(id);
const listEl = $('catalog-list'), searchEl = $('catalog-search'), countEl = $('catalog-count');
const emptyEl = $('catalog-empty'), filterEl = $('type-filter');

let activeType = new URLSearchParams(location.search).get('type');
if (!TYPES[activeType]) activeType = 'all';

const plural = n => n === 1 ? 'položka' : n >= 2 && n <= 4 ? 'položky' : 'položek';

function renderFilter() {
  const btn = (key, label, icon, n) => {
    const on = key === activeType;
    return `<button data-type="${key}" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition ${on ? 'bg-[#cff245] text-black border-[#cff245] font-semibold' : 'bg-white/[0.03] text-gray-300 border-white/10 hover:border-[#cff245]/40'}">${icon ? `<i class="bi ${icon}"></i>` : ''}${label}<span class="${on ? 'text-black/60' : 'text-gray-500'}">${n}</span></button>`;
  };
  filterEl.innerHTML = btn('all', 'Vše', '', ITEMS.length) +
    Object.entries(TYPES).map(([k, t]) => btn(k, t.label, t.icon, ITEMS.filter(i => i.type === k).length)).join('');
}

function renderList() {
  const q = searchEl.value.toLowerCase().trim();
  const f = ITEMS.filter(i => TYPES[i.type] && (activeType === 'all' || i.type === activeType) &&
    [i.title, i.location, i.date, i.format, i.gsd, TYPES[i.type].label].some(v => (v || '').toLowerCase().includes(q)));
  countEl.innerText = `${f.length} ${plural(f.length)}`;
  $('catalog-empty-text').innerText = ITEMS.length ? 'Žádná položka neodpovídá hledanému výrazu.' : 'Zatím nejsou k dispozici žádná data.';
  emptyEl.classList.toggle('hidden', f.length > 0);
  emptyEl.classList.toggle('flex', f.length === 0);
  listEl.innerHTML = f.map(i => {
    const t = TYPES[i.type];
    return `
  <a href="${t.viewer(i.id)}" class="group flex items-center justify-between px-5 py-3 hover:bg-[#cff245]/[0.06] transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-[#cff245]">
    <div class="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
      <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#cff245]/40 group-hover:bg-[#cff245]/10 flex items-center justify-center text-gray-400 group-hover:text-[#cff245] transition shrink-0" title="${t.label}"><i class="bi ${t.icon} text-sm"></i></div>
      <div class="min-w-0 flex flex-col">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm text-white group-hover:text-[#cff245] transition truncate">${i.title}</span>
          ${i.isNew ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#cff245]/15 text-[#cff245] border border-[#cff245]/30">NOVÝ</span>' : ''}
        </div>
        <div class="text-[11px] text-gray-500 font-mono sm:hidden truncate mt-0.5">${t.label} • ${i.location} • ${i.date}</div>
      </div>
    </div>
    <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-mono w-36 truncate pr-2"><i class="bi bi-geo-alt text-[#cff245]/70 text-[11px] shrink-0"></i><span class="truncate">${i.location}</span></div>
    <div class="hidden md:block text-xs text-gray-400 font-mono w-28 pr-2">${i.date}</div>
    <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-400 w-44 pr-2">
      <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-300 border border-white/5 shrink-0">${t.info(i)}</span>
      <span class="text-[11px] text-gray-400 shrink-0">${i.size}</span>
    </div>
    <div class="w-20 flex justify-end shrink-0">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] group-hover:bg-[#cff245] border border-white/10 group-hover:border-[#cff245] text-gray-300 group-hover:text-black text-xs font-mono font-medium transition duration-200"><span class="hidden sm:inline">Otevřít</span><i class="bi bi-arrow-right text-xs"></i></span>
    </div>
  </a>`;
  }).join('');
}

filterEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-type]');
  if (!b) return;
  activeType = b.dataset.type;
  history.replaceState(null, '', activeType === 'all' ? location.pathname : `${location.pathname}?type=${activeType}`);
  renderFilter();
  renderList();
});
searchEl.addEventListener('input', renderList);

renderFilter();
renderList();
