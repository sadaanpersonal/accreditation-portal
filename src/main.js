import './style.css'

// ============================================================
// REALISTIC QR CODE GENERATOR (SVG-based)
// Generates a proper 21x21 QR-like pattern with finder patterns,
// timing patterns, and pseudo-random data modules.
// ============================================================
function makeQR(seed) {
  const N = 21;
  const grid = Array.from({length: N}, () => new Array(N).fill(0));

  // Finder pattern (top-left, top-right, bottom-left)
  function finder(r, c) {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      if (i===0||i===6||j===0||j===6) grid[r+i][c+j]=1;
      else if (i>=2&&i<=4&&j>=2&&j<=4) grid[r+i][c+j]=1;
      else grid[r+i][c+j]=0;
    }
  }
  finder(0,0); finder(0,14); finder(14,0);

  // Separators (white border around finders)
  for (let i=0;i<8;i++){
    if(i<N){grid[7][i]=0;grid[i][7]=0;}
    if(i<N){grid[7][N-1-i]=0;grid[i][N-8]=0;}
    if(i<N){grid[N-8][i]=0;grid[N-1-i][7]=0;}
  }

  // Timing patterns
  for (let i=8;i<13;i++) { grid[6][i]=i%2===0?1:0; grid[i][6]=i%2===0?1:0; }

  // Dark module
  grid[13][8]=1;

  // Pseudo-random data modules using seeded PRNG
  let s = seed || 12345;
  function rand() { s=(s*1103515245+12345)&0x7fffffff; return (s>>10)&1; }

  const reserved = new Set();
  for(let i=0;i<9;i++) for(let j=0;j<9;j++) { reserved.add(i+','+j); reserved.add(i+','+(N-1-j)); reserved.add((N-1-i)+','+j); }
  for(let i=8;i<13;i++) { reserved.add('6,'+i); reserved.add(i+',6'); }

  for(let r=0;r<N;r++) for(let c=0;c<N;c++) {
    if(!reserved.has(r+','+c)) grid[r][c]=rand();
  }

  return grid;
}

function renderQR(svgEl, seed, fgColor) {
  if (!svgEl) return;
  const fg = fgColor || '#0A0608';
  const grid = makeQR(seed);
  const N = 21;
  const cell = 10; // Each module = 10 units in 210 viewBox
  let paths = '';

  for (let r=0;r<N;r++) for(let c=0;c<N;c++) {
    if (grid[r][c]) {
      const x = c*cell, y = r*cell;
      // Rounded modules for data, square for finder
      const isFinderZone =
        (r<8&&c<8)||(r<8&&c>=13)||(r>=13&&c<8);
      if (isFinderZone) {
        paths += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fg}"/>`;
      } else {
        paths += `<rect x="${x+1}" y="${y+1}" width="${cell-2}" height="${cell-2}" rx="2" fill="${fg}"/>`;
      }
    }
  }

  svgEl.innerHTML = `<rect width="210" height="210" fill="white"/>${paths}`;
}

function renderAllQRs() {
  const seeds = { 0: 42847, 1: 91231, 2: 55013 };
  // Pass card QRs (small, dark modules)
  renderQR(document.getElementById('qr-pass-0'), seeds[0]);
  renderQR(document.getElementById('qr-pass-1'), seeds[1]);
  renderQR(document.getElementById('qr-pass-2'), seeds[2]);
  // Side panel QRs (medium)
  renderQR(document.getElementById('qr-side-0'), seeds[0]);
  renderQR(document.getElementById('qr-side-1'), seeds[1]);
  // Full-screen QRs
  renderQR(document.getElementById('qr-fullscreen-svg-0'), seeds[0]);
  renderQR(document.getElementById('qr-fullscreen-svg-1'), seeds[1]);
}

// ============================================================
// Screen Navigation
// ============================================================
function showScreen(screenId) {
  document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // Update demo nav
  document.querySelectorAll('.demo-nav-btn').forEach(b => b.classList.remove('active'));
  const screenMap = {
    'login-creator':0,'creator-dashboard':1,'admin-dashboard':2,
    'admin-request-detail':3,'user-activate':4,'user-dashboard':5
  };
  const idx = screenMap[screenId];
  const btns = document.querySelectorAll('.demo-nav-btn');
  if (idx !== undefined && btns[idx]) btns[idx].classList.add('active');

  // Render QRs whenever a QR-containing screen becomes visible
  if (['user-pass','user-qr'].includes(screenId)) {
    setTimeout(renderAllQRs, 80);
  }
}

