"use client";

import React, { useState, useEffect } from "react";
import {
   X, Camera, User, Phone, Calendar,
   MapPin, Save, Loader2, CheckCircle, Image as ImageIcon, LogOut, ShieldCheck,
   BookOpen, Headphones, Trophy, PlayCircle, Compass, Settings, AlertTriangle, Trash2,
   FileText, Crown, MessageCircle, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

interface ProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
   const [activeTab, setActiveTab] = useState<"identity" | "stats" | "posts" | "account">("identity");
   const [formData, setFormData] = useState({
      displayName: "",
      username: "",
      photoURL: "",
      phoneNumber: "",
      gender: "male" as "male" | "female",
      country: "مصر",
      birthDate: "",
      privacyPhone: "public" as "public" | "friends" | "private",
      privacyBirthDate: "public" as "public" | "friends" | "private"
   });
   const [userStats, setUserStats] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [success, setSuccess] = useState(false);
   const [deletingAccount, setDeletingAccount] = useState(false);
   const [myPosts, setMyPosts] = useState<any[]>([]);
   const [loadingMyPosts, setLoadingMyPosts] = useState(false);

   const fetchMyPosts = async () => {
      if (!auth?.currentUser || !db) return;
      setLoadingMyPosts(true);
      try {
         const q = query(
            collection(db, "posts"),
            where("userId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
         );
         const snap = await getDocs(q);
         const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setMyPosts(list);
      } catch (e) {
         console.error("Error fetching my posts:", e);
      } finally {
         setLoadingMyPosts(false);
      }
   };

   const handleDeleteMyPost = async (postId: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
      try {
         await deleteDoc(doc(db, "posts", postId));
         setMyPosts(prev => prev.filter(p => p.id !== postId));
      } catch (e) {
         console.error("Error deleting post:", e);
         alert("حدث خطأ أثناء الحذف");
      }
   };

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
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Amr&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Khaled&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Tariq&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Bilal&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Hamza&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Salem&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Nasser&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Fahad&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Majed&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Waleed&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Rami&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Sami&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
         "https://api.dicebear.com/9.x/avataaars/svg?seed=Hussein&top=shortRound&facialHairProbability=100&accessoriesProbability=0"
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

   useEffect(() => {
      if (activeTab === "posts" && isOpen && auth?.currentUser) {
         fetchMyPosts();
      }
   }, [activeTab, isOpen]);

   const fetchUserData = async () => {
      if (!auth?.currentUser || !db) return;
      setLoading(true);
      try {
         const s = await getDoc(doc(db, "users", auth.currentUser.uid));
         if (s.exists()) {
            const data = s.data();
            
            // Fetch completed surahs subcollection count
            let completedSurahsCount = 0;
            try {
               const completedSurahsSnap = await getDocs(collection(db, "users", auth.currentUser.uid, "completed_surahs"));
               completedSurahsCount = completedSurahsSnap.size;
            } catch (e) {
               console.error("Error fetching completed surahs:", e);
            }

            setUserStats({
               ...data,
               completedSurahsCount
            });
            
            setFormData({
               displayName: data.displayName || "",
               username: data.username || "",
               photoURL: data.photoURL || "",
               phoneNumber: data.phoneNumber || "",
               gender: data.gender || "male",
               country: data.country || data.governorate || "مصر",
               birthDate: data.birthDate || "",
               privacyPhone: data.privacySettings?.phone || "public",
               privacyBirthDate: data.privacySettings?.birthDate || "public"
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
         const { privacyPhone, privacyBirthDate, ...rest } = formData;
         await updateDoc(doc(db, "users", auth.currentUser.uid), {
            ...rest,
            privacySettings: {
               phone: privacyPhone,
               birthDate: privacyBirthDate
            },
            lastUpdated: new Date().toISOString()
         });
         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
         }, 1500);
      } catch (e) {
         console.error("Error saving profile:", e);
      } finally {
         setSaving(false);
      }
   };

   const handleDeleteAccount = async () => {
      if (!auth?.currentUser || !db) return;
      
      const confirmMessage = "تحذير ⚠️\nهل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء سيقوم بحذف جميع بياناتك وإنجازاتك ولا يمكن التراجع عنه أبداً.";
      if (!window.confirm(confirmMessage)) return;

      setDeletingAccount(true);
      try {
         const user = auth.currentUser;
         // 1. Delete user doc from firestore
         await deleteDoc(doc(db, "users", user.uid));
         
         // 2. Delete auth user
         await deleteUser(user);
         
         alert("تم حذف الحساب بنجاح. نتمنى أن نراك مجدداً.");
         onClose();
         window.location.href = "/";
      } catch (e: any) {
         console.error("Error deleting account:", e);
         if (e.code === 'auth/requires-recent-login') {
            alert("لأسباب أمنية، يجب عليك تسجيل الخروج أولاً، ثم تسجيل الدخول مرة أخرى قبل محاولة حذف حسابك.");
         } else {
            alert("حدث خطأ أثناء محاولة حذف الحساب. يرجى المحاولة لاحقاً.");
         }
      } finally {
         setDeletingAccount(false);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-2xl overflow-y-auto font-['Tajawal'] py-10 px-4 flex justify-center items-start no-scrollbar">
         <div className="fixed inset-0" onClick={onClose} />

         <div className="relative w-full max-w-2xl bg-[#0a0a0d] border border-white/5 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden">
            <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />

            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-3xl sticky top-0 z-50">
               <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                  <X className="w-6 h-6" />
               </button>
               <div className="text-right">
                  <h2 className="text-xl font-black text-white">الملف الشخصي</h2>
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">إعدادات هويتك الرقمية</p>
               </div>
            </div>

            <div className="p-6 md:p-10 relative z-10">
               {loading ? (
                  <div className="py-24 flex flex-col items-center gap-6">
                     <Loader2 className="w-12 h-12 text-primary animate-spin" />
                     <p className="text-primary font-black text-xs uppercase tracking-[0.4em]">جاري التحميل</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                      {/* Premium Header Layout */}
                      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-b from-[#18181b] to-[#09090b] shadow-2xl flex flex-col">
                         {/* Cover Gradient */}
                         <div className="h-32 w-full bg-gradient-to-r from-primary/30 via-purple-500/20 to-primary/15 relative">
                            <div className="absolute inset-0 islamic-pattern opacity-[0.05]" />
                            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#09090b] to-transparent" />
                         </div>
                         {/* Profile Info Row */}
                         <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 relative z-10">
                            <div className="relative shrink-0 self-center sm:self-auto">
                               <img 
                                  src={formData.photoURL || AVATARS[formData.gender][0]} 
                                  alt="Avatar" 
                                  className="w-24 h-24 rounded-full border-4 border-[#09090b] bg-[#0c0d10] shadow-2xl object-cover" 
                               />
                            </div>
                            <div className="flex-1 text-center sm:text-right">
                               <h3 className="text-2xl font-black text-white leading-tight flex items-center justify-center sm:justify-start gap-2">
                                  {formData.displayName || "مستخدم جديد"}
                                  {userStats?.plan && userStats.plan !== 'free' && (
                                     <Crown className="w-5 h-5 text-primary fill-current animate-pulse" />
                                  )}
                               </h3>
                               <p className="text-primary text-xs font-bold font-mono tracking-widest mt-1">@{formData.username || "---"}</p>
                            </div>
                            {/* Quick Stats Summary */}
                            <div className="flex items-center justify-center gap-4 sm:border-r sm:border-white/5 sm:pr-6 sm:py-2">
                               <div className="text-center">
                                  <span className="block text-lg font-black text-white">{userStats?.totalPoints || 0}</span>
                                  <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">نقطة</span>
                               </div>
                               <div className="w-px h-6 bg-white/10" />
                               <div className="text-center">
                                  <span className="block text-lg font-black text-white">{userStats?.readAyahs || 0}</span>
                                  <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">آية</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex bg-white/5 rounded-2xl p-1.5 shadow-inner overflow-x-auto no-scrollbar gap-1">
                         <button type="button" onClick={() => setActiveTab("identity")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'identity' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}>
                           <User className="w-3.5 h-3.5" />
                           <span>الهوية</span>
                         </button>
                         <button type="button" onClick={() => setActiveTab("stats")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'stats' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}>
                           <Trophy className="w-3.5 h-3.5" />
                           <span>الإحصائيات</span>
                         </button>
                         <button type="button" onClick={() => setActiveTab("posts")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'posts' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}>
                           <FileText className="w-3.5 h-3.5" />
                           <span>منشوراتي</span>
                         </button>
                         <button type="button" onClick={() => setActiveTab("account")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'account' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}>
                           <Settings className="w-3.5 h-3.5" />
                           <span>الحساب</span>
                         </button>
                      </div>

                     {/* Identity Tab */}
                     {activeTab === 'identity' && (
                        <form onSubmit={handleSave} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           {/* Avatar Selection */}
                           <div className="space-y-5">
                              <div className="flex items-center gap-3 px-2">
                                 <div className="w-1 h-1 rounded-full bg-primary" />
                                 <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">اختر الشخصية الرقمية</label>
                              </div>
                              <div className="flex flex-wrap gap-4 justify-center">
                                 {AVATARS[formData.gender].map((url) => (
                                    <button
                                       key={url}
                                       type="button"
                                       onClick={() => setFormData(prev => ({ ...prev, photoURL: url }))}
                                       className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 ${formData.photoURL === url ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-white/5 opacity-50 hover:opacity-100 hover:scale-105'}`}
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
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">الاسم بالكامل</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       required
                                       value={formData.displayName}
                                       onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm font-bold text-white shadow-xl placeholder:text-white/20"
                                       placeholder="اسمك هنا..."
                                    />
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                                 </div>
                              </div>

                              {/* Username (Read Only) */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">اسم المستخدم</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       disabled
                                       value={formData.username}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none opacity-50 cursor-not-allowed font-mono text-sm text-white shadow-xl"
                                    />
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Phone */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">رقم التواصل</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       type="tel"
                                       value={formData.phoneNumber}
                                       onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono text-sm text-white shadow-xl placeholder:text-white/20"
                                       placeholder="مثال: 9665xxxxxxxx"
                                    />
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                                 </div>
                              </div>

                              {/* Phone Privacy */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">خصوصية رقم الهاتف</label>
                                 </div>
                                 <select 
                                    value={formData.privacyPhone}
                                    onChange={e => setFormData({...formData, privacyPhone: e.target.value as any})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm font-bold text-white shadow-xl appearance-none"
                                 >
                                    <option value="public" className="bg-[#0c0d10] text-white">عام (للجميع) 🌍</option>
                                    <option value="friends" className="bg-[#0c0d10] text-white">الأصدقاء فقط 👥</option>
                                    <option value="private" className="bg-[#0c0d10] text-white">خاص (أنا فقط) 🔒</option>
                                 </select>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Birthdate */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">تاريخ الميلاد</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       type="date"
                                       value={formData.birthDate}
                                       onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm font-bold text-white shadow-xl placeholder:text-white/20"
                                    />
                                 </div>
                              </div>

                              {/* Birthdate Privacy */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">خصوصية تاريخ الميلاد</label>
                                 </div>
                                 <select 
                                    value={formData.privacyBirthDate}
                                    onChange={e => setFormData({...formData, privacyBirthDate: e.target.value as any})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm font-bold text-white shadow-xl appearance-none"
                                 >
                                    <option value="public" className="bg-[#0c0d10] text-white">عام (للجميع) 🌍</option>
                                    <option value="friends" className="bg-[#0c0d10] text-white">الأصدقاء فقط 👥</option>
                                    <option value="private" className="bg-[#0c0d10] text-white">خاص (أنا فقط) 🔒</option>
                                 </select>
                              </div>
                           </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {/* Country */}
                               <div className="space-y-3">
                                  <div className="flex items-center gap-3 px-2">
                                     <div className="w-1 h-1 rounded-full bg-primary" />
                                     <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">الدولة</label>
                                  </div>
                                  <div className="relative z-50">
                                     <CountrySelectProfile 
                                        value={formData.country} 
                                        onChange={(val) => setFormData({...formData, country: val})} 
                                        countries={ARAB_COUNTRIES} 
                                     />
                                  </div>
                               </div>

                               {/* Gender */}
                               <div className="space-y-3">
                                  <div className="flex items-center gap-3 px-2">
                                     <div className="w-1 h-1 rounded-full bg-primary" />
                                     <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">الجنس</label>
                                  </div>
                                  <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                     <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "male" }))}
                                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "male" ? "bg-primary text-black shadow-md shadow-primary/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
                                     >
                                        ذكر
                                     </button>
                                     <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "female" }))}
                                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "female" ? "bg-primary text-black shadow-md shadow-primary/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
                                     >
                                        أنثى
                                     </button>
                                  </div>
                               </div>
                            </div>







                           <div className="pt-4">
                              <button
                                 type="submit"
                                 disabled={saving || success}
                                 className={`w-full py-5 rounded-[1.5rem] font-black text-sm transition-all duration-500 flex items-center justify-center gap-3 shadow-xl ${success
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-primary text-black hover:scale-[1.02] active:scale-95 shadow-primary/20'
                                    }`}
                              >
                                 {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                 ) : success ? (
                                    <CheckCircle className="w-5 h-5 animate-bounce" />
                                 ) : (
                                    <Save className="w-5 h-5" />
                                 )}
                                 {success ? 'تم تحديث الهوية بنجاح' : 'حفظ التعديلات'}
                              </button>
                           </div>
                        </form>
                     )}

                     {/* Stats Tab */}
                     {activeTab === 'stats' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                 <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner shadow-primary/20">
                                    <Trophy className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <span className="block text-3xl font-black text-white">{userStats?.totalPoints || 0}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">إجمالي النقاط</span>
                                 </div>
                              </div>
                              
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner shadow-emerald-500/20">
                                    <BookOpen className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <span className="block text-3xl font-black text-white">{userStats?.readAyahs || 0}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">آيات قُرئت</span>
                                 </div>
                              </div>
                              
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                 <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner shadow-blue-500/20">
                                    <Headphones className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <span className="block text-3xl font-black text-white">{Math.floor((userStats?.audioSeconds || 0) / 60)}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">دقائق استماع</span>
                                 </div>
                              </div>
                              
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                 <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner shadow-purple-500/20">
                                    <PlayCircle className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <span className="block text-3xl font-black text-white">{userStats?.completedSurahsCount || 0}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-2 block">سور مكتملة</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                      {/* Posts Tab */}
                      {activeTab === 'posts' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                            {loadingMyPosts ? (
                               <div className="py-12 flex flex-col items-center gap-4">
                                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                  <p className="text-white/40 text-xs font-bold">جاري تحميل منشوراتك...</p>
                               </div>
                            ) : myPosts.length === 0 ? (
                               <div className="py-12 text-center text-white/30 space-y-3 bg-white/5 border border-white/10 rounded-3xl">
                                  <FileText className="w-10 h-10 text-white/10 mx-auto" />
                                  <p className="text-sm font-bold">لم تقم بنشر أي منشور بعد</p>
                                  <p className="text-xs text-white/20">منشوراتك التي تنشرها في المجتمع ستظهر هنا</p>
                               </div>
                            ) : (
                               <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar p-1">
                                  {myPosts.map((post) => (
                                     <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 relative group/post hover:bg-white/10 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                           <div className="text-right">
                                              <span className="block text-[10px] text-white/30 font-mono">
                                                 {post.createdAt ? (post.createdAt.toDate ? post.createdAt.toDate().toLocaleDateString('ar-EG') : new Date(post.createdAt).toLocaleDateString('ar-EG')) : ''}
                                              </span>
                                           </div>
                                           <button 
                                              type="button"
                                              onClick={() => handleDeleteMyPost(post.id)}
                                              className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all scale-90 group-hover/post:scale-100 opacity-80 hover:opacity-100"
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </div>
                                        <p className="text-sm text-white/85 leading-relaxed text-right font-medium whitespace-pre-wrap break-words">{post.content}</p>
                                        
                                        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/5 text-xs text-white/40">
                                           <div className="flex items-center gap-1.5">
                                              <Heart className="w-3.5 h-3.5 fill-current text-red-500/80" />
                                              <span>{post.likesCount || 0} أعجبني</span>
                                           </div>
                                           <div className="flex items-center gap-1.5">
                                              <MessageCircle className="w-3.5 h-3.5 text-primary" />
                                              <span>{post.commentsCount || 0} تعليق</span>
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      )}

                     {/* Account Tab */}
                     {activeTab === 'account' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                           {/* Phone alert */}
                           {formData.phoneNumber.length < 10 && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-center space-y-4 shadow-lg shadow-amber-500/5">
                                 <div className="flex items-center justify-center gap-3">
                                    <ShieldCheck className="w-7 h-7 text-amber-400" />
                                    <p className="text-amber-400 text-sm font-black">حسابك غير مؤمن برقم هاتف!</p>
                                 </div>
                                 <p className="text-white/60 text-xs leading-relaxed">يرجى ربط رقم هاتفك من تبويب (الهوية) لتتمكن من استعادة حسابك بسهولة في حال نسيت كلمة المرور.</p>
                              </div>
                           )}

                           <div className="space-y-4">
                              <button
                                 type="button"
                                 onClick={async () => {
                                    if (window.confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {
                                       await auth.signOut();
                                       onClose();
                                       window.location.href = "/";
                                    }
                                 }}
                                 className="w-full py-5 rounded-2xl font-black text-sm text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm"
                              >
                                 <LogOut className="w-5 h-5" />
                                 تسجيل الخروج
                              </button>

                              <div className="h-px bg-white/5 w-full my-6" />

                              <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-6 space-y-5">
                                 <div className="flex items-start gap-4">
                                    <div className="bg-red-500/20 p-3 rounded-xl shrink-0">
                                       <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                       <h4 className="text-red-400 font-black text-sm">منطقة الخطر</h4>
                                       <p className="text-red-400/60 text-xs mt-2 leading-relaxed">
                                          حذف حسابك سيؤدي إلى إزالة جميع بياناتك الشخصية، إنجازاتك، ونقاطك بشكل نهائي من خوادمنا. لا يمكن التراجع عن هذه الخطوة أبداً.
                                       </p>
                                    </div>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount}
                                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-red-100 bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                 >
                                    {deletingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    حذف الحساب نهائياً
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                  </div>
               )}
               <div className="mt-10 pt-6 border-t border-white/5 text-center">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">الإصدار العالمي الفائق V 22</span>
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
        className={`w-full bg-white/5 border ${isOpen ? 'border-primary/50 bg-white/10' : 'border-white/10'} rounded-2xl py-4 px-6 text-right outline-none transition-all cursor-pointer text-white shadow-xl flex items-center justify-between group`}
      >
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-primary' : 'text-white/20 group-hover:text-primary/50'}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-3 text-sm font-bold">
          <span className="text-xl">{selected.flag}</span>
          <span>{selected.name}</span>
        </span>
        <span className={`text-white/20 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
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
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${value === country.name ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20' : 'text-white hover:bg-white/5 hover:pr-5'}`}
              >
                <span className="font-bold text-sm">{country.name}</span>
                <span className="text-xl">{country.flag}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
