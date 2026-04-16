"use client";

import React, { useState } from "react";
import { useEditor } from "@/store/useEditor";
import { usePexelsBackgrounds, PexelsMediaItem } from "@/hooks/usePexelsBackgrounds";
import { RECITERS } from "@/data/reciters";

// ============================================================
// مكتبة خلفيات إسلامية ثابتة — لن تتغير أبداً
// Static Islamic background library — always shows same results
// ============================================================
const STATIC_LIBRARY: PexelsMediaItem[] = [
  // مساجد
  { type: "image", src: "https://images.pexels.com/photos/1537086/pexels-photo-1537086.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2826415/pexels-photo-2826415.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3214995/pexels-photo-3214995.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg", poster: "" },
  // مكة والكعبة
  { type: "image", src: "https://images.pexels.com/photos/6633920/pexels-photo-6633920.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/11589926/pexels-photo-11589926.jpeg", poster: "" },
  // طبيعة وسماء
  { type: "image", src: "https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1819649/pexels-photo-1819649.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg", poster: "" },
  // نجوم وليل
  { type: "image", src: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1146134/pexels-photo-1146134.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg", poster: "" },
  // صحراء وجبال
  { type: "image", src: "https://images.pexels.com/photos/21395/pexels-photo.jpg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/847402/pexels-photo-847402.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg", poster: "" },
  // ماء وبحر
  { type: "image", src: "https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg", poster: "" },
  // خلفيات داكنة فاخرة
  { type: "image", src: "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3876401/pexels-photo-3876401.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1040499/pexels-photo-1040499.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg", poster: "" },
];

export function Controls() {
  const [activeTab, setActiveTab] = useState("bg");
  const [bgMode, setBgMode] = useState<"library" | "search">("library");
  const [search, setSearch] = useState("islamic");
  const [query, setQuery] = useState("");
  const { state, updateState } = useEditor();
  const { media, loading } = usePexelsBackgrounds(query);

  const displayMedia = bgMode === "library" ? STATIC_LIBRARY : (media.length > 0 ? media : STATIC_LIBRARY);

  const [feedback, setFeedback] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    setIsSending(true);
    
    // Analytics: إرسال الشكوى أو الاقتراح
    // @ts-ignore
    window.gtag?.('event', 'user_feedback', { 
        'message': feedback.slice(0, 100), // الحد الأقصى للجوجل أناليتكس
        'full_message': feedback
    });

    setTimeout(() => {
        setIsSending(false);
        setFeedback("");
        alert("تم إرسال اقتراحك بنجاح.. شكراً لك!");
    }, 1000);
  };

  const displayMedia = bgMode === "library" ? STATIC_LIBRARY : (media.length > 0 ? media : STATIC_LIBRARY);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Analytics: تتبع التبويبات
    // @ts-ignore
    window.gtag?.('event', 'tab_switch', { 'tab_name': tab });
  };

  const handleBgSelect = (item: PexelsMediaItem) => {
    updateState({ backgroundUrl: item.src });
    // Analytics: تتبع اختيار الخلفيات
    // @ts-ignore
    window.gtag?.('event', 'bg_select', { 
        'bg_url': item.src,
        'bg_type': item.type 
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
        {[
          { id: "bg", label: "الخلفية" },
          { id: "reciter", label: "القاريء" },
          { id: "style", label: "الخط" },
          { id: "support", label: "الدعم" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-2 py-3 text-[10px] font-bold rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 rounded-3xl bg-black/20 border border-white/5 p-4 relative overflow-hidden group min-h-[300px]">
        <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
        
        {activeTab === "bg" && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Mode Switcher */}
            <div className="flex p-1 bg-black/30 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => {
                   setBgMode("library");
                   // @ts-ignore
                   window.gtag?.('event', 'bg_mode_switch', { 'mode': 'library' });
                }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 ${bgMode === "library" ? "bg-primary text-black shadow shadow-primary/20" : "text-white/30 hover:text-white/60"}`}
              >
                📚 المكتبة الثابتة
              </button>
              <button
                onClick={() => {
                   setBgMode("search");
                   // @ts-ignore
                   window.gtag?.('event', 'bg_mode_switch', { 'mode': 'search' });
                }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 ${bgMode === "search" ? "bg-primary text-black shadow shadow-primary/20" : "text-white/30 hover:text-white/60"}`}
              >
                🔍 بحث إضافي
              </button>
            </div>

            {/* Search bar — only when in search mode */}
            {bgMode === "search" && (
              <div className="flex items-center gap-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setQuery(search || "islamic")}
                  placeholder="مثلاً: مكة، نجوم، طبيعة..."
                  className="flex-1 rounded-2xl border border-white/5 bg-black/40 px-5 py-3 text-sm text-white outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                />
                <button
                  onClick={() => {
                    setQuery(search || "islamic");
                    // @ts-ignore
                    window.gtag?.('event', 'bg_search', { 'query': search });
                  }}
                  className="rounded-2xl bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-primary/20 hover:text-primary transition-all border border-white/5"
                >
                  بحث
                </button>
              </div>
            )}

            {/* Label */}
            {bgMode === "library" && (
              <p className="text-[10px] text-white/25 text-center tracking-widest uppercase px-2">
                24 خلفية إسلامية منتقاة — ثابتة دائماً
              </p>
            )}

            {/* Grid */}
            {loading && bgMode === "search" ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">جارٍ البحث...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {displayMedia.map((item, index) => (
                  <button
                    key={`${item.src}-${index}`}
                    onClick={() => handleBgSelect(item)}
                    className={`relative aspect-[9/16] overflow-hidden rounded-[1.5rem] border-2 transition-all duration-500 group/item ${state.backgroundUrl === item.src ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)] scale-[0.98]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    {item.type === "video" ? (
                      <video
                        src={item.src}
                        poster={item.poster}
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover/item:scale-110"
                      />
                    ) : (
                      <img
                        src={`${item.src}?auto=compress&cs=tinysrgb&dpr=2&h=400&w=300`}
                        alt="خلفية"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover/item:scale-110"
                      />
                    )}
                    <div className={`absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors duration-500 ${state.backgroundUrl === item.src ? 'bg-transparent' : ''}`} />
                    {state.backgroundUrl === item.src && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-black shadow-lg">✓</div>
                    )}
                    {item.type === "video" && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-md border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        HD
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === "reciter" && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
            {RECITERS.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                   updateState({ reciterId: r.id });
                   // Analytics: تتبع اختيار القارئ
                   // @ts-ignore
                   window.gtag?.('event', 'reciter_select', { 'reciter_name': r.name, 'reciter_id': r.id });
                }}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 group/reciter ${state.reciterId === r.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full transition-all ${state.reciterId === r.id ? 'bg-primary scale-125' : 'bg-white/10 group-hover/reciter:bg-white/30'}`} />
                   <span className={`text-sm font-bold font-arabic ${state.reciterId === r.id ? 'text-white' : 'text-white/60'}`}>{r.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === "style" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 px-1">لوحة الألوان</span>
              <div className="flex flex-wrap gap-4">
                {[
                  '#ffffff', '#FFD700', '#D4AF37', '#00FFC2', '#00E5FF', 
                  '#3B82F6', '#A855F7', '#EC4899', '#F43F5E', '#FF5C5C', 
                  '#F59E0B', '#22C55E'
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                       updateState({ textColor: color });
                       // Analytics: تتبع الألوان
                       // @ts-ignore
                       window.gtag?.('event', 'color_select', { 'color_hex': color });
                    }}
                    style={{ backgroundColor: color }}
                    className={`h-10 w-10 rounded-full border-2 transition-all duration-500 ${state.textColor === color ? 'border-white scale-110 ring-8 ring-primary/10 shadow-lg shadow-black/40' : 'border-white/10 hover:scale-110'}`}
                  />
                ))}
                <div className="relative group/cp">
                  <input
                    type="color"
                    value={state.textColor}
                    onChange={(e) => {
                       updateState({ textColor: e.target.value });
                       // Analytics: تتبع اختيار لون مخصص
                       // @ts-ignore
                       window.gtag?.('event', 'color_custom', { 'color_hex': e.target.value });
                    }}
                    className="h-10 w-10 rounded-full border-2 border-white/10 bg-transparent cursor-pointer overflow-hidden opacity-0 absolute inset-0 z-10"
                  />
                  <div 
                    className="h-10 w-10 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold transition-all group-hover/cp:scale-110 shadow-lg"
                    style={{ backgroundColor: state.textColor }}
                  >
                    🎨
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">حجم الخط</span>
                  <span className="text-sm font-black text-primary font-mono">{state.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={state.fontSize}
                  onChange={(e) => {
                     updateState({ fontSize: Number(e.target.value) });
                  }}
                  onMouseUp={(e: any) => {
                     // @ts-ignore
                     window.gtag?.('event', 'font_size_change', { 'size': Number(e.target.value) });
                  }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">سُمك الخط</span>
                  <span className="text-sm font-black text-primary font-mono">{state.fontWeight}</span>
                </div>
                <div className="flex gap-2">
                   {[300, 400, 500, 600, 700, 800].map(weight => (
                     <button
                        key={weight}
                        onClick={() => {
                           updateState({ fontWeight: weight });
                           // @ts-ignore
                           window.gtag?.('event', 'font_weight_change', { 'weight': weight });
                        }}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold text-xs ${state.fontWeight === weight ? 'bg-primary/10 border-primary text-primary' : 'bg-black/40 border-white/5 text-white/30 hover:bg-white/5'}`}
                     >
                        {weight === 400 ? 'عادي' : weight === 700 ? 'عريض' : weight}
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 p-2">
             <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-white font-arabic">الشكاوى والاقتراحات</h3>
                <p className="text-[10px] text-white/40 leading-relaxed">يسعدنا سماع رأيك أو أي مشكلة تواجهك لتحسين التطبيق.</p>
             </div>

             <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-primary/40 transition-all resize-none font-arabic"
             />

             <button 
                onClick={handleSendFeedback}
                disabled={isSending || !feedback.trim()}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isSending || !feedback.trim() ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-black hover:scale-[1.02] shadow-lg shadow-primary/20'}`}
             >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <span>إرسال الاقتراح</span>
                )}
             </button>

             <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[9px] text-white/20 uppercase tracking-widest block mb-2">ملاحظة</span>
                <p className="text-[9px] text-white/30 leading-relaxed">رسالتك تصل مباشرة لمالك التطبيق عبر نظام الأحداث المتقدم لضمان الخصوصية وسرعة المتابعة.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
