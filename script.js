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
    // Only cap based on alive particles, not dead ones pending cleanup
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

  // Touch support for mobile sparkles
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
      p.life -= p.decay;
      if (p.type === 'star') {
        drawStar(p.x, p.y, p.size, p.color, p.life);
      } else {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
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

/* --- Journaling & Blog (JSON Data) --- */
let allPostsData = [];

async function initPosts() {
  const treeEl = document.getElementById('posts-tree');
  const indexEl = document.getElementById('explorer-index');
  const singleEl = document.getElementById('single-post-view');
  const indexListEl = document.getElementById('index-posts-list');
  const searchInput = document.getElementById('post-search');
  const countEl = document.getElementById('post-count');

  if (!treeEl) return;

  // Performance: Cache data
  if (allPostsData.length === 0) {
    try {
      const response = await fetch('data/posts.json');
      allPostsData = await response.json();
      allPostsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      console.error('Error loading posts:', err);
      // Fallback for local files (CORS)
      allPostsData = [
        { id: 1, type: "journal", title: "Starting the Kirby-Clone Project", date: "2026-04-15 10:00", content: "Today I set up the basic XP.css structure. Honestly, the nostalgia is hitting hard. I want to make this look as authentic as possible! (｡♥‿♥｡)" },
        { id: 2, type: "blog", title: "Why Markdown is Essential", date: "2026-04-16 14:30", content: "## Introduction\nMarkdown allows us to write structured content without leaving the editor. \n\n### Benefits\n- It's **fast**\n- It's **portable**\n- It looks great on GitHub!" },
        { id: 3, type: "journal", title: "Learning about CSS Filters", date: "2026-04-17 09:00", content: "Found out how to make 'glassmorphism' using `backdrop-filter`. Maybe I can add some modern touches to this retro theme?" },
        { id: 4, type: "blog", title: "Exploring the World of Laravel", date: "2026-04-10 11:20", content: "Laravel makes backend development so much smoother. The **Eloquent ORM** is a game changer for database interactions.\n\n> \"The PHP Framework for Web Artisans\"" }
      ];
      renderTree();
      renderContent();
    }
  }

  if (countEl) countEl.textContent = allPostsData.length;

  function renderTree(filter = '') {
    const categories = ['JOURNAL', 'BLOG'];
    const fragment = document.createDocumentFragment();

    categories.forEach(cat => {
      const catPosts = allPostsData.filter(p => 
        p.type.toUpperCase() === cat && 
        (p.title.toLowerCase().includes(filter.toLowerCase()) || filter === '')
      );

      if (catPosts.length > 0) {
        const folderLi = document.createElement('li');
        folderLi.className = 'folder';
        folderLi.textContent = `📁 ${cat}`;
        fragment.appendChild(folderLi);

        catPosts.forEach(post => {
          const itemLi = document.createElement('li');
          itemLi.textContent = `📄 ${post.title}`;
          itemLi.dataset.id = post.id;
          if (window.location.hash === `#post-${post.id}`) itemLi.classList.add('active');
          
          itemLi.addEventListener('click', () => {
            window.location.hash = `post-${post.id}`;
          });
          fragment.appendChild(itemLi);
        });
      }
    });

    treeEl.innerHTML = '';
    if (fragment.children.length === 0) {
      treeEl.innerHTML = '<li>No results found</li>';
    } else {
      treeEl.appendChild(fragment);
    }
  }

  function renderContent() {
    const hash = window.location.hash;
    const postId = hash.startsWith('#post-') ? parseInt(hash.replace('#post-', '')) : null;

    if (postId) {
      const post = allPostsData.find(p => p.id === postId);
      if (post) {
        showSinglePost(post);
        updateActiveTreeItem(postId);
        return;
      }
    }
    
    showIndex();
    updateActiveTreeItem(null);
  }

  function showIndex() {
    indexEl.classList.remove('hidden');
    singleEl.classList.add('hidden');
    
    const fragment = document.createDocumentFragment();
    allPostsData.slice(0, 5).forEach(post => {
      const div = document.createElement('div');
      div.className = 'explorer-index-item';
      div.innerHTML = `
        <div class="title">${escapeHtml(post.title)}</div>
        <div class="snippet">${escapeHtml(stripMarkdown(post.content).substring(0, 120))}...</div>
        <div class="explorer-post-meta">${post.date} — [${post.type.toUpperCase()}]</div>
      `;
      div.addEventListener('click', () => { window.location.hash = `post-${post.id}`; });
      fragment.appendChild(div);
    });

    indexListEl.innerHTML = '';
    indexListEl.appendChild(fragment);
  }

  function showSinglePost(post) {
    indexEl.classList.add('hidden');
    singleEl.classList.remove('hidden');

    document.getElementById('view-title').textContent = post.title;
    document.getElementById('view-date').textContent = post.date;
    document.getElementById('view-category').textContent = post.type.toUpperCase();
    
    const contentEl = document.getElementById('view-content');
    if (post.type === 'blog' && typeof marked !== 'undefined') {
      contentEl.innerHTML = marked.parse(post.content);
    } else {
      contentEl.innerHTML = `<p>${escapeHtml(post.content)}</p>`;
    }

    // Nav logic
    const idx = allPostsData.findIndex(p => p.id === post.id);
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');

    const hasPrev = idx < allPostsData.length - 1;
    const hasNext = idx > 0;

    if (prevBtn) {
       prevBtn.disabled = !hasPrev;
       prevBtn.onclick = hasPrev ? () => { window.location.hash = `post-${allPostsData[idx + 1].id}`; } : null;
    }
    if (nextBtn) {
       nextBtn.disabled = !hasNext;
       nextBtn.onclick = hasNext ? () => { window.location.hash = `post-${allPostsData[idx - 1].id}`; } : null;
    }
    
    // Scroll to top
    document.getElementById('post-viewer').scrollTop = 0;
  }

  function updateActiveTreeItem(id) {
    document.querySelectorAll('#posts-tree li').forEach(li => {
      li.classList.remove('active');
      if (id && li.dataset.id == id) li.classList.add('active');
    });
  }

  // Event Listeners
  window.addEventListener('hashchange', renderContent);
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      renderTree(e.target.value);
    }, 200));
  }

  // Helper for creating new JSON entries
  const submitBtn = document.getElementById('post-submit');
  const clearBtn = document.getElementById('post-clear');
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');
  const jsonOutput = document.getElementById('json-output');
  const jsonOutputContainer = document.getElementById('json-output-container');
  const copyJsonBtn = document.getElementById('copy-json-btn');

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title || !content) return;

      const now = new Date();
      const newPost = {
        id: Date.now(),
        type: content.length > 200 ? 'blog' : 'journal',
        title: title,
        date: now.toISOString().slice(0, 16).replace('T', ' '),
        content: content
      };

      jsonOutput.value = JSON.stringify(newPost, null, 2);
      jsonOutputContainer.classList.remove('hidden');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      titleInput.value = '';
      contentInput.value = '';
      jsonOutputContainer.classList.add('hidden');
    });
  }

  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', () => {
      jsonOutput.select();
      document.execCommand('copy');
      copyJsonBtn.textContent = '✅ Copied!';
      setTimeout(() => copyJsonBtn.textContent = '🖇️ Copy to Clipboard', 2000);
    });
  }

  renderTree();
  renderContent();
}

