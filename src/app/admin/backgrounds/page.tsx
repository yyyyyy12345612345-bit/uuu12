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
          const emailLower = user?.email?.toLowerCase() || "";
          // Removed displayName check
          if (user && (
            emailLower === "youssefosama@gmail.com" ||
            emailLower === "youssef@yaqeen.app" ||
            emailLower.includes("youssef")
          )) {
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

  // Enable scrolling for this page (bypassing global.css overflow: hidden)
  useEffect(() => {
    document.documentElement.style.setProperty("overflow", "auto", "important");
    document.documentElement.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("overflow", "auto", "important");
    document.body.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("position", "static", "important");

    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("height");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("position");
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

  // عرض مؤشر التحميل أثناء التحقق من الصلاحيات
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-arabic">
        <Loader2 className="w-10 h-10 text-[#fbbf24] animate-spin mb-4" />
        <p className="text-slate-500 text-sm">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-800 font-arabic">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black mb-2">غير مصرح بالدخول</h1>
        <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
          هذه الصفحة مخصصة للأدمن فقط. يرجى تسجيل الدخول بحساب الأدمن للوصول.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-slate-200/50 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200/80 text-slate-700 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-50 text-slate-800 p-6 md:p-12 font-arabic text-right selection:bg-[#fbbf24]/30 selection:text-black scroll-smooth">
      <div className="max-w-7xl mx-auto space-y-12 pb-16">
        {/* Header Callout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-l from-slate-900 via-slate-800 to-[#d97706] bg-clip-text text-transparent">إدارة خلفيات يقين السحابية</h1>
            <p className="text-slate-500 text-xs font-bold">بوابة التحكم الذكية بالخلفيات والصور المخزنة عبر تليجرام</p>
          </div>
          <Link 
            href="/admin" 
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 flex items-center gap-2 self-start md:self-auto shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>لوحة تحكم الأدمن</span>
          </Link>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 justify-between animate-in slide-in-from-top-3 duration-300 ${
            message.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-lg opacity-40 hover:opacity-100 transition">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add form */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-xl shadow-slate-100/40 h-fit relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbbf24]/10 rounded-full filter blur-3xl pointer-events-none" />
            <h2 className="text-lg font-black border-b border-slate-100 pb-4 flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-[#d97706]" />
              <span>إضافة خلفية جديدة</span>
            </h2>

            <form onSubmit={handleAdd} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">اسم الخلفية *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="مثال: غيوم هادئة متسارعة" 
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 outline-none placeholder:text-slate-400 text-right focus:border-[#fbbf24]/50 focus:bg-white focus:shadow-sm transition-all duration-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">النوع *</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 outline-none text-right focus:border-[#fbbf24]/50 focus:bg-white focus:shadow-sm transition-all duration-300"
                  >
                    <option value="video">فيديو</option>
                    <option value="image">صورة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">القسم *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 outline-none text-right focus:border-[#fbbf24]/50 focus:bg-white focus:shadow-sm transition-all duration-300"
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
                <label className="text-xs font-black text-slate-500">كود ملف تليجرام (file_id) *</label>
                <textarea 
                  value={fileId} 
                  onChange={e => setFileId(e.target.value)} 
                  placeholder="ألصق كود file_id الطويل للفيديو المرفوع للبوت" 
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 outline-none placeholder:text-slate-400 text-right focus:border-[#fbbf24]/50 focus:bg-white focus:shadow-sm transition-all duration-300 font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">الكلمات المفتاحية (Tags)</label>
                <input 
                  type="text" 
                  value={tagsInput} 
                  onChange={e => setTagsInput(e.target.value)} 
                  placeholder="افصل بفاصلة: هادئ, بحر, سماء" 
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 outline-none placeholder:text-slate-400 text-right focus:border-[#fbbf24]/50 focus:bg-white focus:shadow-sm transition-all duration-300"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 rounded-2xl font-black text-xs hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 active:scale-98 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
              <span className="text-slate-500 text-xs font-bold bg-slate-100 border border-slate-200/50 px-3 py-1.5 rounded-full">{items.length} خلفية مضافة</span>
              <h2 className="text-lg font-black text-slate-950">الخلفيات السحابية المضافة</h2>
            </div>

            {items.length === 0 ? (
              <div className="bg-slate-100/50 border border-slate-200/60 rounded-[2rem] p-12 text-center text-slate-400 text-xs font-bold leading-loose">
                لا توجد خلفيات سحابية مضافة بعد. ارفع أول ملف تليجرام الآن!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-200/80 transition-all duration-500 group relative"
                  >
                    {/* Media Preview Box */}
                    <div className="aspect-[9/16] bg-slate-100 relative overflow-hidden group/preview border-b border-slate-100">
                      {item.type === "video" ? (
                        <video 
                          src={item.src}
                          muted 
                          loop 
                          playsInline 
                          preload="none"
                          className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                            item.fit === "contain" ? "object-contain bg-slate-950" : "object-cover"
                          }`}
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
                          className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                            item.fit === "contain" ? "object-contain bg-slate-950" : "object-cover"
                          }`} 
                          loading="lazy"
                        />
                      )}
                      
                      {/* Hover Overlay info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 pointer-events-none" />
                      
                      <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-white/70 font-black">
                          {item.category || "طبيعة"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-[#fbbf24] font-black flex items-center gap-1">
                          {item.type === "video" ? <Video className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
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
                    <div className="p-4 md:p-5 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-black text-xs md:text-sm text-slate-800 truncate" title={item.title}>{item.title}</h3>
                        <p className="text-[10px] text-slate-400 font-mono select-all truncate max-w-full" title={item.fileId}>
                          ID: {item.fileId}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Toggle Fit Button */}
                          <button 
                            onClick={() => handleToggleFit(item.id, item.fit || "cover")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all duration-300 cursor-pointer ${
                              item.fit === "contain" 
                                ? "bg-amber-50/80 border-amber-100 text-amber-700 hover:bg-amber-100/80" 
                                : "bg-slate-50 border border-slate-200/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                            title="اضغط للتحويل بين الطبيعي (ملء) والعرضي (كامل)"
                          >
                            {item.fit === "contain" ? "عرضي (كامل)" : "طبيعي (ملء)"}
                          </button>

                          {/* Quick Settings Gear */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black border border-slate-200/60 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>تعديل</span>
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50/50 border border-transparent hover:border-red-100 rounded-xl transition-all duration-300 cursor-pointer"
                          title="حذف الخلفية"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
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
      {isEditOpen && !!editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white border border-slate-100 w-full rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 font-arabic text-right"
            style={{ maxWidth: "520px" }}
          >
            
            {/* Close Button */}
            <button 
              onClick={closeEditModal}
              className="absolute top-6 left-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer border border-slate-200/40"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Settings className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-right">
                <h3 className="text-lg font-black text-slate-900">إعدادات الخلفية</h3>
                <p className="text-[10px] text-slate-400 font-bold">تعديل جرافيك وشكل ومظهر الخلفية المحددة</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">اسم الخلفية *</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-[#fbbf24] focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all duration-300 text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">النوع *</label>
                  <select 
                    value={editType} 
                    onChange={e => setEditType(e.target.value as "video" | "image")}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-800 outline-none text-right focus:border-[#fbbf24] focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all duration-300"
                  >
                    <option value="video">فيديو</option>
                    <option value="image">صورة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500">القسم *</label>
                  <select 
                    value={editCategory} 
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-800 outline-none text-right focus:border-[#fbbf24] focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all duration-300"
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
                <label className="text-xs font-black text-slate-500">المظهر (مهم لفيديوهات العرض) *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setEditFit("cover")}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${editFit === "cover" ? "bg-[#fbbf24] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    طبيعي (ملء)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFit("contain")}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${editFit === "contain" ? "bg-[#fbbf24] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    عرضي (كامل)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">كود ملف تليجرام (file_id) *</label>
                <textarea 
                  value={editFileId} 
                  onChange={e => setEditFileId(e.target.value)} 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-[#fbbf24] focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all duration-300 font-mono text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">الكلمات المفتاحية (Tags)</label>
                <input 
                  type="text" 
                  value={editTagsInput} 
                  onChange={e => setEditTagsInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-[#fbbf24] focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all duration-300 text-right"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex-[2] py-4 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 rounded-2xl font-black text-xs hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                  className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 hover:text-slate-800 active:scale-98 transition duration-300 cursor-pointer"
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
