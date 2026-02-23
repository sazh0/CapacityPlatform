import * as XLSX from 'xlsx'

// ─── Ramadan & Hajj approximate dates ────────────────────────────
export const RAMADAN = {
  2026: { s: new Date(2026, 1, 18), e: new Date(2026, 2, 19) }, // Feb 18 → Mar 19 approx
  2027: { s: new Date(2027, 1, 8), e: new Date(2027, 2, 9) }, // Feb 8 → Mar 9 approx
  2028: { s: new Date(2028, 0, 28), e: new Date(2028, 1, 26) }, // Jan 28 → Feb 26 approx
  2029: { s: new Date(2029, 0, 16), e: new Date(2029, 1, 14) }, // Jan 16 → Feb 14 approx
  2030: [
    { s: new Date(2030, 0, 5), e: new Date(2030, 1, 3) }, // Ramadan #1
    { s: new Date(2030, 11, 26), e: new Date(2031, 0, 24) }, // Ramadan #2
  ],
};
export const HAJJ = {
  2026: { s: new Date(2026, 4, 25), e: new Date(2026, 4, 30) }, // ~May 25–30 (Arafah May 26)
  2027: { s: new Date(2027, 4, 14), e: new Date(2027, 4, 19) }, // ~May 14–19 (Arafah May 15)
  2028: { s: new Date(2028, 4, 3), e: new Date(2028, 4, 8) }, // ~May 3–8  (Arafah May 4)
  2029: { s: new Date(2029, 3, 22), e: new Date(2029, 3, 27) }, // ~Apr 22–27 (Arafah Apr 23)
  2030: { s: new Date(2030, 3, 11), e: new Date(2030, 3, 16) }, // ~Apr 11–16 (Arafah Apr 12)
};

// ─── Month name → index ──────────────────────────────────────────
const MON = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  mhrm: 0, safar: 1, rabi: 2, jumad: 4, rajab: 6, shaban: 7, ramadan: 8, shawwal: 9,
}

// ─── Normalise header strings ────────────────────────────────────
function n(s) {
  return String(s ?? '').replace(/[\r\n\t\u00A0]+/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Parse date from any Excel format ───────────────────────────
function parseDate(v) {
  if (v == null) return null
  if (v instanceof Date) return isNaN(v) ? null : v
  if (typeof v === 'number') {
    const d = new Date((v - 25569) * 86400000)
    return isNaN(d) ? null : d
  }
  if (typeof v === 'string') {
    const s = v.trim()
    // "1/Jan/2026"  "01-Jan-2026"  "1-Mhrm-26"
    const m = s.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{2,7})[\/\-\s](\d{2,4})$/)
    if (m) {
      const mo = MON[m[2].toLowerCase().slice(0, 5)] ?? MON[m[2].toLowerCase().slice(0, 3)]
      if (mo !== undefined) {
        let yr = parseInt(m[3]); if (yr < 100) yr += 2000
        return new Date(yr, mo, parseInt(m[1]))
      }
    }
    // ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const d = new Date(s); return isNaN(d) ? null : d }
    // DD/MM/YYYY
    const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1])
    const d = new Date(s); return isNaN(d) ? null : d
  }
  return null
}

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Fuzzy column getter ─────────────────────────────────────────
function col(row, ...queries) {
  const keys = Object.keys(row)
  const nk = keys.map(k => ({ k, n: n(k) }))
  for (const q of queries) {
    const nq = n(q)
    const exact = nk.find(o => o.n === nq); if (exact) return row[exact.k]
    const fwd = nk.find(o => o.n.includes(nq)); if (fwd) return row[fwd.k]
    const rev = nk.find(o => nq.includes(o.n) && o.n.length > 5); if (rev) return row[rev.k]
  }
  return null
}

// ─── Get sheet rows by name fragments ───────────────────────────
function sheet(wb, ...frags) {
  for (const f of frags) {
    const nm = wb.SheetNames.find(s => n(s).toLowerCase().includes(n(f).toLowerCase()))
    if (nm) return XLSX.utils.sheet_to_json(wb.Sheets[nm], { raw: true, defval: null, cellDates: false })
  }
  return null
}

// ─── Number coercion ────────────────────────────────────────────
function num(v) {
  if (v == null) return null
  if (typeof v === 'number') return v
  const x = parseFloat(String(v).replace(/[،,\s%]/g, ''))
  return isNaN(x) ? null : x
}

