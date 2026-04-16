"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Clock, MapPin, Bell, BellOff, Volume2, Settings2, 
  RefreshCw, Map as MapIcon, Calendar, X, Globe,
  ArrowRight, Play, Check, ChevronDown
} from "lucide-react";
import { useEditor } from "@/store/useEditor";


interface PrayerTimesData {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

interface PrayerSetting {
    athanEnabled: boolean;
    notificationsEnabled: boolean;
    muezzinId: string;
}


const MUEZZINS = [
  { id: "haram", name: "أذان الحرم المكي", file: "/adhan/الحرم المكي.mp3" },
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

  // Athan & Notification Settings
  const { state: editorState, updateState: updateEditor } = useEditor();
  const activeSettingsPrayer = editorState.activeSettingsPrayer;
  const setActiveSettingsPrayer = (val: string | null) => updateEditor({ activeSettingsPrayer: val });

  const [prayerSettings, setPrayerSettings] = useState<Record<string, PrayerSetting>>({
    Fajr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram" },
    Dhuhr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram" },
    Asr: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram" },
    Maghrib: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram" },
    Isha: { athanEnabled: true, notificationsEnabled: true, muezzinId: "haram" }
  });



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
        // Save to cache
        localStorage.setItem("prayer_times_cache", JSON.stringify(data.data.timings));
        localStorage.setItem("prayer_location_cache", `${city}، ${country}`);

        if (!lat) {
            setLocationName(`${city}، ${country}`);
            localStorage.setItem("user_city", city);
            localStorage.setItem("user_country", country);
        }
      }
    } catch (err) {
      console.error("Prayer times fetch failed, trying cache", err);
      const cached = localStorage.getItem("prayer_times_cache");
      const cachedLoc = localStorage.getItem("prayer_location_cache");
      if (cached) setTimes(JSON.parse(cached));
      if (cachedLoc) setLocationName(cachedLoc);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
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

  const requestNotificationPermission = async () => {
     if (!("Notification" in window)) return;
     const permission = await Notification.requestPermission();
     if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("notifications", "true");
     }
  };

  useEffect(() => {
    // 1. Initial Data Fetch
    const savedCity = localStorage.getItem("user_city");
    const savedCountry = localStorage.getItem("user_country");
    if (savedCity && savedCountry) fetchTimes(savedCity, savedCountry);
    else fetchTimes("Cairo", "Egypt");

    // 2. Load Per-Prayer Settings
    try {
        const savedSettings = localStorage.getItem("prayer_settings_v2");
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') setPrayerSettings(parsed);
        }
    } catch (e) {
        console.error("Failed to load settings", e);
        localStorage.removeItem("prayer_settings_v2");
    }

    // 3. Setup Timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



  // Check for Athan triggering
  useEffect(() => {
    if (!times) return;
    const nowStr = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // Check which prayer it is
    Object.entries(times).forEach(([id, time]) => {
        if (time === nowStr && currentTime.getSeconds() === 0) {
            const setting = prayerSettings[id];
            if (!setting) return;

            if (setting.athanEnabled && audioRef.current) {
                const muezzin = MUEZZINS.find(m => m.id === setting.muezzinId) || MUEZZINS[0];
                audioRef.current.src = muezzin.file;
                audioRef.current.play().catch(console.error);
            }

            if (setting.notificationsEnabled && ("Notification" in window)) {
                if (Notification.permission === "granted") {
                    new Notification(`حان الآن موعد أذان ${prayerNamesAr[id] || id}`, { 
                        body: "عن النبي صلوات ربي وسلامه عليه: الصلاة على وقتها" 
                    });
                }
            }
        }
    });

  }, [currentTime, times, prayerSettings]);


  const prayerNamesAr: Record<string, string> = {
    Fajr: "الفجر",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
  };

  const getNextPrayer = () => {
    if (!times) return null;
    const now = new Date();
    const list = Object.entries(prayerNamesAr).map(([id, name]) => {
      const [h, m] = (times[id as keyof PrayerTimesData] as string).split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
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
            // Find the muezzin for the currently active prayer setting
            const prayerId = activeSettingsPrayer || "Fajr";
            const muezzinId = prayerSettings[prayerId]?.muezzinId || "haram";
            const muezzin = MUEZZINS.find(m => m.id === muezzinId) || MUEZZINS[0];

            audioRef.current.src = muezzin.file;
            audioRef.current.play();
            setIsPlayingTest(true);
        }
    }
  };

  return (
    <div className="flex flex-col h-full p-8 md:p-16 pt-24 md:pt-16 animate-in fade-in duration-1000 overflow-y-auto no-scrollbar custom-scrollbar relative">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-10 relative z-10 pb-40">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
            <div className="flex flex-col text-right">
                <button onClick={() => setShowLocationPicker(true)} className="flex items-center gap-2 text-primary/60 hover:text-primary transition-all justify-end">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-bold font-arabic">{locationName}</span>
                </button>
                <h1 className="text-4xl font-black text-white font-mono mt-2 tracking-tighter">
                   {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAthanSettings(true)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-primary transition-all flex items-center gap-2 group"
                >
                    <span className="text-sm font-bold font-arabic">إعدادات الأذان</span>
                    <Settings2 className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                </button>
                <button onClick={detectLocation} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white transition-all"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
        </div>

        {/* Main Countdown Card */}
        <div className="premium-card p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03]">
             <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
             {nextPrayer ? (
                <>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4 drop-shadow-sm">الصلاة القادمة: {nextPrayer.name}</p>
                    <p className="text-white text-3xl md:text-8xl font-mono font-bold tracking-widest gold-shimmer-pro leading-none">
                      -{nextPrayer.remaining}
                    </p>
                    <div className="mt-8 flex items-center gap-3 glass-effect px-6 py-2 rounded-full border-white/10 shadow-lg">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                         <span className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                </>
            ) : (
                <div className="w-14 h-14 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {!times ? (
                [...Array(5)].map((_, i) => <div key={i} className="h-44 premium-card animate-pulse" />)
            ) : (
                Object.entries(prayerNamesAr).map(([id, name]) => {
                    const time = times[id as keyof PrayerTimesData];
                    const isNext = nextPrayer?.id === id;
                    const setting = prayerSettings[id];

                    return (
                        <div 
                            key={id} 
                            onDoubleClick={() => setActiveSettingsPrayer(id)}
                            className={`premium-card p-8 flex flex-col items-center gap-6 relative group/card transition-all active:scale-[0.98] ${isNext ? 'border-primary/40 bg-primary/5' : ''}`}
                        >
                            <button 
                                onClick={() => setActiveSettingsPrayer(id)}
                                className="absolute top-3 right-3 p-3 rounded-2xl bg-white/5 text-primary/80 border border-white/10 shadow-lg active:scale-90 transition-all z-20"
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>
                            
                            <h3 className={`text-xl font-bold font-arabic transition-all ${isNext ? 'text-primary' : 'text-white/60'}`}>{name}</h3>
                            <p className={`text-3xl font-mono font-black ${isNext ? 'text-white scale-110 shadow-primary/20' : 'text-white/40'}`}>{time}</p>
                            
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border transition-all ${setting?.athanEnabled ? 'bg-primary/20 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-white/10'}`}>
                                     {setting?.athanEnabled ? <Volume2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </div>
                                <div className={`p-2 rounded-xl border transition-all ${setting?.notificationsEnabled ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-white/10'}`}>
                                     {setting?.notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>


        {/* --- MODALS --- */}

        {/* Prayer Specific Settings Modal */}
        {activeSettingsPrayer && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setActiveSettingsPrayer(null)} />
                <div className="relative w-full max-w-xl premium-card p-6 md:p-10 overflow-y-auto max-h-[90vh] no-scrollbar animate-in zoom-in-95 duration-500 pb-24">
                    <button onClick={() => setActiveSettingsPrayer(null)} className="absolute top-6 left-6 text-white/20 hover:text-white z-50"><X /></button>


                    
                    <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-white font-arabic">إعدادات صلاة {prayerNamesAr[activeSettingsPrayer]}</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Athan Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">

                            <div className="text-right">
                                <p className="text-white font-bold font-arabic">صوت الأذان</p>
                                <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mt-1">Play Athan Audio</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const newSet = { ...prayerSettings, [activeSettingsPrayer]: { ...prayerSettings[activeSettingsPrayer], athanEnabled: !prayerSettings[activeSettingsPrayer].athanEnabled } };
                                    setPrayerSettings(newSet);
                                    localStorage.setItem("prayer_settings_v2", JSON.stringify(newSet));
                                }}
                                className={`w-14 h-8 rounded-full relative transition-all ${prayerSettings[activeSettingsPrayer].athanEnabled ? 'bg-primary' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${prayerSettings[activeSettingsPrayer].athanEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-right">
                                <p className="text-white font-bold font-arabic">إشعارات الصلاة</p>
                                <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mt-0.5">Push Notifications</p>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (Notification.permission !== "granted") await Notification.requestPermission();
                                    const newSet = { ...prayerSettings, [activeSettingsPrayer]: { ...prayerSettings[activeSettingsPrayer], notificationsEnabled: !prayerSettings[activeSettingsPrayer].notificationsEnabled } };
                                    setPrayerSettings(newSet);
                                    localStorage.setItem("prayer_settings_v2", JSON.stringify(newSet));
                                }}
                                className={`w-12 h-7 rounded-full relative transition-all ${prayerSettings[activeSettingsPrayer].notificationsEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${prayerSettings[activeSettingsPrayer].notificationsEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Muezzin Selection for this prayer */}
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-bold text-white/20 ml-2">صوت المؤذن لهذه الصلاة</label>
                            <div className="grid grid-cols-1 gap-2">
                                {MUEZZINS.map(m => (
                                    <button 
                                        key={m.id}
                                        onClick={() => {
                                            const newSet = { ...prayerSettings, [activeSettingsPrayer]: { ...prayerSettings[activeSettingsPrayer], muezzinId: m.id } };
                                            setPrayerSettings(newSet);
                                            localStorage.setItem("prayer_settings_v2", JSON.stringify(newSet));
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${prayerSettings[activeSettingsPrayer].muezzinId === m.id ? 'border-primary bg-primary/10 text-primary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {prayerSettings[activeSettingsPrayer].muezzinId === m.id ? <Check className="w-4 h-4" /> : <div className="w-4" />}
                                            <span className="text-sm font-bold font-arabic">{m.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Test Button */}
                        <button 
                            onClick={toggleTestAthan}
                            className={`w-full py-5 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all ${isPlayingTest ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-primary text-black'}`}
                        >
                            {isPlayingTest ? (
                                <><X className="w-5 h-5" /><span>إيقاف التجربة</span></>
                            ) : (
                                <><Play className="w-5 h-5 translate-x-1" /><span>تجربة الصوت المختار</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}


        {/* Location Picker (Old) */}
        {showLocationPicker && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animat-in fade-in duration-300">
                <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowLocationPicker(false)} />
                <div className="relative w-full max-w-lg premium-card p-12 overflow-hidden">
                    <button onClick={() => setShowLocationPicker(false)} className="absolute top-8 left-8 text-white/20 hover:text-white"><X /></button>
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                            <Globe className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-3xl font-bold text-white font-arabic">تغيير المنطقة</h3>
                    </div>
                    <div className="space-y-6">
                        <input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="City (e.g. Cairo)" className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 text-white outline-none focus:border-primary/40 transition-all font-bold" />
                        <input value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} placeholder="Country (e.g. Egypt)" className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 text-white outline-none focus:border-primary/40 transition-all font-bold" />
                        <button onClick={async () => { if (customCity && customCountry) { await fetchTimes(customCity, customCountry); setShowLocationPicker(false); } }} className="w-full py-5 bg-primary text-black rounded-[2rem] font-bold text-lg shadow-2xl shadow-primary/20 hover:scale-105 transition-all mt-4">تحديث</button>
                    </div>
                </div>
            </div>
        )}

      </div>
      <audio ref={audioRef} onEnded={() => setIsPlayingTest(false)} />
    </div>
  );
}
