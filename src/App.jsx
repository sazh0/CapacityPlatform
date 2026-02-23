import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, injectNavStyles, footerStyles, MODAL_CONTENT } from './theme'
import { Navbar, Footer, GlassModal } from './SharedLayout'
import { parseWorkbook, RAMADAN, HAJJ } from './parse.js'
import ExportModal, { buildReportPayload } from './ExportModal.jsx'
import {
  ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea, Area, ReferenceLine,
  PieChart, Pie, Cell, LabelList, RadialBarChart, RadialBar,
} from 'recharts'

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const T = {
  bg: '#1A1819', bgM: '#272425', bgL: '#323031',
  card: 'rgba(255,255,255,0.032)', border: 'rgba(255,255,255,0.07)',
  hover: 'rgba(150,113,38,0.06)',
  bronze: '#967126', bronzeL: '#B8912E', bronzeXL: '#D4AA52',
  green: '#007a53', greenL: '#009966', greenXL: '#00BC7D', greenDk: '#064E3B',
  sideHdr: '#064E3B', sideBg: '#065F46', sideDk: '#043D2D',
  dem: '#F87171', demL: 'rgba(248,113,113,0.2)', demBg: 'rgba(248,113,113,0.08)',
  sup: '#34D399', supL: 'rgba(52,211,153,0.2)', supBg: 'rgba(52,211,153,0.08)',
  ram: '#A78BFA', ramL: 'rgba(167,139,250,0.15)', ramBg: 'rgba(167,139,250,0.06)',
  hajj: '#FBBF24', hajjL: 'rgba(251,191,36,0.15)', hajjBg: 'rgba(251,191,36,0.06)',
  txt: '#F4F1EB', txtSub: 'rgba(244,241,235,0.82)', txtDim: 'rgba(244,241,235,0.55)',
  warn: '#FBBF24', warnBg: 'rgba(251,191,36,0.08)', warnBdr: 'rgba(251,191,36,0.3)',
}
const YEARS = [2026, 2027, 2028, 2029, 2030]
const AR_MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

