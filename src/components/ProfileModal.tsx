"use client";

import React, { useState, useEffect } from "react";
import {
   X, Camera, User, Phone, Calendar,
   MapPin, Save, Loader2, CheckCircle, Image as ImageIcon, LogOut, ShieldCheck,
   BookOpen, Headphones, Trophy, PlayCircle, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface ProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
   const [formData, setFormData] = useState({
      displayName: "",
      username: "",
      photoURL: "",
      phoneNumber: "",
      gender: "male" as "male" | "female",
      country: "مصر"
   });
   const [userStats, setUserStats] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [success, setSuccess] = useState(false);

   const AVATARS = {
      male: [
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Ali&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Hassan&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaid&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Mustafa&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Youssef&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Karim&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Amr&top=theCaesar&facialHairProbability=100&accessoriesProbability=0"
      ],
      female: [
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Aisha&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Mariam&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Khadija&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaynab&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Sara&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Layla&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Hana&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Nour&top=hijab&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Amira&top=hijab&accessoriesProbability=0"
      ]
   };

   const ARAB_COUNTRIES = [
      { name: "مصر", flag: "🇪🇬" },
      { name: "السعودية", flag: "🇸🇦" },
      { name: "الإمارات", flag: "🇦🇪" },
      { name: "الكويت", flag: "🇰🇼" },
      { name: "المغرب", flag: "🇲🇦" },
      { name: "الجزائر", flag: "🇩🇿" },
      { name: "تونس", flag: "🇹🇳" },
      { name: "الأردن", flag: "🇯🇴" },
      { name: "فلسطين", flag: "🇵🇸" },
      { name: "قطر", flag: "🇶🇦" },
      { name: "عمان", flag: "🇴🇲" },
      { name: "البحرين", flag: "🇧🇭" },
      { name: "العراق", flag: "🇮🇶" },
      { name: "سوريا", flag: "🇸🇾" },
      { name: "لبنان", flag: "🇱🇧" },
      { name: "اليمن", flag: "🇾🇪" },
      { name: "ليبيا", flag: "🇱🇾" },
      { name: "السودان", flag: "🇸🇩" },
      { name: "موريتانيا", flag: "🇲🇷" },
      { name: "الصومال", flag: "🇸🇴" },
      { name: "جيبوتي", flag: "🇩🇯" },
      { name: "جزر القمر", flag: "🇰🇲" },
      { name: "أخرى", flag: "🌍" }
   ];

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
            setUserStats(data);
            setFormData({
               displayName: data.displayName || "",
               username: data.username || "",
               photoURL: data.photoURL || "",
               phoneNumber: data.phoneNumber || "",
               gender: data.gender || "male",
               country: data.country || data.governorate || "مصر"
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

         <div className="relative w-full max-w-2xl bg-[#0a0a0d] border border-white/5 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden">
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
                  <div className="space-y-10">
                     {/* User Stats Dashboard */}
                     {userStats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                 <Trophy className="w-5 h-5" />
                              </div>
                              <div>
                                 <span className="block text-2xl font-black text-white">{userStats.totalPoints || 0}</span>
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1 block">إجمالي النقاط</span>
                              </div>
                           </div>
                           
                           <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                 <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                 <span className="block text-2xl font-black text-white">{userStats.readAyahs || 0}</span>
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1 block">آيات قُرئت</span>
                              </div>
                           </div>
                           
                           <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                 <Headphones className="w-5 h-5" />
                              </div>
                              <div>
                                 <span className="block text-2xl font-black text-white">{Math.floor((userStats.audioSeconds || 0) / 60)}</span>
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1 block">دقائق استماع</span>
                              </div>
                           </div>
                           
                           <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                 <PlayCircle className="w-5 h-5" />
                              </div>
                              <div>
                                 <span className="block text-2xl font-black text-white">{userStats.completedSurahs?.length || 0}</span>
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1 block">سور مكتملة</span>
                              </div>
                           </div>
                        </div>
                     )}

                  <form onSubmit={handleSave} className="space-y-10">
                     {/* Avatar Selection */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                           <div className="w-1 h-1 rounded-full bg-primary" />
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">اختر الشخصية الرقمية</label>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                           {AVATARS[formData.gender].map((url) => (
                              <button
                                 key={url}
                                 type="button"
                                 onClick={() => setFormData(prev => ({ ...prev, photoURL: url }))}
                                 className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 ${formData.photoURL === url ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                              >
                                 <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                                 {formData.photoURL === url && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                       <CheckCircle className="w-5 h-5 text-primary" />
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
                                 onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                 className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-lg font-bold text-white shadow-xl"
                              />
                              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                           </div>
                        </div>

                        {/* Username (Read Only) */}
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
                                 onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                 className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono text-white"
                              />
                              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5" />
                           </div>
                        </div>

                        {/* Country */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 px-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">الدولة</label>
                           </div>
                           <div className="relative z-50">
                              <CountrySelectProfile 
                                 value={formData.country} 
                                 onChange={(val) => setFormData({...formData, country: val})} 
                                 countries={ARAB_COUNTRIES} 
                              />
                           </div>
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

                     <div className="pt-6 space-y-6">
                        <button
                           type="submit"
                           disabled={saving || success}
                           className={`w-full py-6 rounded-[2rem] font-black text-lg transition-all duration-700 flex items-center justify-center gap-4 shadow-2xl ${success
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
                  </div>
               )}
               <div className="p-8 border-t border-white/5 text-center bg-black/40">
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">الإصدار العالمي الفائق V 7</span>
               </div>
            </div>
         </div>
      </div>
   );
}

function CountrySelectProfile({ value, onChange, countries }: { value: string, onChange: (val: string) => void, countries: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = countries.find(c => c.name === value) || countries[0];

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border-2 ${isOpen ? 'border-primary/50 bg-white/10' : 'border-white/5'} rounded-2xl py-5 px-8 text-right outline-none transition-all cursor-pointer text-white shadow-xl flex items-center justify-between group`}
      >
        <div className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-primary' : 'text-white/10 group-hover:text-primary/50'}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-3 text-lg font-bold">
          <span className="text-2xl">{selected.flag}</span>
          <span>{selected.name}</span>
        </span>
        <span className={`text-white/20 text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-56 overflow-y-auto no-scrollbar z-[999] p-2 flex flex-col gap-1"
          >
            {countries.map(country => (
              <button
                key={country.name}
                type="button"
                onClick={() => {
                  onChange(country.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${value === country.name ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20' : 'text-white hover:bg-white/5 hover:pr-6'}`}
              >
                <span className="font-bold text-base">{country.name}</span>
                <span className="text-xl">{country.flag}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
