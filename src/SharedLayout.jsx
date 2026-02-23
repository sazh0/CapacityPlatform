import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { C, MODAL_CONTENT, footerStyles } from './theme'

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
export function Navbar({ scrolled, navigate }) {
  const [mOpen, setMOpen] = useState(false)

  const scrollToSection = (linkText) => {
    const sectionMap = {
      'عن المنصة': 'aboutSection',
      'الأسئلة الشائعة': 'faqSection',
      'تواصل معنا': 'contactSection',
    }
    const sectionId = sectionMap[linkText]
    if (sectionId) navigate('/')
    setMOpen(false)
  }

  const base = { fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }

  return (
    <nav style={{
      position: 'fixed', top: 0, right: 0, left: 0, zIndex: 200,
      background: scrolled ? '${C.charcoalD};' : 'transparent',
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
            onClick={() => navigate(-1)}
            style={{
              ...base,
              padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 800,
              background: `linear-gradient(135deg, ${C.green}, ${C.greenL})`,
              color: 'white', border: 'none',
              boxShadow: `0 4px 16px ${C.green}45`,
            }}
          >نقاط الإتصال</button>
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

      {/* Mobile drawer */}
      {mOpen && (
        <div style={{ background: '${C.charcoalD};', backdropFilter: 'blur(18px)', padding: '18px 24px 24px' }}>
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
              onClick={() => navigate(-1)}
              style={{
                flex: 1, padding: '10px', background: C.green, color: 'white',
                border: 'none', borderRadius: 8, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >نقاط الإتصال</button>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════
   GLASS MODAL
═══════════════════════════════════════════════════════ */
export function GlassModal({ title, onClose }) {
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

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'cl-fadeIn 0.22s ease',
        background: '${C.charcoalD};',
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
          background: '${C.charcoalD};',
          backdropFilter: 'blur(20px)'
        }}
      >
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
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', direction: 'rtl' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderBody(content.body)}
          </div>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 180, height: 180,
          background: `radial-gradient(circle, ${C.bronze}18 0%, transparent 70%)`,
          pointerEvents: 'none', borderRadius: '50%',
          transform: 'translate(40%, 40%)',
        }} />
      </div>
    </div>,
    document.body
  )
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
export function Footer({ navigate }) {
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
            <div className="footer-logo-col" style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/White PEP-2030.png" alt="Logo" style={{ height: 80, width: 'auto', display: 'block', marginTop: -12 }} />
            </div>
          </div>
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