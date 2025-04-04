/**
 * ar-water-simulation.js - A-Frame component for water simulation in AR
 * 
 * This component handles:
 * 1. Creating a Three.js water simulation
 * 2. Adding it to the marker's Three.js object
 * 3. Updating it when the marker is visible
 */

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
    
    // Get references to Three.js objects
    this.markerObject = this.el.object3D;
    this.scene = this.el.sceneEl.object3D;
    this.renderer = this.el.sceneEl.renderer;
    this.camera = this.el.sceneEl.camera;
    
    // Initialize water simulation
    this.initWaterSimulation();
    
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
  
  initWaterSimulation: function() {
    // Create a water plane geometry
    const waterGeometry = new THREE.PlaneGeometry(8, 8);
    
    // Load water normal texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
      (waterNormals) => {
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
        
        try {
          // Create Three.js Water object
          this.water = new THREE.Water(
            this.renderer,
            this.camera,
            this.scene,
            {
              textureWidth: 256,
              textureHeight: 256,
              waterNormals: waterNormals,
              alpha: 0.8,
              sunDirection: new THREE.Vector3(0.70707, 0.70707, 0),
              waterColor: 0x001e0f,
              distortionScale: 3.7,
              fog: false
            }
          );
          
          // Create a mesh to hold the water material
          this.waterMesh = new THREE.Mesh(
            waterGeometry, 
            this.water.material
          );
          
          // Set initial position
          this.waterMesh.rotation.x = -Math.PI / 2; // Horizontal plane
          this.waterMesh.position.y = 0;
          
          // Add the water mesh to the marker object
          this.markerObject.add(this.waterMesh);
          
          // Add measurement column
          this.addMeasurementColumn();
          
          console.log("Water simulation initialized");
        } catch (e) {
          console.error("Error creating water:", e);
        }
      },
      undefined,
      (error) => {
        console.error("Error loading water texture:", error);
      }
    );
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
    if (!this.markerVisible || !this.water || !this.waterMesh) return;
    
    // Update water animation
    this.water.material.uniforms.time.value += deltaTime * 0.001;
    
    // Smoothly interpolate water level
    this.waterLevel += (this.targetWaterLevel - this.waterLevel) * 0.05;
    this.waterMesh.position.y = this.waterLevel;
    
    // Update water color based on depth
    const depthFactor = this.waterLevel / this.data.maxWaterRise;
    const waterColor = new THREE.Color(
      0.0,
      Math.max(0.05, 0.11 - depthFactor * 0.08),
      Math.max(0.05, 0.15 - depthFactor * 0.1)
    );
    this.water.material.uniforms.waterColor.value = waterColor;
    
    // Render the water reflections
    this.water.render();
  }
});
