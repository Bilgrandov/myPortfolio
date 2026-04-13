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

/* --- Posts (localStorage) --- */
function initPosts() {
  const submitBtn = document.getElementById('post-submit');
  const clearBtn = document.getElementById('post-clear');
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');
  const listEl = document.getElementById('posts-list');
  const countEl = document.getElementById('post-count');

  if (!submitBtn || !listEl) return;

  function getPosts() {
    try { return JSON.parse(localStorage.getItem('osaka_posts') || '[]'); }
    catch { return []; }
  }

  function savePosts(posts) {
    localStorage.setItem('osaka_posts', JSON.stringify(posts));
  }

  function renderPosts() {
    const posts = getPosts();
    if (countEl) countEl.textContent = posts.length;

    if (posts.length === 0) {
      listEl.innerHTML = '<p class="no-posts">No posts yet! Write your first post above~ ✨</p>';
      return;
    }

    listEl.innerHTML = '';
    posts.forEach((post, idx) => {
      const div = document.createElement('div');
      div.className = 'post-card';
      div.innerHTML =
        '<h3>' + escapeHtml(post.title) + '</h3>' +
        '<div class="post-date">' + escapeHtml(post.date) + '</div>' +
        '<div class="post-body">' + escapeHtml(post.content) + '</div>' +
        '<div class="post-actions">' +
          '<button type="button" class="delete-post" data-idx="' + idx + '">🗑️ Delete</button>' +
        '</div>';
      listEl.appendChild(div);
    });

    listEl.querySelectorAll('.delete-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx);
        const posts = getPosts();
        posts.splice(i, 1);
        savePosts(posts);
        renderPosts();
      });
    });
  }

  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) return;

    const posts = getPosts();
    const now = new Date();
    posts.unshift({
      title,
      content,
      date: now.toISOString().slice(0, 16).replace('T', ' ')
    });
    savePosts(posts);
    titleInput.value = '';
    contentInput.value = '';
    renderPosts();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      titleInput.value = '';
      contentInput.value = '';
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

/* --- Utility --- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
