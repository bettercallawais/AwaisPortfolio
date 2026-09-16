/* ═══════════════════════════════════════════════════════════════
   Awais Ali — Portfolio · chat assistant
   Asks /api/chat (Gemini, free tier) first. If that is unavailable —
   no key yet, quota spent, running locally — it answers from the
   local notes below, so a visitor never hits a dead end.

   Replies follow the visitor: a question written in Arabic gets an
   Arabic answer, whatever language the page is in.
   ═══════════════════════════════════════════════════════════════ */

import { lang, t, keepNames } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);

const EMAIL = 'ds.awaisali@gmail.com';
const MAX_CHARS = 600;
const HISTORY_TURNS = 10;
const ARABIC = /[\u0600-\u06FF]/;

/* ── Local answers ─────────────────────────────────────────
   Keyword-scored. `keys` are strong English signals (2 points).
   `weak` are generic words (1 point) that only count when the
   question is about Awais — so "who is…" about anyone else stays
   unanswered. `ar` are Arabic stems, matched inside a word so
   prefixes and suffixes (ال…, …ات, …ه) still hit.               */
const NOTES = [
  {
    keys: ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa', 'greetings', 'morning', 'evening'],
    ar: ['مرحبا', 'اهلا', 'السلام', 'سلام', 'هلا', 'صباح', 'مساء'],
    reply: {
      en: 'Hi! I can tell you about Awais’s experience, skills, projects, education, or how to reach him. What would you like to know?',
      ar: 'مرحبًا! يمكنني إخبارك عن خبرات أويس ومهاراته ومشاريعه وتعليمه، أو عن طريقة التواصل معه. ماذا تودّ أن تعرف؟',
    },
  },
  {
    keys: ['summary', 'introduce', 'overview', 'background', 'profile'],
    weak: ['who', 'do', 'doing', 'ماذا', 'يعمل', 'من'],
    ar: ['نبذه', 'تعريف', 'ملخص'],
    reply: {
      en: 'Awais Ali is a Business Intelligence professional in Lahore with 3+ years in BI, now moving into data science and AI engineering. He is Assistant Manager BI at Beaconhouse Group, building semantic models, ETL pipelines and dashboards, and holds a BS in Artificial Intelligence from UMT.',
      ar: 'أويس علي متخصص في ذكاء الأعمال في لاهور بخبرة تزيد على 3 سنوات، وينتقل الآن إلى علم البيانات وهندسة الذكاء الاصطناعي. يعمل مساعد مدير ذكاء الأعمال في مجموعة بيكونهاوس، حيث يبني النماذج الدلالية وخطوط معالجة البيانات ولوحات المعلومات، ويحمل بكالوريوس الذكاء الاصطناعي من جامعة UMT.',
    },
  },
  {
    // Placed before experience/stack/education so AI questions win ties.
    // No bare 'learning' or 'intelligence': those would steal "LinkedIn
    // Learning" and "business intelligence" questions.
    keys: ['ai', 'ml', 'machine', 'llm', 'llms', 'langchain', 'hugging', 'huggingface', 'genai', 'generative', 'vision', 'nlp', 'deep', 'neural', 'artificial', 'science', 'scientist', 'engineer', 'engineering'],
    ar: ['اصطناعي', 'تعلم', 'الاله', 'لغوي', 'رؤيه', 'حاسوبي', 'هندس', 'عميق', 'توليدي'],
    reply: {
      en: 'Awais is moving from BI into data science and AI engineering — the natural next step from the pipelines and models he already builds, since ML and LLM apps run on exactly that kind of clean, modeled data. His BS in Artificial Intelligence covered machine learning, computer vision and large language models, working with LangChain and Hugging Face. He is open to Data Science and AI Engineering roles as well as BI.',
      ar: 'ينتقل أويس من ذكاء الأعمال إلى علم البيانات وهندسة الذكاء الاصطناعي — وهي الخطوة الطبيعية التالية لخطوط البيانات والنماذج التي يبنيها، إذ تعتمد تطبيقات تعلّم الآلة والنماذج اللغوية على هذا النوع تحديدًا من البيانات النظيفة والمنمذجة. شملت دراسته لبكالوريوس الذكاء الاصطناعي تعلّم الآلة والرؤية الحاسوبية والنماذج اللغوية الكبيرة، مع العمل على LangChain وHugging Face. وهو متاح لوظائف علم البيانات وهندسة الذكاء الاصطناعي إلى جانب ذكاء الأعمال.',
    },
  },
  {
    keys: ['experience', 'work', 'job', 'current', 'currently', 'role', 'beaconhouse', 'company', 'employer', 'position', 'years'],
    ar: ['خبر', 'شرك', 'منصب', 'بيكون', 'حالي', 'سنوات'],
    reply: {
      en: 'Since Sep 2025 Awais has been Assistant Manager BI at Beaconhouse Group, running reporting pipelines across Looker Studio and Power BI and automating ETL in BigQuery, Python and Power Query — cutting manual reporting by 40%. Before that he was a BI Developer at Kaswa.Ai (remote, Jun 2023 – Sep 2025).',
      ar: 'منذ سبتمبر 2025 يعمل أويس مساعد مدير ذكاء الأعمال في مجموعة بيكونهاوس، حيث يدير خطوط التقارير عبر Looker Studio وPower BI ويؤتمت معالجة البيانات في BigQuery وPython وPower Query — ما قلّل إعداد التقارير يدويًا بنسبة 40%. قبل ذلك عمل مطوّر ذكاء أعمال في Kaswa.Ai عن بُعد (يونيو 2023 – سبتمبر 2025).',
    },
  },
  {
    keys: ['kaswa', 'previous', 'before', 'earlier', 'past'],
    ar: ['كاسوا', 'سابق', 'قبل'],
    reply: {
      en: 'At Kaswa.Ai (remote, Jun 2023 – Sep 2025) Awais was a BI Developer: Power BI dashboards with drill-through and advanced DAX, ad-hoc SQL analysis for non-technical teams, and query and pipeline tuning that cut analysis time by 35%.',
      ar: 'في Kaswa.Ai (عن بُعد، يونيو 2023 – سبتمبر 2025) عمل أويس مطوّرًا لذكاء الأعمال: لوحات Power BI مع التنقل التفصيلي وDAX متقدم، وتحليلات SQL لفرق غير تقنية، وتحسين للاستعلامات وخطوط البيانات خفّض زمن التحليل بنسبة 35%.',
    },
  },
  {
    // Told as the journey data takes — the same story the Stack section tells.
    keys: ['skills', 'skill', 'stack', 'tools', 'technologies', 'tech', 'know', 'expertise', 'good', 'use', 'uses'],
    ar: ['مهار', 'تقني', 'ادوات', 'اداه', 'تكنولوج', 'يستخدم', 'برامج'],
    reply: {
      en: 'Awais’s stack follows data from mess to decision:\n1. Ingest — SQL Server, MySQL, Google Sheets and Excel, across five industries.\n2. Transform — BigQuery, Python, Power Query, SSIS and Fabric pipelines that cut manual reporting by 40%.\n3. Model — star schemas and DAX in one certified semantic model, so every team trusts the same numbers.\n4. Visualise — Power BI and Looker Studio dashboards that made analysis 35% faster.\n5. Deliver — scheduled refresh, gateways and row-level security keep it live and governed.\n6. Apply AI — machine learning, LLMs, LangChain and Hugging Face from his BS in Artificial Intelligence: where he is heading next.',
      ar: 'تتبع أدوات أويس رحلة البيانات من الفوضى إلى القرار:\n1. الجمع — SQL Server وMySQL وGoogle Sheets وExcel عبر خمسة قطاعات.\n2. التحويل — خطوط معالجة في BigQuery وPython وPower Query وSSIS وFabric قلّلت العمل اليدوي بنسبة 40%.\n3. النمذجة — مخططات نجمة وDAX في نموذج دلالي معتمد واحد، ليثق كل فريق بالأرقام نفسها.\n4. العرض — لوحات Power BI وLooker Studio جعلت التحليل أسرع بنسبة 35%.\n5. التسليم — تحديث مجدول وبوابات بيانات وصلاحيات على مستوى الصف تُبقي التقارير حيّة ومحوكمة.\n6. تطبيق الذكاء الاصطناعي — تعلّم الآلة والنماذج اللغوية الكبيرة وLangChain وHugging Face من دراسته للذكاء الاصطناعي: وجهته التالية.',
    },
  },
  {
    keys: ['power', 'bi', 'dax', 'powerbi', 'dashboard', 'dashboards', 'report', 'reports', 'looker'],
    ar: ['لوحات', 'لوحه', 'تقارير', 'تقرير', 'داشبورد'],
    reply: {
      en: 'Power BI is Awais’s main tool — star-schema semantic models, advanced DAX, drill-through, row-level security, gateways and scheduled refresh. He also builds in Looker Studio at Beaconhouse. His portfolio has three Power BI case studies you can open.',
      ar: 'Power BI هو أداة أويس الأساسية — نماذج دلالية بمخطط النجمة، وDAX متقدم، وتنقّل تفصيلي، وصلاحيات على مستوى الصف، وبوابات بيانات وتحديث مجدول. كما يبني تقارير في Looker Studio في بيكونهاوس. يضم الموقع ثلاث دراسات حالة في Power BI يمكنك فتحها.',
    },
  },
  {
    keys: ['sql', 'bigquery', 'database', 'query', 'queries', 'warehouse', 'etl', 'pipeline', 'pipelines', 'fabric', 'ssis', 'gcp', 'cloud'],
    ar: ['قاعده', 'قواعد', 'استعلام', 'مستودع', 'سحابه'],
    reply: {
      en: 'Awais builds ETL in Google BigQuery, Python and Power Query, and has worked with SQL Server, MySQL, Microsoft Fabric and SSIS. Pipeline and query tuning has delivered 30–40% improvements in refresh time, latency and manual effort across his roles.',
      ar: 'يبني أويس خطوط معالجة البيانات في Google BigQuery وPython وPower Query، وعمل مع SQL Server وMySQL وMicrosoft Fabric وSSIS. وقد حقّق تحسين الاستعلامات وخطوط البيانات تحسينات بنسبة 30–40% في زمن التحديث والاستجابة والجهد اليدوي.',
    },
  },
  {
    keys: ['python', 'pandas', 'automation', 'automate', 'script', 'scripts'],
    ar: ['بايثون', 'اتمت', 'مؤتمت'],
    reply: {
      en: 'Awais uses Python (pandas, NumPy, Matplotlib) for ETL and reporting automation at Beaconhouse, and it is the language of his AI work: machine learning, computer vision and LLM apps with LangChain and Hugging Face from his BS in Artificial Intelligence.',
      ar: 'يستخدم أويس Python (pandas وNumPy وMatplotlib) لأتمتة معالجة البيانات والتقارير في بيكونهاوس، وهي أيضًا لغة عمله في الذكاء الاصطناعي: تعلّم الآلة والرؤية الحاسوبية وتطبيقات النماذج اللغوية باستخدام LangChain وHugging Face خلال دراسته لبكالوريوس الذكاء الاصطناعي.',
    },
  },
  {
    keys: ['projects', 'project', 'portfolio', 'case', 'studies', 'built', 'build', 'examples', 'samples'],
    ar: ['مشاريع', 'مشروع', 'دراسات', 'امثله'],
    reply: {
      en: 'Three case studies are on the portfolio: Customer Support / Call Centre (with a live Power BI report), E-commerce & Finance, and Healthcare Operations. Data science and AI builds are next. Scroll to Projects to open any case study.',
      ar: 'على الموقع ثلاث دراسات حالة: خدمة العملاء / مركز الاتصال (مع تقرير Power BI حيّ)، والتجارة الإلكترونية والمالية، والعمليات الصحية. ومشاريع علم البيانات والذكاء الاصطناعي هي الخطوة التالية. انتقل إلى قسم المشاريع لفتح أي دراسة حالة.',
    },
  },
  {
    keys: ['education', 'degree', 'university', 'umt', 'study', 'studied', 'graduate', 'bachelor', 'bachelors', 'bs', 'fyp', 'thesis'],
    ar: ['تعليم', 'دراس', 'جامع', 'بكالوريوس', 'تخرج', 'مؤهل', 'درس'],
    reply: {
      en: 'Awais holds a BS in Artificial Intelligence from the University of Management & Technology, Lahore (2021–2025), with coursework in statistics, machine learning, data mining, probability and linear algebra. His final-year project was a genetic-algorithm timetable scheduler that generated clash-free timetables.',
      ar: 'يحمل أويس بكالوريوس الذكاء الاصطناعي من جامعة الإدارة والتكنولوجيا في لاهور (2021–2025)، ودرس الإحصاء وتعلّم الآلة والتنقيب في البيانات والاحتمالات والجبر الخطي. كان مشروع تخرجه نظامًا لجدولة المحاضرات بالخوارزميات الجينية يُنتج جداول خالية من التعارضات.',
    },
  },
  {
    keys: ['certification', 'certifications', 'certificate', 'certified', 'courses', 'course'],
    ar: ['شهادات', 'شهاده', 'دورات', 'دوره'],
    reply: {
      en: 'Awais’s certifications (LinkedIn Learning): Power BI Essential, Power BI Data Modeling with DAX, SQL Server Integration Services (SSIS), Microsoft Fabric: Dataflows & Data Storage, and Microsoft SQL Server Essentials.',
      ar: 'شهادات أويس (LinkedIn Learning): Power BI Essential، وPower BI Data Modeling with DAX، وSQL Server Integration Services (SSIS)، وMicrosoft Fabric: Dataflows & Data Storage، وMicrosoft SQL Server Essentials.',
    },
  },
  {
    keys: ['hire', 'hiring', 'available', 'availability', 'open', 'remote', 'hybrid', 'onsite', 'freelance', 'contract', 'opportunity', 'roles', 'interested', 'recruit', 'vacancy'],
    ar: ['توظيف', 'متاح', 'وظائف', 'وظيفه', 'فرص', 'هجين', 'تعيين'],
    reply: {
      en: `Awais is open to Data Science, AI Engineering and BI roles — on-site, hybrid or remote. The quickest way to start a conversation is ${EMAIL} or the contact form at the bottom of this page.`,
      ar: `أويس متاح لوظائف علم البيانات وهندسة الذكاء الاصطناعي وذكاء الأعمال —حضوريًا أو هجينًا أو عن بُعد. أسرع طريقة لبدء المحادثة هي ${EMAIL} أو نموذج التواصل أسفل هذه الصفحة.`,
    },
  },
  {
    keys: ['contact', 'email', 'reach', 'phone', 'call', 'linkedin', 'message', 'connect', 'number', 'whatsapp'],
    ar: ['تواصل', 'اتصال', 'بريد', 'ايميل', 'هاتف', 'رقم', 'لينكد', 'واتساب', 'راسل'],
    reply: {
      en: `Email: ${EMAIL}\nLinkedIn: https://www.linkedin.com/in/awaisali-bi\nPhone: +92 339 0006901\nOr use the contact form at the bottom of this page.`,
      ar: `البريد الإلكتروني: ${EMAIL}\nلينكدإن: https://www.linkedin.com/in/awaisali-bi\nالهاتف: +92 339 0006901\nأو استخدم نموذج التواصل أسفل هذه الصفحة.`,
    },
  },
  {
    keys: ['resume', 'cv', 'pdf', 'download'],
    ar: ['سيره', 'تحميل'],
    reply: {
      en: 'You can download Awais’s résumé here: https://awaisx.netlify.app/docs/Awais_Ali_BI_Resume.pdf',
      ar: 'يمكنك تحميل السيرة الذاتية لأويس من هنا: https://awaisx.netlify.app/docs/Awais_Ali_BI_Resume.pdf',
    },
  },
  {
    keys: ['location', 'based', 'where', 'live', 'lahore', 'pakistan', 'city', 'country', 'relocate', 'relocation', 'visa'],
    ar: ['مقر', 'يقيم', 'اين', 'مدينه', 'دوله', 'لاهور', 'باكستان', 'انتقال', 'تاشيره'],
    reply: {
      en: `Awais is based in Lahore, Pakistan, and is open to on-site, hybrid or remote work. For relocation or visa questions, it is best to ask him directly at ${EMAIL}.`,
      ar: `يقيم أويس في لاهور، باكستان، وهو متاح للعمل حضوريًا أو هجينًا أو عن بُعد. لأسئلة الانتقال أو التأشيرة، يُفضَّل سؤاله مباشرة على ${EMAIL}.`,
    },
  },
  {
    keys: ['salary', 'rate', 'pay', 'compensation', 'expected', 'expectation', 'expectations', 'package', 'notice', 'charges', 'price'],
    ar: ['راتب', 'رواتب', 'اجر', 'تعويض', 'سعر', 'اشعار'],
    reply: {
      en: `That is best discussed with Awais directly — email ${EMAIL} and he will get back to you.`,
      ar: `يُفضَّل مناقشة ذلك مع أويس مباشرة — راسله على ${EMAIL} وسيرد عليك.`,
    },
  },
];

