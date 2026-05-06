"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Camera, User, Phone, Calendar, 
  MapPin, Save, Loader2, CheckCircle, Image as ImageIcon, LogOut, Sparkles, ShieldCheck
} from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["arabic"],
});

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "الأقصر", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "جنوب سيناء", "كفر الشيخ", "مطروح", "قنا", "شمال سيناء", "سوهاج"
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    photoURL: "",
    phoneNumber: "",
    birthday: "",
    governorate: ""
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploading(false);
    }
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
          photoURL: data.photoURL || "",
          phoneNumber: data.phoneNumber || "",
          birthday: data.birthday || "",
          governorate: data.governorate || GOVERNORATES[0]
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
    <div className={`fixed inset-0 z-[2000] bg-black/90 backdrop-blur-2xl overflow-y-auto ${tajawal.className} py-10 px-4 flex justify-center items-start no-scrollbar`}>
       <div className="fixed inset-0" onClick={onClose} />
       
       <div className="relative w-full max-w-xl bg-[#064E3B] border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden">
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
                   {/* Avatar Upload */}
                   <div className="flex flex-col items-center gap-6 mb-4">
                      <div className="relative group">
                         <div className={`w-32 h-32 rounded-[2.5rem] border-4 ${uploading ? 'border-primary animate-pulse' : 'border-white/10'} p-1 bg-black/40 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}>
                            <img 
                              src={formData.photoURL || "/logo/logo.png"} 
                              alt="Profile" 
                              className="w-full h-full object-cover rounded-[2rem]" 
                            />
                            <label className="absolute inset-0 bg-primary/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                               {uploading ? (
                                 <Loader2 className="w-10 h-10 text-black animate-spin" />
                               ) : (
                                 <>
                                   <Camera className="w-10 h-10 text-black" />
                                   <span className="text-[9px] text-black font-black mt-2 uppercase tracking-widest">تحديث الصورة</span>
                                 </>
                               )}
                               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                         </div>
                         <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-black flex items-center justify-center shadow-xl">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                         </div>
                      </div>
                   </div>

                   {/* Display Name */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">الاسم المستعار</label>
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

                   {/* Phone & Birthday */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">تاريخ الميلاد</label>
                         </div>
                         <div className="relative">
                            <input 
                                type="date"
                                value={formData.birthday}
                                onChange={e => setFormData({...formData, birthday: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white"
                            />
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                         </div>
                      </div>
                   </div>

                   {/* Governorate */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                         <div className="w-1 h-1 rounded-full bg-primary" />
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">الموقع الجغرافي</label>
                      </div>
                      <div className="relative">
                        <select 
                            value={formData.governorate}
                            onChange={e => setFormData({...formData, governorate: e.target.value})}
                            className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none font-bold text-white shadow-xl"
                        >
                            {GOVERNORATES.map(g => <option key={g} value={g} className="bg-[#064E3B] text-white">{g}</option>)}
                        </select>
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40 w-5 h-5" />
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
          </div>
       </div>
    </div>
  );
}
