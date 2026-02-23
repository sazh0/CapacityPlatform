import { useState, useRef, useCallback } from 'react'
import './ExportModal.css'

// ─── Design tokens (mirror App.jsx) ──────────────────────────────
const T = {
  bg: '#1A1819', bgM: '#272425', bgL: '#323031',
  bronze: '#967126', bronzeL: '#B8912E', bronzeXL: '#D4AA52',
  green: '#007a53', greenL: '#009966', greenXL: '#00BC7D', greenDk: '#064E3B',
  dem: '#F87171', sup: '#34D399', ram: '#A78BFA', hajj: '#FBBF24',
  txt: '#F4F1EB', txtSub: 'rgba(244,241,235,0.6)', txtDim: 'rgba(244,241,235,0.35)',
}

// Print-safe color palette
const P = {
  demBg: 'rgba(220,38,38,0.07)', demBdr: 'rgba(220,38,38,0.2)', demTxt: '#b91c1c',
  supBg: 'rgba(5,150,105,0.07)', supBdr: 'rgba(5,150,105,0.2)', supTxt: '#065f46',
  bronzeBg: 'rgba(120,90,20,0.07)', bronzeBdr: 'rgba(150,113,38,0.25)', bronzeTxt: '#78501a',
  ramBg: 'rgba(109,40,217,0.07)', ramBdr: 'rgba(109,40,217,0.2)', ramTxt: '#6d28d9',
  hajjBg: 'rgba(161,98,7,0.07)', hajjBdr: 'rgba(161,98,7,0.2)', hajjTxt: '#92400e',
  warnBg: 'rgba(180,130,0,0.07)', warnBdr: 'rgba(180,130,0,0.2)', warnTxt: '#92400e',
  ink: '#111827', inkSub: '#374151', inkDim: '#6b7280', rule: '#e5e7eb', bg: '#ffffff',
}

const AR_MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

const fmtFull = n => n == null || isNaN(n) ? '—'
  : Math.round(Math.abs(n)).toLocaleString('en-US').replace(/,/g, '،')

const fmtN = n => {
  if (n == null || isNaN(n)) return '—'
  const a = Math.abs(n)
  return a >= 1_000_000 ? `${(a / 1_000_000).toFixed(1)}م` : fmtFull(n)
}

const nowLabel = () => {
  const d = new Date()
  return `${d.getDate()} ${AR_MON[d.getMonth()]} ${d.getFullYear()}`
}

const genId = () => `RPT-${Date.now().toString(36).toUpperCase()}`

const LS_KEY = 'pdf_recent_exports'
const getRecent = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] } catch { return [] } }
const saveRecent = exports => { try { localStorage.setItem(LS_KEY, JSON.stringify(exports)) } catch { } }

// ─── KPI Card component (for report layout) ──────────────────────
function RpKpi({ icon, label, value, unit, sub, accentClass }) {
  return (
    <div className={`rp-kpi rp-kpi-${accentClass}`}>
      <div className="rp-kpi-icon">{icon}</div>
      <div className="rp-kpi-val">{value}</div>
      <div className="rp-kpi-label">{label}</div>
      <div className="rp-kpi-unit">{unit}</div>
      {sub && <div className="rp-kpi-sub">{sub}</div>}
    </div>
  )
}

// ─── Pure-SVG Demand vs Supply chart (html2canvas-safe) ──────────
function RpDemandChart({ series }) {
  if (!series?.length) return null

  const W = 694   // inner chart width (794px page - 100px padding)
  const H = 200   // total SVG height
  const PAD = { top: 14, right: 10, bottom: 34, left: 64 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  // Sample to max 300 points
  const step = Math.max(1, Math.floor(series.length / 300))
  const pts = series.filter((_, i) => i % step === 0)

  // Y domain
  const allVals = pts.flatMap(d => [d.demand ?? 0, d.supply ?? 0]).filter(v => v > 0)
  if (!allVals.length) return null
  const yMax = Math.ceil(Math.max(...allVals) * 1.12)
  const yMin = 0

  const xScale = i => (i / Math.max(pts.length - 1, 1)) * cW
  const yScale = v => cH - ((v - yMin) / (yMax - yMin)) * cH

  // Path builders
  const toPath = (getter) =>
    pts.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(getter(d)).toFixed(1)}`).join(' ')

  const demPath = toPath(d => d.demand ?? 0)
  const supPath = toPath(d => d.supply ?? 0)

  // Gap fill — contiguous segments by type
  const segments = { dem: [], sup: [] }
  let curType = null, curSeg = []
  pts.forEach((d, i) => {
    const type = (d.demand ?? 0) > (d.supply ?? 0) ? 'dem' : 'sup'
    if (type !== curType) {
      if (curSeg.length > 1) segments[curType].push([...curSeg])
      curType = type; curSeg = [i]
    } else { curSeg.push(i) }
  })
  if (curSeg.length > 1) segments[curType].push(curSeg)

  const fillPath = (indices) => {
    const top = indices.map((i, j) => `${j === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(pts[i].demand ?? 0).toFixed(1)}`).join(' ')
    const bot = [...indices].reverse().map((i) => `L${xScale(i).toFixed(1)},${yScale(pts[i].supply ?? 0).toFixed(1)}`).join(' ')
    return `${top} ${bot} Z`
  }

  // Y ticks — 5 steps
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(yMin + (yMax - yMin) * i / 4))

  // X month labels — one per month boundary
  const xLabels = []
  let lastMo = -1
  pts.forEach((d, i) => {
    const date = d.date instanceof Date ? d.date : new Date(d.date)
    const mo = date.getMonth()
    if (mo !== lastMo) { xLabels.push({ i, mo, yr: date.getFullYear() }); lastMo = mo }
  })

  // Season bands — derive from isRamadan/isHajj flags in pts
  const buildBands = (flagKey) => {
    const bands = []
    let start = -1
    pts.forEach((d, i) => {
      if (d[flagKey] && start === -1) start = i
      if (!d[flagKey] && start !== -1) { bands.push([start, i - 1]); start = -1 }
    })
    if (start !== -1) bands.push([start, pts.length - 1])
    return bands
  }
  const ramBands = buildBands('isRamadan')
  const hajjBands = buildBands('isHajj')

  const hasRam = ramBands.length > 0
  const hasHajj = hajjBands.length > 0

  const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م`
    : v >= 1000 ? `${(v / 1000).toFixed(0)}ك` : `${v}`

  return (
    <div className="rp-chart-wrap">
      <div className="rp-chart-header">
        <span className="rp-chart-title">الطلب مقابل الطاقة الاستيعابية</span>
        <div className="rp-chart-legend">
          <span className="rp-leg-dem">— المستهدفات</span>
          <span className="rp-leg-sup">— الطاقة الاستيعابية</span>
          {hasRam && <span className="rp-leg-ram">▌ رمضان</span>}
          {hasHajj && <span className="rp-leg-hajj">▌ حج</span>}
        </div>
      </div>

      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rp-grd-dem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="rp-grd-sup" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* ── Grid lines ── */}
          {yTicks.map(v => (
            <line key={v}
              x1={0} y1={yScale(v).toFixed(1)} x2={cW} y2={yScale(v).toFixed(1)}
              stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray="4 3"
            />
          ))}
          <line x1={0} y1={cH} x2={cW} y2={cH} stroke="#d1d5db" strokeWidth="1" />
          <line x1={0} y1={0} x2={0} y2={cH} stroke="#d1d5db" strokeWidth="1" />

          {/* ── Season bands ── */}
          {ramBands.map(([i1, i2], bi) => (
            <rect key={`ram-${bi}`}
              x={xScale(i1).toFixed(1)} y={0}
              width={(xScale(i2) - xScale(i1)).toFixed(1)} height={cH}
              fill="rgba(139,92,246,0.09)"
            />
          ))}
          {hajjBands.map(([i1, i2], bi) => (
            <rect key={`hajj-${bi}`}
              x={xScale(i1).toFixed(1)} y={0}
              width={(xScale(i2) - xScale(i1)).toFixed(1)} height={cH}
              fill="rgba(251,191,36,0.10)"
            />
          ))}

          {/* ── Gap fill ── */}
          {segments.dem.map((seg, i) => <path key={`fd-${i}`} d={fillPath(seg)} fill="url(#rp-grd-dem)" />)}
          {segments.sup.map((seg, i) => <path key={`fs-${i}`} d={fillPath(seg)} fill="url(#rp-grd-sup)" />)}

          {/* ── Supply line ── */}
          <path d={supPath} fill="none" stroke="#059669" strokeWidth="1.8" strokeLinejoin="round" />

          {/* ── Demand line ── */}
          <path d={demPath} fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinejoin="round" />

          {/* ── Y axis labels ── */}
          {yTicks.map(v => (
            <text key={`yt-${v}`}
              x={-8} y={yScale(v) + 3.5}
              textAnchor="end" fontSize="9" fill="#9ca3af"
              fontFamily="Cairo, sans-serif"
            >{fmtK(v)}</text>
          ))}

          {/* ── X axis month labels ── */}
          {xLabels.map(({ i, mo, yr: labelYr }, li) => (
            <text key={`xl-${li}`}
              x={xScale(i)} y={cH + 20}
              textAnchor="middle" fontSize="9" fill="#6b7280"
              fontFamily="Cairo, sans-serif"
            >{AR_MON[mo].slice(0, 3)}</text>
          ))}

        </g>
      </svg>

      <div className="rp-chart-unit">سرير / يوم</div>
    </div>
  )
}

