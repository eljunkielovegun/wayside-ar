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
  
  
  // Add a large water plane based on caustics example
  addSimpleWaterPlane: function() {
    console.log("Creating water plane");
    // Create a huge water plane like in the caustics example
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    // Create a reference to this component
    const self = this;
    
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
    
    // Try to use the advanced Water shader
    try {
      if (typeof THREE.Water !== 'undefined') {
        // Load water texture
        const textureLoader = new THREE.TextureLoader();
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
    
    // Log animation status periodically
    if (time % 3000 < 16) {
      console.log("Water animation tick:", now);
      if (this.waterMesh && this.waterMesh.material) {
        if (this.waterMesh.material.uniforms) {
          console.log("Water has uniforms, time value:", 
            this.waterMesh.material.uniforms['time'] ? 
            this.waterMesh.material.uniforms['time'].value : "no time uniform");
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
  }
});