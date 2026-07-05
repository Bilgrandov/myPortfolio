/* ========================================
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
  initCrtConfig();
  initSkills();
  initGuestbook();
});

/**
 * Initializes the interactive sparkle cursor trail animation.
 * Renders particles on mouse and touch movement using an HTML5 Canvas.
 */
function initSparkles() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const colors = ['#00bdd6', '#d2e2f9', '#ff6b9d', '#ffe45e', '#87ceeb'];
  const isMobile = window.innerWidth <= 640;
  const MAX_PARTICLES = isMobile ? 80 : 150;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  function spawnParticles(x, y, count) {
    const alive = particles.filter(p => p.life > 0).length;
    if (alive >= MAX_PARTICLES) return;
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
    ensureAnimating();
  });

  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) spawnParticles(touch.clientX, touch.clientY, 2);
    ensureAnimating();
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

  let animating = false;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    if (particles.length === 0) {
      animating = false;
      return;
    }
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

  function ensureAnimating() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(animate);
    }
  }
}

/**
 * Initializes the taskbar clock.
 * Updates the time every 30 seconds to match the system time.
 */
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

/**
 * Initializes the stat counter animation on the homepage.
 * Uses IntersectionObserver to trigger animation when scrolled into view.
 */
async function initStatCounters() {
  const stats = document.querySelectorAll('.stat-num[data-count]');
  if (!stats.length) return;

  // Dynamically fetch projects count from JSON database to update the home page stats counter
  try {
    const response = await fetch('data/projects.json');
    if (response.ok) {
      const projects = await response.json();
      stats.forEach(el => {
        const legend = el.previousElementSibling || el.parentElement.querySelector('legend');
        if (legend && legend.textContent.trim().toLowerCase() === 'projects') {
          el.setAttribute('data-count', projects.length);
        }
      });
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic projects count for homepage:", err);
  }

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

/**
 * Fetches blog posts from Supabase database.
 * Sorts them in descending order by creation date.
 */
async function ensurePostsFetched() {
  if (allPostsData.length === 0) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error(`Supabase error: ${response.status}`);

      const data = await response.json();

      // Map Supabase schema ke format yang dipakai portfolio
      allPostsData = data.map(post => ({
        id:      post.id,
        type:    post.type,
        title:   post.title,
        content: post.content || '',
        // Format created_at (ISO) → "2026-07-05 10:30"
        date:    post.created_at
                   ? post.created_at.slice(0, 16).replace('T', ' ')
                   : ''
      }));

    } catch (err) {
      console.error('Failed to fetch from Supabase:', err);
      allPostsData = [];
    }
  }
}


/**
 * Initializes the post explorer interface on the posts.html page.
 * Handles the rendering of the category tree and individual content panes.
 */
async function initPosts() {
  const treeEl = document.getElementById('posts-tree');
  if (!treeEl) return;

  await ensurePostsFetched();

  function renderTree() {
    treeEl.innerHTML = '';
    const cats = ['JOURNAL', 'BLOG', 'CP'];
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
          li.setAttribute('data-post-id', p.id);
          li.onclick = () => window.location.hash = `post-${p.id}`;
          treeEl.appendChild(li);
        });
      }
    });

    const postCount = document.getElementById('post-count');
    if (postCount) postCount.textContent = allPostsData.length;
  }

  function renderContentpane() {
    const hash = window.location.hash;
    const indexView = document.getElementById('explorer-index');
    const singleView = document.getElementById('single-post-view');
    const idxList = document.getElementById('index-posts-list');

    // Render index list
    if (idxList && idxList.children.length === 0) {
      idxList.innerHTML = '';
      allPostsData.forEach(p => {
        const item = document.createElement('div');
        item.style.cursor = 'pointer';
        item.style.color = 'var(--text-color, #000)';
        item.style.textDecoration = 'underline';
        item.style.marginBottom = '8px';
        item.innerHTML = `📄 <strong>${p.title}</strong> — <small>${p.date}</small>`;
        item.onclick = () => window.location.hash = `post-${p.id}`;
        idxList.appendChild(item);
      });
    }

    // Highlight selected tree node
    if (treeEl) {
      treeEl.querySelectorAll('li').forEach(item => {
        const postId = item.getAttribute('data-post-id');
        if (hash && hash.startsWith('#post-') && postId === hash.replace('#post-', '')) {
          item.classList.add('selected-item');
        } else {
          item.classList.remove('selected-item');
        }
      });
    }

    if (!hash || !hash.startsWith('#post-')) {
      if (indexView) indexView.classList.remove('hidden');
      if (singleView) singleView.classList.add('hidden');
      return;
    }

    const id = parseInt(hash.replace('#post-', ''), 10);
    const post = allPostsData.find(p => p.id === id);

    if (post) {
      if (indexView) indexView.classList.add('hidden');
      if (singleView) singleView.classList.remove('hidden');

      const titleEl = document.getElementById('view-title');
      const dateEl = document.getElementById('view-date');
      const catEl = document.getElementById('view-category');
      const contentEl = document.getElementById('view-content');

      if (titleEl) titleEl.textContent = post.title;
      if (dateEl) dateEl.textContent = post.date;
      if (catEl) catEl.textContent = post.type.toUpperCase();

      if (contentEl) {
        // Helper function to prevent code repetition
        const renderText = (text) => {
          if (typeof marked !== 'undefined') {
            contentEl.innerHTML = marked.parse(text);
          } else {
            contentEl.innerText = text;
          }
        };

        // Check if the post utilizes an external .md file
        if (post.file) {
          contentEl.innerHTML = '<p class="loading-text">Loading article...</p>';

          fetch(post.file) // Fetch the external markdown file
            .then(response => response.text())
            .then(text => renderText(text))
            .catch(err => renderText("Failed to load article 😢"));
        } else {
          // Fallback to legacy system (inline content from posts.json)
          renderText(post.content);
        }
      }

    }
  }
  // Setup Navigation Buttons
  const btnHome = document.getElementById('nav-home');
  const btnPrev = document.getElementById('nav-prev');
  const btnNext = document.getElementById('nav-next');

  if (btnHome) btnHome.addEventListener('click', () => window.location.hash = '');

  if (btnPrev || btnNext) {
    const navigate = (direction) => {
      const hash = window.location.hash;
      if (!hash.startsWith('#post-')) return;
      const id = parseInt(hash.replace('#post-', ''), 10);
      const currIdx = allPostsData.findIndex(p => p.id === id);
      if (currIdx === -1) return;

      const newIdx = currIdx + direction;
      if (newIdx >= 0 && newIdx < allPostsData.length) {
        window.location.hash = `post-${allPostsData[newIdx].id}`;
      }
    };
    if (btnPrev) btnPrev.addEventListener('click', () => navigate(1)); // +1 is older post because sorted by date desc
    if (btnNext) btnNext.addEventListener('click', () => navigate(-1)); // -1 is newer post
  }

  renderTree();
  renderContentpane();
  window.addEventListener('hashchange', renderContentpane);
}

/**
 * Initializes the latest posts teaser widget on the homepage.
 * Displays the two most recent posts fetched from the JSON database.
 */
async function initLatestPostsTeaser() {
  const container = document.getElementById('latest-posts-container');
  if (!container) return;

  await ensurePostsFetched();

  // Update "Posts Written" stat counter on homepage
  const statPosts = document.getElementById('stat-posts');
  if (statPosts) {
    animateCount(statPosts, allPostsData.length);
  }

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

/**
 * Initializes the hidden Admin Mode.
 * Unlocks the post composer via keyboard shortcut (Ctrl + Shift + L) and password validation.
 */
function initAdminMode() {
  const PASS_HASH = '87fd4d3bdc50aaf7435056df8f56d21efcfeb9da7305090ed09d1ff62f66aa6c';
  async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Session check on load
  const isAdmin = sessionStorage.getItem('admin_session') === 'true';
  const compose = document.getElementById('admin-compose-window');

  if (isAdmin && compose) {
    compose.classList.remove('hidden');
    compose.removeAttribute('hidden');
    compose.style.display = 'block'; // Fallback if hidden class isn't enough
  }

  // Hidden Keyboard Shortcut (Ctrl + Shift + L)
  const loginModal = document.getElementById('login-modal');
  const loginPass = document.getElementById('admin-password');
  const loginError = document.getElementById('login-error');

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      if (loginModal) {
        loginModal.classList.remove('hidden');
        if (loginPass) {
          loginPass.value = '';
          setTimeout(() => loginPass.focus(), 50);
        }
        if (loginError) loginError.classList.add('hidden');
      }
    }
  });

  const closeLogin = () => {
    if (loginModal) loginModal.classList.add('hidden');
    if (loginPass) loginPass.value = '';
    if (loginError) loginError.classList.add('hidden');
  };

  const submitLogin = async () => {
    if (!loginPass) return;
    const hash = await sha256(loginPass.value);
    if (hash === PASS_HASH) {
      sessionStorage.setItem('admin_session', 'true');
      closeLogin();
      alert("Access Granted: Admin Mode Activated");
      if (compose) {
        compose.classList.remove('hidden');
        compose.removeAttribute('hidden');
        compose.style.display = 'block';
      }
    } else {
      if (loginError) loginError.classList.remove('hidden');
    }
  };

  const btnCloseLogin = document.getElementById('close-login');
  const btnCancelLogin = document.getElementById('login-cancel');
  const btnSubmitLogin = document.getElementById('login-submit');

  if (btnCloseLogin) btnCloseLogin.addEventListener('click', closeLogin);
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLogin);
  if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', submitLogin);
  if (loginPass) {
    loginPass.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitLogin();
    });
  }

  // Post Composer Logic
  const btnSubmit = document.getElementById('post-submit');
  const btnClear = document.getElementById('post-clear');
  const btnCopy = document.getElementById('copy-json-btn');
  const jsonContainer = document.getElementById('json-output-container');
  const jsonOutput = document.getElementById('json-output');

  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      const title = document.getElementById('post-title').value;
      const content = document.getElementById('post-content').value;
      if (!title || !content) return alert("Error: Title and Content are required.");

      const now = new Date();
      const dateStr = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, '0') + "-" +
        String(now.getDate()).padStart(2, '0') + " " +
        String(now.getHours()).padStart(2, '0') + ":" +
        String(now.getMinutes()).padStart(2, '0');

      const postObj = {
        id: Date.now(), // Generate unique ID
        type: "blog",
        title: title,
        date: dateStr,
        content: content
      };

      jsonOutput.value = "  " + JSON.stringify(postObj, null, 2).replace(/\n/g, "\n  ") + ",\n";
      if (jsonContainer) jsonContainer.classList.remove('hidden');
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      document.getElementById('post-title').value = '';
      document.getElementById('post-content').value = '';
      if (jsonOutput) jsonOutput.value = '';
      if (jsonContainer) jsonContainer.classList.add('hidden');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonOutput.value).then(() => {
          alert("JSON array item copied correctly! Paste it at the top of your data/posts.json array.");
        });
      } else {
        jsonOutput.select();
        document.execCommand('copy');
        alert("JSON array item copied correctly! Paste it at the top of your data/posts.json array.");
      }
    });
  }
}

/**
 * Initializes the theme switcher toggle (Light/Dark mode).
 * Persists the user's preference in localStorage.
 */
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

/**
 * Initializes the CRT Monitor controls and applies saved states.
 */
