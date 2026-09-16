/* ═══════════════════════════════════════════════════════════════
   Awais Ali — Portfolio · chat assistant
   Asks /api/chat (Gemini, free tier) first. If that is unavailable —
   no key yet, quota spent, running locally — it answers from the
   local notes below, so a visitor never hits a dead end.
   ═══════════════════════════════════════════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);

const EMAIL = 'ds.awaisali@gmail.com';
const MAX_CHARS = 600;
const HISTORY_TURNS = 10;

/* ── Local answers ─────────────────────────────────────────
   Keyword-scored. `keys` are strong signals (2 points). `weak` are
   generic words (1 point) that only count when the question is
   about Awais — so "who is…" about anyone else stays unanswered.
   Kept to facts that are already public on this page.            */
const NOTES = [
  {
    keys: ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa', 'greetings', 'morning', 'evening'],
    reply: 'Hi! I can tell you about Awais’s experience, skills, projects, education, or how to reach him. What would you like to know?',
  },
  {
    keys: ['summary', 'introduce', 'overview', 'background', 'profile'],
    weak: ['who', 'do', 'doing'],
    reply: 'Awais Ali is a Business Intelligence Analyst in Lahore with 3+ years in BI. He is Assistant Manager BI at Beaconhouse Group, building semantic models, ETL pipelines and dashboards, and holds a BS in Artificial Intelligence from UMT.',
  },
  {
    keys: ['experience', 'work', 'job', 'current', 'currently', 'role', 'beaconhouse', 'company', 'employer', 'position', 'years'],
    reply: 'Since Sep 2025 Awais has been Assistant Manager BI at Beaconhouse Group, running reporting pipelines across Looker Studio and Power BI and automating ETL in BigQuery, Python and Power Query — cutting manual reporting by 40%. Before that he was a BI Developer at Kaswa.Ai (remote, Jun 2023 – Sep 2025).',
  },
  {
    keys: ['kaswa', 'previous', 'before', 'earlier', 'past'],
    reply: 'At Kaswa.Ai (remote, Jun 2023 – Sep 2025) Awais was a BI Developer: Power BI dashboards with drill-through and advanced DAX, ad-hoc SQL analysis for non-technical teams, and query and pipeline tuning that cut analysis time by 35%.',
  },
  {
    keys: ['skills', 'skill', 'stack', 'tools', 'technologies', 'tech', 'know', 'expertise', 'good'],
    reply: 'Core stack: Power BI, Looker Studio and Excel for visualisation; SQL, Python, DAX and Power Query for logic; BigQuery, SQL Server and MySQL for data; Microsoft Fabric and SSIS for pipelines. He works in star-schema modeling with row-level security, time intelligence and scheduled refresh.',
  },
  {
    keys: ['power', 'bi', 'dax', 'powerbi', 'dashboard', 'dashboards', 'report', 'reports', 'looker'],
    reply: 'Power BI is Awais’s main tool — star-schema semantic models, advanced DAX, drill-through, row-level security, gateways and scheduled refresh. He also builds in Looker Studio at Beaconhouse. His portfolio has four Power BI case studies you can open.',
  },
  {
    keys: ['sql', 'bigquery', 'database', 'query', 'queries', 'warehouse', 'etl', 'pipeline', 'pipelines', 'fabric', 'ssis', 'gcp', 'cloud'],
    reply: 'Awais builds ETL in Google BigQuery, Python and Power Query, and has worked with SQL Server, MySQL, Microsoft Fabric and SSIS. Pipeline and query tuning has delivered 30–40% improvements in refresh time, latency and manual effort across his roles.',
  },
  {
    keys: ['python', 'pandas', 'automation', 'automate', 'script', 'scripts'],
    reply: 'Awais uses Python (pandas, NumPy, Matplotlib) for automation and analysis — ETL at Beaconhouse, multi-touch marketing attribution, and scheduled seasonal-trend analysis on sales data.',
  },
  {
    keys: ['projects', 'project', 'portfolio', 'case', 'studies', 'built', 'build', 'examples', 'samples'],
    reply: 'Six projects are on the portfolio: Customer Support / Call Centre, E-commerce Finance, Healthcare Operations, Supply Chain Analytics, Digital Marketing Attribution, and Sales Performance & Trend. Scroll to Projects to open any case study.',
  },
  {
    keys: ['education', 'degree', 'university', 'umt', 'study', 'studied', 'graduate', 'bachelor', 'bachelors', 'bs', 'ai', 'artificial', 'intelligence', 'machine', 'learning', 'ml'],
    reply: 'Awais holds a BS in Artificial Intelligence from the University of Management & Technology, Lahore (2021–2025), with coursework in statistics, machine learning, data mining, probability and linear algebra. His final-year project was a genetic-algorithm timetable scheduler that generated clash-free timetables.',
  },
  {
    keys: ['certification', 'certifications', 'certificate', 'certified', 'courses', 'course'],
    reply: 'Awais’s certifications (LinkedIn Learning): Power BI Essential, Power BI Data Modeling with DAX, SQL Server Integration Services (SSIS), Microsoft Fabric: Dataflows & Data Storage, and Microsoft SQL Server Essentials.',
  },
  {
    keys: ['hire', 'hiring', 'available', 'availability', 'open', 'remote', 'hybrid', 'onsite', 'freelance', 'contract', 'opportunity', 'roles', 'interested', 'recruit', 'vacancy'],
    reply: `Awais is open to BI and Data Analyst roles — on-site, hybrid or remote. The quickest way to start a conversation is ${EMAIL} or the contact form at the bottom of this page.`,
  },
  {
    keys: ['contact', 'email', 'reach', 'phone', 'call', 'linkedin', 'message', 'connect', 'number', 'whatsapp'],
    reply: `Email: ${EMAIL}\nLinkedIn: https://www.linkedin.com/in/awaisali-bi\nPhone: +92 306 4086446\nOr use the contact form at the bottom of this page.`,
  },
  {
    keys: ['resume', 'cv', 'pdf', 'download'],
    reply: 'You can download Awais’s résumé here: https://awaisx.netlify.app/docs/Awais_Ali_BI_Resume.pdf',
  },
  {
    keys: ['location', 'based', 'where', 'live', 'lahore', 'pakistan', 'city', 'country', 'relocate', 'relocation', 'visa'],
    reply: `Awais is based in Lahore, Pakistan, and is open to on-site, hybrid or remote work. For relocation or visa questions, it is best to ask him directly at ${EMAIL}.`,
  },
  {
    keys: ['salary', 'rate', 'pay', 'compensation', 'expected', 'expectation', 'expectations', 'package', 'notice', 'charges', 'price'],
    reply: `That is best discussed with Awais directly — email ${EMAIL} and he will get back to you.`,
  },
];

