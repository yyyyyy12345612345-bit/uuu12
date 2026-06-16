"use client";

import React, { useState, useEffect } from "react";
import { Brain, Trophy, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Star, Sparkles, Loader2 } from "lucide-react";
import { addPoints } from "@/lib/points";
import { auth } from "@/lib/firebase";

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const QUIZZES: Record<number, Question[]> = {
  0: [
    {
      question: "ما هي السورة التي تسمى 'عروس القرآن'؟",
      options: ["سورة الرحمن", "سورة يس", "سورة الواقعة", "سورة الملك"],
      correctAnswerIndex: 0,
      explanation: "سورة الرحمن تسمى عروس القرآن لما ورد في بعض الأحاديث والآثار عن جمال فواصلها وعظم نعم الله المذكورة فيها."
    },
    {
      question: "ما معنى كلمة 'الأنفال' الواردة في مطلع السورة الكريمة؟",
      options: ["العهود والمواثيق", "الغنائم والأنصبة", "العبادات والسنن", "المعارك والحروب"],
      correctAnswerIndex: 1,
      explanation: "الأنفال هي الغنائم التي يغنمها المسلمون من عدوهم في الحرب."
    },
    {
      question: "في أي سنة هجرية وقعت غزوة بدر الكبرى؟",
      options: ["السنة الأولى للهجرة", "السنة الثانية للهجرة", "السنة الثالثة للهجرة", "السنة الرابعة للهجرة"],
      correctAnswerIndex: 1,
      explanation: "وقعت غزوة بدر الكبرى في السابع عشر من رمضان في السنة الثانية للهجرة النبوية الشريفة."
    }
  ],
  1: [
    {
      question: "ما هي السورة التي تعدل ثلث القرآن الكريم؟",
      options: ["سورة الفاتحة", "سورة الكافرون", "سورة الإخلاص", "سورة يس"],
      correctAnswerIndex: 2,
      explanation: "سورة الإخلاص تعدل ثلث القرآن لأنها تتمحور بالكامل حول التوحيد وإخلاص العبادة لله وحده لا شريك له."
    },
    {
      question: "ما معنى كلمة 'قسورة' في قوله تعالى (فرت من قسورة)؟",
      options: ["الأسد", "الغزال", "الحمار الوحشي", "الصياد"],
      correctAnswerIndex: 0,
      explanation: "القسورة في اللغة العربية هي الأسد، والمعنى أن المشركين يفرون من القرآن كالحمر الوحشية التي تفر من الأسد."
    },
    {
      question: "من هو أول من أسلم من الصبيان؟",
      options: ["أبو بكر الصديق", "علي بن أبي طالب", "زيد بن حارثة", "عبد الله بن مسعود"],
      correctAnswerIndex: 1,
      explanation: "علي بن أبي طالب رضي الله عنه كان أول من أسلم من الصبيان وهو ابن عشر سنين."
    }
  ],
  2: [
    {
      question: "ما هي أطول سورة في القرآن الكريم？",
      options: ["سورة آل عمران", "سورة النساء", "سورة المائدة", "سورة البقرة"],
      correctAnswerIndex: 3,
      explanation: "سورة البقرة هي أطول سورة في القرآن الكريم، وتبلغ عدد آياتها 286 آية."
    },
    {
      question: "ما معنى كلمة 'الرقيم' في قوله تعالى (أصحاب الكهف والرقيم)؟",
      options: ["الكهف المظلم", "اللوح أو الحجر المنقوش الذي كتبت فيه أسماؤهم", "اسم الجبل الذي يقع فيه الكهف", "اسم الكلب الذي رافقهم"],
      correctAnswerIndex: 1,
      explanation: "الرقيم هو اللوح أو الصخرة المنقوشة التي دُوّن عليها قصة الفتية وأسماؤهم تخليداً لذكراهم."
    },
    {
      question: "كم عدد الأنبياء والرسل الذين ذكروا بأسمائهم في القرآن الكريم؟",
      options: ["20 نبياً ورسولاً", "25 نبياً ورسولاً", "30 نبياً ورسولاً", "12 نبياً ورسولاً"],
      correctAnswerIndex: 1,
      explanation: "ذكر القرآن الكريم 25 نبياً ورسولاً بأسمائهم الصريحة، وتوزعت أسماؤهم في سور متفرقة."
    }
  ],
  3: [
    {
      question: "ما هي السورة الوحيدة في القرآن التي لا تبدأ بالبسملة؟",
      options: ["سورة يونس", "سورة هود", "سورة التوبة", "سورة الأنفال"],
      correctAnswerIndex: 2,
      explanation: "سورة التوبة (براءة) لم تبدأ بالبسملة لأنها نزلت بالسيف والبراءة من المشركين والمنافقين، والبسملة رحمة وأمان."
    },
    {
      question: "ما معنى كلمة 'يهوي' في قوله تعالى (والنجم إذا هوى)؟",
      options: ["يصعد للأعلى", "يسقط أو يغرب", "يلمع بشدة", "ينفجر ويتلاشى"],
      correctAnswerIndex: 1,
      explanation: "هوى النجم أي سقط أو غرب في الأفق."
    },
    {
      question: "ما هي أول عاصمة لدولة الإسلام بعد الهجرة النبوية؟",
      options: ["مكة المكرمة", "المدينة المنورة", "الكوفة", "دمشق"],
      correctAnswerIndex: 1,
      explanation: "المدينة المنورة (يثرب سابقاً) كانت أول عاصمة وحاضرة للدولة الإسلامية الفتية التي أسسها رسول الله صلى الله عليه وسلم."
    }
  ],
  4: [
    {
      question: "ما هي السورة التي ذكرت فيها البسملة مرتين؟",
      options: ["سورة النمل", "سورة النحل", "سورة الشعراء", "سورة القصص"],
      correctAnswerIndex: 0,
      explanation: "ذكرت البسملة في سورة النمل مرتين؛ الأولى في مطلع السورة، والثانية في الآية 30: (إنه من سليمان وإنه بسم الله الرحمن الرحيم)."
    },
    {
      question: "ما معنى كلمة 'المهل' في قوله تعالى (يغاثوا بماء كالمهل)؟",
      options: ["الماء العذب البارد", "عكر الزيت أو النحاس والمعادن المذابة شديدة الحرارة", "الدم المسفوح", "العسل المصفى"],
      correctAnswerIndex: 1,
      explanation: "المهل هو الشيء الغليظ شديد الحرارة مثل النحاس المذاب أو عكر الزيت الذي يحرق الوجوه من شدة حرارته."
    },
    {
      question: "من هو الصحابي الجليل الذي اهتز لوفاته عرش الرحمن سبحانه؟",
      options: ["حمزة بن عبد المطلب", "سعد بن معاذ", "جعفر بن أبي طالب", "مصعب بن عمير"],
      correctAnswerIndex: 1,
      explanation: "سعد بن معاذ رضي الله عنه، سيد الأوس، اهتز لوفاته عرش الرحمن فرحاً بقدوم روحه الطيبة واستبشاراً بها."
    }
  ],
  5: [
    {
      question: "ما هي السورة التي تسمى أيضاً بسورة 'بني إسرائيل'؟",
      options: ["سورة يوسف", "سورة الكهف", "سورة الإسراء", "سورة القصص"],
      correctAnswerIndex: 2,
      explanation: "تسمى سورة الإسراء بسورة بني إسرائيل لأنها بدأت بذكر الإسراء ثم أعقبتها مباشرة بذكر إفساد بني إسرائيل في الأرض."
    },
    {
      question: "ما معنى كلمة 'مرصاداً' في قوله تعالى (إن جهنم كانت مرصاداً)؟",
      options: ["مكاناً للراحة والخلود", "مكاناً للترصد والمراقبة لانتظار الكافرين", "مكاناً مغلقاً ومظلماً", "سجناً ضيقاً"],
      correctAnswerIndex: 1,
      explanation: "المرصاد هو المكان الذي يترقب فيه الراصد صيده، أي أن جهنم تترصد الكافرين وتنتظرهم ولا يفلت منها أحد."
    },
    {
      question: "من هو الصحابي الملقب بـ 'ذي النورين'؟",
      options: ["أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب"],
      correctAnswerIndex: 2,
      explanation: "لقب عثمان بن عفان رضي الله عنه بـ 'ذي النورين' لأنه تزوج من ابنتي رسول الله صلى الله عليه وسلم: رقية ثم أم كلثوم."
    }
  ],
  6: [
    {
      question: "ما هي السورة التي تنتهي بـ 'في جيدها حبل من مسد'؟",
      options: ["سورة الكافرون", "سورة الماعون", "سورة المسد", "سورة الفيل"],
      correctAnswerIndex: 2,
      explanation: "سورة المسد (تبت يدا أبي لهب) تنتهي بوعيد لامرأة أبي لهب بأن يكون في عنقها حبل متين من ليف أو خشن غليظ في النار."
    },
    {
      question: "ما معنى كلمة 'عبس' في قوله تعالى (عبس وتولى)؟",
      options: ["تحدث بصوت مرتفع", "كلح وجهه وقطب ما بين عينيه", "أعرض بجسده بالكامل", "ابتسم واستهزأ"],
      correctAnswerIndex: 1,
      explanation: "عبس تعني قطب ما بين عينيه وكشر وجهه في إشارة لطيفة من الله لرسوله عندما انشغل عن ابن أم مكتوم الأعمى."
    },
    {
      question: "ما هو المسجد الذي وصف في القرآن بأنه 'أُسّس على التقوى من أول يوم'؟",
      options: ["المسجد الحرام", "المسجد النبوي الشريف", "مسجد قباء", "مسجد الأقصى"],
      correctAnswerIndex: 2,
      explanation: "مسجد قباء هو أول مسجد أسس في الإسلام وأول مسجد أسس على التقوى عند وصول النبي صلى الله عليه وسلم إلى المدينة المنورة."
    }
  ]
};

