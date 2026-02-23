import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOUCHPOINTS, SECTIONS, CITY_COLORS, QUICK_FILTERS, getSubsections } from './touchpoints.js'
import './TouchpointsPage.css'

// ─── Local storage helpers ────────────────────────────────────────
const LS_RECENT = 'tp_recent'
const LS_PINNED = 'tp_pinned'
const getLS = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { } }

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — matched to CapacityLanding
═══════════════════════════════════════════════════════ */
const C = {
  charcoalD: '#151515',
  charcoalM: '#1A1A1A',
  bronze: '#967126',
  bronzeL: '#B8912E',
  bronzeXL: '#D4AA52',
  green: '#007a53',
  greenL: '#009966',
  greenXL: '#00BC7D',
  gray: '#75787b',
  grayL: '#9A9D9F',
  grayXL: '#C8CACC',
  cream: '#F4F1EB',
  creamD: '#E8E4DA',
  white: '#FFFFFF',
}

// ─── Inject shared nav/global styles (same as CapacityLanding) ───
const NAV_STYLE_ID = 'cl-shared-styles'
function injectNavStyles() {
  if (document.getElementById(NAV_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = NAV_STYLE_ID
  s.textContent = `
    .cl-root *, .cl-root *::before, .cl-root *::after { box-sizing: border-box; }
    .cl-root {
      font-family: "BahijTheSansArabic", "Segoe UI", sans-serif;
      background: ${C.charcoalD};
      color: ${C.cream};
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    .cl-root *:focus-visible {
      outline: 2px solid ${C.bronze};
      outline-offset: 3px;
      border-radius: 4px;
    }
    @keyframes cl-fadeInUp {
      from { opacity:0; transform:translateY(22px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes cl-fadeIn {
      from { opacity:0; }
      to   { opacity:1; }
    }
    @keyframes cl-dotBlink {
      0%,100% { opacity:1; }
      50%      { opacity:0.25; }
    }
    @keyframes cl-shimmerText {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .cl-nav-link {
      color: ${C.grayXL};
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 5px 1px;
      position: relative;
      transition: color 0.2s;
      white-space: nowrap;
    }
    .cl-nav-link::after {
      content: '';
      position: absolute;
      bottom: 0; right: 0;
      width: 0; height: 1.5px;
      background: ${C.bronze};
      transition: width 0.25s ease;
    }
    .cl-nav-link:hover { color: ${C.bronzeXL}; }
    .cl-nav-link:hover::after { width: 100%; }
    .cl-btn-primary {
      position: relative; overflow: hidden;
    }
    .cl-btn-primary::after {
      content: '';
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.07);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .cl-btn-primary:hover::after { opacity: 1; }
    .cl-shimmer-text {
      background: linear-gradient(100deg, ${C.bronzeXL} 0%, ${C.bronzeL} 35%, #FFE099 50%, ${C.bronzeL} 65%, ${C.bronzeXL} 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      backgroundclip: text;
      animation: cl-shimmerText 4s linear infinite
    }
    @media (max-width: 768px) {
      .cl-hide-mobile  { display: none !important; }
      .cl-nav-desktop  { display: none !important; }
      .cl-mobile-btn   { display: flex !important; }
    }
    @media (min-width: 769px) {
      .cl-mobile-btn { display: none !important; }
    }
  `
  document.head.appendChild(s)
}

/* ═══════════════════════════════════════════════════════
   NAVBAR — identical to CapacityLanding
═══════════════════════════════════════════════════════ */
function Navbar({ scrolled, navigate }) {
  const [mOpen, setMOpen] = useState(false)

  const scrollToSection = (linkText) => {
    const sectionMap = {
      'عن المنصة': 'aboutSection',
      'الأسئلة الشائعة': 'faqSection',
      'تواصل معنا': 'contactSection',
    }
    const sectionId = sectionMap[linkText]
    if (sectionId) {
      navigate('/')
    }
    setMOpen(false)
  }

  const base = { fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }

  return (
    <nav style={{
      position: 'fixed', top: 0, right: 0, left: 0, zIndex: 200,
      background: scrolled ? `${C.charcoalD}` : 'transparent',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div style={{
        maxWidth: 1300, margin: '0 auto', padding: '0 24px',
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <div style={{ width: 220, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img src="/WhitePEP.png" alt="Logo" style={{ height: 80, width: 'auto', display: 'block' }} />
          </div>
        </div>

        {/* Center links */}
        <div className="cl-nav-desktop" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 28 }}>
          {['عن المنصة', 'الأسئلة الشائعة', 'تواصل معنا'].map(l => (
            <a
              key={l}
              href="#"
              className="cl-nav-link"
              onClick={e => { e.preventDefault(); scrollToSection(l) }}
            >{l}</a>
          ))}
        </div>

        {/* CTA */}
        <div className="cl-hide-mobile" style={{ width: 220, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            className="cl-btn-primary"
            onClick={() => navigate('/')}
            style={{
              ...base,
              padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 800,
              background: `linear-gradient(135deg, ${C.green}, ${C.greenL})`,
              color: 'white', border: 'none',
              boxShadow: `0 4px 16px ${C.green}45`,
            }}
          >الصفحة الرئيسية</button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="cl-mobile-btn"
          onClick={() => setMOpen(o => !o)}
          aria-label={mOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mOpen}
          style={{
            ...base, background: 'transparent', border: 'none', padding: 10, borderRadius: 12,
            display: 'none', flexDirection: 'column', justifyContent: 'center', gap: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {[0, 1, 2].map(i => {
            const isTop = i === 0, isBot = i === 2
            const openStyle = isTop
              ? { transform: 'translateY(8px) rotate(45deg)' }
              : isBot
                ? { transform: 'translateY(-8px) rotate(-45deg)' }
                : { opacity: 0, transform: 'scaleX(0.8)' }
            return (
              <span key={i} style={{
                width: 22, height: 2, background: C.cream, display: 'block',
                borderRadius: 999, transformOrigin: 'center',
                transition: 'transform 220ms ease, opacity 180ms ease',
                ...(mOpen ? openStyle : { opacity: 1, transform: 'none' }),
              }} />
            )
          })}
        </button>
      </div>

      {/* Mobile drawer — BUG FIX: was template literal string, not interpolated */}
      {mOpen && (
        <div style={{ background: `${C.charcoalD}`, backdropFilter: 'blur(18px)', padding: '18px 24px 24px' }}>
          {['عن المنصة', 'الأسئلة الشائعة', 'تواصل معنا'].map(l => (
            <a
              key={l}
              href="#"
              className="cl-nav-link"
              style={{ display: 'block', marginBottom: 16, fontSize: 15 }}
              onClick={e => { e.preventDefault(); scrollToSection(l) }}
            >{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: 1, padding: '10px', background: C.green, color: 'white',
                border: 'none', borderRadius: 8, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >الصفحة الرئيسية</button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Touchpoint Tile ─────────────────────────────────────────────
function TouchpointTile({ tp, pinned, onPin, onRemove, onClick, animDelay = 0 }) {
  const cityStyle = CITY_COLORS[tp.city] ?? {
    bg: 'rgba(255,255,255,0.06)',
    color: C.grayXL,
  }
  const sec = SECTIONS.find(s => s.id === tp.section)

  return (
    <button
      className="tp-tile"
      style={{
        animationDelay: `${animDelay}ms`,
        // Pass section accent so CSS can use it on hover
        '--tile-accent': sec?.accent ?? C.bronze,
        '--tile-accent-dim': sec?.accentDim ?? 'rgba(150,113,38,0.1)',
      }}
      onClick={() => onClick(tp)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick(tp)}
      aria-label={`${tp.title} — ${tp.city}`}
      tabIndex={0}
    >
      {/* Action buttons */}
      <div className="tp-tile-actions">
        <button
          className={`tp-tile-pin ${pinned ? 'pinned' : ''}`}
          onClick={e => { e.stopPropagation(); onPin(tp.id) }}
          aria-label={pinned ? 'إلغاء التثبيت' : 'تثبيت'}
          tabIndex={-1}
        >{pinned ? '★' : '☆'}</button>
        {onRemove && (
          <button
            className="tp-tile-remove"
            onClick={e => { e.stopPropagation(); onRemove(tp.id) }}
            aria-label="حذف"
            tabIndex={-1}
          >✕</button>
        )}
      </div>

      {/* Icon */}
      <div className="tp-tile-icon" style={{ background: sec?.accentDim, border: `1px solid ${sec?.accentBdr}` }}>
        <span>{tp.icon}</span>
      </div>

      {/* Name */}
      <div className="tp-tile-name">{tp.title}</div>

      {/* Footer */}
      <div className="tp-tile-footer">
        <span className="tp-city-tag" style={{ background: cityStyle.bg, color: cityStyle.color, border: `1px solid ${cityStyle.border}` }}>
          {tp.city}
        </span>
        <span className="tp-cat-badge" style={{ color: sec?.accent ?? C.grayXL }}>
          {tp.subsection}
        </span>
      </div>
    </button>
  )
}

// ─── Subsection Row ───────────────────────────────────────────────
// Now receives sectionAccent to colorize the dot
function SubsectionRow({ label, touchpoints, pinned, onPin, onSelect, animDelay, sectionAccent }) {
  return (
    <div className="tp-subsection">
      <div className="tp-subsection-label">
        <span
          className="tp-subsection-dot"
          style={sectionAccent ? { background: sectionAccent, opacity: 0.7 } : undefined}
        />
        <span>{label}</span>
        <span className="tp-subsection-count">{touchpoints.length}</span>
      </div>
      <div className="tp-tiles-scroll">
        {touchpoints.map((tp, i) => (
          <TouchpointTile
            key={tp.id}
            tp={tp}
            pinned={pinned.includes(tp.id)}
            onPin={onPin}
            onClick={onSelect}
            animDelay={animDelay + i * 30}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────
function SectionCard({ section, touchpoints, pinned, onPin, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  const subsections = getSubsections(section.id)
  const count = touchpoints.length
  if (count === 0) return null

  return (
    <div
      className={`tp-section-card ${open ? 'open' : ''}`}
      style={{
        '--sec-accent': section.accent,
        '--sec-accent-dim': section.accentDim,
        '--sec-accent-bdr': section.accentBdr,
      }}
    >
      <button className="tp-section-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <div className="tp-section-icon-wrap">
          <span className="tp-section-icon">{section.icon}</span>
        </div>
        <div className="tp-section-meta">
          <div className="tp-section-title">{section.title}</div>
          <div className="tp-section-desc">{section.desc}</div>
        </div>
        <div className="tp-section-right">
          <span className="tp-section-count">{count} نقطة</span>
          <span className={`tp-section-chevron ${open ? 'up' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>

      <div className="tp-section-body">
        <div className="tp-section-body-inner">
          {subsections.map((sub, si) => {
            const subTps = touchpoints.filter(t => t.subsection === sub)
            if (!subTps.length) return null
            return (
              <SubsectionRow
                key={sub}
                label={sub}
                touchpoints={subTps}
                pinned={pinned}
                onPin={onPin}
                onSelect={onSelect}
                animDelay={si * 60}
                sectionAccent={section.accent}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ query }) {
  return (
    <div className="tp-empty">
      <div className="tp-empty-icon">🔍</div>
      <div className="tp-empty-title">لا توجد نتائج</div>
      <div className="tp-empty-sub">لم يتم العثور على نقاط اتصال مطابقة لـ «{query}»</div>
      <div className="tp-empty-hint">جرّب كلمات أقصر أو استخدم الفلاتر السريعة</div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════
   CITY SELECTOR — 3 animated circles
═══════════════════════════════════════════════════════ */
const CITY_DEFS = [
  { id: 'makkah', label: 'مكة المكرمة', iconSrc: "/mk.png" },
  { id: 'all', label: 'الكل', iconSrc: "/all.png" },
  { id: 'madinah', label: 'المدينة المنورة', iconSrc: "/md.png" },
]

function CitySelector({ filter, setFilter }) {
  const [orderedIds, setOrderedIds] = useState(() => {
    const center = filter && filter !== 'all' ? filter : 'all'
    const others = CITY_DEFS.map(c => c.id).filter(id => id !== center)
    return [others[0], center, others[1]]
  })

  const handleClick = (id) => {
    if (orderedIds[1] === id) return
    setFilter(id)
    const idx = orderedIds.indexOf(id)
    const newOrder = [...orderedIds]
      ;[newOrder[1], newOrder[idx]] = [newOrder[idx], newOrder[1]]
    setOrderedIds(newOrder)
  }

  const X_OFFSETS = [-120, 0, 120]
  const SIZES = [82, 112, 82]

  return (
    <div style={{
      position: 'relative',
      height: 140,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '8px 0 50px',
    }}>
      {CITY_DEFS.map(city => {
        const posIdx = orderedIds.indexOf(city.id)
        const x = X_OFFSETS[posIdx]
        const sz = SIZES[posIdx]
        const isCenter = posIdx === 1

        return (
          <button
            key={city.id}
            onClick={() => handleClick(city.id)}
            aria-pressed={isCenter}
            title={city.label}
            style={{
              position: 'absolute',
              transform: `translateX(${x}px)`,
              width: sz,
              height: sz,
              borderRadius: '50%',
              border: isCenter
                ? `2.5px solid ${C.bronzeXL}90`
                : `1.5px solid rgba(255,255,255,0.12)`,
              background: isCenter
                ? `radial-gradient(circle at 35% 35%, ${C.bronze}30, ${C.charcoalD}cc)`
                : `rgba(255,255,255,0.04)`,
              boxShadow: isCenter
                ? `0 0 32px ${C.bronze}25, 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
                : `0 4px 12px rgba(0,0,0,0.25)`,
              cursor: isCenter ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.48s cubic-bezier(0.34, 1.4, 0.64, 1)',
              fontFamily: 'inherit',
              zIndex: isCenter ? 2 : 1,
              backdropFilter: 'blur(8px)',
              opacity: isCenter ? 1 : 0.72,
            }}
            onMouseEnter={e => {
              if (!isCenter) {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.borderColor = `${C.bronze}55`
              }
            }}
            onMouseLeave={e => {
              if (!isCenter) {
                e.currentTarget.style.opacity = '0.72'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              }
            }}
          >
            <img
              src={city.iconSrc}
              alt={city.label}
              style={{
                width: isCenter ? 44 : 35,
                height: isCenter ? 44 : 35,
                objectFit: "contain",
                display: "block",
                transition: "all 0.48s cubic-bezier(0.34, 1.4, 0.64, 1)",
                transform: isCenter ? "translateY(-4px) scale(1.15)" : "translateY(0) scale(1)",
              }}
            />

            <span style={{
              fontSize: isCenter ? 11 : 8.4,
              fontWeight: 700,
              color: isCenter ? C.bronzeXL : C.grayXL,
              letterSpacing: '0.03em',
              lineHeight: 1.3,
              textAlign: 'center',
              maxWidth: isCenter ? 80 : 58,
              transition: 'all 0.33s ease',
              userSelect: 'none',
              transform: isCenter ? "translateY(-4px) scale(1.03)" : "translateY(0) scale(1)",
            }}>
              {city.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   INLINE SEARCH  (rendered in body, above sections)
═══════════════════════════════════════════════════════ */
function InlineSearch({ searchRef, query, setQuery }) {
  return (
    <div style={{
      marginBottom: 28,
      direction: 'rtl',
    }}>
      <div
        className="tp-inline-search-wrap"
        onFocusCapture={e => {
          e.currentTarget.style.borderColor = `${C.bronze}60`
          e.currentTarget.style.boxShadow = `0 0 0 3px ${C.bronze}18, 0 2px 16px rgba(0,0,0,0.3)`
        }}
        onBlurCapture={e => {
          e.currentTarget.style.borderColor = `rgba(255,255,255,0.09)`
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: C.grayXL }}>
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          placeholder="ابحث عن نقطة اتصال..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="بحث في نقاط الاتصال"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: C.cream, fontSize: 14, fontFamily: 'inherit', direction: 'rtl',
          }}
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            aria-label="مسح البحث"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.grayL, fontSize: 13, padding: '2px 4px', fontFamily: 'inherit',
              borderRadius: 4, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.cream}
            onMouseLeave={e => e.currentTarget.style.color = C.grayL}
          >✕</button>
        ) : (
          <span style={{
            fontSize: 13, color: C.gray,
            borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap',
          }}>⌘</span>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FOOTER — ported from CapacityLanding
═══════════════════════════════════════════════════════ */
const footerStyles = `
  .footer-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 36px;
    margin-bottom: 33px;
    direction: rtl;
  }
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 14px;
    text-align: right;
  }
  .footer-logo {
    display: none;
  }
  @media (max-width: 640px) {
    .footer-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      margin-bottom: 25px;
    }
    .footer-logo-col {
      grid-column: 1 / -1;
      justify-content: center;
    }
    .footer-bottom {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }
`

const MODAL_CONTENT = {
  'نطاق الخدمة': {
    icon: '🗺️',
    body: `تغطي منصة تحليل الطاقة الاستيعابية النطاق الجغرافي الكامل للمشاعر المقدسة وما يحيط بها، وتشمل:

• **المسجد الحرام وساحاته** — تتبع الكثافة اللحظية وتحليل التدفق البشري في جميع الأروقة والمداخل.
• **منى والمشاعر المقدسة** — تقييم الطاقة الاستيعابية لمخيمات الحجاج ومسارات الحركة خلال موسم الحج.
• **السعي والمسعى** — قياس معدلات الإشغال والأوقات الحرجة.
• **الفنادق والمجمعات الإيوائية** — تحليل توزيع طاقة الإيواء الفندقي بمحيط 5 كم حول المسجد الحرام.
• **محطات النقل والمداخل الرئيسية** — تحليل نقاط الاختناق وسيناريوهات الإخلاء.

يُقدّم النطاق الخدمي بيانات مُجمَّعة ومُشفَّرة بالكامل، ولا تُتاح البيانات الفردية لأي طرف.`,
  },
  'ميثاق المستخدمين': {
    icon: '🤝',
    body: `يُحدّد هذا الميثاق الإطار الأخلاقي والمهني الذي يلتزم به جميع مستخدمي المنصة:

**الالتزامات الجوهرية**
• استخدام البيانات لأغراض تشغيلية وتحليلية مشروعة فحسب.
• عدم مشاركة بيانات الوصول أو بيانات الاعتماد مع أطراف ثالثة.
• الإفصاح الفوري عن أي اختراق أمني أو استخدام غير مصرح به.

**المعايير المهنية**
• الحرص على دقة المدخلات وموثوقية التحليل.
• التعامل مع مخرجات المنصة بمنتهى السرية والمهنية.
• الامتناع عن أي محاولة لاختراق حدود الصلاحيات المُمنوحة.

**المساءلة**
يخضع كل مستخدم للمراجعة الدورية، وتُعلَّق الحسابات عند ثبوت المخالفة. تحتفظ الجهة المشغّلة بسجلات التدقيق لمدة لا تقل عن ثلاث سنوات.`,
  },
  'شروط الاستخدام': {
    icon: '📋',
    body: `**١. قبول الشروط**
باستخدامك لهذه المنصة، فإنك تُقرّ بقراءة هذه الشروط وفهمها والموافقة الكاملة على الالتزام بها.

**٢. نطاق الترخيص**
تُمنح صلاحية الوصول بشكل شخصي وغير قابل للتحويل، ومقتصرة على الوظائف المحددة في اتفاقية الخدمة.

**٣. الملكية الفكرية**
جميع محتويات المنصة — بما تشمل البيانات والمنهجيات والتصورات — ملكٌ حصري لبرنامج خدمة ضيوف الرحمن. يُحظر إعادة النشر أو التوزيع دون إذن كتابي مسبق.

**٤. حدود المسؤولية**
تُقدَّم البيانات كأداة مساندة للقرار؛ ولا تتحمل المنصة أي مسؤولية قانونية عن القرارات التشغيلية المتخذة بناءً عليها.

**٥. التعديلات**
تحتفظ الجهة المشغّلة بحق تعديل هذه الشروط في أي وقت، مع إشعار المستخدمين المسجّلين قبل سبعة أيام على الأقل.`,
  },
  'سياسة الخصوصية': {
    icon: '🔒',
    body: `**البيانات التي نجمعها**
تقتصر على بيانات تسجيل الدخول، وسجلات الجلسات، ومعرّفات الأجهزة — لأغراض الأمان والتدقيق حصراً.

**كيف نستخدم البيانات**
• مراقبة أداء النظام والكشف عن الاستخدام غير المصرح به.
• إنتاج تقارير إحصائية مجهولة الهوية لتطوير المنصة.
• لا تُباع البيانات أو تُشارك مع أي طرف تجاري ثالث.

**الاحتفاظ بالبيانات**
تُحتفظ سجلات الجلسات لمدة ١٢ شهراً، وسجلات التدقيق الأمني لمدة ٣ سنوات وفق اشتراطات الجهات الرقابية.

**حقوقك**
يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها عبر التواصل مع فريق الدعم. يُعالَج الطلب خلال ١٤ يوم عمل.

**الأمان**
تعتمد المنصة تشفير TLS 1.3 لنقل البيانات، وAES-256 للتخزين، ومراجعات أمنية دورية من جهات مستقلة.`,
  },
}

function GlassModal({ title, onClose }) {
  const content = MODAL_CONTENT[title]
  useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const renderBody = (text) =>
    text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <p key={i} style={{ margin: 0, fontSize: 13, color: C.grayXL, lineHeight: 2, direction: 'rtl' }}>
          {parts.map((p, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: C.bronzeXL, fontWeight: 700 }}>{p}</strong>
              : p
          )}
        </p>
      )
    })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'cl-fadeIn 0.22s ease',
        background: `${C.charcoalD}`,
        backdropFilter: 'blur(20px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 560, width: '100%', maxHeight: '80vh',
          borderRadius: 20,
          border: `1px solid rgba(255,255,255,0.08)`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(150,113,38,0.1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cl-fadeInUp 0.28s ease',
          position: 'relative',
          background: `${C.charcoalD}`,
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          direction: 'rtl',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{content.icon}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.cream }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              color: C.grayXL, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(150,113,38,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            aria-label="إغلاق"
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', direction: 'rtl' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderBody(content.body)}
          </div>
        </div>

        {/* Glow accent */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 180, height: 180,
          background: `radial-gradient(circle, ${C.bronze}18 0%, transparent 70%)`,
          pointerEvents: 'none', borderRadius: '50%',
          transform: 'translate(40%, 40%)',
        }} />
      </div>
    </div>
  )
}

function Footer({ navigate }) {
  const [activeModal, setActiveModal] = useState(null)

  const MAILTO_SUBJECT = encodeURIComponent('تواصل عبر منصة تحليل الطاقة الاستيعابية')
  const MAILTO_BODY = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته،\n\nأتواصل معكم عبر منصة تحليل الطاقة الاستيعابية بخصوص:\n\n[اكتب رسالتك هنا]\n\nبيانات التواصل:\nالاسم: \nالجهة: \nرقم الجوال: \n\nشكراً لكم،\nتحياتي`
  )

  const handleLink = (label) => {
    if (label === 'عن المنصة') {
      navigate('/', { state: { scrollTo: 'aboutSection' } })
    } else if (label === 'الأسئلة الشائعة') {
      navigate('/', { state: { scrollTo: 'faqSection' } })
    } else if (label === 'تواصل معنا') {
      window.location.href = `mailto:capacity@pep.gov.sa?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`
    } else if (MODAL_CONTENT[label]) {
      setActiveModal(label)
    }
  }

  return (
    <>
      {activeModal && <GlassModal title={activeModal} onClose={() => setActiveModal(null)} />}

      <footer id="contactSection" style={{ background: C.charcoalD, borderTop: `1px solid ${C.bronze}14`, padding: '40px 24px 25px' }}>
        <style>{footerStyles}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

          <div className="footer-grid">
            {[
              { t: "نظرة عامة", ls: ["عن المنصة", "نطاق الخدمة"] },
              { t: "السياسات والحوكمة", ls: ["ميثاق المستخدمين", "شروط الاستخدام", "سياسة الخصوصية"] },
              { t: "الدعم والمساعدة", ls: ["الأسئلة الشائعة", "تواصل معنا"] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.cream, marginBottom: 14 }}>{col.t}</div>
                {col.ls.map(l => (
                  <button
                    key={l}
                    onClick={() => handleLink(l)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'right',
                      fontSize: 12, color: C.gray, background: 'none',
                      border: 'none', cursor: 'pointer', padding: '0 0 9px 0',
                      fontFamily: 'inherit', transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = C.bronzeXL}
                    onMouseLeave={e => e.currentTarget.style.color = C.gray}
                  >{l}</button>
                ))}
              </div>
            ))}

            {/* Logo — 4th column */}
            <div className="footer-logo-col" style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/White PEP-2030.png" alt="Logo" style={{ height: 80, width: 'auto', display: 'block', marginTop: -12 }} />
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.055)`, paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <p style={{ fontSize: 11, color: C.gray, maxWidth: 580, lineHeight: 1.8 }}>
              <span style={{ color: C.bronze, fontWeight: 700 }}>إخلاء مسؤولية: </span>
              البيانات المعروضة لأغراض تحليلية ولا تُمثّل وثيقة رسمية.
            </p>
            <p style={{ fontSize: 11, color: C.gray }}>
              جميع الحقوق محفوظة لبرنامج خدمة ضيوف الرحمن © {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </footer>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function TouchpointsPage() {
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [pinned, setPinned] = useState(() => getLS(LS_PINNED, []))
  const [recent, setRecent] = useState(() => getLS(LS_RECENT, []))
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Derived stats
  const uniqueCitiesCount = useMemo(() => new Set(TOUCHPOINTS.map(t => t.city)).size, [])
  const totalCount = TOUCHPOINTS.length

  useEffect(() => {
    injectNavStyles()
    setMounted(true)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setLS(LS_PINNED, pinned) }, [pinned])
  useEffect(() => { setLS(LS_RECENT, recent) }, [recent])

  // ⌘K shortcut
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const togglePin = useCallback(id => {
    setPinned(prev => prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev].slice(0, 8))
  }, [])

  const removeRecent = useCallback(id => {
    setRecent(prev => prev.filter(r => r !== id))
  }, [])

  const handleSelect = useCallback(tp => {
    setRecent(prev => [tp.id, ...prev.filter(id => id !== tp.id)].slice(0, 4))
    navigate(tp.route)
  }, [navigate])

  // Filtered touchpoints
  const filtered = useMemo(() => {
    let list = TOUCHPOINTS
    if (filter !== 'all') {
      const qf = QUICK_FILTERS.find(f => f.id === filter)
      if (qf?.match) list = list.filter(qf.match)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(t =>
        t.title.includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.subsection.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }
    return list
  }, [query, filter])

  const pinnedTps = useMemo(() => pinned.map(id => TOUCHPOINTS.find(t => t.id === id)).filter(Boolean), [pinned])
  const recentTps = useMemo(() => recent.map(id => TOUCHPOINTS.find(t => t.id === id)).filter(Boolean), [recent])
  const isFiltering = !!query
  const isCityFiltered = filter !== 'all'

  return (
    <div
      className={`cl-root tp-page ${mounted ? 'mounted' : ''}`}
      style={{ minHeight: '100vh', background: C.charcoalD, direction: 'rtl' }}
    >
      {/* ── NAVBAR ── */}
      <Navbar scrolled={scrolled} navigate={navigate} />

      {/* ── HERO — now uses CSS classes + eyebrow + stats strip ── */}
      <div
        className="tp-hero"
        style={{
          backgroundImage: `url(${filter === 'makkah' ? '/Makkah.jpg'
            : filter === 'madinah' ? '/Madinah.jpg'
              : '/all.jpg'
            })`,
        }}
      >
        <div className="tp-hero-content">

          {/* Eyebrow badge */}
          <div className="tp-hero-eyebrow">
            <span className="tp-hero-dot" />
            نقاط الاتصال
          </div>

          <h1 className="tp-hero-title cl-shimmer-text">
            اختر نقطة الاتصال
          </h1>

          <p className="tp-hero-sub">
            حدد نطاق التحليل عبر اختيار نقطة الاتصال المناسبة
          </p>

          {/* ── CITY SELECTOR ── */}
          <CitySelector filter={filter} setFilter={setFilter} />

        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="tp-body" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Pinned + Recent — side by side on desktop, stacked on mobile */}
        {(pinnedTps.length > 0 || recentTps.length > 0) && !isFiltering && (
          <div className="tp-quick-rows-container">

            {pinnedTps.length > 0 && (
              <div className="tp-quick-row" style={{ marginBottom: 0 }}>
                <div className="tp-quick-label" style={{ color: C.bronzeXL }}>
                  <span>★</span> المثبّتة
                </div>
                <div className="tp-tiles-scroll">
                  {pinnedTps.map((tp, i) => (
                    <TouchpointTile key={tp.id} tp={tp} pinned animDelay={i * 40} onPin={togglePin} onClick={handleSelect} />
                  ))}
                </div>
              </div>
            )}

            {recentTps.length > 0 && (
              <div className="tp-quick-row" style={{ marginBottom: 0 }}>
                <div className="tp-quick-label" style={{ color: C.grayXL }}>
                  <span>🕐</span> فتحتها مؤخراً
                  <button
                    className="tp-recent-clear-all"
                    onClick={() => setRecent([])}
                  >مسح الكل</button>
                </div>
                <div className="tp-tiles-scroll">
                  {recentTps.map((tp, i) => (
                    <div key={tp.id} className="tp-recent-item">
                      <TouchpointTile tp={tp} pinned={pinned.includes(tp.id)} animDelay={i * 40} onPin={togglePin} onRemove={removeRecent} onClick={handleSelect} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── SEARCH — above sections ── */}
        <InlineSearch searchRef={searchRef} query={query} setQuery={setQuery} />

        {/* Result bar */}
        {(isFiltering || isCityFiltered) && (
          <div className="tp-result-bar">
            <span className="tp-result-count" style={{ color: C.grayXL }}>
              {filtered.length > 0
                ? <><strong style={{ color: C.bronzeXL }}>{filtered.length}</strong> نقطة اتصال</>
                : 'لا توجد نتائج'}
            </span>
          </div>
        )}

        {/* Empty state */}
        {(isFiltering || isCityFiltered) && filtered.length === 0 && (
          <EmptyState query={query || QUICK_FILTERS.find(f => f.id === filter)?.label} />
        )}

        {/* Section Cards */}
        <div className="tp-sections">
          {SECTIONS.map(sec => {
            const secTps = filtered.filter(t => t.section === sec.id)
            return (
              <SectionCard
                key={sec.id}
                section={sec}
                touchpoints={secTps}
                pinned={pinned}
                onPin={togglePin}
                onSelect={handleSelect}
                defaultOpen={isFiltering || isCityFiltered}
              />
            )
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <Footer navigate={navigate} />

    </div>
  )
}