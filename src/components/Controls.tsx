"use client";

import React, { useState, useMemo } from "react";
import { useEditor } from "@/store/useEditor";
import { usePexelsBackgrounds, PexelsMediaItem } from "@/hooks/usePexelsBackgrounds";
import { RECITERS } from "@/data/reciters";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Crown, Lock, ShieldCheck, Star, Search, Image as ImageIcon, Music, Type, MessageSquare, Check, Loader2 } from "lucide-react";


// ============================================================
// مكتبة خلفيات إسلامية ثابتة — لن تتغير أبداً
// ============================================================
import { STATIC_BACKGROUNDS } from "@/data/backgrounds";

export function Controls({ onOpenSubscription }: { onOpenSubscription: () => void }) {
  const [activeTab, setActiveTab] = useState("bg");
  const [bgMode, setBgMode] = useState<"library" | "search">("library");
  const [searchType, setSearchType] = useState<"images" | "videos">("images");
  const [search, setSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("الكل");
  const [query, setQuery] = useState("");
  const { state, updateState } = useEditor();
  const { media, loading } = usePexelsBackgrounds(query, bgMode === "search" ? searchType : "both");
  const { userPlan, isFeatureLocked } = useUserPlan();

  const isSearchLocked = isFeatureLocked("search");
  const isVideoLocked = isFeatureLocked("video_bg");

  const categories = ["الكل", "مساجد", "بحار", "جبال", "غابات", "الثلج", "غروب", "سماء"];
  
  const normalizeForSearch = (text: string) => {
    return text.toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[ًٌٍَُِّْ]/g, "");
  };

  const categoryMap: Record<string, string[]> = {
    "الكل": [],
    "مساجد": ["islamic", "مساجد", "مسجد", "مكة", "كعبة", "mosque", "islam", "prayer"],
    "بحار": ["sea", "بحر", "محيط", "شاطئ", "ماء", "ocean", "water", "beach", "waves"],
    "جبال": ["mountain", "جبال", "جبل", "صخور", "rocks", "peaks"],
    "غابات": ["forest", "غابة", "أشجار", "شجر", "نبات", "أخضر", "nature", "طبيعة", "jungle"],
    "الثلج": ["arctic", "ثلج", "جليد", "شتاء", "قطب", "snow", "ice", "winter", "cold", "تلج"],
    "غروب": ["sunset", "غروب", "شمس", "أفق", "sun", "dawn", "dusk"],
    "سماء": ["sky", "سماء", "نجوم", "ليل", "سحب", "غيوم", "clouds", "stars", "night", "سما"]
  };

  const filteredLibrary = useMemo(() => {
    const normalizedSearch = normalizeForSearch(librarySearch);
    return STATIC_BACKGROUNDS.filter(item => {
      const itemTags = item.tags?.map(t => normalizeForSearch(t)) || [];
      const matchesCategory = libraryCategory === "الكل" || 
        item.tags?.some(tag => categoryMap[libraryCategory].some(catTag => normalizeForSearch(tag).includes(normalizeForSearch(catTag))));
      
      const matchesSearch = !librarySearch || itemTags.some(tag => tag.includes(normalizedSearch));
      return matchesCategory && matchesSearch;
    });
  }, [libraryCategory, librarySearch]);

  const displayMedia = bgMode === "library" ? filteredLibrary : (media.length > 0 ? media : STATIC_BACKGROUNDS);

  const videoReciters = useMemo(() => {
    return RECITERS.filter(r => !!r.everyAyahFolder);
  }, []);

  const tabs = [
    { id: "bg", label: "الخلفية", icon: ImageIcon },
    { id: "reciter", label: "القاريء", icon: Music },
    { id: "style", label: "التصميم", icon: Type },
    { id: "advanced", label: "متقدم", icon: ShieldCheck },
    { id: "support", label: "الدعم", icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-8 font-['Tajawal']">
      {/* Premium Subscription Card */}
      <button 
        onClick={onOpenSubscription}
        className="relative overflow-hidden group p-6 rounded-[2.5rem] border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-all flex items-center justify-between shadow-[0_20px_50px_rgba(212,175,55,0.1)]"
      >
         <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
         <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
               <Crown className="w-7 h-7 fill-current" />
            </div>
            <div className="text-right">
               <span className="block text-lg font-black text-foreground leading-tight">ادعم يقين القرآن</span>
               <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">
                  {userPlan?.plan === 'free' ? 'ساهم في استمرار المشروع' : 'شكراً لدعمك المستمر ❤️'}
               </p>
            </div>
         </div>
         <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500">
            <Star className="w-4 h-4 fill-current" />
         </div>
      </button>

      {/* Main Tabs */}
      <div className="flex p-2 bg-foreground/5 backdrop-blur-xl rounded-[2rem] border border-foreground/5 shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] transition-all duration-500 ${activeTab === tab.id ? 'bg-primary text-black shadow-2xl shadow-primary/30 scale-[1.02]' : 'text-foreground/20 hover:text-foreground/40'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-[500px] rounded-[3rem] bg-foreground/5 backdrop-blur-3xl border border-foreground/10 p-8 relative overflow-hidden group">
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        <div className="h-full overflow-y-auto no-scrollbar pb-12">
          
          {activeTab === "bg" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Bg Mode Switcher */}
                <div className="flex p-1.5 bg-foreground/5 rounded-2xl border border-foreground/5 gap-2">
                    <button
                        onClick={() => setBgMode("library")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${bgMode === "library" ? "bg-primary text-black shadow-xl" : "text-foreground/20 hover:text-foreground/40"}`}
                    >
                        المكتبة الذكية (1000+)
                    </button>
                    <button
                        onClick={() => !isSearchLocked && setBgMode("search")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-2 ${bgMode === "search" ? "bg-primary text-black shadow-xl" : "text-foreground/20 hover:text-foreground/40"} ${isSearchLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSearchLocked && <Lock className="w-3 h-3 text-primary" />}
                        بحث عالمي
                    </button>
                </div>

                {bgMode === "library" && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                     {/* Smart Search for Library */}
                     <div className="relative">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4" />
                        <input
                            value={librarySearch}
                            onChange={(e) => setLibrarySearch(e.target.value)}
                            placeholder="بحث ذكي في المكتبة (ثلج، بحر، هدوء...)"
                            className="w-full rounded-xl bg-white/5 border border-white/10 pr-12 pl-6 py-3 text-xs text-white outline-none focus:border-primary/50 transition-all font-arabic"
                        />
                     </div>
                     {/* Category Chips */}
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {categories.map(cat => (
                           <button
                              key={cat}
                              onClick={() => setLibraryCategory(cat)}
                              className={`px-6 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-500 border ${libraryCategory === cat ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>
                )}

                {bgMode === "search" && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setSearchType("images")}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${searchType === "images" ? "bg-primary text-black" : "text-white/40 hover:text-white"}`}
                        >
                            صور
                        </button>
                        <button 
                            onClick={() => setSearchType("videos")}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${searchType === "videos" ? "bg-primary text-black" : "text-white/40 hover:text-white"}`}
                        >
                            فيديوهات
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/20 w-5 h-5" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
                                placeholder={`ابحث عن ${searchType === 'images' ? 'صور' : 'فيديوهات'} (مكة، سماء...)`}
                                className="w-full rounded-2xl bg-foreground/5 border border-foreground/10 pr-14 pl-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all font-arabic placeholder:text-foreground/20"
                            />
                        </div>
                        <button
                            onClick={() => setQuery(search)}
                            className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10"
                        >
                            بحث
                        </button>
                    </div>
                    {query && !loading && displayMedia.length === 0 && (
                        <p className="text-[9px] text-red-400/60 text-center font-bold uppercase tracking-tighter">
                            إذا لم تظهر نتائج، تأكد من إعداد PEXELS_API_KEY في ملف .env.local
                        </p>
                    )}
                </div>
                )}

                {/* Media Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {loading && bgMode === "search" ? (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">جاري البحث في المكتبة العالمية...</p>
                        </div>
                    ) : displayMedia.length === 0 ? (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 text-center">
                            <Search className="w-12 h-12 text-foreground/5" />
                            <p className="text-sm font-arabic text-foreground/20">لا توجد نتائج.. جرب كلمات بحث أخرى (مثل: مكة، طبيعة، بحر)</p>
                        </div>
                    ) : (
                        displayMedia.map((item, idx) => (
                            <button
                                key={`${item.src}-${idx}`}
                                onClick={() => {
                                    if (item.type === 'video' && isVideoLocked) return;
                                    console.log("Selected Background URL:", item.src);
                                    updateState({ backgroundUrl: item.src });
                                }}
                                className="group/item relative h-48 rounded-3xl overflow-hidden border-2 transition-all duration-500 border-white/5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20"
                            >
                                 {item.type === 'video' ? (
                                  <video 
                                     src={item.src}
                                     muted 
                                     loop 
                                     playsInline 
                                     className="h-full w-full object-cover transition-transform duration-1000 group-hover/item:scale-110" 
                                  />
                                  ) : (
                                  <img 
                                     src={item.src.includes('pexels.com') ? `${item.src.split('?')[0]}?auto=compress&cs=tinysrgb&fit=crop&h=800&w=450` : item.src} 
                                     alt="bg" 
                                     className="h-full w-full object-cover transition-transform duration-1000 group-hover/item:scale-110" 
                                  />
                                  )}
                                <div className={`absolute inset-0 bg-black/40 group-hover/item:bg-transparent transition-colors duration-700 ${state.backgroundUrl === item.src ? 'bg-transparent' : ''}`} />
                                
                                {state.backgroundUrl === item.src && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Checkmark removed by user request */}
                                </div>
                                )}
    
                                {item.type === "video" && (
                                <div className={`absolute bottom-4 right-4 flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px] font-black text-white backdrop-blur-xl border ${isVideoLocked ? 'bg-primary/80 border-primary text-black' : 'bg-black/60 border-white/10'}`}>
                                    {isVideoLocked ? <Lock className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                    {isVideoLocked ? 'PREMIUM' : 'LIVE'}
                                </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
          )}

          {activeTab === "reciter" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em] mb-4">اختر الصوت المناسب للمشهد</p>
                {videoReciters.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => updateState({ reciterId: r.id })}
                        className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-500 group/reciter ${state.reciterId === r.id ? 'bg-primary/10 border-primary shadow-2xl shadow-primary/10' : 'bg-foreground/5 border-foreground/5 hover:border-foreground/10'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${state.reciterId === r.id ? 'bg-primary text-black shadow-xl shadow-primary/20' : 'bg-foreground/5 text-foreground/20'}`}>
                                <Music className="w-5 h-5" />
                            </div>
                            <div className="text-right">
                                <span className={`block text-base font-bold font-arabic ${state.reciterId === r.id ? 'text-foreground' : 'text-foreground/60'}`}>{r.name}</span>
                                <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mt-0.5">صوت نقي عالي الجودة</p>
                            </div>
                        </div>
                        {state.reciterId === r.id && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black"><Check className="w-4 h-4 stroke-[4px]" /></div>}
                    </button>
                ))}
            </div>
          )}

          {activeTab === "style" && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Font Family */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">نمط الخط العربي</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: "Amiri", label: "أميري" },
                            { id: "Noto Naskh Arabic", label: "نسخ" },
                            { id: "Scheherazade New", label: "شهرزاد" },
                            { id: "Cairo", label: "القاهرة" },
                            { id: "Tajawal", label: "تجوال" },
                            { id: "Reem Kufi", label: "ريم كوفي" },
                            { id: "Lalezar", label: "لاليزار" },
                            { id: "El Messiri", label: "المسيري" },
                            { id: "Almarai", label: "المراعي" },
                            { id: "Aref Ruqaa", label: "رقعة" },
                            { id: "Alexandria", label: "إسكندرية" },
                        ].map((font) => (
                        <button
                            key={font.id}
                            onClick={() => updateState({ fontFamily: font.id })}
                            className={`p-5 rounded-2xl border-2 transition-all duration-500 text-center ${state.fontFamily === font.id ? 'bg-primary/10 border-primary text-foreground' : 'bg-foreground/5 border-foreground/5 text-foreground/30 hover:bg-foreground/10'}`}
                        >
                            <span className="text-xs font-black block mb-2">{font.label}</span>
                            <span className="text-2xl" style={{ fontFamily: font.id, direction: 'rtl' }}>بسم الله</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Filters — 20+ فلتر سينمائي احترافي */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">مرشحات المشهد (20+)</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: "none", icon: "✨", label: "بدون" },
                            { id: "vintage", icon: "🎞️", label: "قديم" },
                            { id: "cool", icon: "❄️", label: "بارد" },
                            { id: "warm", icon: "🔥", label: "دافئ" },
                            { id: "bw", icon: "🖤", label: "أبيض" },
                            { id: "dramatic", icon: "🌑", label: "درامي" },
                            { id: "blur", icon: "🌫️", label: "ضباب" },
                            { id: "sepia", icon: "📜", label: "عتيق" },
                            { id: "midnight", icon: "🌃", label: "ليل" },
                            { id: "oceanic", icon: "🌊", label: "محيط" },
                            { id: "saturated", icon: "🌈", label: "مشبع" },
                            { id: "cinematic", icon: "🎬", label: "سينما" },
                            { id: "golden", icon: "🌅", label: "ذهبي" },
                            { id: "teal_orange", icon: "🎭", label: "هوليود" },
                            { id: "noir", icon: "🕶️", label: "نوار" },
                            { id: "dreamy", icon: "💫", label: "حالم" },
                            { id: "neon", icon: "💜", label: "نيون" },
                            { id: "pastel", icon: "🎨", label: "باستيل" },
                            { id: "lut_autumn", icon: "🍂", label: "خريف" },
                            { id: "lut_forest", icon: "🌲", label: "غابة" },
                            { id: "high_contrast", icon: "⚡", label: "حاد" },
                            { id: "faded", icon: "🌤️", label: "باهت" },
                            { id: "vignette", icon: "🔲", label: "فنيات" },
                            { id: "cross_process", icon: "🧪", label: "كيمياء" },
                        ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => updateState({ filter: f.id })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-500 ${state.filter === f.id ? 'bg-primary/10 border-primary shadow-xl' : 'bg-foreground/5 border-foreground/5'}`}
                        >
                            <span className="text-xl">{f.icon}</span>
                            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{f.label}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Overlays — 12 تأثير إضاءة */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">تأثيرات الإضاءة والجسيمات (12)</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: "none", icon: "🚫", label: "بدون" },
                            { id: "dust", icon: "✨", label: "غبار" },
                            { id: "rays", icon: "☀️", label: "أشعة" },
                            { id: "bokeh", icon: "🔮", label: "بوكيه" },
                            { id: "snow", icon: "❄️", label: "ثلج" },
                            { id: "rain", icon: "🌧️", label: "مطر" },
                            { id: "fireflies", icon: "🪲", label: "يراعات" },
                            { id: "smoke", icon: "💨", label: "دخان" },
                            { id: "sparkle", icon: "⭐", label: "بريق" },
                            { id: "film_grain", icon: "📽️", label: "حبيبات" },
                            { id: "light_leak", icon: "🌟", label: "تسريب" },
                            { id: "aurora", icon: "🌌", label: "شفق" },
                        ].map((o) => (
                        <button
                            key={o.id}
                            onClick={() => updateState({ overlay: o.id as any })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-500 ${state.overlay === o.id ? 'bg-primary/10 border-primary shadow-xl' : 'bg-foreground/5 border-foreground/5'}`}
                        >
                            <span className="text-xl">{o.icon}</span>
                            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{o.label}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Animations — 16 أنيميشن احترافي */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">انتقالات النص (16 حركة)</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { id: "fade", icon: "🌫️", label: "ظهور" },
                            { id: "scale", icon: "🔍", label: "تكبير" },
                            { id: "slide", icon: "➡️", label: "انزلاق" },
                            { id: "blur", icon: "💨", label: "ضبابي" },
                            { id: "zoom", icon: "🔭", label: "زووم" },
                            { id: "flip", icon: "🔄", label: "قلب" },
                            { id: "bounce", icon: "🏀", label: "قفز" },
                            { id: "glitch", icon: "📺", label: "تشويش" },
                            { id: "typewriter", icon: "⌨️", label: "طباعة" },
                            { id: "wave", icon: "🌊", label: "موجة" },
                            { id: "spiral", icon: "🌀", label: "لولب" },
                            { id: "elastic", icon: "🪀", label: "مطاط" },
                            { id: "swing", icon: "🎡", label: "أرجوحة" },
                            { id: "cinematic", icon: "🎬", label: "سينمائي" },
                            { id: "split", icon: "✂️", label: "انشقاق" },
                            { id: "rotate", icon: "🔃", label: "دوران" },
                        ].map((a) => (
                        <button
                            key={a.id}
                            onClick={() => updateState({ animation: a.id as any })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-500 ${state.animation === a.id ? 'bg-primary/10 border-primary shadow-xl' : 'bg-foreground/5 border-foreground/5'}`}
                        >
                            <span className="text-xl">{a.icon}</span>
                            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{a.label}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* Text Controls */}
                <div className="space-y-8">
                    {/* Color Picker */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">لون النص</span>
                        <div className="grid grid-cols-7 gap-3">
                            {[
                                '#ffffff', '#FFD700', '#D4AF37', '#C0C0C0', '#F5F5DC', '#FFFDD0', '#E6E6FA',
                                '#00FFC2', '#00E5FF', '#3B82F6', '#8B5CF6', '#F43F5E', '#FB923C', '#22C55E',
                                '#1E293B', '#F8FAFC', '#E2E8F0', '#94A3B8', '#64748B', '#475569', '#334155'
                            ].map((color) => (
                            <button
                                key={color}
                                onClick={() => updateState({ textColor: color })}
                                style={{ backgroundColor: color }}
                                className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${state.textColor === color ? 'border-primary scale-125 ring-4 ring-primary/20' : 'border-white/10 hover:scale-110'}`}
                            />
                            ))}
                        </div>
                    </div>

                    {/* Font Size Slider */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">حجم الخط</span>
                            <span className="text-xs font-black text-primary font-mono">{state.fontSize}px</span>
                        </div>
                        <input
                            type="range" min="24" max="200" step="2"
                            value={state.fontSize}
                            onChange={(e) => updateState({ fontSize: Number(e.target.value) })}
                            className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Text Position */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">موقع النص</span>
                        <div className="flex gap-3">
                            {[
                                { id: "top", label: "أعلى", icon: "⬆️" },
                                { id: "center", label: "وسط", icon: "🎯" },
                                { id: "bottom", label: "أسفل", icon: "⬇️" },
                            ].map((pos) => (
                                <button
                                    key={pos.id}
                                    onClick={() => updateState({ textPosition: pos.id as any })}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[10px] font-black transition-all ${
                                        state.textPosition === pos.id
                                            ? 'border-primary bg-primary/10 text-white'
                                            : 'border-white/5 text-white/40 hover:border-white/20'
                                    }`}
                                >
                                    <span>{pos.icon}</span>
                                    <span>{pos.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vertical Offset */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">الضبط الرأسي الدقيق</span>
                            <span className="text-xs font-black text-primary font-mono">{state.textVerticalOffset > 0 ? '+' : ''}{state.textVerticalOffset}px</span>
                        </div>
                        <input
                            type="range" min="-400" max="400" step="5"
                            value={state.textVerticalOffset}
                            onChange={(e) => updateState({ textVerticalOffset: Number(e.target.value) })}
                            className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <button
                            onClick={() => updateState({ textVerticalOffset: 0 })}
                            className="w-full py-2 rounded-lg bg-white/5 text-[9px] font-black text-white/30 hover:text-white/60 hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            إعادة ضبط ← 0
                        </button>
                    </div>

                    {/* Font Weight */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">سُمك الخط</span>
                        <div className="flex gap-3">
                            {[
                                { id: 400, label: "خفيف", sample: "بسم" },
                                { id: 700, label: "عادي", sample: "بسم" },
                                { id: 900, label: "عريض", sample: "بسم" },
                            ].map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => updateState({ fontWeight: w.id })}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[10px] font-black transition-all ${
                                        Number(state.fontWeight) === w.id
                                            ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                                            : 'border-white/5 text-white/40 hover:border-white/20'
                                    }`}
                                >
                                    <span style={{ fontWeight: w.id, fontFamily: state.fontFamily || 'Amiri', fontSize: '18px', direction: 'rtl' }}>{w.sample}</span>
                                    <span>{w.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ayah Decoration */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-foreground/10" />
                            <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">شكل رقم الآية</span>
                            <div className="h-px flex-1 bg-foreground/10" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: "none", label: "بدون", preview: "١" },
                                { id: "bracket1", label: "أقواس", preview: "﴿ ١ ﴾" },
                                { id: "bracket2", label: "معكوس", preview: "﴾ ١ ﴿" },
                                { id: "star", label: "نجوم", preview: "✧ ١ ✧" },
                                { id: "diamond", label: "ماسة", preview: "✥ ١ ✥" },
                                { id: "ornament", label: "زخرفة", preview: "۞ ١ ۞" },
                            ].map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => updateState({ ayahDecoration: w.id as any })}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                                        state.ayahDecoration === w.id
                                            ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                                            : 'border-white/5 text-white/40 hover:border-white/20'
                                    }`}
                                >
                                    <span className="text-sm font-bold text-primary" style={{ fontFamily: 'Amiri, serif' }}>{w.preview}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{w.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Audio Visualizer */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">الموجات الصوتية (Visualizer)</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/10">
                        <div className="text-right">
                           <span className="block text-sm font-bold text-white">إظهار الموجات التفاعلية</span>
                           <span className="text-[10px] text-white/40">تتفاعل مباشرة مع صوت القارئ</span>
                        </div>
                        <button 
                           onClick={() => updateState({ showVisualizer: !state.showVisualizer })}
                           className={`w-14 h-8 rounded-full transition-colors relative ${state.showVisualizer ? 'bg-primary' : 'bg-white/10'}`}
                        >
                           <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${state.showVisualizer ? 'left-1' : 'left-7'}`} />
                        </button>
                    </div>

                    {state.showVisualizer && (
                       <div className="space-y-4">
                           <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">لون الموجات</span>
                           <div className="flex flex-wrap gap-3">
                               {['#ffffff', '#FFD700', '#D4AF37', '#00E5FF', '#F43F5E', '#22C55E'].map((color) => (
                               <button
                                   key={color}
                                   onClick={() => updateState({ visualizerColor: color })}
                                   style={{ backgroundColor: color }}
                                   className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${state.visualizerColor === color ? 'border-white scale-125 ring-4 ring-white/20' : 'border-transparent hover:scale-110'}`}
                               />
                               ))}
                           </div>
                       </div>
                    )}
                </div>

                {/* Social Layers */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">الهوية البصرية (Branding)</span>
                        <div className="h-px flex-1 bg-foreground/10" />
                    </div>
                    
                    <div className="space-y-4">
                       <div className="relative">
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-black/40 flex items-center justify-center">
                             <span className="text-white text-[10px] font-bold">TikTok</span>
                          </div>
                          <input 
                             type="text" 
                             placeholder="يوزر التيك توك (بدون @)"
                             value={state.tiktokHandle}
                             onChange={(e) => updateState({ tiktokHandle: e.target.value })}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-4 text-sm text-white font-mono text-left outline-none focus:border-primary/50"
                             dir="ltr"
                          />
                       </div>

                       <div className="relative">
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center">
                             <span className="text-white text-[10px] font-bold">Insta</span>
                          </div>
                          <input 
                             type="text" 
                             placeholder="يوزر الانستجرام (بدون @)"
                             value={state.instaHandle}
                             onChange={(e) => updateState({ instaHandle: e.target.value })}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-4 text-sm text-white font-mono text-left outline-none focus:border-primary/50"
                             dir="ltr"
                          />
                       </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-8 rounded-[2.5rem] bg-foreground/5 border border-foreground/10 space-y-6 text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-foreground font-arabic">مركز المقترحات والتحسين</h3>
                    <p className="text-[10px] text-foreground/40 leading-relaxed uppercase tracking-widest px-4">مساهمتكم تبني مستقبل التطبيق. تواصل معنا مباشرة عبر انستجرام لمشاركتنا أفكارك</p>
                    
                    <a 
                        href="https://www.instagram.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-4 w-full py-5 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
                    >
                        <span>تواصل معنا على انستجرام</span>
                    </a>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
