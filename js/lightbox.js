    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');
    let lbGallery = [], lbIndex = 0;

    document.querySelectorAll('.lb-thumb').forEach(img => {
      img.addEventListener('click', () => {
        const group = img.closest('.grid');
        lbGallery = Array.from(group.querySelectorAll('.lb-thumb'));
        lbIndex = lbGallery.indexOf(img);
        openLightbox();
      });
    });

    function openLightbox() {
      lbImg.src = lbGallery[lbIndex].src;
      lbImg.alt = lbGallery[lbIndex].alt;
      lbPrev.classList.toggle('hidden', lbIndex === 0);
      lbNext.classList.toggle('hidden', lbIndex === lbGallery.length - 1);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function lbNav(dir) {
      lbIndex = Math.max(0, Math.min(lbGallery.length - 1, lbIndex + dir));
      openLightbox();
    }

    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (lb.classList.contains('open')) closeLightbox();
        if (compareModal && !compareModal.classList.contains('hidden')) closeCompareModal();
        if (healthModal && !healthModal.classList.contains('hidden')) closeHealthModal();
        if (typeof mowingModal !== 'undefined' && mowingModal && !mowingModal.classList.contains('hidden')) closeMowingModal();
        if (model3DModal && !model3DModal.classList.contains('hidden')) closeModel3DModal();
        if (gisModal && !gisModal.classList.contains('hidden')) closeGisModal();
      }
      if (lb.classList.contains('open')) {
        if (e.key === 'ArrowLeft') lbNav(-1);
        if (e.key === 'ArrowRight') lbNav(1);
      }
    });

    function closeLightbox() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }

