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
  
  // Add a large water plane
  addSimpleWaterPlane: function() {
    // Create a large water plane to fill the view
    const waterGeometry = new THREE.PlaneGeometry(30, 30, 16, 16);
    
    // Create a shiny blue material to simulate water
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x001e0f,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    // Create the water mesh
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2; // Make horizontal
    this.waterMesh.position.y = 0;
    this.waterMesh.position.z = 0; // Centered in view
    
    // Store original vertices for animation
    this.originalVertices = [];
    const positions = waterGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      this.originalVertices.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2],
        phase: Math.random() * Math.PI * 2
      });
    }
    
    // Add to marker object
    this.markerObject.add(this.waterMesh);
    console.log("Large water plane added");
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
      
      // Update water color based on depth
      const depthFactor = this.waterLevel / this.data.maxWaterRise;
      const waterColor = new THREE.Color(
        0.0, 
        Math.max(0.05, 0.11 - depthFactor * 0.08), 
        Math.max(0.05, 0.15 - depthFactor * 0.1)
      );
      this.waterMesh.material.color = waterColor;
      
      // Simple wave animation
      if (this.originalVertices && this.waterMesh.geometry.attributes.position) {
        const positions = this.waterMesh.geometry.attributes.position.array;
        const now = time * 0.001; // Convert to seconds
        
        for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
          const vertex = this.originalVertices[j];
          
          // Skip vertices at the edge
          if (Math.abs(vertex.x) < 3.9 && Math.abs(vertex.z) < 3.9) {
            // Create wave effect
            positions[i + 1] = Math.sin(vertex.phase + now + vertex.x) * 0.1;
          }
        }
        
        this.waterMesh.geometry.attributes.position.needsUpdate = true;
      }
    }
    
    // Animate debug box
    if (this.debugBox) {
      this.debugBox.rotation.y += 0.01;
    }
  }
});