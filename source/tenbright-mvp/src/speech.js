/* Tenbright speech plan: turns anything Pip says into recorded clips.
 * The same code decides which clips to record (build time) and which to play (in the app),
 * so a sentence always maps to clips that exist, or falls back to the device voice.
 * Works in the browser (window.TBSpeech) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  const FRAC_SAY = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'], 100: ['hundredth', 'hundredths'] };
  // any denominator gets a real word: 30 -> thirtieth(s), 24 -> twenty-fourth(s)
  const ORD = { one: 'first', two: 'second', three: 'third', four: 'fourth', five: 'fifth', six: 'sixth', seven: 'seventh', eight: 'eighth', nine: 'ninth', ten: 'tenth', eleven: 'eleventh', twelve: 'twelfth', thirteen: 'thirteenth', fourteen: 'fourteenth', fifteen: 'fifteenth', sixteen: 'sixteenth', seventeen: 'seventeenth', eighteen: 'eighteenth', nineteen: 'nineteenth', twenty: 'twentieth', thirty: 'thirtieth', forty: 'fortieth', fifty: 'fiftieth', sixty: 'sixtieth', seventy: 'seventieth', eighty: 'eightieth', ninety: 'ninetieth', hundred: 'hundredth' };
  function ordinalWord(n) {
    const w = intChunks(Number(n)).join(' ').replace(/ /g, '-');
    return w.replace(/([a-z]+)$/, (x) => ORD[x] || x + 'th');
  }
  const fracSay = (a, b) => {
    if (b === '?') return a + ' over what';
    const nm = FRAC_SAY[b] || (() => { const o = ordinalWord(b); return [o, o + 's']; })();
    if (a === '?') return 'how many ' + nm[1];
    return a + ' ' + (a === '1' ? nm[0] : nm[1]);
  };
  // symbols become the words a narrator would say
  function speakable(text) {
    return String(text)
      .replace(/(\d+|\?)\/(\d+|\?)/g, (m0, a, b) => fracSay(a, b))
      .replace(/(\d) R (\d|\?)/g, '$1 remainder $2')
      .replace(/⬚/g, ' blank ')
      .replace(/\s<\s/g, ' is less than ')
      .replace(/\s>\s/g, ' is greater than ')
      .replace(/(\d)\s*\+\s*(\d)/g, '$1 plus $2')
      .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 minus $2')
      .replace(/(\d)\s*×\s*(\d)/g, '$1 times $2')
      .replace(/(\d)\s*÷\s*(\d)/g, '$1 divided by $2')
      .replace(/=\s*\?/g, ' equals what?')
      .replace(/=/g, ' equals ')
      .replace(/\s*\?\s*$/g, '?')
      .replace(/[−]/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/\+/g, ' plus ')
      .replace(/[’]/g, "'")
      .replace(/\s{2,}/g, ' ').trim();
  }
  // sentence ends are . ! ? followed by a space or the end (a decimal point is not a sentence end)
  const sentences = (text) => speakable(text).split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const under100 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
  function chunks3(n) {
    const out = [], h = Math.floor(n / 100), r = n % 100;
    if (h) out.push(ONES[h] + ' hundred');
    if (r) out.push(under100(r));
    return out;
  }
  function intChunks(n) {
    if (n === 0) return ['zero'];
    if (n >= 1e6) return null;
    const out = [], th = Math.floor(n / 1000), r = n % 1000;
    if (th) { out.push(...chunks3(th)); out.push('thousand'); }
    if (r) out.push(...chunks3(r));
    return out;
  }
  // "372,415" -> three hundred | seventy-two | thousand | four hundred | fifteen ; "3.05" -> three | point | zero | five
  function numberChunks(str) {
    const s = String(str).replace(/,/g, '');
    const [w, f] = s.split('.');
    const out = intChunks(Number(w || 0));
    if (!out) return null;
    if (f !== undefined && f !== '') { out.push('point'); for (const d of f) out.push(ONES[Number(d)]); }
    return out;
  }
  const NUM_WORDS = (() => { const all = new Set(); for (let n = 0; n < 100; n++) all.add(under100(n)); for (let h = 1; h < 10; h++) all.add(ONES[h] + ' hundred'); all.add('thousand'); all.add('point'); return [...all]; })();

  const keyOf = (t) => String(t).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // one sentence -> clip keys. Whole-sentence clips ("S:") win when they exist; otherwise phrase pieces ("P:") and number words ("N:")
  // spelled-out numbers like "three hundred four" or "seventy-two" reuse the number clips (single words such as "one" or "ten" stay in their phrase)
  const NW = 'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand';
  const WORD_RUN = new RegExp('\\b(?:' + NW + ')(?:[ -](?:' + NW + '))*\\b', 'gi');
  const WVAL = {}; ONES.forEach((w, i) => { WVAL[w] = i; }); TENS.forEach((w, i) => { if (w) WVAL[w] = i * 10; });
  function wordsToNumber(run) {
    let total = 0, cur = 0;
    for (const w of run.toLowerCase().split(/[ -]+/)) {
      if (w === 'hundred') cur = (cur || 1) * 100;
      else if (w === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
      else cur += WVAL[w];
    }
    return total + cur;
  }
  function numberTokens(sentence) {
    const toks = [], re = /\d[\d,]*(?:\.\d+)?/g; let m;
    while ((m = re.exec(sentence))) { const raw = m[0].replace(/,$/, ''); toks.push({ i: m.index, len: raw.length, chunks: numberChunks(raw) }); }
    WORD_RUN.lastIndex = 0;
    while ((m = WORD_RUN.exec(sentence))) {
      if (!/hundred|thousand|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety/i.test(m[0])) continue;
      if (/^(hundred|thousand)\b/i.test(m[0])) continue;
      if (/^-?[a-z]/i.test(sentence.slice(m.index + m[0].length, m.index + m[0].length + 2)) && sentence[m.index + m[0].length] === '-') continue;
      if (/[a-z]-$/i.test(sentence.slice(Math.max(0, m.index - 2), m.index))) continue;
      if (toks.some((t) => m.index < t.i + t.len && t.i < m.index + m[0].length)) continue;
      toks.push({ i: m.index, len: m[0].length, chunks: intChunks(wordsToNumber(m[0])) });
    }
    return toks.sort((a, b) => a.i - b.i);
  }
  function segment(sentence) {
    const parts = [];
    let last = 0;
    for (const t of numberTokens(sentence)) {
      const before = sentence.slice(last, t.i);
      if (keyOf(before)) parts.push({ key: 'P:' + keyOf(before), text: before.replace(/^[\s,;:]+|[\s,;:]+$/g, '') });
      if (!t.chunks) return null;
      t.chunks.forEach((c) => parts.push({ key: 'N:' + c, text: c }));
      last = t.i + t.len;
    }
    const tail = sentence.slice(last);
    if (keyOf(tail)) parts.push({ key: 'P:' + keyOf(tail), text: tail.replace(/^[\s,;:]+|[\s,;:]+$/g, '') });
    return parts;
  }
  const sentenceKey = (s) => 'S:' + keyOf(s);
  // the clip plan for a whole utterance, or null if any clip is missing
  function plan(text, has) {
    const out = [];
    for (const s of sentences(text)) {
      if (has(sentenceKey(s))) { out.push([sentenceKey(s)]); continue; }
      const seg = segment(s);
      if (!seg || !seg.length || seg.some((p) => !has(p.key))) return null;
      out.push(seg.map((p) => p.key));
    }
    return out.length ? out : null;
  }

  const api = { speakable, sentences, numberChunks, segment, sentenceKey, keyOf, plan, NUM_WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TBSpeech = api;
})(typeof window !== 'undefined' ? window : globalThis);
