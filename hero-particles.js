/**
 * Three.js Particle Network for Private Equity Hero
 * "Connected Capital" - Interactive particle system representing
 * interconnected financial markets
 */

class ParticleNetwork {
  constructor(container) {
    this.container = container;
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;
    this.isMobile = window.innerWidth < 768;

    // Reduce particles and connections on mobile for cleaner look
    this.particleCount = this.isMobile ? 40 : 120;
    this.connectionDistance = this.isMobile ? 80 : 150;

    this.particles = [];
    this.mouse = { x: 0, y: 0, active: false };
    this.mouseInfluence = 100;

    // Color palette - neutral black/grey tones
    this.colors = {
      primary: 0x1a1a1a,    // Dark charcoal
      secondary: 0x4a4a4a,  // Medium grey
      tertiary: 0x2a2a2a,   // Dark grey
      line: 0x3a3a3a        // Subtle gray for connections
    };

    this.init();
    this.createParticles();
    this.createConnections();
    this.addEventListeners();
    this.animate();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 400;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    const colorOptions = [
      new THREE.Color(this.colors.primary),
      new THREE.Color(this.colors.secondary),
      new THREE.Color(this.colors.tertiary)
    ];

    for (let i = 0; i < this.particleCount; i++) {
      // Random position in 3D space
      const x = (Math.random() - 0.5) * this.width;
      const y = (Math.random() - 0.5) * this.height;
      const z = (Math.random() - 0.5) * 200;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random color from palette
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varied sizes
      sizes[i] = Math.random() * 3 + 1;

      // Store particle data for animation
      this.particles.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.1,
        originalX: x,
        originalY: y,
        originalZ: z
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for better control
    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.pointCloud = new THREE.Points(geometry, material);
    this.scene.add(this.pointCloud);
  }

  createConnections() {
    // Line material for connections
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: this.colors.line,
      transparent: true,
      opacity: 0.15
    });

