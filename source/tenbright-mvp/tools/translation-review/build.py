"""Builds tenbright-translation-review.xlsx (all five languages) from rows.json and the previous review file.
Run from source/tenbright-mvp: python3 build_review.py <rows.json> <old.xlsx> <out.xlsx>"""
import json, re, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L

rows = json.load(open(sys.argv[1]))
old = {r[2]: r for r in load_workbook(sys.argv[2])['Strings'].iter_rows(min_row=2, values_only=True)}
OUT = sys.argv[3]

NAVY, YELLOW, WHITE = 'FF1F3A5F', 'FFFFF2CC', 'FFFFFFFF'
HF = Font(name='Arial', bold=True, color=WHITE, size=10)
BF = Font(name='Arial', size=10)
HFILL = PatternFill('solid', fgColor=NAVY)
YFILL = PatternFill('solid', fgColor=YELLOW)
WRAP = Alignment(wrap_text=True, vertical='top')
THIN = Border(bottom=Side(style='thin', color='FFD9D9D9'))

LANGS = [('es', 'Spanish', 'ES'), ('fr', 'French', 'FR'), ('ht', 'Haitian Creole', 'HT'), ('zh', 'Chinese', 'ZH'), ('ar', 'Arabic', 'AR')]

# ---------- reviewer notes, by rule (the same wording on every matching row) ----------
SLOTS = 'Slots stay as written ({N} number, {W} number in words, {P} name, {T} object, {Q} blank, {C} standard code, {S} a whole sentence); {N1}, {N2}… reorder them.'
FRAG = 'Fragment: shown next to a number or bold word; check it reads well in place in the app.'
LEGAL = 'Legal/privacy wording: have counsel confirm the translation.'
MONEY = 'Money: the app teaches US coins (penny 1¢, nickel 5¢, dime 10¢, quarter 25¢) and cents as math objects, never as a reward. Drafts: ES centavos, FR centimes and "pièce de 10 cents", HT santim and peni/nikèl/dim/kwota, ZH 分 and 元, AR سنت. Confirm the words a child in your community would use for US coins.'
UNITS = 'Units: US Grade 2–3 teaches both inches and centimeters; keep both. Drafts: ES pulgadas/centímetros, FR pouces/centimètres, HT pous/santimèt, ZH 英寸/公分, AR بوصة/سنتيمتر.'
TIME = 'Time: clocks are read in 12-hour h:mm in every language. Check the words for "o’clock", "half past" and the short/long hand.'
GRADE = 'Grade naming: ES "{N}.º grado", FR "Niveau {N}", HT "Ane {N}", ZH "{N}年級", AR "الصف {N}". Confirm FR for your market (CP–CM2 in France, "e année" in Québec).'
GENDER = 'Arabic: ⟨masculine|feminine⟩ pairs are chosen by the app to agree with the name in the story; review both forms and keep the ⟨…|…⟩ marks.'
SHAPES = 'Geometry words: check the school terms for triangle/quadrilateral/pentagon/hexagon, right angle, straight angle, perimeter and area (see the Glossary tab).'

def notes_for(r, oldnote):
    k = r['key']; n = []
    if re.search(r'\{[NWPTQCS]\d?\}', k): n.append(SLOTS)
    if (oldnote and 'Fragment' in oldnote) or re.search(r':$', k) or (k[:1].islower() and not re.search(r'[.!?]$', k) and len(k) < 40): n.append(FRAG)
    # privacy and terms pages: the previous file's flags on interface rows, plus wording rules (home activities about sharing food are not legal text)
    if (oldnote and 'Legal' in oldnote and old.get(k, [None, ''])[1] == 'interface' and k != 'I collect light-beads.') or re.search(r'privacy|consent|guardian|COPPA|personal information|learning data|sell or share|transcript|sent to a server|train AI|your rights|^Contact: \[|purchases|no chat, camera|parental', k, re.I): n.append(LEGAL)
    if re.search(r'\b(cents?|dollars?|coins?|penny|pennies|nickels?|dimes?|quarters?|price|change from|costs?)\b', k, re.I) and not re.search(r'quarter turn|quarters? of', k): n.append(MONEY)
    if re.search(r'\b(inch|inches|centimet\w+|cm)\b', k) or k in ('in', '{N} in'): n.append(UNITS)
    if re.search(r'\{N\}:\{N\}|o’clock|half past|long hand|short hand|minutes past|Clock Tower|clock face|the clock|A clock|clock number|clock hands|What time', k, re.I) and not re.search(r'demo', k, re.I): n.append(TIME)
    if re.search(r'Grade \{N\}', k): n.append(GRADE)
    if '⟨' in (r['ar'] or ''): n.append(GENDER)
    if re.search(r'\b(triangle|quadrilateral|pentagon|hexagon|right angle|straight angle|perimeter|area)\b', k, re.I): n.append(SHAPES)
    return ' '.join(dict.fromkeys(n)) or None

