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
    
    // Clean up all caustic planes
    const planes = [this.causticPlane, this.causticPlane2, this.causticPlane3, this.abyssPlane];
    
    planes.forEach(plane => {
      if (plane) {
        if (this.markerObject) {
          this.markerObject.remove(plane);
        }
        
        if (plane.geometry) {
          plane.geometry.dispose();
        }
        
        if (plane.material) {
          plane.material.dispose();
        }
      }
    });
    
    this.causticPlane = null;
    this.causticPlane2 = null;
    this.causticPlane3 = null;
    this.abyssPlane = null;
    
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
    console.log("Creating FIXED caustic effect");
    
    // Create multiple caustic planes
    for (let i = 0; i < 3; i++) {
      // Create a caustic plane that will always be visible
      const planeSize = 20000 + (i * 15000); // Varying sizes
      const causticPlaneGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
      
      // Create material with high brightness
      const causticMaterial = new THREE.MeshBasicMaterial({
        map: this.causticTextures[i % this.causticTextures.length],
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8 - (i * 0.15), // Varying opacity
        color: 0xffffff // White to preserve texture colors
      });
      
      // Create the mesh
      const plane = new THREE.Mesh(causticPlaneGeometry, causticMaterial);
      
      // Position in a way that's always visible regardless of water level
      // Use flat rotation so it's always facing the camera
      plane.rotation.x = -Math.PI / 2;
      
      // Fixed Y position much lower than the water
      const yPos = -50 - (i * 30);
      plane.position.set(0, yPos, 0);
      
      // Store references
      if (i === 0) {
        this.causticPlane = plane;
      } else if (i === 1) {
        this.causticPlane2 = plane;
      } else {
        this.causticPlane3 = plane;
      }
      
      // Add to the scene
      this.markerObject.add(plane);
      console.log(`Added caustic plane ${i} at y=${yPos}`);
    }
    
    // Create a dark plane below for the abyss effect
    const abyssGeometry = new THREE.PlaneGeometry(100000, 100000);
    const abyssMaterial = new THREE.MeshBasicMaterial({
      color: 0x000005, // Very dark blue-black
      transparent: false,
      side: THREE.DoubleSide
    });
    
    this.abyssPlane = new THREE.Mesh(abyssGeometry, abyssMaterial);
    this.abyssPlane.rotation.x = -Math.PI / 2; // Same as caustics
    this.abyssPlane.position.y = -200;
    this.markerObject.add(this.abyssPlane);
    
    // Initialize animation variables
    this.causticTime = 0;
    this.currentCausticIndex = 0;
    this.frameCount = 0;
    
    console.log('Caustic planes created with fixed positioning');
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
    
    // Constantly update caustic animation - FIXED version
    if (this.causticTextures && this.causticTextures.length > 0) {
      // Update caustic time
      this.causticTime += 0.01;
      
      // Cycle through available textures to create animation
      this.frameCount++;

      // Always animate at consistent rate (every 6 frames)
      if (this.frameCount % 6 === 0) {
        // Get next texture index in sequence
        this.currentCausticIndex = (this.currentCausticIndex + 1) % this.causticTextures.length;
        
        // Update texture on all caustic planes with different ones
        for (let i = 0; i < 3; i++) {
          const plane = i === 0 ? this.causticPlane : 
                       (i === 1 ? this.causticPlane2 : this.causticPlane3);
                       
          if (plane && plane.material && plane.material.map) {
            const texIndex = (this.currentCausticIndex + i) % this.causticTextures.length;
            plane.material.map = this.causticTextures[texIndex];
            plane.material.needsUpdate = true;
            
            // Fixed animation patterns - each layer has different speed and direction
            const baseSpeed = 0.5; // Faster base speed
            const layerMod = 0.3 - (i * 0.1); // Different speeds per layer
            
            // Radial outward movement pattern
            if (i === 0) {
              // First plane: clockwise
              plane.material.map.offset.x = Math.cos(this.causticTime * baseSpeed) * layerMod;
              plane.material.map.offset.y = Math.sin(this.causticTime * baseSpeed) * layerMod;
            } else if (i === 1) {
              // Second plane: counter-clockwise
              plane.material.map.offset.x = Math.sin(this.causticTime * (baseSpeed * 0.8)) * layerMod;
              plane.material.map.offset.y = Math.cos(this.causticTime * (baseSpeed * 0.8)) * layerMod;
            } else {
              // Third plane: diagonal
              plane.material.map.offset.x = Math.sin(this.causticTime * (baseSpeed * 0.6)) * layerMod;
              plane.material.map.offset.y = Math.sin(this.causticTime * (baseSpeed * 0.6) + Math.PI/4) * layerMod;
            }
          }
        }
      }
      
      // Set water color based on depth
      const waterDepth = this.waterLevel;
      
      // Make all caustic planes always visible, but adjust brightness based on water level
      const planes = [this.causticPlane, this.causticPlane2, this.causticPlane3];
      planes.forEach((plane, i) => {
        if (plane && plane.material) {
          // Base opacity decreases with each layer
          const baseOpacity = 0.8 - (i * 0.15);
          
          // Increase opacity slightly with water depth
          const depthBoost = Math.min(0.2, waterDepth * 0.02);
          plane.material.opacity = baseOpacity + depthBoost;
        }
      });
            
      // Log animation state periodically
      if (this.frameCount % 100 === 0) {
        console.log(`Caustic animation active: water level=${waterDepth.toFixed(2)}, texture=${this.currentCausticIndex}`);
      }
    }
  }
});