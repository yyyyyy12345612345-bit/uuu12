"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, BotMessageSquare, MessageCircle, User, Wand2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { classifyQueryWithML } from "@/lib/ml-model";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function ChatBot() {
  const router = useRouter();
  const pathname = usePathname();

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
    if (!db) return;
    const fetchTopLeaderboard = async () => {
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
    if (!auth || !db) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setDbUser(docSnap.data());
          }
        });
        return () => unsubscribeDoc();
      } else {
        setDbUser(null);
      }
    });
    return () => unsubscribeAuth();
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
            router.push(linkUrl);
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

🏆 حصلت على **+15 نقطة** مكافأة ذكاء ديني! استمر في التحدي وسؤال أسئلة أخرى!`;
          
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
      {/* Premium Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-[90px] sm:bottom-24 left-4 sm:left-6 z-[400] w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        {/* Pulsing Aura */}
        <div className="absolute inset-0 bg-[#d4af37]/30 rounded-full blur-xl animate-pulse" />
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-[#d4af37]/30 border-t-[#d4af37] border-b-[#d4af37]"
        />
        
        {/* Main Button Body */}
        <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#000] border-2 border-[#d4af37]/50 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageCircle className="w-7 h-7 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
        </div>

        {/* Online Indicator */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#000] shadow-[0_0_10px_rgba(16,185,129,0.8)]"
        />
      </motion.button>

      {/* Premium Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed bottom-[85px] sm:bottom-20 left-0 sm:left-6 z-[500] w-full sm:w-[420px] h-[80vh] sm:h-[600px] bg-[#050505]/95 backdrop-blur-3xl sm:rounded-[2.5rem] rounded-[2.5rem] border border-[#d4af37]/20 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
          >
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#d4af37]/5 rounded-full blur-[100px]" />
               <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen" />
            </div>
            
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-b from-[#111] to-transparent border-b border-[#d4af37]/10 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/10 to-transparent animate-pulse" />
                  <BotMessageSquare className="w-6 h-6 text-[#d4af37] relative z-10" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2 font-sans">
                    المساعد الذكي
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold font-mono">متصل بالشبكة</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 font-sans relative z-10">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.sender === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] flex items-end gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${msg.sender === "user" ? "bg-gradient-to-br from-white/10 to-white/5 border border-white/10" : "bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] border border-[#d4af37]/50"}`}>
                      {msg.sender === "user" ? <User className="w-4 h-4 text-white" /> : <Wand2 className="w-4 h-4 text-black" />}
                    </div>
                    
                    <div 
                      className={`relative p-4 rounded-3xl text-sm leading-relaxed shadow-2xl ${
                        msg.sender === "user" 
                          ? "bg-white/10 text-white rounded-tr-sm border border-white/10 backdrop-blur-md" 
                          : "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] text-white/90 rounded-tl-sm border border-[#d4af37]/30"
                      }`}
                    >
                      {/* Bot Message Glow */}
                      {msg.sender === "bot" && <div className="absolute inset-0 bg-[#d4af37]/5 rounded-3xl blur-md pointer-events-none" />}
                      <span className="relative z-10 leading-loose">{renderMessage(msg.text)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                  <div className="max-w-[80%] flex items-end gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] border border-[#d4af37]/50 flex items-center justify-center shadow-lg">
                      <Wand2 className="w-4 h-4 text-black" />
                    </div>
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-tl-sm border border-[#d4af37]/30 flex items-center gap-2 shadow-2xl">
                      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-t from-[#000] to-transparent shrink-0 relative z-10 border-t border-[#d4af37]/10">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك هنا..."
                    dir="rtl"
                    className="w-full bg-[#111]/80 backdrop-blur-xl border border-[#d4af37]/20 rounded-full py-4 px-6 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d4af37]/60 focus:bg-[#1a1a1a] transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                  />
                  {/* Inner glow on focus */}
                  <div className="absolute inset-0 rounded-full pointer-events-none border border-transparent peer-focus:border-[#d4af37]/30 transition-all mix-blend-overlay" />
                </div>
                
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping}
                  className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] flex items-center justify-center text-black disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)] group"
                >
                  <Send className="w-6 h-6 -translate-x-0.5 group-hover:translate-x-[-4px] group-hover:-translate-y-[4px] transition-transform" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
