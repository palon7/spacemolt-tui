import './map.css';

// ── display settings ───────────────────────────────────────────────────
const NODE_SCALE = 80;
const NODE_HIT_RADIUS = 20;
const EDGE_WIDTH = 4;
const LABEL_SIZE = 16;
const COLOR_DEST = '#cc44ff';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const infoEl = document.getElementById('info')!;
const connStatusEl = document.getElementById('conn-status')!;
const tooltipEl = document.getElementById('tooltip')!;

// ── types ───────────────────────────────────────────────────────────────
interface System {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  is_stronghold?: boolean;
  is_home?: boolean;
  empire?: string;
  empire_color?: string;
}

interface GameState {
  connected: boolean;
  loggedIn: boolean;
  current_system: string | null;
  travel_destination: string | null;
  travel_progress: number | null;
  travel_type: string | null;
  route: string[];
}

// ── state ──────────────────────────────────────────────────────────────
let systems: System[] = [];
let sysById = new Map<string, System>();
let gameState: GameState = {
  connected: false,
  loggedIn: false,
  current_system: null,
  travel_destination: null,
  travel_progress: null,
  travel_type: null,
  route: [],
};
const transform = { panX: 0, panY: 0, scale: 1 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let hoverSys: System | null = null;
let animFrame: number | null = null;

// ── map data ───────────────────────────────────────────────────────────
fetch('/api/map')
  .then((r) => r.json())
  .then((data) => {
    systems = data.systems ?? [];
    sysById = new Map(systems.map((s) => [s.id, s]));
    resize();
    initTransform();
    scheduleRedraw();
  })
  .catch(() => {
    connStatusEl.textContent = 'failed to load map';
    connStatusEl.className = 'val err';
  });

// ── SSE ────────────────────────────────────────────────────────────────
function connectSSE(): void {
  const es = new EventSource('/events');
  es.onmessage = (e) => {
    try {
      gameState = JSON.parse(e.data);
    } catch {
      return;
    }
    updateInfo();
    scheduleRedraw();
  };
  es.onerror = () => {
    gameState.connected = false;
    updateInfo();
  };
}
connectSSE();

// ── canvas sizing ──────────────────────────────────────────────────────
function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scheduleRedraw();
}
window.addEventListener('resize', resize);

// ── coordinate transforms ──────────────────────────────────────────────
function worldToScreen(wx: number, wy: number): { x: number; y: number } {
  return {
    x: wx * transform.scale + transform.panX,
    y: wy * transform.scale + transform.panY,
  };
}

function screenToWorld(sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx - transform.panX) / transform.scale,
    y: (sy - transform.panY) / transform.scale,
  };
}

function initTransform(): void {
  if (!systems.length) return;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const s of systems) {
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.y > maxY) maxY = s.y;
  }
  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const margin = 0.87;
  const scale = Math.min((canvas.width / worldW) * margin, (canvas.height / worldH) * margin);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  transform.scale = scale;
  transform.panX = canvas.width / 2 - cx * scale;
  transform.panY = canvas.height / 2 - cy * scale;
}

// ── zoom ───────────────────────────────────────────────────────────────
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const mx = e.offsetX,
      my = e.offsetY;
    const w = screenToWorld(mx, my);
    transform.scale = Math.max(0.002, Math.min(80, transform.scale * factor));
    transform.panX = mx - w.x * transform.scale;
    transform.panY = my - w.y * transform.scale;
    scheduleRedraw();
  },
  { passive: false },
);