// ============================================================
// Multi-Accreditation Tab Switcher
// ============================================================
function switchAcc(idx, btn) {
  document.querySelectorAll('.acc-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.acc-tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('acc-panel-' + idx);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  // Re-render QRs for this tab
  setTimeout(renderAllQRs, 80);
}

// ============================================================
// QR Pass Event Switcher
// ============================================================
function switchQrEvent(idx, btn) {
  document.querySelectorAll('[id^="qr-event-"]').forEach(el => el.style.display='none');
  const target = document.getElementById('qr-event-' + idx);
  if (target) target.style.display='block';
  // filter pills
  const bar = btn?.closest('div');
  if (bar) bar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ============================================================
// Creator sub-page navigation
// ============================================================
function showSubPage(role, page) {
  document.querySelectorAll('[id^="' + role + '-page-"]').forEach(p => p.style.display='none');
  const target = document.getElementById(role + '-page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#creator-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  const titles = {
    'dashboard':   'Dashboard',
    'create':      'New Request',
    'my-requests': 'My Requests',
    'events':      'Events',
  };
  const titleEl = document.getElementById('creator-page-title');
  if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
}

// ============================================================
// Admin sub-page navigation
// ============================================================
function showAdminPage(page) {
  document.querySelectorAll('[id^="admin-page-"]').forEach(p => p.style.display='none');
  const target = document.getElementById('admin-page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#admin-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  const titles = {'dashboard':'Admin Dashboard','requests':'All Requests'};
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
}

// ============================================================
// Modal controls
// ============================================================
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target===o) o.classList.remove('active'); });
});

// ============================================================
// Theme toggle
// ============================================================
function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', html.getAttribute('data-theme')==='dark' ? 'light' : 'dark');
}

// ============================================================
// Password strength
// ============================================================
function updatePwdStrength(val) {
  const bars = [1,2,3,4].map(i => document.getElementById('pwd-bar-'+i));
  bars.forEach(b => b && (b.className='pwd-bar'));
  if (!val) return;
  let s = 0;
  if (val.length>=6) s++;
  if (val.length>=10) s++;
  if (/[A-Z]/.test(val)&&/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const cls = s<=1?'weak':s<=2?'medium':'strong';
  for (let i=0;i<s;i++) bars[i]?.classList.add('active', cls);
}

// ============================================================
// Filter pills
// ============================================================
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', function() {
    const group = this.closest('.filters-bar') || this.closest('[style*="display:flex"]') || this.parentElement;
    if (group) group.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
  });
});

// ============================================================
// Notification filter
// ============================================================
function filterNotif(type, btn) {
  const bar = btn?.closest('.notif-filter-bar');
  if (bar) bar.querySelectorAll('.notif-filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.notif-item').forEach(item => {
    if (type==='all') item.style.display='flex';
    else if (type==='unread') item.style.display=item.classList.contains('unread')?'flex':'none';
    else item.style.display=(item.dataset.type===type)?'flex':'none';
  });
}

function markAllRead() {
  document.querySelectorAll('.notif-item').forEach(item => {
    item.classList.remove('unread');
    item.querySelector('.notif-unread-dot')?.remove();
  });
  document.querySelectorAll('.nav-badge').forEach(b => b.textContent='0');
  document.querySelectorAll('.notif-dot').forEach(d => d.style.display='none');
  const span = document.querySelector('#user-notif .topbar-title span');
  if (span) span.textContent = 'All caught up';
}

// ============================================================
// Mobile Sidebar
// ============================================================
function getActiveSidebar() {
  return document.querySelector('.screen.active .sidebar');
}
function toggleSidebar() {
  const sidebar  = getActiveSidebar();
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  backdrop?.classList.toggle('active', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}
function closeSidebar() {
  getActiveSidebar()?.classList.remove('open');
  document.getElementById('sidebar-backdrop')?.classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('click', e => { if (e.target.closest('.nav-item') && window.innerWidth<=768) closeSidebar(); });
document.addEventListener('keydown', e => { if (e.key==='Escape') closeSidebar(); });
let _tx=0;
document.addEventListener('touchstart', e => { _tx=e.touches[0].clientX; }, {passive:true});
document.addEventListener('touchend',   e => { if (e.changedTouches[0].clientX - _tx < -60) closeSidebar(); }, {passive:true});

// ============================================================
// Expose functions to global scope (required for inline onclick handlers)
// ES modules are scoped — window assignment makes them accessible from HTML
// ============================================================
window.showScreen       = showScreen;
window.switchAcc        = switchAcc;
window.switchQrEvent    = switchQrEvent;
window.showSubPage      = showSubPage;
window.showAdminPage    = showAdminPage;
window.openModal        = openModal;
window.closeModal       = closeModal;
window.toggleTheme      = toggleTheme;
window.updatePwdStrength = updatePwdStrength;
window.filterNotif      = filterNotif;
window.markAllRead      = markAllRead;
window.toggleSidebar    = toggleSidebar;
window.closeSidebar     = closeSidebar;

// ============================================================
// Initialize
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  showScreen('creator-dashboard');
});
