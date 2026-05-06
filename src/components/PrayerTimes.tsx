"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Clock, MapPin, Bell, BellOff, Volume2, Settings2, 
  RefreshCw, Map as MapIcon, Calendar, X, Globe,
  ArrowRight, Play, Check, ChevronDown, Sparkles, Music, VolumeX
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { Capacitor } from '@capacitor/core';
import {
  schedulePrayerNotifications,
  sendTestNotification,
  requestNotificationPermission,
  checkForegroundPrayer,
  type PrayerTimesData,
  PRAYER_NAMES_AR,
} from "@/lib/notifications";

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

  const [prayerSettings, setPrayerSettings] = useState<Record<string, PrayerSetting>>({
    Fajr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram", offset: 0 },
    Dhuhr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram", offset: 0 },
    Asr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram", offset: 0 },
    Maghrib: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram", offset: 0 },
    Isha: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram", offset: 0 }
  });

  const getNotifSettings = () => {
    const result: Record<string, { enabled: boolean; soundEnabled: boolean; offset: number }> = {};
    for (const key of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      const s = prayerSettings[key];
      result[key] = { enabled: s?.notificationsEnabled ?? true, soundEnabled: s?.athanEnabled ?? true, offset: s?.offset ?? 0 };
    }
    return result;
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const fetchTimes = async (city: string, country: string, lat?: number, lon?: number) => {
    setLoading(true);
    try {
      let url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`;
      if (lat && lon) url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=5`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        setTimes(data.data.timings);
        localStorage.setItem("prayer_times_cache", JSON.stringify(data.data.timings));
        localStorage.setItem("prayer_location_cache", `${city}، ${country}`);
        if (!lat) setLocationName(`${city}، ${country}`);
      }
    } catch (err) {
      const cached = localStorage.getItem("prayer_times_cache");
      if (cached) setTimes(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetchTimes("", "", latitude, longitude);
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

  useEffect(() => {
    if (!times) return;
    schedulePrayerNotifications(times, getNotifSettings());
  }, [times, prayerSettings]);

  useEffect(() => {
    const cachedTimes = localStorage.getItem("prayer_times_cache");
    const cachedLoc = localStorage.getItem("prayer_location_cache");
    if (cachedTimes) setTimes(JSON.parse(cachedTimes));
    if (cachedLoc) setLocationName(cachedLoc);
    fetchTimes("Cairo", "Egypt");
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getNextPrayer = () => {
    if (!times) return null;
    const now = new Date();
    const list = Object.entries(PRAYER_NAMES_AR).map(([id, name]) => {
      const setting = prayerSettings[id];
      const [h, m] = (times[id as keyof PrayerTimesData] as string).split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m + (setting?.offset || 0), 0, 0);
      return { id, name, date: d };
    });
    let next = list.find(p => p.date > now);
    if (!next) next = { ...list[0], date: new Date(list[0].date.getTime() + 24 * 60 * 60 * 1000) };
    const diff = next.date.getTime() - now.getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return { ...next, remaining: `${hrs}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}` };
  };

  const nextPrayer = getNextPrayer();

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
    <div className="flex flex-col h-full p-6 md:p-14 pt-24 md:pt-14 overflow-y-auto no-scrollbar font-arabic relative animate-in fade-in duration-700">
      {/* Sacred Serenity Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] dark:opacity-[0.05]" />
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-10 relative z-10 pb-40">
        
        {/* Location & Time Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-primary mb-2">
                    <MapPin className="w-4 h-4" />
                    <button onClick={() => setShowLocationPicker(true)} className="text-lg font-black hover:opacity-70 transition-opacity underline decoration-primary/20 underline-offset-4">{locationName}</button>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-foreground font-mono">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={detectLocation} className="p-5 rounded-3xl bg-card border border-border shadow-xl hover:text-primary transition-all active:scale-95">
                    <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowAthanSettings(true)} className="flex items-center gap-3 p-5 rounded-3xl bg-[#064E3B] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <Music className="w-6 h-6 text-primary" />
                    <span className="font-black">صوت الآذان</span>
                </button>
            </div>
        </div>

        {/* Main Countdown Card */}
        <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-[4rem] blur-[80px] opacity-20" />
            <div className="relative bg-card/60 backdrop-blur-3xl border border-border rounded-[4rem] p-12 md:p-20 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
                    <Clock className="w-48 h-48 text-primary" />
                </div>
                
                {nextPrayer ? (
                    <>
                        <div className="flex items-center gap-3 mb-6 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black text-primary uppercase tracking-widest">الصلاة القادمة: {nextPrayer.name}</span>
                        </div>
                        <h2 className="text-7xl md:text-9xl font-black tracking-widest text-foreground font-mono mb-8 drop-shadow-2xl">
                            -{nextPrayer.remaining}
                        </h2>
                        <div className="flex items-center gap-2 text-foreground/40 font-bold">
                            <Calendar className="w-5 h-5" />
                            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                    </>
                ) : (
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
                            isNext ? 'bg-[#064E3B] border-primary/40 text-white shadow-2xl scale-105' : 'bg-card border-border hover:border-primary/20 text-foreground'
                        }`}
                    >
                        <span className={`text-sm font-black uppercase tracking-widest ${isNext ? 'text-primary' : 'text-foreground/40'}`}>{name}</span>
                        <span className="text-3xl font-black font-mono">{time}</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isNext ? 'bg-white/10' : 'bg-foreground/5 group-hover:bg-primary/10'}`}>
                            {prayerSettings[id]?.notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-foreground/20" />}
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
                                localStorage.setItem("prayer_settings_v2", JSON.stringify(newSet));
                                setShowAthanSettings(false);
                            }}
                            className={`w-full p-6 rounded-[2rem] border text-right flex items-center justify-between transition-all group ${
                                prayerSettings['Fajr'].muezzinId === m.id ? 'bg-[#064E3B] border-primary/40 text-white shadow-xl' : 'bg-foreground/5 border-transparent hover:border-primary/20'
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
                        onClick={() => { fetchTimes(customCity, customCountry); setShowLocationPicker(false); }}
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
