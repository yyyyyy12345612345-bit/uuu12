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

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      // Search Quran API for matching verses with encoded query
      const url = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=20&language=ar`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      // The API returns results in data.search.results
      const searchResults = data.search?.results || [];
      setResults(searchResults);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header - Advanced Glassmorphism */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-black font-arabic mb-1 text-primary">ابحث عن آية للفيديو</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Smart Quran Search</p>
          </div>
          <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-full hover:bg-white/10 hover:border-white/10 transition-all active:scale-95 group"
          >
                <X className="w-6 h-6 text-white/40 group-hover:text-white" />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-8 shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="relative group">
            <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <Search className="w-6 h-6 text-primary shadow-2xl" />
            </div>
            {isLoading && (
                 <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                 </div>
            )}
            <input 
               autoFocus
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               placeholder="اكتب كلمة من الآية... (مثلاً: الرحمن)"
               className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 pr-16 pl-8 text-white outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all font-arabic text-xl placeholder:text-white/10 shadow-inner"
            />
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-40">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Designing Results...</span>
             </div>
           ) : results.length > 0 ? (
             <div className="flex flex-col gap-6">
                {results.map((res: any, idx: number) => {
                    const [surahId, ayahId] = res.verse_key.split(':');
                    const surahName = surahsData.find(s => s.id === parseInt(surahId))?.name;
                    
                    return (
                        <div key={idx} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Surah Indicator */}
                            <div className="absolute top-0 left-0 px-6 py-2 bg-primary/5 border-r border-b border-primary/10 rounded-br-2xl text-[9px] font-bold text-primary/40 group-hover:text-primary transition-colors">
                                سورة {surahName}
                            </div>

                            <p 
                                className="text-right text-xl md:text-2xl font-arabic mb-8 leading-[2.2] text-white/90 group-hover:text-white transition-colors pt-4" 
                                dangerouslySetInnerHTML={{ __html: res.text }} 
                            />
                            
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest font-mono">Verse {res.verse_key}</span>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            updateState({ surahId: surahId, startAyah: parseInt(ayahId) });
                                            // Analytics: Track selection
                                            // @ts-ignore
                                            window.gtag?.('event', 'video_ayah_search_select', { 'type': 'start', 'key': res.verse_key });
                                            onClose();
                                        }}
                                        className="px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-bold text-primary hover:bg-primary hover:text-black transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Check className="w-3 h-3" />
                                        <span>بداية المقطع</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            updateState({ surahId: surahId, endAyah: parseInt(ayahId) });
                                            // @ts-ignore
                                            window.gtag?.('event', 'video_ayah_search_select', { 'type': 'end', 'key': res.verse_key });
                                            onClose();
                                        }}
                                        className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                    >
                                        نهاية المقطع
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
           ) : query && (
             <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Search className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-arabic">لم نجد آيات مطابقة للبحث</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
