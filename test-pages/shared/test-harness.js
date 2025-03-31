/**
 * test-harness.js
 * Shared testing utilities for Wayside.at AR test pages
 */

// Simple performance monitoring for AR tests
class ARPerformanceMonitor {
  constructor() {
    this.stats = {
      fps: [],
      markerDetections: 0,
      markerLosses: 0,
      startTime: Date.now(),
      renderTime: []
    };
    
    this.monitoring = false;
    this.lastFrameTime = 0;
  }
  
  start() {
    this.monitoring = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }
  
  stop() {
    this.monitoring = false;
  }
  
  loop() {
    if (!this.monitoring) return;
    
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Calculate FPS
    const fps = 1000 / delta;
    this.stats.fps.push(fps);
    
    // Keep only last 60 frames for FPS calculation
    if (this.stats.fps.length > 60) {
      this.stats.fps.shift();
    }
    
    // Continue monitoring
    requestAnimationFrame(() => this.loop());
  }
  
  logMarkerDetection() {
    this.stats.markerDetections++;
  }
  
  logMarkerLoss() {
    this.stats.markerLosses++;
  }
  
  logRenderTime(time) {
    this.stats.renderTime.push(time);
    
    // Keep only last 60 render times
    if (this.stats.renderTime.length > 60) {
      this.stats.renderTime.shift();
    }
  }
  
  getAverageFPS() {
    if (this.stats.fps.length === 0) return 0;
    return this.stats.fps.reduce((sum, value) => sum + value, 0) / this.stats.fps.length;
  }
  
  getAverageRenderTime() {
    if (this.stats.renderTime.length === 0) return 0;
    return this.stats.renderTime.reduce((sum, value) => sum + value, 0) / this.stats.renderTime.length;
  }
  
  getSessionDuration() {
    return Math.floor((Date.now() - this.stats.startTime) / 1000);
  }
  
  getReport() {
    return {
      averageFPS: this.getAverageFPS().toFixed(1),
      markerDetections: this.stats.markerDetections,
      markerLosses: this.stats.markerLosses,
      sessionDuration: this.getSessionDuration(),
      averageRenderTime: this.getAverageRenderTime().toFixed(2)
    };
  }
}

// Device capability detection for AR tests
class DeviceCapabilityChecker {
  static checkWebXRSupport() {
    return navigator.xr !== undefined && navigator.xr.isSessionSupported !== undefined;
  }
  
  static checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  }
  
  static checkCamera() {
    return navigator.mediaDevices !== undefined && 
           navigator.mediaDevices.getUserMedia !== undefined;
  }
  
  static async getCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      isWebXRSupported: this.checkWebXRSupport(),
      isWebGLSupported: this.checkWebGLSupport(),
      isCameraAvailable: this.checkCamera()
    };
  }
}

// Simple UI for AR test pages
class TestUI {
  constructor(containerId = 'test-controls') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }
    
    this.setupStyles();
  }
  
  setupStyles() {
    if (!document.getElementById('test-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'test-ui-styles';
      style.textContent = `
        #test-controls {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: Arial, sans-serif;
          z-index: 1000;
          max-width: 300px;
        }
        .test-panel {
          margin-bottom: 10px;
        }
        .test-panel-header {
          font-weight: bold;
          margin-bottom: 5px;
          cursor: pointer;
        }
        .test-panel-content {
          margin-left: 10px;
          font-size: 0.9em;
          overflow: hidden;
        }
        .test-button {
          background-color: #3F88C5;
          border: none;
          color: white;
          padding: 5px 10px;
          margin: 2px;
          border-radius: 3px;
          cursor: pointer;
        }
        .test-button:hover {
          background-color: #2D6A9F;
        }
        .collapsed {
          height: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  addPanel(title, content) {
    const panel = document.createElement('div');
    panel.className = 'test-panel';
    
    const header = document.createElement('div');
    header.className = 'test-panel-header';
    header.textContent = title;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'test-panel-content';
    
    if (typeof content === 'string') {
      contentDiv.textContent = content;
    } else if (content instanceof HTMLElement) {
      contentDiv.appendChild(content);
    }
    
    header.addEventListener('click', () => {
      contentDiv.classList.toggle('collapsed');
    });
    
    panel.appendChild(header);
    panel.appendChild(contentDiv);
    this.container.appendChild(panel);
    
    return contentDiv;
  }
  
  addButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'test-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    this.container.appendChild(button);
    return button;
  }
  
  updatePanel(panelElement, content) {
    if (panelElement) {
      panelElement.innerHTML = '';
      
      if (typeof content === 'string') {
        panelElement.textContent = content;
      } else if (content instanceof HTMLElement) {
        panelElement.appendChild(content);
      }
    }
  }
}

// Export utilities
window.WaysideTest = {
  ARPerformanceMonitor,
  DeviceCapabilityChecker,
  TestUI
};
