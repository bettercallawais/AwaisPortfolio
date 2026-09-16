/* ═══════════════════════════════════════════════════════════════
   Awais Ali — Portfolio · English / Arabic
   English lives in the HTML (so it is what crawlers index). Arabic
   lives here, keyed by data-i18n. Switching stores the original
   English on each element first, so switching back is lossless.

   Strings here are authored, never user input, so markup such as
   <b> inside a translation is trusted.
   ═══════════════════════════════════════════════════════════════ */

export const AR_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap';

const AR = {
  'ui.skip': 'تخطَّ إلى المحتوى',
  'ui.loading': 'جارٍ التحميل…',
  'ui.primary': 'التنقل الرئيسي',
  'ui.brand': 'أويس علي — العودة إلى الأعلى',
  'ui.motion': 'تشغيل الحركة أو إيقافها',
  'ui.theme': 'تبديل المظهر',
  'ui.menu': 'القائمة',
  'ui.top': 'إلى الأعلى ↑',
  'ui.close': 'إغلاق',

  'nav.about': 'نبذة',
  'nav.work': 'الخبرات',
  'nav.stack': 'التقنيات',
  'nav.projects': 'المشاريع',
  'nav.contact': 'تواصل',

  'hero.kicker': 'متاح لوظائف علم البيانات وهندسة الذكاء الاصطناعي وذكاء الأعمال',
  'hero.name': 'أويس علي',
  'hero.role': 'ذكاء الأعمال · علم البيانات والذكاء الاصطناعي',
  'hero.blurb': 'أبني الأساس البياني الذي يعتمد عليه الذكاء الاصطناعي — النماذج الدلالية وخطوط معالجة البيانات ولوحات المعلومات — مدعومًا ببكالوريوس في الذكاء الاصطناعي. حاليًا في مجموعة بيكونهاوس في لاهور.',
  'hero.resume': 'السيرة الذاتية',
  'hero.projects': 'استعرض المشاريع',

  'meta.expK': 'الخبرة',
  'meta.expV': 'أكثر من 3 سنوات في ذكاء الأعمال',
  'meta.curK': 'حاليًا',
  'meta.curV': 'مجموعة بيكونهاوس',
  'meta.focK': 'التركيز',
  'meta.focV': 'ذكاء الأعمال · علم البيانات · الذكاء الاصطناعي',
  'meta.basK': 'المقر',
  'meta.basV': 'لاهور، باكستان',

  'about.big': 'أعمل بين أنظمة البيانات المصدرية والأشخاص الذين يحتاجون إلى إجابة بحلول يوم الإثنين.',
  'about.body': 'نماذج مخطط النجمة، وDAX وSQL، ومعالجة بيانات مؤتمتة في BigQuery وPower Query — عبر قطاعات التعليم والتسويق والتجارة الإلكترونية والمالية وسلاسل الإمداد. وأنتقل الآن إلى علم البيانات وهندسة الذكاء الاصطناعي، انطلاقًا من بكالوريوس في الذكاء الاصطناعي.',
  'about.m1': 'أقل في إعداد التقارير يدويًا',
  'about.m2': 'أسرع في التحليل',
  'about.m3': 'أسرع في تحديث التقارير',
  'about.m4': 'سنوات في بناء حلول ذكاء الأعمال',
  'about.roleK': 'المنصب',
  'about.roleV': 'مساعد مدير ذكاء الأعمال',
  'about.coK': 'الشركة',
  'about.degK': 'المؤهل',
  'about.degV': 'بكالوريوس الذكاء الاصطناعي، جامعة الإدارة والتكنولوجيا (UMT)',
  'about.openK': 'متاح للعمل',
  'about.openV': 'حضوريًا · هجين · عن بُعد',

  'schema.eyebrow': 'نموذج البيانات',
  'schema.title': 'كل لوحة معلومات أُسلّمها تبدأ بنموذج كهذا.',
  'schema.sub': 'جدول حقائق واحد بمستوى تفصيل العمل، تحيط به أبعاد موحّدة. اسحب للتدوير، ثم اختر جدولًا لفحصه.',
  'schema.canvas': 'مخطط نجمة ثلاثي الأبعاد تفاعلي: جدول حقائق للمبيعات مرتبط بخمسة جداول أبعاد',
  'schema.pick': 'اختر جدولًا',

  'work.r1.title': 'مساعد مدير، ذكاء الأعمال',
  'work.r1.when': '2025 — الآن',
  'work.r1.org': 'مجموعة بيكونهاوس · لاهور',
  'work.r1.a': 'خطوط تقارير ذكاء الأعمال عبر Looker Studio وPower BI.',
  'work.r1.b': 'أتمتة معالجة البيانات في BigQuery وPython وPower Query — <b>تقليل 40%</b> من إعداد التقارير يدويًا.',
  'work.r1.c': 'الحوكمة والتوثيق وتوجيه المحللين.',
  'work.r2.title': 'مطوّر ذكاء الأعمال',
  'work.r2.org': 'Kaswa.Ai · عن بُعد',
  'work.r2.a': 'لوحات Power BI مع التنقل التفصيلي وDAX متقدم.',
  'work.r2.b': 'تحسين الاستعلامات وخطوط البيانات — <b>تحليل أسرع بنسبة 35%</b>.',
  'work.r2.c': 'تحليلات SQL مخصّصة لأصحاب القرار غير التقنيين.',

  'stack.big': 'كيف تنتقل البيانات عبر أدواتي — من الملفات الخام إلى القرارات، ثم إلى الذكاء الاصطناعي.',
  'stack.s1.name': 'الجمع',
  'stack.s1.story': 'تصل البيانات متفرقة: قواعد بيانات وجداول وملفات مُصدَّرة لا تتطابق تمامًا.',
  'stack.s1.proof': 'خبرة في 5 قطاعات',
  'stack.s2.name': 'التحويل',
  'stack.s2.story': 'خطوط معالجة مؤتمتة تنظّف البيانات وتدمجها وتجدولها، دون نسخ ولصق يدوي.',
  'stack.s2.proof': 'تقليل 40% من العمل اليدوي',
  'stack.s3.name': 'النمذجة',
  'stack.s3.story': 'نموذج دلالي معتمد واحد، ليتناقش كل فريق حول القرارات — لا حول الأرقام.',
  'stack.s3.proof': 'إلغاء المقاييس المكررة',
  'stack.s4.name': 'العرض المرئي',
  'stack.s4.story': 'لوحات تجيب عن «هل نحن بخير؟» قبل «لماذا؟» — مع تنقّل تفصيلي لمعرفة السبب.',
  'stack.s4.proof': 'تحليل أسرع بنسبة 35%',
  'stack.s5.name': 'التسليم',
  'stack.s5.story': 'تقارير حيّة ومحوكمة تُحدَّث تلقائيًا بدلًا من المراجعة الشهرية على جداول البيانات.',
  'stack.s5.proof': 'تحديث أسرع بنسبة 30%',
  'stack.s6.name': 'تطبيق الذكاء الاصطناعي',
  'stack.s6.story': 'الخطوة التالية على النموذج المحوكم نفسه: تنبؤات وإجابات بلغة طبيعية — ليبني الذكاء الاصطناعي على أرقام تثق بها المؤسسة أصلًا.',
  'stack.s6.proof': 'المشروع التالي قيد التنفيذ',
  'stack.foundK': 'الأساس الأكاديمي',
  'stack.foundV': 'بكالوريوس الذكاء الاصطناعي، جامعة UMT — تعلّم الآلة، والرؤية الحاسوبية، والنماذج اللغوية الكبيرة، والإحصاء، والتنقيب في البيانات.',
  'stack.certK': 'الشهادات',

  'proj.big': 'مشاريع مختارة، مع تقارير حيّة حيثما تسمح المشاركة العامة.',
  'proj.live': 'تقرير حيّ',
  'proj.open': 'افتح دراسة الحالة',
  'proj.p1.title': 'خدمة العملاء / مركز الاتصال',
  'proj.p1.sum': 'مدة المعالجة، والحل من أول اتصال، ونسبة المكالمات المتروكة، وبطاقات أداء الموظفين.',
  'proj.p1.d1': 'نموذج مخطط نجمة مع بُعد تاريخ مخصّص يدعم تحليلات الوقت.',
  'proj.p1.d2': 'طبقة DAX للمتوسطات المتحركة والتغيّر السنوي والانحراف عن المستهدف.',
  'proj.p1.d3': 'تنقّل تفصيلي من بطاقة أداء الفريق إلى الموظف الفرد.',
  'proj.p1.d4': 'تقرير حيّ بدلًا من مراجعة شهرية على جداول البيانات.',
  'proj.p2.title': 'التجارة الإلكترونية والمالية',
  'proj.p2.sum': 'الإيرادات والتحويل والاحتفاظ بالعملاء ومتوسط قيمة الطلب في نموذج معتمد واحد.',
  'proj.p2.d1': 'ربط سلوك المتجر الإلكتروني بالنتائج المالية في نموذج واحد.',
  'proj.p2.d2': 'الحفاظ على Query Folding — <b>تحديث أسرع بنسبة 30%</b>.',
  'proj.p2.d3': 'دمج مقاييس المبيعات والمالية المكررة في جدول معتمد واحد.',
  'proj.p3.title': 'العمليات الصحية',
  'proj.p3.sum': 'حالات الدخول، ومدة الإقامة، وإشغال الأسرّة، والنتائج.',
  'proj.p3.d1': 'الإشغال مقابل السعة مع حدود للإنذار المبكر.',
  'proj.p3.d2': 'مدة الإقامة حسب القسم عبر الزمن.',
  'proj.p3.d3': 'تصميم يجيب عن «هل نحن بخير؟» قبل «لماذا؟».',

  'contact.big': 'متاح لوظائف علم البيانات وهندسة الذكاء الاصطناعي وذكاء الأعمال.',
  'contact.email': 'البريد الإلكتروني',
  'contact.linkedin': 'لينكدإن',
  'contact.phone': 'الهاتف',
  'contact.resume': 'السيرة الذاتية',
  'contact.pdf': 'تحميل PDF',
  'contact.name': 'الاسم',
  'contact.message': 'الرسالة',
  'contact.send': 'إرسال',

  'chat.title': 'اسأل عن أويس',
  'chat.sub': 'مساعد الملف المهني',
  'chat.close': 'إغلاق المحادثة',
  'chat.c1': 'ماذا يعمل؟',
  'chat.c2': 'التقنيات',
  'chat.c3': 'المشاريع',
  'chat.c4': 'التواصل',
  'chat.q1': 'ماذا يعمل أويس؟',
  'chat.q2': 'ما هي التقنيات التي يستخدمها أويس؟',
  'chat.q3': 'ما هي مشاريع أويس؟',
  'chat.q4': 'كيف أتواصل مع أويس؟',
  'chat.label': 'سؤالك',
  'chat.placeholder': 'اكتب سؤالك…',
};

