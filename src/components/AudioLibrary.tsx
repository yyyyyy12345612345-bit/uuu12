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
import { Tajawal, Amiri } from "next/font/google";

const tajawal = Tajawal({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["arabic"],
});

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
});

const SurahItem = memo(({ surah, isCurrent, isPlaying, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full group flex items-center justify-between p-5 rounded-2xl transition-all duration-500 relative overflow-hidden border ${isCurrent ? 'bg-[#043927] border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(4,57,39,0.5)]' : 'bg-[#0b241b]/40 border-white/5 hover:border-white/10'}`}
  >
      {/* Subtle Inner Glow on top edge */}
      {isCurrent && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />}
      
      <div className="flex items-center gap-5 text-right relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-700 ${isCurrent ? 'bg-[#D4AF37] text-[#033826] shadow-xl shadow-[#D4AF37]/20 rotate-12' : 'bg-white/5 text-[#a0d1b8]/40 group-hover:bg-white/10 group-hover:text-[#a0d1b8]'}`}>
              {surah.id.toString().padStart(3, '0')}
          </div>
          <div>
             <p className={`text-xl font-bold ${amiri.className} transition-colors ${isCurrent ? 'text-[#D4AF37]' : 'text-[#cde9db]'}`}>{surah.name}</p>
             <p className={`text-[10px] text-[#cde9db]/30 font-bold uppercase tracking-widest mt-1 ${tajawal.className}`}>القرآن الكريم</p>
          </div>
      </div>
      
      <div className="relative z-10">
        {isCurrent && isPlaying ? (
            <div className="flex gap-1 items-end h-5">
               <div className="w-1.5 bg-[#D4AF37] h-2 animate-bounce rounded-full" style={{animationDelay: '0s'}} />
               <div className="w-1.5 bg-[#D4AF37] h-5 animate-bounce rounded-full" style={{animationDelay: '0.2s'}} />
               <div className="w-1.5 bg-[#D4AF37] h-3 animate-bounce rounded-full" style={{animationDelay: '0.1s'}} />
            </div>
        ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-[#D4AF37] text-[#033826]' : 'bg-white/5 text-white/10 group-hover:bg-white/10 group-hover:text-[#D4AF37]'}`}>
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
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredReciters = React.useMemo(() => RECITERS.filter(r => 
    r.name.includes(reciterSearch)
  ), [reciterSearch]);

  const filteredSurahs = React.useMemo(() => surahsData.filter(s => 
    s.name.includes(search)
  ), [search]);

  const [search, setSearch] = useState("");
  const [reciterSearch, setReciterSearch] = useState("");

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
      interval = setInterval(() => { addPoints("listen", 1); }, 30000);
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
    <div className={`flex h-full bg-[#00170f] text-[#cde9db] relative overflow-hidden ${tajawal.className}`}>
      {/* Base Layer: Geometric Pattern */}
      <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
      
      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#00120b] pointer-events-none" />

      <div className="flex w-full h-full relative z-10">
        {/* Desktop Sidebar: Polished Obsidian Glass */}
        <aside className="hidden lg:flex w-[450px] flex-col border-r border-white/5 bg-[#0b241b]/40 backdrop-blur-3xl overflow-hidden">
          <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                  <div className="text-right">
                      <h2 className={`text-4xl font-bold ${amiri.className} text-[#cde9db]`}>المكتبة القرآنية</h2>
                      <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.4em] mt-2">Luxurious Audio Library</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#043927] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/5">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
              </div>
              <div className="relative group">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-all duration-500" />
                  <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن سورة..."
                      className="w-full bg-white/5 border border-white/5 rounded-full py-5 pr-14 pl-8 text-sm text-[#cde9db] outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-bold"
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
          {/* Reciter Carousel: Horizontal Navigation */}
          <div className="w-full max-w-full shrink-0 z-50 sticky top-0 bg-[#00170f]/60 backdrop-blur-3xl border-b border-white/5">
              <div className="flex items-center gap-10 px-10 py-8 overflow-x-auto no-scrollbar horizontal-scroll">
                  {filteredReciters.map((rec) => {
                      const isActive = selectedReciter.id === rec.id;
                      return (
                          <button 
                            key={rec.id}
                            onClick={() => setSelectedReciter(rec)}
                            className={`flex flex-col items-center gap-4 transition-all duration-700 min-w-[90px] ${isActive ? 'scale-110' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}
                          >
                              <div className={`w-20 h-20 rounded-[2.5rem] border-2 p-1 transition-all duration-700 flex items-center justify-center ${isActive ? 'border-[#D4AF37] shadow-[0_20px_50px_rgba(212,175,55,0.2)] rotate-12' : 'border-white/5'}`}>
                                   <div className={`w-full h-full rounded-[2rem] flex items-center justify-center overflow-hidden bg-white/5 relative`}>
                                      <User className={`w-10 h-10 ${isActive ? 'text-[#D4AF37]' : 'text-white/20'}`} />
                                      {isActive && <div className="absolute inset-0 bg-[#D4AF37]/10 animate-pulse" />}
                                   </div>
                              </div>
                              <span className={`text-[10px] font-black transition-all text-center px-1 whitespace-nowrap uppercase tracking-widest ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`}>
                                  {rec.name}
                              </span>
                          </button>
                      );
                  })}
              </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative">
            {/* Sacred Aura behind primary content */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Mobile Surah Selector Toggle */}
            <button onClick={() => setIsSurahListOpen(true)} className="lg:hidden flex items-center gap-4 px-10 py-5 bg-[#0b241b]/60 backdrop-blur-3xl border border-white/10 rounded-full text-white font-black mb-12 relative z-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group active:scale-95 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] group-hover:rotate-12 transition-transform">
                  <List className="w-5 h-5" />
                </div>
                <span className="text-sm">قائمة السور الكريمة</span>
            </button>

            {/* Signature Component: Sacred Disc Player */}
            <div className="relative group mb-12">
                <div className="absolute -inset-10 bg-[#D4AF37]/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
                <div 
                  className={`w-64 h-64 md:w-[480px] md:h-[480px] rounded-full border-[12px] md:border-[20px] border-[#043927] relative flex items-center justify-center overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.6)] transition-all duration-1000 ${isPlaying ? 'scale-105' : 'scale-95 grayscale-[0.3]'}`}
                  style={{ animation: isPlaying ? 'spin 40s linear infinite' : 'none' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-transparent to-white/10" />
                    <div className="absolute inset-0 islamic-pattern opacity-[0.04]" />
                    <div className="w-full h-full p-8 md:p-14 rounded-full flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-2 border-[#D4AF37]/20 flex flex-col items-center justify-center bg-[#072017]/60 backdrop-blur-3xl text-center relative overflow-hidden">
                             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-30" />
                             <Music className="w-14 h-14 text-[#D4AF37]/10 mb-8" />
                             <h3 className={`text-4xl md:text-7xl font-bold ${amiri.className} text-white leading-relaxed drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>{currentSurah.name}</h3>
                             <p className="text-[10px] md:text-xs text-[#D4AF37] font-black uppercase tracking-[0.6em] mt-6 opacity-40">Sacred Recitation</p>
                        </div>
                    </div>
                    {/* Polished Disc Center */}
                    <div className="absolute w-14 h-14 md:w-24 md:h-24 rounded-full bg-[#00120b] border-[8px] md:border-[16px] border-black shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] flex items-center justify-center">
                        <div className="w-3 h-3 md:w-6 md:h-6 rounded-full bg-white/5" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center text-center max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37] opacity-40" />
                  <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] opacity-60">High Fidelity Spiritual Audio</span>
                  <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37] opacity-40" />
                </div>
                <h2 className={`text-5xl md:text-8xl font-bold ${amiri.className} text-white tracking-tight leading-tight`}>{selectedReciter.name}</h2>
            </div>
          </div>

          {/* Persistent Glass Control Bar */}
          <div className="px-10 pb-20 pt-4 relative z-[100]">
            <div className="max-w-5xl mx-auto w-full bg-[#0b241b]/60 backdrop-blur-3xl border border-white/10 rounded-full p-8 flex flex-col items-center gap-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                {/* Progress System */}
                <div className="w-full space-y-4 px-4">
                    <div className="flex items-center justify-between text-[11px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
                        <span>{audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}</span>
                        <span>{audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}</span>
                    </div>
                    <div className="group relative h-2.5 w-full bg-white/5 rounded-full cursor-pointer overflow-hidden border border-white/5">
                        <div className="absolute h-full bg-[#D4AF37] rounded-full shadow-[0_0_30px_rgba(212,175,55,0.6)]" style={{ width: `${progress}%` }} />
                        <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10" />
                    </div>
                </div>
                
                {/* Interactive Controls */}
                <div className="flex items-center gap-12">
                    <button onClick={() => setIsRepeat(!isRepeat)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 ${isRepeat ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/20 hover:text-white/50'}`}>
                        <Repeat className="w-6 h-6" />
                    </button>
                    <button onClick={prevSurah} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-90 border border-white/5">
                        <SkipBack className="w-7 h-7 fill-current" />
                    </button>
                    {/* Primary Action Button */}
                    <button onClick={togglePlay} className="w-24 h-24 rounded-full bg-[#D4AF37] text-[#033826] flex items-center justify-center shadow-[0_25px_60px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all duration-700 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                        {isPlaying ? <Pause className="w-10 h-10 fill-current relative z-10" /> : <Play className="w-10 h-10 fill-current ml-2 relative z-10" />}
                    </button>
                    <button onClick={nextSurah} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all duration-500 active:scale-90 border border-white/5">
                        <SkipForward className="w-7 h-7 fill-current" />
                    </button>
                    <button onClick={() => setIsShuffle(!isShuffle)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 ${isShuffle ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/20 hover:text-white/50'}`}>
                        <Shuffle className="w-6 h-6" />
                    </button>
                </div>
            </div>
          </div>
        </main>

        {/* Mobile Selection Drawer */}
        {isSurahListOpen && (
          <div className="fixed inset-0 z-[1500] lg:hidden">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsSurahListOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 h-[88vh] bg-[#00170f] border-t border-white/10 rounded-t-[4.5rem] p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-20 duration-1000 overflow-hidden">
                  <div className="absolute inset-0 islamic-pattern opacity-[0.04] pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                      <div className="text-right">
                          <h3 className={`text-3xl font-bold ${amiri.className} text-white`}>قائمة السور</h3>
                          <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.4em] mt-2">Selection Indicator</p>
                      </div>
                      <button onClick={() => setIsSurahListOpen(false)} className="w-14 h-14 bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all flex items-center justify-center"><X className="w-8 h-8" /></button>
                  </div>
                  <div className="relative group z-10">
                      <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-all duration-700" />
                      <input 
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="ابحث عن سورة..."
                          className="w-full bg-white/5 border border-white/5 rounded-full py-5 pr-16 pl-10 text-sm text-[#cde9db] outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-bold"
                      />
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-24 relative z-10">
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
          onLoadedMetadata={() => audioRef.current?.duration}
        />

        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .horizontal-scroll {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </div>
    </div>
  );
}
