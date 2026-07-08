import React from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface TikTokLog {
  id: string;
  accountId: string;
  caption: string;
  videoUrl?: string;
  shareUrl?: string;
  status: "uploading" | "completed" | "pending" | "failed";
  progress?: number;
  uploadSpeed?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  favorites?: number;
  publishedAt?: any;
  createdAt?: any;
  error?: string;
}

interface TikTokAccount {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface ScheduledJobsListProps {
  tiktokLogs: TikTokLog[];
  tiktokAccounts: TikTokAccount[];
  isTiktokLoading: boolean;
  isRetryingTiktok: Record<string, boolean>;
  onRetryPublish: (log: TikTokLog) => void;
}

export const ScheduledJobsList: React.FC<ScheduledJobsListProps> = ({
  tiktokLogs,
  tiktokAccounts,
  isTiktokLoading,
  isRetryingTiktok,
  onRetryPublish,
}) => {
  const getProgressBar = (pct: number) => {
    const barLen = 10;
    const filled = Math.round((pct / 100) * barLen);
    const empty = barLen - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h3 className="text-lg font-black text-white mb-6">سجل وجدولة منشورات تيك توك 📋</h3>

      {isTiktokLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24] mx-auto" />
          <p className="text-xs text-white/40 mt-3 font-bold">جاري تحميل سجل المنشورات...</p>
        </div>
      ) : tiktokLogs.length === 0 ? (
        <div className="p-12 text-center text-white/30 text-sm font-bold">
          لا يوجد منشورات أو مجدولات مسجلة بعد.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/5 pb-3 text-white/40 font-black">
                <th className="pb-3 text-right">الفيديو والوصف</th>
                <th className="pb-3 text-right">الحساب المستهدف</th>
                <th className="pb-3 text-right">الحالة والتقدم</th>
                <th className="pb-3 text-right">المشاهدات والنشاط</th>
                <th className="pb-3 text-right">تاريخ الجدولة / النشر</th>
                <th className="pb-3 text-left">رابط المشاهدة</th>
              </tr>
            </thead>
            <tbody>
              {tiktokLogs.map((log) => {
                const targetAcc = tiktokAccounts.find((a) => a.id === log.accountId);

                return (
                  <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="py-4">
                      <div className="space-y-1 max-w-xs text-right">
                        <p className="font-bold text-white truncate" title={log.caption}>
                          {log.caption}
                        </p>
                        {log.videoUrl && (
                          <a
                            href={log.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sky-400 hover:underline truncate block"
                          >
                            معاينة المونتاج الأصلي 🔗
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-bold text-white/80 text-right">
                      {targetAcc ? `@${targetAcc.username}` : log.accountId}
                    </td>
                    <td className="py-4 text-right">
                      {log.status === "uploading" ? (
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 animate-pulse">
                            جاري الرفع...
                          </span>
                          <div className="text-[9px] font-mono text-white/60">
                            {getProgressBar(log.progress || 0)} {log.progress || 0}%
                          </div>
                          <div className="text-[8px] text-white/30">{log.uploadSpeed || "0 MB/s"}</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                              log.status === "completed"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : log.status === "pending"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            {log.status === "completed" && "تم النشر"}
                            {log.status === "pending" && "مجدول"}
                            {log.status === "failed" && "فشل النشر"}
                          </span>
                          {log.error && (
                            <p className="text-[9px] text-red-400/80 mt-1 max-w-[200px] whitespace-normal">
                              {log.error}
                            </p>
                          )}
                          {log.status === "failed" && (
                            <button
                              onClick={() => onRetryPublish(log)}
                              disabled={isRetryingTiktok[log.id]}
                              className="mt-2 flex items-center justify-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[9px] font-black transition cursor-pointer"
                            >
                              {isRetryingTiktok[log.id] ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  جاري المحاولة...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  إعادة المحاولة
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-white/60 text-right">
                      👀 {log.views?.toLocaleString("ar-EG") || 0} | ❤️ {log.likes?.toLocaleString("ar-EG") || 0}
                    </td>
                    <td className="py-4 text-white/60 text-right">
                      {log.publishedAt
                        ? new Date(log.publishedAt.seconds * 1000).toLocaleString("ar-EG")
                        : log.createdAt
                        ? new Date(log.createdAt.seconds * 1000).toLocaleString("ar-EG")
                        : "فوري"}
                    </td>
                    <td className="py-4 text-left">
                      {log.shareUrl ? (
                        <a
                          href={log.shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#fbbf24] hover:underline font-bold"
                        >
                          رابط تيك توك 🔗
                        </a>
                      ) : (
                        <span className="text-white/20">قيد الرفع أو الجدولة</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
