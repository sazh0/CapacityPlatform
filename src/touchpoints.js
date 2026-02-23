// ═══════════════════════════════════════════════════════
//  TOUCHPOINTS — Single source of truth
//  Fields: id, title, city, section, subsection, icon, route, tags[]
// ═══════════════════════════════════════════════════════

export const SECTIONS = [
  {
    id: 'first-impression',
    title: 'الانطباع الأول',
    titleEn: 'First Impression',
    desc: 'نقاط الدخول والوصول إلى المملكة',
    icon: '✈️',
    accent: '#38BDF8',   // sky blue
    accentDim: 'rgba(56,189,248,0.12)',
    accentBdr: 'rgba(56,189,248,0.22)',
  },
  {
    id: 'nusuk-performance',
    title: 'أداء النسك',
    titleEn: 'Nusuk Performance',
    desc: 'تجربة أداء المناسك والعبادة في الحرمين',
    icon: '🕌',
    accent: '#A78BFA',   // violet
    accentDim: 'rgba(167,139,250,0.12)',
    accentBdr: 'rgba(167,139,250,0.22)',
  },
  {
    id: 'city-experience',
    title: 'تجربة مكة والمدينة',
    titleEn: 'City Experience',
    desc: 'جودة الإقامة والخدمات الفندقية والإيواء',
    icon: '🏙️',
    accent: '#34D399',   // emerald
    accentDim: 'rgba(52,211,153,0.12)',
    accentBdr: 'rgba(52,211,153,0.22)',
  },
  {
    id: 'support-services',
    title: 'الخدمات المساعدة',
    titleEn: 'Support Services',
    desc: 'البنية التحتية والخدمات الأساسية المساندة',
    icon: '⚡',
    accent: '#FBBF24',   // amber
    accentDim: 'rgba(251,191,36,0.12)',
    accentBdr: 'rgba(251,191,36,0.22)',
  },
]