/* Strings created from JavaScript rather than markup. */
export const UI = {
  en: {
    title: 'Awais Ali | BI, Data Science & AI',
    away: ':(',
    langButton: 'اقرأ بالعربية',
    sending: 'Sending…',
    sent: 'Sent',
    send: 'Send',
    sentMsg: 'Sent. I’ll reply to your email shortly.',
    failMsg: 'Could not send — please email',
    liveReport: 'Live report',
    liveTitle: 'live Power BI report',
    greet: 'Hi, I’m Awais’s portfolio assistant. Ask me about his experience, skills, projects or how to get in touch.',
    typing: 'Assistant is typing',
    fact: 'Fact table',
    dim: 'Dimension',
    factRel: '5 relationships · a star, not a snowflake',
    dimRel: 'Many-to-one → FACT_SALES · single direction',
    measure: 'measure',
  },
  ar: {
    title: 'أويس علي | ذكاء الأعمال وعلم البيانات والذكاء الاصطناعي',
    away: ':(',
    langButton: 'Read in English',
    sending: 'جارٍ الإرسال…',
    sent: 'تم الإرسال',
    send: 'إرسال',
    sentMsg: 'تم الإرسال. سأرد على بريدك الإلكتروني قريبًا.',
    failMsg: 'تعذّر الإرسال — يُرجى المراسلة مباشرة على',
    liveReport: 'تقرير حيّ',
    liveTitle: 'تقرير Power BI حيّ',
    greet: 'مرحبًا، أنا مساعد أويس. اسألني عن خبراته ومهاراته ومشاريعه، أو عن طريقة التواصل معه.',
    typing: 'المساعد يكتب',
    fact: 'جدول حقائق',
    dim: 'جدول بُعد',
    factRel: '5 علاقات · مخطط نجمة لا ندفة ثلج',
    dimRel: 'متعدد إلى واحد ← FACT_SALES · باتجاه واحد',
    measure: 'مقياس',
  },
};