/* --- Homepage Latest Posts Teaser --- */
async function initLatestPostsTeaser() {
  const container = document.getElementById('latest-posts-container');
  if (!container) return;

  // Reuse cached data if available, otherwise fetch
  let posts = allPostsData;
  if (posts.length === 0) {
    try {
      const response = await fetch('data/posts.json');
      posts = await response.json();
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      container.innerHTML = '<p style="font-size: 11px; color: #999;">Could not load updates.</p>';
      return;
    }
  }

  const latest = posts.slice(0, 2);
  if (latest.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #999;">No posts yet! ✨</p>';
    return;
  }

  container.innerHTML = '';
  latest.forEach(post => {
    const item = document.createElement('div');
    item.style.marginBottom = '8px';
    item.style.borderBottom = '1px dotted #ccc';
    item.style.paddingBottom = '4px';
    item.innerHTML = `
      <div style="font-size: 12px; color: #003399; font-weight: bold;">${escapeHtml(post.title)}</div>
      <div style="font-size: 10px; color: #999;">${post.date} — [${post.type.toUpperCase()}]</div>
    `;
    container.appendChild(item);
  });
}

/* --- Utility --- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function stripMarkdown(str) {
  return str
    .replace(/#{1,6}\s?/g, '')      // headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/`(.*?)`/g, '$1')       // inline code
    .replace(/^>\s?/gm, '')          // blockquotes
    .replace(/^-\s/gm, '')           // list items
    .replace(/\n/g, ' ')             // newlines
    .replace(/\s+/g, ' ')            // collapse spaces
    .trim();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* --- Admin Mode (Security) --- */
const PASS_HASH = '87fd4d3bdc50aaf7435056df8f56d21efcfeb9da7305090ed09d1ff62f66aa6c'; // SHA-256 of "funixxnya16"

async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function initAdminMode() {
  const loginModal = document.getElementById('login-modal');
  const passwordInput = document.getElementById('admin-password');
  const loginSubmit = document.getElementById('login-submit');
  const loginCancel = document.getElementById('login-cancel');
  const closeLogin = document.getElementById('close-login');
  const loginError = document.getElementById('login-error');
  const composeWindow = document.getElementById('admin-compose-window');

  function showLogin() {
    loginModal?.classList.remove('hidden');
    passwordInput?.focus();
  }

  function hideLogin() {
    loginModal?.classList.add('hidden');
    if (passwordInput) passwordInput.value = '';
    loginError?.classList.add('hidden');
  }

  function checkSession() {
    // Clear old localStorage if present to fix user state
    localStorage.removeItem('admin_session');
    
    const isAdmin = sessionStorage.getItem('admin_session') === 'true';
    if (isAdmin) {
      composeWindow?.classList.remove('hidden');
      composeWindow?.removeAttribute('hidden');
      if (composeWindow) composeWindow.style.display = '';
    } else {
      composeWindow?.classList.add('hidden');
      composeWindow?.setAttribute('hidden', '');
      if (composeWindow) composeWindow.style.display = 'none';
    }
  }

  // Secret Trigger 1: Double-click profile photos
  document.querySelectorAll('.profile-photo, .footer-mascot').forEach(img => {
    img.addEventListener('dblclick', showLogin);
  });

  // Secret Trigger 2: Keyboard Shortcut (Ctrl+Shift+L)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      showLogin();
    }
  });

  // Login Logic
  loginSubmit?.addEventListener('click', async () => {
    const input = passwordInput.value;
    const hashed = await sha256(input);
    
    if (hashed === PASS_HASH) {
      sessionStorage.setItem('admin_session', 'true');
      hideLogin();
      checkSession();
      alert('Welcome back, Admin! 🔓');
    } else {
      loginError?.classList.remove('hidden');
      passwordInput.value = '';
    }
  });

  loginCancel?.addEventListener('click', hideLogin);
  closeLogin?.addEventListener('click', hideLogin);

  // Allow Enter key to submit
  passwordInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginSubmit.click();
  });

  checkSession();
}
