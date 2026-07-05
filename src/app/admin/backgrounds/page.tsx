"use client";

import React, { useState, useEffect } from "react";
import { auth, db, initFirebase } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { Trash, Lock, ArrowLeft, Loader2, Check, Video, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = "youssefosama@gmail.com";

export default function AdminBackgroundsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("طبيعة");
  const [type, setType] = useState<"video" | "image">("video");
  const [fileId, setFileId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let active = true;
    let unsub: any = null;

    initFirebase().then(() => {
      unsub = onAuthStateChanged(auth, (user) => {
        if (active) {
          if (user && user.email === ADMIN_EMAIL) {
            setIsAdmin(true);
            fetchItems();
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        }
      });
    });

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);

  const fetchItems = async () => {
    try {
      if (!db) return;
      const q = query(collection(db, "backgrounds"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetched: any[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setItems(fetched);
    } catch (e) {
      console.error("Error fetching backgrounds:", e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileId.trim()) {
      setMessage({ text: "يرجى ملء جميع الحقول المطلوبة.", type: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const srcUrl = `/api/background/${fileId.trim()}.mp4`;
      
      const tags = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      if (!tags.includes(category)) {
        tags.push(category);
      }
      if (type === "video" && !tags.includes("فيديو")) {
        tags.push("فيديو");
      } else if (type === "image" && !tags.includes("صورة")) {
        tags.push("صورة");
      }

      const itemData = {
        title: title.trim(),
        type,
        src: srcUrl,
        fileId: fileId.trim(),
        category,
        tags,
        fit: "cover",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "backgrounds"), itemData);
      
      setMessage({ text: "تمت إضافة الخلفية بنجاح!", type: "success" });
      setTitle("");
      setFileId("");
      setTagsInput("");
      fetchItems();
    } catch (error: any) {
      console.error("Error adding background:", error);
      setMessage({ text: `حدث خطأ أثناء الحفظ: ${error.message}`, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFit = async (id: string, currentFit: string) => {
    try {
      if (!db) return;
      const nextFit = currentFit === "contain" ? "cover" : "contain";
      await updateDoc(doc(db, "backgrounds", id), { fit: nextFit });
      fetchItems();
    } catch (error: any) {
      console.error("Error toggling aspect fit:", error);
      setMessage({ text: `فشل تعديل المظهر: ${error.message}`, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخلفية؟")) return;

    try {
      await deleteDoc(doc(db, "backgrounds", id));
      setMessage({ text: "تم حذف الخلفية بنجاح.", type: "success" });
      fetchItems();
    } catch (error: any) {
      console.error("Error deleting background:", error);
      setMessage({ text: `فشل الحذف: ${error.message}`, type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060a] flex flex-col items-center justify-center text-white font-arabic">
        <Loader2 className="w-10 h-10 text-[#fbbf24] animate-spin mb-4" />
        <p className="text-white/60 text-sm">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#05060a] flex flex-col items-center justify-center p-6 text-center text-white font-arabic">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black mb-2">غير مصرح بالدخول</h1>
        <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
          هذه الصفحة مخصصة للأدمن فقط. يرجى تسجيل الدخول بحساب الأدمن للوصول.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white p-6 md:p-12 font-arabic text-right selection:bg-[#fbbf24]/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">إدارة الخلفيات السحابية</h1>
            <p className="text-white/40 text-xs font-bold">تخزين واستدعاء الفيديوهات عبر تليجرام</p>
          </div>
          <Link 
            href="/admin" 
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition flex items-center gap-2 self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>لوحة تحكم الأدمن</span>
          </Link>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-3 justify-between ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-40 hover:opacity-100">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add form */}
          <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-8 space-y-6">
            <h2 className="text-base font-black border-b border-white/5 pb-3">إضافة خلفية جديدة</h2>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">اسم الخلفية *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="مثال: غيوم هادئة متسارعة" 
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40">النوع *</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-white/[0.06] rounded-xl p-3.5 text-xs text-white outline-none text-right focus:border-[#fbbf24]/40 transition"
                  >
                    <option value="video">فيديو</option>
                    <option value="image">صورة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40">القسم *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/[0.06] rounded-xl p-3.5 text-xs text-white outline-none text-right focus:border-[#fbbf24]/40 transition"
                  >
                    <option value="مساجد">مساجد</option>
                    <option value="بحار">بحار</option>
                    <option value="جبال">جبال</option>
                    <option value="غابات">غابات</option>
                    <option value="الثلج">الثلج</option>
                    <option value="غروب">غروب</option>
                    <option value="سماء">سماء</option>
                    <option value="طبيعة">طبيعة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">كود ملف تليجرام (file_id) *</label>
                <textarea 
                  value={fileId} 
                  onChange={e => setFileId(e.target.value)} 
                  placeholder="ألصق كود file_id الطويل هنا" 
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">الكلمات المفتاحية (Tags)</label>
                <input 
                  type="text" 
                  value={tagsInput} 
                  onChange={e => setTagsInput(e.target.value)} 
                  placeholder="افصل بفاصلة: هادئ, بحر, سماء" 
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-[#fbbf24] text-black rounded-xl font-black text-xs hover:brightness-110 active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>إضافة الخلفية</span>
                )}
              </button>
            </form>
          </div>

          {/* List of items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs font-bold">{items.length} خلفية مضافة</span>
              <h2 className="text-base font-black">الخلفيات السحابية المضافة</h2>
            </div>

            {items.length === 0 ? (
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-12 text-center text-white/30 text-xs font-bold leading-loose">
                لا توجد خلفيات سحابية مضافة بعد. ارفع أول ملف تليجرام الآن!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/10 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] text-white/50 font-bold">
                          {item.type === "video" ? "فيديو" : "صورة"}
                        </span>
                        <h3 className="font-bold text-xs text-white">{item.title}</h3>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => handleToggleFit(item.id, item.fit || "cover")}
                          className={`px-2 py-1 rounded-md text-[9px] font-bold border transition ${
                            item.fit === "contain" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" 
                              : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          المظهر: {item.fit === "contain" ? "عرضي (كامل)" : "طبيعي (ملء)"}
                        </button>
                        
                        <div className="flex flex-wrap gap-1 justify-end">
                          {item.tags?.map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[#fbbf24]/5 border border-[#fbbf24]/10 text-[9px] text-[#fbbf24] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                      
                      <span className="text-[10px] text-white/30 font-mono select-all truncate max-w-[12rem] cursor-pointer" title={item.fileId}>
                        file_id: {item.fileId.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
