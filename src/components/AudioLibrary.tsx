"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { RECITERS } from "@/data/reciters";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, List, Search, 
  Headphones, Repeat, Shuffle, ChevronDown, User, Heart, 
  Disc, Music, Star, Zap, X, Sparkles, Radio
} from "lucide-react";
import { setupMediaSession, setPlaybackState, updatePositionState, clearMediaSession } from "@/lib/mediaSession";
import surahsData from "@/data/surahs.json";
import { logAppEvent } from "@/lib/firebase";
import { addPoints } from "@/lib/points";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["arabic"],
});

const SurahItem = memo(({ surah, isCurrent, isPlaying, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full group flex items-center justify-between p-5 rounded-[2rem] transition-all duration-500 relative overflow-hidden ${isCurrent ? 'bg-primary/10 border-2 border-primary/20 shadow-2xl shadow-primary/5' : 'hover:bg-white/5 border-2 border-transparent'}`}
  >
      <div className="flex items-center gap-5 text-right relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${isCurrent ? 'bg-primary text-black shadow-xl shadow-primary/20 rotate-12' : 'bg-white/5 text-primary/40 group-hover:bg-white/10 group-hover:text-primary'}`}>
              {surah.id.toString().padStart(3, '0')}
          </div>
          <div>
             <p className={`text-xl font-black font-arabic transition-colors ${isCurrent ? 'text-primary' : 'text-white'}`}>{surah.name}</p>
             <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">القرآن الكريم</p>
          </div>
      </div>
      
      <div className="relative z-10">
        {isCurrent && isPlaying ? (
            <div className="flex gap-1 items-end h-5">
               <div className="w-1.5 bg-primary h-2 animate-bounce rounded-full" style={{animationDelay: '0s'}} />
               <div className="w-1.5 bg-primary h-5 animate-bounce rounded-full" style={{animationDelay: '0.2s'}} />
               <div className="w-1.5 bg-primary h-3 animate-bounce rounded-full" style={{animationDelay: '0.1s'}} />
            </div>
        ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-primary text-black' : 'bg-white/5 text-white/10 group-hover:bg-white/10 group-hover:text-primary'}`}>
                <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
        )}
      </div>
  </button>
));

