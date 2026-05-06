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

const SurahItem = ({ surah, isCurrent, isPlaying, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full group flex items-center justify-between p-5 rounded-2xl transition-all duration-500 relative overflow-hidden border ${isCurrent ? 'bg-[#043927] border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(4,57,39,0.5)]' : 'bg-[#0b241b]/40 border-white/5 hover:border-white/10'}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex items-center gap-5 relative z-10 text-right">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${isCurrent ? 'bg-[#D4AF37] text-black rotate-[360deg]' : 'bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-primary'}`}>
        {isCurrent && isPlaying ? (
          <div className="flex gap-1 items-end h-4">
            {[0.6, 1, 0.4].map((h, i) => (
              <div key={i} className="w-1 bg-black animate-music-bar" style={{ height: `${h*100}%`, animationDelay: `${i*0.2}s` }} />
            ))}
          </div>
        ) : (
          <span className="text-sm font-black">{surah.id}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-lg font-black truncate ${amiri.className} ${isCurrent ? 'text-[#D4AF37]' : 'text-white'}`}>
          {surah.name}
        </h4>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{surah.transliteration}</p>
      </div>
    </div>

    <div className={`flex items-center gap-3 relative z-10 transition-all duration-500 ${isCurrent ? 'scale-110 opacity-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
      <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{surah.total_verses} Verses</span>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Play className="w-4 h-4 fill-current" />
      </div>
    </div>
  </button>
);

export function AudioLibrary() {
  const [currentSurah, setCurrentSurah] = useState(surahsData[0]);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isSurahListOpen, setIsSurahListOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [reciterSearch, setReciterSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredReciters = RECITERS.filter(r => 
    r.name.includes(reciterSearch)
  );

  const filteredSurahs = surahsData.filter(s => 
    s.name.includes(search)
  );

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
      { 
        onPlay: () => { audio.play(); setIsPlaying(true); }, 
        onPause: () => { audio.pause(); setIsPlaying(false); }, 
        onNext: nextSurah, 
        onPrev: prevSurah, 
        onSeekTo: (time) => { audio.currentTime = time; } 
      }
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
    <div className={`min-h-screen bg-[#00170f] text-white p-6 pb-40 ${tajawal.className}`}>
      <audio 
        ref={audioRef} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={nextSurah}
        preload="auto"
      />

      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-[#D4AF37] mb-2">المكتبة الصوتية</h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            Emerald Quranic Stream
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#043927] border border-[#D4AF37]/30 flex items-center justify-center shadow-2xl">
          <Headphones className="w-8 h-8 text-[#D4AF37]" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Player & Reciters */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Main Player Card */}
          <div className="relative bg-[#043927]/60 backdrop-blur-3xl border border-[#D4AF37]/20 rounded-[3rem] p-12 overflow-hidden shadow-2xl group">
             <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
             
             <div className="relative z-10 flex flex-col items-center">
                {/* Spinning Disc UI */}
                <div className="relative mb-12 group/disc">
                  <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-[#0b241b] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <div className="absolute inset-0 bg-[#00170f] flex items-center justify-center">
                       <Disc className="w-40 h-40 text-primary/40" />
                       <div className="absolute w-20 h-20 bg-[#043927] rounded-full border-4 border-[#D4AF37]/30 flex items-center justify-center">
                          <div className="w-4 h-4 bg-[#D4AF37] rounded-full" />
                       </div>
                    </div>
                  </div>
                  {/* Play Overlay */}
                  <button 
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/disc:opacity-100 transition-opacity duration-500"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#D4AF37]/90 text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover/disc:scale-100 transition-transform">
                      {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                    </div>
                  </button>
                </div>

                {/* Track Info */}
                <div className="text-center space-y-4 mb-10 w-full">
                   <h2 className={`text-5xl md:text-6xl font-black text-[#D4AF37] drop-shadow-lg ${amiri.className}`}>سورة {currentSurah.name}</h2>
                   <div className="flex items-center justify-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                      <p className="text-xl font-bold text-white/60">{selectedReciter.name}</p>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full space-y-3 mb-10">
                  <input 
                    type="range" 
                    value={progress} 
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                  <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                    <span>{audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}</span>
                    <span>{audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-10">
                  <button onClick={() => setIsShuffle(!isShuffle)} className={`transition-all ${isShuffle ? 'text-[#D4AF37] scale-125' : 'text-white/20 hover:text-white'}`}>
                    <Shuffle className="w-6 h-6" />
                  </button>
                  <button onClick={prevSurah} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
                    <SkipBack className="w-6 h-6 fill-current" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-24 h-24 rounded-[2rem] bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                  </button>
                  <button onClick={nextSurah} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={() => setIsRepeat(!isRepeat)} className={`transition-all ${isRepeat ? 'text-[#D4AF37] scale-125' : 'text-white/20 hover:text-white'}`}>
                    <Repeat className="w-6 h-6" />
                  </button>
                </div>
             </div>
          </div>

          {/* Reciter Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-2xl font-black text-white/80">القراء المتاحين</h3>
               <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder="بحث عن قارئ..."
                    className="bg-[#043927] border border-white/5 rounded-xl py-2 pr-10 pl-4 text-xs font-bold outline-none focus:border-[#D4AF37]/50 transition-all"
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {filteredReciters.map((reciter) => (
                 <button 
                  key={reciter.id}
                  onClick={() => setSelectedReciter(reciter)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedReciter.id === reciter.id ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-xl' : 'bg-[#043927] text-white/60 border-white/5 hover:border-white/20'}`}
                 >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedReciter.id === reciter.id ? 'bg-black/10' : 'bg-white/5'}`}>
                      <User className="w-5 h-5" />
                   </div>
                   <span className="text-sm font-black truncate">{reciter.name}</span>
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column: Surah List */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-[#043927]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-white/80">قائمة السور</h3>
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{surahsData.length} Surahs</span>
                 </div>
              </div>

              {/* Surah Search */}
              <div className="relative mb-6">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن سورة..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-14 pl-6 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all shadow-inner"
                />
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 horizontal-scroll custom-scrollbar max-h-[1000px]">
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
           </div>
        </div>

      </div>
    </div>
  );
}
