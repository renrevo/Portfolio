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
  const heroCanvas = document.getElementById('pe-hero-canvas');
  if (heroCanvas) {
    new ParticleNetwork(heroCanvas);
  }
});
