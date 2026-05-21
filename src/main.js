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
  renderQR(document.getElementById('qr-back-0'), seeds[0]);
  renderQR(document.getElementById('qr-back-1'), seeds[1]);
  renderQR(document.getElementById('qr-back-2'), seeds[2]);
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
    'creator-dashboard':0,'admin-dashboard':1,'user-dashboard':2
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
    'dashboard':       'Dashboard',
    'create':          'New Request',
    'my-requests':     'My Requests',
    'events':          'Events',
    'request-detail':  'Request Detail',
    'bulk-upload':     'Bulk Upload',
    'notifications':   'Notifications',
  };
  const titleEl = document.getElementById('creator-page-title');
  if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
  if (page === 'request-detail') renderPipeline();
}

// ============================================================
// Admin sub-page navigation
// ============================================================
function showAdminPage(page) {
  document.querySelectorAll('[id^="admin-page-"]').forEach(p => p.style.display='none');
  const target = document.getElementById('admin-page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#admin-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  const titles = {'dashboard':'Admin Dashboard','requests':'All Requests','create':'New Request','events':'Events','settings':'Settings','request-detail':'Review Request','bulk-upload':'Bulk Upload','notifications':'Notifications'};
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
  if (page === 'request-detail') {
    currentPipelineStage = 1; pipelineRejected = false; pipelineInfoRequested = false; pipelineInfoNote = ''; approvedZones = [];
    document.querySelectorAll('#zone-picker .zone-picker-item').forEach(el => el.classList.toggle('selected', el.dataset.zone === 'B'));
    const meta = document.getElementById('pipeline-stage-2-done-meta');
    if (meta) meta.style.display = 'none';
    updateZoneDisplays();
    renderPipeline();
  }
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
// ============================================================
// Events list/grid toggle
// ============================================================
function setEventView(view, btn, scope) {
  const prefix = scope || 'creator';
  const listEl = document.getElementById(prefix + '-events-list');
  const gridEl = document.getElementById(prefix + '-events-grid');
  if (listEl) listEl.style.display = view === 'list' ? 'flex' : 'none';
  if (gridEl) gridEl.style.display = view === 'grid' ? 'grid' : 'none';
  btn?.closest('.view-toggle-group')?.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
}

// ============================================================
// Approval Pipeline State Machine
// ============================================================
const PIPELINE_STAGES = [
  { name: 'FA Owner',      icon: 'verified_user' },
  { name: 'Zone Owner',    icon: 'map' },
  { name: 'Media Owner',   icon: 'newspaper' },
  { name: 'MOI Clearance', icon: 'account_balance' },
];
let currentPipelineStage = 1; // 1–4 active, 5 = complete
let pipelineRejected = false;
let pipelineInfoRequested = false;
let pipelineInfoNote = '';

function renderPipeline() {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('pipeline-stage-' + i);
    if (!el) continue;
    el.className = 'approval-stage' + (i === 4 ? ' is-moi' : '');
    if (pipelineRejected && i === currentPipelineStage)     el.classList.add('is-rejected');
    else if (pipelineInfoRequested && i === currentPipelineStage) el.classList.add('is-info');
    else if (i < currentPipelineStage || currentPipelineStage > 4) el.classList.add('is-done');
    else if (i === currentPipelineStage)                     el.classList.add('is-active');
    else                                                     el.classList.add('is-pending');

    const actions = document.getElementById('pipeline-stage-actions-' + i);
    const showActions = i === currentPipelineStage && !pipelineRejected && !pipelineInfoRequested && currentPipelineStage <= 4;
    if (actions) actions.style.display = showActions ? 'flex' : 'none';
    if (i === 2 && showActions) setTimeout(initAdminVenueMap, 0);

    const sb = document.getElementById('pipeline-stage-' + i + '-badge');
    if (sb) {
      if (pipelineRejected && i === currentPipelineStage)     { sb.textContent = 'Rejected'; sb.className = 'badge badge-rejected'; sb.style.display = ''; }
      else if (pipelineInfoRequested && i === currentPipelineStage) { sb.textContent = 'Info Requested'; sb.className = 'badge badge-review'; sb.style.display = ''; }
      else if (i <= currentPipelineStage) sb.style.display = 'none';
      else { sb.textContent = 'Pending'; sb.className = 'badge badge-pending'; sb.style.display = ''; }
    }
  }

  for (let i = 1; i <= 3; i++) {
    const c = document.getElementById('pipeline-connector-' + i);
    if (c) {
      c.classList.toggle('is-done', i < currentPipelineStage && !(pipelineInfoRequested && i === currentPipelineStage));
      c.classList.toggle('is-info', pipelineInfoRequested && i === currentPipelineStage);
    }
  }

  const stageBadge = document.getElementById('pipeline-stage-badge');
  if (stageBadge) {
    if (pipelineRejected)             { stageBadge.textContent = 'Rejected';       stageBadge.className = 'badge badge-rejected'; }
    else if (pipelineInfoRequested)   { stageBadge.textContent = 'Info Requested'; stageBadge.className = 'badge badge-review'; }
    else if (currentPipelineStage > 4){ stageBadge.textContent = 'Approved';       stageBadge.className = 'badge badge-approved'; }
    else                               { stageBadge.textContent = 'Stage ' + currentPipelineStage + ' of 4'; stageBadge.className = 'badge badge-review'; }
  }

  const label = document.getElementById('pipeline-current-label');
  if (label) {
    if (pipelineRejected)             label.innerHTML = 'Status: <strong style="color:#F87171;">Rejected at ' + PIPELINE_STAGES[currentPipelineStage - 1].name + '</strong>';
    else if (pipelineInfoRequested)   label.innerHTML = 'Waiting: <strong style="color:#FBBF24;">Info from applicant — ' + PIPELINE_STAGES[currentPipelineStage - 1].name + '</strong>';
    else if (currentPipelineStage > 4) label.innerHTML = 'Status: <strong style="color:#4ADE80;">Fully Approved</strong>';
    else                               label.innerHTML = 'Current: <strong style="color:var(--gold);">' + PIPELINE_STAGES[currentPipelineStage - 1].name + '</strong>';
  }

  const ha = document.getElementById('pipeline-header-actions');
  if (ha) ha.style.display = (pipelineRejected || pipelineInfoRequested || currentPipelineStage > 4) ? 'none' : 'flex';

  const appBadge = document.getElementById('applicant-status-badge');
  if (appBadge) {
    if (pipelineRejected)             { appBadge.textContent = 'Rejected';       appBadge.className = 'badge badge-rejected'; }
    else if (pipelineInfoRequested)   { appBadge.textContent = 'Info Requested'; appBadge.className = 'badge badge-review'; }
    else if (currentPipelineStage > 4){ appBadge.textContent = 'Approved';       appBadge.className = 'badge badge-approved'; }
    else                               { appBadge.textContent = 'Under Review';   appBadge.className = 'badge badge-pending'; }
  }

  const cb = document.getElementById('pipeline-complete-banner');
  if (cb) cb.style.display = currentPipelineStage > 4 ? 'flex' : 'none';
  const rb = document.getElementById('pipeline-rejected-banner');
  if (rb) rb.style.display = pipelineRejected ? 'flex' : 'none';
  const ib = document.getElementById('pipeline-info-banner');
  if (ib) {
    ib.style.display = pipelineInfoRequested ? 'flex' : 'none';
    const inote = document.getElementById('pipeline-info-note-text');
    if (inote) inote.textContent = pipelineInfoNote;
  }

  // Mirror state into requestor read-only pipeline (req- prefixed IDs)
  for (let i = 1; i <= 4; i++) {
    const rel = document.getElementById('req-pipeline-stage-' + i);
    if (!rel) continue;
    rel.className = 'approval-stage' + (i === 4 ? ' is-moi' : '');
    if (pipelineRejected && i === currentPipelineStage)           rel.classList.add('is-rejected');
    else if (pipelineInfoRequested && i === currentPipelineStage) rel.classList.add('is-info');
    else if (i < currentPipelineStage || currentPipelineStage > 4) rel.classList.add('is-done');
    else if (i === currentPipelineStage)                           rel.classList.add('is-active');
    else                                                           rel.classList.add('is-pending');

    const rsb = document.getElementById('req-pipeline-stage-' + i + '-badge');
    if (rsb) {
      if (pipelineRejected && i === currentPipelineStage)           { rsb.textContent = 'Rejected';       rsb.className = 'badge badge-rejected'; rsb.style.display = ''; }
      else if (pipelineInfoRequested && i === currentPipelineStage) { rsb.textContent = 'Info Requested'; rsb.className = 'badge badge-review';   rsb.style.display = ''; }
      else if (i <= currentPipelineStage) rsb.style.display = 'none';
      else { rsb.textContent = 'Pending'; rsb.className = 'badge badge-pending'; rsb.style.display = ''; }
    }
  }
  for (let i = 1; i <= 3; i++) {
    const rc = document.getElementById('req-pipeline-connector-' + i);
    if (rc) {
      rc.classList.toggle('is-done', i < currentPipelineStage && !(pipelineInfoRequested && i === currentPipelineStage));
      rc.classList.toggle('is-info', pipelineInfoRequested && i === currentPipelineStage);
    }
  }
  const rstageBadge = document.getElementById('req-pipeline-stage-badge');
  if (rstageBadge) {
    if (pipelineRejected)             { rstageBadge.textContent = 'Rejected';       rstageBadge.className = 'badge badge-rejected'; }
    else if (pipelineInfoRequested)   { rstageBadge.textContent = 'Info Requested'; rstageBadge.className = 'badge badge-review'; }
    else if (currentPipelineStage > 4){ rstageBadge.textContent = 'Approved';       rstageBadge.className = 'badge badge-approved'; }
    else                               { rstageBadge.textContent = 'Stage ' + currentPipelineStage + ' of 4'; rstageBadge.className = 'badge badge-review'; }
  }
  const rlabel = document.getElementById('req-pipeline-current-label');
  if (rlabel) {
    if (pipelineRejected)             rlabel.innerHTML = 'Status: <strong style="color:#F87171;">Rejected at ' + PIPELINE_STAGES[currentPipelineStage - 1].name + '</strong>';
    else if (pipelineInfoRequested)   rlabel.innerHTML = 'Action required: <strong style="color:#FBBF24;">Additional info needed</strong>';
    else if (currentPipelineStage > 4) rlabel.innerHTML = 'Status: <strong style="color:#4ADE80;">Fully Approved</strong>';
    else                               rlabel.innerHTML = 'Pending: <strong style="color:var(--gold);">' + PIPELINE_STAGES[currentPipelineStage - 1].name + '</strong>';
  }
  const rappBadge = document.getElementById('req-applicant-status-badge');
  if (rappBadge) {
    if (pipelineRejected)             { rappBadge.textContent = 'Rejected';       rappBadge.className = 'badge badge-rejected'; }
    else if (pipelineInfoRequested)   { rappBadge.textContent = 'Info Requested'; rappBadge.className = 'badge badge-review'; }
    else if (currentPipelineStage > 4){ rappBadge.textContent = 'Approved';       rappBadge.className = 'badge badge-approved'; }
    else                               { rappBadge.textContent = 'Under Review';   rappBadge.className = 'badge badge-pending'; }
  }
  const rcb = document.getElementById('req-pipeline-complete-banner');
  if (rcb) rcb.style.display = currentPipelineStage > 4 ? 'flex' : 'none';
  const rrb = document.getElementById('req-pipeline-rejected-banner');
  if (rrb) rrb.style.display = pipelineRejected ? 'flex' : 'none';
  const rib = document.getElementById('req-pipeline-info-banner');
  if (rib) {
    rib.style.display = pipelineInfoRequested ? 'flex' : 'none';
    const rinote = document.getElementById('req-pipeline-info-note-text');
    if (rinote) rinote.textContent = pipelineInfoNote;
  }
  const editPanel = document.getElementById('req-edit-panel');
  if (editPanel) editPanel.style.display = pipelineInfoRequested ? 'block' : 'none';
  // Sync zone done meta
  const rmeta = document.getElementById('req-pipeline-stage-2-done-meta');
  const ameta = document.getElementById('pipeline-stage-2-done-meta');
  if (rmeta && ameta) { rmeta.style.display = ameta.style.display; rmeta.innerHTML = ameta.innerHTML; }
}

function approvePipelineStage() {
  if (pipelineRejected || currentPipelineStage > 4) return;
  addPipelineTimelineEntry(PIPELINE_STAGES[currentPipelineStage - 1].name + ' approved by Sultan Al-Ahmed');
  currentPipelineStage++;
  renderPipeline();
}

function rejectPipelineStage() {
  if (pipelineRejected || currentPipelineStage > 4) return;
  pipelineRejected = true;
  addPipelineTimelineEntry('Request rejected at ' + PIPELINE_STAGES[currentPipelineStage - 1].name + ' by Sultan Al-Ahmed');
  renderPipeline();
}

function requestInfo() {
  if (pipelineRejected || pipelineInfoRequested || currentPipelineStage > 4) return;
  const textarea = document.getElementById('info-note-input');
  pipelineInfoNote = (textarea && textarea.value.trim()) ? textarea.value.trim() : 'Please provide additional documentation.';
  if (textarea) textarea.value = '';
  pipelineInfoRequested = true;
  addPipelineTimelineEntry('Info requested at ' + PIPELINE_STAGES[currentPipelineStage - 1].name + ' — awaiting applicant response');
  renderPipeline();
}

function resubmitRequest() {
  if (!pipelineInfoRequested) return;
  const textarea = document.getElementById('resubmit-note-input');
  const note = (textarea && textarea.value.trim()) ? textarea.value.trim() : '';
  if (textarea) textarea.value = '';
  pipelineInfoRequested = false;
  pipelineInfoNote = '';
  addPipelineTimelineEntry('Applicant resubmitted request' + (note ? ': ' + note : ''));
  renderPipeline();
}

function addPipelineTimelineEntry(text) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  [
    document.querySelector('#admin-page-request-detail .timeline'),
    document.getElementById('req-pipeline-timeline'),
  ].forEach(timeline => {
    if (!timeline) return;
    const item = document.createElement('div');
    item.className = 'timeline-item is-new';
    item.innerHTML = '<div class="time">' + timeStr + '</div><div class="event">' + text + '</div>';
    timeline.insertBefore(item, timeline.firstChild);
  });
}

