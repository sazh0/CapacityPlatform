import React, { useState, useRef, useCallback, useEffect } from "react";
import "./faq.css";

/* ─────────────────────────────────────────
   Default FAQ data — now with categories
───────────────────────────────────────── */
const DEFAULT_FAQ_AR = [
  {
    f_id: 1,
    f_category: "أساسيات",
    f_question: "ما المقصود بالطاقة الاستيعابية؟",
    f_answer:
      "هي الحدّ الآمن للقدرة التشغيلية لنقطة الاتصال خلال فترة زمنية محددة، أي أقصى حجم يمكن استيعابه (أشخاص/حركات/خدمات) دون التأثير على السلامة أو جودة الخدمة. تُستخدم لمقارنة الطاقة المتاحة بالمستهدفات المتوقعة وتحديد الفجوة بين العرض والطلب.",
  },
  {
    f_id: 2,
    f_category: "أساسيات",
    f_question: "ما الفرق بين المستهدفات (Demand) والطاقة الاستيعابية (Supply)؟",
    f_answer:
      "المستهدفات هي العدد المتوقع من الزوار (معتمرون من الخارج + معتمرون من الداخل) الذين يحتاجون إيواء. الطاقة الاستيعابية هي عدد الأسرّة المتوفرة. الفجوة (Gap) = المستهدفات - الطاقة. إذا كانت موجبة → عجز، إذا كانت سالبة → فائض.",
  },
  {
    f_id: 3,
    f_category: "المؤشرات",
    f_question: "كيف أفهم الرسم البياني (تحليل الفجوة التفصيلي)؟",
    f_answer:
      "الخط الأحمر = المستهدفات (الطلب)، الخط الأخضر = الطاقة الاستيعابية (العرض). المنطقة الحمراء = عجز (الطلب أكبر)، المنطقة الخضراء = فائض (العرض أكبر). مرّر الفأرة على أي نقطة لرؤية التاريخ والقيم التفصيلية. الأيام المظللة بـ 🌙 = رمضان، 🕋 = حج.",
  },
  {
    f_id: 4,
    f_category: "المؤشرات",
    f_question: "ما معنى نسبة أيام العجز؟",
    f_answer:
      "هي النسبة المئوية لعدد الأيام التي يتجاوز فيها الطلب الطاقة المتاحة (فجوة موجبة) من إجمالي أيام الفترة المحللة. مثلاً: إذا كانت 35%، فهذا يعني أن ثلث أيام السنة تشهد عجزاً في الطاقة الاستيعابية.",
  },
  {
    f_id: 5,
    f_category: "المؤشرات",
    f_question: "ماذا يعني متوسط المستهدفات اليومية؟",
    f_answer:
      "هو متوسط عدد الزوار الذين يحتاجون إيواء في اليوم الواحد خلال الفترة المختارة. يُحسب من مجموع الطلب اليومي (خارج + داخل) مقسوماً على عدد الأيام. يُعرض في البطاقة الأولى من المؤشرات الرئيسية.",
  },
  {
    f_id: 6,
    f_category: "أساسيات",
    f_question: "ما الفرق بين (المرافق المرخصة) و (المشاريع المستقبلية)؟",
    f_answer:
      "المرافق المرخصة (Licensed) = الطاقة الحالية المتاحة فعلياً. المشاريع المستقبلية (Future) = طاقة إضافية متوقعة من مشاريع تحت الإنشاء أو التخطيط. مساكن الحجاج (Hajj) = طاقة موسمية خاصة بفترة الحج. يمكن تفعيل/تعطيل كل منها من شريط السيناريو.",
  },
  {
    f_id: 7,
    f_category: "استخدام المنصة",
    f_question: "كيف أختار سنة محددة أو عدة سنوات للتحليل؟",
    f_answer:
      "في أعلى الصفحة، ستجد أزرار السنوات (2026-2030). اضغط على سنة واحدة لتحليل تلك السنة فقط، أو اضغط على عدة سنوات لتحليل مجمّع. زر (الكل) يختار جميع السنوات معاً. السنوات المختارة تظهر بلون برونزي مميز.",
  },
  {
    f_id: 8,
    f_category: "استخدام المنصة",
    f_question: "ما الفرق بين نطاق (كل الفترات) و (السنة فقط)؟",
    f_answer:
      "نطاق السيناريو يحدد أين تُطبّق التعديلات. (كل الفترات) = التعديلات تشمل جميع السنوات. (السنة فقط) = التعديلات تُطبّق فقط على السنة المختارة. مفيد عند دراسة تأثير تغيير محدد في سنة واحدة دون المساس بباقي البيانات.",
  },
  {
    f_id: 9,
    f_category: "المؤشرات",
    f_question: "ماذا تعني (نسبة العجز الموسمي)؟",
    f_answer:
      "مخطط دائري يوضح نسبة أيام العجز في 3 فترات: رمضان (بنفسجي)، الحج (أصفر)، وباقي السنة (برونزي). يساعد على معرفة أي الفترات تشهد ضغطاً أكبر. مثلاً: إذا كانت نسبة رمضان 80% فهذا يعني معظم أيام رمضان تشهد عجزاً.",
  },
  {
    f_id: 10,
    f_category: "استخدام المنصة",
    f_question: "كيف أستخدم فلتر (تركيبة الطلب)؟",
    f_answer:
      "اختر شهراً محدداً من القائمة المنسدلة لرؤية نسبة (خارج/داخل) لذلك الشهر فقط، أو اضغط زر 🌙 رمضان لرؤية التركيبة خلال رمضان. زر (✕) يعيد العرض لكل الأشهر. يساعد على فهم من أين يأتي الضغط في كل فترة.",
  },
  {
    f_id: 11,
    f_category: "التقارير والدعم",
    f_question: "كيف أصدّر تقرير PDF؟",
    f_answer:
      "اضغط زر (تصدير PDF) في أعلى الصفحة. اختر اسم التقرير، حدد المحتويات المطلوبة (المؤشرات، الجداول، الاستنتاجات، السيناريو)، واختر الجودة (قياسية/عالية). الضغط على (إنشاء التقرير) يُنشئ ملف PDF بـ 5-6 صفحات يحتوي على ملخص كامل للحالة الحالية.",
  },
  {
    f_id: 12,
    f_category: "التقارير والدعم",
    f_question: "ماذا يتضمن تقرير PDF؟",
    f_answer:
      "غلاف بمعرف التقرير + ملخص المؤشرات الرئيسية + تحليل رمضان + 3 استنتاجات تحليلية رئيسية + جدول تعديلات السيناريو + جدول أعلى 20 يوم عجز + ملحق البيانات التقنية. جميع الصفحات باللغة العربية.",
  },
  {
    f_id: 13,
    f_category: "البيانات",
    f_question: "ماذا أفعل إذا كانت الرسوم البيانية فارغة؟",
    f_answer:
      "تأكد أن الفلاتر لا تستبعد كل النتائج (السنة/الشهر/رمضان)، ثم اضغط (إعادة الضبط) وأوقف تعديلات السيناريو مؤقتاً وجرّب (الكل). إذا استمرت، حدّث الصفحة أو تحقق من الصلاحيات/مشكلة تحميل مؤقتة.",
  },
  {
    f_id: 14,
    f_category: "المؤشرات",
    f_question: "لماذا يظهر رمضانان في سنة 2030؟",
    f_answer:
      "بسبب اختلاف التقويم الهجري عن الميلادي (السنة الهجرية أقصر بـ 11 يوم تقريباً). في 2030، يأتي رمضان مرتين: مرة في يناير-فبراير ومرة في ديسمبر-يناير. المنصة تعرض تحليلاً منفصلاً لكل موسم مع إجمالي مُجمّع.",
  },
  {
    f_id: 15,
    f_category: "البيانات",
    f_question: "ماذا أفعل إذا ظهر (لا توجد بيانات لهذه السنة) في تحليل رمضان؟",
    f_answer:
      "تأكد من اختيار السنة الصحيحة. إذا اخترت عدة سنوات معاً، المنصة تجمع كل فترات رمضان. إذا استمرت المشكلة، قد يكون هناك نقص في بيانات الطلب أو العرض لتلك الفترة.",
  },
  {
    f_id: 16,
    f_category: "البيانات",
    f_question: "ما مصادر البيانات المستخدمة؟",
    f_answer:
      "مصادر البيانات تأتي من الجهات المعنية والمسؤولة عن كل نقطة اتصال (مثل الجهات المشغلة للمرافق، والجهات التنظيمية والخدمية). يتم توحيدها واعتمادها ثم عرضها داخل المنصة حسب نقطة الاتصال وصلاحيات المستخدم.",
  },
  {
    f_id: 17,
    f_category: "البيانات",
    f_question: "كيف أعرف آخر تحديث للبيانات؟",
    f_answer:
      "يظهر تاريخ ووقت آخر تحديث للبيانات داخل صفحة تحليل البيانات تحت مسمى (آخر تحديث للبيانات).",
  },
  {
    f_id: 18,
    f_category: "التقارير والدعم",
    f_question: "كيف أشارك رابط التحليل مع زملائي؟",
    f_answer:
      "انسخ رابط الصفحة من المتصفح (URL) وشاركه. السنة المختارة والفلاتر قد لا تُحفظ في الرابط حالياً، لذا أفضل طريقة هي تصدير PDF ومشاركته أو مشاركة لقطة شاشة. التقرير المُصدّر يحتوي على معرف فريد (Report ID) للمرجعية.",
  },
  {
    f_id: 19,
    f_category: "التقارير والدعم",
    f_question: "من أتواصل معه إذا واجهت مشكلة تقنية؟",
    f_answer:
      "تواصل مع فريق الدعم الفني عبر نموذج البلاغات في المنصة أو البريد الإلكتروني المعتمد. اذكر: (1) اسم الصفحة، (2) السنة/السيناريو المختار، (3) وصف المشكلة أو الطلب، (4) لقطة شاشة إن أمكن. سيتم الرد خلال يوم عمل واحد عادةً.",
  },
];