const FALLBACK = `I don’t have that detail. Awais can answer it directly at ${EMAIL}, or you can use the contact form below.`;

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'does', 'did', 'he', 'his', 'him', 'awais', 'ali', 'what', 'can', 'you', 'me', 'of', 'in', 'on', 'for', 'to', 'and', 'with', 'has', 'have', 'how', 'any', 'i', 'it', 'please', 'about', 'tell', 'more', 'some', 'this', 'that', 'my', 'your']);

function localAnswer(question) {
  const lower = question.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ');
  const aboutHim = /\b(awais|ali|he|his|him)\b/.test(lower);
  const words = lower.split(/\s+/).filter((w) => w && !STOP.has(w));
  let best = null;
  let bestScore = 0;
  for (const note of NOTES) {
    let score = 0;
    for (const w of words) {
      if (note.keys.includes(w)) score += 2;
      else if (aboutHim && note.weak?.includes(w)) score += 1;
      else if (w.length > 4 && note.keys.some((k) => k.length > 4 && (k.startsWith(w) || w.startsWith(k)))) score += 1;
    }
    if (score > bestScore) { best = note; bestScore = score; }
  }
  return best ? best.reply : FALLBACK;
}

/* ── Rendering ─────────────────────────────────────────────
   Text only — links are built as nodes, never through innerHTML,
   so nothing a model returns can inject markup.                  */