// ─── Main parser ─────────────────────────────────────────────────
export function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: false })
  const warns = []
  const byDate = {}

  const ensure = (d, key) => {
    if (!byDate[key]) byDate[key] = {
      date: d, key, yr: d.getFullYear(), mo: d.getMonth(), day: d.getDate(),
      sl: null, sf: null, sh: null,
      do_: null, di: null,
      loadOut: null, loadInDay: null, loadInNight: null, insideDayPct: null,
      bedsNonHajj: null, bedsHajj: null, utilPct: null,
      stayOut: null, stayIn: null,
    }
    return byDate[key]
  }

  /* SUPPLY */
  const sr = sheet(wb, 'Supply', 'إمداد', 'عرض')
  if (!sr) warns.push('⚠️ لم يتم العثور على ورقة Supply')
  else sr.forEach(row => {
    const d = parseDate(col(row, 'Date Gregorian', 'Date\nGregorian', 'Date', 'التاريخ الميلادي'))
    if (!d) return
    const yr = d.getFullYear(); if (yr < 2026 || yr > 2030) return
    const r = ensure(d, toKey(d))
    r.sl = num(col(row, 'الطاقة الاستيعابية للإيواء - مكة المكرمة (سرير في اليوم)', 'الطاقة الاستيعابية للإيواء - مكة المكرمة', 'الطاقة الاستيعابية للإيواء'))
    r.sf = num(col(row, 'المشاريع المستقبلية للإيواء - مكة المكرمة (سرير في اليوم)', 'المشاريع المستقبلية للإيواء - مكة المكرمة', 'المشاريع المستقبلية للإيواء', 'المشاريع المستقبلية'))
    r.sh = num(col(row, 'الطاقة الاستيعابية لمساكن الحجاج - مكة المكرمة (سرير / يوم)', 'الطاقة الاستيعابية لمساكن الحجاج - مكة المكرمة', 'مساكن الحجاج'))
  })

  /* DEMAND */
  const dr = sheet(wb, 'Demand', 'طلب')
  if (!dr) warns.push('⚠️ لم يتم العثور على ورقة Demand')
  else dr.forEach(row => {
    const d = parseDate(col(row, 'Date Gregorian', 'Date\nGregorian', 'Date', 'التاريخ الميلادي'))
    if (!d) return
    const yr = d.getFullYear(); if (yr < 2026 || yr > 2030) return
    const r = ensure(d, toKey(d))
    r.do_ = num(col(row, 'إجمالي الطلب اليومي على الإيواء مكة المكرمة - المعتمرون من الخارج', 'المعتمرون من الخارج', 'معتمري الخارج'))
    r.di = num(col(row, 'إجمالي الطلب اليومي على الإيواء مكة المكرمة - المعتمرون من الداخل مبيت', 'المعتمرون من الداخل مبيت', 'معتمري الداخل مبيت'))
    r.loadOut = num(col(row, 'الحمل اليومي من معتمري الخارج -مكة المكرمة', 'الحمل اليومي من معتمري الخارج'))
    r.loadInDay = num(col(row, 'الحمل اليومي من معتمري الداخل اليوم الواحد - مكة المكرمة', 'اليوم الواحد - مكة المكرمة'))
    r.loadInNight = num(col(row, 'الحمل اليومي من معتمري الداخل مبيت - مكة المكرمة', 'الداخل مبيت - مكة المكرمة'))
    const pRaw = col(row, 'نسبة معتمري الداخل اليوم الواحد  من معتمري الداخل', 'نسبة معتمري الداخل اليوم الواحد من معتمري الداخل', 'نسبة معتمري الداخل')
    if (pRaw != null) { const pn = num(pRaw); r.insideDayPct = pn != null ? (pn <= 1 ? pn * 100 : pn) : null }
  })

  /* SUPPLY FACTORS (optional) */
  const sf = sheet(wb, 'Supply Factors', 'Supply Factor', 'SupplyFactors', 'عوامل العرض')
  if (sf) sf.forEach(row => {
    const d = parseDate(col(row, 'Date Gregorian', 'Date')); if (!d) return
    const r = byDate[toKey(d)]; if (!r) return
    r.bedsNonHajj = num(col(row, 'Makkah Total Beds / Room (Non-Hajj)', 'Makkah\nTotal Beds / Room\n(Non-Hajj)', 'Non-Hajj'))
    r.bedsHajj = num(col(row, 'Makkah Total Beds / Room (Hajj)', 'Makkah\nTotal Beds / Room\n(Hajj)', 'Hajj'))
    r.utilPct = num(col(row, 'Makkah Accommodation Utilization %', 'Utilization %', 'Utilization'))
  })

  /* DEMAND FACTORS (optional) */
  const df = sheet(wb, 'Demand Factors', 'Demand Factor', 'DemandFactors', 'عوامل الطلب')
  if (df) df.forEach(row => {
    const d = parseDate(col(row, 'Date Gregorian', 'Date')); if (!d) return
    const r = byDate[toKey(d)]; if (!r) return
    r.stayOut = num(col(row, 'متوسط مدة إقامة معتمري الخارج في مكة', 'مدة إقامة معتمري الخارج'))
    r.stayIn = num(col(row, 'متوسط مدة إقامة معتمري الداخل (مبيت) في مكة', 'مدة إقامة معتمري الداخل'))
  })

  /* FINALIZE */
  const rows = Object.values(byDate)
    .filter(r => r.yr >= 2026 && r.yr <= 2030)
    .sort((a, b) => a.date - b.date)
    .map(r => {
      const ram = RAMADAN[r.yr], haj = HAJJ[r.yr]
      const isRamadan = ram
        ? Array.isArray(ram)
          ? ram.some(p => r.date >= p.s && r.date <= p.e)
          : r.date >= ram.s && r.date <= ram.e
        : false
      return {
        ...r,
        isRamadan,
        isHajj: haj ? r.date >= haj.s && r.date <= haj.e : false,
      }
    })

  if (!rows.length) warns.push('❌ لا توجد بيانات صالحة في 2026–2030. تحقق من عمود "Date Gregorian".')

  return { rows, warns, years: [...new Set(rows.map(r => r.yr))].sort(), sheets: wb.SheetNames }
}