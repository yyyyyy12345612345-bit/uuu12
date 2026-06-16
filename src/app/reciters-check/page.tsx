"use client";

import React, { useState, useEffect, useMemo } from "react";
import { RECITERS, Reciter } from "@/data/reciters";
import { 
  Play, Pause, Search, RefreshCw, CheckCircle2, 
  AlertTriangle, ShieldCheck, HelpCircle, Volume2, Database, Activity 
} from "lucide-react";

export default function RecitersCheckPage() {
  const [recitersList, setRecitersList] = useState<Reciter[]>(RECITERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statuses, setStatuses] = useState<Record<string, "unchecked" | "checking" | "working" | "failed">>({});
  const [audioUrlPlaying, setAudioUrlPlaying] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);
  const [currentlyCheckingId, setCurrentlyCheckingId] = useState<string | null>(null);

  // Sync state with imported list
  useEffect(() => {
    setRecitersList(RECITERS);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
      }
    };
  }, [activeAudio]);

  // Execute cleanup script
  const handleFixReciters = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const res = await fetch("/api/admin/fix-reciters");
      const data = await res.json();
      if (data.success) {
        setFixResult(`نجح التنظيف! تم تحديث الملف. عدد القراء الحالي: ${data.fixedCount} (السابق: ${data.originalCount})`);
        
        // Dynamically fetch updated reciters by reloading or showing alert
        alert("تم تحديث ملف القراء بنجاح! يرجى تحديث الصفحة لرؤية التغييرات الجديدة وإضافة المنشاوي وعبد الباسط والحصري (المرتل والمجود).");
        window.location.reload();
      } else {
        setFixResult(`فشل التنظيف: ${data.error || "خطأ غير معروف"}`);
      }
    } catch (e: any) {
      setFixResult(`خطأ أثناء التنظيف: ${e.message || e}`);
    } finally {
      setFixing(false);
    }
  };

  // Check audio URL
  const checkReciterUrl = async (reciter: Reciter): Promise<boolean> => {
    setStatuses(prev => ({ ...prev, [reciter.id]: "checking" }));
    const testUrl = `https://${reciter.mp3quranServer}/001.mp3`;

    try {
      const res = await fetch(`/api/admin/check-audio?url=${encodeURIComponent(testUrl)}`);
      const data = await res.json();
      if (data.ok && data.status === 200) {
        setStatuses(prev => ({ ...prev, [reciter.id]: "working" }));
        return true;
      } else {
        setStatuses(prev => ({ ...prev, [reciter.id]: "failed" }));
        return false;
      }
    } catch (e) {
      setStatuses(prev => ({ ...prev, [reciter.id]: "failed" }));
      return false;
    }
  };

  // Check all reciters sequentially
  const handleCheckAll = async () => {
    if (checkingAll) return;
    setCheckingAll(true);
    
    // Check filtered list or full list
    const listToCheck = filteredReciters;
    
    for (const r of listToCheck) {
      setCurrentlyCheckingId(r.id);
      await checkReciterUrl(r);
    }
    
    setCheckingAll(false);
    setCurrentlyCheckingId(null);
  };

  // Play audio preview
  const togglePlayAudio = (reciter: Reciter) => {
    const url = `https://${reciter.mp3quranServer}/001.mp3`;

    if (audioUrlPlaying === url) {
      // Pause current
      if (activeAudio) {
        activeAudio.pause();
      }
      setAudioUrlPlaying(null);
    } else {
      // Pause active if exists
      if (activeAudio) {
        activeAudio.pause();
      }

      // Create new audio
      const audio = new Audio(url);
      audio.play().catch(e => {
        console.error("Audio playback error:", e);
        alert("تعذر تشغيل الصوت. يرجى التحقق من صحة رابط السيرفر أو الاتصال بالإنترنت.");
        setAudioUrlPlaying(null);
      });

      audio.onended = () => {
        setAudioUrlPlaying(null);
      };

      setActiveAudio(audio);
      setAudioUrlPlaying(url);
    }
  };

  // Filter reciters
  const filteredReciters = useMemo(() => {
    return recitersList.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = r.id.toLowerCase().includes(searchTerm.toLowerCase());
      const serverMatch = r.mp3quranServer.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || idMatch || serverMatch;
    });
  }, [recitersList, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredReciters.length;
    const working = Object.values(statuses).filter(s => s === "working").length;
    const failed = Object.values(statuses).filter(s => s === "failed").length;
    const unchecked = total - Object.keys(statuses).length;
    return { total, working, failed, unchecked };
  }, [filteredReciters, statuses]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white font-arabic p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="space-y-2 text-right">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-l from-primary to-amber-400 bg-clip-text text-transparent">
              لوحة التحكم وفحص مكتبة الصوتيات 🎙️✨
            </h1>
            <p className="text-white/40 text-xs md:text-sm">
              أداة تحقق ذكية لمراجعة جميع شيوخ وقراء التطبيق، للتأكد من اتصال روابطهم الصوتية ومطابقتها لأصواتهم الحقيقية.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFixReciters}
              disabled={fixing}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>{fixing ? "جاري تنظيف وإصلاح الملف..." : "تنظيف وإصلاح ملف القراء والتكرارات ⚡"}</span>
            </button>
            
            <button
              onClick={handleCheckAll}
              disabled={checkingAll || filteredReciters.length === 0}
              className="px-5 py-3 bg-primary text-black hover:scale-[1.02] disabled:opacity-50 font-black text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>{checkingAll ? `جاري فحص: ${stats.working + stats.failed}/${stats.total}` : "فحص اتصال جميع القراء تلقائياً 🌐"}</span>
            </button>
          </div>
        </div>

        {/* Fix result message banner */}
        {fixResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-3 justify-end text-right">
            <span className="font-bold">{fixResult}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f1118]/80 border border-white/5 p-5 rounded-3xl text-right">
            <span className="text-white/30 text-[10px] font-bold block uppercase tracking-widest">إجمالي القراء المعروضين</span>
            <span className="text-3xl font-black text-white font-mono mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-[#0f1118]/80 border border-white/5 p-5 rounded-3xl text-right">
            <span className="text-emerald-400/40 text-[10px] font-bold block uppercase tracking-widest">روابط متصلة وشغالة</span>
            <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">{stats.working}</span>
          </div>
          <div className="bg-[#0f1118]/80 border border-white/5 p-5 rounded-3xl text-right">
            <span className="text-red-400/40 text-[10px] font-bold block uppercase tracking-widest">روابط معطلة أو 404</span>
            <span className="text-3xl font-black text-red-400 font-mono mt-1 block">{stats.failed}</span>
          </div>
          <div className="bg-[#0f1118]/80 border border-white/5 p-5 rounded-3xl text-right">
            <span className="text-amber-400/40 text-[10px] font-bold block uppercase tracking-widest">قراء بانتظار الفحص</span>
            <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">{stats.unchecked}</span>
          </div>
        </div>

        {/* Controls & Search */}
        <div className="bg-[#0f1118] border border-white/5 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="ابحث عن قارئ بالاسم، المعرف ID، أو سيرفر الصوت..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full py-3 pr-12 pl-4 bg-[#090a0f] border border-white/5 rounded-2xl text-xs text-white placeholder-white/20 focus:border-primary/40 focus:outline-none text-right"
            />
          </div>
        </div>

        {/* Reciters Table / Cards */}
        <div className="bg-[#0f1118] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#090a0f]/50 text-white/50 font-bold">
                  <th className="py-4.5 px-6">القارئ</th>
                  <th className="py-4.5 px-6">معرف القارئ (ID)</th>
                  <th className="py-4.5 px-6">رابط خادم الصوت (mp3quranServer)</th>
                  <th className="py-4.5 px-6 text-center">اختبار الصوت الفعلي 🎧</th>
                  <th className="py-4.5 px-6 text-center">حالة الاتصال 🌐</th>
                  <th className="py-4.5 px-6 text-center">عمليات فحص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReciters.map((reciter) => {
                  const status = statuses[reciter.id] || "unchecked";
                  const surah1Url = `https://${reciter.mp3quranServer}/001.mp3`;
                  const isPlaying = audioUrlPlaying === surah1Url;

                  return (
                    <tr key={reciter.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Reciter Name */}
                      <td className="py-4 px-6 font-bold text-white max-w-xs truncate">
                        <div className="flex items-center gap-2.5 justify-end">
                          <span>{reciter.name}</span>
                          <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                        </div>
                      </td>

                      {/* Reciter ID */}
                      <td className="py-4 px-6 text-white/40 font-mono select-all">
                        {reciter.id}
                      </td>

                      {/* mp3quran Server URL */}
                      <td className="py-4 px-6 text-white/40 font-mono select-all truncate max-w-sm" title={reciter.mp3quranServer}>
                        {reciter.mp3quranServer}
                      </td>

                      {/* Audio Play Preview */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => togglePlayAudio(reciter)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-wide transition-all ${
                            isPlaying 
                              ? "bg-primary text-black" 
                              : "bg-[#090a0f] border border-white/5 hover:border-white/10 text-white/80"
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                          <span>{isPlaying ? "جاري الاستماع..." : "استماع الفاتحة 🔈"}</span>
                        </button>
                      </td>

                      {/* Connection Status Badge */}
                      <td className="py-4 px-6 text-center">
                        {status === "working" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>شغال 🟢</span>
                          </span>
                        )}
                        {status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>معطل 🔴</span>
                          </span>
                        )}
                        {status === "checking" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold text-[10px] animate-pulse">
                            <RefreshCw className="w-3 h-3 shrink-0 animate-spin" />
                            <span>جاري الفحص...</span>
                          </span>
                        )}
                        {status === "unchecked" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 text-white/40 border border-white/10 rounded-full font-bold text-[10px]">
                            <HelpCircle className="w-3 h-3 shrink-0" />
                            <span>غير مفحوص</span>
                          </span>
                        )}
                      </td>

                      {/* Manual Action Check Button */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => checkReciterUrl(reciter)}
                          disabled={status === "checking"}
                          className="p-2 bg-[#090a0f] hover:bg-[#141622] border border-white/5 text-white/60 hover:text-white rounded-xl transition-all"
                          title="فحص الرابط"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredReciters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/20 font-bold">
                      لا يوجد قراء يطابقون بحثك.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* bottom helper info alert banner */}
        <div className="bg-[#0f1118] border border-white/5 p-6 rounded-[2.5rem] space-y-3 text-right">
          <h4 className="text-sm font-black text-white flex items-center gap-2 justify-end">
            <span>كيفية استخدام اللوحة لمراجعة ومطابقة الأصوات الأصيلة 💡</span>
            <Volume2 className="w-4 h-4 text-primary shrink-0" />
          </h4>
          <p className="text-white/40 text-xs leading-relaxed">
            1. اضغط أولاً على زر **"تنظيف وإصلاح ملف القراء والتكرارات ⚡"** في الأعلى ليقوم الخادم تلقائياً بحل التكرارات وإضافة شيوخ مصر الأعلام (عبد الباسط، المنشاوي، الحصري) بالنسخ المرتلة والمجودة.
            <br />
            2. استخدم خيار **"استماع الفاتحة 🔈"** لتشغيل المقطع الصوتي لأي شيخ؛ سيقوم المتصفح بتشغيل قراءة سورة الفاتحة من سيرفره مباشرة لتستمع إليه بأذنك وتتأكد أنه صوته الأصلي وليس صوتاً لشخص آخر.
            <br />
            3. لتتأكد من عمل الروابط وسيرفرات الصوت، اضغط على **"فحص اتصال جميع القراء تلقائياً 🌐"**؛ سيقوم التطبيق بإرسال طلبات فحص خلفية سريعة لجميع روابط القراء وتلوينها بالأخضر للروابط الفعالة وبالأحمر للروابط المتعطلة أو المحجوبة.
          </p>
        </div>

      </div>
    </div>
  );
}
