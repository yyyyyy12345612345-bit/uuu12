"use client";

import React, { useState } from "react";
import { Search, X, Check, ArrowRight, Loader2 } from "lucide-react";
import { useEditor } from "@/store/useEditor";
import surahsData from "@/data/surahs.json";

/**
 * AyahSearchModal
 * Provides search functionality to find specific verses for video rendering
 */

export function AyahSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { updateState } = useEditor();

  const normalizeArabic = (text: string) => {
    return text
      .replace(/[ًٌٍَُِّْ]/g, "") // إزالة التشكيل
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults([]);
    
    try {
      // 1. Try search with the user's exact query (honoring Tashkeel)
      const url = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=20&language=ar`;
      const resp = await fetch(url);
      
      if (!resp.ok) throw new Error(`Quran API returned ${resp.status}`);
      
      const data = await resp.json();
      let searchResults = data?.search?.results || [];

      // 2. Fallback: If no results found with original query, try with normalized query
      if (searchResults.length === 0) {
        const normalizedQuery = normalizeArabic(query);
        if (normalizedQuery !== query) {
          const fallbackUrl = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(normalizedQuery)}&size=20&language=ar`;
          const fallbackResp = await fetch(fallbackUrl);
          if (fallbackResp.ok) {
            const fallbackData = await fallbackResp.json();
            searchResults = fallbackData?.search?.results || [];
          }
        }
      }
      
      const formattedResults = searchResults.map((res: any) => {
        return {
          verse_key: res.verse_key,
          renderedText: res.text || res.verse_text || "آية قرآنية"
        };
      });

      setResults(formattedResults);
    } catch (err) {
      console.error("Quran Search Error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-border bg-foreground/[0.02] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-2xl font-black font-arabic mb-1 text-primary">محرك بحث الآيات</h3>
            <p className="text-[10px] text-foreground/20 uppercase tracking-[0.3em] font-bold">Smart Video Selection System</p>
          </div>
          <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center bg-foreground/5 border border-border rounded-full hover:bg-foreground/10 transition-all group"
          >
                <X className="w-5 h-5 text-foreground/40 group-hover:text-foreground" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-8 shrink-0 border-b border-border">
          <div className="relative">
            <input 
               autoFocus
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               placeholder="اكتب كلمة من الآية... (مثلاً: الرحمن)"
               className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-6 pr-14 pl-6 text-foreground outline-none focus:border-primary/40 focus:bg-foreground/5 transition-all font-arabic text-xl"
            />
            <button 
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">جاري البحث في المصحف...</span>
             </div>
           ) : results.length > 0 ? (
             <div className="flex flex-col gap-4">
                {results.map((res: any, idx: number) => {
                    const [surahId, ayahId] = res.verse_key.split(':');
                    const surahName = surahsData.find(s => s.id === parseInt(surahId))?.name;
                    
                    return (
                        <div key={idx} className="p-6 rounded-3xl bg-foreground/[0.02] border border-border hover:border-primary/20 hover:bg-foreground/[0.04] transition-all group">
                            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                                <span className="text-[10px] text-primary font-bold">سورة {surahName}</span>
                                <span className="text-[10px] text-foreground/20 font-mono italic">{res.verse_key}</span>
                            </div>

                            <p 
                                className="text-right text-xl font-arabic mb-6 leading-[2.2] text-foreground/90" 
                                dangerouslySetInnerHTML={{ __html: res.renderedText }} 
                            />
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => {
                                        updateState({ surahId: surahId.toString(), startAyah: parseInt(ayahId), endAyah: parseInt(ayahId) });
                                        onClose();
                                    }}
                                    className="flex-1 py-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary hover:text-black transition-all"
                                >
                                    اختيار هذه الآية
                                </button>
                            </div>
                        </div>
                    );
                })}
             </div>
           ) : query && !isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 text-foreground/20 text-center">
                <Search className="w-12 h-12 mb-4 opacity-5" />
                <p className="text-sm font-arabic">لا توجد نتائج.. حاول كتابة الكلمة بشكل مختلف</p>
             </div>
           ) : null}
        </div>
      </div>
    </div>
  );
}
