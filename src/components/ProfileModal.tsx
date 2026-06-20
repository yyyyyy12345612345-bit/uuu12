"use client";

import React, { useState, useEffect } from "react";
import {
   X, Camera, User, Phone, Calendar, Eye, EyeOff,
   MapPin, Save, Loader2, CheckCircle, Image as ImageIcon, LogOut, ShieldCheck,
   BookOpen, Headphones, Trophy, PlayCircle, Compass, Settings, AlertTriangle, Trash2,
   FileText, Crown, MessageCircle, Heart, Users, UserPlus, UserMinus, UserCheck, ShieldAlert, Search, Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc, query, where, orderBy, setDoc, serverTimestamp } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { BADGES } from "@/lib/badges";

function HalfEyeIcon({ className = "w-4 h-4" }: { className?: string }) {
   return (
      <svg 
         xmlns="http://www.w3.org/2000/svg" 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="currentColor" 
         strokeWidth="2" 
         strokeLinecap="round" 
         strokeLinejoin="round" 
         className={className}
      >
         <path d="M2 12c3-3 7-3 10-3s7 0 10 3c0 0-3 7-10 7S2 12 2 12Z" />
         <circle cx="12" cy="13" r="2.5" />
         <path d="M5 8c1-1.5 3-2.5 7-2.5s6 1 7 2.5" strokeDasharray="3 3" />
      </svg>
   );
}

interface PrivacySelectorProps {
   value: "public" | "friends" | "private";
   onChange: (val: "public" | "friends" | "private") => void;
}

function PrivacySelector({ value, onChange }: PrivacySelectorProps) {
   return (
      <div className="flex items-center gap-1 bg-foreground/5 border border-border rounded-full p-1 shadow-inner">
         <button
            type="button"
            onClick={() => onChange("private")}
            title="خاص (أنا فقط)"
            className={`p-1.5 rounded-full transition-all ${value === "private" ? "bg-red-500/20 text-red-400 shadow-md shadow-red-500/10 scale-105" : "text-foreground/40 hover:text-foreground/70"}`}
         >
            <EyeOff className="w-3.5 h-3.5" />
         </button>
         <button
            type="button"
            onClick={() => onChange("friends")}
            title="الأصدقاء فقط"
            className={`p-1.5 rounded-full transition-all ${value === "friends" ? "bg-amber-500/20 text-amber-400 shadow-md shadow-amber-500/10 scale-105" : "text-foreground/40 hover:text-foreground/70"}`}
         >
            <HalfEyeIcon className="w-3.5 h-3.5" />
         </button>
         <button
            type="button"
            onClick={() => onChange("public")}
            title="عام (للجميع)"
            className={`p-1.5 rounded-full transition-all ${value === "public" ? "bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10 scale-105" : "text-foreground/40 hover:text-foreground/70"}`}
         >
            <Eye className="w-3.5 h-3.5" />
         </button>
      </div>
   );
}

