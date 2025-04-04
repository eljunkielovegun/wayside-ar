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
    
    // Restore original scene properties
    if (this.el.sceneEl) {
      // Restore fog
      if (this.el.sceneEl.object3D && this.originalFog !== undefined) {
        this.el.sceneEl.object3D.fog = this.originalFog;
      }
      
      // Restore background color if we changed it for underwater effect
      if (this.originalBackgroundColor !== null) {
        this.el.sceneEl.setAttribute('background', {color: this.originalBackgroundColor});
      }
      
      // Reset any renderer changes
      if (this.el.sceneEl.renderer) {
        this.el.sceneEl.renderer.setClearColor(0x000000, 0);
      }
    }
    
    // Clean up caustic textures
    if (this.causticTextures && this.causticTextures.length) {
      this.causticTextures.forEach(texture => {
        if (texture) texture.dispose();
      });
      this.causticTextures = [];
    }
    
    // Restore normal camera settings
    if (this.underwaterLight) {
      this.markerObject.remove(this.underwaterLight);
      this.underwaterLight = null;
    }
    
    console.log("Water component removed and cleaned up");
  },
  schema: {
    maxWaterRise: {type: 'number', default: 10},
    startYear: {type: 'number', default: 2030},
    endYear: {type: 'number', default: 2100}
  },
  
  init: function() {
    console.log("Initializing AR Water Simulation component with underwater effect");
    
    // Store state variables
    this.waterLevel = 0;
    this.targetWaterLevel = 0;
    this.markerVisible = false;
    this.isUnderwater = false;
    
    // Get reference to marker's Three.js object
    this.markerObject = this.el.object3D;
    
    // Get reference to scene for global effects
    this.scene = this.el.sceneEl.object3D;
    this.camera = this.el.sceneEl.camera;
    
    // Store original scene properties to restore later
    this.originalBackgroundColor = this.el.sceneEl.getAttribute('background') ? 
                                  this.el.sceneEl.getAttribute('background').color : 
                                  null;
    this.originalFog = this.scene.fog;
    
    // Define underwater colors
    this.underwaterColor = new THREE.Color(0x000f0f);  // Darker blue for deep water
    this.normalFogColor = new THREE.Color(0x87ceeb);   // Sky blue
    this.underwaterFogDensity = 0.012;  // Increased for better abyss feeling
    
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
    
    console.log("AR Water component initialized with underwater effects");
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
  
  // Create the caustic projection plane - DIRECT COPY FROM ORIGINAL EXAMPLE
  createCausticPlane: function() {
    console.log("Creating caustic plane following original example");
    
    // Create a HUGE caustic plane for the abyss effect - EXACTLY like in the original
    const causticPlaneGeometry = new THREE.PlaneGeometry(20000, 20000);
    const causticMaterial = new THREE.MeshBasicMaterial({
      map: this.causticTextures[0],
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.0, // Start invisible
      color: 0xffffff // Use white to preserve texture colors
    });

    // Create the main caustic plane (this is the one that will follow the camera underwater)
    this.causticPlane = new THREE.Mesh(causticPlaneGeometry, causticMaterial);
    this.causticPlane.rotation.x = -Math.PI / 2; // Start horizontal
    
    // Start with a position far below - it will be updated to follow camera
    this.causticPlane.position.y = -100;
    this.markerObject.add(this.causticPlane);
    
    // Create a dark plane below for the abyss effect
    const abyssGeometry = new THREE.PlaneGeometry(100000, 100000);
    const abyssMaterial = new THREE.MeshBasicMaterial({
      color: 0x000005, // Very dark blue-black
      transparent: false,
      side: THREE.DoubleSide
    });
    
    this.abyssPlane = new THREE.Mesh(abyssGeometry, abyssMaterial);
    this.abyssPlane.rotation.x = -Math.PI / 2;
    this.abyssPlane.position.y = -200;
    this.markerObject.add(this.abyssPlane);
    
    // Initialize animation variables
    this.causticTime = 0;
    this.currentCausticIndex = 0;
    this.frameCount = 0;
    this.groundLevel = -10; // Reference ground level
    
    console.log('Single caustic plane created (original approach)');
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
    
    // DIRECTLY COPIED FROM EXAMPLE - caustic and underwater effects
    // Check for camera position relative to water
    const cameraY = this.camera ? this.camera.position.y : 0;
    const wasUnderwater = this.isUnderwater;
    const underwaterThreshold = 2; // Units before actual water level - JUST LIKE ORIGINAL
    this.isUnderwater = this.waterLevel > (cameraY - underwaterThreshold);
    
    // Process changes to underwater state ONLY when it changes
    if (wasUnderwater !== this.isUnderwater) {
      console.log(`Underwater state changed: ${this.isUnderwater ? 'ENTERING water' : 'EXITING water'}`);
      
      if (this.isUnderwater) {
        // ENTERING UNDERWATER - COPIED FROM ORIGINAL EXACTLY
        this.scene.fog = new THREE.FogExp2(this.underwaterColor, this.underwaterFogDensity);
        
        // Force background color to match underwater
        try {
          if (this.el.sceneEl.renderer) {
            this.el.sceneEl.renderer.setClearColor(this.underwaterColor, 1);
          }
        } catch (e) {
          console.warn("Could not set renderer clear color", e);
        }
        
        // Add underwater lighting
        if (!this.underwaterLight) {
          this.underwaterLight = new THREE.AmbientLight(0x00334d, 0.8);
          this.markerObject.add(this.underwaterLight);
        } else {
          this.underwaterLight.visible = true;
        }
        
        // Dim main directional lights
        this.markerObject.traverse(obj => {
          if (obj instanceof THREE.DirectionalLight) {
            obj.originalIntensity = obj.intensity;
            obj.intensity = 0.5;
          }
        });
      } else {
        // EXITING UNDERWATER - COPIED FROM ORIGINAL EXACTLY
        this.scene.fog = null;
        
        try {
          if (this.el.sceneEl.renderer) {
            this.el.sceneEl.renderer.setClearColor(0x000000, 0); // Transparent
          }
        } catch (e) {
          console.warn("Could not reset renderer clear color", e);
        }
        
        // Disable underwater lighting
        if (this.underwaterLight) {
          this.underwaterLight.visible = false;
        }
        
        // Restore light intensities
        this.markerObject.traverse(obj => {
          if (obj instanceof THREE.DirectionalLight && obj.originalIntensity !== undefined) {
            obj.intensity = obj.originalIntensity;
          }
        });
      }
    }
    
    // Update caustic plane - ONLY WHEN UNDERWATER - JUST LIKE ORIGINAL
    if (this.causticPlane && this.causticTextures && this.causticTextures.length > 0) {
      if (this.isUnderwater) {
        // UNDERWATER CAUSTICS - EXACTLY LIKE ORIGINAL
        // Always make caustic plane visible underwater
        this.causticPlane.visible = true;
        
        // THIS IS THE KEY TO THE INFINITE ABYSS EFFECT:
        // Angle the plane and position it relative to camera
        this.causticPlane.rotation.x = Math.PI/8;
        
        // Position caustic plane relative to camera - pushed forward into view
        this.causticPlane.position.y = cameraY - 20;
        this.causticPlane.position.z = -100; // Fix Z position
        
        // Calculate water depth
        const waterDepth = this.waterLevel - this.groundLevel;
        
        // Update caustic time
        this.causticTime += 0.01;
        
        // Calculate speed based on depth - moves faster as water gets deeper
        const speed = 0.2 + (waterDepth * 0.01);
        
        // Calculate a direction that makes caustics appear to move away
        // Use sin/cos to create a radial outward movement pattern
        const moveX = Math.cos(this.causticTime) * speed;
        const moveY = Math.sin(this.causticTime) * speed;
        
        // Apply the movement to texture offset
        this.causticPlane.material.map.offset.x = moveX;
        this.causticPlane.material.map.offset.y = moveY;
        
        // Make caustics smaller with depth by increasing repeat
        const repeatScale = 4 + (waterDepth * 0.1);
        this.causticPlane.material.map.repeat.set(-repeatScale, repeatScale);
        
        // Vary opacity based on depth below surface
        const depthBelowSurface = this.waterLevel - cameraY;
        this.causticPlane.material.opacity = Math.max(0.05, 0.7 - (depthBelowSurface * 0.01));
        
        // Continuous fog updates underwater - FOR ABYSS EFFECT
        if (this.scene.fog) {
          // Make fog darker and denser with increased depth
          const maxDensity = 0.03;
          this.scene.fog.density = Math.min(maxDensity, this.underwaterFogDensity + (depthBelowSurface * 0.0002));
          
          // Darken fog color with depth for abyss effect
          const colorDarkenFactor = Math.min(0.8, depthBelowSurface * 0.01);
          this.scene.fog.color.setRGB(
            this.underwaterColor.r * (1 - colorDarkenFactor),
            this.underwaterColor.g * (1 - colorDarkenFactor),
            this.underwaterColor.b * (1 - colorDarkenFactor)
          );
        }
      } else {
        // ABOVE WATER - Hide caustics
        this.causticPlane.visible = false;
      }
      
      // Animate caustics - cycle through textures
      if (this.frameCount % 5 === 0) {
        // Change texture in reverse order (just like original)
        this.currentCausticIndex = (this.currentCausticIndex - 1);
        if (this.currentCausticIndex < 0) {
          this.currentCausticIndex = this.causticTextures.length - 1;
        }
        this.causticPlane.material.map = this.causticTextures[this.currentCausticIndex];
        this.causticPlane.material.needsUpdate = true;
      }
      
      this.frameCount++;
    }
  }
});