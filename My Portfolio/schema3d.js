/* ═══════════════════════════════════════════════════════════════
   Star schema, in 3D — a fact table at the centre with conformed
   dimensions orbiting it, joined by relationship lines.

   Drag to rotate (with inertia). Theme- and motion-aware: reduced
   motion stops the idle spin but keeps the model drawn and draggable.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const DIMS = ['DIM_DATE', 'DIM_PRODUCT', 'DIM_CUSTOMER', 'DIM_STORE', 'DIM_CHANNEL'];
const RADIUS = 3.5;

const PALETTE = {
  dark: { fact: 0x22d3ee, dim: 0x8b5cf6, line: 0x5a6a86, label: '#f0f2f7', chip: 'rgba(12,14,22,.85)', ambient: 1.2, dir: 2 },
  light: { fact: 0x0090b0, dim: 0x6d4aff, line: 0x9aa4b8, label: '#10131a', chip: 'rgba(255,255,255,.9)', ambient: 1.9, dir: 2.6 },
};

/* A label rendered to a 2D canvas, used as a sprite texture. */
function makeLabel(text, P, renderer) {
  const pad = 22;
  const fs = 40;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `500 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fs + pad * 2;
  c.width = w;
  c.height = h;

  const g = c.getContext('2d');
  g.font = `500 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
  g.textBaseline = 'middle';
  g.fillStyle = P.chip;
  g.beginPath();
  g.roundRect(0, 0, w, h, 16);
  g.fill();
  g.fillStyle = P.label;
  g.fillText(text, pad, h / 2 + 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set((w / h) * 0.62, 0.62, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export function initSchema(canvas, { theme = 'dark', motion = true } = {}) {
  if (!canvas) return null;
  let P = PALETTE[theme] || PALETTE.dark;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.6, 11);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, P.ambient);
  const dir = new THREE.DirectionalLight(0xffffff, P.dir);
  dir.position.set(4, 8, 7);
  const back = new THREE.DirectionalLight(0xffffff, 0.7);
  back.position.set(-5, -3, -6);
  scene.add(ambient, dir, back);

  const world = new THREE.Group();
  scene.add(world);

  /* ── Fact table ──────────────────────────────────────────── */
  const factMat = new THREE.MeshStandardMaterial({ color: P.fact, roughness: 0.3, metalness: 0.1 });
  const fact = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.1, 1.7), factMat);
  world.add(fact);

  const factEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(fact.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  );
  fact.add(factEdges);

  const factLabel = makeLabel('FACT_SALES', P, renderer);
  factLabel.position.set(0, 1.25, 0);
  world.add(factLabel);

  /* ── Dimensions + relationship lines ─────────────────────── */
  const dimMat = new THREE.MeshStandardMaterial({ color: P.dim, roughness: 0.35, metalness: 0.1 });
  const lineMat = new THREE.LineBasicMaterial({ color: P.line, transparent: true, opacity: 0.55 });
  const dimGeo = new THREE.BoxGeometry(1.15, 0.62, 1.15);
  const nodes = [];
  const labels = [];
  const edgeMats = [];

  DIMS.forEach((name, i) => {
    const a = (i / DIMS.length) * Math.PI * 2;
    const x = Math.cos(a) * RADIUS;
    const z = Math.sin(a) * RADIUS;
    const y = Math.sin(i * 1.7) * 0.6;

    const node = new THREE.Mesh(dimGeo, dimMat);
    node.position.set(x, y, z);
    world.add(node);
    nodes.push(node);

    const em = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    node.add(new THREE.LineSegments(new THREE.EdgesGeometry(dimGeo), em));
    edgeMats.push(em);

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]),
      lineMat
    );
    world.add(line);

    const label = makeLabel(name, P, renderer);
    label.position.set(x, y + 0.75, z);
    world.add(label);
    labels.push({ sprite: label, name, pos: new THREE.Vector3(x, y + 0.75, z) });
  });

  /* ── Drag to rotate, with inertia ────────────────────────── */
  let spinX = 0.28;
  let spinY = 0;
  let velY = 0;
  let velX = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let animate = motion;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    play();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.005;
    velX = (e.clientY - lastY) * 0.005;
    spinY += velY;
    spinX = Math.max(-0.9, Math.min(0.9, spinX + velX));
    lastX = e.clientX;
    lastY = e.clientY;
    if (!animate) draw();
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!animate) draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let t = 0;

  function draw() {
    if (!dragging) {
      // Inertia after a flick, then a slow idle drift.
      velY *= 0.94;
      velX *= 0.94;
      spinY += velY;
      spinX = Math.max(-0.9, Math.min(0.9, spinX + velX));
      if (animate && Math.abs(velY) < 0.0008) spinY += 0.0022;
    }

    world.rotation.y = spinY;
    world.rotation.x = spinX;

    // Bob the dimension nodes and keep the labels facing the camera.
    nodes.forEach((n, i) => {
      n.position.y = Math.sin(i * 1.7) * 0.6 + Math.sin(t * 0.9 + i) * 0.12;
      n.rotation.y = -spinY;
      labels[i].sprite.position.y = n.position.y + 0.75;
    });
    fact.rotation.y = -spinY + Math.sin(t * 0.35) * 0.15;

    renderer.render(scene, camera);
  }

  const clock = new THREE.Clock();
  let raf = null;
  let visible = true;
  let awake = true;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    t += Math.min(clock.getDelta(), 0.05);
    draw();
    // With motion off the loop exists only to play out drag inertia —
    // once that has decayed, stop rather than spin a rAF forever.
    if (!animate && !dragging && Math.abs(velY) < 5e-4 && Math.abs(velX) < 5e-4) pause();
  };
  function play() {
    if (raf !== null || !visible || !awake) return;
    if (!animate && !dragging) return;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }
  const pause = () => {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  };

  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      visible ? play() : pause();
    },
    { threshold: 0 }
  );
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    awake = !document.hidden;
    awake ? play() : pause();
  });

  resize();
  draw();
  play();

  return {
    setTheme(next) {
      P = PALETTE[next] || PALETTE.dark;
      factMat.color.setHex(P.fact);
      dimMat.color.setHex(P.dim);
      lineMat.color.setHex(P.line);
      ambient.intensity = P.ambient;
      dir.intensity = P.dir;
      const edgeOpacity = next === 'light' ? 0.18 : 0.32;
      factEdges.material.opacity = edgeOpacity;
      edgeMats.forEach((m) => (m.opacity = edgeOpacity));

      // Labels are baked bitmaps — rebuild them for the new theme.
      factLabel.material.map.dispose();
      factLabel.material.dispose();
      const nf = makeLabel('FACT_SALES', P, renderer);
      factLabel.material = nf.material;
      labels.forEach((l) => {
        l.sprite.material.map.dispose();
        l.sprite.material.dispose();
        l.sprite.material = makeLabel(l.name, P, renderer).material;
      });
      draw();
    },
    setMotion(on) {
      animate = on;
      if (on) play();
      else {
        pause();
        draw();
      }
    },
    destroy() {
      pause();
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
    },
  };
}
