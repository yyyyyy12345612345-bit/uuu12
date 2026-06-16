"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Send, BotMessageSquare, MessageCircle, User, Wand2, Sparkles, BookOpen, Moon, Sun, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";
import { classifyQueryWithML } from "@/lib/ml-model";
import { auth, db, initFirebase } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, getCountFromServer, where, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// helper functions for chatbot analytics
function detectInsult(text: string): boolean {
  const badWords = [
    "غبي", "حمار", "كلب", "متخلف", "وحش", "سيء", "سيئ", "زباله", "زبالة", "غباء", 
    "تفه", "ملل", "زهقت", "مللت", "خرا", "خراء", "شتم", "بضان", "يا عم", "ياعم", 
    "غتي", "غبيي", "غبييي", "حيوان", "لعنة", "لعنه", "يلعن", "يا غبي", "ياحمار", "ياكلب",
    "احا", "احى", "منيوك", "خول", "شرموط", "عرص"
  ];
  const normalized = text.toLowerCase().trim();
  return badWords.some(word => normalized.includes(word));
}

function classifySentiment(text: string): "positive" | "negative" | "neutral" {
  if (detectInsult(text)) return "negative";
  
  const niceWords = [
    "شكرا", "شكرًا", "جميل", "حلو", "ممتاز", "رائع", "جزاك الله", "جزاكم الله", 
    "بارك الله", "احسنت", "أحسنت", "عاش", "تسلم", "حبيبي", "يا غالي", "ياغالي", 
    "كفو", "منور", "احبك", "أحبك", "مفيد", "جميل جدا", "رائع جدا", "شكرا لك"
  ];
  const normalized = text.toLowerCase().trim();
  const hasNice = niceWords.some(word => normalized.includes(word));
  if (hasNice) return "positive";
  
  return "neutral";
}

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
      { 
        id: 1, 
        text: "السلام عليكم ورحمة الله وبركاته 🌟✨\n\nأنا مساعدك الذكي في القرآن الكريم والعلوم الإسلامية. يمكنني مساعدتك في:\n\n📖 تفسير الآيات والأحاديث\n🕌 أحكام الفقه والعبادات\n💡 الفتاوى الشرعية\n📚 القصص القرآني\n🎯 مسابقات دينية\n\nكيف يمكنني خدمتك اليوم؟", 
        sender: "bot" 
      }
    ];
  });
  const [dbUser, setDbUser] = useState<any>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ questionId: number; correctOption: string; explanation: string } | null>(null);
  const [siteStats, setSiteStats] = useState<{ totalUsers: number; totalRenders: number } | null>(null);

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

  // جلب إحصائيات الموقع (عدد المستخدمين وإجمالي الفيديوهات)
  useEffect(() => {
    let isMounted = true;
    const fetchSiteStats = async () => {
      await initFirebase();
      if (!isMounted || !db) return;
      try {
        const [countSnap, rendersSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getDocs(query(collection(db, "users"), where("videoRendersCount", ">", 0)))
        ]);
        const totalRenders = rendersSnap.docs.reduce((sum, d) => sum + (d.data().videoRendersCount || 0), 0);
        if (isMounted) setSiteStats({ totalUsers: countSnap.data().count, totalRenders });
      } catch (err) {
        console.error("Error fetching site stats for chatbot:", err);
      }
    };
    fetchSiteStats();
    return () => { isMounted = false; };
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

  const logMessageToFirestore = async (text: string, sender: "user" | "bot") => {
    try {
      await initFirebase();
      if (!db) return;
      
      let targetUserId = "guest_unknown";
      if (typeof window !== "undefined") {
        let savedUid = localStorage.getItem("quran_chatbot_user_id");
        if (!savedUid) {
          savedUid = "guest_" + Math.random().toString(36).substring(2, 11);
          localStorage.setItem("quran_chatbot_user_id", savedUid);
        }
        targetUserId = auth?.currentUser?.uid || savedUid;
      }
      
      const targetUserName = auth?.currentUser?.uid 
        ? (dbUser?.displayName || dbUser?.name || "مستخدم مسجل")
        : "زائر";

      await addDoc(collection(db, "chatbot_logs"), {
        userId: targetUserId,
        userName: sender === "user" ? targetUserName : "يقين (البوت)",
        text: text,
        sender: sender,
        timestamp: serverTimestamp(),
        sentiment: sender === "user" ? classifySentiment(text) : "neutral",
        isInsult: sender === "user" ? detectInsult(text) : false
      });
    } catch (err) {
      // Silent - Firebase rules may block writing, but chat still works
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (isTyping) return;

    const userText = customText ? customText.trim() : message.trim();
    if (!userText) return;

    const newUserMsg = { id: Date.now(), text: userText, sender: "user" };
    
    // Clear message input if it was typed
    if (!customText) {
      setMessage("");
    }

    // Log user message to Firestore
    logMessageToFirestore(userText, "user");
    
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

        // Log bot response to Firestore
        logMessageToFirestore(replyText, "bot");

        setActiveQuiz(null);
        return;
      } else {
        // لو الإدخال ليس خياراً (أ، ب، ج، د)، نقوم بإلغاء الكويز النشط حتى يستطيع الـ AI فهم السؤال الجديد
        setActiveQuiz(null);
      }
    }

    // Create the updated messages array to send to the API
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setIsTyping(true);

    const userData = dbUser;

    try {
      const userName = dbUser?.displayName || dbUser?.name || "زائر";
      const userPoints = dbUser?.totalPoints || dbUser?.points || 0;
      const userCountry = dbUser?.country || "غير محدد";
      const userMinutes = dbUser?.stats?.audioMinutes || 0;
      const userGender = dbUser?.gender === "male" ? "ذكر" : dbUser?.gender === "female" ? "أنثى" : "غير محدد";
      const userPlan = dbUser?.plan || "مجانية";
      const userPhone = dbUser?.phoneNumber || "غير مسجل";
      const userUsername = dbUser?.username || "غير مسجل";
      const userCreatedAt = dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString("ar-EG") : "غير محدد";

      const systemContext = `[SYSTEM - أنت "يقين" المساعد الذكي لتطبيق الاستوديو القرآني الفائق]
- هويتك: مساعد ذكي خبير بالقرآن والتفسير والأحكام الدينية، ومختص بالإرشاد داخل التطبيق
- لسانك: عربي فصيح بأسلوب دافئ ومحترم، تخاطب المستخدم بـ"يا ${userName}"
- صلاحياتك: قراءة فقط — لا تملك صلاحية تعديل أي بيانات في قاعدة البيانات
- مكانك: تعيش داخل التطبيق، وكل أسئلة المستخدم عن التطبيق تجيب عنها من معرفتك المدمجة

[التطبيق]
- الاسم: يقين القرآن | Yaqeen AlQuran (الاستوديو القرآني الفائق)
- المطور: يوسف أسامة — مهندس ذكاء اصطناعي (AIE)
- حسابه: @youssef_osama04 (https://instagram.com/youssef_osama04)
- التقنيات: Next.js 16 + React 19 + Firebase + Cloudflare
- رابط الموقع: yaqeen-app.vercel.app

[صفحات التطبيق]
- /mushaf-full: المصحف المكتوب كاملًا مع التفسير الميسر والبحث
- /mushaf-tafseer: تفسير مباشر لأي آية
- /digital: مصحف رقمي سريع خفيف للهواتف
- /prayers: مواقيت الصلاة الخمس + بوصلة القبلة + مؤقت الأذان
- /library: مكتبة صوتية لأكثر من 100 قارئ (عبد الباسط، المنشاوي، المعيقلي، الدوسري...)
- /video: استوديو فيديو قرآني — تصميم فيديوهات بتلاوات وخلفيات وتأثيرات
- /daily: أذكار الصباح والمساء والنوم + سبحة إلكترونية
- /rank: لوحة الشرف والترتيب العام
- /profile: الملف الشخصي — الاسم، البلد، النقاط، الإحصائيات

[نظام النقاط]
- قراءة صفحة (+5 نقاط) | آية (+0.2) | استماع 30ث (+1) | ختم سورة استماع (+10)
- تسبيحة 99 (+3) | قراءة ذكر (+1) | التحديات اليومية (جوائز متغيرة)

[معلومات المستخدم الحالي]
- الاسم: ${userName}
- اليوزرنيم: ${userUsername}
- النقاط: ${userPoints}
- الدولة: ${userCountry}
- الجنس: ${userGender}
- الباقة: ${userPlan}
- الهاتف: ${userPhone}
- دقائق الاستماع: ${userMinutes}
- تاريخ التسجيل: ${userCreatedAt}
- الصفحة الحالية: ${pathname || "الرئيسية"}

[إحصائيات الموقع العامة]
- إجمالي المستخدمين المسجلين: ${siteStats?.totalUsers ?? "جاري التحميل..."} مستخدم
- إجمالي الفيديوهات المنتجة: ${siteStats?.totalRenders ?? "جاري التحميل..."} فيديو

[قواعد مهمة]
1. أجِب فقط عن: (أ) القرآن والتفسير والأحكام الدينية (ب) أسئلة الموقع والتطبيق (ج) الدردشة العامة والترحيب
2. وجّه المستخدم إلى الصفحة المناسبة داخل التطبيق لما يحتاجه
3. إذا سأل عن تعديل بياناته، أخبره أن هذا دور الملف الشخصي (/profile) وليس لديك صلاحية التعديل
4. إذا سأل عن المطور، عرّفه بيوسف أسامة وحسابه
5. كُن دقيقًا في المعلومات الدينية، وإذا سأل عن فتوى معقدة انصحه بالرجوع لعالم دين مختص
6. استخدم لغة راقية ومحترمة، والدعاء في نهاية الرد مستحب
7. [مهم] لا تجب أبداً على أي سؤال سياسي — إذا سأل عن سياسة أو حزب أو زعيم أو حرب أو قرار سياسي، قل: "أنا مساعد قرآني إسلامي مختص بالدين والتطبيق فقط، لا أستطيع الإجابة على الأسئلة السياسية"
8. [مهم] لا تجب على أسئلة خارج نطاق الإسلام والموقع — إذا سأل عن طبخ، تكنولوجيا عامة، رياضة، ترفيه، ألعاب، قل: "أنا مساعد الاستوديو القرآني الفائق، اختصاصي هو القرآن والدين والتطبيق فقط 😊"
9. [مهم] لا تجب على أسئلة عن أديان أخرى بطريقة مقارنة أو جدلية — اختصاصك الإسلام فقط
10. إذا تكرر سؤال خارج النطاق، اعتذر بلطف وأعد التوجيه لسؤال عن القرآن أو الموقع
11. [مهم جداً وحرج] يمنع منعاً باتاً كتابة أو اقتباس نص أي آية قرآنية في الشات تحت أي ظرف من الظروف. إذا سألك المستخدم عن آية، أو موضع آية، أو تلاوة شيخ لآية معينة، لا تكتب نص الآية (ممنوع كتابة كلمات الآية نفسها)، بل قم فقط بالإشارة إليها بذكر اسم السورة ورقم الآية واسم الشيخ القارئ إن وجد (مثال: سورة البقرة، الآية 12، بتلاوة الشيخ عبد الباسط عبد الصمد).

سؤال المستخدم: ${userText}`;

      const res = await fetch("https://youssefosama--40af2a40698011f1b2fe1607ee4eb77e.web.val.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: systemContext
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

      // Log bot response to Firestore
      logMessageToFirestore(data.text, "bot");

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

      // Log bot response to Firestore
      logMessageToFirestore(mlClassification.reply, "bot");

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
            className="force-dark fixed bottom-16 left-1 right-1 sm:left-4 sm:right-auto sm:w-[400px] z-[500] bg-black/20 backdrop-blur-3xl border border-white/15 rounded-[2rem] shadow-[0_15px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(251,191,36,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col overflow-hidden max-h-[75vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#fbbf24]/30">
                  <BotMessageSquare className="w-5 h-5 text-black" />
                </div>
                <div>
                  <span className="text-white text-sm font-black">يقين | المساعد الذكي</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-bold">نشط بالذكاء الاصطناعي</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3.5 relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-[#fbbf24] to-[#d4af37] text-black rounded-tr-sm font-bold shadow-lg shadow-[#fbbf24]/10"
                      : "bg-[#fdfbf7] text-gray-900 border-2 border-[#fbbf24] rounded-tl-sm shadow-md"
                  }`}>
                    {msg.sender === "bot" && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#fbbf24]/30">
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                        <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-wider">المساعد الإسلامي</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{renderMessage(msg.text)}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 flex items-center gap-2 shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#fbbf24] rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                      <div className="w-2 h-2 bg-[#fbbf24] rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                      <div className="w-2 h-2 bg-[#fbbf24] rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                    </div>
                    <span className="text-[9px] text-[#fbbf24] font-bold">يكتب...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/10 backdrop-blur-sm">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب سؤالك الديني هنا..."
                  dir="rtl"
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#fbbf24]/40 focus:bg-white/[0.05] transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping}
                  className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center disabled:opacity-40 shadow-lg shadow-[#fbbf24]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-white/20">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> القرآن</span>
                <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> السنة</span>
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> الفقه</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
