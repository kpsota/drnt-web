import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Model database lives in /config/models.json (edit it there)
const MODELS = await fetch('/config/models.json', { cache: 'no-cache' }).then(r => r.json()).catch(err => { console.error(err); return []; });

// Helper map
const MODELS_MAP = {};
MODELS.forEach(m => { MODELS_MAP[m.id] = m; });

const DRACO_DECODER_PATH = 'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/';

// Views
const catalogView = document.getElementById('catalog-view');
const viewerView = document.getElementById('viewer-view');

// List DOM Elements
const modelsListContainer = document.getElementById('models-list-container');
const modelSearchInput = document.getElementById('model-search');
const modelCountBadge = document.getElementById('model-count-badge');
const emptySearchState = document.getElementById('empty-search-state');

// DOM Elements - Viewer
const container = document.getElementById('canvas-container');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingTitle = document.getElementById('loading-title');
const loadingSubtitle = document.getElementById('loading-subtitle');
const loadingNotice = document.getElementById('loading-notice');
const progressBar = document.getElementById('progress-bar');
const loadingPercent = document.getElementById('loading-percent');
const loadingStatus = document.getElementById('loading-status');
const errorBox = document.getElementById('error-box');
const errorMsg = document.getElementById('error-msg');

// HUD Elements
const hudModelTitle = document.getElementById('hud-model-title');
const hudModelLoc = document.getElementById('hud-model-loc');
const hudModelDate = document.getElementById('hud-model-date');
const hudModelSize = document.getElementById('hud-model-size');
const viewerModelSelect = document.getElementById('viewer-model-select');

// Controls Buttons
const btnWireframe = document.getElementById('btn-wireframe');
const labelWireframe = document.getElementById('label-wireframe');
const btnAutorotate = document.getElementById('btn-autorotate');
const labelAutorotate = document.getElementById('label-autorotate');
const btnReset = document.getElementById('btn-reset');
const btnFullscreen = document.getElementById('btn-fullscreen');
const fullscreenIcon = document.getElementById('fullscreen-icon');

// Three.js State
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let gltfLoader = null;
let dracoLoader = null;
let isInitialized = false;

let currentModelId = null;
let loadedModel = null;
let isWireframe = false;
let initialCameraPos = new THREE.Vector3();
let initialTarget = new THREE.Vector3(0, 0, 0);

// ==========================================
// RENDER MINIMALIST MODEL LIST
// ==========================================
function renderModelList(filterQuery = '') {
  const q = filterQuery.toLowerCase().trim();
  const filtered = MODELS.filter(m => 
    m.title.toLowerCase().includes(q) || 
    m.location.toLowerCase().includes(q) ||
    m.date.toLowerCase().includes(q) ||
    m.format.toLowerCase().includes(q)
  );

  if (modelCountBadge) {
    const count = filtered.length;
    let label = 'modelů';
    if (count === 1) label = 'model';
    else if (count >= 2 && count <= 4) label = 'modely';
    modelCountBadge.innerText = `${count} ${label}`;
  }

  if (filtered.length === 0) {
    modelsListContainer.innerHTML = '';
    emptySearchState.classList.remove('hidden');
    emptySearchState.classList.add('flex');
    return;
  }

  emptySearchState.classList.add('hidden');
  emptySearchState.classList.remove('flex');

  modelsListContainer.innerHTML = filtered.map((m, idx) => `
    <div onclick="window.selectModel('${m.id}')" class="group flex items-center justify-between px-5 py-3 hover:bg-[#cff245]/[0.06] transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-[#cff245]">
      <!-- Column 1: Icon + Title + Mobile Subtitle -->
      <div class="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
        <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#cff245]/40 group-hover:bg-[#cff245]/10 flex items-center justify-center text-gray-400 group-hover:text-[#cff245] transition shrink-0">
          <i class="bi bi-box text-sm"></i>
        </div>
        <div class="min-w-0 flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-white group-hover:text-[#cff245] transition truncate">${m.title}</span>
            ${m.isNew ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#cff245]/15 text-[#cff245] border border-[#cff245]/30">NOVÝ</span>' : ''}
          </div>
          <div class="text-[11px] text-gray-500 font-mono sm:hidden truncate mt-0.5">
            ${m.location} • ${m.date} • ${m.size}
          </div>
        </div>
      </div>

      <!-- Column 2: Location (Desktop) -->
      <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-mono w-36 truncate pr-2">
        <i class="bi bi-geo-alt text-[#cff245]/70 text-[11px] shrink-0"></i>
        <span class="truncate">${m.location}</span>
      </div>

      <!-- Column 3: Date (Desktop) -->
      <div class="hidden md:block text-xs text-gray-400 font-mono w-28 pr-2">
        ${m.date}
      </div>

      <!-- Column 4: Format & Size (Desktop) -->
      <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-400 w-44 pr-2">
        <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-300 border border-white/5 shrink-0">${m.format}</span>
        <span class="text-[11px] text-gray-400 shrink-0">${m.size}</span>
      </div>

      <!-- Column 5: Action Button -->
      <div class="w-20 flex justify-end shrink-0">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] group-hover:bg-[#cff245] border border-white/10 group-hover:border-[#cff245] text-gray-300 group-hover:text-black text-xs font-mono font-medium transition duration-200">
          <span class="hidden sm:inline">Otevřít</span>
          <i class="bi bi-arrow-right text-xs"></i>
        </span>
      </div>
    </div>
  `).join('');
}

