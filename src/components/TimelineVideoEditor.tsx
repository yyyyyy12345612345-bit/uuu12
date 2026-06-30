"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useEditor } from "@/store/useEditor";
import { usePexelsBackgrounds } from "@/hooks/usePexelsBackgrounds";
import { RECITERS } from "@/data/reciters";
import { STATIC_BACKGROUNDS } from "@/data/backgrounds";
import { useUserPlan } from "@/hooks/useUserPlan";
import surahsData from "@/data/surahs.json";
import { VideoPreview } from "@/components/VideoPreview";
import { 
  FolderOpen, ImageIcon, Wand2, Type, Layout, Music, 
  ArrowLeftRight, FileText, Bookmark, 
  Settings, Bell, Sun, Cloud, RotateCcw, RotateCw, 
  Play, Volume2, Maximize2, Trash2, Pin, Scissors, 
  Copy, Layers, Plus, Eye, Lock, Search, 
  Loader2, Check, ChevronDown, Sparkles, Sliders, Info, Download
} from "lucide-react";

interface TimelineVideoEditorProps {
  onOpenSubscription: () => void;
  onOpenRender: () => void;
}

export function TimelineVideoEditor({ onOpenSubscription, onOpenRender }: TimelineVideoEditorProps) {
  const { state, updateState } = useEditor();
  const { isFeatureLocked } = useUserPlan();

  // Navigation states
  const [activeLeftTab, setActiveLeftTab] = useState<string>("bg");
  const [activeRightTab, setActiveRightTab] = useState<string>("settings"); // settings, layers, project
  
  // Right sidebar collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content: true,
    bg: false,
    audio: false,
    font: false,
    effects: false,
    visualizer: false,
    branding: false,
    advanced: false,
  });

  // Background search states
  const [bgMode, setBgMode] = useState<"library" | "search">("library");
  const [searchType, setSearchType] = useState<"images" | "videos">("images");
  const [search, setSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("الكل");
  const [query, setQuery] = useState("");
  const { media, loading } = usePexelsBackgrounds(query, bgMode === "search" ? searchType : "both");

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

  const [maxVerses, setMaxVerses] = useState(7);
  useEffect(() => {
    const surah = surahsData.find(s => s.id.toString() === state.surahId);
    if (surah) {
      setMaxVerses(surah.total_verses);
    }
  }, [state.surahId]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Left Sidebar Tabs
  const leftTabs = [
    { id: "library", label: "المكتبة", icon: FolderOpen },
    { id: "bg", label: "الخلفيات", icon: ImageIcon },
    { id: "effects", label: "المؤثرات", icon: Wand2 },
    { id: "fonts", label: "الخطوط", icon: Type },
    { id: "templates", label: "القوالب", icon: Layout },
    { id: "audio", label: "الصوتيات", icon: Music },
    { id: "transitions", label: "الانتقالات", icon: ArrowLeftRight },
    { id: "elements", label: "العناصر", icon: Layers },
    { id: "texts", label: "النصوص", icon: FileText },
    { id: "branding", label: "الشعارات", icon: Bookmark },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-[#08090c] text-foreground font-arabic overflow-hidden select-none">
      
      {/* ── TOP CONTROL BAR ── */}
      <header className="h-16 shrink-0 bg-[#0c0d12] border-b border-white/5 flex items-center justify-between px-6 z-[100]">
        
        {/* Left Info / Auto Save */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20">
              <span className="font-black text-sm">يقين</span>
            </span>
            <div className="text-right">
              <div className="flex items-center gap-1.5 cursor-pointer group">
                <span className="text-xs font-bold text-white group-hover:text-primary transition-colors font-arabic">مشروع جديد</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex items-center gap-2 text-white/40">
            <Cloud className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold">تم الحفظ</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Title or Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white/80 tracking-widest">منصة التصميم الاحترافي</span>
        </div>

        {/* Right Tools / Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-white transition-all">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>معاينة</span>
          </button>
          
          <button 
            onClick={onOpenRender}
            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/95 text-black rounded-xl text-xs font-black shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>تصدير</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* Utility Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 transition-colors">
              <Sun className="w-4 h-4" />
            </button>
            <button className="p-1 hover:border-primary/50 border border-transparent rounded-full transition-colors ml-1">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" 
                alt="Profile" 
                className="w-7 h-7 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex w-full overflow-hidden relative">

        {/* 1. LEFT ICON SIDEBAR (TABS) */}
        <aside className="w-16 shrink-0 bg-[#0a0b0f] border-l border-white/5 flex flex-col items-center py-4 gap-2 z-40">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeLeftTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive 
                    ? "bg-primary text-black shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
                }`}
                title={tab.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[8px] font-black">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* 2. INNER ASSETS DRAWER PANEL */}
        <div className="w-[300px] shrink-0 bg-[#0e0f14] border-l border-white/5 flex flex-col overflow-hidden relative z-30">
          <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 relative z-10 flex flex-col gap-6">
            
            {/* Header of assets drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white">
                {leftTabs.find(t => t.id === activeLeftTab)?.label || "العناصر"}
              </h3>
              <span className="text-[9px] text-primary font-bold tracking-widest uppercase">مكتبة يقين</span>
            </div>

            {/* TAB CONTENT: الخلفيات / المكتبة */}
            {(activeLeftTab === "bg" || activeLeftTab === "library") && (
              <div className="flex flex-col gap-4">
                {/* Search mode toggle */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 gap-1.5">
                  <button
                    onClick={() => setBgMode("library")}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                      bgMode === "library" ? "bg-primary text-black shadow-md" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    المكتبة الذكية
                  </button>
                  <button
                    onClick={() => !isSearchLocked && setBgMode("search")}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      bgMode === "search" ? "bg-primary text-black shadow-md" : "text-white/40 hover:text-white/70"
                    } ${isSearchLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {isSearchLocked && <Lock className="w-2.5 h-2.5" />}
                    بحث Pexels
                  </button>
                </div>

                {bgMode === "library" && (
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 w-3.5 h-3.5" />
                      <input
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="ابحث في التصنيفات..."
                        className="w-full rounded-xl bg-white/5 border border-white/10 pr-9 pl-4 py-2 text-[11px] text-white outline-none focus:border-primary/40 transition-all font-arabic"
                      />
                    </div>
                    {/* Category List */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setLibraryCategory(cat)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black whitespace-nowrap transition-all border ${
                            libraryCategory === cat 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-white/5 text-white/40 border-transparent hover:border-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bgMode === "search" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                      <button 
                        onClick={() => setSearchType("images")}
                        className={`flex-1 py-1 text-[9px] font-bold rounded ${searchType === "images" ? "bg-primary text-black" : "text-white/40"}`}
                      >
                        صور
                      </button>
                      <button 
                        onClick={() => setSearchType("videos")}
                        className={`flex-1 py-1 text-[9px] font-bold rounded ${searchType === "videos" ? "bg-primary text-black" : "text-white/40"}`}
                      >
                        فيديو
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
                        placeholder="ابحث بالإنجليزية (sky, nature)..."
                        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-[11px] text-white outline-none focus:border-primary/40 transition-all"
                      />
                      <button
                        onClick={() => setQuery(search)}
                        className="bg-primary text-black px-4 rounded-xl font-black text-[10px]"
                      >
                        ابحث
                      </button>
                    </div>
                  </div>
                )}

                {/* Media Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {loading && bgMode === "search" ? (
                    <div className="col-span-2 py-10 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-[9px] font-black text-white/40">جاري البحث...</span>
                    </div>
                  ) : displayMedia.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-white/30 text-[10px]">
                      لا توجد نتائج مطابقة
                    </div>
                  ) : (
                    displayMedia.map((item, idx) => (
                      <button
                        key={`${item.src}-${idx}`}
                        onClick={() => {
                          if (item.type === 'video' && isVideoLocked) return;
                          updateState({ backgroundUrl: item.src });
                        }}
                        className={`group relative h-32 rounded-xl overflow-hidden border transition-all ${
                          state.backgroundUrl === item.src 
                            ? 'border-primary shadow-lg shadow-primary/10' 
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <video 
                            src={item.src}
                            muted 
                            loop 
                            playsInline 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <img 
                            src={item.src.includes('pexels.com') ? `${item.src.split('?')[0]}?auto=compress&cs=tinysrgb&fit=crop&h=300&w=200` : item.src} 
                            alt="bg" 
                            className="h-full w-full object-cover" 
                          />
                        )}
                        <div className={`absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors ${state.backgroundUrl === item.src ? 'bg-transparent' : ''}`} />
                        
                        {state.backgroundUrl === item.src && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-black">
                            <Check className="w-3.5 h-3.5 stroke-[3.5px]" />
                          </div>
                        )}

                        {item.type === "video" && (
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>متحرك</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: الصوتيات */}
            {activeLeftTab === "audio" && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-white/40 block mb-2">اختر قارئ الآيات للمقطع:</span>
                {videoReciters.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateState({ reciterId: r.id })}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-right ${
                      state.reciterId === r.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        state.reciterId === r.id ? 'bg-primary text-black' : 'bg-white/5 text-white/40'
                      }`}>
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">{r.name}</span>
                        <span className="text-[8px] text-white/40 mt-0.5 block">تزامن عالي الدقة</span>
                      </div>
                    </div>
                    {state.reciterId === r.id && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-black">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: القوالب */}
            {activeLeftTab === "templates" && (
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "default", label: "التصميم الافتراضي", desc: "آيات مع ترجمة منسقة", icon: Type },
                  { id: "minshawi_player", label: "تصميم المنشاوي", desc: "مشغل المنشاوي المخصص", icon: Sparkles }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateState({ videoTemplate: t.id as any })}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-right transition-all ${
                      state.videoTemplate === t.id 
                        ? 'bg-primary/10 border-primary shadow-md' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      state.videoTemplate === t.id ? 'bg-primary text-black' : 'bg-white/5 text-white/40'
                    }`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black block text-white">{t.label}</span>
                      <span className="text-[9px] text-white/40 mt-0.5 block">{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: المؤثرات */}
            {activeLeftTab === "effects" && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Filters */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-primary tracking-widest block uppercase border-b border-white/5 pb-1">الفلاتر السينمائية</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "none", label: "بدون" },
                      { id: "cinematic", label: "سينما" },
                      { id: "vintage", label: "قديم" },
                      { id: "cool", label: "بارد" },
                      { id: "warm", label: "دافئ" },
                      { id: "bw", label: "أبيض وأسود" },
                      { id: "dramatic", label: "درامي" },
                      { id: "golden", label: "ذهبي" }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => updateState({ filter: f.id })}
                        className={`py-2 px-3 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          state.filter === f.id 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Overlays */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-primary tracking-widest block uppercase border-b border-white/5 pb-1">تأثيرات الجسيمات والإضاءة</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "none", label: "بدون" },
                      { id: "dust", label: "غبار" },
                      { id: "rays", label: "أشعة" },
                      { id: "bokeh", label: "بوكيه" },
                      { id: "snow", label: "ثلج" },
                      { id: "rain", label: "مطر" },
                      { id: "fireflies", label: "يراعات" },
                      { id: "smoke", label: "دخان" }
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => updateState({ overlay: o.id as any })}
                        className={`py-2 px-3 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          state.overlay === o.id 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: الخطوط */}
            {activeLeftTab === "fonts" && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Amiri", label: "أميري" },
                  { id: "Noto Naskh Arabic", label: "نسخ" },
                  { id: "Scheherazade New", label: "شهرزاد" },
                  { id: "Cairo", label: "القاهرة" },
                  { id: "Tajawal", label: "تجوال" },
                  { id: "Reem Kufi", label: "ريم كوفي" },
                  { id: "Lalezar", label: "لاليزار" },
                  { id: "El Messiri", label: "المسيري" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateState({ fontFamily: f.id })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      state.fontFamily === f.id 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-black block mb-1">{f.label}</span>
                    <span className="text-lg block truncate" style={{ fontFamily: f.id }}>بسم الله</span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: الانتقالات */}
            {activeLeftTab === "transitions" && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "fade", label: "ظهور" },
                  { id: "scale", label: "تكبير" },
                  { id: "slide", label: "انزلاق" },
                  { id: "blur", label: "ضبابي" },
                  { id: "zoom", label: "زووم" },
                  { id: "flip", label: "قلب" },
                  { id: "bounce", label: "قفز" },
                  { id: "glitch", label: "تشويش" },
                  { id: "typewriter", label: "طباعة" },
                  { id: "wave", label: "موجة" }
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updateState({ animation: a.id as any })}
                    className={`py-2.5 px-3 rounded-xl border text-[10px] font-bold text-center transition-all ${
                      state.animation === a.id 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: العناصر */}
            {activeLeftTab === "elements" && (
              <div className="space-y-4">
                <span className="text-[10px] text-white/40 block mb-2">زخرفة الآية ورقم الآية:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "none", label: "بدون" },
                    { id: "bracket1", label: "أقواس ﴿ ﴾" },
                    { id: "bracket2", label: "معكوس ﴾ ﴿" },
                    { id: "star", label: "نجوم ✧" },
                    { id: "diamond", label: "ماسة ✥" },
                    { id: "ornament", label: "زخرفة ۞" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => updateState({ ayahDecoration: w.id as any })}
                      className={`p-3.5 rounded-xl border text-center transition-all ${
                        state.ayahDecoration === w.id 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: النصوص */}
            {activeLeftTab === "texts" && (
              <div className="flex flex-col gap-5">
                {/* FontSize */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40 font-bold">حجم خط الآيات</span>
                    <span className="text-primary font-bold font-mono">{state.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="24" max="150" step="2"
                    value={state.fontSize}
                    onChange={(e) => updateState({ fontSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Text Position */}
                <div className="space-y-2">
                  <span className="text-[10px] text-white/40 block font-bold">تموضع النص</span>
                  <div className="grid grid-cols-3 gap-2">
                    {["top", "center", "bottom"].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => updateState({ textPosition: pos as any })}
                        className={`py-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          state.textPosition === pos 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {pos === "top" ? "أعلى" : pos === "center" ? "وسط" : "أسفل"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vertical Offset */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40 font-bold">إزاحة إضافية</span>
                    <span className="text-primary font-bold font-mono">{state.textVerticalOffset}px</span>
                  </div>
                  <input
                    type="range" min="-300" max="300" step="5"
                    value={state.textVerticalOffset}
                    onChange={(e) => updateState({ textVerticalOffset: Number(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Font Weight */}
                <div className="space-y-2">
                  <span className="text-[10px] text-white/40 block font-bold">وزن الخط</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[400, 700, 900].map((w) => (
                      <button
                        key={w}
                        onClick={() => updateState({ fontWeight: w })}
                        className={`py-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          Number(state.fontWeight) === w 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {w === 400 ? "خفيف" : w === 700 ? "عادي" : "عريض"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: الشعارات وهوايات التواصل */}
            {activeLeftTab === "branding" && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-white/40 block mb-2">إعدادات العلامة المائية للشبكات:</span>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-bold">حساب تيك توك</label>
                    <input 
                      type="text" 
                      placeholder="yaqeen.app"
                      value={state.tiktokHandle}
                      onChange={(e) => updateState({ tiktokHandle: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/50"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-bold">حساب انستقرام</label>
                    <input 
                      type="text" 
                      placeholder="yaqeen.app"
                      value={state.instaHandle}
                      onChange={(e) => updateState({ instaHandle: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/50"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* 3. CENTER VIEWPORT AREA */}
        <div className="flex-1 flex flex-col h-full bg-[#0a0b0f] overflow-hidden relative">
          
          {/* Main Visual Preview Window wrapper */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            
            {/* Aspect Ratio Display and Time */}
            <div className="w-full max-w-[400px] flex items-center justify-between mb-3 text-[10px] text-white/30 font-bold px-2">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px]">FHD</span>
                <span>1080 × 1920 (9:16)</span>
              </div>
              <span>معاينة فورية للتعديل</span>
            </div>

            {/* Video preview render container */}
            <div className="w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative bg-black flex items-center justify-center">
              <div className="w-full h-full scale-[1.01]">
                <VideoPreview />
              </div>
            </div>

            {/* Action Tools directly beneath Video */}
            <div className="flex items-center gap-1.5 bg-[#0e0f14]/80 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-2xl mt-4 shadow-xl">
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="تراجع">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="إعادة">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="قص">
                <Scissors className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="نسخ">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-white/40 active:scale-95 transition-all" title="حذف">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="تقسيم">
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="انتقال">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 hover:bg-white/5 hover:text-white rounded-lg text-white/40 active:scale-95 transition-all" title="أضف نص">
                <Type className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* ── TIMELINE CONTAINER ── */}
          <div className="h-64 shrink-0 bg-[#0c0d12] border-t border-white/5 flex flex-col overflow-hidden">
            
            {/* Timeline Ruler Header */}
            <div className="h-9 shrink-0 border-b border-white/5 flex items-center justify-between px-6 text-[9px] font-bold text-white/30">
              <div className="w-[120px] flex items-center justify-between pl-4">
                <span>اسم القناة</span>
                <span>الحالة</span>
              </div>
              <div className="flex-1 flex items-center justify-between px-4 font-mono select-none pointer-events-none">
                <span>00:00</span>
                <span>00:15</span>
                <span>00:30</span>
                <span>00:45</span>
                <span>01:00</span>
                <span>01:15</span>
                <span className="text-primary font-black">01:24</span>
                <span>01:30</span>
                <span>01:45</span>
                <span>02:00</span>
                <span>02:15</span>
                <span>02:30</span>
              </div>
            </div>

            {/* Timeline tracks scroll view */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col pb-4">
              
              {/* 1. Track: Background (الخلفية) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">الخلفية</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Lock className="w-3 h-3 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative">
                  {/* Visual timeline block representing active background */}
                  <div className="absolute left-4 right-1/4 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center px-3 overflow-hidden">
                    <div className="flex gap-1 h-full py-0.5 items-center opacity-30">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-8 h-full bg-white/10 rounded overflow-hidden">
                          <img src={state.backgroundUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <span className="absolute right-3 text-[8px] font-black text-indigo-400">ملف الخلفية المختار</span>
                  </div>
                </div>
              </div>

              {/* 2. Track: Verses (الآيات) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">الآيات</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Lock className="w-3 h-3 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative">
                  {/* Quranic Verse Block */}
                  <div className="absolute left-[10%] right-[30%] h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between px-3">
                    <span className="text-[8px] font-black text-primary truncate max-w-[200px] font-arabic">وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ إِنَّهُ...</span>
                    <span className="text-[7px] text-primary/60 font-mono">سورة {surahsData.find(s => s.id.toString() === state.surahId)?.name}</span>
                  </div>
                </div>
              </div>

              {/* 3. Track: Effects (المؤثرات) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">المؤثرات</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative">
                  {/* Interactive Diamond/Dots on timeline */}
                  <div className="absolute left-[12%] w-2 h-2 rotate-45 bg-[#D4AF37] border border-white" title="تأثير الفلتر" />
                  <div className="absolute left-[35%] w-2 h-2 rotate-45 bg-[#D4AF37] border border-white" title="تأثير الإضاءة" />
                  <div className="absolute left-[60%] w-2 h-2 rotate-45 bg-[#D4AF37] border border-white" title="تأثير الحركة" />
                  <div className="absolute left-[12%] right-[40%] h-1 bg-white/5 pointer-events-none" />
                </div>
              </div>

              {/* 4. Track: Audio (الصوت) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">الصوت</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Lock className="w-3 h-3 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative">
                  {/* Waveform graphic */}
                  <div className="absolute left-4 right-1/4 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center px-3 overflow-hidden">
                    <div className="w-full flex items-center gap-[2px] opacity-40">
                      {[...Array(60)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-[2px] bg-emerald-400 rounded-full"
                          style={{ height: `${Math.max(4, Math.sin(i * 0.3) * 20 + 10)}px` }}
                        />
                      ))}
                    </div>
                    <span className="absolute right-3 text-[8px] font-black text-emerald-400">تلاوة القارئ</span>
                  </div>
                </div>
              </div>

              {/* 5. Track: Wave (الموجة) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">الموجة الصوتية</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Lock className="w-3 h-3 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative">
                  {state.showVisualizer && (
                    <div className="absolute left-[15%] right-[45%] h-7 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center px-3">
                      <div className="flex items-center gap-[3px] w-full justify-center">
                        {[...Array(15)].map((_, i) => (
                          <div key={i} className="w-[3px] bg-[#D4AF37] rounded-full animate-pulse" style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Track: Watermark (العلامة المائية) */}
              <div className="h-10 shrink-0 border-b border-white/[0.02] flex items-center">
                <div className="w-[120px] h-full bg-[#0d0e14] border-l border-white/5 flex items-center justify-between px-4 text-[10px] text-white/60">
                  <span className="font-bold">العلامة المائية</span>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Eye className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                    <Lock className="w-3 h-3 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex-1 h-full px-4 flex items-center relative gap-3">
                  {state.tiktokHandle && (
                    <div className="h-7 px-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[8px] font-black flex items-center gap-1.5">
                      <span>TikTok:</span>
                      <span>@{state.tiktokHandle}</span>
                    </div>
                  )}
                  {state.instaHandle && (
                    <div className="h-7 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black flex items-center gap-1.5">
                      <span>Instagram:</span>
                      <span>@{state.instaHandle}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Timeline current frame needle pointer line */}
            <div className="absolute top-[4.2rem] bottom-0 left-[55%] w-[2px] bg-primary z-20 pointer-events-none">
              <div className="w-3 h-3 rounded-full bg-primary -ml-[5px] -mt-[6px] shadow-lg shadow-primary/30" />
            </div>

          </div>

        </div>

        {/* 4. RIGHT PROPERTIES PANEL */}
        <aside className="w-[320px] shrink-0 bg-[#0c0d12] border-r border-white/5 flex flex-col overflow-hidden relative z-40">
          
          {/* Tabs at the top */}
          <div className="h-12 shrink-0 border-b border-white/5 flex bg-[#0e0f14] p-1 gap-1">
            {[
              { id: "settings", label: "الإعدادات" },
              { id: "layers", label: "الطبقات" },
              { id: "project", label: "المشروع" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeRightTab === tab.id 
                    ? "bg-white/5 text-primary border-b border-primary shadow-sm" 
                    : "text-white/40 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Properties content area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-4">
            
            {activeRightTab === "settings" && (
              <div className="flex flex-col gap-3">
                
                {/* 1. Accordion Section: المحتوى */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("content")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>المحتوى والآيات</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.content ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.content && (
                    <div className="p-4 flex flex-col gap-4 border-t border-white/5 bg-black/10">
                      {/* Surah dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 font-bold block">السورة الكريمة</label>
                        <select 
                          value={state.surahId}
                          onChange={(e) => updateState({ surahId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none"
                        >
                          {surahsData.map((s) => (
                            <option key={s.id} value={s.id.toString()} className="bg-card text-foreground">
                              {s.id}. {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start / End Ayahs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/30 font-bold block">آية البداية</label>
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <button 
                              onClick={() => updateState({ startAyah: Math.max(1, state.startAyah - 1) })}
                              className="px-3 py-2 text-white/50 hover:text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              value={state.startAyah} 
                              onChange={(e) => updateState({ startAyah: Number(e.target.value) })}
                              className="w-full text-center bg-transparent outline-none text-xs font-bold font-mono text-white"
                            />
                            <button 
                              onClick={() => updateState({ startAyah: Math.min(maxVerses, state.startAyah + 1) })}
                              className="px-3 py-2 text-white/50 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/30 font-bold block">آية النهاية</label>
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <button 
                              onClick={() => updateState({ endAyah: Math.max(state.startAyah, state.endAyah - 1) })}
                              className="px-3 py-2 text-white/50 hover:text-white"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              value={state.endAyah} 
                              onChange={(e) => updateState({ endAyah: Number(e.target.value) })}
                              className="w-full text-center bg-transparent outline-none text-xs font-bold font-mono text-white"
                            />
                            <button 
                              onClick={() => updateState({ endAyah: Math.min(maxVerses, state.endAyah + 1) })}
                              className="px-3 py-2 text-white/50 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Accordion Section: الخلفية والمشهد */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("bg")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>الخلفية والمشهد</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.bg ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.bg && (
                    <div className="p-4 flex flex-col gap-3 border-t border-white/5 bg-black/10 text-xs text-white/60">
                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                        <span>نوع المشهد:</span>
                        <span className="text-primary font-bold">{state.backgroundUrl.includes('.mp4') ? 'مقطع متحرك' : 'صورة ثابتة'}</span>
                      </div>
                      <button 
                        onClick={() => setActiveLeftTab("bg")}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-lg"
                      >
                        تغيير الخلفية من المكتبة ←
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Accordion Section: الصوت والتلاوة */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("audio")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>الصوت والتلاوة</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.audio ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.audio && (
                    <div className="p-4 flex flex-col gap-3 border-t border-white/5 bg-black/10 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                        <span className="text-white/40 font-bold">القارئ النشط:</span>
                        <span className="text-white font-bold">
                          {RECITERS.find(r => r.id === state.reciterId)?.name || state.reciterId}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveLeftTab("audio")}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-lg"
                      >
                        قائمة القراء الصوتيّة ←
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Accordion Section: تنسيق الخط والآيات */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("font")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>تنسيق الخط والآيات</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.font ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.font && (
                    <div className="p-4 flex flex-col gap-4 border-t border-white/5 bg-black/10 text-xs text-white/70">
                      {/* Font family */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30 font-bold block">الخط المستخدم</label>
                        <span className="block font-bold text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-center font-arabic">
                          {state.fontFamily || "Amiri"}
                        </span>
                      </div>

                      {/* Font Color */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 font-bold block">لون الخط</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={state.textColor}
                            onChange={(e) => updateState({ textColor: e.target.value })}
                            className="w-10 h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={state.textColor}
                            onChange={(e) => updateState({ textColor: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-full text-xs font-mono text-white outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveLeftTab("texts")}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-lg"
                      >
                        لوحة تعديل النصوص الكاملة ←
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. Accordion Section: المؤثرات والحركة */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("effects")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>المؤثرات والحركة</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.effects ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.effects && (
                    <div className="p-4 flex flex-col gap-2.5 border-t border-white/5 bg-black/10 text-xs">
                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                        <span className="text-white/40">الفلتر:</span>
                        <span className="text-white font-bold">{state.filter}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                        <span className="text-white/40">حركة النص:</span>
                        <span className="text-white font-bold">{state.animation}</span>
                      </div>
                      <button 
                        onClick={() => setActiveLeftTab("effects")}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-lg mt-1"
                      >
                        مكتبة المؤثرات الحركية ←
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Accordion Section: الموجة الصوتية */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("visualizer")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>الموجة الصوتية (Visualizer)</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.visualizer ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.visualizer && (
                    <div className="p-4 flex flex-col gap-4 border-t border-white/5 bg-black/10 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 font-bold">تفعيل ذبذبة الصوت</span>
                        <button 
                          onClick={() => updateState({ showVisualizer: !state.showVisualizer })}
                          className={`w-11 h-6 rounded-full transition-colors relative border border-white/5 ${state.showVisualizer ? 'bg-primary' : 'bg-white/10'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${state.showVisualizer ? 'left-1' : 'left-5'}`} />
                        </button>
                      </div>

                      {state.showVisualizer && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          {/* Visualizer Style */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-white/30 font-bold block">شكل الذبذبات</label>
                            <div className="grid grid-cols-3 gap-2">
                              {["bars", "wave", "dots"].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateState({ visualizerStyle: s as any })}
                                  className={`py-1 rounded border text-[9px] font-bold text-center transition-all ${
                                    state.visualizerStyle === s 
                                      ? 'bg-primary/20 border-primary text-primary' 
                                      : 'bg-white/5 border-transparent text-white/40'
                                  }`}
                                >
                                  {s === "bars" ? "أعمدة" : s === "wave" ? "موجة" : "نقاط"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Visualizer Color */}
                          <div className="space-y-2">
                            <label className="text-[10px] text-white/30 font-bold block font-arabic">لون الموجات</label>
                            <div className="flex gap-2">
                              {['#ffffff', '#FFD700', '#D4AF37', '#00E5FF', '#F43F5E', '#22C55E'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => updateState({ visualizerColor: c })}
                                  style={{ backgroundColor: c }}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    state.visualizerColor === c 
                                      ? 'border-white scale-110 ring-2 ring-white/10' 
                                      : 'border-transparent hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 7. Accordion Section: الهوية والعلامة المائية */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("branding")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>الهوية والعلامة المائية</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.branding ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.branding && (
                    <div className="p-4 flex flex-col gap-2 border-t border-white/5 bg-black/10 text-xs">
                      {state.tiktokHandle && (
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <span className="text-white/40">تيك توك:</span>
                          <span className="text-white font-mono">@{state.tiktokHandle}</span>
                        </div>
                      )}
                      {state.instaHandle && (
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <span className="text-white/40">انستقرام:</span>
                          <span className="text-white font-mono">@{state.instaHandle}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setActiveLeftTab("branding")}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-lg mt-1"
                      >
                        تعديل يوزرات التواصل ←
                      </button>
                    </div>
                  )}
                </div>

                {/* 8. Accordion Section: إعدادات متقدمة */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button 
                    onClick={() => toggleSection("advanced")}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.02] text-right font-black text-xs text-white"
                  >
                    <span>إعدادات متقدمة</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openSections.advanced ? "" : "rotate-180"}`} />
                  </button>
                  {openSections.advanced && (
                    <div className="p-4 flex flex-col gap-3 border-t border-white/5 bg-black/10 text-xs text-white/40">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <span>تقنية تسريع تصدير الفيديوهات الحية مُفعلة تلقائياً.</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeRightTab === "layers" && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-white/40 block mb-2 font-arabic">ترتيب طبقات المقطع:</span>
                {[
                  { name: "العلامة المائية (Branding)", active: !!(state.tiktokHandle || state.instaHandle) },
                  { name: "موجة الصوت (Visualizer)", active: state.showVisualizer },
                  { name: "الآيات والترجمة (Verses)", active: true },
                  { name: "تأثير الإضاءة (Overlay)", active: state.overlay !== "none" },
                  { name: "الخلفية (Background)", active: true }
                ].map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs text-white font-bold">
                    <span className={l.active ? "text-white" : "text-white/30 font-arabic"}>{l.name}</span>
                    <div className="flex items-center gap-2">
                      <button className="text-white/30 hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="text-white/30 hover:text-white">
                        <Lock className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeRightTab === "project" && (
              <div className="flex flex-col gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold block font-arabic">اسم المشروع</span>
                  <input 
                    type="text" 
                    defaultValue="مشروع قرآن تيك توك 1" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold block font-arabic">الوصف المرجعي</span>
                  <textarea 
                    defaultValue="مقطع دعوي مخصص لمنصة تيك توك وتويتر مع تلاوة الشيخ المنشاوي." 
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            )}

            {/* Bottom Templates Showcase ("عرض الكل") */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/40 uppercase">عرض القوالب السريعة</span>
                <button 
                  onClick={() => setActiveLeftTab("templates")}
                  className="text-[9px] text-primary font-black uppercase hover:underline"
                >
                  عرض الكل
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "تصميم المنشاوي", active: state.videoTemplate === "minshawi_player", img: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782848606/%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8A_filgf2.jpg" },
                  { name: "ذهبي فاخر", active: false, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=150&q=80" },
                  { name: "كلاسيك", active: state.videoTemplate !== "minshawi_player", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&h=150&q=80" },
                  { name: "بسيط", active: false, img: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=200&h=150&q=80" }
                ].map((temp, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (i === 0) {
                        updateState({
                          videoTemplate: "minshawi_player",
                          reciterId: "minsh_murattal",
                          textColor: "#FFD700",
                          fontFamily: "Amiri"
                        });
                      } else if (i === 2) {
                        updateState({
                          videoTemplate: "default",
                          fontFamily: "Amiri"
                        });
                      }
                    }}
                    className={`group relative h-20 rounded-xl overflow-hidden border transition-all ${
                      temp.active 
                        ? "border-primary shadow-lg shadow-primary/10" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <img src={temp.img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors" />
                    <span className="absolute bottom-2 right-2 text-[9px] font-black text-white">{temp.name}</span>
                    {temp.active && (
                      <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-black">
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Details & Trigger Button */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mt-4 space-y-4">
              <span className="text-[10px] font-black text-white/40 block border-b border-white/5 pb-1">معلومات التصدير</span>
              
              <div className="grid grid-cols-2 gap-y-2.5 text-[10px] text-white/60">
                <div className="flex justify-between pl-2">
                  <span>المدة:</span>
                  <span className="font-bold text-white font-mono">02:35</span>
                </div>
                <div className="flex justify-between pr-2 border-r border-white/5">
                  <span>الدقة:</span>
                  <span className="font-bold text-white font-mono">1080p FHD</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>الإطارات:</span>
                  <span className="font-bold text-white font-mono">30 FPS</span>
                </div>
                <div className="flex justify-between pr-2 border-r border-white/5">
                  <span>الحجم المتوقع:</span>
                  <span className="font-bold text-primary font-mono">~ 52 MB</span>
                </div>
              </div>

              <button 
                onClick={onOpenRender}
                className="w-full py-4 bg-primary hover:bg-primary/95 text-black font-black text-xs rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group transition-all duration-300"
              >
                <Download className="w-4 h-4 group-hover:animate-bounce" />
                <span>بدء تصدير الفيديو</span>
              </button>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
