"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Heart, MessageCircle, Share2, MoreHorizontal, Trash2,
  Loader2, User, EyeOff, X, AlertCircle, Bookmark, BookmarkCheck,
  Crown, Star, Sparkles, BookOpen, HandHeart, Award, Users, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, orderBy, limit, startAfter,
  doc, deleteDoc, updateDoc, increment, serverTimestamp, getDoc,
  setDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { checkAndAwardBadges } from "@/lib/badges";

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

const SEVERE_PROFANITY = [
  "كسم", "خول", "عرص", "ديوث", "قحبة", "قحبه", "زبي", "طيز", "نيك", 
  "قواد", "عاهرة", "عاهره", "عاهر", "احا", "منيوك", "منيوكة", "منيوكه", 
  "كسخت", "كس", "كس اختك", "كس امك", "ياعرص", "يا خول", "يا ديوث", "شرموط", "شرموطة", "شرموطه", "شرمو",
  "طز", "قرف", "طز فيك"
];

const MILD_QUESTIONABLE = [
  "كلب", "وسخ", "تفه", "تفوه", "زبالة", "زباله", "حمار", "تيس", "جحش",
  "بضان", "شخاخ", "بول", "نجس", "حيوان", "سافل", "حقير", "منحط", "قذر",
  "ابن الحرام", "اولاد الحرام", "ولاد الحرام", "ابن الكلب", "ابن كلب",
  "بنت كلب", "بنت الكلب", "يا كلب", "يا حمار", "يا حيوان", "تف عليك", "تفو عليك"
];

