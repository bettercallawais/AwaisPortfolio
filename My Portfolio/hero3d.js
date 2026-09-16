/* ═══════════════════════════════════════════════════════════════
   Hero — an animated data terrain: 1,040 instanced bars rippling
   like a report mid-refresh, over a drifting point field.

   Every bar height is solved on the GPU in the vertex shader, so the
   main thread does no per-bar work at all — the wave costs one uniform
   per frame. The cursor raises a soft swell in the field beneath it,
   and the tallest bars glow at their tips.

   Theme-aware and motion-aware. Under reduced motion the scene is
   still drawn, it simply holds a pose.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const COLS = 40;
const ROWS = 26;
const GAP = 0.5;
const COUNT = COLS * ROWS;

/* Colours come from the portrait: navy suit at the base, the tie's
   slate blue through the middle, the shirt's blue-white at the peaks.
   A faint warm rim (the only warm light) keeps the forms from reading
   as flat plastic. */
const PALETTE = {
  dark: {
    fog: 0x07090e,
    a: 0x283150, b: 0x7f98e6, c: 0xe3eaff,
    ambient: 0.95, hemiSky: 0x9fb2e6, hemiGround: 0x06070b, hemi: 1.2,
    dir: 1.55, keyColor: 0x93aaf2, key: 820, rimColor: 0xc99a8e, rim: 360,
    glow: 0xaebfff, glowAmt: 0.75,
    star: 0x8e96aa, starOpacity: 0.5,
    exposure: 1.1,
  },
  light: {
    fog: 0xeef1f6,
    a: 0xb3bdd3, b: 0x3a52b4, c: 0x7389de,
    ambient: 1.5, hemiSky: 0xffffff, hemiGround: 0xcfd6e4, hemi: 1.5,
    dir: 2.0, keyColor: 0x5a70c8, key: 520, rimColor: 0xd9b1a6, rim: 260,
    glow: 0x3a52b4, glowAmt: 0.12,
    star: 0x8a93a8, starOpacity: 0.3,
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
  scene.fog = new THREE.FogExp2(P.fog, 0.062);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  camera.position.set(0, 6.4, 14.5);

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
  const geo = new THREE.BoxGeometry(0.29, 1, 0.29);
  geo.translate(0, 0.5, 0); // base pivot: scaling grows upward

  // Per-instance grid cell: x, z, and distance from centre.
  const cells = new Float32Array(COUNT * 3);
  {
    let i = 0;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = (c - (COLS - 1) / 2) * GAP;
        const z = (r - (ROWS - 1) / 2) * GAP;
        cells[i * 3] = x;
        cells[i * 3 + 1] = z;
        cells[i * 3 + 2] = Math.hypot(x, z);
        i++;
      }
    }
  }
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 3));

  const uniforms = {
    uTime: { value: 1.2 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uLift: { value: 0 },
    uGlow: { value: new THREE.Color(P.glow) },
    uGlowAmt: { value: P.glowAmt },
  };

  // Low metalness on purpose — there is no environment map, and metal
  // with nothing to reflect renders black.
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.38,
    metalness: 0.16,
    transparent: true,
    opacity: 0.96,
  });

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 aCell;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uLift;
        varying float vHeight;
        varying float vTip;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float h = 1.15
          + sin(aCell.x * 0.42 + uTime * 0.85) * 0.85
          + cos(aCell.y * 0.55 - uTime * 0.62) * 0.70
          + sin(aCell.z * 0.50 - uTime * 1.25) * 0.55;
        vec2 dp = aCell.xy - uPointer;
        h += exp(-dot(dp, dp) / 3.4) * 2.1 * uLift;
        h = max(h, 0.12);
        vHeight = h;
        vTip = position.y;
        transformed.y *= h;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uGlow;
        uniform float uGlowAmt;
        varying float vHeight;
        varying float vTip;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uGlow * uGlowAmt * smoothstep(2.3, 3.7, vHeight) * vTip * vTip;`
      );
  };

  const bars = new THREE.InstancedMesh(geo, mat, COUNT);
  bars.frustumCulled = false; // heights live in the shader; CPU bounds would be wrong
  {
    const dummy = new THREE.Object3D();
    for (let n = 0; n < COUNT; n++) {
      dummy.position.set(cells[n * 3], 0, cells[n * 3 + 1]);
      dummy.updateMatrix();
      bars.setMatrixAt(n, dummy.matrix);
    }
    bars.instanceMatrix.needsUpdate = true;
  }
  scene.add(bars);

  const paint = () => {
    const cA = new THREE.Color(P.a);
    const cB = new THREE.Color(P.b);
    const cC = new THREE.Color(P.c);
    const tmp = new THREE.Color();
    let i = 0;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const k = (c / (COLS - 1)) * 0.65 + (r / (ROWS - 1)) * 0.35;
        tmp.copy(cA).lerp(cB, Math.min(k * 1.5, 1));
        if (k > 0.7) tmp.lerp(cC, ((k - 0.7) / 0.3) * 0.55);
        bars.setColorAt(i, tmp);
        i++;
      }
    }
    bars.instanceColor.needsUpdate = true;
  };
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
  const pointer = { x: 0, y: 0, inside: false, ndc: new THREE.Vector2() };
  const eased = { x: 0, y: 0 };
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.1);
  const ray = new THREE.Raycaster();
  const hit = new THREE.Vector3();
  const swell = new THREE.Vector2(0, 0);
  let lift = 0;
  let scrollT = 0;
  let animate = motion;
  let t = 1.2; // a pose with visible relief, so the frozen state still reads

  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      const r = canvas.getBoundingClientRect();
      pointer.inside =
        e.pointerType === 'mouse' && e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
      if (pointer.inside) {
        pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      }
    },
    { passive: true }
  );
  document.documentElement.addEventListener('pointerleave', () => (pointer.inside = false));
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
  function draw() {
    if (animate) {
      eased.x += (pointer.x - eased.x) * 0.045;
      eased.y += (pointer.y - eased.y) * 0.045;
    }
    camera.position.x = eased.x * 2.4;
    camera.position.y = 6.4 - eased.y * 1.3 + scrollT * 2.6;
    camera.position.z = 14.5 + scrollT * 4;
    camera.lookAt(0, 0.6 - scrollT * 0.8, 0);

    bars.rotation.y = Math.sin(t * 0.08) * 0.09;
    stars.rotation.y = t * 0.012;
    bars.updateMatrixWorld();

    // Swell follows the cursor across the field, in the bars' own space.
    const want = animate && pointer.inside && scrollT < 0.9 ? 1 : 0;
    if (want) {
      camera.updateMatrixWorld();
      ray.setFromCamera(pointer.ndc, camera);
      if (ray.ray.intersectPlane(ground, hit)) {
        bars.worldToLocal(hit);
        swell.x += (hit.x - swell.x) * 0.12;
        swell.y += (hit.z - swell.y) * 0.12;
      }
    }
    lift += (want - lift) * 0.06;
    uniforms.uPointer.value.copy(swell);
    uniforms.uLift.value = lift;
    uniforms.uTime.value = t;

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
      uniforms.uGlow.value.setHex(P.glow);
      uniforms.uGlowAmt.value = P.glowAmt;
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
        lift = 0;
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