/* ════════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════════ */
const fmtN = n => { if (n == null || isNaN(n)) return '—'; const a = Math.abs(n); return a >= 1_000_000 ? `${(a / 1_000_000).toFixed(1)}م` : Math.round(a).toLocaleString('en-US').replace(/,/g, '،') }
const fmtFull = n => n == null ? '—' : Math.round(Math.abs(n)).toLocaleString('en-US').replace(/,/g, '،')
const fmtShort = n => { if (n == null || isNaN(n)) return '—'; const a = Math.abs(n); return a >= 1_000_000 ? `${(a / 1_000_000).toFixed(1)}م` : a >= 1000 ? `${(a / 1000).toFixed(0)}ك` : String(Math.round(a)) }
const fmtExact = n => { if (n == null || isNaN(n)) return '—'; const a = Math.abs(n); const rounded = Math.round(a * 10) / 10; return rounded.toLocaleString('en-US', { maximumFractionDigits: 1 }).replace(/,/g, '،') }
const pctStr = v => (v >= 0 ? `+${v}` : `${v}`) + '%'
const fmtDate = d => d ? `${d.getDate()} ${AR_MON[d.getMonth()]} ${d.getFullYear()}` : '—'
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م` : v >= 1000 ? `${(v / 1000).toFixed(0)}ك` : `${v}`

/* ════════════════════════════════════════════════════════════════
   RAMADAN HELPERS — supports 2030 dual-Ramadan (array format)
════════════════════════════════════════════════════════════════ */
// RAMADAN[yr] is always an array in parse.js; this guards legacy single-obj too
const getRamadanPeriods = yr => {
  const r = RAMADAN[yr]
  if (!r) return []
  return Array.isArray(r) ? r : [r]
}
// Arabic ordinal labels
const RAM_ORDINAL = ['الأول', 'الثاني', 'الثالث']

/* ════════════════════════════════════════════════════════════════
   SHARED TOOLTIP WRAPPER
════════════════════════════════════════════════════════════════ */
const TT = ({ children, minW = 160, accentColor }) => (
  <div style={{
    background: 'rgba(22,20,21,0.97)',
    border: `1px solid rgba(255,255,255,0.1)`,
    borderTop: accentColor ? `2.5px solid ${accentColor}` : undefined,
    borderRadius: 12,
    fontFamily: 'Cairo,sans-serif', direction: 'rtl',
    color: T.txt, fontSize: 12,
    boxShadow: '0 16px 50px rgba(0,0,0,0.65)',
    padding: '12px 15px',
    minWidth: minW,
    position: 'relative',
    zIndex: 9999,
    pointerEvents: 'none',
  }}>{children}</div>
)

/* ════════════════════════════════════════════════════════════════
   LOGO
════════════════════════════════════════════════════════════════ */
const LogoIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9Z" stroke={T.bronze} strokeWidth="1.2" fill="none" />
    <path d="M16 2 L16 30" stroke={T.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <path d="M4 9 L28 23" stroke={T.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <path d="M4 23 L28 9" stroke={T.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <circle cx="16" cy="16" r="3.5" fill={T.bronze} fillOpacity="0.82" />
    <circle cx="16" cy="7" r="1.5" fill={T.greenXL} />
    <circle cx="23" cy="21" r="1.4" fill={T.bronze} fillOpacity="0.55" />
    <circle cx="9" cy="21" r="1.4" fill="rgba(200,202,204,0.7)" />
  </svg>
)

/* ════════════════════════════════════════════════════════════════
   SEGMENT BUTTON
════════════════════════════════════════════════════════════════ */
const Seg = ({ active, onClick, children, color }) => (
  <button className={`seg-btn${active ? ' active' : ''}`} onClick={onClick}
    style={active ? { background: color || T.bronze, borderColor: color || T.bronze } : {}}>
    {children}
  </button>
)

/* ════════════════════════════════════════════════════════════════
   KPI CARD
════════════════════════════════════════════════════════════════ */
const Kpi = ({ label, value, sub, color, icon }) => (
  <div className="card fade-up"
    style={{ padding: '14px 16px', borderTop: `2px solid ${color}`, borderRadius: 12, transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'default' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.38),0 0 0 1px ${color}28` }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: T.txtSub, lineHeight: 1.45, flex: 1 }}>{label}</div>
      {icon && <span style={{ fontSize: 17, opacity: .75 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -.5, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>{sub}</div>}
  </div>
)

/* ════════════════════════════════════════════════════════════════
   SLIDER — UX upgrade: accessible, compact, clearer states
════════════════════════════════════════════════════════════════ */
const Slider = ({ label, value, onChange, color, icon }) => {
  const MIN = -50
  const MAX = 100
  const RANGE = MAX - MIN
  const zeroPos = ((0 - MIN) / RANGE) * 100
  const valPos = ((value - MIN) / RANGE) * 100

  const isNeg = value < 0
  const isEmpty = value === 0

  // Fill: from 0 to value (either direction)
  const fillLeft = isNeg ? valPos : zeroPos
  const fillRight = isNeg ? zeroPos : valPos
  const fillWidth = Math.abs(fillRight - fillLeft)

  const badgeColor = isEmpty ? T.txtDim : isNeg ? T.dem : color
  const badgeBg = isEmpty ? 'rgba(255,255,255,0.05)' : isNeg ? T.demBg : `${color}15`
  const badgeBdr = isEmpty ? 'rgba(255,255,255,0.08)' : isNeg ? T.demL : `${color}30`

  const id = `sl-${label.replace(/\s+/g, '-')}`

  return (
    <div
      className={`slider-row${isEmpty ? ' is-empty' : ''}${isNeg ? ' is-neg' : ''}`}
      style={{
        '--accent': isNeg ? T.dem : color,
        '--thumb': isEmpty ? 'rgba(255,255,255,0.32)' : (isNeg ? T.dem : color),
      }}
    >
      {/* Header */}
      <div className="slider-head">
        <label className="slider-label" htmlFor={id} title={label}>
          {icon && <span className="slider-icon" aria-hidden="true">{icon}</span>}
          <span className="slider-label-text">{label}</span>
        </label>

        <span
          className="slider-badge"
          style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBdr}` }}
          aria-label={`${label}: ${pctStr(value)}`}
        >
          {pctStr(value)}
        </span>
      </div>

      {/* Track */}
      <div className="slider-track-wrap">
        <div className="slider-track-bg" aria-hidden="true" />

        {!isEmpty && (
          <div
            className="slider-track-fill"
            aria-hidden="true"
            style={{
              left: `${fillLeft}%`,
              width: `${fillWidth}%`,
              background: isNeg
                ? `linear-gradient(to right, ${T.dem}80, ${T.dem})`
                : `linear-gradient(to right, ${color}, ${color}bb)`,
              boxShadow: `0 0 8px ${isNeg ? T.dem : color}44`,
            }}
          />
        )}

        {/* Zero marker */}
        <div className="slider-zero-mark" style={{ left: `${zeroPos}%` }} aria-hidden="true" />

        {/* Actual input */}
        <input
          id={id}
          type="range"
          className="slider-input"
          min={MIN}
          max={MAX}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          aria-valuetext={pctStr(value)}
        />
      </div>

      {/* Scale */}
      <div className="slider-scale" aria-hidden="true">
        <span>{MIN}%</span>
        <span className="slider-scale-zero">0</span>
        <span>+{MAX}%</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SHARED CHART CARD WRAPPER
════════════════════════════════════════════════════════════════ */
const ChartCard = ({ title, subtitle, accent, children, className = '', style = {}, headerExtra }) => (
  <div className={`card chart-card ${className}`}
    style={{ padding: '16px 16px 14px', borderTop: `2px solid ${accent}55`, ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, borderRadius: 3, background: accent, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.txt, lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: T.txtSub, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {headerExtra && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{headerExtra}</div>}
    </div>
    {children}
  </div>
)

/* ════════════════════════════════════════════════════════════════
   MINI CHART 1 — DONUT: deficit vs surplus days
════════════════════════════════════════════════════════════════ */
function DonutChart({ donut, defPct }) {
  const total = donut.reduce((s, d) => s + d.value, 0)
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0]
    return (
      <TT accentColor={p.payload.color} minW={155}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: p.payload.color,
            boxShadow: `0 0 6px ${p.payload.color}80`
          }} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: p.payload.color, lineHeight: 1 }}>
          {p.value} <span style={{ fontSize: 10, fontWeight: 400, color: T.txtDim }}>يوم</span>
        </div>
        <div style={{ fontSize: 10.5, color: T.txtDim, marginTop: 5 }}>
          {total ? Math.round(p.value / total * 100) : 0}% من إجمالي الأيام
        </div>
      </TT>
    )
  }
  return (
    <ChartCard title="توزيع أيام السنة" subtitle="عجز / فائض" accent={T.dem}>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={155}>
          <PieChart>
            <Pie data={donut} cx="50%" cy="50%"
              innerRadius={46} outerRadius={68} paddingAngle={5}
              dataKey="value" stroke="none" cornerRadius={5}
              animationBegin={80} animationDuration={1200} animationEasing="ease-out">
              {donut.map((e, i) => (
                <Cell key={i} fill={e.color} opacity={0.92}
                  style={{ filter: `drop-shadow(0 0 7px ${e.color}55)` }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-52%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: defPct > 50 ? T.dem : T.sup, lineHeight: 1 }}>{defPct}%</div>
          <div style={{ fontSize: 8.5, color: T.txtDim, marginTop: 3, letterSpacing: .6, textTransform: 'uppercase' }}>عجز</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
        {donut.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.txtSub }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0,
              boxShadow: `0 0 5px ${s.color}55`
            }} />
            {s.name} <strong style={{ color: s.color }}>{s.value}</strong>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

/* ════════════════════════════════════════════════════════════════
   MINI CHART 2 — MONTHLY gap (bars + styled)
════════════════════════════════════════════════════════════════ */
function MonthlyBarChart({ monthly, defPct }) {
  const surPct = 100 - defPct
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const v = payload[0]?.value
    const def = v > 0
    const item = monthly.find(m => m.name === label)
    return (
      <TT accentColor={def ? T.dem : T.sup} minW={180}>
        <div style={{ fontWeight: 800, fontSize: 13, color: T.txt, marginBottom: 5 }}>{label}</div>
        {item?.isRam && <div style={{ fontSize: 9.5, color: T.ram, marginBottom: 4 }}>🌙 شهر رمضان</div>}
        {item?.isHajj && <div style={{ fontSize: 9.5, color: T.hajj, marginBottom: 4 }}>🕋 موسم الحج</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 18, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: T.txtSub }}>{def ? 'متوسط العجز' : 'متوسط الفائض'}</span>
          <strong style={{ fontSize: 18, color: def ? T.dem : T.sup }}>{fmtFull(Math.abs(v))}</strong>
        </div>
        <div style={{ fontSize: 9.5, color: T.txtDim, marginTop: 3 }}>سرير / يوم</div>
      </TT>
    )
  }
  return (
    <ChartCard title="مؤشر الفجوة الشهرية"
      accent={T.bronze} className="monthly-chart-wide">

      {/* ── Year distribution strip (replaces DonutChart) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, color: T.txtDim, flexShrink: 0, fontWeight: 700 }}>توزيع أيام السنة</div>
        <div style={{ flex: 1, height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ width: `${defPct}%`, background: `linear-gradient(to right,${T.dem}cc,${T.dem})`, height: '100%', transition: 'width .6s ease', borderRadius: '6px 0 0 6px', boxShadow: `0 0 8px ${T.dem}55` }} />
          <div style={{ width: `${surPct}%`, background: `linear-gradient(to left,${T.sup}cc,${T.sup})`, height: '100%', transition: 'width .6s ease', borderRadius: '0 6px 6px 0', boxShadow: `0 0 8px ${T.sup}55` }} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: T.dem }}>{defPct}% <span style={{ fontSize: 9, fontWeight: 400, color: T.txtDim }}>عجز</span></span>
          <span style={{ fontSize: 10, color: T.txtDim, alignSelf: 'center' }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: T.sup }}>{surPct}% <span style={{ fontSize: 9, fontWeight: 400, color: T.txtDim }}>فائض</span></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 8 }}>
        {[{ c: T.dem, l: 'عجز' }, { c: T.sup, l: 'فائض' }].map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.txtDim }}>
            <span style={{ width: 10, height: 3, background: x.c, borderRadius: 2, display: 'inline-block' }} />{x.l}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={monthly} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fontFamily: 'Cairo,sans-serif', fontSize: 9.5, fill: T.txtDim }}
            axisLine={false} tickLine={false} tickFormatter={fmtK} />
          <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Cairo,sans-serif', fontSize: 9.5, fill: T.txtDim }}
            axisLine={false} tickLine={false} width={40} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} strokeDasharray="4 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }} wrapperStyle={{ zIndex: 9999 }} />
          <Bar dataKey="gap" radius={[0, 4, 4, 0]} maxBarSize={16}
            animationBegin={150} animationDuration={1100} animationEasing="ease-out">
            {monthly.map((e, i) => (
              <Cell key={i}
                fill={e.gap > 0 ? T.dem : T.sup}
                fillOpacity={e.isRam || e.isHajj ? 1 : 0.75}
                stroke="none"
                strokeWidth={0} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ════════════════════════════════════════════════════════════════
   MINI CHART 3 — SEASONAL RADIAL BAR: deficit % per period
════════════════════════════════════════════════════════════════ */
function SeasonalRadialBar({ seasonal }) {
  const data = [...seasonal].sort((a, b) => a.defPct - b.defPct).map(s => ({ ...s, fill: s.color }))
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0]
    const item = seasonal.find(s => s.name === p.payload.name)
    return (
      <TT accentColor={p.payload.color} minW={160}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: p.payload.color }} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{p.payload.name}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: p.payload.color, lineHeight: 1 }}>
          {p.payload.defPct}%
        </div>
        <div style={{ fontSize: 10, color: T.txtDim, marginTop: 5 }}>
          نسبة أيام العجز{item?.days > 0 ? ` · ${fmtFull(item.days)} يوم` : ''}
        </div>
      </TT>
    )
  }
  return (
    <ChartCard title="نسبة العجز الموسمي" accent={T.ram}>
      <div style={{ position: 'relative', paddingTop: '10px' }}>
        <ResponsiveContainer width="100%" height={160}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="28%" outerRadius="92%"
            data={data} startAngle={180} endAngle={-180}>
            <RadialBar dataKey="defPct" cornerRadius={5}
              background={{ fill: 'rgba(255,255,255,0.04)' }}
              animationBegin={200} animationDuration={1200} animationEasing="ease-out">
              {data.map((e, i) => (<Cell key={i} fill={e.color} fillOpacity={0.88} />))}
            </RadialBar>
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          {seasonal.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtSub }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.name}
              <strong style={{ color: s.color }}>{s.defPct}%</strong>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}

/* ════════════════════════════════════════════════════════════════
   MINI CHART 4 — DEMAND SPLIT: outside vs inside (donut)
════════════════════════════════════════════════════════════════ */
function DemandSplitChart({ split: rawRows }) {
  const AR_MON_FULL = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const COLORS = [T.bronzeXL, T.greenXL]
  const LABELS = ['من الخارج', 'من الداخل']

  const [moFilter, setMoFilter] = useState('all')   // 'all' | 0-11
  const [ramOnly, setRamOnly] = useState(false)

  const filtered = useMemo(() => {
    let rows = rawRows
    if (ramOnly) rows = rows.filter(r => r.isRamadan)
    if (moFilter !== 'all') rows = rows.filter(r => r.date.getMonth() === moFilter)
    return rows
  }, [rawRows, moFilter, ramOnly])

  const avgOut = filtered.length ? filtered.reduce((s, r) => s + (r.ado ?? 0), 0) / filtered.length : 0
  const avgIn = filtered.length ? filtered.reduce((s, r) => s + (r.adi ?? 0), 0) / filtered.length : 0
  const total = avgOut + avgIn
  const data = [
    { name: LABELS[0], value: Math.round(avgOut), fill: COLORS[0] },
    { name: LABELS[1], value: Math.round(avgIn), fill: COLORS[1] },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0]
    const pct = total ? Math.round(p.value / total * 100) : 0
    return (
      <TT accentColor={p.payload.fill} minW={165}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.payload.fill }} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: p.payload.fill, lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: 10, color: T.txtSub, marginTop: 4 }}>{fmtFull(p.value)} سرير/يوم (متوسط)</div>
      </TT>
    )
  }

  // Months available in rawRows
  const availMos = [...new Set(rawRows.map(r => r.date.getMonth()))].sort((a, b) => a - b)

  return (
    <ChartCard
      title="توزيع الطلب"
      accent={T.bronzeL}
      headerExtra={
        <>
          <select
            value={moFilter}
            onChange={e => { setMoFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setRamOnly(false) }}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: T.txt, fontSize: 10, fontFamily: 'Cairo,sans-serif',
              padding: '3px 8px', cursor: 'pointer', outline: 'none', direction: 'rtl',
            }}>
            <option value="all" style={{ background: '#1A1819' }}>كل الأشهر</option>
            {availMos.map(m => (
              <option key={m} value={m} style={{ background: '#1A1819' }}>{AR_MON_FULL[m]}</option>
            ))}
          </select>
          <button
            onClick={() => { setRamOnly(v => !v); setMoFilter('all') }}
            style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'Cairo,sans-serif',
              border: `1px solid ${ramOnly ? T.ram : 'rgba(255,255,255,0.1)'}`,
              background: ramOnly ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
              color: ramOnly ? T.ram : T.txtSub, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              opacity: moFilter !== 'all' ? 0.30 : 1,
            }}>
            🌙 رمضان
          </button>
          {(moFilter !== 'all' || ramOnly) && (
            <button
              type="button"
              aria-label="إزالة الفلتر"
              title="إزالة الفلتر"
              onClick={() => {
                setMoFilter('all');
                setRamOnly(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                padding: 0,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: T.txtSub || T.txtDim,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                e.currentTarget.style.color = T.txt;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = T.txtSub || T.txtDim;
              }}
            >
              ✕
            </button>
          )}
        </>
      }>


      {total > 0 ? (
        <>
          <div style={{ position: 'relative', paddingTop: '5px' }}>
            <ResponsiveContainer width="100%" height={155}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%"
                  innerRadius={46} outerRadius={68} paddingAngle={5}
                  dataKey="value" cornerRadius={5} stroke="none"
                  animationBegin={100} animationDuration={900} animationEasing="ease-out">
                  {data.map((e, i) => (
                    <Cell key={i} fill={e.fill} opacity={0.9}
                      style={{ filter: `drop-shadow(0 0 5px ${e.fill}45)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-52%)', textAlign: 'center', pointerEvents: 'none'
            }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: T.bronzeXL, lineHeight: 1 }}>{fmtN(total)}</div>
              <div style={{ fontSize: 7.5, color: T.txtSub, marginTop: 2, letterSpacing: .5 }}>متوسط/يوم</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
            {data.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.txtSub }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
                {d.name.split(' ')[1] || d.name}
                <strong style={{ color: d.fill }}>{total ? Math.round(d.value / total * 100) : 0}%</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.txtSub, fontSize: 11
        }}>لا توجد بيانات</div>
      )}
    </ChartCard>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN CHART TOOLTIP
