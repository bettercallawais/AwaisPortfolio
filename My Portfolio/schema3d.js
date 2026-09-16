/* ═══════════════════════════════════════════════════════════════
   Star schema, in 3D — a fact table at the centre with conformed
   dimensions orbiting it, joined by relationship lines.

   · Assembles as it scrolls into view: dimensions travel out from the
     fact table and their joins draw behind them.
   · Rows flow: small packets run along every join into the fact table,
     the way foreign keys feed it.
   · Hover lifts a table, click or tap selects it (and tells the page,
     which fills the inspector). Drag rotates, with inertia.

   Theme- and motion-aware: reduced motion shows the model fully
   assembled and still, but it stays draggable and selectable.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const FACT = 'FACT_SALES';
const DIMS = ['DIM_DATE', 'DIM_PRODUCT', 'DIM_CUSTOMER', 'DIM_STORE', 'DIM_CHANNEL'];
const RADIUS = 3.5;
const PACKETS_PER_JOIN = 3;

const PALETTE = {
  dark: {
    fact: 0x5f79d4, dim: 0x2a3452, line: 0x3b4666, lineOn: 0x93aaf2, packet: 0xc6d3ff,
    label: '#eceff6', labelOn: '#080a12', chip: 'rgba(9,12,20,.88)', chipOn: '#93aaf2',
    emissive: 0x7f98e6, emissiveOn: 0.22, ambient: 0.85, dir: 1.9, edge: 0.34,
  },
  light: {
    fact: 0x3a52b4, dim: 0x98a5c3, line: 0x8995b0, lineOn: 0x3a52b4, packet: 0x3a52b4,
    label: '#121726', labelOn: '#ffffff', chip: 'rgba(255,255,255,.94)', chipOn: '#3a52b4',
    emissive: 0x3a52b4, emissiveOn: 0.16, ambient: 1.9, dir: 2.5, edge: 0.2,
  },
};

const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/* A label rendered to a 2D canvas at 2x, used as a sprite texture. */
function makeLabel(text, P, renderer, on) {
  const S = 2;
  const pad = 20 * S;
  const fs = 30 * S;
  const font = `500 ${fs}px "Geist Mono", ui-monospace, monospace`;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width) + pad * 2;
  const h = fs + pad * 1.6;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.font = font;
  g.textBaseline = 'middle';
  g.fillStyle = on ? P.chipOn : P.chip;
  g.beginPath();
  g.roundRect(0, 0, w, h, h / 2);
  g.fill();
  g.fillStyle = on ? P.labelOn : P.label;
  g.fillText(text, pad, h / 2 + S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const height = 0.5;
  return { mat, scale: [(w / h) * height, height] };
}