const checkModerationStatus = (text: string): "block" | "flag" | "clean" => {
  if (!text) return "clean";

  // 1. Strip tashkeel (diacritics)
  let normalized = text.replace(/[\u064B-\u0652\u0670]/g, "");

  // 2. Normalize common letter variants
  normalized = normalized
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء");

  // 3. Remove punctuation, symbols, numbers, and extra whitespaces to counter bypasses
  const strippedOfSymbols = normalized.replace(/[0-9\s\-_*.,!?()؛؟?"'«»[\]{}|<>/\\@#$%^&+=~`:]/g, "");
  
  // Also keep a space-separated normalized version for word-by-word checks
  const cleanWithSpaces = normalized
    .replace(/[0-9\-_*.,!?()؛؟?"'«»[\]{}|<>/\\@#$%^&+=~`:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Helper to collapse consecutive repeated letters (e.g. عررررص -> عرص)
  const collapseDuplicates = (str: string) => {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      if (i === 0 || str[i] !== str[i - 1]) {
        result += str[i];
      }
    }
    return result;
  };

  const collapsedStripped = collapseDuplicates(strippedOfSymbols);
  const wordsList = cleanWithSpaces.split(" ");
  const collapsedWordsList = wordsList.map(w => collapseDuplicates(w));

  // A. Check Severe Profanity first (Hard block)
  const severeSubstrings = [
    "كسم", "شرمو", "منيوك", "كسخت", "عرص", "ديوث", "قحبة", "قحبه", "طيز", "زبي", "نيك", "شرمط"
  ];

  for (const sub of severeSubstrings) {
    if (collapsedStripped.includes(sub) || strippedOfSymbols.includes(sub)) {
      return "block";
    }
  }

  for (const word of SEVERE_PROFANITY) {
    if (word.includes(" ")) {
      if (cleanWithSpaces.includes(word) || collapseDuplicates(cleanWithSpaces).includes(collapseDuplicates(word))) {
        return "block";
      }
    } else {
      if (wordsList.includes(word) || collapsedWordsList.includes(word)) {
        return "block";
      }
    }
  }

  // B. Check Mild/Questionable Profanity (Soft block)
  for (const word of MILD_QUESTIONABLE) {
    if (word.includes(" ")) {
      if (cleanWithSpaces.includes(word) || collapseDuplicates(cleanWithSpaces).includes(collapseDuplicates(word))) {
        return "flag";
      }
    } else {
      if (wordsList.includes(word) || collapsedWordsList.includes(word)) {
        return "flag";
      }
    }
  }

  return "clean";
};

const checkProfanity = (text: string): boolean => {
  return checkModerationStatus(text) !== "clean";
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
  category?: string;
  backgroundStyle?: string;
  reactions?: Record<string, number>;
  isBlocked?: boolean;
}

interface Comment {
  id: string;
  userId: string | null;
  userName: string;
  userAvatar: string;
  content: string;
  isAnonymous: boolean;
  createdAt: any;
  isBlocked?: boolean;
  autoFlagged?: boolean;
  parentId?: string | null;
  replyToName?: string | null;
  likes?: string[];
  likesCount?: number;
}

const CATEGORIES = [
  { id: "all", label: "الكل", icon: Users },
  { id: "dua", label: "أدعية 🤲", icon: HandHeart },
  { id: "reflection", label: "تدبر آية 📖", icon: BookOpen },
  { id: "hadith", label: "حديث شريف 📚", icon: Award },
  { id: "good", label: "كلمة طيبة 🌟", icon: Sparkles },
  { id: "saved", label: "المحفوظات 🔖", icon: Bookmark }
];

const THEMES = [
  { id: "glass", label: "افتراضي", class: "bg-card/60 backdrop-blur-xl border border-border/50 text-foreground" },
  { id: "gold", label: "ذهبي فاخر ✨", class: "bg-gradient-to-br from-[#1c160c] via-[#0c0d10] to-[#1c160c] border border-[#fbbf24]/30 shadow-[0_15px_30px_rgba(251,191,36,0.08)] text-white" },
  { id: "emerald", label: "زمردي إسلامي 🌿", class: "bg-gradient-to-br from-[#0a1c14] via-[#0c0d10] to-[#0a1c14] border border-emerald-500/30 shadow-[0_15px_30px_rgba(16,185,129,0.08)] text-white" },
  { id: "midnight", label: "ليلي براق 🌙", class: "bg-gradient-to-br from-[#0c1328] via-[#0c0d10] to-[#0c1328] border border-sky-500/30 shadow-[0_15px_30px_rgba(14,165,233,0.08)] text-white" }
];

const REACTION_EMOJIS = [
  { type: "like", emoji: "❤️", label: "أعجبني" },
  { type: "amin", emoji: "🤲", label: "آمين" },
  { type: "inspired", emoji: "🌟", label: "ألهمتني" },
  { type: "reflected", emoji: "📖", label: "تدبرت" }
];

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
  
  // Custom states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [creatorCategory, setCreatorCategory] = useState("good");
  const [creatorTheme, setCreatorTheme] = useState("glass");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [authorsData, setAuthorsData] = useState<Record<string, any>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [activeReactionPopup, setActiveReactionPopup] = useState<string | null>(null);

  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isAnonymous, setIsAnonymous] = useState<Record<string, boolean>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; userName: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 15;

  // Auth & Load saved bookmarks
  useEffect(() => {
    const saved = localStorage.getItem("bookmarked_posts");
    if (saved) {
      try { setBookmarkedPosts(new Set(JSON.parse(saved))); } catch (e) { console.error(e); }
    }

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
      const rawPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // Filter blocked posts client-side (allow current user to see their own blocked posts as 'under review')
      const newPosts = rawPosts.filter(p => p.isBlocked !== true || p.userId === user?.uid) as Post[];

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === POSTS_PER_PAGE);

      // Fetch authors data dynamically to render badges & levels
      const userIds = newPosts.map(p => p.userId);
      const userDetailsMap: Record<string, any> = {};
      await Promise.all(
        Array.from(new Set(userIds)).map(async (uid) => {
          if (!uid) return;
          const uSnap = await getDoc(doc(db, "users", uid));
          if (uSnap.exists()) {
            userDetailsMap[uid] = uSnap.data();
          }
        })
      );
      setAuthorsData(prev => ({ ...prev, ...userDetailsMap }));

      // Check user active reactions
      if (user) {
        const allPostIds = isLoadMore ? [...posts, ...newPosts].map(p => p.id) : newPosts.map(p => p.id);
        const reactionChecks = await Promise.all(
          allPostIds.map(async (pid) => {
            const likeSnap = await getDoc(doc(db, "posts", pid, "likes", user.uid));
            return likeSnap.exists() ? { pid, type: likeSnap.data().reactionType || "like" } : null;
          })
        );
        const reactionMap: Record<string, string> = {};
        reactionChecks.forEach(r => {
          if (r) reactionMap[r.pid] = r.type;
        });
        setUserReactions(prev => ({ ...prev, ...reactionMap }));
      }
    } catch (e) {
      console.error("Error loading posts:", e);
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  }, [lastDoc, user, posts]);

  useEffect(() => {
    loadPosts();
  }, [user]);

  // Create Post
  const handleCreatePost = async () => {
    if (!user || !newPost.trim() || posting) return;
    
    const modStatus = checkModerationStatus(newPost);
    if (modStatus === "block") {
      alert("⚠️ عذراً، لا يمكن نشر محتوى يحتوي على كلمات غير لائقة.");
      return;
    }
    const isAutoBlocked = modStatus === "flag";
    
    setPosting(true);
    try {
      // 🛡️ رقابة ذكية عبر الذكاء الاصطناعي (تأكيد العلاقة بالإسلام والمواضيع الدعوية وعدم وجود بذاءة)
      let isOffTopic = false;
      let isProfane = false;
      let reason = "";
      try {
        const modRes = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPost.trim()
          })
        });
        if (modRes.ok) {
          const modData = await modRes.json();
          isOffTopic = !!modData.isOffTopic;
          isProfane = !!modData.isProfane;
          reason = modData.reason || "";
        }
      } catch (err) {
        console.error("Moderation check failed:", err);
      }

      if (isProfane) {
        alert(`⚠️ عذراً، لا يمكن نشر هذا المحتوى لأنه يحتوي على ألفاظ غير لائقة: ${reason || "محتوى غير لائق"}`);
        setPosting(false);
        return;
      }

      if (isOffTopic) {
        alert(`⚠️ عذراً، هذا المنشور غير متعلق بالإسلام أو المواضيع الدعوية. يرجى كتابة منشورات إسلامية أو أدعية أو عبارات طيبة فقط لتعم الفائدة. السبب: ${reason || "محتوى خارج السياق"}`);
        setPosting(false);
        return;
      }

      const postData = {
        userId: user.uid,
        userName: userData?.displayName || user.displayName || "مستخدم",
        userAvatar: userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`,
        content: newPost.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        category: creatorCategory,
        backgroundStyle: creatorTheme,
        reactions: { like: 0, amin: 0, inspired: 0, reflected: 0 },
        isBlocked: isAutoBlocked,
        autoFlagged: isAutoBlocked,
        reportsCount: isAutoBlocked ? 1 : 0
      };
      const docRef = await addDoc(collection(db, "posts"), postData);
      setPosts(prev => [{ id: docRef.id, ...postData, createdAt: new Date() } as Post, ...prev]);
      setNewPost("");
      // Reset defaults
      setCreatorTheme("glass");
      if (isAutoBlocked) {
        alert("ℹ️ تم نشر مشاركتك وهي قيد مراجعة الإدارة حالياً ولا تظهر للآخرين.");
      }
    } catch (e) {
      console.error("Error creating post:", e);
      alert("حدث خطأ أثناء نشر المنشور");
    } finally {
      setPosting(false);
    }
  };

  // Toggle reactions (Facebook/Instagram style)
  const handleReact = async (postId: string, reactionType: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً للتفاعل");
      return;
    }
    
    const oldReaction = userReactions[postId];
    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const postRef = doc(db, "posts", postId);
    
    // Optimistic Update
    setUserReactions(prev => {
      const next = { ...prev };
      if (oldReaction === reactionType) {
        delete next[postId];
      } else {
        next[postId] = reactionType;
      }
      return next;
    });

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const reactions = { ...(p.reactions || { like: 0, amin: 0, inspired: 0, reflected: 0 }) };
      
      if (oldReaction) {
        reactions[oldReaction as keyof typeof reactions] = Math.max(0, (reactions[oldReaction as keyof typeof reactions] || 0) - 1);
      }
      if (oldReaction !== reactionType) {
        reactions[reactionType as keyof typeof reactions] = (reactions[reactionType as keyof typeof reactions] || 0) + 1;
      }
      
      const totalLikes = Object.values(reactions).reduce((a, b) => a + b, 0);
      return {
        ...p,
        reactions,
        likesCount: totalLikes
      };
    }));

    try {
      if (oldReaction === reactionType) {
        await deleteDoc(likeRef);
        
        const updates: any = {};
        updates[`reactions.${reactionType}`] = increment(-1);
        updates.likesCount = increment(-1);
        await updateDoc(postRef, updates);
      } else {
        await setDoc(likeRef, { reactionType, createdAt: serverTimestamp() });
        
        const updates: any = {};
        updates[`reactions.${reactionType}`] = increment(1);
        if (oldReaction) {
          updates[`reactions.${oldReaction}`] = increment(-1);
        } else {
          updates.likesCount = increment(1);
        }
        await updateDoc(postRef, updates);
      }
    } catch (e) {
      console.error("Error setting reaction:", e);
    }
  };

  // Bookmark Toggle
  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      localStorage.setItem("bookmarked_posts", JSON.stringify(Array.from(next)));
      return next;
    });
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

  // Post Comment / Reply
  const handlePostComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || postingComment) return;
    
    const modStatus = checkModerationStatus(text);
    if (modStatus === "block") {
      alert("⚠️ عذراً، لا يمكن نشر تعليق يحتوي على كلمات غير لائقة.");
      return;
    }
    const isAutoBlocked = modStatus === "flag";

    const anon = isAnonymous[postId] ?? false;
    if (!anon && !user) {
      alert("يجب تسجيل الدخول أولاً أو التعليق كمجهول");
      return;
    }

    // Capture parent info if we are replying
    const activeReply = replyingTo && replyingTo.postId === postId ? replyingTo : null;
    const parentId = activeReply ? activeReply.commentId : null;
    const replyToName = activeReply ? activeReply.userName : null;

    setPostingComment(postId);
    try {
      // 🛡️ رقابة ذكية عبر الذكاء الاصطناعي للتعليقات
      let isOffTopic = false;
      let isProfane = false;
      let reason = "";
      try {
        const modRes = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text
          })
        });
        if (modRes.ok) {
          const modData = await modRes.json();
          isOffTopic = !!modData.isOffTopic;
          isProfane = !!modData.isProfane;
          reason = modData.reason || "";
        }
      } catch (err) {
        console.error("Comment moderation check failed:", err);
      }

      if (isProfane) {
        alert(`⚠️ عذراً، لا يمكن نشر التعليق لأنه يحتوي على ألفاظ غير لائقة: ${reason || "محتوى غير لائق"}`);
        setPostingComment(null);
        return;
      }

      if (isOffTopic) {
        alert(`⚠️ عذراً، هذا التعليق غير متعلق بالإسلام أو المواضيع الدعوية والمفيدة. السبب: ${reason || "محتوى خارج السياق"}`);
        setPostingComment(null);
        return;
      }

      const commentData = {
        userId: anon ? null : user?.uid || null,
        userName: anon ? "مجهول" : (userData?.displayName || user?.displayName || "مستخدم"),
        userAvatar: anon ? "" : (userData?.photoURL || user?.photoURL || ""),
        content: text,
        isAnonymous: anon,
        createdAt: serverTimestamp(),
        isBlocked: isAutoBlocked,
        autoFlagged: isAutoBlocked,
        parentId: parentId || null,
        replyToName: replyToName || null,
        likes: [],
        likesCount: 0
      };
      const docRef = await addDoc(collection(db, "posts", postId, "comments"), commentData);

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { id: docRef.id, ...commentData, createdAt: new Date() } as Comment],
      }));
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      setReplyingTo(null); // Clear replying state

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { commentsCount: increment(1) });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));

      if (user && !isAutoBlocked) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            commentsCount: increment(1)
          });
          checkAndAwardBadges(user.uid).catch(console.error);
        } catch (err) {
          console.error("Failed to increment user comment count:", err);
        }
      }

      if (isAutoBlocked) {
        alert("ℹ️ تم نشر تعليقك وهو قيد مراجعة الإدارة حالياً.");
      }
    } catch (e) {
      console.error("Error posting comment:", e);
      alert("حدث خطأ أثناء نشر التعليق");
    } finally {
      setPostingComment(null);
    }
  };

  // Like Comment
  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً للتفاعل مع التعليقات");
      return;
    }

    const postComments = comments[postId] || [];
    const cmt = postComments.find(c => c.id === commentId);
    if (!cmt) return;

    const isLiked = cmt.likes?.includes(user.uid) ?? false;

    // Optimistic Update
    setComments(prev => {
      const list = prev[postId] || [];
      const updated = list.map(c => {
        if (c.id !== commentId) return c;
        const currentLikes = c.likes || [];
        const nextLikes = isLiked
          ? currentLikes.filter(uid => uid !== user.uid)
          : [...currentLikes, user.uid];
        return {
          ...c,
          likes: nextLikes,
          likesCount: nextLikes.length
        };
      });
      return {
        ...prev,
        [postId]: updated
      };
    });

    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: arrayRemove(user.uid),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(user.uid),
          likesCount: increment(1)
        });
      }
    } catch (e) {
      console.error("Error updating comment reaction:", e);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!await window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      console.error("Error deleting post:", e);
      alert("حدث خطأ أثناء الحذف");
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

  // Filter posts based on selected tab category
  const filteredPosts = posts.filter(p => {
    if (selectedCategory === "saved") {
      return bookmarkedPosts.has(p.id);
    }
    if (selectedCategory === "all") {
      return true;
    }
    return p.category === selectedCategory;
  });

  return (
    <div
      ref={scrollRef}
      dir="rtl"
      className="h-full w-full overflow-y-auto no-scrollbar font-arabic relative"
      onScroll={handleScroll}
      style={{ paddingBottom: `${NAV_H + 20}px` }}
    >
      {/* Background Aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#fbbf24]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-500/5 blur-[140px] rounded-full" />
      </div>

      {/* Glass Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20 shadow-lg shadow-[#fbbf24]/5">
            <Users className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">مجتمع يقين</h1>
            <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-wider">Yaqeen Community</p>
          </div>
        </div>
      </div>

      {/* Category Horizontal Scrolling Filters (Bubble Circles) */}
      <div className="relative w-full overflow-x-auto no-scrollbar flex items-center gap-4 px-5 py-6 z-10 select-none snap-x border-b border-border/20 bg-background/20 backdrop-blur-sm">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2.5 py-3 px-5 rounded-full transition-all shrink-0 snap-center border font-bold text-sm ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.03]"
                  : "bg-card/40 border-border/50 text-foreground/50 hover:text-foreground hover:bg-card/75"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* Post Creator Card */}
        {user ? (
          (() => {
            const creatorThemeClass = THEMES.find(t => t.id === creatorTheme)?.class || THEMES[0].class;
            const isCreatorThemeDark = creatorTheme !== "glass";
            return (
              <div className={`rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden transition-all duration-500 border ${creatorThemeClass}`}>
                <div className="flex gap-4 items-start">
                  <div className="relative shrink-0">
                    <img
                      src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-primary/30 object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-4">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="شارك آية متدبرة، دعاء يلامس القلب، أو كلمة طيبة..."
                      rows={3}
                      className={`w-full border rounded-2xl py-3 px-4 text-sm outline-none focus:border-primary/50 transition-all font-bold resize-none text-right leading-relaxed ${
                        isCreatorThemeDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                          : "bg-foreground/[0.03] border-border/30 text-foreground placeholder:text-foreground/30"
                      }`}
                      maxLength={500}
                    />

                    {/* Creator Categories Selector */}
                    <div className="flex flex-col gap-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${isCreatorThemeDark ? "text-white/40" : "text-foreground/40"}`}>
                        تصنيف المنشور
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.filter(c => c.id !== "all" && c.id !== "saved").map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setCreatorCategory(cat.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              creatorCategory === cat.id
                                ? (isCreatorThemeDark ? "bg-white/20 border-white/40 text-white" : "bg-primary/10 border-primary/40 text-primary")
                                : (isCreatorThemeDark ? "bg-white/5 border-transparent text-white/50 hover:bg-white/10" : "bg-foreground/5 border-transparent text-foreground/40")
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Background Styles Theme Selector */}
                    <div className="flex flex-col gap-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${isCreatorThemeDark ? "text-white/40" : "text-foreground/40"}`}>
                        قالب البطاقة
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {THEMES.map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setCreatorTheme(theme.id)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center whitespace-nowrap ${
                              creatorTheme === theme.id
                                ? "bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24] scale-[1.02]"
                                : (isCreatorThemeDark ? "bg-white/5 border-transparent text-white/50 hover:bg-white/10" : "bg-foreground/5 border-transparent text-foreground/40 hover:bg-foreground/10")
                            }`}
                          >
                            {theme.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Controls */}
                    <div className="flex items-center justify-between border-t border-border/10 pt-3">
                      <span className={`text-[10px] font-mono font-bold ${newPost.length > 450 ? 'text-red-400' : (isCreatorThemeDark ? 'text-white/30' : 'text-foreground/20')}`}>
                        {newPost.length}/500
                      </span>
                      
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || posting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#fbbf24]/10"
                      >
                        {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        نشر المنشور
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 text-center shadow-xl flex flex-col items-center gap-4">
            <User className="w-10 h-10 text-foreground/25" />
            <p className="text-sm text-foreground/50 font-bold leading-relaxed">سجّل دخولك الآن لنشر منشور دعوي جديد أو مشاركة الأدعية وتدبرات الآيات في مجتمع يقين.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("show_auth_gate"))}
              className="px-6 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-black text-xs rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/10 cursor-pointer"
            >
              تسجيل الدخول / إنشاء حساب 🔐
            </button>
          </div>
        )}

        {/* Posts List */}
        {loadingPosts ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin" />
            <p className="text-xs text-foreground/30 font-bold">جاري تحميل المنشورات والمجالس...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/20">
              <MessageCircle className="w-8 h-8" />
            </div>
            <p className="text-sm text-foreground/40 font-black">لا توجد منشورات في هذا القسم بعد</p>
            <p className="text-xs text-foreground/25">كن أول من يشارك كلمة طيبة أو دعاء إيماني!</p>
          </div>
        ) : (
          filteredPosts.map((post, idx) => {
            const author = authorsData[post.userId];
            const authorPoints = author?.totalPoints || 0;
            const isUserAdmin = author?.email === "youssefosama@gmail.com";
            
            // Determine background class
            const themeClass = THEMES.find(t => t.id === post.backgroundStyle)?.class || THEMES[0].class;
            const isDarkTheme = post.backgroundStyle && post.backgroundStyle !== "glass";
            const activeReact = userReactions[post.id];

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-[2.5rem] overflow-hidden shadow-lg border hover:shadow-2xl transition-all duration-300 relative group/card ${themeClass}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-2">
                  <button 
                    onClick={() => post.userId && window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: post.userId } }))}
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <img
                      src={post.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.userId}`}
                      alt=""
                      className="w-11 h-11 rounded-full border border-border/30 object-cover bg-foreground/5"
                    />
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-black truncate ${isDarkTheme ? 'text-white' : 'text-foreground'}`}>{post.userName}</p>
                        
                        {/* Dynamic Badges */}
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-black bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md">
                            <Crown className="w-2.5 h-2.5" /> مشرف
                          </span>
                        ) : authorPoints > 1000 ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-black bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/20 px-2 py-0.5 rounded-md">
                            <Star className="w-2.5 h-2.5" /> مميز
                          </span>
                        ) : authorPoints > 500 ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-2.5 h-2.5" /> نشط
                          </span>
                        ) : null}

                        {authorPoints > 0 && (
                          <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded-md ${isDarkTheme ? 'text-white/60 bg-white/10 border-white/20' : 'text-foreground/40 bg-foreground/5 border-border/20'}`}>
                            Lvl {Math.floor(authorPoints / 100) + 1}
                          </span>
                        )}
                      </div>
                      <p className={`text-[9px] font-bold mt-0.5 ${isDarkTheme ? 'text-white/40' : 'text-foreground/30'}`}>{timeAgo(post.createdAt)}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Category Label Badge */}
                    {post.category && (
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase ${isDarkTheme ? 'bg-white/10 border-white/20 text-white/80' : 'bg-foreground/5 border-border/30 text-foreground/60'}`}>
                        {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                      </span>
                    )}

                    {/* Bookmarking Toggle Button */}
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      className={`p-2 rounded-xl transition-all ${isDarkTheme ? 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#fbbf24]' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/40 hover:text-primary'}`}
                      title={bookmarkedPosts.has(post.id) ? "إزالة الحفظ" : "حفظ المنشور"}
                    >
                      {bookmarkedPosts.has(post.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-[#fbbf24]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {/* Action Menu */}
                    {user && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                          className={`p-2 rounded-xl transition-colors ${isDarkTheme ? 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/40 hover:text-foreground/75'}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {menuOpen === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute left-0 top-full mt-1.5 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[130px]"
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
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  {post.isReflection ? (
                    (() => {
                      const getAccentColor = (themeId: string) => {
                        switch(themeId) {
                          case "emerald-gold": return "#d4af37";
                          case "midnight": return "#38bdf8";
                          case "royal-purple": return "#c084fc";
                          case "sunset-crimson": return "#fb7185";
                          default: return "#a7f3d0";
                        }
                      };
                      const accentColor = getAccentColor(post.theme);
                      return (
                        <div 
                          className="p-6 md:p-8 rounded-[2rem] border relative overflow-hidden text-center bg-black/40"
                          style={{ borderColor: accentColor + "40" }}
                        >
                          {/* Quranic Verse */}
                          <p className="font-['Amiri'] text-2xl md:text-3xl font-bold text-white leading-relaxed mb-4" dir="rtl">
                            « {post.verseText} »
                          </p>
                          
                          {/* Verse info */}
                          <p className="text-[11px] font-bold mb-6" style={{ color: accentColor }}>
                            [ سورة {post.surahName} • الآية {post.verseKey?.split(":")[1]} ]
                          </p>
                          
                          {/* Divider */}
                          <div className="w-16 h-px mx-auto my-4 bg-white/10" />
                          
                          {/* User Reflection */}
                          <p className={`text-sm md:text-base leading-relaxed font-bold whitespace-pre-wrap text-right ${isDarkTheme ? 'text-white/80' : 'text-foreground/80'}`} dir="rtl">
                            💡 {post.reflectionText}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <p className={`text-base leading-relaxed whitespace-pre-wrap break-words font-medium text-right ${isDarkTheme ? 'text-white/95' : 'text-foreground/90'}`}>
                      {post.content}
                    </p>
                  )}
                  {post.isBlocked && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-200">
                      <span>هذا المنشور قيد مراجعة الإدارة حالياً ولا يظهر للعامة.</span>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    </div>
                  )}
                </div>

                {/* Likes/Reactions and Comments Counts */}
                {(post.likesCount > 0 || post.commentsCount > 0) && (
                  <div className={`flex items-center justify-between px-6 py-2.5 border-t bg-foreground/[0.01] ${isDarkTheme ? 'border-white/10' : 'border-border/10'}`}>
                    <div className="flex items-center gap-1">
                      {post.reactions && Object.entries(post.reactions).map(([type, count]) => {
                        if (count <= 0) return null;
                        const rx = REACTION_EMOJIS.find(r => r.type === type);
                        return (
                          <span key={type} className="text-xs" title={`${rx?.label}: ${count}`}>
                            {rx?.emoji}
                          </span>
                        );
                      })}
                      <span className={`text-[10px] font-bold mr-1.5 ${isDarkTheme ? 'text-white/40' : 'text-foreground/30'}`}>
                        {post.likesCount} تفاعل
                      </span>
                    </div>

                    {post.commentsCount > 0 && (
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`text-[10px] font-bold transition-colors ${isDarkTheme ? 'text-white/40 hover:text-[#fbbf24]' : 'text-foreground/30 hover:text-[#fbbf24]'}`}
                      >
                        {post.commentsCount} تعليق
                      </button>
                    )}
                  </div>
                )}

                {/* Social Actions Buttons Section */}
                <div className={`flex border-t relative ${isDarkTheme ? 'border-white/10' : 'border-border/10'}`}>
                  
                  {/* Reaction Button with Popover */}
                  <div 
                    className="flex-1 relative"
                    onMouseLeave={() => setActiveReactionPopup(null)}
                  >
                    <button
                      onClick={() => handleReact(post.id, "like")}
                      onLongPress={() => setActiveReactionPopup(post.id)}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 ${
                        activeReact
                          ? (isDarkTheme ? "text-[#fbbf24] scale-102" : "text-primary scale-102")
                          : (isDarkTheme ? "text-white/40 hover:text-white" : "text-foreground/40 hover:text-primary")
                      }`}
                    >
                      {activeReact ? (
                        <span className="text-lg">
                          {REACTION_EMOJIS.find(r => r.type === activeReact)?.emoji}
                        </span>
                      ) : (
                        <Heart className="w-4 h-4" />
                      )}
                      <span>
                        {activeReact
                          ? REACTION_EMOJIS.find(r => r.type === activeReact)?.label
                          : "تفاعل"}
                      </span>
                    </button>

                    {/* Framer-Motion style Popover for Facebook Emoji Reactions */}
                    {activeReactionPopup === post.id && (
                      <div 
                        className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 bg-[#0d111d]/95 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 flex gap-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                      >
                        {REACTION_EMOJIS.map(r => (
                          <button
                            key={r.type}
                            onClick={() => { handleReact(post.id, r.type); setActiveReactionPopup(null); }}
                            className="hover:scale-135 active:scale-90 transition-all text-2xl flex flex-col items-center select-none"
                            title={r.label}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[7px] text-white/50 font-black mt-0.5">{r.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 border-r ${isDarkTheme ? 'border-white/10 text-white/40 hover:text-[#fbbf24]' : 'border-border/10 text-foreground/40 hover:text-primary'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    تعليق
                  </button>

                  <button
                    onClick={() => handleShare(post)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 border-r ${isDarkTheme ? 'border-white/10 text-white/40 hover:text-blue-400' : 'border-border/10 text-foreground/40 hover:text-blue-400'}`}
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
                      className={`border-t overflow-hidden ${isDarkTheme ? 'border-white/10 bg-black/20' : 'border-border/10 bg-foreground/[0.01]'}`}
                    >
                      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                        {(() => {
                          const allCmts = comments[post.id] || [];
                          const visibleCmts = allCmts.filter(cmt => !cmt.isBlocked || cmt.userId === user?.uid);
                          
                          // Separate parents and replies
                          const parentCmts = visibleCmts.filter(cmt => !cmt.parentId);
                          const repliesCmts = visibleCmts.filter(cmt => !!cmt.parentId);
                          
                          // Sort parents by likesCount descending, then by createdAt ascending
                          const sortedParents = [...parentCmts].sort((a, b) => {
                            const likesA = a.likesCount || 0;
                            const likesB = b.likesCount || 0;
                            if (likesB !== likesA) {
                              return likesB - likesA;
                            }
                            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                            return timeA - timeB;
                          });

                          if (sortedParents.length === 0) {
                            return (
                              <p className="text-center text-xs text-foreground/20 py-4 font-bold">
                                لا توجد تعليقات بعد — كن أول من يعلّق بكلمة طيبة!
                              </p>
                            );
                          }

                          return sortedParents.map((cmt) => {
                            const commentReplies = repliesCmts.filter(r => r.parentId === cmt.id);
                            const userLiked = user && cmt.likes?.includes(user.uid);
                            
                            return (
                              <div key={cmt.id} className="space-y-3 border-b border-border/10 pb-3 last:border-b-0 last:pb-0">
                                {/* Parent Comment */}
                                <div className="flex gap-3 items-start text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  {cmt.isAnonymous ? (
                                    <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 border border-border/30">
                                      <EyeOff className="w-4 h-4 text-foreground/30" />
                                    </div>
                                  ) : (
                                    <img
                                      src={cmt.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${cmt.userId}`}
                                      alt=""
                                      className="w-9 h-9 rounded-full border border-border/30 shrink-0 object-cover bg-foreground/5"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className={`border rounded-2xl px-4 py-2.5 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-foreground/5 border-border/20'}`}>
                                      <p className={`text-[10px] font-black mb-0.5 flex items-center justify-between gap-2 ${isDarkTheme ? 'text-white/60' : 'text-foreground/60'}`}>
                                        <span>{cmt.isAnonymous ? "مجهول 🕶️" : cmt.userName}</span>
                                        {cmt.isBlocked && (
                                          <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            قيد المراجعة ⏳
                                          </span>
                                        )}
                                      </p>
                                      <p className={`text-xs leading-relaxed break-words font-medium ${isDarkTheme ? 'text-white/90' : 'text-foreground/90'}`}>
                                        {cmt.content}
                                      </p>
                                    </div>
                                    
                                    {/* Action Buttons for comment: Like & Reply */}
                                    <div className="flex items-center gap-4 mt-1 px-2">
                                      <span className={`text-[8px] font-bold ${isDarkTheme ? 'text-white/30' : 'text-foreground/20'}`}>
                                        {timeAgo(cmt.createdAt)}
                                      </span>
                                      
                                      <button
                                        onClick={() => handleLikeComment(post.id, cmt.id)}
                                        className={`text-[9px] font-black transition-colors flex items-center gap-1 ${
                                          userLiked
                                            ? "text-rose-500"
                                            : (isDarkTheme ? "text-white/40 hover:text-white" : "text-foreground/45 hover:text-primary")
                                        }`}
                                      >
                                        <Heart className={`w-2.5 h-2.5 ${userLiked ? 'fill-rose-500' : ''}`} />
                                        <span>أعجبني {cmt.likesCount > 0 ? `(${cmt.likesCount})` : ''}</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setReplyingTo({
                                            postId: post.id,
                                            commentId: cmt.id,
                                            userName: cmt.isAnonymous ? "مجهول" : cmt.userName
                                          });
                                          const inputEl = document.getElementById(`comment-input-${post.id}`);
                                          if (inputEl) {
                                            inputEl.focus();
                                          }
                                        }}
                                        className={`text-[9px] font-black transition-colors ${
                                          isDarkTheme ? "text-white/40 hover:text-white" : "text-foreground/45 hover:text-primary"
                                        }`}
                                      >
                                        رد
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Replies under this comment */}
                                {commentReplies.length > 0 && (
                                  <div className="mr-8 pr-3 border-r border-[#fbbf24]/10 space-y-3 mt-2">
                                    {commentReplies.map((reply) => {
                                      const replyLiked = user && reply.likes?.includes(user.uid);
                                      return (
                                        <div key={reply.id} className="flex gap-3 items-start text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                                          {reply.isAnonymous ? (
                                            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 border border-border/30">
                                              <EyeOff className="w-3.5 h-3.5 text-foreground/30" />
                                            </div>
                                          ) : (
                                            <img
                                              src={reply.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${reply.userId}`}
                                              alt=""
                                              className="w-8 h-8 rounded-full border border-border/30 shrink-0 object-cover bg-foreground/5"
                                            />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className={`border rounded-2xl px-3.5 py-2 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-foreground/5 border-border/20'}`}>
                                              <p className={`text-[9px] font-black mb-0.5 flex items-center justify-between gap-2 ${isDarkTheme ? 'text-white/60' : 'text-foreground/60'}`}>
                                                <span>
                                                  {reply.isAnonymous ? "مجهول 🕶️" : reply.userName}
                                                  {reply.replyToName && (
                                                    <span className="text-[8px] text-primary font-bold mr-1.5">
                                                      رداً على @{reply.replyToName}
                                                    </span>
                                                  )}
                                                </span>
                                                {reply.isBlocked && (
                                                  <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                                    قيد المراجعة ⏳
                                                  </span>
                                                )}
                                              </p>
                                              <p className={`text-xs leading-relaxed break-words font-medium ${isDarkTheme ? 'text-white/90' : 'text-foreground/90'}`}>
                                                {reply.content}
                                              </p>
                                            </div>
                                            
                                            {/* Action Buttons for reply */}
                                            <div className="flex items-center gap-4 mt-1 px-2">
                                              <span className={`text-[8px] font-bold ${isDarkTheme ? 'text-white/30' : 'text-foreground/20'}`}>
                                                {timeAgo(reply.createdAt)}
                                              </span>
                                              
                                              <button
                                                onClick={() => handleLikeComment(post.id, reply.id)}
                                                className={`text-[9px] font-black transition-colors flex items-center gap-1 ${
                                                  replyLiked
                                                    ? "text-rose-500"
                                                    : (isDarkTheme ? "text-white/40 hover:text-white" : "text-foreground/45 hover:text-primary")
                                                }`}
                                              >
                                                <Heart className={`w-2.5 h-2.5 ${replyLiked ? 'fill-rose-500' : ''}`} />
                                                <span>أعجبني {reply.likesCount > 0 ? `(${reply.likesCount})` : ''}</span>
                                              </button>

                                              <button
                                                onClick={() => {
                                                  setReplyingTo({
                                                    postId: post.id,
                                                    commentId: cmt.id, // Group nested replies under parent comment 'cmt.id'
                                                    userName: reply.isAnonymous ? "مجهول" : reply.userName
                                                  });
                                                  const inputEl = document.getElementById(`comment-input-${post.id}`);
                                                  if (inputEl) {
                                                    inputEl.focus();
                                                  }
                                                }}
                                                className={`text-[9px] font-black transition-colors ${
                                                  isDarkTheme ? "text-white/40 hover:text-white" : "text-foreground/45 hover:text-primary"
                                                }`}
                                              >
                                                رد
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Comment Input */}
                      <div className={`p-4 pt-0 border-t ${isDarkTheme ? 'border-white/10' : 'border-border/10'}`}>
                        {/* Replying banner */}
                        {replyingTo && replyingTo.postId === post.id && (
                          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 mb-2 text-right">
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              <span>الرد على:</span>
                              <span className="underline font-black">@{replyingTo.userName}</span>
                            </span>
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="text-foreground/45 hover:text-foreground p-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Anonymous Toggle */}
                        <div className="flex items-center justify-end gap-2 mb-2 pt-2">
                          <button
                            onClick={() => setIsAnonymous(prev => ({ ...prev, [post.id]: !(prev[post.id] ?? false) }))}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                              isAnonymous[post.id]
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                : "bg-foreground/5 border-border/30 text-foreground/30"
                            }`}
                          >
                            <EyeOff className="w-3 h-3" />
                            {isAnonymous[post.id] ? "تعليق كمجهول" : "تعليق بحسابي"}
                          </button>
                        </div>

                        <div className="flex gap-2 items-center">
                          <input
                            id={`comment-input-${post.id}`}
                            value={commentText[post.id] || ""}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment(post.id)}
                            placeholder={isAnonymous[post.id] ? "اكتب تعليقاً مجهولاً..." : "اكتب تعليقاً..."}
                            className={`flex-1 border rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary/50 transition-all font-bold text-right ${isDarkTheme ? 'bg-white/5 border-white/20 text-white placeholder:text-white/25' : 'bg-foreground/5 border-border/30 text-foreground placeholder:text-foreground/25'}`}
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
            );
          })
        )}

        {/* Load More */}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
          </div>
        )}

        {!hasMore && filteredPosts.length > 0 && (
          <p className="text-center text-[10px] text-foreground/20 font-bold py-8 uppercase tracking-wider">
            — نهاية المنشورات • تم تحميل جميع المشاركات —
          </p>
        )}
      </div>
    </div>
  );
}
