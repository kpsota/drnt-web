    // ==========================================
    // CLIENT ZONE & LOGIN LOGIC
    // ==========================================
    function openLoginModal() {
      const modal = document.getElementById('login-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.getElementById('login-username').focus();
      }
    }

    function closeLoginModal() {
      const modal = document.getElementById('login-modal');
      if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
      document.getElementById('login-error-msg').classList.add('hidden');
    }

    function handleLoginSubmit(e) {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const errorMsg = document.getElementById('login-error-msg');
      
      const user = usernameInput.value.trim().toLowerCase();
      const pass = passwordInput.value.trim();

      if (user === 'demo' && pass === 'demo') {
        sessionStorage.setItem('dronaut_logged_in', 'true');
        updateHeaderUserMenu();
        closeLoginModal();
        openClientDashboard();
        
        // Reset form
        usernameInput.value = '';
        passwordInput.value = '';
      } else {
        errorMsg.classList.remove('hidden');
      }
    }

    function updateHeaderUserMenu() {
      const isLoggedIn = sessionStorage.getItem('dronaut_logged_in') === 'true';
      const loginBtn = document.getElementById('left-sidebar-login-btn');
      const userMenu = document.getElementById('left-sidebar-user-menu');
      
      if (isLoggedIn) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userMenu) {
          userMenu.classList.remove('hidden');
          userMenu.classList.add('flex');
        }
      } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userMenu) {
          userMenu.classList.remove('flex');
          userMenu.classList.add('hidden');
        }
      }
    }

    function handleLogout() {
      sessionStorage.setItem('dronaut_logged_in', 'false');
      updateHeaderUserMenu();
      closeClientDashboard();
    }

    function openClientDashboard() {
      // Check if logged in first
      const isLoggedIn = sessionStorage.getItem('dronaut_logged_in') === 'true';
      if (!isLoggedIn) {
        openLoginModal();
        return;
      }
      
      const dash = document.getElementById('client-dashboard-modal');
      if (dash) {
        dash.classList.remove('hidden');
        dash.classList.add('flex');
        switchDashboardTab('projects');
      }
    }

    function closeClientDashboard() {
      const dash = document.getElementById('client-dashboard-modal');
      if (dash) {
        dash.classList.remove('flex');
        dash.classList.add('hidden');
      }
    }

    function switchDashboardTab(tabId) {
      const tabs = ['projects', 'finances', 'media', 'order', 'stats'];
      tabs.forEach(t => {
        const pane = document.getElementById(`dash-tab-${t}`);
        const btn = document.getElementById(`dash-tab-btn-${t}`);
        
        if (pane) {
          if (t === tabId) {
            pane.classList.remove('hidden');
          } else {
            pane.classList.add('hidden');
          }
        }
        
        if (btn) {
          if (t === tabId) {
            btn.className = "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition text-left text-xs font-bold border-[#cff245] bg-[#cff245]/5 text-[#cff245] font-sans w-full";
          } else {
            btn.className = "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition text-left text-xs font-bold border-white/5 bg-white/[0.01] hover:border-white/20 text-gray-300 font-sans w-full";
          }
        }
      });
    }

    function openGisFromDashboard(index) {
      closeClientDashboard();
      openGisModal();
      switchGisImage(index);
    }

    function handleNewOrderSubmit(e) {
      e.preventDefault();
      alert("Poptávka letové mise byla úspěšně odeslána pilotovi. Budeme Vás kontaktovat do 2 hodin.");
      e.target.reset();
      switchDashboardTab('projects');
    }

    function makeElementDraggable(elmnt, handle) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      if (handle) {
        handle.style.cursor = 'move';
        handle.onmousedown = dragMouseDown;
      } else {
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A' || e.target.closest('button') || e.target.closest('input')) {
          return;
        }
        e.preventDefault();
        
        const rect = elmnt.getBoundingClientRect();
        
        elmnt.style.bottom = 'auto';
        elmnt.style.right = 'auto';
        elmnt.style.top = rect.top + 'px';
        elmnt.style.left = rect.left + 'px';
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        elmnt.style.top = (parseFloat(elmnt.style.top) - pos2) + "px";
        elmnt.style.left = (parseFloat(elmnt.style.left) - pos1) + "px";
      }

      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    const gisToolHelp = {
      'gis-tool-measure': {
        icon: 'bi bi-ruler text-[#cff245]',
        title: 'Měření vzdálenosti',
        value: 'Lineární délka (L)',
        desc: 'Měří vzdálenost mezi body na ortofotomapě s přesností na centimetry díky kalibrovanému měřítku a korekci reliéfu.'
      },
      'gis-tool-height': {
        icon: 'bi bi-geo text-[#23d8ff]',
        title: 'Výšková sonda (Z-sonda)',
        value: 'Nadmořská výška (Z)',
        desc: 'Určuje přesnou výšku nad mořem libovolného bodu (MSL) načtením dat z digitálního modelu terénu páté generace (DMR 5G).'
      },
      'gis-tool-area': {
        icon: 'bi bi-pentagon text-[#cff245]',
        title: 'Měření plochy',
        value: 'Výměra parcely (A)',
        desc: 'Vypočítá 2D výměru a obvod zadaného území na základě ohraničujícího polygonu za použití Gaussova algoritmu.'
      },
      'gis-tool-profile': {
        icon: 'bi bi-graph-up text-[#23d8ff]',
        title: 'Výškový profil',
        value: 'Řez terénem (X/Z)',
        desc: 'Vykreslí výškový profil terénu podél vámi zvolené linie. Zobrazuje celkové stoupání, klesání a průměrný sklon.'
      },
      'gis-tool-slope': {
        icon: 'bi bi-activity text-[#cff245]',
        title: 'Měření sklonu',
        value: 'Sklon svahu (S)',
        desc: 'Určuje procentuální a úhlový sklon terénu mezi dvěma vybranými body. Barevná škála indikuje strmost svahu.'
      },
      'gis-tool-flood': {
        icon: 'bi bi-water text-[#23d8ff]',
        title: 'Simulace záplav',
        value: 'Záplavová zóna (H)',
        desc: 'Vizualizuje rozsah zatopení území při stoupání vodní hladiny. Automaticky propočítává celkovou výměru zaplavené plochy.'
      },
      'gis-tool-calib': {
        icon: 'bi bi-gear-fill text-[#fbbf24]',
        title: 'Kalibrace výšek',
        value: 'Zabezpečený režim',
        desc: 'Geodetická kalibrace výškových bodů na základě RTK zaměření pro zpřesnění digitálního modelu terénu (vyžaduje přihlášení).'
      },
      'gis-tool-flood-calib': {
        icon: 'bi bi-droplet-fill text-[#23d8ff]',
        title: 'Kalibrace záplav',
        value: 'Definice koryta (Z/Q)',
        desc: 'Umožňuje naklikat koryto toku a simulovat šíření povodňové vlny na základě nadmořské výšky a průtoku.'
      },
      'gis-tool-clear': {
        icon: 'bi bi-trash text-red-400',
        title: 'Vymazat měření',
        value: 'Vyčištění scény',
        desc: 'Resetuje veškerá aktivní měření na mapě, smaže trasové body, výškový profil a vypne simulaci záplav.'
      },
      'gis-export-btn': {
        icon: 'bi bi-download text-[#cff245]',
        title: 'Export datových vrstev',
        value: 'DXF, SHP, GeoTIFF',
        desc: 'Umožňuje stažení vektorových linií měření a ortofotomap ve standardizovaných formátech pro CAD a GIS aplikace.'
      }
    };

    let lastGisResultData = {
      icon: 'bi bi-info-circle text-[#fbbf24]',
      title: 'Interaktivní GIS Nástroje',
      value: 'Vyberte nástroj vlevo',
      desc: 'Kliknutím aktivujte měření vzdáleností, plochy, sklonu, výšek nebo simulaci záplav. Najeďte myší na tlačítko pro popis funkce.'
    };

    let isAdminLoggedIn = false;

    function toggleGisAdmin() {
      if (isAdminLoggedIn) {
        // Logout admin
        isAdminLoggedIn = false;
        isCalibAuthenticated = false;
        
        // Hide calibration tools
        const btnCalib = document.getElementById('gis-tool-calib');
        if (btnCalib) {
          btnCalib.classList.add('hidden');
          btnCalib.classList.remove('flex');
        }
        const btnFloodCalib = document.getElementById('gis-tool-flood-calib');
        if (btnFloodCalib) {
          btnFloodCalib.classList.add('hidden');
          btnFloodCalib.classList.remove('flex');
        }
        
        // Reset current tool if it was a calibration tool
        if (gisTool === 'calib' || gisTool === 'flood-calib') {
          setGisTool(null);
        }
        
        // Reset lock icon style
        const lock = document.getElementById('gis-admin-lock');
        if (lock) {
          lock.innerHTML = '<i class="bi bi-shield-lock"></i>';
          lock.className = "text-white/20 hover:text-white/60 cursor-pointer transition text-xs select-none ml-2";
          lock.title = "Administrace (Správa)";
        }
        
        // Hide visitor counter
        const counter = document.getElementById('visitor-counter');
        if (counter) {
          counter.classList.add('hidden');
          counter.classList.remove('sm:inline-flex');
        }
        
        alert("Administrátorský přístup ukončen. Kalibrační nástroje byly skryty.");
      } else {
        // Login admin
        const username = prompt("Zadejte administrátorské uživatelské jméno:");
        if (username === null) return;
        const password = prompt("Zadejte heslo:");
        if (password === null) return;
        
        if (username === "DRNT" && password === "OSKP26") {
          isAdminLoggedIn = true;
          isCalibAuthenticated = true;
          
          // Show calibration tools
          const btnCalib = document.getElementById('gis-tool-calib');
          if (btnCalib) {
            btnCalib.classList.remove('hidden');
            btnCalib.classList.add('flex');
          }
          const btnFloodCalib = document.getElementById('gis-tool-flood-calib');
          if (btnFloodCalib) {
            btnFloodCalib.classList.remove('hidden');
            btnFloodCalib.classList.add('flex');
          }
          
          // Update lock icon style to indicate logged in state
          const lock = document.getElementById('gis-admin-lock');
          if (lock) {
            lock.innerHTML = '<i class="bi bi-shield-slash-fill"></i>';
            lock.className = "text-[#cff245] hover:text-[#a6c437] cursor-pointer transition text-xs select-none ml-2 filter drop-shadow-[0_0_4px_rgba(207,242,69,0.4)]";
            lock.title = "Odhlásit správce";
          }
          
          // Show visitor counter
          const counter = document.getElementById('visitor-counter');
          if (counter) {
            counter.classList.remove('hidden');
            counter.classList.add('sm:inline-flex');
          }
          
          alert("Administrátorský přístup schválen. Kalibrační nástroje byly zpřístupněny.");
        } else {
          alert("Neplatné administrátorské jméno nebo heslo.");
        }
      }
    }

    function updateGisResult(iconClass, title, value, desc, color) {
      lastGisResultData = {
        icon: iconClass,
        title: title,
        value: value,
        desc: desc,
        color: color || ''
      };
      restoreGisResultCard();
      
      // Ensure the result card is visible
      const resCard = document.getElementById('gis-result-card');
      if (resCard) {
        resCard.classList.remove('hidden');
        resCard.classList.add('flex');
      }
    }

    function showGisToolHelp(id) {
      const help = gisToolHelp[id];
      if (help) {
        document.getElementById('gis-card-icon').className = help.icon;
        document.getElementById('gis-card-icon').style.color = '';
        document.getElementById('gis-card-title').textContent = help.title;
        document.getElementById('gis-card-value').textContent = help.value;
        document.getElementById('gis-card-desc').textContent = help.desc;
        
        // Hide actions during hover help to keep layout clean
        const actions = document.getElementById('gis-card-actions');
        if (actions) {
          actions.classList.add('hidden');
          actions.classList.remove('flex');
        }
      }
    }

    function restoreGisResultCard() {
      document.getElementById('gis-card-icon').className = lastGisResultData.icon;
      document.getElementById('gis-card-icon').style.color = lastGisResultData.color || '';
      document.getElementById('gis-card-title').textContent = lastGisResultData.title;
      document.getElementById('gis-card-value').textContent = lastGisResultData.value;
      document.getElementById('gis-card-desc').textContent = lastGisResultData.desc;
      
      // Manage bottom bar action buttons dynamically
      const actions = document.getElementById('gis-card-actions');
      if (actions) {
        if (gisTool === 'flood-calib' && floodCalibPoints.length > 0) {
          actions.innerHTML = `
            <button onclick="saveFloodPath()" class="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-lg transition flex items-center gap-1.5"><i class="bi bi-check-circle-fill"></i> Uložit body</button>
            <button onclick="clearFloodPath()" class="px-3 py-1.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition flex items-center gap-1.5"><i class="bi bi-trash"></i> Zrušit</button>
          `;
          actions.classList.remove('hidden');
          actions.classList.add('flex');
        } else {
          actions.innerHTML = '';
          actions.classList.add('hidden');
          actions.classList.remove('flex');
        }
      }
    }

    // Initialize translation system and user menu on load
    window.addEventListener('DOMContentLoaded', () => {
      // Clear old format or incorrect coordinates saved by user
      if (localStorage.getItem('drnt_flood_version') !== '3') {
        for (let i = 1; i <= 5; i++) {
          localStorage.removeItem('drnt_saved_flood_points_v2_' + i);
          localStorage.removeItem('drnt_saved_flood_points_' + i);
          localStorage.removeItem('drnt_flood_calib_points_' + i);
        }
        localStorage.setItem('drnt_flood_version', '3');
      }

      // Clean up default paths from localStorage so they don't load as user calibrations
      for (let i = 1; i <= 5; i++) {
        const key = 'drnt_saved_flood_points_v2_' + i;
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          const defPath = defaultFloodPaths[i];
          if (defPath && JSON.stringify(parsed) === JSON.stringify(defPath)) {
            localStorage.removeItem(key);
          }
        }
      }

      initTranslation();
      updateHeaderUserMenu();

      // Initialize visitor counter
      let visitorCount = localStorage.getItem('dronaut_visits');
      if (!visitorCount || parseInt(visitorCount) >= 1248) {
        visitorCount = 1;
      } else {
        visitorCount = parseInt(visitorCount) + 1;
      }
      localStorage.setItem('dronaut_visits', visitorCount);
      
      const valElem = document.getElementById('visitor-count-val');
      if (valElem) {
        valElem.innerText = visitorCount.toLocaleString();
      }

      // Load permanently saved system flood points for this image
      const savedV2 = localStorage.getItem('drnt_saved_flood_points_v2_' + gisCurrentImage);
      let loaded;
      if (savedV2 !== null) {
        loaded = JSON.parse(savedV2);
      } else {
        const oldSaved = localStorage.getItem('drnt_saved_flood_points_' + gisCurrentImage);
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
          localStorage.setItem('drnt_saved_flood_points_v2_' + gisCurrentImage, JSON.stringify(loaded));
        } else {
          loaded = [];
        }
      }
      savedFloodPoints = loaded;
      // Initialize draft clicks as empty
      floodCalibPoints = [];

      // Bind hover events for GIS tool buttons
      const buttonsToBind = [
        'gis-tool-measure',
        'gis-tool-height',
        'gis-tool-area',
        'gis-tool-profile',
        'gis-tool-slope',
        'gis-tool-flood',
        'gis-tool-calib',
        'gis-tool-flood-calib',
        'gis-tool-clear',
        'gis-export-btn'
      ];

      buttonsToBind.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('mouseenter', () => {
            showGisToolHelp(id);
          });
          btn.addEventListener('mouseleave', () => {
            restoreGisResultCard();
          });
        }
      });

      window.addEventListener('resize', () => {
        updateViewportLayout();
      });
    });