function initCrtConfig() {
  const crt = document.querySelector('.crt-overlay');
  if (!crt) return;

  // Read saved configurations
  let scanlines = localStorage.getItem('crt-scanlines') || 'low'; // default to low
  let flicker = localStorage.getItem('crt-flicker') || 'on'; // default to on

  // Function to apply classes based on config
  function applyCrtConfig() {
    // Reset scanline classes
    crt.classList.remove('crt-off', 'crt-low-scanlines');
    if (scanlines === 'off') {
      crt.classList.add('crt-off');
    } else if (scanlines === 'low') {
      crt.classList.add('crt-low-scanlines');
    }

    // Reset flicker classes
    crt.classList.remove('crt-no-flicker');
    if (flicker === 'off') {
      crt.classList.add('crt-no-flicker');
    }
  }

  // Apply initially
  applyCrtConfig();

  // If we are on the page with CRT controls, bind listeners and highlights
  const scanHeavy = document.getElementById('crt-scan-heavy');
  const scanLow = document.getElementById('crt-scan-low');
  const scanOff = document.getElementById('crt-scan-off');
  const flickerOn = document.getElementById('crt-flicker-on');
  const flickerOff = document.getElementById('crt-flicker-off');

  if (scanHeavy && scanLow && scanOff && flickerOn && flickerOff) {
    function updateBtnActiveStates() {
      // Clear active states
      [scanHeavy, scanLow, scanOff, flickerOn, flickerOff].forEach(b => b.classList.remove('active'));

      // Highlight active scanline button
      if (scanlines === 'heavy') scanHeavy.classList.add('active');
      else if (scanlines === 'low') scanLow.classList.add('active');
      else if (scanlines === 'off') scanOff.classList.add('active');

      // Highlight active flicker button
      if (flicker === 'on') flickerOn.classList.add('active');
      else flickerOff.classList.add('active');
    }

    updateBtnActiveStates();

    scanHeavy.onclick = () => { scanlines = 'heavy'; localStorage.setItem('crt-scanlines', 'heavy'); applyCrtConfig(); updateBtnActiveStates(); };
    scanLow.onclick = () => { scanlines = 'low'; localStorage.setItem('crt-scanlines', 'low'); applyCrtConfig(); updateBtnActiveStates(); };
    scanOff.onclick = () => { scanlines = 'off'; localStorage.setItem('crt-scanlines', 'off'); applyCrtConfig(); updateBtnActiveStates(); };

    flickerOn.onclick = () => { flicker = 'on'; localStorage.setItem('crt-flicker', 'on'); applyCrtConfig(); updateBtnActiveStates(); };
    flickerOff.onclick = () => { flicker = 'off'; localStorage.setItem('crt-flicker', 'off'); applyCrtConfig(); updateBtnActiveStates(); };
  }
}

