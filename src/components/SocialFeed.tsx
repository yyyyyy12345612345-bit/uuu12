"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Heart, MessageCircle, Share2, MoreHorizontal, Trash2,
  Loader2, User, EyeOff, ChevronDown, X, AlertCircle, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, orderBy, limit, startAfter,
  doc, deleteDoc, updateDoc, increment, serverTimestamp, getDoc,
  onSnapshot, where, setDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ─── Helpers ─── */
const timeAgo = (date: any) => {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
};

const PROFANITY_WORDS = [
  "كسم", "شرمو", "خول", "منيوك", "كسخت", "عرص", "ديوث", "قحبة", "كلب", "ابن الكلب", "ابن كلب", 
  "شرموطة", "شرموطه", "وسخ", "يا وسخ", "تفه", "تفوه", "تف عليك", "زبي", "طيز", "نيك", "منيوكه",
  "كس اختك", "كس امك", "ياعرص", "يا خول", "يا ديوث", "يا كلب", "يا حمار", "حمار"
];

const checkProfanity = (text: string): boolean => {
  if (!text) return false;
  const normalized = text
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[.,!?()؛؟?"'«»]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  
  const words = normalized.split(" ");
  return PROFANITY_WORDS.some(badWord => {
    if (badWord.includes(" ")) {
      return normalized.includes(badWord);
    }
    return words.includes(badWord);
  });
};

const NAV_H = 64;

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: any;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

interface Comment {
  id: string;
  userId: string | null;
  userName: string;
  userAvatar: string;
  content: string;
  isAnonymous: boolean;
  createdAt: any;
}

export function SocialFeed() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isAnonymous, setIsAnonymous] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 15;

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserData(snap.data());
      }
    });
    return () => unsub();
  }, []);

  // Load Posts
  const loadPosts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoadingPosts(true);

    try {
      let q;
      if (isLoadMore && lastDoc) {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(POSTS_PER_PAGE));
      } else {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
      }

      const snap = await getDocs(q);
      const newPosts = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(p => p.isBlocked !== true) as Post[];

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === POSTS_PER_PAGE);

      // Check liked posts for current user
      if (user) {
        const allPostIds = isLoadMore ? [...posts, ...newPosts].map(p => p.id) : newPosts.map(p => p.id);
        const likeChecks = await Promise.all(
          allPostIds.map(async (pid) => {
            const likeSnap = await getDoc(doc(db, "posts", pid, "likes", user.uid));
            return likeSnap.exists() ? pid : null;
          })
        );
        setLikedPosts(new Set(likeChecks.filter(Boolean) as string[]));
      }
    } catch (e) {
      console.error("Error loading posts:", e);
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  }, [lastDoc, user]);

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!user || !newPost.trim() || posting) return;
    if (checkProfanity(newPost)) {
      alert("⚠️ عذراً، لا يمكن نشر محتوى يحتوي على كلمات غير لائقة.");
      return;
    }
    setPosting(true);
    try {
      const postData = {
        userId: user.uid,
        userName: userData?.displayName || user.displayName || "مستخدم",
        userAvatar: userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`,
        content: newPost.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      };
      const docRef = await addDoc(collection(db, "posts"), postData);
      setPosts(prev => [{ id: docRef.id, ...postData, createdAt: new Date() } as Post, ...prev]);
      setNewPost("");
    } catch (e) {
      console.error("Error creating post:", e);
      alert("حدث خطأ أثناء نشر المنشور");
    } finally {
      setPosting(false);
    }
  };

  // Like/Unlike Post
  const toggleLike = async (postId: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً للتفاعل");
      return;
    }
    const isLiked = likedPosts.has(postId);
    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const postRef = doc(db, "posts", postId);

    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isLiked ? -1 : 1) } : p));

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (e) {
      console.error("Error toggling like:", e);
      // Revert
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isLiked ? 1 : -1) } : p));
    }
  };

  // Share
  const handleShare = async (post: Post) => {
    const shareText = `${post.content.slice(0, 100)}...\n\nعبر تطبيق يقين القرآن`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "منشور من يقين القرآن", text: shareText, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("تم نسخ المنشور ✅");
      }
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, { sharesCount: increment(1) });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, sharesCount: p.sharesCount + 1 } : p));
    } catch (e) { console.error(e); }
  };

  // Load Comments
  const loadComments = async (postId: string) => {
    try {
      const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const cmts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      setComments(prev => ({ ...prev, [postId]: cmts }));
    } catch (e) {
      console.error("Error loading comments:", e);
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      if (!comments[postId]) loadComments(postId);
    }
  };

  // Post Comment
  const handlePostComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || postingComment) return;
    if (checkProfanity(text)) {
      alert("⚠️ عذراً، لا يمكن نشر تعليق يحتوي على كلمات غير لائقة.");
      return;
    }

    const anon = isAnonymous[postId] ?? false;
    if (!anon && !user) {
      alert("يجب تسجيل الدخول أولاً أو التعليق كمجهول");
      return;
    }

    setPostingComment(postId);
    try {
      const commentData = {
        userId: anon ? null : user?.uid || null,
        userName: anon ? "مجهول" : (userData?.displayName || user?.displayName || "مستخدم"),
        userAvatar: anon ? "" : (userData?.photoURL || user?.photoURL || ""),
        content: text,
        isAnonymous: anon,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "posts", postId, "comments"), commentData);

      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { id: docRef.id, ...commentData, createdAt: new Date() } as Comment],
      }));
      setCommentText(prev => ({ ...prev, [postId]: "" }));

      // Update comment count
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { commentsCount: increment(1) });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch (e) {
      console.error("Error posting comment:", e);
      alert("حدث خطأ أثناء نشر التعليق");
    } finally {
      setPostingComment(null);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      console.error("Error deleting post:", e);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  // Report Post
  const handleReportPost = async (postId: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً للإبلاغ عن منشور.");
      return;
    }
    const postRef = doc(db, "posts", postId);
    const reportUserRef = doc(db, "posts", postId, "reports", user.uid);
    
    try {
      const reportSnap = await getDoc(reportUserRef);
      if (reportSnap.exists()) {
        alert("لقد قمت بالإبلاغ عن هذا المنشور مسبقاً.");
        return;
      }
      
      await setDoc(reportUserRef, { createdAt: serverTimestamp() });
      
      const postSnap = await getDoc(postRef);
      const currentReports = (postSnap.data()?.reportsCount || 0) + 1;
      const isBlocked = currentReports >= 2;
      
      await updateDoc(postRef, {
        reportsCount: increment(1),
        isBlocked: isBlocked
      });
      
      if (isBlocked) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        alert("شكرًا لك. تم حجب المنشور مؤقتاً لمراجعته من قِبل الإدارة لكثرة البلاغات.");
      } else {
        alert("تم تسجيل بلاغك بنجاح وستقوم الإدارة بمراجعته. شكرًا لك.");
      }
    } catch (e) {
      console.error("Error reporting post:", e);
      alert("حدث خطأ أثناء تقديم البلاغ.");
    }
  };

  // Infinite Scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadPosts(true);
    }
  };

  return (
    <div
      ref={scrollRef}
      dir="rtl"
      className="h-full w-full overflow-y-auto no-scrollbar font-['Tajawal']"
      onScroll={handleScroll}
      style={{ paddingBottom: `${NAV_H + 20}px` }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-black">مجتمع يقين</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Create Post */}
        {user ? (
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-lg">
            <div className="flex gap-3 items-start">
              <img
                src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`}
                alt="avatar"
                className="w-10 h-10 rounded-full bg-foreground/10 border border-border/50 shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="شارك فكرة، دعاء، أو كلمة طيبة..."
                  rows={3}
                  className="w-full bg-foreground/5 border border-border/30 rounded-2xl py-3 px-4 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-foreground/30 font-bold resize-none text-right"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] font-bold ${newPost.length > 450 ? 'text-red-400' : 'text-foreground/20'}`}>
                    {newPost.length}/500
                  </span>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim() || posting}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                  >
                    {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    نشر
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 text-center shadow-lg">
            <User className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-foreground/40 font-bold">سجّل دخولك لنشر منشور جديد</p>
          </div>
        )}

        {/* Posts List */}
        {loadingPosts ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-foreground/30 font-bold">جاري تحميل المنشورات...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <MessageCircle className="w-12 h-12 text-foreground/10" />
            <p className="text-sm text-foreground/30 font-bold">لا توجد منشورات بعد</p>
            <p className="text-xs text-foreground/20">كن أول من يشارك كلمة طيبة!</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <button 
                  onClick={() => post.userId && window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: post.userId } }))}
                  className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={post.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.userId}`}
                    alt=""
                    className="w-10 h-10 rounded-full bg-foreground/10 border border-border/50 shrink-0 object-cover"
                  />
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-black truncate">{post.userName}</p>
                    <p className="text-[10px] text-foreground/30 font-bold">{timeAgo(post.createdAt)}</p>
                  </div>
                </button>
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                      className="p-2 rounded-full hover:bg-foreground/5 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-foreground/30" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === post.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 min-w-[120px]"
                        >
                          {user.uid === post.userId ? (
                            <button
                              onClick={() => { handleDeletePost(post.id); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف المنشور
                            </button>
                          ) : (
                            <button
                              onClick={() => { handleReportPost(post.id); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-amber-500 text-xs font-bold hover:bg-amber-500/10 transition-colors"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              الإبلاغ عن المنشور
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-5 py-3">
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words font-medium">
                  {post.content}
                </p>
              </div>

              {/* Counts */}
              {(post.likesCount > 0 || post.commentsCount > 0) && (
                <div className="flex items-center justify-between px-5 py-2 border-t border-border/20">
                  {post.likesCount > 0 && (
                    <span className="text-[11px] text-foreground/30 font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400 fill-current" />
                      {post.likesCount}
                    </span>
                  )}
                  {post.commentsCount > 0 && (
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-[11px] text-foreground/30 font-bold hover:text-foreground/50 transition-colors"
                    >
                      {post.commentsCount} تعليق
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex border-t border-border/20">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all active:scale-95 ${
                    likedPosts.has(post.id) ? 'text-red-400' : 'text-foreground/40 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-all ${likedPosts.has(post.id) ? 'fill-current scale-110' : ''}`} />
                  أعجبني
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-foreground/40 hover:text-primary transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  تعليق
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-foreground/40 hover:text-blue-400 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </button>
              </div>

              {/* Comments Section */}
              <AnimatePresence>
                {expandedComments === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border/20 overflow-hidden"
                  >
                    <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                      {/* Comments List */}
                      {(comments[post.id] || []).map((cmt) => (
                        <div key={cmt.id} className="flex gap-2.5 items-start">
                          {cmt.isAnonymous ? (
                            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                              <EyeOff className="w-3.5 h-3.5 text-foreground/30" />
                            </div>
                          ) : (
                            <img
                              src={cmt.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${cmt.userId}`}
                              alt=""
                              className="w-8 h-8 rounded-full bg-foreground/10 border border-border/30 shrink-0 object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="bg-foreground/5 rounded-2xl px-3.5 py-2.5">
                              <p className="text-[11px] font-black text-foreground/60 mb-0.5">
                                {cmt.isAnonymous ? "مجهول 🕶️" : cmt.userName}
                              </p>
                              <p className="text-xs text-foreground/80 leading-relaxed break-words">
                                {cmt.content}
                              </p>
                            </div>
                            <p className="text-[9px] text-foreground/20 font-bold mt-1 px-2">
                              {timeAgo(cmt.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {comments[post.id]?.length === 0 && (
                        <p className="text-center text-xs text-foreground/20 py-4 font-bold">
                          لا توجد تعليقات بعد — كن أول من يعلّق!
                        </p>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 pt-0 border-t border-border/10">
                      {/* Anonymous Toggle */}
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <button
                          onClick={() => setIsAnonymous(prev => ({ ...prev, [post.id]: !(prev[post.id] ?? false) }))}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                            isAnonymous[post.id]
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                              : 'bg-foreground/5 border-border/30 text-foreground/30'
                          }`}
                        >
                          <EyeOff className="w-3 h-3" />
                          {isAnonymous[post.id] ? 'تعليق كمجهول' : 'تعليق بحسابي'}
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          value={commentText[post.id] || ""}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment(post.id)}
                          placeholder={isAnonymous[post.id] ? "اكتب تعليقاً مجهولاً..." : "اكتب تعليقاً..."}
                          className="flex-1 bg-foreground/5 border border-border/30 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary/50 transition-all placeholder:text-foreground/20 font-bold text-right"
                          maxLength={300}
                        />
                        <button
                          onClick={() => handlePostComment(post.id)}
                          disabled={!commentText[post.id]?.trim() || postingComment === post.id}
                          className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-md"
                        >
                          {postingComment === post.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}

        {/* Load More */}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-[10px] text-foreground/20 font-bold py-6 uppercase tracking-widest">
            — نهاية المنشورات —
          </p>
        )}
      </div>
    </div>
  );
}
