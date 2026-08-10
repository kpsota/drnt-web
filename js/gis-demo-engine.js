    // ==========================================
    // 3. GIS CLIENT PORTAL DEMO LOGIC
    // ==========================================
    let gisTool = null; // 'measure', 'height', 'area', 'profile', 'slope', 'flood', or 'calib'
    let gisCurrentImage = 1; // 1: village ortho, 2: castle ortho
    let isCalibAuthenticated = false;
    let gisPointA = null; // {x, y}
    let gisPointB = null; // {x, y}
    let calibrationScales = {
      1: 1.4310835,
      2: 0.3418,
      3: 0.5859,
      4: 0.6348,
      5: 0.5859
    };
    
    // Load calibration scales from localStorage if available
    try {
      const savedScales = localStorage.getItem('dronaut_gis_scales');
      if (savedScales) {
        const parsed = JSON.parse(savedScales);
        if (parsed && typeof parsed === 'object') {
          calibrationScales = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load scales from localStorage", e);
    }
    let polygonPoints = [];
    let polygonCompleted = false;
    let isDraggingNode = false;
    let draggedNodeIndex = -1;
    let lastClickTime = 0;
    let currentProfileData = [];

    // Elevation Calibration Data points (normalized coordinates rx, ry)
    let calibrationData = {
      1: [ // Village Corridor
        { id: 1, rx: 0.146, ry: 0.195, desc: "Severozápadní pole / les", alt: 315.0 },
        { id: 2, rx: 0.488, ry: 0.156, desc: "Cesta na severním kopci", alt: 317.0 },
        { id: 3, rx: 0.830, ry: 0.234, desc: "Budova na severovýchodě", alt: 313.2 },
        { id: 4, rx: 0.195, ry: 0.495, desc: "Koryto řeky (západ)", alt: 314.4 },
        { id: 5, rx: 0.500, ry: 0.500, desc: "Křižovatka a most v centru", alt: 316.0 },
        { id: 6, rx: 0.781, ry: 0.547, desc: "Domek v pravé části", alt: 312.5 },
        { id: 7, rx: 0.176, ry: 0.807, desc: "Zahrada na jihozápadě", alt: 309.0 },
        { id: 8, rx: 0.469, ry: 0.755, desc: "Splav na řece (jih)", alt: 311.0 },
        { id: 9, rx: 0.703, ry: 0.846, desc: "Louka na jihovýchodě", alt: 311.6 },
        { id: 10, rx: 0.879, ry: 0.885, desc: "Lesní roh na jihovýchodě", alt: 311.8 }
      ],
      2: [ // Castle Ruins
        { id: 1, rx: 0.176, ry: 0.195, desc: "Severozápadní hradní příkop", alt: 350.0 },
        { id: 2, rx: 0.500, ry: 0.156, desc: "Severní hradba", alt: 375.0 },
        { id: 3, rx: 0.801, ry: 0.234, desc: "Východní předhradí", alt: 340.0 },
        { id: 4, rx: 0.244, ry: 0.456, desc: "Západní svah", alt: 338.0 },
        { id: 5, rx: 0.500, ry: 0.456, desc: "Hlavní nádvoří (donjon)", alt: 337.5 },
        { id: 6, rx: 0.762, ry: 0.495, desc: "Vstupní brána", alt: 333.0 },
        { id: 7, rx: 0.215, ry: 0.755, desc: "Jihozápadní terasa", alt: 318.5 },
        { id: 8, rx: 0.488, ry: 0.716, desc: "Jižní příkop lomu", alt: 317.0 },
        { id: 9, rx: 0.732, ry: 0.755, desc: "Jihovýchodní svah", alt: 316.0 },
        { id: 10, rx: 0.879, ry: 0.807, desc: "Cesta pod hradem", alt: 314.0 }
      ],
      3: [ // Industrial Park
        { id: 1, rx: 0.117, ry: 0.195, desc: "Roh parkoviště (západ)", alt: 218.5 },
        { id: 2, rx: 0.488, ry: 0.169, desc: "Střecha severní haly A", alt: 219.0 },
        { id: 3, rx: 0.859, ry: 0.208, desc: "Hladina retenční nádrže", alt: 218.0 },
        { id: 4, rx: 0.215, ry: 0.469, desc: "Plocha u haly B", alt: 216.0 },
        { id: 5, rx: 0.500, ry: 0.469, desc: "Křižovatka v centru", alt: 218.6 },
        { id: 6, rx: 0.801, ry: 0.508, desc: "Východní vjezd", alt: 218.4 },
        { id: 7, rx: 0.146, ry: 0.755, desc: "Zeleň na jihozápadě", alt: 218.5 },
        { id: 8, rx: 0.469, ry: 0.716, desc: "Jižní rampa haly C", alt: 218.7 },
        { id: 9, rx: 0.762, ry: 0.729, desc: "Skladový dvůr (východ)", alt: 218.6 },
        { id: 10, rx: 0.898, ry: 0.781, desc: "Lesní okraj u plotu", alt: 218.5 }
      ],
      4: [ // Highway Interchange
        { id: 1, rx: 0.146, ry: 0.182, desc: "Severozápadní pole", alt: 268.5 },
        { id: 2, rx: 0.508, ry: 0.156, desc: "Dálniční nadjezd (mostovka)", alt: 267.0 },
        { id: 3, rx: 0.830, ry: 0.208, desc: "Severovýchodní násep", alt: 268.0 },
        { id: 4, rx: 0.195, ry: 0.495, desc: "Koryto příkopu vlevo", alt: 273.0 },
        { id: 5, rx: 0.500, ry: 0.500, desc: "Křížení dálnic (podjezd)", alt: 273.5 },
        { id: 6, rx: 0.781, ry: 0.521, desc: "Připojovací pruh (východ)", alt: 273.0 },
        { id: 7, rx: 0.176, ry: 0.781, desc: "Jihozápadní násep", alt: 268.0 },
        { id: 8, rx: 0.469, ry: 0.755, desc: "Pilíř mostu v poli", alt: 267.5 },
        { id: 9, rx: 0.732, ry: 0.781, desc: "Jihovýchodní louka", alt: 268.0 },
        { id: 10, rx: 0.879, ry: 0.846, desc: "Konec sjezdu", alt: 267.5 }
      ],
      5: [ // Stone Quarry with Lake
        { id: 1, rx: 0.176, ry: 0.195, desc: "Horní hrana lomu (západ)", alt: 305.0 },
        { id: 2, rx: 0.508, ry: 0.143, desc: "Severní hrana (vyhlídka)", alt: 304.5 },
        { id: 3, rx: 0.830, ry: 0.208, desc: "Východní hrana lomu", alt: 305.0 },
        { id: 4, rx: 0.273, ry: 0.495, desc: "Terasa lomu vlevo", alt: 285.0 },
        { id: 5, rx: 0.500, ry: 0.500, desc: "Hladina zatopeného jezera", alt: 272.0 },
        { id: 6, rx: 0.732, ry: 0.495, desc: "Příjezdová cesta (východ)", alt: 271.0 },
        { id: 7, rx: 0.215, ry: 0.755, desc: "Horní hrana lomu (jihozápad)", alt: 304.0 },
        { id: 8, rx: 0.469, ry: 0.755, desc: "Dno jezera (nejhlubší)", alt: 302.0 },
        { id: 9, rx: 0.684, ry: 0.755, desc: "Dno lomu (spodní terasa)", alt: 306.0 },
        { id: 10, rx: 0.879, ry: 0.833, desc: "Jižní hrana lomu", alt: 308.0 }
      ]
    };

    const defaultFloodPaths = {
      1: [
        {
          isClosed: false,
          isConcluded: true,
          points: [
            { rx: 0.10, ry: 0.49, z: 295.4 },
            { rx: 0.35, ry: 0.49, z: 296.5 },
            { rx: 0.50, ry: 0.50, z: 298.1 },
            { rx: 0.48, ry: 0.65, z: 295.0 },
            { rx: 0.47, ry: 0.85, z: 294.0 }
          ]
        }
      ],
      2: [
        {
          isClosed: false,
          isConcluded: true,
          points: [
            { rx: 0.15, ry: 0.25, z: 325.0 },
            { rx: 0.20, ry: 0.50, z: 322.4 },
            { rx: 0.22, ry: 0.70, z: 325.0 }
          ]
        }
      ],
      3: [
        {
          isClosed: true,
          isConcluded: true,
          points: [
            { rx: 0.78, ry: 0.15, z: 212.4 },
            { rx: 0.92, ry: 0.15, z: 212.4 },
            { rx: 0.92, ry: 0.30, z: 212.4 },
            { rx: 0.78, ry: 0.30, z: 212.4 },
            { rx: 0.78, ry: 0.15, z: 212.4 }
          ]
        }
      ],
      4: [],
      5: [
        {
          isClosed: true,
          isConcluded: true,
          points: [
            { rx: 0.40, ry: 0.45, z: 242.0 },
            { rx: 0.60, ry: 0.45, z: 242.0 },
            { rx: 0.60, ry: 0.80, z: 242.0 },
            { rx: 0.40, ry: 0.80, z: 242.0 },
            { rx: 0.40, ry: 0.45, z: 242.0 }
          ]
        }
      ]
    };

    // Deep copy of default calibration data for resets
    const defaultCalibrationData = JSON.parse(JSON.stringify(calibrationData));

    // Load from database (localStorage) if available
    try {
      const savedCalib = localStorage.getItem('dronaut_gis_calibration');
      if (savedCalib) {
        const parsed = JSON.parse(savedCalib);
        let isValidSchema = true;
        if (parsed && typeof parsed === 'object') {
          for (let key in parsed) {
            if (Array.isArray(parsed[key])) {
              parsed[key].forEach(pt => {
                if (pt.rx === undefined || pt.ry === undefined) {
                  isValidSchema = false;
                }
              });
            }
          }
        } else {
          isValidSchema = false;
        }

        if (isValidSchema) {
          calibrationData = parsed;
        } else {
          console.warn("Detected old absolute calibration schema in localStorage. Resetting to new relative defaults.");
          localStorage.removeItem('dronaut_gis_calibration');
        }
      }
    } catch (e) {
      console.warn("Could not load calibration from localStorage", e);
    }
    
    // Zoom & Pan state
    let zoomScale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let totalPanDist = 0;

    let isExportDropdownOpen = false;
    let isDownloading = false;

    function dismissGisHint() {
      const hint = document.getElementById('gis-canvas-hint');
      if (hint) hint.classList.add('hidden');
    }

    function switchGisImage(index) {
      if (gisCurrentImage === index) return;
      gisCurrentImage = index;

      // Update background image
      const bgImg = document.getElementById('gis-bg-image');
      if (bgImg) {
        if (index === 1) {
          bgImg.src = 'images/photos/gis_mockup_ortho.jpg';
        } else if (index === 2) {
          bgImg.src = 'images/photos/gis_mockup_castle.jpg';
        } else if (index === 3) {
          bgImg.src = 'images/photos/gis_mockup_industrial.jpg';
        } else if (index === 4) {
          bgImg.src = 'images/photos/gis_mockup_highway.jpg';
        } else {
          bgImg.src = 'images/photos/gis_mockup_quarry.jpg';
        }
      }

      // Reset measurements and indicators
      clearGisData(gisTool === 'calib' || gisTool === 'flood-calib');
      
      const savedV2 = localStorage.getItem('drnt_saved_flood_points_v2_' + index);
      let loaded;
      if (savedV2 !== null) {
        loaded = JSON.parse(savedV2);
      } else {
        const oldSaved = localStorage.getItem('drnt_saved_flood_points_' + index);
        if (oldSaved !== null) {
          const oldData = JSON.parse(oldSaved);
          let paths = [];
          if (oldData.length > 0) {
            if (oldData[0].points !== undefined) {
              paths = oldData;
            } else {
              paths = [ { points: oldData, isClosed: false, isConcluded: true } ];
            }
          }
          paths.forEach(path => {
            if (path.points) {
              path.points.forEach(pt => {
                if (pt.rx === undefined) pt.rx = pt.x / 718;
                if (pt.ry === undefined) pt.ry = pt.y / 558;
              });
            }
          });
          loaded = paths;
          localStorage.setItem('drnt_saved_flood_points_v2_' + index, JSON.stringify(loaded));
        } else {
          loaded = [];
        }
      }
      savedFloodPoints = loaded;

      if (gisTool === 'flood-calib') {
        const hasSaved = savedFloodPoints && savedFloodPoints.some(p => p.points && p.points.length >= 2);
        if (hasSaved) {
          floodCalibPoints = JSON.parse(JSON.stringify(savedFloodPoints));
        } else {
          floodCalibPoints = JSON.parse(JSON.stringify(defaultFloodPaths[index] || []));
        }
      } else {
        floodCalibPoints = [];
      }

      const crosshair = document.getElementById('gis-probe-crosshair');
      if (crosshair) crosshair.classList.add('hidden');

      const markerA = document.getElementById('gis-marker-a');
      const markerB = document.getElementById('gis-marker-b');
      if (markerA) markerA.classList.add('hidden');
      if (markerB) markerB.classList.add('hidden');

      // Reset zoom and pan
      zoomScale = 1;
      panX = 0;
      panY = 0;
      updateViewportTransform();

      // Update button highlights (Village, Castle, Industrial, Highway, Quarry)
      const btn1 = document.getElementById('gis-btn-img1');
      const btn2 = document.getElementById('gis-btn-img2');
      const btn3 = document.getElementById('gis-btn-img3');
      const btn4 = document.getElementById('gis-btn-img4');
      const btn5 = document.getElementById('gis-btn-img5');
      
      const activeClass = "px-3 py-2.5 rounded-xl border text-[10px] font-bold font-sans tracking-wide transition-all duration-300 bg-[#cff245] text-black border-[#cff245] shadow-[0_0_12px_rgba(207,242,69,0.2)] w-full text-left flex items-center gap-2";
      const inactiveClass = "px-3 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-[10px] font-bold font-sans tracking-wide transition-all duration-300 bg-transparent w-full text-left flex items-center gap-2";
      
      if (btn1) btn1.className = (index === 1) ? activeClass : inactiveClass;
      if (btn2) btn2.className = (index === 2) ? activeClass : inactiveClass;
      if (btn3) btn3.className = (index === 3) ? activeClass : inactiveClass;
      if (btn4) btn4.className = (index === 4) ? activeClass : inactiveClass;
      if (btn5) btn5.className = (index === 5) ? activeClass : inactiveClass;
      
      // Update inner icons classes (fill vs outline)
      if (btn1) {
        const icon = btn1.querySelector('i');
        if (icon) icon.className = (index === 1) ? "bi bi-house-door-fill text-base" : "bi bi-house-door text-base";
      }
      if (btn2) {
        const svg = btn2.querySelector('svg');
        if (svg) {
          if (index === 2) {
            svg.innerHTML = '<path d="M1 2v3h1v9h12V5h1V2h-3v2H9V2H7v2H4V2H1zm5 7h4v5H6V9z"/>';
          } else {
            svg.innerHTML = '<path d="M1 2v3h1v9h12V5h1V2h-3v2H9V2H7v2H4V2H1zm2 4h10v7H3V6zm4 2v4h2V8H7z"/>';
          }
        }
      }
      if (btn3) {
        const icon = btn3.querySelector('i');
        if (icon) icon.className = (index === 3) ? "bi bi-buildings-fill text-base" : "bi bi-buildings text-base";
      }
      if (btn4) {
        const icon = btn4.querySelector('i');
        if (icon) icon.className = (index === 4) ? "bi bi-signpost-split-fill text-base" : "bi bi-signpost-split text-base";
      }
      if (btn5) {
        const icon = btn5.querySelector('i');
        if (icon) icon.className = "bi bi-water text-base";
      }
      
      if (gisTool === 'flood') {
        document.getElementById('gis-flood-card').classList.remove('hidden');
        document.getElementById('gis-flood-card').classList.add('flex');
        updateGisFlood(document.getElementById('gis-flood-range').value);
      } else if (gisTool === 'calib') {
        const calibOverlays = document.getElementById('gis-calib-overlays');
        if (calibOverlays) calibOverlays.classList.remove('hidden');
        drawCalibrationMarkers();
        writePopupContent();
      } else if (gisTool === 'flood-calib') {
        const calibOverlays = document.getElementById('gis-flood-calib-overlays');
        if (calibOverlays) calibOverlays.classList.remove('hidden');
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) canvas.classList.remove('hidden');
        const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
        if (outlineCanvas) outlineCanvas.classList.remove('hidden');
        
        // Load the new image's saved points as the active draft
        floodCalibPoints = JSON.parse(JSON.stringify(savedFloodPoints));
        
        drawFloodCalibMarkers();
        writeFloodPopupContent();
        runFloodSimulation();
      }

    }

    function setGisTool(tool) {
      if ((tool === 'calib' || tool === 'flood-calib') && !isCalibAuthenticated) {
        const username = prompt("Zadejte uživatelské jméno pro přístup ke kalibraci:");
        if (username === null) return;
        const password = prompt("Zadejte heslo:");
        if (password === null) return;
        
        if (username !== "DRNT" || password !== "OSKP26") {
          alert("Neplatné jméno nebo heslo.");
          return;
        }
        isCalibAuthenticated = true;
      }

      dismissGisHint();
      gisTool = tool;

      // Update button styles
      const btnMeasure = document.getElementById('gis-tool-measure');
      const btnHeight = document.getElementById('gis-tool-height');
      const btnArea = document.getElementById('gis-tool-area');
      const btnProfile = document.getElementById('gis-tool-profile');
      const btnSlope = document.getElementById('gis-tool-slope');
      const btnFlood = document.getElementById('gis-tool-flood');
      const btnCalib = document.getElementById('gis-tool-calib');
      const btnFloodCalib = document.getElementById('gis-tool-flood-calib');

      const activeYellow = "items-center gap-3 px-4 py-2 rounded-xl border transition w-full text-left text-xs font-bold border-[#cff245] bg-[#cff245]/5 text-[#cff245]";
      const activeBlue = "items-center gap-3 px-4 py-2 rounded-xl border transition w-full text-left text-xs font-bold border-[#23d8ff] bg-[#23d8ff]/5 text-[#23d8ff]";
      const activeOrange = "items-center gap-3 px-4 py-2 rounded-xl border transition w-full text-left text-xs font-bold border-[#fbbf24] bg-[#fbbf24]/5 text-[#fbbf24]";
      const inactive = "items-center gap-3 px-4 py-2 rounded-xl border transition w-full text-left text-xs font-bold border-white/5 bg-white/[0.01] hover:border-white/20 text-gray-300";

      if (btnMeasure) btnMeasure.className = "flex " + (tool === 'measure' ? activeYellow : inactive);
      if (btnHeight) btnHeight.className = "flex " + (tool === 'height' ? activeBlue : inactive);
      if (btnArea) btnArea.className = "flex " + (tool === 'area' ? activeYellow : inactive);
      if (btnProfile) btnProfile.className = "flex " + (tool === 'profile' ? activeBlue : inactive);
      if (btnSlope) btnSlope.className = "flex " + (tool === 'slope' ? activeYellow : inactive);
      if (btnFlood) btnFlood.className = "flex " + (tool === 'flood' ? activeBlue : inactive);

      // Visibility of calibration tools is restricted to logged-in admin state
      const calibVisibility = isAdminLoggedIn ? "flex " : "hidden ";
      if (btnCalib) btnCalib.className = calibVisibility + (tool === 'calib' ? activeOrange : inactive);
      if (btnFloodCalib) btnFloodCalib.className = calibVisibility + (tool === 'flood-calib' ? activeBlue : inactive);

      // Update HUD Status & Cursor
      const canvas = document.getElementById('gis-canvas');
      if (canvas) {
        if (tool && tool !== 'calib') {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = 'grab';
        }
      }

      const hudTool = document.getElementById('gis-hud-tool');
      if (tool === 'measure') {
        hudTool.textContent = "Měření vzdálenosti (Klikněte 2x)";
        hudTool.className = "text-[#cff245] font-bold";
      } else if (tool === 'height') {
        hudTool.textContent = "Z-sonda (Klikněte na libovolné místo)";
        hudTool.className = "text-[#23d8ff] font-bold";
      } else if (tool === 'area') {
        hudTool.textContent = "Měření plochy (Min. 3 body, dokončit dvojklikem, poté lze body posouvat)";
        hudTool.className = "text-[#cff245] font-bold";
      } else if (tool === 'profile') {
        hudTool.textContent = "Výškový profil terénu (Klikněte 2x)";
        hudTool.className = "text-[#23d8ff] font-bold";
      } else if (tool === 'slope') {
        hudTool.textContent = "Měření sklonu a spádu (Klikněte 2x)";
        hudTool.className = "text-[#cff245] font-bold";
      } else if (tool === 'flood') {
        hudTool.textContent = "Simulace záplavy (Nastavte posuvník dole)";
        hudTool.className = "text-[#23d8ff] font-bold";
      } else if (tool === 'calib') {
        hudTool.textContent = "Kalibrace výškových bodů (Hodnoty editujte v tabulce)";
        hudTool.className = "text-[#fbbf24] font-bold";
      } else if (tool === 'flood-calib') {
        hudTool.textContent = "Kalibrace záplav (Kliknutím přidejte body koryta)";
        hudTool.className = "text-[#fbbf24] font-bold";
      } else {
        hudTool.textContent = "Žádný (Prohlížení)";
        hudTool.className = "text-white";
      }

      clearGisData();

      if (tool === 'flood') {
        // Hide measurement card and show flood card
        document.getElementById('gis-result-card').classList.add('hidden');
        document.getElementById('gis-result-card').classList.remove('flex');
        
        const floodCard = document.getElementById('gis-flood-card');
        if (floodCard) {
          floodCard.classList.remove('hidden');
          floodCard.classList.add('flex');
        }
        
        // Always use custom flow calibration canvas
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) canvas.classList.remove('hidden');
        
        // Init with default slider value
        const range = document.getElementById('gis-flood-range');
        if (range) {
          range.value = 0;
          updateGisFlood(0);
        }
      } else if (tool === 'calib') {
        // Open separate window next to the current window
        if (!calibPopup || calibPopup.closed) {
          const left = window.screenX + window.outerWidth + 10;
          const top = window.screenY;
          calibPopup = window.open('', 'drnt_calibration_popup', `width=450,height=550,left=${left},top=${top},resizable=yes,scrollbars=yes`);
          if (calibPopup) {
            calibPopup.addEventListener('beforeunload', () => {
              setTimeout(() => {
                if (calibPopup && calibPopup.closed) {
                  onPopupClosed();
                }
              }, 100);
            });
          }
        }
        if (calibPopup) {
          calibPopup.focus();
          writePopupContent();
        }
        
      } else if (tool === 'flood-calib') {
        // Copy saved points into calibration draft, fallback to default flood paths if empty
        const hasSaved = savedFloodPoints && savedFloodPoints.some(p => p.points && p.points.length >= 2);
        if (hasSaved) {
          floodCalibPoints = JSON.parse(JSON.stringify(savedFloodPoints));
        } else {
          floodCalibPoints = JSON.parse(JSON.stringify(defaultFloodPaths[gisCurrentImage] || []));
        }

        if (!floodCalibPopup || floodCalibPopup.closed) {
          const left = window.screenX + window.outerWidth + 10;
          const top = window.screenY;
          floodCalibPopup = window.open('', 'drnt_flood_calibration_popup', `width=450,height=550,left=${left},top=${top},resizable=yes,scrollbars=yes`);
          if (floodCalibPopup) {
            floodCalibPopup.addEventListener('beforeunload', () => {
              setTimeout(() => {
                if (floodCalibPopup && floodCalibPopup.closed) {
                  onFloodPopupClosed();
                }
              }, 100);
            });
          }
        }
        if (floodCalibPopup) {
          floodCalibPopup.focus();
          writeFloodPopupContent();
        }
        
        const calibOverlays = document.getElementById('gis-flood-calib-overlays');
        if (calibOverlays) calibOverlays.classList.remove('hidden');
        
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) canvas.classList.remove('hidden');
        const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
        if (outlineCanvas) outlineCanvas.classList.remove('hidden');
        
        drawFloodCalibMarkers();
        runFloodSimulation();
      }

      // Update result card to match active tool state
      if (tool === 'measure') {
        updateGisResult("bi bi-ruler text-[#cff245]", "Měření vzdálenosti", "Čeká na zadání bodů", "Kliknutím do mapy zvolte první bod trasy. Poté klikněte na druhý bod pro zobrazení vzdálenosti.");
      } else if (tool === 'height') {
        updateGisResult("bi bi-geo text-[#23d8ff]", "Výšková sonda (Z-sonda)", "Klikněte do mapy", "Klikněte na libovolné místo v mapě pro zobrazení jeho nadmořské výšky a zeměpisných souřadnic.");
      } else if (tool === 'area') {
        updateGisResult("bi bi-pentagon text-[#cff245]", "Měření plochy", "Vytvořte polygon", "Klikáním do mapy vytvořte vrcholy polygonu. Měření dokončíte dvojklikem na posledním bodě.");
      } else if (tool === 'profile') {
        updateGisResult("bi bi-graph-up text-[#23d8ff]", "Výškový profil", "Definujte profilovou linii", "Kliknutím na dva body v mapě vytvořte trasu, podél které se vygeneruje výškový profil terénu.");
      } else if (tool === 'slope') {
        updateGisResult("bi bi-activity text-[#cff245]", "Měření sklonu", "Zadejte svah", "Kliknutím na dva body změřte sklon svahu. Výsledek se zobrazí v procentech i stupních s barevnou indikací.");
      } else if (tool === 'calib') {
        updateGisResult("bi bi-gear-fill text-[#fbbf24]", "Kalibrace výškových bodů", "Aktivní kalibrace", "Zadejte referenční výšky geodetických bodů přímo do tabulky vpravo pro překalibrování modelu.");
      } else if (tool === 'flood-calib') {
        updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", "Aktivní kalibrace toku", "Kliknutím do mapy naklikejte body koryta řeky. V novém okně nastavte množství vody a spusťte simulaci.");
      } else if (tool !== 'flood') {
        updateGisResult("bi bi-info-circle text-[#fbbf24]", "Interaktivní GIS Nástroje", "Vyberte nástroj vlevo", "Kliknutím aktivujte měření vzdáleností, plochy, sklonu, výšek nebo simulaci záplav. Najeďte myší na tlačítko pro popis funkce.");
      }
    }

    function clearGisData(keepPopup = false) {
      gisPointA = null;
      gisPointB = null;
      polygonPoints = [];
      polygonCompleted = false;
      isDraggingNode = false;
      draggedNodeIndex = -1;

      // Reset cursor
      const canvas = document.getElementById('gis-canvas');
      if (canvas) {
        if (gisTool && gisTool !== 'calib') {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = 'grab';
        }
      }

      // Hide SVG line
      const svgLine = document.getElementById('gis-svg-line');
      if (svgLine) {
        svgLine.classList.add('hidden');
        svgLine.setAttribute('x1', '0');
        svgLine.setAttribute('y1', '0');
        svgLine.setAttribute('x2', '0');
        svgLine.setAttribute('y2', '0');
        // Reset color to default green
        svgLine.setAttribute('stroke', '#cff245');
        svgLine.style.filter = 'drop-shadow(0 0 4px rgba(207,242,69,0.6))';
      }

      // Hide SVG polygon and helper lines
      const svgPolygon = document.getElementById('gis-svg-polygon');
      if (svgPolygon) {
        svgPolygon.classList.add('hidden');
        svgPolygon.setAttribute('points', '');
        svgPolygon.setAttribute('fill', 'rgba(207, 242, 69, 0.15)');
        svgPolygon.setAttribute('stroke-width', '2');
        svgPolygon.setAttribute('stroke-dasharray', '4 2');
      }
      const tempLine = document.getElementById('gis-svg-temp-line');
      if (tempLine) tempLine.classList.add('hidden');
      const closeLine = document.getElementById('gis-svg-close-line');
      if (closeLine) closeLine.classList.add('hidden');
      
      const markersGroup = document.getElementById('gis-svg-markers');
      if (markersGroup) markersGroup.innerHTML = '';

      // Hide markers
      document.getElementById('gis-marker-a').classList.add('hidden');
      document.getElementById('gis-marker-b').classList.add('hidden');
      document.getElementById('gis-probe-crosshair').classList.add('hidden');

      // Hide cards
      updateGisResult("bi bi-info-circle text-[#fbbf24]", "Interaktivní GIS Nástroje", "Vyberte nástroj vlevo", "Kliknutím aktivujte měření vzdáleností, plochy, sklonu, výšek nebo simulaci záplav. Najeďte myší na tlačítko pro popis funkce.");
      document.getElementById('gis-profile-card').classList.add('hidden');
      document.getElementById('gis-flood-card').classList.add('hidden');
      document.getElementById('gis-flood-card').classList.remove('flex');
      document.getElementById('gis-slope-badge').classList.add('hidden');

      // Hide flood calibration overlays
      const floodCalibOverlays = document.getElementById('gis-flood-calib-overlays');
      if (floodCalibOverlays) floodCalibOverlays.classList.add('hidden');
      
      // Clear flood canvas
      const floodCanvas = document.getElementById('gis-flood-canvas');
      if (floodCanvas) {
        floodCanvas.classList.add('hidden');
        const ctx = floodCanvas.getContext('2d');
        ctx.clearRect(0, 0, floodCanvas.width, floodCanvas.height);
      }
      const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
      if (outlineCanvas) {
        outlineCanvas.classList.add('hidden');
        const ctx = outlineCanvas.getContext('2d');
        ctx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
      }

      // Close flood popup
      if (!keepPopup && floodCalibPopup && !floodCalibPopup.closed) {
        const popupRef = floodCalibPopup;
        floodCalibPopup = null;
        popupRef.close();
      }
      // floodCalibPoints = []; // Keep calibrated points for simulation

      // Hide right sidebar
      const sidebar = document.getElementById('gis-right-sidebar');
      if (sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
      }

      // Trigger reflow to adjust canvas size
      setTimeout(updateViewportTransform, 50);

      // Hide flood overlays group
      const overlays = document.getElementById('gis-flood-overlays');
      if (overlays) overlays.classList.add('hidden');
      for (let i = 1; i <= 5; i++) {
        const zone = document.getElementById(`gis-flood-zone-${i}`);
        if (zone) {
          zone.classList.add('hidden');
          zone.style.opacity = '0';
          zone.style.transform = 'scale(1)';
        }
      }

      // Hide calibration overlays
      const calibOverlays = document.getElementById('gis-calib-overlays');
      if (calibOverlays) {
        calibOverlays.classList.add('hidden');
        calibOverlays.innerHTML = '';
      }

      if (!keepPopup && calibPopup && !calibPopup.closed) {
        const popupRef = calibPopup;
        calibPopup = null;
        popupRef.close();
      }
    }

    function getViewportScaleAndOffset() {
      const canvas = document.getElementById('gis-canvas');
      if (!canvas) return { baseScale: 1, totalScale: 1, offsetX: 0, offsetY: 0, imgW: 1024, imgH: 768 };
      
      const imgW = 1024;
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      
      const baseScale = Math.min(canvas.clientWidth / imgW, canvas.clientHeight / imgH);
      const totalScale = baseScale * zoomScale;
      
      const offsetX = (canvas.clientWidth - imgW * baseScale) / 2;
      const offsetY = (canvas.clientHeight - imgH * baseScale) / 2;
      
      return { baseScale, totalScale, offsetX, offsetY, imgW, imgH };
    }

    function getMetersPerPixel() {
      return calibrationScales[gisCurrentImage] || 0.25;
    }

    function getViewportSize() {
      const { imgW, imgH } = getViewportScaleAndOffset();
      return {
        width: imgW,
        height: imgH,
        left: 0,
        top: 0
      };
    }

    function updateViewportLayout() {
      const container = document.getElementById('gis-app-container');
      const viewport = document.getElementById('gis-map-viewport');
      const modalContent = document.getElementById('gis-modal-content');
      if (!container || !viewport || !modalContent) return;

      const imgW = 1024;
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      const arImg = imgW / imgH;

      const leftSidebar = container.querySelector('.w-64');
      const rightSidebar = container.querySelector('.border-l');
      const leftWidth = leftSidebar ? leftSidebar.clientWidth : 256;
      const rightWidth = rightSidebar ? rightSidebar.clientWidth : 256;
      const totalSidebarWidth = leftWidth + rightWidth;
      
      // Calculate available height based on screen height
      const maxHeight = window.innerHeight * 0.95 - 150; // Subtract padding/header
      const targetHeight = Math.max(400, Math.min(650, maxHeight));

      // Calculate target width of map area based on aspect ratio
      const targetCanvasWidth = targetHeight * arImg;
      const totalWidth = targetCanvasWidth + totalSidebarWidth;

      // Dynamically size modal content and container
      modalContent.style.width = `${totalWidth}px`;
      modalContent.style.maxWidth = '98vw';
      container.style.height = `${targetHeight}px`;

      const { offsetX, offsetY, totalScale } = getViewportScaleAndOffset();

      // Viewport spans the actual image area exactly
      viewport.style.width = '1024px';
      viewport.style.height = `${imgH}px`;
      viewport.style.left = '0px';
      viewport.style.top = '0px';
      
      // Update viewport CSS transform (pan, center and zoom)
      viewport.style.transformOrigin = 'top left';
      viewport.style.transform = `translate(${offsetX + panX}px, ${offsetY + panY}px) scale(${totalScale})`;
    }

    function updateViewportTransform() {
      updateViewportLayout();
      
      // Update View Altitude HUD
      const hudAlt = document.getElementById('gis-hud-altitude');
      if (hudAlt) {
        const viewAlt = Math.round(150 / zoomScale);
        hudAlt.textContent = `${viewAlt} m`;
      }

      const { totalScale } = getViewportScaleAndOffset();
      const inverseScale = 1 / totalScale;

      // Scale HTML markers inversely
      const markerA = document.getElementById('gis-marker-a');
      const markerB = document.getElementById('gis-marker-b');
      if (markerA) markerA.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;
      if (markerB) markerB.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;

      // Scale Calibration markers inversely
      const cal1 = document.getElementById('gis-calib-1');
      const cal2 = document.getElementById('gis-calib-2');
      if (cal1) cal1.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;
      if (cal2) cal2.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;

      // Scale Slope badge inversely
      const slopeBadge = document.getElementById('gis-slope-badge');
      if (slopeBadge) slopeBadge.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;

      // Scale SVG lines and polygon strokes inversely
      const svgLine = document.getElementById('gis-svg-line');
      if (svgLine) svgLine.setAttribute('stroke-width', `${2 * inverseScale}`);
      
      const svgPolygon = document.getElementById('gis-svg-polygon');
      if (svgPolygon) {
        svgPolygon.setAttribute('stroke-width', `${(polygonCompleted ? 3.5 : 2) * inverseScale}`);
      }

      const tempLine = document.getElementById('gis-svg-temp-line');
      if (tempLine) tempLine.setAttribute('stroke-width', `${1.5 * inverseScale}`);

      const closeLine = document.getElementById('gis-svg-close-line');
      if (closeLine) closeLine.setAttribute('stroke-width', `${1.5 * inverseScale}`);

      // Re-draw polygon markers with new inverse scale
      drawPolygonMarkers();

      // Re-draw calibration markers with new inverse scale
      if (gisTool === 'calib') {
        drawCalibrationMarkers();
      }
    }

    function handleGisCanvasMouseDown(e) {
      if (isDraggingNode) return;
      totalPanDist = 0;
      
      // Pan with left-drag ONLY when no tool is active, or right-drag at any time
      if ((e.button === 0 && !gisTool) || e.button === 2) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        
        const canvas = document.getElementById('gis-canvas');
        if (canvas) {
          canvas.style.cursor = 'grabbing';
        }
      }
    }

    function handleGisCanvasMouseMove(e) {
      const canvas = document.getElementById('gis-canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (isPanning) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        panX += dx;
        panY += dy;
        panStartX = e.clientX;
        panStartY = e.clientY;
        totalPanDist += Math.hypot(dx, dy);
        updateViewportTransform();
        return;
      }

      if (isDraggingNode && draggedNodeIndex !== -1) {
        const { offsetX, offsetY, totalScale } = getViewportScaleAndOffset();
        const mapX = (clickX - (offsetX + panX)) / totalScale;
        const mapY = (clickY - (offsetY + panY)) / totalScale;
        
        polygonPoints[draggedNodeIndex] = { x: mapX, y: mapY };
        drawPolygonMarkers();
        
        // Redraw SVG polygon
        const svgPolygon = document.getElementById('gis-svg-polygon');
        if (svgPolygon) {
          const pointsStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');
          svgPolygon.setAttribute('points', pointsStr);
        }
        
        // Update measured area
        const area = calculatePolygonArea(polygonPoints);
        updateGisResult("bi bi-pentagon text-[#cff245]", "Měření plochy", `${area.toFixed(1)} m²`, "Plocha byla přepočtena po posunu bodu.");
        return;
      }

      updateGisDrawHelpers(clickX, clickY);
    }

    function handleGisCanvasMouseUp(e) {
      isPanning = false;
      const canvas = document.getElementById('gis-canvas');
      if (canvas) {
        if (gisTool) {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = 'grab';
        }
      }
    }

    function handleGisCanvasWheel(e) {
      e.preventDefault();
      const canvas = document.getElementById('gis-canvas');
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const zoomAmount = e.deltaY < 0 ? 0.15 : -0.15;
      const newScale = Math.max(1, Math.min(5, zoomScale + zoomAmount));

      const { offsetX, offsetY } = getViewportScaleAndOffset();

      // Zoom towards cursor location
      const mouseMapX = (clickX - offsetX - panX) / zoomScale;
      const mouseMapY = (clickY - offsetY - panY) / zoomScale;

      if (newScale === 1) {
        panX = 0;
        panY = 0;
      } else {
        panX = clickX - offsetX - mouseMapX * newScale;
        panY = clickY - offsetY - mouseMapY * newScale;
      }

      zoomScale = newScale;
      updateViewportTransform();

      // Instantly redraw helper lines and coordinates on zoom scale change
      updateGisDrawHelpers(clickX, clickY);
    }

    function handleGisCanvasDblClick(e) {
      if (gisTool !== 'flood-calib') return;
      e.preventDefault();
      
      const lastPath = floodCalibPoints[floodCalibPoints.length - 1];
      if (lastPath && !lastPath.isConcluded) {
        // Pop the second click's point (which was added by the second click of the double-click sequence)
        if (lastPath.points.length > 0) {
          lastPath.points.pop();
        }
        
        // Conclude the path
        if (lastPath.points.length >= 2) {
          lastPath.isConcluded = true;
          updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", "Tok dokončen", "Linie vodního toku byla ukončena. Kliknutím jinam začněte nový segment.");
        } else {
          // Less than 2 points is invalid, discard it
          floodCalibPoints.pop();
          updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", "Neplatný segment", "Segment byl příliš krátký a byl zrušen.");
        }
        
        drawFloodCalibMarkers();
        writeFloodPopupContent();
        runFloodSimulation();
      }
    }

    function handleGisCanvasClick(e) {
      if (totalPanDist > 5) {
        // Ignored click because it was panning drag
        return;
      }
      if (!gisTool) return;

      const canvas = document.getElementById('gis-canvas');
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert coordinates into map viewport space
      const { offsetX, offsetY, totalScale } = getViewportScaleAndOffset();
      const mapX = (clickX - (offsetX + panX)) / totalScale;
      const mapY = (clickY - (offsetY + panY)) / totalScale;

      // Update HUD coordinates using map space coords
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      const latGPS = (50.075531 - (mapY - imgH/2)*0.000005).toFixed(6);
      const lonGPS = (14.437802 + (mapX - 1024/2)*0.000008).toFixed(6);
      document.getElementById('gis-hud-coords').textContent = `LAT: ${latGPS}°, LON: ${lonGPS}°`;

      if (gisTool === 'measure') {
        if (!gisPointA) {
          // Set Point A
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        } else if (!gisPointB) {
          // Set Point B & Draw Line
          gisPointB = { x: mapX, y: mapY };
          const markerB = document.getElementById('gis-marker-b');
          markerB.style.left = `${mapX}px`;
          markerB.style.top = `${mapY}px`;
          markerB.classList.remove('hidden');

          // Draw SVG line
          const svgLine = document.getElementById('gis-svg-line');
          svgLine.setAttribute('x1', `${gisPointA.x}`);
          svgLine.setAttribute('y1', `${gisPointA.y}`);
          svgLine.setAttribute('x2', `${gisPointB.x}`);
          svgLine.setAttribute('y2', `${gisPointB.y}`);
          classListRemoveHidden = true; // variable dummy to keep code matching
          svgLine.classList.remove('hidden');

          // Compute distance (pixel-based simulation with dynamic calibration)
          const metersPerPixel = getMetersPerPixel();
          const dx = (gisPointB.x - gisPointA.x) * metersPerPixel;
          const dy = (gisPointB.y - gisPointA.y) * metersPerPixel;
          const dist = Math.sqrt(dx*dx + dy*dy).toFixed(2);

          // Show result card
          updateGisResult("bi bi-ruler text-[#cff245]", "Měření vzdálenosti", `${dist} m`, "Vzdálenost je vypočtena z ortofotografických souřadnicových matic S-JTSK s kalibrací.");
        } else {
          // Reset and start new measurement
          clearGisData();
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        }
      } else if (gisTool === 'profile') {
        if (!gisPointA) {
          // Set Point A
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        } else if (!gisPointB) {
          // Set Point B & Draw Line
          gisPointB = { x: mapX, y: mapY };
          const markerB = document.getElementById('gis-marker-b');
          markerB.style.left = `${mapX}px`;
          markerB.style.top = `${mapY}px`;
          markerB.classList.remove('hidden');

          // Draw SVG line
          const svgLine = document.getElementById('gis-svg-line');
          svgLine.setAttribute('x1', `${gisPointA.x}`);
          svgLine.setAttribute('y1', `${gisPointA.y}`);
          svgLine.setAttribute('x2', `${gisPointB.x}`);
          svgLine.setAttribute('y2', `${gisPointB.y}`);
          svgLine.setAttribute('stroke', '#23d8ff');
          svgLine.style.filter = 'drop-shadow(0 0 4px rgba(35, 216, 255, 0.6))';
          svgLine.classList.remove('hidden');

          // Compute distance and elevation heights
          const metersPerPixel = getMetersPerPixel();
          const dx = (gisPointB.x - gisPointA.x) * metersPerPixel;
          const dy = (gisPointB.y - gisPointA.y) * metersPerPixel;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const altA = getElevationAtMapCoords(gisPointA.x, gisPointA.y);
          const altB = getElevationAtMapCoords(gisPointB.x, gisPointB.y);
          const diff = altB - altA;

          // Show Profile Card
          const profileCard = document.getElementById('gis-profile-card');
          document.getElementById('gis-profile-dist').textContent = `${dist.toFixed(1)} m`;
          document.getElementById('gis-profile-diff').textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} m`;
          profileCard.classList.remove('hidden');
          profileCard.classList.add('flex');
          
          // Generate the SVG chart inside the profile card
          generateProfileChart(altA, altB, dist);
        } else {
          // Reset and start new profile
          clearGisData();
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        }
      } else if (gisTool === 'slope') {
        if (!gisPointA) {
          // Set Point A
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        } else if (!gisPointB) {
          // Set Point B & Draw Line
          gisPointB = { x: mapX, y: mapY };
          const markerB = document.getElementById('gis-marker-b');
          markerB.style.left = `${mapX}px`;
          markerB.style.top = `${mapY}px`;
          markerB.classList.remove('hidden');

          // Draw SVG line
          const svgLine = document.getElementById('gis-svg-line');
          svgLine.setAttribute('x1', `${gisPointA.x}`);
          svgLine.setAttribute('y1', `${gisPointA.y}`);
          svgLine.setAttribute('x2', `${gisPointB.x}`);
          svgLine.setAttribute('y2', `${gisPointB.y}`);
          svgLine.classList.remove('hidden');

          // Compute distance and elevation heights
          const metersPerPixel = getMetersPerPixel();
          const dx = (gisPointB.x - gisPointA.x) * metersPerPixel;
          const dy = (gisPointB.y - gisPointA.y) * metersPerPixel;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const altA = getElevationAtMapCoords(gisPointA.x, gisPointA.y);
          const altB = getElevationAtMapCoords(gisPointB.x, gisPointB.y);
          const diff = altB - altA;
          
          const slopePercent = (Math.abs(diff) / dist) * 100;
          const slopeDegrees = Math.atan(Math.abs(diff) / dist) * 180 / Math.PI;

          // Color the line based on slope severity
          let slopeColor = '#cff245'; // lime green for mild slopes (< 5%)
          if (slopePercent >= 12) {
            slopeColor = '#ef4444'; // red for steep slopes (>= 12%)
          } else if (slopePercent >= 5) {
            slopeColor = '#fbbf24'; // orange for medium slopes (5% - 12%)
          }
          svgLine.setAttribute('stroke', slopeColor);
          svgLine.style.filter = `drop-shadow(0 0 4px ${slopeColor})`;

          // Show floating slope badge at midpoint
          const midX = (gisPointA.x + gisPointB.x) / 2;
          const midY = (gisPointA.y + gisPointB.y) / 2;
          const badge = document.getElementById('gis-slope-badge');
          const badgeVal = document.getElementById('gis-slope-badge-val');
          badgeVal.textContent = `${slopePercent.toFixed(1)}% / ${slopeDegrees.toFixed(1)}°`;
          
          // Style badge icon color dynamically
          const badgeIcon = badge.querySelector('i');
          if (badgeIcon) {
            badgeIcon.style.color = slopeColor;
          }
          
          badge.style.left = `${midX}px`;
          badge.style.top = `${midY}px`;
          badge.classList.remove('hidden');

          // Show result card
          updateGisResult("bi bi-activity", "Měření sklonu a spádu", `${slopePercent.toFixed(1)}% (${slopeDegrees.toFixed(1)}°)`, `Délka svahu: ${dist.toFixed(1)} m, převýšení: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} m. Barevné značení indikuje strmost terénu.`, slopeColor);
        } else {
          // Reset and start new measurement
          clearGisData();
          gisPointA = { x: mapX, y: mapY };
          const markerA = document.getElementById('gis-marker-a');
          markerA.style.left = `${mapX}px`;
          markerA.style.top = `${mapY}px`;
          markerA.classList.remove('hidden');
        }
      } else if (gisTool === 'height') {
        clearGisData();
        
        // Place crosshair
        const crosshair = document.getElementById('gis-probe-crosshair');
        crosshair.style.left = `${mapX}px`;
        crosshair.style.top = `${mapY}px`;
        crosshair.classList.remove('hidden');

        // Compute simulated altitude (Z coord using geodetic distance in meters)
        const metersPerPixel = getMetersPerPixel();
        const dx = (mapX - rect.width / 2) * metersPerPixel;
        const dy = (mapY - rect.height / 2) * metersPerPixel;
        const radMeters = Math.sqrt(dx*dx + dy*dy);
        const alt = getElevationAtMapCoords(mapX, mapY).toFixed(2);

        // Show result card
        updateGisResult("bi bi-geo text-[#23d8ff]", "Výšková sonda (MSL)", `${alt} m n.m.`, `Ortometrická výška z digitálního modelu terénu (DMR 5G). Lat: ${latGPS} N, Lon: ${lonGPS} E.`);
      } else if (gisTool === 'area') {
        const now = Date.now();
        if (now - lastClickTime < 300) {
          if (polygonPoints.length >= 3) {
            polygonCompleted = true;

            // Hide helper lines
            const tempLine = document.getElementById('gis-svg-temp-line');
            const closeLine = document.getElementById('gis-svg-close-line');
            if (tempLine) tempLine.classList.add('hidden');
            if (closeLine) closeLine.classList.add('hidden');

            // Update polygon path & styles
            const svgPolygon = document.getElementById('gis-svg-polygon');
            if (svgPolygon) {
              const pointsStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');
              svgPolygon.setAttribute('points', pointsStr);
              svgPolygon.setAttribute('fill', 'rgba(207, 242, 69, 0.4)');
              svgPolygon.setAttribute('stroke-width', `${3.5 / zoomScale}`);
              svgPolygon.removeAttribute('stroke-dasharray');
            }

            // Re-draw point markers
            drawPolygonMarkers();

            // Calculate area
            const areaVal = calculatePolygonArea(polygonPoints);

            // Display result
            updateGisResult("bi bi-pentagon text-[#cff245]", "Měření plochy", `${areaVal.toLocaleString('cs-CZ', {maximumFractionDigits: 1})} m²`, "Výměra parcely vypočtená Gaussovou metodou (Shoelace formula) s přepočtem na měřítko.");

            lastClickTime = 0;
            return;
          }
        }
        
        lastClickTime = now;

        if (polygonCompleted) {
          clearGisData();
        }
        
        polygonPoints.push({ x: mapX, y: mapY });
        
        // Draw SVG Polygon (open path for now)
        const svgPolygon = document.getElementById('gis-svg-polygon');
        if (svgPolygon) {
          const pointsStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');
          svgPolygon.setAttribute('points', pointsStr);
          svgPolygon.setAttribute('stroke-width', `${2 / zoomScale}`);
          svgPolygon.classList.remove('hidden');
        }
        
        drawPolygonMarkers();
      } else if (gisTool === 'flood-calib') {
        const alt = getElevationAtMapCoords(mapX, mapY);
        
        // Find the active path (the last one if it is not concluded)
        let activePath = floodCalibPoints[floodCalibPoints.length - 1];
        if (!activePath || activePath.isConcluded) {
          activePath = { points: [], isClosed: false, isConcluded: false };
          floodCalibPoints.push(activePath);
        }

        // Detect if clicking near the first point to close the polygon (loop)
        if (activePath.points.length >= 3) {
          const firstPt = activePath.points[0];
          const size = getCanvasSize();
          const firstX = firstPt.rx * size.width;
          const firstY = firstPt.ry * size.height;
          const distToFirst = Math.hypot(mapX - firstX, mapY - firstY);
          if (distToFirst < 15) {
            // Close the loop by pushing the first point coordinates again
            activePath.points.push({
              rx: firstPt.rx,
              ry: firstPt.ry,
              z: firstPt.z
            });
            activePath.isClosed = true;
            activePath.isConcluded = true;
            
            drawFloodCalibMarkers();
            writeFloodPopupContent();
            runFloodSimulation();
            updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", `Uzavřená plocha: ${activePath.points.length - 1} bodů`, "Detekována uzavřená vodní plocha. Kliknutím jinam začněte kreslit další tok.");
            return;
          }
        }

        const size = getCanvasSize();
        activePath.points.push({
          rx: mapX / size.width,
          ry: mapY / size.height,
          z: alt
        });
        
        drawFloodCalibMarkers();
        writeFloodPopupContent();
        runFloodSimulation();
        updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", `Kreslení toku: ${activePath.points.length} bodů`, "Dvojklikem na volné místo dokončíte linii. Kliknutím na první bod uzavřete vodní plochu.");
      }
    }

    function updateGisDrawHelpers(clickX, clickY) {
      const canvas = document.getElementById('gis-canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const { offsetX, offsetY, totalScale } = getViewportScaleAndOffset();
      const mapX = (clickX - (offsetX + panX)) / totalScale;
      const mapY = (clickY - (offsetY + panY)) / totalScale;

      // HUD Coordinates update
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      const latGPS = (50.075531 - (mapY - imgH/2)*0.000005).toFixed(6);
      const lonGPS = (14.437802 + (mapX - 1024/2)*0.000008).toFixed(6);
      document.getElementById('gis-hud-coords').textContent = `LAT: ${latGPS}°, LON: ${lonGPS}°`;

      // Helper line for measure, profile, slope
      if ((gisTool === 'measure' || gisTool === 'profile' || gisTool === 'slope') && gisPointA && !gisPointB) {
        const tempLine = document.getElementById('gis-svg-temp-line');
        if (tempLine) {
          tempLine.setAttribute('x1', `${gisPointA.x}`);
          tempLine.setAttribute('y1', `${gisPointA.y}`);
          tempLine.setAttribute('x2', `${mapX}`);
          tempLine.setAttribute('y2', `${mapY}`);
          tempLine.setAttribute('stroke-width', `${1.5 / zoomScale}`);
          
          let color = '#cff245';
          if (gisTool === 'profile') color = '#23d8ff';
          tempLine.setAttribute('stroke', color);
          tempLine.classList.remove('hidden');
        }
        return;
      }

      if (!gisTool || gisTool !== 'area' || polygonPoints.length === 0 || polygonCompleted) {
        const tempLine = document.getElementById('gis-svg-temp-line');
        if (tempLine && (!gisPointA || gisPointB)) tempLine.classList.add('hidden');
        return;
      }

      const lastPoint = polygonPoints[polygonPoints.length - 1];
      const tempLine = document.getElementById('gis-svg-temp-line');
      if (tempLine) {
        tempLine.setAttribute('x1', `${lastPoint.x}`);
        tempLine.setAttribute('y1', `${lastPoint.y}`);
        tempLine.setAttribute('x2', `${mapX}`);
        tempLine.setAttribute('y2', `${mapY}`);
        tempLine.setAttribute('stroke-width', `${1.5 / zoomScale}`);
        tempLine.setAttribute('stroke', '#cff245');
        tempLine.classList.remove('hidden');
      }

      const firstPoint = polygonPoints[0];
      const closeLine = document.getElementById('gis-svg-close-line');
      if (closeLine) {
        closeLine.setAttribute('x1', `${mapX}`);
        closeLine.setAttribute('y1', `${mapY}`);
        closeLine.setAttribute('x2', `${firstPoint.x}`);
        closeLine.setAttribute('y2', `${firstPoint.y}`);
        closeLine.setAttribute('stroke-width', `${1.5 / zoomScale}`);
        closeLine.classList.remove('hidden');
      }
    }

    function drawPolygonMarkers() {
      const markersGroup = document.getElementById('gis-svg-markers');
      if (!markersGroup) return;
      markersGroup.innerHTML = '';
      
      polygonPoints.forEach((p, idx) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${p.x}`);
        circle.setAttribute('cy', `${p.y}`);
        
        const baseRadius = idx === 0 ? 7 : 6;
        circle.setAttribute('r', `${baseRadius / zoomScale}`);
        circle.setAttribute('stroke-width', `${2 / zoomScale}`);
        
        circle.setAttribute('fill', '#cff245');
        circle.setAttribute('stroke', '#12141a');
        circle.setAttribute('style', `pointer-events: auto; cursor: ${polygonCompleted ? 'grab' : 'default'};`);
        
        circle.addEventListener('mousedown', e => {
          if (!polygonCompleted) return;
          e.stopPropagation();
          isDraggingNode = true;
          draggedNodeIndex = idx;
          circle.setAttribute('style', 'pointer-events: auto; cursor: grabbing;');
        });

        markersGroup.appendChild(circle);
      });
    }

    window.addEventListener('mouseup', () => {
      if (isDraggingNode) {
        isDraggingNode = false;
        draggedNodeIndex = -1;
        drawPolygonMarkers();
      }
    });

    function calculatePolygonArea(points) {
      let area = 0;
      const metersPerPixel = getMetersPerPixel();
      const scaledPoints = points.map(p => ({ x: p.x * metersPerPixel, y: p.y * metersPerPixel }));
      
      for (let i = 0; i < scaledPoints.length; i++) {
        const p1 = scaledPoints[i];
        const p2 = scaledPoints[(i + 1) % scaledPoints.length];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      return Math.abs(area / 2);
    }

    function getCanvasSize() {
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      return { width: 1024, height: imgH };
    }

    function getElevationAtMapCoords(mapX, mapY) {
      const points = calibrationData[gisCurrentImage];
      if (!points || points.length === 0) return 300.0;
      
      const size = getCanvasSize();
      
      // Inverse Distance Weighting (IDW) interpolation
      let sumWeights = 0;
      let sumWeightedHeights = 0;
      const p = 2; // Power parameter
      
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const ptX = pt.rx * size.width;
        const ptY = pt.ry * size.height;
        
        const dx = mapX - ptX;
        const dy = mapY - ptY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 2) { // Extremely close to a calibration point
          return pt.alt;
        }
        
        const weight = 1 / Math.pow(dist, p);
        sumWeights += weight;
        sumWeightedHeights += weight * pt.alt;
      }
      
      return sumWeightedHeights / sumWeights;
    }

    function drawCalibrationMarkers() {
      const group = document.getElementById('gis-calib-overlays');
      if (!group) return;
      group.innerHTML = '';
      
      const points = calibrationData[gisCurrentImage];
      if (!points) return;
      
      const size = getCanvasSize();
      
      points.forEach(pt => {
        const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        markerGroup.setAttribute('class', 'cursor-pointer');
        markerGroup.setAttribute('style', 'pointer-events: auto;');
        markerGroup.addEventListener('click', (e) => {
          e.stopPropagation();
          if (calibPopup && !calibPopup.closed) {
            const popupInput = calibPopup.document.getElementById(`popup-calib-input-${pt.id}`);
            if (popupInput) {
              calibPopup.focus();
              popupInput.focus();
              popupInput.select();
            }
          } else {
            const input = document.getElementById(`gis-calib-input-${pt.id}`);
            if (input) {
              input.focus();
              input.select();
            }
          }
        });
        
        const isHighlighted = (highlightedMarkerId === pt.id);
        
        const ptX = pt.rx * size.width;
        const ptY = pt.ry * size.height;

        // Outer pulsing glow
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', `${ptX}`);
        glow.setAttribute('cy', `${ptY}`);
        if (isHighlighted) {
          glow.setAttribute('r', `${22 / zoomScale}`);
          glow.setAttribute('fill', 'rgba(207, 242, 69, 0.55)');
          glow.setAttribute('stroke', '#cff245');
          glow.setAttribute('stroke-width', `${2.5 / zoomScale}`);
          glow.setAttribute('class', 'map-pin-pulse');
        } else {
          glow.setAttribute('r', `${12 / zoomScale}`);
          glow.setAttribute('fill', 'rgba(251, 191, 36, 0.2)');
          glow.setAttribute('stroke', '#fbbf24');
          glow.setAttribute('stroke-width', `${1 / zoomScale}`);
        }
        markerGroup.appendChild(glow);
        
        // Inner solid circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${ptX}`);
        circle.setAttribute('cy', `${ptY}`);
        circle.setAttribute('r', `${8 / zoomScale}`);
        circle.setAttribute('fill', isHighlighted ? '#cff245' : '#fbbf24');
        circle.setAttribute('stroke', '#0f1013');
        circle.setAttribute('stroke-width', `${1.5 / zoomScale}`);
        markerGroup.appendChild(circle);
        
        // Text number
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${ptX}`);
        text.setAttribute('y', `${ptY + 3 / zoomScale}`);
        text.setAttribute('fill', '#0f1013');
        text.setAttribute('font-size', `${9 / zoomScale}`);
        text.setAttribute('font-family', 'monospace');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = `${pt.id}`;
        markerGroup.appendChild(text);
        
        group.appendChild(markerGroup);
      });
    }

    function populateCalibrationTable() {
      const tbody = document.getElementById('gis-calib-table-body');
      if (!tbody) return;
      tbody.innerHTML = '';
      
      const points = calibrationData[gisCurrentImage];
      if (!points) return;
      
      points.forEach(pt => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/[0.02] hover:bg-white/[0.02] transition";
        tr.addEventListener('mouseenter', () => highlightMarker(pt.id));
        tr.addEventListener('mouseleave', () => clearHighlightMarker());
        
        // ID
        const tdId = document.createElement('td');
        tdId.className = "py-1 font-bold text-[#fbbf24]";
        tdId.textContent = `#${pt.id}`;
        tr.appendChild(tdId);
        
        // Description
        const tdDesc = document.createElement('td');
        tdDesc.className = "py-1 text-gray-400 truncate max-w-[180px]";
        tdDesc.textContent = pt.desc;
        tdDesc.title = pt.desc;
        tr.appendChild(tdDesc);
        
        // Input
        const tdVal = document.createElement('td');
        tdVal.className = "py-0.5 text-right";
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `gis-calib-input-${pt.id}`;
        input.value = pt.alt;
        input.step = '0.1';
        input.className = "w-16 bg-black/40 border border-white/10 text-white rounded px-1 py-0.5 text-right font-mono text-[9px] focus:border-[#fbbf24] outline-none";
        input.addEventListener('focus', () => highlightMarker(pt.id));
        input.addEventListener('blur', () => clearHighlightMarker());
        input.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            pt.alt = val;
            // Update active measurements dynamically if point is updated!
            if (gisPointA && gisPointB) {
              const metersPerPixel = getMetersPerPixel();
              const dx = (gisPointB.x - gisPointA.x) * metersPerPixel;
              const dy = (gisPointB.y - gisPointA.y) * metersPerPixel;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const altA = getElevationAtMapCoords(gisPointA.x, gisPointA.y);
              const altB = getElevationAtMapCoords(gisPointB.x, gisPointB.y);
              
              if (gisTool === 'profile') {
                document.getElementById('gis-profile-diff').textContent = `${altB - altA >= 0 ? '+' : ''}${(altB - altA).toFixed(1)} m`;
                generateProfileChart(altA, altB, dist);
              } else if (gisTool === 'slope') {
                const diff = altB - altA;
                const slopePercent = (Math.abs(diff) / dist) * 100;
                const slopeDegrees = Math.atan(Math.abs(diff) / dist) * 180 / Math.PI;
                let slopeColor = '#cff245';
                if (slopePercent >= 12) slopeColor = '#ef4444';
                else if (slopePercent >= 5) slopeColor = '#fbbf24';
                
                const svgLine = document.getElementById('gis-svg-line');
                if (svgLine) {
                  svgLine.setAttribute('stroke', slopeColor);
                  svgLine.style.filter = `drop-shadow(0 0 4px ${slopeColor})`;
                }
                
                document.getElementById('gis-slope-badge-val').textContent = `${slopePercent.toFixed(1)}% / ${slopeDegrees.toFixed(1)}°`;
                document.getElementById('gis-card-value').textContent = `${slopePercent.toFixed(1)}% (${slopeDegrees.toFixed(1)}°)`;
                document.getElementById('gis-card-desc').textContent = `Délka svahu: ${dist.toFixed(1)} m, převýšení: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} m. Barevné značení indikuje strmost terénu.`;
              }
            }
          }
        });
        tdVal.appendChild(input);
        tr.appendChild(tdVal);
        
        tbody.appendChild(tr);
      });
    }

    function resetCalibDefault() {
      calibrationData[gisCurrentImage] = JSON.parse(JSON.stringify(defaultCalibrationData[gisCurrentImage]));
      populateCalibrationTable();
      drawCalibrationMarkers();
      
      // Update any measurements
      if (gisPointA && gisPointB) {
        const input = document.getElementById(`gis-calib-input-1`);
        if (input) input.dispatchEvent(new Event('input'));
      }
    }

    let calibPopup = null;
    let floodCalibPopup = null;
    let floodCalibPoints = [];
    let savedFloodPoints = []; // Loaded from localStorage
    let floodCalibVolume = 0.0;
    let highlightedMarkerId = null;
    let floodAnimationId = null;

    function highlightMarker(id) {
      highlightedMarkerId = id;
      drawCalibrationMarkers();
    }

    function clearHighlightMarker() {
      highlightedMarkerId = null;
      drawCalibrationMarkers();
    }

    function writePopupContent() {
      if (!calibPopup || calibPopup.closed) return;
      
      const points = calibrationData[gisCurrentImage];
      const locationNames = {
        1: "Village Corridor (Údolí)",
        2: "Castle Ruins (Hradní zřícenina)",
        3: "Industrial Park (Průmyslový areál)",
        4: "Mountain Ridge (Horský hřeben)",
        5: "River Delta (Říční delta)"
      };
      const locName = locationNames[gisCurrentImage] || "Neznámá lokalita";

      let tableRows = '';
      points.forEach(pt => {
        tableRows += `
          <tr class="border-b border-white/[0.04] hover:bg-white/[0.02] transition"
              onmouseenter="window.opener.highlightMarker(${pt.id})"
              onmouseleave="window.opener.clearHighlightMarker()">
            <td class="py-2.5 px-3 font-bold text-[#fbbf24] text-center">#${pt.id}</td>
            <td class="py-2.5 px-3 text-gray-300 font-medium text-xs">${pt.desc}</td>
            <td class="py-2.5 px-3 text-right">
              <input type="number" 
                     id="popup-calib-input-${pt.id}"
                     value="${pt.alt.toFixed(1)}"
                     step="0.1"
                     class="w-20 bg-black/40 border border-white/10 text-white rounded px-2 py-1 text-right font-mono text-xs focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] outline-none"
                     onfocus="window.opener.highlightMarker(${pt.id})"
                     onblur="window.opener.clearHighlightMarker()"
                     oninput="window.opener.updateCalibrationPoint(${pt.id}, this.value)">
            </td>
          </tr>
        `;
      });

      const popupHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Kalibrace výškových bodů - Dronaut</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #0d0e11;
    }
  </style>
