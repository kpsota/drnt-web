    // Compare Resolution Modal Logic
    const compareModal = document.getElementById('compare-modal');
    const sliderContainer = document.getElementById('slider-container');
    const sliderClip = document.getElementById('slider-clip');
    const sliderHandle = document.getElementById('slider-handle');
    const compareBeforeCanvas = document.getElementById('compare-before-canvas');
    const compareAfterImg = document.getElementById('compare-after-img');

    let isDraggingSlider = false;
    let currentImgSrc = '';
    let currentPixelSize = 1;

    function openCompareModal() {
      compareModal.classList.remove('hidden');
      compareModal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      setCompareScenario('house', 'images/photos/compare_garden.png', 6);
      updateSlider(50);
    }

    function closeCompareModal() {
      compareModal.classList.remove('flex');
      compareModal.classList.add('hidden');
      document.body.style.overflow = '';
    }

    function updateSlider(pct) {
      pct = Math.max(0, Math.min(100, pct));
      sliderClip.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
      sliderHandle.style.left = `${pct}%`;
    }

    function handleSliderMove(e) {
      if (!isDraggingSlider) return;
      if (e.cancelable) e.preventDefault(); // Prevent page scroll on mobile
      const rect = sliderContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = (x / rect.width) * 100;
      updateSlider(pct);
    }

    function drawPixelatedImage(imgSrc, pixelSize) {
      if (!compareBeforeCanvas) return;
      const ctx = compareBeforeCanvas.getContext('2d');
      const img = new Image();
      img.onload = function() {
        const lowResW = Math.max(16, Math.round(img.width / pixelSize));
        const lowResH = Math.max(12, Math.round(img.height / pixelSize));
        
        compareBeforeCanvas.width = lowResW;
        compareBeforeCanvas.height = lowResH;

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        ctx.drawImage(img, 0, 0, lowResW, lowResH);
      };
      img.src = imgSrc;
    }

    function setCompareScenario(id, imgSrc, pixelSize) {
      currentImgSrc = imgSrc;
      currentPixelSize = pixelSize;

      if (compareAfterImg) compareAfterImg.src = imgSrc;
      drawPixelatedImage(imgSrc, pixelSize);

      document.querySelectorAll('.scen-btn').forEach(btn => {
        btn.classList.remove('border-[#cff245]/80', 'bg-[#cff245]/5');
        btn.classList.add('border-white/5', 'bg-white/[0.01]');
        const badge = btn.querySelector('.font-mono');
        if (badge) {
          badge.classList.remove('bg-[#cff245]', 'text-black');
          badge.classList.add('bg-white/10', 'text-gray-300');
        }
      });

      const activeBtn = document.getElementById(`btn-scen-${id}`);
      if (activeBtn) {
        activeBtn.classList.remove('border-white/5', 'bg-white/[0.01]');
        activeBtn.classList.add('border-[#cff245]/80', 'bg-[#cff245]/5');
        const badge = activeBtn.querySelector('.font-mono');
        if (badge) {
          badge.classList.remove('bg-white/10', 'text-gray-300');
          badge.classList.add('bg-[#cff245]', 'text-black');
        }
      }
    }

    if (sliderContainer) {
      sliderContainer.addEventListener('mousedown', (e) => {
        isDraggingSlider = true;
        handleSliderMove(e);
      });
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', () => {
        isDraggingSlider = false;
      });

      sliderContainer.addEventListener('touchstart', (e) => {
        isDraggingSlider = true;
        handleSliderMove(e);
      }, { passive: true });
      window.addEventListener('touchmove', handleSliderMove, { passive: false });
      window.addEventListener('touchend', () => {
        isDraggingSlider = false;
      });

      window.addEventListener('resize', () => {
        if (compareModal && !compareModal.classList.contains('hidden') && currentImgSrc) {
          drawPixelatedImage(currentImgSrc, currentPixelSize);
        }
      });
    }

    compareModal.addEventListener('click', e => {
      if (e.target === compareModal) closeCompareModal();
    });

    // Compare Health Modal Logic
    const healthModal = document.getElementById('health-modal');
    const healthSliderContainer = document.getElementById('health-slider-container');
    const healthSliderClip = document.getElementById('health-slider-clip');
    const healthSliderHandle = document.getElementById('health-slider-handle');

    let isDraggingHealthSlider = false;

    function openHealthModal() {
      if (healthModal) {
        healthModal.classList.remove('hidden');
        healthModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        updateHealthSlider(50);
      }
    }

    function closeHealthModal() {
      if (healthModal) {
        healthModal.classList.remove('flex');
        healthModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }

    function updateHealthSlider(pct) {
      pct = Math.max(0, Math.min(100, pct));
      if (healthSliderClip) healthSliderClip.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
      if (healthSliderHandle) healthSliderHandle.style.left = `${pct}%`;
    }

    function handleHealthSliderMove(e) {
      if (!isDraggingHealthSlider) return;
      if (e.cancelable) e.preventDefault();
      const rect = healthSliderContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = (x / rect.width) * 100;
      updateHealthSlider(pct);
    }

    if (healthSliderContainer) {
      healthSliderContainer.addEventListener('mousedown', (e) => {
        isDraggingHealthSlider = true;
        handleHealthSliderMove(e);
      });
      window.addEventListener('mousemove', handleHealthSliderMove);
      window.addEventListener('mouseup', () => {
        isDraggingHealthSlider = false;
      });

      healthSliderContainer.addEventListener('touchstart', (e) => {
        isDraggingHealthSlider = true;
        handleHealthSliderMove(e);
      }, { passive: true });
      window.addEventListener('touchmove', handleHealthSliderMove, { passive: false });
      window.addEventListener('touchend', () => {
        isDraggingHealthSlider = false;
      });
    }

    if (healthModal) {
      healthModal.addEventListener('click', e => {
        if (e.target === healthModal) closeHealthModal();
      });
    }

    // Compare Mowing Modal Logic
    const mowingModal = document.getElementById('mowing-modal');
    const mowingSliderContainer = document.getElementById('mowing-slider-container');
    const mowingSliderClip = document.getElementById('mowing-slider-clip');
    const mowingSliderHandle = document.getElementById('mowing-slider-handle');

    let isDraggingMowingSlider = false;

    function openMowingModal() {
      if (mowingModal) {
        mowingModal.classList.remove('hidden');
        mowingModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        updateMowingSlider(50);
      }
    }

    function closeMowingModal() {
      if (mowingModal) {
        mowingModal.classList.remove('flex');
        mowingModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }

    function updateMowingSlider(pct) {
      pct = Math.max(0, Math.min(100, pct));
      if (mowingSliderClip) mowingSliderClip.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
      if (mowingSliderHandle) mowingSliderHandle.style.left = `${pct}%`;
    }

    function handleMowingSliderMove(e) {
      if (!isDraggingMowingSlider) return;
      if (e.cancelable) e.preventDefault();
      const rect = mowingSliderContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = (x / rect.width) * 100;
      updateMowingSlider(pct);
    }

    if (mowingSliderContainer) {
      mowingSliderContainer.addEventListener('mousedown', (e) => {
        isDraggingMowingSlider = true;
        handleMowingSliderMove(e);
      });
      window.addEventListener('mousemove', handleMowingSliderMove);
      window.addEventListener('mouseup', () => {
        isDraggingMowingSlider = false;
      });

      mowingSliderContainer.addEventListener('touchstart', (e) => {
        isDraggingMowingSlider = true;
        handleMowingSliderMove(e);
      }, { passive: true });
      window.addEventListener('touchmove', handleMowingSliderMove, { passive: false });
      window.addEventListener('touchend', () => {
        isDraggingMowingSlider = false;
      });
    }

    if (mowingModal) {
      mowingModal.addEventListener('click', e => {
        if (e.target === mowingModal) closeMowingModal();
      });
    }

