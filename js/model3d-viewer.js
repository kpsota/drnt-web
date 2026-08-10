    // Interactive 3D Model Modal Logic
    const model3DModal = document.getElementById('model3d-modal');
    let scene3d, camera3d, renderer3d, controls3d, animationFrameId;
    let buildingGroup, pointCloud, ground3d, waterMesh, beacon;
    let mainRoof, garageRoof, connRoof, solarPanels, pergolaGroup, chimney;
    let is3DInitialized = false;
    let currentViewMode = 'textured';

    function openModel3DModal() {
      if (model3DModal) {
        model3DModal.classList.remove('hidden');
        model3DModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }

      // Simulate loading spinner
      const loader = document.getElementById('model3d-loading');
      if (loader) {
        loader.style.opacity = '1';
        loader.classList.remove('hidden');
      }

      setTimeout(() => {
        if (typeof THREE !== 'undefined') {
          if (!is3DInitialized) {
            init3D();
          } else {
            if (!animationFrameId) {
              // resume animation loop
              animate3D(0);
            }
          }
          if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.classList.add('hidden'), 300);
          }
          resize3D();
        } else {
          const loadingText = document.querySelector('.model3d-loading-text');
          if (loadingText) {
            loadingText.textContent = "Chyba načítání (Three.js nedostupný)";
            loadingText.classList.add('text-red-500');
          }
        }
      }, 600);
    }

    function closeModel3DModal() {
      if (model3DModal) {
        model3DModal.classList.remove('flex');
        model3DModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    function init3D() {
      const container = document.getElementById('canvas3d-container');
      const canvas = document.getElementById('webgl-canvas');
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene
      scene3d = new THREE.Scene();
      scene3d.background = new THREE.Color(0x07080a);

      // Camera
      camera3d = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera3d.position.set(-6, 7, 10);

      // Renderer
      renderer3d = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer3d.setSize(width, height);
      renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer3d.shadowMap.enabled = true;
      renderer3d.shadowMap.type = THREE.PCFSoftShadowMap;

      // Controls
      controls3d = new THREE.OrbitControls(camera3d, renderer3d.domElement);
      controls3d.enableDamping = true;
      controls3d.dampingFactor = 0.05;
      controls3d.maxPolarAngle = Math.PI / 2 - 0.05;
      controls3d.minDistance = 3;
      controls3d.maxDistance = 25;
      controls3d.target.set(0.2, 1, -0.6);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene3d.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
      dirLight.position.set(6, 12, 4);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.bias = -0.0005;
      scene3d.add(dirLight);

      // Group for all meshes (ground, house, trees, pool, fences)
      buildingGroup = new THREE.Group();
      scene3d.add(buildingGroup);

      // Helper: apply photogrammetry distortion to simulate triangulated scan noise
      function applyOrganicDistortion(geo, strength, minY = -99) {
        const pos = geo.attributes.position;
        if (!pos) return;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);
          if (y > minY) {
            pos.setX(i, x + (Math.random() - 0.5) * strength);
            pos.setY(i, y + (Math.random() - 0.5) * strength);
            pos.setZ(i, z + (Math.random() - 0.5) * strength);
          }
        }
        geo.computeVertexNormals();
      }

      // Procedural Texture Generators for walls
      function createPlasterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#dfdbd5';
        ctx.fillRect(0, 0, 256, 256);
        
        const imgData = ctx.getImageData(0, 0, 256, 256);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const n = (Math.random() - 0.5) * 12;
          data[i] = Math.min(255, Math.max(0, data[i] + n));
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
        }
        ctx.putImageData(imgData, 0, 0);

        const grad = ctx.createLinearGradient(0, 0, 0, 60);
        grad.addColorStop(0, 'rgba(80, 75, 70, 0.45)');
        grad.addColorStop(1, 'rgba(80, 75, 70, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 60);

        ctx.strokeStyle = 'rgba(100, 90, 80, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, 50); ctx.lineTo(82, 80); ctx.lineTo(79, 100); ctx.lineTo(84, 130);
        ctx.stroke();
        
        return new THREE.CanvasTexture(canvas);
      }

      function createGcpTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillRect(32, 32, 32, 32);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 0); ctx.lineTo(32, 64);
        ctx.moveTo(0, 32); ctx.lineTo(64, 32);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      // Materials
      const textureLoader = new THREE.TextureLoader();
      const wallTex = textureLoader.load('images/photos/texture_wall.jpg');
      wallTex.wrapS = THREE.RepeatWrapping;
      wallTex.wrapT = THREE.RepeatWrapping;
      wallTex.repeat.set(3, 2);

      const roofTex = textureLoader.load('images/photos/texture_roof.jpg');
      roofTex.wrapS = THREE.RepeatWrapping;
      roofTex.wrapT = THREE.RepeatWrapping;
      roofTex.repeat.set(4, 3);

      const plasterMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.05 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2d2f36, roughness: 0.5 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.75 });

      // Terrain Mesh coordinates height function
      function getTerrainHeight(x, z) {
        // Keep house and pool center flat
        const distFromCenter = Math.sqrt((x - 0.2)*(x - 0.2) + (z + 0.6)*(z + 0.6));
        if (distFromCenter < 3.2) {
          return 0;
        } else {
          const factor = Math.min(1.0, (distFromCenter - 3.2) / 1.6);
          return (Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.35) * factor;
        }
      }

      // Load compare_garden.png and build the photogrammetry model
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = function() {
        buildScene(img);
      };
      
      img.onerror = function() {
        console.warn("Could not load texture image due to CORS or network. Using grass-green fallback.");
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 128;
        fallbackCanvas.height = 128;
        const ctx = fallbackCanvas.getContext('2d');
        ctx.fillStyle = '#3d632a'; // Grass green
        ctx.fillRect(0, 0, 128, 128);
        // Add a simulated red house roof block to make the fallback look textured
        ctx.fillStyle = '#b23b3b';
        ctx.fillRect(50, 40, 35, 45);
        buildScene(fallbackCanvas);
      };

      function buildScene(imgSource) {
        // Build Texture from loaded Image element
        const photoTexture = new THREE.Texture(imgSource);
        photoTexture.needsUpdate = true;
        photoTexture.wrapS = THREE.ClampToEdgeWrapping;
        photoTexture.wrapT = THREE.ClampToEdgeWrapping;

        const photoMat = new THREE.MeshStandardMaterial({
          map: photoTexture,
          roughness: 0.85,
          metalness: 0.05
        });

        // Helper to create a gabled roof
        function createGabledRoof(width, length, height) {
          const shape = new THREE.Shape();
          shape.moveTo(-width/2, 0);
          shape.lineTo(0, height);
          shape.lineTo(width/2, 0);
          shape.closePath();

          const extrudeSettings = {
            depth: length,
            bevelEnabled: false
          };

          const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          geo.translate(0, 0, -length/2);
          applyOrganicDistortion(geo, 0.01);

          const mat = new THREE.MeshStandardMaterial({
            map: roofTex,
            roughness: 0.7,
            metalness: 0.1
          });

          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          return mesh;
        }

        // 1. Terrain Mesh (Circular cropped island)
        const terrainGeo = new THREE.CircleGeometry(4.8, 48);
        terrainGeo.rotateX(-Math.PI / 2); // lie flat
        const posAttr = terrainGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const px = posAttr.getX(i);
          const pz = posAttr.getZ(i);
          posAttr.setY(i, getTerrainHeight(px, pz));
        }
        applyOrganicDistortion(terrainGeo, 0.015);
        const terrainMesh = new THREE.Mesh(terrainGeo, photoMat);
        terrainMesh.receiveShadow = true;
        terrainMesh.castShadow = true;
        terrainMesh.name = 'ground';
        buildingGroup.add(terrainMesh);

        // 2. Coordinate-Aligned House Group (centered matching photo)
        const houseGroup = new THREE.Group();
        houseGroup.position.set(0.2, 0, -0.6);
        buildingGroup.add(houseGroup);

        // Materials array for box meshes: sides = plaster, top/bottom = photo drapes
        const boxMaterials = [
          plasterMat, // Right
          plasterMat, // Left
          photoMat,   // Top
          plasterMat, // Bottom
          plasterMat, // Front
          plasterMat  // Back
        ];

        // Main Wing (Center)
        const wallsGeo = new THREE.BoxGeometry(2.4, 2.2, 3.4, 8, 6, 8);
        applyOrganicDistortion(wallsGeo, 0.012, -0.8);
        const wallsMesh = new THREE.Mesh(wallsGeo, boxMaterials);
        wallsMesh.position.set(-0.2, 1.1, -0.8);
        wallsMesh.castShadow = true;
        wallsMesh.receiveShadow = true;
        houseGroup.add(wallsMesh);

        // Left Wing - Wooden Pergola & Seating
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a6735, roughness: 0.8, metalness: 0.1 });
        pergolaGroup = new THREE.Group();
        pergolaGroup.position.set(-2.0, 0, 0.2);
        houseGroup.add(pergolaGroup);

        // 4 pergola pillars
        const postGeo = new THREE.BoxGeometry(0.08, 1.6, 0.08);
        const p1 = new THREE.Mesh(postGeo, woodMat); p1.position.set(-0.8, 0.8, -0.8); p1.castShadow = true; pergolaGroup.add(p1);
        const p2 = new THREE.Mesh(postGeo, woodMat); p2.position.set(0.8, 0.8, -0.8); p2.castShadow = true; pergolaGroup.add(p2);
        const p3 = new THREE.Mesh(postGeo, woodMat); p3.position.set(-0.8, 0.8, 0.8); p3.castShadow = true; pergolaGroup.add(p3);
        const p4 = new THREE.Mesh(postGeo, woodMat); p4.position.set(0.8, 0.8, 0.8); p4.castShadow = true; pergolaGroup.add(p4);

        // Beams along Z axis
        const beamGeoZ = new THREE.BoxGeometry(0.08, 0.08, 1.8);
        const b1 = new THREE.Mesh(beamGeoZ, woodMat); b1.position.set(-0.8, 1.6, 0); b1.castShadow = true; pergolaGroup.add(b1);
        const b2 = new THREE.Mesh(beamGeoZ, woodMat); b2.position.set(0.8, 1.6, 0); b2.castShadow = true; pergolaGroup.add(b2);

        // Cross slats along X axis
        const slatGeoX = new THREE.BoxGeometry(1.8, 0.03, 0.05);
        const numSlats = 6;
        for (let i = 0; i < numSlats; i++) {
          const slat = new THREE.Mesh(slatGeoX, woodMat);
          const sz = -0.8 + (i / (numSlats - 1)) * 1.6;
          slat.position.set(0, 1.64, sz);
          slat.castShadow = true;
          pergolaGroup.add(slat);
        }

        // Dining table and seating inside pergola
        const tableTopGeo = new THREE.BoxGeometry(0.8, 0.04, 0.5);
        const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
        tableTop.position.set(0, 0.42, 0);
        tableTop.castShadow = true;
        pergolaGroup.add(tableTop);

        const legGeo = new THREE.BoxGeometry(0.05, 0.4, 0.05);
        const tl1 = new THREE.Mesh(legGeo, woodMat); tl1.position.set(-0.35, 0.2, -0.2); tl1.castShadow = true; pergolaGroup.add(tl1);
        const tl2 = new THREE.Mesh(legGeo, woodMat); tl2.position.set(0.35, 0.2, -0.2); tl2.castShadow = true; pergolaGroup.add(tl2);
        const tl3 = new THREE.Mesh(legGeo, woodMat); tl3.position.set(-0.35, 0.2, 0.2); tl3.castShadow = true; pergolaGroup.add(tl3);
        const tl4 = new THREE.Mesh(legGeo, woodMat); tl4.position.set(0.35, 0.2, 0.2); tl4.castShadow = true; pergolaGroup.add(tl4);

        const benchTopGeo = new THREE.BoxGeometry(0.8, 0.03, 0.18);
        const bench1 = new THREE.Mesh(benchTopGeo, woodMat);
        bench1.position.set(0, 0.265, -0.4);
        bench1.castShadow = true;
        pergolaGroup.add(bench1);

        const benchLegGeo = new THREE.BoxGeometry(0.04, 0.25, 0.04);
        const bl1 = new THREE.Mesh(benchLegGeo, woodMat); bl1.position.set(-0.35, 0.125, -0.4); bl1.castShadow = true; pergolaGroup.add(bl1);
        const bl2 = new THREE.Mesh(benchLegGeo, woodMat); bl2.position.set(0.35, 0.125, -0.4); bl2.castShadow = true; pergolaGroup.add(bl2);

        const bench2 = new THREE.Mesh(benchTopGeo, woodMat);
        bench2.position.set(0, 0.265, 0.4);
        bench2.castShadow = true;
        pergolaGroup.add(bench2);

        const bl3 = new THREE.Mesh(benchLegGeo, woodMat); bl3.position.set(-0.35, 0.125, 0.4); bl3.castShadow = true; pergolaGroup.add(bl3);
        const bl4 = new THREE.Mesh(benchLegGeo, woodMat); bl4.position.set(0.35, 0.125, 0.4); bl4.castShadow = true; pergolaGroup.add(bl4);

        // Right Wing (Garage)
        const garageGeo = new THREE.BoxGeometry(1.6, 1.4, 2.4, 6, 4, 6);
        applyOrganicDistortion(garageGeo, 0.012, -0.6);
        const garageMesh = new THREE.Mesh(garageGeo, boxMaterials);
        garageMesh.position.set(1.8, 0.7, -0.4);
        garageMesh.castShadow = true;
        garageMesh.receiveShadow = true;
        houseGroup.add(garageMesh);

        // Connecting wing
        const connGeo = new THREE.BoxGeometry(0.8, 1.35, 1.2, 4, 3, 4);
        applyOrganicDistortion(connGeo, 0.01);
        const connMesh = new THREE.Mesh(connGeo, boxMaterials);
        connMesh.position.set(0.9, 0.675, -0.8);
        connMesh.castShadow = true;
        connMesh.receiveShadow = true;
        houseGroup.add(connMesh);

        // Add sloped gabled roofs to each house wing
        mainRoof = createGabledRoof(2.4, 3.4, 0.9);
        mainRoof.position.set(-0.2, 2.2, -0.8);
        houseGroup.add(mainRoof);

        garageRoof = createGabledRoof(1.6, 2.4, 0.5);
        garageRoof.position.set(1.8, 1.4, -0.4);
        houseGroup.add(garageRoof);

        connRoof = createGabledRoof(0.8, 1.2, 0.25);
        connRoof.position.set(0.9, 1.35, -0.8);
        houseGroup.add(connRoof);

        // Windows and Doors builder
        function add3DWindow(parent, w, h, x, y, z, rotY = 0) {
          const group = new THREE.Group();
          group.position.set(x, y, z);
          group.rotation.y = rotY;
          
          const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat);
          group.add(frame);
          
          const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.03), glassMat);
          glass.position.z = 0.01;
          group.add(glass);
          parent.add(group);
        }

        function add3DDoor(parent, w, h, x, y, z, rotY = 0) {
          const group = new THREE.Group();
          group.position.set(x, y, z);
          group.rotation.y = rotY;
          
          const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), new THREE.MeshStandardMaterial({ color: 0x27190b, roughness: 0.8 }));
          group.add(frame);

          const panelCanvas = document.createElement('canvas');
          panelCanvas.width = 64; panelCanvas.height = 128;
          const pCtx = panelCanvas.getContext('2d');
          pCtx.fillStyle = '#563513'; pCtx.fillRect(0,0,64,128);
          pCtx.strokeStyle = 'rgba(0,0,0,0.3)'; pCtx.strokeRect(6, 6, 52, 54); pCtx.strokeRect(6, 66, 52, 54);
          const doorMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(panelCanvas), roughness: 0.7 });
          const panel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, h - 0.04, 0.04), doorMat);
          panel.position.z = 0.015;
          group.add(panel);

          const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 }));
          handle.position.set(w/2 - 0.08, 0, 0.05);
          group.add(handle);
          parent.add(group);
        }

        // Add 3D elements on the walls
        // Wood cladding facade panel behind front door
        const woodPanelGeo = new THREE.BoxGeometry(0.8, 2.2, 0.02);
        const woodPanel = new THREE.Mesh(woodPanelGeo, woodMat);
        woodPanel.position.set(0.0, 0.0, 1.702); // sits on front face Z = 1.7
        woodPanel.castShadow = true;
        woodPanel.receiveShadow = true;
        wallsMesh.add(woodPanel);

        // Main Wing front facing windows and door (Z = 1.7)
        add3DDoor(wallsMesh, 0.7, 1.4, 0, -0.4, 1.715);
        add3DWindow(wallsMesh, 0.6, 0.8, -0.7, -0.4, 1.71);
        add3DWindow(wallsMesh, 0.6, 0.8, -0.7, 0.45, 1.71);
        add3DWindow(wallsMesh, 0.6, 0.8, 0.7, 0.45, 1.71);

        // Main Wing back facing windows (Z = -1.7)
        add3DWindow(wallsMesh, 0.6, 0.8, -0.7, 0.45, -1.71, Math.PI);
        add3DWindow(wallsMesh, 0.6, 0.8, 0.7, 0.45, -1.71, Math.PI);
        add3DWindow(wallsMesh, 0.6, 0.8, -0.7, -0.4, -1.71, Math.PI);

        // Concrete chimney on roof
        const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.9 });
        chimney = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), chimneyMat);
        chimney.position.set(0, 1.1, -1.0);
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        mainRoof.add(chimney);

        // Solar panels on left slope
        const slopeAngle = Math.atan(0.9 / 1.2);
        const panelWidth = 0.8;
        const panelLength = 1.2;
        const solarPanelGeo = new THREE.BoxGeometry(panelWidth, 0.02, panelLength);
        const solarFrameGeo = new THREE.BoxGeometry(panelWidth + 0.04, 0.03, panelLength + 0.04);
        const solarMat = new THREE.MeshStandardMaterial({ color: 0x0a1128, roughness: 0.1, metalness: 0.9 });
        const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });

        solarPanels = new THREE.Group();
        mainRoof.add(solarPanels);

        function createSolarPanel(zOffset) {
          const group = new THREE.Group();
          const localX = -0.6;
          const localY = 0.45;
          group.position.set(localX - 0.025 * Math.sin(slopeAngle), localY + 0.025 * Math.cos(slopeAngle), zOffset);
          group.rotation.z = -slopeAngle;

          const frame = new THREE.Mesh(solarFrameGeo, solarFrameMat);
          frame.castShadow = true;
          group.add(frame);

          const cells = new THREE.Mesh(solarPanelGeo, solarMat);
          cells.position.y = 0.01;
          group.add(cells);

          solarPanels.add(group);
        }
        createSolarPanel(-0.6);
        createSolarPanel(0.6);

        // Skylight windows on right slope
        const skylightFrameGeo = new THREE.BoxGeometry(0.74, 0.03, 1.04);
        const skylightGlassGeo = new THREE.BoxGeometry(0.66, 0.01, 0.96);

        function createSkylight(zOffset) {
          const group = new THREE.Group();
          const localX = 0.6;
          const localY = 0.45;
          group.position.set(localX + 0.025 * Math.sin(slopeAngle), localY + 0.025 * Math.cos(slopeAngle), zOffset);
          group.rotation.z = slopeAngle;

          const frame = new THREE.Mesh(skylightFrameGeo, frameMat);
          frame.castShadow = true;
          group.add(frame);

          const glass = new THREE.Mesh(skylightGlassGeo, glassMat);
          glass.position.y = 0.01;
          group.add(glass);

          mainRoof.add(group);
        }
        createSkylight(-0.6);
        createSkylight(0.6);

        // Garage door front facing (Z = 1.2)
        const garageDoorCanvas = document.createElement('canvas');
        garageDoorCanvas.width = 128; garageDoorCanvas.height = 128;
        const gdCtx = garageDoorCanvas.getContext('2d');
        gdCtx.fillStyle = '#dfdfdf'; gdCtx.fillRect(0,0,128,128);
        gdCtx.strokeStyle = '#7c7c7c'; gdCtx.lineWidth = 3;
        for (let y = 16; y < 128; y += 16) gdCtx.strokeRect(0, y, 128, 1);
        const gdMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(garageDoorCanvas), roughness: 0.6 });
        const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.03), gdMat);
        garageDoor.position.set(0, -0.2, 1.21);
        garageMesh.add(garageDoor);

        // 3. Pool Group (aligned with compare_garden.png pool footprint)
        const poolGroup = new THREE.Group();
        poolGroup.position.set(-1.8, 0.01, 0.5);
        buildingGroup.add(poolGroup);

        const deckMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.02, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x9c9c9c, roughness: 0.9 })
        );
        deckMesh.position.y = -0.005;
        poolGroup.add(deckMesh);

        // Water ripples mesh
        const waterGeo = new THREE.PlaneGeometry(2.1, 1.1, 8, 8);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          roughness: 0.12,
          metalness: 0.88,
          transparent: true,
          opacity: 0.8
        });
        waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = 0.002;
        poolGroup.add(waterMesh);

        // 4. Garden Trees (Foliage aligned with forest in the photo)
        const treeGroup = new THREE.Group();
        buildingGroup.add(treeGroup);

        function createGardenTree(x, z, h = 1.3) {
          const tree = new THREE.Group();
          tree.position.set(x, getTerrainHeight(x, z), z);

          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, h),
            new THREE.MeshStandardMaterial({ color: 0x4a321a, roughness: 0.9 })
          );
          trunk.position.y = h/2;
          trunk.castShadow = true;
          tree.add(trunk);

          const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d632a, roughness: 0.9 });
          
          const f1Geo = new THREE.SphereGeometry(0.65, 8, 8);
          applyOrganicDistortion(f1Geo, 0.05);
          const f1 = new THREE.Mesh(f1Geo, leafMat);
          f1.position.y = h + 0.3;
          f1.castShadow = true;
          tree.add(f1);

          const f2Geo = new THREE.SphereGeometry(0.48, 6, 6);
          applyOrganicDistortion(f2Geo, 0.04);
          const f2 = new THREE.Mesh(f2Geo, leafMat);
          f2.position.set(-0.2, h + 0.6, 0.1);
          f2.castShadow = true;
          tree.add(f2);

          treeGroup.add(tree);
        }
        
        // Place trees around the property borders as shown in the aerial picture
        createGardenTree(-3.5, -3.2, 1.4);
        createGardenTree(3.5, -3.0, 1.4);
        createGardenTree(-3.8, 1.5, 1.2);
        createGardenTree(3.8, 1.8, 1.2);
        createGardenTree(-2.5, 3.5, 1.1);
        createGardenTree(2.5, 3.8, 1.1);

        // 5. Boundary Fences
        const fenceGroup = new THREE.Group();
        buildingGroup.add(fenceGroup);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x3a230f, roughness: 0.9 });
        for (let f = 0; f < 8; f++) {
          const postX = -4.4 + f * 1.25;
          const postZ = -4.5;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), postMat);
          post.position.set(postX, getTerrainHeight(postX, postZ) + 0.35, postZ);
          post.castShadow = true;
          fenceGroup.add(post);
        }

        // 6. Ground Control Points (GCPs) - Photogrammetric Targets
        const gcpGroup = new THREE.Group();
        buildingGroup.add(gcpGroup);
        const gcpMat = new THREE.MeshBasicMaterial({ map: createGcpTexture(), side: THREE.DoubleSide });
        
        function addGcpTarget(x, z) {
          const y = getTerrainHeight(x, z) + 0.01;
          const gcp = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), gcpMat);
          gcp.position.set(x, y, z);
          gcp.rotation.x = -Math.PI / 2;
          gcpGroup.add(gcp);
        }
        addGcpTarget(4.0, 4.0);
        addGcpTarget(-4.0, -4.0);
        addGcpTarget(-4.0, 4.0);

        // Blinking Red GCP signal Beacon
        const beaconGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
        beacon = new THREE.Mesh(beaconGeo, beaconMat);
        const beaconY = getTerrainHeight(4.0, 4.0) + 1.8;
        beacon.position.set(4.0, beaconY, 4.0);
        scene3d.add(beacon);

        const beaconLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(4.0, getTerrainHeight(4.0, 4.0), 4.0),
          new THREE.Vector3(4.0, beaconY, 4.0)
        ]);
        const beaconLine = new THREE.Line(
          beaconLineGeo,
          new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35 })
        );
        scene3d.add(beaconLine);

        // 7. Drone Flight Path Telemetry Spline
        const droneRadius = 4.8;
        const numCameras = 12;
        const pathPoints = [];
        const cameraGroup = new THREE.Group();
        scene3d.add(cameraGroup);

        for (let i = 0; i < numCameras; i++) {
          const angle = (i / numCameras) * Math.PI * 2;
          const cx = Math.cos(angle) * droneRadius + 0.2;
          const cz = Math.sin(angle) * droneRadius - 0.6;
          const cy = 5.2 + Math.sin(angle * 3.5) * 0.4;
          
          const pt = new THREE.Vector3(cx, cy, cz);
          pathPoints.push(pt);

          // Capture pyarmids
          const pyrGeo = new THREE.ConeGeometry(0.14, 0.22, 4);
          pyrGeo.rotateX(Math.PI / 2);
          const pyrMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, wireframe: true, transparent: true, opacity: 0.6 });
          const pyr = new THREE.Mesh(pyrGeo, pyrMat);
          pyr.position.copy(pt);
          pyr.lookAt(new THREE.Vector3(0.2, 1.0, -0.6));
          cameraGroup.add(pyr);

          // Rays
          const rayGeo = new THREE.BufferGeometry().setFromPoints([
            pt,
            new THREE.Vector3(0.2 + (Math.random() - 0.5) * 0.6, 1.0 + (Math.random() - 0.5) * 0.6, -0.6 + (Math.random() - 0.5) * 0.6)
          ]);
          const rayLine = new THREE.Line(
            rayGeo,
            new THREE.LineDashedMaterial({ color: 0x0ea5e9, dashSize: 0.08, gapSize: 0.12, transparent: true, opacity: 0.18 })
          );
          rayLine.computeLineDistances();
          cameraGroup.add(rayLine);
        }
        pathPoints.push(pathPoints[0].clone());

        const flightPathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const flightPathMat = new THREE.LineDashedMaterial({
          color: 0xcff245,
          dashSize: 0.2,
          gapSize: 0.1,
          transparent: true,
          opacity: 0.5
        });
        const flightPathLine = new THREE.Line(flightPathGeo, flightPathMat);
        flightPathLine.computeLineDistances();
        scene3d.add(flightPathLine);

        // 8. Quadcopter Drone
        const droneGroup = new THREE.Group();
        const armMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.24), new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.3, roughness: 0.3 }));
        droneGroup.add(dBody);

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI / 2) + Math.PI / 4;
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28), armMat);
          arm.rotateX(Math.PI / 2);
          arm.position.set(Math.cos(angle) * 0.15, 0, Math.sin(angle) * 0.15);
          arm.rotation.y = -angle;
          droneGroup.add(arm);

          const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.05), armMat);
          motor.position.set(Math.cos(angle) * 0.24, 0.015, Math.sin(angle) * 0.24);
          droneGroup.add(motor);

          const rotor = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.003, 8),
            new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.45 })
          );
          rotor.position.set(Math.cos(angle) * 0.24, 0.04, Math.sin(angle) * 0.24);
          rotor.name = 'rotor_' + i;
          droneGroup.add(rotor);
        }
        
        const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        gimbal.position.y = -0.06;
        droneGroup.add(gimbal);

        scene3d.add(droneGroup);

        // 9. Update world matrices once before applying World UVs
        scene3d.updateMatrixWorld(true);

        // Apply Top-Down Texture projection mapping using World coordinates
        function applyWorldUVs(mesh, minX, maxX, minZ, maxZ) {
          const geo = mesh.geometry;
          const pos = geo.attributes.position;
          if (!pos) return;
          const uvs = new Float32Array(pos.count * 2);
          const rangeX = maxX - minX;
          const rangeZ = maxZ - minZ;
          const tempV = new THREE.Vector3();
          
          for (let i = 0; i < pos.count; i++) {
            tempV.set(pos.getX(i), pos.getY(i), pos.getZ(i));
            // Multiply local position by matrixWorld to get world position
            tempV.applyMatrix4(mesh.matrixWorld);
            
            const u = (tempV.x - minX) / rangeX;
            // v=0 is minimum Z (top of image), v=1 is maximum Z (bottom of image)
            const v = 1.0 - (tempV.z - minZ) / rangeZ;
            uvs[i * 2] = u;
            uvs[i * 2 + 1] = v;
          }
          geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          geo.attributes.uv.needsUpdate = true;
        }

        applyWorldUVs(terrainMesh, -5, 5, -5, 5);
        applyWorldUVs(wallsMesh, -5, 5, -5, 5);
        applyWorldUVs(garageMesh, -5, 5, -5, 5);
        applyWorldUVs(connMesh, -5, 5, -5, 5);

        // 10. Generate Color-Graded Point Cloud from Photo Pixels
        const photoLookupCanvas = document.createElement('canvas');
        const plCtx = photoLookupCanvas.getContext('2d');
        const plSize = 128;
        photoLookupCanvas.width = plSize;
        photoLookupCanvas.height = plSize;
        plCtx.drawImage(imgSource, 0, 0, plSize, plSize);
        const imgData = plCtx.getImageData(0, 0, plSize, plSize).data;

        function getPhotoColor(x, z) {
          const u = Math.min(1.0, Math.max(0.0, (x + 5.0) / 10.0));
          const v = Math.min(1.0, Math.max(0.0, (z + 5.0) / 10.0));
          
          const px = Math.floor(u * (plSize - 1));
          const py = Math.floor(v * (plSize - 1));
          
          const idx = (py * plSize + px) * 4;
          return {
            r: imgData[idx] / 255,
            g: imgData[idx + 1] / 255,
            b: imgData[idx + 2] / 255
          };
        }

        function generateRealPointCloud() {
          const pointsGeometry = new THREE.BufferGeometry();
          const positions = [];
          const colors = [];

          function sampleMeshSurface(mesh, count) {
            const geo = mesh.geometry;
            const pos = geo.attributes.position;
            if (!pos) return;
            const tempV = new THREE.Vector3();

            // Sample randomly over faces (simplification for boxes and custom meshes)
            for (let i = 0; i < count; i++) {
              // Pick random vertex as base
              const vertIdx = Math.floor(Math.random() * pos.count);
              tempV.set(pos.getX(vertIdx), pos.getY(vertIdx), pos.getZ(vertIdx));
              // Slightly jitter to simulate points spacing
              tempV.x += (Math.random() - 0.5) * 0.05;
              tempV.y += (Math.random() - 0.5) * 0.05;
              tempV.z += (Math.random() - 0.5) * 0.05;
              
              tempV.applyMatrix4(mesh.matrixWorld);

              positions.push(tempV.x, tempV.y, tempV.z);
              
              // Get actual photo color
              const col = getPhotoColor(tempV.x, tempV.z);
              // Jitter color slightly for photographic look
              const r = Math.min(1.0, Math.max(0.0, col.r + (Math.random() - 0.5) * 0.05));
              const g = Math.min(1.0, Math.max(0.0, col.g + (Math.random() - 0.5) * 0.05));
              const b = Math.min(1.0, Math.max(0.0, col.b + (Math.random() - 0.5) * 0.05));
              colors.push(r, g, b);
            }
          }

          // Sample ground circle (8,000 points)
          for (let i = 0; i < 8000; i++) {
            const r = Math.random() * 4.8;
            const theta = Math.random() * Math.PI * 2;
            const px = Math.cos(theta) * r;
            const pz = Math.sin(theta) * r;
            let py = getTerrainHeight(px, pz);
            py += (Math.random() - 0.5) * 0.015;

            positions.push(px, py, pz);
            
            const col = getPhotoColor(px, pz);
            colors.push(col.r, col.g, col.b);
          }

          // Sample house wings (3,000 points)
          sampleMeshSurface(wallsMesh, 1800);
          sampleMeshSurface(garageMesh, 800);
          sampleMeshSurface(connMesh, 400);

          // Sample roofs (1,000 points)
          if (typeof mainRoof !== 'undefined') sampleMeshSurface(mainRoof, 600);
          if (typeof garageRoof !== 'undefined') sampleMeshSurface(garageRoof, 300);
          if (typeof connRoof !== 'undefined') sampleMeshSurface(connRoof, 100);

          // Sample chimney (100 points)
          if (typeof chimney !== 'undefined') sampleMeshSurface(chimney, 100);

          // Sample solar panels (100 points)
          if (typeof solarPanels !== 'undefined') {
            solarPanels.traverse(child => {
              if (child.isMesh) {
                sampleMeshSurface(child, 40);
              }
            });
          }

          // Sample pergola (200 points)
          if (typeof pergolaGroup !== 'undefined') {
            pergolaGroup.traverse(child => {
              if (child.isMesh) {
                sampleMeshSurface(child, 20);
              }
            });
          }

          // Sample trees (1,500 points)
          treeGroup.traverse(child => {
            if (child.isMesh) {
              sampleMeshSurface(child, 200);
            }
          });

          // Sample pool collar and water (1,000 points)
          sampleMeshSurface(deckMesh, 400);
          sampleMeshSurface(waterMesh, 600);

          pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

          return pointsGeometry;
        }

        const pointsGeometry = generateRealPointCloud();
        const pointsMaterial = new THREE.PointsMaterial({
          size: 0.05,
          vertexColors: true,
          transparent: true,
          opacity: 0.85
        });
        pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
        scene3d.add(pointCloud);
        pointCloud.visible = false;

        const loaderHUD = document.getElementById('model3d-loading');
        if (loaderHUD) {
          loaderHUD.style.opacity = '0';
          setTimeout(() => loaderHUD.classList.add('hidden'), 300);
        }

        let lastBeaconTime = 0;
        let droneTime = 0;

        function animate3D(time) {
          animationFrameId = requestAnimationFrame(animate3D);

          if (time - lastBeaconTime > 600) {
            beacon.visible = !beacon.visible;
            lastBeaconTime = time;
          }

          droneGroup.traverse(child => {
            if (child.name && child.name.startsWith('rotor_')) {
              child.rotation.y += 0.45;
            }
          });

          droneTime = (droneTime + 0.0006) % 1.0;
          const segmentFloat = droneTime * numCameras;
          const segmentIdx = Math.floor(segmentFloat);
          const nextSegmentIdx = (segmentIdx + 1) % numCameras;
          const t = segmentFloat - segmentIdx;
          
          const p1 = pathPoints[segmentIdx];
          const p2 = pathPoints[nextSegmentIdx];
          
          droneGroup.position.lerpVectors(p1, p2, t);
          
          const targetLook = new THREE.Vector3(0.2, 1.0, -0.6);
          droneGroup.lookAt(targetLook);
          droneGroup.rotateX(0.05);

          if (controls3d && controls3d.state === -1) {
            buildingGroup.rotation.y += 0.0018;
            if (pointCloud) pointCloud.rotation.y += 0.0018;
          }

          if (waterMesh) {
            const waterPos = waterMesh.geometry.attributes.position;
            const wTime = Date.now() * 0.0022;
            for (let i = 0; i < waterPos.count; i++) {
              const wx = waterPos.getX(i);
              const wy = waterPos.getY(i);
              const wz = Math.sin(wx * 8 + wTime) * Math.cos(wy * 8 + wTime) * 0.012;
              waterPos.setZ(i, wz);
            }
            waterPos.needsUpdate = true;
          }

          if (controls3d) controls3d.update();
          if (renderer3d) renderer3d.render(scene3d, camera3d);
        }

        animate3D(0);
        is3DInitialized = true;
      }

      // Load the actual site photography
      img.src = "images/photos/compare_garden.png";
    }

    function resize3D() {
      const container = document.getElementById('canvas3d-container');
      if (container && renderer3d && camera3d) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera3d.aspect = width / height;
        camera3d.updateProjectionMatrix();
        renderer3d.setSize(width, height);
      }
    }

    function setModelViewMode(mode) {
      currentViewMode = mode;
      
      document.querySelectorAll('.render-btn').forEach(btn => {
        btn.classList.remove('border-[#cff245]/80', 'bg-[#cff245]/5', 'text-[#cff245]');
        btn.classList.add('border-white/5', 'bg-white/[0.01]', 'text-gray-400');
      });

      const activeBtn = document.getElementById(`btn-mode-${mode}`);
      if (activeBtn) {
        activeBtn.classList.remove('border-white/5', 'bg-white/[0.01]', 'text-gray-400');
        activeBtn.classList.add('border-[#cff245]/80', 'bg-[#cff245]/5', 'text-[#cff245]');
      }

      if (buildingGroup && pointCloud) {
        if (mode === 'textured') {
          buildingGroup.visible = true;
          pointCloud.visible = false;
          buildingGroup.traverse(child => {
            if (child.isMesh && child.name !== 'ground') {
              child.material.wireframe = false;
            }
          });
        } else if (mode === 'wireframe') {
          buildingGroup.visible = true;
          pointCloud.visible = true;
          buildingGroup.traverse(child => {
            if (child.isMesh && child.name !== 'ground') {
              child.material.wireframe = true;
            }
          });
        }
      }
    }

    window.addEventListener('resize', resize3D);

    if (model3DModal) {
      model3DModal.addEventListener('click', e => {
        if (e.target === model3DModal) closeModel3DModal();
      });
    }