const skillCategories = [
  {
    name: "Front-End",
    icon: "🎨",
    skills: [
      { id: "skill-html", name: "HTML5", icon: '<i class="devicon-html5-plain colored" style="font-size: 32px;"></i>', level: 90, desc: "The foundational markup language of the web. I use semantic HTML5 elements to structure code clearly for SEO, accessibility (screen readers), and long-term maintainability." },
      { id: "skill-css", name: "CSS3", icon: '<i class="devicon-css3-plain colored" style="font-size: 32px;"></i>', level: 85, desc: "Advanced CSS styling including Custom Properties (CSS variables) for dynamic dark modes, complex animations, transitions, and writing clean, scalable responsive layouts." },
      { id: "skill-javascript", name: "JavaScript", icon: '<i class="devicon-javascript-plain colored" style="font-size: 32px;"></i>', level: 85, desc: "Deep knowledge of modern ES6+ vanilla JavaScript. Experienced in asynchronous flow control (Promises, Async/Await), DOM manipulation, dynamic page rendering, and state storage." },
      { id: "skill-flexbox", name: "Flexbox", icon: "<span style='font-size: 28px;'>📦</span>", level: 90, desc: "One-dimensional layout model. Used extensively to align elements dynamically, manage flexible items within headers, cards, and taskbar navigation panels." },
      { id: "skill-grid", name: "Grid Layout", icon: "<span style='font-size: 28px;'>🏁</span>", level: 80, desc: "Two-dimensional layout grid. Excellent for building clean, tabular, or masonry layouts like photo galleries and document explorer panes." },
      { id: "skill-semantic", name: "Semantic HTML", icon: "<span style='font-size: 28px;'>📑</span>", level: 90, desc: "Adhering to correct semantic structures (main, section, article, nav, header, footer) rather than nested divs. Ensures optimized browser parsing, accessibility, and SEO." },
      { id: "skill-responsive", name: "Responsive Design", icon: "<span style='font-size: 28px;'>📱</span>", level: 90, desc: "Designing pages that fluidly scale from massive 4K monitors down to small mobile phones using fluid grids, flexible images, and media query breakpoints." },
      { id: "skill-bootstrap", name: "Bootstrap", icon: '<i class="devicon-bootstrap-plain colored" style="font-size: 32px;"></i>', level: 75, desc: "Rapid prototyping framework. Experienced with using its predefined grid layouts and components for corporate projects and quick dashboard applications." },
      { id: "skill-tailwind", name: "Tailwind CSS", icon: '<i class="devicon-tailwindcss-original colored" style="font-size: 32px;"></i>', level: 80, desc: "Utility-first CSS framework. Used to quickly style responsive modern designs using direct inline class configurations without bloated stylesheets." }
    ]
  },
  {
    name: "Back-End & Database",
    icon: "⚙️",
    skills: [
      { id: "skill-php", name: "PHP", icon: '<i class="devicon-php-plain colored" style="font-size: 32px;"></i>', level: 80, desc: "Server-side scripting language. Comfortable building backend dynamic routing, form submissions, session tracking, and RESTful API structures." },
      { id: "skill-laravel", name: "Laravel", icon: '<i class="devicon-laravel-original colored" style="font-size: 32px;"></i>', level: 85, desc: "My favorite backend framework. Strong familiarity with MVC architecture, routing, migrations, Eloquent ORM, authentication, and middleware systems." },
      { id: "skill-mysql", name: "MySQL", icon: '<i class="devicon-mysql-plain colored" style="font-size: 32px;"></i>', level: 80, desc: "Relational database management. Writing efficient SQL queries, indexing, setting up primary/foreign key constraints, and designing clean database schemas." }
    ]
  },
  {
    name: "Design & Methodology",
    icon: "🛠️",
    skills: [
      { id: "skill-uml", name: "UML Design", icon: "<span style='font-size: 28px;'>📐</span>", level: 75, desc: "Unified Modeling Language. Creating flowcharts, use case diagrams, and database relational schemas before writing code to ensure correct software architecture." },
      { id: "skill-git", name: "Git & Version Control", icon: '<i class="devicon-git-plain colored" style="font-size: 32px;"></i>', level: 80, desc: "Daily use of Git for source control: branching strategies, commits, merges, and pull requests via GitHub. Comfortable working in collaborative repositories and managing project history." }
    ]
  }
];

/**
 * Renders and handles interactions in the Skills Tabbed Device Manager page.
 */
