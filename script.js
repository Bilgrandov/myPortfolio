/* ========================================
   ★ OSAKA'S WEB DEV CORNER ★
   XP.css Multipage Interactive JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSparkles();
  initClock();
  initStatCounters();
  initPosts();
  initGuestbook();
  initLatestPostsTeaser();
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

  document.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5 - 0.8,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
        type: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }
  });

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
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 3;

async function initPosts() {
  const submitBtn = document.getElementById('post-submit');
  const clearBtn = document.getElementById('post-clear');
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');
  const listEl = document.getElementById('posts-list');
  const countEl = document.getElementById('post-count');
  const jsonOutput = document.getElementById('json-output');
  const jsonOutputContainer = document.getElementById('json-output-container');
  const copyJsonBtn = document.getElementById('copy-json-btn');

  if (!listEl) return;

  // Fetch posts from JSON
  try {
    const response = await fetch('data/posts.json');
    allPostsData = await response.json();
    // Sort by date descending
    allPostsData.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('Error loading posts:', err);
    listEl.innerHTML = '<p class="no-posts">⚠️ Failed to load posts from data/posts.json</p>';
    return;
  }

  function renderPosts() {
    // Filter
    const filtered = currentFilter === 'all' 
      ? allPostsData 
      : allPostsData.filter(p => p.type === currentFilter);

    if (countEl) countEl.textContent = filtered.length;

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filtered.slice(start, end);

    updatePagination(totalPages);

    if (pageItems.length === 0) {
      listEl.innerHTML = '<p class="no-posts">No posts found in this category~ ✨</p>';
      return;
    }

    listEl.innerHTML = '';
    pageItems.forEach(post => {
      const div = document.createElement('div');
      // Theme based on type
      const themeClass = post.type === 'journal' ? 'theme-journal' : 'theme-blog';
      div.className = `post-card ${themeClass}`;
      
      let bodyContent = post.content;
      // Use marked for blog posts
      if (post.type === 'blog' && typeof marked !== 'undefined') {
        bodyContent = marked.parse(post.content);
      } else {
        bodyContent = escapeHtml(post.content);
      }

      div.innerHTML = `
        <h3>${escapeHtml(post.title)}</h3>
        <div class="post-date">[ ${post.type.toUpperCase()} ] — ${escapeHtml(post.date)}</div>
        <div class="post-body">${bodyContent}</div>
      `;
      listEl.appendChild(div);
    });
  }

  function updatePagination(totalPages) {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (!prevBtn || !nextBtn || !pageInfo) return;

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  // Event Listeners for Filters
  document.querySelectorAll('.filter-tabs li').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tabs li').forEach(t => t.classList.remove('active'));
      tab.classList.remove('active'); // CSS uses .active
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      currentPage = 1;
      renderPosts();
    });
  });

  // Event Listeners for Pagination
  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderPosts(); }
  });
  document.getElementById('next-page')?.addEventListener('click', () => {
    const filteredCount = currentFilter === 'all' 
      ? allPostsData.length 
      : allPostsData.filter(p => p.type === currentFilter).length;
    if (currentPage < Math.ceil(filteredCount / itemsPerPage)) { 
      currentPage++; 
      renderPosts(); 
    }
  });

  // Helper for creating new JSON entries
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title || !content) return;

      const now = new Date();
      const newPost = {
        id: Date.now(),
        type: content.length > 200 ? 'blog' : 'journal', // Simple auto-detect
        title: title,
        date: now.toISOString().slice(0, 16).replace('T', ' '),
        content: content
      };

      jsonOutput.value = JSON.stringify(newPost, null, 2);
      jsonOutputContainer.classList.remove('hidden');
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

  renderPosts();
}

/* --- Guestbook --- */
function initGuestbook() {
  const input = document.getElementById('guestbook-input');
  const submit = document.getElementById('guestbook-submit');
  const messages = document.getElementById('guestbook-messages');
  if (!input || !submit || !messages) return;

  function getMessages() {
    try { return JSON.parse(localStorage.getItem('osaka_guestbook') || '[]'); }
    catch { return []; }
  }

  function saveMessages(msgs) {
    localStorage.setItem('osaka_guestbook', JSON.stringify(msgs));
  }

  function renderMessages() {
    const msgs = getMessages();

    // Add defaults if empty
    if (msgs.length === 0) {
      const defaults = [
        { text: 'Cool website! Osaka-chan is so cute~ ♡', time: '2025-03-15 14:22' },
        { text: 'Great portfolio! Love the retro vibes!! ★', time: '2025-03-10 09:45' },
        { text: 'すごい！Amazing work! (◕‿◕✿)', time: '2025-02-28 18:30' }
      ];
      saveMessages(defaults);
      renderMessages();
      return;
    }

    messages.innerHTML = '';
    msgs.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'gb-msg';
      div.innerHTML = escapeHtml(msg.text) + '<span class="gb-time">' + escapeHtml(msg.time) + '</span>';
      messages.appendChild(div);
    });
  }

  submit.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    const msgs = getMessages();
    const now = new Date();
    msgs.unshift({ text, time: now.toISOString().slice(0, 16).replace('T', ' ') });
    saveMessages(msgs);
    input.value = '';
    renderMessages();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit.click();
    }
  });

  renderMessages();
}

/* --- Homepage Latest Posts Teaser --- */
async function initLatestPostsTeaser() {
  const container = document.getElementById('latest-posts-container');
  if (!container) return;

  try {
    const response = await fetch('data/posts.json');
    const posts = await response.json();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
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
  } catch (err) {
    container.innerHTML = '<p style="font-size: 11px; color: #999;">Could not load updates.</p>';
  }
}

/* --- Utility --- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
