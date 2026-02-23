import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FAQ from "./faq";

/* ═══════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════ */
const C = {
  charcoalD: '#1A1A1A',
  charcoalM: '#151515',
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

/* ═══════════════════════════════════════════════════════
   GLOBAL STYLES (injected once)
═══════════════════════════════════════════════════════ */
const STYLE_ID = 'capacity-landing-styles'
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

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

    .cl-reveal {
      opacity:0;
      transform:translateY(28px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .cl-reveal.cl-visible {
      opacity:1;
      transform:translateY(0);
    }

    /* Staggered children */
    .cl-reveal-child {
      opacity:0;
      transform:translateY(18px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .cl-visible .cl-reveal-child:nth-child(1) { transition-delay:0s; }
    .cl-visible .cl-reveal-child:nth-child(2) { transition-delay:0.1s; }
    .cl-visible .cl-reveal-child:nth-child(3) { transition-delay:0.2s; }
    .cl-visible .cl-reveal-child:nth-child(4) { transition-delay:0.3s; }
    .cl-visible .cl-reveal-child:nth-child(1),
    .cl-visible .cl-reveal-child:nth-child(2),
    .cl-visible .cl-reveal-child:nth-child(3),
    .cl-visible .cl-reveal-child:nth-child(4) { opacity:1; transform:translateY(0); }

    .cl-nav-link {
      color:${C.grayXL};
      text-decoration:none;
      font-size:14px;
      font-weight:500;
      padding:5px 1px;
      position:relative;
      transition:color 0.2s;
      white-space: nowrap;
    }
    .cl-nav-link::after {
      content:'';
      position:absolute;
      bottom:0; right:0;
      width:0; height:1.5px;
      background:${C.bronze};
      transition:width 0.25s ease;
    }
    .cl-nav-link:hover { color:${C.bronzeXL}; }
    .cl-nav-link:hover::after { width:100%; }

    .cl-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .cl-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 24px 56px rgba(0,0,0,0.38), 0 0 0 1px ${C.bronze}28;
    }

    .cl-tile {
      transition: transform 0.22s ease, background 0.22s ease, border-color 0.22s ease;
      cursor: pointer;
    }
    .cl-tile:hover {
      transform: translateY(-3px) scale(1.018);
      background: rgba(150,113,38,0.09) !important;
      border-color: ${C.bronze}55 !important;
    }

    .cl-step {
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }
    .cl-step:hover {
      transform: translateX(-4px);
      box-shadow: 4px 0 0 0 ${C.bronze} inset;
    }

    .cl-btn-primary {
      position:relative; overflow:hidden;
    }
    .cl-btn-primary::after {
      content:'';
      position:absolute; inset:0;
      background:rgba(255,255,255,0.07);
      opacity:0;
      transition:opacity 0.2s;
    }
    .cl-btn-primary:hover::after { opacity:1; }

    .cl-shimmer-text {
      background: linear-gradient(100deg, ${C.bronzeXL} 0%, ${C.bronzeL} 35%, #FFE099 50%, ${C.bronzeL} 65%, ${C.bronzeXL} 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      backgroundclip: text;
      animation: cl-shimmerText 4s linear infinite
    }

    @keyframes cl-floatOrb {
  0%,100% { transform: translateY(0) scale(1); opacity:0.18; }
  50%      { transform: translateY(-28px) scale(1.12); opacity:0.28; }
}
@keyframes cl-iconFloat {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes cl-iconPulseRing {
  0%   { transform: scale(0.85); opacity: 0.7; }
  70%  { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(0.85); opacity: 0; }
}
@keyframes cl-barGrow {
  from { width: 0%; }
  to   { width: var(--bar-w, 75%); }
}
@keyframes cl-cardGlow {
  0%,100% { box-shadow: 0 0 0 1px var(--card-accent, transparent); }
  50%      { box-shadow: 0 0 32px 2px var(--card-glow, transparent), 0 0 0 1px var(--card-accent, transparent); }
}
  
    @media (max-width:768px) {
      .cl-hide-mobile { display:none !important; }
      .cl-nav-desktop { display:none !important; }
      .cl-mobile-btn  { display:flex !important; }
      .cl-method-grid { grid-template-columns:1fr !important; }
    }
    @media (min-width:769px) {
      .cl-mobile-btn { display:none !important; }
    }
  `
  document.head.appendChild(s)
}
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
`;
/* ═══════════════════════════════════════════════════════
   REVEAL HOOK
═══════════════════════════════════════════════════════ */
function useReveal(rootSelector = '.cl-root') {
  useEffect(() => {
    const root = document.querySelector(rootSelector)
    if (!root) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('cl-visible'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.08 })
    root.querySelectorAll('.cl-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [rootSelector])
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════ */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let s = null
    const step = ts => {
      if (!s) s = ts
      const p = Math.min((ts - s) / 1800, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target])

  return <span ref={ref}>{val.toLocaleString('ar-SA')}{suffix}</span>
}

/* ═══════════════════════════════════════════════════════
   HERO CANVAS
═══════════════════════════════════════════════════════ */
function HeroCanvas({ intensity }) {
  const ref = useRef(null)
  const anim = useRef(null)
  const state = useRef({ particles: [], nodes: [] })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0

    const resize = () => {
      W = canvas.parentElement.offsetWidth
      H = canvas.parentElement.offsetHeight
      canvas.width = W
      canvas.height = H
      buildNodes()
    }

    const buildNodes = () => {
      const n = Math.floor((W * H) / 16000)
      state.current.nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
      }))
    }

    const newParticle = () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: Math.random() * 260 + 100,
      size: Math.random() * 1.7 + 0.4,
      kind: Math.random() < 0.18 ? 'gold' : Math.random() < 0.32 ? 'green' : 'gray',
    })

    const initParticles = () => {
      state.current.particles = Array.from({ length: Math.min(90, Math.floor(W / 11)) }, newParticle)
    }

    const col = (kind, a) => {
      if (kind === 'gold') return `rgba(180,140,48,${a})`
      if (kind === 'green') return `rgba(0,140,90,${a})`
      return `rgba(110,112,114,${a})`
    }

    resize()
    initParticles()
    window.addEventListener('resize', () => { resize(); initParticles() })

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Islamic-inspired hex dot grid
      const gs = 46
      ctx.fillStyle = 'rgba(150,113,38,0.04)'
      for (let x = 0; x < W + gs; x += gs) {
        const offset = (Math.floor(x / gs) % 2) * (gs / 2)
        for (let y = offset; y < H + gs; y += gs) {
          ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Node network
      const iv = intensity
      state.current.nodes.forEach((n, i) => {
        state.current.nodes.slice(i + 1).forEach(m => {
          const d = Math.hypot(n.x - m.x, n.y - m.y)
          if (d < 130) {
            ctx.strokeStyle = `rgba(150,113,38,${(1 - d / 130) * 0.055 * iv})`
            ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke()
          }
        })
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(150,113,38,0.16)'; ctx.fill()
      })

      // Particles
      state.current.particles.forEach((p, idx) => {
        p.x += p.vx * iv; p.y += p.vy * iv; p.life++
        const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.8

        if (p.kind === 'gold') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5)
          g.addColorStop(0, `rgba(190,150,55,${a * 0.5})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fill()
        }

        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = col(p.kind, a); ctx.fill()

        if (p.kind !== 'gray') {
          ctx.beginPath(); ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 14, p.y - p.vy * 14)
          ctx.strokeStyle = col(p.kind, a * 0.3)
          ctx.lineWidth = p.size * 0.6; ctx.stroke()
        }

        state.current.nodes.forEach(n => {
          const d = Math.hypot(p.x - n.x, p.y - n.y)
          if (d < 75) {
            ctx.strokeStyle = col(p.kind, (1 - d / 75) * a * 0.35)
            ctx.lineWidth = 0.35
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke()
          }
        })

        if (p.life >= p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          state.current.particles[idx] = newParticle()
        }
      })

      anim.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(anim.current); window.removeEventListener('resize', resize) }
  }, [intensity])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

/* ═══════════════════════════════════════════════════════
   LOGO ICON
═══════════════════════════════════════════════════════ */
const LogoIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9Z" stroke={C.bronze} strokeWidth="1.2" fill="none" />
    <path d="M16 2 L16 30" stroke={C.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <path d="M4 9 L28 23" stroke={C.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <path d="M4 23 L28 9" stroke={C.bronze} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 3" />
    <circle cx="16" cy="16" r="3.5" fill={C.bronze} fillOpacity="0.82" />
    <circle cx="16" cy="7" r="1.5" fill={C.green} />
    <circle cx="23" cy="21" r="1.4" fill={C.bronze} fillOpacity="0.55" />
    <circle cx="9" cy="21" r="1.4" fill={C.grayL} fillOpacity="0.7" />
  </svg>
)

/* ═══════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════ */
const Badge = ({ type }) => {
  const m = {
    ready: { l: 'جاهز للعرض', c: C.greenXL, bg: `${C.green}22`, bdr: `${C.green}40` },
    updating: { l: 'قيد التحديث', c: C.bronzeXL, bg: `${C.bronze}18`, bdr: `${C.bronze}40` },
    soon: { l: 'قريباً', c: C.grayL, bg: 'rgba(120,122,123,0.15)', bdr: 'rgba(120,122,123,0.3)' },
  }
  const s = m[type] || m.soon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: s.bg, color: s.c, border: `1px solid ${s.bdr}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c, animation: type === 'ready' ? 'cl-dotBlink 2s infinite' : 'none' }} />
      {s.l}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
function Navbar({ scrolled, navigate }) {
  const [mOpen, setMOpen] = useState(false)
  const scrollToSection = (linkText) => {
    const sectionMap = {
      'عن المنصة': 'aboutSection',
      'الأسئلة الشائعة': 'faqSection',
      'تواصل معنا': 'contactSection'
    }
    const sectionId = sectionMap[linkText]
    if (sectionId) {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80 // navbar height
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        setMOpen(false) // close mobile menu
      }
    }
  }
  const base = {
    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
  }
  return (
    <nav style={{
      position: 'fixed', top: 0, right: 0, left: 0, zIndex: 200,
      background: scrolled ? `${C.charcoalD}` : 'transparent',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div
        style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '0 24px',
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left (Logo) - fixed column */}
        <div style={{ width: 220, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img src="/WhitePEP.png" alt="Logo" style={{ height: 80, width: 'auto', display: 'block' }} />
          </div>
        </div>

        {/* Center (Desktop links) - true center */}
        <div
          className="cl-nav-desktop"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
          }}
        >
          {['عن المنصة', 'الأسئلة الشائعة', 'تواصل معنا'].map((l) => (
            <a
              key={l}
              href="#"
              className="cl-nav-link"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection(l)
              }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Right (CTA) - same width as left */}
        <div
          className="cl-hide-mobile"
          style={{ width: 220, display: 'flex', justifyContent: 'flex-end', gap: 10 }}
        >
          <button
            className="cl-btn-primary"
            onClick={() => navigate('/touchpoints')}
            style={{
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: '8px 22px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              background: `linear-gradient(135deg,${C.green},${C.greenL})`,
              color: 'white',
              border: 'none',
              boxShadow: `0 4px 16px ${C.green}45`,
            }}
          >
            ابدأ الآن
          </button>
        </div>


        {/* Mobile toggle */}
        <button
          type="button"
          className="cl-mobile-btn"
          onClick={() => setMOpen(o => !o)}
          aria-label={mOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mOpen}
          aria-controls="mobile-menu"
          style={{
            ...base,
            background: "transparent",
            border: "none",
            padding: 10,              // hit area أكبر
            borderRadius: 12,
            display: "inline-flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            transition: "transform 120ms ease, background 160ms ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {[0, 1, 2].map((i) => {
            const isTop = i === 0;
            const isMid = i === 1;
            const isBot = i === 2;

            const common = {
              width: 22,
              height: 2,
              background: C.cream,
              display: "block",
              borderRadius: 999,
              transformOrigin: "center",
              transition: "transform 220ms ease, opacity 180ms ease",
            };

            const openStyle = isTop
              ? { transform: "translateY(8px) rotate(45deg)" }
              : isBot
                ? { transform: "translateY(-8px) rotate(-45deg)" }
                : { opacity: 0, transform: "scaleX(0.8)" };

            return (
              <span
                key={i}
                style={{
                  ...common,
                  ...(mOpen ? openStyle : { opacity: 1, transform: "none" }),
                }}
              />
            );
          })}
        </button>
      </div>

      {/* Mobile drawer */}
      {mOpen && (
        <div style={{ background: `${C.charcoalD}`, backdropFilter: 'blur(18px)', padding: '18px 24px 24px' }}>
          {['عن المنصة', 'الأسئلة الشائعة', 'تواصل معنا'].map(l => (
            <a
              key={l}
              href="#"
              className="cl-nav-link"
              style={{ display: 'block', marginBottom: 16, fontSize: 15 }}
              onClick={(e) => {
                e.preventDefault()
                scrollToSection(l)
              }}
            >
              {l}
            </a>))}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={() => navigate('/touchpoints')} style={{ flex: 1, padding: '10px', background: C.green, color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>ابدأ الآن</button>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
/* ─── Drop your video file in /public and pass the filename as videoSrc ─── */
function HeroVideo({ src }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true          // must set muted in JS for iOS Safari
    video.play().catch(() => { })  // silently ignore if browser still blocks
  }, [src])

  return (
    <video
      ref={videoRef}
      key={src}
      autoPlay muted loop playsInline
      preload="auto"            // ← tell browser to load immediately
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        pointerEvents: 'none',
        filter: 'brightness(0.45) saturate(0.7)',
      }}>
      {src.endsWith('.webm')
        ? <source src={src} type="video/webm" />
        : src.endsWith('.mp4')
          ? <source src={src} type="video/mp4" />
          : <source src={src} />
      }
    </video>
  )
}

function Hero({ navigate, videoSrc }) {
  const [scrollY, setScrollY] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const intensity = hovered ? 1.7 : Math.max(0.55, 1 - scrollY / 500)

  const stats = [
    { val: 25, suf: '+', label: 'نقطة اتصال', c: C.bronzeXL },
    { val: 18, suf: 'م', label: 'معتمر سنوياً', c: C.greenXL },
    { val: 99, suf: '%', label: 'دقة التحليل', c: C.bronzeL },
  ]

  const btn = {
    fontFamily: 'inherit', cursor: 'pointer', border: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }

  return (
    <section
      id="aboutSection"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        /* fallback gradient shown while video loads, or when no video provided */
        background: `linear-gradient(160deg,${C.charcoalD} 0%,${C.charcoalM} 55%,#1c2620 100%)`,
      }}>

      {/* ── Video layer (bottommost) ── */}
      {videoSrc && <HeroVideo src={videoSrc} />}

      {/* ── Extra dark scrim when video is present so text stays sharp ── */}
      {videoSrc && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'rgba(10,9,9,0.42)',
        }} />
      )}

      {/* ── Particle canvas (sits above video) ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <HeroCanvas intensity={intensity} />
      </div>

      {/* ── Vignettes ── */}
      <div style={{ position: 'absolute', top: 0, insetInline: 0, height: 220, background: `linear-gradient(to bottom,${C.charcoalD},transparent)`, pointerEvents: 'none', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 0, insetInline: 0, height: 240, background: `linear-gradient(to top,${C.charcoalD},transparent)`, pointerEvents: 'none', zIndex: 3 }} />

      {/* ── Decorative angled lines ── */}
      <div style={{ position: 'absolute', top: '18%', right: '-4%', width: 1, height: '55%', background: `linear-gradient(to bottom,transparent,${C.bronze}45,transparent)`, transform: 'rotate(-11deg)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: '24%', right: '9%', width: 1, height: '42%', background: `linear-gradient(to bottom,transparent,${C.bronze}20,transparent)`, transform: 'rotate(-11deg)', zIndex: 3 }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 800, padding: '0 24px', transform: `translateY(${-scrollY * 0.18}px)` }}>
        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(30px,5.8vw,60px)",
            fontWeight: 900,
            lineHeight: 1.18,
            color: C.cream,
            marginBottom: 12,
            animation: "cl-fadeInUp 0.85s ease 0.15s both",
            letterSpacing: -0.4,
          }}
        >
          <span className="cl-shimmer-text" >الطاقة الاستيعابية</span>
          <br />
          <span style={{ fontSize: "0.9em", fontWeight: 800, opacity: 0.95 }}>
            لضيوف الرحمن
          </span>
        </h1>

        {/* EN subtitle */}
        <p style={{ fontSize: 12, color: C.bronze, letterSpacing: 3.5, fontWeight: 600, marginBottom: 22, textTransform: 'uppercase', animation: 'cl-fadeInUp 0.85s ease 0.28s both' }}>
          Touchpoints Analytics Platform
        </p>

        {/* Description */}
        <p style={{ fontSize: 'clamp(13.5px,1.8vw,16.5px)', color: C.grayL, lineHeight: 2, maxWidth: 580, margin: '0 auto 40px', fontWeight: 400, animation: 'cl-fadeInUp 0.85s ease 0.38s both' }}>
          منصة متكاملة لقياس وتحليل الطاقة الاستيعابية الآمنة عبر نقاط الاتصال الحيوية في مكة المكرمة والمدينة المنورة والمنافذ والمطارات، لدعم القرار التشغيلي وضمان جاهزية الخدمات.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', animation: 'cl-fadeInUp 0.85s ease 0.48s both' }}>
          <button className="cl-btn-primary" onClick={() => navigate('/touchpoints')} style={{ ...btn, padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 800, background: `linear-gradient(135deg,${C.green},${C.greenL})`, color: 'white', boxShadow: `0 8px 28px ${C.green}52` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 36px ${C.green}68` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 28px ${C.green}52` }}>
            ابدأ الآن
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 56, flexWrap: 'wrap', animation: 'cl-fadeInUp 0.85s ease 0.6s both' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: s.c, lineHeight: 1 }}>
                <Counter target={s.val} suffix={s.suf} />
              </div>
              <div style={{ fontSize: 15, color: C.gray, marginTop: 8.5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 10, opacity: scrollY > 60 ? 0 : 1, transition: 'opacity 0.3s' }}>
        <span style={{ fontSize: 11, color: C.gray, letterSpacing: 2, textTransform: 'uppercase' }}>استكشف</span>
        <div style={{ width: 1.5, height: 36, background: `linear-gradient(to bottom,${C.bronze}75,transparent)` }} />
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   OVERVIEW CARDS
═══════════════════════════════════════════════════════ */
function OverviewCards() {
  const cards = [
    {
      svg: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 2L22 7.5V18.5L13 24L4 18.5V7.5Z" stroke={C.bronze} strokeWidth="1.4" fill={`${C.bronze}12`} /><circle cx="13" cy="13" r="3.5" fill={C.bronze} fillOpacity=".7" /><circle cx="13" cy="6" r="1.4" fill={C.bronze} /><circle cx="19" cy="17" r="1.4" fill={C.bronze} fillOpacity=".5" /><circle cx="7" cy="17" r="1.4" fill={C.bronze} fillOpacity=".5" /></svg>,
      title: 'الطاقة الاستيعابية الآمنة', en: 'Safe Capacity', accent: C.bronze,
      desc: 'تحديد الحدود الآمنة لكل نقطة اتصال بناءً على معايير تشغيلية معتمدة ومتطلبات الجاهزية.',
    },
    {
      svg: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M2 17 Q6 9 11 12 Q16 15 21 7 L24 7" stroke={C.green} strokeWidth="2" strokeLinecap="round" fill="none" /><circle cx="11" cy="12" r="2.4" fill={C.green} fillOpacity=".7" /><circle cx="21" cy="7" r="2.4" fill={C.green} /><path d="M2 21 L24 21" stroke={`${C.green}28`} strokeWidth="1" strokeDasharray="3 3" /></svg>,
      title: 'تغطية شاملة عبر جميع نقاط الاتصال', en: 'Flow & Operational Pressure', accent: C.green,
      desc: 'عرض موحّد يغطي جميع نقاط الاتصال، مع مؤشرات رئيسية تساعد على رصد الفجوات عبر المواسم.',
    },
    {
      svg: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 2L24 21H2Z" stroke={C.bronzeXL} strokeWidth="1.4" fill={`${C.bronzeXL}10`} strokeLinejoin="round" /><line x1="13" y1="9" x2="13" y2="16" stroke={C.bronzeXL} strokeWidth="2.5" strokeLinecap="round" /><circle cx="13" cy="19" r="1.5" fill={C.bronzeXL} /></svg>,
      title: 'مؤشرات المخاطر والتنبيه', en: 'Risk & Alert Indicators', accent: C.bronzeXL,
      desc: 'نظام متكامل للتنبيه المبكر يرصد تجاوز الطاقة ويُنبّه متخذي القرار قبل وقوع الأزمات.',
    },
    {
      svg: <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="2" y="13" width="6" height="10" rx="2" fill={C.green} fillOpacity=".7" /><rect x="10" y="8" width="6" height="15" rx="2" fill={C.bronze} fillOpacity=".7" /><rect x="18" y="4" width="6" height="19" rx="2" fill={C.gray} fillOpacity=".5" /><line x1="1" y1="23" x2="25" y2="23" stroke={`${C.gray}35`} strokeWidth="1" /></svg>,
      title: 'مقارنة متعددة المواقع', en: 'Multi-Site Comparison', accent: C.grayL,
      desc: 'مقارنة شاملة بين مكة والمدينة والمنافذ البرية والجوية ضمن لوحة تحليلية موحدة.',
    },
  ]

  return (
    <section style={{ background: `linear-gradient(180deg,${C.charcoalD},${C.charcoalM})`, padding: '82px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="cl-reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 11, color: C.bronze, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 14 }}>ما تقدمه المنصة</div>
          <h2 style={{ fontSize: 'clamp(22px,3.8vw,36px)', fontWeight: 900, color: C.cream, lineHeight: 1.2 }}>تحليل متكامل وشامل</h2>
          <div style={{ width: 44, height: 2.5, background: `linear-gradient(90deg,${C.bronze},transparent)`, margin: '16px auto 0', borderRadius: 2 }} />
        </div>

        <div className="cl-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
          {cards.map((c, i) => (
            <div key={i} className="cl-card cl-reveal-child" style={{ background: 'rgba(255,255,255,0.028)', border: `1px solid rgba(255,255,255,0.065)`, borderTop: `2.5px solid ${c.accent}55`, borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: `${c.accent}10`, border: `1px solid ${c.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {c.svg}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: C.cream, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>{c.en}</div>
              <div style={{ fontSize: 13, color: C.grayL, lineHeight: 1.9, marginBottom: 5 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   TOUCHPOINTS
═══════════════════════════════════════════════════════ */
function Touchpoints() {

}

/* ═══════════════════════════════════════════════════════
   METHODOLOGY
═══════════════════════════════════════════════════════ */
function Methodology() {
  const steps = [
    {
      num: '01', title: 'تحديد نقطة الاتصال',
      desc: 'اختيار الموقع التشغيلي وتحديد نطاق التحليل الجغرافي والزمني.',
      svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="9" stroke={C.bronze} strokeWidth="1.4" fill="none" /><circle cx="14" cy="14" r="4.5" fill={C.bronze} fillOpacity=".28" /><circle cx="14" cy="14" r="1.8" fill={C.bronze} /><line x1="14" y1="3" x2="14" y2="7" stroke={C.bronze} strokeWidth="1.5" strokeLinecap="round" /><line x1="14" y1="21" x2="14" y2="25" stroke={C.bronze} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="14" x2="7" y2="14" stroke={C.bronze} strokeWidth="1.5" strokeLinecap="round" /><line x1="21" y1="14" x2="25" y2="14" stroke={C.bronze} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
    {
      num: '02', title: 'إدخال البيانات',
      desc: 'ربط البيانات التشغيلية والمعايير الآمنة المعتمدة من الجهات المختصة.',
      svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="5" y="5" width="18" height="18" rx="3" stroke={C.green} strokeWidth="1.4" fill="none" /><line x1="9" y1="11" x2="19" y2="11" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" /><line x1="9" y1="15" x2="16" y2="15" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" /><line x1="9" y1="19" x2="13" y2="19" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" /><circle cx="22" cy="22" r="4.5" fill={C.green} /><line x1="20" y1="22" x2="24" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><line x1="22" y1="20" x2="22" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
    {
      num: '03', title: 'عرض التحليل',
      desc: 'توليد تصورات تفاعلية ومؤشرات فورية تدعم القرار التشغيلي.',
      svg: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="5" width="22" height="14" rx="3" stroke={C.bronzeXL} strokeWidth="1.4" fill="none" /><path d="M7 16 L10 11 L14 14 L18 8 L21 12" stroke={C.bronzeXL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><line x1="11" y1="19" x2="17" y2="19" stroke={C.bronzeXL} strokeWidth="2" strokeLinecap="round" /><line x1="14" y1="19" x2="14" y2="23" stroke={C.bronzeXL} strokeWidth="1.5" strokeLinecap="round" /><line x1="9" y1="23" x2="19" y2="23" stroke={C.bronzeXL} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
  ]

  return (
    <section style={{ background: C.charcoalD, padding: '82px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="cl-reveal cl-method-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Text */}
          <div>
            <div style={{ fontSize: 11, color: C.bronze, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 14 }}>المنهجية</div>
            <h2 style={{ fontSize: 'clamp(20px,3.2vw,32px)', fontWeight: 900, color: C.cream, lineHeight: 1.35, marginBottom: 20 }}>
              منهجية علمية<br /><span style={{ color: C.bronzeXL }}>معتمدة رسمياً</span>
            </h2>
            <p style={{ fontSize: 13.5, color: C.grayL, lineHeight: 2, marginBottom: 26 }}>
              يعتمد التحليل على افتراضات الطاقة الاستيعابية الآمنة المصدّق عليها من وزارة الحج والعمرة والجهات التشغيلية المعنية، إلى جانب معاملات تشغيلية محدّثة تعكس الواقع الفعلي لكل موسم.
            </p>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.bronze, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'gap 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.gap = '13px'}
              onMouseLeave={e => e.currentTarget.style.gap = '8px'}>
              اطّلع على وثيقة المنهجية الكاملة <span>←</span>
            </a>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => (
              <div key={i} className="cl-step" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.028)', border: `1px solid rgba(255,255,255,0.065)` }}>
                <div style={{ width: 50, height: 50, flexShrink: 0, borderRadius: 12, background: `${C.bronze}0E`, border: `1px solid ${C.bronze}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.svg}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.bronze, fontWeight: 800 }}>{s.num}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: C.cream }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.grayL, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   CTA BANNER
═══════════════════════════════════════════════════════ */
function CTABanner({ navigate }) {
  const btn = {
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
  };

  return (
    <>
      {/* FAQ Section */}
      <section className="faq-section" id="faqSection" style={{ background: C.charcoalM, padding: '82px 24px' }}>
        <div className="container mx-auto px-4">
          <h2 style={{ fontSize: 'clamp(22px,3.8vw,36px)', fontWeight: 900, color: C.cream, lineHeight: 1.2, textAlign: 'center' }}>الأسئلة الشائعة</h2>
          <div style={{ width: 44, height: 2.5, background: `linear-gradient(90deg,${C.bronze},transparent)`, margin: '16px auto 0', borderRadius: 2, marginBottom: 25 }} />
          <div className="faq-wrapper">
            <FAQ language="ar" />
          </div>
        </div>
      </section >
    </>
  );
}



/* ═══════════════════════════════════════════════════════
   GLASS MODAL
═══════════════════════════════════════════════════════ */
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
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(150,113,38,0.1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cl-fadeInUp 0.28s ease',
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
          pointerEvents: 'none',
          borderRadius: '50%',
          transform: 'translate(40%, 40%)',
        }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer({ navigate }) {
  const [activeModal, setActiveModal] = useState(null)

  const MAILTO_SUBJECT = encodeURIComponent('تواصل عبر منصة تحليل الطاقة الاستيعابية')
  const MAILTO_BODY = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته،\n\nأتواصل معكم عبر منصة تحليل الطاقة الاستيعابية بخصوص:\n\n[اكتب رسالتك هنا]\n\nبيانات التواصل:\nالاسم: \nالجهة: \nرقم الجوال: \n\nشكراً لكم،\nتحياتي`
  )

  const handleLink = (label) => {
    if (label === 'عن المنصة') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (label === 'الأسئلة الشائعة') {
      const el = document.getElementById('faqSection')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
   ROOT
═══════════════════════════════════════════════════════ */
export default function CapacityLanding() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    injectStyles()
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const target = location.state?.scrollTo
    if (!target) return
    const timer = setTimeout(() => {
      const el = document.getElementById(target)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(timer)
  }, [location.state])
  useReveal()

  return (
    <div className="cl-root">
      <Navbar scrolled={scrolled} navigate={navigate} />
      <Hero navigate={navigate} videoSrc="/herovideo.mp4" />
      <OverviewCards />
      <Touchpoints />
      <Methodology />
      <CTABanner navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  )
}