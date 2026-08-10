    // ==========================================
    // MOBILE NAVIGATION MENU LOGIC
    // ==========================================
    function toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu-overlay');
      if (!menu) return;
      if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        // trigger reflow for animation
        menu.getBoundingClientRect();
        menu.classList.remove('-translate-y-full', 'opacity-0');
        menu.classList.add('translate-y-0', 'opacity-100');
        document.body.style.overflow = 'hidden';
      } else {
        closeMobileMenu();
      }
    }

    function closeMobileMenu() {
      const menu = document.getElementById('mobile-menu-overlay');
      if (!menu) return;
      menu.classList.remove('translate-y-0', 'opacity-100');
      menu.classList.add('-translate-y-full', 'opacity-0');
      setTimeout(() => {
        menu.classList.remove('flex');
        menu.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }

    function openMobileGisFromNav() {
      closeMobileMenu();
      openGisModal();
    }

    function toggleGisMobileSidebar(isOpen) {
      const sidebar = document.getElementById('gis-sidebar');
      const backdrop = document.getElementById('gis-sidebar-backdrop');
      if (!sidebar || !backdrop) return;

      if (isOpen) {
        backdrop.classList.remove('hidden');
        backdrop.getBoundingClientRect();
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');

        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      } else {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');

        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');

        setTimeout(() => {
          if (sidebar.classList.contains('-translate-x-full')) {
            backdrop.classList.add('hidden');
          }
        }, 300);
      }
    }

