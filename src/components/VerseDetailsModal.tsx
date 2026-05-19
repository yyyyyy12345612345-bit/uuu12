"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Languages, Loader2, Star, ChevronLeft } from "lucide-react";
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
    <div className={`fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 font-['Tajawal']`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#0c0d10] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-500">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
            <div className="absolute inset-0 islamic-pattern" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-8 md:p-12 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-8 bg-primary/30" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">تفسير الآية</span>
            </div>
            <h2 className="font-['Amiri'] text-3xl md:text-5xl font-black text-white">سورة {surahName}</h2>
            <div className="flex items-center gap-3 mt-2">
                <Star className="w-3 h-3 text-primary fill-primary opacity-40" />
                <p className="text-sm font-bold text-white/40 tracking-widest uppercase">الآية {verseKey.split(':')[1]}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 group"
          >
            <X className="w-6 h-6 text-white/40 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex px-8 md:px-12 py-6 gap-4 bg-black/20">
          {[
            { id: 'tafsir', label: 'تفسير السعدي', icon: BookOpen },
            { id: 'translation', label: 'التفسير الميسر', icon: Languages },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-bold text-xs md:text-sm border ${
                activeTab === tab.id 
                  ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 md:p-14 pb-20 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-8">
              <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">جاري جلب التفسير...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Verse Text Display */}
              <div className="mb-16 text-center p-10 md:p-14 bg-white/5 rounded-[3rem] border border-white/10 relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0c0d10] px-6 py-1.5 rounded-full border border-primary/40 text-[10px] font-black text-primary uppercase tracking-widest z-10 whitespace-nowrap shadow-xl">نص الآية الكريمة</div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-['Amiri'] text-4xl md:text-6xl font-bold text-white leading-[1.8] drop-shadow-2xl relative z-10" dir="rtl">
                  {verseData?.text_uthmani}
                </p>
              </div>

              {/* Tab Content */}
              <div dir="rtl" className="max-w-2xl mx-auto">
                  {activeTab === 'tafsir' && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">تفسير السعدي</h3>
                            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">تيسير الكريم الرحمن</p>
                        </div>
                      </div>
                      <div 
                        className="text-2xl md:text-3xl leading-[2.4] text-white/80 font-medium font-arabic text-justify md:text-right"
                        dangerouslySetInnerHTML={{ __html: tafsir?.text || "التفسير غير متوفر حالياً" }}
                      />
                    </div>
                  )}

                  {activeTab === 'translation' && (
                    <div className="space-y-12">
                      {verseData?.translations?.map((t: any) => (
                        <div key={t.id} className="space-y-8 p-10 rounded-[3rem] bg-white/[0.03] border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20">
                                <Languages className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">التفسير الميسر</h3>
                                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">مجمع الملك فهد</p>
                            </div>
                          </div>
                          <p className="text-2xl md:text-3xl leading-relaxed text-white/90 font-arabic font-bold text-right">
                            {t.text.replace(/<[^>]*>?/gm, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
