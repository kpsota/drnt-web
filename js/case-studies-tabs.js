    // ==========================================
    // 2. CASE STUDIES TABS LOGIC
    // ==========================================
    function setCaseStudy(num) {
      if (num === 1) {
        document.getElementById('case-content-1').classList.remove('hidden');
        document.getElementById('case-content-2').classList.add('hidden');
        
        document.getElementById('case-tab-1').className = "px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 bg-[#cff245] text-black shadow-lg";
        document.getElementById('case-tab-2').className = "px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 text-gray-400 hover:text-white bg-transparent";
      } else {
        document.getElementById('case-content-2').classList.remove('hidden');
        document.getElementById('case-content-1').classList.add('hidden');
        
        document.getElementById('case-tab-2').className = "px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 bg-[#cff245] text-black shadow-lg";
        document.getElementById('case-tab-1').className = "px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 text-gray-400 hover:text-white bg-transparent";
      }
    }