    this.lineGeometry = new THREE.BufferGeometry();
    this.linePositions = new Float32Array(this.particleCount * this.particleCount * 6);
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);

    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lines);

    // Initialize beam lines for the beaming effect (brighter lines that pulse)
    this.beamLines = [];
    this.maxBeamLines = this.isMobile ? 3 : 6;
    this.beamSpawnRate = 0.015; // Probability of spawning a new beam each frame

    // Bright beam material
    this.beamLineMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
  }

  spawnBeamLine() {
    if (this.beamLines.length >= this.maxBeamLines) return;

    // Find a valid connection to beam
    const positions = this.pointCloud.geometry.attributes.position.array;
    const validConnections = [];

    for (let i = 0; i < this.particleCount; i++) {
      for (let j = i + 1; j < this.particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < this.connectionDistance) {
          validConnections.push({ i, j });
        }
      }
    }

    if (validConnections.length === 0) return;

    // Pick a random connection
    const connection = validConnections[Math.floor(Math.random() * validConnections.length)];

    // Create beam line geometry
    const beamGeometry = new THREE.BufferGeometry();
    const beamPositions = new Float32Array(6);
    beamGeometry.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3));

    // Create beam line with individual material for independent opacity control
    const beamMaterial = this.beamLineMaterial.clone();
    beamMaterial.opacity = 0;
    const beamLine = new THREE.LineSegments(beamGeometry, beamMaterial);
    this.scene.add(beamLine);

    // Store beam data
    this.beamLines.push({
      line: beamLine,
      geometry: beamGeometry,
      material: beamMaterial,
      startParticle: connection.i,
      endParticle: connection.j,
      life: 0,
      maxLife: 60 + Math.random() * 60, // Random duration (frames)
      phase: 0 // Animation phase
    });
  }

  updateBeamLines() {
    const positions = this.pointCloud.geometry.attributes.position.array;

    // Maybe spawn a new beam line
    if (Math.random() < this.beamSpawnRate) {
      this.spawnBeamLine();
    }

    // Update existing beam lines
    for (let i = this.beamLines.length - 1; i >= 0; i--) {
      const beam = this.beamLines[i];
      beam.life++;

      // Get current particle positions
      const startX = positions[beam.startParticle * 3];
      const startY = positions[beam.startParticle * 3 + 1];
      const startZ = positions[beam.startParticle * 3 + 2];
      const endX = positions[beam.endParticle * 3];
      const endY = positions[beam.endParticle * 3 + 1];
      const endZ = positions[beam.endParticle * 3 + 2];

      // Update beam line positions
      const beamPositions = beam.geometry.attributes.position.array;
      beamPositions[0] = startX;
      beamPositions[1] = startY;
      beamPositions[2] = startZ;
      beamPositions[3] = endX;
      beamPositions[4] = endY;
      beamPositions[5] = endZ;
      beam.geometry.attributes.position.needsUpdate = true;

      // Pulse animation - fade in, glow, fade out
      const progress = beam.life / beam.maxLife;
      let opacity;

      if (progress < 0.2) {
        // Fade in
        opacity = (progress / 0.2) * 0.7;
      } else if (progress < 0.8) {
        // Pulsing glow
        const pulsePhase = (progress - 0.2) / 0.6;
        opacity = 0.5 + Math.sin(pulsePhase * Math.PI * 4) * 0.2;
      } else {
        // Fade out
        opacity = ((1 - progress) / 0.2) * 0.7;
      }

      beam.material.opacity = opacity;

      // Remove beam when done
      if (beam.life >= beam.maxLife) {
        this.scene.remove(beam.line);
        beam.geometry.dispose();
        beam.material.dispose();
        this.beamLines.splice(i, 1);
      }
    }
  }

  updateConnections() {
    const positions = this.pointCloud.geometry.attributes.position.array;
    let lineIndex = 0;
    let numConnections = 0;

    for (let i = 0; i < this.particleCount; i++) {
      for (let j = i + 1; j < this.particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < this.connectionDistance) {
          this.linePositions[lineIndex++] = positions[i * 3];
          this.linePositions[lineIndex++] = positions[i * 3 + 1];
          this.linePositions[lineIndex++] = positions[i * 3 + 2];
          this.linePositions[lineIndex++] = positions[j * 3];
          this.linePositions[lineIndex++] = positions[j * 3 + 1];
          this.linePositions[lineIndex++] = positions[j * 3 + 2];
          numConnections++;
        }
      }
    }

    this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.setDrawRange(0, numConnections * 2);
  }

  addEventListeners() {
    // Mouse movement
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;
      this.mouse.active = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const positions = this.pointCloud.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particles[i];

      // Base movement
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;

      // Boundary bounce
      const boundX = this.width * 0.5;
      const boundY = this.height * 0.5;
      const boundZ = 100;

      if (Math.abs(particle.x) > boundX) particle.vx *= -1;
      if (Math.abs(particle.y) > boundY) particle.vy *= -1;
      if (Math.abs(particle.z) > boundZ) particle.vz *= -1;

      // Mouse influence - particles gently attracted to cursor
      if (this.mouse.active) {
        const mouseX = this.mouse.x * this.width * 0.5;
        const mouseY = this.mouse.y * this.height * 0.5;

        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouseInfluence * 2) {
          const force = (1 - distance / (this.mouseInfluence * 2)) * 0.02;
          particle.vx += dx * force * 0.01;
          particle.vy += dy * force * 0.01;
        }
      }

      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      particle.vz *= 0.99;

      // Slight drift back to original position
      particle.vx += (particle.originalX - particle.x) * 0.0001;
      particle.vy += (particle.originalY - particle.y) * 0.0001;

      // Update geometry
      positions[i * 3] = particle.x;
      positions[i * 3 + 1] = particle.y;
      positions[i * 3 + 2] = particle.z;
    }

    this.pointCloud.geometry.attributes.position.needsUpdate = true;

    // Update connections every 2nd frame for performance
    if (this.frameCount === undefined) this.frameCount = 0;
    this.frameCount++;
    if (this.frameCount % 2 === 0) {
      this.updateConnections();
    }

    // Update beaming effect on connection lines
    this.updateBeamLines();

    // Subtle camera sway
    this.camera.position.x = Math.sin(Date.now() * 0.0001) * 10;
    this.camera.position.y = Math.cos(Date.now() * 0.00015) * 5;

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Look for any project hero canvas
  const canvasIds = [
    'pe-hero-canvas',
    'compliance-hero-canvas',
    'captable-hero-canvas',
    'esign-hero-canvas',
    'custom-dashboard-hero-canvas'
  ];

  for (const id of canvasIds) {
    const heroCanvas = document.getElementById(id);
    if (heroCanvas) {
      new ParticleNetwork(heroCanvas);
      break; // Only initialize once per page
    }
  }
});