export function initSchema(canvas, { theme = 'dark', motion = true, selected = FACT, onSelect } = {}) {
  if (!canvas) return null;
  let P = PALETTE[theme] || PALETTE.dark;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  const ambient = new THREE.AmbientLight(0xffffff, P.ambient);
  const dir = new THREE.DirectionalLight(0xffffff, P.dir);
  dir.position.set(4, 8, 7);
  const back = new THREE.DirectionalLight(0xffffff, 0.7);
  back.position.set(-5, -3, -6);
  scene.add(ambient, dir, back);

  const world = new THREE.Group();
  scene.add(world);

  /* ── Tables ──────────────────────────────────────────────── */
  const tables = []; // { name, mesh, mat, edgeMat, sprite, target, line?, lineMat?, scale }

  const addTable = (name, geo, color, target) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.12, emissive: P.emissive, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.name = name;
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: P.edge });
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    world.add(mesh);

    const sprite = new THREE.Sprite();
    sprite.renderOrder = 10;
    world.add(sprite);

    const entry = { name, mesh, mat, edgeMat, sprite, target, scale: 1, lift: 0 };
    tables.push(entry);
    return entry;
  };

  const fact = addTable(FACT, new THREE.BoxGeometry(1.7, 1.1, 1.7), P.fact, new THREE.Vector3(0, 0, 0));
  const dimGeo = new THREE.BoxGeometry(1.15, 0.62, 1.15);

  DIMS.forEach((name, i) => {
    const a = (i / DIMS.length) * Math.PI * 2 - Math.PI / 2;
    const target = new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(i * 1.7) * 0.55, Math.sin(a) * RADIUS);
    const entry = addTable(name, dimGeo, P.dim, target);

    entry.lineMat = new THREE.LineBasicMaterial({ color: P.line, transparent: true, opacity: 0.55 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    entry.line = new THREE.Line(lineGeo, entry.lineMat);
    world.add(entry.line);
  });
  const dims = tables.filter((t) => t !== fact);

  /* ── Packets (rows flowing along each join) ──────────────── */
  const packetMat = new THREE.MeshBasicMaterial({
    color: P.packet,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const packets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 12, 8), packetMat, DIMS.length * PACKETS_PER_JOIN);
  packets.frustumCulled = false;
  world.add(packets);
  const pd = new THREE.Object3D();
  const wp = new THREE.Vector3();

  /* ── Labels (rebuilt on theme, selection, and font load) ─── */
  let current = DIMS.includes(selected) || selected === FACT ? selected : FACT;
  let labelScale = 1;
  const buildLabels = () => {
    tables.forEach((tb) => {
      const { mat, scale } = makeLabel(tb.name, P, renderer, tb.name === current);
      tb.sprite.material.map?.dispose();
      tb.sprite.material.dispose();
      tb.sprite.material = mat;
      tb.sprite.userData.base = scale;
      tb.sprite.scale.set(scale[0] * labelScale, scale[1] * labelScale, 1);
    });
  };
  buildLabels();
  // The label bitmaps need the real mono face, which can land after init.
  document.fonts?.load('500 60px "Geist Mono"').then(() => {
    buildLabels();
    request();
  });

  /* ── Assembly progress (latched: once built, it stays built) ── */
  let built = motion ? 0 : 1;
  const readProgress = () => {
    if (!animate) return (built = 1);
    const r = canvas.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp01((vh * 0.92 - r.top) / (r.height * 0.85));
    built = Math.max(built, p);
    return built;
  };

  /* ── Pointer: drag to rotate, hover to lift, click to select ── */
  let spinX = 0.34;
  let spinY = 0.35;
  let velY = 0;
  let velX = 0;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let hovered = null;
  let animate = motion;

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(tables.map((tb) => tb.mesh), false)[0];
    return hit ? hit.object.userData.name : null;
  };

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    play();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      velY = dx * 0.005;
      velX = dy * 0.005;
      spinY += velY;
      spinX = Math.max(-0.2, Math.min(0.95, spinX + velX));
      lastX = e.clientX;
      lastY = e.clientY;
      request();
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const name = pick(e);
    if (name !== hovered) {
      hovered = name;
      canvas.classList.toggle('is-hovering', !!name);
      request();
    }
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    if (moved < 6) {
      const name = pick(e);
      if (name) {
        select(name);
        onSelect?.(name);
      }
    }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', (e) => {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointerleave', () => {
    if (hovered) {
      hovered = null;
      canvas.classList.remove('is-hovering');
      request();
    }
  });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow canvases pull the camera back so no table or label clips.
    const dist = camera.aspect < 1.35 ? 11.2 + (1.35 - camera.aspect) * 7.5 : 11.2;
    camera.position.set(0, dist * 0.26, dist);
    camera.lookAt(0, -0.1, 0);
    camera.updateProjectionMatrix();
    // Keep labels a readable size on screen as the camera backs off.
    labelScale = Math.max(1, (dist / 11.2) * (h < 400 ? 1.18 : 1));
    tables.forEach((tb) => {
      const b = tb.sprite.userData.base;
      if (b) tb.sprite.scale.set(b[0] * labelScale, b[1] * labelScale, 1);
    });
    request();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ── Selection styling ───────────────────────────────────── */
  const lineOn = new THREE.Color();
  const lineOff = new THREE.Color();
  function applySelection() {
    lineOn.setHex(P.lineOn);
    lineOff.setHex(P.line);
    tables.forEach((tb) => {
      const on = tb.name === current;
      tb.mat.emissive.setHex(P.emissive);
      tb.mat.emissiveIntensity = on ? P.emissiveOn : 0;
    });
    dims.forEach((d) => {
      const on = current === FACT || d.name === current;
      d.lineMat.color.copy(on ? lineOn : lineOff);
      d.lineMat.opacity = current === FACT ? 0.62 : on ? 0.95 : 0.3;
    });
    buildLabels();
  }

  function select(name) {
    if (!tables.some((tb) => tb.name === name) || name === current) return;
    current = name;
    applySelection();
    request();
  }

  /* ── Draw ────────────────────────────────────────────────── */
  let t = 0;

  function draw() {
    if (!dragging) {
      velY *= 0.94;
      velX *= 0.94;
      spinY += velY;
      spinX = Math.max(-0.2, Math.min(0.95, spinX + velX));
      if (animate && Math.abs(velY) < 0.0008) spinY += 0.0018;
    }
    world.rotation.y = spinY;
    world.rotation.x = spinX * 0.35;

    const p = readProgress();

    tables.forEach((tb, i) => {
      const on = tb.name === current;
      const hover = tb.name === hovered;
      tb.scale += ((on ? 1.1 : hover ? 1.06 : 1) - tb.scale) * (animate ? 0.14 : 1);
      tb.lift += ((hover ? 0.18 : 0) - tb.lift) * (animate ? 0.14 : 1);

      if (tb === fact) {
        const k = easeOut(clamp01(p / 0.35));
        tb.mesh.scale.setScalar(tb.scale * (0.55 + 0.45 * k));
        tb.mesh.position.set(0, tb.lift + (animate ? Math.sin(t * 0.8) * 0.05 : 0), 0);
        tb.mesh.rotation.y = -spinY + Math.sin(t * 0.35) * 0.15;
        tb.sprite.position.set(0, tb.mesh.position.y + 1.32 * tb.scale, 0);
        tb.sprite.material.opacity = k;
        return;
      }

      const j = i - 1;
      const k = easeOut(clamp01((p - 0.12 - j * 0.09) / 0.5));
      const bob = animate ? Math.sin(t * 0.9 + j) * 0.1 : 0;
      tb.mesh.position.set(tb.target.x * k, tb.target.y * k + bob + tb.lift, tb.target.z * k);
      tb.mesh.scale.setScalar(tb.scale * (0.35 + 0.65 * k));
      tb.mesh.rotation.y = -spinY;
      tb.sprite.position.set(tb.mesh.position.x, tb.mesh.position.y + 0.8 * tb.scale, tb.mesh.position.z);
      tb.sprite.material.opacity = k * k;

      const pos = tb.line.geometry.attributes.position;
      pos.setXYZ(1, tb.mesh.position.x, tb.mesh.position.y, tb.mesh.position.z);
      pos.needsUpdate = true;
    });

    // Depth cue: labels at the back fade and draw first, so a front label
    // is never covered by one behind it.
    world.updateMatrixWorld();
    tables.forEach((tb) => {
      tb.sprite.getWorldPosition(wp);
      const near = clamp01((wp.z + RADIUS) / (RADIUS * 2));
      tb.sprite.renderOrder = 10 + Math.round(near * 20) + (tb.name === current ? 30 : 0);
      tb.sprite.material.opacity *= tb.name === current ? 1 : 0.45 + 0.55 * near;
    });

    // Packets run dimension → fact once the model is assembled.
    const flow = animate ? clamp01((p - 0.85) / 0.15) : 0;
    let n = 0;
    dims.forEach((d, j) => {
      const focus = current === FACT || d.name === current;
      for (let q = 0; q < PACKETS_PER_JOIN; q++) {
        const s = (t * 0.32 + q / PACKETS_PER_JOIN + j * 0.17) % 1;
        pd.position.copy(d.mesh.position).multiplyScalar(1 - s);
        pd.scale.setScalar(flow * Math.sin(s * Math.PI) * (focus ? 1.25 : 0.6));
        pd.updateMatrix();
        packets.setMatrixAt(n++, pd.matrix);
      }
    });
    packets.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }

  /* ── Loop ────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let raf = null;
  let visible = true;
  let awake = true;
  let pending = false;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    t += Math.min(clock.getDelta(), 0.05);
    draw();
    // With motion off the loop exists only to play out drag inertia and
    // selection easing — stop once that has settled.
    if (!animate && !dragging && Math.abs(velY) < 5e-4 && Math.abs(velX) < 5e-4) pause();
  };
  function play() {
    if (raf !== null || !visible || !awake) return;
    if (!animate && !dragging) return;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  }
  // A single redraw for state changes while the loop is idle.
  function request() {
    if (raf !== null || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (raf === null) draw();
    });
  }

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
  // Assembly is tied to scroll; with the loop paused (reduced motion) there
  // is nothing to redraw, and with it running the loop already reads it.
  window.addEventListener('scroll', () => animate || request(), { passive: true });

  applySelection();
  resize();
  draw();
  play();

  return {
    select,
    setTheme(next) {
      P = PALETTE[next] || PALETTE.dark;
      fact.mat.color.setHex(P.fact);
      dims.forEach((d) => d.mat.color.setHex(P.dim));
      tables.forEach((tb) => (tb.edgeMat.opacity = P.edge));
      packetMat.color.setHex(P.packet);
      ambient.intensity = P.ambient;
      dir.intensity = P.dir;
      applySelection();
      request();
    },
    setMotion(on) {
      animate = on;
      if (on) play();
      else {
        pause();
        built = 1;
        request();
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