/* The star schema shown in 3D. Column names are technical identifiers,
   so they stay in English in both languages, as they would in a model. */
export const TABLES = {
  FACT_SALES: {
    kind: 'fact',
    desc: {
      en: 'Grain: one row per order line. Every measure is additive, so it rolls up cleanly by any dimension.',
      ar: 'مستوى التفصيل: صف لكل بند طلب. جميع المقاييس قابلة للجمع، فتُجمَّع بسلاسة حسب أي بُعد.',
    },
    cols: [
      ['date_key', 'FK'], ['product_key', 'FK'], ['customer_key', 'FK'], ['store_key', 'FK'], ['channel_key', 'FK'],
      ['quantity', 'M'], ['net_revenue', 'M'], ['cost', 'M'],
    ],
    dax: 'Revenue YoY % =\nDIVIDE (\n    [Revenue] - [Revenue PY],\n    [Revenue PY]\n)',
  },
  DIM_DATE: {
    kind: 'dim',
    desc: {
      en: 'A marked date table — the engine behind YTD, MTD and year-over-year time intelligence.',
      ar: 'جدول تاريخ مخصّص — المحرّك وراء التحليل منذ بداية السنة والشهر والمقارنة السنوية.',
    },
    cols: [['date_key', 'PK'], ['date'], ['month'], ['quarter'], ['fiscal_year'], ['is_holiday']],
  },
  DIM_PRODUCT: {
    kind: 'dim',
    desc: {
      en: 'Category and brand hierarchies, so a report drills from portfolio down to SKU.',
      ar: 'تسلسلات هرمية للفئة والعلامة التجارية، ليتنقّل التقرير من المحفظة حتى رمز المنتج.',
    },
    cols: [['product_key', 'PK'], ['sku'], ['product_name'], ['category'], ['brand']],
  },
  DIM_CUSTOMER: {
    kind: 'dim',
    desc: {
      en: 'Customer segments — and the table row-level security filters on, so each team sees only its own.',
      ar: 'شرائح العملاء — والجدول الذي تُطبَّق عليه صلاحيات مستوى الصف، ليرى كل فريق بياناته فقط.',
    },
    cols: [['customer_key', 'PK'], ['segment'], ['city'], ['region'], ['first_order_date']],
  },
  DIM_STORE: {
    kind: 'dim',
    desc: {
      en: 'Store and region, conformed so sales, inventory and targets all slice the same way.',
      ar: 'المتجر والمنطقة، موحّدان لتُقسَّم المبيعات والمخزون والمستهدفات بالطريقة نفسها.',
    },
    cols: [['store_key', 'PK'], ['store_name'], ['region'], ['manager']],
  },
  DIM_CHANNEL: {
    kind: 'dim',
    desc: {
      en: 'Channel and campaign — where marketing attribution meets revenue.',
      ar: 'القناة والحملة — حيث يلتقي إسناد التسويق بالإيرادات.',
    },
    cols: [['channel_key', 'PK'], ['channel'], ['campaign'], ['source']],
  },
};

