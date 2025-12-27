function toggler() {
  const togglerBtn = document.querySelector('.nav__toggler'),
    navMenu = document.querySelector('.nav');

  if (!togglerBtn || !navMenu) return;

  /*when toggler button is clicked*/
  togglerBtn.addEventListener(
    "click",
    () => {
      //convert hamburger to close
      togglerBtn.classList.toggle('nav__cross');
      //make nav visible
      navMenu.classList.toggle('nav--active');
    },
    true
  );
}

// Header scroll effect
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
});

// Random Hero Grid Fills
function initHeroFills() {
  const containers = document.querySelectorAll('.hero__grid-fills');
  if (containers.length === 0) return;

  const gridSize = 48;
  const squareCount = 21;

  containers.forEach(container => {
    const hero = container.closest('section');
    if (!hero) return;

    let intervalId;

    function updateFills() {
      container.innerHTML = '';
      const width = hero.offsetWidth;
      const height = hero.offsetHeight;
      const cols = Math.floor(width / gridSize);
      const rows = Math.floor(height / gridSize);

      const positions = new Set();
      const totalCells = cols * rows;
      const count = Math.min(squareCount, totalCells);

      let attempts = 0;
      while (positions.size < count && attempts < 1000) {
        attempts++;
        const col = Math.floor(Math.random() * cols);
        const row = Math.floor(Math.random() * rows);
        const pos = `${col},${row}`;

        if (positions.has(pos)) continue;

        // No two adjacent squares can be filled
        const neighbors = [
          `${col - 1},${row}`, `${col + 1},${row}`,
          `${col},${row - 1}`, `${col},${row + 1}`
        ];

        if (neighbors.some(n => positions.has(n))) continue;

        positions.add(pos);
      }

      positions.forEach(pos => {
        const [col, row] = pos.split(',').map(Number);
        const square = document.createElement('div');
        square.className = 'hero__grid-square';
        square.style.left = `${col * gridSize}px`;
        square.style.top = `${row * gridSize}px`;
        container.appendChild(square);

        // Animate in slightly delayed for each
        setTimeout(() => {
          square.classList.add('hero__grid-square--active');
        }, Math.random() * 500);
      });
    }

    function startRotation() {
      if (intervalId) clearInterval(intervalId);
      updateFills();
      intervalId = setInterval(updateFills, 7000);
    }

    startRotation();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(startRotation, 200);
    });
  });
}

// Grid Beaming Animation
function initHeroBeams() {
  const containers = document.querySelectorAll('.hero__grid-beams');
  if (containers.length === 0) return;

  const gridSize = 48;

  containers.forEach(container => {
    const hero = container.closest('section');
    if (!hero) return;

    function createBeam() {
      const isHorizontal = Math.random() > 0.5;
      const beam = document.createElement('div');
      beam.className = `grid-beam ${isHorizontal ? 'grid-beam--horizontal' : 'grid-beam--vertical'}`;

      const width = hero.offsetWidth;
      const height = hero.offsetHeight;

      if (isHorizontal) {
        const row = Math.floor(Math.random() * (height / gridSize));
        beam.style.top = `${row * gridSize}px`;
        beam.style.left = '0';
      } else {
        const col = Math.floor(Math.random() * (width / gridSize));
        beam.style.left = `${col * gridSize}px`;
        beam.style.top = '0';
      }

      container.appendChild(beam);

      // Remove beam after animation finishes
      beam.addEventListener('animationend', () => {
        beam.remove();
      });
    }

    // Randomly spawn beams
    function spawn() {
      createBeam();
      setTimeout(spawn, Math.random() * 2000 + 1000); // Between 1 and 3 seconds
    }

    spawn();
  });
}


// Mouse Parallax for CTA Cards
function initCTAParallax() {
  const cardBox = document.querySelector('.cta-box');
  const cards = document.querySelectorAll('.cta-card');
  if (!cardBox || cards.length === 0) return;

  cardBox.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = cardBox.getBoundingClientRect();

    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;

    cards.forEach((card, index) => {
      const factor = (index + 1) * 20;
      card.style.transform = `translate(${x * factor}px, ${y * factor}px) rotate(var(--rot))`;
    });
  });

  cardBox.addEventListener('mouseleave', () => {
    cards.forEach(card => {
      card.style.transform = `translate(0, 0) rotate(var(--rot))`;
    });
  });
}

// View Transition handling for project items
function initViewTransitions() {
  const projectLinks = document.querySelectorAll('.work__item-anchor');

  projectLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Find the parent item that should transition
      const item = link.closest('.work__item');
      if (item) {
        // Add the active class to trigger the view-transition-name in CSS
        item.classList.add('work__item-active');
      }

      // The browser handles the transition automatically due to @view-transition
    });
  });
}

// Hero Scroll Parallax
function initHeroParallax() {
  const visuals = document.querySelectorAll('.hero-visual__inner');
  if (visuals.length === 0) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    visuals.forEach(visual => {
      const speed = 0.25;
      const yPos = -(scrolled * speed);
      visual.style.setProperty('--parallax-y', `${yPos}px`);
    });
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroFills();
  initHeroBeams();
  initCTAParallax();
  initViewTransitions();
  initHeroParallax();
});