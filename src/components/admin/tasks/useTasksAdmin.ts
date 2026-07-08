import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  limit
} from "firebase/firestore";
import { Quest, PushNotification } from "../AdminPanel.types";

export function useTasksAdmin() {
  // Quests State
  const [questTitle, setQuestTitle] = useState("");
  const [questPoints, setQuestPoints] = useState(50);
  const [questTarget, setQuestTarget] = useState("mushaf");
  const [questSurahId, setQuestSurahId] = useState("1");
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);

  // Push Notifications State
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<'all' | 'subscribers' | 'free'>('all');
  const [pushHistory, setPushHistory] = useState<PushNotification[]>([]);
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushHistoryLoading, setPushHistoryLoading] = useState(false);

  // --- Quests Logic ---
  const fetchQuests = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quest)));
    } catch (e) {
      console.error("Failed to fetch quests:", e);
    }
  };

  const handleAddQuest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!db || !questTitle) return;
    setIsAddingQuest(true);
    try {
      await addDoc(collection(db, "global_quests"), {
        title: questTitle,
        points: questPoints,
        target: questTarget,
        surahId: questTarget === 'surah' ? questSurahId : null,
        createdAt: serverTimestamp(),
        active: true
      });
      setQuestTitle("");
      await fetchQuests();
    } catch (e) {
      console.error("Failed to add quest:", e);
    } finally {
      setIsAddingQuest(false);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!db || !window.confirm("حذف المهمة؟")) return;
    try {
      await deleteDoc(doc(db, "global_quests", id));
      await fetchQuests();
    } catch (e) {
      console.error("Failed to delete quest:", e);
    }
  };

  // --- Push Logic ---
  const fetchPushHistory = async () => {
    if (!db) return;
    setPushHistoryLoading(true);
    try {
      const q = query(collection(db, "admin_push_notifications"), orderBy("sentAt", "desc"), limit(50));
      const snap = await getDocs(q);
      setPushHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as PushNotification)));
    } catch (e) {
      console.error("Failed to fetch push history:", e);
    } finally {
      setPushHistoryLoading(false);
    }
  };

  const handleSendPushNotification = async () => {
    if (!db || !pushTitle || !pushBody) {
      alert("يرجى كتابة عنوان ورسالة الإشعار");
      return;
    }
    setIsSendingPush(true);
    try {
      await addDoc(collection(db, 'admin_push_notifications'), {
        title: pushTitle,
        body: pushBody,
        target: pushTarget,
        sentAt: serverTimestamp(),
        sentBy: auth?.currentUser?.email || 'admin',
        status: 'pending'
      });

      await addDoc(collection(db, 'admin_logs'), {
        action: 'send_push',
        details: `إشعار: "${pushTitle}" → ${pushTarget}`,
        createdAt: serverTimestamp()
      });

      alert("✅ تم إرسال الإشعار بنجاح!");
      setPushTitle("");
      setPushBody("");
      await fetchPushHistory();
    } catch (e) {
      console.error("Failed to send push:", e);
      alert("❌ فشل إرسال الإشعار");
    } finally {
      setIsSendingPush(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQuests();
    fetchPushHistory();
  }, []);

  return {
    // Quests state & methods
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
    fetchQuests,

    // Push state & methods
    pushTitle,
    setPushTitle,
    pushBody,
    setPushBody,
    pushTarget,
    setPushTarget,
    pushHistory,
    isSendingPush,
    pushHistoryLoading,
    handleSendPushNotification,
    fetchPushHistory
  };
}
