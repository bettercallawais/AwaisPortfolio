/* ═══════════════════════════════════════════════════════════════
   Hero — an animated data terrain: ~2,000 instanced bars rippling
   like a report mid-refresh, over a drifting point field.

   Theme-aware and motion-aware. Under reduced motion the scene is
   still drawn, it simply holds a pose instead of animating.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const COLS = 58;
const ROWS = 34;
const GAP = 0.42;
const COUNT = COLS * ROWS;

/* Bars ramp low → high like a sequential data-viz scale, but the ramp is
   deliberately back-loaded: the field stays cool steel almost all the way
   through and only the far peaks pick up the brand accent. It is a backdrop
   behind body copy, so it has to stay quiet enough to read over.
   Lighting is a warm key against a cool fill, so form reads without the
   colour ramp having to do the work alone. */
const PALETTE = {
  dark: {
    fog: 0x0a0a0b,
    a: 0x3d4756, b: 0xd44e1d, c: 0xffab42,
    ambient: 1.2, hemiSky: 0x8fa0bc, hemiGround: 0x14100e, hemi: 1.35,
    dir: 1.6, keyColor: 0xff5a1f, key: 950, rimColor: 0x5c6b85, rim: 850,
    star: 0x8b8b93, starOpacity: 0.5,
    exposure: 1.12,
  },
  light: {
    fog: 0xf6f5f2,
    a: 0x78808f, b: 0xc0491c, c: 0xdd8b3c,
    ambient: 0.95, hemiSky: 0xffffff, hemiGround: 0xd8d2c6, hemi: 1.05,
    dir: 1.5, keyColor: 0xde4711, key: 620, rimColor: 0x8892a6, rim: 560,
    star: 0x9a9488, starOpacity: 0.32,
    exposure: 1.0,
  },
};