interface ProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
   const [activeTab, setActiveTab] = useState<"identity" | "stats" | "posts" | "social" | "account">("identity");
   const [showAllAvatars, setShowAllAvatars] = useState(false);
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

   // Social features states
   const [searchQuery, setSearchQuery] = useState("");
   const [searchResults, setSearchResults] = useState<any[]>([]);
   const [searching, setSearching] = useState(false);
   const [friendRequests, setFriendRequests] = useState<any[]>([]);
   const [loadingRequests, setLoadingRequests] = useState(false);
   const [friendsList, setFriendsList] = useState<any[]>([]);
   const [loadingFriends, setLoadingFriends] = useState(false);
   const [blockedList, setBlockedList] = useState<any[]>([]);
   const [loadingBlocked, setLoadingBlocked] = useState(false);
   const [showSearchSection, setShowSearchSection] = useState(false);
   const [showRequestsSection, setShowRequestsSection] = useState(false);

   const fetchMyPosts = async () => {
      if (!auth?.currentUser || !db) return;
      setLoadingMyPosts(true);
      try {
         const q = query(
            collection(db, "posts"),
            where("userId", "==", auth.currentUser.uid)
         );
         const snap = await getDocs(q);
         const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         list.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
         });
         setMyPosts(list);
      } catch (e) {
         console.error("Error fetching my posts:", e);
      } finally {
         setLoadingMyPosts(false);
      }
   };

    const handleDeleteMyPost = async (postId: string) => {
      if (!await window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
      try {
         await deleteDoc(doc(db, "posts", postId));
         setMyPosts(prev => prev.filter(p => p.id !== postId));
      } catch (e) {
         console.error("Error deleting post:", e);
         alert("حدث خطأ أثناء الحذف");
      }
   };

   // --- Social Helper Functions ---
   const handleSearchFriends = async (queryText: string) => {
      setSearchQuery(queryText);
      if (!queryText.trim() || !db) {
         setSearchResults([]);
         return;
      }
      setSearching(true);
      try {
         const searchLower = queryText.trim().toLowerCase();
         // Search by username prefix
         const q = query(
            collection(db, "users"),
            where("username", ">=", searchLower),
            where("username", "<=", searchLower + "\uf8ff")
         );
         const snap = await getDocs(q);
         const list = snap.docs
            .map(doc => doc.data())
            .filter(u => u.uid !== auth?.currentUser?.uid); // exclude self
         setSearchResults(list);
      } catch (e) {
         console.error("Error searching friends:", e);
      } finally {
         setSearching(false);
      }
   };

   const fetchFriendRequests = async () => {
      if (!auth?.currentUser || !db) return;
      setLoadingRequests(true);
      try {
         const q = query(
            collection(db, "friend_requests"),
            where("receiverId", "==", auth.currentUser.uid),
            where("status", "==", "pending")
         );
         const snap = await getDocs(q);
         const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setFriendRequests(list);
      } catch (e) {
         console.error("Error fetching friend requests:", e);
      } finally {
         setLoadingRequests(false);
      }
   };

   const fetchFriends = async () => {
      if (!auth?.currentUser || !db) return;
      setLoadingFriends(true);
      try {
         const myUid = auth.currentUser.uid;
         const q = query(
            collection(db, "friendships"),
            where("users", "array-contains", myUid)
         );
         const snap = await getDocs(q);
         const friendships = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         
         const list = await Promise.all(
            friendships.map(async (f: any) => {
               const friendUid = f.users.find((uid: string) => uid !== myUid);
               if (!friendUid) return null;
               const userSnap = await getDoc(doc(db, "users", friendUid));
               if (userSnap.exists()) {
                  return { friendshipId: f.id, ...userSnap.data() };
               }
               return { friendshipId: f.id, uid: friendUid, displayName: "مستخدم يقين", photoURL: "" };
            })
         );
         setFriendsList(list.filter(Boolean));
      } catch (e) {
         console.error("Error fetching friends:", e);
      } finally {
         setLoadingFriends(false);
      }
   };

   const fetchBlockedUsers = async (blockedUids: string[]) => {
      if (!db || !blockedUids || blockedUids.length === 0) {
         setBlockedList([]);
         return;
      }
      setLoadingBlocked(true);
      try {
         const list = await Promise.all(
            blockedUids.map(async (uid) => {
               const userSnap = await getDoc(doc(db, "users", uid));
               if (userSnap.exists()) {
                  return userSnap.data();
               }
               return { uid, displayName: "مستخدم محظور", photoURL: "" };
            })
         );
         setBlockedList(list.filter(Boolean));
      } catch (e) {
         console.error("Error fetching blocked users:", e);
      } finally {
         setLoadingBlocked(false);
      }
   };

   const handleAcceptFriendRequest = async (request: any) => {
      if (!auth?.currentUser || !db) return;
      try {
         const myUid = auth.currentUser.uid;
         const friendshipId = myUid < request.senderId ? `${myUid}_${request.senderId}` : `${request.senderId}_${myUid}`;
         
         await setDoc(doc(db, "friendships", friendshipId), {
            users: [myUid, request.senderId],
            createdAt: serverTimestamp()
         });
         await deleteDoc(doc(db, "friend_requests", request.id));
         await setDoc(doc(db, "chats", friendshipId), {
            participants: [myUid, request.senderId],
            lastMessage: "تم قبول طلب الصداقة، ابدأوا الآن كلامكم الطيب ✨",
            lastMessageAt: serverTimestamp(),
            unreadCount: {
               [myUid]: 0,
               [request.senderId]: 0
            }
         });
         
         fetchFriendRequests();
         fetchFriends();
         alert("تم قبول طلب الصداقة ✅");
      } catch (e) {
         console.error(e);
      }
   };

   const handleRejectFriendRequest = async (requestId: string) => {
      if (!db) return;
      try {
         await deleteDoc(doc(db, "friend_requests", requestId));
         fetchFriendRequests();
      } catch (e) {
         console.error(e);
      }
   };

    const handleBlockUser = async (targetUid: string) => {
       if (!auth?.currentUser || !db) return;
       if (!await window.confirm("هل أنت متأكد من رغبتك في حظر هذا المستخدم نهائياً؟ لن يتمكن من إرسال طلبات صداقة لك مجدداً.")) return;
       try {
          const myUid = auth.currentUser.uid;
          
          const userRef = doc(db, "users", myUid);
          const userSnap = await getDoc(userRef);
          const currentBlocked = userSnap.exists() ? (userSnap.data().blockedUsers || []) : [];
          const updatedBlocked = currentBlocked.includes(targetUid) ? currentBlocked : [...currentBlocked, targetUid];
          
          if (!currentBlocked.includes(targetUid)) {
             await updateDoc(userRef, { blockedUsers: updatedBlocked });
             setBlockedList(prev => [...prev.filter((u: any) => u.uid !== targetUid), { uid: targetUid }]);
             fetchBlockedUsers(updatedBlocked);
             setUserStats((prev: any) => prev ? { ...prev, blockedUsers: updatedBlocked } : prev);
          }

          try {
             await deleteDoc(doc(db, "friend_requests", `${myUid}_${targetUid}`));
          } catch {}
          try {
             await deleteDoc(doc(db, "friend_requests", `${targetUid}_${myUid}`));
          } catch {}

          const friendshipId = myUid < targetUid ? `${myUid}_${targetUid}` : `${targetUid}_${myUid}`;
          try {
             await deleteDoc(doc(db, "friendships", friendshipId));
          } catch {}

          fetchFriendRequests();
          fetchFriends();
          alert("تم حظر المستخدم نهائياً 🚫");
       } catch (e) {
          console.error(e);
       }
    };

    const handleUnblockUser = async (targetUid: string) => {
       if (!auth?.currentUser || !db) return;
       try {
          const myUid = auth.currentUser.uid;
          const userRef = doc(db, "users", myUid);
          const userSnap = await getDoc(userRef);
          const currentBlocked = userSnap.exists() ? (userSnap.data().blockedUsers || []) : [];
          const updatedBlocked = currentBlocked.filter((uid: string) => uid !== targetUid);
          await updateDoc(userRef, { blockedUsers: updatedBlocked });
          
          fetchBlockedUsers(updatedBlocked);
          setUserStats((prev: any) => prev ? { ...prev, blockedUsers: updatedBlocked } : prev);
          alert("تم إلغاء الحظر ✅");
       } catch (e) {
          console.error(e);
       }
    };

    const handleRemoveFriend = async (friendUid: string, friendshipId: string) => {
       if (!db) return;
       if (!await window.confirm("هل أنت متأكد من رغبتك في إزالة هذا الصديق؟")) return;
       try {
          await deleteDoc(doc(db, "friendships", friendshipId));
          fetchFriends();
          alert("تمت إزالة الصديق بنجاح ✅");
       } catch (e) {
          console.error(e);
          alert("حدث خطأ أثناء إزالة الصديق");
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
      if (isOpen && auth?.currentUser) {
         if (activeTab === "posts") {
            fetchMyPosts();
         } else if (activeTab === "social") {
            fetchFriendRequests();
            fetchFriends();
            if (userStats?.blockedUsers) {
               fetchBlockedUsers(userStats.blockedUsers);
            }
         }
      }
   }, [activeTab, isOpen, userStats]);

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
            
            if (data.blockedUsers) {
               fetchBlockedUsers(data.blockedUsers);
            }
            
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
      if (!await window.confirm(confirmMessage)) return;

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
       <div className="fixed inset-0 z-[2000] bg-black/50 dark:bg-black/80 backdrop-blur-md overflow-y-auto font-['Tajawal'] py-10 px-4 flex justify-center items-start no-scrollbar">
          <div className="fixed inset-0" onClick={onClose} />

          <div className="relative w-full max-w-2xl bg-card border border-border rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-700 overflow-hidden">
             <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />

             <div className="p-6 md:p-8 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-3xl sticky top-0 z-50">
                <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-foreground/5 dark:bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                   <X className="w-6 h-6" />
                </button>
                <div className="text-right">
                   <h2 className="text-xl font-black text-foreground">الملف الشخصي</h2>
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
                       <div className="relative rounded-[2.5rem] overflow-hidden border border-border bg-gradient-to-b from-card to-background shadow-2xl flex flex-col">
                          {/* Cover Gradient */}
                          <div className="h-32 w-full bg-gradient-to-r from-primary/30 via-purple-500/20 to-primary/15 relative">
                             <div className="absolute inset-0 islamic-pattern opacity-[0.05]" />
                             <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card to-transparent" />
                          </div>
                          {/* Profile Info Row */}
                          <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 relative z-10">
                             <div className="relative shrink-0 self-center sm:self-auto">
                                <img 
                                   src={formData.photoURL || AVATARS[formData.gender][0]} 
                                   alt="Avatar" 
                                   className="w-24 h-24 rounded-full border-4 border-card bg-card shadow-2xl object-cover" 
                                />
                             </div>
                             <div className="flex-1 text-center sm:text-right">
                                <h3 className="text-2xl font-black text-foreground leading-tight flex items-center justify-center sm:justify-start gap-2">
                                   {formData.displayName || "مستخدم جديد"}
                                   {userStats?.plan && userStats.plan !== 'free' && (
                                      <Crown className="w-5 h-5 text-primary fill-current animate-pulse" />
                                   )}
                                </h3>
                                <p className="text-primary text-xs font-bold font-mono tracking-widest mt-1">@{formData.username || "---"}</p>
                             </div>
                             {/* Quick Stats Summary */}
                             <div className="flex items-center justify-center gap-4 sm:border-r sm:border-border sm:pr-6 sm:py-2">
                                <div className="text-center">
                                   <span className="block text-lg font-black text-foreground">{userStats?.totalPoints || 0}</span>
                                   <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">نقطة</span>
                                </div>
                                <div className="w-px h-6 bg-border" />
                                <div className="text-center">
                                   <span className="block text-lg font-black text-foreground">{userStats?.readAyahs || 0}</span>
                                   <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">آية</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Tabs */}
                       <div className="flex bg-foreground/5 dark:bg-white/5 rounded-2xl p-1.5 shadow-inner overflow-x-auto no-scrollbar gap-1">
                          <button type="button" onClick={() => setActiveTab("identity")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'identity' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}>
                            <User className="w-3.5 h-3.5" />
                            <span>الهوية</span>
                          </button>
                          <button type="button" onClick={() => setActiveTab("stats")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'stats' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}>
                            <Trophy className="w-3.5 h-3.5" />
                            <span>الإحصائيات</span>
                          </button>
                          <button type="button" onClick={() => setActiveTab("posts")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'posts' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}>
                            <FileText className="w-3.5 h-3.5" />
                            <span>منشوراتي</span>
                          </button>
                          <button type="button" onClick={() => setActiveTab("social")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'social' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}>
                            <Users className="w-3.5 h-3.5" />
                            <span>الأصدقاء</span>
                          </button>
                          <button type="button" onClick={() => setActiveTab("account")} className={`flex-1 py-3 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'account' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}>
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
                                 <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">اختر الشخصية الرقمية</label>
                              </div>
                              <div className="flex flex-wrap gap-4 justify-center">
                                 {(showAllAvatars ? AVATARS[formData.gender] : AVATARS[formData.gender].slice(0, 5)).map((url) => (
                                    <button
                                       key={url}
                                       type="button"
                                       onClick={() => setFormData(prev => ({ ...prev, photoURL: url }))}
                                       className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 ${formData.photoURL === url ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-border opacity-55 hover:opacity-100 hover:scale-105'}`}
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
                              <div className="text-center mt-2">
                                 <button
                                    type="button"
                                    onClick={() => setShowAllAvatars(!showAllAvatars)}
                                    className="px-4 py-1.5 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-full text-xs font-bold transition-all border border-border inline-flex items-center gap-1.5"
                                 >
                                    {showAllAvatars ? (
                                       <>
                                          <span>إخفاء</span>
                                          <span>🔼</span>
                                       </>
                                    ) : (
                                       <>
                                          <span>مزيد</span>
                                          <span>🔽</span>
                                       </>
                                    )}
                                 </button>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Display Name */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">الاسم بالكامل</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       required
                                       value={formData.displayName}
                                       onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                       className="w-full bg-foreground/[0.03] dark:bg-white/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-foreground/[0.06] dark:focus:bg-white/10 transition-all text-sm font-bold text-foreground shadow-xl placeholder:text-foreground/30"
                                       placeholder="اسمك هنا..."
                                    />
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 w-5 h-5" />
                                 </div>
                              </div>

                              {/* Username (Read Only) */}
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">اسم المستخدم</label>
                                 </div>
                                 <div className="relative">
                                    <input
                                       disabled
                                       value={formData.username}
                                       className="w-full bg-foreground/[0.03] dark:bg-white/5 border border-border rounded-2xl py-4 px-6 text-right outline-none opacity-50 cursor-not-allowed font-mono text-sm text-foreground shadow-xl"
                                    />
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 w-5 h-5" />
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Phone */}
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                       <div className="w-1 h-1 rounded-full bg-primary" />
                                       <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">رقم التواصل</label>
                                    </div>
                                    <PrivacySelector 
                                       value={formData.privacyPhone} 
                                       onChange={(val) => setFormData(prev => ({ ...prev, privacyPhone: val }))} 
                                    />
                                 </div>
                                 <div className="relative">
                                    <input
                                       type="tel"
                                       value={formData.phoneNumber}
                                       onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                       className="w-full bg-foreground/[0.03] dark:bg-white/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-foreground/[0.06] dark:focus:bg-white/10 transition-all font-mono text-sm text-foreground shadow-xl placeholder:text-foreground/30"
                                       placeholder="مثال: 9665xxxxxxxx"
                                    />
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 w-5 h-5" />
                                 </div>
                              </div>

                              {/* Birthdate */}
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                       <div className="w-1 h-1 rounded-full bg-primary" />
                                       <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">تاريخ الميلاد</label>
                                    </div>
                                    <PrivacySelector 
                                       value={formData.privacyBirthDate} 
                                       onChange={(val) => setFormData(prev => ({ ...prev, privacyBirthDate: val }))} 
                                    />
                                 </div>
                                 <div className="relative">
                                    <input
                                       type="date"
                                       value={formData.birthDate}
                                       onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                       className="w-full bg-foreground/[0.03] dark:bg-white/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 focus:bg-foreground/[0.06] dark:focus:bg-white/10 transition-all text-sm font-bold text-foreground shadow-xl placeholder:text-foreground/30 [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* Privacy Legend */}
                           <div className="bg-foreground/[0.01] dark:bg-white/[0.02] border border-border rounded-3xl p-5 text-right space-y-3 shadow-lg">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                 <ShieldCheck className="w-3.5 h-3.5" />
                                 <span>دليل رموز خصوصية البيانات:</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                 <div className="flex items-center gap-2.5 text-xs text-foreground/60">
                                    <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shrink-0">
                                       <Eye className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold">العين المفتوحة: عام للجميع 🌍</span>
                                 </div>
                                 <div className="flex items-center gap-2.5 text-xs text-foreground/60">
                                    <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10 shrink-0">
                                       <HalfEyeIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold">نصف العين: الأصدقاء فقط 👥</span>
                                 </div>
                                 <div className="flex items-center gap-2.5 text-xs text-foreground/60">
                                    <div className="p-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 shrink-0">
                                       <EyeOff className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold">العين المغلقة: خاص بك فقط 🔒</span>
                                 </div>
                              </div>
                           </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {/* Country */}
                               <div className="space-y-3">
                                  <div className="flex items-center gap-3 px-2">
                                     <div className="w-1 h-1 rounded-full bg-primary" />
                                     <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">الدولة</label>
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
                                     <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">الجنس</label>
                                  </div>
                                  <div className="flex gap-4 p-1.5 bg-foreground/5 dark:bg-white/5 rounded-2xl border border-border shadow-inner">
                                     <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "male" }))}
                                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "male" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground/30 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/5"}`}
                                     >
                                        ذكر
                                     </button>
                                     <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "female" }))}
                                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === "female" ? "bg-primary text-black shadow-md shadow-primary/20" : "text-foreground/30 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/5"}`}
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
                                     ? 'force-dark bg-emerald-500 text-white shadow-emerald-500/20'
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
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                               <div className="bg-foreground/5 border border-border rounded-xl p-2.5 flex items-center gap-2 hover:bg-foreground/10 transition-colors shadow-lg text-right">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner shadow-primary/20 shrink-0">
                                     <Trophy className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                     <span className="block text-sm font-black text-foreground leading-none">{userStats?.totalPoints || 0}</span>
                                     <span className="text-[8px] text-foreground/45 font-black mt-1 block truncate">إجمالي النقاط</span>
                                  </div>
                               </div>
                               
                               <div className="bg-foreground/5 border border-border rounded-xl p-2.5 flex items-center gap-2 hover:bg-foreground/10 transition-colors shadow-lg text-right">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner shadow-emerald-500/20 shrink-0">
                                     <BookOpen className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                     <span className="block text-sm font-black text-foreground leading-none">{userStats?.readAyahs || 0}</span>
                                     <span className="text-[8px] text-foreground/45 font-black mt-1 block truncate">آيات قُرئت</span>
                                  </div>
                               </div>
                               
                               <div className="bg-foreground/5 border border-border rounded-xl p-2.5 flex items-center gap-2 hover:bg-foreground/10 transition-colors shadow-lg text-right">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner shadow-blue-500/20 shrink-0">
                                     <Headphones className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                     <span className="block text-sm font-black text-foreground leading-none">{Math.floor((userStats?.audioSeconds || 0) / 60)}</span>
                                     <span className="text-[8px] text-foreground/45 font-black mt-1 block truncate">دقائق استماع</span>
                                  </div>
                               </div>
                               
                               <div className="bg-foreground/5 border border-border rounded-xl p-2.5 flex items-center gap-2 hover:bg-foreground/10 transition-colors shadow-lg text-right">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner shadow-purple-500/20 shrink-0">
                                     <PlayCircle className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                     <span className="block text-sm font-black text-foreground leading-none">{userStats?.completedSurahsCount || 0}</span>
                                     <span className="text-[8px] text-foreground/45 font-black mt-1 block truncate">سور مكتملة</span>
                                  </div>
                               </div>
                            </div>

                            {/* قسم الأوسمة والشارات */}
                            <div className="bg-foreground/5 border border-border rounded-2xl p-4 space-y-4 shadow-lg">
                               <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-primary" />
                                  <h4 className="text-foreground font-black text-xs">الأوسمة والإنجازات 🏆</h4>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  {BADGES.map((badge) => {
                                     const isUnlocked = userStats?.badges?.includes(badge.id);
                                     
                                     // Calculate progress
                                     let progress = 0;
                                     let currentVal = 0;
                                     let targetVal = 1;
                                     if (badge.id === "streak_7") {
                                        currentVal = userStats?.streak || 0;
                                        targetVal = 7;
                                     } else if (badge.id === "comments_10") {
                                        currentVal = userStats?.commentsCount || 0;
                                        targetVal = 10;
                                     } else if (badge.id === "videos_5") {
                                        currentVal = userStats?.videoRendersCount || 0;
                                        targetVal = 5;
                                     }
                                     progress = Math.min(100, Math.floor((currentVal / targetVal) * 100));

                                     return (
                                        <div 
                                           key={badge.id}
                                           className={`relative rounded-xl border p-3 flex flex-col items-center text-center gap-2.5 transition-all duration-300 ${
                                              isUnlocked 
                                                 ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(230,190,70,0.05)] hover:scale-[1.02]' 
                                                 : 'bg-foreground/[0.01] border-border opacity-60'
                                           }`}
                                        >
                                           {/* Badge Icon */}
                                           <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                                              isUnlocked 
                                                 ? 'bg-gradient-to-br from-primary to-amber-500 text-black shadow-md' 
                                                 : 'bg-foreground/5 text-foreground/30'
                                           }`}>
                                              {badge.iconType === "quran" && <BookOpen className="w-5 h-5" />}
                                              {badge.iconType === "community" && <Users className="w-5 h-5" />}
                                              {badge.iconType === "video" && <Video className="w-5 h-5" />}
                                              
                                              {isUnlocked && (
                                                 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border border-card flex items-center justify-center text-[8px] text-white force-dark font-bold">
                                                    ✓
                                                 </span>
                                              )}
                                           </div>

                                           {/* Badge Info */}
                                           <div className="space-y-0.5">
                                              <span className={`block text-[10px] font-black ${isUnlocked ? 'text-primary' : 'text-foreground/60'}`}>
                                                 {badge.name}
                                              </span>
                                              <p className="text-[8px] text-foreground/45 leading-normal text-center">
                                                 {badge.description}
                                              </p>
                                           </div>

                                           {/* Progress Bar (if locked) */}
                                           {!isUnlocked && (
                                              <div className="w-full mt-1 space-y-1">
                                                 <div className="flex justify-between text-[7px] text-foreground/30 font-bold font-mono">
                                                    <span>{progress}%</span>
                                                    <span>{currentVal}/{targetVal}</span>
                                                 </div>
                                                 <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden">
                                                    <div 
                                                       className="h-full bg-white/20 rounded-full transition-all duration-500" 
                                                       style={{ width: `${progress}%` }}
                                                    />
                                                 </div>
                                              </div>
                                           )}
                                        </div>
                                     );
                                  })}
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
                                  <p className="text-foreground/40 text-xs font-bold">جاري تحميل منشوراتك...</p>
                               </div>
                            ) : myPosts.length === 0 ? (
                               <div className="py-12 text-center text-foreground/30 space-y-3 bg-foreground/5 border border-border rounded-3xl">
                                  <FileText className="w-10 h-10 text-foreground/10 mx-auto" />
                                  <p className="text-sm font-bold">لم تقم بنشر أي منشور بعد</p>
                                  <p className="text-xs text-foreground/20">منشوراتك التي تنشرها في المجتمع ستظهر هنا</p>
                               </div>
                            ) : (
                               <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar p-1">
                                  {myPosts.map((post) => (
                                     <div key={post.id} className="bg-foreground/5 border border-border rounded-3xl p-5 relative group/post hover:bg-foreground/10 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                           <div className="text-right">
                                              <span className="block text-[10px] text-foreground/30 font-mono">
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
                                        <p className="text-sm text-foreground/85 leading-relaxed text-right font-medium whitespace-pre-wrap break-words">{post.content}</p>
                                        
                                        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border text-xs text-foreground/40">
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

                      {/* Social Tab */}
                      {activeTab === 'social' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            
                            {/* Toggle Toolbar */}
                            <div className="flex items-center justify-start gap-4 mb-2">
                               {/* Search Toggle Icon */}
                               <button
                                  type="button"
                                  onClick={() => setShowSearchSection(!showSearchSection)}
                                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${
                                     showSearchSection
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-foreground/5 border-border text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                                  }`}
                                  title="البحث عن أصدقاء"
                               >
                                  <Search className="w-5 h-5" />
                               </button>

                               {/* Friend Requests Toggle Icon */}
                               <button
                                  type="button"
                                  onClick={() => setShowRequestsSection(!showRequestsSection)}
                                  className={`relative p-3 rounded-2xl border transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${
                                     showRequestsSection
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-foreground/5 border-border text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                                  }`}
                                  title="طلبات الصداقة"
                               >
                                  <UserCheck className="w-5 h-5" />
                                  <span className={`absolute -top-1.5 -left-1.5 text-[9px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-card shadow-md transition-colors ${
                                     friendRequests.length > 0 
                                        ? 'bg-red-500 text-white font-mono animate-bounce' 
                                        : 'bg-foreground/15 text-foreground/45'
                                  }`}>
                                     {friendRequests.length}
                                  </span>
                               </button>
                            </div>

                            {/* Search for Friends */}
                            {showSearchSection && (
                               <div className="bg-foreground/5 border border-border rounded-3xl p-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <Search className="w-5 h-5 text-primary animate-pulse" />
                                        <h4 className="text-foreground font-black text-sm">البحث عن صديق جديد</h4>
                                     </div>
                                     <span className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">المجتمع</span>
                                  </div>
                                  
                                  <div className="relative">
                                     <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchFriends(e.target.value)}
                                        placeholder="ابحث باسم المستخدم (مثال: ahmad)..."
                                        className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-4 pr-12 pl-6 text-right outline-none focus:border-primary/50 transition-all text-sm font-bold text-foreground shadow-inner placeholder:text-foreground/20"
                                     />
                                     <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/20 w-5 h-5" />
                                  </div>

                                  {searching ? (
                                     <div className="flex items-center justify-center py-6 gap-2">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        <span className="text-foreground/40 text-xs font-bold">جاري البحث عن رفقاء الدرب...</span>
                                     </div>
                                  ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
                                     <div className="text-center text-foreground/30 text-xs py-4 font-bold bg-foreground/5 rounded-2xl">
                                        لا توجد نتائج مطابقة لمصطلح البحث
                                     </div>
                                  ) : searchResults.length > 0 ? (
                                     <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar pt-2">
                                        {searchResults.map((user: any) => (
                                           <div key={user.uid} className="flex items-center justify-between p-3.5 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 transition-colors shadow-sm">
                                              <div className="flex items-center gap-2">
                                                 <button
                                                    type="button"
                                                    onClick={() => handleBlockUser(user.uid)}
                                                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white force-dark rounded-xl transition-all text-xs font-black flex items-center gap-1.5 border border-red-500/15"
                                                    title="حظر نهائي"
                                                 >
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    <span>حظر</span>
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => {
                                                       window.dispatchEvent(new CustomEvent("show_user_profile", { detail: { userId: user.uid } }));
                                                    }}
                                                    className="px-3 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-xl transition-all text-xs font-black flex items-center gap-1.5 border border-primary/20"
                                                 >
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>الملف الشخصي</span>
                                                 </button>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                 <div className="text-right">
                                                    <span className="block text-sm font-bold text-foreground leading-tight">{user.displayName || "مستمع قرآن"}</span>
                                                    <span className="block text-[10px] text-primary font-mono mt-0.5">@{user.username}</span>
                                                 </div>
                                                 <img
                                                    src={user.photoURL || AVATARS[user.gender || 'male'][0]}
                                                    alt="Avatar"
                                                    className="w-10 h-10 rounded-full border-2 border-border bg-card object-cover shadow-md"
                                                 />
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  ) : null}
                               </div>
                            )}

                            {/* Friend Requests */}
                            {showRequestsSection && (
                               <div className="bg-foreground/5 border border-border rounded-3xl p-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
                                  <div className="flex items-center gap-3">
                                     <UserCheck className="w-5 h-5 text-emerald-400" />
                                     <h4 className="text-foreground font-black text-sm">طلبات الصداقة الواردة ({friendRequests.length})</h4>
                                  </div>

                                  {loadingRequests ? (
                                     <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                     </div>
                                  ) : friendRequests.length === 0 ? (
                                     <div className="text-center text-foreground/20 text-xs py-8 font-bold bg-foreground/5 border border-dashed border-border rounded-2xl">
                                        لا توجد طلبات صداقة معلقة حالياً
                                     </div>
                                  ) : (
                                     <div className="space-y-3">
                                        {friendRequests.map((request: any) => (
                                           <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-card border border-border rounded-2xl gap-3 shadow-md">
                                              <div className="flex items-center gap-2">
                                                 <button
                                                    type="button"
                                                    onClick={() => handleAcceptFriendRequest(request)}
                                                    className="force-dark flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                                                 >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    قبول
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => handleRejectFriendRequest(request.id)}
                                                    className="flex-1 sm:flex-initial px-4 py-2 bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground/75 rounded-xl font-bold text-xs transition-all flex items-center justify-center"
                                                 >
                                                    رفض
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => handleBlockUser(request.senderId)}
                                                    className="px-3 py-2 bg-red-500/10 text-red-400 hover:text-white force-dark rounded-xl transition-all text-xs font-black border border-red-500/10"
                                                    title="حظر نهائي لمنع إرسال طلبات أخرى"
                                                 >
                                                    حظر نهائي
                                                 </button>
                                              </div>
                                              
                                              <div className="flex items-center justify-end gap-3">
                                                 <div className="text-right">
                                                    <span className="block text-sm font-bold text-foreground">{request.senderName || "قارئ جديد"}</span>
                                                    <span className="block text-[10px] text-foreground/45 mt-0.5">يرغب في أن يكون صديقاً لك</span>
                                                 </div>
                                                 <img
                                                    src={request.senderAvatar || AVATARS['male'][0]}
                                                    alt="Avatar"
                                                    className="w-10 h-10 rounded-full border-2 border-border bg-card object-cover shadow-md"
                                                 />
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  )}
                               </div>
                            )}

                            {/* Friends List */}
                            <div className="bg-foreground/5 border border-border rounded-3xl p-6 space-y-4 shadow-lg">
                               <div className="flex items-center gap-3">
                                  <Users className="w-5 h-5 text-primary" />
                                  <h4 className="text-foreground font-black text-sm">قائمة الأصدقاء ({friendsList.length})</h4>
                               </div>

                               {loadingFriends ? (
                                  <div className="flex items-center justify-center py-6">
                                     <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                  </div>
                               ) : friendsList.length === 0 ? (
                                  <div className="text-center text-foreground/20 text-xs py-10 font-bold bg-foreground/5 border border-dashed border-border rounded-2xl">
                                     لم تقم بإضافة أصدقاء بعد. ابحث عن الأصدقاء وتفاعل معهم!
                                  </div>
                               ) : (
                                  <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                                     {friendsList.map((friend: any) => (
                                        <div key={friend.uid} className="flex items-center justify-between p-3.5 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 transition-all shadow-sm">
                                           <div className="flex items-center gap-2">
                                              <button
                                                 type="button"
                                                 onClick={() => handleBlockUser(friend.uid)}
                                                 className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white force-dark text-red-400 rounded-xl transition-all text-xs font-black border border-red-500/10"
                                                 title="حظر نهائي"
                                              >
                                                 حظر
                                              </button>
                                              <button
                                                 type="button"
                                                 onClick={() => handleRemoveFriend(friend.uid, friend.friendshipId)}
                                                 className="px-2.5 py-1.5 bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground/75 rounded-xl transition-all text-xs font-bold"
                                                 title="إزالة الصديق"
                                              >
                                                 إزالة
                                              </button>
                                              <button
                                                 type="button"
                                                 onClick={() => {
                                                    window.dispatchEvent(new CustomEvent("open_direct_chat", { detail: { userId: friend.uid } }));
                                                 }}
                                                 className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-black rounded-xl transition-all text-xs font-black flex items-center gap-1.5 border border-primary/20"
                                              >
                                                 <MessageCircle className="w-3.5 h-3.5" />
                                                 <span>دردشة</span>
                                              </button>
                                           </div>

                                           <div className="flex items-center gap-3">
                                              <div className="text-right">
                                                 <span className="block text-sm font-bold text-foreground leading-tight">{friend.displayName || "مستمع يقين"}</span>
                                                 <span className="block text-[10px] text-primary font-mono mt-0.5">@{friend.username}</span>
                                              </div>
                                              <img
                                                 src={friend.photoURL || AVATARS[friend.gender || 'male'][0]}
                                                 alt="Avatar"
                                                 className="w-10 h-10 rounded-full border-2 border-border bg-card object-cover shadow-md"
                                              />
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>

                            {/* Blocked Users List */}
                            {blockedList.length > 0 && (
                               <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-4 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
                                  <div className="flex items-center gap-3">
                                     <ShieldAlert className="w-5 h-5 text-red-400" />
                                     <h4 className="text-red-400 font-black text-sm">المستخدمون المحظورون ({blockedList.length})</h4>
                                  </div>

                                  {loadingBlocked ? (
                                     <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                                     </div>
                                  ) : (
                                     <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                                        {blockedList.map((blocked: any) => (
                                           <div key={blocked.uid} className="flex items-center justify-between p-3 bg-foreground/5 border border-border rounded-2xl shadow-sm">
                                              <button
                                                 type="button"
                                                 onClick={() => handleUnblockUser(blocked.uid)}
                                                 className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white force-dark text-emerald-400 rounded-xl transition-all text-xs font-black border border-emerald-500/20"
                                              >
                                                 إلغاء الحظر
                                              </button>
                                              
                                              <div className="flex items-center gap-3">
                                                 <div className="text-right">
                                                    <span className="block text-sm font-bold text-foreground">{blocked.displayName || "مستمع محظور"}</span>
                                                    {blocked.username && (
                                                       <span className="block text-[10px] text-foreground/35 font-mono mt-0.5">@{blocked.username}</span>
                                                    )}
                                                 </div>
                                                 <img
                                                    src={blocked.photoURL || AVATARS[blocked.gender || 'male'][0]}
                                                    alt="Avatar"
                                                    className="w-10 h-10 rounded-full border-2 border-border bg-card object-cover opacity-60 shadow-md"
                                                 />
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  )}
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
                                  <p className="text-foreground/60 text-xs leading-relaxed">يرجى ربط رقم هاتفك من تبويب (الهوية) لتتمكن من استعادة حسابك بسهولة في حال نسيت كلمة المرور.</p>
                               </div>
                            )}

                            <div className="space-y-4">
                               <button
                                  type="button"
                                  onClick={async () => {
                                     if (await window.confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {
                                        await auth.signOut();
                                        onClose();
                                        window.location.href = "/";
                                     }
                                  }}
                                  className="w-full py-5 rounded-2xl font-black text-sm text-foreground/75 bg-foreground/5 border border-border hover:bg-foreground/10 hover:text-foreground transition-all flex items-center justify-center gap-3 shadow-sm"
                               >
                                  <LogOut className="w-5 h-5" />
                                  تسجيل الخروج
                               </button>

                               <div className="h-px bg-border w-full my-6" />

                               <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-6 space-y-5">
                                  <div className="flex items-start gap-4">
                                     <div className="bg-red-500/20 p-3 rounded-xl shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                     </div>
                                     <div className="flex-1 text-right">
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
               <div className="mt-10 pt-6 border-t border-border text-center">
                  <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.5em]">الإصدار العالمي الفائق V 22</span>
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
        className={`w-full bg-foreground/5 border ${isOpen ? 'border-primary/50 bg-foreground/10' : 'border-border'} rounded-2xl py-4 px-6 text-right outline-none transition-all cursor-pointer text-foreground shadow-xl flex items-center justify-between group`}
      >
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-primary' : 'text-foreground/20 group-hover:text-primary/50'}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-3 text-sm font-bold">
          <span className="text-xl">{selected.flag}</span>
          <span>{selected.name}</span>
        </span>
        <span className={`text-foreground/20 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-56 overflow-y-auto no-scrollbar z-[999] p-2 flex flex-col gap-1"
          >
            {countries.map(country => (
              <button
                key={country.name}
                type="button"
                onClick={() => {
                  onChange(country.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${value === country.name ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20' : 'text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 hover:pr-5'}`}
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
