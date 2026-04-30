"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Languages, Loader2, Book } from "lucide-react";
import { fetchVerseTafsir, fetchVerseTranslations } from "@/lib/quranUtils";

interface VerseDetailsModalProps {
  verseKey: string;
  onClose: () => void;
  surahName: string;
}

export function VerseDetailsModal({ verseKey, onClose, surahName }: VerseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'tafsir' | 'translation'>('tafsir');
  const [loading, setLoading] = useState(true);
  const [tafsir, setTafsir] = useState<any>(null);
  const [verseData, setVerseData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tData, vData] = await Promise.all([
          fetchVerseTafsir(verseKey, 91), // 91: Tafsir Al-Saadi (Arabic)
          fetchVerseTranslations(verseKey, [16]) // 16: Moyassar (Arabic)
        ]);
        setTafsir(tData);
        setVerseData(vData);
      } catch (error) {
        console.error("Failed to load verse details", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [verseKey]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold font-arabic text-foreground">سورة {surahName}</h2>
            <p className="text-xs font-bold text-primary tracking-widest uppercase opacity-60">الآية {verseKey.split(':')[1]}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all">
            <X className="w-5 h-5 text-foreground/40" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-4 md:px-8 py-4 gap-2 border-b border-border bg-foreground/[0.01]">
          {[
            { id: 'tafsir', label: 'التفسير', icon: BookOpen },
            { id: 'translation', label: 'الميسر', icon: Languages },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-xs md:text-sm ${
                activeTab === tab.id 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                  : 'text-foreground/40 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="text-xs font-black text-foreground/20 uppercase tracking-[0.3em]">جاري جلب البيانات...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Verse Text Display */}
              <div className="mb-10 text-center p-8 bg-primary/[0.03] rounded-[2rem] border border-primary/10 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-950 px-4 py-1 rounded-full border border-primary/20 text-[10px] font-black text-primary">نص الآية</div>
                <p className="text-3xl md:text-4xl font-arabic font-bold text-foreground leading-[1.8]" dir="rtl">
                  {verseData?.text_uthmani}
                </p>
              </div>

              {/* Tab Content */}
              {activeTab === 'tafsir' && (
                <div className="space-y-6" dir="rtl">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    تفسير السعدي
                  </h3>
                  <div 
                    className="text-lg leading-[2.2] text-foreground/80 font-medium font-arabic text-justify"
                    dangerouslySetInnerHTML={{ __html: tafsir?.text || "التفسير غير متوفر حالياً" }}
                  />
                </div>
              )}

              {activeTab === 'translation' && (
                <div className="space-y-8" dir="rtl">
                  {verseData?.translations?.map((t: any) => (
                    <div key={t.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">AR</div>
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                          التفسير الميسر
                        </span>
                      </div>
                      <p className="text-lg leading-relaxed text-foreground/80 font-arabic font-bold text-right">
                        {t.text.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-foreground/[0.02] border-t border-border flex items-center justify-center gap-8">
           <div className="flex items-center gap-2 opacity-30">
              <Book className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Quran.com Professional API v4</span>
           </div>
        </div>
      </div>
    </div>
  );
}
