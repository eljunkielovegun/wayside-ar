// Simplified water simulation component for A-Frame
AFRAME.registerComponent('ar-water-simulation', {
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
    
    // Add debug visibility test box
    this.addDebugBox();
    
    // Initialize simple water plane
    this.addSimpleWaterPlane();
    
    // Add measurement column
    this.addMeasurementColumn();
    
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
  },
  
  // Add a visible debug box to confirm positioning works
  addDebugBox: function() {
    // Create a simple red box for debugging - making it tiny and mostly transparent
    const boxGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3
    });
    this.debugBox = new THREE.Mesh(boxGeom, boxMat);
    this.debugBox.position.set(0, 3, 0);
    this.markerObject.add(this.debugBox);
    console.log("Debug box added (minimized)");
  },
  
  // Add a large water plane based on caustics example
  addSimpleWaterPlane: function() {
    // Create a huge water plane like in the caustics example
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    // Load water texture if available, otherwise use a basic material
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
      (waterNormals) => {
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
        
        // Try to use the Water object from three.js if available
        if (typeof THREE.Water !== 'undefined') {
          // Using the advanced Water shader
          this.waterMesh = new THREE.Water(
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
          console.log("Advanced water added");
        } else {
          // Fallback to basic material with normal map
          const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x001e0f,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8,
            normalMap: waterNormals,
            normalScale: new THREE.Vector2(3, 3)
          });
          this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
          console.log("Basic water with normal map added");
        }
        
        // Position the water
        this.waterMesh.rotation.x = -Math.PI / 2; // Make horizontal
        this.waterMesh.position.y = 0;
        this.waterMesh.position.z = -30; // Push further back from camera
        
        // Add to marker object
        this.markerObject.add(this.waterMesh);
      },
      // Fallback if texture loading fails
      () => {
        console.log("Water texture loading failed, using basic material");
        const waterMaterial = new THREE.MeshStandardMaterial({
          color: 0x001e0f,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.8
        });
        
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = 0;
        this.waterMesh.position.z = -30; // Push further back from camera
        
        this.markerObject.add(this.waterMesh);
      }
    );
  },
  
  // Add measurement column
  addMeasurementColumn: function() {
    const columnHeight = this.data.maxWaterRise * 1.2;
    
    // Create the main column - making it more visible 
    const columnGeometry = new THREE.BoxGeometry(0.6, columnHeight, 0.6);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    
    this.column = new THREE.Mesh(columnGeometry, columnMaterial);
    this.column.position.set(0, columnHeight / 2, 0);
    this.markerObject.add(this.column);
    
    // Add stronger lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 5, 2);
    this.markerObject.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x606060, 1.2);
    this.markerObject.add(ambientLight);
    
    // Add height markings - larger and more visible
    for (let i = 0; i <= this.data.maxWaterRise; i += 1) {
      // Only create markers at whole numbers
      const isSpecial = i % 5 === 0;
      const markerWidth = isSpecial ? 1.2 : 0.8;
      const markerHeight = isSpecial ? 0.2 : 0.1;
      
      const markerGeometry = new THREE.BoxGeometry(markerWidth, markerHeight, 0.2);
      const markerMaterial = new THREE.MeshStandardMaterial({ 
        color: isSpecial ? 0xff0000 : 0x000000,
        emissive: isSpecial ? 0x330000 : 0x000000
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, i, 0.4);
      this.markerObject.add(marker);
    }
    
    console.log("Enhanced measurement column added");
  },
  
  onMarkerFound: function() {
    console.log("Water component activated!");
    this.markerVisible = true;
    
    // Show water controls
    document.getElementById('water-controls').style.display = 'block';
  },
  
  onMarkerLost: function() {
    console.log("Water component marker reference lost!");
    // We no longer hide controls or change visibility
    // The component stays active until dismissed by click/swipe
  },
  
  tick: function(time, deltaTime) {
    // Always update even if marker is not visible
    
    // If we have the water mesh
    if (this.waterMesh) {
      // Update water position based on slider
      this.waterLevel += (this.targetWaterLevel - this.waterLevel) * 0.05;
      this.waterMesh.position.y = this.waterLevel;
      
      // Handle water animation depending on water type
      if (this.waterMesh.material) {
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
        // For the advanced Water shader - update time and color
        if (this.waterMesh.material.uniforms['time']) {
          this.waterMesh.material.uniforms['time'].value += 1.0 / 60.0;
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
    
    // Animate debug box
    if (this.debugBox) {
      this.debugBox.rotation.y += 0.01;
    }
  }
});