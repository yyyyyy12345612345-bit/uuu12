"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, BookOpen, Share2, Copy, Sparkles } from "lucide-react";
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
    const container = document.querySelector('.daily-hub-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  // Points Tracking Observer for Athkar
  useEffect(() => {
    if (!selectedCategory || athkar.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const thikrId = entry.target.getAttribute("data-thikr-id");
            if (thikrId) {
              endThikrTimer(thikrId, 0.5).then(res => {
                if (res?.success) {
                   console.log(`Earned 0.5 points for Thikr ${thikrId}`);
                }
              });
              startThikrTimer(thikrId);
            }
          }
        });
      },
      { threshold: 0.8 } // Must see 80% of the Thikr to start counting
    );

    const thikrElements = document.querySelectorAll("[data-thikr-id]");
    thikrElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [selectedCategory, athkar]);

  if (selectedCategory) {
    return (
      <div className="flex flex-col gap-8 animate-in slide-in-from-left-6 duration-700 pb-24">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
            <button 
                onClick={() => { setSelectedCategory(null); setAthkar([]); }}
                className="flex items-center gap-2 text-[#8a6d3b] hover:text-[#d4af37] transition-all self-start"
            >
                <ChevronLeft className="w-5 h-5 translate-y-[1px]" />
                <span className="font-bold font-arabic">العودة إلى المكتبة الشاملة</span>
            </button>

            <div className="relative overflow-hidden p-8 rounded-[2.5rem] border-2 border-[#d4af37]/30 bg-[#06402B] text-white shadow-2xl">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/islamic-art.png')" }} />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-1 bg-[#d4af37] rounded-full mb-4 opacity-50" />
                    <h3 className="text-3xl font-black text-center mb-2 font-arabic tracking-tight drop-shadow-md">
                        {selectedCategory.TITLE}
                    </h3>
                    <div className="flex items-center gap-2 text-[#d4af37] text-sm font-bold uppercase tracking-widest">
                        <Sparkles className="w-4 h-4" />
                        <span>حصن المسلم الشريف</span>
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
             <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin shadow-lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {athkar.map((t, idx) => (
              <div 
                key={idx} 
                data-thikr-id={`${selectedCategory.ID}-${idx}`}
                className="relative bg-card p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border-r-8 border-r-secondary border border-border shadow-xl overflow-hidden group hover:shadow-2xl transition-all"
              >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none islamic-pattern" />
                  
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-secondary">
                          <path d="M100 0 L100 100 Q50 50 0 0 Z" />
                      </svg>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                      <div className="bg-foreground/5 px-4 py-1.5 rounded-full border border-border/40">
                          <span className="text-[10px] font-black text-foreground/40 tracking-widest">الذكر {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-primary" />
                         <div className="w-2 h-2 rounded-full bg-primary/40" />
                         <div className="w-2 h-2 rounded-full bg-primary/20" />
                      </div>
                  </div>
                  
                  <p className="text-2xl md:text-4xl font-arabic leading-[2] md:leading-[2.4] text-foreground text-center mb-10 font-bold drop-shadow-sm">
                    {t.ARABIC_TEXT}
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-border/50">
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-secondary shadow-lg flex flex-col items-center justify-center border-2 border-primary/30 transform group-hover:scale-105 transition-transform overflow-hidden relative">
                                <div className="absolute inset-0 bg-primary/10 opacity-30" />
                                <span className="relative z-10 text-[8px] text-primary font-black uppercase mb-1">تكرار</span>
                                <span className="relative z-10 text-2xl font-black text-white leading-none">{t.REPEAT || "1"}</span>
                            </div>
                         </div>
                         {t.TRANSLATED_TEXT && (
                             <p className="text-sm text-foreground/60 font-arabic max-w-[240px] leading-relaxed italic">
                                {t.TRANSLATED_TEXT}
                             </p>
                         )}
                      </div>

                       <div className="flex items-center gap-4">
                           <button className="flex items-center gap-2 px-5 py-3 bg-foreground/5 rounded-2xl text-foreground/60 hover:text-white hover:bg-[#06402B] transition-all border border-transparent hover:border-[#d4af37]/30">
                              <Copy className="w-5 h-5" />
                              <span className="text-sm font-bold font-arabic">نسخ</span>
                           </button>
                           <button className="flex items-center gap-2 px-5 py-3 bg-foreground/5 rounded-2xl text-foreground/60 hover:text-white hover:bg-[#06402B] transition-all border border-transparent hover:border-[#d4af37]/30">
                              <Share2 className="w-5 h-5" />
                              <span className="text-sm font-bold font-arabic">مشاركة</span>
                           </button>
                       </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Balanced Search Bar */}
      <div className="relative group max-w-xl mx-auto">
          <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-[#06402B] transition-colors" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن ذكر..."
                className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-5 pr-14 pl-8 text-lg text-foreground outline-none focus:border-[#06402B]/30 transition-all font-arabic"
              />
          </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center py-20">
           <div className="w-12 h-12 border-4 border-[#06402B] border-t-transparent rounded-full animate-spin shadow-md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredCategories.map((c) => (
            <button 
              key={c.ID}
              onClick={() => { setSelectedCategory(c); fetchAthkar(c.ID); }}
              className="flex items-center justify-between p-6 rounded-[2rem] bg-card/60 dark:bg-foreground/[0.03] backdrop-blur-md border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-all group text-right shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-5 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all shadow-inner">
                    <BookOpen className="w-6 h-6 text-primary group-hover:text-black transition-colors" />
                 </div>
                 <div className="flex flex-col items-start text-right">
                    <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors font-arabic leading-tight">
                        {c.TITLE}
                    </span>
                    <span className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest mt-1">حصن المسلم</span>
                 </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                <ChevronRight className="w-5 h-5 text-foreground/20 group-hover:text-primary transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
