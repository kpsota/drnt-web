    // Villa Timelapse Player Logic
    const villaTimelapseModal = document.getElementById('villa-timelapse-modal');
    const villaTimelapseImg = document.getElementById('villa-timelapse-img');
    const villaTimelapseDesc = document.getElementById('villa-timelapse-desc');
    const villaTimelapseRange = document.getElementById('villa-timelapse-range');
    const villaTimelapseStageBadge = document.getElementById('villa-timelapse-stage-badge');
    const villaTimelapsePlayIcon = document.getElementById('villa-timelapse-play-icon');
    
    let villaTimelapseInterval = null;
    let villaTimelapseCurrentIndex = 0;
    const villaTimelapseMaxIndex = 9; // 10 frames total
    
    const villaImages = [
      {
        src: 'images/photos/villa_01.jpg?v=5',
        desc: 'Začištěný a vyrovnaný stavební pozemek'
      },
      {
        src: 'images/photos/villa_02.jpg?v=5',
        desc: 'Výstavba základů a suterénních stěn'
      },
      {
        src: 'images/photos/villa_04.jpg?v=5',
        desc: 'Betonáž sloupů a vztyčení stavebního jeřábu'
      },
      {
        src: 'images/photos/villa_05.jpg?v=5',
        desc: 'Konstrukce přízemí a šalování stropu'
      },
      {
        src: 'images/photos/villa_06.jpg?v=5',
        desc: 'Výstavba patra a betonáž nosných sloupů'
      },
      {
        src: 'images/photos/villa_08.jpg?v=5',
        desc: 'Dokončení hrubého betonového skeletu'
      },
      {
        src: 'images/photos/villa_09.jpg?v=5',
        desc: 'Bednění střechy a příprava na vyzdívky'
      },
      {
        src: 'images/photos/villa_10.jpg?v=5',
        desc: 'Vyzdívky obvodových stěn a lešení'
      },
      {
        src: 'images/photos/villa_11.jpg?v=5',
        desc: 'Dokončená fasáda a osazení oken'
      },
      {
        src: 'images/photos/villa_12.jpg?v=5',
        desc: 'Finální realizace včetně zahrady a bazénu'
      }
    ];

    let villaImagesPreloaded = false;
    function preloadVillaImages() {
      if (villaImagesPreloaded) return;
      villaImages.forEach(imgData => {
        const img = new Image();
        img.src = imgData.src;
      });
      villaImagesPreloaded = true;
    }

    function openVillaTimelapseModal() {
      if (villaTimelapseModal) {
        villaTimelapseModal.classList.remove('hidden');
        villaTimelapseModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        preloadVillaImages();
        setVillaTimelapseIndex(0); // Start at the beginning
      }
    }

    function closeVillaTimelapseModal() {
      if (villaTimelapseModal) {
        stopVillaTimelapseAutoplay();
        villaTimelapseModal.classList.remove('flex');
        villaTimelapseModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }

    function setVillaTimelapseIndex(idx) {
      idx = Math.max(0, Math.min(villaTimelapseMaxIndex, idx));
      villaTimelapseCurrentIndex = idx;
      
      if (villaTimelapseRange) {
        villaTimelapseRange.value = idx;
      }

      // Update vertical custom timeline progress fill
      const fill = document.getElementById('villa-timelapse-fill');
      if (fill) {
        fill.style.height = `${(idx / 9) * 100}%`;
      }

      // Highlight active vertical dot & label
      for (let i = 0; i <= 9; i++) {
        const dot = document.getElementById(`v-dot-${i}`);
        const label = document.getElementById(`tick-label-${i}`);
        if (dot) {
          if (i === idx) {
            dot.classList.remove('bg-[#181a20]', 'w-2.5', 'h-2.5', 'border-white/35', 'group-hover:border-white/70');
            dot.classList.add('bg-[#cff245]', 'w-4', 'h-4', 'border-2', 'border-black', 'shadow-[0_0_10px_#cff245]');
          } else {
            dot.classList.remove('bg-[#cff245]', 'w-4', 'h-4', 'border-2', 'border-black', 'shadow-[0_0_10px_#cff245]');
            dot.classList.add('bg-[#181a20]', 'w-2.5', 'h-2.5', 'border-white/35', 'group-hover:border-white/70');
          }
        }
        if (label) {
          if (i === idx) {
            label.classList.remove('text-gray-500', 'bg-[#16181d]/80', 'border-white/[0.05]');
            label.classList.add('text-[#cff245]', 'bg-[#cff245]/10', 'border-[#cff245]/30', 'font-bold', 'shadow-[0_0_8px_rgba(207,242,69,0.1)]');
          } else {
            label.classList.remove('text-[#cff245]', 'bg-[#cff245]/10', 'border-[#cff245]/30', 'font-bold', 'shadow-[0_0_8px_rgba(207,242,69,0.1)]');
            label.classList.add('text-gray-500', 'bg-[#16181d]/80', 'border-white/[0.05]');
          }
        }

        // Highlight active arrow caret next to active stage number
        const arrow = document.getElementById(`tick-arrow-${i}`);
        if (arrow) {
          if (i === idx) {
            arrow.classList.remove('opacity-0');
            arrow.classList.add('opacity-100');
          } else {
            arrow.classList.remove('opacity-100');
            arrow.classList.add('opacity-0');
          }
        }
      }
      
      const data = villaImages[idx];
      if (data) {
        if (villaTimelapseImg) {
          villaTimelapseImg.src = data.src;
        }
        if (villaTimelapseStageBadge) {
          villaTimelapseStageBadge.textContent = `Etapa ${idx + 1}/10`;
        }
        
        if (villaTimelapseDesc) {
          villaTimelapseDesc.textContent = data.desc;
          villaTimelapseDesc.setAttribute('data-orig-text', data.desc);
          
          // Re-translate dynamically for the current language
          const currentLang = localStorage.getItem('selectedLang') || 'cs';
          if (currentLang !== 'cs') {
            const origText = data.desc;
            const normalizedText = origText.replace(/\s+/g, ' ').trim();
            if (translationDict[currentLang] && translationDict[currentLang][origText]) {
              villaTimelapseDesc.innerHTML = translationDict[currentLang][origText];
            } else {
              let translated = false;
              if (translationDict[currentLang]) {
                for (let key in translationDict[currentLang]) {
                  const normalizedKey = key.replace(/\s+/g, ' ').trim();
                  if (normalizedKey === normalizedText) {
                    villaTimelapseDesc.innerHTML = translationDict[currentLang][key];
                    translated = true;
                    break;
                  }
                }
              }
              if (!translated) {
                villaTimelapseDesc.innerHTML = origText;
              }
            }
          }
        }
      }
    }

    function startVillaTimelapseAutoplay() {
      if (villaTimelapseInterval) return;
      
      if (villaTimelapsePlayIcon) {
        villaTimelapsePlayIcon.classList.remove('bi-play-fill');
        villaTimelapsePlayIcon.classList.add('bi-pause-fill');
      }
      
      villaTimelapseInterval = setInterval(() => {
        let nextIndex = villaTimelapseCurrentIndex + 1;
        if (nextIndex > villaTimelapseMaxIndex) {
          nextIndex = 0; // Loop back to start
        }
        setVillaTimelapseIndex(nextIndex);
      }, 1200); // 1.2 seconds per frame
    }

    function stopVillaTimelapseAutoplay() {
      if (villaTimelapseInterval) {
        clearInterval(villaTimelapseInterval);
        villaTimelapseInterval = null;
      }
      if (villaTimelapsePlayIcon) {
        villaTimelapsePlayIcon.classList.remove('bi-pause-fill');
        villaTimelapsePlayIcon.classList.add('bi-play-fill');
      }
    }

    function toggleVillaTimelapsePlay() {
      if (villaTimelapseInterval) {
        stopVillaTimelapseAutoplay();
      } else {
        startVillaTimelapseAutoplay();
      }
    }

    if (villaTimelapseModal) {
      villaTimelapseModal.addEventListener('click', e => {
        if (e.target === villaTimelapseModal) closeVillaTimelapseModal();
      });
    }

    // Drag-to-slide logic for the vertical timeline track
    let isDraggingVillaTimelapse = false;
    const villaTimelapseTrackOuter = document.getElementById('villa-timelapse-track-outer');
    const villaTimelapseTrack = document.getElementById('villa-timelapse-track');

    function handleVillaTimelapseDrag(e) {
      if (!isDraggingVillaTimelapse || !villaTimelapseTrack) return;
      
      const rect = villaTimelapseTrack.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      // Calculate relative Y inside the track line
      let relativeY = clientY - rect.top;
      
      // Keep inside bounds
      relativeY = Math.max(0, Math.min(rect.height, relativeY));
      
      // Convert to percentage (0 at top, 1 at bottom)
      const pct = relativeY / rect.height;
      
      // Map to index 0 - 9
      const idx = Math.round(pct * 9);
      
      if (idx !== villaTimelapseCurrentIndex) {
        setVillaTimelapseIndex(idx);
      }
    }

    if (villaTimelapseTrackOuter) {
      villaTimelapseTrackOuter.addEventListener('mousedown', (e) => {
        isDraggingVillaTimelapse = true;
        stopVillaTimelapseAutoplay();
        handleVillaTimelapseDrag(e);
      });

      villaTimelapseTrackOuter.addEventListener('touchstart', (e) => {
        isDraggingVillaTimelapse = true;
        stopVillaTimelapseAutoplay();
        handleVillaTimelapseDrag(e);
      }, { passive: true });
    }

    window.addEventListener('mousemove', (e) => {
      if (isDraggingVillaTimelapse) {
        e.preventDefault(); // Prevent text selection
        handleVillaTimelapseDrag(e);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingVillaTimelapse) {
        handleVillaTimelapseDrag(e);
      }
    }, { passive: false });

    window.addEventListener('mouseup', () => {
      isDraggingVillaTimelapse = false;
    });

    window.addEventListener('touchend', () => {
      isDraggingVillaTimelapse = false;
    });