const LINK_RE = /(https?:\/\/[^\s)]+[^\s).,;:!?])|([\w.+-]+@[\w-]+\.[\w.-]+[a-z])|(\+92[\d\s]{9,14}\d)/gi;

function renderText(el, text) {
  el.textContent = '';
  const clean = text.replace(/\*\*(.+?)\*\*/g, '$1');
  let last = 0;
  for (const m of clean.matchAll(LINK_RE)) {
    if (m.index > last) el.append(clean.slice(last, m.index));
    const a = document.createElement('a');
    const [raw, url, email, phone] = m;
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else if (email) a.href = `mailto:${email}`;
    else if (phone) a.href = `tel:${phone.replace(/\s/g, '')}`;
    a.textContent = raw;
    el.append(a);
    last = m.index + raw.length;
  }
  if (last < clean.length) el.append(clean.slice(last));
}

/* ── Widget ────────────────────────────────────────────── */
(() => {
  const launcher = $('#chat-launcher');
  const panel = $('#chat-panel');
  if (!launcher || !panel) return;

  const log = $('#chat-log', panel);
  const form = $('#chat-form', panel);
  const input = $('#chat-input', panel);
  const send = $('#chat-send', panel);
  const suggestions = $('#chat-suggest', panel);

  const history = [];
  let busy = false;
  let greeted = false;

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  function addMessage(role, text) {
    const item = document.createElement('div');
    item.className = `chat__msg chat__msg--${role}`;
    const body = document.createElement('p');
    renderText(body, text);
    item.append(body);
    log.append(item);
    scrollDown();
    return item;
  }

  function addTyping() {
    const item = document.createElement('div');
    item.className = 'chat__msg chat__msg--assistant chat__msg--typing';
    item.setAttribute('aria-label', 'Assistant is typing');
    item.innerHTML = '<span></span><span></span><span></span>';
    log.append(item);
    scrollDown();
    return item;
  }

  async function ask(question) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-HISTORY_TURNS) }),
        signal: AbortSignal.timeout(18000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { reply } = await res.json();
      if (!reply) throw new Error('empty');
      return reply;
    } catch {
      return localAnswer(question);
    }
  }

  async function submit(question) {
    const q = question.trim().slice(0, MAX_CHARS);
    if (!q || busy) return;
    busy = true;
    send.disabled = true;
    suggestions.hidden = true;

    addMessage('user', q);
    history.push({ role: 'user', text: q });
    input.value = '';

    const typing = addTyping();
    const started = performance.now();
    const reply = await ask(q);
    // A beat of "typing" so instant local answers don't feel like a glitch.
    const wait = 450 - (performance.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    typing.remove();

    addMessage('assistant', reply);
    history.push({ role: 'assistant', text: reply });

    busy = false;
    send.disabled = false;
    input.focus();
  }

  function open() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    if (!greeted) {
      addMessage('assistant', 'Hi, I’m Awais’s portfolio assistant. Ask me about his experience, skills, projects or how to get in touch.');
      greeted = true;
    }
    setTimeout(() => input.focus(), 60);
  }

  function close() {
    panel.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    const reduced = document.documentElement.dataset.motion === 'reduced';
    setTimeout(() => { panel.hidden = true; }, reduced ? 0 : 260);
    launcher.focus();
  }

  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  $('#chat-close', panel).addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(input.value);
  });

  suggestions.addEventListener('click', (e) => {
    const chip = e.target.closest('button[data-q]');
    if (chip) submit(chip.dataset.q);
  });
})();
