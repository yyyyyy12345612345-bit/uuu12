import { useState } from "react";
import { db, auth } from "../../../lib/firebase";
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

export const useSocialAdmin = () => {
  const [tiktokAccounts, setTiktokAccounts] = useState<any[]>([]);
  const [tiktokLogs, setTiktokLogs] = useState<any[]>([]);
  const [isTiktokLoading, setIsTiktokLoading] = useState(false);
  const [isRetryingTiktok, setIsRetryingTiktok] = useState<Record<string, boolean>>({});

  const fetchTikTokData = async () => {
    if (!db) return;
    setIsTiktokLoading(true);
    try {
      const accountsSnap = await getDocs(collection(db, "tiktok_accounts"));
      const accList: any[] = [];
      accountsSnap.forEach(d => accList.push(d.data()));
      setTiktokAccounts(accList);

      const logsSnap = await getDocs(
        query(collection(db, "tiktok_logs"), orderBy("createdAt", "desc"), limit(50))
      );
      const logList: any[] = [];
      logsSnap.forEach(d => logList.push({ id: d.id, ...d.data() }));
      setTiktokLogs(logList);
    } catch (e) {
      console.error("Failed to fetch TikTok data:", e);
    } finally {
      setIsTiktokLoading(false);
    }
  };

  const handleLinkTikTok = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert("فشل التحقق من الجلسة. يرجى تسجيل الدخول مجدداً.");
        return;
      }
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `/api/auth/tiktok?token=${encodeURIComponent(token)}`,
        "TikTokAuth",
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "TIKTOK_LINKED" && event.data?.success) {
          fetchTikTokData();
          window.removeEventListener("message", handleMessage);
        }
      };
      window.addEventListener("message", handleMessage);
    } catch (e: any) {
      alert(`خطأ: ${e.message}`);
    }
  };

  const handleUnlinkTikTok = async (accountId: string) => {
    if (!db || !window.confirm("قطع ربط هذا الحساب؟")) return;
    try {
      await deleteDoc(doc(db, "tiktok_accounts", accountId));
      await fetchTikTokData();
    } catch (e: any) {
      alert(`فشل إلغاء الربط: ${e.message}`);
    }
  };

  const handleRetryTiktokPublish = async (log: any) => {
    setIsRetryingTiktok(prev => ({ ...prev, [log.id]: true }));
    try {
      const adminToken = await auth.currentUser?.getIdToken();
      if (!adminToken) {
        alert("فشل التحقق من الجلسة. يرجى تسجيل الدخول مجدداً.");
        return;
      }

      const res = await fetch("/api/tiktok/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: log.accountId,
          videoUrl: log.videoUrl,
          caption: log.caption,
          adminToken,
          retryLogId: log.id,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "فشل إعادة محاولة النشر على تيك توك");
      }

      await fetchTikTokData();
    } catch (e: any) {
      alert(`خطأ أثناء إعادة المحاولة: ${e.message}`);
    } finally {
      setIsRetryingTiktok(prev => ({ ...prev, [log.id]: false }));
    }
  };

  return {
    tiktokAccounts,
    tiktokLogs,
    isTiktokLoading,
    isRetryingTiktok,
    fetchTikTokData,
    handleLinkTikTok,
    handleUnlinkTikTok,
    handleRetryTiktokPublish,
  };
};
export type UseSocialAdminType = ReturnType<typeof useSocialAdmin>;
