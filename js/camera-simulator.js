    // ==========================================
    // DRONE CAMERA SIMULATOR LOGIC
    // ==========================================
    let simAlt = 150;
    let simFocus = 0; // Focus range 0 (Ostré) to 100 (Rozostřené)
    let simISO = 100;
    let simPitch = -45;
    let simStabilization = true;
    let simFilter = 'none';
    let simLoc = 'castle';

    const isoValues = [100, 200, 400, 800, 1600, 3200, 6400];

    function openPhotoVideoModal() {
      const modal = document.getElementById('foto-video-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        applySimFilters();
      }
    }

    function closePhotoVideoModal() {
      const modal = document.getElementById('foto-video-modal');
      if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
    }

    function updateSimAltitude(alt) {
      simAlt = 170 - parseInt(alt);
      document.getElementById('lbl-sim-alt').textContent = `${simAlt} m`;
      applySimFilters();
    }

    function updateSimFocus(focus) {
      simFocus = parseInt(focus);
      let text = 'Ostré';
      if (simFocus > 80) text = 'Velmi rozostřené';
      else if (simFocus > 40) text = 'Mírně rozostřené';
      else if (simFocus > 10) text = 'Začíná se rozostřovat';
      document.getElementById('lbl-sim-focus').textContent = text;
      applySimFilters();
    }

    function updateSimISO(isoIdx) {
      simISO = isoValues[parseInt(isoIdx)];
      document.getElementById('lbl-sim-iso').textContent = `ISO ${simISO}`;
      applySimFilters();
    }



    function setSimStabilization(stab) {
      simStabilization = stab;
      
      const btnOn = document.getElementById('btn-sim-stab-on');
      const btnOff = document.getElementById('btn-sim-stab-off');
      
      if (stab) {
        btnOn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border transition border-[#cff245] bg-[#cff245]/5 text-[#cff245]";
        btnOff.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border border-white/5 bg-white/[0.01] hover:border-white/10 text-gray-300";
        document.getElementById('lbl-sim-stabilization').textContent = 'AKTIVNÍ';
      } else {
        btnOn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border border-white/5 bg-white/[0.01] hover:border-white/10 text-gray-300";
        btnOff.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border transition border-[#cff245] bg-[#cff245]/5 text-[#cff245]";
        document.getElementById('lbl-sim-stabilization').textContent = 'NEAKTIVNÍ';
      }
      
      applySimFilters();
    }

    function setSimFilter(filterName) {
      simFilter = filterName;
      const filters = ['none', 'cpl', 'nd', 'grayscale', 'sepia', 'nir', 'edges', 'nightvision'];
      filters.forEach(f => {
        const btn = document.getElementById(`btn-sim-filt-${f}`);
        if (btn) {
          if (f === filterName) {
            btn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border transition border-[#cff245] bg-[#cff245]/5 text-[#cff245]";
          } else {
            btn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border border-white/5 bg-white/[0.01] hover:border-white/10 text-gray-300";
          }
        }
      });
      applySimFilters();
    }

    function setSimLocation(locName) {
      simLoc = locName;
      const img = document.getElementById('sim-camera-img');
      if (img) {
        img.src = locName === 'castle' ? 'images/photos/gis_mockup_castle.jpg' : 'images/photos/gis_mockup_ortho.jpg';
      }
      
      const locs = ['castle', 'village'];
      locs.forEach(l => {
        const btn = document.getElementById(`btn-sim-loc-${l}`);
        if (btn) {
          if (l === locName) {
            btn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border transition border-[#cff245] bg-[#cff245]/5 text-[#cff245]";
          } else {
            btn.className = "px-3 py-2 rounded-xl text-[10px] font-bold font-sans border border-white/5 bg-white/[0.01] hover:border-white/10 text-gray-300";
          }
        }
      });
      applySimFilters();
    }

    function applySimFilters() {
      const img = document.getElementById('sim-camera-img');
      if (!img) return;

      // 1. Transform (Zoom / Scale based on altitude)
      // Max altitude (150m) = 1.0 (zoomed out)
      // Min altitude (20m) = 4.0 (zoomed in)
      const scale = 1.0 + ((150 - simAlt) / 130) * 3.0;
      img.style.setProperty('--sim-scale', scale);
      img.style.transform = `scale(${scale})`;

      // Camera Shake
      if (!simStabilization) {
        img.classList.add('animate-shake');
      } else {
        img.classList.remove('animate-shake');
      }

      // 2. Filter (Focus blur + spectral filter color adjustments)
      const blurPx = (simFocus / 10).toFixed(1);
      let filterStr = `blur(${blurPx}px)`;

      if (simFilter === 'cpl') {
        filterStr += ` saturate(1.4) contrast(1.15)`;
      } else if (simFilter === 'nd') {
        filterStr += ` brightness(0.9) contrast(1.1)`;
      } else if (simFilter === 'grayscale') {
        filterStr += ` grayscale(1)`;
      } else if (simFilter === 'sepia') {
        filterStr += ` sepia(0.8) contrast(1.1)`;
      } else if (simFilter === 'nir') {
        filterStr += ` hue-rotate(130deg) saturate(3.5) contrast(1.2)`;
      } else if (simFilter === 'edges') {
        filterStr += ` grayscale(1) contrast(8) invert(1) brightness(1.2)`;
      } else if (simFilter === 'nightvision') {
        filterStr += ` contrast(1.2) brightness(1.2) sepia(1) hue-rotate(85deg) saturate(3)`;
      }
      img.style.filter = filterStr;

      // 3. Sensor Noise/Grain overlay
      const noiseOverlay = document.getElementById('sim-noise-overlay');
      if (noiseOverlay) {
        let noiseOpacity = 0;
        if (simISO === 200) noiseOpacity = 0.05;
        else if (simISO === 400) noiseOpacity = 0.08;
        else if (simISO === 800) noiseOpacity = 0.12;
        else if (simISO === 1600) noiseOpacity = 0.18;
        else if (simISO === 3200) noiseOpacity = 0.25;
        else if (simISO === 6400) noiseOpacity = 0.35;
        noiseOverlay.style.opacity = noiseOpacity;
      }

      // Update HUD elements
      document.getElementById('hud-altitude').textContent = `${simAlt} m`;
      document.getElementById('hud-gsd').textContent = `${(simAlt * 0.025).toFixed(1)} cm/px`;
      document.getElementById('hud-lens').textContent = `${100 - simFocus}%`;
      document.getElementById('hud-filter').textContent = simFilter.toUpperCase();
      
      // Update telemetry
      document.getElementById('hud-yaw').textContent = `${(124.5 + (simAlt % 5) * 0.3).toFixed(1)}°`;
      document.getElementById('hud-pitch').textContent = `${simPitch.toFixed(1)}°`;
      document.getElementById('hud-iso').textContent = simISO;
    }

    // Viewport interactive crosshair repositioning & drag logic
    let crosshairX = 50; // percentage
    let crosshairY = 50; // percentage
    let isDraggingCrosshair = false;

    function handleSimViewportClick(e) {
      if (isDraggingCrosshair) return;
      repositionCrosshair(e);
    }

    function startSimViewportDrag(e) {
      isDraggingCrosshair = true;
      repositionCrosshair(e);
      e.preventDefault();
    }

    function handleSimViewportDrag(e) {
      if (!isDraggingCrosshair) return;
      repositionCrosshair(e);
    }

    // Stop dragging on document-wide mouseup to prevent sticky drags
    window.addEventListener('mouseup', () => {
      isDraggingCrosshair = false;
    });

    function repositionCrosshair(e) {
      const viewport = document.getElementById('sim-viewport');
      if (!viewport) return;
      
      const rect = viewport.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Calculate percentages bounded between 0% and 100%
      crosshairX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      crosshairY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
      
      // Position the crosshair DOM node
      const crosshair = document.getElementById('sim-crosshair');
      if (crosshair) {
        crosshair.style.left = `${crosshairX}%`;
        crosshair.style.top = `${crosshairY}%`;
      }
      
      // Update transform origin of the simulated camera image
      const img = document.getElementById('sim-camera-img');
      if (img) {
        img.style.transformOrigin = `${crosshairX}% ${crosshairY}%`;
      }

      // Calculate Gimbal Pitch based on crosshair position (0° to -90° based on crosshairY from 15% to 50%)
      let calculatedPitch = 0 - ((crosshairY - 15) / 35) * 90;
      calculatedPitch = Math.max(-90, Math.min(0, calculatedPitch));
      simPitch = calculatedPitch;
      
      // Update HUD telemetry coordinates based on crosshair offset from center
      const baseLat = 50.075531;
      const baseLon = 14.437802;
      const offsetLat = (50 - crosshairY) * 0.000008;
      const offsetLon = (crosshairX - 50) * 0.000012;
      
      const latSpan = document.getElementById('hud-lat-val');
      const lonSpan = document.getElementById('hud-lon-val');
      if (latSpan && lonSpan) {
        latSpan.textContent = `${(baseLat + offsetLat).toFixed(6)}° N`;
        lonSpan.textContent = `${(baseLon + offsetLon).toFixed(6)}° E`;
      }

      // Also update HUD pitch value immediately
      const hudPitch = document.getElementById('hud-pitch');
      if (hudPitch) {
        hudPitch.textContent = `${calculatedPitch.toFixed(1)}°`;
      }
    }