# ---------- where it appears: source category, else the previous file's, else a rule ----------
def where_for(r):
    if r['where']: return r['where']
    o = old.get(r['key'])
    if o and o[1]: return o[1]
    k = r['key']
    if k.startswith('Check:') or re.search(r'\{N\} is \{N\} (thousand|hundred)', k): return 'lesson (plain words)'
    if re.search(r'rod|pushed (up|down)|^\{N\} (penny|pennies|nickels?|dimes?|quarters?)$|^Coins:|^A clock\.|hand |^A ruler|^A grid|ribbon is \{N\} long|^Two ribbons|^A closed shape|^A rectangle|^The object|part is not known|^One part|^The (long|short) side|split into two parts', k): return 'screen-reader label'
    if re.search(r'^(Build the Bridge|Pizza Shop|Number Detective)', k): return 'parent: games'
    if re.search(r'first try|Extra ways|Number bonds|Mental abacus|Vertically and crosswise|Nikhilam', k): return 'strategy library'
    if re.search(r'weeks?|working on|Builds on|Opens next|Trends', k): return 'parent: dashboard'
    return 'interface'

def example_for(r):
    if r['found']: return r['example']
    o = old.get(r['key'])
    return o[3] if o and o[3] else None

wb = Workbook()
# ---------- How to review ----------
h = wb.active; h.title = 'How to review'
n_new = sum(1 for r in rows if r['key'] not in old)
text = [
    ('Tenbright translation review', 'title'),
    ('Spanish (Latin America), French (international), Haitian Creole (standard spelling), Traditional Chinese (Taiwan) and Modern Standard Arabic. All text was machine-drafted and checked by software for missing numbers and slots, not by native speakers. Nothing ships to families until this review is done.', None),
    ('This file lists every phrase the app translates: %d per language (%d of them added since the previous review file of November 25, 2026, mostly lessons, money, time, measuring, shapes, games and the parent pages). Prepared November 26, 2026 from the app source.' % (len(rows), n_new), None),
    (None, None),
    ('What to do', 'head'),
    ('1. Open the "Strings" tab and go to your language\'s three columns: F–H Spanish, I–K French, L–N Haitian Creole, O–Q Chinese, R–T Arabic. Columns A–E (number, where it appears, English, an example, notes) are the same for everyone.', None),
    ('2. In the yellow "Status" column pick OK, Fix or Unsure. Only the yellow columns are for you to edit.', None),
    ('3. For Fix, write the full corrected text in the yellow "Correction" column. Keep every {N}, {W}, {P}, {T}, {Q}, {C} or {S} exactly once; you may reorder numbers with {N1}, {N2}…', None),
    ('4. Start with the "Check first" tab: the rows most likely to need a native decision (money, units, time, grade names, legal wording, Arabic gender forms, geometry words).', None),
    ('5. The "Progress" tab counts your answers automatically.', None),
    ('6. Use "Where it appears" to filter: lessons and questions are child-facing; rows starting "parent:" and the privacy pages are for grown-ups; "screen-reader label" text is read aloud to blind or low-vision users, never shown.', None),
    (None, None),
    ('Example of a filled-in row (Spanish)', 'head'),
    ('English: "Break a ten: ones become {N}"  →  Draft: "Desagrupa una decena: las unidades pasan a ser {N}"  →  Status: Fix  →  Correction: "Desagrupa una decena: ahora hay {N} unidades"', None),
    (None, None),
    ('Audience and register', 'head'),
    ('Child-facing lines (lesson, hint, question, worked step, Pip, game): informal "tú"/"tu"/"ou"/"你"/"أنت", short, warm, ages 6–11. Parent-facing lines (parent:, interface settings, privacy): formal "usted"/"vous"; Kreyòl "ou" and Chinese "你" serve both; Arabic uses plural "أنتم" forms for home activities addressed to the family.', None),
    ('Math terms follow school usage: ES decena/unidad/centena, desagrupar/llevar; FR dizaine/unité/centaine, retenue; ZH 個位/十位/百位, 進位/退位, 分子/分母; AR الآحاد/العشرات/المئات, البسط/المقام. See the Glossary tab, which also lists terms where the drafts are not yet consistent.', None),
    ('Arabic: the page reads right to left while every number, sign and equation stays left to right. Digits are Western (0–9), as on the keypad. Names in stories have Arabic spellings, and ⟨masculine|feminine⟩ pairs let verbs agree with each name.', None),
    ('In the app, English Pip uses recorded audio; the other languages are read by the device\'s own on-device voice, so please also listen to a few lines on a real phone or tablet.', None),
]
for i, (t, kind) in enumerate(text, 1):
    c = h.cell(i, 1, t)
    c.font = Font(name='Arial', bold=kind is not None, size=14 if kind == 'title' else 11)
    c.alignment = Alignment(wrap_text=True, vertical='top')
