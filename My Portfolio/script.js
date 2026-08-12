/* ═══════════════════════════════════════════════════════════════
   Awais Ali — Portfolio · interaction layer
   No framework. One rAF scheduler for scroll work, pointer effects
   throttled to frames, and a live motion switch in the header.
   ═══════════════════════════════════════════════════════════════ */

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Motion is a user-facing setting, not just an OS read. The OS value seeds
   it; the header switch overrides it and persists. Everything below asks
   `motion.full` at call time so the toggle takes effect immediately. */
const motion = {
  get full() {
    return root.dataset.motion !== 'reduced';
  },
  set full(v) {
    root.dataset.motion = v ? 'full' : 'reduced';
    localStorage.setItem('motion', v ? 'full' : 'reduced');
    $('#motion-toggle')?.setAttribute('aria-pressed', String(v));
    scenes.forEach((s) => s.setMotion?.(v));
    if (v) parallax.kick();
    else parallax.reset();
  },
};

const scenes = [];

/* ── Tab title ─────────────────────────────────────────────
   Switch away having spent under ten seconds here and the tab
   calls it out; stay longer and it just keeps the name. Coming
   back always restores the name.

   Time is accumulated across visits rather than measured per
   segment, so someone who has already read the page doesn't get
   the quip for a three-second glance away later.               */
(() => {
  const BASE = 'Awais Ali | BI Analyst';
  const QUICK = 'That was quick';
  const THRESHOLD = 10_000;

  let since = document.visibilityState === 'visible' ? performance.now() : null;
  let engaged = 0;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (since !== null) {
        engaged += performance.now() - since;
        since = null;
      }
      document.title = engaged < THRESHOLD ? QUICK : BASE;
    } else {
      since = performance.now();
      document.title = BASE;
    }
  });
})();

/* ── Theme ─────────────────────────────────────────────────── */
(() => {
  const btn = $('#theme-toggle');
  btn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    scenes.forEach((s) => s.setTheme?.(next));
  });

  // Follow the OS only while the visitor hasn't made an explicit choice.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme')) return;
    root.dataset.theme = e.matches ? 'light' : 'dark';
    scenes.forEach((s) => s.setTheme?.(root.dataset.theme));
  });
})();

/* ── Motion switch ─────────────────────────────────────────── */
(() => {
  const btn = $('#motion-toggle');
  btn?.setAttribute('aria-pressed', String(motion.full));
  btn?.addEventListener('click', () => (motion.full = !motion.full));
})();

/* ── Smooth scroll (lerped real scroll — keeps position:fixed sane) ── */
const smooth = (() => {
  if (!FINE) return null;
  const st = { target: window.scrollY, current: window.scrollY, running: false, on: true };
  root.classList.add('lenis');

  const max = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const loop = () => {
    const d = st.target - st.current;
    if (Math.abs(d) < 0.35) {
      st.current = st.target;
      window.scrollTo(0, st.current);
      st.running = false;
      return;
    }
    st.current += d * 0.115;
    window.scrollTo(0, st.current);
    requestAnimationFrame(loop);
  };
  const start = () => {
    if (st.running) return;
    st.running = true;
    requestAnimationFrame(loop);
  };

  window.addEventListener(
    'wheel',
    (e) => {
      if (!st.on || !motion.full || e.ctrlKey) return;
      if (e.target.closest?.('.modal__panel')) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? window.innerHeight : 1;
      st.target = clamp(st.target + e.deltaY * unit, 0, max());
      start();
    },
    { passive: false }
  );

  window.addEventListener(
    'scroll',
    () => {
      if (!st.running) st.current = st.target = window.scrollY;
    },
    { passive: true }
  );
  window.addEventListener('resize', () => (st.target = clamp(st.target, 0, max())));

  return {
    to(y) {
      st.target = clamp(y, 0, max());
      start();
    },
    set enabled(v) {
      st.on = v;
      if (v) st.current = st.target = window.scrollY;
    },
  };
})();

