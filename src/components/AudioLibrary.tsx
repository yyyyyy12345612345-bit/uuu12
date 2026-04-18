"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { RECITERS } from "@/data/reciters";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, List, Search, 
  Headphones, Repeat, Shuffle, ChevronDown, User, Heart, 
  Disc, Music, Star, Zap, X
} from "lucide-react";
import surahsData from "@/data/surahs.json";

// Memoized Surah Item to prevent entire list re-render
const SurahItem = memo(({ surah, isCurrent, isPlaying, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full group flex items-center justify-between p-4 rounded-3xl transition-all ${isCurrent ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/[0.03] border border-transparent'}`}
  >
      <div className="flex items-center gap-4 text-right">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all ${isCurrent ? 'bg-primary text-black' : 'bg-white/5 text-white/30 group-hover:bg-white/10'}`}>
              {surah.id.toString().padStart(3, '0')}
          </div>
          <div>
             <p className={`text-base font-bold font-arabic transition-colors ${isCurrent ? 'text-primary' : 'text-white'}`}>{surah.name}</p>
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{surah.transliteration}</p>
          </div>
      </div>
      {isCurrent && isPlaying ? (
          <div className="flex gap-0.5 items-end h-4">
             <div className="w-1 bg-primary h-2 animate-bounce" style={{animationDelay: '0s'}} />
             <div className="w-1 bg-primary h-4 animate-bounce" style={{animationDelay: '0.2s'}} />
             <div className="w-1 bg-primary h-3 animate-bounce" style={{animationDelay: '0.1s'}} />
          </div>
      ) : (
          <Play className={`w-4 h-4 transition-all ${isCurrent ? 'text-primary' : 'text-white/10 group-hover:text-white/40'}`} />
      )}
  </button>
));

export function AudioLibrary() {
  const [currentSurah, setCurrentSurah] = useState(surahsData[0]);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isSurahListOpen, setIsSurahListOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [reciterSearch, setReciterSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredReciters = React.useMemo(() => RECITERS.filter(r => 
    r.name.includes(reciterSearch)
  ), [reciterSearch]);

  const filteredSurahs = React.useMemo(() => surahsData.filter(s => 
    s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  // Centralized Audio Sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sId = currentSurah.id.toString().padStart(3, '0');
    const newSrc = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;

    if (audio.src !== newSrc) {
      audio.pause();
      audio.src = newSrc;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentSurah, selectedReciter]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            }
        }
    };


  const onTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
    }
  };

  const playSurah = (surah: any) => {
    setCurrentSurah(surah);
    setIsPlaying(true);
  };


  const nextSurah = () => {
    let next;
    if (isShuffle) {
      next = surahsData[Math.floor(Math.random() * surahsData.length)];
    } else {
      const currentIndex = surahsData.findIndex(s => s.id === currentSurah.id);
      next = surahsData[(currentIndex + 1) % surahsData.length];
    }
    playSurah(next);
  };


  const prevSurah = () => {
    const currentIndex = surahsData.findIndex(s => s.id === currentSurah.id);
    const prev = surahsData[(currentIndex - 1 + surahsData.length) % surahsData.length];
    playSurah(prev);
  };

  return (
    <div className="flex h-full animate-in fade-in duration-1000 bg-transparent overflow-hidden">

      {/* ── Left Sidebar (Desktop List) ─────────────────────────── */}
      <aside className="hidden lg:flex w-[450px] flex-col border-r border-white/5 bg-black/10 backdrop-blur-md overflow-hidden">
         <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-arabic text-white">قائمة السور</h2>
                <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-bold uppercase tracking-widest">Full Quran</span>
            </div>
            <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث عن سورة..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-sm text-white outline-none focus:border-primary/20 transition-all font-arabic"
                />
            </div>
         </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-0 space-y-2 custom-scrollbar">
            {filteredSurahs.map((surah) => (
                <SurahItem 
                  key={surah.id}
                  surah={surah}
                  isCurrent={currentSurah.id === surah.id}
                  isPlaying={isPlaying}
                  onClick={() => playSurah(surah)}
                />
            ))}
          </div>
      </aside>

      {/* ── Main Player Area ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative overflow-hidden max-w-full">
        {/* Reciter Selector Horizontal (Universal Top) */}
        <div className="w-full max-w-full shrink-0 z-50 mb-4 sticky top-0 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 pb-2">
             <div className="px-8 pt-4 pb-2">
                 <div className="relative group max-w-md mx-auto">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                        value={reciterSearch}
                        onChange={(e) => setReciterSearch(e.target.value)}
                        placeholder="ابحث عن قارئ..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pr-11 pl-6 text-xs text-white outline-none focus:border-primary/20 transition-all font-arabic"
                    />
                 </div>
             </div>
             <div className="w-full overflow-x-auto no-scrollbar py-4 horizontal-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
                 <div className="flex items-center gap-10 px-8 w-max">
                    {filteredReciters.map((rec) => {
                        const isActive = selectedReciter.id === rec.id;
                        return (
                            <button 
                              key={rec.id}
                              onClick={() => setSelectedReciter(rec)}
                              className={`flex flex-col items-center gap-3 transition-all snap-center ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                            >
                                <div className={`w-16 h-16 rounded-full border-2 p-1 transition-all flex items-center justify-center ${isActive ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10 hover:border-white/30'}`}>
                                     <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isActive ? 'bg-primary/20' : 'bg-white/5'}`}>
                                        <User className={`w-7 h-7 ${isActive ? 'text-primary' : 'text-white/60'}`} />
                                     </div>
                                </div>
                                <span className={`text-[12px] font-black font-arabic transition-all text-center px-1 whitespace-nowrap drop-shadow-md ${isActive ? 'text-primary' : 'text-white'}`}>
                                    {rec.name}
                                </span>
                            </button>
                        );
                    })}
                 </div>
             </div>
        </div>

        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center p-6 md:p-12 pt-4 md:pt-12">
          {/* Mobile Surah Button */}
          <button onClick={() => setIsSurahListOpen(true)} className="lg:hidden flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-bold mb-6 z-[60] relative shadow-lg">
              <List className="w-4 h-4 text-primary" />
              <span className="text-sm font-arabic">اختر سورة أخرى</span>
          </button>

          {/* Spinning Disc */}
          <div className="relative group shrink-0 mb-8">
              <div className={`w-44 h-44 md:w-80 md:h-80 rounded-full bg-[#111] border-[8px] md:border-[12px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative flex items-center justify-center overflow-hidden`} style={{ animation: isPlaying ? 'spin 15s linear infinite' : 'none' }}>
                   <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5" />
                   <div className="w-full h-full p-4 rounded-full border border-white/10 flex items-center justify-center">
                      <div className="w-full h-full rounded-full border-4 border-primary/20 flex flex-col items-center justify-center p-12 bg-black/40 backdrop-blur-md text-center">
                           <Music className="w-12 h-12 text-primary/40 mb-4" />
                           <h3 className="text-2xl font-bold text-white font-arabic drop-shadow-lg leading-tight">{currentSurah.name}</h3>
                           <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">{currentSurah.transliteration}</p>
                      </div>
                   </div>
              </div>
          </div>

          <div className="flex flex-col items-center text-center mb-4">
              <h2 className="text-3xl font-black text-white font-arabic tracking-tight">{selectedReciter.name}</h2>
          </div>
        </div>

        {/* ─ Fixed Controls Bar ─ */}
        <div className="shrink-0 w-full bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 px-6 pt-2 pb-28 flex flex-col items-center gap-2">
            <div className="w-full max-w-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/40 font-bold">
                    <span>{audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}</span>
                    <span>{audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}</span>
                </div>
                <div className="group relative h-2 w-full bg-white/5 rounded-full cursor-pointer">
                    <div className="absolute h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10" />
                </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                <button onClick={() => setIsRepeat(!isRepeat)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isRepeat ? 'text-primary bg-primary/10' : 'text-white/20 hover:text-white/40'}`}>
                    <Repeat className="w-3.5 h-3.5" />
                </button>
                <button onClick={prevSurah} className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_10px_30px_rgba(212,175,55,0.25)] hover:scale-105 active:scale-95 transition-all">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button onClick={nextSurah} className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsShuffle(!isShuffle)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isShuffle ? 'text-primary bg-primary/10' : 'text-white/20 hover:text-white/40'}`}>
                    <Shuffle className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      </main>

      {/* ── Mobile Surah Drawer ── */}
      {isSurahListOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSurahListOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-arabic text-primary">اختر سورة</h3>
                    <button onClick={() => setIsSurahListOpen(false)} className="p-3 bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث عن سورة..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-sm text-white outline-none focus:border-primary/20 transition-all font-arabic"
                    />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-10">
                    {filteredSurahs.map((surah) => (
                        <SurahItem 
                          key={surah.id}
                          surah={surah}
                          isCurrent={currentSurah.id === surah.id}
                          isPlaying={isPlaying}
                          onClick={() => { playSurah(surah); setIsSurahListOpen(false); }}
                        />
                    ))}
                </div>
            </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        onTimeUpdate={onTimeUpdate}
        onEnded={nextSurah}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