</head>
<body class="text-white p-6 flex flex-col h-screen select-none">
  <div class="flex flex-col gap-4 h-full">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-3 flex-none">
      <div class="flex items-center gap-2">
        <i class="bi bi-gear-fill text-[#fbbf24] text-lg"></i>
        <h1 class="font-bold text-sm uppercase tracking-wider text-gray-200 font-sans">Kalibrace výšek</h1>
      </div>
      <span class="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono text-gray-400">
        Lokalita ${gisCurrentImage}/5
      </span>
    </div>
    
    <!-- Active Location -->
    <div class="bg-[#12141a] border border-white/5 p-3.5 rounded-xl flex-none">
      <div class="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-sans text-left">Aktivní ortofotomapa</div>
      <div class="text-[#fbbf24] font-bold text-sm mt-0.5 flex items-center gap-1.5 font-sans justify-start">
        <i class="bi bi-map"></i>
        <span>${locName}</span>
      </div>
    </div>
    
    <!-- Table Container -->
    <div class="overflow-y-auto flex-1 border border-white/5 bg-[#12141a]/60 rounded-xl mt-1">
      <table class="w-full text-left text-xs font-mono">
        <thead>
          <tr class="text-gray-500 border-b border-white/5 bg-[#12141a]">
            <th class="py-2.5 px-3 w-12 text-center uppercase text-[10px] font-bold font-sans">Bod</th>
            <th class="py-2.5 px-3 uppercase text-[10px] font-bold font-sans">Popis umístění</th>
            <th class="py-2.5 px-3 w-24 text-right uppercase text-[10px] font-bold font-sans">Výška (m)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    
    <!-- Footer Controls -->
    <div class="flex flex-col gap-3 pt-3 border-t border-white/10 flex-none">
      <div class="flex items-center justify-between gap-3">
        <button type="button" 
                onclick="window.opener.saveCalibrationToDb()" 
                class="flex-1 bg-[#cff245] hover:opacity-90 text-black font-bold text-xs uppercase py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#cff245]/15 font-sans">
          <i class="bi bi-floppy-fill"></i>
          <span>Uložit hodnoty</span>
        </button>
        <button type="button" 
                onclick="window.opener.resetCalibDefaultFromPopup()" 
                class="px-3 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl transition flex items-center justify-center py-2.5 text-xs font-bold"
                title="Obnovit výchozí hodnoty">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
      </div>
      <div id="save-status-msg" class="text-[10px] text-center text-gray-500 font-sans mt-0.5 transition-all duration-300 hidden">
        Hodnoty byly uloženy do databáze.
      </div>
    </div>
  </div>
