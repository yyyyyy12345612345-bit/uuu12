"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Camera, User, Phone, Calendar, 
  MapPin, Save, Loader2, CheckCircle, Image as ImageIcon, LogOut, Sparkles, ShieldCheck
} from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "الأقصر", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "جنوب سيناء", "كفر الشيخ", "مطروح", "قنا", "شمال سيناء", "سوهاج"
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    photoURL: "",
    phoneNumber: "",
    gender: "male" as "male" | "female"
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const AVATARS = {
    male: [
      "https://cdn3d.iconscout.com/3d/premium/thumb/man-avatar-6299539-5187871.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/boy-avatar-6299537-5187869.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/man-avatar-6299535-5187867.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/man-avatar-6299531-5187863.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/man-avatar-6299529-5187861.png"
    ],
    female: [
      "https://cdn3d.iconscout.com/3d/premium/thumb/woman-avatar-6299541-5187873.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/girl-avatar-6299533-5187865.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/woman-avatar-6299527-5187859.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/woman-avatar-6299525-5187857.png",
      "https://cdn3d.iconscout.com/3d/premium/thumb/woman-avatar-6299523-5187855.png"
    ]
  };

  useEffect(() => {
    if (isOpen && auth?.currentUser) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    if (!auth?.currentUser || !db) return;
    setLoading(true);
    try {
      const s = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (s.exists()) {
        const data = s.data();
        setFormData({
          displayName: data.displayName || "",
          username: data.username || "",
          photoURL: data.photoURL || "",
          phoneNumber: data.phoneNumber || "",
          gender: data.gender || "male"
        });
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        lastUpdated: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Error saving profile:", e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[2000] bg-black/90 backdrop-blur-2xl overflow-y-auto font-['Tajawal'] py-10 px-4 flex justify-center items-start no-scrollbar`}>
       <div className="fixed inset-0" onClick={onClose} />
       
       <div className="relative w-full max-w-2xl bg-[#0d1411] border border-white/5 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden">
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
          
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-3xl sticky top-0 z-50">
             <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                <X className="w-6 h-6" />
             </button>
             <div className="text-right">
                <h2 className="text-xl font-black text-white">الملف الشخصي</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">تخصيص هويتك الرقمية</p>
             </div>
          </div>

          <div className="p-10 relative z-10">
             {loading ? (
                <div className="py-24 flex flex-col items-center gap-6">
                   <Loader2 className="w-12 h-12 text-primary animate-spin" />
                   <p className="text-primary font-black text-xs uppercase tracking-[0.4em]">جاري التحميل</p>
                </div>
             ) : (
                <form onSubmit={handleSave} className="space-y-10">
                   {/* Avatar Selection */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                         <div className="w-1 h-1 rounded-full bg-primary" />
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">اختر الشخصية الرقمية</label>
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                         {AVATARS[formData.gender].map((url) => (
                            <button
                               key={url}
                               type="button"
                               onClick={() => setFormData(prev => ({ ...prev, photoURL: url }))}
                               className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500 ${formData.photoURL === url ? 'border-primary scale-110 shadow-2xl shadow-primary/20' : 'border-white/5 opacity-40 hover:opacity-100 hover:scale-105'}`}
                            >
                               <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                               {formData.photoURL === url && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                     <CheckCircle className="w-6 h-6 text-primary" />
                                  </div>
                               )}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Display Name */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                           <div className="w-1 h-1 rounded-full bg-primary" />
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">الاسم بالكامل</label>
                         </div>
                         <div className="relative">
                           <input 
                               required
                               value={formData.displayName}
                               onChange={e => setFormData({...formData, displayName: e.target.value})}
                               className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-lg font-bold text-white shadow-xl"
                           />
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                         </div>
                      </div>

                      {/* Username (Read Only for safety, or allow change if unique) */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                           <div className="w-1 h-1 rounded-full bg-primary" />
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">اسم المستخدم</label>
                         </div>
                         <div className="relative">
                           <input 
                               disabled
                               value={formData.username}
                               className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none opacity-50 cursor-not-allowed font-mono text-white"
                           />
                           <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Phone */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">رقم التواصل</label>
                         </div>
                         <div className="relative">
                            <input 
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono text-white"
                            />
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                         </div>
                      </div>

                      {/* Gender */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">الجنس</label>
                         </div>
                         <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/5">
                            <button
                               type="button"
                               onClick={() => setFormData(prev => ({ ...prev, gender: "male" }))}
                               className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "male" ? "bg-primary text-black" : "text-white/20"}`}
                            >
                               ذكر
                            </button>
                            <button
                               type="button"
                               onClick={() => setFormData(prev => ({ ...prev, gender: "female" }))}
                               className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "female" ? "bg-primary text-black" : "text-white/20"}`}
                            >
                               أنثى
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 space-y-6">
                      <button 
                        type="submit" 
                        disabled={saving || success}
                        className={`w-full py-6 rounded-[2rem] font-black text-lg transition-all duration-700 flex items-center justify-center gap-4 shadow-2xl ${
                          success 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-primary text-black hover:scale-[1.03] active:scale-95 shadow-primary/20'
                        }`}
                      >
                         {saving ? (
                            <Loader2 className="w-7 h-7 animate-spin" />
                         ) : success ? (
                            <CheckCircle className="w-7 h-7 animate-bounce" />
                         ) : (
                            <Save className="w-7 h-7" />
                         )}
                         {success ? 'تم تحديث الهوية بنجاح' : 'حفظ التعديلات'}
                      </button>

                      <div className="h-px bg-white/5 w-full" />

                      <button 
                        type="button"
                        onClick={async () => {
                            if (window.confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {
                               await auth.signOut();
                               onClose();
                               window.location.href = "/";
                            }
                        }}
                        className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-red-400 bg-red-400/5 border border-red-400/10 hover:bg-red-400 hover:text-white transition-all flex items-center justify-center gap-3"
                      >
                         <LogOut className="w-5 h-5" />
                         تسجيل الخروج الآمن
                      </button>
                   </div>
                </form>
             )}
          <div className="p-8 border-t border-white/5 text-center bg-black/40">
             <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">الإصدار العالمي الفائق v4.0</span>
          </div>
       </div>
    </div>
    </div>
  );
}