h.column_dimensions['A'].width = 120

# ---------- Strings ----------
s = wb.create_sheet('Strings')
hdr = ['#', 'Where it appears', 'English (pattern)', 'Example as shown in English', 'Notes for reviewer']
for _, name, ab in LANGS: hdr += [name + ' draft', ab + ' status', ab + ' correction']
for j, t in enumerate(hdr, 1):
    c = s.cell(1, j, t); c.font = HF; c.fill = HFILL; c.alignment = Alignment(wrap_text=True, vertical='center')
last = len(rows) + 1
for i, r in enumerate(rows, 2):
    o = old.get(r['key'])
    vals = [r['n'], where_for(r), r['key'], example_for(r), notes_for(r, o[4] if o else None)]
    for code, _, _ in LANGS: vals += [r[code], None, None]
    for j, v in enumerate(vals, 1):
        c = s.cell(i, j, v); c.font = BF; c.alignment = WRAP; c.border = THIN
        if isinstance(v, str) and v[:1] in '=+-@': c.data_type = 's'; c.quotePrefix = True  # text such as "= {N}", never a formula
        if j > 5 and (j - 6) % 3 in (1, 2): c.fill = YFILL
    s.cell(i, 18).alignment = Alignment(wrap_text=True, vertical='top', horizontal='right', readingOrder=2)
    s.cell(i, 20).alignment = Alignment(wrap_text=True, vertical='top', horizontal='right', readingOrder=2)
widths = [6, 18, 48, 34, 40] + [44, 10, 36] * 5
for j, w in enumerate(widths, 1): s.column_dimensions[L(j)].width = w
s.freeze_panes = 'D2'
s.auto_filter.ref = 'A1:%s%d' % (L(len(hdr)), last)
s.row_dimensions[1].height = 31.5
dv = DataValidation(type='list', formula1='"OK,Fix,Unsure"', allow_blank=True, showDropDown=False)
dv.error = 'Pick OK, Fix or Unsure.'; dv.errorTitle = 'Status'
dv.sqref = ' '.join('%s2:%s%d' % (L(7 + 3 * k), L(7 + 3 * k), last) for k in range(5))
s.add_data_validation(dv)

# ---------- Progress ----------
p = wb.create_sheet('Progress', 1)
ph = ['Language', 'Strings', 'OK', 'Fix', 'Unsure', 'Not yet reviewed', 'Reviewed (%)']
for j, t in enumerate(ph, 1):
    c = p.cell(1, j, t); c.font = HF; c.fill = HFILL
for k, (_, name, _) in enumerate(LANGS):
    i = k + 2; col = L(7 + 3 * k); rng = 'Strings!$%s$2:$%s$%d' % (col, col, last)
    p.cell(i, 1, name)
    p.cell(i, 2, '=COUNTA(Strings!$A$2:$A$%d)' % last)
    p.cell(i, 3, '=COUNTIF(%s,"OK")' % rng); p.cell(i, 4, '=COUNTIF(%s,"Fix")' % rng); p.cell(i, 5, '=COUNTIF(%s,"Unsure")' % rng)
    p.cell(i, 6, '=B%d-C%d-D%d-E%d' % (i, i, i, i)); p.cell(i, 7, '=IF(B%d=0,0,(C%d+D%d+E%d)/B%d)' % (i, i, i, i, i))
    p.cell(i, 7).number_format = '0.0%'
    for j in range(1, 8): p.cell(i, j).font = BF
for col, w in zip('ABCDEFG', [16, 10, 8, 8, 8, 18, 14]): p.column_dimensions[col].width = w

# ---------- Check first ----------
cf = wb.create_sheet('Check first')
for j, t in enumerate(['#', 'Why it needs a native decision', 'English (pattern)', 'Where it appears'], 1):
    c = cf.cell(1, j, t); c.font = HF; c.fill = HFILL