// Populate viewer select options
function populateViewerSelect() {
  if (!viewerModelSelect) return;
  viewerModelSelect.innerHTML = MODELS.map(m => `
    <option value="${m.id}">${m.title} (${m.date})</option>
  `).join('');
}

// Initialize 3D Engine
function initThreeEngine() {
  if (isInitialized) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0e11);

  // Camera
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || (window.innerHeight - 60);
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
  camera.position.set(0, 50, 100);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.0;
  controls.maxDistance = 1500;
  controls.minDistance = 1;

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x22242a, 1.2);
  scene.add(hemiLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight1.position.set(40, 80, 50);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xa5c4ff, 0.7);
  dirLight2.position.set(-40, 20, -50);
  scene.add(dirLight2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Setup Loaders
  dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

  gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  // Setup Event Handlers
  setupEvents();

  // Render Loop
  animate();

  isInitialized = true;
}

// Load Model into Scene
function loadModel(modelId) {
  const model = MODELS_MAP[modelId];
  if (!model) return;

  // If already loaded and active, just reset camera view
  if (currentModelId === modelId && loadedModel) {
    resetCamera();
    return;
  }

  initThreeEngine();

  // Update Header Dropdown Selection
  if (viewerModelSelect) {
    viewerModelSelect.value = modelId;
  }

  // Update Document Title
  document.title = `${model.fullTitle} | 3D Digitální dvojče DRONAUT`;

  // Update HUD Info Card
  if (hudModelTitle) hudModelTitle.innerText = `${model.title} – 3D Model`;
  if (hudModelLoc) hudModelLoc.innerText = model.location;
  if (hudModelDate) hudModelDate.innerText = model.date;
  if (hudModelSize) hudModelSize.innerText = model.size;

  // Update Loading Overlay text
  if (loadingTitle) loadingTitle.innerText = `Načítání 3D modelu: ${model.title}`;
  if (loadingSubtitle) loadingSubtitle.innerText = `${model.location} • ${model.method}`;
  if (loadingNotice) loadingNotice.innerText = `Velikost modelu je ${model.size} komprimováno technologií Draco. Načtení probíhá z Cloudflare R2 CDN.`;
  
  // Reset loading overlay UI
  errorBox.classList.add('hidden');
  errorBox.classList.remove('flex');
  progressBar.style.width = '5%';
  loadingPercent.innerText = '0%';
  loadingStatus.innerText = 'Připojuji se k R2 CDN...';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.opacity = '1';

  // Clean up previously loaded model
  if (loadedModel) {
    scene.remove(loadedModel);
    loadedModel.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      }
    });
    loadedModel = null;
  }

  // Reset wireframe toggle
  isWireframe = false;
  if (btnWireframe) btnWireframe.classList.remove('active');
  if (labelWireframe) labelWireframe.innerText = 'Drátěný model';

  currentModelId = modelId;

  // Trigger download and parse
  gltfLoader.load(
    model.url,
    (gltf) => {
      // Check if user switched to another model while loading
      if (currentModelId !== modelId) return;

      loadedModel = gltf.scene;
      scene.add(loadedModel);

      // Center & fit model
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      loadedModel.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fitDistance = maxDim * 1.5;

      camera.position.set(maxDim * 0.6, maxDim * 0.8, fitDistance);
      controls.target.set(0, 0, 0);
      controls.update();

      // Save initial camera states for reset
      initialCameraPos.copy(camera.position);
      initialTarget.copy(controls.target);

      // UI Success
      progressBar.style.width = '100%';
      loadingPercent.innerText = '100%';
      loadingStatus.innerText = 'Model úspěšně načten!';

      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 600);
    },
    (xhr) => {
      if (xhr.total) {
        const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
        const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (xhr.total / (1024 * 1024)).toFixed(1);
        progressBar.style.width = `${percent}%`;
        loadingPercent.innerText = `${percent}%`;
        loadingStatus.innerText = `Staženo: ${loadedMB} MB z ${totalMB} MB`;
      } else {
        const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
        loadingStatus.innerText = `Stahuji data... (${loadedMB} MB)`;
      }
    },
    (error) => {
      console.error('Three.js GLTF Loading Error:', error);
      errorBox.classList.remove('hidden');
      errorBox.classList.add('flex');
      errorMsg.innerText = 'Chyba při stahování nebo dekódování 3D modelu.';
      loadingStatus.innerText = 'Stahování selhalo';
    }
  );
}