// ── pan ────────────────────────────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX - transform.panX, y: e.clientY - transform.panY };
  canvas.classList.add('dragging');
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    transform.panX = e.clientX - dragStart.x;
    transform.panY = e.clientY - dragStart.y;
    scheduleRedraw();
    return;
  }

  // hover detection
  const w = screenToWorld(e.clientX, e.clientY);
  const hitR = NODE_HIT_RADIUS / transform.scale;
  let closest: System | null = null;
  let minDist = hitR;
  for (const s of systems) {
    const dx = s.x - w.x,
      dy = s.y - w.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) {
      minDist = d;
      closest = s;
    }
  }
  if (closest !== hoverSys) {
    hoverSys = closest;
    scheduleRedraw();
  }
  if (hoverSys) {
    const p = worldToScreen(hoverSys.x, hoverSys.y);
    let label = hoverSys.name;
    if (hoverSys.is_home) label += ' \u2605';
    if (hoverSys.id === gameState.current_system) label += ' \u25C0 here';
    tooltipEl.textContent = label;
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = p.x + 14 + 'px';
    tooltipEl.style.top = p.y - 8 + 'px';
  } else {
    tooltipEl.style.display = 'none';
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.classList.remove('dragging');
});

// double-click to center on hovered system
canvas.addEventListener('dblclick', () => {
  if (!hoverSys) return;
  transform.panX = canvas.width / 2 - hoverSys.x * transform.scale;
  transform.panY = canvas.height / 2 - hoverSys.y * transform.scale;
  scheduleRedraw();
});

// ── draw ───────────────────────────────────────────────────────────────
function scheduleRedraw(): void {
  if (!animFrame) animFrame = requestAnimationFrame(draw);
}

