"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Info, Locate, ArrowUp, Loader2, Compass } from "lucide-react";

interface QiblaCompassProps {
  qiblaAngle: number | null;
  distance: number | null;
  onRequestLocation: () => void;
  isLoading: boolean;
  error: string | null;
}

const KaabaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
    {/* Kaaba Cube Outline */}
    <path d="M32 8 L54 18 L54 44 L32 54 L10 44 L10 18 Z" fill="#18181b" stroke="#d4af37" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Side shading for 3D look */}
    <path d="M32 8 L32 54 L10 44 L10 18 Z" fill="#09090b" opacity="0.6" />
    {/* Kiswah Gold Band (Hizam) */}
    <path d="M10 24 L32 14 L54 24 L54 27 L32 17 L10 27 Z" fill="#d4af37" />
    {/* Kaaba Door */}
    <path d="M36 29 L46 34 L46 47 L36 42 Z" fill="#d4af37" opacity="0.95" />
  </svg>
);

export function QiblaCompass({ qiblaAngle, distance, onRequestLocation, isLoading, error }: QiblaCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>("جاري تحديد الموقع...");
  const [distanceText, setDistanceText] = useState<string>("");
  const [requiresPermission, setRequiresPermission] = useState<boolean>(false);
  const [lastAligned, setLastAligned] = useState<boolean>(false);

  // Compass listener callback
  const handleOrientation = useCallback((e: any) => {
    let heading = null;
    if (e.webkitCompassHeading !== undefined) {
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      // absolute alpha on Android
      heading = (360 - e.alpha) % 360;
    }
    if (heading !== null) {
      setDeviceHeading(heading);
    }
  }, []);

  // Handle device orientation for real-time compass
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        setRequiresPermission(true);
      }

      if ("ondeviceorientationabsolute" in window) {
        window.addEventListener("deviceorientationabsolute", handleOrientation, true);
      } else if ("DeviceOrientationEvent" in window) {
        window.addEventListener("deviceorientation", handleOrientation, true);
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, [handleOrientation]);

  // Request iOS Sensor Permissions
  const requestSensorPermission = async () => {
    if (typeof window !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === "granted") {
          setRequiresPermission(false);
          // Re-bind to ensure listener starts immediately
          if ("ondeviceorientationabsolute" in window) {
            window.addEventListener("deviceorientationabsolute", handleOrientation, true);
          } else {
            window.addEventListener("deviceorientation", handleOrientation, true);
          }
        } else {
          alert("تم رفض صلاحية مستشعر الاتجاه.");
        }
      } catch (err) {
        console.error("Error requesting device orientation permission:", err);
      }
    }
  };

  // Real Distance & Location Name
  useEffect(() => {
    if (qiblaAngle !== null && distance !== null) {
      setDistanceText(distance.toLocaleString("ar-EG") + " كم");
      setLocationName("مكة المكرمة، السعودية");
    }
  }, [qiblaAngle, distance]);

  const handleActivate = async () => {
    if (requiresPermission) {
      await requestSensorPermission();
    }
    onRequestLocation();
  };

  const relativeQiblaAngle = qiblaAngle !== null ? (qiblaAngle - deviceHeading + 360) % 360 : 0;
  const isAligned = qiblaAngle !== null && (Math.abs(relativeQiblaAngle) < 6 || Math.abs(relativeQiblaAngle - 360) < 6);

  // Vibration on Alignment
  useEffect(() => {
    if (isAligned && !lastAligned) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch (_) { }
      }
    }
    setLastAligned(isAligned);
  }, [isAligned, lastAligned]);

  const CARD_BG = "bg-[#0c0f19]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2rem]";
  const LABEL = "text-[10px] font-black text-[#d4af37] uppercase tracking-widest";

  return (
    <div className="w-full flex flex-col items-center gap-8 animate-premium-in">

      {/* Top Status Card */}
      <div className={`w-full max-w-sm p-5 shadow-2xl relative overflow-hidden group ${CARD_BG}`}>
        <div className="absolute inset-0 islamic-pattern opacity-[0.02]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-right">
              <span className={LABEL}>الموقع الحالي</span>
              <span className="text-xs font-bold text-white/90">{qiblaAngle ? locationName : "غير محدد"}</span>
            </div>
          </div>
          {qiblaAngle && (
            <div className="text-left">
              <span className={LABEL}>المسافة للكعبة</span>
              <p className="text-xs font-bold text-white/90">{distanceText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Compass Area */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center rounded-full bg-gradient-to-b from-white/[0.01] to-transparent p-6 border border-white/[0.03]">

        {/* Decorative Rings */}
        <div className="absolute inset-0 border border-white/[0.02] rounded-full" />
        <div className="absolute inset-4 border border-amber-500/5 rounded-full" />
        <div className="absolute inset-10 border border-white/[0.04] rounded-full" />
        <div className="absolute inset-20 border border-amber-500/5 rounded-full" />

        {/* Glow Effect when aligned */}
        <AnimatePresence>
          {isAligned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-10 bg-amber-500/10 rounded-full blur-[40px] shadow-[0_0_80px_rgba(245,158,11,0.2)]"
            />
          )}
        </AnimatePresence>

        {/* Compass Dial (Rotates with device) */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -deviceHeading }}
          transition={{ type: "spring", stiffness: 55, damping: 18 }}
        >
          {/* Degree Marks */}
          {[...Array(72)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-1/2 left-1/2 w-[1.5px] origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${i * 5}deg)` }}
            >
              <div className={`w-full rounded-full ${i % 18 === 0 ? 'h-3 bg-amber-500' : i % 6 === 0 ? 'h-2 bg-white/40' : 'h-1 bg-white/10'}`} />
            </div>
          ))}

          {/* Cardinals in Arabic (ش = شمال, ق = شرق, ج = جنوب, غ = غرب) */}
          {['ش', 'ق', 'ج', 'غ'].map((d, i) => (
            <div
              key={d}
              className="absolute inset-0 flex items-start justify-center text-xs font-black text-white/30 pt-4"
              style={{ transform: `rotate(${i * 90}deg)` }}
            >
              <span style={{ transform: `rotate(${-i * 90}deg)` }}>{d}</span>
            </div>
          ))}
        </motion.div>

        {/* Qibla Indicator (Kaaba and Target Indicator) */}
        <motion.div
          className="absolute inset-0 z-30"
          animate={{ rotate: relativeQiblaAngle }}
          transition={{ type: "spring", stiffness: 45, damping: 15 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 flex flex-col items-center group">
            {/* 3D Kaaba Icon with dynamic alignment states */}
            <div className={`p-3 rounded-full transition-all duration-500 shadow-2xl relative ${isAligned ? 'bg-[#d4af37] text-black scale-110 shadow-[#d4af37]/30' : 'bg-[#0f121e] border border-amber-500/20 text-[#d4af37]'}`}>
              <KaabaIcon className="w-10 h-10" />
              {isAligned && (
                <span className="absolute -inset-1 rounded-full border border-amber-500 animate-ping opacity-70" />
              )}
            </div>

            {/* Direction Pointer arrow */}
            <div className={`mt-2 flex flex-col items-center transition-all ${isAligned ? 'scale-110' : 'opacity-70'}`}>
              <ArrowUp className={`w-5 h-5 ${isAligned ? 'text-[#d4af37] animate-bounce' : 'text-white/40'}`} />
              <div className={`mt-1 px-3 py-1 rounded-full text-[9px] font-black tracking-widest transition-all ${isAligned ? 'bg-amber-500 text-black font-black' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                {isAligned ? 'القبلة هنا' : 'اتجاه القبلة'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Point */}
        <div className="relative w-12 h-12 rounded-full bg-[#0c0f19] border border-white/10 shadow-xl flex items-center justify-center z-40">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isAligned ? 'bg-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.8)] scale-110' : 'bg-white/20'}`} />
        </div>
      </div>

      {/* Angle counter and iOS permission button */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black text-white tracking-tighter" style={{ direction: 'ltr' }}>
            {qiblaAngle ? Math.round(relativeQiblaAngle) : "--"}°
          </span>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">زاوية الانحراف</span>
        </div>

        {requiresPermission && qiblaAngle && (
          <button
            onClick={requestSensorPermission}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 rounded-2xl text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all shadow-lg shadow-amber-500/5"
          >
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>تفعيل مستشعر البوصلة (iOS)</span>
          </button>
        )}

        {!qiblaAngle && (
          <button
            onClick={handleActivate}
            disabled={isLoading}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-2xl font-black text-sm overflow-hidden shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
              <span>تحديد الاتجاه والموقع</span>
            </div>
          </button>
        )}
      </div>

      {/* Required verification message from responsible source */}
      <div className={`w-full max-w-sm p-4 text-right flex items-start gap-3 ${CARD_BG} border-amber-500/20 bg-amber-500/[0.02]`}>
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-400">تنبيه هام للتحقق من الاتجاه:</p>
          <p className="text-[10.5px] text-white/50 leading-relaxed font-semibold">
            البوصلة الإلكترونية للهواتف قد تتأثر بالمجالات المغناطيسية أو المعادن المحيطة. للحصول على أقصى دقة، يُرجى دائماً التحقق من اتجاه القبلة من مصدر موثوق ومسؤول (أقرب مسجد لديك).
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-2xl text-xs font-bold animate-shake">
          {error}
        </div>
      )}
    </div>
  );
}
