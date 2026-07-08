import React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useTasksAdmin } from "./useTasksAdmin";
import { DailyChallengeForm } from "./DailyChallengeForm";
import surahsData from "@/data/surahs.json";

const BTN_GHOST = "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition font-bold";

export default function TasksManagerPanel() {
  const {
    questTitle,
    setQuestTitle,
    questPoints,
    setQuestPoints,
    questTarget,
    setQuestTarget,
    questSurahId,
    setQuestSurahId,
    isAddingQuest,
    activeQuests,
    handleAddQuest,
    handleDeleteQuest,
    fetchQuests
  } = useTasksAdmin();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] text-right font-arabic">
      <DailyChallengeForm
        questTitle={questTitle}
        setQuestTitle={setQuestTitle}
        questPoints={questPoints}
        setQuestPoints={setQuestPoints}
        questTarget={questTarget}
        setQuestTarget={setQuestTarget}
        questSurahId={questSurahId}
        setQuestSurahId={setQuestSurahId}
        isAddingQuest={isAddingQuest}
        handleAddQuest={handleAddQuest}
      />

      <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <button onClick={fetchQuests} className={BTN_GHOST}>
            تحديث القائمة
          </button>
          <h2 className="text-xl font-black">المهام الحالية المتاحة</h2>
        </div>

        <div className="space-y-3">
          {activeQuests.map((quest) => {
            let typeLabel = "قراءة عامة";
            if (quest.target === "surah") {
              const s = surahsData.find(x => x.id === (quest.surahId ? Number(quest.surahId) : 0));
              typeLabel = `قراءة سورة ${s?.name || quest.surahId}`;
            } else if (quest.target === "mushaf-full") {
              typeLabel = "المصحف الرقمي الكامل";
            } else if (quest.target === "daily") {
              typeLabel = "الأذكار والورد اليومي";
            } else if (quest.target === "video") {
              typeLabel = "استوديو تصميم الفيديو";
            } else if (quest.target === "rank") {
              typeLabel = "لوحة المتصدرين";
            }

            return (
              <div
                key={quest.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between"
              >
                <button
                  onClick={() => handleDeleteQuest(quest.id)}
                  className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <p className="font-black text-sm text-white">{quest.title}</p>
                  <div className="flex gap-2 justify-end mt-1 text-[10px] text-white/30 font-bold">
                    <span>النوع: {typeLabel}</span>
                    <span>•</span>
                    <span className="text-[#fbbf24]">{quest.points} نقطة</span>
                  </div>
                </div>
              </div>
            );
          })}

          {activeQuests.length === 0 && (
            <p className="text-sm text-white/20 text-center py-12">لا توجد مهام نشطة حالياً</p>
          )}
        </div>
      </div>
    </div>
  );
}
