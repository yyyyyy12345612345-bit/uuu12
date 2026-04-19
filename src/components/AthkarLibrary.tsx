"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Play, BookOpen, Clock, Heart, Share2, Copy } from "lucide-react";

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
      // The API returns an object where keys are category names (which is weird)
      // Actually it returns { "العربية": [ { "ID": "27", "TITLE": "...", "AUDIO_URL": "..." } ] }
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

  // Scroll to top when category changes
  useEffect(() => {
    const container = document.querySelector('.daily-hub-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  if (selectedCategory) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 duration-500 pb-20">
        <button 
          onClick={() => { setSelectedCategory(null); setAthkar([]); }}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors self-start mb-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold">العودة للمكتبة</span>
        </button>

        <div className="glass-effect p-8 rounded-[2rem] border border-primary/20 bg-primary/5">
           <h3 className="text-2xl font-bold text-foreground mb-2 text-center">{selectedCategory.TITLE}</h3>
           <p className="text-primary/60 text-sm text-center font-arabic">حصن المسلم</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {athkar.map((t, idx) => (
              <div key={idx} className="glass-effect p-8 rounded-[2.5rem] border border-border relative overflow-hidden group">
                  <div className="absolute top-6 right-8 text-[10px] font-bold text-foreground/20 uppercase tracking-[0.3em]">
                      الذكر #{idx + 1}
                  </div>
                  
                  <p className="text-xl md:text-2xl font-arabic leading-[2] text-foreground text-center mb-8 pt-4">
                    {t.ARABIC_TEXT}
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border pt-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                            <span className="text-xs text-primary font-bold">التكرار</span>
                            <span className="text-lg font-black text-foreground">{t.REPEAT || "1"}</span>
                         </div>
                      </div>

                       <div className="flex items-center gap-3">
                          <button className="p-3 bg-foreground/5 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all">
                             <Copy className="w-5 h-5" />
                          </button>
                          <button className="p-3 bg-foreground/5 rounded-xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all">
                             <Share2 className="w-5 h-5" />
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في أذكار حصن المسلم..."
            className="w-full bg-foreground/5 border border-border rounded-3xl py-6 pr-14 pl-8 text-lg text-foreground outline-none focus:border-primary/20 transition-all font-arabic shadow-2xl"
          />
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center py-20">
           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((c) => (
            <button 
              key={c.ID}
              onClick={() => { setSelectedCategory(c); fetchAthkar(c.ID); }}
              className="flex items-center justify-between p-6 rounded-3xl glass-effect border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-right active:scale-95"
            >
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-foreground/20 group-hover:text-primary transition-colors" />
                 </div>
                 <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{c.TITLE}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