// Navigation: Select Model
window.selectModel = function(modelId, updateHistory = true) {
  if (!MODELS_MAP[modelId]) return;

  catalogView.classList.add('hidden');
  viewerView.classList.remove('hidden');
  viewerView.classList.add('flex');
  document.body.classList.add('overflow-hidden');

  if (updateHistory) {
    const newUrl = `${window.location.pathname}?model=${modelId}`;
    window.history.pushState({ modelId }, '', newUrl);
  }

  // Sizing & Load
  setTimeout(() => {
    onResize();
    loadModel(modelId);
  }, 30);
};

// Navigation: Show Catalog
window.showCatalog = function(updateHistory = true) {
  viewerView.classList.remove('flex');
  viewerView.classList.add('hidden');
  catalogView.classList.remove('hidden');
  document.body.classList.remove('overflow-hidden');
  document.title = '3D Digitální dvojčata | DRONAUT';

  if (updateHistory) {
    window.history.pushState(null, '', window.location.pathname);
  }
};

// Retry load
window.retryLoad = function() {
  if (currentModelId) {
    const id = currentModelId;
    currentModelId = null;
    loadModel(id);
  } else {
    window.location.reload();
  }
};

// Toggle Wireframe / Textured Mode
function toggleWireframe() {
  if (!loadedModel) return;
  isWireframe = !isWireframe;

  loadedModel.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => { mat.wireframe = isWireframe; });
      } else {
        child.material.wireframe = isWireframe;
      }
    }
  });

  if (isWireframe) {
    btnWireframe.classList.add('active');
    if (labelWireframe) labelWireframe.innerText = 'Textura';
  } else {
    btnWireframe.classList.remove('active');
    if (labelWireframe) labelWireframe.innerText = 'Drátěný model';
  }
}

// Toggle Auto-Rotation
function toggleAutorotate() {
  if (!controls) return;
  controls.autoRotate = !controls.autoRotate;
  if (controls.autoRotate) {
    btnAutorotate.classList.add('active');
  } else {
    btnAutorotate.classList.remove('active');
  }
}

// Reset Camera Position
function resetCamera() {
  if (!loadedModel || !controls || !camera) return;
  camera.position.copy(initialCameraPos);
  controls.target.copy(initialTarget);
  controls.update();
}

// Toggle Fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      fullscreenIcon.classList.replace('bi-fullscreen', 'bi-fullscreen-exit');
    }).catch(err => console.warn(err));
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        fullscreenIcon.classList.replace('bi-fullscreen-exit', 'bi-fullscreen');
      });
    }
  }
}

// Handle Resize
function onResize() {
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || (window.innerHeight - 60);
  if (width === 0 || height === 0) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Event Listeners
function setupEvents() {
  btnWireframe.addEventListener('click', toggleWireframe);
  btnAutorotate.addEventListener('click', toggleAutorotate);
  btnReset.addEventListener('click', resetCamera);
  btnFullscreen.addEventListener('click', toggleFullscreen);

  window.addEventListener('resize', onResize);
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      fullscreenIcon.classList.replace('bi-fullscreen-exit', 'bi-fullscreen');
    } else {
      fullscreenIcon.classList.replace('bi-fullscreen', 'bi-fullscreen-exit');
    }
  });
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Initial Routing / Deep Linking Handler
function handleInitialRoute() {
  renderModelList();
  populateViewerSelect();

  if (modelSearchInput) {
    modelSearchInput.addEventListener('input', (e) => {
      renderModelList(e.target.value);
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramModel = urlParams.get('model') || (window.location.hash ? window.location.hash.replace('#', '') : null);

  if (paramModel && MODELS_MAP[paramModel.toLowerCase()]) {
    window.selectModel(paramModel.toLowerCase(), false);
  } else {
    window.showCatalog(false);
  }
}

// Handle Browser History Back / Forward
window.addEventListener('popstate', (e) => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramModel = urlParams.get('model');
  if (paramModel && MODELS_MAP[paramModel.toLowerCase()]) {
    window.selectModel(paramModel.toLowerCase(), false);
  } else {
    window.showCatalog(false);
  }
});

// Start
handleInitialRoute();
