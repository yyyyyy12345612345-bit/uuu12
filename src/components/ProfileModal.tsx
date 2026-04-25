"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Camera, User, Phone, Calendar, 
  MapPin, Save, Loader2, CheckCircle, Image as ImageIcon
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "dtuyo4gqm";
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // Change this if you have a custom one

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
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setFormData({ ...formData, photoURL: fileData.secure_url });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء رفع الصورة، تأكد من إعدادات Cloudinary");
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 font-arabic">
       {/* Backdrop */}
       <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
       
       <div className="relative w-full max-w-xl bg-background border border-border rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="p-8 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
             <button onClick={onClose} className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                <X className="w-6 h-6" />
             </button>
             <h2 className="text-2xl font-black text-foreground">تعديل الملف الشخصي</h2>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12">
             {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                   <Loader2 className="w-10 h-10 text-primary animate-spin" />
                   <p className="text-foreground/40 font-bold">جاري تحميل بياناتك..</p>
                </div>
             ) : (
                <form onSubmit={handleSave} className="space-y-8 pb-10">
                   
                   {/* Photo Selection */}
                   <div className="flex flex-col items-center gap-6 mb-10">
                      <div className="relative group">
                         <div className={`w-32 h-32 rounded-[2.5rem] border-4 ${uploading ? 'border-primary animate-pulse' : 'border-primary/20'} p-1 bg-background relative overflow-hidden shadow-2xl`}>
                            <img 
                              src={formData.photoURL || "/logo/logo.png"} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-[2rem]" 
                            />
                            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                               {uploading ? (
                                 <Loader2 className="w-8 h-8 text-white animate-spin" />
                               ) : (
                                 <>
                                   <Camera className="w-8 h-8 text-white" />
                                   <span className="text-[8px] text-white font-black mt-1 uppercase">تغيير الصورة</span>
                                 </>
                               )}
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 onChange={handleFileUpload} 
                                 disabled={uploading}
                               />
                            </label>
                         </div>
                      </div>
                      <p className="text-[10px] text-foreground/40 font-bold font-arabic">اضغط على الصورة لتغييرها (Cloudinary)</p>
                   </div>

                   {/* Display Name (Emojis allowed) */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                         اسم الحساب (مسموح بالزخرفة والإيموجي)
                         <User className="w-3 h-3" />
                      </label>
                      <input 
                        required
                        value={formData.displayName}
                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                        className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all text-xl font-bold"
                        placeholder="مثلاً: خادم القرآن ❤️✨"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Phone */}
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                            رقم الهاتف
                            <Phone className="w-3 h-3" />
                         </label>
                         <input 
                           type="tel"
                           value={formData.phoneNumber}
                           onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                           className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all font-mono"
                           placeholder="0123456789"
                         />
                      </div>

                      {/* Birthday */}
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                            تاريخ الميلاد
                            <Calendar className="w-3 h-3" />
                         </label>
                         <input 
                           type="date"
                           value={formData.birthday}
                           onChange={e => setFormData({...formData, birthday: e.target.value})}
                           className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all"
                         />
                      </div>
                   </div>

                   {/* Governorate */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                         المحافظة
                         <MapPin className="w-3 h-3" />
                      </label>
                      <select 
                        value={formData.governorate}
                        onChange={e => setFormData({...formData, governorate: e.target.value})}
                        className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all appearance-none font-bold"
                      >
                         {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                   </div>

                   <button 
                     type="submit" 
                     disabled={saving || success}
                     className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                       success 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-primary text-black hover:scale-[1.02] active:scale-95 shadow-primary/20'
                     }`}
                   >
                      {saving ? (
                         <Loader2 className="w-6 h-6 animate-spin" />
                      ) : success ? (
                         <CheckCircle className="w-6 h-6 animate-bounce" />
                      ) : (
                         <Save className="w-6 h-6" />
                      )}
                      {success ? 'تم حفظ التعديلات بنجاح' : 'حفظ التغييرات'}
                   </button>
                </form>
             )}
          </div>
       </div>
    </div>
  );
}
