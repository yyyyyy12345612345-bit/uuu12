import React, { useEffect } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { useSocialAdmin } from "./useSocialAdmin";
import { TikTokAccountList } from "./TikTokAccountList";
import { ScheduledJobsList } from "./ScheduledJobsList";
import { auth } from "../../../lib/firebase";

// Custom YouTube SVG icon
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

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

  const handleLinkYouTube = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { alert("فشل التحقق من الجلسة. يرجى تسجيل الدخول مجدداً."); return; }
      const width = 600, height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        `/api/auth/youtube?token=${encodeURIComponent(token)}`,
        "YouTubeAuth",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );
      const handleMsg = (event: MessageEvent) => {
        if (event.data?.type === "YOUTUBE_LINKED" && event.data?.success) {
          alert("تم ربط قناة يوتيوب بنجاح! ✅");
          window.removeEventListener("message", handleMsg);
        }
      };
      window.addEventListener("message", handleMsg);
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* ── TikTok Section ── */}
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

      {/* ── YouTube Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-950/20 border border-red-900/30 p-6 rounded-3xl">
        <div className="text-right flex-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2 justify-end">
            <YouTubeIcon className="w-5 h-5 text-red-500" />
            قنوات يوتيوب (فيديو عريض 1920×1080) 🎬
          </h2>
          <p className="text-xs text-white/40 mt-1">
            ربط قنوات يوتيوب ونشر الفيديوهات العريضة — الصفحة السرية للاستوديو العريض
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLinkYouTube}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white font-black rounded-xl hover:brightness-110 active:scale-95 transition text-xs shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ربط قناة YouTube
          </button>
          <a
            href="/qvz7mxk9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-white/[0.05] border border-white/[0.08] text-white/70 font-black rounded-xl hover:bg-white/[0.1] active:scale-95 transition text-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            الاستوديو السري
          </a>
        </div>
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
            <span className="text-[10px] text-white/40 block font-black mb-1">إجمالي التفضيلات ❤️</span>
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
