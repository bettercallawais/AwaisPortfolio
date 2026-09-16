/* ═══════════════════════════════════════════════════════════════
   Awais Ali — Portfolio · interaction layer
   No framework. One rAF scheduler for scroll work, pointer effects
   throttled to frames, and live motion / theme / language switches
   in the header.
   ═══════════════════════════════════════════════════════════════ */

import { applyLang, setLang, lang, t, text, TABLES } from './i18n.js';

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* Motion is a user-facing setting, not just an OS read. The OS value seeds
   it; the header switch overrides it and persists. Everything below asks
   `motion.full` at call time so the toggle takes effect immediately. */
const motion = {
  get full() {
    return root.dataset.motion !== 'reduced';
  },
  set full(v) {
    root.dataset.motion = v ? 'full' : 'reduced';
    store.set('motion', v ? 'full' : 'reduced');
    $('#motion-toggle')?.setAttribute('aria-pressed', String(v));
    scenes.forEach((s) => s.setMotion?.(v));
    if (v) parallax.kick();
    else parallax.reset();
  },
};

const scenes = [];
let schemaScene = null;

/* Arabic chosen before load (stored or ?lang=ar): translate before
   anything measures text or splits the hero name. */
if (lang() === 'ar') {
  applyLang();
  document.title = t('title');
}

/* ── Circular reveal for theme and language changes ─────────
   View Transitions where supported and motion is on; an instant
   switch everywhere else.                                        */
function revealFrom(btn, update) {
  if (!document.startViewTransition || !motion.full || !btn) return update();
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(update);
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 720, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    })
    .catch(() => {});
}

/* ── Tab title ─────────────────────────────────────────────
   Leave the tab and it turns into a sad face; come back and the
   name returns.                                                  */
document.addEventListener('visibilitychange', () => {
  document.title = document.hidden ? t('away') : t('title');
});

/* ── Preloader ─────────────────────────────────────────────
   Held for a 2s floor so it reads as intentional rather than a
   flicker, and hard-capped at 3s so a slow asset can never trap
   anyone behind it.                                            */
(() => {
  const el = $('#preloader');
  if (!el) return;
  const fill = $('#preloader-fill');
  const FLOOR = 2000;
  const CAP = 3000;
  const t0 = performance.now();
  let done = false;

  document.body.classList.add('is-loading');
  requestAnimationFrame(() => fill && (fill.style.width = '100%'));

  const finish = () => {
    if (done) return;
    done = true;
    el.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    document.dispatchEvent(new Event('site:ready'));
    setTimeout(() => el.remove(), 700);
  };

  const settle = () => setTimeout(finish, Math.max(0, FLOOR - (performance.now() - t0)));

  if (document.readyState === 'complete') settle();
  else window.addEventListener('load', settle, { once: true });
  setTimeout(finish, CAP);
})();

/* ── Theme ─────────────────────────────────────────────────── */
(() => {
  const btn = $('#theme-toggle');
  const apply = (next) => {
    root.dataset.theme = next;
    scenes.forEach((s) => s.setTheme?.(next));
  };
  btn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    store.set('theme', next);
    revealFrom(btn, () => apply(next));
  });

  // Follow the OS only while the visitor hasn't made an explicit choice.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (store.get('theme')) return;
    apply(e.matches ? 'light' : 'dark');
  });
})();

/* ── Language ──────────────────────────────────────────────── */
(() => {
  const btn = $('#lang-toggle');
  const label = () => {
    const toAr = lang() !== 'ar';
    btn.setAttribute('aria-label', toAr ? 'اقرأ الموقع بالعربية' : 'Read this site in English');
    btn.title = toAr ? 'العربية' : 'English';
  };
  if (!btn) return;
  label();
  btn.addEventListener('click', () => {
    const next = lang() === 'ar' ? 'en' : 'ar';
    revealFrom(btn, () => {
      setLang(next);
      label();
    });
  });
})();

/* ── Motion switch ─────────────────────────────────────────── */
(() => {
  const btn = $('#motion-toggle');
  btn?.setAttribute('aria-pressed', String(motion.full));
  btn?.addEventListener('click', () => (motion.full = !motion.full));
})();