function initSkills() {
  const deviceList = document.getElementById('device-list');
  if (!deviceList) return;

  const tabBtnFrontend = document.getElementById('tab-btn-frontend');
  const tabBtnBackend = document.getElementById('tab-btn-backend');
  const tabBtnMethodology = document.getElementById('tab-btn-methodology');

  const detailsTitle = document.getElementById('skill-details-title');
  const detailsIcon = document.getElementById('skill-details-icon');
  const detailsDesc = document.getElementById('skill-details-desc');

  let activeCategoryIndex = 0; // default to Front-End

  function renderCategorySkills() {
    deviceList.innerHTML = '';
    const category = skillCategories[activeCategoryIndex];

    category.skills.forEach(skill => {
      const li = document.createElement('li');
      li.innerHTML = `⚡ <span>[Device: Online] — ${skill.name}</span>`;
      li.style.cursor = 'pointer';
      li.style.padding = '4px 6px';
      
      li.onclick = () => {
        // Toggle selected styling
        deviceList.querySelectorAll('li').forEach(item => item.classList.remove('selected-item'));
        li.classList.add('selected-item');

        // Populate device properties panel
        if (detailsTitle) detailsTitle.textContent = `${skill.name} Properties`;
        if (detailsIcon) detailsIcon.innerHTML = skill.icon;
        if (detailsDesc) detailsDesc.textContent = skill.desc;
      };

      deviceList.appendChild(li);
    });

    // Reset properties box
    if (detailsTitle) detailsTitle.textContent = 'Device Properties';
    if (detailsIcon) detailsIcon.innerHTML = '🔍';
    if (detailsDesc) detailsDesc.textContent = 'Select a skill component from the list above to view its properties, operational status, and development applications.';
  }

  function setActiveTab(index, clickedBtn) {
    activeCategoryIndex = index;
    
    // Reset aria-selected state for tab buttons
    [tabBtnFrontend, tabBtnBackend, tabBtnMethodology].forEach(btn => {
      if (btn) btn.setAttribute('aria-selected', 'false');
    });
    if (clickedBtn) clickedBtn.setAttribute('aria-selected', 'true');

    renderCategorySkills();
  }

  if (tabBtnFrontend) tabBtnFrontend.onclick = () => setActiveTab(0, tabBtnFrontend);
  if (tabBtnBackend) tabBtnBackend.onclick = () => setActiveTab(1, tabBtnBackend);
  if (tabBtnMethodology) tabBtnMethodology.onclick = () => setActiveTab(2, tabBtnMethodology);

  // Initial render
  renderCategorySkills();
}

/**
 * Handles guestbook message logic, persistence using localStorage.
 */
function initGuestbook() {
  const submitBtn = document.getElementById('guestbook-submit');
  const inputEl = document.getElementById('guestbook-input');
  const messagesEl = document.getElementById('guestbook-messages');
  if (!submitBtn || !inputEl || !messagesEl) return;

  const STORAGE_KEY = 'portfolio-guestbook';
  let messages = [];

  try {
    messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
      { name: "Anonymous Recruiter", text: "Love the Windows XP theme! Super nostalgic and clean.", date: "2026-06-12 10:15" },
      { name: "Fellow Dev", text: "Nice vanilla JS details. Good luck with the job search! 🚀", date: "2026-06-15 14:02" }
    ];
  } catch (e) {
    messages = [];
  }

  function renderMessages() {
    messagesEl.innerHTML = '';
    if (messages.length === 0) {
      messagesEl.innerHTML = '<p style="font-size: 11px; color: #888; text-align: center; margin-top: 20px;">No messages yet. Be the first to sign! ✒️</p>';
      return;
    }
    // Render newest first
    messages.slice().reverse().forEach(msg => {
      const card = document.createElement('div');
      card.className = 'guestbook-msg';
      card.innerHTML = `
        <div class="guestbook-msg-meta">
          <strong>${msg.name}</strong> — <small>${msg.date}</small>
        </div>
        <div class="guestbook-msg-text">${msg.text}</div>
      `;
      messagesEl.appendChild(card);
    });
  }

  submitBtn.onclick = () => {
    const text = inputEl.value.trim();
    if (!text) return alert("Please write a message before signing!");
    
    const now = new Date();
    const dateStr = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, '0') + "-" +
      String(now.getDate()).padStart(2, '0') + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0');

    const names = ["Vibe Checker", "Tech Enthusiast", "Cool Recruiter", "Retro Lover", "Internet Explorer Fan", "Coffee Addict"];
    const randomName = names[Math.floor(Math.random() * names.length)];

    messages.push({
      name: randomName,
      text: text,
      date: dateStr
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    inputEl.value = '';
    renderMessages();
  };

  renderMessages();
}