/* Inside Arabic text, a product name that wraps mid-name ("Power" at the end
   of one line, "BI" at the start of the next) also scrambles the bidi order
   around it. A no-break space keeps each name as one unit. */
const PRODUCT = /\b(Power|Looker|Microsoft|Google|Apps|SQL|Query|Data|Row-level|Kaswa|LinkedIn|Hugging)\s(BI|Query|Studio|Fabric|Sheets|Script|Server|BigQuery|Folding|Modeling|Learning|security|Face)\b/g;
export const keepNames = (s) => s.replace(PRODUCT, '$1\u00A0$2');

export const lang = () => (document.documentElement.lang === 'ar' ? 'ar' : 'en');
export const t = (key) => UI[lang()][key] ?? UI.en[key] ?? key;

/* Apply the current language to every tagged node under `root`. */
export function applyLang(root = document) {
  const ar = lang() === 'ar';

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!('en' in el.dataset)) el.dataset.en = el.innerHTML;
    el.innerHTML = ar && AR[key] != null ? keepNames(AR[key]) : el.dataset.en;
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const store = `en${attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
      if (!(store in el.dataset)) el.dataset[store] = el.getAttribute(attr) ?? '';
      el.setAttribute(attr, ar && AR[key] != null ? AR[key] : el.dataset[store]);
    });
  });
}

/* Text for keys that script.js renders itself (e.g. the split hero name). */
export const text = (key, fallback) => (lang() === 'ar' && AR[key] != null ? AR[key] : fallback);

export function setLang(next) {
  const root = document.documentElement;
  root.lang = next;
  root.dir = next === 'ar' ? 'rtl' : 'ltr';
  try { localStorage.setItem('lang', next); } catch { /* private mode */ }

  if (next === 'ar' && !document.getElementById('font-ar')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.id = 'font-ar';
    l.href = AR_FONT_HREF;
    document.head.appendChild(l);
  }

  // Keep a shared ?lang= link accurate without adding history entries.
  const url = new URL(location.href);
  if (next === 'ar') url.searchParams.set('lang', 'ar');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);

  applyLang();
  document.title = t('title');
  document.dispatchEvent(new CustomEvent('site:lang', { detail: next }));
}
