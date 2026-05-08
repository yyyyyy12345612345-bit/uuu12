"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, MapPin, Navigation, Info, Locate, Search, ArrowUp, Sparkles } from "lucide-react";

interface QiblaCompassProps {
  qiblaAngle: number | null;
  onRequestLocation: () => void;
  isLoading: boolean;
  error: string | null;
}

export function QiblaCompass({ qiblaAngle, onRequestLocation, isLoading, error }: QiblaCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>("جاري تحديد الموقع...");
  const [distance, setDistance] = useState<string>("");

  // Handle device orientation for real-time compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS
      const heading = (e as any).webkitCompassHeading || e.alpha;
      if (heading !== null) {
        setDeviceHeading(heading);
      }
    };

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
      setIsSupported(false);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Calculate distance when angle is available (mocking for now as we don't have lat/lng passed here yet)
  useEffect(() => {
    if (qiblaAngle !== null) {
        setDistance("1,248 كم");
        setLocationName("مكة المكرمة، السعودية");
    }
  }, [qiblaAngle]);

  const relativeQiblaAngle = qiblaAngle !== null ? (qiblaAngle - deviceHeading + 360) % 360 : 0;
  const isAligned = Math.abs(relativeQiblaAngle) < 5 || Math.abs(relativeQiblaAngle - 360) < 5;

  return (
    <div className="w-full flex flex-col items-center gap-10 animate-premium-in">
      
      {/* Top Status Card */}
      <div className="w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 islamic-pattern opacity-[0.02]" />
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">الموقع الحالي</span>
                    <span className="text-sm font-bold text-foreground">{qiblaAngle ? locationName : "غير محدد"}</span>
                </div>
            </div>
            {qiblaAngle && (
                <div className="text-right">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">المسافة</span>
                    <p className="text-sm font-bold text-foreground">{distance}</p>
                </div>
            )}
         </div>
      </div>

      {/* Main Compass Area */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
        
        {/* Decorative Rings */}
        <div className="absolute inset-0 border-[1px] border-primary/5 rounded-full" />
        <div className="absolute inset-4 border-[1px] border-primary/10 rounded-full" />
        <div className="absolute inset-12 border-[2px] border-primary/5 rounded-full" />
        
        {/* Glow Effect when aligned */}
        <AnimatePresence>
            {isAligned && qiblaAngle !== null && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-primary/10 rounded-full blur-[60px]"
                />
            )}
        </AnimatePresence>

        {/* Compass Dial (Rotates with device) */}
        <motion.div 
            className="absolute inset-0"
            animate={{ rotate: -deviceHeading }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
            {/* Degree Marks */}
            {[...Array(72)].map((_, i) => (
                <div 
                    key={i} 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] origin-bottom h-full"
                    style={{ transform: `translateX(-50%) rotate(${i * 5}deg)` }}
                >
                    <div className={`w-full h-2 ${i % 2 === 0 ? 'bg-primary/40' : 'bg-primary/10'}`} />
                </div>
            ))}

            {/* Cardinals */}
            {['N', 'E', 'S', 'W'].map((d, i) => (
                <div 
                    key={d}
                    className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-foreground/20"
                    style={{ transform: `translateX(-50%) rotate(${i * 90}deg)`, transformOrigin: `center ${144}px` }}
                >
                    {d}
                </div>
            ))}
        </motion.div>

        {/* Qibla Indicator (Rotates relative to device) */}
        <motion.div 
            className="absolute inset-0 z-30"
            animate={{ rotate: relativeQiblaAngle }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 flex flex-col items-center group">
                <div className={`p-4 rounded-full transition-all duration-500 shadow-2xl ${isAligned ? 'bg-primary text-black scale-125 shadow-primary/40' : 'bg-card border border-primary/20 text-primary'}`}>
                    <ArrowUp className={`w-8 h-8 ${isAligned ? 'animate-bounce' : ''}`} />
                </div>
                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isAligned ? 'bg-primary text-black' : 'bg-card border border-border text-foreground/40'}`}>
                    {isAligned ? 'القبلة هنا' : 'مكة المكرمة'}
                </div>
            </div>
        </motion.div>

        {/* Center Point */}
        <div className="relative w-16 h-16 rounded-full bg-card border-2 border-primary/20 shadow-xl flex items-center justify-center z-40">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isAligned ? 'bg-primary shadow-[0_0_15px_rgba(212,175,55,0.8)]' : 'bg-border'}`} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-black text-foreground tracking-tighter" style={{ direction: 'ltr' }}>
                {qiblaAngle ? Math.round(relativeQiblaAngle) : "--"}°
            </span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2">الانحراف عن القبلة</span>
        </div>

        {!qiblaAngle ? (
            <button 
                onClick={onRequestLocation}
                disabled={isLoading}
                className="group relative px-10 py-5 bg-secondary text-secondary-foreground rounded-[2rem] font-black text-lg overflow-hidden shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
                <div className="absolute inset-0 gold-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-3">
                    {isLoading ? <Sparkles className="w-6 h-6 animate-spin" /> : <Locate className="w-6 h-6" />}
                    <span>تفعيل القبلة الآن</span>
                </div>
            </button>
        ) : (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl text-primary font-bold text-sm">
                <Info className="w-4 h-4" />
                <span>قم بتدوير الهاتف حتى يتطابق السهم مع الاتجاه الصحيح</span>
            </div>
        )}
      </div>

      {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-2xl text-xs font-bold animate-shake">
              {error}
          </div>
      )}
    </div>
  );
}