</body>
</html>
      `;

      calibPopup.document.open();
      calibPopup.document.write(popupHtml);
      calibPopup.document.close();
    }

    function updateCalibrationPoint(id, valStr) {
      const val = parseFloat(valStr);
      const points = calibrationData[gisCurrentImage];
      if (!points) return;
      
      const pt = points.find(p => p.id === id);
      if (pt && !isNaN(val)) {
        pt.alt = val;
        
        // Update hidden local table input if it exists
        const localInput = document.getElementById(`gis-calib-input-${id}`);
        if (localInput) {
          localInput.value = val;
        }

        // Update active measurements dynamically
        if (gisPointA && gisPointB) {
          const metersPerPixel = getMetersPerPixel();
          const dx = (gisPointB.x - gisPointA.x) * metersPerPixel;
          const dy = (gisPointB.y - gisPointA.y) * metersPerPixel;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const altA = getElevationAtMapCoords(gisPointA.x, gisPointA.y);
          const altB = getElevationAtMapCoords(gisPointB.x, gisPointB.y);
          
          if (gisTool === 'profile') {
            document.getElementById('gis-profile-diff').textContent = `${altB - altA >= 0 ? '+' : ''}${(altB - altA).toFixed(1)} m`;
            generateProfileChart(altA, altB, dist);
          } else if (gisTool === 'slope') {
            const diff = altB - altA;
            const slopePercent = (Math.abs(diff) / dist) * 100;
            const slopeDegrees = Math.atan(Math.abs(diff) / dist) * 180 / Math.PI;
            let slopeColor = '#cff245';
            if (slopePercent >= 12) slopeColor = '#ef4444';
            else if (slopePercent >= 5) slopeColor = '#fbbf24';
            
            const svgLine = document.getElementById('gis-svg-line');
            if (svgLine) {
              svgLine.setAttribute('stroke', slopeColor);
              svgLine.style.filter = `drop-shadow(0 0 4px ${slopeColor})`;
            }
            
            document.getElementById('gis-slope-badge-val').textContent = `${slopePercent.toFixed(1)}% / ${slopeDegrees.toFixed(1)}°`;
            document.getElementById('gis-card-value').textContent = `${slopePercent.toFixed(1)}% (${slopeDegrees.toFixed(1)}°)`;
            document.getElementById('gis-card-desc').textContent = `Délka svahu: ${dist.toFixed(1)} m, převýšení: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} m. Barevné značení indikuje strmost terénu.`;
          }
        }
      }
    }

    function resetCalibDefaultFromPopup() {
      calibrationData[gisCurrentImage] = JSON.parse(JSON.stringify(defaultCalibrationData[gisCurrentImage]));
      
      // Update database
      try {
        localStorage.setItem('dronaut_gis_calibration', JSON.stringify(calibrationData));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }

      populateCalibrationTable();
      drawCalibrationMarkers();
      writePopupContent();

      // Show reset feedback
      if (calibPopup && !calibPopup.closed) {
        const statusMsg = calibPopup.document.getElementById('save-status-msg');
        if (statusMsg) {
          statusMsg.textContent = "Obnoveny výchozí hodnoty a uloženy do databáze.";
          statusMsg.className = "text-[10px] text-center text-[#fbbf24] font-semibold font-sans mt-0.5";
          statusMsg.classList.remove('hidden');
          setTimeout(() => {
            if (calibPopup && !calibPopup.closed) {
              const msg = calibPopup.document.getElementById('save-status-msg');
              if (msg) msg.classList.add('hidden');
            }
          }, 3000);
        }
      }
      
      if (gisPointA && gisPointB) {
        updateCalibrationPoint(1, calibrationData[gisCurrentImage][0].alt.toString());
      }
    }

    function saveCalibrationToDb() {
      try {
        localStorage.setItem('dronaut_gis_calibration', JSON.stringify(calibrationData));

        // Backup to local server
        fetch('/api/save_calibration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'elevation',
            image: gisCurrentImage,
            data: calibrationData[gisCurrentImage]
          })
        }).catch(err => console.error("Failed to backup elevation calibration:", err));
        
        // Show status message in popup
        if (calibPopup && !calibPopup.closed) {
          const statusMsg = calibPopup.document.getElementById('save-status-msg');
          if (statusMsg) {
            statusMsg.textContent = "Hodnoty byly úspěšně uloženy do databáze.";
            statusMsg.className = "text-[10px] text-center text-[#cff245] font-semibold font-sans mt-0.5 animate-pulse";
            statusMsg.classList.remove('hidden');
            
            setTimeout(() => {
              if (calibPopup && !calibPopup.closed) {
                const msg = calibPopup.document.getElementById('save-status-msg');
                if (msg) msg.classList.add('hidden');
              }
            }, 3000);
          }
        }
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
    }

    function onPopupClosed() {
      calibPopup = null;
      setGisTool(null);
    }

    function drawFloodCalibMarkers() {
      const pathsGroup = document.getElementById('gis-flood-calib-paths');
      const markersGroup = document.getElementById('gis-flood-calib-markers');
      if (!pathsGroup || !markersGroup) return;

      pathsGroup.innerHTML = '';
      markersGroup.innerHTML = '';

      if (floodCalibPoints.length === 0) return;

      const size = getCanvasSize();

      floodCalibPoints.forEach((path, pIdx) => {
        const points = path.points;
        if (points.length < 2) return;

        // Project coordinate points relative to virtual 1024x768 scale
        const projectedPoints = points.map(p => {
          return {
            x: p.rx * size.width,
            y: p.ry * size.height,
            z: p.z
          };
        });

        // Draw polyline
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const pointsStr = projectedPoints.map(p => `${p.x},${p.y}`).join(' ');
        poly.setAttribute('points', pointsStr);
        
        if (path.isClosed) {
          poly.setAttribute('fill', 'rgba(35, 216, 255, 0.15)');
        } else {
          poly.setAttribute('fill', 'none');
        }
        poly.setAttribute('stroke', '#23d8ff');
        poly.setAttribute('stroke-width', '3');
        poly.setAttribute('stroke-dasharray', '4 2');
        poly.setAttribute('filter', 'drop-shadow(0 0 3px rgba(35,216,255,0.4))');
        pathsGroup.appendChild(poly);

        // Draw markers for this sub-path
        projectedPoints.forEach((pt, idx) => {
          // Skip last point of closed path to avoid double markers
          if (path.isClosed && idx === projectedPoints.length - 1) return;

          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", pt.x);
          circle.setAttribute("cy", pt.y);
          circle.setAttribute("r", "5");
          circle.setAttribute("fill", "#fbbf24");
          circle.setAttribute("stroke", "#ffffff");
          circle.setAttribute("stroke-width", "1.5");
          circle.setAttribute("filter", "drop-shadow(0 0 4px rgba(251,191,36,0.8))");
          circle.style.cursor = 'pointer';
          
          const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
          title.textContent = `Linie #${pIdx + 1}, Bod #${idx + 1}: ${pt.z.toFixed(1)} m n.m.`;
          circle.appendChild(title);

          markersGroup.appendChild(circle);
        });
      });
    }

    function updateFloodCalibVolume(val) {
      floodCalibVolume = parseFloat(val);
      writeFloodPopupContent();
      runFloodSimulation();
    }

    function clearFloodPath() {
      floodCalibPoints = [];
      localStorage.setItem('drnt_flood_calib_points_' + gisCurrentImage, JSON.stringify(floodCalibPoints));
      drawFloodCalibMarkers();
      writeFloodPopupContent();
      
      const canvas = document.getElementById('gis-flood-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", `Žádná trasa`, "Zahajte kliknutím do mapy.");
    }

    function onFloodPopupClosed() {
      floodCalibPopup = null;
      setGisTool(null);
    }

    function saveFloodPath() {
      if (floodCalibPoints.length === 0 || !floodCalibPoints.some(p => p.points.length >= 2)) {
        alert("Pro uložení koryta je nutné mít alespoň 1 linii o 2 bodech.");
        return;
      }
      savedFloodPoints = JSON.parse(JSON.stringify(floodCalibPoints));
      localStorage.setItem('drnt_saved_flood_points_v2_' + gisCurrentImage, JSON.stringify(savedFloodPoints));
      
      // Backup to local server
      fetch('/api/save_calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flood',
          image: gisCurrentImage,
          data: savedFloodPoints
        })
      }).catch(err => console.error("Failed to backup flood paths:", err));

      drawFloodCalibMarkers();
      writeFloodPopupContent();
      
      alert("Koryta a vodní plochy byly úspěšně uloženy do systému. Nyní můžete spustit standardní 'Simulaci záplav'.");
    }

    function deleteSavedFloodPath() {
      if (confirm("Opravdu chcete smazat uložené trasy ze systému?")) {
        savedFloodPoints = [];
        localStorage.removeItem('drnt_saved_flood_points_v2_' + gisCurrentImage);
        
        // Also sync the active draft so it reflects the deletion
        floodCalibPoints = [];
        drawFloodCalibMarkers();
        writeFloodPopupContent();
        
        // Clear canvas
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        alert("Uložené koryto bylo smazáno ze systému.");
      }
    }

    function deleteFloodPoint(pIdx, idx) {
      const path = floodCalibPoints[pIdx];
      if (path) {
        path.points.splice(idx, 1);
        
        // If it was closed but now has too few points to form a polygon
        if (path.points.length < 3) {
          path.isClosed = false;
        }
        
        // Remove sub-path completely if it is now empty
        if (path.points.length === 0) {
          floodCalibPoints.splice(pIdx, 1);
        }
      }
      
      drawFloodCalibMarkers();
      writeFloodPopupContent();
      runFloodSimulation();
      
      const activePath = floodCalibPoints[floodCalibPoints.length - 1];
      if (activePath) {
        updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", `Aktivní kalibrace`, "Bod byl smazán.");
      } else {
        updateGisResult("bi bi-droplet-fill text-[#23d8ff]", "Kalibrace záplav", `Žádná trasa`, "Zahajte kliknutím do mapy.");
      }
    }

    function getDistanceToSegment(x, y, x1, y1, x2, y2) {
      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) {
        param = dot / lenSq;
      }

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      return {
        distance: Math.sqrt(dx * dx + dy * dy),
        x: xx,
        y: yy
      };
    }

    function isPointInPolygon(x, y, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function isPointInAnyPolygon(x, y, paths) {
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        if (path.isClosed && isPointInPolygon(x, y, path.points)) {
          return { inside: true, pathIndex: i };
        }
      }
      return { inside: false };
    }

    function getDistanceToPolyline(x, y, paths) {
      let minDst = Infinity;
      let closestPointOnLine = null;
      let segmentIndex = 0;
      let pathIndex = 0;

      paths.forEach((path, pIdx) => {
        const points = path.points;
        if (points.length < 2) return;
        
        const isClosed = path.isClosed;
        const count = isClosed ? points.length : points.length - 1;

        for (let i = 0; i < count; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          const res = getDistanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          if (res.distance < minDst) {
            minDst = res.distance;
            closestPointOnLine = { x: res.x, y: res.y };
            segmentIndex = i;
            pathIndex = pIdx;
          }
        }
      });

      return {
        distance: minDst,
        closestPoint: closestPointOnLine,
        segmentIndex: segmentIndex,
        pathIndex: pathIndex
      };
    }

    function simulateFloodAreaOnly(volume, useSaved = false) {
      let rawPts = useSaved ? savedFloodPoints : floodCalibPoints;
      const hasAnyValidPath = rawPts && rawPts.some(p => p.points && p.points.length >= 2);
      if (useSaved && !hasAnyValidPath) {
        rawPts = defaultFloodPaths[gisCurrentImage] || [];
      }

      if (!rawPts || rawPts.length === 0) return 0;
      const hasValidPath = rawPts.some(p => p.points && p.points.length >= 2);
      if (!hasValidPath) return 0;

      const imgW = 1024;
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      
      const pts = rawPts.map(path => {
        return {
          ...path,
          points: path.points.map(pt => ({
            x: pt.rx * imgW,
            y: pt.ry * imgH,
            z: pt.z
          }))
        };
      });

      const grid = 8;
      const cols = Math.ceil(imgW / grid);
      const rows = Math.ceil(imgH / grid);

      const floodedGrid = Array.from({ length: cols }, () => new Uint8Array(rows));
      const maxWaterZGrid = Array.from({ length: cols }, () => new Float32Array(rows));
      const queue = [];

      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
          const px = gx * grid + grid / 2;
          const py = gy * grid + grid / 2;

          const inPolyRes = isPointInAnyPolygon(px, py, pts);
          if (inPolyRes.inside) {
            const res = getDistanceToPolyline(px, py, pts);
            let riverZ = 300.0;
            if (res.distance !== Infinity) {
              const path = pts[res.pathIndex];
              const ptA = path.points[res.segmentIndex];
              const ptB = path.points[(res.segmentIndex + 1) % path.points.length];
              const dx = ptB.x - ptA.x;
              const dy = ptB.y - ptA.y;
              const lenSq = dx * dx + dy * dy;
              let t = 0;
              if (lenSq > 0) {
                t = ((px - ptA.x) * dx + (py - ptA.y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
              }
              riverZ = ptA.z + t * (ptB.z - ptA.z);
            }
            floodedGrid[gx][gy] = 1;
            if (volume > 0) {
              const wz = riverZ + volume;
              maxWaterZGrid[gx][gy] = wz;
              queue.push({ gx, gy, waterZ: wz });
            }
          } else {
            const res = getDistanceToPolyline(px, py, pts);
            if (res.distance <= 8.0) {
              const path = pts[res.pathIndex];
              const ptA = path.points[res.segmentIndex];
              const ptB = path.points[(res.segmentIndex + 1) % path.points.length];
              const dx = ptB.x - ptA.x;
              const dy = ptB.y - ptA.y;
              const lenSq = dx * dx + dy * dy;
              let t = 0;
              if (lenSq > 0) {
                t = ((px - ptA.x) * dx + (py - ptA.y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
              }
              const riverZ = ptA.z + t * (ptB.z - ptA.z);

              floodedGrid[gx][gy] = 1;
              if (volume > 0) {
                const wz = riverZ + volume;
                maxWaterZGrid[gx][gy] = wz;
                queue.push({ gx, gy, waterZ: wz });
              }
            }
          }
        }
      }

      if (volume > 0) {
        const neighbors = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        let qHead = 0;
        while (qHead < queue.length) {
          const curr = queue[qHead++];
          for (let i = 0; i < neighbors.length; i++) {
            const nx = curr.gx + neighbors[i].dx;
            const ny = curr.gy + neighbors[i].dy;

            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            if (curr.waterZ <= maxWaterZGrid[nx][ny]) continue;

            const npx = nx * grid + grid / 2;
            const npy = ny * grid + grid / 2;
            const cellZ = getElevationAtMapCoords(npx, npy);
            
            if (curr.waterZ >= cellZ) {
              floodedGrid[nx][ny] = 1;
              maxWaterZGrid[nx][ny] = curr.waterZ;
              queue.push({ gx: nx, gy: ny, waterZ: curr.waterZ });
            }
          }
        }
      }

      let floodedCells = 0;
      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
          if (floodedGrid[gx][gy] === 1) {
            floodedCells++;
          }
        }
      }

      const metersPerPixel = getMetersPerPixel();
      const cellAreaInSqMeters = (grid * metersPerPixel) * (grid * metersPerPixel);
      return floodedCells * cellAreaInSqMeters;
    }

    const gisFloodConfig = {
      1: { maxVolume: 2.0, headLoss: 0.10, propagateFromPonds: false },
      2: { maxVolume: 4.0, headLoss: 0.32, propagateFromPonds: true },
      3: { maxVolume: 4.0, headLoss: 0.05, propagateFromPonds: true },
      4: { maxVolume: 4.0, headLoss: 0.05, propagateFromPonds: true },
      5: { maxVolume: 26.0, headLoss: 0.01, propagateFromPonds: true }
    };

    function runFloodSimulation(useSaved = false) {
      const canvas = document.getElementById('gis-flood-canvas');
      const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
      if (!canvas) return 0;

      const config = gisFloodConfig[gisCurrentImage] || { maxVolume: 2.0, headLoss: 0.10, propagateFromPonds: false };
      const imgW = 1024;
      const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
      if (canvas.width !== imgW) canvas.width = imgW;
      if (canvas.height !== imgH) canvas.height = imgH;
      if (outlineCanvas) {
        if (outlineCanvas.width !== imgW) outlineCanvas.width = imgW;
        if (outlineCanvas.height !== imgH) outlineCanvas.height = imgH;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let outlineCtx = null;
      if (outlineCanvas) {
        outlineCtx = outlineCanvas.getContext('2d');
        outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
      }

      let rawPts = useSaved ? savedFloodPoints : floodCalibPoints;
      const hasAnyValidPath = rawPts && rawPts.some(p => p.points && p.points.length >= 2);
      if (useSaved && !hasAnyValidPath) {
        rawPts = defaultFloodPaths[gisCurrentImage] || [];
      }

      if (!rawPts || rawPts.length === 0) return 0;

      const hasValidPath = rawPts.some(p => p.points && p.points.length >= 2);
      if (!hasValidPath) return 0;

      // Project rawPts (percent space) to current logical canvas width/height
      const pts = rawPts.map(path => {
        return {
          ...path,
          points: path.points.map(pt => ({
            x: pt.rx * canvas.width,
            y: pt.ry * canvas.height,
            z: pt.z
          }))
        };
      });

      // Find min Z for each path dynamically from current terrain calibration
      const pathMinZ = pts.map(path => {
        let minZ = Infinity;
        path.points.forEach(pt => {
          const z = getElevationAtMapCoords(pt.x, pt.y);
          if (z < minZ) minZ = z;
        });
        return minZ === Infinity ? 300.0 : minZ;
      });

      const w = canvas.width;
      const h = canvas.height;
      const grid = 8;
      const cols = Math.ceil(w / grid);
      const rows = Math.ceil(h / grid);

      // Initialize static function cache if not present
      runFloodSimulation.cache = runFloodSimulation.cache || {
        imageIndex: null,
        floodSignature: "",
        calibSignature: "",
        elevationGrid: null,
        floodInitGrid: null
      };

      const cache = runFloodSimulation.cache;
      const currentFloodSignature = JSON.stringify(rawPts);
      const currentCalibSignature = JSON.stringify(calibrationData[gisCurrentImage]);

      const needsRecompute = cache.imageIndex !== gisCurrentImage || 
                             cache.floodSignature !== currentFloodSignature || 
                             cache.calibSignature !== currentCalibSignature || 
                             !cache.elevationGrid || 
                             !cache.floodInitGrid;

      const startTime = performance.now();

      if (needsRecompute) {
        const recomputeStart = performance.now();
        
        cache.imageIndex = gisCurrentImage;
        cache.floodSignature = currentFloodSignature;
        cache.calibSignature = currentCalibSignature;
        cache.elevationGrid = Array.from({ length: cols }, () => new Float64Array(rows));
        cache.floodInitGrid = Array.from({ length: cols }, () => new Array(rows));

        for (let gx = 0; gx < cols; gx++) {
          for (let gy = 0; gy < rows; gy++) {
            const px = gx * grid + grid / 2;
            const py = gy * grid + grid / 2;

            // Precompute elevation
            cache.elevationGrid[gx][gy] = getElevationAtMapCoords(px, py);

            // Precompute flood paths properties
            const inPolyRes = isPointInAnyPolygon(px, py, pts);
            const res = getDistanceToPolyline(px, py, pts);

            let localRiverZ = 300.0;
            if (res.distance !== Infinity && res.pathIndex !== -1) {
              const path = pts[res.pathIndex];
              if (path && path.points && path.points.length >= 2) {
                const ptA = path.points[res.segmentIndex];
                const ptB = path.points[(res.segmentIndex + 1) % path.points.length];
                const dx = ptB.x - ptA.x;
                const dy = ptB.y - ptA.y;
                const lenSq = dx * dx + dy * dy;
                let t = 0;
                if (lenSq > 0) {
                  t = ((px - ptA.x) * dx + (py - ptA.y) * dy) / lenSq;
                  t = Math.max(0, Math.min(1, t));
                }
                const size = getCanvasSize();
                const rx = (ptA.x + t * dx) / size.width;
                const ry = (ptA.y + t * dy) / size.height;
                localRiverZ = getElevationAtMapCoords(rx * size.width, ry * size.height);
              }
            }

            cache.floodInitGrid[gx][gy] = {
              inside: inPolyRes.inside,
              insidePathIndex: inPolyRes.pathIndex,
              pathIndex: res.pathIndex,
              distance: res.distance,
              segmentIndex: res.segmentIndex,
              localRiverZ: localRiverZ
            };
          }
        }
        console.log(`[FloodSim] Grid recomputed in ${(performance.now() - recomputeStart).toFixed(1)} ms`);
      }

      const floodedGrid = Array.from({ length: cols }, () => new Uint8Array(rows));
      const maxWaterZGrid = Array.from({ length: cols }, () => new Float64Array(rows));
      const queue = [];

      // Initialize queue with seed points along calibrated path using cached checks
      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
          const cacheCell = cache.floodInitGrid[gx][gy];
          
          if (cacheCell.inside) {
            // Inside of closed paths (lakes/ponds): just fill with water, propagate only if enabled
            floodedGrid[gx][gy] = 1;
            if (config.propagateFromPonds && floodCalibVolume > 0) {
              const pathIdx = cacheCell.insidePathIndex;
              if (gisCurrentImage !== 5 || pathIdx === 0) {
                const minZ = pathMinZ[pathIdx] !== undefined ? pathMinZ[pathIdx] : cacheCell.localRiverZ;
                const wz = minZ + floodCalibVolume;
                maxWaterZGrid[gx][gy] = wz;
                queue.push({ gx, gy, waterZ: wz });
              }
            }
          } else {
            if (cacheCell.distance <= 8.0 && cacheCell.pathIndex !== -1) {
              const path = pts[cacheCell.pathIndex];
              if (path.isClosed) {
                // Boundary of closed paths (lakes/ponds): just fill with water, propagate only if enabled
                floodedGrid[gx][gy] = 1;
                if (config.propagateFromPonds && floodCalibVolume > 0) {
                  if (gisCurrentImage !== 5 || cacheCell.pathIndex === 0) {
                    const minZ = pathMinZ[cacheCell.pathIndex] !== undefined ? pathMinZ[cacheCell.pathIndex] : cacheCell.localRiverZ;
                    const wz = minZ + floodCalibVolume;
                    maxWaterZGrid[gx][gy] = wz;
                    queue.push({ gx, gy, waterZ: wz });
                  }
                }
              } else {
                // Open paths (rivers): fill with water and propagate flood
                floodedGrid[gx][gy] = 1;
                if (floodCalibVolume > 0) {
                  const wz = cacheCell.localRiverZ + floodCalibVolume;
                  maxWaterZGrid[gx][gy] = wz;
                  queue.push({ gx, gy, waterZ: wz });
                }
              }
            }
          }
        }
      }

      // Sort queue descending by waterZ to optimize propagation (highest level first)
      queue.sort((a, b) => b.waterZ - a.waterZ);
      // BFS topographic propagation (only run if water is rising)
      if (floodCalibVolume > 0) {
        const neighbors = [
          { dx: -1, dy: 0, dist: 1.0 }, { dx: 1, dy: 0, dist: 1.0 }, { dx: 0, dy: -1, dist: 1.0 }, { dx: 0, dy: 1, dist: 1.0 },
          { dx: -1, dy: -1, dist: 1.414 }, { dx: 1, dy: -1, dist: 1.414 }, { dx: -1, dy: 1, dist: 1.414 }, { dx: 1, dy: 1, dist: 1.414 }
        ];

        let qHead = 0;
        while (qHead < queue.length) {
          const curr = queue[qHead++];
          
          for (let i = 0; i < neighbors.length; i++) {
            const nx = curr.gx + neighbors[i].dx;
            const ny = curr.gy + neighbors[i].dy;

            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

            // Block outflow to the top, bottom, and right for scene 5 (only allow spill to the left)
            if (gisCurrentImage === 5) {
              const cacheCell = cache.floodInitGrid[nx][ny];
              if (!cacheCell.inside) {
                if (nx > 97 || ny < 24 || ny > 68) {
                  continue;
                }
              }
            }
            
            // Apply head loss (damping/slope) per unit distance to make the flood propagation gradual
            let nextWaterZ = curr.waterZ - config.headLoss * neighbors[i].dist;
            
            // Cap the water level based on the local river bed elevation + current flood volume (HAND-like model)
            const cacheCell = cache.floodInitGrid[nx][ny];
            const maxAllowedZ = cacheCell.localRiverZ + floodCalibVolume;
            nextWaterZ = Math.min(nextWaterZ, maxAllowedZ);

            if (nextWaterZ <= maxWaterZGrid[nx][ny]) continue;

            const cellZ = cache.elevationGrid[nx][ny];
            
            if (nextWaterZ >= cellZ) {
              floodedGrid[nx][ny] = 1;
              maxWaterZGrid[nx][ny] = nextWaterZ;
              queue.push({ gx: nx, gy: ny, waterZ: nextWaterZ });
            }
          }
        }
      }

      let floodedCells = 0;
      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
          if (floodedGrid[gx][gy] === 1) {
            const cacheCell = cache.floodInitGrid[gx][gy];
            const d = cacheCell.distance === Infinity ? 0 : cacheCell.distance;

            let hue, lightness, alpha;
            if (cacheCell.inside) {
              // Deep water inside defined lake: center (large d) is darker & more opaque
              const depthRatio = Math.min(1.0, d / 150);
              hue = Math.round(240 - (1.0 - depthRatio) * 15); // Deep blue in center, slight cyan at edges
              lightness = Math.round(32 + (1.0 - depthRatio) * 12); // Darker in center
              alpha = 0.65 + depthRatio * 0.22; // More opaque in center
            } else {
              // Flooded shallow water outside or along river line: further away (large d) is lighter & transparent
              const ratio = Math.min(1.0, d / 200);
              hue = Math.round(240 - ratio * 55);
              lightness = Math.round(42 + ratio * 33);
              alpha = 0.78 - ratio * 0.38;
            }
            
            ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`;
            ctx.fillRect(gx * grid, gy * grid, grid, grid);
            floodedCells++;
          }
        }
      }

      const outlineThreshold = 0.8 * config.maxVolume;
      if (floodCalibVolume >= outlineThreshold && outlineCtx) {
        outlineCtx.save();
        outlineCtx.beginPath();
        outlineCtx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        outlineCtx.lineWidth = 4.0;
        for (let gx = 0; gx < cols; gx++) {
          for (let gy = 0; gy < rows; gy++) {
            if (floodedGrid[gx][gy] === 1) {
              const xLeft = gx * grid;
              const xRight = (gx + 1) * grid;
              const yTop = gy * grid;
              const yBottom = (gy + 1) * grid;
              if (gx > 0 && floodedGrid[gx - 1][gy] === 0) { outlineCtx.moveTo(xLeft, yTop); outlineCtx.lineTo(xLeft, yBottom); }
              if (gx < cols - 1 && floodedGrid[gx + 1][gy] === 0) { outlineCtx.moveTo(xRight, yTop); outlineCtx.lineTo(xRight, yBottom); }
              if (gy > 0 && floodedGrid[gx][gy - 1] === 0) { outlineCtx.moveTo(xLeft, yTop); outlineCtx.lineTo(xRight, yTop); }
              if (gy < rows - 1 && floodedGrid[gx][gy + 1] === 0) { outlineCtx.moveTo(xLeft, yBottom); outlineCtx.lineTo(xRight, yBottom); }
            }
          }
        }
        outlineCtx.stroke();
        outlineCtx.restore();
      }
      const metersPerPixel = getMetersPerPixel();
      const cellAreaInSqMeters = (grid * metersPerPixel) * (grid * metersPerPixel);
      const totalFloodedArea = floodedCells * cellAreaInSqMeters;
      
      // console.log(`[FloodSim] Simulation completed in ${(performance.now() - startTime).toFixed(1)} ms. Area: ${Math.round(totalFloodedArea)} m²`);
      return totalFloodedArea;
    }



    function writeFloodPopupContent() {
      if (!floodCalibPopup || floodCalibPopup.closed) return;

      const locationNames = {
        1: "Koridor obce",
        2: "Zřícenina hradu",
        3: "Průmyslový areál",
        4: "Křižovatka dálnic",
        5: "Lom s jezerem"
      };
      const locName = locationNames[gisCurrentImage] || "Neznámá lokalita";

      let tableRows = '';
      let pointCount = 0;
      const hasPoints = floodCalibPoints.some(path => path.points && path.points.length > 0);

      if (!hasPoints) {
        tableRows = `
          <tr>
            <td colspan="4" class="py-6 text-center text-gray-500 text-xs italic">
              Klikněte do mapy pro vytvoření směru toku (koryta řeky) nebo vodní plochy.
            </td>
          </tr>
        `;
      } else {
        floodCalibPoints.forEach((path, pIdx) => {
          if (path.points.length === 0) return;
          
          const typeName = path.isClosed ? "Vodní plocha" : "Vodní tok";
          tableRows += `
            <tr style="background-color: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td colspan="4" class="py-2 px-3 font-bold text-[#23d8ff] text-xs uppercase" style="letter-spacing: 0.05em;">
                ${pIdx + 1}. ${typeName} (${path.points.length} bodů, ${path.isConcluded ? 'Ukončeno' : 'Rozpracováno'})
              </td>
            </tr>
          `;
          
          path.points.forEach((pt, idx) => {
            pointCount++;
            const imgH = (gisCurrentImage === 1 || gisCurrentImage === 5) ? 768 : 682;
            const px = pt.rx * 1024;
            const py = pt.ry * imgH;
            tableRows += `
              <tr class="border-b border-white/[0.02] hover:bg-white/[0.01] transition">
                <td class="py-2 px-3 font-bold text-gray-500 text-center">#${idx + 1}</td>
                <td class="py-2 px-3 text-gray-400 font-mono text-center">${Math.round(px)}, ${Math.round(py)}</td>
                <td class="py-2 px-3 text-right font-mono text-white">${pt.z.toFixed(1)} m</td>
                <td class="py-2 px-3 text-center">
                  <button onclick="window.opener.deleteFloodPoint(${pIdx}, ${idx})" class="text-red-400 hover:text-red-300 text-xs font-bold leading-none" style="background: none; border: none; cursor: pointer;">&times;</button>
                </td>
              </tr>
            `;
          });
        });
      }

      const popupHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Kalibrace záplav - Dronaut</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
          <style>
            body {
              background-color: #0d0e12;
              color: #f3f4f6;
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .header {
              border-bottom: 1px solid rgba(255,255,255,0.1);
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #23d8ff;
              margin: 0 0 5px 0;
            }
            .subtitle {
              font-size: 10px;
              color: #9ca3af;
              margin: 0;
            }
            .card {
              background-color: #12141c;
              border: 1px solid rgba(255,255,255,0.06);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .card-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #9ca3af;
              margin: 0 0 12px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              color: #9ca3af;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              padding: 6px 12px;
              text-align: left;
            }
            td {
              padding: 8px 12px;
              font-size: 11px;
            }
            .btn {
              background-color: #23d8ff;
              color: #000000;
              border: none;
              padding: 10px 16px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              border-radius: 8px;
              cursor: pointer;
              transition: opacity 0.2s;
              width: 100%;
              box-shadow: 0 4px 12px rgba(35, 216, 255, 0.2);
            }
            .btn:hover {
              opacity: 0.9;
            }
            .btn-secondary {
              background-color: transparent;
              border: 1px solid rgba(255,255,255,0.1);
              color: #d1d5db;
              box-shadow: none;
              margin-top: 8px;
            }
            .btn-secondary:hover {
              background-color: rgba(255,255,255,0.05);
              color: #ffffff;
            }
            .slider-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .slider-header {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .slider-val {
              font-weight: bold;
              color: #23d8ff;
            }
            input[type="range"] {
              width: 100%;
              accent-color: #23d8ff;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title"><i class="bi bi-droplet-fill"></i> Kalibrace záplav</h1>
            <p class="subtitle">Lokalita: ${locName}</p>
          </div>

          <div class="card">
            <h2 class="card-title">Koryto vodního toku (Trasa)</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%; text-align: center;">Bod</th>
                  <th style="width: 40%; text-align: center;">Souřadnice (X, Y)</th>
                  <th style="width: 30%; text-align: right;">Výška (Z)</th>
                  <th style="width: 15%; text-align: center;">Smazat</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            ${floodCalibPoints.length > 0 ? `
              <button onclick="window.opener.saveFloodPath()" class="btn" style="background-color: #10b981; color: #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); margin-top: 10px;"><i class="bi bi-check-circle-fill"></i> Uložit koryto do systému</button>
              <button onclick="window.opener.clearFloodPath()" class="btn btn-secondary" style="padding: 6px 12px; font-size: 9px; width: auto; display: block; margin: 8px auto 0 auto;"><i class="bi bi-trash"></i> Zrušit změny</button>
            ` : ''}
          </div>

          <div class="card">
            <h2 class="card-title">Stav v systému</h2>
            ${savedFloodPoints && savedFloodPoints.some(p => p.points && p.points.length >= 2) ? `
              <div style="font-size: 11px; color: #10b981; text-align: center; font-weight: bold; margin-bottom: 10px;">
                <i class="bi bi-shield-check"></i> AKTIVNÍ: Uloženo ${savedFloodPoints.reduce((acc, p) => acc + (p.points ? p.points.length : 0), 0)} bodů (v ${savedFloodPoints.length} segmentech)
              </div>
              <button onclick="window.opener.deleteSavedFloodPath()" class="btn btn-secondary" style="border-color: rgba(239, 68, 68, 0.2); color: #ef4444; width: 100%;"><i class="bi bi-x-circle"></i> Vymazat uložené koryto</button>
            ` : `
              <div style="font-size: 11px; color: #9ca3af; text-align: center; font-style: italic; margin-bottom: 10px;">
                <i class="bi bi-exclamation-circle"></i> V systému není uložena žádná trasa. Používá se výchozí model.
              </div>
            `}
          </div>

          <div class="card">
            <h2 class="card-title">Simulace šíření vody (Náhled)</h2>
            <div class="slider-group">
              <div class="slider-header">
                <span>Množství vody / Výška hladiny:</span>
                <span class="slider-val">+${floodCalibVolume.toFixed(3)} m</span>
              </div>
              <input type="range" min="0.0" max="15.0" step="0.001" value="${floodCalibVolume}" oninput="window.opener.updateFloodCalibVolume(this.value)">
              <div style="display: flex; justify-content: space-between; font-size: 8px; color: #6b7280; font-family: monospace;">
                <span>0.0 m (Normál)</span>
                <span>15.0 m (Kalamita)</span>
              </div>
            </div>
            
            <button onclick="window.opener.runFloodSimulation(false)" class="btn" style="margin-top: 20px;"><i class="bi bi-play-fill"></i> Spustit simulaci šíření</button>
          </div>
        </body>
        </html>
      `;

      floodCalibPopup.document.open();
      floodCalibPopup.document.write(popupHtml);
      floodCalibPopup.document.close();
    }

    function generateProfileChart(altA, altB, dist) {
      currentProfileData = [];
      const steps = 50;
      
      // Let's interpolate between Point A and Point B
      for (let i = 0; i < steps; i++) {
        const f = i / (steps - 1);
        const mapX = gisPointA.x + f * (gisPointB.x - gisPointA.x);
        const mapY = gisPointA.y + f * (gisPointB.y - gisPointA.y);
        const alt = getElevationAtMapCoords(mapX, mapY);
        currentProfileData.push({
          f: f,
          x: mapX,
          y: mapY,
          alt: alt,
          dist: f * dist
        });
      }
      
      const svg = document.getElementById('gis-profile-svg-chart');
      if (!svg) return;
      
      // Clear previous drawings but keep defs
      const defs = svg.querySelector('defs');
      svg.innerHTML = '';
      if (defs) svg.appendChild(defs);
      
      const w = svg.clientWidth || 380;
      const h = svg.clientHeight || 75;
      
      // Find min and max alt
      let minAlt = Infinity;
      let maxAlt = -Infinity;
      currentProfileData.forEach(p => {
        if (p.alt < minAlt) minAlt = p.alt;
        if (p.alt > maxAlt) maxAlt = p.alt;
      });
      
      // Add padding to heights
      minAlt = Math.floor(minAlt - 2);
      maxAlt = Math.ceil(maxAlt + 2);
      if (maxAlt - minAlt < 5) {
        maxAlt = minAlt + 5;
      }
      
      // Draw horizontal grid lines (3 levels)
      const gridLevels = [
        minAlt + 1,
        (minAlt + maxAlt) / 2,
        maxAlt - 1
      ];
      
      gridLevels.forEach(val => {
        const ySvg = h - 15 - ((val - minAlt) / (maxAlt - minAlt)) * (h - 25);
        
        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', `${ySvg}`);
        line.setAttribute('x2', `${w}`);
        line.setAttribute('y2', `${ySvg}`);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
        line.setAttribute('stroke-dasharray', '2 2');
        svg.appendChild(line);
        
        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '6');
        text.setAttribute('y', `${ySvg - 3}`);
        text.setAttribute('fill', 'rgba(255, 255, 255, 0.35)');
        text.setAttribute('font-size', '7');
        text.setAttribute('font-family', 'monospace');
        text.textContent = `${val.toFixed(0)} m`;
        svg.appendChild(text);
      });
      
      // Construct points for area and stroke path
      const points = [];
      currentProfileData.forEach(p => {
        const xSvg = p.f * w;
        const ySvg = h - 15 - ((p.alt - minAlt) / (maxAlt - minAlt)) * (h - 25);
        points.push({ x: xSvg, y: ySvg });
      });
      
      const pathStr = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const areaPathStr = `${pathStr} L ${w} ${h - 10} L 0 ${h - 10} Z`;
      
      // Draw Area
      const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      areaPath.setAttribute('d', areaPathStr);
      areaPath.setAttribute('fill', 'url(#profile-chart-grad)');
      svg.appendChild(areaPath);
      
      // Draw Stroke
      const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      strokePath.setAttribute('d', pathStr);
      strokePath.setAttribute('fill', 'none');
      strokePath.setAttribute('stroke', '#23d8ff');
      strokePath.setAttribute('stroke-width', '1.5');
      svg.appendChild(strokePath);
      
      // Add distance labels at the bottom (0m, 50%, 100%)
      const dists = [0, dist / 2, dist];
      const aligns = ['start', 'middle', 'end'];
      dists.forEach((d, idx) => {
        const xSvg = (idx === 0 ? 6 : idx === 1 ? w / 2 : w - 6);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${xSvg}`);
        text.setAttribute('y', `${h - 3}`);
        text.setAttribute('fill', 'rgba(255, 255, 255, 0.4)');
        text.setAttribute('font-size', '7');
        text.setAttribute('font-family', 'monospace');
        text.setAttribute('text-anchor', aligns[idx]);
        text.textContent = `${d.toFixed(0)}m`;
        svg.appendChild(text);
      });
    }

    function handleProfileChartMouseMove(e) {
      if (!currentProfileData || currentProfileData.length === 0) return;
      
      const svg = document.getElementById('gis-profile-svg-chart');
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const w = rect.width;
      
      // Calculate fraction
      const fraction = Math.max(0, Math.min(1, mouseX / w));
      const steps = currentProfileData.length;
      const idx = Math.min(steps - 1, Math.max(0, Math.round(fraction * (steps - 1))));
      const p = currentProfileData[idx];
      
      // Show/Move vertical line marker
      const marker = document.getElementById('gis-profile-chart-marker');
      if (marker) {
        marker.style.left = `${mouseX}px`;
        marker.classList.remove('hidden');
      }
      
      // Show/Move tooltip
      const tooltip = document.getElementById('gis-profile-chart-tooltip');
      if (tooltip) {
        tooltip.innerHTML = `<strong>${p.dist.toFixed(0)} m</strong><br/>Výška: ${p.alt.toFixed(1)} m`;
        
        // Position tooltip to the right of cursor, or left if close to right edge
        let tooltipX = mouseX + 10;
        if (mouseX > w - 80) {
          tooltipX = mouseX - 75;
        }
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `6px`;
        tooltip.classList.remove('hidden');
      }
      
      // Move crosshair on map to the physical location of the hovered point
      const crosshair = document.getElementById('gis-probe-crosshair');
      if (crosshair) {
        crosshair.style.left = `${p.x}px`;
        crosshair.style.top = `${p.y}px`;
        crosshair.classList.remove('hidden');
      }
    }

    function handleProfileChartMouseLeave() {
      // Hide marker & tooltip
      const marker = document.getElementById('gis-profile-chart-marker');
      if (marker) marker.classList.add('hidden');
      
      const tooltip = document.getElementById('gis-profile-chart-tooltip');
      if (tooltip) tooltip.classList.add('hidden');
      
      const crosshair = document.getElementById('gis-probe-crosshair');
      if (crosshair) crosshair.classList.add('hidden');
    }

    function showActiveFloodPolygon() {
      // Hide all flood zones first
      for (let i = 1; i <= 5; i++) {
        const zone = document.getElementById(`gis-flood-zone-${i}`);
        if (zone) {
          zone.classList.add('hidden');
          zone.style.opacity = '0';
          zone.style.transform = 'scale(1)';
        }
      }
      // Show the active one
      const activeZone = document.getElementById(`gis-flood-zone-${gisCurrentImage}`);
      if (activeZone) {
        activeZone.classList.remove('hidden');
      }
    }

    let floodPendingFrame = null;

    function updateGisFlood(val) {
      const levelVal = parseFloat(val);
      
      const hasValidSavedPath = (savedFloodPoints && savedFloodPoints.some(p => p.points && p.points.length >= 2)) ||
                                (defaultFloodPaths[gisCurrentImage] && defaultFloodPaths[gisCurrentImage].some(p => p.points && p.points.length >= 2));
      
      if (hasValidSavedPath) {
        // Show flood canvas overlay
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) canvas.classList.remove('hidden');
        const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
        if (outlineCanvas) {
          if (levelVal >= 8.0) {
            outlineCanvas.classList.remove('hidden');
            outlineCanvas.classList.add('blink-outline');
          } else {
            outlineCanvas.classList.add('hidden');
            outlineCanvas.classList.remove('blink-outline');
          }
        }

        // Show slider card, hide result card to prevent stacking
        const floodCard = document.getElementById('gis-flood-card');
        if (floodCard) {
          floodCard.classList.remove('hidden');
          floodCard.classList.add('flex');
        }
        const resCard = document.getElementById('gis-result-card');
        if (resCard) {
          resCard.classList.add('hidden');
          resCard.classList.remove('flex');
        }

        const config = gisFloodConfig[gisCurrentImage] || { maxVolume: 2.0, headLoss: 0.10, propagateFromPonds: false };
        if (levelVal === 0.0) {
          floodCalibVolume = 0.0;
        } else {
          // Direct linear mapping: map slider value (0.0 to 10.0) directly to volume based on config
          floodCalibVolume = (levelVal / 10.0) * config.maxVolume;
        }

        // Update the HUD level text with the actual volume (height in meters)
        document.getElementById('gis-flood-level-text').textContent = `+${floodCalibVolume.toFixed(3)} m`;

        if (floodPendingFrame) {
          cancelAnimationFrame(floodPendingFrame);
        }

        floodPendingFrame = requestAnimationFrame(() => {
          floodPendingFrame = null;
          const area = runFloodSimulation(true);
          document.getElementById('gis-flood-area-text').textContent = `${Math.round(area).toLocaleString('cs-CZ')} m²`;
        });
      } else {
        document.getElementById('gis-flood-level-text').textContent = `+0.0 m`;
        // Hide canvases
        const canvas = document.getElementById('gis-flood-canvas');
        if (canvas) canvas.classList.add('hidden');
        const outlineCanvas = document.getElementById('gis-flood-outline-canvas');
        if (outlineCanvas) outlineCanvas.classList.add('hidden');
        
        document.getElementById('gis-flood-area-text').textContent = "0 m²";
        
        // Hide slider card, show warning card to prevent stacking
        const floodCard = document.getElementById('gis-flood-card');
        if (floodCard) {
          floodCard.classList.add('hidden');
          floodCard.classList.remove('flex');
        }
        
        // Show warning message in the bottom card
        updateGisResult("bi bi-exclamation-triangle text-amber-500", "Simulace záplav", "Není zadáno koryto toku", "Chcete-li spustit simulaci, přihlaste se kliknutím na zámeček v záhlaví a proveďte 'Kalibraci záplav' naklikáním řek a jezer.");
      }
    }

    function toggleGisExportDropdown() {
      const dropdown = document.getElementById('gis-export-dropdown');
      isExportDropdownOpen = !isExportDropdownOpen;
      dropdown.classList.toggle('hidden', !isExportDropdownOpen);
    }

    function triggerGisDownload(formatName) {
      toggleGisExportDropdown();
      if (isDownloading) return;
      isDownloading = true;

      const loader = document.getElementById('gis-export-loader');
      const loaderStatus = document.getElementById('gis-loader-status');
      const loaderPct = document.getElementById('gis-loader-pct');
      const loaderBar = document.getElementById('gis-loader-bar');

      loader.classList.remove('hidden');
      loader.classList.add('flex');
      
      let pct = 0;
      loaderStatus.textContent = "Připravuji data...";
      loaderPct.textContent = "0%";
      loaderBar.style.width = "0%";

      const interval = setInterval(() => {
        pct += 5;
        if (pct > 100) pct = 100;
        
        loaderPct.textContent = `${pct}%`;
        loaderBar.style.width = `${pct}%`;

        if (pct === 30) {
          loaderStatus.textContent = "Generuji soubor...";
        } else if (pct === 70) {
          loaderStatus.textContent = "Komprimuji a balím...";
        } else if (pct === 90) {
          loaderStatus.textContent = "Stahuji...";
        } else if (pct === 100) {
          clearInterval(interval);
          isDownloading = false;
          loaderStatus.textContent = "Dokončeno!";
          
          setTimeout(() => {
            alert(`Soubor ${formatName} byl úspěšně vygenerován a stažen do vašeho počítače.`);
            loader.classList.add('hidden');
          }, 400);
        }
      }, 100);
    }