function draw(): void {
  animFrame = null;
  const W = canvas.width,
    H = canvas.height;

  // background
  ctx.fillStyle = '#08080f';
  ctx.fillRect(0, 0, W, H);

  if (!systems.length) {
    ctx.fillStyle = '#334';
    ctx.font = '18px monospace';
    ctx.fillText('Loading map data\u2026', 20, 40);
    return;
  }

  const currentSys = gameState.current_system ? sysById.get(gameState.current_system) : null;
  const destSys = gameState.travel_destination
    ? (sysById.get(gameState.travel_destination) ?? null)
    : null;

  // ── edges ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(70, 90, 130, 0.22)';
  ctx.lineWidth = EDGE_WIDTH;
  const drawn = new Set<string>();
  for (const sys of systems) {
    const a = worldToScreen(sys.x, sys.y);
    for (const cid of sys.connections) {
      const key = sys.id < cid ? sys.id + ':' + cid : cid + ':' + sys.id;
      if (drawn.has(key)) continue;
      drawn.add(key);
      const csys = sysById.get(cid);
      if (!csys) continue;
      const b = worldToScreen(csys.x, csys.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // ── route history ──────────────────────────────────────────────────
  if (gameState.route.length >= 2) {
    ctx.strokeStyle = 'rgba(0, 200, 180, 0.5)';
    ctx.lineWidth = EDGE_WIDTH;
    ctx.beginPath();
    let started = false;
    for (const id of gameState.route) {
      const s = sysById.get(id);
      if (!s) continue;
      const p = worldToScreen(s.x, s.y);
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  // ── travel line ─────────────────────────────────────────────────────
  if (currentSys && destSys) {
    const a = worldToScreen(currentSys.x, currentSys.y);
    const b = worldToScreen(destSys.x, destSys.y);

    ctx.strokeStyle = 'rgba(255, 140, 0, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (gameState.travel_progress != null) {
      const p = gameState.travel_progress;
      const px = a.x + (b.x - a.x) * p;
      const py = a.y + (b.y - a.y) * p;
      ctx.beginPath();
      ctx.arc(px, py, transform.scale * NODE_SCALE, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8c00';
      ctx.fill();
    }
  }

  // ── nodes ───────────────────────────────────────────────────────────
  const baseR = transform.scale * NODE_SCALE;
  const labelThreshold = 0.045;

  for (const sys of systems) {
    const p = worldToScreen(sys.x, sys.y);

    // skip if far off-screen
    if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;

    const isCurrent = sys === currentSys;
    const isDest = sys === destSys;
    const isHover = sys === hoverSys;
    const isStronghold = !!sys.is_stronghold;

    const empireColor = sys.empire_color;
    const isCapital = !!sys.is_home;

    let color;
    if (isCurrent) color = '#00ff88';
    else if (isDest) color = COLOR_DEST;
    else if (isHover) color = '#6688ff';
    else if (empireColor) color = empireColor;
    else if (isStronghold) color = '#aa8833';
    else color = '#2a3550';

    // glow for current
    if (isCurrent) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR * 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.12)';
      ctx.fill();
    }
    if (isDest && !isCurrent) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 68, 255, 0.1)';
      ctx.fill();
    }

    const r =
      isCurrent || isDest
        ? baseR * 2
        : isStronghold
          ? baseR * 1.5
          : isCapital
            ? baseR * 1.5
            : baseR;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // labels: always show for current/dest/hover, otherwise only when zoomed in
    const showLabel =
      isCurrent ||
      isDest ||
      isHover ||
      isCapital ||
      (isStronghold && transform.scale > labelThreshold);
    if (showLabel) {
      const fontSize = Math.min(
        LABEL_SIZE * 1.3,
        Math.max(LABEL_SIZE * 0.9, transform.scale * LABEL_SIZE),
      );
      ctx.font = `${fontSize}px monospace`;
      const labelColor =
        isCurrent ? '#00ff88'
        : isDest ? COLOR_DEST
        : isStronghold ? '#ccaa55'
        : empireColor ?? '#8899bb';
      ctx.fillStyle = labelColor;
      let label = sys.name;
      ctx.fillText(label, p.x + r + 4, p.y + 4);
    }
  }
}

// ── DOM helpers ─────────────────────────────────────────────────────────
function createInfoRow(
  labelText: string,
  valueText: string,
  valueClass: string,
  topMargin = false,
): DocumentFragment {
  const frag = document.createDocumentFragment();
  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  if (topMargin) labelDiv.style.marginTop = '6px';
  labelDiv.textContent = labelText;
  const valDiv = document.createElement('div');
  valDiv.className = `val ${valueClass}`;
  valDiv.textContent = valueText;
  frag.appendChild(labelDiv);
  frag.appendChild(valDiv);
  return frag;
}

// ── info panel ─────────────────────────────────────────────────────────
function updateInfo(): void {
  const gs = gameState;

  // clear existing content
  infoEl.textContent = '';

  const connClass = gs.connected && gs.loggedIn ? 'ok' : gs.connected ? 'warn' : 'err';
  const connText =
    gs.connected && gs.loggedIn ? 'connected' : gs.connected ? 'logging in\u2026' : 'disconnected';
  infoEl.appendChild(createInfoRow('connection', connText, connClass));

  if (gs.current_system) {
    const sys = sysById.get(gs.current_system);
    const name = sys ? sys.name : gs.current_system;
    infoEl.appendChild(createInfoRow('location', name, 'ok', true));
  }

  if (gs.travel_destination) {
    const dst = sysById.get(gs.travel_destination);
    const dname = dst ? dst.name : gs.travel_destination;
    const pct = gs.travel_progress != null ? ` (${Math.round(gs.travel_progress * 100)}%)` : '';
    const type = gs.travel_type ? ` [${gs.travel_type}]` : '';
    infoEl.appendChild(createInfoRow(`traveling${type}`, `\u2192 ${dname}${pct}`, 'warn', true));
  }

  // scroll to center on current system when it changes
  if (gs.current_system && systems.length) {
    const sys = sysById.get(gs.current_system);
    if (sys && !isDragging) {
      const p = worldToScreen(sys.x, sys.y);
      const m = 80;
      const offscreen = p.x < m || p.x > canvas.width - m || p.y < m || p.y > canvas.height - m;
      if (offscreen) {
        transform.panX = canvas.width / 2 - sys.x * transform.scale;
        transform.panY = canvas.height / 2 - sys.y * transform.scale;
      }
    }
  }
}
