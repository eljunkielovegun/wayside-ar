#!/bin/bash

# Script to download A-Frame and AR.js libraries for the Wayside.at project
# This script will download the libraries and place them in the appropriate directory

# Create libs directory if it doesn't exist
mkdir -p wayside-ar/libs

# Download A-Frame library
echo "Downloading A-Frame library..."
curl -o wayside-ar/libs/aframe.min.js https://aframe.io/releases/1.4.0/aframe.min.js

# Download AR.js library
echo "Downloading AR.js library..."
curl -o wayside-ar/libs/aframe-ar.js https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js

# Update the HTML file to use local libraries
echo "Updating HTML file to use local libraries..."

# Check if test-pages directory exists, create if not
mkdir -p wayside-ar/test-pages

# Create a backup of the original file if it exists
if [ -f wayside-ar/test-pages/basic-marker-test.html ]; then
    cp wayside-ar/test-pages/basic-marker-test.html wayside-ar/test-pages/basic-marker-test.html.bak
    echo "Created backup of original HTML file"
fi

# Update script references in the HTML file or create new if not exists
if [ -f wayside-ar/test-pages/basic-marker-test.html ]; then
    # Replace CDN script references with local ones
    sed -i 's|https://aframe.io/releases/1.4.0/aframe.min.js|../libs/aframe.min.js|g' wayside-ar/test-pages/basic-marker-test.html
    sed -i 's|https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js|../libs/aframe-ar.js|g' wayside-ar/test-pages/basic-marker-test.html
    echo "Updated script references in HTML file"
else
    # Create a new HTML file with local script references
    echo "Creating new HTML file with local script references..."
    cat > wayside-ar/test-pages/basic-marker-test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wayside.at - Basic AR Marker Test</title>
    <!-- Import A-Frame and AR.js libraries locally -->
    <script src="../libs/aframe.min.js"></script>
    <script src="../libs/aframe-ar.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }
        .ar-overlay {
            position: fixed;
            top: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 999;
            font-family: Arial, sans-serif;
        }
        .loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: Arial, sans-serif;
        }
        .loading-text {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <!-- Loading screen -->
    <div class="loading" id="loadingScreen">
        <div class="loading-spinner">
            <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="60 20">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        </div>
        <div class="loading-text">Loading AR Experience...</div>
    </div>

    <!-- Status overlay -->
    <div class="ar-overlay" id="status">
        Searching for marker...
    </div>

    <!-- A-Frame scene -->
    <a-scene 
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; precision: medium;"
        onload="hideLoading()">
        
        <!-- Use a standard hiro marker -->
        <a-marker preset="hiro" smooth="true" smoothCount="5" smoothTolerance="0.01" smoothThreshold="2" raycaster="objects: .clickable" emitevents="true" cursor="fuse: false; rayOrigin: mouse;" id="marker">
            <!-- Simple 3D cube that will appear on the marker -->
            <a-box position="0 0.5 0" color="blue" material="opacity: 0.8;" animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear;">
                <a-text value="Wayside.at\nAR Test" position="0 1 0" align="center" color="white" scale="1 1 1"></a-text>
            </a-box>
            
            <!-- Simple point cloud particle effect (preview of what will be used in the full app) -->
            <a-entity position="0 0 0">
                <a-entity id="particles"></a-entity>
            </a-entity>
        </a-marker>
        
        <!-- Static camera that will be moved by AR.js -->
        <a-entity camera></a-entity>
    </a-scene>

    <script>
        // Hide loading screen when the AR scene is ready
        function hideLoading() {
            document.getElementById('loadingScreen').style.display = 'none';
        }

        // Update status when marker is found or lost
        document.getElementById('marker').addEventListener('markerFound', function() {
            document.getElementById('status').innerHTML = 'Marker detected! 👍';
            document.getElementById('status').style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
            createParticles();
        });

        document.getElementById('marker').addEventListener('markerLost', function() {
            document.getElementById('status').innerHTML = 'Searching for marker...';
            document.getElementById('status').style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        });

        // Create simple particles (preview of point cloud effects for the main app)
        function createParticles() {
            const container = document.getElementById('particles');
            if (container.childNodes.length > 0) return; // Only create once
            
            // Create 100 small spheres around the marker to simulate point cloud
            for (let i = 0; i < 100; i++) {
                const sphere = document.createElement('a-sphere');
                // Random position within a 1-meter sphere
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.5;
                const height = Math.random() * 0.5 - 0.25;
                
                sphere.setAttribute('position', {
                    x: Math.cos(angle) * radius,
                    y: height + 0.25,
                    z: Math.sin(angle) * radius
                });
                sphere.setAttribute('radius', '0.01');
                sphere.setAttribute('color', getRandomColor());
                sphere.setAttribute('opacity', '0.7');
                
                container.appendChild(sphere);
            }
        }
        
        function getRandomColor() {
            // Colors inspired by the themes in the project
            const colors = ['#3F88C5', '#136F63', '#032B43', '#A44200', '#D72638'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
    </script>
</body>
</html>
EOL
fi

# Add index.html in the root for GitHub Pages
echo "Creating index.html in root directory..."
cat > wayside-ar/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wayside.at AR Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #3F88C5;
        }
        a {
            display: inline-block;
            background-color: #3F88C5;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        a:hover {
            background-color: #136F63;
        }
        .marker-image {
            max-width: 300px;
            margin: 20px 0;
            border: 1px solid #ccc;
        }
        .instructions {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Wayside.at AR Test</h1>
    <p>This is a basic test for the Wayside.at AR application. Click the button below to try the AR test.</p>
    
    <div class="instructions">
        <h2>Testing Instructions:</h2>
        <ol>
            <li>Print the Hiro marker (shown below)</li>
            <li>Allow camera access when prompted</li>
            <li>Point your camera at the printed marker</li>
            <li>You should see a blue rotating cube with text appear on the marker</li>
        </ol>
        <img src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" alt="Hiro Marker" class="marker-image">
    </div>
    
    <a href="test-pages/basic-marker-test.html">Launch AR Test</a>
</body>
</html>
EOL

echo "Script completed. Libraries have been downloaded and HTML files updated."
echo "You can now push these changes to your GitHub repository."
