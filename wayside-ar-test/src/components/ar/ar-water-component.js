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
    
    // Add a simple water and column implementation
    this.addSimpleWater();
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
  
  addSimpleWater: function() {
    // Create a simple water plane with a blue material
    const waterGeometry = new THREE.PlaneGeometry(8, 8, 32, 32);
    
    // Create a simple blue material with transparency
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x001e0f,
      transparent: true,
      opacity: 0.85,
      metalness: 0.1,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.4,
      reflectivity: 0.5
    });
    
    // Create mesh and position it
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2; // Horizontal plane
    this.waterMesh.position.y = 0;
    
    // Add simple wave animation to vertices
    this.waterGeometry = waterGeometry;
    this.originalVertices = [];
    const vertices = waterGeometry.attributes.position.array;
    
    // Store original vertex positions
    for (let i = 0; i < vertices.length; i += 3) {
      this.originalVertices.push({
        x: vertices[i],
        y: vertices[i + 1],
        z: vertices[i + 2],
        angle: Math.random() * Math.PI * 2
      });
    }
    
    // Add the water mesh to the marker object
    this.markerObject.add(this.waterMesh);
    console.log("Simple water added");
  },
  
  addMeasurementColumn: function() {
    const columnHeight = this.data.maxWaterRise * 1.2;
    
    // Create a measurement column
    const columnGeometry = new THREE.BoxGeometry(0.3, columnHeight, 0.3);
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.8
    });
    
    this.measurementColumn = new THREE.Mesh(columnGeometry, columnMaterial);
    this.measurementColumn.position.set(0, columnHeight / 2, 0);
    this.markerObject.add(this.measurementColumn);
    
    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 5, 2);
    this.markerObject.add(light);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.markerObject.add(ambientLight);
    
    // Add measurement markings
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
    if (!this.markerVisible || !this.waterMesh) return;
    
    // Update water position based on slider
    this.waterLevel += (this.targetWaterLevel - this.waterLevel) * 0.05;
    this.waterMesh.position.y = this.waterLevel;
    
    // Animate water surface with simple waves
    if (this.waterGeometry && this.originalVertices) {
      const vertices = this.waterGeometry.attributes.position.array;
      
      for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
        const vertex = this.originalVertices[j];
        vertex.angle += 0.01;
        
        // Create gentle waves
        const waveHeight = 0.05 * (1.0 + Math.sin(vertex.angle));
        
        vertices[i + 2] = vertex.z + waveHeight;
      }
      
      this.waterGeometry.attributes.position.needsUpdate = true;
    }
    
    // Update water color based on depth
    if (this.waterMesh.material) {
      const depthFactor = this.waterLevel / this.data.maxWaterRise;
      const r = 0.0;
      const g = Math.max(0.05, 0.11 - depthFactor * 0.08);
      const b = Math.max(0.05, 0.15 - depthFactor * 0.1);
      
      this.waterMesh.material.color.setRGB(r, g, b);
    }
  }
});