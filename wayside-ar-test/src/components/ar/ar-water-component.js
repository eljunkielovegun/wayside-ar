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
    
    // Scene reference
    this.scene = this.el.sceneEl.object3D;
    
    // Initialize water simulation
    this.initWater();
    
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
  
  initWater: function() {
    console.log("Initializing water...");
    
    // Create a water plane
    const waterGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    
    // Use the water approach from your codepen
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x001e0f,
      transparent: true,
      opacity: 0.8,
      metalness: 0.1,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.4,
      reflectivity: 0.5
    });
    
    // Create the water mesh
    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.rotation.x = -Math.PI / 2; // Make it horizontal
    this.water.position.y = 0; // Start at ground level
    
    // Add water to the marker
    this.markerObject.add(this.water);
    console.log("Water added to marker");
    
    // Add measurement column and scale down for AR
    this.addMeasurementColumn();
    
    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 2);
    this.markerObject.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.markerObject.add(ambientLight);
    
    console.log("Water initialization complete");
  },
  
  addMeasurementColumn: function() {
    // Height of the column
    const columnHeight = this.data.maxWaterRise * 1.2;
    
    // Create the main column (scaled for AR)
    const columnGeometry = new THREE.BoxGeometry(0.3, columnHeight, 0.3);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.8
    });
    
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(0, columnHeight / 2, 0);
    this.markerObject.add(column);
    console.log("Measurement column added");
    
    // Add height markings every 2 units
    for (let i = 0; i <= this.data.maxWaterRise; i += 2) {
      const markerGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
      const markerMaterial = new THREE.MeshStandardMaterial({ 
        color: i % 5 === 0 ? 0xff0000 : 0x000000 
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, i, 0.3);
      this.markerObject.add(marker);
    }
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
    if (!this.markerVisible || !this.water) return;
    
    // Smoothly interpolate water level
    this.waterLevel += (this.targetWaterLevel - this.waterLevel) * 0.02;
    this.water.position.y = this.waterLevel;
    
    // Adjust water color based on depth
    const depthFactor = this.waterLevel / this.data.maxWaterRise;
    const waterColor = new THREE.Color(
      0.0, 
      Math.max(0.05, 0.11 - depthFactor * 0.08), 
      Math.max(0.05, 0.15 - depthFactor * 0.1)
    );
    this.water.material.color = waterColor;
    
    // Animate the water vertices to create waves
    if (this.water.geometry.attributes && this.water.geometry.attributes.position) {
      const positions = this.water.geometry.attributes.position.array;
      const now = Date.now() * 0.001; // Convert to seconds
      
      for (let i = 0; i < positions.length; i += 3) {
        // Skip first and last vertices to keep edges stable
        if (i > 0 && i < positions.length - 3) {
          const x = positions[i];
          const z = positions[i + 2];
          
          // Create gentle wave animation
          positions[i + 1] = Math.sin(x + now) * 0.1 + 
                             Math.sin(z + now * 0.5) * 0.1;
        }
      }
      
      this.water.geometry.attributes.position.needsUpdate = true;
      this.water.geometry.computeVertexNormals();
    }
  }
});