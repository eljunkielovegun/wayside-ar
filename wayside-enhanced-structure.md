wayside-ar/
├── index.html                # Entry point HTML
├── public/                   # Static assets served as-is
│   ├── manifest.json         # PWA manifest 
│   ├── favicon.ico
│   ├── robots.txt
│   ├── splash-screens/       # PWA splash screens
│   └── fallback/             # Fallback content for unsupported devices
│       ├── images/           # Static fallback images
│       └── videos/           # Simple fallback videos
│
├── src/                      # Source code
│   ├── main.jsx              # Main entry point
│   ├── App.jsx               # Root React component
│   ├── vite-env.d.ts         # Vite type definitions
│   │
│   ├── assets/               # Static assets imported by components
│   │   ├── markers/          # AR marker images
│   │   ├── images/           # General images
│   │   ├── models/           # 3D models
│   │   ├── textures/         # Textures for 3D elements
│   │   └── data/             # JSON data files
│   │       ├── map/          # Map data
│   │       └── experiences/  # Experience configuration
│   │
│   ├── components/           # React components
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Navigation.jsx
│   │   │
│   │   ├── ui/               # UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── EmergencyPanel.jsx  ## Safety & emergency info panel
│   │   │
│   │   ├── map/              # Map components
│   │   │   ├── MapView.jsx           # Map container
│   │   │   ├── MapControls.jsx       # Map controls
│   │   │   ├── ExperienceMarker.jsx  # Marker for experiences
│   │   │   ├── UserLocation.jsx      # User location indicator
│   │   │   ├── RouteOverlay.jsx      # Walking route with time
│   │   │   └── HapticNotifier.jsx    # Haptic feedback near points
│   │   │
│   │   ├── ar/               # AR components
│   │   │   ├── ARView.jsx            # AR container
│   │   │   ├── ARControls.jsx        # AR controls
│   │   │   ├── ARFallback.jsx        # Fallback for unsupported devices
│   │   │   ├── ARCapabilityCheck.jsx # Checks device AR support
│   │   │   └── AROverlay.jsx         # UI overlay for AR
│   │   │
│   │   ├── offline/          # Offline components
│   │   │   ├── OfflineIndicator.jsx
│   │   │   ├── DownloadManager.jsx
│   │   │   ├── StorageInfo.jsx
│   │   │   └── VisitorLogger.jsx     # Visitor activity logger
│   │   │
│   │   ├── feedback/         # Feedback components
│   │   │   ├── FeedbackButton.jsx    # Quick feedback button
│   │   │   ├── FeedbackForm.jsx      # Detailed feedback form
│   │   │   └── EmojiReaction.jsx     # Quick emoji reaction
│   │   │
│   │   └── curator/          # Curator components
│   │       ├── ContentPreview.jsx    # Preview for content editors
│   │       └── SimpleEditor.jsx      # Basic content editor
│   │
│   ├── pages/                # Page components
│   │   ├── Home.jsx
│   │   ├── MapPage.jsx
│   │   ├── ExperiencePage.jsx
│   │   ├── AboutPage.jsx
│   │   ├── EmergencyPage.jsx        # Emergency information page
│   │   └── OfflinePage.jsx
│   │
│   ├── hooks/                # React hooks
│   │   ├── useAR.js               # AR functionality
│   │   ├── useThree.js            # Three.js functionality
│   │   ├── useLocation.js         # Geolocation with fallbacks
│   │   ├── useOffline.js          # Offline state management
│   │   ├── useExperiences.js      # Experience loading
│   │   ├── useHaptic.js           # Haptic feedback
│   │   ├── useDeviceInfo.js       # Device capability detection
│   │   ├── useStorageSpace.js     # Check available storage
│   │   └── useActivityLogger.js   # Log user activity
│   │
│   ├── context/              # React context
│   │   ├── AppContext.jsx
│   │   ├── ARContext.jsx
│   │   ├── LocationContext.jsx
│   │   ├── OfflineContext.jsx
│   │   └── VisitorLogContext.jsx   # Context for activity logging
│   │
│   ├── three/                # Three.js implementations
│   │   ├── core/             # Core Three.js setup
│   │   │   ├── scene.js
│   │   │   ├── renderer.js
│   │   │   ├── camera.js
│   │   │   ├── lights.js
│   │   │   └── performance-monitor.js  # Performance monitoring
│   │   │
│   │   ├── ar/               # AR.js integration
│   │   │   ├── ar-engine.js
│   │   │   ├── ar-marker.js
│   │   │   ├── ar-session.js
│   │   │   └── ar-fallback.js         # Fallback rendering
│   │   │
│   │   ├── shaders/          # Shader implementations
│   │   │   ├── point-cloud/       # Point cloud shaders
│   │   │   │   ├── water.js
│   │   │   │   ├── smoke.js
│   │   │   │   └── plant.js
│   │   │   │
│   │   │   ├── materials/         # Custom materials
│   │   │   └── postprocessing/    # Post-processing effects
│   │   │
│   │   └── objects/          # 3D object implementations
│   │       ├── terrain.js
│   │       ├── point-cloud.js
│   │       ├── marker.js
│   │       └── adaptive-resolution.js  # LOD based on device
│   │
│   ├── experiences/          # AR experiences as loaded from JSON
│   │   ├── ExperienceRegistry.jsx  # Dynamic experience loading
│   │   ├── ExperienceRenderer.jsx  # Renders experiences from config
│   │   ├── ExperienceBase.jsx      # Base experience component
│   │   └── loaders/                # Dynamic experience loaders
│   │       ├── timeLoader.js
│   │       ├── seasonLoader.js
│   │       └── momentLoader.js
│   │
│   ├── utils/                # Utility functions
│   │   ├── device.js          # Device capability detection
│   │   ├── geo.js             # Geolocation utilities
│   │   ├── math.js            # Math utilities
│   │   ├── storage.js         # Local storage utilities
│   │   ├── asset-tracker.js   # Track asset size and loading
│   │   ├── performance.js     # Performance monitoring utils
│   │   └── version-check.js   # Check for content updates
│   │
│   ├── service-worker/       # Service worker for offline mode
│   │   ├── register.js        # Service worker registration
│   │   ├── cache.js           # Cache configuration
│   │   ├── background-sync.js # Background sync for logs/feedback
│   │   └── update-checker.js  # Check for app/content updates
│   │
│   └── data/                 # Data management
│       ├── experiences/       # Experience configurations
│       │   ├── index.json         # Registry of all experiences
│       │   ├── time/
│       │   │   ├── climate-2030.json
│       │   │   ├── dump-1968.json
│       │   │   └── canoe-2200bc.json
│       │   ├── seasons/
│       │   │   └── plants-cycle.json
│       │   └── moments/
│       │       ├── ranger-mac.json
│       │       ├── helen-fowler.json
│       │       └── volunteers.json
│       │
│       ├── logs/              # Logging data structures
│       │   ├── activity-schema.js
│       │   ├── log-manager.js
│       │   └── log-exporter.js
│       │
│       └── models/            # Data models
│           ├── Experience.js
│           ├── User.js
│           └── Feedback.js
│
├── test-pages/               # Standalone test pages for experiences
│   ├── index.html            # Test page directory with links to all tests
│   │
│   ├── shared/               # Shared test page assets
│   │   ├── test-harness.js   # Common test harness functionality
│   │   ├── test-controls.js  # UI controls for testing
│   │   └── test-styles.css   # Styles for test pages
│   │
│   ├── time/
│   │   ├── climate-2030.html # Test page for climate experience
│   │   ├── dump-1968.html    # Test page for smoke experience
│   │   └── canoe-2200bc.html # Test page for canoe experience
│   │
│   ├── seasons/
│   │   └── plants-cycle.html # Test page for plant cycle experience
│   │
│   └── moments/
│       ├── ranger-mac.html   # Test page for Ranger Mac experience
│       ├── helen-fowler.html # Test page for Helen Fowler experience
│       └── volunteers.html   # Test page for volunteers experience
│
├── tests/                    # Automated tests
│   ├── setup.js              # Test setup
│   ├── mocks/                # Test mocks
│   │   ├── ar-mocks.js       # AR.js mocks
│   │   ├── three-mocks.js    # Three.js mocks
│   │   └── location-mocks.js # Geolocation mocks
│   │
│   ├── unit/                 # Unit tests
│   │   ├── components/       # Component tests
│   │   ├── hooks/            # Hook tests
│   │   └── utils/            # Utility tests
│   │
│   ├── integration/          # Integration tests
│   │   └── experiences/      # Experience integration tests
│   │
│   └── visual/               # Visual regression tests
│       ├── snapshots/        # Visual test snapshots
│       └── stories/          # Storybook stories
│
├── scripts/                  # Build and utility scripts
│   ├── build-test-pages.js        # Script to build all test pages
│   ├── deploy-test.js             # Script to deploy test pages
│   ├── create-experience.js       # Script to scaffold a new experience
│   ├── test-lighthouse.js         # Script to run Lighthouse tests
│   ├── asset-report.js            # Generate asset size reports
│   ├── optimize-assets.js         # Compress and optimize assets
│   │   ├── model-optimizer.js     # glTF + Draco compression
│   │   ├── texture-optimizer.js   # Image compression
│   │   └── asset-audit.js         # Audit asset sizes
│   │
│   └── update-content.js          # Update content manifests
│
├── deployments/              # Deployment configurations
│   ├── netlify.toml          # Netlify configuration
│   ├── firebase.json         # Firebase configuration (optional)
│   └── gh-pages/             # GitHub Pages configuration
│
├── config/                   # Build and config files
│   ├── vite/                 # Vite configurations
│   │   ├── base.js           # Base Vite config
│   │   ├── dev.js            # Development config
│   │   ├── prod.js           # Production config
│   │   └── test-pages.js     # Test pages config
│   │
│   ├── jest/                 # Jest configurations
│   │   ├── setup.js          # Jest setup
│   │   └── transformers/     # Custom Jest transformers
│   │
│   ├── pwa/                  # PWA configuration
│   │   ├── manifest.js       # PWA manifest generator
│   │   ├── service-worker.js # Service worker configuration
│   │   └── versioning.js     # Content version management
│   │
│   └── optimization/         # Build optimization
│       ├── asset-limits.js   # Asset size limits
│       ├── compression.js    # Compression settings
│       └── bundle-analyzer.js # Bundle size analyzer
│
├── offline/                  # Offline support
│   ├── asset-manifest.js     # Manifest of assets to cache
│   ├── storage-manager.js    # Local storage management
│   ├── sync-manager.js       # Background sync for logs
│   └── media-cache.js        # Media file caching
│
├── dist/                     # Build output
│   ├── app/                  # Bundled application
│   └── experiences/          # Individual bundled experiences
│
├── vite.config.js            # Vite configuration
├── package.json              # Project dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── jest.config.js            # Jest configuration
├── .env                      # Environment variables
├── .env.development          # Development environment variables
├── .env.production           # Production environment variables
├── jsconfig.json             # JavaScript configuration
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── README.md                 # Project documentation
│
└── docs/                     # Documentation
    ├── for-developers/       # Developer documentation
    │   ├── setup.md              # Setup instructions
    │   ├── architecture.md       # Architecture overview
    │   ├── testing.md            # Testing guide
    │   ├── deployment.md         # Deployment guide
    │   ├── optimization.md       # Asset optimization guide
    │   ├── adding-experiences.md # Guide to adding new experiences
    │   └── performance.md        # Performance optimization guide
    │
    ├── for-curators/         # Content creator documentation
    │   ├── content-editing.md    # How to edit JSON experience configs
    │   ├── asset-guidelines.md   # Guidelines for optimal assets
    │   └── testing-content.md    # How to test content changes
    │
    └── for-team/             # Non-technical team documentation
        ├── viewing-tests.md      # Guide to viewing test builds
        ├── providing-feedback.md # How to provide feedback
        ├── emergency-info.md     # Safety procedures and information
        ├── glossary.md           # Technical terms explained
        └── faq.md                # Frequently asked questions