/* ── Parallax ──────────────────────────────────────────────── */
const parallax = (() => {
  const items = $$('[data-parallax]').map((el) => ({ el, speed: parseFloat(el.dataset.parallax) }));

  const apply = () => {
    const vh = window.innerHeight;
    for (const { el, speed } of items) {
      const r = el.getBoundingClientRect();
      // Distance of the element's centre from the viewport centre, normalised.
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(off * speed * 100).toFixed(2)}px, 0)`;
    }
  };

  return {
    kick() {
      if (motion.full) apply();
    },
    reset() {
      items.forEach(({ el }) => (el.style.transform = ''));
    },
    frame: apply,
    any: items.length > 0,
  };
})();

/* ── One scroll scheduler for header, progress and parallax ─── */
(() => {
  const header = $('#header');
  const fill = $('#progress-fill');
  let last = window.scrollY;
  let queued = false;

  const run = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    const hide = y > 460 && y > last + 4 && !$('#nav-list').classList.contains('is-open');
    if (hide) header.classList.add('is-hidden');
    else if (y < last - 4 || y < 140) header.classList.remove('is-hidden');

    fill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    if (motion.full && parallax.any) parallax.frame();

    last = y;
    queued = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    },
    { passive: true }
  );
  window.addEventListener('resize', () => parallax.kick());
  run();
})();

/* ── Anchors ───────────────────────────────────────────────── */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const dest = $(id);
    if (!dest) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 62;
    const y = dest.getBoundingClientRect().top + window.scrollY - navH - 26;
    if (smooth && motion.full) smooth.to(y);
    else window.scrollTo({ top: y, behavior: motion.full ? 'smooth' : 'auto' });
    closeDrawer();
    history.replaceState(null, '', id);
  });
});

/* ── Mobile drawer ─────────────────────────────────────────── */
const navList = $('#nav-list');
const navToggle = $('#nav-toggle');
function closeDrawer() {
  if (!navList?.classList.contains('is-open')) return;
  navList.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}
navToggle?.addEventListener('click', () => {
  const open = navList.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

/* ── Active section + nav pill ─────────────────────────────── */
(() => {
  const links = $$('[data-nav]');
  const pill = $('.nav__pill');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;

  const move = (link) => {
    if (!pill || !link.offsetParent) return;
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
    pill.classList.add('is-on');
  };

  const io = new IntersectionObserver(
    (entries) => {
      const top = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!top) return;
      links.forEach((l) => {
        const on = l.getAttribute('href') === `#${top.target.id}`;
        l.classList.toggle('is-active', on);
        if (on) move(l);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.3, 1] }
  );
  sections.forEach((s) => io.observe(s));
  window.addEventListener('resize', () => {
    const a = links.find((l) => l.classList.contains('is-active'));
    if (a) move(a);
  });
})();

/* ── Split the hero name ───────────────────────────────────── */
$$('[data-split]').forEach((node, w) => {
  const text = node.textContent;
  node.textContent = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = ch === ' ' ? 'char space' : 'char';
    s.style.setProperty('--i', i + w * 6);
    s.textContent = ch === ' ' ? ' ' : ch;
    node.appendChild(s);
  });
  node.setAttribute('aria-label', text);
});

/* ── Reveal ────────────────────────────────────────────────── */
(() => {
  const items = $$('[data-reveal]');
  items.forEach((el) => el.dataset.revealDelay && el.style.setProperty('--d', el.dataset.revealDelay));
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
  );
  items.forEach((el) => io.observe(el));
})();

/* ── Liquid-glass specular + 3D tilt with depth layers ─────── */
(() => {
  if (!FINE) return;

  // Specular tracking is a lighting cue, not travel, so it stays on
  // even when the visitor has asked for reduced motion.
  $$('.lg').forEach((el) => {
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        el.style.setProperty('--lg-angle', `${(((e.clientX - r.left) / r.width) * 180 + 90).toFixed(0)}deg`);
      },
      { passive: true }
    );
  });

  $$('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tiltMax || '8');
    const layers = $$('[data-depth]', el);
    let raf = null;
    let rx = 0, ry = 0, tx = 0, ty = 0;

    const render = () => {
      rx += (tx - rx) * 0.13;
      ry += (ty - ry) * 0.13;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      const lift = Math.hypot(rx, ry) / (max * 2);
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth) * lift;
        l.style.transform = `translate3d(${(ry * d * 0.14).toFixed(2)}px, ${(-rx * d * 0.14).toFixed(2)}px, ${d.toFixed(1)}px)`;
      });
      if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) raf = requestAnimationFrame(render);
      else raf = null;
    };
    const kick = () => raf === null && (raf = requestAnimationFrame(render));

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !motion.full) return;
      const r = el.getBoundingClientRect();
      tx = -((e.clientY - r.top) / r.height - 0.5) * max * 2;
      ty = ((e.clientX - r.left) / r.width - 0.5) * max * 2;
      kick();
    });
    el.addEventListener('pointerleave', () => {
      tx = ty = 0;
      kick();
    });
  });
})();

