    // ==========================================
    // GIS CLIENT PORTAL & CASE STUDIES MODAL LOGIC
    // ==========================================
    const gisModal = document.getElementById('gis-modal');
    const casesModal = document.getElementById('cases-modal');

    function openGisModal() {
      gisModal.classList.remove('hidden');
      gisModal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      clearGisData();
      
      requestAnimationFrame(() => {
        requestAnimationFrame(updateViewportLayout);
      });
    }

    function closeGisModal() {
      gisModal.classList.remove('flex');
      gisModal.classList.add('hidden');
      document.body.style.overflow = '';
      
      // Reset to first image on modal close
      switchGisImage(1);
      
      // Reset zoom and pan state when closing the modal completely
      zoomScale = 1;
      panX = 0;
      panY = 0;
      isPanning = false;
      updateViewportTransform();
      
      clearGisData();
    }

    function openCasesModal() {
      if (casesModal) {
        casesModal.classList.remove('hidden');
        casesModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeCasesModal() {
      if (casesModal) {
        casesModal.classList.remove('flex');
        casesModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }

    window.addEventListener('click', e => { 
      if (e.target === gisModal) closeGisModal(); 
      if (e.target === casesModal) closeCasesModal(); 
    });

