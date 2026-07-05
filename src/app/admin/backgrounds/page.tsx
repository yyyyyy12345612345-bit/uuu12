"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth, db, initFirebase } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { Trash, Lock, ArrowLeft, Loader2, Check, Video, Image as ImageIcon, Settings, X, Plus, Play, Save } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = "youssefosama@gmail.com";

export default function AdminBackgroundsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  // Add Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("طبيعة");
  const [type, setType] = useState<"video" | "image">("video");
  const [fileId, setFileId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"video" | "image">("video");
  const [editFileId, setEditFileId] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editFit, setEditFit] = useState<"cover" | "contain">("cover");

  // Video playback hover helper
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || "طبيعة");
    setEditType(item.type || "video");
    setEditFileId(item.fileId || "");
    setEditTagsInput(item.tags ? item.tags.join(", ") : "");
    setEditFit(item.fit || "cover");
    setIsEditOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingItem(null);
  };

  // Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim() || !editFileId.trim()) return;

    setUpdating(true);
    setMessage(null);

    try {
      const srcUrl = `/api/background/${editFileId.trim()}.mp4`;
      
      const tags = editTagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      if (!tags.includes(editCategory)) {
        tags.push(editCategory);
      }
      if (editType === "video" && !tags.includes("فيديو")) {
        tags.push("فيديو");
      } else if (editType === "image" && !tags.includes("صورة")) {
        tags.push("صورة");
      }

      const updatedData = {
        title: editTitle.trim(),
        type: editType,
        src: srcUrl,
        fileId: editFileId.trim(),
        category: editCategory,
        tags,
        fit: editFit,
      };

      await updateDoc(doc(db!, "backgrounds", editingItem.id), updatedData);
      setMessage({ text: "تم تحديث إعدادات الخلفية بنجاح!", type: "success" });
      closeEditModal();
      fetchItems();
    } catch (error: any) {
      console.error("Error updating background:", error);
      setMessage({ text: `فشل تعديل الخلفية: ${error.message}`, type: "error" });
    } finally {
      setUpdating(false);
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
      await deleteDoc(doc(db!, "backgrounds", id));
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
    <div className="min-h-screen bg-[#06070d] text-white p-6 md:p-12 font-arabic text-right selection:bg-[#fbbf24]/30 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Callout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-l from-white via-white/80 to-[#fbbf24] bg-clip-text text-transparent">إدارة خلفيات يقين السحابية</h1>
            <p className="text-white/50 text-xs font-bold">بوابة التحكم الذكية بالخلفيات والصور المخزنة عبر تليجرام</p>
          </div>
          <Link 
            href="/admin" 
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 self-start md:self-auto shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>لوحة تحكم الأدمن</span>
          </Link>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 justify-between animate-in slide-in-from-top-3 duration-300 ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-lg opacity-40 hover:opacity-100 transition animate-pulse">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add form */}
          <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-[2.5rem] p-8 space-y-6 shadow-2xl h-fit relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbbf24]/5 rounded-full filter blur-3xl pointer-events-none" />
            <h2 className="text-lg font-black border-b border-white/[0.06] pb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#fbbf24]" />
              <span>إضافة خلفية جديدة</span>
            </h2>

            <form onSubmit={handleAdd} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">اسم الخلفية *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="مثال: غيوم هادئة متسارعة" 
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition-all duration-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40">النوع *</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-zinc-955 border border-white/[0.08] rounded-2xl p-4 text-xs text-white outline-none text-right focus:border-[#fbbf24]/50 transition-all duration-300"
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
                    className="w-full bg-zinc-955 border border-white/[0.08] rounded-2xl p-4 text-xs text-white outline-none text-right focus:border-[#fbbf24]/50 transition-all duration-300"
                  >
                    <option value="طبيعة">طبيعة</option>
                    <option value="مساجد">مساجد</option>
                    <option value="بحار">بحار</option>
                    <option value="جبال">جبال</option>
                    <option value="غابات">غابات</option>
                    <option value="الثلج">الثلج</option>
                    <option value="غروب">غروب</option>
                    <option value="سماء">سماء</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">كود ملف تليجرام (file_id) *</label>
                <textarea 
                  value={fileId} 
                  onChange={e => setFileId(e.target.value)} 
                  placeholder="ألصق كود file_id الطويل للفيديو المرفوع للبوت" 
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition-all duration-300 font-mono"
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
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-xs text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition-all duration-300"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-xs hover:scale-[1.02] hover:shadow-lg hover:shadow-[#fbbf24]/20 active:scale-98 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
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
              <span className="text-white/40 text-xs font-bold bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">{items.length} خلفية مضافة</span>
              <h2 className="text-lg font-black">الخلفيات السحابية المضافة</h2>
            </div>

            {items.length === 0 ? (
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-12 text-center text-white/30 text-xs font-bold leading-loose">
                لا توجد خلفيات سحابية مضافة بعد. ارفع أول ملف تليجرام الآن!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/[0.02] border border-white/[0.05] hover:border-white/10 rounded-[2rem] overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative"
                  >
                    {/* Media Preview Box */}
                    <div className="h-44 bg-zinc-950 relative overflow-hidden group/preview border-b border-white/[0.05]">
                      {item.type === "video" ? (
                        <video 
                          src={item.src}
                          muted 
                          loop 
                          playsInline 
                          preload="none"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <img 
                          src={item.src} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          loading="lazy"
                        />
                      )}
                      
                      {/* Hover Overlay info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 pointer-events-none" />
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-white/70 font-black">
                          {item.category || "طبيعة"}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-[#fbbf24] font-black flex items-center gap-1">
                          {item.type === "video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {item.type === "video" ? "فيديو" : "صورة"}
                        </span>
                      </div>

                      {item.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover/preview:opacity-0 transition duration-300">
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white translate-x-[1px]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-black text-sm text-white truncate" title={item.title}>{item.title}</h3>
                        <p className="text-[10px] text-white/40 font-mono select-all truncate max-w-full" title={item.fileId}>
                          ID: {item.fileId}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] pt-4">
                        <div className="flex gap-2">
                          {/* Toggle Fit Button */}
                          <button 
                            onClick={() => handleToggleFit(item.id, item.fit || "cover")}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all duration-300 ${
                              item.fit === "contain" 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" 
                                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                            }`}
                            title="اضغط للتحويل بين الطبيعي (ملء) والعرضي (كامل)"
                          >
                            المظهر: {item.fit === "contain" ? "عرضي (كامل)" : "طبيعي (ملء)"}
                          </button>

                          {/* Quick Settings Gear */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-3 py-1.5 rounded-xl text-[9px] font-black border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-xl transition-all duration-300"
                            title="حذف الخلفية"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Settings Modal */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0b0c16] border border-white/[0.08] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 font-arabic text-right">
            
            {/* Close Button */}
            <button 
              onClick={closeEditModal}
              className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2 mb-6 border-b border-white/[0.06] pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#fbbf24]" />
                <span>إعدادات الخلفية</span>
              </h3>
              <p className="text-[10px] text-white/40 font-bold">تعديل جرافيك وشكل ومظهر الخلفية المحددة</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">اسم الخلفية *</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40">النوع *</label>
                  <select 
                    value={editType} 
                    onChange={e => setEditType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl p-3.5 text-xs text-white outline-none text-right focus:border-[#fbbf24]/50 transition"
                  >
                    <option value="video">فيديو</option>
                    <option value="image">صورة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40">القسم *</label>
                  <select 
                    value={editCategory} 
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-zinc-955 border border-white/[0.08] rounded-xl p-3.5 text-xs text-white outline-none text-right focus:border-[#fbbf24]/50 transition"
                  >
                    <option value="طبيعة">طبيعة</option>
                    <option value="مساجد">مساجد</option>
                    <option value="بحار">بحار</option>
                    <option value="جبال">جبال</option>
                    <option value="غابات">غابات</option>
                    <option value="الثلج">الثلج</option>
                    <option value="غروب">غروب</option>
                    <option value="سماء">سماء</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">المظهر (مهم لفيديوهات العرض) *</label>
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditFit("cover")}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${editFit === "cover" ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:text-white"}`}
                  >
                    طبيعي (ملء)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFit("contain")}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${editFit === "contain" ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:text-white"}`}
                  >
                    عرضي (كامل)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">كود ملف تليجرام (file_id) *</label>
                <textarea 
                  value={editFileId} 
                  onChange={e => setEditFileId(e.target.value)} 
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition font-mono text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/40">الكلمات المفتاحية (Tags)</label>
                <input 
                  type="text" 
                  value={editTagsInput} 
                  onChange={e => setEditTagsInput(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#fbbf24]/50 focus:bg-white/[0.05] transition text-right"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex-1 py-3.5 bg-[#fbbf24] text-black rounded-2xl font-black text-xs hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ التعديل...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={closeEditModal}
                  className="flex-1 py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs hover:bg-white/10 active:scale-98 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