/* ── Case-study modal ──────────────────────────────────────── */
(() => {
  const modal = $('#modal');
  const panel = $('.modal__panel', modal);
  const titleEl = $('#modal-title');
  const stackEl = $('#modal-stack');
  const bodyEl = $('#modal-body');
  const embedEl = $('#modal-embed');
  let restore = null;

  const open = (card) => {
    restore = document.activeElement;
    titleEl.textContent = card.dataset.title || '';
    stackEl.textContent = card.dataset.stack || '';

    const tpl = $('.pc__detail', card);
    bodyEl.replaceChildren(tpl ? tpl.content.cloneNode(true) : document.createTextNode(''));

    // iframe is built on open and destroyed on close — never idling.
    embedEl.replaceChildren();
    if (card.dataset.embed) {
      const h = document.createElement('span');
      h.className = 'mono';
      h.textContent = 'Live report';
      const f = document.createElement('iframe');
      f.src = card.dataset.embed;
      f.title = `${card.dataset.title} — live Power BI report`;
      f.loading = 'lazy';
      f.allowFullscreen = true;
      embedEl.append(h, f);
    }

    modal.hidden = false;
    document.body.classList.add('is-locked');
    if (smooth) smooth.enabled = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    panel.scrollTop = 0;
    $('.modal__close', modal).focus();
  };

  const close = () => {
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (smooth) smooth.enabled = true;
    setTimeout(() => {
      modal.hidden = true;
      embedEl.replaceChildren();
      bodyEl.replaceChildren();
    }, 420);
    restore?.focus?.();
  };

  $$('.pc').forEach((card) => $('.pc__hit', card)?.addEventListener('click', () => open(card)));
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input,textarea,iframe,[tabindex]:not([tabindex="-1"])', panel)
      .filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const [first, lastEl] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
})();

/* ── Contact form → Netlify Forms ──────────────────────────
   Posts back to the site root as urlencoded data with `form-name`,
   which is how Netlify accepts an AJAX submission of a form it
   detected in the deployed HTML.                                */
(() => {
  const form = $('#contact-form');
  if (!form) return;
  const status = $('#form-status');
  const btn = $('#submit-btn');
  const label = $('.btn__label', btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    label.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      status.className = 'form-status ok';
      status.textContent = 'Sent. I’ll reply to your email shortly.';
      form.reset();
      label.textContent = 'Sent';
    } catch (err) {
      status.className = 'form-status err';
      status.innerHTML =
        'Could not send — please email <a href="mailto:ds.awaisali@gmail.com">ds.awaisali@gmail.com</a> directly.';
      label.textContent = 'Send';
      console.warn('Contact form:', err);
    } finally {
      btn.disabled = false;
      setTimeout(() => (label.textContent = 'Send'), 4000);
    }
  });
})();

$('#year').textContent = new Date().getFullYear();

/* ── WebGL scenes ──────────────────────────────────────────
   Both are loaded after first paint. They render in *both* motion
   modes — reduced motion holds them still rather than removing
   them, so the page never silently loses its visual identity.   */
(() => {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  const boot = async () => {
    const theme = root.dataset.theme;
    try {
      const { initHero } = await import('./hero3d.js');
      const hero = initHero($('#hero-canvas'), { theme, motion: motion.full });
      if (hero) scenes.push(hero);
    } catch (e) {
      console.warn('hero3d:', e);
    }
    try {
      const { initSchema } = await import('./schema3d.js');
      const schema = initSchema($('#schema-canvas'), { theme, motion: motion.full });
      if (schema) scenes.push(schema);
    } catch (e) {
      console.warn('schema3d:', e);
    }
  };

  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
  else setTimeout(boot, 500);
})();
