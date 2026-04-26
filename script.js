/* ========================================
   ★ OSAKA'S WEB DEV CORNER ★
   XP.css Multipage Interactive JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSparkles();
  initClock();
  initStatCounters();
  initPosts();
  initLatestPostsTeaser();
  initAdminMode();
  initThemeSwitcher();
});

/* --- Sparkle Cursor Trail --- */
function initSparkles() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const colors = ['#00bdd6', '#d2e2f9', '#ff6b9d', '#ffe45e', '#87ceeb'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnParticles(x, y, count) {
    const alive = particles.filter(p => p.life > 0).length;
    if (alive >= 150) return;
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5 - 0.8,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
        type: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }
  }

  document.addEventListener('mousemove', (e) => {
    spawnParticles(e.clientX, e.clientY, 2);
  });

  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) spawnParticles(touch.clientX, touch.clientY, 2);
  }, { passive: true });

  function drawStar(cx, cy, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const m = i === 0 ? 'moveTo' : 'lineTo';
      ctx[m](cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.015;
      const alpha = Math.max(0, p.life);
      const radius = Math.max(0.1, p.size * alpha);
      if (p.type === 'star') {
        drawStar(p.x, p.y, p.size, p.color, alpha);
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      p.life -= p.decay;
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* --- Taskbar Clock --- */
function initClock() {
  const el = document.getElementById('taskbar-clock');
  if (!el) return;
  function update() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    el.textContent = h + ':' + m;
  }
  update();
  setInterval(update, 30000);
}

/* --- Stat Counter Animation --- */
function initStatCounters() {
  const stats = document.querySelectorAll('.stat-num[data-count]');
  if (!stats.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        animateCount(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(s => observer.observe(s));
}

function animateCount(el, target) {
  let current = 0;
  const inc = Math.max(1, Math.floor(target / 50));
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 30);
}

/* --- Journaling & Blog --- */
let allPostsData = [];
async function initPosts() {
  const treeEl = document.getElementById('posts-tree');
  if (!treeEl) return;
  
  if (allPostsData.length === 0) {
    try {
      const response = await fetch('data/posts.json');
      allPostsData = await response.json();
      allPostsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      allPostsData = [
        { id: 1, type: "journal", title: "Starting the Kirby-Clone Project", date: "2026-04-15 10:00", content: "Today I set up the basic XP.css structure. Nostalgia hitting hard!" },
        { id: 2, type: "blog", title: "Why Markdown is Essential", date: "2026-04-16 14:30", content: "### Benefits\n- It's fast\n- It's portable" }
      ];
    }
  }

  function renderTree() {
    treeEl.innerHTML = '';
    const cats = ['JOURNAL', 'BLOG'];
    cats.forEach(cat => {
      const posts = allPostsData.filter(p => p.type.toUpperCase() === cat);
      if (posts.length) {
        const folder = document.createElement('li');
        folder.className = 'folder';
        folder.textContent = `📁 ${cat}`;
        treeEl.appendChild(folder);
        posts.forEach(p => {
          const li = document.createElement('li');
          li.textContent = `📄 ${p.title}`;
          li.onclick = () => window.location.hash = `post-${p.id}`;
          treeEl.appendChild(li);
        });
      }
    });
  }
  renderTree();
}

/* --- Homepage Latest Posts Teaser --- */
async function initLatestPostsTeaser() {
  const container = document.getElementById('latest-posts-container');
  if (!container) return;
  const posts = allPostsData.length ? allPostsData : [];
  const latest = posts.slice(0, 2);
  if (latest.length === 0) return;
  container.innerHTML = '';
  latest.forEach(p => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${p.title}</strong><br><small>${p.date}</small>`;
    container.appendChild(div);
  });
}

/* --- Admin Mode --- */
function initAdminMode() {
  const PASS_HASH = '87fd4d3bdc50aaf7435056df8f56d21efcfeb9da7305090ed09d1ff62f66aa6c';
  async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simplified session check
  const isAdmin = sessionStorage.getItem('admin_session') === 'true';
  const compose = document.getElementById('admin-compose-window');
  if (isAdmin && compose) compose.classList.remove('hidden');
}

/* --- Theme Switcher --- */
function initThemeSwitcher() {
  const themes = ['default', 'dark'];
  let currentThemeIdx = themes.indexOf(localStorage.getItem('portfolio-theme') || 'default');
  if (currentThemeIdx === -1) currentThemeIdx = 0;

  document.documentElement.setAttribute('data-theme', themes[currentThemeIdx]);

  const switcherBtn = document.getElementById('theme-switcher');
  if (!switcherBtn) return;

  const icons = ['☀️', '🌑'];
  
  const updateIcon = () => {
    switcherBtn.innerHTML = `<div class="xp-toggle-thumb">${icons[currentThemeIdx]}</div>`;
  };
  
  updateIcon();

  switcherBtn.addEventListener('click', () => {
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    const newTheme = themes[currentThemeIdx];
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    updateIcon();
  });
}
