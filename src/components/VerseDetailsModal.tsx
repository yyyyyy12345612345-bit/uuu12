"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Languages, Loader2, Star, ChevronLeft, Sparkles } from "lucide-react";
import { fetchVerseTafsir, fetchVerseTranslations } from "@/lib/quranUtils";
import { ReflectionTab } from "./ReflectionTab";


interface VerseDetailsModalProps {
  verseKey: string;
  onClose: () => void;
  surahName: string;
}

export function VerseDetailsModal({ verseKey, onClose, surahName }: VerseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'tafsir' | 'translation' | 'reflection'>('tafsir');
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
    <div className={`fixed inset-0 z-[3000] flex items-center justify-center p-2 md:p-6 animate-in fade-in duration-300 font-['Tajawal']`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-500">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
            <div className="absolute inset-0 islamic-pattern" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-4 md:p-6 border-b border-border flex items-center justify-between bg-gradient-to-b from-foreground/[0.03] to-transparent">
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-6 bg-primary/30" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">تفسير الآية</span>
            </div>
            <h2 className="font-['Amiri'] text-2xl md:text-3xl font-black text-foreground">سورة {surahName}</h2>
            <div className="flex items-center gap-3 mt-1">
                <Star className="w-2.5 h-2.5 text-primary fill-primary opacity-40" />
                <p className="text-xs font-bold text-foreground/45 tracking-widest uppercase">الآية {verseKey.split(':')[1]}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all border border-border group"
          >
            <X className="w-5 h-5 text-foreground/45 group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex px-4 md:px-6 py-3 gap-2 bg-foreground/[0.03]">
          {[
            { id: 'tafsir', label: 'تفسير السعدي', icon: BookOpen },
            { id: 'translation', label: 'التفسير الميسر', icon: Languages },
            { id: 'reflection', label: 'تدبر ومشاركة ✨', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-bold text-xs md:text-sm border ${
                activeTab === tab.id 
                  ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' 
                  : 'bg-foreground/5 border-border text-foreground/45 hover:bg-foreground/10 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 pb-10 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em]">جاري جلب التفسير...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Verse Text Display */}
              <div className="mb-6 text-center p-4 md:p-6 bg-foreground/5 rounded-2xl border border-border relative group">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-4 py-1 rounded-full border border-primary/40 text-[9px] font-black text-primary uppercase tracking-widest z-10 whitespace-nowrap shadow-xl">نص الآية الكريمة</div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-['Amiri'] text-2xl md:text-3xl font-bold text-foreground leading-[1.8] drop-shadow-2xl relative z-10" dir="rtl">
                  {verseData?.text_uthmani}
                </p>
              </div>

              {/* Tab Content */}
              <div dir="rtl" className="max-w-2xl mx-auto">
                  {activeTab === 'tafsir' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">تفسير السعدي</h3>
                            <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">تيسير الكريم الرحمن</p>
                        </div>
                      </div>
                      <div 
                        className="text-lg md:text-xl leading-[1.8] text-foreground/80 font-medium font-arabic text-justify md:text-right"
                        dangerouslySetInnerHTML={{ __html: tafsir?.text || "التفسير غير متوفر حالياً" }}
                      />
                    </div>
                  )}

                  {activeTab === 'translation' && (
                    <div className="space-y-4">
                      {verseData?.translations?.map((t: any) => (
                        <div key={t.id} className="space-y-4 p-4 rounded-2xl bg-foreground/[0.03] border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20">
                                <Languages className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-foreground">التفسير الميسر</h3>
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">مجمع الملك فهد</p>
                            </div>
                          </div>
                          <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-arabic font-bold text-right">
                            {t.text.replace(/<[^>]*>?/gm, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'reflection' && (
                    <ReflectionTab
                      verseText={verseData?.text_uthmani || ""}
                      verseKey={verseKey}
                      surahName={surahName}
                    />
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