const FALLBACK = {
  en: `I don’t have that detail. Awais can answer it directly at ${EMAIL}, or you can use the contact form below.`,
  ar: `لا تتوفر لديّ هذه المعلومة. يمكن لأويس الإجابة مباشرة على ${EMAIL}، أو استخدم نموذج التواصل أدناه.`,
};

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'does', 'did', 'he', 'his', 'him', 'awais', 'ali', 'what', 'can', 'you', 'me', 'of', 'in', 'on',
  'for', 'to', 'and', 'with', 'has', 'have', 'how', 'any', 'i', 'it', 'please', 'about', 'tell', 'more', 'some', 'this', 'that', 'my', 'your',
  'ما', 'هي', 'هو', 'في', 'عن', 'على', 'مع', 'كيف', 'هل', 'الى', 'التي', 'الذي', 'لي', 'له', 'اويس', 'علي', 'و',
]);

/* Arabic spelling varies (أ/إ/آ, ة/ه, ى/ي, diacritics); fold it so the stems match. */
const fold = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u060C\u061B\u061F\u066A-\u066D]/g, ' ') // Arabic comma, semicolon, question mark, percent
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ');

export const replyLang = (question) => (ARABIC.test(question) ? 'ar' : /[a-z]/i.test(question) ? 'en' : lang());

