"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, BookOpen, Share2, Copy, Star, Heart, Bookmark, ArrowLeft, LayoutDashboard } from "lucide-react";
import { startThikrTimer, endThikrTimer } from "@/lib/points";

interface Category {
  ID: string;
  TITLE: string;
  AUDIO_URL: string;
}

interface Thikr {
  ID: string;
  ARABIC_TEXT: string;
  REPEAT: string;
  TRANSLATED_TEXT: string;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    "1": "ابدأ يومك بنور الذكر وطمأنينة القلب",
    "2": "طمأنينة المساء وحفظ الله في الليل",
    "3": "لحفظ النفس عند المنام وراحة الروح",
    "4": "الذكر عند الاستيقاظ وشكر النعمة",
    "5": "جوامع الكلم من التنزيل الحكيم",
    "6": "ما صح عن خير الأنام في كل حال",
};

export function AthkarLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [athkar, setAthkar] = useState<Thikr[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://www.hisnmuslim.com/api/ar/husn_ar.json");
      const data = await res.json();
      const langKey = Object.keys(data)[0];
      setCategories(data[langKey]);
      setFilteredCategories(data[langKey]);
    } catch (err) {
      console.error("Failed to fetch Athkar categories", err);
    }
    setLoading(false);
  };

  const fetchAthkar = async (categoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.hisnmuslim.com/api/ar/${categoryId}.json`);
      const data = await res.json();
      const catKey = Object.keys(data)[0];
      setAthkar(data[catKey]);
    } catch (err) {
      console.error("Failed to fetch Athkar list", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredCategories(categories.filter(c => c.TITLE.includes(search)));
    } else {
      setFilteredCategories(categories);
    }
  }, [search, categories]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const thikrId = entry.target.getAttribute("data-thikr-id");
            if (thikrId) {
              endThikrTimer(0.5).then((res) => {
                if (res?.success) console.log("Earned points for Thikr");
              });
              startThikrTimer(thikrId);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll("[data-thikr-id]");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [athkar, selectedCategory]);

  if (selectedCategory) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-40 font-arabic">
        {/* Detail Header */}
        <div className="flex flex-col gap-6">
            <button 
                onClick={() => { setSelectedCategory(null); setAthkar([]); }}
                className="flex items-center gap-3 text-primary font-black hover:opacity-70 transition-all self-start bg-primary/10 px-6 py-3 rounded-2xl"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>العودة للمكتبة</span>
            </button>

            <div className="relative bg-[#0c0d10] border border-primary/30 rounded-[3rem] p-10 text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 islamic-pattern opacity-10" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <h3 className="text-4xl font-black mb-4 drop-shadow-lg">{selectedCategory.TITLE}</h3>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                        <Star className="w-4 h-4 fill-current" />
                        <span>حصن المسلم الشريف</span>
                        <Star className="w-4 h-4 fill-current" />
                    </div>
                </div>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
            <div className="space-y-6">
                {athkar.map((t, idx) => (
                    <div 
                      key={idx} 
                      data-thikr-id={`${selectedCategory.ID}-${idx}`}
                      className="bg-card border border-border rounded-[3rem] p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all relative group overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <BookOpen className="w-40 h-40" />
                        </div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">الذكر {idx + 1}</span>
                            <div className="flex gap-2">
                                <button className="p-3 rounded-2xl bg-foreground/5 text-foreground/40 hover:text-primary transition-all"><Copy className="w-5 h-5" /></button>
                                <button className="p-3 rounded-2xl bg-foreground/5 text-foreground/40 hover:text-primary transition-all"><Share2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <p className="text-3xl md:text-5xl font-black leading-[1.8] md:leading-[2] text-foreground text-center mb-10 relative z-10 font-arabic">
                            {t.ARABIC_TEXT}
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-border/50 relative z-10">
                             <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-[#0c0d10] flex flex-col items-center justify-center text-white border-2 border-primary shadow-xl">
                                    <span className="text-[8px] font-black uppercase opacity-60">تكرار</span>
                                    <span className="text-3xl font-black">{t.REPEAT || "١"}</span>
                                </div>
                                {t.TRANSLATED_TEXT && <p className="text-sm text-foreground/40 italic font-bold max-w-xs">{t.TRANSLATED_TEXT}</p>}
                             </div>
                             <button className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg">
                                <Bookmark className="w-5 h-5" />
                                <span>تم القراءة</span>
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 font-arabic pb-40">
      {/* Search Header */}
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl mx-auto">
          <div className="space-y-4">
              <h2 className="text-5xl font-black text-foreground">المكتبة الشاملة</h2>
              <p className="text-foreground/40 font-bold text-lg leading-relaxed">ابحث في كنوز الأذكار والأدعية اليومية من صحيح السنة النبوية</p>
          </div>
          <div className="relative w-full group">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن موضوع أو ذكر..."
                className="w-full bg-card border border-border rounded-[2rem] py-6 pr-16 pl-8 text-xl text-foreground outline-none focus:border-primary/40 focus:shadow-2xl transition-all font-black shadow-lg"
              />
          </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.slice(0, 100).map((c, idx) => (
            <button 
              key={c.ID}
              onClick={() => { setSelectedCategory(c); fetchAthkar(c.ID); }}
              className="flex items-center justify-between p-8 rounded-[2.5rem] bg-card border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-all group text-right shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-foreground/5 flex items-center justify-center group-hover:bg-primary transition-all border border-border group-hover:border-primary/20">
                    <BookOpen className="w-7 h-7 text-foreground/20 group-hover:text-primary-foreground transition-all" />
                 </div>
                 <div className="text-right">
                    <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors mb-1">{c.TITLE}</h3>
                    <p className="text-xs text-foreground/30 font-bold uppercase tracking-widest">{CATEGORY_DESCRIPTIONS[c.ID] || "حصن المسلم الشريف"}</p>
                 </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                <ChevronRight className="w-6 h-6 text-foreground/10 group-hover:text-primary transition-all" />
              </div>
            </button>
          ))}

        </div>
      )}
    </div>
  );
}
