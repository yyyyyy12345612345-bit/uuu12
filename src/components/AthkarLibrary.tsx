"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, BookOpen, Share2, Copy, Sparkles } from "lucide-react";

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
                className="relative bg-white dark:bg-[#1a1714] p-10 rounded-[3rem] border-r-8 border-r-[#06402B] border-l border-y border-border shadow-xl overflow-hidden group hover:shadow-2xl transition-all"
              >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }} />
                  
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-[#06402B]">
                          <path d="M100 0 L100 100 Q50 50 0 0 Z" />
                      </svg>
                  </div>

                  <div className="absolute top-6 left-8 flex items-center justify-center bg-[#06402B]/5 px-4 py-1 rounded-full">
                      <span className="text-[10px] font-black text-[#06402B]/40 tracking-widest">الذكر {idx + 1}</span>
                  </div>
                  
                  <p className="text-2xl md:text-3xl font-arabic leading-[2.2] text-foreground text-center mb-10 pt-6 font-medium">
                    {t.ARABIC_TEXT}
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-border/50">
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#06402B] shadow-lg flex flex-col items-center justify-center border-2 border-[#d4af37]/30 transform group-hover:scale-105 transition-transform">
                                <span className="text-[8px] text-[#d4af37] font-black uppercase mb-1">تكرار</span>
                                <span className="text-2xl font-black text-white leading-none">{t.REPEAT || "1"}</span>
                            </div>
                         </div>
                         {t.TRANSLATED_TEXT && (
                             <p className="text-sm text-foreground/40 font-arabic max-w-[200px] leading-relaxed">
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
      {/* Deluxe Search Bar */}
      <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#06402B] via-[#d4af37] to-[#06402B] rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#06402B]/30 group-focus-within:text-[#06402B] transition-colors" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن أي ذكر أو دعاء..."
                className="w-full bg-white dark:bg-[#1a1714] border-2 border-transparent focus:border-[#d4af37]/30 rounded-[2rem] py-7 pr-16 pl-10 text-xl text-foreground outline-none transition-all font-arabic shadow-2xl placeholder:text-foreground/20"
              />
          </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center py-20">
           <div className="w-12 h-12 border-4 border-[#06402B] border-t-transparent rounded-full animate-spin shadow-md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCategories.map((c) => (
            <button 
              key={c.ID}
              onClick={() => { setSelectedCategory(c); fetchAthkar(c.ID); }}
              className="flex items-center justify-between p-7 rounded-[2.5rem] bg-white dark:bg-[#1a1714] border border-border hover:border-[#d4af37]/40 hover:bg-[#06402B]/5 transition-all group text-right active:scale-95 shadow-lg hover:shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/islamic-art.png')" }} />
              
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 rounded-3xl bg-[#06402B]/5 flex items-center justify-center group-hover:bg-[#06402B] group-hover:shadow-lg transition-all duration-500">
                    <BookOpen className="w-7 h-7 text-[#06402B] group-hover:text-white transition-colors" />
                 </div>
                 <div className="flex flex-col items-start gap-1">
                    <span className="text-xl font-black text-foreground group-hover:text-[#06402B] transition-colors font-arabic leading-tight">
                        {c.TITLE}
                    </span>
                    <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">
                        قراءة الأذكار
                    </span>
                 </div>
              </div>
              <ChevronRight className="w-6 h-6 text-foreground/10 group-hover:text-[#06402B] group-hover:translate-x-2 transition-all duration-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