// ============================================================
// Venue & Zone System
// ============================================================
const VENUES = [
  {
    id: 'al-bayt', name: 'Al Bayt Stadium', icon: 'stadium',
    zones: [
      { id:'field', label:'Playing Field',  desc:'Pitch & athlete tunnel',    icon:'sports_soccer',   color:'#4ADE80', sx:60,  sy:70,  sw:280, sh:120 },
      { id:'north', label:'North Stand',    desc:'General public seating',    icon:'groups',          color:'#A78BFA', sx:60,  sy:10,  sw:280, sh:60  },
      { id:'south', label:'South Stand',    desc:'General public seating',    icon:'groups',          color:'#34D399', sx:60,  sy:190, sw:280, sh:60  },
      { id:'vip',   label:'VIP Stand',      desc:'Hospitality & officials',   icon:'star',            color:'#C9A84C', sx:10,  sy:10,  sw:50,  sh:240 },
      { id:'media', label:'Media Tribune',  desc:'Accredited media seating',  icon:'newspaper',       color:'#60A5FA', sx:340, sy:10,  sw:50,  sh:115 },
      { id:'press', label:'Press Box',      desc:'Broadcast & print media',   icon:'mic',             color:'#FB923C', sx:340, sy:125, sw:50,  sh:125 },
    ]
  },
  {
    id: 'khalifa', name: 'Khalifa International Stadium', icon: 'stadium',
    zones: [
      { id:'track', label:'Track & Field',  desc:'Competition running track', icon:'directions_run',  color:'#4ADE80', sx:60,  sy:70,  sw:280, sh:120 },
      { id:'north', label:'North Stand',    desc:'General seating',           icon:'groups',          color:'#A78BFA', sx:60,  sy:10,  sw:280, sh:60  },
      { id:'south', label:'South Stand',    desc:'General seating',           icon:'groups',          color:'#34D399', sx:60,  sy:190, sw:280, sh:60  },
      { id:'vip',   label:'VIP Suite',      desc:'Executive hospitality',     icon:'star',            color:'#C9A84C', sx:10,  sy:10,  sw:50,  sh:120 },
      { id:'media', label:'Media Center',   desc:'Press & broadcast hub',     icon:'newspaper',       color:'#FB923C', sx:10,  sy:130, sw:50,  sh:120 },
      { id:'east',  label:'East Stand',     desc:'General seating east side', icon:'groups',          color:'#60A5FA', sx:340, sy:10,  sw:50,  sh:240 },
    ]
  },
  {
    id: 'aquatics', name: 'Hamad Aquatics Center', icon: 'pool',
    zones: [
      { id:'comp',   label:'Competition Pool', desc:'Main competition lanes',    icon:'pool',            color:'#38BDF8', sx:10,  sy:55,  sw:225, sh:130 },
      { id:'warmup', label:'Warm-up Pool',     desc:'Athlete preparation area',  icon:'pool',            color:'#34D399', sx:245, sy:55,  sw:145, sh:130 },
      { id:'off',    label:'Officials Area',   desc:'Judges & timing officials', icon:'manage_accounts', color:'#A78BFA', sx:10,  sy:10,  sw:380, sh:45  },
      { id:'vip',    label:'VIP Gallery',      desc:'Hospitality seating',       icon:'star',            color:'#C9A84C', sx:10,  sy:190, sw:380, sh:40  },
      { id:'media',  label:'Media Zone',       desc:'Press & broadcast area',    icon:'newspaper',       color:'#60A5FA', sx:10,  sy:232, sw:380, sh:22  },
    ]
  },
  {
    id: 'arena', name: 'Ali Bin Hamad Al-Attiyah Arena', icon: 'sports_basketball',
    zones: [
      { id:'court',  label:'Court',          desc:'Playing surface',          icon:'sports_basketball', color:'#FB923C', sx:60,  sy:60,  sw:280, sh:140 },
      { id:'north',  label:'North Stand',    desc:'Spectator seating',        icon:'groups',            color:'#A78BFA', sx:60,  sy:10,  sw:280, sh:50  },
      { id:'south',  label:'South Stand',    desc:'Spectator seating',        icon:'groups',            color:'#34D399', sx:60,  sy:200, sw:280, sh:50  },
      { id:'vip',    label:'VIP Suite',      desc:'Premium hospitality',      icon:'star',              color:'#C9A84C', sx:10,  sy:10,  sw:50,  sh:240 },
      { id:'media',  label:'Media Box',      desc:'Press & commentary',       icon:'newspaper',         color:'#60A5FA', sx:340, sy:10,  sw:50,  sh:240 },
    ]
  },
  {
    id: 'qncc', name: 'Qatar National Convention Centre', icon: 'account_balance',
    zones: [
      { id:'hall',   label:'Main Hall',      desc:'Main ceremony & events',   icon:'event',           color:'#A78BFA', sx:130, sy:10,  sw:140, sh:240 },
      { id:'vip',    label:'VIP Lounge',     desc:'Executive reception',      icon:'star',            color:'#C9A84C', sx:10,  sy:10,  sw:120, sh:120 },
      { id:'back',   label:'Backstage',      desc:'Performer & crew area',    icon:'theater_comedy',  color:'#34D399', sx:10,  sy:130, sw:120, sh:120 },
      { id:'media',  label:'Media Room',     desc:'Press conference area',    icon:'newspaper',       color:'#60A5FA', sx:270, sy:10,  sw:120, sh:120 },
      { id:'expo',   label:'Exhibition',     desc:'Display & demo area',      icon:'museum',          color:'#FB923C', sx:270, sy:130, sw:120, sh:120 },
    ]
  },
];

