"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Target, Compass, CheckCircle2, RotateCcw, Fingerprint, MapPin, Search, Bed, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { ATHKAR } from "@/data/athkar";
import { AthkarLibrary } from "./AthkarLibrary";
import { addPoints, addSebhaPoints, startThikrTimer, endThikrTimer } from "@/lib/points";
import { useRef } from "react";

export function DailyHub() {
  const [activeTab, setActiveTab] = useState<"morning" | "evening" | "qibla" | "goal" | "sibha" | "sleep" | "library">("sibha");
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
  const [scrollState, setScrollState] = useState({ left: false, right: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // In RTL, scrollLeft is 0 at the rightmost position and negative when scrolling left
      // But standard browser behavior for RTL can vary. Let's handle it robustly.
      const isRTL = getComputedStyle(scrollRef.current).direction === 'rtl';
      
      if (isRTL) {
        setScrollState({
          left: Math.abs(scrollLeft) < scrollWidth - clientWidth - 5,
          right: Math.abs(scrollLeft) > 5
        });
      } else {
        setScrollState({
          left: scrollLeft > 5,
          right: scrollLeft < scrollWidth - clientWidth - 5
        });
      }
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

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

  const lastClickTime = useRef<number>(0);

  const handleThikrClick = (thikrId: number, maxCount: number, type: any) => {
    // Anti-cheat: prevent spamming faster than 4 clicks per second
    const now = Date.now();
    if (now - lastClickTime.current < 250) return;
    lastClickTime.current = now;

    const key = `${type}_${thikrId}`;
    const current = athkarProgress[key] || 0;
    
    if (current < maxCount) {
      const newProgress = { ...athkarProgress, [key]: current + 1 };
      setAthkarProgress(newProgress);
      localStorage.setItem("athkar_progress", JSON.stringify(newProgress));
    }
  };

  const handleSibhaClick = () => {
    // Anti-cheat: prevent spamming
    const now = Date.now();
    if (now - lastClickTime.current < 200) return;
    lastClickTime.current = now;

    const newCount = sibhaCount + 1;
    setSibhaCount(newCount);
    localStorage.setItem("sibha_count", newCount.toString());
    
    // Add 3 points for every 99 tasbeehs
    if (newCount % 99 === 0 && newCount > 0) {
       console.log("[DailyHub] Milestone reached! Adding Sebha points...");
       addSebhaPoints(3).then(res => {
          if (res?.success) {
            console.log("[DailyHub] Earned 3 points for 99 tasbeehs");
          } else {
            console.error("[DailyHub] Failed to add Sebha points:", res?.message);
          }
       });
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); 
    }
  };

  const handlePageRead = () => {
    const newCount = pagesRead + 1;
    setPagesRead(newCount);
    localStorage.setItem("pages_read", newCount.toString());
    
    // Manual point entry for daily goal
    addPoints("quran", 5).then(res => {
       if (res?.success) console.log("[DailyHub] Earned 5 points for reading a page");
    });
  };

  const resetSibha = () => {
    setSibhaCount(0);
    localStorage.setItem("sibha_count", "0");
    // @ts-ignore
    window.gtag?.('event', 'sibha_reset');
  };

  const removeOrientationListeners = () => {
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientationFallback, true);
  };

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

  const requestQibla = useCallback(() => {
    removeOrientationListeners();
    setQibla(prev => ({ ...prev, loading: true, error: null, heading: null, angle: null }));
    
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
          .catch(err => {
             console.error(err);
             setQibla(prev => ({ ...prev, loading: false, error: "تعذر الوصول لصلاحية بوصلة الجهاز. حاول مرة أخرى." }));
          });
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
        () => {
            setQibla(prev => ({ ...prev, loading: false, error: "فشل الوصول للموقع الجغرافي. تأكد من تفعيله في جهازك." }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    } else {
      setQibla(prev => ({ ...prev, loading: false, error: "جهازك لا يدعم تحديد الموقع." }));
    }
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientationFallback, true);
    };
  }, []);

  // Points Tracking Observer for Daily Athkar
  useEffect(() => {
    if (activeTab !== "morning" && activeTab !== "evening" && activeTab !== "sleep") return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const thikrId = entry.target.getAttribute("data-thikr-id");
            if (thikrId) {
              endThikrTimer(0.5).then(res => {
                if (res?.success) {
                   console.log(`Earned 0.5 points for reading Thikr`);
                }
              });
              startThikrTimer(thikrId);
            }
          }
        });
      },
      { threshold: 0.8 } // Must see 80% of the Thikr to count
    );

    const thikrElements = document.querySelectorAll("[data-thikr-id]");
    thikrElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeTab]);

  const renderAthkarList = (type: any) => {
    return ATHKAR[type].map((thikr) => {
      const key = `${type}_${thikr.id}`;
      const current = athkarProgress[key] || 0;
      const isComplete = current >= thikr.count;

      return (
        <div 
          key={thikr.id} 
          data-thikr-id={key}
          onClick={() => handleThikrClick(thikr.id, thikr.count, type)}
          className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden active:scale-[0.97] duration-300 ${
             isComplete 
              ? 'bg-primary/5 border-primary/20 scale-[0.98] opacity-70' 
              : 'glass-effect border-border hover:border-primary/20 shadow-xl'
          }`}
        >
          {isComplete && (
            <div className="absolute top-4 left-4 text-primary opacity-50">
               <CheckCircle2 className="w-6 h-6" />
            </div>
          )}

          <h4 className="text-xl md:text-2xl font-arabic leading-[1.8] text-foreground text-center mb-6">
            {thikr.text}
          </h4>
          <p className="text-sm text-primary font-arabic text-center mb-6 px-4">
            {thikr.description}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-foreground/40 uppercase tracking-widest font-bold">
               التكرار
            </div>
            <div className="flex items-center gap-3" style={{ direction: 'ltr' }}>
               <span className="text-2xl font-bold text-foreground tracking-widest">{current}</span>
               <span className="text-foreground/30 text-lg">/</span>
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
    <div className="w-full h-full flex flex-col p-6 md:p-14 overflow-y-auto font-arabic pb-40 bg-background text-foreground relative daily-hub-container [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Unified Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-[0.4] dark:opacity-[0.25]"
              style={{ 
                  backgroundImage: "url('./mushaf-bg.jpg.png')",
                  filter: "sepia(0.3) brightness(0.95) contrast(1.2)"
              }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.02] dark:opacity-[0.05]" />
      </div>

      
      <div className="flex flex-col items-center mb-12 text-center relative z-10 shrink-0">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">يومياتي</h2>
        <p className="text-foreground/40 text-sm max-w-sm">
          أذكار، سبحة إلكترونية، ورد يومي، والقبلة في مكان واحد.
        </p>
      </div>

      <div className="relative w-full max-w-3xl mx-auto mb-10 z-10 shrink-0 group">
        {/* Scroll Indicators (Fade) */}
        <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none transition-opacity duration-300 ${scrollState.right ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none transition-opacity duration-300 ${scrollState.left ? 'opacity-100' : 'opacity-0'}`} />

        {/* Scroll Arrows */}
        {scrollState.right && (
          <button 
            onClick={() => scrollBy(150)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-md border border-white/5 flex items-center justify-center z-30 active:scale-90 transition-all text-foreground/60 hover:text-primary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {scrollState.left && (
          <button 
            onClick={() => scrollBy(-150)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-md border border-white/5 flex items-center justify-center z-30 active:scale-90 transition-all text-foreground/60 hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex w-full rounded-3xl p-1.5 glass-effect border border-border overflow-x-auto horizontal-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x"
        >
          {[
            { id: "sibha", icon: Fingerprint, label: "السبحة" },
            { id: "morning", icon: Sun, label: "الصباح" },
            { id: "evening", icon: Moon, label: "المساء" },
            { id: "sleep", icon: Bed, label: "النوم" },
            { id: "library", icon: BookOpen, label: "المكتبة" },
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
                  isActive ? 'bg-foreground/10 text-foreground shadow-lg border border-border' : 'text-foreground/40 hover:text-foreground/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm font-bold tracking-wide">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto z-10 space-y-6 shrink-0 flex-1">
         
         {activeTab === "sibha" && (
            <div className="glass-effect p-8 md:p-12 rounded-[2.5rem] border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center text-center relative overflow-hidden">
               <button 
                  onClick={resetSibha} 
                  className="absolute top-6 left-6 w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all shadow-lg"
               >
                  <RotateCcw className="w-5 h-5" />
               </button>

               <h3 className="text-3xl font-bold text-foreground mb-2">المسبحة الإلكترونية</h3>
               
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
                        <span key={sibhaCount} className="text-6xl md:text-7xl font-bold text-foreground tracking-wider drop-shadow-sm transition-all animate-reveal" style={{ direction: 'ltr' }}>{sibhaCount}</span>
                        <Fingerprint className="w-8 h-8 text-primary/50 mt-2" />
                     </div>
                  </div>
               </div>
               <p className="text-sm text-foreground/30 tracking-widest uppercase mb-2 font-bold">اضغط على الدائرة للتسبيح</p>
               <p className="text-xs text-foreground/20">الدورة تكتمل كل 100 تسبيحة</p>
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

         {activeTab === "library" && (
            <AthkarLibrary />
         )}

         {activeTab === "goal" && (
            <div className="glass-effect p-8 md:p-12 rounded-[2.5rem] border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 relative">
                  <Target className="w-10 h-10 text-primary" />
                  {pagesRead >= dailyGoal && (
                     <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                     </div>
                  )}
               </div>

               <h3 className="text-3xl font-bold text-foreground mb-4">وردك اليومي</h3>
               <p className="text-foreground/50 mb-10 text-lg">حدد هدفك من القراءة وتابعه يومياً</p>

               <div className="w-full max-w-sm space-y-6">
                  <div className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-border gap-4">
                     <span className="text-foreground font-bold text-sm md:text-base">الهدف اليومي (صفحات)</span>
                     <div className="flex items-center gap-3 md:gap-4 shrink-0" style={{ direction: 'ltr' }}>
                        <button onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))} className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground hover:bg-foreground/20">-</button>
                        <span className="text-xl font-bold text-primary">{dailyGoal}</span>
                        <button onClick={() => setDailyGoal(dailyGoal + 1)} className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground hover:bg-foreground/20">+</button>
                     </div>
                  </div>

                  <div className="bg-foreground/5 p-6 rounded-3xl border border-border relative overflow-hidden">
                     <div 
                        className="absolute bottom-0 left-0 h-full bg-primary/20 transition-all duration-1000 -z-10" 
                        style={{ width: `${Math.min(100, (pagesRead / dailyGoal) * 100)}%` }} 
                     />
                     
                     <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-foreground tracking-widest" style={{ direction: 'ltr' }}>{pagesRead} <span className="text-2xl text-foreground/30">/ {dailyGoal}</span></div>
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
            <div className="glass-effect p-8 rounded-[2.5rem] border border-border animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
               <h3 className="text-3xl font-bold text-foreground mb-4">اتجاه القبلة</h3>
               
               {qibla.error ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl max-w-sm text-center mt-6">
                     <p>{qibla.error}</p>
                     <button onClick={requestQibla} className="mt-4 px-6 py-2 bg-foreground/10 rounded-full hover:bg-foreground/20 transition-all">إعادة المحاولة</button>
                  </div>
               ) : qibla.angle === null ? (
                  <div className="flex flex-col items-center gap-6 mt-8">
                     <p className="text-foreground/50 text-center max-w-sm leading-relaxed">
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
                     
                     <div 
                        className="w-64 h-64 border-4 border-foreground/10 rounded-full relative transition-transform duration-500 ease-out flex items-center justify-center"
                        style={{ transform: `rotate(${qibla.heading ? -qibla.heading : 0}deg)` }}
                     >
                        <div className="absolute top-2 text-foreground/50 font-bold text-sm">N</div>
                        <div className="absolute bottom-2 text-foreground/30 text-xs">S</div>
                        <div className="absolute right-2 text-foreground/30 text-xs">E</div>
                        <div className="absolute left-2 text-foreground/30 text-xs">W</div>

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
                        <div className="w-3 h-3 bg-foreground rounded-full shadow-[0_0_20px_rgba(var(--foreground-rgb),0.5)]" />
                     </div>
                  </div>
               )}
               {qibla.heading !== null && qibla.angle !== null && (
                 <p className="text-foreground/40 mt-8 text-sm">قم بتدوير الجهاز حتى يشير السهم الذهبي للأمام</p>
               )}
            </div>
         )}
      </div>
      
      <div className="h-40 shrink-0 w-full" />
    </div>
  );
}
