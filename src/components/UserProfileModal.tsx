"use client";

import React, { useState, useEffect } from "react";
import { 
  X, User, Phone, Calendar, MapPin, Loader2, CheckCircle, 
  UserPlus, UserMinus, UserCheck, MessageCircle, Swords, Heart, Crown, Lock
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  doc, getDoc, setDoc, deleteDoc, updateDoc, collection, addDoc, 
  serverTimestamp, onSnapshot, query, where, getDocs 
} from "firebase/firestore";

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  
  // Relation state: "none" | "sent_pending" | "received_pending" | "friends"
  const [relation, setRelation] = useState<"none" | "sent_pending" | "received_pending" | "friends">("none");
  const [actionLoading, setActionLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const myUid = auth?.currentUser?.uid;

  // Helper to generate a lexicographically sorted friendship ID
  const getFriendshipId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  useEffect(() => {
    if (!userId || !db) return;

    setLoading(true);

    // 1. Fetch target user doc
    const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        setTargetUser(snap.data());
      } else {
        onClose();
      }
      setLoading(false);
    });

    // 2. Fetch current user data (to pass their name/avatar when sending requests or starting duels)
    if (myUid) {
      getDoc(doc(db, "users", myUid)).then((snap) => {
        if (snap.exists()) {
          setCurrentUserData(snap.data());
        }
      });
    }

    // 3. Listen to relationship state
    let unsubFriendship = () => {};
    if (myUid) {
      const friendshipId = getFriendshipId(myUid, userId);
      
      // Check friendships
      unsubFriendship = onSnapshot(doc(db, "friendships", friendshipId), (friendshipSnap) => {
        if (friendshipSnap.exists()) {
          setRelation("friends");
        } else {
          // If not friends, check pending requests
          const reqSentRef = doc(db, "friend_requests", `${myUid}_${userId}`);
          const reqReceivedRef = doc(db, "friend_requests", `${userId}_${myUid}`);

          getDoc(reqSentRef).then((sentSnap) => {
            if (sentSnap.exists() && sentSnap.data()?.status === "pending") {
              setRelation("sent_pending");
            } else {
              getDoc(reqReceivedRef).then((receivedSnap) => {
                if (receivedSnap.exists() && receivedSnap.data()?.status === "pending") {
                  setRelation("received_pending");
                } else {
                  setRelation("none");
                }
              });
            }
          });
        }
      });
    } else {
      setRelation("none");
    }

    // 4. Listen to real followers/following/posts counts
    const qFollowers = query(collection(db, "follows"), where("followingId", "==", userId));
    const unsubFollowers = onSnapshot(qFollowers, (snap) => {
      setFollowersCount(snap.size);
    });

    const qFollowing = query(collection(db, "follows"), where("followerId", "==", userId));
    const unsubFollowing = onSnapshot(qFollowing, (snap) => {
      setFollowingCount(snap.size);
    });

    const qPosts = query(collection(db, "posts"), where("userId", "==", userId));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPostsCount(snap.size);
    });

    let unsubIsFollowing = () => {};
    if (myUid) {
      const followDocId = `${myUid}_${userId}`;
      unsubIsFollowing = onSnapshot(doc(db, "follows", followDocId), (followSnap) => {
        setIsFollowing(followSnap.exists());
      });
    }

    return () => {
      unsubUser();
      unsubFriendship();
      unsubFollowers();
      unsubFollowing();
      unsubPosts();
      unsubIsFollowing();
    };
  }, [userId, myUid]);

  const handleFollowToggle = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      const followDocId = `${myUid}_${userId}`;
      const followRef = doc(db, "follows", followDocId);
      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId: myUid,
          followingId: userId,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Error toggling follow:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Actions
  const handleAddFriend = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      const requestRef = doc(db, "friend_requests", `${myUid}_${userId}`);
      await setDoc(requestRef, {
        senderId: myUid,
        senderName: currentUserData?.displayName || "مستخدم يقين",
        senderAvatar: currentUserData?.photoURL || "",
        receiverId: userId,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setRelation("sent_pending");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "friend_requests", `${myUid}_${userId}`));
      setRelation("none");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      const friendshipId = getFriendshipId(myUid, userId);
      
      // 1. Create friendship document
      await setDoc(doc(db, "friendships", friendshipId), {
        users: [myUid, userId],
        createdAt: serverTimestamp()
      });

      // 2. Delete the pending request
      await deleteDoc(doc(db, "friend_requests", `${userId}_${myUid}`));
      
      // 3. Create or initialize direct chat document
      await setDoc(doc(db, "chats", friendshipId), {
        participants: [myUid, userId],
        lastMessage: "تم قبول طلب الصداقة، ابدأوا الآن كلامكم الطيب ✨",
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [myUid]: 0,
          [userId]: 0
        }
      });

      setRelation("friends");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء قبول الصداقة");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "friend_requests", `${userId}_${myUid}`));
      setRelation("none");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    if (!await window.confirm("هل أنت متأكد من رغبتك في إزالة هذا الصديق؟")) return;
    setActionLoading(true);
    try {
      const friendshipId = getFriendshipId(myUid, userId);
      await deleteDoc(doc(db, "friendships", friendshipId));
      setRelation("none");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    window.dispatchEvent(new CustomEvent("open_direct_chat", { detail: { userId } }));
    onClose();
  };

  const handleStartDuel = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    if (!await window.confirm(`هل أنت مستعد لتحدي ${targetUser.displayName} في مبارزة نقاط إيمانية لمدة 3 أيام؟ ⚔️`)) return;
    setActionLoading(true);
    try {
      // Check if there is already an active duel between these two users
      const activeDuelsQuery = query(
        collection(db, "duels"),
        where("participants", "array-contains", myUid),
        where("status", "==", "active")
      );
      const activeDuelsSnap = await getDocs(activeDuelsQuery);
      
      // Filter duels to see if opponent is our target friend
      const alreadyDueling = activeDuelsSnap.docs.some(doc => {
        const data = doc.data();
        return data.participants.includes(userId);
      });

      if (alreadyDueling) {
        alert("توجد مبارزة نشطة بالفعل بينكما حالياً!");
        return;
      }

      const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

      const duelData = {
        participants: [myUid, userId],
        names: {
          [myUid]: currentUserData?.displayName || "أنا",
          [userId]: targetUser.displayName || "صديقي"
        },
        avatars: {
          [myUid]: currentUserData?.photoURL || "",
          [userId]: targetUser.photoURL || ""
        },
        creatorId: myUid,
        status: "active",
        createdAt: serverTimestamp(),
        endsAt: endsAt.toISOString(),
        startPoints: {
          [myUid]: currentUserData?.totalPoints || 0,
          [userId]: targetUser.totalPoints || 0
        },
        currentPoints: {
          [myUid]: currentUserData?.totalPoints || 0,
          [userId]: targetUser.totalPoints || 0
        },
        likes: {
          [myUid]: 0,
          [userId]: 0
        },
        cheerers: {
          [myUid]: [],
          [userId]: []
        }
      };

      await addDoc(collection(db, "duels"), duelData);
      alert("⚔️ تم بدء المبارزة بنجاح! سابق صديقك الآن في الطاعات والأذكار واجمع النقاط ليفوز الأحرص!");
      onClose();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء بدء التحدي");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    if (!await window.confirm("هل أنت متأكد من رغبتك في حظر هذا المستخدم نهائياً؟ لن تتمكن من التفاعل معه مجدداً.")) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, "users", myUid);
      const userSnap = await getDoc(userRef);
      const currentBlocked = userSnap.exists() ? (userSnap.data().blockedUsers || []) : [];
      const updatedBlocked = currentBlocked.includes(userId) ? currentBlocked : [...currentBlocked, userId];
      
      if (!currentBlocked.includes(userId)) {
        await updateDoc(userRef, { blockedUsers: updatedBlocked });
        setCurrentUserData((prev: any) => prev ? { ...prev, blockedUsers: updatedBlocked } : prev);
      }

      // Delete friendship and requests
      try {
        await deleteDoc(doc(db, "friend_requests", `${myUid}_${userId}`));
      } catch {}
      try {
        await deleteDoc(doc(db, "friend_requests", `${userId}_${myUid}`));
      } catch {}

      const friendshipId = getFriendshipId(myUid, userId);
      try {
        await deleteDoc(doc(db, "friendships", friendshipId));
      } catch {}

      alert("تم حظر المستخدم بنجاح 🚫");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحظر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!myUid || !userId || !db || actionLoading) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, "users", myUid);
      const userSnap = await getDoc(userRef);
      const currentBlocked = userSnap.exists() ? (userSnap.data().blockedUsers || []) : [];
      const updatedBlocked = currentBlocked.filter((uid: string) => uid !== userId);
      await updateDoc(userRef, { blockedUsers: updatedBlocked });
      
      setCurrentUserData((prev: any) => prev ? { ...prev, blockedUsers: updatedBlocked } : prev);
      alert("تم إلغاء الحظر بنجاح ✅");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إلغاء الحظر");
    } finally {
      setActionLoading(false);
    }
  };

  // Check privacy helpers
  const canSeePhone = () => {
    if (userId === myUid) return true;
    const privacy = targetUser?.privacySettings?.phone || "private";
    if (privacy === "public") return true;
    if (privacy === "friends" && relation === "friends") return true;
    return false;
  };

  const canSeeBirthDate = () => {
    if (userId === myUid) return true;
    const privacy = targetUser?.privacySettings?.birthDate || "public";
    if (privacy === "public") return true;
    if (privacy === "friends" && relation === "friends") return true;
    return false;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar font-['Tajawal']">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Cover Backdrop */}
        <div className="h-28 bg-gradient-to-r from-primary/30 to-purple-500/20 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground/70 hover:text-foreground flex items-center justify-center transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-8 pt-0 -mt-12 relative z-10 flex flex-col items-center text-center">
          <img 
            src={targetUser?.photoURL || "https://api.dicebear.com/9.x/avataaars/svg?seed=Yaqeen"} 
            alt="Avatar" 
            className="w-24 h-24 rounded-full border-4 border-card bg-card shadow-2xl object-cover mb-4" 
          />

          <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
            {targetUser?.displayName || "قارئ يقين"}
            {targetUser?.plan && targetUser.plan !== 'free' && (
              <Crown className="w-5 h-5 text-primary fill-current animate-pulse" />
            )}
          </h3>
          <p className="text-primary text-xs font-bold font-mono tracking-widest mt-1">@{targetUser?.username}</p>
          
          <div className="flex items-center gap-2 text-foreground/40 text-[10px] font-black bg-foreground/5 px-3 py-1 rounded-full mt-3">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{targetUser?.country || targetUser?.governorate || "مصر"}</span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-1 w-full max-w-sm mt-6 p-4 rounded-2xl bg-foreground/5 border border-border shadow-inner text-center">
            <div>
              <span className="block text-lg font-black text-foreground">{postsCount}</span>
              <span className="text-[8px] text-foreground/35 font-bold uppercase tracking-widest">المنشورات</span>
            </div>
            <div className="border-r border-border">
              <span className="block text-lg font-black text-foreground">{followersCount.toLocaleString()}</span>
              <span className="text-[8px] text-foreground/35 font-bold uppercase tracking-widest">المتابعون</span>
            </div>
            <div className="border-r border-border">
              <span className="block text-lg font-black text-foreground">{followingCount.toLocaleString()}</span>
              <span className="text-[8px] text-foreground/35 font-bold uppercase tracking-widest">يتابع</span>
            </div>
          </div>

          {/* Personal details with privacy */}
          <div className="w-full max-w-sm space-y-3 mt-6">
            {/* Phone */}
            <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-xs text-foreground/45 font-bold">رقم الهاتف</span>
              </div>
              <span className="text-sm font-mono font-bold text-foreground flex items-center gap-1.5">
                {canSeePhone() ? (
                  targetUser?.phoneNumber || "غير متوفر"
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-foreground/20" />
                    <span className="text-foreground/20 text-xs">خاص</span>
                  </>
                )}
              </span>
            </div>

            {/* BirthDate */}
            <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs text-foreground/45 font-bold">تاريخ الميلاد</span>
              </div>
              <span className="text-sm font-mono font-bold text-foreground flex items-center gap-1.5">
                {canSeeBirthDate() ? (
                  targetUser?.birthDate || "غير متوفر"
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-foreground/20" />
                    <span className="text-foreground/20 text-xs">خاص</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm mt-8 space-y-3 relative z-20">
            {!myUid ? (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("show_auth_gate"));
                  onClose();
                }}
                className="w-full py-4 bg-primary text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                سجّل دخولك للتفاعل مع هذا القارئ
              </button>
            ) : userId === myUid ? (
              <div className="w-full space-y-3">
                <div className="w-full py-3.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  هذا هو حسابك الشخصي ✨
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open_profile_settings"));
                    onClose();
                  }}
                  className="w-full py-4 bg-primary text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  تعديل الملف الشخصي وإدارة الأصدقاء ⚙️
                </button>
              </div>
            ) : (
              <>
                {myUid && userId !== myUid && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={actionLoading}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 mb-2 ${
                      isFollowing 
                        ? "bg-foreground/10 text-foreground border border-border" 
                        : "bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black shadow-lg shadow-[#fbbf24]/10"
                    }`}
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? "متابع" : "متابعة"}
                  </button>
                )}
                {currentUserData?.blockedUsers?.includes(userId) ? (
                  <div className="space-y-3 w-full">
                    <div className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-black text-sm text-center">
                      لقد قمت بحظر هذا المستخدم 🚫
                    </div>
                    <button
                      onClick={handleUnblockUser}
                      disabled={actionLoading}
                      className="force-dark w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      إلغاء الحظر ✅
                    </button>
                  </div>
                ) : targetUser?.blockedUsers?.includes(myUid) ? (
                  <div className="w-full py-4 bg-foreground/5 border border-border text-foreground/45 rounded-2xl font-black text-sm text-center">
                    التفاعل غير متاح
                  </div>
                ) : (
                  <>
                    {/* Friendship action */}
                    {relation === "none" && (
                      <button
                        onClick={handleAddFriend}
                        disabled={actionLoading}
                        className="w-full py-4 bg-primary text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        إرسال طلب صداقة
                      </button>
                    )}

                    {relation === "sent_pending" && (
                      <button
                        onClick={handleCancelRequest}
                        disabled={actionLoading}
                        className="w-full py-4 bg-foreground/5 border border-border text-foreground/75 rounded-2xl font-black text-sm hover:bg-foreground/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Loader2 className="w-4 h-4 animate-pulse" />}
                        طلب الصداقة معلق (إلغاء ❌)
                      </button>
                    )}

                    {relation === "received_pending" && (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={handleAcceptFriend}
                          disabled={actionLoading}
                          className="force-dark flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          قبول
                        </button>
                        <button
                          onClick={handleRejectRequest}
                          disabled={actionLoading}
                          className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black text-sm active:scale-95 transition-all border border-red-500/20 flex items-center justify-center"
                        >
                          رفض
                        </button>
                      </div>
                    )}

                    {relation === "friends" && (
                      <div className="space-y-3 w-full">
                        <div className="flex gap-3">
                          {/* Chat */}
                          <button
                            onClick={handleStartChat}
                            disabled={actionLoading}
                            className="flex-1 py-4 bg-primary text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            محادثة
                          </button>
                          {/* Duel */}
                          <button
                            onClick={handleStartDuel}
                            disabled={actionLoading}
                            className="force-dark flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 border border-purple-500/30"
                          >
                            <Swords className="w-4 h-4" />
                            مبارزة
                          </button>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleUnfriend}
                            disabled={actionLoading}
                            className="flex-1 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground/75 rounded-2xl font-black text-xs active:scale-95 transition-all border border-border flex items-center justify-center gap-2"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            إزالة الصداقة
                          </button>
                          
                          <button
                            onClick={handleBlockUser}
                            disabled={actionLoading}
                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black text-xs active:scale-95 transition-all border border-red-500/20 flex items-center justify-center gap-2"
                          >
                            حظر نهائي 🚫
                          </button>
                        </div>
                      </div>
                    )}

                    {relation !== "friends" && (
                      <button
                        onClick={handleBlockUser}
                        disabled={actionLoading}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black text-xs active:scale-95 transition-all border border-red-500/20 flex items-center justify-center gap-2 mt-2"
                      >
                        حظر المستخدم 🚫
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
