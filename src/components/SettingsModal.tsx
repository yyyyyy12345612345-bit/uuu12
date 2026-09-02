"use client";

import React, { useState, useEffect } from "react";
import {
  X, Settings, Bell, BellOff, Heart, Moon, Sun, User,
  Smartphone, Volume2, Info, LogOut, CheckCircle, RefreshCw,
  ChevronLeft, ShieldCheck, BookOpen, MessageCircle, MapPin,
  Phone, Camera, Save, Loader2, Globe, Clock
} from "lucide-react";
import {
  getNotifSettings,
  saveNotifSettings,
  requestBrowserNotificationPermission,
  restartSmartNotifications,
  NotifSettings,
} from "@/lib/smartNotifications";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { useTheme } from "@/components/ThemeProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenFeedback?: () => void;
  initialTab?: "profile" | "notifications" | "salawat" | "appearance";
}

type SettingsTab = "profile" | "notifications" | "salawat" | "appearance";

export function SettingsModal({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenFeedback,
  initialTab = "profile",
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { theme, toggleTheme } = useTheme();

  // Notifications state
  const [settings, setSettings] = useState<NotifSettings>(getNotifSettings());
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [savedNotifs, setSavedNotifs] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingSalawat, setTestingSalawat] = useState(false);

  // Profile edit state
  const [profileData, setProfileData] = useState({
    displayName: "",
    username: "",
    phoneNumber: "",
    country: "مصر",
    gender: "male",
    photoURL: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTab) setActiveTab(initialTab);
    setSettings(getNotifSettings());
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }

    // Load current user data for profile edit
    if (auth?.currentUser && db) {
      setLoadingProfile(true);
      const user = auth.currentUser;
      setProfileData((prev) => ({
        ...prev,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      }));

      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfileData({
              displayName: data.displayName || data.name || user.displayName || "",
              username: data.username || "",
              phoneNumber: data.phoneNumber || data.phone || "",
              country: data.country || "مصر",
              gender: data.gender || "male",
              photoURL: data.photoURL || user.photoURL || "",
            });
          }
        })
        .catch((err) => console.error("Error loading profile for settings:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Save Notifications
  const handleSaveNotifs = async () => {
    saveNotifSettings(settings);
    setSavedNotifs(true);
    await restartSmartNotifications();
    setTimeout(() => setSavedNotifs(false), 2500);
  };

  // Request Notification Permission
  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      setSettings((s) => ({ ...s, allowNotifications: true }));
    }
  };

  // Sound Tests
  const testNotificationSound = () => {
    setTestingSound(true);
    const audio = new Audio("/audio/notification.mp3.mp3");
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

  // Save Profile Edit
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth?.currentUser || !db) return;

    try {
      setSavingProfile(true);
      const user = auth.currentUser;

      // Update auth profile
      if (profileData.displayName.trim() && profileData.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: profileData.displayName.trim(),
        });
      }

      // Update Firestore document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName.trim(),
        name: profileData.displayName.trim(),
        username: profileData.username.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
        country: profileData.country,
        gender: profileData.gender,
        updatedAt: new Date().toISOString(),
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile in settings:", err);
      alert("حدث خطأ أثناء حفظ التعديلات: " + (err.message || ""));
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle Component
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
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-foreground shadow-sm" : "bg-foreground/15"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-background shadow-md transition-all duration-300 ${
          enabled ? "left-7" : "left-1"
        }`}
      />
    </button>
  );

  const tabsConfig = [
    { id: "profile" as SettingsTab, label: "الملف الشخصي", icon: User },
    { id: "notifications" as SettingsTab, label: "الإشعارات", icon: Bell },
    { id: "salawat" as SettingsTab, label: "صلِّ على النبي", icon: Heart },
    { id: "appearance" as SettingsTab, label: "المظهر والتطبيق", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center font-arabic">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-background border border-foreground/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 max-h-[92vh] flex flex-col">
        {/* Decorative Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 blur-[100px] rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/5 blur-[80px] rounded-full translate-y-1/2" />
        </div>

        {/* Modal Header */}
        <div className="relative z-10 p-6 pb-2 flex items-center justify-between border-b border-border/50">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="text-xl font-black text-foreground">الإعدادات</h2>
              <p className="text-[10px] text-foreground/30 uppercase tracking-widest">Settings & Profile</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-foreground/10 flex items-center justify-center text-foreground">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="relative z-10 px-6 pt-4 pb-2">
          <div className="flex gap-1.5 p-1.5 bg-foreground/5 rounded-2xl overflow-x-auto no-scrollbar">
            {tabsConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-md"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
          {/* ══════════════════════════════════════════════════════════════════
              👤 TAB 1: EDIT PROFILE & ACCOUNT
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Profile Header Card */}
              <div className="p-4 bg-foreground/[0.03] border border-border/60 rounded-2xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile?.();
                  }}
                  className="px-3 py-1.5 bg-foreground/10 hover:bg-foreground/20 text-foreground border border-foreground/15 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                >
                  <span>عرض الملف الكامل والأوسمة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <h3 className="font-black text-foreground text-sm">
                      {profileData.displayName || "مستخدم يقين"}
                    </h3>
                    <p className="text-[11px] text-foreground/40">تعديل بيانات حسابك</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center overflow-hidden border border-foreground/20">
                    {profileData.photoURL ? (
                      <img
                        src={profileData.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-foreground/70" />
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                {/* Display Name Input */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground/70 flex items-center justify-end gap-1.5">
                    <span>الاسم المعروض</span>
                    <User className="w-3.5 h-3.5 text-foreground/60" />
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, displayName: e.target.value })
                    }
                    placeholder="اكتب اسمك الكامل"
                    className="w-full p-3 bg-foreground/[0.02] border border-border focus:border-foreground/40 rounded-xl text-sm font-bold text-right text-foreground outline-none transition-all"
                    required
                  />
                </div>

                {/* Username Input */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground/70 flex items-center justify-end gap-1.5">
                    <span>اسم المستخدم (المعرف)</span>
                    <span className="text-foreground/60 font-mono text-xs">@</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({ ...profileData, username: e.target.value })
                    }
                    placeholder="username"
                    className="w-full p-3 bg-foreground/[0.02] border border-border focus:border-foreground/40 rounded-xl text-sm font-bold text-right text-foreground outline-none transition-all font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Phone Number Input */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground/70 flex items-center justify-end gap-1.5">
                    <span>رقم الهاتف (اختياري)</span>
                    <Phone className="w-3.5 h-3.5 text-foreground/60" />
                  </label>
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phoneNumber: e.target.value })
                    }
                    placeholder="010XXXXXXXX"
                    className="w-full p-3 bg-foreground/[0.02] border border-border focus:border-foreground/40 rounded-xl text-sm font-bold text-right text-foreground outline-none transition-all"
                    dir="ltr"
                  />
                </div>

                {/* Country & Gender */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Country */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-foreground/70 flex items-center justify-end gap-1.5">
                      <span>الدولة</span>
                      <MapPin className="w-3.5 h-3.5 text-foreground/60" />
                    </label>
                    <select
                      value={profileData.country}
                      onChange={(e) =>
                        setProfileData({ ...profileData, country: e.target.value })
                      }
                      className="w-full p-3 bg-background border border-border focus:border-foreground/40 rounded-xl text-sm font-bold text-right text-foreground outline-none transition-all"
                    >
                      <option value="مصر">مصر 🇪🇬</option>
                      <option value="السعودية">السعودية 🇸🇦</option>
                      <option value="الإمارات">الإمارات 🇦🇪</option>
                      <option value="الكويت">الكويت 🇰🇼</option>
                      <option value="قطر">قطر 🇶🇦</option>
                      <option value="الجزائر">الجزائر 🇩🇿</option>
                      <option value="المغرب">المغرب 🇲🇦</option>
                      <option value="العراق">العراق 🇮🇶</option>
                      <option value="الأردن">الأردن 🇯🇴</option>
                      <option value="فلسطين">فلسطين 🇵🇸</option>
                      <option value="أخرى">أخرى 🌍</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-foreground/70">الجنس</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, gender: "male" })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${
                          profileData.gender === "male"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-foreground/[0.02] border-border text-foreground/50"
                        }`}
                      >
                        ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, gender: "female" })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${
                          profileData.gender === "female"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-foreground/[0.02] border-border text-foreground/50"
                        }`}
                      >
                        أنثى
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Profile Button */}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className={`w-full mt-2 py-3.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
                    profileSuccess
                      ? "bg-foreground text-background"
                      : "bg-foreground text-background hover:opacity-90 active:scale-95"
                  }`}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ حفظ التعديلات...</span>
                    </>
                  ) : profileSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>تم حفظ الملف الشخصي بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ تعديلات الملف الشخصي</span>
                    </>
                  )}
                </button>
              </form>

              {/* Sign Out Action */}
              {auth?.currentUser && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {
                        signOut(auth);
                        onClose();
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-foreground/5 border border-border text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition-all font-black text-xs flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج من الحساب</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              🔔 TAB 2: NOTIFICATIONS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Permission Banner */}
              {notifPermission !== "granted" && (
                <div className="p-4 bg-foreground/5 border border-border rounded-2xl flex items-start gap-3 text-right">
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground">الإشعارات غير مفعّلة</p>
                    <p className="text-[11px] text-foreground/60 mt-1">
                      {notifPermission === "denied"
                        ? "تم رفض الإشعارات. يرجى السماح من إعدادات المتصفح."
                        : "اضغط للسماح بالإشعارات وتلقي رسائل التشجيع اليومية."}
                    </p>
                  </div>
                  {notifPermission !== "denied" && (
                    <button
                      onClick={handleRequestPermission}
                      className="shrink-0 px-3 py-1.5 bg-foreground text-background rounded-xl text-[11px] font-black"
                    >
                      سماح
                    </button>
                  )}
                </div>
              )}

              {/* Intelligence info */}
              <div className="p-4 bg-foreground/[0.03] border border-border rounded-2xl flex items-start gap-3 text-right">
                <Info className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  نظام الإشعارات <strong className="text-foreground font-black">ذكي ومخصص لك</strong> — يتابع وردك ونقاطك اليومية لتشجيعك على الاستمرار في طاعة الله!
                </p>
              </div>

              {/* Main toggle */}
              <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl">
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
                      <p className="font-black text-foreground text-sm">السماح بالإشعارات</p>
                      <p className="text-xs text-foreground/40 mt-0.5">تفعيل/إيقاف جميع التنبيهات</p>
                    </div>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        settings.allowNotifications
                          ? "bg-foreground/10 text-foreground"
                          : "bg-foreground/5 text-foreground/30"
                      }`}
                    >
                      {settings.allowNotifications ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-settings */}
              <div
                className={`space-y-3 transition-opacity duration-300 ${
                  settings.allowNotifications ? "opacity-100" : "opacity-30 pointer-events-none"
                }`}
              >
                {/* Daily Quran */}
                <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <Toggle
                      enabled={settings.dailyReminder}
                      onToggle={() =>
                        setSettings((s) => ({ ...s, dailyReminder: !s.dailyReminder }))
                      }
                    />
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">تذكير الورد القرآني</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          تنبيه ذكي للورد اليومي 📖
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friday Kahf */}
                <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl">
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
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          كل يوم جمعة مع إشعار خاص 🌿
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground">
                        <Heart className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reminder Hour */}
                <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            reminderHour: Math.min(23, s.reminderHour + 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center text-foreground/60 hover:bg-foreground/20 hover:text-foreground transition-all font-black"
                      >
                        +
                      </button>
                      <div className="w-14 text-center">
                        <p className="text-lg font-black text-foreground font-mono">
                          {String(settings.reminderHour).padStart(2, "0")}:00
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            reminderHour: Math.max(0, s.reminderHour - 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center text-foreground/60 hover:bg-foreground/20 hover:text-foreground transition-all font-black"
                      >
                        -
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-foreground text-sm">ساعة التذكير اليومي</p>
                        <p className="text-[11px] text-foreground/40 mt-0.5">
                          الوقت المفضل لإرسال الإشعار
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sound Test */}
                <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={testNotificationSound}
                    disabled={testingSound}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      testingSound
                        ? "bg-foreground/20 text-foreground"
                        : "bg-foreground/10 text-foreground/70 hover:bg-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {testingSound ? "🔊 يُشغَّل..." : "اختبار الصوت"}
                  </button>
                  <p className="text-xs font-bold text-foreground text-right">
                    تجربة صوت إشعار يقين
                  </p>
                </div>
              </div>

              {/* Save Notifications Button */}
              <button
                type="button"
                onClick={handleSaveNotifs}
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  savedNotifs
                    ? "bg-foreground text-background"
                    : "bg-foreground text-background hover:opacity-90 active:scale-95 shadow-md"
                }`}
              >
                {savedNotifs ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تم حفظ وتفعيل إعدادات الإشعارات</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>حفظ وتفعيل إعدادات الإشعارات</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              💖 TAB 3: SALAWAT ON PROPHET
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "salawat" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Banner */}
              <div className="p-4 bg-foreground/[0.03] border border-border rounded-2xl text-right flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">اللهم صلِّ وسلِّم على نبينا محمد ﷺ</p>
                  <p className="text-[11px] text-foreground/50 mt-0.5">تذكير صوتي دوري بالصلاة على الحبيب</p>
                </div>
              </div>

              {/* Main toggle */}
              <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <Toggle
                    enabled={settings.salawatEnabled}
                    onToggle={() =>
                      setSettings((s) => ({ ...s, salawatEnabled: !s.salawatEnabled }))
                    }
                  />
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-black text-foreground text-sm">تفعيل التذكير الصوتي</p>
                      <p className="text-xs text-foreground/40 mt-0.5">صوت عذب يذكرك بالصلاة على النبي</p>
                    </div>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        settings.salawatEnabled
                          ? "bg-foreground/10 text-foreground"
                          : "bg-foreground/5 text-foreground/30"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Intervals */}
              <div
                className={`space-y-3 transition-opacity duration-300 ${
                  settings.salawatEnabled ? "opacity-100" : "opacity-30 pointer-events-none"
                }`}
              >
                <p className="text-xs font-black text-foreground/40 uppercase tracking-wider text-right">
                  تكرار التذكير
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
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          salawatIntervalMinutes: opt.value,
                        }))
                      }
                      className={`p-3 rounded-xl text-xs font-black transition-all border text-right ${
                        settings.salawatIntervalMinutes === opt.value
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "bg-foreground/[0.02] border-border text-foreground/50 hover:border-foreground/20 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Test Salawat */}
                <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={testSalawatSound}
                    disabled={testingSalawat}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      testingSalawat
                        ? "bg-foreground/20 text-foreground"
                        : "bg-foreground/10 text-foreground/70 hover:bg-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {testingSalawat ? "🔊 يُشغَّل..." : "تجربة الصوت"}
                  </button>
                  <p className="text-xs font-bold text-foreground text-right">
                    استمع إلى صوت التذكير الآن
                  </p>
                </div>
              </div>

              {/* Save Salawat Button */}
              <button
                type="button"
                onClick={handleSaveNotifs}
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  savedNotifs
                    ? "bg-foreground text-background"
                    : "bg-foreground text-background hover:opacity-90 active:scale-95 shadow-md"
                }`}
              >
                {savedNotifs ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تم حفظ إعدادات التذكير</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>حفظ وتفعيل التذكير</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              🎨 TAB 4: APPEARANCE & APP SETTINGS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "appearance" && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Theme Toggle Option */}
              <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground border border-foreground/15 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
                </button>
                <div className="text-right">
                  <h4 className="font-black text-foreground text-sm">مظهر التطبيق</h4>
                  <p className="text-[11px] text-foreground/40 mt-0.5">
                    الوضع الحالي: {theme === "dark" ? "الداكن 🌙" : "الفاتح ☀️"}
                  </p>
                </div>
              </div>

              {/* User Onboarding Guide */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent("show_onboarding"));
                }}
                className="w-full p-4 bg-foreground/[0.02] border border-border hover:border-foreground/30 hover:bg-foreground/[0.04] rounded-2xl flex items-center justify-between text-right transition-all group"
              >
                <ChevronLeft className="w-4 h-4 text-foreground/30 group-hover:text-foreground group-hover:-translate-x-1 transition-all" />
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-black text-foreground text-sm group-hover:text-foreground transition-colors">
                      دليل استخدام منصة يقين 📖
                    </h4>
                    <p className="text-[11px] text-foreground/40 mt-0.5">
                      جولة تعريفية بجميع ميزات التطبيق
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Feedback & Complaints */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenFeedback) onOpenFeedback();
                  else window.dispatchEvent(new CustomEvent("open_feedback_modal"));
                }}
                className="w-full p-4 bg-foreground/[0.02] border border-border hover:border-foreground/30 hover:bg-foreground/[0.04] rounded-2xl flex items-center justify-between text-right transition-all group"
              >
                <ChevronLeft className="w-4 h-4 text-foreground/30 group-hover:text-foreground group-hover:-translate-x-1 transition-all" />
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-black text-foreground text-sm group-hover:text-foreground transition-colors">
                      إرسال اقتراح أو ملاحظة 💬
                    </h4>
                    <p className="text-[11px] text-foreground/40 mt-0.5">
                      نرحب بمقترحاتك لتطوير المنصة
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Contact Creator on Instagram */}
              <a
                href="https://www.instagram.com/youssef_osama04"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-foreground/[0.02] border border-border hover:border-foreground/30 rounded-2xl flex items-center justify-between text-right transition-all group block"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                  <span>تواصل معي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-black text-foreground text-sm">مطور المنصة: يوسف أسامة</h4>
                    <p className="text-[11px] text-foreground/50 font-mono mt-0.5">@youssef_osama04</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
              </a>

              {/* App Version Info */}
              <div className="p-4 bg-foreground/[0.02] border border-border rounded-2xl text-center space-y-1">
                <p className="text-xs font-black text-foreground">يقين القرآن الكريم · الإصدار 21.0</p>
                <p className="text-[10px] text-foreground/40">صنع خالصاً لوجه الله تعالى 🤍</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
