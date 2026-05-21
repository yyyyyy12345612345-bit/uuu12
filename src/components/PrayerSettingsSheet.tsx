"use client";

import React from "react";
import { X, Bell, BellOff, Volume2, VolumeX, Music, Check, Play } from "lucide-react";
import { PRAYER_NAMES_AR, type PrayerNotifSetting } from "@/lib/prayerNotifications";

const MUEZZINS = [
  { id: "haram", name: "الحرم المكي — الشيخ علي الملا", file: "/adhan/الحرم المكي.mp3" },
  { id: "naqshandi", name: "الشيخ سيد النقشبندي", file: "/adhan/الشيخ سيد النقشبندى.p3.mp3" },
  { id: "rifat", name: "الشيخ محمد رفعت", file: "/adhan/الشيخ محمد رفعت.mp3" },
];

interface Props {
  prayerId: string;
  draft: PrayerNotifSetting;
  onChange: (d: PrayerNotifSetting) => void;
  onClose: () => void;
  onSave: () => void;
  onTestSound: (file: string) => void;
}

export function PrayerSettingsSheet({ prayerId, draft, onChange, onClose, onSave, onTestSound }: Props) {
  const name = PRAYER_NAMES_AR[prayerId] || prayerId;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-24 sm:pb-0"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)" }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        className="relative w-full sm:max-w-md bg-[#0c1210] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[calc(100vh-7rem)] overflow-y-auto animate-in slide-in-from-bottom duration-300"
      >
        <div className="h-1 w-12 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-6 pb-8 border-b border-white/5 bg-gradient-to-l from-primary/15 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] text-right mb-1">إعدادات الصلاة</p>
          <h3 className="text-2xl font-black text-white text-right">صلاة {name}</h3>
          <p className="text-xs text-white/40 font-bold text-right mt-1">أوقات رسمية من التقويم — بدون تأخير يدوي</p>
        </div>

        <div className="p-6 space-y-3">
          <ToggleRow
            icon={draft.enabled ? Bell : BellOff}
            label="تنبيه الموعد"
            desc="إشعار عند دخول وقت الأذان"
            on={draft.enabled}
            onToggle={() => onChange({ ...draft, enabled: !draft.enabled })}
          />
          <ToggleRow
            icon={draft.soundEnabled ? Volume2 : VolumeX}
            label="صوت الأذان"
            desc="تشغيل المؤذن مع الإشعار"
            on={draft.soundEnabled}
            onToggle={() => onChange({ ...draft, soundEnabled: !draft.soundEnabled })}
          />

          <div className="pt-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-right mb-3 mr-1">المؤذن</p>
            <div className="space-y-2">
              {MUEZZINS.map((m) => {
                const selected = (draft.muezzinId || "haram") === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => onChange({ ...draft, muezzinId: m.id })}
                    className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      selected
                        ? "bg-primary/90 border-primary text-black"
                        : "bg-white/[0.04] border-white/5 text-white hover:border-primary/30"
                    }`}
                  >
                    <span className="font-bold text-sm text-right flex-1">{m.name}</span>
                    {selected ? (
                      <Check className="w-5 h-5 shrink-0" strokeWidth={3} />
                    ) : (
                      <Music className="w-4 h-4 text-primary/60 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={() => {
              const m = MUEZZINS.find((x) => x.id === (draft.muezzinId || "haram")) || MUEZZINS[0];
              onTestSound(m.file);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10"
          >
            <Play className="w-4 h-4" />
            تجربة
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-[1.4] py-4 rounded-2xl bg-primary text-black font-black text-sm shadow-lg shadow-primary/20"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  desc,
  on,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-primary/20 transition-colors text-right"
    >
      <div
        className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${on ? "bg-primary" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-[#0c1210] shadow transition-all ${on ? "left-1" : "right-1"}`}
        />
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div>
          <p className="font-black text-white text-sm">{label}</p>
          <p className="text-[11px] text-white/40 font-bold">{desc}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? "bg-primary/20 text-primary" : "bg-white/5 text-white/30"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

export { MUEZZINS };
