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
    // Create a simple red box for debugging
    const boxGeom = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    this.debugBox = new THREE.Mesh(boxGeom, boxMat);
    this.debugBox.position.set(0, 3, 0);
    this.markerObject.add(this.debugBox);
    console.log("Debug box added");
  },
  
  // Add a simple water plane
  addSimpleWaterPlane: function() {
    // Create a simple water plane with a blue material
    const waterGeometry = new THREE.PlaneGeometry(8, 8, 8, 8);
    
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
    console.log("Simple water plane added");
  },
  
  // Add measurement column
  addMeasurementColumn: function() {
    const columnHeight = this.data.maxWaterRise * 1.2;
    
    // Create the main column
    const columnGeometry = new THREE.BoxGeometry(0.3, columnHeight, 0.3);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.8
    });
    
    this.column = new THREE.Mesh(columnGeometry, columnMaterial);
    this.column.position.set(0, columnHeight / 2, 0);
    this.markerObject.add(this.column);
    
    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 5, 2);
    this.markerObject.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.markerObject.add(ambientLight);
    
    // Add height markings
    for (let i = 0; i <= this.data.maxWaterRise; i += 2) {
      const markerGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
      const markerMaterial = new THREE.MeshStandardMaterial({ 
        color: i % 5 === 0 ? 0xff0000 : 0x000000 
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, i, 0.2);
      this.markerObject.add(marker);
    }
    
    console.log("Measurement column added");
  },
  
  onMarkerFound: function() {
    console.log("Marker found!");
    this.markerVisible = true;
    
    // Show water controls
    document.getElementById('water-controls').style.display = 'block';
    document.getElementById('info').textContent = "Climate marker detected! Adjust the slider to see future water levels.";
  },
  
  onMarkerLost: function() {
    console.log("Marker lost!");
    this.markerVisible = false;
    
    // Hide water controls
    document.getElementById('water-controls').style.display = 'none';
    document.getElementById('info').textContent = "Marker lost. Show the marker to continue the experience.";
  },
  
  tick: function(time, deltaTime) {
    if (!this.markerVisible) return;
    
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