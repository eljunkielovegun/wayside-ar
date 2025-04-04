/**
 * ARWaterBridge.js - Bridge component between AR.js and Three.js water simulation
 * 
 * This component handles:
 * 1. AR marker detection events
 * 2. Initialization of the water simulation
 * 3. Updates to the water simulation on each frame
 */

// Register a new A-Frame component that will handle the integration
AFRAME.registerComponent('ar-water-bridge', {
  init: function() {
    console.log("Initializing AR Water Bridge component");
    
    // Reference to the A-Frame entity
    this.el = this.el;
    
    // Create flag to track marker detection state
    this.markerVisible = false;
    
    // Initialize Three.js water simulation
    // Use a small delay to ensure Three.js is fully loaded
    setTimeout(() => {
      this.waterSimulation = new WaterSimulation(this.el.object3D);
      console.log("Water simulation initialized within AR component");
    }, 1000);
    
    // Set up marker detection events
    this.el.addEventListener('markerFound', this.onMarkerFound.bind(this));
    this.el.addEventListener('markerLost', this.onMarkerLost.bind(this));
  },
  
  onMarkerFound: function() {
    console.log("Marker found!");
    this.markerVisible = true;
    
    // Show water controls
    document.getElementById('water-controls').style.display = 'block';
    
    // Start water simulation if it exists
    if (this.waterSimulation) {
      this.waterSimulation.start();
    }
  },
  
  onMarkerLost: function() {
    console.log("Marker lost!");
    this.markerVisible = false;
    
    // Hide water controls
    document.getElementById('water-controls').style.display = 'none';
    
    // Pause water simulation if it exists
    if (this.waterSimulation) {
      this.waterSimulation.pause();
    }
  },
  
  tick: function() {
    // Only update water simulation when marker is visible and simulation exists
    if (this.markerVisible && this.waterSimulation) {
      this.waterSimulation.update();
    }
  }
});
