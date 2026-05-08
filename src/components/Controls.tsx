"use client";

import React, { useState } from "react";
import { useEditor } from "@/store/useEditor";
import { usePexelsBackgrounds, PexelsMediaItem } from "@/hooks/usePexelsBackgrounds";
import { RECITERS } from "@/data/reciters";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Crown, Lock, ShieldCheck, Star, Search, Image as ImageIcon, Music, Type, MessageSquare, Check } from "lucide-react";


// ============================================================
// مكتبة خلفيات إسلامية ثابتة — لن تتغير أبداً
// ============================================================
const STATIC_LIBRARY: PexelsMediaItem[] = [
  { type: "image", src: "https://images.pexels.com/photos/1537086/pexels-photo-1537086.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2826415/pexels-photo-2826415.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3214995/pexels-photo-3214995.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/6633920/pexels-photo-6633920.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/11589926/pexels-photo-11589926.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1819649/pexels-photo-1819649.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1146134/pexels-photo-1146134.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/21395/pexels-photo.jpg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/847402/pexels-photo-847402.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/3876401/pexels-photo-3876401.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/1040499/pexels-photo-1040499.jpeg", poster: "" },
  { type: "image", src: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg", poster: "" },
];

export function Controls({ onOpenSubscription }: { onOpenSubscription: () => void }) {
  const [activeTab, setActiveTab] = useState("bg");
  const [bgMode, setBgMode] = useState<"library" | "search">("library");
  const [search, setSearch] = useState("islamic");
  const [query, setQuery] = useState("");
  const { state, updateState } = useEditor();
  const { media, loading } = usePexelsBackgrounds(query, bgMode === "search" ? "images" : "both");
  const { userPlan, isFeatureLocked } = useUserPlan();

  const isSearchLocked = isFeatureLocked("search");
  const isVideoLocked = isFeatureLocked("video_bg");

  const displayMedia = bgMode === "library" ? STATIC_LIBRARY : (media.length > 0 ? media : STATIC_LIBRARY);

  const tabs = [
    { id: "bg", label: "الخلفية", icon: ImageIcon },
    { id: "reciter", label: "القاريء", icon: Music },
    { id: "style", label: "التصميم", icon: Type },
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
               <span className="block text-lg font-black text-foreground leading-tight">عضوية التميز النادرة</span>
               <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">
                  {userPlan?.plan === 'free' ? 'قم بترقية حسابك لتجربة كاملة' : 'أنت الآن مشترك في باقة التميز'}
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
                        المكتبة المختارة
                    </button>
                    <button
                        onClick={() => !isSearchLocked && setBgMode("search")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-2 ${bgMode === "search" ? "bg-primary text-black shadow-xl" : "text-foreground/20 hover:text-foreground/40"} ${isSearchLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSearchLocked && <Lock className="w-3 h-3 text-primary" />}
                        بحث إضافي
                    </button>
                </div>

                {bgMode === "search" && (
                <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="relative flex-1">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/20 w-5 h-5" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
                            placeholder="ابحث عن صور (مكة، سماء...)"
                            className="w-full rounded-2xl bg-foreground/5 border border-foreground/10 pr-14 pl-6 py-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-arabic placeholder:text-foreground/20"
                        />
                    </div>
                    <button
                        onClick={() => setQuery(search)}
                        className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10"
                    >
                        بحث
                    </button>
                </div>
                )}

                {/* Grid */}
                {loading && bgMode === "search" ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">جاري جلب الصور...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayMedia.map((item, index) => (
                        <button
                            key={`${item.src}-${index}`}
                            onClick={() => {
                                if (item.type === 'video' && isVideoLocked) return;
                                updateState({ backgroundUrl: item.src });
                            }}
                            className={`relative aspect-[9/16] overflow-hidden rounded-[2rem] border-2 transition-all duration-700 group/item ${state.backgroundUrl === item.src ? 'border-primary shadow-[0_0_50px_rgba(212,175,55,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                        >
                            {item.type === "video" ? (
                            <video src={item.src} poster={item.poster} muted loop playsInline className="h-full w-full object-cover transition-transform duration-1000" />
                            ) : (
                            <img src={`${item.src}?auto=compress&cs=tinysrgb&dpr=2&h=600&w=400`} alt="bg" className="h-full w-full object-cover transition-transform duration-1000" />
                            )}
                            <div className={`absolute inset-0 bg-black/40 group-hover/item:bg-transparent transition-colors duration-700 ${state.backgroundUrl === item.src ? 'bg-transparent' : ''}`} />
                            
                            {state.backgroundUrl === item.src && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black shadow-2xl animate-in zoom-in duration-300">
                                    <circle className="w-6 h-6 stroke-[4px]" />
                                    <Check className="w-6 h-6 stroke-[4px]" />
                                </div>
                            </div>
                            )}

                            {item.type === "video" && (
                            <div className={`absolute bottom-4 right-4 flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px] font-black text-white backdrop-blur-xl border ${isVideoLocked ? 'bg-primary/80 border-primary text-black' : 'bg-black/60 border-white/10'}`}>
                                {isVideoLocked ? <Lock className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                {isVideoLocked ? 'PREMIUM' : 'LIVE'}
                            </div>
                            )}
                        </button>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === "reciter" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em] mb-4">اختر الصوت المناسب للمشهد</p>
                {RECITERS.map((r) => (
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

                {/* Filters */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-foreground/10" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">مرشحات المشهد</span>
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

                {/* Text Controls */}
                <div className="space-y-8">
                    {/* Color Picker */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">لون النص</span>
                        <div className="flex flex-wrap gap-3">
                            {['#ffffff', '#FFD700', '#D4AF37', '#00FFC2', '#00E5FF', '#F43F5E', '#22C55E'].map((color) => (
                            <button
                                key={color}
                                onClick={() => updateState({ textColor: color })}
                                style={{ backgroundColor: color }}
                                className={`w-10 h-10 rounded-full border-2 transition-all duration-500 ${state.textColor === color ? 'border-primary scale-125 ring-8 ring-primary/20' : 'border-foreground/10 hover:scale-110'}`}
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
                            type="range" min="20" max="300" step="2"
                            value={state.fontSize}
                            onChange={(e) => updateState({ fontSize: Number(e.target.value) })}
                            className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Vertical Offset */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">الموقع الرأسي</span>
                            <span className="text-xs font-black text-primary font-mono">{state.textVerticalOffset}px</span>
                        </div>
                        <input
                            type="range" min="-500" max="500" step="5"
                            value={state.textVerticalOffset}
                            onChange={(e) => updateState({ textVerticalOffset: Number(e.target.value) })}
                            className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
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