REASONS = [(MONEY, 'Money: US coin and cent words'), (UNITS, 'Units: inches and centimeters'), (TIME, 'Time: clock words'), (GRADE, 'Grade naming'), (LEGAL, 'Legal/privacy wording: counsel to confirm'), (GENDER, 'Arabic: masculine/feminine pairs'), (SHAPES, 'Geometry school terms')]
out = []
for r in rows:
    o = old.get(r['key']); nt = notes_for(r, o[4] if o else None) or ''
    why = [label for full, label in REASONS if full in nt]
    if why: out.append((REASONS.index(next(x for x in REASONS if x[1] == why[0])), r['n'], '; '.join(why), r['key'], where_for(r)))
out.sort()
for i, (_, n, why, k, w) in enumerate(out, 2):
    for j, v in enumerate([n, why, k, w], 1):
        c = cf.cell(i, j, v); c.font = BF; c.alignment = WRAP
        if isinstance(v, str) and v[:1] in '=+-@': c.data_type = 's'; c.quotePrefix = True
cf.column_dimensions['A'].width = 7; cf.column_dimensions['B'].width = 40; cf.column_dimensions['C'].width = 70; cf.column_dimensions['D'].width = 22
cf.freeze_panes = 'A2'; cf.auto_filter.ref = 'A1:D%d' % (len(out) + 1)

# ---------- Glossary ----------
g = wb.create_sheet('Glossary')
gh = ['English', 'Spanish (Latin America)', 'French (international)', 'Haitian Creole', 'Chinese (Taiwan)', 'Arabic (MSA)', 'Note']
for j, t in enumerate(gh, 1):
    c = g.cell(1, j, t); c.font = HF; c.fill = HFILL
