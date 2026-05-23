"use client";

import React, { useState, useEffect } from "react";
import {
  X, Settings, Bell, BellOff, Globe, Clock, ChevronRight,
  Moon, BookOpen, Calendar, Info, Smartphone, Volume2, VolumeX,
  Heart, RefreshCw
} from "lucide-react";
import {
  getNotifSettings,
  saveNotifSettings,
  requestBrowserNotificationPermission,
  restartSmartNotifications,
  NotifSettings,
} from "@/lib/smartNotifications";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "notifications" | "salawat" | "site";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [settings, setSettings] = useState<NotifSettings>(getNotifSettings());
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [saved, setSaved] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingSalawat, setTestingSalawat] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSettings(getNotifSettings());
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    saveNotifSettings(settings);
    setSaved(true);
    // Restart notifications with new settings
    await restartSmartNotifications();
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      setSettings((s) => ({ ...s, allowNotifications: true }));
    }
  };

  const testNotificationSound = () => {
    setTestingSound(true);
    const audio = new Audio("/audio/notification.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {});
    setTimeout(() => setTestingSound(false), 2000);
  };

  const testSalawatSound = () => {
    setTestingSalawat(true);
    const audio = new Audio("/audio/salawat.mp3");
    audio.volume = 0.8;
    audio.play().catch(() => {});
    setTimeout(() => setTestingSalawat(false), 4000);
  };

  const Toggle = ({
    enabled,
    onToggle,
    disabled = false,
  }: {
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "bg-foreground/10"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
          enabled ? "left-7" : "left-1"
        }`}
      />
    </button>
  );

  const SALAWAT_INTERVALS = [
    { label: "كل ١٥ دقيقة", value: 15 },
    { label: "كل ٣٠ دقيقة", value: 30 },
    { label: "كل ساعة", value: 60 },
    { label: "كل ساعتين", value: 120 },
    { label: "كل ٣ ساعات", value: 180 },
    { label: "كل ٦ ساعات", value: 360 },
  ];

  return (
    <div className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center font-arabic">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-foreground/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 max-h-[90vh] flex flex-col">

        {/* Decorative BG */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 blur-[80px] rounded-full translate-y-1/2" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 pb-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-foreground text-right">الإعدادات</h2>
              <p className="text-[10px] text-foreground/30 uppercase tracking-widest text-right">Settings</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative z-10 px-6 pt-5 pb-0">
          <div className="flex gap-1.5 p-1.5 bg-foreground/5 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: "notifications" as SettingsTab, label: "الإشعارات", icon: Bell },
              { id: "salawat" as SettingsTab, label: "صلِّ على النبي", icon: Heart },
              { id: "site" as SettingsTab, label: "الموقع", icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-background text-primary shadow-md"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <>
              {/* Permission Banner */}
              {notifPermission !== "granted" && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-right">
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-400">الإشعارات غير مفعّلة</p>
                    <p className="text-[11px] text-amber-400/60 mt-1">
                      {notifPermission === "denied"
                        ? "تم رفض الإشعارات. يرجى السماح من إعدادات المتصفح."
                        : "اضغط للسماح بالإشعارات من المتصفح."}
                    </p>
                  </div>
                  {notifPermission !== "denied" && (
                    <button
                      onClick={handleRequestPermission}
                      className="shrink-0 px-3 py-1.5 bg-amber-500 text-black rounded-xl text-[11px] font-black"
                    >
                      سماح
                    </button>
                  )}
                </div>
              )}

              {/* Intelligence info */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3 text-right">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  نظام الإشعارات <strong className="text-primary">ذكي ومخصص لك</strong> — يتتبع نقاطك اليومية ويرسل رسائل تشجيعية مبنية على أدائك الفعلي بالأمس!
                </p>
              </div>

              {/* Main toggle */}
              <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <Toggle
                    enabled={settings.allowNotifications}
                    onToggle={() =>
                      setSettings((s) => ({ ...s, allowNotifications: !s.allowNotifications }))
                    }
                    disabled={notifPermission === "denied"}
                  />
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-black text-foreground">السماح بالإشعارات</p>
                      <p className="text-xs text-foreground/40 mt-0.5">تفعيل/إيقاف جميع التنبيهات</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.allowNotifications ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/30"}`}>
                      {settings.allowNotifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-settings */}
              <div className={`space-y-3 transition-opacity duration-300 ${settings.allowNotifications ? "opacity-100" : "opacity-30 pointer-events-none"}`}>

                {/* Daily Quran */}
                <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <Toggle
                      enabled={settings.dailyReminder}
                      onToggle={() =>
                        setSettings((s) => ({ ...s, dailyReminder: !s.dailyReminder }))
                      }
                    />
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">تذكير القرآن الذكي</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">مخصص لنقاطك الفعلية · ذكي جداً 🧠</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friday Kahf */}
                <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <Toggle
                      enabled={settings.fridayKahf}
                      onToggle={() =>
                        setSettings((s) => ({ ...s, fridayKahf: !s.fridayKahf }))
                      }
                    />
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">تذكير سورة الكهف</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">كل يوم جمعة · إشعار خاص 🌿</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reminder Hour */}
                <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            reminderHour: Math.min(23, s.reminderHour + 1),
                          }))
                        }
                        className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground/60 hover:bg-primary/20 hover:text-primary transition-all font-black"
                      >+</button>
                      <div className="w-16 text-center">
                        <p className="text-xl font-black text-primary">
                          {String(settings.reminderHour).padStart(2, "0")}:00
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            reminderHour: Math.max(0, s.reminderHour - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground/60 hover:bg-primary/20 hover:text-primary transition-all font-black"
                      >-</button>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">وقت التذكير اليومي</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">الساعة التي يظهر فيها التنبيه</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Sound Test */}
                <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={testNotificationSound}
                      disabled={testingSound}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        testingSound
                          ? "bg-primary/20 text-primary"
                          : "bg-foreground/10 text-foreground/60 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {testingSound ? "🔊 يُشغَّل..." : "اختبار الصوت"}
                    </button>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">صوت الإشعار</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          ضع الملف في: <code className="text-primary">public/audio/notification.mp3</code>
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Volume2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SALAWAT TAB ── */}
          {activeTab === "salawat" && (
            <>
              {/* Info */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl text-right">
                <div className="flex items-center justify-end gap-3 mb-3">
                  <p className="font-black text-emerald-400">اللهم صلِّ على محمد ﷺ</p>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/30" />
                  </div>
                </div>
                <p className="text-[11px] text-foreground/50 leading-relaxed">
                  يُذكّرك التطبيق بالصلاة على النبي ﷺ بصوت مميز على فترات منتظمة تختارها أنت.
                  يُشغَّل صوت من الملف: <code className="text-emerald-400">public/audio/salawat.mp3</code>
                </p>
              </div>

              {/* Main toggle */}
              <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <Toggle
                    enabled={settings.salawatEnabled}
                    onToggle={() =>
                      setSettings((s) => ({ ...s, salawatEnabled: !s.salawatEnabled }))
                    }
                  />
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-black text-foreground">تفعيل تذكير الصلاة على النبي</p>
                      <p className="text-xs text-foreground/40 mt-0.5">صوت + إشعار تلقائي</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.salawatEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-foreground/5 text-foreground/30"}`}>
                      <Heart className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interval Selection */}
              <div className={`space-y-3 transition-opacity duration-300 ${settings.salawatEnabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <p className="text-xs font-black text-foreground/30 uppercase tracking-widest text-right">
                  تكرار الصوت
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "كل ١٥ دقيقة", value: 15 },
                    { label: "كل ٣٠ دقيقة", value: 30 },
                    { label: "كل ساعة", value: 60 },
                    { label: "كل ساعتين", value: 120 },
                    { label: "كل ٣ ساعات", value: 180 },
                    { label: "كل ٦ ساعات", value: 360 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          salawatIntervalMinutes: opt.value,
                        }))
                      }
                      className={`p-4 rounded-2xl text-sm font-black transition-all border text-right ${
                        settings.salawatIntervalMinutes === opt.value
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-foreground/[0.02] border-foreground/5 text-foreground/50 hover:border-foreground/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Test Salawat Sound */}
                <div className="p-4 bg-foreground/[0.02] border border-foreground/5 rounded-2xl flex items-center justify-between gap-4">
                  <button
                    onClick={testSalawatSound}
                    disabled={testingSalawat}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      testingSalawat
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-foreground/10 text-foreground/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                    }`}
                  >
                    {testingSalawat ? "🔊 يُشغَّل..." : "تجربة الصوت"}
                  </button>
                  <p className="text-[11px] text-foreground/40 text-right">
                    تجربة صوت السلوات الآن
                  </p>
                </div>

                {/* File path instruction */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-right">
                  <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest mb-2">
                    📂 مكان ملف الصوت
                  </p>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    ضع ملف الصوت في:
                    <br />
                    <code className="text-amber-400 font-mono">public/audio/salawat.mp3</code>
                    <br />
                    يمكن أن يكون تسجيل صوتي لـ "اللهم صلِّ على محمد" (3-5 ثواني)
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── SITE SETTINGS TAB ── */}
          {activeTab === "site" && (
            <>
              <div className="p-4 bg-foreground/[0.02] border border-foreground/5 rounded-2xl flex items-start gap-3 text-right">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/60 leading-relaxed">
                  إعدادات الموقع تشمل تفضيلاتك الشخصية للعرض والتصفح. المزيد من الخيارات ستُضاف قريباً.
                </p>
              </div>

              <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground/30 uppercase tracking-widest">الإصدار</span>
                  <span className="text-sm font-black text-primary">V 7.0 Universal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground/30 uppercase tracking-widest">المنصة</span>
                  <span className="text-sm font-black text-foreground/60">
                    {typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
                      ? "PWA"
                      : "متصفح"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => window.dispatchEvent(new Event("check-for-updates"))}
                    className="text-xs font-black text-primary/60 hover:text-primary transition-colors"
                  >
                    تحقق الآن ←
                  </button>
                  <span className="text-xs font-black text-foreground/30 uppercase tracking-widest">التحديثات</span>
                </div>
              </div>

              <div className="p-5 bg-foreground/[0.02] border border-foreground/5 rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => window.open("https://quran1-mu.vercel.app/download/", "_blank")}
                    className="px-4 py-2 bg-primary text-black rounded-xl font-black text-xs"
                  >
                    تحميل APK
                  </button>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-black text-foreground text-sm">تثبيت التطبيق</p>
                      <p className="text-[11px] text-foreground/40">تجربة أفضل بدون متصفح</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 p-6 pt-0">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-300 flex items-center justify-center gap-2 ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-primary text-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            }`}
          >
            {saved ? (
              "✓ تم الحفظ وتطبيق الإعدادات"
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                حفظ وتفعيل الإعدادات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
