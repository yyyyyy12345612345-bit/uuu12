"use client";

import React, { useState, useEffect } from "react";
import { Star, ArrowUpRight, Play, Users, Plus, X, Video, Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";

export function CommunityShowcase() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [surahName, setSurahName] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchShowcase = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "showcase"), orderBy("createdAt", "desc"), limit(12));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcase();
  }, []);

  // Prefill user name on modal open if logged in
  useEffect(() => {
    if (showModal && auth?.currentUser) {
      setUserName(auth.currentUser.displayName || "");
    }
  }, [showModal]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !videoUrl.trim() || !surahName.trim() || !userName.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "showcase"), {
        videoUrl: videoUrl.trim(),
        userName: userName.trim(),
        surahName: surahName.trim(),
        createdAt: serverTimestamp()
      });
      alert("✅ تم نشر الفيديو الخاص بك بنجاح في المعرض!");
      setShowModal(false);
      setVideoUrl("");
      setSurahName("");
      setUserName("");
      fetchShowcase();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إضافة الفيديو");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAddClick = () => {
    if (!auth?.currentUser) {
      alert("⚠️ يجب عليك تسجيل الدخول أولاً لتتمكن من إضافة فيديو إلى المعرض.");
      window.dispatchEvent(new CustomEvent("show_auth_gate"));
      return;
    }
    setShowModal(true);
  };

  if (loading) return null;

  return (
    <section className="py-24 relative overflow-hidden text-right" dir="rtl">
       {/* Background Aesthetics */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
       </div>

       <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 mb-16">
             <div className="text-right flex-1">
                <div className="flex items-center justify-start md:justify-end gap-3 mb-4">
                   <span className="bg-primary/20 text-primary text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 uppercase tracking-[0.3em]">Community Spirit</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">معرض المبدعين</h2>
                <p className="text-foreground/40 font-bold text-lg max-w-2xl">استلهم من فيديوهات المجتمع وشاركنا إبداعك في نشر كتاب الله.</p>
             </div>
             
             <div className="flex items-center gap-4">
                <button
                   onClick={triggerAddClick}
                   className="px-6 py-3.5 bg-gradient-to-r from-primary to-amber-500 text-black font-black text-sm rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
                >
                   <Plus className="w-4 h-4" />
                   <span>إضافة فيديو للمعرض</span>
                </button>

                <div className="flex flex-col items-center gap-1 bg-card border border-border p-4 px-6 rounded-2xl shadow-xl">
                   <Users className="w-5 h-5 text-primary" />
                   <span className="text-xl font-black">{items.length}</span>
                   <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">فيديو منشور</span>
                </div>
             </div>
          </div>

          {items.length === 0 ? (
             <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-16 text-center shadow-xl max-w-xl mx-auto flex flex-col items-center gap-4">
                <Video className="w-12 h-12 text-foreground/20" />
                <h3 className="text-xl font-black text-foreground/80">لا توجد فيديوهات منشورة حالياً</h3>
                <p className="text-sm text-foreground/40 font-bold leading-relaxed">
                   كن أول من يشارك إبداعاته وتصميماته القرآنية مع مجتمع يقين من خلال الضغط على زر الإضافة بالرأس.
                </p>
                <button
                   onClick={triggerAddClick}
                   className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                >
                   انشر أول فيديو الآن 🎬
                </button>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item, i) => (
                   <div 
                     key={item.id} 
                     className="group relative bg-card border border-border rounded-[3rem] overflow-hidden hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl animate-in fade-in"
                     style={{ animationDelay: `${i * 100}ms` }}
                   >
                      <div className="aspect-[9/16] relative bg-zinc-900 overflow-hidden">
                         {/* Thumbnail Placeholder / Video Link */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform duration-500">
                               <Play className="w-8 h-8 text-primary fill-primary" />
                            </div>
                         </div>
                         
                         {/* Content Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-right">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{item.surahName}</p>
                            <h3 className="text-2xl font-black text-white mb-4 line-clamp-1">{item.surahName}</h3>
                            <div className="flex items-center justify-between">
                               <a 
                                 href={item.videoUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
                               >
                                  مشاهدة الفيديو <ArrowUpRight className="w-4 h-4" />
                               </a>
                               <span className="text-white/40 text-[10px] font-bold">بواسطة: {item.userName}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       {/* Form Modal */}
       {showModal && (
          <div className="fixed inset-0 z-[10010] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                   onClick={() => setShowModal(false)}
                   className="absolute top-4 left-4 p-2 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                   <X className="w-4 h-4" />
                </button>

                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2 justify-start">
                   <Video className="w-5 h-5 text-primary animate-pulse" />
                   <span>مشاركة فيديو في المعرض</span>
                </h3>
                <p className="text-xs text-white/40 mb-6 font-bold">انشر روابط فيديوهاتك المصممة لنشر الخير وتزيين المعرض.</p>

                <form onSubmit={handleAddVideo} className="space-y-4 text-right">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 block">رابط الفيديو (رابط تحميل، تيك توك، يوتيوب، أو Vercel):</label>
                      <input
                         type="url"
                         required
                         value={videoUrl}
                         onChange={(e) => setVideoUrl(e.target.value)}
                         placeholder="https://..."
                         dir="ltr"
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 block">اسم السورة أو عنوان المنشور:</label>
                      <input
                         type="text"
                         required
                         value={surahName}
                         onChange={(e) => setSurahName(e.target.value)}
                         placeholder="مثال: سورة البقرة"
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/50 transition-all font-bold"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 block">اسمك للظهور كناشر:</label>
                      <input
                         type="text"
                         required
                         value={userName}
                         onChange={(e) => setUserName(e.target.value)}
                         placeholder="اسمك الكريم"
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/50 transition-all font-bold"
                      />
                   </div>

                   <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-primary to-amber-500 text-black font-black text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-55 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg"
                   >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "نشر الفيديو الآن 🚀"}
                   </button>
                </form>
             </div>
          </div>
       )}
    </section>
  );
}