/* ─────────────────────────────────────────
   Highlight matching text in a string
───────────────────────────────────────── */
function HighlightedText({ text, query }) {
  if (!query || query.trim() === "") return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="faq-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}


/* ─────────────────────────────────────────
   Main FAQ component
───────────────────────────────────────── */
const FAQ = ({ faq = DEFAULT_FAQ_AR, language = "ar" }) => {
  const [activeItem, setActiveItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const PAGE_SIZE = 5;
  const answerRefs = useRef({});
  const itemRefs = useRef({});
  const searchRef = useRef(null);

  const isRTL = language === "ar";
  const directionClass = isRTL ? "rtl-text" : "ltr-text";

  // Trigger stagger animation on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Build categories list
  const categories = ["الكل", ...Array.from(new Set(faq.map((i) => i.f_category).filter(Boolean)))];

  // Filter logic
  const filteredFaq = faq.filter((item) => {
    const inCategory = activeCategory === "الكل" || item.f_category === activeCategory;
    if (!inCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.f_question.toLowerCase().includes(q) ||
      item.f_answer.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredFaq.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages - 1, 0));
  const paginatedFaq = filteredFaq.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toggleItem = useCallback((id) => {
    setActiveItem((prev) => (prev === id ? null : id));
  }, []);

  const expandAll = () => setActiveItem("__all__");
  const collapseAll = () => setActiveItem(null);
  const allExpanded = activeItem === "__all__";

  const isActive = (id) => activeItem === id || activeItem === "__all__";

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e, id, index) => {
      const items = paginatedFaq;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleItem(id);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[index + 1];
        if (next) itemRefs.current[next.f_id]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[index - 1];
        if (prev) itemRefs.current[prev.f_id]?.focus();
      } else if (e.key === "Escape") {
        setActiveItem(null);
      } else if (e.key === "Home") {
        e.preventDefault();
        const first = items[0];
        if (first) itemRefs.current[first.f_id]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        const last = items[items.length - 1];
        if (last) itemRefs.current[last.f_id]?.focus();
      }
    },
    [paginatedFaq, toggleItem]
  );

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current?.focus();
  };

  return (
    <div className={`faq-container ${directionClass}`} role="region" aria-label="الأسئلة الشائعة">
      {/* ── Search bar ── */}
      <div className="faq-search-wrap">
        <div className="faq-search-inner">
          <svg className="faq-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className="faq-search-input"
            type="text"
            placeholder={isRTL ? "ابحث في الأسئلة..." : "Search questions..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveItem(null);
              setCurrentPage(0);
            }}
            aria-label={isRTL ? "بحث في الأسئلة الشائعة" : "Search FAQ"}
          />
          {searchQuery && (
            <button className="faq-search-clear" onClick={clearSearch} aria-label="مسح البحث">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Category pills + controls row ── */}
      <div className="faq-controls-row">
        <div className="faq-category-pills" role="tablist" aria-label="تصفية حسب الفئة">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`faq-cat-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                setActiveItem(null);
                setCurrentPage(0);
              }}
            >
              {cat}
              {cat !== "الكل" && (
                <span className="faq-cat-count">
                  {faq.filter((i) => i.f_category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="faq-expand-row">
          <button className="faq-expand-btn" onClick={allExpanded ? collapseAll : expandAll}>
            {allExpanded
              ? isRTL ? "إغلاق الكل" : "Collapse all"
              : isRTL ? "فتح الكل" : "Expand all"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: allExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── FAQ list ── */}
      <div className="faq-list" role="list">
        {filteredFaq.length === 0 ? (
          <div className="faq-empty" role="status">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="faq-empty-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <p className="faq-empty-text">
              {isRTL ? "لا توجد نتائج للبحث" : "No results found"}
            </p>
            <p className="faq-empty-sub">
              {isRTL ? `لا يوجد ما يطابق "${searchQuery}"` : `Nothing matched "${searchQuery}"`}
            </p>
            <button className="faq-empty-reset" onClick={clearSearch}>
              {isRTL ? "مسح البحث" : "Clear search"}
            </button>
          </div>
        ) : (
          paginatedFaq.map((item, index) => {
            const active = isActive(item.f_id);
            const globalIndex = safePage * PAGE_SIZE + index;
            const answerStyle = active
              ? { maxHeight: (answerRefs.current[item.f_id]?.scrollHeight || 1000) + "px" }
              : { maxHeight: "0px" };

            return (
              <div
                key={item.f_id}
                role="listitem"
                className={`faq-item ${active ? "open" : ""} ${mounted ? "faq-item-visible" : ""}`}
                style={{ animationDelay: mounted ? `${index * 0.07}s` : "0s" }}
              >

                {/* Question row */}
                <div
                  ref={(el) => (itemRefs.current[item.f_id] = el)}
                  className="faq-question-container"
                  onClick={() => toggleItem(item.f_id)}
                  onKeyDown={(e) => handleKeyDown(e, item.f_id, index)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={active}
                  aria-controls={`faq-answer-${item.f_id}`}
                >
                  {/* Number badge */}
                  <span className="faq-num-badge" aria-hidden="true">
                    {String(globalIndex + 1).padStart(2, "0")}
                  </span>

                  <div className="faq-question">
                    <HighlightedText text={item.f_question} query={searchQuery} />
                  </div>

                  <div className="faq-toggle" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="chevron-icon"
                      style={{ transform: `rotate(${active ? 180 : 0}deg)` }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Answer panel */}
                <div
                  id={`faq-answer-${item.f_id}`}
                  className={`faq-answer ${active ? "expanded" : ""}`}
                  style={answerStyle}
                  ref={(el) => (answerRefs.current[item.f_id] = el)}
                  role="region"
                  aria-labelledby={`faq-q-${item.f_id}`}
                >
                  <div className="faq-answer-content">
                    <HighlightedText text={item.f_answer} query={searchQuery} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination controls ── */}
      {totalPages > 1 && (
        <div className="faq-pagination" role="navigation" aria-label="تنقل بين الصفحات">
          <button
            className="faq-page-btn faq-page-arrow"
            onClick={() => { setCurrentPage(p => Math.max(p - 1, 0)); setActiveItem(null); }}
            disabled={safePage === 0}
            aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={isRTL ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
            </svg>
          </button>

          <div className="faq-page-dots">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`faq-page-dot ${i === safePage ? "active" : ""}`}
                onClick={() => { setCurrentPage(i); setActiveItem(null); }}
                aria-label={`صفحة ${i + 1}`}
                aria-current={i === safePage ? "page" : undefined}
              />
            ))}
          </div>

          <button
            className="faq-page-btn faq-page-arrow"
            onClick={() => { setCurrentPage(p => Math.min(p + 1, totalPages - 1)); setActiveItem(null); }}
            disabled={safePage === totalPages - 1}
            aria-label={isRTL ? "الصفحة التالية" : "Next page"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={isRTL ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FAQ;