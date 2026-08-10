    // Hero Canvas Drone Animation
    const heroCanvas = document.getElementById('hero-drone-canvas');
    if (heroCanvas) {
      const ctx = heroCanvas.getContext('2d');
      let width = heroCanvas.width = heroCanvas.offsetWidth;
      let height = heroCanvas.height = heroCanvas.offsetHeight;

      window.addEventListener('resize', () => {
        if (!heroCanvas) return;
        width = heroCanvas.width = heroCanvas.offsetWidth;
        height = heroCanvas.height = heroCanvas.offsetHeight;
      });

      // Path points in percentage of canvas width/height
      const percentPath = [
        { x: 0.12, y: 0.20, pause: true },
        { x: 0.38, y: 0.65, pause: true },
        { x: 0.88, y: 0.22, pause: true },
        { x: 0.62, y: 0.78, pause: true },
        { x: 0.18, y: 0.55, pause: true },
        { x: 0.48, y: 0.18, pause: true },
        { x: 0.82, y: 0.62, pause: true }
      ];

      // Catmull-Rom spline math
      function catmullRom(t, p0, p1, p2, p3) {
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * (
          (2 * p1) +
          (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
      }

      let drone = {
        segmentIdx: 0,
        t: 0,
        x: percentPath[0].x * width,
        y: percentPath[0].y * height,
        vx: 0,
        vy: 0,
        speed: 1.05, // Smooth slow speed
        pauseTimer: 0,
        dots: [], // history of {px, py, life, maxLife} (stationary dropped dots)
        distSinceLastDot: 0,
        lastAngle: 0
      };

      let stars = []; // array of {x, y, life, maxLife} (for camera flashes)

      function drawLogoArrow(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        // Custom triangle arrow matching the logo
        ctx.moveTo(0, -size); 
        ctx.lineTo(-size * 0.65, size * 0.75); 
        ctx.lineTo(0, size * 0.35); 
        ctx.lineTo(size * 0.65, size * 0.75); 
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.10)'; // Less visible white (10%)
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)'; // Less visible border (20%)
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      function drawFlash(ctx, x, y, life, maxLife) {
        const progress = life / maxLife; // 0 to 1
        const opacity = Math.pow(1 - progress, 2); // Fast quadratic fade out (camera flash look)
        if (opacity <= 0) return;

        ctx.save();
        
        // 1. Radial glow (white/lime burst)
        const glowRadius = 25 * (1 - progress);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.95})`);
        grad.addColorStop(0.25, `rgba(207, 242, 69, ${opacity * 0.50})`);
        grad.addColorStop(1, 'rgba(207, 242, 69, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // 2. Expanding shockwave ring (lens flare ring)
        const ringRadius = 5 + progress * 22;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.50})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Central hot spot
        ctx.beginPath();
        ctx.arc(x, y, 2.5 * (1 - progress), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
        
        ctx.restore();
      }

      function animate() {
        if (!heroCanvas) return;
        ctx.clearRect(0, 0, width, height);

        const N = percentPath.length;
        const p0 = percentPath[(drone.segmentIdx - 1 + N) % N];
        const p1 = percentPath[drone.segmentIdx];
        const p2 = percentPath[(drone.segmentIdx + 1) % N];
        const p3 = percentPath[(drone.segmentIdx + 2) % N];

        // Calculate segment distance dynamically
        const p1x = p1.x * width;
        const p1y = p1.y * height;
        const p2x = p2.x * width;
        const p2y = p2.y * height;
        const segmentDist = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);

        const dt = segmentDist > 0 ? (drone.speed / segmentDist) : 0.01;

        // Age and update dots (run in every frame)
        for (let i = drone.dots.length - 1; i >= 0; i--) {
          drone.dots[i].life++;
          if (drone.dots[i].life >= drone.dots[i].maxLife) {
            drone.dots.splice(i, 1);
          }
        }

        if (drone.pauseTimer > 0) {
          drone.pauseTimer--;
          if (drone.pauseTimer === 0) {
            drone.segmentIdx = (drone.segmentIdx + 1) % N;
            drone.t = 0;
          }
        } else {
          drone.t += dt;
          if (drone.t >= 1) {
            drone.t = 1;
            
            const finalX = catmullRom(1, p0.x, p1.x, p2.x, p3.x) * width;
            const finalY = catmullRom(1, p0.y, p1.y, p2.y, p3.y) * height;
            
            drone.vx = finalX - drone.x;
            drone.vy = finalY - drone.y;
            drone.x = finalX;
            drone.y = finalY;

            // Check if we drop a final dot at the node
            const d = Math.sqrt(drone.vx * drone.vx + drone.vy * drone.vy);
            drone.distSinceLastDot += d;
            if (drone.distSinceLastDot >= 16) {
              drone.dots.push({
                px: drone.x / width,
                py: drone.y / height,
                life: 0,
                maxLife: 150 // Lives for ~2.5s
              });
              drone.distSinceLastDot = 0;
            }

            if (p2.pause) {
              drone.pauseTimer = 80; // Pause at node
              stars.push({
                x: drone.x,
                y: drone.y,
                life: 0,
                maxLife: 30 // Camera flash duration
              });
            } else {
              drone.segmentIdx = (drone.segmentIdx + 1) % N;
              drone.t = 0;
            }
          } else {
            const newX = catmullRom(drone.t, p0.x, p1.x, p2.x, p3.x) * width;
            const newY = catmullRom(drone.t, p0.y, p1.y, p2.y, p3.y) * height;

            drone.vx = newX - drone.x;
            drone.vy = newY - drone.y;
            drone.x = newX;
            drone.y = newY;

            // Drop a dot at regular 16px distance intervals
            const d = Math.sqrt(drone.vx * drone.vx + drone.vy * drone.vy);
            drone.distSinceLastDot += d;
            if (drone.distSinceLastDot >= 16) {
              drone.dots.push({
                px: drone.x / width,
                py: drone.y / height,
                life: 0,
                maxLife: 150
              });
              drone.distSinceLastDot = 0;
            }
          }
        }

        // Draw Dots (Fixed in space where dropped, fading out, max 14% opacity)
        if (drone.dots.length > 0) {
          ctx.save();
          for (let dot of drone.dots) {
            const progress = dot.life / dot.maxLife;
            const opacity = (1 - progress) * 0.14; // Smooth linear fade
            if (opacity <= 0) continue;
            
            ctx.beginPath();
            ctx.arc(dot.px * width, dot.py * height, 1.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
          }
          ctx.restore();
        }

        // Draw and update camera flashes
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          s.life++;
          drawFlash(ctx, s.x, s.y, s.life, s.maxLife);
          if (s.life >= s.maxLife) {
            stars.splice(i, 1);
          }
        }

        // Draw Drone shape (pointing in velocity direction)
        if (drone.pauseTimer === 0 && (Math.abs(drone.vx) > 0.01 || Math.abs(drone.vy) > 0.01)) {
          drone.lastAngle = Math.atan2(drone.vy, drone.vx) + Math.PI / 2;
        }
        
        drawLogoArrow(ctx, drone.x, drone.y, drone.lastAngle, 7); // size 7px

        requestAnimationFrame(animate);
      }

      animate();
    }

