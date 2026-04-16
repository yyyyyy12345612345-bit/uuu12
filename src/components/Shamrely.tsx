"use client";

import React, { useState } from "react";
import surahsData from "@/data/surahs.json";
import { BookOpen, X, ChevronLeft, Download, ExternalLink } from "lucide-react";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);

  const openPdf = (surah: typeof surahsData[0]) => {
    setSelectedSurah(surah);
  };

  const closePdf = () => {
    setSelectedSurah(null);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none opacity-40" />
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none animate-pulse delay-1000" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-14 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-10 text-center space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-arabic">مصحف الشمرلي</h2>
            <p className="text-primary/60 text-sm uppercase tracking-widest font-bold">Shamrely Edition Library</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openPdf(surah)}
                className="group relative flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-500 text-right overflow-hidden shadow-xl"
              >
                {/* Number Badge */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <span className="text-xs font-bold text-primary">{surah.id}</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-lg font-bold text-white font-arabic">{surah.name}</span>
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">{surah.total_verses} Verses</span>
                    </div>
                </div>

                <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                    <ChevronLeft className="w-5 h-5 text-primary" />
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedSurah && (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={closePdf} />
          
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="h-20 shrink-0 flex items-center justify-between px-6 md:px-10 border-b border-white/10 glass-effect">
              <div className="flex items-center gap-4">
                <button 
                  onClick={closePdf} 
                  className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white font-arabic">سورة {selectedSurah.name}</h3>
                  <span className="text-[10px] text-primary/60 font-bold uppercase">Shamrely Edition</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/pdf/${selectedSurah.id.toString().padStart(3, '0')}.pdf`}
                  download
                  className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  <Download className="w-5 h-5" />
                </a>
                <a
                  href={`/pdf/${selectedSurah.id.toString().padStart(3, '0')}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white/5 text-white rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 bg-neutral-900 overflow-hidden">
                <iframe 
                    src={`/pdf/${selectedSurah.id.toString().padStart(3, '0')}.pdf#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-none"
                    title={selectedSurah.name}
                />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
