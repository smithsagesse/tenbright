/* Tenbright translations. English is the source; every other language is looked up by sentence pattern.
 * A pattern replaces numbers {N}, written-out numbers {W}, names {P}, objects {T} and math blanks {Q} with slots,
 * so "Ava has 8 beads" and "Kofi has 12 cards" share one translation. Slots are filled back in each language's style.
 * Works in the browser (window.TBi18n) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  const LANGS = { en: 'English', es: 'Español', fr: 'Français', ht: 'Kreyòl ayisyen', zh: '繁體中文', ar: 'العربية' };
  const HTML_LANG = { en: 'en', es: 'es-419', fr: 'fr', ht: 'ht', zh: 'zh-Hant-TW', ar: 'ar' };
  const RTL = { ar: true };
  const SPEECH_LANG = { en: 'en-US', es: 'es-US', fr: 'fr-FR', ht: 'ht-HT', zh: 'zh-TW', ar: 'ar-SA' };
  const DICT = { es: {}, fr: {}, ht: {}, zh: {}, ar: {} };
  const NAMES = ['Ava', 'Kofi', 'Mei', 'Diego', 'Amara', 'Liam', 'Priya', 'Noah', 'Zara', 'Mateo', 'Hana', 'Elijah', 'Sofia', 'Kai', 'Nia', 'Omar', 'Maya'];
  const NAME_ZH = { Ava: '艾娃', Kofi: '科菲', Mei: '小美', Diego: '迪亞哥', Amara: '阿瑪拉', Liam: '連恩', Priya: '普莉雅', Noah: '諾亞', Zara: '莎拉', Mateo: '馬帝歐', Hana: '花子', Elijah: '以利亞', Sofia: '蘇菲亞', Kai: '凱', Nia: '妮亞', Omar: '歐瑪', Maya: '瑪雅' };
  // Arabic names, with the gender that Arabic verbs agree with (⟨masculine|feminine⟩ forms in the translations)
  const NAME_AR = { Ava: 'آفا', Kofi: 'كوفي', Mei: 'مي', Diego: 'دييغو', Amara: 'أمارا', Liam: 'ليام', Priya: 'بريا', Noah: 'نوح', Zara: 'زارا', Mateo: 'ماتيو', Hana: 'هنا', Elijah: 'إلياس', Sofia: 'صوفيا', Kai: 'كاي', Nia: 'نيا', Omar: 'عمر', Maya: 'مايا' };
  const FEMALE = { Ava: 1, Mei: 1, Amara: 1, Priya: 1, Zara: 1, Hana: 1, Sofia: 1, Nia: 1, Maya: 1 };
  const THINGS = ['loaves of bread', 'beads', 'stickers', 'shells', 'marbles', 'stamps', 'leaves', 'cards', 'acorns', 'pizzas', 'pies', 'melons'];
  // word problems: objects chosen so the sentence agrees in each language (all feminine in Spanish and French)
  const THING_L = {
    es: { beads: 'cuentas', stickers: 'calcomanías', shells: 'conchas', marbles: 'canicas', stamps: 'estampillas', leaves: 'hojas', cards: 'tarjetas', acorns: 'bellotas', pizzas: 'pizzas', pies: 'tartas', 'loaves of bread': 'barras de pan', melons: 'sandías' },
    fr: { beads: 'perles', stickers: 'images', shells: 'coquilles', marbles: 'billes', stamps: 'cartes postales', leaves: 'feuilles', cards: 'cartes', acorns: 'noisettes', pizzas: 'pizzas', pies: 'tartes', 'loaves of bread': 'baguettes', melons: 'pastèques' },
    ht: { beads: 'pèl', stickers: 'etikèt', shells: 'kokiy', marbles: 'mab', stamps: 'tenm', leaves: 'fèy', cards: 'kat', acorns: 'zanmann', pizzas: 'pitza', pies: 'tat', 'loaves of bread': 'pen', melons: 'melon dlo' },
    ar: { beads: 'خرزات', stickers: 'ملصقات', shells: 'أصداف', marbles: 'كرات زجاجية', stamps: 'طوابع', leaves: 'أوراق شجر', cards: 'بطاقات', acorns: 'ثمرات بلوط', pizzas: 'قطع بيتزا', pies: 'فطائر', 'loaves of bread': 'أرغفة خبز', melons: 'بطيخات' },
    zh: { beads: '顆珠子', stickers: '張貼紙', shells: '個貝殼', marbles: '顆彈珠', stamps: '張郵票', leaves: '片葉子', cards: '張卡片', acorns: '顆橡實', pizzas: '個披薩', pies: '個派', 'loaves of bread': '條麵包', melons: '顆西瓜' }
  };
  const NW = 'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand';
  const EN_ONES = NW.split('|').slice(0, 20), EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const wordsToNumber = (run) => {
    let total = 0, cur = 0;
    for (const w of run.toLowerCase().split(/[ -]+/)) {
      if (w === 'hundred') cur = (cur || 1) * 100;
      else if (w === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
      else { const i = EN_ONES.indexOf(w); cur += i >= 0 ? i : EN_TENS.indexOf(w) * 10; }
    }
    return total + cur;
  };
  // Spanish, French and Chinese number words (for numbers written out, like "three hundred four")
  const ES1 = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const ES10 = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const ES100 = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  function esWords(n) {
    if (n < 30) return ES1[n];
    if (n < 100) return ES10[Math.floor(n / 10)] + (n % 10 ? ' y ' + ES1[n % 10] : '');
    if (n === 100) return 'cien';
    if (n < 1000) return ES100[Math.floor(n / 100)] + (n % 100 ? ' ' + esWords(n % 100) : '');
    const th = Math.floor(n / 1000), r = n % 1000;
    return (th === 1 ? 'mil' : esWords(th).replace(/uno$/, 'ún') + ' mil') + (r ? ' ' + esWords(r) : '');
  }
  const FR1 = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const FR10 = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  function frWords(n, final = true) {
    if (n < 20) return FR1[n];
    if (n < 70) { const t = Math.floor(n / 10), o = n % 10; return FR10[t] + (o === 1 ? ' et un' : o ? '-' + FR1[o] : ''); }
    if (n < 80) return 'soixante' + (n === 71 ? ' et onze' : '-' + FR1[n - 60]);
    if (n < 100) return 'quatre-vingt' + (n === 80 ? (final ? 's' : '') : '-' + FR1[n - 80]);
    if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'cent' : FR1[h] + ' cent' + (r === 0 && final ? 's' : '')) + (r ? ' ' + frWords(r, final) : ''); }
    const th = Math.floor(n / 1000), r = n % 1000;
    return (th === 1 ? 'mille' : frWords(th, false) + ' mille') + (r ? ' ' + frWords(r, final) : '');
  }
  // Haitian Creole number words, standard spelling (venteyen, vennde, ventwa…; swasanndis; katreven)
  const HT1 = ['zewo', 'en', 'de', 'twa', 'kat', 'senk', 'sis', 'sèt', 'uit', 'nèf', 'dis', 'onz', 'douz', 'trèz', 'katòz', 'kenz', 'sèz', 'disèt', 'dizwit', 'diznèf'];
  const HT10 = { 2: ['vent', 'venn', 'ven'], 3: ['trant', 'trann', 'trant'], 4: ['karant', 'karann', 'karant'], 5: ['senkant', 'senkann', 'senkant'], 6: ['swasant', 'swasann', 'swasant'] };
  function htWords(n) {
    if (n < 20) return HT1[n];
    if (n < 70) { const t = Math.floor(n / 10), o = n % 10, [tf, nf, bare] = HT10[t]; if (!o) return bare; if (o === 1) return tf + 'eyen'; if (o === 3) return tf.replace(/t$/, '') + 'twa'; return ([3, 7, 8, 9].includes(o) ? tf : nf) + HT1[o]; }
    if (n < 80) return 'swasann' + HT1[n - 60];
    if (n < 100) return 'katreven' + (n > 80 ? ' ' + HT1[n - 80] : '');
    if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'san' : HT1[h] + ' san') + (r ? ' ' + htWords(r) : ''); }
    const th = Math.floor(n / 1000), r = n % 1000;
    return (th === 1 ? 'mil' : htWords(th) + ' mil') + (r ? ' ' + htWords(r) : '');
  }
  const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  function zhWords(n) {
    if (n === 0) return '零';
    const unit = ['', '十', '百', '千'];
    const four = (x) => { let s = '', zero = false; const ds = String(x).padStart(4, '0').split('').map(Number); ds.forEach((d, i) => { const u = unit[3 - i]; if (d === 0) { zero = s.length > 0; } else { if (zero) s += '零'; s += ZH[d] + u; zero = false; } }); return s; };
    let s = '';
    if (n >= 10000) s += four(Math.floor(n / 10000)) + '萬' + (n % 10000 && n % 10000 < 1000 ? '零' : '');
    s += n % 10000 ? four(n % 10000) : '';
    return s.replace(/^一十/, '十').replace(/(^|[萬零])二(?=[千百])/g, '$1兩');
  }
  // Modern Standard Arabic number words (cardinal, masculine counting form, as read aloud)
  const AR1 = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const AR10 = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const AR100 = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];
  function arWords(n) {
    if (n < 20) return AR1[n];
    if (n < 100) { const o = n % 10, t = AR10[Math.floor(n / 10)]; return o ? AR1[o] + ' و' + t : t; }
    if (n < 1000) { const r = n % 100; return AR100[Math.floor(n / 100)] + (r ? ' و' + arWords(r) : ''); }
    const th = Math.floor(n / 1000), r = n % 1000;
    const thw = th === 1 ? 'ألف' : th === 2 ? 'ألفان' : th <= 10 ? AR1[th] + ' آلاف' : arWords(th) + ' ألفًا';
    return thw + (r ? ' و' + arWords(r) : '');
  }
  const numberWords = (lang, n) => (lang === 'es' ? esWords(n) : lang === 'fr' ? frWords(n) : lang === 'ht' ? htWords(n) : lang === 'zh' ? zhWords(n) : lang === 'ar' ? arWords(n) : null);
  // numbers in each language's written style
  function fmtNumber(lang, s) {
    if (lang !== 'fr') return s;
    return s.replace(/(\d),(?=\d{3})/g, '$1 ').replace(/(\d)\.(\d)/g, '$1,$2');
  }

  // a sentence becomes a pattern plus the slot values, in order
  const SLOT_RE = new RegExp([
    '\\b\\d\\.[A-Z]{2,3}\\.[A-D]\\.\\d+[a-z]?\\b',
    '\\b(?:one|two|three|four|five|six|seven|eight|nine)(?: hundred)(?:[ -](?:' + NW + '))*\\b',
    '\\b(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(?:one|two|three|four|five|six|seven|eight|nine)\\b',
    '\\d+(?:,\\d{3})*(?:\\.\\d+)?',
    '\\b(?:' + NAMES.join('|') + ')\\b',
    '(?<=(?:\\d|\\bthe|\\bsome|\\bof|\\bmany|\\ball|\\bloose|\\bmore) )(?:' + THINGS.join('|') + ')\\b',
    '(?<![A-Za-z0-9])\\?(?=$|[\\s/,.)])'
  ].join('|'), 'g');
  // children's nicknames (typed by parents, any spelling) are name slots too, so "Settings for Zed" translates
  let NICKS = [], NICK_RE = null;
  function setNicknames(list) {
    const n = Array.from(new Set((list || []).map((x) => String(x || '').trim()).filter((x) => x && !NAMES.includes(x) && !/^(pip|tenbright)$/i.test(x)))).sort((a, b) => b.length - a.length);
    if (n.join('\u0001') === NICKS.join('\u0001')) return;
    NICKS = n;
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    NICK_RE = n.length ? new RegExp('(?<![A-Za-z0-9\u00C0-\uFFFF])(?:' + n.map(esc).join('|') + ')(?![A-Za-z0-9\u00C0-\uFFFF])|' + SLOT_RE.source, 'g') : null;
  }
  function patternOf(s) {
    const slots = [];
    const key = String(s).replace(NICK_RE || SLOT_RE, (m, off, all) => {
      let type;
      if (NICKS.includes(m)) type = 'P';
      else if (/^\d\.[A-Z]/.test(m)) type = 'C';
      else if (/^\d/.test(m)) type = 'N';
      else if (m === '?') type = 'Q';
      else if (NAMES.includes(m)) type = 'P';
      else if (THINGS.includes(m)) type = 'T';
      else type = 'W';
      // a "?" right after a word is punctuation, not a blank
      slots.push({ type, value: m });
      return '{' + type + '}';
    });
    return { key, slots };
  }
  function renderSlot(lang, slot) {
    if (slot.type === 'N') return fmtNumber(lang, slot.value);
    if (slot.type === 'Q') return '?';
    if (slot.type === 'C') return slot.value;
    if (slot.type === 'P') return lang === 'zh' ? NAME_ZH[slot.value] || slot.value : lang === 'ar' ? NAME_AR[slot.value] || slot.value : slot.value;
    if (slot.type === 'T') return (THING_L[lang] || {})[slot.value] || slot.value;
    if (slot.type === 'W') return numberWords(lang, wordsToNumber(slot.value)) || slot.value;
    return slot.value;
  }
  // fill a translation: "{N}" takes the next number slot, "{N2}" the second one, and so on for each slot type
  function fill(lang, tr, slots) {
    const byType = {}; slots.forEach((s) => { (byType[s.type] = byType[s.type] || []).push(s); });
    const used = {};
    // Arabic verbs agree with the person in the story: ⟨masculine|feminine⟩
    if (/⟨/.test(tr)) { const p = (byType.P || [])[0], fem = !!(p && FEMALE[p.value]); tr = tr.replace(/⟨([^|⟩]*)\|([^⟩]*)⟩/g, (m0, m, f) => (fem ? f : m)); }
    return tr.replace(/\{([NWPTQC])(\d*)\}/g, (m, type, idx) => {
      const arr = byType[type] || [];
      let slot;
      if (idx) slot = arr[Number(idx) - 1];
      else { used[type] = (used[type] || 0); slot = arr[used[type]++]; }
      return slot ? renderSlot(lang, slot) : m;
    });
  }
  // sentence wrappers: the inside is translated on its own
  const FRAMES = [
    [/^Step (\d+): ([\s\S]+)$/, 'Step {N}: {S}'], [/^Let’s solve one together: ([\s\S]+)$/, 'Let’s solve one together: {S}'], [/^Not quite\. Look again: ([\s\S]+)$/, 'Not quite. Look again: {S}'],
    [/^Here it is: ([\s\S]+)$/, 'Here it is: {S}'], [/^Here is why: ([\s\S]+)$/, 'Here is why: {S}'], [/^A clue! ([\s\S]+)$/, 'A clue! {S}'], [/^Nice thinking! ([\s\S]+)$/, 'Nice thinking! {S}'],
    [/^Yes! ([\s\S]+)$/, 'Yes! {S}'], [/^Not quite\. ([\s\S]+)$/, 'Not quite. {S}'], [/^Write the problem: ([\s\S]+)$/, 'Write the problem: {S}'], [/^Pip's idea: ([\s\S]+)$/, "Pip's idea: {S}"], [/^I heard: ([\s\S]+)$/, 'I heard: {S}'], [/^Story numbers: ([\s\S]+)$/, 'Story numbers: {S}'],
    [/^The answer is ([\s\S]+)$/, 'The answer is {S}'], [/^Look again: ([\s\S]+)$/, 'Look again: {S}'], [/^Next on the map: ([\s\S]+)$/, 'Next on the map: {S}']
  ];
  // sentence ends, plus the seam between a math line and the words after it ("4 + ? = 10 Pip answered 14.")
  const splitSentences = (s) => String(s).split(/(?<=\.["”]?)\s+(?=[A-Za-z0-9¿¡“"(×÷=<>+−])|(?<=[!?]["”]?)\s+(?=[A-Z0-9¿¡“"(])|(?<=!)\s+(?=[×÷])|(?<=\S)\s+(?=(?:Pip answered|Work it out|Get your paper|Tell me when|Write this on|Write that down|Then we)\b)/);
  let LANG = 'en';
  const misses = new Set();
  const has = (d, k) => Object.prototype.hasOwnProperty.call(d, k);
  function lookup1(lang, sentence) {
    const d = DICT[lang]; if (!d) return null;
    if (has(d, sentence)) return d[sentence];
    const p = patternOf(sentence);
    if (has(d, p.key)) return fill(lang, d[p.key], p.slots);
    return null;
  }
  const endMark = (lang) => (lang === 'zh' ? '。' : '.');
  function lookup(lang, sentence) {
    const d = DICT[lang]; if (!d) return null;
    const s0 = sentence.replace(/\.{2,}$/, '.');
    let r = lookup1(lang, s0);
    if (r !== null) return r;
    // the same sentence with or without its final full stop
    if (/\.$/.test(s0)) { r = lookup1(lang, s0.slice(0, -1)); if (r !== null) return /[.!?。！？]$/.test(r) ? r : r + endMark(lang); }
    else if (!/[.!?:]$/.test(s0)) { r = lookup1(lang, s0 + '.'); if (r !== null) return r.replace(/[.。]$/, ''); }
    // lists: "a; b; c" and "a · b" are translated piece by piece
    for (const sep of ['; ', ' · ']) {
      if (s0.includes(sep)) {
        const bits = s0.replace(/\.$/, '').split(sep);
        const tr = bits.map((b) => { if (/^\d\.[A-Z]{2,3}\.[A-D]\.\d+[a-z]?$/.test(b) || wordless(b)) return b; const cap = b.charAt(0).toUpperCase() + b.slice(1); const x = lookup(lang, b) || (cap !== b ? lookup(lang, cap) : null); return x === null ? null : (cap !== b && lang !== 'zh' && x === lookup(lang, cap) ? x.charAt(0).toLowerCase() + x.slice(1) : x); });
        if (tr.every((x) => x !== null)) return tr.map((x) => x.replace(/[.。]$/, '')).join(sep === '; ' && lang === 'zh' ? '；' : sep) + (/\.$/.test(s0) ? endMark(lang) : '');
      }
    }
    for (const [re, k] of FRAMES) {
      const m = re.exec(s0);
      if (m && has(d, k)) {
        const inner = t(m[m.length - 1], lang);
        return d[k].replace('{S}', () => inner).replace('{N}', () => fmtNumber(lang, m[1]));
      }
    }
    // a step with its answer blank ("2 wholes are 2 × 2 = ? halves.") reads like the finished step
    if (/(^|\s)\?(\s|$)/.test(s0) && !s0.includes('7070707')) {
      for (const v of [s0.replace(/(^|\s)\?(?=\s|$)/g, '$17070707'), s0.replace(/(^|\s)\? (?=make a)/g, '$17070707, ')]) {
        if (v === s0) continue;
        const x = lookup(lang, v);
        if (x !== null && x.includes('7070707')) return x.replace(/7070707/g, '?').replace(/\?[,，] ?/, '? ');
      }
    }
    // a name used inside a sentence starts with a small letter ("… in subtract 2-digit numbers")
    if (/^[a-z]/.test(s0)) {
      const x = lookup(lang, s0.charAt(0).toUpperCase() + s0.slice(1));
      if (x !== null) return lang === 'zh' ? x : x.charAt(0).toLowerCase() + x.slice(1);
    }
    return null;
  }
  // a line with no words in it (only numbers, symbols and the remainder mark R) needs no translation
  const wordless = (core) => !/[A-Za-z]/.test(core.replace(/(\d|\?) R (?=\d|\?)/g, '$1  ').replace(/^R (?=\d)/, ''));
  function translateSentence(lang, s, quiet) {
    const lead = s.match(/^[\s,;:·]*/)[0], trail = s.match(/\s*$/)[0], core = s.slice(lead.length).trim();
    if (!core || wordless(core)) return lang === 'fr' ? s.replace(/\d[\d,]*(?:\.\d+)?/g, (m) => fmtNumber(lang, m)) : s;
    const t = lookup(lang, core);
    if (t === null) { if (!quiet) misses.add(core); return null; }
    return lead + t + trail;
  }
  // translate any text; falls back to English sentence by sentence
  function t(text, lang) {
    lang = lang || LANG;
    if (lang === 'en' || text === null || text === undefined) return text;
    const s = String(text);
    const parts = splitSentences(s);
    const whole = translateSentence(lang, s, parts.length > 1);
    if (whole !== null) return whole;
    if (parts.length < 2) return s;
    return parts.map((p) => { const x = translateSentence(lang, p); return x === null ? p : x; }).join(lang === 'zh' ? '' : ' ');
  }

  // ---------- speech in each language ----------
  const FRAC_W = {
    es: { 2: ['medio', 'medios'], 3: ['tercio', 'tercios'], 4: ['cuarto', 'cuartos'], 5: ['quinto', 'quintos'], 6: ['sexto', 'sextos'], 7: ['séptimo', 'séptimos'], 8: ['octavo', 'octavos'], 9: ['noveno', 'novenos'], 10: ['décimo', 'décimos'], 12: ['doceavo', 'doceavos'], 100: ['centésimo', 'centésimos'] },
    fr: { 2: ['demi', 'demis'], 3: ['tiers', 'tiers'], 4: ['quart', 'quarts'], 5: ['cinquième', 'cinquièmes'], 6: ['sixième', 'sixièmes'], 7: ['septième', 'septièmes'], 8: ['huitième', 'huitièmes'], 9: ['neuvième', 'neuvièmes'], 10: ['dixième', 'dixièmes'], 12: ['douzième', 'douzièmes'], 100: ['centième', 'centièmes'] },
    ar: { 2: ['نصف', 'أنصاف'], 3: ['ثلث', 'أثلاث'], 4: ['ربع', 'أرباع'], 5: ['خمس', 'أخماس'], 6: ['سدس', 'أسداس'], 7: ['سبع', 'أسباع'], 8: ['ثمن', 'أثمان'], 9: ['تسع', 'أتساع'], 10: ['عشر', 'أعشار'] },
    ht: { 2: ['demi', 'demi'], 3: ['tyè', 'tyè'], 4: ['ka', 'ka'], 5: ['senkyèm', 'senkyèm'], 6: ['sizyèm', 'sizyèm'], 7: ['setyèm', 'setyèm'], 8: ['uityèm', 'uityèm'], 9: ['nevyèm', 'nevyèm'], 10: ['dizyèm', 'dizyèm'], 12: ['douzyèm', 'douzyèm'], 100: ['santyèm', 'santyèm'] }
  };
  const SYM = {
    es: { plus: ' más ', minus: ' menos ', times: ' por ', div: ' entre ', eqq: ' es igual a ¿cuánto?', eq: ' es igual a ', lt: ' es menor que ', gt: ' es mayor que ', rem: ' residuo ', blank: ' espacio ' },
    fr: { plus: ' plus ', minus: ' moins ', times: ' fois ', div: ' divisé par ', eqq: ' égale combien ?', eq: ' égale ', lt: ' est plus petit que ', gt: ' est plus grand que ', rem: ' reste ', blank: ' case vide ' },
    ht: { plus: ' plis ', minus: ' mwens ', times: ' fwa ', div: ' divize pa ', eqq: ' egal konbyen?', eq: ' egal ', lt: ' pi piti pase ', gt: ' pi gran pase ', rem: ' rès ', blank: ' espas vid ' },
    ar: { plus: ' زائد ', minus: ' ناقص ', times: ' ضرب ', div: ' قسمة ', eqq: ' يساوي كم؟', eq: ' يساوي ', lt: ' أصغر من ', gt: ' أكبر من ', rem: ' والباقي ', blank: ' فراغ ' },
    zh: { plus: '加', minus: '減', times: '乘以', div: '除以', eqq: '等於多少？', eq: '等於', lt: '小於', gt: '大於', rem: '餘', blank: '空格' }
  };
  function speakableL(lang, text) {
    const y = SYM[lang]; if (!y) return text;
    let s = String(text).replace(/[\u2066-\u2069\u200e\u200f]/g, '');
    s = s.replace(/(\d+|\?)\/(\d+|\?)/g, (m0, a, b) => {
      if (lang === 'ar') {
        const nm = FRAC_W.ar[b];
        if (a === '?') return 'كم ' + (nm ? nm[0] : 'جزءًا من ' + b);
        if (b === '?') return a + ' على كم';
        return nm ? (a === '1' ? nm[0] + ' واحد' : a === '2' ? nm[0] + 'ان' : a + ' ' + (+a <= 10 ? nm[1] : nm[0])) : a + ' على ' + b;
      }
      if (lang === 'zh') return (b === '?' ? '幾' : b) + '分之' + (a === '?' ? '幾' : a);
      const nm = FRAC_W[lang][b];
      if (lang === 'ht') {
        if (a === '?') return 'konbyen ' + (nm ? nm[1] : 'pati sou ' + b);
        if (b === '?') return a + ' sou konbyen';
        return nm ? (a === '1' ? 'yon ' + nm[0] : a + ' ' + nm[1]) : a + ' sou ' + b;
      }
      if (a === '?') return lang === 'es' ? '¿cuántos ' + (nm ? nm[1] : 'partes de ' + b) + '?' : 'combien de ' + (nm ? nm[1] : 'parts sur ' + b);
      if (b === '?') return a + (lang === 'es' ? ' sobre ¿cuánto?' : ' sur combien');
      return nm ? (a === '1' ? (lang === 'es' ? 'un ' : 'un ') + nm[0] : a + ' ' + nm[1]) : a + (lang === 'es' ? ' sobre ' : ' sur ') + b;
    });
    s = s.replace(/(\d) R (\d|\?)/g, '$1' + y.rem + '$2').replace(/⬚/g, y.blank).replace(/\s<\s/g, y.lt).replace(/\s>\s/g, y.gt)
      .replace(/=\s*\?/g, y.eqq).replace(/=/g, y.eq).replace(/\+/g, y.plus).replace(/[−]/g, y.minus).replace(/(\d)\s*-\s*(\d)/g, '$1' + y.minus + '$2').replace(/×/g, y.times).replace(/÷/g, y.div)
      .replace(/(\d) (\d)/g, '$1$2');
    return s.replace(/\s{2,}/g, ' ').trim();
  }
  // spoken numbers and commands in each language
  const ES_W = {}; ES1.forEach((w, i) => { ES_W[w] = i; }); ES10.forEach((w, i) => { if (w) ES_W[w] = i * 10; });
  Object.assign(ES_W, { un: 1, una: 1, veintiún: 21, dieciseis: 16, veintidos: 22, veintitres: 23, veintiseis: 26 });
  const ES_H = { cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900 };
  const FR_W = { zéro: 0, zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };
  const HT_W = {}; for (let n = 0; n < 80; n++) HT_W[htWords(n)] = n; HT_W.katreven = 80; HT_W.youn = 1; HT_W.yon = 1; HT_W.dezwit = 18; HT_W.zero = 0;
  const ZH_D = { 零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  function zhToNumber(t) {
    const m = t.match(/[零〇一二兩两三四五六七八九十百千萬万點点]+/); if (!m) return null;
    const [w, f] = m[0].split(/[點点]/);
    let total = 0, sec = 0, num = 0;
    for (const ch of w) {
      if (ch in ZH_D) num = ZH_D[ch];
      else if (ch === '十') { sec += (num || 1) * 10; num = 0; }
      else if (ch === '百') { sec += num * 100; num = 0; }
      else if (ch === '千') { sec += num * 1000; num = 0; }
      else if (ch === '萬' || ch === '万') { total += (sec + num) * 10000; sec = 0; num = 0; }
    }
    const whole = String(total + sec + num);
    return f !== undefined ? whole + '.' + f.split('').map((c) => ZH_D[c]).join('') : whole;
  }
  // Arabic spoken numbers: "ثلاثمئة وخمسة وأربعون", "اثنين", "مية" (common spoken forms are accepted too)
  const AR_W = { صفر: 0, واحد: 1, واحدة: 1, اثنان: 2, اثنين: 2, اثنتان: 2, اثنتين: 2, ثلاثة: 3, ثلاث: 3, أربعة: 4, اربعة: 4, أربع: 4, اربع: 4, خمسة: 5, خمس: 5, ستة: 6, ست: 6, سبعة: 7, سبع: 7, ثمانية: 8, ثماني: 8, ثمان: 8, تسعة: 9, تسع: 9, عشرة: 10, عشر: 10 };
  const AR_T = { عشرون: 20, عشرين: 20, ثلاثون: 30, ثلاثين: 30, أربعون: 40, أربعين: 40, اربعين: 40, خمسون: 50, خمسين: 50, ستون: 60, ستين: 60, سبعون: 70, سبعين: 70, ثمانون: 80, ثمانين: 80, تسعون: 90, تسعين: 90 };
  const AR_H = { مئة: 100, مائة: 100, مية: 100, ميه: 100, مئتان: 200, مئتين: 200, ميتين: 200, ثلاثمئة: 300, ثلاثمائة: 300, أربعمئة: 400, أربعمائة: 400, اربعمية: 400, خمسمئة: 500, خمسمائة: 500, ستمئة: 600, ستمائة: 600, سبعمئة: 700, سبعمائة: 700, ثمانمئة: 800, ثمانمائة: 800, ثمانمية: 800, تسعمئة: 900, تسعمائة: 900 };
  function arToNumber(t) {
    const toks = t.replace(/[^\u0621-\u064A\s]/g, ' ').split(/\s+/).filter(Boolean).map((w) => (w.length > 2 && w.startsWith('و') && !(w in AR_W) ? w.slice(1) : w));
    let total = 0, cur = 0, seen = false, frac = '', inFrac = false;
    for (let i = 0; i < toks.length; i++) {
      const w = toks[i];
      if (w === 'فاصلة' || w === 'فاصل' || w === 'نقطة') { inFrac = true; seen = true; continue; }
      if ((w === 'عشر' || w === 'عشرة') && i > 0 && (toks[i - 1] in AR_W) && AR_W[toks[i - 1]] < 10) { cur += 10; continue; } // ثلاثة عشر = 13
      if (w === 'أحد' || w === 'احد' || w === 'حداش' || w === 'إحدى') { cur += 1; seen = true; continue; }
      if (w === 'اثنا' || w === 'اثني' || w === 'اثنتا') { cur += 2; seen = true; continue; }
      if (w in AR_W) { if (inFrac) frac += String(AR_W[w]); else cur += AR_W[w]; seen = true; continue; }
      if (w in AR_T) { cur += AR_T[w]; seen = true; continue; }
      if (w in AR_H) { cur += AR_H[w]; seen = true; continue; }
      if (w === 'ألف' || w === 'الف' || w === 'آلاف' || w === 'الاف' || w === 'ألفا' || w === 'ألفًا') { total += (cur || 1) * 1000; cur = 0; seen = true; continue; }
      if (w === 'ألفان' || w === 'ألفين' || w === 'الفين') { total += 2000; seen = true; continue; }
    }
    if (!seen) return null;
    const whole = String(total + cur);
    return inFrac ? (frac ? whole + '.' + frac : null) : whole;
  }
  function wordsNumber(lang, raw) {
    let t = String(raw).toLowerCase().trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6F0)).replace(/٫/g, '.');
    const dg = t.replace(/(\d)[\s ](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/);
    if (dg) return dg[0].replace(',', '.');
    if (lang === 'zh') return zhToNumber(t);
    if (lang === 'ar') return arToNumber(t);
    const toks = t.replace(/[-–]/g, ' ').replace(/[^a-záéíóúüñàâçèêëîïôûœ ]/g, ' ').split(/\s+/).filter(Boolean);
    let total = 0, cur = 0, seen = false, frac = '', inFrac = false, prev = 0;
    for (const w of toks) {
      if (['punto', 'coma', 'virgule', 'point'].includes(w)) { inFrac = true; seen = true; continue; }
      if (lang === 'ht') {
        if (w in HT_W) { if (inFrac) frac += String(HT_W[w]); else cur += HT_W[w]; seen = true; continue; }
        if (w === 'san') { cur = (cur || 1) * 100; seen = true; continue; }
        if (w === 'mil') { total += (cur || 1) * 1000; cur = 0; seen = true; continue; }
        if (w === 'pwen' || w === 'vigil') { inFrac = true; seen = true; continue; }
      } else if (lang === 'es') {
        if (w === 'y') continue;
        if (w in ES_W) { if (inFrac) frac += String(ES_W[w]); else cur += ES_W[w]; seen = true; continue; }
        if (w in ES_H) { cur += ES_H[w]; seen = true; continue; }
        if (w === 'mil') { total += (cur || 1) * 1000; cur = 0; seen = true; continue; }
      } else {
        if (w === 'et') continue;
        if (w === 'cent' || w === 'cents') { cur = (cur || 1) * 100; seen = true; continue; }
        if (w === 'mille') { total += (cur || 1) * 1000; cur = 0; seen = true; continue; }
        if (w === 'quatre' && false) continue;
        if (w in FR_W) {
          const v = FR_W[w];
          if (inFrac) { frac += String(v); seen = true; continue; }
          if (v === 20 && prev === 4) { cur += 76; prev = 0; seen = true; continue; } // quatre-vingt
          if (v < 20 && (cur % 100 === 60 || cur % 100 === 80) && v >= 10) { cur += v; prev = v; seen = true; continue; }
          cur += v; prev = v; seen = true; continue;
        }
      }
      if (seen) continue;
      if (['es', 'la', 'respuesta', 'creo', 'que', 'le', 'la', 'réponse', 'est', "c'est", 'je', 'pense'].includes(w)) continue;
    }
    if (!seen) return null;
    const whole = String(total + cur);
    return inFrac ? (frac ? whole + '.' + frac : null) : whole;
  }
  const CMDS = {
    es: [['next', /(siguiente|listo|lista|ya|contin[uú]a|sigue|lo escrib[ií])/], ['back', /(atr[aá]s|anterior|regresa)/], ['repeat', /(repite|otra vez|de nuevo|qu[eé] dijiste)/], ['help', /(ayuda|pista|no s[eé])/], ['check', /(comprueba|comprobar|revisa)/], ['clear', /(borra|borrar)/]],
    fr: [['next', /(suivant|pr[eê]t|c'est bon|continue|je l'ai [eé]crit)/], ['back', /(retour|pr[eé]c[eé]dent|reviens)/], ['repeat', /(r[eé]p[eè]te|encore|quoi)/], ['help', /(aide|indice|je ne sais pas)/], ['check', /(v[eé]rifie)/], ['clear', /(efface)/]],
    ht: [['next', /(swivan|pwochen|kontinye|m(?:wen)? pare|m(?:wen)? fini|m(?:wen)? ekri l)/], ['back', /(retounen|tounen|anvan)/], ['repeat', /(repete|ankò|anko|kisa ou di)/], ['help', /(ède|ede|èd|m(?:wen)? pa konn)/], ['check', /(verifye|tcheke)/], ['clear', /(efase)/]],
    ar: [['next', /(التالي|التالية|بعده|جاهز|انتهيت|خلصت|كتبت|تابع|استمر|كمل)/], ['back', /(رجوع|ارجع|السابق|للخلف)/], ['repeat', /(كرر|أعد|اعد|مرة أخرى|مره ثانيه|ماذا قلت|شو قلت)/], ['help', /(مساعدة|ساعدني|تلميح|لا أعرف|لا اعرف|ما بعرف)/], ['check', /(تحقق|افحص|صحح)/], ['clear', /(امسح|احذف)/]],
    zh: [['next', /(下一|好了|繼續|继续|寫好|写好)/], ['back', /(上一|返回|回去)/], ['repeat', /(再說|再说|重複|重复)/], ['help', /(幫忙|帮忙|提示|不知道)/], ['check', /(檢查|检查)/], ['clear', /(清除|刪除)/]]
  };
  const SIGNS = {
    es: [['>', /(mayor|m[aá]s grande)/], ['<', /(menor|m[aá]s peque[nñ]o)/], ['=', /(igual)/]],
    fr: [['>', /(plus grand|sup[eé]rieur)/], ['<', /(plus petit|inf[eé]rieur)/], ['=', /([eé]gal)/]],
    ht: [['>', /(pi gran|pi gwo)/], ['<', /(pi piti)/], ['=', /(egal)/]],
    ar: [['>', /(أكبر|اكبر)/], ['<', /(أصغر|اصغر)/], ['=', /(يساوي|تساوي)/]],
    zh: [['>', /(大於|大于)/], ['<', /(小於|小于)/], ['=', /(等於|等于)/]]
  };
  function parseVoiceL(lang, alts, item, translateChoice) {
    // a command wins when the words hold no other number ("下一個" has 一 in it but means "next")
    for (const a of alts) {
      const t = String(a).toLowerCase();
      for (const [cmd, re] of CMDS[lang]) if (re.test(t) && wordsNumber(lang, t.replace(new RegExp(re.source, 'g'), ' ').replace(/一[次遍下個个]|[個个次題题]/g, ' ')) === null) return { kind: 'command', value: cmd };
    }
    for (const a of alts) {
      const t = String(a).toLowerCase();
      if (item && item.format === 'choice') {
        if (item.textChoices) { const hit = item.choices.find((c) => t.includes(String(translateChoice(c)).toLowerCase())); if (hit) return { kind: 'choice', value: hit }; }
        if (item.choices.includes('<')) for (const [sg, re] of SIGNS[lang]) if (re.test(t)) return { kind: 'choice', value: sg };
      }
      const n = wordsNumber(lang, t);
      if (n !== null) {
        if (item && item.format === 'choice' && !item.textChoices) { const hit = item.choices.find((c) => Number(c) === Number(n)); if (hit) return { kind: 'choice', value: hit }; }
        return { kind: 'number', value: n };
      }
    }
    for (const a of alts) { const t = String(a).toLowerCase(); for (const [cmd, re] of CMDS[lang]) if (re.test(t)) return { kind: 'command', value: cmd }; }
    return { kind: 'unknown', value: alts[0] || '' };
  }
  const setLang = (l) => { LANG = LANGS[l] ? l : 'en'; };
  const getLang = () => LANG;
  const add = (lang, entries) => Object.assign(DICT[lang], entries);
  const api = { RTL, setNicknames, speakableL, wordsNumber, parseVoiceL, LANGS, HTML_LANG, SPEECH_LANG, DICT, add, t, setLang, getLang, patternOf, fill, numberWords, fmtNumber, misses, splitSentences, NAMES, THINGS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TBi18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