export const TOUCHPOINTS = [
  // ──────────────────────────────────────────────
  //  Section 1 — الانطباع الأول
  // ──────────────────────────────────────────────
  { id: 'apt-jed', title: 'مطار جدة', city: 'جدة', section: 'first-impression', subsection: 'المطارات', icon: '✈️', route: '/touchpoints/first-impression/airports/apt-jed', tags: ['مطار', 'جدة', 'منفذ جوي'] },
  { id: 'apt-med', title: 'مطار المدينة', city: 'المدينة', section: 'first-impression', subsection: 'المطارات', icon: '✈️', route: '/touchpoints/first-impression/airports/apt-med', tags: ['مطار', 'المدينة', 'منفذ جوي'] },
  { id: 'apt-tif', title: 'مطار الطائف', city: 'الطائف', section: 'first-impression', subsection: 'المطارات', icon: '✈️', route: '/touchpoints/first-impression/airports/apt-tif', tags: ['مطار', 'الطائف', 'منفذ جوي'] },
  { id: 'apt-ynb', title: 'مطار ينبع', city: 'ينبع', section: 'first-impression', subsection: 'المطارات', icon: '✈️', route: '/touchpoints/first-impression/airports/apt-ynb', tags: ['مطار', 'ينبع', 'منفذ جوي'] },

  { id: 'brd-salwa', title: 'منفذ سلوى', city: 'الشرقية', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-salwa', tags: ['منفذ', 'بري', 'الشرقية'] },
  { id: 'brd-kfhd', title: 'جسر الملك فهد', city: 'الشرقية', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🌉', route: '/touchpoints/first-impression/borders/brd-kfhd', tags: ['منفذ', 'جسر', 'البحرين'] },
  { id: 'brd-bathh', title: 'منفذ البطحاء', city: 'الشرقية', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-bathh', tags: ['منفذ', 'بري'] },
  { id: 'brd-hadtha', title: 'منفذ الحديثة', city: 'تبوك', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-hadtha', tags: ['منفذ', 'بري', 'تبوك'] },
  { id: 'brd-khdra', title: 'منفذ الخضراء', city: 'تبوك', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-khdra', tags: ['منفذ', 'بري', 'تبوك'] },
  { id: 'brd-khafji', title: 'منفذ الخفجي', city: 'الشرقية', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-khafji', tags: ['منفذ', 'بري'] },
  { id: 'brd-dorra', title: 'منفذ الدرة', city: 'الشرقية', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-dorra', tags: ['منفذ', 'بري'] },
  { id: 'brd-rubk', title: 'منفذ الربع الخالي', city: 'نجران', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-rubk', tags: ['منفذ', 'بري', 'نجران'] },
  { id: 'brd-ruq', title: 'منفذ الرقعي', city: 'الأحساء', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-ruq', tags: ['منفذ', 'بري'] },
  { id: 'brd-wadia', title: 'منفذ الوديعة', city: 'نجران', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-wadia', tags: ['منفذ', 'بري', 'اليمن'] },
  { id: 'brd-ararar', title: 'منفذ جديدة عرعر', city: 'عرعر', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-ararar', tags: ['منفذ', 'بري', 'عرعر'] },
  { id: 'brd-hamar', title: 'منفذ حالة عمار', city: 'تبوك', section: 'first-impression', subsection: 'المنافذ البرية', icon: '🛂', route: '/touchpoints/first-impression/borders/brd-hamar', tags: ['منفذ', 'بري', 'الأردن'] },

  // ──────────────────────────────────────────────
  //  Section 2 — أداء النسك
  // ──────────────────────────────────────────────
  { id: 'mak-prayer', title: 'الصلاة', city: 'مكة', section: 'nusuk-performance', subsection: 'مكة المكرمة', icon: '🕋', route: '/touchpoints/nusuk-performance/makkah/prayer', tags: ['مكة', 'صلاة', 'حرم'] },
  { id: 'mak-mataf', title: 'المطاف', city: 'مكة', section: 'nusuk-performance', subsection: 'مكة المكرمة', icon: '🌀', route: '/touchpoints/nusuk-performance/makkah/mataf', tags: ['مكة', 'طواف', 'كعبة'] },
  { id: 'mak-masaa', title: 'المسعى', city: 'مكة', section: 'nusuk-performance', subsection: 'مكة المكرمة', icon: '🏃', route: '/touchpoints/nusuk-performance/makkah/masaa', tags: ['مكة', 'سعي', 'صفا', 'مروة'] },
  { id: 'med-prayer', title: 'الصلاة', city: 'المدينة', section: 'nusuk-performance', subsection: 'المدينة المنورة', icon: '🕌', route: '/touchpoints/nusuk-performance/madinah/prayer', tags: ['المدينة', 'صلاة', 'حرم'] },

  // ──────────────────────────────────────────────
  //  Section 3 — تجربة مكة والمدينة
  // ──────────────────────────────────────────────
  { id: 'mak-housing', title: 'مكة — الإيواء', city: 'مكة', section: 'city-experience', subsection: 'الإيواء', icon: '🏨', route: '/dashboard', tags: ['مكة', 'إيواء', 'فنادق', 'سكن'] },
  { id: 'med-housing', title: 'المدينة — الإيواء', city: 'المدينة', section: 'city-experience', subsection: 'الإيواء', icon: '🏨', route: '/dashboardd', tags: ['المدينة', 'إيواء', 'فنادق', 'سكن'] },

  // ──────────────────────────────────────────────
  //  Section 4 — الخدمات المساعدة
  // ──────────────────────────────────────────────
  { id: 'mak-water', title: 'مكة — المياه', city: 'مكة', section: 'support-services', subsection: 'المياه', icon: '💧', route: '/touchpoints/support/water/makkah', tags: ['مكة', 'مياه', 'شبكة'] },
  { id: 'med-water', title: 'المدينة — المياه', city: 'المدينة', section: 'support-services', subsection: 'المياه', icon: '💧', route: '/touchpoints/support/water/madinah', tags: ['المدينة', 'مياه', 'شبكة'] },
  { id: 'mak-power', title: 'مكة — الطاقة', city: 'مكة', section: 'support-services', subsection: 'الكهرباء والطاقة', icon: '⚡', route: '/touchpoints/support/power/makkah', tags: ['مكة', 'كهرباء', 'طاقة'] },
  { id: 'med-power', title: 'المدينة — الطاقة', city: 'المدينة', section: 'support-services', subsection: 'الكهرباء والطاقة', icon: '⚡', route: '/touchpoints/support/power/madinah', tags: ['المدينة', 'كهرباء', 'طاقة'] },
  { id: 'mak-telecom', title: 'مكة — الاتصالات', city: 'مكة', section: 'support-services', subsection: 'الاتصالات', icon: '📡', route: '/touchpoints/support/telecom/makkah', tags: ['مكة', 'اتصالات', 'شبكة'] },
  { id: 'med-telecom', title: 'المدينة — الاتصالات', city: 'المدينة', section: 'support-services', subsection: 'الاتصالات', icon: '📡', route: '/touchpoints/support/telecom/madinah', tags: ['المدينة', 'اتصالات', 'شبكة'] },
  { id: 'mak-health', title: 'مكة — الخدمات الطبية', city: 'مكة', section: 'support-services', subsection: 'الخدمات الطبية', icon: '🏥', route: '/touchpoints/support/health/makkah', tags: ['مكة', 'طبي', 'صحة', 'مستشفى'] },
  { id: 'med-health', title: 'المدينة — الخدمات الطبية', city: 'المدينة', section: 'support-services', subsection: 'الخدمات الطبية', icon: '🏥', route: '/touchpoints/support/health/madinah', tags: ['المدينة', 'طبي', 'صحة', 'مستشفى'] },
]

// City → accent colour map
export const CITY_COLORS = {
  'مكة': { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
  'المدينة': { bg: 'rgba(52,211,153,0.10)', color: '#34D399', border: 'rgba(52,211,153,0.22)' },
  'جدة': { bg: 'rgba(56,189,248,0.10)', color: '#38BDF8', border: 'rgba(56,189,248,0.22)' },
  'الطائف': { bg: 'rgba(251,191,36,0.10)', color: '#FBBF24', border: 'rgba(251,191,36,0.22)' },
  'ينبع': { bg: 'rgba(251,191,36,0.10)', color: '#FBBF24', border: 'rgba(251,191,36,0.22)' },
  'الشرقية': { bg: 'rgba(248,113,113,0.10)', color: '#F87171', border: 'rgba(248,113,113,0.22)' },
  'تبوك': { bg: 'rgba(180,113,38,0.12)', color: '#D4AA52', border: 'rgba(212,170,82,0.25)' },
  'نجران': { bg: 'rgba(180,113,38,0.12)', color: '#D4AA52', border: 'rgba(212,170,82,0.25)' },
  'الأحساء': { bg: 'rgba(180,113,38,0.12)', color: '#D4AA52', border: 'rgba(212,170,82,0.25)' },
  'عرعر': { bg: 'rgba(180,113,38,0.12)', color: '#D4AA52', border: 'rgba(212,170,82,0.25)' },
}

export const QUICK_FILTERS = [
  { id: 'all', label: 'الكل', icon: '✦' },
  { id: 'makkah', label: 'مكة', icon: '🕋', match: t => t.city === 'مكة' },
  { id: 'madinah', label: 'المدينة', icon: '🕌', match: t => t.city === 'المدينة' }
]

// Get unique subsections for a given section id
export function getSubsections(sectionId) {
  const seen = new Set()
  return TOUCHPOINTS
    .filter(t => t.section === sectionId)
    .reduce((acc, t) => {
      if (!seen.has(t.subsection)) { seen.add(t.subsection); acc.push(t.subsection) }
      return acc
    }, [])
}