export function DailyQuiz() {
  const [mode, setMode] = useState<"static" | "ai" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizCompletedToday, setQuizCompletedToday] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; char: string; left: number; delay: number }[]>([]);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const storageKey = `quiz_completed_${todayStr}`;
  const scoreKey = `quiz_score_${todayStr}`;

  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === "true";
    if (completed) {
      setQuizCompletedToday(true);
      const savedScore = localStorage.getItem(scoreKey);
      if (savedScore) {
        setScore(parseInt(savedScore, 10));
      }
    }
  }, []);

  const startStaticQuiz = () => {
    const day = new Date().getDay();
    setQuestions(QUIZZES[day]);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setMode("static");
  };

  const generateAiQuestion = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("فشل توليد السؤال بواسطة الذكاء الاصطناعي");
      
      const data = await response.json();
      if (data.question && Array.isArray(data.options)) {
        setQuestions([data]);
        setCurrentIdx(0);
        setSelectedOpt(null);
        setIsAnswered(false);
        setShowExplanation(false);
        setMode("ai");
      } else {
        throw new Error("تنسيق بيانات غير صالح");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoadingAi(false);
    }
  };

  const triggerConfetti = () => {
    const emojis = ["🎉", "✨", "🧠", "🌟", "⭐", "💫", "💡"];
    const items = Array.from({ length: 40 }).map((_, idx) => ({
      id: idx,
      char: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 1.5
    }));
    setConfetti(items);
  };

  const handleOptionClick = async (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOpt(optionIdx);
    setIsAnswered(true);
    setShowExplanation(true);

    const isCorrect = optionIdx === questions[currentIdx].correctAnswerIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      triggerConfetti();

      // Add points
      try {
        await addPoints("bonus", 5);
      } catch (err) {
        console.error("Error adding points:", err);
      }
    }
  };

  const handleNext = () => {
    if (mode === "static" && currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      // Completed current quiz round
      if (mode === "static") {
        localStorage.setItem(storageKey, "true");
        localStorage.setItem(scoreKey, score.toString());
        setQuizCompletedToday(true);
      } else {
        // AI Mode completed single question - allow generating next
        generateAiQuestion();
      }
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="w-full relative py-8 px-5 md:px-10 bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden font-arabic select-none">
      {/* Background Islamic Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none islamic-pattern" />

      {/* Confetti Rendering */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((item) => (
            <span
              key={item.id}
              className="absolute text-2xl animate-fall-fade"
              style={{
                left: `${item.left}%`,
                top: `-20px`,
                animationDelay: `${item.delay}s`,
                animationDuration: "2s"
              }}
            >
              {item.char}
            </span>
          ))}
        </div>
      )}

      {loadingAi ? (
        <div className="py-24 flex flex-col items-center gap-6 relative z-10 animate-pulse">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="space-y-2 text-center">
            <p className="text-primary font-black text-lg">جاري استدعاء خبير الذكاء الاصطناعي (Gemini AI) 🧠✨</p>
            <p className="text-white/40 text-xs font-bold">يتم صياغة سؤال ديني مميز من كتاب الله وسنة رسوله...</p>
          </div>
        </div>
      ) : mode === null ? (
        // Selection Mode Screen
        <div className="text-center py-6 space-y-8 relative z-10 animate-in fade-in duration-500">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white">اختر نمط التحدي اليومي</h3>
            <p className="text-foreground/40 text-sm max-w-md mx-auto">
              تصفح التحدي اليومي الثابت المنسق مسبقاً، أو انطلق في رحلة معرفية لا تنتهي مع الذكاء الاصطناعي المتطور!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Mode 1: Static Daily Quiz */}
            <div 
              onClick={quizCompletedToday ? undefined : startStaticQuiz}
              className={`p-6 rounded-[2.5rem] border text-right transition-all duration-300 relative group flex flex-col justify-between min-h-[180px] ${
                quizCompletedToday 
                  ? "bg-foreground/[0.02] border-border/40 opacity-50 cursor-not-allowed" 
                  : "bg-black/20 border-white/5 hover:border-primary/30 cursor-pointer"
              }`}
            >
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white/50 tracking-wider mb-3">
                  تحدي ثابت (3 أسئلة) 📅
                </span>
                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">تحدي اليومي المعتاد</h4>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  3 أسئلة ثقافية مجهزة لليوم، تمنحك حتى 15 نقطة بعد الانتهاء منها كلياً.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-primary font-black">
                  {quizCompletedToday ? "تم إنجازه اليوم بنجاح ✅" : "ابدأ التحدي اليومي"}
                </span>
                {!quizCompletedToday && <span className="text-xs text-white/20 group-hover:text-primary transition-colors">←</span>}
              </div>
            </div>

            {/* Mode 2: AI Dynamic Quiz */}
            <div 
              onClick={generateAiQuestion}
              className="p-6 rounded-[2.5rem] border text-right bg-black/20 border-white/5 hover:border-primary/30 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between min-h-[180px] shadow-lg shadow-primary/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Brain className="w-32 h-32" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-wider mb-3">
                  توليد فوري بالذكاء الاصطناعي 🧠✨
                </span>
                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">تحدي الذكاء الاصطناعي</h4>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">
                  أسئلة تفاعلية حية تصاغ خصيصاً لك بواسطة الذكاء الاصطناعي. اسأل بلا حدود وارفع رصيدك!
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-primary font-black">توليد سؤال بالذكاء الاصطناعي</span>
                <span className="text-xs text-white/20 group-hover:text-primary transition-colors">←</span>
              </div>
            </div>
          </div>

          {aiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs max-w-md mx-auto flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>فشل الاتصال بالذكاء الاصطناعي، يرجى المحاولة مرة أخرى أو اختيار التحدي المعتاد.</span>
            </div>
          )}
        </div>
      ) : quizCompletedToday && mode === "static" ? (
        // Score screen for Static Mode
        <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-amber-500 text-black flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white">أتممت تحدي المعرفة اليوم!</h3>
            <p className="text-foreground/60 text-sm max-w-sm mx-auto">
              الحمد لله، لقد أجبت على تحديات اليوم المعرفية وحصدت النقاط لتزيين ملفك الشخصي.
            </p>
          </div>

          <div className="bg-[#0c0d10] border border-white/5 rounded-3xl p-6 max-w-md mx-auto grid grid-cols-2 gap-4">
            <div className="text-center border-l border-white/5">
              <span className="block text-4xl font-black text-primary font-mono">{score}/3</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 block">الإجابات الصحيحة</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-black text-emerald-400 font-mono">+{score * 5}</span>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 block">نقاط مكتسبة</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
              onClick={() => {
                setMode(null);
                setScore(0);
              }}
              className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs rounded-2xl transition-all"
            >
              الرجوع للقائمة الرئيسية
            </button>
            <button 
              onClick={generateAiQuestion}
              className="flex-1 py-4 bg-primary text-black font-black text-xs rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تجربة تحدي الذكاء الاصطناعي</span>
            </button>
          </div>
        </div>
      ) : (
        // Question Render Screen (Static or AI Mode)
        <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
          {/* Top progress bar */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <button 
              onClick={() => {
                setMode(null);
                setCurrentIdx(0);
                setSelectedOpt(null);
                setIsAnswered(false);
                setShowExplanation(false);
              }}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>تغيير النمط</span>
            </button>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs text-white/80 font-bold">
                {mode === "ai" ? "تحدي الذكاء الاصطناعي 🧠" : `السؤال ${currentIdx + 1} من ${questions.length}`}
              </span>
            </div>
          </div>

          {/* Question text */}
          <div className="py-4 text-center min-h-[90px] flex items-center justify-center">
            <h4 className="text-xl md:text-2xl font-black text-white leading-relaxed">
              {currentQ.question}
            </h4>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOpt === idx;
              const isCorrect = idx === currentQ.correctAnswerIndex;
              
              let btnClass = "bg-[#0c0d10] border-white/5 text-white/80 hover:bg-white/5 hover:border-white/10";
              if (isAnswered) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.02]";
                } else if (isSelected) {
                  btnClass = "bg-red-500/10 border-red-500/50 text-red-400 scale-[0.98]";
                } else {
                  btnClass = "bg-[#0c0d10]/50 border-white/5 text-white/20 opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`w-full py-4.5 px-6 rounded-2xl border text-right font-bold text-sm transition-all duration-300 flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation / Feedback block */}
          {showExplanation && (
            <div className="bg-[#0c0d10] border border-white/5 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2 duration-300 text-right">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{selectedOpt === currentQ.correctAnswerIndex ? "إجابة صحيحة متميزة! 🎉 (+5 نقاط)" : "توضيح وفائدة إيمانية 💡"}</span>
              </span>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next / Generate Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-primary text-black font-black text-sm rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span>{mode === "ai" ? "توليد سؤال ذكي جديد 🧠✨" : currentIdx < questions.length - 1 ? "السؤال التالي" : "عرض النتيجة الإجمالية"}</span>
              <ArrowLeft className="w-4 h-4 shrink-0 rotate-180" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
