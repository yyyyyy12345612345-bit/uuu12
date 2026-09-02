"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Sparkles, Check } from "lucide-react";
import { fetchVerseTafsir, fetchVerseDetails, ARABIC_TAFSIRS } from "@/lib/quranUtils";
import { ReflectionTab } from "./ReflectionTab";

interface VerseDetailsModalProps {
  verseKey: string;
  onClose: () => void;
  surahName: string;
}

export function VerseDetailsModal({ verseKey, onClose, surahName }: VerseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'tafsir' | 'reflection'>('tafsir');
  const [selectedTafsirId, setSelectedTafsirId] = useState<number>(16); // Default: السعدي
  const [loading, setLoading] = useState(true);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirText, setTafsirText] = useState<string>("");
  const [verseData, setVerseData] = useState<any>(null);

  // Initial Load (Verse text & default tafsir)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [tafsirRes, vRes] = await Promise.all([
          fetchVerseTafsir(verseKey, selectedTafsirId),
          fetchVerseDetails(verseKey)
        ]);
        if (isMounted) {
          setTafsirText(tafsirRes?.text || "التفسير غير متوفر حالياً لهذه الآية");
          setVerseData(vRes);
        }
      } catch (err) {
        console.error("Error loading verse details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [verseKey]);

  // Handle Changing Tafsir Scholar
  const handleSelectTafsir = async (id: number) => {
    if (id === selectedTafsirId) return;
    setSelectedTafsirId(id);
    setTafsirLoading(true);
    try {
      const res = await fetchVerseTafsir(verseKey, id);
      setTafsirText(res?.text || "التفسير غير متوفر حالياً لهذه الآية");
    } catch (e) {
      console.error(e);
      setTafsirText("حدث خطأ أثناء تحميل التفسير");
    } finally {
      setTafsirLoading(false);
    }
  };

  const currentTafsirInfo = ARABIC_TAFSIRS.find(t => t.id === selectedTafsirId) || ARABIC_TAFSIRS[0];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-300">
        
        {/* Aesthetic Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute inset-0 islamic-pattern" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-4 md:p-6 border-b border-border flex items-center justify-between bg-gradient-to-b from-foreground/[0.03] to-transparent">
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-6 bg-primary/40" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">التفسير والتدبر</span>
            </div>
            <h2 className="font-['Amiri'] text-2xl md:text-3xl font-black text-foreground">سورة {surahName || (verseData?.surah_name ? `سورة ${verseData.surah_name}` : "")}</h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-bold text-foreground/60 tracking-widest">الآية رقم {verseKey.split(':')[1] || verseData?.verse_number}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all border border-border group"
          >
            <X className="w-5 h-5 text-foreground/50 group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex px-4 md:px-6 py-2.5 gap-2 bg-foreground/[0.02] border-b border-border">
          {[
            { id: 'tafsir', label: 'تفسير الآية', icon: BookOpen },
            { id: 'reflection', label: 'تدبر ومشاركة', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-bold text-xs md:text-sm border ${
                activeTab === tab.id 
                  ? 'bg-primary border-primary text-black shadow-md shadow-primary/20' 
                  : 'bg-card border-border text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 pb-8 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-foreground/40 tracking-widest">جاري جلب التفسير المعتمد...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
              
              {/* Verse Text Display */}
              <div className="text-center p-5 md:p-6 bg-foreground/[0.02] rounded-2xl border border-border relative group">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-4 py-0.5 rounded-full border border-primary/40 text-[9px] font-black text-primary uppercase tracking-widest z-10 whitespace-nowrap shadow-sm">
                  نص الآية الكريمة
                </div>
                <p className="font-['Amiri'] text-2xl md:text-3xl font-bold text-foreground leading-[2.1] drop-shadow-sm pt-2" dir="rtl">
                  {verseData?.text_uthmani}
                </p>
              </div>

              {/* Tab: Tafsir */}
              {activeTab === 'tafsir' && (
                <div dir="rtl" className="space-y-4">
                  {/* Tafsir Selectors (Tabs) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {ARABIC_TAFSIRS.map((t) => {
                      const isSelected = selectedTafsirId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTafsir(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary/15 border-primary text-primary shadow-xs"
                              : "bg-card border-border text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tafsir Box */}
                  <div className="p-5 md:p-6 rounded-2xl bg-foreground/[0.02] border border-border space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-foreground">{currentTafsirInfo.name}</h3>
                          <p className="text-[10px] text-foreground/50">{currentTafsirInfo.author}</p>
                        </div>
                      </div>
                    </div>

                    {tafsirLoading ? (
                      <div className="py-10 flex items-center justify-center gap-2 text-foreground/40 text-xs">
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span>جاري تحميل تفسير {currentTafsirInfo.name}...</span>
                      </div>
                    ) : (
                      <div 
                        className="text-base md:text-lg leading-[2.1] text-foreground/85 font-arabic font-normal text-justify"
                        dangerouslySetInnerHTML={{ __html: tafsirText }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Reflection */}
              {activeTab === 'reflection' && (
                <ReflectionTab
                  verseText={verseData?.text_uthmani || ""}
                  verseKey={verseKey}
                  surahName={surahName}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