// ─── Insight generator (rule-based, enriched) ────────────────────
function generateInsights(payload) {
  const { kpi, ram, yr, sc, monthly, seriesYears } = payload
  const insights = []

  if (kpi) {
    const defPct = Math.round(kpi.defPct)
    const yrLabel = yr ?? seriesYears.join('–')

    if (defPct > 70)
      insights.push(`شهدت فترة ${yrLabel} عجزاً في الطاقة الاستيعابية في ${defPct}% من الأيام (${kpi.defD} يوم). الوضع بالغ الخطورة ويستدعي مراجعة عاجلة لخطط توسعة الطاقة.`)
    else if (defPct > 40)
      insights.push(`تجاوز العجز اليومي الـ ${defPct}% من مجموع الأيام المرصودة. التوسع في المشاريع المستقبلية سيُحسّن الوضع بشكل ملموس.`)
    else
      insights.push(`الوضع مستقر نسبياً مع عجز في ${defPct}% من الأيام. الفائض في الأشهر الهادئة يُوفّر هامشاً مقبولاً لاستيعاب الأحداث الطارئة.`)

    if (kpi.criticalPct > 50)
      insights.push(`${kpi.criticalPct}% من الأيام تقع ضمن النطاق الحرج (الطلب ≥ 90% من الطاقة). هذا المستوى من الضغط المستمر يُشكّل خطراً تشغيلياً على جودة الخدمة.`)
    else if (kpi.criticalPct > 25)
      insights.push(`${kpi.criticalPct}% من الأيام ضمن النطاق الحرج — وهو معدل يتطلب خطة طوارئ واضحة، لا سيما في مواسم الذروة.`)

    const gap = kpi.avgG
    if (gap > 10000)
      insights.push(`الفجوة اليومية المتوسطة ${fmtFull(gap)} سرير — هذا الحجم من الضغط المستمر يعني أن الطاقة الحالية تقصر بشكل هيكلي عن تلبية الطلب.`)
    else if (gap > 3000)
      insights.push(`متوسط الفجوة اليومية ${fmtFull(gap)} سرير — يُشير إلى ضغط يمكن تخفيفه عبر رفع طاقة المنشآت المرخّصة أو تسريع المشاريع المستقبلية.`)
    else if (gap < -10000)
      insights.push(`فائض ضخم يتجاوز ${fmtFull(Math.abs(gap))} سرير/يوم في المتوسط — فرصة لمراجعة منهجية توزيع المنشآت وتحسين الاستخدام.`)
  }

  if (ram?.rDays > 0) {
    const ramPct = Math.round(ram.rPct)
    const outerPct = Math.round(ram.oPct)
    if (ramPct > 80)
      insights.push(`رمضان يُشكّل نقطة ضغط قصوى (عجز في ${ramPct}% من أيامه مقارنة بـ ${outerPct}% خارجه). يُنصح بتفعيل طاقة الحجاج الاحتياطية مبكراً.`)
    else if (ramPct > 50)
      insights.push(`عجز رمضاني بنسبة ${ramPct}% مقارنة بـ ${outerPct}% خارجه — الفارق يُثبت أن رمضان هو الموسم الأعلى ضغطاً ويستلزم تخطيطاً مستقلاً.`)
    else if (ramPct > outerPct + 10)
      insights.push(`رمضان يُضاعف الضغط بنسبة ${ramPct - outerPct} نقطة مئوية فوق المعدل السنوي — متطلبات الطاقة المؤقتة يجب تأمينها قبل 45 يوماً على الأقل.`)
  }

  if (monthly?.length > 0) {
    const worstMonth = monthly.reduce((m, x) => x.avgGap > m.avgGap ? x : m, monthly[0])
    if (worstMonth.avgGap > 0)
      insights.push(`أشد الأشهر ضغطاً هو ${worstMonth.name} بمتوسط عجز ${fmtFull(worstMonth.avgGap)} سرير/يوم وعجز في ${worstMonth.defDays} من أصل ${worstMonth.totalDays} يوم.`)
  }

  const activeAdj = Object.values(sc).filter(v => v !== 0).length
  if (activeAdj > 0)
    insights.push(`يعكس هذا التقرير ${activeAdj} تعديل(ات) افتراضية على السيناريو — النتائج تقديرية ولا تعكس البيانات الفعلية بشكل كامل.`)

  return insights.slice(0, 5)
}

