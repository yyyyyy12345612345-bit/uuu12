"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Target, Compass, CheckCircle2, Circle, RotateCcw, Fingerprint, MapPin, Search, Bed } from "lucide-react";
import { ATHKAR, Thikr } from "@/data/athkar";

export function DailyHub() {
  const [activeTab, setActiveTab] = useState<"morning" | "evening" | "qibla" | "goal" | "sibha" | "sleep">("sibha");
  const [athkarProgress, setAthkarProgress] = useState<Record<string, number>>({});
  
  // Daily Goal state
  const [dailyGoal, setDailyGoal] = useState<number>(2); // Default 2 pages
  const [pagesRead, setPagesRead] = useState<number>(0);

  // Sibha state
  const [sibhaCount, setSibhaCount] = useState<number>(0);

  // Qibla state
  const [qibla, setQibla] = useState<{
    heading: number | null;
    angle: number | null;
    error: string | null;
    loading: boolean;
  }>({ heading: null, angle: null, error: null, loading: false });

  // Load state on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("athkar_progress");
    const savedGoalDate = localStorage.getItem("daily_goal_date");
    const today = new Date().toDateString();

    if (savedProgress) setAthkarProgress(JSON.parse(savedProgress));

    if (savedGoalDate === today) {
      const savedPages = localStorage.getItem("pages_read");
      if (savedPages) setPagesRead(parseInt(savedPages, 10));
      
      const savedSibha = localStorage.getItem("sibha_count");
      if (savedSibha) setSibhaCount(parseInt(savedSibha, 10));
    } else {
      // Reset daily features on new day
      localStorage.setItem("daily_goal_date", today);
      localStorage.setItem("pages_read", "0");
      localStorage.setItem("sibha_count", "0");
      setPagesRead(0);
      setSibhaCount(0);
      setAthkarProgress({});
    }
  }, []);

  const handleThikrClick = (thikrId: number, maxCount: number, type: any) => {
    const key = `${type}_${thikrId}`;
    const current = athkarProgress[key] || 0;
    
    if (current < maxCount) {
      const newProgress = { ...athkarProgress, [key]: current + 1 };
      setAthkarProgress(newProgress);
      localStorage.setItem("athkar_progress", JSON.stringify(newProgress));

      // Analytics: تتبع الأذكار
      if (current + 1 === maxCount) {
        // @ts-ignore
        window.gtag?.('event', 'thikr_complete', { 'thikr_type': type, 'thikr_id': thikrId });
      }
    }
  };

  const handlePageRead = () => {
    const newCount = pagesRead + 1;
    setPagesRead(newCount);
    localStorage.setItem("pages_read", newCount.toString());
    
    // Analytics: تتبع الورد اليومي
    // @ts-ignore
    window.gtag?.('event', 'daily_page_read', { 'total_pages': newCount });
  };

  const handleSibhaClick = () => {
    const newCount = sibhaCount + 1;
    setSibhaCount(newCount);
    localStorage.setItem("sibha_count", newCount.toString());
    
    // Analytics: تتبع السبحة (كل 33 تسبيحة مثلاً لتقليل عدد الطلبات)
    if (newCount % 33 === 0) {
        // @ts-ignore
        window.gtag?.('event', 'sibha_milestone', { 'count': newCount });
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Haptic feedback
    }
  };

  const resetSibha = () => {
    setSibhaCount(0);
    localStorage.setItem("sibha_count", "0");
    // @ts-ignore
    window.gtag?.('event', 'sibha_reset');
  };

  const requestQibla = useCallback(() => {
    setQibla(prev => ({ ...prev, loading: true, error: null }));
    
    // Analytics: تتبع طلب القبلة
    // @ts-ignore
    window.gtag?.('event', 'qibla_request_start');

    const setupOrientation = (bearing: number) => {
      if (typeof (DeviceOrientationEvent as any) !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
               startListening(bearing);
            } else {
               setQibla(prev => ({ ...prev, loading: false, error: "تم رفض صلاحية استخدام بوصلة الجهاز" }));
            }
          })
          .catch(console.error);
      } else {
        startListening(bearing);
      }

      function startListening(b: number) {
        setQibla(prev => ({ ...prev, angle: b, loading: false }));
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientationFallback, true);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const meccaLat = 21.422487;
          const meccaLng = 39.826206;
          
          const phi1 = lat * Math.PI / 180;
          const phi2 = meccaLat * Math.PI / 180;
          const dlng = (meccaLng - lng) * Math.PI / 180;
          
          const y = Math.sin(dlng) * Math.cos(phi2);
          const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dlng);
          let bearing = Math.atan2(y, x) * 180 / Math.PI;
          bearing = (bearing + 360) % 360;

          setupOrientation(bearing);
        },
        () => setQibla(prev => ({ ...prev, loading: false, error: "فشل الوصول للموقع الجغرافي. تأكد من تفعيله في جهازك." })),
        { enableHighAccuracy: true }
      );
    } else {
      setQibla(prev => ({ ...prev, loading: false, error: "جهازك لا يدعم تحديد الموقع." }));
    }
  }, []);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.absolute && event.alpha !== null) {
      setQibla(prev => ({ ...prev, heading: 360 - event.alpha! }));
    }
  };

  const handleOrientationFallback = (event: any) => {
    if (event.webkitCompassHeading) {
      setQibla(prev => ({ ...prev, heading: event.webkitCompassHeading }));
    } else if (!('ondeviceorientationabsolute' in window) && event.alpha !== null) {
      setQibla(prev => ({ ...prev, heading: 360 - event.alpha }));
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientationFallback, true);
    };
  }, []);


  const renderAthkarList = (type: any) => {
    return ATHKAR[type].map((thikr) => {
      const key = `${type}_${thikr.id}`;
      const current = athkarProgress[key] || 0;
      const isComplete = current >= thikr.count;

      return (
        <div 
          key={thikr.id} 
          onClick={() => handleThikrClick(thikr.id, thikr.count, type)}
          className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden active:scale-[0.97] duration-300 ${
             isComplete 
              ? 'bg-primary/5 border-primary/20 scale-[0.98] opacity-70' 
              : 'glass-effect border-white/5 hover:border-white/20 shadow-xl'
          }`}
        >
          {isComplete && (
            <div className="absolute top-4 left-4 text-primary opacity-50">
               <CheckCircle2 className="w-6 h-6" />
            </div>
          )}

          <h4 className="text-xl md:text-2xl font-arabic leading-[1.8] text-white text-center mb-6">
            {thikr.text}
          </h4>
          <p className="text-sm text-primary/80 font-arabic text-center mb-6 px-4">
            {thikr.description}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-white/40 uppercase tracking-widest font-bold">
               التكرار
            </div>
            <div className="flex items-center gap-3" style={{ direction: 'ltr' }}>
               <span className="text-2xl font-bold text-white tracking-widest">{current}</span>
               <span className="text-white/30 text-lg">/</span>
               <span className="text-xl text-primary font-bold">{thikr.count}</span>
            </div>
          </div>
          
          {!isComplete && current > 0 && (
             <div 
               className="absolute bottom-0 right-0 h-1 bg-primary transition-all duration-500 rounded-b-3xl"
               style={{ width: `${(current / thikr.count) * 100}%` }}
             />
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-14 overflow-y-auto no-scrollbar font-arabic pb-40">
      
      <div className="flex flex-col items-center mb-8 md:mb-12 text-center relative z-10 pt-4 md:pt-0 shrink-0">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">يومياتي</h2>
        <p className="text-white/40 text-sm max-w-sm">
          أذكار، سبحة إلكترونية، ورد يومي، والقبلة في مكان واحد.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex w-full max-w-3xl mx-auto rounded-3xl p-1.5 glass-effect border border-white/5 mb-10 overflow-x-auto no-scrollbar snap-x z-10 shrink-0">
        {[
          { id: "sibha", icon: Fingerprint, label: "السبحة" },
          { id: "morning", icon: Sun, label: "الصباح" },
          { id: "evening", icon: Moon, label: "المساء" },
          { id: "sleep", icon: Bed, label: "النوم" },
          { id: "goal", icon: Target, label: "الورد" },
          { id: "qibla", icon: Compass, label: "القبلة" }
        ].map((t) => {
           const Icon = t.icon;
           const isActive = activeTab === t.id;
           return (
             <button
               key={t.id}
               onClick={() => setActiveTab(t.id as any)}
               className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl transition-all whitespace-nowrap snap-center min-w-[100px] ${
                 isActive ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-white/40 hover:text-white/80'
               }`}
             >
               <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
               <span className="text-sm font-bold tracking-wide">{t.label}</span>
             </button>
           )
        })}
      </div>

      {/* Content Area */}
      <div className="w-full max-w-3xl mx-auto z-10 space-y-6 shrink-0 flex-1">
         
         {activeTab === "sibha" && (
            <div className="glass-effect p-8 md:p-12 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center text-center relative overflow-hidden">
               <button 
                  onClick={resetSibha} 
                  className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all shadow-lg"
                  aria-label="إعادة تعيين"
               >
                  <RotateCcw className="w-5 h-5" />
               </button>

               <h3 className="text-3xl font-bold text-white mb-2">المسبحة الإلكترونية</h3>
               
               <div className="h-16 mb-8 flex items-center justify-center">
                  <p className="text-xl md:text-2xl font-bold text-primary font-arabic animate-fade-in leading-relaxed max-w-sm">
                     {(() => {
                        const cycle = sibhaCount % 100;
                        if (cycle < 33) return "سُبْحَانَ اللَّهِ";
                        if (cycle < 66) return "الْحَمْدُ لِلَّهِ";
                        if (cycle < 99) return "اللَّهُ أَكْبَرُ";
                        return "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ";
                     })()}
                  </p>
               </div>

               <div className="mb-12 relative group cursor-pointer" onClick={handleSibhaClick}>
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-[50px] animate-pulse group-hover:bg-primary/40 transition-all duration-500" />
                  
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full glass-effect border border-primary/30 flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(212,175,55,0.15)] group-hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden">
                     <div className="absolute inset-x-0 bottom-0 bg-primary/10 transition-all duration-300" style={{ height: `${(sibhaCount % 33 === 0 && sibhaCount > 0 && sibhaCount % 100 !== 0 ? 33 : sibhaCount % 33) / 33 * 100}%` }} />
                     
                     <div className="flex flex-col items-center gap-2">
                        <span key={sibhaCount} className="text-6xl md:text-7xl font-bold text-white tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all animate-reveal" style={{ direction: 'ltr' }}>{sibhaCount}</span>
                        <Fingerprint className="w-8 h-8 text-primary/50 mt-2" />
                     </div>
                  </div>
               </div>
               <p className="text-sm text-white/30 tracking-widest uppercase mb-2">اضغط على الدائرة للتسبيح</p>
               <p className="text-xs text-white/20">الدورة تكتمل كل 100 تسبيحة</p>
            </div>
         )}

         {activeTab === "morning" && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {renderAthkarList("morning")}
            </div>
         )}

         {activeTab === "evening" && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {renderAthkarList("evening")}
            </div>
         )}

         {activeTab === "sleep" && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {renderAthkarList("sleep" as any)}
            </div>
         )}

         {activeTab === "goal" && (
            <div className="glass-effect p-8 md:p-12 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 relative">
                  <Target className="w-10 h-10 text-primary" />
                  {pagesRead >= dailyGoal && (
                     <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#050505]">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                     </div>
                  )}
               </div>

               <h3 className="text-3xl font-bold text-white mb-4">وردك اليومي</h3>
               <p className="text-white/50 mb-10 text-lg">حدد هدفك من القراءة وتابعه يومياً</p>

               <div className="w-full max-w-sm space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 gap-4">
                     <span className="text-white font-bold text-sm md:text-base">الهدف اليومي (صفحات)</span>
                     <div className="flex items-center gap-3 md:gap-4 shrink-0" style={{ direction: 'ltr' }}>
                        <button onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">-</button>
                        <span className="text-xl font-bold text-primary">{dailyGoal}</span>
                        <button onClick={() => setDailyGoal(dailyGoal + 1)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">+</button>
                     </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                     <div 
                        className="absolute bottom-0 left-0 h-full bg-primary/20 transition-all duration-1000 -z-10" 
                        style={{ width: `${Math.min(100, (pagesRead / dailyGoal) * 100)}%` }} 
                     />
                     
                     <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-white tracking-widest" style={{ direction: 'ltr' }}>{pagesRead} <span className="text-2xl text-white/30">/ {dailyGoal}</span></div>
                        <button 
                           onClick={handlePageRead}
                           className="px-8 py-3 bg-primary text-black font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full"
                        >
                           سجل قراءة صفحة
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === "qibla" && (
            <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
               <h3 className="text-3xl font-bold text-white mb-4">اتجاه القبلة</h3>
               
               {qibla.error ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl max-w-sm text-center mt-6">
                     <p>{qibla.error}</p>
                     <button onClick={requestQibla} className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">إعادة المحاولة</button>
                  </div>
               ) : qibla.angle === null ? (
                  <div className="flex flex-col items-center gap-6 mt-8">
                     <p className="text-white/50 text-center max-w-sm leading-relaxed">
                        نحتاج إلى صلاحية الوصول لموقعك الجغرافي والبوصلة لتحديد اتجاه القبلة (مكة المكرمة) بدقة.
                     </p>
                     <button 
                        onClick={requestQibla}
                        disabled={qibla.loading}
                        className="px-10 py-4 bg-primary text-black font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3"
                     >
                        {qibla.loading ? (
                           <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                           <MapPin className="w-5 h-5" />
                        )}
                        <span>تحديد موقعي الآن</span>
                     </button>
                  </div>
               ) : (
                  <div className="relative flex items-center justify-center mt-12 mb-8 scale-110">
                     <div className="absolute inset-0 bg-primary/5 rounded-full blur-[40px] animate-pulse" />
                     
                     {/* Compass Outer Ring */}
                     <div 
                        className="w-64 h-64 border-4 border-white/10 rounded-full relative transition-transform duration-500 ease-out flex items-center justify-center"
                        style={{ transform: `rotate(${qibla.heading ? -qibla.heading : 0}deg)` }}
                     >
                        <div className="absolute top-2 text-white/50 font-bold text-sm">N</div>
                        <div className="absolute bottom-2 text-white/30 text-xs">S</div>
                        <div className="absolute right-2 text-white/30 text-xs">E</div>
                        <div className="absolute left-2 text-white/30 text-xs">W</div>

                        {/* Qibla Indicator Arrow */}
                        <div 
                           className="absolute inset-0 transition-transform duration-500 ease-out"
                           style={{ transform: `rotate(${qibla.angle}deg)` }}
                        >
                           <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">
                              <Search className="w-8 h-8 text-primary mb-1" />
                              <div className="w-1.5 h-16 bg-gradient-to-b from-primary to-transparent rounded-full" />
                           </div>
                        </div>
                     </div>
                     
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1)]" />
                     </div>
                  </div>
               )}
               {qibla.heading !== null && qibla.angle !== null && (
                 <p className="text-white/40 mt-8 text-sm">قم بتدوير الجهاز حتى يشير السهم الذهبي للأمام</p>
               )}
            </div>
         )}
      </div>
      
      {/* Spacer to prevent overlap with floating navigation bar */}
      <div className="h-40 shrink-0 w-full" />
    </div>
  );
}