/* ── Smooth scroll (lerped real scroll — keeps position:fixed sane) ── */

/* True when the wheel should scroll something other than the page:
   the chat log, a modal, a code block — anything that can still move
   in the wheel's direction. */
function innerScroller(target, dy) {
  for (let el = target; el && el !== document.body && el !== root; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
      const atTop = el.scrollTop <= 0;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((dy < 0 && !atTop) || (dy > 0 && !atEnd)) return true;
    }
  }
  return false;
}

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
      if (e.target.closest?.('.modal__panel, .chat') || innerScroller(e.target, e.deltaY)) return;
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

/* ── Pipeline rail ─────────────────────────────────────────
   Progress is state, not travel, so it tracks scroll in both
   motion modes. Horizontal on desktop, vertical when stacked.   */
const pipeline = (() => {
  const pipe = $('#pipe');
  if (!pipe) return { frame() {} };
  const stages = $$('.stage', pipe);
  const stacked = matchMedia('(max-width: 1180px)');
  let last = -1;

  return {
    frame() {
      const r = pipe.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = stacked.matches
        ? clamp((vh * 0.62 - r.top) / r.height, 0, 1)
        : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      pipe.style.setProperty('--p', p.toFixed(4));
      stages.forEach((s, i) => s.classList.toggle('is-lit', p >= (i + 0.3) / stages.length));
    },
  };
})();

/* ── One scroll scheduler for header, progress, parallax, rail ─── */
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
    pipeline.frame();

    last = y;
    queued = false;
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => {
    parallax.kick();
    queue();
  });
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
    history.replaceState(null, '', location.search + id);
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
  const remeasure = () => {
    const a = links.find((l) => l.classList.contains('is-active'));
    if (a) move(a);
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
  window.addEventListener('resize', remeasure);
  // Labels change width with language, and web fonts can land late.
  document.addEventListener('site:lang', () => requestAnimationFrame(remeasure));
  document.fonts?.ready.then(remeasure);
})();

/* ── Split the hero name ───────────────────────────────────
   Latin splits per letter for the cascade. Arabic letters join,
   so Arabic splits per word — splitting letters would break the
   script's shaping.                                              */
(() => {
  const node = $('[data-split]');
  if (!node) return;
  const en = node.textContent.trim();

  const render = (animated) => {
    const value = text(node.dataset.i18nSplit, en);
    const parts = lang() === 'ar' ? value.split(/(\s+)/).filter(Boolean) : [...value];
    node.textContent = '';
    parts.forEach((part, i) => {
      const s = document.createElement('span');
      const space = /^\s+$/.test(part);
      s.className = space ? 'char space' : 'char';
      if (!animated) s.classList.add('is-static');
      s.style.setProperty('--i', i);
      s.textContent = space ? ' ' : part;
      node.appendChild(s);
    });
    node.setAttribute('aria-label', value);
  };

  render(true);
  document.addEventListener('site:lang', () => render(false));
})();

/* ── Reveal ────────────────────────────────────────────────
   Observation starts only once the preloader has cleared, so the
   hero's entrance actually plays for the visitor instead of
   finishing behind the loading screen.                          */
const whenReady = (fn) => {
  if ($('#preloader') && !document.body.classList.contains('is-ready')) {
    document.addEventListener('site:ready', fn, { once: true });
  } else {
    fn();
  }
};

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

  whenReady(() => items.forEach((el) => io.observe(el)));
})();

/* ── Impact counters ───────────────────────────────────────
   Count up once when first seen. The markup already holds the
   final figure, so without JS — or with motion off — the number
   is simply there.                                              */
