    // Live Surveying Telemetry Simulation
    (function() {
      const telLat = document.getElementById('tel-lat');
      const telLon = document.getElementById('tel-lon');
      const telSats = document.getElementById('tel-sats');
      const telPdop = document.getElementById('tel-pdop');
      const telHacc = document.getElementById('tel-hacc');
      const telVacc = document.getElementById('tel-vacc');

      if (telLat && telLon) {
        let lat = 50.075531;
        let lon = 14.437802;

        setInterval(() => {
          // Tiny phase measurement fluctuations (RTK precision)
          const dLat = (Math.random() - 0.5) * 0.000006;
          const dLon = (Math.random() - 0.5) * 0.000006;
          lat += dLat;
          lon += dLon;

          telLat.textContent = lat.toFixed(6) + '° N';
          telLon.textContent = lon.toFixed(6) + '° E';

          // Fluctuate satellites count (between 16 and 22)
          const sats = Math.floor(16 + Math.random() * 7);
          telSats.textContent = sats;

          // PDOP based on satellite geometry simulation
          const pdop = (1.0 + (22 - sats) * 0.05 + (Math.random() - 0.5) * 0.03).toFixed(2);
          telPdop.textContent = pdop;

          // Horizontal/Vertical accuracies in meters
          const hacc = (0.006 + (pdop * 0.0025) + Math.random() * 0.002).toFixed(3);
          const vacc = (hacc * 1.4 + Math.random() * 0.003).toFixed(3);
          telHacc.textContent = hacc + 'm';
          telVacc.textContent = vacc + 'm';
        }, 1000);
      }
    })();

