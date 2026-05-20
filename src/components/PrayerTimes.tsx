"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Clock, MapPin, Bell, BellOff, Volume2, Settings2, 
  RefreshCw, Map as MapIcon, Calendar, X, Globe,
  ArrowRight, Play, Check, ChevronDown, Music, VolumeX
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { Capacitor } from '@capacitor/core';
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { type PrayerTimesData, PRAYER_NAMES_AR } from "@/lib/prayerNotifications";

interface PrayerSetting {
    athanEnabled: boolean;
    notificationsEnabled: boolean;
    muezzinId: string;
    offset: number; 
}

const MUEZZINS = [
  { id: "haram", name: "الحرم المكي - الشيخ علي الملا", file: "/adhan/الحرم المكي.mp3" },
  { id: "naqshandi", name: "الشيخ سيد النقشبندي", file: "/adhan/الشيخ سيد النقشبندى.p3.mp3" },
  { id: "rifat", name: "الشيخ محمد رفعت", file: "/adhan/الشيخ محمد رفعت.mp3" },
];

export function PrayerTimes() {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState("القاهرة، مصر");
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAthanSettings, setShowAthanSettings] = useState(false);
  
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customTestTime, setCustomTestTime] = useState("");

  const { state: editorState, updateState: updateEditor } = useEditor();
  const activeSettingsPrayer = editorState.activeSettingsPrayer;
  const setActiveSettingsPrayer = (val: string | null) => updateEditor({ activeSettingsPrayer: val });

  const fetchTimesApi = async (city: string, country: string, lat?: number, lon?: number): Promise<PrayerTimesData | null> => {
    setLoading(true);
    try {
      let url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`;
      if (lat && lon) url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=5`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        setTimes(data.data.timings);
        localStorage.setItem("prayer_location_cache", `${city}، ${country}`);
        if (!lat) setLocationName(`${city}، ${country}`);
        return data.data.timings;
      }
    } catch (err) {
      const cached = localStorage.getItem("prayer_times_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        setTimes(parsed);
        return parsed;
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  const defaultFetch = async () => {
    return await fetchTimesApi("Cairo", "Egypt");
  };

  const {
    settings: prayerSettings,
    updateSettings: setPrayerSettings,
    nextPrayer,
    sendTest
  } = usePrayerNotifications(times, defaultFetch);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);



  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetchTimesApi("", "", latitude, longitude);
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
          const geoData = await geoRes.json();
          const name = geoData.address.city || geoData.address.town || geoData.address.state || "موقعي";
          setLocationName(`${name}، ${geoData.address.country || ""}`);
        } catch (e) { setLocationName("موقعي الحالي"); }
      },
      () => setLoading(false)
    );
  };

    const cachedLoc = localStorage.getItem("prayer_location_cache");
    if (cachedLoc) setLocationName(cachedLoc);
    fetchTimesApi("Cairo", "Egypt");
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTestAthan = () => {
    if (audioRef.current) {
        if (isPlayingTest) {
            audioRef.current.pause();
            setIsPlayingTest(false);
        } else {
            const muezzinId = prayerSettings[nextPrayer?.id || "Fajr"]?.muezzinId || "haram";
            const muezzin = MUEZZINS.find(m => m.id === muezzinId) || MUEZZINS[0];
            audioRef.current.src = muezzin.file;
            audioRef.current.play();
            setIsPlayingTest(true);
        }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-10 pt-20 md:pt-14 overflow-y-auto overflow-x-hidden no-scrollbar font-arabic relative animate-in fade-in duration-700 bg-transparent">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-background" />
          <div className="absolute inset-0 mushaf-pattern opacity-[0.1] dark:opacity-[0.15]" />
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 relative z-10">
        
        {/* Location & Time Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 text-primary mb-1">
                    <MapPin className="w-4 h-4" />
                    <button onClick={() => setShowLocationPicker(true)} className="text-base font-black hover:opacity-70 transition-opacity underline decoration-primary/20 underline-offset-4">{locationName}</button>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground font-mono">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={detectLocation} className="p-4 rounded-2xl bg-card border border-border shadow-xl hover:text-primary transition-all active:scale-95">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowAthanSettings(true)} className="flex items-center gap-3 p-4 rounded-2xl bg-primary text-black shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <Music className="w-5 h-5 text-black" />
                    <span className="font-black text-sm">صوت الآذان</span>
                </button>
            </div>
        </div>

        {/* Main Countdown Card */}
        <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-[3rem] blur-[80px] opacity-20" />
            <div className="relative bg-card/60 backdrop-blur-3xl border border-border rounded-[3rem] p-8 md:p-16 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Clock className="w-32 h-32 text-primary" />
                </div>
                
                {nextPrayer ? (
                    <>
                        <div className="flex items-center gap-3 mb-4 bg-primary/10 px-5 py-1.5 rounded-full border border-primary/20">
                            <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">الصلاة القادمة: {nextPrayer.nameAr}</span>
                        </div>
                        <h2 className="text-5xl md:text-9xl font-black tracking-widest text-foreground font-mono mb-6 drop-shadow-2xl">
                            -{nextPrayer.inLabel}
                        </h2>
                        <div className="flex items-center gap-2 text-foreground/40 font-bold text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                    </>
                ) : (
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                )}
            </div>
        </div>

        {/* Prayers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {times && Object.entries(PRAYER_NAMES_AR).map(([id, name]) => {
                const isNext = nextPrayer?.id === id;
                const time = times[id as keyof PrayerTimesData];
                return (
                    <div 
                        key={id}
                        onClick={() => setActiveSettingsPrayer(id)}
                        className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer flex flex-col items-center gap-4 group ${
                            isNext ? 'bg-primary border-primary/40 text-black shadow-2xl scale-105' : 'bg-card border-border hover:border-primary/20 text-foreground'
                        }`}
                    >
                        <span className={`text-sm font-black uppercase tracking-widest ${isNext ? 'text-black' : 'text-foreground/40'}`}>{name}</span>
                        <span className="text-3xl font-black font-mono">{time}</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isNext ? 'bg-white/10' : 'bg-foreground/5 group-hover:bg-primary/10'}`}>
                            {prayerSettings[id]?.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-foreground/20" />}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Quick Audio Toggle Bar */}
        <div className="bg-card border border-border p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Volume2 className="w-7 h-7 text-primary" />
                </div>
                <div className="text-right">
                    <h4 className="text-lg font-black">صوت الآذان الحالي</h4>
                    <p className="text-xs text-foreground/40 font-bold">{MUEZZINS.find(m => m.id === (prayerSettings[nextPrayer?.id || 'Fajr']?.muezzinId))?.name || MUEZZINS[0].name}</p>
                </div>
            </div>
            <button onClick={toggleTestAthan} className={`px-8 py-3 rounded-2xl font-black transition-all ${isPlayingTest ? 'bg-red-500/10 text-red-500' : 'bg-primary text-primary-foreground hover:scale-105'}`}>
                {isPlayingTest ? "إيقاف" : "تجربة الصوت"}
            </button>
        </div>

      </div>

      {/* Muezzin Selection Modal */}
      {showAthanSettings && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowAthanSettings(false)} />
              <div className="relative w-full max-w-xl bg-card border border-border rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                  <button onClick={() => setShowAthanSettings(false)} className="absolute top-8 left-8 text-foreground/20 hover:text-foreground"><X /></button>
                  <div className="flex flex-col items-center mb-10 text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                          <Music className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-3xl font-black">اختر المؤذن</h3>
                      <p className="text-foreground/40 font-bold mt-2">سيتم تشغيل هذا الصوت عند دخول وقت الصلاة</p>
                  </div>
                  <div className="space-y-4">
                      {MUEZZINS.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => {
                                const newSet = { ...prayerSettings };
                                Object.keys(newSet).forEach(k => newSet[k].muezzinId = m.id);
                                setPrayerSettings(newSet);
                                setShowAthanSettings(false);
                            }}
                            className={`w-full p-6 rounded-[2rem] border text-right flex items-center justify-between transition-all group ${
                                prayerSettings['Fajr'].muezzinId === m.id ? 'bg-primary border-primary/40 text-black shadow-xl' : 'bg-foreground/5 border-transparent hover:border-primary/20'
                            }`}
                          >
                              <span className="text-lg font-black">{m.name}</span>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prayerSettings['Fajr'].muezzinId === m.id ? 'bg-white/10' : 'bg-primary/10 group-hover:bg-primary transition-all'}`}>
                                  <Check className={`w-6 h-6 ${prayerSettings['Fajr'].muezzinId === m.id ? 'text-primary' : 'text-primary group-hover:text-white'}`} />
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowLocationPicker(false)} />
              <div className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                  <button onClick={() => setShowLocationPicker(false)} className="absolute top-8 left-8 text-foreground/20 hover:text-foreground"><X /></button>
                  <div className="flex flex-col items-center mb-10 text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                          <Globe className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-3xl font-black">تغيير المنطقة</h3>
                  </div>
                  <div className="space-y-6">
                      <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-foreground/40 uppercase tracking-widest mr-4">المدينة</label>
                          <input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="القاهرة" className="w-full bg-foreground/5 border border-transparent rounded-[1.5rem] py-5 px-8 text-foreground outline-none focus:border-primary/40 transition-all font-black" />
                      </div>
                      <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-foreground/40 uppercase tracking-widest mr-4">الدولة</label>
                          <input value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} placeholder="مصر" className="w-full bg-foreground/5 border border-transparent rounded-[1.5rem] py-5 px-8 text-foreground outline-none focus:border-primary/40 transition-all font-black" />
                      </div>
                      <button 
                        onClick={() => { fetchTimesApi(customCity, customCountry); setShowLocationPicker(false); }}
                        className="w-full py-5 bg-primary text-primary-foreground rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                      >
                          تحديث المنطقة
                      </button>
                  </div>
              </div>
          </div>
      )}

      <audio ref={audioRef} onEnded={() => setIsPlayingTest(false)} />
    </div>
  );
}
