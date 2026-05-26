"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Send, BotMessageSquare, MessageCircle, User, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";
import { classifyQueryWithML } from "@/lib/ml-model";
import { auth, db, initFirebase } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function ChatBot() {
  const router = useRouter();
  const pathname = useInstantPathname();

  // مسح الرسائل المخزنة مؤقتاً فقط في حالة إعادة تحميل الصفحة الكاملة (Hard Refresh/Restart)
  if (typeof window !== "undefined") {
    if (!(window as any).__quran_chat_initialized) {
      (window as any).__quran_chat_initialized = true;
      sessionStorage.removeItem("quran_chat_messages");
    }
  }

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Draggable button position
  const chatX = useMotionValue(0);
  const chatY = useMotionValue(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot_btn_pos');
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          chatX.set(x);
          chatY.set(y);
        } catch {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // استعادة الرسائل من جلسة العمل الحالية إن وجدت
  const [messages, setMessages] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("quran_chat_messages");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 1, text: "مرحباً بك! أنا مساعدك الذكي 🌟، كيف يمكنني إثراء تجربتك اليوم؟", sender: "bot" }
    ];
  });
  const [dbUser, setDbUser] = useState<any>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ questionId: number; correctOption: string; explanation: string } | null>(null);

  // جلب المتصدرين الأوائل لتزويد الذكاء الاصطناعي ببيانات لوحة الشرف
  useEffect(() => {
    let isMounted = true;
    const fetchTopLeaderboard = async () => {
      await initFirebase();
      if (!isMounted) return;
      try {
        const qLeaderboard = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(5));
        const snapshot = await getDocs(qLeaderboard);
        const data = snapshot.docs
          .map(d => ({
            displayName: d.data().displayName || d.data().name || "مستخدم قرآني",
            username: d.data().username || "",
            totalPoints: d.data().totalPoints || 0,
            country: d.data().country || "مصر",
            isBanned: d.data().isBanned || false
          }))
          .filter(u => !u.isBanned);
        setLeaderboardUsers(data);
      } catch (err) {
        console.error("Error fetching leaderboard for chatbot context:", err);
      }
    };
    fetchTopLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // حفظ الرسائل مؤقتاً عند أي تغيير
  useEffect(() => {
    sessionStorage.setItem("quran_chat_messages", JSON.stringify(messages));
  }, [messages]);

  // إغلاق نافذة الشات تلقائياً عند الانتقال لصفحة أخرى (مع الحفاظ على محتوى الشات)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeDoc: (() => void) | null = null;

    const setupAuth = async () => {
      await initFirebase();
      if (!isMounted) return;

      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setDbUser(docSnap.data());
            }
          });
        } else {
          setDbUser(null);
        }
      });
    };
    setupAuth();

    return () => {
      isMounted = false;
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      const t1 = setTimeout(() => scrollToBottom("auto"), 50);
      const t2 = setTimeout(() => scrollToBottom("smooth"), 150);
      const t3 = setTimeout(() => scrollToBottom("smooth"), 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen]);

  const renderMessage = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <button 
          key={`link-${match.index}`}
          onClick={() => {
            setIsOpen(false);
            navigateInstantly(linkUrl);
          }}
          className="text-[#d4af37] font-bold mx-1 underline underline-offset-4 hover:text-white transition-colors"
        >
          {linkText}
        </button>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const userText = message.trim();
    const newUserMsg = { id: Date.now(), text: userText, sender: "user" };
    
    // Check if there is an active quiz we are waiting for an answer to
    if (activeQuiz) {
      const userAns = userText.trim().toLowerCase();
      // استخراج الإجابة إذا كانت حرفاً واحداً أو تبدأ بكلمات مثل "الخيار أ" أو "إجابة ب"
      const optionMatch = userAns.match(/^(?:الخيار\s+|الاجابة\s+|إجابة\s+|حرف\s+)?([أابجدa-d])$/i);

      if (optionMatch) {
        const letter = optionMatch[1].toLowerCase();
        const correctOpt = activeQuiz.correctOption.toLowerCase();
        const optionMap: Record<string, string> = {
          "أ": "أ", "ا": "أ", "a": "أ",
          "ب": "ب", "b": "ب",
          "ج": "ج", "c": "ج",
          "د": "د", "d": "د"
        };

        const userChoice = optionMap[letter] || letter;
        const isCorrect = userChoice === correctOpt;

        let replyText = "";
        if (isCorrect) {
          replyText = `🎉 **إجابة صحيحة بارك الله فيك!** 👏✨
          
**التفسير/الشرح:**
${activeQuiz.explanation}

🏆 حصلت على **+15 نقطة** مكافأة مسابقة دينية! استمر في التحدي وسؤال أسئلة أخرى!`;
          
          if (auth?.currentUser && db && dbUser) {
            const currentPoints = dbUser.totalPoints || 0;
            updateDoc(doc(db, "users", auth.currentUser.uid), {
              totalPoints: currentPoints + 15
            }).catch(e => console.error("Failed to reward quiz points:", e));
          }
        } else {
          replyText = `❌ **إجابة خاطئة للأسف، حاول مرة أخرى!**
          
الخيار الصحيح كان: **(${activeQuiz.correctOption})**

**التفسير/الشرح:**
${activeQuiz.explanation}

لا تحزن، يمكنك دائماً طلبي بسؤال ديني آخر وتحدي جديد! 💪✨`;
        }

        setMessages(prev => [
          ...prev,
          newUserMsg,
          { id: Date.now() + 1, text: replyText, sender: "bot" }
        ]);
        setActiveQuiz(null);
        setMessage("");
        return;
      } else {
        // لو الإدخال ليس خياراً (أ، ب، ج، د)، نقوم بإلغاء الكويز النشط حتى يستطيع الـ AI فهم السؤال الجديد
        setActiveQuiz(null);
      }
    }

    // Create the updated messages array to send to the API
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setMessage("");
    setIsTyping(true);

    const userData = dbUser;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedMessages,
          userData,
          pathname,
          leaderboard: leaderboardUsers
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: data.text, sender: "bot" }
      ]);

      if (data.quiz) {
        setActiveQuiz(data.quiz);
      }

      if (data.updateProfile && auth?.currentUser && db) {
        const updateFields: any = {};
        if (data.updateProfile.displayName) updateFields.displayName = data.updateProfile.displayName.trim();
        if (data.updateProfile.country) {
          updateFields.country = data.updateProfile.country;
          updateFields.governorate = data.updateProfile.country;
        }
        if (data.updateProfile.phoneNumber) {
          updateFields.phoneNumber = data.updateProfile.phoneNumber.trim();
          updateFields.phone = data.updateProfile.phoneNumber.trim();
        }

        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), updateFields);
          console.log("👤 [ChatBot]: AI successfully updated profile in Firestore!", updateFields);
        } catch (dbErr) {
          console.error("❌ [ChatBot]: Failed to write AI profile update to Firestore:", dbErr);
        }
      }

      if (data.createPlan && auth?.currentUser && db) {
        const planData = {
          activeQuranPlan: {
            planName: data.createPlan.planName,
            durationDays: Number(data.createPlan.durationDays) || 7,
            dailyTarget: data.createPlan.dailyTarget,
            targetPagesPerDay: Number(data.createPlan.targetPagesPerDay) || 1,
            dayByDayBreakdown: Array.isArray(data.createPlan.dayByDayBreakdown) ? data.createPlan.dayByDayBreakdown : [],
            currentDay: 1,
            completedDays: [],
            createdAt: new Date().toISOString()
          }
        };

        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), planData);
          console.log("📖 [ChatBot]: AI successfully created and saved Custom Quran Plan in Firestore!", planData);
        } catch (dbErr) {
          console.error("❌ [ChatBot]: Failed to save custom Quran plan in Firestore:", dbErr);
        }
      }
    } catch (error: any) {
      console.warn("⚠️ API Call failed. Activating client-side Machine Learning Model Fallback...", error);
      
      const mlClassification = classifyQueryWithML(userText, userData);
      
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: mlClassification.reply, sender: "bot" }
      ]);

      if (mlClassification.quiz) {
        setActiveQuiz(mlClassification.quiz);
      }

      if (mlClassification.updateProfile && auth?.currentUser && db) {
        const updateFields: any = {};
        if (mlClassification.updateProfile.displayName) updateFields.displayName = mlClassification.updateProfile.displayName.trim();
        if (mlClassification.updateProfile.country) {
          updateFields.country = mlClassification.updateProfile.country;
          updateFields.governorate = mlClassification.updateProfile.country;
        }
        if (mlClassification.updateProfile.phoneNumber) {
          updateFields.phoneNumber = mlClassification.updateProfile.phoneNumber.trim();
          updateFields.phone = mlClassification.updateProfile.phoneNumber.trim();
        }

        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), updateFields);
          console.log("👤 [ChatBot Fallback]: AI successfully updated profile in Firestore!", updateFields);
        } catch (dbErr) {
          console.error("❌ [ChatBot Fallback]: Failed to write AI profile update to Firestore:", dbErr);
        }
      }

      if (mlClassification.createPlan && auth?.currentUser && db) {
        const planData = {
          activeQuranPlan: {
            planName: mlClassification.createPlan.planName,
            durationDays: Number(mlClassification.createPlan.durationDays) || 7,
            dailyTarget: mlClassification.createPlan.dailyTarget,
            targetPagesPerDay: Number(mlClassification.createPlan.targetPagesPerDay) || 1,
            dayByDayBreakdown: Array.isArray(mlClassification.createPlan.dayByDayBreakdown) ? mlClassification.createPlan.dayByDayBreakdown : [],
            currentDay: 1,
            completedDays: [],
            createdAt: new Date().toISOString()
          }
        };

        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), planData);
          console.log("📖 [ChatBot Fallback]: AI successfully created and saved Custom Quran Plan in Firestore!", planData);
        } catch (dbErr) {
          console.error("❌ [ChatBot Fallback]: Failed to save custom Quran plan in Firestore:", dbErr);
        }
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Draggable Floating Action Button */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0}
        style={{ x: chatX, y: chatY }}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={() => {
          localStorage.setItem('chatbot_btn_pos', JSON.stringify({
            x: chatX.get(),
            y: chatY.get()
          }));
          setTimeout(() => { isDragging.current = false; }, 150);
        }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        whileHover={{ scale: isOpen ? 0 : 1.1 }}
        whileTap={{ scale: isOpen ? 0 : 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => { if (!isDragging.current) setIsOpen(true); }}
        className={`fixed bottom-20 left-4 sm:left-6 z-[400] w-12 h-12 rounded-full flex items-center justify-center group cursor-grab active:cursor-grabbing ${isOpen ? 'pointer-events-none' : ''}`}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#000] border border-[#d4af37]/50 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <MessageCircle className="w-5 h-5 text-[#d4af37]" />
        </div>
      </motion.button>

      {/* Chat Window - Compact */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-2 right-2 sm:left-4 sm:right-auto sm:w-[340px] z-[500] bg-[#0a0a0a] border border-[#d4af37]/20 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[65vh]"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#111] border-b border-[#d4af37]/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BotMessageSquare className="w-4 h-4 text-[#d4af37]" />
                <span className="text-white text-xs font-bold">المساعد الذكي</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2 relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-white/10 text-white rounded-tr-sm"
                      : "bg-[#1a1a1a] text-white/90 border border-[#d4af37]/20 rounded-tl-sm"
                  }`}>
                    {renderMessage(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#d4af37]/20 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t border-[#d4af37]/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب هنا..."
                  dir="rtl"
                  className="flex-1 bg-[#111] border border-[#d4af37]/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#d4af37]/50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping}
                  className="shrink-0 w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