(() => {
  const els = $$('[data-count]');
  if (!els.length || !motion.full) return;
  els.forEach((el) => (el.textContent = `0${el.dataset.suffix || ''}`));

  const run = (el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (!motion.full) {
      el.textContent = `${end}${suffix}`;
      return;
    }
    const t0 = performance.now() + 260; // let the row's reveal start first
    const dur = 1500;
    const step = (now) => {
      const k = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = `${Math.round(end * eased)}${suffix}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        run(e.target);
      });
    },
    { threshold: 0.6 }
  );
  whenReady(() => els.forEach((el) => io.observe(el)));
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

/* ── Star-schema inspector ─────────────────────────────────
   Chips, canvas clicks and the inspector all drive one selection.
   The 3D scene reports picks through onSelect; chips work even
   before (or without) WebGL.                                    */
const inspector = (() => {
  const panel = $('#inspector');
  if (!panel) return { select() {} };
  const kindEl = $('#inspector-kind');
  const nameEl = $('#inspector-name');
  const descEl = $('#inspector-desc');
  const relEl = $('#inspector-rel');
  const colsEl = $('#inspector-cols');
  const daxEl = $('#inspector-dax');
  const chips = $$('.schema__tables button');
  let current = 'FACT_SALES';
  let timer = null;

  const render = () => {
    const T = TABLES[current];
    const fact = T.kind === 'fact';
    kindEl.textContent = t(fact ? 'fact' : 'dim');
    nameEl.textContent = current;
    descEl.textContent = T.desc[lang()];
    relEl.textContent = t(fact ? 'factRel' : 'dimRel');

    colsEl.replaceChildren(
      ...T.cols.map(([col, key]) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = col;
        li.append(name);
        if (key) {
          const b = document.createElement('span');
          b.className = `badge${key === 'PK' ? ' badge--pk' : key === 'FK' ? ' badge--fk' : ''}`;
          b.textContent = key === 'M' ? t('measure') : key;
          li.append(b);
        }
        return li;
      })
    );

    daxEl.hidden = !T.dax;
    if (T.dax) {
      daxEl.replaceChildren(
        ...T.dax.split(/(DIVIDE)/).map((part) => {
          if (part !== 'DIVIDE') return document.createTextNode(part);
          const k = document.createElement('span');
          k.className = 'k';
          k.textContent = part;
          return k;
        })
      );
    }

    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.table === current)));
  };

  const select = (name, fromScene = false) => {
    if (!TABLES[name]) return;
    if (!fromScene) schemaScene?.select(name);
    if (name === current) return;
    current = name;
    clearTimeout(timer);
    if (!motion.full) return render();
    panel.classList.add('is-swapping');
    timer = setTimeout(() => {
      render();
      panel.classList.remove('is-swapping');
    }, 170);
  };

  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.table)));
  document.addEventListener('site:lang', render);
  render();

  return { select, get current() { return current; } };
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
    const detail = tpl ? tpl.content.cloneNode(true) : document.createTextNode('');
    if (detail.querySelectorAll) applyLang(detail);
    bodyEl.replaceChildren(detail);

    // iframe is built on open and destroyed on close — never idling.
    embedEl.replaceChildren();
    if (card.dataset.embed) {
      const h = document.createElement('span');
      h.className = 'mono';
      h.textContent = t('liveReport');
      const f = document.createElement('iframe');
      f.src = card.dataset.embed;
      f.title = `${card.dataset.title} — ${t('liveTitle')}`;
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
    label.textContent = t('sending');
    btn.disabled = true;

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      status.className = 'form-status ok';
      status.textContent = t('sentMsg');
      form.reset();
      label.textContent = t('sent');
    } catch (err) {
      status.className = 'form-status err';
      const a = document.createElement('a');
      a.href = 'mailto:ds.awaisali@gmail.com';
      a.dir = 'ltr';
      a.textContent = 'ds.awaisali@gmail.com';
      status.replaceChildren(`${t('failMsg')} `, a);
      label.textContent = t('send');
      console.warn('Contact form:', err);
    } finally {
      btn.disabled = false;
      setTimeout(() => (label.textContent = t('send')), 4000);
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
      schemaScene = initSchema($('#schema-canvas'), {
        theme,
        motion: motion.full,
        selected: inspector.current,
        onSelect: (name) => inspector.select(name, true),
      });
      if (schemaScene) scenes.push(schemaScene);
    } catch (e) {
      console.warn('schema3d:', e);
    }
  };

  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
  else setTimeout(boot, 500);
})();
