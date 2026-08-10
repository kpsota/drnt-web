    // ==========================================
    // 4. MULTI-STEP CONFIGURATOR LOGIC
    // ==========================================
    let configStep = 1;
    const consultationModal = document.getElementById('consultation-modal');

    function openConsultationModal() {
      consultationModal.classList.remove('hidden');
      consultationModal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      
      // Reset to step 1
      configStep = 1;
      updateConfigStepView();
      document.getElementById('consultation-form').classList.remove('hidden');
      document.getElementById('config-success-screen').classList.add('hidden');
      document.getElementById('consultation-form').reset();
      
      // Clear active cards styling
      document.querySelectorAll('input[name="services"]').forEach(inp => {
        inp.checked = false;
        const card = inp.closest('label');
        if (card) {
          card.classList.remove('border-[#cff245]', 'bg-[#cff245]/5');
          card.classList.add('border-white/5', 'bg-white/[0.01]');
          const icon = card.querySelector('i');
          if (icon) icon.className = icon.className.replace('text-[#cff245]', 'text-gray-400');
        }
      });
      
      // Reset sliders
      updateConfigSlider(2);
      selectConfigAccuracy('rtk', document.querySelector('input[value="rtk"]').closest('label'));
    }

    function closeConsultationModal() {
      consultationModal.classList.remove('flex');
      consultationModal.classList.add('hidden');
      document.body.style.overflow = '';
    }

    function toggleConfigService(el) {
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      
      checkbox.checked = !checkbox.checked;
      
      const icon = el.querySelector('i');
      if (checkbox.checked) {
        el.classList.add('border-[#cff245]', 'bg-[#cff245]/5');
        el.classList.remove('border-white/5', 'bg-white/[0.01]');
        if (icon) {
          icon.classList.remove('text-gray-400');
          icon.classList.add('text-[#cff245]');
        }
      } else {
        el.classList.remove('border-[#cff245]', 'bg-[#cff245]/5');
        el.classList.add('border-white/5', 'bg-white/[0.01]');
        if (icon) {
          icon.classList.remove('text-[#cff245]');
          icon.classList.add('text-gray-400');
        }
      }
      
      document.getElementById('step-1-err').classList.add('hidden');
    }

    function updateConfigSlider(val) {
      const texts = {
        1: "< 1 ha (Zahrady / Drobné stavby)",
        2: "1 - 10 ha (Staveniště / Lom)",
        3: "10 - 50 ha (Velké stavby / Dálnice)",
        4: "> 50 ha (Krajinné celky / Lesy)"
      };
      
      document.getElementById('config-slider-val').textContent = texts[val];
      document.getElementById('config-range-slider').value = val;
    }

    function selectConfigAccuracy(val, el) {
      const radio = el.querySelector('input[type="radio"]');
      if (!radio) return;
      
      radio.checked = true;
      
      // Update radio cards styling
      document.querySelectorAll('input[name="accuracy"]').forEach(rad => {
        const card = rad.closest('label');
        if (card) {
          card.classList.remove('border-[#cff245]', 'bg-[#cff245]/5');
          card.classList.add('border-white/5', 'bg-white/[0.01]');
          const checkIcon = card.querySelector('i');
          if (checkIcon) {
            checkIcon.className = rad.value === 'rtk' ? "bi bi-patch-check text-gray-400" : "bi bi-camera-video text-gray-400";
          }
        }
      });
      
      el.classList.add('border-[#cff245]', 'bg-[#cff245]/5');
      el.classList.remove('border-white/5', 'bg-white/[0.01]');
      const icon = el.querySelector('i');
      if (icon) {
        icon.className = val === 'rtk' ? "bi bi-patch-check-fill text-[#cff245]" : "bi bi-camera-video text-[#cff245]";
      }
    }

    function navigateConfigStep(dir) {
      // Validation
      if (dir === 1) {
        if (configStep === 1) {
          const checkedServices = document.querySelectorAll('input[name="services"]:checked');
          if (checkedServices.length === 0) {
            document.getElementById('step-1-err').classList.remove('hidden');
            return;
          }
        } else if (configStep === 2) {
          // Slide 2 is always valid
        }
      }

      configStep += dir;
      updateConfigStepView();
    }

    function updateConfigStepView() {
      // Hide all steps
      document.getElementById('config-step-1').classList.add('hidden');
      document.getElementById('config-step-2').classList.add('hidden');
      document.getElementById('config-step-3').classList.add('hidden');

      // Show active step
      document.getElementById(`config-step-${configStep}`).classList.remove('hidden');

      // Update stepper label
      document.getElementById('configurator-step-lbl').textContent = `Krok ${configStep}/3`;

      // Update stepper bars
      for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (indicator) {
          indicator.className = `h-1.5 rounded-full flex-1 transition-all duration-300 ` + 
            (i <= configStep ? "bg-[#cff245]" : "bg-white/10");
        }
      }

      // Update buttons
      const btnBack = document.getElementById('config-btn-back');
      const btnNext = document.getElementById('config-btn-next');
      const btnSubmit = document.getElementById('config-btn-submit');

      if (configStep === 1) {
        btnBack.classList.add('opacity-0', 'pointer-events-none');
        btnNext.classList.remove('hidden');
        btnSubmit.classList.add('hidden');
      } else if (configStep === 2) {
        btnBack.classList.remove('opacity-0', 'pointer-events-none');
        btnNext.classList.remove('hidden');
        btnSubmit.classList.add('hidden');
      } else if (configStep === 3) {
        btnBack.classList.remove('opacity-0', 'pointer-events-none');
        btnNext.classList.add('hidden');
        btnSubmit.classList.remove('hidden');
      }
      
      // Hide error messages
      document.getElementById('step-1-err').classList.add('hidden');
      document.getElementById('step-3-err').classList.add('hidden');
    }

    function submitConfigurator(e) {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const phone = document.getElementById('form-phone').value.trim();

      if (!name || !email || !phone) {
        document.getElementById('step-3-err').classList.remove('hidden');
        return;
      }

      // Submit success animation
      document.getElementById('consultation-form').classList.add('hidden');
      document.getElementById('config-success-screen').classList.remove('hidden');
      document.getElementById('config-success-screen').classList.add('flex');
    }

    consultationModal.addEventListener('click', e => { 
      if (e.target === consultationModal) closeConsultationModal(); 
    });