export function initHero(canvas, { theme = 'dark', motion = true } = {}) {
  if (!canvas) return null;
  let P = PALETTE[theme] || PALETTE.dark;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = P.exposure;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(P.fog, 0.038);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(0, 6.8, 19);

  /* ── Lights ──────────────────────────────────────────────
     Three r155+ uses physical light units, so point intensity is
     candela with inverse-square falloff. Ambient + hemisphere carry
     the base colour so instance colours always read; the point
     lights are accent only. */
  const ambient = new THREE.AmbientLight(0xffffff, P.ambient);
  const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemi);
  const dir = new THREE.DirectionalLight(0xffffff, P.dir);
  dir.position.set(-3, 14, 8);
  const key = new THREE.PointLight(P.keyColor, P.key, 80, 2);
  key.position.set(-9, 10, 9);
  const rim = new THREE.PointLight(P.rimColor, P.rim, 80, 2);
  rim.position.set(11, 8, -6);
  scene.add(ambient, hemi, dir, key, rim);

  /* ── Bars ────────────────────────────────────────────────── */
  const geo = new THREE.BoxGeometry(0.22, 1, 0.22);
  geo.translate(0, 0.5, 0); // base pivot: scaling grows upward

  // Low metalness on purpose — there is no environment map, and metal
  // with nothing to reflect renders black.
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.42,
    metalness: 0.15,
    transparent: true,
    opacity: 0.95,
  });

  const bars = new THREE.InstancedMesh(geo, mat, COUNT);
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(bars);

  const dummy = new THREE.Object3D();
  const layout = new Float32Array(COUNT * 3);

  const paint = () => {
    const cA = new THREE.Color(P.a);
    const cB = new THREE.Color(P.b);
    const cC = new THREE.Color(P.c);
    const tmp = new THREE.Color();
    let i = 0;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const t = (c / (COLS - 1)) * 0.65 + (r / (ROWS - 1)) * 0.35;
        // Squared so the accent is confined to the far end of the ramp
        // instead of flooding the middle of the field.
        tmp.copy(cA).lerp(cB, t * t);
        if (t > 0.82) tmp.lerp(cC, ((t - 0.82) / 0.18) * 0.4);
        bars.setColorAt(i, tmp);
        i++;
      }
    }
    bars.instanceColor.needsUpdate = true;
  };

  let i = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const x = (c - (COLS - 1) / 2) * GAP;
      const z = (r - (ROWS - 1) / 2) * GAP;
      layout[i * 3] = x;
      layout[i * 3 + 1] = z;
      layout[i * 3 + 2] = Math.hypot(x, z);
      i++;
    }
  }
  paint();

  /* ── Point field ─────────────────────────────────────────── */
  const STARS = 420;
  const sp = new Float32Array(STARS * 3);
  for (let s = 0; s < STARS; s++) {
    sp[s * 3] = (Math.random() - 0.5) * 46;
    sp[s * 3 + 1] = Math.random() * 20 - 2;
    sp[s * 3 + 2] = (Math.random() - 0.5) * 40 - 6;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.09,
    color: P.star,
    transparent: true,
    opacity: P.starOpacity,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ── State ───────────────────────────────────────────────── */
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let scrollT = 0;
  let animate = motion;
  let t = 0;

  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );
  window.addEventListener(
    'scroll',
    () => {
      scrollT = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
      if (!animate) draw();
    },
    { passive: true }
  );

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

  /* ── Draw ────────────────────────────────────────────────── */
  // Bar heights depend only on `t`. When the scene is frozen (reduced
  // motion) a scroll or resize still needs a redraw, but re-solving 1,972
  // wave equations for an unchanged `t` would be pure waste.
  let barsDirty = true;

  function draw() {
    if (barsDirty) {
      for (let n = 0; n < COUNT; n++) {
        const x = layout[n * 3];
        const z = layout[n * 3 + 1];
        const d = layout[n * 3 + 2];
        const h =
          1.15 +
          Math.sin(x * 0.42 + t * 0.85) * 0.85 +
          Math.cos(z * 0.55 - t * 0.62) * 0.7 +
          Math.sin(d * 0.5 - t * 1.25) * 0.55;
        dummy.position.set(x, 0, z);
        dummy.scale.set(1, Math.max(h, 0.12), 1);
        dummy.updateMatrix();
        bars.setMatrixAt(n, dummy.matrix);
      }
      bars.instanceMatrix.needsUpdate = true;
      barsDirty = animate;
    }

    if (animate) {
      eased.x += (pointer.x - eased.x) * 0.045;
      eased.y += (pointer.y - eased.y) * 0.045;
    }
    camera.position.x = eased.x * 2.2;
    camera.position.y = 6.8 - eased.y * 1.2 + scrollT * 3.2;
    camera.position.z = 19 + scrollT * 5;
    camera.lookAt(0, 0.4 - scrollT * 0.8, 0);

    bars.rotation.y = Math.sin(t * 0.08) * 0.09;
    stars.rotation.y = t * 0.012;

    renderer.render(scene, camera);
  }

  /* ── Loop ────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let visible = true;
  let awake = true;
  let raf = null;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    // Own accumulator: a backgrounded tab must not dump its whole gap
    // into the wave phase and snap the terrain on resume.
    t += Math.min(clock.getDelta(), 0.05);
    barsDirty = true;
    draw();
  };
  const play = () => {
    if (raf !== null || !visible || !awake || !animate) return;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  };
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
  t = 1.2; // a pose with visible relief, so the frozen state still reads
  draw();
  play();
  canvas.classList.add('is-ready');

  return {
    setTheme(next) {
      P = PALETTE[next] || PALETTE.dark;
      scene.fog.color.setHex(P.fog);
      renderer.toneMappingExposure = P.exposure;
      ambient.intensity = P.ambient;
      hemi.color.setHex(P.hemiSky);
      hemi.groundColor.setHex(P.hemiGround);
      hemi.intensity = P.hemi;
      dir.intensity = P.dir;
      key.color.setHex(P.keyColor);
      key.intensity = P.key;
      rim.color.setHex(P.rimColor);
      rim.intensity = P.rim;
      starMat.color.setHex(P.star);
      starMat.opacity = P.starOpacity;
      paint();
      draw();
    },
    setMotion(on) {
      animate = on;
      if (on) play();
      else {
        pause();
        barsDirty = true;
        draw();
      }
    },
    destroy() {
      pause();
      io.disconnect();
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    },
  };
}