let activeVenueId = null;
let formSelZones  = [];
let approvedZones = [];

function getVenue(id)            { return VENUES.find(v => v.id === (id || activeVenueId || 'al-bayt')); }
function getVenueZone(zoneId)    { return getVenue()?.zones.find(z => z.id === zoneId) || { label: zoneId, icon: 'map', desc: '', color: '#888' }; }

function buildVenueMapSvg(venue, selIds, ctx) {
  const shapes = venue.zones.map(z => {
    const sel  = selIds.includes(z.id);
    const cx   = z.sx + z.sw / 2;
    const cy   = z.sy + z.sh / 2;
    const narrow = z.sw < z.sh * 0.65;
    const fs   = Math.min(Math.max(Math.min(z.sw, z.sh) / 3.5, 7), 11);
    const words = z.label.split(' ').slice(0, 2);
    let lbl;
    if (narrow) {
      lbl = `<text transform="rotate(-90 ${cx} ${cy})" x="${cx}" y="${cy}"
        text-anchor="middle" dominant-baseline="middle" font-size="${fs}"
        font-family="DM Sans,sans-serif" font-weight="600"
        class="vzone-label" style="pointer-events:none;">${z.label.slice(0, 10)}</text>`;
    } else if (z.sh < 36 || words.length === 1) {
      lbl = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
        font-size="${fs}" font-family="DM Sans,sans-serif" font-weight="600"
        class="vzone-label" style="pointer-events:none;">${words[0]}</text>`;
    } else {
      const lh = fs + 2;
      lbl = `<text text-anchor="middle" font-size="${fs}" font-family="DM Sans,sans-serif"
        font-weight="600" class="vzone-label" style="pointer-events:none;">
        <tspan x="${cx}" y="${cy - lh / 2}">${words[0]}</tspan>
        <tspan x="${cx}" y="${cy + lh / 2}">${words[1]}</tspan>
      </text>`;
    }
    return `<g class="vzone${sel ? ' vzone-sel' : ''}" style="--zc:${z.color}; cursor:pointer;"
      onclick="toggleVenueZone('${z.id}','${ctx}')">
      <rect class="vzone-rect" x="${z.sx}" y="${z.sy}" width="${z.sw}" height="${z.sh}" rx="4"/>
      ${lbl}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" width="100%" style="display:block;">
    <rect width="400" height="260" rx="8" fill="none"/>
    ${shapes}
  </svg>`;
}

function buildZoneChipGrid(venue, selIds, ctx) {
  return venue.zones.map(z => {
    const sel = selIds.includes(z.id);
    return `<div class="venue-zone-chip${sel ? ' vzchip-sel' : ''}"
      style="--zc:${z.color};" onclick="toggleVenueZone('${z.id}','${ctx}')">
      <span class="ms" style="font-size:15px; color:${sel ? '#fff' : z.color};">${z.icon}</span>
      <div style="flex:1; min-width:0;">
        <div class="vzchip-name">${z.label}</div>
        <div class="vzchip-desc">${z.desc}</div>
      </div>
      ${sel ? `<span class="ms" style="font-size:14px; color:${z.color}; margin-left:auto; flex-shrink:0;">check_circle</span>` : ''}
    </div>`;
  }).join('');
}

function onVenueChange(venueId) {
  activeVenueId = venueId || null;
  formSelZones  = [];
  // creator form
  const sec1 = document.getElementById('form-venue-section');
  if (sec1) sec1.style.display = venueId ? '' : 'none';
  // admin form
  const sec2 = document.getElementById('admin-form-venue-section');
  if (sec2) sec2.style.display = venueId ? '' : 'none';
  if (!venueId) return;
  refreshFormVenueMap();
}

function refreshFormVenueMap() {
  const venue = getVenue();
  if (!venue) return;
  // creator form
  const mapEl   = document.getElementById('form-venue-map');
  const chipsEl = document.getElementById('form-zone-chips');
  if (mapEl)   mapEl.innerHTML   = buildVenueMapSvg(venue, formSelZones, 'form');
  if (chipsEl) chipsEl.innerHTML = buildZoneChipGrid(venue, formSelZones, 'form');
  // admin form (same selections, same ctx)
  const aMapEl   = document.getElementById('admin-form-venue-map');
  const aChipsEl = document.getElementById('admin-form-zone-chips');
  if (aMapEl)   aMapEl.innerHTML   = buildVenueMapSvg(venue, formSelZones, 'form');
  if (aChipsEl) aChipsEl.innerHTML = buildZoneChipGrid(venue, formSelZones, 'form');
}

function toggleVenueZone(zoneId, ctx) {
  if (ctx === 'form') {
    const idx = formSelZones.indexOf(zoneId);
    if (idx >= 0) formSelZones.splice(idx, 1); else formSelZones.push(zoneId);
    refreshFormVenueMap();
  } else {
    const item = document.querySelector(`#zone-picker [data-zone="${zoneId}"]`);
    if (item) item.classList.toggle('selected');
    refreshAdminVenueMap();
  }
}

function initAdminVenueMap() {
  const venue = getVenue();
  if (!venue) return;
  const nameEl = document.getElementById('admin-venue-name');
  if (nameEl) nameEl.textContent = venue.name;
  const picker = document.getElementById('zone-picker');
  if (picker) {
    picker.innerHTML = venue.zones.map(z =>
      `<div class="zone-picker-item" onclick="toggleZone(this)" data-zone="${z.id}">
        <span class="ms">${z.icon}</span>
        <div class="zone-picker-name">${z.label}</div>
        <div class="zone-picker-desc">${z.desc}</div>
      </div>`
    ).join('');
  }
  refreshAdminVenueMap();
}

function refreshAdminVenueMap() {
  const venue  = getVenue();
  if (!venue) return;
  const selIds = Array.from(document.querySelectorAll('#zone-picker .zone-picker-item.selected')).map(el => el.dataset.zone);
  const mapEl  = document.getElementById('admin-venue-map');
  if (mapEl) mapEl.innerHTML = buildVenueMapSvg(venue, selIds, 'admin');
}

function toggleZone(el) {
  el.classList.toggle('selected');
  refreshAdminVenueMap();
}

function getSelectedZones() {
  return Array.from(document.querySelectorAll('#zone-picker .zone-picker-item.selected')).map(el => el.dataset.zone);
}

function approveZoneStage() {
  const zones = getSelectedZones();
  if (!zones.length) return;
  approvedZones = zones;
  updateZoneDisplays();
  addPipelineTimelineEntry('Zone Owner approved — Access granted: ' + zones.map(z => getVenueZone(z).label).join(', '));
  const meta = document.getElementById('pipeline-stage-2-done-meta');
  if (meta) { meta.style.display = ''; meta.innerHTML = zones.map(z => `<strong>${getVenueZone(z).label}</strong>`).join(' · '); }
  currentPipelineStage++;
  renderPipeline();
}

function updateZoneDisplays() {
  const zones = approvedZones.length ? approvedZones : ['field'];
  const fmt = (id, fn) => { const d = getVenueZone(id); return fn(d); };
  const azv = document.getElementById('applicant-zones-value');
  if (azv) azv.innerHTML = zones.map(z => fmt(z, d =>
    `<span class="zone-chip"><span class="ms" style="font-size:11px;">${d.icon}</span> ${d.label}</span>`
  )).join(' ');
  const mpzv = document.getElementById('modal-pass-zone-value');
  if (mpzv) mpzv.innerHTML = zones.map(z => fmt(z, d =>
    `<span class="pass-zone-chip"><span class="ms">${d.icon}</span>${d.label}</span>`
  )).join('');
  const mzc = document.getElementById('modal-zones-chips');
  if (mzc) mzc.innerHTML = zones.map(z => fmt(z, d =>
    `<div class="zone-chip-card"><span class="ms">${d.icon}</span><div><div class="zone-chip-name">${d.label}</div><div class="zone-chip-desc">${d.desc}</div></div></div>`
  )).join('');
}

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
window.setEventView          = setEventView;
window.approvePipelineStage  = approvePipelineStage;
window.rejectPipelineStage   = rejectPipelineStage;
window.requestInfo           = requestInfo;
window.resubmitRequest       = resubmitRequest;
window.showBulkUploadPage    = showBulkUploadPage;
window.goBackFromBulk        = goBackFromBulk;
window.downloadBulkTemplate  = downloadBulkTemplate;
window.renderBulkStep1       = renderBulkStep1;
window.renderBulkStep2       = renderBulkStep2;
window.renderBulkStep3       = renderBulkStep3;
window.handleBulkDrop        = handleBulkDrop;
window.handleBulkFileSelect  = handleBulkFileSelect;
window.toggleZone            = toggleZone;
window.approveZoneStage      = approveZoneStage;
window.onVenueChange         = onVenueChange;
window.toggleVenueZone       = toggleVenueZone;
window.initAdminVenueMap     = initAdminVenueMap;
window.flipPassCard = function(wrapper) {
  wrapper?.querySelector('.pass-card-inner')?.classList.toggle('flipped');
};

window.openPassPreview = function() {
  // Reset flip state each time the modal opens
  document.querySelector('#pass-preview-modal .pass-card-inner')?.classList.remove('flipped');
  updateZoneDisplays();
  openModal('pass-preview-modal');
  setTimeout(() => {
    renderQR(document.getElementById('qr-modal-pass'), 42847);
    renderQR(document.getElementById('qr-modal-side'), 42847);
    renderQR(document.getElementById('qr-pass-back'),  42847);
  }, 50);
};

// ============================================================
// Bulk Upload
// ============================================================
const BULK_SAMPLE_DATA = [
  { initials:'AH', name:'Ahmed Hassan Al-Mansouri',  passport:'QA-1988-001234', nationality:'Qatari',   event:'Asian Games 2026',    role:'Media',    dob:'15 Apr 1988', email:'ahmed.mansouri@qoc.qa',   phone:'+974 5512 3456' },
  { initials:'ST', name:'Sarah Elizabeth Thompson',   passport:'GB-1992-087654', nationality:'British',  event:'Asian Games 2026',    role:'VIP',      dob:'22 Jul 1992', email:'s.thompson@bbc.co.uk',     phone:'+44 7700 900123' },
  { initials:'KR', name:'Khalid Ibrahim Al-Rashidi',  passport:'KW-1985-034521', nationality:'Kuwaiti',  event:'Gulf Athletics 2026', role:'Athlete',  dob:'3 Nov 1985',  email:'k.rashidi@koa.kw',         phone:'+965 9876 5432' },
  { initials:'MD', name:'Maria Santos Delgado',       passport:'ES-1995-112233', nationality:'Spanish',  event:'Asian Games 2026',    role:'Staff',    dob:'18 Feb 1995', email:'m.delgado@mediagroup.es',  phone:'+34 612 345 678' },
  { initials:'YJ', name:'Yusuf Abdulrahman Al-Jabri', passport:'OM-1990-067890', nationality:'Omani',    event:'Gulf Athletics 2026', role:'Official', dob:'27 Sep 1990', email:'y.jabri@oman-sports.om',   phone:'+968 9123 4567' },
];

let bulkCtx = 'creator'; // 'creator' | 'admin'

function getBulkContainer() {
  return document.getElementById(bulkCtx + '-page-bulk-upload');
}

function showBulkUploadPage(ctx) {
  bulkCtx = ctx;
  if (ctx === 'creator') showSubPage('creator', 'bulk-upload');
  else showAdminPage('bulk-upload');
  renderBulkStep1();
}

function goBackFromBulk() {
  if (bulkCtx === 'creator') showSubPage('creator', 'my-requests');
  else showAdminPage('requests');
}

function downloadBulkTemplate() {
  const header = 'Name,Passport Number,Nationality,Event,Role,Date of Birth,Email,Phone';
  const rows = BULK_SAMPLE_DATA.map(r =>
    [r.name, r.passport, r.nationality, r.event, r.role, r.dob, r.email, r.phone].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'qoc_bulk_upload_template.csv' });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  // Highlight the upload zone after a short delay
  setTimeout(() => {
    const dz = getBulkContainer()?.querySelector('.bulk-drop-zone');
    if (dz) { dz.style.borderColor = 'var(--gold)'; setTimeout(() => { dz.style.borderColor = ''; }, 1200); }
  }, 400);
}

function renderBulkStepper(step) {
  const steps = ['Prepare', 'Review', 'Submit'];
  return `<div class="bulk-stepper">${steps.map((s, i) => {
    const n = i + 1;
    const cls = n < step ? 'is-done' : n === step ? 'is-active' : '';
    const icon = n < step ? '<span class="ms" style="font-size:14px;">check</span>' : n;
    return `${i > 0 ? `<div class="bulk-step-line${n <= step ? ' is-done' : ''}"></div>` : ''}
    <div class="bulk-step-item ${cls}"><div class="bulk-step-num">${icon}</div><span>${s}</span></div>`;
  }).join('')}</div>`;
}

function renderBulkStep1() {
  const c = getBulkContainer(); if (!c) return;
  c.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="btn btn-ghost btn-sm" onclick="goBackFromBulk()" style="margin-right:8px;"><span class="ms">arrow_back</span></button>
        <h1>Bulk Upload</h1>
      </div>
      <span style="font-size:12px; color:var(--text-muted);">Create multiple accreditation requests at once</span>
    </div>
    ${renderBulkStepper(1)}
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start;">
      <div class="glass-card">
        <div class="card-header">
          <div><h3>Download Template</h3><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Pre-filled with 5 sample records</div></div>
          <span class="badge badge-approved" style="font-size:10px;">CSV / XLSX</span>
        </div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:18px;line-height:1.6;">Use the official QOC accreditation template to prepare your requests. The file includes 5 ready-to-use sample records across two events.</p>
          <div class="bulk-field-list">
            ${['Full Name','Passport Number','Nationality','Event Name','Role / Category','Date of Birth','Email Address','Phone Number'].map(f =>
              `<div class="bulk-field-item"><span class="ms">check_circle</span><span>${f}</span></div>`).join('')}
          </div>
          <button class="btn btn-primary" onclick="downloadBulkTemplate()"><span class="ms">download</span> Download Template</button>
          <div style="font-size:11px;color:var(--text-muted);margin-top:10px;">Supported formats: .csv, .xlsx &nbsp;·&nbsp; Max size: 10 MB</div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-header"><div><h3>Upload File</h3><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Drop the completed template here</div></div></div>
        <div class="card-body">
          <div class="bulk-drop-zone" id="bulk-drop-zone"
               ondragover="event.preventDefault(); this.classList.add('drag-active')"
               ondragleave="this.classList.remove('drag-active')"
               ondrop="handleBulkDrop(event)"
               onclick="document.getElementById('bulk-file-input').click()">
            <span class="ms" style="font-size:48px; color:var(--text-muted); display:block; margin-bottom:12px;">cloud_upload</span>
            <div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:6px;">Drag & drop your file here</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">or click to browse</div>
            <button class="btn btn-ghost" onclick="event.stopPropagation(); document.getElementById('bulk-file-input').click()">
              <span class="ms">folder_open</span> Browse Files
            </button>
            <input id="bulk-file-input" type="file" accept=".csv,.xlsx" style="display:none;" onchange="handleBulkFileSelect(event)">
            <div style="font-size:11px;color:var(--text-muted);margin-top:16px;">.csv &nbsp;·&nbsp; .xlsx &nbsp;·&nbsp; Max 10 MB</div>
          </div>
          <div style="margin-top:16px; padding:12px 14px; background:var(--surface-2); border-radius:var(--radius-md); border:1px solid var(--border);">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Quick tip</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">Download the template first, fill in your records (or use the sample data), then upload it here to proceed.</div>
          </div>
        </div>
      </div>
    </div>`;
}

function handleBulkDrop(event) {
  event.preventDefault();
  document.getElementById('bulk-drop-zone')?.classList.remove('drag-active');
  const file = event.dataTransfer?.files?.[0];
  if (file) processBulkFile(file.name);
}

function handleBulkFileSelect(event) {
  const file = event.target?.files?.[0];
  if (file) processBulkFile(file.name);
}

function processBulkFile(filename) {
  // Show processing indicator briefly, then show review
  const dz = getBulkContainer()?.querySelector('.bulk-drop-zone');
  if (dz) {
    dz.classList.add('has-file');
    dz.innerHTML = `
      <span class="ms" style="font-size:40px;color:#4ADE80;display:block;margin-bottom:10px;">check_circle</span>
      <div style="font-size:14px;font-weight:600;color:#4ADE80;margin-bottom:4px;">${filename}</div>
      <div style="font-size:12px;color:var(--text-muted);">Reading records...</div>`;
  }
  setTimeout(() => renderBulkStep2(filename), 900);
}

function renderBulkStep2(filename) {
  const c = getBulkContainer(); if (!c) return;
  const roleColors = { Media:'role-media', VIP:'role-vip', Athlete:'role-athlete', Staff:'role-staff', Official:'role-staff' };
  const rows = BULK_SAMPLE_DATA.map((r, i) => `
    <div class="bulk-table-row">
      <span class="bulk-row-num">${i+1}</span>
      <div class="bulk-row-name"><div class="bulk-row-avatar">${r.initials}</div><span title="${r.name}">${r.name}</span></div>
      <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${r.passport}</span>
      <span style="font-size:12px;color:var(--text-secondary);">${r.nationality}</span>
      <span style="font-size:12px;color:var(--text-secondary);">${r.event}</span>
      <span class="role-tag ${roleColors[r.role]||'role-staff'}" style="font-size:10px;">${r.role}</span>
      <span class="bulk-valid-badge"><span class="ms">check_circle</span> Valid</span>
    </div>`).join('');
  c.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="btn btn-ghost btn-sm" onclick="renderBulkStep1()" style="margin-right:8px;"><span class="ms">arrow_back</span></button>
        <h1>Bulk Upload</h1>
      </div>
    </div>
    ${renderBulkStepper(2)}
    <div class="bulk-summary-bar">
      <div class="bulk-stat"><div class="bulk-stat-num">5</div><div class="bulk-stat-label">Records</div></div>
      <div class="bulk-stat-divider"></div>
      <div class="bulk-stat"><div class="bulk-stat-num is-valid">5</div><div class="bulk-stat-label">Valid</div></div>
      <div class="bulk-stat-divider"></div>
      <div class="bulk-stat"><div class="bulk-stat-num" style="color:var(--text-muted);">0</div><div class="bulk-stat-label">Errors</div></div>
      <div class="bulk-stat-filename"><span class="ms" style="font-size:14px;">description</span> ${filename || 'qoc_bulk_upload_template.csv'}</div>
    </div>
    <div class="glass-card">
      <div class="card-header">
        <div><h3>Preview Records</h3><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Review all records before submitting</div></div>
        <span class="badge badge-approved">All Valid</span>
      </div>
      <div class="bulk-table-wrap">
        <div class="bulk-table-head">
          <span>#</span><span>Applicant</span><span>Passport</span><span>Country</span><span>Event</span><span>Role</span><span>Status</span>
        </div>
        ${rows}
      </div>
      <div class="card-body" style="padding-top:0; padding-bottom:16px;">
        <div class="bulk-actions-bar">
          <button class="btn btn-ghost" onclick="renderBulkStep1()"><span class="ms">arrow_back</span> Back</button>
          <button class="btn btn-primary" style="gap:8px;" onclick="renderBulkStep3()">
            <span class="ms">send</span> Submit 5 Requests
            <span style="background:rgba(255,255,255,0.2);border-radius:20px;padding:1px 8px;font-size:11px;font-weight:700;">5</span>
          </button>
        </div>
      </div>
    </div>`;
}

function renderBulkStep3() {
  const c = getBulkContainer(); if (!c) return;
  const items = BULK_SAMPLE_DATA.map((r, i) => `
    <div class="bulk-progress-item" id="bulk-prog-${i}">
      <div class="bulk-progress-avatar">${r.initials}</div>
      <div class="bulk-progress-info">
        <div class="bulk-progress-name">${r.name}</div>
        <div class="bulk-progress-meta">${r.event} &nbsp;·&nbsp; ${r.role}</div>
      </div>
      <div class="bulk-progress-status pending" id="bulk-prog-status-${i}">Pending</div>
    </div>`).join('');
  c.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Submitting Requests…</h1></div>
      <span id="bulk-prog-badge" class="badge badge-review">0 / 5</span>
    </div>
    ${renderBulkStepper(3)}
    <div class="glass-card">
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:var(--text-muted);" id="bulk-prog-label">Starting…</span>
          <span style="font-size:13px;font-weight:700;" id="bulk-prog-count">0 / 5</span>
        </div>
        <div class="bulk-progress-track"><div class="bulk-progress-fill" id="bulk-prog-bar" style="width:0%"></div></div>
        ${items}
      </div>
    </div>`;
  // Animate each record sequentially
  let done = 0;
  function processNext(i) {
    if (i >= BULK_SAMPLE_DATA.length) { setTimeout(renderBulkComplete, 600); return; }
    const item = document.getElementById('bulk-prog-' + i);
    const status = document.getElementById('bulk-prog-status-' + i);
    if (item) item.classList.add('is-processing');
    if (status) { status.className = 'bulk-progress-status processing'; status.innerHTML = '<span class="spin ms" style="font-size:16px;">refresh</span> Processing'; }
    const label = document.getElementById('bulk-prog-label');
    if (label) label.textContent = 'Processing: ' + BULK_SAMPLE_DATA[i].name;
    setTimeout(() => {
      if (item) { item.classList.remove('is-processing'); item.classList.add('is-done'); }
      if (status) { status.className = 'bulk-progress-status done'; status.innerHTML = '<span class="ms" style="font-size:16px;">check_circle</span> Submitted'; }
      done++;
      const bar = document.getElementById('bulk-prog-bar');
      const badge = document.getElementById('bulk-prog-badge');
      const count = document.getElementById('bulk-prog-count');
      if (bar)   bar.style.width = (done / BULK_SAMPLE_DATA.length * 100) + '%';
      if (badge) badge.textContent = done + ' / ' + BULK_SAMPLE_DATA.length;
      if (count) count.textContent = done + ' / ' + BULK_SAMPLE_DATA.length;
      processNext(i + 1);
    }, 700);
  }
  setTimeout(() => processNext(0), 300);
}

function renderBulkComplete() {
  const c = getBulkContainer(); if (!c) return;
  const backPage = bulkCtx === 'creator' ? "showSubPage('creator','my-requests')" : "showAdminPage('requests')";
  c.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Bulk Upload</h1></div>
    </div>
    ${renderBulkStepper(4)}
    <div class="glass-card" style="max-width:540px;margin:0 auto;">
      <div class="card-body">
        <div class="bulk-complete-box">
          <div class="bulk-complete-icon"><span class="ms" style="font-size:36px;color:#4ADE80;">check_circle</span></div>
          <h2 style="font-family:var(--font-display);font-size:22px;margin-bottom:8px;">5 Requests Submitted!</h2>
          <p style="font-size:14px;color:var(--text-secondary);margin-bottom:28px;line-height:1.6;">All requests are now in the approval pipeline and will be reviewed by the relevant approvers.</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:28px;text-align:left;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-md);border:1px solid var(--border);">
              <span style="font-size:13px;color:var(--text-secondary);">Asian Games 2026</span>
              <span class="badge badge-pending">3 requests</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-md);border:1px solid var(--border);">
              <span style="font-size:13px;color:var(--text-secondary);">Gulf Athletics 2026</span>
              <span class="badge badge-pending">2 requests</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="${backPage}"><span class="ms">folder_open</span> View Requests</button>
            <button class="btn btn-ghost" onclick="showBulkUploadPage('${bulkCtx}')"><span class="ms">upload_file</span> Upload More</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ============================================================
// Initialize
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  showScreen('creator-dashboard');
});
