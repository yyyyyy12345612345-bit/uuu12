import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { useSocialAdmin } from "./useSocialAdmin";
import { TikTokAccountList } from "./TikTokAccountList";
import { ScheduledJobsList } from "./ScheduledJobsList";

export const SocialManagerPanel: React.FC = () => {
  const {
    tiktokAccounts,
    tiktokLogs,
    isTiktokLoading,
    isRetryingTiktok,
    fetchTikTokData,
    handleLinkTikTok,
    handleUnlinkTikTok,
    handleRetryTiktokPublish,
  } = useSocialAdmin();

  useEffect(() => {
    fetchTikTokData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl">
        <div className="text-right flex-1">
          <h2 className="text-2xl font-black text-white">إدارة حسابات تيك توك 📱</h2>
          <p className="text-xs text-white/40 mt-1">
            ربط حسابات TikTok ونشر الفيديوهات الملتئمة تلقائياً أو جدولتها ومراقبة السجلات
          </p>
        </div>
        <button
          onClick={handleLinkTikTok}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#fbbf24] text-black font-black rounded-xl hover:brightness-110 active:scale-95 transition text-xs shadow-lg shadow-[#fbbf24]/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          ربط حساب TikTok جديد
        </button>
      </div>

      {/* Accounts List */}
      <TikTokAccountList accounts={tiktokAccounts} onUnlink={handleUnlinkTikTok} />

      {/* Analytics Summary */}
      {tiktokLogs.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 bg-white/[0.02] border border-white/[0.06] p-5 rounded-3xl animate-in fade-in duration-300">
          <div className="text-center p-3">
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي المشاهدات 👀</span>
            <span className="text-lg font-black text-white">
              {tiktokLogs.reduce((acc, log) => acc + (log.views || 0), 0).toLocaleString("ar-EG")}
            </span>
          </div>
          <div className="text-center p-3 border-r border-white/5">
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي الإعجابات ❤️</span>
            <span className="text-lg font-black text-[#fbbf24]">
              {tiktokLogs.reduce((acc, log) => acc + (log.likes || 0), 0).toLocaleString("ar-EG")}
            </span>
          </div>
          <div className="text-center p-3 border-r border-white/5">
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي التعليقات 💬</span>
            <span className="text-lg font-black text-white">
              {tiktokLogs.reduce((acc, log) => acc + (log.comments || 0), 0).toLocaleString("ar-EG")}
            </span>
          </div>
          <div className="text-center p-3 border-r border-white/5">
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي المشاركات 🔗</span>
            <span className="text-lg font-black text-white">
              {tiktokLogs.reduce((acc, log) => acc + (log.shares || 0), 0).toLocaleString("ar-EG")}
            </span>
          </div>
          <div className="text-center p-3 border-r border-white/5">
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي التفضيلات ⭐</span>
            <span className="text-lg font-black text-white">
              {tiktokLogs.reduce((acc, log) => acc + (log.favorites || 0), 0).toLocaleString("ar-EG")}
            </span>
          </div>
        </div>
      )}

      {/* Logs / Publication History */}
      <ScheduledJobsList
        tiktokLogs={tiktokLogs}
        tiktokAccounts={tiktokAccounts}
        isTiktokLoading={isTiktokLoading}
        isRetryingTiktok={isRetryingTiktok}
        onRetryPublish={handleRetryTiktokPublish}
      />
    </div>
  );
};
export default SocialManagerPanel;