════════════════════════════════════════════════════════════════ */
const GapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload; if (!d) return null
  const def = d.gap > 0
  return (
    <TT accentColor={def ? T.dem : T.sup} minW={235}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 13, color: T.txt }}>{d.dateLabel}</strong>
        <div style={{ display: 'flex', gap: 5 }}>
          {d.isRamadan && <span style={{ fontSize: 11, background: T.ramL, color: T.ram, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>🌙 رمضان</span>}
          {d.isHajj && <span style={{ fontSize: 11, background: T.hajjL, color: T.hajj, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>🕋 حج</span>}
        </div>
      </div>
      {[{ l: 'المستهدفات', v: d.demand, c: T.dem }, { l: 'الطاقة الاستيعابية', v: d.supply, c: T.sup }].map(r => (
        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
          <span style={{ color: T.txtSub, fontSize: 11 }}>{r.l}</span>
          <strong style={{ color: r.c, fontSize: 13 }}>{fmtFull(r.v)} <span style={{ fontWeight: 400, fontSize: 11, color: T.txtDim }}>سرير/يوم</span></strong>
        </div>
      ))}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 11px', borderRadius: 20, background: def ? T.demBg : T.supBg, color: def ? T.dem : T.sup, border: `1px solid ${def ? T.demL : T.supL}` }}>
          {def ? '⚠ عجز' : '✓ فائض'}
        </span>
        <strong style={{ fontSize: 17, color: def ? T.dem : T.sup }}>{fmtFull(Math.abs(d.gap))}</strong>
      </div>
    </TT>
  )
}

/* ════════════════════════════════════════════════════════════════
   LOADING & ERROR
════════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, background: T.bg, padding: 24 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid rgba(150,113,38,0.2)` }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid transparent`, borderTopColor: T.bronze, animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🕌</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.txt }}>جاري تحميل البيانات</div>
        <div style={{ fontSize: 13, color: T.txtSub, marginTop: 5 }}>housing.xlsx</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, width: '100%', maxWidth: 500 }}>
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: T.bg, padding: 32 }}>
      <div style={{ fontSize: 52 }}>⚠️</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.txt }}>تعذّر تحميل البيانات</div>
      <div className="card" style={{ padding: '16px 24px', color: T.dem, fontSize: 13, maxWidth: 580, lineHeight: 1.9, borderRight: `3px solid ${T.dem}` }}>{message}</div>
      <div className="card" style={{ padding: '16px 24px', color: T.txtSub, fontSize: 12, maxWidth: 500, lineHeight: 2 }}>
        <strong style={{ color: T.txt, display: 'block', marginBottom: 8 }}>📋 الخطوات المطلوبة:</strong>
        {['housing.xlsx في مجلد public/', 'ورقتي Supply و Demand', 'عمود Date Gregorian', 'أعد تشغيل npm run dev'].map((s, i) => (
          <div key={i}>{i + 1}. <code style={{ background: 'rgba(150,113,38,0.15)', padding: '1px 7px', borderRadius: 4, color: T.bronzeXL }}>{s}</code></div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCENARIO SIDEBAR — v3
════════════════════════════════════════════════════════════════ */
function ScenarioSidebar({ sc, setSci, onClose }) {
  const ALL_KEYS = ['sl', 'sf', 'sh', 'br', 'do_', 'di']
  const supplyKeys = ['sl', 'sf', 'sh', 'br']
  const demandKeys = ['do_', 'di']
  const hasAnyChange = ALL_KEYS.some(k => (sc[k] ?? 0) !== 0)
  const activeCount = ALL_KEYS.filter(k => (sc[k] ?? 0) !== 0).length

  const avgAdj = (keys) => {
    const vals = keys.map(k => sc[k] ?? 0).filter(v => v !== 0)
    if (!vals.length) return null
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
  }
  const supAvg = avgAdj(supplyKeys)
  const demAvg = avgAdj(demandKeys)

  const SUPPLY_ITEMS = [
    { k: 'sl', l: 'مرافق مرخصة', icon: '🏨', hint: '637,360 سرير / يوم' },
    { k: 'sf', l: 'مشاريع مستقبلية', icon: '🏗️', hint: '30,263 سرير مخطط' },
    { k: 'sh', l: 'مساكن الحجاج', icon: '🕌', hint: '1.7م سرير / يوم' },
    { k: 'br', l: 'نسبة الأسرة / الغرفة', icon: '🛏️', hint: 'غير حج: 3.1 · حج: 4.3' },
  ]
  const DEMAND_ITEMS = [
    { k: 'do_', l: 'زوار من الخارج', icon: '✈️', hint: '457,678 / يوم' },
    { k: 'di', l: 'زوار من الداخل', icon: '🚌', hint: '61,269 / يوم' },
  ]

  const ALL_ITEMS = [
    ...SUPPLY_ITEMS.map(i => ({ ...i, cat: 'supply' })),
    ...DEMAND_ITEMS.map(i => ({ ...i, cat: 'demand' })),
  ]

  /* Net impact indicator */
  const netSup = supplyKeys.reduce((s, k) => s + (sc[k] ?? 0), 0)
  const netDem = demandKeys.reduce((s, k) => s + (sc[k] ?? 0), 0)
  const netImpact = netSup - netDem
  const impactPos = netImpact >= 0

  return (
    <div className="scenario-sidebar">

      {/* ══ HEADER ══ */}
      <div className="sidebar-header">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: '#F4F1EB', letterSpacing: -.3 }}>السيناريوهات</div>
        </div>
        {hasAnyChange && (
          <div className="sidebar-active-badge">{activeCount}</div>
        )}
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="إغلاق">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ══ NET IMPACT PILL ══ */}
      {hasAnyChange && (
        <div className={`sc-impact-banner${impactPos ? ' positive' : ' negative'}`}>
          <span className="sc-impact-icon">{impactPos ? '↑' : '↓'}</span>
          <div className="sc-impact-body">
            <div className="sc-impact-label">
              {impactPos ? 'السيناريو يُحسّن الطاقة' : 'السيناريو يزيد الضغط'}
            </div>
            <div className="sc-impact-sub">
              عرض {netSup > 0 ? '+' : ''}{netSup}% · طلب {netDem > 0 ? '+' : ''}{netDem}%
            </div>
          </div>
          <div className={`sc-impact-delta${impactPos ? ' pos' : ' neg'}`}>
            {impactPos ? '+' : ''}{netImpact}%
          </div>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* ══ SUPPLY SECTION ══ */}
      <div className="sidebar-section">
        <div className="sc-section-header">
          <div className="sc-section-pill supply">
            <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#00BC7D" /></svg>
            الطاقة الاستيعابية
          </div>
        </div>
        <div className="sliders-list">
          {SUPPLY_ITEMS.map(({ k, l, icon, hint }) => (
            <div key={k} className="sc-slider-wrap">
              <Slider label={l} icon={icon} value={sc[k] ?? 0} onChange={v => setSci(k, v)} color={T.greenXL} />
              {(sc[k] ?? 0) === 0 && hint && (
                <div className="sc-slider-hint">{hint}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* ══ DEMAND SECTION ══ */}
      <div className="sidebar-section">
        <div className="sc-section-header">
          <div className="sc-section-pill demand">
            <svg width="7" height="7" viewBox="0 0 8 8"><rect x=".5" y=".5" width="7" height="7" rx="1.5" fill="#F87171" /></svg>
            المستهدفات
          </div>
          {demAvg !== null && (
            <span className="sc-avg-badge demand-badge">متوسط {demAvg > 0 ? '+' : ''}{demAvg}%</span>
          )}
        </div>
        <div className="sliders-list">
          {DEMAND_ITEMS.map(({ k, l, icon, hint }) => (
            <div key={k} className="sc-slider-wrap">
              <Slider label={l} icon={icon} value={sc[k] ?? 0} onChange={v => setSci(k, v)} color={T.dem} />
              {(sc[k] ?? 0) === 0 && hint && (
                <div className="sc-slider-hint">{hint}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══ ACTIVE CHANGES ══ */}
      {hasAnyChange && (
        <div className="active-changes-panel">
          <div className="active-changes-title">
            <span className="pulse-dot" />
            التعديلات النشطة
            <span style={{ marginRight: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>{activeCount} متغيّر</span>
          </div>
          <div className="sc-changes-table">
            {ALL_ITEMS.filter(i => (sc[i.k] ?? 0) !== 0).map(i => {
              const val = sc[i.k] ?? 0
              const isPos = val > 0
              const color = i.cat === 'supply' ? (isPos ? T.greenXL : T.dem) : (isPos ? T.dem : T.sup)
              return (
                <div key={i.k} className="sc-change-row">
                  <span className="sc-change-cat" style={{
                    background: i.cat === 'supply' ? 'rgba(0,188,125,0.12)' : 'rgba(248,113,113,0.1)',
                    color: i.cat === 'supply' ? T.greenXL : T.dem,
                  }}>{i.cat === 'supply' ? 'عرض' : 'طلب'}</span>
                  <span className="sc-change-icon">{i.icon}</span>
                  <span className="sc-change-label">{i.l}</span>
                  <span className="sc-change-val" style={{ color }}>{isPos ? '+' : ''}{val}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ RESET BUTTON — directly after content, no flex spacer ══ */}
      <div className="sc-reset-area">
        <button
          className={`reset-btn${hasAnyChange ? ' active' : ''}`}
          onClick={() => ALL_KEYS.forEach(k => setSci(k, 0))}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 1 0 1.5-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          إعادة الضبط
          {hasAnyChange && <span className="reset-count">{activeCount}</span>}
        </button>
      </div>
    </div>
  )
}


/* ════════════════════════════════════════════════════════════════
   DETAILS MODAL
════════════════════════════════════════════════════════════════ */
function DetailsModal({ yr, tableRows, onClose, onExport }) {
  const [search, setSearch] = useState('')
  const filtered = search ? tableRows.filter(r => r.dateLabel.includes(search) || r.monthLabel.includes(search)) : tableRows
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '94%', maxWidth: 920, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 16, background: '#1E1C1D', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 90px rgba(0,0,0,0.75)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(150,113,38,0.1)', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: T.bronzeXL }}>📋 التفاصيل اليومية — {yr}</span>
            <span style={{ fontSize: 11, color: T.txtSub }}>({fmtFull(filtered.length)} يوم)</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالشهر..."
              style={{ padding: '6px 13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, direction: 'rtl', width: 155, background: 'rgba(255,255,255,0.06)', color: T.txt }} />
            <button onClick={onExport} style={{ background: `linear-gradient(135deg,${T.green},${T.greenL})`, color: 'white', padding: '7px 16px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>⬇️ CSV</button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: 8, fontSize: 15, color: T.txtSub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: `linear-gradient(135deg,${T.sideHdr},${T.sideBg})` }}>
                {['#', 'التاريخ', 'المستهدفات', 'الطاقة الاستيعابية', 'الفجوة', 'الحالة', '🌙', '🕋'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!filtered.length
                ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.txtDim }}>لا توجد نتائج</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.dateKey} style={{ background: r.gap > 0 ? T.demBg : r.isRamadan ? T.ramBg : r.isHajj ? T.hajjBg : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '7px 14px', color: T.txtDim, fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: '7px 14px', fontWeight: 600, color: T.txt }}>{r.dateLabel}</td>
                    <td style={{ padding: '7px 14px', fontWeight: 700, color: T.dem }}>{fmtFull(r.demand)}</td>
                    <td style={{ padding: '7px 14px', fontWeight: 700, color: T.sup }}>{fmtFull(r.supply)}</td>
                    <td style={{ padding: '7px 14px', fontWeight: 800, color: r.gap > 0 ? T.dem : T.sup }}>{fmtFull(r.gap)}</td>
                    <td style={{ padding: '7px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: r.gap > 0 ? T.demBg : T.supBg, color: r.gap > 0 ? T.dem : T.sup, border: `1px solid ${r.gap > 0 ? T.demL : T.supL}` }}>
                        {r.gap > 0 ? '⚠ عجز' : '✓ فائض'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 14px', textAlign: 'center' }}>{r.isRamadan ? '🌙' : ''}</td>
                    <td style={{ padding: '7px 14px', textAlign: 'center' }}>{r.isHajj ? '🕋' : ''}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   METHODOLOGY MODAL HELPERS
════════════════════════════════════════════════════════════════ */
const MethodSection = ({ icon, title, accent, children }) => (
  <div style={{ paddingBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, borderRadius: 3, background: accent, flexShrink: 0 }} />
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 900, color: T.txt, fontSize: 13.5 }}>{title}</span>
    </div>
    {children}
  </div>
)

const MethodFormula = ({ children }) => (
  <div style={{ fontFamily: 'monospace', fontSize: 12, color: T.bronzeXL, background: 'rgba(150,113,38,0.1)', border: '1px solid rgba(150,113,38,0.22)', borderRadius: 8, padding: '9px 14px', marginBottom: 10, lineHeight: 1.6, direction: 'ltr', textAlign: 'left' }}>
    {children}
  </div>
)

const MethodTable = ({ rows }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
    {rows.map(([term, formula, note]) => (
      <div key={term} style={{ display: 'grid', gridTemplateColumns: '1.6fr 2fr 1.5fr', gap: 8, background: 'rgba(255,255,255,0.025)', borderRadius: 7, padding: '7px 12px', fontSize: 11, alignItems: 'start' }}>
        <span style={{ fontWeight: 800, color: T.txt }}>{term}</span>
        <span style={{ fontFamily: 'monospace', color: T.txtSub, direction: 'ltr', textAlign: 'left' }}>{formula}</span>
        <span style={{ color: T.txtDim, fontSize: 10.5 }}>{note}</span>
      </div>
    ))}
  </div>
)

const MethodNote = ({ children }) => (
  <div style={{ fontSize: 11, color: T.txtDim, marginTop: 8, paddingRight: 4, lineHeight: 1.7 }}>💡 {children}</div>
)

const MethodDivider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0 18px' }} />
)

/* ════════════════════════════════════════════════════════════════
   PAGE HEADER
════════════════════════════════════════════════════════════════ */
function PageHeader({
  yrs, years, yr, isAllYrs, toggleYr, selectAllYrs,
  demTypes, toggleDemType, supTypes, toggleSupType,
  showSc, setShowSc, hasAnyScChange, activeScCount,
  onExport, onDetails, onMethodology, peakDemand, kpi, series,
}) {
  const [showMethodology, setShowMethodology] = useState(false)

  // Derive active season label
  const activeSeason = (() => {
    if (!series?.length) return null
    const activeRam = series.some(r => r.isRamadan)
    const activeHajj = series.some(r => r.isHajj)
    if (activeRam && activeHajj) return { label: 'رمضان + حج', color: T.ram, icon: '🌙🕋' }
    if (activeRam) return { label: 'رمضان', color: T.ram, icon: '🌙' }
    if (activeHajj) return { label: 'الحج', color: T.hajj, icon: '🕋' }
    return { label: 'كل الأشهر', color: T.bronzeXL, icon: '📅' }
  })()

  // Data health: any deficit days?
  const deficitPct = kpi ? Math.round(kpi.defPct) : null
  const dataStatus = {
    label: 'آخر تحديث: يناير 2026',
    icon: '⏱',
    color: T.txtDim,
  }

  return (
    <>
      {/* ── Hero band ── */}
      <div className="page-header-hero">
        {/* Multi-layer decorative glows */}
        <div className="page-header-bg-image" />
        <div className="page-header-inner">

          {/* ── Row 1: Title + Actions ── */}
          <div className="page-header-top">
            {/* Title block */}
            <div className="page-header-title-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="page-header-h1">إيواء مكة المكرمة</h1>
              </div>
              <p className="page-header-subtitle">
                تحليل الطاقة الاستيعابية لمنشآت الإيواء في مكة المكرمة
              </p>
            </div>
          </div>

          {/* ── Row 2: Context chips ── */}
          <div className="page-header-chips">
            {/* Scope */}
            <div className="ph-chip">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke={T.bronzeXL} strokeWidth="1.3" />
                <path d="M6 3v3l2 1" stroke={T.bronzeXL} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="ph-chip-label">النطاق</span>
              <span className="ph-chip-value" style={{ color: T.bronzeXL }}>مكة المكرمة</span>
            </div>

            {/* Selected years */}
            <div className="ph-chip">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="2.5" width="9" height="8" rx="1.5" stroke={T.bronzeXL} strokeWidth="1.2" />
                <path d="M4 1.5v2M8 1.5v2M1.5 5.5h9" stroke={T.bronzeXL} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="ph-chip-label">السنة</span>
              <span className="ph-chip-value" style={{ color: T.bronzeXL }}>
                {isAllYrs ? 'كل السنوات' : [...yrs].sort().join('، ')}
              </span>
            </div>

            {/* Data status */}
            <div className="ph-chip ph-chip-status">
              <span style={{ fontSize: 10 }}>{dataStatus.icon}</span>
              <span className="ph-chip-value" style={{ color: T.txtDim, fontWeight: 500 }}>{dataStatus.label}</span>
            </div>

            {/* Scenario indicator — only when active */}
            {hasAnyScChange && (
              <button className="ph-chip ph-chip-scenario" onClick={() => setShowSc(v => !v)}>
                <span className="pulse-dot" style={{ width: 6, height: 6, flexShrink: 0 }} />
                <span className="ph-chip-value" style={{ color: T.warn }}>{activeScCount}</span>
                <span className="ph-chip-label">سيناريو نشط</span>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="page-header-actions">
            <button className="ph-btn ph-btn-ghost" onClick={() => setShowMethodology(true)}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              منهجية الحسابات
            </button>
            <button className="ph-btn ph-btn-primary" onClick={onExport}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M4 8l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              تصدير PDF
            </button>
            {peakDemand && (
              <button className="ph-btn ph-btn-ghost" onClick={onDetails}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                التفاصيل اليومية
              </button>
            )}
          </div>

          {/* ── Row 3: Filters ── */}
          <div className="page-header-filters">
            {/* Year chips */}
            <div className="ph-filter-group">
              <span className="ph-filter-label">السنوات</span>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={selectAllYrs} className={`ph-year-chip${isAllYrs ? ' active' : ''}`}>
                  الكل
                </button>
                {(years.length ? years : YEARS).map(y => (
                  <button key={y} onClick={() => toggleYr(y)} className={`ph-year-chip${yrs.has(y) ? ' active' : ''}`}>
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Demand type */}
            <div className="ph-filter-group">
              <span className="ph-filter-label" style={{ color: `${T.dem}99` }}>المستهدفات</span>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[{ id: 'outside', l: 'من الخارج' }, { id: 'inside', l: 'من الداخل' }].map(o => (
                  <Seg key={o.id} active={demTypes.has(o.id)} onClick={() => toggleDemType(o.id)} color={T.dem}>{o.l}</Seg>
                ))}
              </div>
            </div>

            {/* Supply type */}
            <div className="ph-filter-group">
              <span className="ph-filter-label" style={{ color: `${T.sup}99` }}>الطاقة الاستيعابية</span>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[{ id: 'licensed', l: 'مرافق مرخصة' }, { id: 'future', l: 'مستقبلية' }, { id: 'hajj', l: 'مساكن الحجاج' }].map(o => (
                  <Seg key={o.id} active={supTypes.has(o.id)} onClick={() => toggleSupType(o.id)} color={T.sup}>{o.l}</Seg>
                ))}
              </div>
            </div>

            {/* Scenario toggle pushed to end */}
            <div style={{ marginRight: 'auto' }}>
              <button
                className={`sc-toggle-btn${hasAnyScChange ? ' has-changes' : ''}${showSc ? ' active' : ''}`}
                onClick={() => setShowSc(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                السيناريوهات
                {hasAnyScChange && <span className="sc-toggle-badge">{activeScCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Methodology modal ── */}
      {showMethodology && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && setShowMethodology(false)}>
          <div style={{ width: '94%', maxWidth: 760, background: '#1E1C1D', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'rgba(150,113,38,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 900, color: T.bronzeXL }}>ℹ️ منهجية الحسابات</span>
                <span style={{ fontSize: 11, color: T.txtDim, marginRight: 10 }}>جميع المعادلات المطبّقة فعلياً في النظام</span>
              </div>
              <button onClick={() => setShowMethodology(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: 8, color: T.txtSub, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, fontSize: 13, lineHeight: 1.85, color: T.txtSub }}>

              {/* ── Section 1: Supply ── */}
              <MethodSection icon="🏨" title="الطاقة الاستيعابية اليومية" accent={T.sup}>
                <MethodFormula>الطاقة = المرافق المرخّصة + المشاريع المستقبلية + مساكن الحجاج</MethodFormula>
                <MethodTable rows={[
                  ['المرافق المرخّصة (sl)', 'القيمة الأساسية من البيانات', '637,360 سرير/يوم'],
                  ['المشاريع المستقبلية (sf)', 'تُضاف كمكوّن مستقل', '30,263 سرير مخطط'],
                  ['مساكن الحجاج (sh)', 'تُفعَّل في موسم الحج فقط', '~1.7م سرير/يوم'],
                  ['نسبة الأسرّة/الغرفة (br)', 'يُضرب مع المرافق المرخّصة فقط (تأثير مركّب)', 'غير حج: 3.1 · حج: 4.3'],
                ]} />
                <MethodNote>يمكن إخفاء أي مكوّن من الفلاتر فتُحذف قيمته من المجموع تلقائياً.</MethodNote>
              </MethodSection>

              <MethodDivider />

              {/* ── Section 2: Demand ── */}
              <MethodSection icon="🎯" title="المستهدفات (الطلب) اليومية" accent={T.dem}>
                <MethodFormula>الطلب = زوار من الخارج (do) + زوار من الداخل (di)</MethodFormula>
                <MethodTable rows={[
                  ['زوار الخارج (do)', 'أعداد الزوار الدوليين المتوقعين', '457,678 زائر/يوم (متوسط)'],
                  ['زوار الداخل (di)', 'أعداد الزوار المحليين المتوقعين', '61,269 زائر/يوم (متوسط)'],
                ]} />
                <MethodNote>يستند إلى خطط رؤية 2030 وبيانات هيئة الإحصاء والجهات المعنية. كلٌّ منهما قابل للإظهار/الإخفاء بشكل مستقل.</MethodNote>
              </MethodSection>

              <MethodDivider />

              {/* ── Section 3: Gap ── */}
              <MethodSection icon="📊" title="الفجوة اليومية" accent={T.bronzeXL}>
                <MethodFormula>الفجوة = الطلب − الطاقة</MethodFormula>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                  {[
                    { cond: 'فجوة > 0', meaning: 'عجز — الطلب يتجاوز الطاقة', color: T.dem },
                    { cond: 'فجوة < 0', meaning: 'فائض — الطاقة تتجاوز الطلب', color: T.sup },
                    { cond: 'فجوة = 0', meaning: 'توازن تام', color: T.txtDim },
                    { cond: 'عجز اليوم', meaning: 'max(0, الفجوة)', color: T.dem },
                  ].map(({ cond, meaning, color }) => (
                    <div key={cond} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: `1px solid ${color}25` }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'monospace', marginBottom: 2 }}>{cond}</div>
                      <div style={{ fontSize: 11, color: T.txtDim }}>{meaning}</div>
                    </div>
                  ))}
                </div>
              </MethodSection>

              <MethodDivider />

              {/* ── Section 4: Scenario ── */}
              <MethodSection icon="🎚️" title="تعديلات السيناريو" accent={T.bronzeL}>
                <MethodFormula>القيمة المعدّلة = القيمة الأصلية × (1 + نسبة_التعديل ÷ 100)</MethodFormula>
                <MethodNote>النطاق: من −50% إلى +100% لكل متغير.</MethodNote>
                <div style={{ marginTop: 10, background: 'rgba(150,113,38,0.07)', borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.bronzeL}22` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.bronzeXL, marginBottom: 4 }}>⚠ استثناء: نسبة الأسرّة/الغرفة (br)</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: T.txt, marginBottom: 4, background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6 }}>
                    asl = sl × (1 + sc.sl÷100) × (1 + sc.br÷100)
                  </div>
                  <div style={{ fontSize: 11, color: T.txtDim }}>يُضرب br فوق تعديل sl مما يُحدث أثراً مركّباً — تعديل كلاهما بنفس الوقت يُضاعف الأثر.</div>
                </div>
                <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.txt, marginBottom: 4 }}>صافي أثر السيناريو</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: T.bronzeXL, background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6 }}>
                    صافي الأثر = Σ(تعديلات الطاقة) − Σ(تعديلات الطلب)
                  </div>
                  <div style={{ fontSize: 11, color: T.txtDim, marginTop: 4 }}>قيمة موجبة = الطاقة تتحسّن نسبياً، سالبة = الضغط يزداد.</div>
                </div>
              </MethodSection>

              <MethodDivider />

              {/* ── Section 5: KPIs ── */}
              <MethodSection icon="📐" title="مؤشرات الأداء الرئيسية (KPIs)" accent={T.bronzeXL}>
                <MethodTable rows={[
                  ['متوسط الطلب اليومي (avgD)', 'Σ الطلب ÷ عدد الأيام ذات البيانات', '—'],
                  ['متوسط الطاقة اليومية (avgS)', 'Σ الطاقة ÷ عدد الأيام ذات البيانات', '—'],
                  ['متوسط الفجوة اليومية (avgG)', 'Σ (الطلب − الطاقة) ÷ عدد الأيام', 'موجب = عجز · سالب = فائض'],
                  ['أيام العجز (defD)', 'عدد الأيام التي كانت فيها الفجوة > 0', '—'],
                  ['نسبة أيام العجز (defPct)', '(defD ÷ إجمالي الأيام) × 100', '—'],
                  ['نسبة الإشغال المتوسطة', 'round(avgD ÷ avgS × 100)', '<80% كافي · 80-99% ضغط · ≥100% عجز'],
                  ['ذروة الإشغال', 'max(demand_i ÷ supply_i) × 100 لكل يوم i', 'يُعرض مع تاريخه'],
                  ['الأيام الحرجة', 'الأيام التي فيها: الطلب ≥ 90% من الطاقة', '—'],
                  ['نسبة تغطية الطاقة للطلب', 'round(avgS ÷ avgD × 100)', '≥100% = الطاقة كافية'],
                ]} />
              </MethodSection>

              <MethodDivider />

              {/* ── Section 6: Future projects ── */}
              <MethodSection icon="🏗️" title="مساهمة المشاريع المستقبلية" accent={T.sup}>
                <MethodNote>تقيس كم يوم عجز كانت ستُحلّ لو أُضيفت المشاريع المستقبلية.</MethodNote>
                <MethodTable rows={[
                  ['defWithout', 'أيام العجز بدون المشاريع المستقبلية', '—'],
                  ['defWith', 'أيام العجز مع المشاريع المستقبلية', '—'],
                  ['resolved', 'max(0, defWithout − defWith)', 'عدد الأيام التي حلّتها المشاريع'],
                  ['نسبة المساهمة', 'round(resolved ÷ defWithout × 100)', '%'],
                ]} />
              </MethodSection>

              <MethodDivider />

              {/* ── Section 7: Ramadan/Hajj ── */}
              <MethodSection icon="🌙" title="تحليل مواسم رمضان والحج" accent={T.ram}>
                <MethodTable rows={[
                  ['نسبة أيام العجز في الموسم', '(أيام عجز الموسم ÷ إجمالي أيام الموسم) × 100', '—'],
                  ['متوسط العجز في الموسم', 'Σ max(0, gap) لأيام الموسم ÷ عدد الأيام', 'يحسب العجز فقط، لا يُدرج الفائض'],
                ]} />
                <div style={{ marginTop: 10, background: 'rgba(167,139,250,0.07)', borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.ram}22` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.ram, marginBottom: 3 }}>🌙 حالة 2030 الاستثنائية</div>
                  <div style={{ fontSize: 11, color: T.txtDim }}>قد يقع رمضان مرتين (يناير وديسمبر). يُحسب كل موسم بشكل مستقل بحسب نطاق التاريخ الهجري الفعلي لكل فترة، ويُعرض منفصلاً في التحليل.</div>
                </div>
              </MethodSection>

              <MethodDivider />

              {/* ── Section 8: Mini charts ── */}
              <MethodSection icon="📈" title="الرسوم البيانية الصغيرة" accent={T.bronzeL}>
                <MethodTable rows={[
                  ['مخطط الدونات (عجز/فائض)', 'defPct = round(defDays ÷ (defDays + surDays) × 100)', 'فقط الأيام ذات طلب وطاقة معاً'],
                  ['المخطط الشهري', 'متوسط الفجوة = Σ فجوات الشهر ÷ عدد أيامه', 'موجب = عجز · سالب = فائض'],
                  ['نسبة العجز الموسمي', '(أيام عجز الموسم ÷ إجمالي أيام الموسم) × 100', 'رمضان / حج / باقي الأيام'],
                ]} />
              </MethodSection>

              <MethodDivider />

              {/* ── Section 9: Data note ── */}
              <div style={{ background: 'rgba(251,191,36,0.06)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.warn}28`, display: 'flex', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 800, color: T.warn, marginBottom: 4, fontSize: 13 }}>محدودية البيانات</div>
                  <div style={{ fontSize: 12, color: T.txtDim, lineHeight: 1.7 }}>
                    جميع القيم مُستخرجة من ملف <span style={{ fontFamily: 'monospace', color: T.bronzeXL, fontSize: 11 }}>housing.xlsx</span> الذي يحتوي على ورقتي Supply وDemand مرتبطتين بتاريخ يومي.
                    التحليل يغطي الفترة 2026–2030 ومبنيّ على مدخلات تقديرية وافتراضات مستقبلية.
                    لا يُعدّ هذا النظام مرجعاً رسمياً نهائياً.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════════ */
function Dashboard({ db }) {
  const { rows, warns, years } = db
  const navigate = useNavigate()

  const [yrs, setYrs] = useState(() => new Set(years.length ? years : YEARS))
  const yr = yrs.size === 1 ? [...yrs][0] : null  // null = multi-year mode

  const toggleYr = y => setYrs(prev => {
    const next = new Set(prev)
    if (next.has(y) && next.size > 1) next.delete(y)
    else next.add(y)
    return next
  })
  const selectAllYrs = () => setYrs(new Set(years.length ? years : YEARS))
  const isAllYrs = (years.length ? years : YEARS).every(y => yrs.has(y))
  const [demTypes, setDemTypes] = useState(new Set(['outside', 'inside']))
  const toggleDemType = k => setDemTypes(prev => { const n = new Set(prev); n.has(k) ? (n.size > 1 && n.delete(k)) : n.add(k); return n })
  const [supTypes, setSupTypes] = useState(new Set(['licensed', 'future', 'hajj']))
  const toggleSupType = k => setSupTypes(prev => { const n = new Set(prev); n.has(k) ? (n.size > 1 && n.delete(k)) : n.add(k); return n })
  const [view, setView] = useState('lines')
  const [scope, setScope] = useState('all')
  const [showModal, setModal] = useState(false)
  const [sc, setSc] = useState({ sl: 0, sf: 0, sh: 0, do_: 0, di: 0, br: 0 })
  const setSci = (k, v) => setSc(s => ({ ...s, [k]: v }))

  /* Scenarios */
  const adjusted = useMemo(() => rows.map(r => {
    const apply = scope === 'all' || yrs.has(r.yr)
    const a = (v, k) => v != null ? Math.round(v * (1 + (apply ? sc[k] : 0) / 100)) : null
    // br (beds/room ratio) compounds with sl — both affect licensed bed count
    const brFactor = apply ? (1 + sc.br / 100) : 1
    return {
      ...r,
      asl: r.sl != null ? Math.round(r.sl * (1 + (apply ? sc.sl : 0) / 100)) : null,
      asf: a(r.sf, 'sf'), ash: a(r.sh, 'sh'), ado: a(r.do_, 'do_'), adi: a(r.di, 'di'),
    }
  }), [rows, sc, scope, yr])

  const yrRows = useMemo(() => adjusted.filter(r => yrs.has(r.yr)), [adjusted, yrs])

  /* Series */
  const series = useMemo(() => yrRows.map(r => {
    const dem = (demTypes.has('outside') ? (r.ado ?? 0) : 0) + (demTypes.has('inside') ? (r.adi ?? 0) : 0)
    const sup = (supTypes.has('licensed') ? (r.asl ?? 0) : 0) + (supTypes.has('future') ? (r.asf ?? 0) : 0) + (supTypes.has('hajj') ? (r.ash ?? 0) : 0)
    const gap = dem - sup
    return {
      dateKey: r.key, date: r.date,
      dateLabel: `${r.day} ${AR_MON[r.mo]} ${r.yr}`, monthLabel: AR_MON[r.mo],
      demand: dem || null, supply: sup || null, gap,
      deficit: gap > 0 ? gap : 0, surplus: gap < 0 ? -gap : 0,
      isRamadan: r.isRamadan, isHajj: r.isHajj,
    }
  }).filter(r => r.demand || r.supply), [yrRows, demTypes, supTypes])

  /* Peak demand (always do_+di) */
  const peakDemand = useMemo(() => {
    const v = yrRows.filter(r => r.ado != null || r.adi != null)
    if (!v.length) return null
    const best = v.reduce((m, r) => { const t = (r.ado ?? 0) + (r.adi ?? 0); return t > m.total ? { total: t, r } : m }, { total: -Infinity, r: null })
    if (!best.r) return null
    return { value: best.total, dateLabel: `${best.r.day} ${AR_MON[best.r.mo]} ${best.r.yr}`, isRamadan: best.r.isRamadan, isHajj: best.r.isHajj }
  }, [yrRows])

  /* Peak supply (adjusted asl+asf+ash) */
  const peakSupply = useMemo(() => {
    const v = series.filter(r => r.supply != null)
    if (!v.length) return null
    const best = v.reduce((m, r) => r.supply > m.supply ? r : m, v[0])
    return { value: best.supply, dateLabel: best.dateLabel, isRamadan: best.isRamadan, isHajj: best.isHajj }
  }, [series])

  /* KPIs */
  const kpi = useMemo(() => {
    const v = series.filter(r => r.demand && r.supply); if (!v.length) return null
    const avgD = v.reduce((s, r) => s + r.demand, 0) / v.length
    const avgS = v.reduce((s, r) => s + r.supply, 0) / v.length
    const defD = v.filter(r => r.gap > 0).length
    const criticalDays = v.filter(r => r.demand >= 0.9 * r.supply).length
    const criticalPct = Math.round(criticalDays / v.length * 100)
    const peakOccRow = v.reduce((m, r) => (r.demand / r.supply) > (m.demand / m.supply) ? r : m, v[0])
    const peakOccPct = Math.round(peakOccRow.demand / peakOccRow.supply * 100)
    const occupancyPct = avgS > 0 ? Math.round(avgD / avgS * 100) : 0
    return {
      avgD, avgS, avgG: v.reduce((s, r) => s + r.gap, 0) / v.length,
      defD, defPct: defD / v.length * 100, total: v.length,
      maxDef: v.reduce((m, r) => r.gap > m.gap ? r : m, v[0]),
      maxSur: v.reduce((m, r) => r.gap < m.gap ? r : m, v[0]),
      criticalDays, criticalPct, occupancyPct,
      peakOccPct, peakOccLabel: peakOccRow.dateLabel,
    }
  }, [series])

  /* Future-projects contribution — how many deficit days sf would close */
  const sfContrib = useMemo(() => {
    const rows = yrRows.map(r => {
      const dem = (demTypes.has('outside') ? (r.ado ?? 0) : 0) + (demTypes.has('inside') ? (r.adi ?? 0) : 0)
      const supBase = (supTypes.has('licensed') ? (r.asl ?? 0) : 0) + (supTypes.has('hajj') ? (r.ash ?? 0) : 0)
      const supFull = supBase + (r.asf ?? 0)
      return { dem, supBase, supFull }
    }).filter(r => r.dem > 0)
    if (!rows.length) return null
    const defWithout = rows.filter(r => r.dem > r.supBase).length
    const defWith = rows.filter(r => r.dem > r.supFull).length
    const resolved = Math.max(0, defWithout - defWith)
    return {
      resolved,
      pct: defWithout > 0 ? Math.round(resolved / defWithout * 100) : 0,
      defWithout,
      hasFuture: rows.some(r => r.supFull > r.supBase),
    }
  }, [yrRows, demTypes, supTypes])


  /* Ramadan — enriched with per-period breakdown for dual-Ramadan (2030) */
  const ram = useMemo(() => {
    const periods = [...yrs].sort().flatMap(y =>
      getRamadanPeriods(y).map(p => ({ ...p, yr: y }))
    )

    const r = series.filter(x => x.isRamadan && (x.demand != null || x.supply != null))
    const o = series.filter(x => !x.isRamadan && (x.demand != null || x.supply != null))
    const dp = a => a.length ? a.filter(x => x.gap > 0).length / a.length * 100 : 0
    const ad = a => a.length ? a.reduce((s, x) => s + Math.max(0, x.gap), 0) / a.length : 0
    const mx = a => a.length ? a.reduce((m, x) => x.gap > m.gap ? x : m, a[0]) : null
    // Per-period stats — days are matched by date range so they work even if series
    // only covers part of a period (e.g. 2030 Dec Ramadan ends in 2031)
    const perPeriod = periods.map((p, i) => {
      const days = series.filter(x => x.date >= p.s && x.date <= p.e && (x.demand != null || x.supply != null))
      return {
        idx: i + 1,
        label: yrs.size > 1
          ? `رمضان ${p.yr}${periods.filter(x => x.yr === p.yr).length > 1 ? ' ' + (RAM_ORDINAL[i] || '') : ''}`
          : (periods.length > 1 ? `رمضان ${RAM_ORDINAL[i] || '#' + (i + 1)}` : `رمضان ${p.yr}`),
        dateRange: `${fmtDate(p.s)} — ${fmtDate(p.e)}`,
        days: days.length,
        pct: dp(days),
        avg: ad(days),
        max: mx(days),
      }
    })
    return {
      rDays: r.length, rPct: dp(r), rAvg: ad(r), rMax: mx(r),
      oPct: dp(o), oAvg: ad(o),
      perPeriod,
      isDual: periods.length > 1,
    }
  }, [series, yr, yrs])

  /* Mini chart data */
  const mini = useMemo(() => {
    // Donut
    const defDays = series.filter(r => r.demand && r.supply && r.gap > 0).length
    const surDays = series.filter(r => r.demand && r.supply && r.gap <= 0).length
    const tot = defDays + surDays
    const donut = [{ name: 'عجز', value: defDays, color: T.dem }, { name: 'فائض', value: surDays, color: T.sup }]
    const defPct = tot ? Math.round(defDays / tot * 100) : 0

    // Monthly bar
    const byMo = {}
    series.forEach(r => {
      if (!r.demand || !r.supply) return
      const m = r.date.getMonth()
      if (!byMo[m]) byMo[m] = { sum: 0, n: 0, name: AR_MON[m], m, isRam: false, isHajj: false }
      byMo[m].sum += r.gap; byMo[m].n++
      if (r.isRamadan) byMo[m].isRam = true
      if (r.isHajj) byMo[m].isHajj = true
    })
    const monthly = Object.values(byMo).sort((a, b) => a.m - b.m).map(v => ({ name: v.name, gap: Math.round(v.sum / v.n), isRam: v.isRam, isHajj: v.isHajj }))

    // Seasonal
    const seasons = [
      { name: 'رمضان', filter: r => r.isRamadan, color: T.ram },
      { name: 'حج', filter: r => r.isHajj, color: T.hajj },
      { name: 'باقي', filter: r => !r.isRamadan && !r.isHajj, color: T.bronzeL },
    ]
    const seasonal = seasons.map(s => {
      const rows = series.filter(r => s.filter(r) && r.demand && r.supply)
      return { name: s.name, defPct: rows.length ? Math.round(rows.filter(r => r.gap > 0).length / rows.length * 100) : 0, color: s.color, days: rows.length }
    })

    // Demand split: average daily outside vs inside
    const splitRawRows = yrRows.filter(r => r.ado != null || r.adi != null)
    const split = splitRawRows

    return { donut, defPct, monthly, seasonal, split }
    // (split is now raw rows array, not [avgOut, avgIn])
  }, [series])

  /* Ref areas */
  const refB = useCallback(dates => {
    if (!dates || !series.length) return null
    const s = series.find(d => d.date >= dates.s), e = [...series].reverse().find(d => d.date <= dates.e)
    return s && e ? { x1: s.dateKey, x2: e.dateKey } : null
  }, [series])
  const ramRefs = useMemo(() => yr ? getRamadanPeriods(yr).map(p => refB(p)).filter(Boolean) : [], [yr, series])
  const hajjRef = useMemo(() => yr ? refB(HAJJ[yr]) : null, [yr, series])

  const xTick = k => { const d = series.find(x => x.dateKey === k); return d?.date.getDate() === 1 ? AR_MON[d.date.getMonth()].slice(0, 3) : '' }
  const xInt = Math.max(0, Math.floor(series.length / 13) - 1)

  const exportCSV = () => {
    const r = [['التاريخ', 'المستهدفات', 'الطاقة الاستيعابية', 'الفجوة', 'الحالة', 'رمضان', 'حج'],
    ...series.map(r => [r.dateKey, r.demand ?? '', r.supply ?? '', r.gap, r.gap > 0 ? 'عجز' : 'فائض', r.isRamadan ? 'نعم' : 'لا', r.isHajj ? 'نعم' : 'لا'])]
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob(['\uFEFF' + r.map(x => x.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })),
      download: `إيواء_مكة_${yr ?? [...yrs].sort().join('-')}.csv`
    }).click()
  }

  /* Shared chart config */
  const ChartDefs = () => (
    <defs>
      <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.dem} stopOpacity={.28} />
        <stop offset="70%" stopColor={T.dem} stopOpacity={.06} />
        <stop offset="100%" stopColor={T.dem} stopOpacity={0} />
      </linearGradient>
      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.sup} stopOpacity={.22} />
        <stop offset="70%" stopColor={T.sup} stopOpacity={.05} />
        <stop offset="100%" stopColor={T.sup} stopOpacity={0} />
      </linearGradient>
      <filter id="glow-dem"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      <filter id="glow-sup"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
  )
  const Shading = () => (<>
    {ramRefs.map((ref, i) => (
      <ReferenceArea key={i} x1={ref.x1} x2={ref.x2}
        fill={T.ram} fillOpacity={.09}
        stroke={T.ram} strokeOpacity={.28} strokeDasharray="4 3"
        label={{ value: '🌙', position: i === 0 ? 'insideTopRight' : 'insideTopLeft', fill: T.ram, fontSize: 13 }} />
    ))}
    {hajjRef && <ReferenceArea x1={hajjRef.x1} x2={hajjRef.x2} fill={T.hajj} fillOpacity={.08} stroke={T.hajj} strokeOpacity={.28} strokeDasharray="4 3" label={{ value: '🕋', position: 'insideTopRight', fill: T.hajj, fontSize: 13 }} />}
  </>)
  const axisX = { dataKey: "dateKey", tickFormatter: xTick, tick: { fontFamily: "Cairo,sans-serif", fontSize: 10, fill: T.txtDim }, interval: xInt, axisLine: { stroke: 'rgba(255,255,255,0.07)' }, tickLine: false, reversed: true }
  const axisY = { tickFormatter: fmtK, tick: { fontFamily: "Cairo,sans-serif", fontSize: 10, fill: T.txtDim }, width: 46, axisLine: false, tickLine: false }
  const grid = { strokeDasharray: "3 6", stroke: 'rgba(255,255,255,0.05)', vertical: false }
  const legFmt = { formatter: v => ({ demand: 'المستهدفات', supply: 'الطاقة الاستيعابية', deficit: 'عجز', surplus: 'فائض' }[v] || v), wrapperStyle: { fontFamily: "Cairo,sans-serif", fontSize: 11, paddingTop: 8, color: T.txtSub } }

  const [showExport, setShowExport] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showSc, setShowSc] = useState(false)
  const hasAnyScChange = Object.values(sc).some(v => v !== 0)
  const activeScCount = Object.values(sc).filter(v => v !== 0).length

  useEffect(() => {
    injectNavStyles()
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])


  /* ══════════════════════════════════════ RENDER ══════════════════════════════════════ */
  return (
    <div className="cl-root" style={{ fontFamily: "'BahijTheSansArabic','Cairo',sans-serif", direction: 'rtl', background: '#151515', minHeight: '100vh', color: '#F4F1EB' }}>

      {/* ── NAVBAR ── */}
      <Navbar scrolled={scrolled} navigate={navigate} />

      {/* ── CONTENT (padded below fixed navbar) ── */}
      <div style={{ paddingTop: 80 }}>

        {/* ── PAGE HEADER ── */}
        <PageHeader
          yrs={yrs} years={years} yr={yr}
          isAllYrs={isAllYrs} toggleYr={toggleYr} selectAllYrs={selectAllYrs}
          demTypes={demTypes} toggleDemType={toggleDemType}
          supTypes={supTypes} toggleSupType={toggleSupType}
          showSc={showSc} setShowSc={setShowSc}
          hasAnyScChange={hasAnyScChange} activeScCount={activeScCount}
          onExport={() => setShowExport(true)}
          onDetails={() => setModal(true)}
          peakDemand={peakDemand} kpi={kpi} series={series}
        />

        {/* ── BODY — sidebar + content side by side ── */}
        <div className={`main-layout${showSc ? ' sc-open' : ''}`}>

          {/* Scenario sidebar — inline, shifts content */}
          <div className={`scenario-panel${showSc ? ' open' : ''}`}>
            <ScenarioSidebar sc={sc} setSci={setSci} onClose={() => setShowSc(false)} />
          </div>

          <div className="content-area">

            {warns.map((w, i) => (
              <div key={i} className="span-full" style={{ background: T.warnBg, border: `1px solid ${T.warnBdr}`, borderRadius: 10, padding: '9px 14px', color: T.warn, fontSize: 12 }}>{w}</div>
            ))}

            {/* ════════════════════════════════════════
               ROW 1 — TOP 3 KPI CARDS
            ════════════════════════════════════════ */}
            <div className="span-full">
              {kpi ? (
                <div className="kpi-top-grid">

                  {/* 1. أعلى عجز */}
                  {(() => {
                    const gap = Number(kpi?.maxDef?.gap ?? 0)
                    const hasDef = gap > 0
                    const color = hasDef ? T.dem : T.sup
                    return (
                      <div className="card fade-up"
                        style={{ padding: '14px 16px', borderTop: `2px solid ${color}`, borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: T.txtSub, lineHeight: 1.45 }}>أعلى عجز</div>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -.5, lineHeight: 1 }}>
                          {hasDef ? fmtFull(gap) : '0'}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>
                          {hasDef ? `${kpi?.maxDef?.dateLabel ?? '—'} · سرير/يوم` : 'لا يوجد عجز'}
                        </div>
                      </div>
                    )
                  })()}

                  {/* 2. أعلى طاقة استيعابية */}
                  <div className="card fade-up"
                    style={{ padding: '14px 16px', borderTop: `2px solid ${T.sup}`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: T.txtSub, lineHeight: 1.45 }}>أعلى طاقة استيعابية</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.sup, letterSpacing: -.5, lineHeight: 1 }}>
                      {fmtFull(peakSupply?.value)}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>{peakSupply?.dateLabel}</div>
                  </div>

                  {/* 3. أعلى حمل يومي — exact number */}
                  <div className="card fade-up"
                    style={{ padding: '14px 16px', borderTop: `2px solid ${T.bronzeXL}`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: T.txtSub, lineHeight: 1.45 }}>أعلى حمل يومي</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.bronzeXL, letterSpacing: -.5, lineHeight: 1 }}>
                      {peakDemand ? fmtFull(peakDemand.value) : '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>{peakDemand?.dateLabel}</div>
                  </div>

                </div>
              ) : (
                <div style={{ background: T.warnBg, borderRadius: 12, padding: 12, color: T.warn, fontSize: 12, border: `1px solid ${T.warnBdr}` }}>
                  ⚠️ لا تتوفر بيانات كافية
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════
               ROW 2 — MINI CHARTS: تركيبة الطلب / نسبة العجز الموسمي / مؤشر الفجوة الشهرية
            ════════════════════════════════════════ */}
            {series.length > 0 && (
              <div className="span-full mini-charts-row">
                <MonthlyBarChart monthly={mini.monthly} defPct={mini.defPct} />
                <DemandSplitChart split={mini.split} />
                <SeasonalRadialBar seasonal={mini.seasonal} />
              </div>
            )}

            {/* ════════════════════════════════════════
               ROW 3 — MAIN CHART FULL WIDTH
            ════════════════════════════════════════ */}
            <div className="span-full">
              <div className="card fade-up" style={{ padding: '18px 16px 14px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 4, background: `linear-gradient(to bottom,${T.dem},${T.sup})`, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.txt, letterSpacing: -.2 }}>الطلب مقابل الطاقة الاستيعابية</div>
                      <div style={{ fontSize: 13, color: T.txtDim, marginTop: -1 }}>
                        {yr ?? [...yrs].sort().join('، ')}
                      </div>
                    </div>
                  </div>
                </div>

                {series.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={340}>
                      {view === 'lines' ? (
                        <ComposedChart data={series} margin={{ top: 10, right: 12, left: 4, bottom: 6 }}>
                          <ChartDefs />
                          <CartesianGrid {...grid} />
                          <Shading />
                          <XAxis {...axisX} />
                          <YAxis {...axisY} />
                          <Tooltip content={<GapTooltip />} animationDuration={120} wrapperStyle={{ zIndex: 9999 }} />
                          <Line type="monotone" dataKey="demand" name="demand" stroke={T.dem} strokeWidth={2.8} dot={false} animationDuration={1600} animationEasing="ease-out"
                            activeDot={{ r: 7, fill: T.dem, stroke: '#1A1819', strokeWidth: 2.5, style: { filter: `drop-shadow(0 0 8px ${T.dem}80)` } }} />
                          <Line type="monotone" dataKey="supply" name="supply" stroke={T.sup} strokeWidth={2.5} dot={false} animationDuration={1400}
                            activeDot={{ r: 6, fill: T.sup, stroke: '#1A1819', strokeWidth: 2.5 }} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart data={series} margin={{ top: 10, right: 12, left: 4, bottom: 6 }}>
                          <CartesianGrid {...grid} />
                          <Shading />
                          <XAxis {...axisX} />
                          <YAxis {...axisY} />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" strokeWidth={1.5} />
                          <Tooltip content={<GapTooltip />} animationDuration={120} wrapperStyle={{ zIndex: 9999 }} />
                          <Legend {...legFmt} />
                          <Bar dataKey="deficit" name="deficit" fill={T.dem} fillOpacity={.82} radius={[3, 3, 0, 0]} maxBarSize={9} animationDuration={1200} animationEasing="ease-out" />
                          <Bar dataKey="surplus" name="surplus" fill={T.sup} fillOpacity={.85} radius={[4, 4, 0, 0]} maxBarSize={10} animationDuration={1200} animationEasing="ease-out" />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                    {/* Legend strip */}
                    <div style={{ display: 'flex', gap: 22, justifyContent: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                      {[{ c: T.dem, l: 'المستهدفات', w: 18 }, { c: T.sup, l: 'الطاقة الاستيعابية', w: 18 }, { c: T.ram, l: 'رمضان', w: 12, a: .6 }, { c: T.hajj, l: 'الحج', w: 12, a: .6 }].map(x => (
                        <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.txtSub }}>
                          <span style={{ width: x.w, height: 3, background: x.c, display: 'inline-block', borderRadius: 2, opacity: x.a || 1, boxShadow: `0 0 4px ${x.c}60` }} />
                          {x.l}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: T.txtDim, gap: 12 }}>
                    <div style={{ fontSize: 42 }}>📭</div>
                    <div style={{ fontSize: 14 }}>لا توجد بيانات لسنة {yr}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════
               ROW 4 — ANALYSIS + LOWER KPIs
            ════════════════════════════════════════ */}
            {kpi && (
              <div className="span-full">
                {/* Outer: 2-col grid — رمضان left, right stack fills same height */}
                <div className="kpi-ramadan-layout">

                  {/* ── LEFT: تحليل رمضان ── */}
                  {(() => {
                    const yr2 = yr ?? [...yrs].sort()[0]
                    const periods = ram.perPeriod ?? []
                    const RamRow = ({ label, value, color }) => (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: T.txtSub }}>{label}</span>
                        <strong style={{ fontSize: 12, color: color || T.txt }}>{value}</strong>
                      </div>
                    )
                    return (
                      <div className="card kpi-ram-left" style={{ padding: 14, borderTop: `2.5px solid ${T.ram}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: T.ram, display: 'flex', alignItems: 'center', gap: 7 }}>
                            🌙 تحليل رمضان
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: periods.length >= 2 ? '1fr 1fr' : '1fr', gap: 10 }}>
                          {periods.length > 0 ? periods.map((p, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 10, border: '1px solid rgba(167,139,250,0.1)', padding: '10px 12px' }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: T.ram,
                                  marginBottom: 8,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <span>{p.label}</span>

                                <span
                                  style={{
                                    fontSize: 10,
                                    color: T.txtDim,
                                    background: 'rgba(167,139,250,0.1)',
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(167,139,250,0.15)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {p.days} يوم
                                </span>
                              </div>
                              {p.days > 0 ? (
                                <>
                                  <div style={{ borderRadius: 7, padding: '6px 9px', fontSize: 11, fontWeight: 800, marginBottom: 9, background: p.pct > 50 ? T.demBg : T.supBg, color: p.pct > 50 ? T.dem : T.sup, border: `1px solid ${p.pct > 50 ? T.demL : T.supL}` }}>
                                    {p.pct > 50 ? `⚠️ عجز في ${Math.round(p.pct)}% من الأيام` : `✅ فائض في ${Math.round(100 - p.pct)}% من الأيام`}
                                  </div>
                                  <RamRow label="متوسط العجز" value={`${fmtFull(p.avg)} سرير/يوم`} />
                                  {p.max?.gap > 0 && <RamRow label="أعلى عجز" value={fmtFull(p.max.gap)} color={T.dem} />}
                                  <div style={{ fontSize: 10.5, color: T.txtDim, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.ram, flexShrink: 0 }} />{p.dateRange}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: 11, color: T.txtDim }}>لا توجد بيانات</div>
                              )}
                            </div>
                          )) : (
                            <div style={{ fontSize: 11, color: T.txtDim }}>لا توجد بيانات لهذه السنة</div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* ── RIGHT: flex column that stretches to match رمضان height ── */}
                  <div className="kpi-ram-right">

                    {/* Row 1: باقي الأشهر + أكبر فائض */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="card" style={{ padding: 14, borderTop: `2.5px solid ${T.greenXL}`, height: '100%', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: T.greenXL, marginBottom: 12 }}>باقي الأشهر</div>
                        <div style={{ borderRadius: 8, padding: '8px 11px', fontSize: 11, fontWeight: 800, marginBottom: 10, background: ram.oPct < 30 ? T.supBg : T.demBg, color: ram.oPct < 30 ? T.sup : T.dem, border: `1px solid ${ram.oPct < 30 ? T.supL : T.demL}` }}>
                          {ram.oPct < 30 ? `✅ عجز في أقل من ${Math.round(ram.oPct)}% من الأيام` : `⚠️ عجز في ${Math.round(ram.oPct)}% من الأيام`}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: T.txtSub }}>متوسط العجز</span>
                          <strong style={{ fontSize: 12, color: T.txt }}>{fmtFull(ram.oAvg)} سرير/يوم</strong>
                        </div>
                      </div>

                      {kpi?.maxSur?.gap < 0 ? (
                        <div className="card" style={{ padding: 14, borderTop: `2.5px solid ${T.sup}`, height: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 12, color: T.sup, fontWeight: 700, marginBottom: 7 }}>أكبر فائض</div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: T.sup, letterSpacing: -.5 }}>{fmtFull(-kpi.maxSur.gap)}</div>
                          <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>{kpi.maxSur.dateLabel} · سرير/يوم</div>
                        </div>
                      ) : (
                        <div className="card" style={{ padding: 14, borderTop: `2.5px solid rgba(255,255,255,0.07)`, opacity: 0.4, height: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 11, color: T.txtDim }}>لا يوجد فائض في هذه الفترة</div>
                        </div>
                      )}
                    </div>

                    {/* Row 2: متوسط الفجوة اليومية */}
                    {(() => {
                      const isGap = kpi.avgG > 0
                      const gapColor = isGap ? T.dem : T.sup
                      const gapBg = isGap ? T.demBg : T.supBg
                      const gapBdr = isGap ? T.demL : T.supL
                      const fillPct = kpi.avgD > 0 ? Math.round(kpi.avgS / kpi.avgD * 100) : 0
                      return (
                        <div className="card fade-up" style={{ padding: '16px 18px 14px', borderTop: `2px solid ${gapColor}`, position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 3, height: 16, borderRadius: 3, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: T.txtSub, letterSpacing: .3 }}>متوسط الفجوة اليومية</span>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 11px', borderRadius: 20, background: gapBg, color: gapColor, border: `1px solid ${gapBdr}` }}>
                              {isGap ? '⚠ عجز' : '✅ فائض'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                            <div style={{ flex: 1, background: T.demBg, borderRadius: 10, border: `1px solid ${T.demL}`, padding: '10px 12px' }}>
                              <div style={{ fontSize: 9.5, color: T.dem, fontWeight: 700, marginBottom: 4 }}>متوسط الطلب اليومي</div>
                              <div style={{ fontSize: 18, fontWeight: 900, color: T.dem, letterSpacing: -.5, lineHeight: 1 }}>{fmtExact(kpi.avgD)}</div>
                              <div style={{ fontSize: 9, color: T.txtDim, marginTop: 3 }}>سرير/يوم</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 11, color: gapColor, opacity: .6 }}>vs</span>
                            </div>
                            <div style={{ flex: 1, background: T.supBg, borderRadius: 10, border: `1px solid ${T.supL}`, padding: '10px 12px' }}>
                              <div style={{ fontSize: 9.5, color: T.sup, fontWeight: 700, marginBottom: 4 }}>متوسط الطاقة اليومية</div>
                              <div style={{ fontSize: 18, fontWeight: 900, color: T.sup, letterSpacing: -.5, lineHeight: 1 }}>{fmtExact(kpi.avgS)}</div>
                              <div style={{ fontSize: 9, color: T.txtDim, marginTop: 3 }}>سرير/يوم</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 11, color: gapColor, opacity: .6 }}>=</span>
                            </div>
                            <div style={{ flex: 1, background: gapBg, borderRadius: 10, border: `1.5px solid ${gapBdr}`, padding: '10px 12px' }}>
                              <div style={{ fontSize: 9.5, color: gapColor, fontWeight: 700, marginBottom: 4 }}>{isGap ? 'متوسط العجز' : 'متوسط الفائض'}</div>
                              <div style={{ fontSize: 18, fontWeight: 900, color: gapColor, letterSpacing: -.5, lineHeight: 1 }}>{fmtExact(Math.abs(kpi.avgG))}</div>
                              <div style={{ fontSize: 9, color: T.txtDim, marginTop: 3 }}>سرير/يوم</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 9, color: T.txtDim }}>نسبة تغطية الطاقة للطلب</span>
                              <span style={{ fontSize: 9.5, fontWeight: 900, color: fillPct >= 100 ? T.sup : T.dem }}>{fillPct}%</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 5, width: `${Math.min(fillPct, 100)}%`, background: fillPct >= 100 ? `linear-gradient(to left,${T.sup},${T.sup}aa)` : `linear-gradient(to left,${T.dem}dd,${T.dem}88)`, transition: 'width .9s cubic-bezier(.4,0,.2,1)' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Row 3: نسبة الإشغال + مساهمة المشاريع */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {(() => {
                        const pct = kpi.occupancyPct
                        const color = pct >= 100 ? T.dem : pct >= 80 ? T.warn : T.sup
                        const bg = pct >= 100 ? T.demBg : pct >= 80 ? T.warnBg : T.supBg
                        const bdr = pct >= 100 ? T.demL : pct >= 80 ? T.warnBdr : T.supL
                        const label = pct >= 100 ? 'الطلب يتجاوز الطاقة' : pct >= 80 ? 'ضغط مرتفع' : 'طاقة كافية'
                        return (
                          <div className="card fade-up" style={{ padding: '14px 16px', borderTop: `2px solid ${color}`, height: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: T.txtSub, lineHeight: 1.45 }}>متوسط نسبة الإشغال</div>
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: bg, color, border: `1px solid ${bdr}` }}>{label}</span>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -.5, lineHeight: 1 }}>{pct}%</div>
                            <div style={{ marginTop: 9, height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 5, width: `${Math.min(pct, 100)}%`, background: `linear-gradient(to left,${color},${color}99)`, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
                            </div>
                            <div style={{ fontSize: 10, color: T.txtDim, marginTop: 5 }}>
                              ذروة الإشغال: <strong style={{ color }}>{kpi.peakOccPct}%</strong>
                              <span style={{ marginRight: 5 }}>— {kpi.peakOccLabel}</span>
                            </div>
                          </div>
                        )
                      })()}

                      {sfContrib?.hasFuture ? (() => {
                        const pct = sfContrib.pct
                        const color = pct >= 50 ? T.sup : pct >= 20 ? T.bronzeXL : T.warn
                        return (
                          <div className="card fade-up" style={{ padding: '14px 16px', borderTop: `2px solid ${color}`, height: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: T.txtSub, lineHeight: 1.45 }}>مساهمة المشاريع المستقبلية</div>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -.5, lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontSize: 11.5, color: T.txtDim, marginTop: 6 }}>تُحل {sfContrib.resolved} من {sfContrib.defWithout} يوم عجز</div>
                            <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: `linear-gradient(to left,${color},${color}88)`, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
                            </div>
                          </div>
                        )
                      })() : (
                        <div className="card" style={{ padding: '14px 16px', borderTop: `2px solid rgba(255,255,255,0.07)`, opacity: 0.4, height: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontSize: 10, color: T.txtDim }}>لا توجد مشاريع مستقبلية</div>
                        </div>
                      )}
                    </div>

                  </div>{/* /kpi-ram-right */}
                </div>{/* /kpi-ramadan-layout */}
              </div>
            )}

          </div>{/* /content-area */}
        </div>{/* /main-layout */}

        {showModal && <DetailsModal yr={yr ?? [...yrs].sort()[0]} tableRows={series} onClose={() => setModal(false)} onExport={exportCSV} />}

        {showExport && (
          <ExportModal
            onClose={() => setShowExport(false)}
            payload={buildReportPayload({ yr, kpi, ram, sc, scope, peakDemand, series, demTypes, supTypes })}
          />
        )}

      </div>{/* /content padded wrapper */}

      {/* ── FOOTER ── */}
      <Footer navigate={navigate} />

    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════════ */
export default function App() {
  const [db, setDb] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(null)

  useEffect(() => {
    fetch('/housing.json')
      .then(r => r.json())
      .then(data => {
        // JSON serialization turns Date objects into strings — convert them back
        data.rows = data.rows.map(r => ({ ...r, date: new Date(r.date) }))
        data.rows.length ? setDb(data) : setError('لا توجد بيانات صالحة')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />
  if (error || !db) return <ErrorScreen message={error || 'خطأ غير معروف'} />
  return <Dashboard db={db} />
}