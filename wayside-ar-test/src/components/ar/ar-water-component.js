// Simplified water simulation component for A-Frame
AFRAME.registerComponent('ar-water-simulation', {
  // Add method for external cleanup
  remove: function() {
    console.log("Water component being removed");
    
    // Clean up all resources
    if (this.waterMesh) {
      // Remove mesh from parent
      if (this.markerObject) {
        this.markerObject.remove(this.waterMesh);
      }
      
      // Dispose of geometries and materials
      if (this.waterMesh.geometry) {
        this.waterMesh.geometry.dispose();
      }
      
      if (this.waterMesh.material) {
        if (Array.isArray(this.waterMesh.material)) {
          this.waterMesh.material.forEach(m => m.dispose());
        } else {
          this.waterMesh.material.dispose();
        }
      }
      
      this.waterMesh = null;
    }
    
    // Clean up caustic plane if it exists
    if (this.causticPlane) {
      if (this.markerObject) {
        this.markerObject.remove(this.causticPlane);
      }
      
      if (this.causticPlane.geometry) {
        this.causticPlane.geometry.dispose();
      }
      
      if (this.causticPlane.material) {
        this.causticPlane.material.dispose();
      }
      
      this.causticPlane = null;
    }
    
    // Clean up second caustic plane
    if (this.causticPlane2) {
      if (this.markerObject) {
        this.markerObject.remove(this.causticPlane2);
      }
      
      if (this.causticPlane2.geometry) {
        this.causticPlane2.geometry.dispose();
      }
      
      if (this.causticPlane2.material) {
        this.causticPlane2.material.dispose();
      }
      
      this.causticPlane2 = null;
    }
    
    // Clean up abyss plane
    if (this.abyssPlane) {
      if (this.markerObject) {
        this.markerObject.remove(this.abyssPlane);
      }
      
      if (this.abyssPlane.geometry) {
        this.abyssPlane.geometry.dispose();
      }
      
      if (this.abyssPlane.material) {
        this.abyssPlane.material.dispose();
      }
      
      this.abyssPlane = null;
    }
    
    // Restore original fog if needed
    if (this.el.sceneEl && this.el.sceneEl.object3D && this.originalFog !== undefined) {
      this.el.sceneEl.object3D.fog = this.originalFog;
    }
    
    // Clean up caustic textures
    if (this.causticTextures && this.causticTextures.length) {
      this.causticTextures.forEach(texture => {
        if (texture) texture.dispose();
      });
      this.causticTextures = [];
    }
    
    console.log("Water component removed and cleaned up");
  },
  schema: {
    maxWaterRise: {type: 'number', default: 10},
    startYear: {type: 'number', default: 2030},
    endYear: {type: 'number', default: 2100}
  },
  
  init: function() {
    console.log("Initializing AR Water Simulation component");
    
    // Store state variables
    this.waterLevel = 0;
    this.targetWaterLevel = 0;
    this.markerVisible = false;
    
    // Get reference to marker's Three.js object
    this.markerObject = this.el.object3D;
    
    // IMPORTANT: Add components in proper order
    
    // First add lighting to scene
    this.addLighting();
    
    // Initialize water plane (no measurement column)
    this.addSimpleWaterPlane();
    
    // Set up marker detection events
    this.el.addEventListener('markerFound', this.onMarkerFound.bind(this));
    this.el.addEventListener('markerLost', this.onMarkerLost.bind(this));
    
    // Set up slider event
    document.getElementById('water-level-slider').addEventListener('input', (e) => {
      const sliderValue = parseInt(e.target.value);
      this.targetWaterLevel = (sliderValue / 100) * this.data.maxWaterRise;
      
      // Update year display
      const currentYear = Math.floor(this.data.startYear + 
                                     (sliderValue / 100) * 
                                     (this.data.endYear - this.data.startYear));
      document.getElementById('year-display').innerText = `Year: ${currentYear}`;
    });
    
    console.log("AR Water component initialized - NO measurement column");
  },
  
  
  // Add a large water plane with caustics
  addSimpleWaterPlane: function() {
    console.log("Creating water plane with caustics");
    
    // Create a huge water plane
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    // Create a reference to this component
    const self = this;
    
    // Caustic texture URLs from the caustics example
    const causticUrls = [
      'https://res.cloudinary.com/djz8b4fhb/image/upload/v1743730963/qf7jbexawjm561gbrnur.bmp',
      'https://res.cloudinary.com/djz8b4fhb/image/upload/v1743730963/uafyuzgxuqfdslrbnqpm.bmp',
      'https://res.cloudinary.com/djz8b4fhb/image/upload/v1743730963/yslsrdo3jqqfn8xjfyii.bmp',
      'https://res.cloudinary.com/djz8b4fhb/image/upload/v1743730963/djxasdkslrqcybelyrom.bmp',
      'https://res.cloudinary.com/djz8b4fhb/image/upload/v1743730963/ywqy9urvrryjwk32evgv.bmp'
    ];
    
    // Initialize arrays and loaders
    this.causticTextures = [];
    const textureLoader = new THREE.TextureLoader();
    
    // Force create a basic material first for immediate display
    const basicMaterial = new THREE.MeshStandardMaterial({
      color: 0x001e0f,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    this.waterMesh = new THREE.Mesh(waterGeometry, basicMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0;
    
    // Add to marker object immediately
    this.markerObject.add(this.waterMesh);
    console.log("Basic water added for immediate display");
    
    // Load caustic textures
    let texturesLoaded = 0;
    causticUrls.forEach((url, index) => {
      const texture = textureLoader.load(
        url,
        // On load callback
        () => {
          texturesLoaded++;
          console.log(`Loaded caustic texture ${texturesLoaded} of ${causticUrls.length}`);
          
          // Make the texture repeat/tile
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(-4, 4);
          
          self.causticTextures[index] = texture;
          
          // When all textures are loaded, create the caustic plane
          if (texturesLoaded === causticUrls.length) {
            self.createCausticPlane();
          }
        }
      );
    });
    
    // Try to use the advanced Water shader
    try {
      if (typeof THREE.Water !== 'undefined') {
        // Load water texture
        textureLoader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
          function(waterNormals) {
            // Remove the basic mesh
            self.markerObject.remove(self.waterMesh);
            
            waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
            
            // Create advanced water
            self.waterMesh = new THREE.Water(
              waterGeometry,
              {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: waterNormals,
                alpha: 1.0,
                sunDirection: new THREE.Vector3(0, 1, 0).normalize(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: false
              }
            );
            
            // Position the water - farther back
            self.waterMesh.rotation.x = -Math.PI / 2; // Make horizontal
            self.waterMesh.position.y = 0;
            
            // Add to marker object
            self.markerObject.add(self.waterMesh);
            console.log("Advanced water added and replaced basic water");
            
            // Start animation immediately
            if (self.waterMesh.material && self.waterMesh.material.uniforms && 
                self.waterMesh.material.uniforms['time']) {
              self.waterMesh.material.uniforms['time'].value = 1.0;
            }
          }
        );
      } else {
        console.log("THREE.Water not available, keeping basic water");
      }
    } catch (e) {
      console.error("Error creating advanced water:", e);
    }
  },
  
  // Create the caustic projection plane for infinite abyss effect
  createCausticPlane: function() {
    // Create a HUGE caustic plane for the abyss effect
    const causticPlaneGeometry = new THREE.PlaneGeometry(50000, 50000);
    const causticMaterial = new THREE.MeshBasicMaterial({
      map: this.causticTextures[0],
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.7, // More visible opacity
      color: 0xffffff // Use white to preserve texture colors
    });

    this.causticPlane = new THREE.Mesh(causticPlaneGeometry, causticMaterial);
    
    // Angle the plane to create infinite abyss perspective
    this.causticPlane.rotation.x = Math.PI/8;
    
    // Position it to fill the view below water
    this.causticPlane.position.set(0, -30, -100);
    this.markerObject.add(this.causticPlane);
    
    // Create a second caustic plane for layering effect
    const causticMaterial2 = new THREE.MeshBasicMaterial({
      map: this.causticTextures[1],
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
      color: 0xaaffff // Slightly blue tint
    });
    
    this.causticPlane2 = new THREE.Mesh(causticPlaneGeometry.clone(), causticMaterial2);
    this.causticPlane2.rotation.x = Math.PI/6; // Different angle
    this.causticPlane2.position.set(0, -50, -150);
    this.markerObject.add(this.causticPlane2);
    
    // Create a dark plane below for the abyss effect
    const abyssGeometry = new THREE.PlaneGeometry(100000, 100000);
    const abyssMaterial = new THREE.MeshBasicMaterial({
      color: 0x000005, // Very dark blue-black
      transparent: false,
      side: THREE.DoubleSide
    });
    
    this.abyssPlane = new THREE.Mesh(abyssGeometry, abyssMaterial);
    this.abyssPlane.rotation.x = Math.PI/2; // Flat
    this.abyssPlane.position.y = -200;
    this.markerObject.add(this.abyssPlane);
    
    // Add a fog effect to the scene for depth
    if (this.el.sceneEl && this.el.sceneEl.object3D) {
      this.originalFog = this.el.sceneEl.object3D.fog;
      this.el.sceneEl.object3D.fog = new THREE.FogExp2(0x000005, 0.002);
    }
    
    console.log('Caustic infinite abyss effect created');
    
    // Initialize animation variables
    this.causticTime = 0;
    this.currentCausticIndex = 0;
    this.frameCount = 0;
  },
  
  // Add lighting only - no measurement column
  addLighting: function() {
    // Add stronger lighting only
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 5, 2);
    this.markerObject.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x606060, 1.2);
    this.markerObject.add(ambientLight);
    
    console.log("Added scene lighting only");
  },
  
  onMarkerFound: function() {
    console.log("Water component activated!");
    this.markerVisible = true;
    
    // Show water controls
    document.getElementById('control-panel').style.display = 'block';
  },
  
  onMarkerLost: function() {
    console.log("Water component marker reference lost!");
    // We no longer hide controls or change visibility
    // The component stays active until dismissed by click/swipe
  },
  
  tick: function(time, deltaTime) {
    // Always update even if marker is not visible
    const now = time * 0.001; // Convert to seconds
    
    // Log animation status periodically (less frequently)
    if (time % 5000 < 16) {
      console.log("Water animation tick:", now);
      if (this.waterMesh && this.waterMesh.material) {
        if (this.waterMesh.material.uniforms) {
          console.log("Water has uniforms");
        } else {
          console.log("Basic water material active");
        }
      }
    }
    
    // If we have the water mesh
    if (this.waterMesh) {
      // Update water position based on slider
      this.waterLevel += (this.targetWaterLevel - this.waterLevel) * 0.05;
      this.waterMesh.position.y = this.waterLevel;
      
      // Handle water animation depending on water type
      if (this.waterMesh.material && !this.waterMesh.material.uniforms) {
        // For standard material - update color based on depth
        const depthFactor = this.waterLevel / this.data.maxWaterRise;
        const waterColor = new THREE.Color(
          0.0, 
          Math.max(0.05, 0.11 - depthFactor * 0.08), 
          Math.max(0.05, 0.15 - depthFactor * 0.1)
        );
        
        this.waterMesh.material.color = waterColor;
      } 
      else if (this.waterMesh.material && this.waterMesh.material.uniforms) {
        // For the advanced Water shader - actively update time to ensure animation
        if (this.waterMesh.material.uniforms['time']) {
          // Ensure we're constantly incrementing time for wave animation
          // Use clock-like animation based on current time
          this.waterMesh.material.uniforms['time'].value = now;
        }
        
        if (this.waterMesh.material.uniforms['waterColor']) {
          const depthFactor = this.waterLevel / this.data.maxWaterRise;
          const waterColor = new THREE.Color(
            0.0, 
            Math.max(0.05, 0.11 - depthFactor * 0.08), 
            Math.max(0.05, 0.15 - depthFactor * 0.1)
          );
          this.waterMesh.material.uniforms['waterColor'].value = waterColor;
        }
      }
    }
    
    // Update caustic animation if available - Infinite Abyss Effect
    if (this.causticPlane && this.causticTextures && this.causticTextures.length > 0) {
      // Update caustic time
      this.causticTime += 0.01;
      
      // Calculate water depth factor
      const waterDepth = this.waterLevel;
      
      // Calculate speed based on depth - moves faster as water gets deeper
      const speed = 0.3 + (waterDepth * 0.02);
      
      // Calculate direction for caustics movement - radial outward pattern
      const moveX = Math.cos(this.causticTime) * speed;
      const moveY = Math.sin(this.causticTime) * speed;
      
      // Apply movement to first caustic plane's texture
      if (this.causticPlane.material && this.causticPlane.material.map) {
        this.causticPlane.material.map.offset.x = moveX;
        this.causticPlane.material.map.offset.y = moveY;
      }
      
      // Apply opposite movement to second caustic plane for parallax effect
      if (this.causticPlane2 && this.causticPlane2.material && this.causticPlane2.material.map) {
        this.causticPlane2.material.map.offset.x = -moveX * 0.7;
        this.causticPlane2.material.map.offset.y = moveY * 0.7;
      }
      
      // Make caustics more intense with water depth
      if (this.causticPlane.material) {
        this.causticPlane.material.opacity = Math.min(0.9, 0.4 + (waterDepth * 0.05));
      }
      
      if (this.causticPlane2 && this.causticPlane2.material) {
        this.causticPlane2.material.opacity = Math.min(0.7, 0.3 + (waterDepth * 0.03));
      }
      
      // Cycle through available textures to create animation
      this.frameCount++;
      if (this.frameCount % 8 === 0) {
        // Get next texture index in sequence (or first if we reached the end)
        this.currentCausticIndex = (this.currentCausticIndex + 1) % this.causticTextures.length;
        
        // Update main caustic plane texture
        if (this.causticPlane && this.causticPlane.material) {
          this.causticPlane.material.map = this.causticTextures[this.currentCausticIndex];
          this.causticPlane.material.needsUpdate = true;
        }
        
        // Update second caustic plane with different texture for more variation
        if (this.causticPlane2 && this.causticPlane2.material) {
          const secondIndex = (this.currentCausticIndex + 2) % this.causticTextures.length;
          this.causticPlane2.material.map = this.causticTextures[secondIndex];
          this.causticPlane2.material.needsUpdate = true;
        }
      }
      
      // Adjust fog density based on water level for abyss effect
      if (this.el.sceneEl && this.el.sceneEl.object3D && this.el.sceneEl.object3D.fog) {
        // Increase fog density with water depth for more dramatic abyss feel
        const baseDensity = 0.002;
        const maxDensity = 0.01;
        const fogDensity = Math.min(maxDensity, baseDensity + (waterDepth * 0.0005));
        this.el.sceneEl.object3D.fog.density = fogDensity;
      }
    }
  }
});