export function localAnswer(question) {
  const out = replyLang(question);
  const all = fold(question).split(/\s+/).filter(Boolean);
  const aboutHim = all.some((w) => ['awais', 'ali', 'he', 'his', 'him', 'اويس', 'هو', 'له'].includes(w));
  const words = all.filter((w) => !STOP.has(w));

  let best = null;
  let bestScore = 0;
  for (const note of NOTES) {
    let score = 0;
    for (const w of words) {
      if (note.keys.includes(w)) score += 2;
      else if (note.ar?.some((k) => w === k || (k.length >= 3 && w.includes(k)))) score += 2;
      else if (aboutHim && note.weak?.includes(w)) score += 1;
      else if (/^[a-z]/.test(w) && w.length > 4 && note.keys.some((k) => k.length > 4 && (k.startsWith(w) || w.startsWith(k)))) score += 1;
    }
    if (score > bestScore) { best = note; bestScore = score; }
  }
  return best ? best.reply[out] : FALLBACK[out];
}

/* ── Rendering ─────────────────────────────────────────────
   Text only — links are built as nodes, never through innerHTML,
   so nothing a model returns can inject markup.                  */
const LINK_RE = /(https?:\/\/[^\s)]+[^\s).,;:!?،])|([\w.+-]+@[\w-]+\.[\w.-]+[a-z])|(\+92[\d\s]{9,14}\d)/gi;

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
    a.dir = 'ltr';
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

  function addMessage(role, text, dirLang) {
    const item = document.createElement('div');
    item.className = `chat__msg chat__msg--${role}`;
    const body = document.createElement('p');
    body.dir = dirLang === 'ar' ? 'rtl' : 'ltr';
    renderText(body, dirLang === 'ar' ? keepNames(text) : text);
    item.append(body);
    log.append(item);
    scrollDown();
    return item;
  }

  function addTyping() {
    const item = document.createElement('div');
    item.className = 'chat__msg chat__msg--assistant chat__msg--typing';
    item.setAttribute('role', 'status');
    item.setAttribute('aria-label', t('typing'));
    item.innerHTML = '<span></span><span></span><span></span>';
    log.append(item);
    scrollDown();
    return item;
  }

  async function ask(question, out) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-HISTORY_TURNS), lang: out }),
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

    const out = replyLang(q);
    addMessage('user', q, out);
    history.push({ role: 'user', text: q });
    input.value = '';

    const typing = addTyping();
    const started = performance.now();
    const reply = await ask(q, out);
    // A beat of "typing" so instant local answers don't feel like a glitch.
    const wait = 450 - (performance.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    typing.remove();

    addMessage('assistant', reply, ARABIC.test(reply) ? 'ar' : 'en');
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
      addMessage('assistant', t('greet'), lang());
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