GL = [
    ('ones / tens / hundreds (place)', 'unidades / decenas / centenas', 'unités / dizaines / centaines', 'inite / dizèn / santèn', '個位 / 十位 / 百位', 'الآحاد / العشرات / المئات', 'ZH "個十" for "a ten" as a unit'),
    ('thousands / ten thousands', 'millares / decenas de millar', 'milliers / dizaines de mille', 'milye / dizèn milye', '千位 / 萬位', 'الآلاف / عشرات الآلاف', None),
    ('tenths / hundredths / thousandths', 'décimos / centésimos / milésimos', 'dixièmes / centièmes / millièmes', 'dizyèm / santyèm / milyèm', '十分位 / 百分位 / 千分位', 'الأعشار / الأجزاء من مئة / الأجزاء من ألف', None),
    ('break a ten (regroup in subtraction)', 'desagrupar una decena', 'casser une dizaine', 'kraze yon dizèn', '退位 / 拆一個十', 'فُكّ عشرة', 'FR "emprunt" is also common; choose one. The app never says "borrow".'),
    ('regroup (adding and subtracting)', 'reagrupar', 'regrouper', 'regwoupe', '進位 / 退位', 'إعادة التجميع', None),
    ('carry / make a ten', 'llevar / formar una decena', 'retenue / faire une dizaine', 'pote / fè yon dizèn', '進位 / 湊成十', 'كوّن عشرة', None),
    ('decimal point', 'punto decimal', 'virgule', 'pwen desimal', '小數點', 'الفاصلة العشرية', 'FR shows 3,5 and the keypad shows ","; ES-419 keeps 3.5; HT uses the point like the app (Haitian schools also write the comma "vigil": confirm)'),
    ('top / bottom number (fraction)', 'el de arriba / el de abajo', 'le haut / le bas', 'nonb anwo / nonb anba (nimeratè / denominatè)', '分子 / 分母', 'البسط / المقام', 'AR drafts mostly use البسط / المقام, but a few child lines say العدد العلوي / العدد السفلي (top / bottom number): choose one wording for child text'),
    ('remainder (R)', 'residuo', 'reste', 'rès', '餘數', 'الباقي', 'The "R" sign stays in equations'),
    ('odd / even', 'impar / par', 'impair / pair', 'enpè / pè', '單數 / 雙數', 'فردي / زوجي', 'Taiwan school usage (not 奇數/偶數)'),
    ('prime / composite', 'primo / compuesto', 'premier / composé', 'nonb premye / nonb konpoze', '質數 / 合數', 'أولي / مؤلّف', None),
    ('number line', 'recta numérica', 'droite numérique', 'liy nonb', '數線', 'خط الأعداد', None),
    ('array', 'arreglo', 'tableau', 'tablo ranje', '陣列', 'مصفوفة', None),
    ('area model', 'modelo de área', "modèle d'aire", 'modèl aire', '面積模型', 'نموذج المساحة', None),
    ('ten-frame', 'marco de diez', 'cadre de dix', 'kad dis', '十格框', 'إطار العشرة', None),
    ('penny / nickel / dime / quarter', 'moneda de 1 / 5 / 10 / 25 centavos', 'pièce de 1 / 5 / 10 / 25 cents', 'peni / nikèl / dim / kwota', '1分 / 5分 / 10分 / 25分硬幣', 'قطعة سنت واحد / خمسة / عشرة / خمسة وعشرين سنتًا', 'US coins as math objects; confirm local words'),
    ('cent / dollar', 'centavo / dólar', 'centime / dollar', 'santim / dola', '分 / 元', 'سنت / دولار', 'HT: in Haiti "dola" can mean 5 gourdes; here it is the US dollar'),
    ('short hand / long hand (clock)', 'aguja corta / aguja larga', 'petite aiguille / grande aiguille', 'ti egwi / gwo egwi', '時針 / 分針', 'العقرب القصير / العقرب الطويل', None),
    ("o'clock / half past", 'en punto / y media', 'heure pile / et demie', 'lè pil / edmi', '整點 / 半點', 'تمامًا / والنصف', None),
    ('inch / centimeter', 'pulgada / centímetro', 'pouce / centimètre', 'pous / santimèt', '英寸 / 公分', 'بوصة / سنتيمتر', None),
    ('perimeter / area', 'perímetro / área', 'périmètre / aire', 'perimèt / sifas', '周長 / 面積', 'المحيط / المساحة', None),
    ('triangle / quadrilateral / pentagon / hexagon', 'triángulo / cuadrilátero / pentágono / hexágono', 'triangle / quadrilatère / pentagone / hexagone', 'triyang / kadrilatè / pantagòn / egzagòn', '三角形 / 四邊形 / 五邊形 / 六邊形', 'مثلث / شكل رباعي / شكل خماسي / شكل سداسي', None),
    ('right angle / straight angle', 'ángulo recto / ángulo llano', 'angle droit / angle plat', 'ang dwat / ang plat', '直角 / 平角', 'زاوية قائمة / زاوية مستقيمة', None),
    ('Lantern Village / Ferry River / Orchard of Rows', 'Pueblo de las Linternas / Río del Ferri / Huerto de las Filas', 'Village des Lanternes / Rivière du Bac / Verger des Rangées', 'Vilaj Lantèn yo / Rivyè Bak la / Jaden Ranje yo', '燈籠村 / 渡船河 / 排排果園', 'قرية الفوانيس / نهر المعدّية / بستان الصفوف', 'Map regions'),
    ('Story Bridge / Fraction Falls / Decimal Docks / Bead Meadows', 'Puente de los Cuentos / Cascada de las Fracciones / Muelle de los Decimales / Praderas de Cuentas', 'Pont des Histoires / Chutes des Fractions / Quais des Décimales / Prairies des Perles', 'Pon Istwa yo / Kaskad Fraksyon / Waf Desimal / Savann Pèl yo', '故事橋 / 分數瀑布 / 小數碼頭 / 珠子草原', 'جسر الحكايات / شلالات الكسور / مرفأ الأعداد العشرية / مروج الخرز', 'Map regions'),
    ('Money Market / Clock Tower / Measuring Workshop / Shape Garden', 'Mercado del Dinero / Torre del Reloj / Taller de Medidas / Jardín de las Figuras', "Marché de l'Argent / Tour de l'Horloge / Atelier des Mesures / Jardin des Formes", 'Mache Lajan / Tou Revèy la / Atelye Mezi / Jaden Fòm yo', '金錢市集 / 時鐘塔 / 測量工坊 / 圖形花園', 'سوق النقود / برج الساعة / ورشة القياس / حديقة الأشكال', 'Map regions added November 26, 2026'),
    ('Lantern Line (warm-up game)', 'Línea de Linternas', 'Ligne des Lanternes', 'Liy Lantèn yo', '燈籠線', 'خط الفوانيس', None),
    ('Grade 3', '3.º grado', 'Niveau 3', 'Ane 3 (confirm against "3yèm ane fondamantal")', '3年級', 'الصف 3', 'See note on FR grade names'),
    ('grown-ups PIN', 'PIN de adultos', 'code adulte', 'PIN granmoun', '家長密碼', 'الرمز السري للكبار', None),
]
for i, row in enumerate(GL, 2):
    for j, v in enumerate(row, 1):
        c = g.cell(i, j, v); c.font = BF; c.alignment = WRAP
for col, w in zip('ABCDEFG', [34, 36, 36, 36, 30, 36, 44]): g.column_dimensions[col].width = w
for ws in wb.worksheets: ws.sheet_view.zoomScale = 100
wb.save(OUT)
print('rows', len(rows), 'new since previous file', n_new, 'check first', len(out))
