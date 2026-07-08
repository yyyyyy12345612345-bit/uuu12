import React from "react";
import { Loader2 } from "lucide-react";
import surahsData from "@/data/surahs.json";

const INPUT_CLASS = "w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-sm text-white outline-none resize-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition";
const LABEL = "text-xs font-black uppercase tracking-[0.18em] text-white/30";
const BTN_GRADIENT = "rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-3.5 text-black font-black transition hover:shadow-xl hover:shadow-sky-500/20 text-sm";

interface DailyChallengeFormProps {
  questTitle: string;
  setQuestTitle: (v: string) => void;
  questPoints: number;
  setQuestPoints: (v: number) => void;
  questTarget: string;
  setQuestTarget: (v: string) => void;
  questSurahId: string;
  setQuestSurahId: (v: string) => void;
  isAddingQuest: boolean;
  handleAddQuest: (e: React.FormEvent) => void;
}

export function DailyChallengeForm({
  questTitle,
  setQuestTitle,
  questPoints,
  setQuestPoints,
  questTarget,
  setQuestTarget,
  questSurahId,
  setQuestSurahId,
  isAddingQuest,
  handleAddQuest
}: DailyChallengeFormProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
      <h2 className="text-xl font-black mb-6">إنشاء مهمة جديدة</h2>
      <form onSubmit={handleAddQuest} className="space-y-5">
        <input
          value={questTitle}
          onChange={e => setQuestTitle(e.target.value)}
          className={INPUT_CLASS}
          placeholder="عنوان المهمة"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={LABEL}>نوع المهمة</label>
            <select
              value={questTarget}
              onChange={e => setQuestTarget(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="mushaf">📖 قراءة (الآية اليومية)</option>
              <option value="mushaf-full">📱 المصحف الرقمي الكامل</option>
              <option value="daily">📿 الأذكار والورد اليومي</option>
              <option value="video">🎬 استوديو تصميم الفيديو</option>
              <option value="surah">🎧 استماع لسورة معينة</option>
              <option value="rank">🏆 لوحة المتصدرين</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={LABEL}>النقاط</label>
            <input
              type="number"
              value={questPoints}
              onChange={e => setQuestPoints(parseInt(e.target.value) || 0)}
              className={INPUT_CLASS + " text-center"}
            />
          </div>
        </div>

        {questTarget === 'surah' && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <label className={LABEL}>رقم السورة</label>
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                max="114"
                value={questSurahId}
                onChange={e => setQuestSurahId(e.target.value)}
                className="w-28 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center outline-none text-sm text-white"
              />
              <div className="flex-1 rounded-xl bg-white/[0.02] p-4">
                <span className="text-sm text-white/40">
                  {surahsData.find(s => s.id === parseInt(questSurahId))?.name
                    ? `سورة ${surahsData.find(s => s.id === parseInt(questSurahId))?.name}`
                    : 'رقم غير صحيح'}
                </span>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={isAddingQuest} className={BTN_GRADIENT}>
          {isAddingQuest ? (
            <Loader2 className="inline-block h-5 w-5 animate-spin" />
          ) : (
            'نشر المهمة'
          )}
        </button>
      </form>
    </div>
  );
}