SurahItem.displayName = "SurahItem";

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
    s.name.includes(search)
  ), [search]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sId = currentSurah.id.toString().padStart(3, '0');
    const newSrc = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;
    if (audio.src !== newSrc) {
      audio.pause();
      audio.src = newSrc;
      audio.load();
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
      logAppEvent("change_reciter", { reciter_name: selectedReciter.name });
    }
    setupMediaSession(
      { title: `سورة ${currentSurah.name}`, artist: selectedReciter.name, album: 'المكتبة الصوتية' },
      { onPlay: () => { audio.play(); setIsPlaying(true); }, onPause: () => { audio.pause(); setIsPlaying(false); }, onNext: nextSurah, onPrev: prevSurah, onSeekTo: (time) => { audio.currentTime = time; } }
    );
  }, [currentSurah, selectedReciter]);

  useEffect(() => { setPlaybackState(isPlaying ? 'playing' : 'paused'); }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !isNaN(audio.duration)) updatePositionState(audio.duration, audio.currentTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        addPoints("listen", 1);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
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
    logAppEvent("play_audio", { surah_id: surah.id, surah_name: surah.name, reciter: selectedReciter.name });
  };

  const nextSurah = () => {
    let next;
    if (isShuffle) { next = surahsData[Math.floor(Math.random() * surahsData.length)]; }
    else {
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
    <div className={`flex h-full bg-[#064E3B] text-white relative overflow-hidden ${tajawal.className}`}>
      <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      <div className="flex w-full h-full relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[450px] flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl overflow-hidden">
          <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                  <div className="text-right">
                      <h2 className="text-3xl font-black font-arabic text-white">المصحف الصوتي</h2>
                      <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">تلاوات قرآنية عطرة</p>
                  </div>
                  <Radio className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="relative group">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all duration-500" />
                  <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن سورة..."
                      className="w-full bg-white/5 border-2 border-white/5 rounded-[1.5rem] py-5 pr-14 pl-8 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-arabic font-bold"
                  />
              </div>
           </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10 space-y-4">
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

        {/* Main Player Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden max-w-full">
          {/* Reciter Selector Horizontal */}
          <div className="w-full max-w-full shrink-0 z-50 sticky top-0 bg-black/20 backdrop-blur-3xl border-b border-white/5">
              <div className="flex items-center gap-10 px-10 py-8 overflow-x-auto no-scrollbar horizontal-scroll">
                  {filteredReciters.map((rec) => {
                      const isActive = selectedReciter.id === rec.id;
                      return (
                          <button 
                            key={rec.id}
                            onClick={() => setSelectedReciter(rec)}
                            className={`flex flex-col items-center gap-4 transition-all duration-700 min-w-[80px] ${isActive ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                          >
                              <div className={`w-20 h-20 rounded-[2rem] border-2 p-1 transition-all duration-700 flex items-center justify-center ${isActive ? 'border-primary shadow-[0_20px_50px_rgba(212,175,55,0.2)] rotate-12' : 'border-white/10'}`}>
                                   <div className={`w-full h-full rounded-[1.5rem] flex items-center justify-center overflow-hidden bg-white/5 relative`}>
                                      <User className={`w-10 h-10 ${isActive ? 'text-primary' : 'text-white/20'}`} />
                                      {isActive && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
                                   </div>
                              </div>
                              <span className={`text-[11px] font-black font-arabic transition-all text-center px-1 whitespace-nowrap uppercase tracking-widest ${isActive ? 'text-primary' : 'text-white/40'}`}>
                                  {rec.name}
                              </span>
                          </button>
                      );
                  })}
              </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Mobile Surah Button */}
            <button onClick={() => setIsSurahListOpen(true)} className="lg:hidden flex items-center gap-4 px-8 py-4 bg-black/40 backdrop-blur-2xl border-2 border-white/10 rounded-[2rem] text-white font-black mb-12 relative z-50 shadow-2xl group active:scale-95 transition-all">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                  <List className="w-4 h-4" />
                </div>
                <span className="text-sm font-arabic">استعراض قائمة السور</span>
            </button>

            {/* Premium Player Disc */}
            <div className="relative group mb-12">
                <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
                <div 
                  className={`w-64 h-64 md:w-[450px] md:h-[450px] rounded-full border-[8px] md:border-[16px] border-white/5 relative flex items-center justify-center overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] transition-all duration-1000 ${isPlaying ? 'scale-105' : 'scale-95 grayscale-[0.5]'}`}
                  style={{ animation: isPlaying ? 'spin 30s linear infinite' : 'none' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10" />
                    <div className="absolute inset-0 islamic-pattern opacity-[0.05]" />
                    <div className="w-full h-full p-6 md:p-12 rounded-full flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-4 border-primary/20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl text-center relative overflow-hidden">
                             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                             <Music className="w-12 h-12 text-primary/20 mb-6" />
                             <h3 className="text-3xl md:text-5xl font-black text-white font-arabic leading-relaxed drop-shadow-2xl">{currentSurah.name}</h3>
                             <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-[0.5em] mt-4 opacity-50">قيد التشغيل الآن</p>
                        </div>
                    </div>
                    {/* Disc Center Hole */}
                    <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-full bg-[#064E3B] border-[6px] md:border-[12px] border-black shadow-inner flex items-center justify-center">
                        <div className="w-2 h-2 md:w-4 md:h-4 rounded-full bg-white/10" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center text-center max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">صوت نقي عالي الجودة</span>
                  <Star className="w-4 h-4 text-primary fill-primary" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white font-arabic tracking-tight leading-tight">{selectedReciter.name}</h2>
            </div>
          </div>

          {/* Floating Controls Bar */}
          <div className="px-10 pb-20 pt-4 relative z-[100]">
            <div className="max-w-4xl mx-auto w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 flex flex-col items-center gap-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-black text-white/30 uppercase tracking-widest px-2">
                        <span>{audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}</span>
                        <span>{audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}</span>
                    </div>
                    <div className="group relative h-3 w-full bg-white/5 rounded-full cursor-pointer overflow-hidden">
                        <div className="absolute h-full bg-primary rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)]" style={{ width: `${progress}%` }} />
                        <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10" />
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <button onClick={() => setIsRepeat(!isRepeat)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isRepeat ? 'text-primary bg-primary/20' : 'text-white/20 hover:text-white/40'}`}>
                        <Repeat className="w-5 h-5" />
                    </button>
                    <button onClick={prevSurah} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-90">
                        <SkipBack className="w-6 h-6 fill-current" />
                    </button>
                    <button onClick={togglePlay} className="w-20 h-20 rounded-[2rem] bg-primary text-black flex items-center justify-center shadow-[0_20px_50px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        {isPlaying ? <Pause className="w-8 h-8 fill-current relative z-10" /> : <Play className="w-8 h-8 fill-current ml-1.5 relative z-10" />}
                    </button>
                    <button onClick={nextSurah} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-90">
                        <SkipForward className="w-6 h-6 fill-current" />
                    </button>
                    <button onClick={() => setIsShuffle(!isShuffle)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isShuffle ? 'text-primary bg-primary/20' : 'text-white/20 hover:text-white/40'}`}>
                        <Shuffle className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        </main>

        {/* Mobile Surah Drawer */}
        {isSurahListOpen && (
          <div className="fixed inset-0 z-[1500] lg:hidden">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsSurahListOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#064E3B] border-t border-white/10 rounded-t-[4rem] p-8 flex flex-col gap-8 animate-in slide-in-from-bottom-10 duration-700 overflow-hidden">
                  <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                      <div className="text-right">
                          <h3 className="text-2xl font-black text-white">قائمة السور</h3>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">اختر سورة للاستماع</p>
                      </div>
                      <button onClick={() => setIsSurahListOpen(false)} className="p-4 bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="relative group z-10">
                      <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all duration-500" />
                      <input 
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="ابحث عن سورة..."
                          className="w-full bg-white/5 border-2 border-white/5 rounded-[1.5rem] py-5 pr-14 pl-8 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-arabic font-bold"
                      />
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 relative z-10">
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
    </div>
  );
}
