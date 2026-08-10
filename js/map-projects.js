    // ==========================================
    // 1. PROJECT MAP INTERACTION LOGIC
    // ==========================================
    const mapProjects = {
      ostrava: {
        title: "Halda Jan Šverma",
        loc: "Ostrava",
        year: "2025",
        cat: "Ekologie a sanace",
        area: "45 ha",
        prec: "< 2.0 cm",
        desc: "Dronové skenování pro přesný výškový profil, polohopis a ortofoto. Podklady pro rekultivaci území a návrh tréninkových ploch pro HZS Ostrava."
      },
      babice: {
        title: "Dálnice D55",
        loc: "Babice – Staré Město",
        year: "2025",
        cat: "Infrastruktura",
        area: "12 km (trasa)",
        prec: "< 1.5 cm",
        desc: "Podrobná ortofotomapa pro dokumentaci nově budované komunikace. Podklad pro zakreslení skutečného provedení stavby a technickou dokumentaci."
      },
      semetin: {
        title: "Silnice I/57 Semetín",
        loc: "Semetín – Bystřička",
        year: "2025",
        cat: "Infrastruktura",
        area: "8.5 ha",
        prec: "< 1.8 cm",
        desc: "Průběžné zaměřování zemního tělesa, výškový profil a ortofoto pro kontrolu postupu prací a výpočet kubatur přemístěné zeminy."
      },
      zlin: {
        title: "Suchý důl",
        loc: "Zlín",
        year: "2025",
        cat: "Odpadové hospodářství",
        area: "18 ha",
        prec: "< 2.0 cm",
        desc: "Průběžné zaměřování území sloužícího pro ukládání odpadu města Zlína. Sledování množství navezeného materiálu a pravidelný výpočet kubatur."
      },
      malenovice: {
        title: "Průmyslový objekt Malenovice",
        loc: "Zlín – Malenovice",
        year: "2024",
        cat: "Průmysl a energetika",
        area: "14,500 m² (střecha)",
        prec: "< 1.2 cm",
        desc: "Zaměření střešní konstrukce, ortofotomapa a 3D model jako digitální dvojče a podklad pro přesný návrh a rozmístění instalace solárních panelů."
      },
      hrivinuv_ujezd: {
        title: "Vodárenský objekt Hřivínův Újezd",
        loc: "Hřivínův Újezd",
        year: "2025",
        cat: "Vodohospodářství",
        area: "1.2 ha",
        prec: "< 1.5 cm",
        desc: "Letecké snímkování vodárenského objektu. Ortofoto a 3D model pro technické posouzení stavu nádrží a oplocení."
      },
      lukovecek: {
        title: "Vodárenský objekt Lukoveček",
        loc: "Lukoveček",
        year: "2025",
        cat: "Vodohospodářství",
        area: "0.8 ha",
        prec: "< 1.5 cm",
        desc: "Letecké snímkování a 3D modelování objektu vodojemu pro analýzu stávajícího stavu a plánování rekonstrukce."
      },
      jizni_svahy: {
        title: "Vodárenské objekty Jižní Svahy",
        loc: "Zlín – Jižní Svahy",
        year: "2025",
        cat: "Vodohospodářství",
        area: "2.5 ha",
        prec: "< 1.5 cm",
        desc: "Detailní zmapování vodojemu a okolních pozemků na Jižních Svazích ve Zlíně pro potřeby správy sítě."
      },
      nove_malenovice: {
        title: "Sídliště Nové Malenovice",
        loc: "Zlín – Malenovice",
        year: "2025 – ?",
        cat: "Časosběr",
        area: "12 ha",
        prec: "< 2.0 cm",
        desc: "Časosběrná dokumentace výstavby nové čtvrti. Pravidelné snímkování z identických bodů pro sledování postupu prací."
      }
    };

    let selectedMapProjectId = null;

    function selectMapProject(id) {
      const emptyEl = document.getElementById('map-details-empty');
      if (!emptyEl) return;
      
      selectedMapProjectId = id;
      
      // Hide empty state, show filled state
      emptyEl.classList.add('hidden');
      document.getElementById('map-details-filled').classList.remove('hidden');
      document.getElementById('map-details-filled').classList.add('flex');
      document.getElementById('map-details-action').classList.remove('hidden');

      // Update values
      const data = mapProjects[id];
      if (data) {
        document.getElementById('map-detail-title').textContent = data.title;
        document.getElementById('map-detail-loc').textContent = data.loc;
        document.getElementById('map-detail-year').textContent = data.year;
        document.getElementById('map-detail-cat').textContent = data.cat;
        document.getElementById('map-detail-area').textContent = data.area;
        document.getElementById('map-detail-prec').textContent = data.prec;
        document.getElementById('map-detail-desc').textContent = data.desc;
      }

      // Toggle active pin outline
      const pins = ['ostrava', 'babice', 'semetin', 'zlin', 'malenovice', 'hrivinuv_ujezd', 'lukovecek', 'jizni_svahy', 'nove_malenovice'];
      pins.forEach(p => {
        const circ = document.getElementById(`map-pin-circle-${p}`);
        if (circ) {
          if (p === id) {
            circ.classList.remove('hidden');
          } else {
            circ.classList.add('hidden');
          }
        }
      });
    }

    // Draggable Pins Debug Tool (User Assistance Mode)
    (function() {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('debug')) return; // Run only in debug mode

      const svg = document.querySelector('#projektova-mapa svg');
      if (!svg) return;

      const container = svg.parentElement;
      const debugBox = document.createElement('div');
      debugBox.className = "absolute top-4 left-4 bg-[#12141a]/95 border border-white/10 p-4 rounded-2xl text-[10px] font-mono text-white z-50 flex flex-col gap-2 max-w-[260px] shadow-2xl backdrop-blur-md";
      debugBox.innerHTML = `
        <div class="text-[#cff245] font-bold tracking-wider uppercase text-[9px]">Ladicí režim souřadnic</div>
        <div class="text-gray-400 leading-relaxed">Uchopte body myší a přesuňte je na správná místa na mapě. Poté mi zkopírujte tyto souřadnice:</div>
        <textarea id="map-debug-coords" readonly class="bg-black/50 border border-white/10 p-2 rounded-xl text-[9px] text-[#cff245] h-24 w-full resize-none focus:outline-none focus:border-[#cff245]/50 font-mono"></textarea>
      `;
      container.appendChild(debugBox);

      const coordMap = {
        ostrava: { x: 589, y: 90 },
        semetin: { x: 590, y: 174 },
        zlin: { x: 509, y: 183 },
        malenovice: { x: 450, y: 221 },
        babice: { x: 337, y: 222 },
        hrivinuv_ujezd: { x: 520, y: 258 },
        lukovecek: { x: 499, y: 190 },
        jizni_svahy: { x: 522, y: 181 },
        nove_malenovice: { x: 470, y: 222 }
      };

      function updateDebugText() {
        const text = Object.entries(coordMap)
          .map(([id, pt]) => `${id}: [${Math.round(pt.x)}, ${Math.round(pt.y)}]`)
          .join('\n');
        document.getElementById('map-debug-coords').value = text;
      }
      updateDebugText();

      let activePin = null;
      let dragStart = { x: 0, y: 0 };
      let pinStart = { x: 0, y: 0 };
      let hasDragged = false;

      const pt = svg.createSVGPoint();
      function getSVGCoords(evt) {
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
      }

      const pins = svg.querySelectorAll('g.cursor-pointer');
      pins.forEach(pin => {
        const onclickAttr = pin.getAttribute('onclick');
        const match = onclickAttr ? onclickAttr.match(/selectMapProject\('([^']+)'\)/) : null;
        if (!match) return;
        const pinId = match[1];

        pin.removeAttribute('onclick');

        pin.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          activePin = pin;
          activePin.id_string = pinId;
          
          const svgMouse = getSVGCoords(e);
          dragStart = { x: svgMouse.x, y: svgMouse.y };
          pinStart = { x: coordMap[pinId].x, y: coordMap[pinId].y };
          hasDragged = false;
        });
      });

      window.addEventListener('mousemove', function(e) {
        if (!activePin) return;
        const svgMouse = getSVGCoords(e);
        const dx = svgMouse.x - dragStart.x;
        const dy = svgMouse.y - dragStart.y;
        
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasDragged = true;
        }

        const newX = Math.max(0, Math.min(800, pinStart.x + dx));
        const newY = Math.max(0, Math.min(450, pinStart.y + dy));

        coordMap[activePin.id_string] = { x: newX, y: newY };
        activePin.setAttribute('transform', `translate(${newX}, ${newY})`);
        updateDebugText();
      });

      window.addEventListener('mouseup', function(e) {
        if (!activePin) return;
        if (!hasDragged) {
          selectMapProject(activePin.id_string);
        }
        activePin = null;
      });
    })();