// ─── Confidence notes ──────────────────────────────────────────
function generateNotes(payload) {
  const notes = []
  if (!payload.kpi) notes.push('⚠️ لا تتوفر بيانات كافية لهذا العام.')
  if (payload.ram?.rDays === 0) notes.push('⚠️ لم يُرصد عجز في فترة رمضان — تحقق من اكتمال البيانات.')
  const hasAdj = Object.values(payload.sc).some(v => v !== 0)
  if (hasAdj) notes.push('📝 القيم المعروضة تشمل تعديلات افتراضية على السيناريو وليست بيانات فعلية.')
  if (payload.scope === 'year') notes.push('🔒 نطاق السيناريو مقيّد بالسنة المحددة فقط.')
  notes.push('ℹ️ الأرقام مبنية على متوسطات يومية؛ الأيام الحرجة الفردية قد تُظهر عجزاً أعلى.')
  return notes
}

// ─── Divider for report sections ─────────────────────────────────
const RpPageFooter = ({ yrLabel, reportId, today, pageNum }) => (
  <div className="rp-page-footer">
    <span>إيواء مكة المكرمة — تقرير الطاقة الاستيعابية {yrLabel}</span>
    <span className="rp-footer-right">
      {today} · {reportId}
    </span>
  </div>
)

// ════════════════════════════════════════════════════════════════
//  REPORT LAYOUT (hidden div that gets captured)
// ════════════════════════════════════════════════════════════════
function ReportLayout({ payload, reportId, opts }) {
  const {
    yr, kpi, ram, sc, peakDemand, series, monthly,
    seriesYears, demTypeLabel, supTypeLabel, scopeLabel, demTypes, supTypes,
  } = payload

  const insights = generateInsights(payload)
  const notes = generateNotes(payload)
  const today = nowLabel()
  const yrLabel = yr ?? (seriesYears?.length ? seriesYears.join('–') : '—')

  const SUPPLY_LABELS = { sl: 'مرافق مرخصة', sf: 'مشاريع مستقبلية', sh: 'مساكن الحجاج', br: 'نسبة الأسرّة/غرفة' }
  const DEMAND_LABELS = { do_: 'زوار من الخارج', di: 'زوار من الداخل' }
  const activeSliders = Object.entries(sc)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({
      label: SUPPLY_LABELS[k] ?? DEMAND_LABELS[k] ?? k,
      value: v,
      cat: k in SUPPLY_LABELS ? 'supply' : 'demand',
    }))

  // Top 30 deficit days
  const deficitRows = [...series]
    .filter(r => r.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 30)

  // Split deficit rows into two pages of 15
  const defPage1 = deficitRows.slice(0, 20)
  const defPage2 = deficitRows.slice(20)

  return (
    <div id="rp-root" className="rp-root" dir="rtl">

      {/* ══════════════════════════════════════════════════════════
          PAGE 1 — EXECUTIVE SUMMARY / KPIs
      ══════════════════════════════════════════════════════════ */}
      {opts.kpis && kpi && (
        <div className="rp-page rp-page-content">

          {/* Page header */}
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الأول</div>
              <h2 className="rp-section-title">الملخص التنفيذي — المؤشرات الرئيسية</h2>
              <div className="rp-section-sub">
                تقرير الطاقة الاستيعابية · مكة المكرمة · {yrLabel}
              </div>
            </div>
          </div>

          {/* Context ribbon */}
          <div className="rp-context-ribbon">
            <div className="rp-crb-cell">
              <div className="rp-crb-lbl">فترة التحليل</div>
              <div className="rp-crb-val">{yrLabel}</div>
            </div>
            <div className="rp-crb-sep" />
            <div className="rp-crb-cell">
              <div className="rp-crb-lbl">نقاط البيانات</div>
              <div className="rp-crb-val">{series.length} يوم</div>
            </div>
            <div className="rp-crb-sep" />
            <div className="rp-crb-cell">
              <div className="rp-crb-lbl">نوع المستهدفات</div>
              <div className="rp-crb-val">{demTypeLabel}</div>
            </div>
            <div className="rp-crb-sep" />
            <div className="rp-crb-cell">
              <div className="rp-crb-lbl">نوع الطاقة</div>
              <div className="rp-crb-val">{supTypeLabel}</div>
            </div>
            <div className="rp-crb-sep" />
            <div className="rp-crb-cell">
              <div className="rp-crb-lbl">السيناريو</div>
              <div className={`rp-crb-val${activeSliders.length > 0 ? ' rp-crb-warn' : ''}`}>
                {activeSliders.length > 0 ? `${activeSliders.length} تعديلات` : 'بدون تعديل'}
              </div>
            </div>
          </div>

          {/* KPI grid — 3 × 2 */}
          <div className="rp-kpi-grid">
            <RpKpi
              icon="🎯"
              label="متوسط المستهدفات اليومية"
              value={fmtN(kpi.avgD)}
              unit="سرير / يوم"
              accentClass="dem"
              sub={`ذروة: ${fmtN(peakDemand?.value)} (${peakDemand?.dateLabel ?? '—'})`}
            />
            <RpKpi
              icon="🏨"
              label="متوسط الطاقة الاستيعابية"
              value={fmtN(kpi.avgS)}
              unit="سرير / يوم"
              accentClass="sup"
              sub={`نسبة الإشغال المتوسطة: ${kpi.occupancyPct}%`}
            />
            <RpKpi
              icon={kpi.avgG > 0 ? '⚠️' : '✅'}
              label="متوسط الفجوة اليومية"
              value={(kpi.avgG > 0 ? '+' : '') + fmtN(kpi.avgG)}
              unit="سرير / يوم"
              accentClass={kpi.avgG > 0 ? 'dem' : 'sup'}
              sub={kpi.avgG > 0 ? 'عجز — الطلب يتجاوز الطاقة' : 'فائض — الطاقة تفوق الطلب'}
            />
            <RpKpi
              icon="📉"
              label="أيام العجز"
              value={`${Math.round(kpi.defPct)}%`}
              unit={`${kpi.defD} يوم عجز · ${kpi.total - kpi.defD} يوم فائض`}
              accentClass="dem"
              sub={`من أصل ${kpi.total} يوم محلَّل`}
            />
            <RpKpi
              icon="🔺"
              label="أعلى عجز يومي مسجّل"
              value={fmtN(kpi.maxDef?.gap)}
              unit={kpi.maxDef?.dateLabel ?? '—'}
              accentClass="dem"
              sub={kpi.maxDef?.isRamadan ? '🌙 خلال رمضان' : kpi.maxDef?.isHajj ? '🕋 خلال الحج' : ''}
            />
            <RpKpi
              icon="⚡"
              label="الأيام الحرجة (طلب ≥ 90%)"
              value={`${kpi.criticalPct}%`}
              unit={`${kpi.criticalDays} يوم من أصل ${kpi.total}`}
              accentClass={kpi.criticalPct > 40 ? 'dem' : 'bronze'}
              sub={kpi.criticalPct > 50 ? 'وضع حرج — يستدعي التدخل' : kpi.criticalPct > 25 ? 'ضغط ملموس' : 'ضغط مقبول'}
            />
          </div>

          {/* Demand vs Supply chart */}
          <RpDemandChart series={series} />

          {/* Occupancy section */}
          <div className="rp-occ-section">
            <div className="rp-occ-header">
              <span className="rp-occ-title">متوسط نسبة الإشغال</span>
              <span className={`rp-occ-badge ${kpi.occupancyPct >= 100 ? 'dem' : kpi.occupancyPct >= 80 ? 'warn' : 'sup'}`}>
                {kpi.occupancyPct >= 100 ? 'الطلب يتجاوز الطاقة' : kpi.occupancyPct >= 80 ? 'ضغط مرتفع' : 'طاقة كافية'}
              </span>
              <span className="rp-occ-pct">{kpi.occupancyPct}%</span>
            </div>
            <div className="rp-occ-track">
              <div
                className={`rp-occ-fill ${kpi.occupancyPct >= 100 ? 'dem' : kpi.occupancyPct >= 80 ? 'warn' : 'sup'}`}
                style={{ width: `${Math.min(kpi.occupancyPct, 100)}%` }}
              />
              <div className="rp-occ-mark rp-occ-mark-80" />
            </div>
            <div className="rp-occ-legend">
              <div className="rp-occ-leg sup">■ 0–79%: طاقة كافية</div>
              <div className="rp-occ-leg warn">■ 80–99%: ضغط مرتفع</div>
              <div className="rp-occ-leg dem">■ 100%+: طلب يتجاوز الطاقة</div>
              <div className="rp-occ-leg note">ذروة إشغال: {kpi.peakOccPct}% — {kpi.peakOccLabel}</div>
            </div>
          </div>

          {/* Ramadan inline summary */}
          {ram?.rDays > 0 && (
            <div className="rp-ram-summary">
              <div className="rp-ram-summary-title">
                🌙 تحليل رمضان — {yrLabel}
              </div>
              <div className="rp-ram-summary-grid">
                <div className="rp-rsg-cell">
                  <div className="rp-rsg-lbl">أيام رمضان المرصودة</div>
                  <div className="rp-rsg-val">{ram.rDays} يوم</div>
                </div>
                <div className="rp-rsg-cell">
                  <div className="rp-rsg-lbl">نسبة العجز في رمضان</div>
                  <div className={`rp-rsg-val ${Math.round(ram.rPct) > 60 ? 'dem' : 'sup'}`}>{Math.round(ram.rPct)}%</div>
                </div>
                <div className="rp-rsg-cell">
                  <div className="rp-rsg-lbl">متوسط عجز يومي</div>
                  <div className="rp-rsg-val">{fmtFull(ram.rAvg)} سرير</div>
                </div>
                <div className="rp-rsg-cell">
                  <div className="rp-rsg-lbl">نسبة العجز خارج رمضان</div>
                  <div className="rp-rsg-val">{Math.round(ram.oPct)}%</div>
                </div>
                {ram.rMax && (
                  <div className="rp-rsg-cell">
                    <div className="rp-rsg-lbl">أشد أيام رمضان عجزاً</div>
                    <div className="rp-rsg-val">{fmtFull(ram.rMax.gap)} سرير — {ram.rMax.dateLabel}</div>
                  </div>
                )}
              </div>
              {/* Per-period breakdown */}
              {ram.perPeriod?.length > 1 && (
                <div className="rp-ram-periods">
                  {ram.perPeriod.map(p => (
                    <div key={p.idx} className="rp-ram-period-row">
                      <span className="rp-rpr-label">{p.label}</span>
                      <span className="rp-rpr-range">{p.dateRange}</span>
                      <span className="rp-rpr-days">{p.days} يوم</span>
                      <span className={`rp-rpr-pct ${Math.round(p.pct) > 50 ? 'dem' : 'sup'}`}>
                        عجز {Math.round(p.pct)}%
                      </span>
                      <span className="rp-rpr-avg">متوسط {fmtFull(p.avg)} سرير/يوم</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 2 — MONTHLY ANALYSIS TABLE
      ══════════════════════════════════════════════════════════ */}
      {opts.tables && monthly?.length > 0 && (
        <div className="rp-page rp-page-content">
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الثاني</div>
              <h2 className="rp-section-title">التحليل الشهري — الطلب والطاقة والفجوة</h2>
              <div className="rp-section-sub">
                متوسطات يومية لكل شهر · {yrLabel} · {series.length} نقطة بيانات
              </div>
            </div>
          </div>

          <table className="rp-table rp-monthly-table">
            <thead>
              <tr>
                <th>الشهر</th>
                <th className="rp-th-num rp-th-dem">متوسط الطلب<br /><span className="rp-th-unit">سرير/يوم</span></th>
                <th className="rp-th-num rp-th-sup">متوسط الطاقة<br /><span className="rp-th-unit">سرير/يوم</span></th>
                <th className="rp-th-num">متوسط الفجوة<br /><span className="rp-th-unit">سرير/يوم</span></th>
                <th className="rp-th-num">نسبة العجز</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => {
                const isDeficit = m.avgGap > 0
                const defPct = m.totalDays > 0 ? Math.round(m.defDays / m.totalDays * 100) : 0
                return (
                  <tr key={i} className={`${i % 2 === 0 ? 'rp-tr-even' : ''}`}>
                    <td className="rp-td-month">
                      {m.name}
                      {m.isRam && <span className="rp-badge rp-badge-ram">🌙</span>}
                      {m.isHajj && <span className="rp-badge rp-badge-hajj">🕋</span>}
                    </td>
                    <td className="rp-td-dem rp-td-num">{fmtFull(m.avgDem)}</td>
                    <td className="rp-td-sup rp-td-num">{fmtFull(m.avgSup)}</td>
                    <td className={`rp-td-num ${isDeficit ? 'rp-td-gap-neg' : 'rp-td-gap-pos'}`}>
                      {isDeficit ? '+' : ''}{fmtFull(m.avgGap)}
                    </td>
                    <td className="rp-td-num rp-td-pct">
                      <span className={`rp-pct-pill ${defPct >= 80 ? 'dem' : defPct >= 40 ? 'warn' : 'sup'}`}>
                        {defPct}%
                      </span>
                    </td>
                    <td className="rp-td-status-cell">
                      <span className={`rp-status-pill ${isDeficit ? 'dem' : 'sup'}`}>
                        {isDeficit ? 'عجز' : 'فائض'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Summary row */}
            {kpi && (
              <tfoot>
                <tr className="rp-tf-row">
                  <td className="rp-tf-label">الإجمالي / المتوسط</td>
                  <td className="rp-td-dem rp-td-num"><strong>{fmtN(kpi.avgD)}</strong></td>
                  <td className="rp-td-sup rp-td-num"><strong>{fmtN(kpi.avgS)}</strong></td>
                  <td className={`rp-td-num ${kpi.avgG > 0 ? 'rp-td-gap-neg' : 'rp-td-gap-pos'}`}>
                    <strong>{kpi.avgG > 0 ? '+' : ''}{fmtN(kpi.avgG)}</strong>
                  </td>
                  <td className="rp-td-num"><strong>{kpi.defD} / {kpi.total}</strong></td>
                  <td className="rp-td-num">
                    <span className={`rp-pct-pill ${kpi.defPct >= 80 ? 'dem' : kpi.defPct >= 40 ? 'warn' : 'sup'}`}>
                      {Math.round(kpi.defPct)}%
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 3 — KEY INSIGHTS
      ══════════════════════════════════════════════════════════ */}
      {opts.insights && (
        <div className="rp-page rp-page-content">
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الثالث</div>
              <h2 className="rp-section-title">الاستنتاجات والتحليل</h2>
              <div className="rp-section-sub">
                رؤى تحليلية مبنية على بيانات {yrLabel} · {today}
              </div>
            </div>
          </div>

          <div className="rp-insights-box">
            <div className="rp-insights-hdr">
              <span className="rp-insights-dot" />
              أبرز النتائج التحليلية
            </div>
            {insights.map((ins, i) => (
              <div key={i} className="rp-insight-row">
                <div className="rp-insight-num">{i + 1}</div>
                <div className="rp-insight-body">
                  <p className="rp-insight-txt">{ins}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Critical days breakdown */}
          {kpi && (
            <div className="rp-breakdown-box">
              <div className="rp-breakdown-title">توزيع الأيام — تفصيل الحالة</div>
              <div className="rp-breakdown-grid">
                <div className="rp-bd-cell rp-bd-dem">
                  <div className="rp-bd-val">{kpi.defD}</div>
                  <div className="rp-bd-lbl">يوم عجز</div>
                  <div className="rp-bd-pct">{Math.round(kpi.defPct)}%</div>
                </div>
                <div className="rp-bd-cell rp-bd-sup">
                  <div className="rp-bd-val">{kpi.total - kpi.defD}</div>
                  <div className="rp-bd-lbl">يوم فائض</div>
                  <div className="rp-bd-pct">{100 - Math.round(kpi.defPct)}%</div>
                </div>
                <div className="rp-bd-cell rp-bd-crit">
                  <div className="rp-bd-val">{kpi.criticalDays}</div>
                  <div className="rp-bd-lbl">يوم حرج</div>
                  <div className="rp-bd-pct">{kpi.criticalPct}%</div>
                </div>
                <div className="rp-bd-cell rp-bd-total">
                  <div className="rp-bd-val">{kpi.total}</div>
                  <div className="rp-bd-lbl">إجمالي الأيام</div>
                  <div className="rp-bd-pct">100%</div>
                </div>
              </div>
            </div>
          )}

          {/* Ramadan deep dive */}
          {ram?.rDays > 0 && (
            <div className="rp-ram-detailed">
              <div className="rp-ram-detailed-title">
                {ram.isDual ? '🌙🌙' : '🌙'} تحليل مقارن — رمضان مقابل باقي العام
              </div>
              <table className="rp-table rp-compare-table">
                <thead>
                  <tr>
                    <th>الفترة</th>
                    <th className="rp-th-num">عدد الأيام</th>
                    <th className="rp-th-num">نسبة العجز</th>
                    <th className="rp-th-num">متوسط العجز اليومي</th>
                  </tr>
                </thead>
                <tbody>
                  {ram.perPeriod?.map(p => (
                    <tr key={p.idx}>
                      <td className="rp-td-month">{p.label} <span className="rp-td-dim">— {p.dateRange}</span></td>
                      <td className="rp-td-num">{p.days}</td>
                      <td className="rp-td-num">
                        <span className={`rp-pct-pill ${Math.round(p.pct) > 60 ? 'dem' : Math.round(p.pct) > 30 ? 'warn' : 'sup'}`}>
                          {Math.round(p.pct)}%
                        </span>
                      </td>
                      <td className={`rp-td-num ${p.avg > 0 ? 'rp-td-gap-neg' : 'rp-td-gap-pos'}`}>
                        {p.avg > 0 ? '+' : ''}{fmtFull(p.avg)} سرير
                      </td>
                    </tr>
                  ))}
                  <tr className="rp-tr-compare-other">
                    <td className="rp-td-month">خارج رمضان</td>
                    <td className="rp-td-num">{kpi ? kpi.total - ram.rDays : '—'}</td>
                    <td className="rp-td-num">
                      <span className={`rp-pct-pill ${Math.round(ram.oPct) > 60 ? 'dem' : Math.round(ram.oPct) > 30 ? 'warn' : 'sup'}`}>
                        {Math.round(ram.oPct)}%
                      </span>
                    </td>
                    <td className={`rp-td-num ${ram.oAvg > 0 ? 'rp-td-gap-neg' : 'rp-td-gap-pos'}`}>
                      {ram.oAvg > 0 ? '+' : ''}{fmtFull(ram.oAvg)} سرير
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <div className="rp-notes-box">
              <div className="rp-notes-title">ملاحظات وتحفّظات</div>
              {notes.map((n, i) => <div key={i} className="rp-note-row">{n}</div>)}
            </div>
          )}

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 4 — SCENARIO DETAILS
      ══════════════════════════════════════════════════════════ */}
      {opts.scenario && (
        <div className="rp-page rp-page-content">
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الرابع</div>
              <h2 className="rp-section-title">تعديلات السيناريو الافتراضي</h2>
              <div className="rp-section-sub">
                نطاق التطبيق: {scopeLabel} · {activeSliders.length} تعديل نشط
              </div>
            </div>
          </div>

          {activeSliders.length > 0 ? (
            <>
              <div className="rp-sc-summary">
                <div className="rp-sc-sm-cell">
                  <span className="rp-sc-sm-lbl">تعديلات الطاقة</span>
                  <strong className="rp-sc-sm-val sup">
                    {activeSliders.filter(s => s.cat === 'supply').length} متغيّر
                  </strong>
                </div>
                <div className="rp-sc-sm-sep" />
                <div className="rp-sc-sm-cell">
                  <span className="rp-sc-sm-lbl">تعديلات المستهدفات</span>
                  <strong className="rp-sc-sm-val dem">
                    {activeSliders.filter(s => s.cat === 'demand').length} متغيّر
                  </strong>
                </div>
                <div className="rp-sc-sm-sep" />
                <div className="rp-sc-sm-cell">
                  <span className="rp-sc-sm-lbl">نطاق التطبيق</span>
                  <strong className="rp-sc-sm-val">{scopeLabel}</strong>
                </div>
              </div>

              <table className="rp-table rp-sc-table">
                <thead>
                  <tr>
                    <th>المتغيّر</th>
                    <th className="rp-th-num">الفئة</th>
                    <th className="rp-th-num">التعديل</th>
                    <th className="rp-th-num">الاتجاه</th>
                    <th>الأثر المتوقع</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSliders.map((s, i) => {
                    const isSup = s.cat === 'supply'
                    const isPos = s.value > 0
                    // Supply: positive = more capacity = good; Demand: positive = more demand = pressure
                    const isPositiveEffect = isSup ? isPos : !isPos
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'rp-tr-even' : ''}>
                        <td><strong>{s.label}</strong></td>
                        <td className="rp-td-num">
                          <span className={`rp-cat-pill ${isSup ? 'sup' : 'dem'}`}>
                            {isSup ? 'طاقة' : 'طلب'}
                          </span>
                        </td>
                        <td className="rp-td-num">
                          <span className={`rp-delta-val ${isPos ? 'pos' : 'neg'}`}>
                            {isPos ? '+' : ''}{s.value}%
                          </span>
                        </td>
                        <td className="rp-td-num">
                          <span className={`rp-delta-arrow ${isPos ? 'up' : 'down'}`}>
                            {isPos ? '▲' : '▼'}
                          </span>
                        </td>
                        <td className={isPositiveEffect ? 'rp-td-effect-pos' : 'rp-td-effect-neg'}>
                          {isSup
                            ? (isPos ? 'رفع الطاقة الاستيعابية' : 'خفض الطاقة الاستيعابية')
                            : (isPos ? 'زيادة الضغط على المنشآت' : 'تخفيف الضغط على المنشآت')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="rp-sc-warning">
                ⚠️ جميع نتائج هذا التقرير تعكس السيناريو المعدَّل ولا تمثّل البيانات الفعلية.
                يُشار إلى التعديلات الافتراضية بنسب مئوية مُطبَّقة على القيم الأساسية.
              </div>
            </>
          ) : (
            <div className="rp-sc-empty">
              <div className="rp-sc-empty-title">لا توجد تعديلات نشطة</div>
              <div className="rp-sc-empty-sub">
                يعكس هذا التقرير البيانات الأساسية دون أي تعديلات افتراضية.
                جميع الأرقام مبنية على القيم الفعلية المُدخلة في قاعدة البيانات.
              </div>
            </div>
          )}

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 5 — TOP DEFICIT DAYS (Part 1, up to 15 rows)
      ══════════════════════════════════════════════════════════ */}
      {opts.tables && defPage1.length > 0 && (
        <div className="rp-page rp-page-content">
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الخامس</div>
              <h2 className="rp-section-title">أعلى أيام العجز المسجّلة</h2>
              <div className="rp-section-sub">
                أكبر {deficitRows.length} يوم عجز خلال {yrLabel}
                {defPage2.length > 0 ? ` · الجزء الأول (1–20)` : ''}
              </div>
            </div>
          </div>

          <table className="rp-table rp-deficit-table">
            <thead>
              <tr>
                <th className="rp-th-rank">#</th>
                <th>التاريخ</th>
                <th className="rp-th-num rp-th-dem">الطلب<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num rp-th-sup">الطاقة<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num">الفجوة<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num">نسبة الإشغال</th>
                <th>الموسم</th>
              </tr>
            </thead>
            <tbody>
              {defPage1.map((r, i) => {
                const occ = r.supply > 0 ? Math.round(r.demand / r.supply * 100) : 0
                return (
                  <tr key={r.dateKey} className={i % 2 === 0 ? 'rp-tr-even' : ''}>
                    <td className="rp-td-rank">{i + 1}</td>
                    <td><strong>{r.dateLabel}</strong></td>
                    <td className="rp-td-dem rp-td-num">{fmtFull(r.demand)}</td>
                    <td className="rp-td-sup rp-td-num">{fmtFull(r.supply)}</td>
                    <td className="rp-td-gap-neg rp-td-num"><strong>+{fmtFull(r.gap)}</strong></td>
                    <td className="rp-td-num">
                      <span className={`rp-pct-pill ${occ >= 110 ? 'dem' : occ >= 95 ? 'warn' : 'sup'}`}>
                        {occ}%
                      </span>
                    </td>
                    <td className="rp-td-season">
                      {r.isRamadan && <span className="rp-badge rp-badge-ram">🌙 رمضان</span>}
                      {r.isHajj && <span className="rp-badge rp-badge-hajj">🕋 حج</span>}
                      {!r.isRamadan && !r.isHajj && <span className="rp-td-dim">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {defPage2.length === 0 && (
            <div className="rp-def-note">
              إجمالي أيام العجز المُسجّلة: <strong>{deficitRows.length} يوم</strong> من أصل {kpi?.total ?? series.length} يوم محلَّل
            </div>
          )}

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 6 — TOP DEFICIT DAYS (Part 2, rows 21–xx)
      ══════════════════════════════════════════════════════════ */}
      {opts.tables && defPage2.length > 0 && (
        <div className="rp-page rp-page-content">
          <div className="rp-page-header">
            <div className="rp-page-header-bar" />
            <div className="rp-page-header-body">
              <div className="rp-page-section-label">القسم الخامس — تابع</div>
              <h2 className="rp-section-title">أعلى أيام العجز المسجّلة</h2>
              <div className="rp-section-sub">الجزء الثاني (21–{deficitRows.length})</div>
            </div>
          </div>

          <table className="rp-table rp-deficit-table">
            <thead>
              <tr>
                <th className="rp-th-rank">#</th>
                <th>التاريخ</th>
                <th className="rp-th-num rp-th-dem">الطلب<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num rp-th-sup">الطاقة<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num">الفجوة<br /><span className="rp-th-unit">سرير</span></th>
                <th className="rp-th-num">نسبة الإشغال</th>
                <th>الموسم</th>
              </tr>
            </thead>
            <tbody>
              {defPage2.map((r, i) => {
                const occ = r.supply > 0 ? Math.round(r.demand / r.supply * 100) : 0
                const globalIdx = i + 20
                return (
                  <tr key={r.dateKey} className={i % 2 === 0 ? 'rp-tr-even' : ''}>
                    <td className="rp-td-rank">{globalIdx + 1}</td>
                    <td><strong>{r.dateLabel}</strong></td>
                    <td className="rp-td-dem rp-td-num">{fmtFull(r.demand)}</td>
                    <td className="rp-td-sup rp-td-num">{fmtFull(r.supply)}</td>
                    <td className="rp-td-gap-neg rp-td-num"><strong>+{fmtFull(r.gap)}</strong></td>
                    <td className="rp-td-num">
                      <span className={`rp-pct-pill ${occ >= 110 ? 'dem' : occ >= 95 ? 'warn' : 'sup'}`}>
                        {occ}%
                      </span>
                    </td>
                    <td className="rp-td-season">
                      {r.isRamadan && <span className="rp-badge rp-badge-ram">🌙 رمضان</span>}
                      {r.isHajj && <span className="rp-badge rp-badge-hajj">🕋 حج</span>}
                      {!r.isRamadan && !r.isHajj && <span className="rp-td-dim">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="rp-def-note">
            إجمالي أيام العجز المُسجّلة: <strong>{deficitRows.length} يوم</strong> من أصل {kpi?.total ?? series.length} يوم محلَّل
          </div>

          <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGE 7 — APPENDIX
      ══════════════════════════════════════════════════════════ */}
      <div className="rp-page rp-page-content">
        <div className="rp-page-header">
          <div className="rp-page-header-bar" />
          <div className="rp-page-header-body">
            <div className="rp-page-section-label">الملحق</div>
            <h2 className="rp-section-title">بيانات التصدير والمنهجية</h2>
            <div className="rp-section-sub">معلومات تقنية وسياق البيانات</div>
          </div>
        </div>

        {/* Metadata table */}
        <div className="rp-ap-section-title">بيانات التقرير</div>
        <table className="rp-table rp-ap-table">
          <tbody>
            {[
              ['معرّف التقرير', reportId],
              ['تاريخ التصدير', today],
              ['الفترة المحلَّلة', yrLabel],
              ['نوع المستهدفات', demTypeLabel],
              ['نوع الطاقة الاستيعابية', supTypeLabel],
              ['نطاق السيناريو', scopeLabel],
              ['إجمالي نقاط البيانات', `${series.length} يوم`],
              ['أيام رمضان المرصودة', `${ram?.rDays ?? 0} يوم`],
              ['إجمالي أيام العجز', kpi ? `${kpi.defD} يوم (${Math.round(kpi.defPct)}%)` : '—'],
              ['إجمالي أيام الفائض', kpi ? `${kpi.total - kpi.defD} يوم (${100 - Math.round(kpi.defPct)}%)` : '—'],
              ['التعديلات الافتراضية المفعّلة', `${activeSliders.length} تعديل`],
              ['منصة التحليل', 'إيواء مكة المكرمة v1.0'],
            ].map(([k, v], i) => (
              <tr key={i} className={i % 2 === 0 ? 'rp-tr-even' : ''}>
                <td className="rp-ap-key">{k}</td>
                <td className="rp-ap-val"><strong>{v}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Methodology notes */}
        <div className="rp-ap-section-title" style={{ marginTop: 20 }}>منهجية الحسابات</div>
        <div className="rp-meth-grid">
          {[
            { icon: '🏨', title: 'الطاقة الاستيعابية', body: 'تُحسب بجمع أسرّة المرافق المرخّصة ومشاريع الإيواء المستقبلية ومساكن الحجاج، مع تطبيق نسب السيناريو الافتراضية عند تفعيلها.' },
            { icon: '🎯', title: 'المستهدفات (الطلب)', body: 'تستند إلى أعداد الزوار المتوقعين من الخارج والداخل وفق خطط رؤية 2030 وبيانات هيئة الإحصاء والجهات المعنية.' },
            { icon: '📊', title: 'الفجوة اليومية', body: 'الفرق بين الطلب اليومي والطاقة الاستيعابية. القيمة الموجبة تعني عجزاً، والسالبة تعني فائضاً في الأسرّة.' },
            { icon: '🌙', title: 'مواسم رمضان والحج', body: 'تُحدَّد وفق التقويم الهجري. عام 2030 استثنائي لاحتمالية وقوع رمضان مرّتين — يُعالَج بتحليل مزدوج مستقل لكل فترة.' },
          ].map(({ icon, title, body }, i) => (
            <div key={i} className="rp-meth-row">
              <span className="rp-meth-icon">{icon}</span>
              <div>
                <div className="rp-meth-title">{title}</div>
                <div className="rp-meth-body">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rp-disclaimer">
          <strong>تحفّظ قانوني:</strong> هذا التقرير مُولَّد تلقائياً من منصة إيواء مكة المكرمة — برنامج خدمة ضيوف الرحمن.
          المعلومات الواردة للاستخدام الداخلي فقط وقد تحتوي على بيانات تقديرية ومستقبلية.
          لا يُعتمد عليها مرجعاً رسمياً نهائياً دون مراجعة الجهات المختصة.
        </div>

        <RpPageFooter yrLabel={yrLabel} reportId={reportId} today={today} />
      </div>

    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  PDF GENERATOR — uses CP.pdf as cover, merges via pdf-lib
// ════════════════════════════════════════════════════════════════
async function generatePDF(rootEl, reportId, yr, quality, onProgress) {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  // Content pages (skip cover — we use CP.pdf)
  const pages = [...rootEl.querySelectorAll('.rp-page')]
  const W = 210, H = 297
  const scale = quality === 'high' ? 2.5 : 1.8

  onProgress(5)

  // Step 1: render all pages to jsPDF
  const contentDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  for (let i = 0; i < pages.length; i++) {
    onProgress(Math.round((i / pages.length) * 55) + 10)
    const canvas = await html2canvas(pages[i], {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
    })
    const imgData = canvas.toDataURL('image/jpeg', quality === 'high' ? 0.95 : 0.85)
    if (i > 0) contentDoc.addPage()
    contentDoc.addImage(imgData, 'JPEG', 0, 0, W, H)
  }

  onProgress(68)

  // Step 2: Try merging with CP.pdf using pdf-lib
  const yrLabel = yr ?? 'متعدد'
  const filename = `تقرير-${yrLabel}-${reportId}.pdf`

  try {
    const { PDFDocument } = await import('pdf-lib')
    onProgress(72)

    const [coverBuffer, contentArrayBuffer] = await Promise.all([
      fetch('/CP.pdf').then(r => {
        if (!r.ok) throw new Error('CP.pdf not found')
        return r.arrayBuffer()
      }),
      Promise.resolve(contentDoc.output('arraybuffer')),
    ])

    onProgress(80)

    const mergedDoc = await PDFDocument.create()

    // Embed cover
    const coverDoc = await PDFDocument.load(coverBuffer)
    const coverPages = await mergedDoc.copyPages(coverDoc, coverDoc.getPageIndices())
    coverPages.forEach(p => mergedDoc.addPage(p))

    // Embed content
    const contentPdfDoc = await PDFDocument.load(contentArrayBuffer)
    const contentPdfPages = await mergedDoc.copyPages(contentPdfDoc, contentPdfDoc.getPageIndices())
    contentPdfPages.forEach(p => mergedDoc.addPage(p))

    onProgress(90)

    const mergedBytes = await mergedDoc.save()
    const blob = new Blob([mergedBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)

    onProgress(100)
    return filename

  } catch (coverErr) {
    // Fallback: save without CP.pdf cover
    console.warn('[ExportModal] CP.pdf merge skipped:', coverErr.message)
    contentDoc.save(filename)
    onProgress(100)
    return filename
  }
}

// ════════════════════════════════════════════════════════════════
//  EXPORT MODAL
// ════════════════════════════════════════════════════════════════
const STEPS = ['جمع البيانات', 'تجهيز الصفحات', 'توليد PDF', 'التحميل']

export default function ExportModal({ onClose, payload }) {
  const reportId = useRef(genId()).current
  const reportRef = useRef(null)

  const [reportName, setReportName] = useState(
    `تقرير إيواء مكة ${payload.yr ?? payload.seriesYears?.join('–')} — ${nowLabel()}`
  )
  const [opts, setOpts] = useState({
    kpis: true, tables: true, insights: true, scenario: true,
  })
  const [quality, setQuality] = useState('standard')
  const [phase, setPhase] = useState('config')
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)
  const [errMsg, setErrMsg] = useState('')
  const [recent, setRecent] = useState(() => getRecent())

  const toggleOpt = k => setOpts(o => ({ ...o, [k]: !o[k] }))

  const handleGenerate = useCallback(async () => {
    setPhase('generating')
    setProgress(5)
    setStep(0)
    try {
      await new Promise(r => setTimeout(r, 180))
      setStep(1); setProgress(12)
      await new Promise(r => setTimeout(r, 280))
      setStep(2); setProgress(22)

      const el = reportRef.current
      if (!el) throw new Error('فشل تحميل تخطيط التقرير')

      const filename = await generatePDF(el, reportId, payload.yr, quality, p => {
        setProgress(p)
        if (p > 30) setStep(2)
        if (p > 65) setStep(3)
        if (p > 85) setStep(4)
      })

      const entry = { id: reportId, name: reportName, filename, yr: payload.yr, ts: Date.now() }
      const updated = [entry, ...getRecent()].slice(0, 5)
      saveRecent(updated)
      setRecent(updated)
      setStep(4); setProgress(100)
      setPhase('done')
    } catch (e) {
      console.error(e)
      setErrMsg(e.message ?? 'حدث خطأ أثناء التوليد')
      setPhase('error')
    }
  }, [payload, quality, reportId, reportName])

  const activeCount = Object.values(payload.sc).filter(v => v !== 0).length

  return (
    <>
      {/* Hidden report layout */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', width: '794px', zIndex: -1 }}>
        <div ref={reportRef} style={{ width: '100%' }}>
          <ReportLayout payload={payload} reportId={reportId} opts={opts} />
        </div>
      </div>

      {/* Modal backdrop */}
      <div className="exp-backdrop" onClick={phase === 'config' ? onClose : undefined}>
        <div className="exp-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="exp-header">
            <div className="exp-header-left">
              <span className="exp-header-icon">📄</span>
              <div>
                <div className="exp-header-title">تصدير تقرير PDF</div>
                <div className="exp-header-sub">
                  {payload.yr
                    ? `تقرير ${payload.yr} · ${payload.series?.length ?? 0} يوم`
                    : `تقرير متعدد السنوات · ${payload.seriesYears?.join('–')}`}
                </div>
              </div>
            </div>
            {phase === 'config' && (
              <button className="exp-close" onClick={onClose}>✕</button>
            )}
          </div>

          {/* ── CONFIG ── */}
          {phase === 'config' && (
            <div className="exp-body">
              <div className="exp-field">
                <label className="exp-label">اسم التقرير</label>
                <input
                  className="exp-input"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                  placeholder="اسم التقرير..."
                />
              </div>

              <div className="exp-actions">
                <button className="exp-btn-cancel" onClick={onClose}>إلغاء</button>
                <button className="exp-btn-primary" onClick={handleGenerate}>
                  <span>📄</span> إنشاء التقرير
                </button>
              </div>
            </div>
          )}

          {/* ── GENERATING ── */}
          {phase === 'generating' && (
            <div className="exp-body exp-body-center">
              <div className="exp-gen-spinner" />
              <div className="exp-gen-title">جاري إنشاء التقرير...</div>
              <div className="exp-progress-wrap">
                <div className="exp-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="exp-progress-pct">{progress}%</div>
              <div className="exp-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className={`exp-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                    <div className="exp-step-dot">
                      {i < step ? '✓' : i === step ? '◉' : '○'}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="exp-gen-note">يُرجى عدم إغلاق النافذة أثناء التوليد</div>
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && (
            <div className="exp-body exp-body-center">
              <div className="exp-done-icon">✅</div>
              <div className="exp-done-title">تم التصدير بنجاح</div>
              <div className="exp-done-sub">
                تم تحميل <strong>{reportName}</strong> إلى جهازك
              </div>
              <div className="exp-done-id">معرّف التقرير: {reportId}</div>
              <div className="exp-actions" style={{ marginTop: 24 }}>
                <button className="exp-btn-cancel" onClick={onClose}>إغلاق</button>
                <button className="exp-btn-primary"
                  onClick={() => { setPhase('config'); setProgress(0); setStep(0) }}>
                  تصدير آخر
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {phase === 'error' && (
            <div className="exp-body exp-body-center">
              <div className="exp-done-icon">❌</div>
              <div className="exp-done-title">فشل التصدير</div>
              <div className="exp-done-sub">{errMsg}</div>
              <div className="exp-actions" style={{ marginTop: 24 }}>
                <button className="exp-btn-cancel" onClick={onClose}>إغلاق</button>
                <button className="exp-btn-primary"
                  onClick={() => { setPhase('config'); setProgress(0); setStep(0) }}>
                  المحاولة مجدداً
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── buildReportPayload — call from App.jsx ───────────────────────
export function buildReportPayload({ yr, kpi, ram, sc, scope, peakDemand, series, demTypes, supTypes, ramPeriods, hajjPeriod }) {
  const DEM_LABELS = { outside: 'من الخارج', inside: 'من الداخل' }
  const SUP_LABELS = { licensed: 'مرافق مرخصة', future: 'مستقبلية', hajj: 'مساكن الحجاج' }

  // Accept both Set and array
  const demArr = demTypes instanceof Set ? [...demTypes] : (Array.isArray(demTypes) ? demTypes : [demTypes])
  const supArr = supTypes instanceof Set ? [...supTypes] : (Array.isArray(supTypes) ? supTypes : [supTypes])

  const demTypeLabel = demArr.map(k => DEM_LABELS[k] ?? k).join(' + ')
  const supTypeLabel = supArr.map(k => SUP_LABELS[k] ?? k).join(' + ')
  const SCOPE_LABELS = { all: 'جميع السنوات', year: yr ? `${yr} فقط` : 'السنة المحددة' }

  // Compute monthly aggregates from series
  const byMo = {}
    ; (series ?? []).forEach(r => {
      if (!r.demand && !r.supply) return
      const m = r.date.getMonth()
      const y = r.date.getFullYear()
      const key = `${y}-${String(m).padStart(2, '0')}`
      if (!byMo[key]) byMo[key] = { mo: m, yr: y, name: AR_MON[m], demSum: 0, supSum: 0, n: 0, defDays: 0, isRam: false, isHajj: false }
      byMo[key].demSum += r.demand ?? 0
      byMo[key].supSum += r.supply ?? 0
      byMo[key].n++
      if ((r.demand ?? 0) > (r.supply ?? 0)) byMo[key].defDays++
      if (r.isRamadan) byMo[key].isRam = true
      if (r.isHajj) byMo[key].isHajj = true
    })

  const seriesYears = [...new Set((series ?? []).map(r => r.date.getFullYear()))].sort()

  const monthly = Object.entries(byMo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      name: !yr && seriesYears.length > 1 ? `${v.name} ${v.yr}` : v.name,
      avgDem: v.n ? Math.round(v.demSum / v.n) : 0,
      avgSup: v.n ? Math.round(v.supSum / v.n) : 0,
      avgGap: v.n ? Math.round((v.demSum - v.supSum) / v.n) : 0,
      defDays: v.defDays,
      totalDays: v.n,
      isRam: v.isRam,
      isHajj: v.isHajj,
    }))

  return {
    yr, kpi, ram, sc, scope, peakDemand,
    series: series ?? [],
    monthly,
    seriesYears,
    demTypes: demArr,
    supTypes: supArr,
    demTypeLabel,
    supTypeLabel,
    scopeLabel: SCOPE_LABELS[scope] ?? scope,
    ramPeriods: ramPeriods ?? [],
    hajjPeriod: hajjPeriod ?? null,
  }
}