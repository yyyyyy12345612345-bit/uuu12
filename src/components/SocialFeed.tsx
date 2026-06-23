"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Heart, MessageCircle, Share2, MoreHorizontal, Trash2,
  Loader2, User, EyeOff, X, AlertCircle, Bookmark, BookmarkCheck,
  Crown, Star, Sparkles, BookOpen, HandHeart, Award, Users, Search,
  Trophy, Shield, Ban, Flag, Check, Image as ImageIcon, Video, HelpCircle,
  FileText, ArrowRight, Sparkle, UserCheck, UserPlus, LogOut, Info,
  Home, Folder
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import {
  collection, addDoc, getDocs, query, orderBy, limit, startAfter,
  doc, deleteDoc, updateDoc, increment, serverTimestamp, getDoc,
  setDoc, arrayUnion, arrayRemove, onSnapshot, where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import { navigateInstantly } from "@/lib/navigation";

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

const checkModerationStatus = (text: string): "block" | "flag" | "clean" => {
  if (!text) return "clean";
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
  
  let normalized = text.replace(/[\u064B-\u0652\u0670]/g, "");
  normalized = normalized
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء");

  const strippedOfSymbols = normalized.replace(/[0-9\s\-_*.,!?()؛؟?"'«»[\]{}|<>/\\@#$%^&+=~`:]/g, "");
  const cleanWithSpaces = normalized
    .replace(/[0-9\-_*.,!?()؛؟?"'«»[\]{}|<>/\\@#$%^&+=~`:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  
  // Group association
  groupId?: string;

  // Reflection fields
  isReflection?: boolean;
  verseKey?: string;
  surahName?: string;
  verseText?: string;
  reflectionText?: string;
  theme?: string;

  // Poll fields
  isPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  pollVotes?: Record<string, string[]>; // optionIndex -> list of user Uids
  
  // Media attachments
  imageUrl?: string;
  videoUrl?: string;
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

interface RealGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  creatorId: string;
  createdAt: any;
}

const CATEGORIES = [
  { id: "all", label: "الكل", icon: Users },
  { id: "dua", label: "أدعية 🤲", icon: HandHeart },
  { id: "reflection", label: "تدبر آية 📖", icon: BookOpen },
  { id: "hadith", label: "حديث شريف 📚", icon: Award },
  { id: "good", label: "كلمة طيبة 🌟", icon: Sparkles },
  { id: "saved", label: "المحفوظات 🔖", icon: Bookmark }
];

const REACTION_EMOJIS = [
  { type: "like", emoji: "❤️", label: "أعجبني" },
  { type: "amin", emoji: "🤲", label: "آمين" },
  { type: "inspired", emoji: "🌟", label: "ألهمتني" },
  { type: "reflected", emoji: "📖", label: "تدبرت" }
];

// Styling configuration mapping for real group categories
const getGroupStyle = (category: string) => {
  switch (category) {
    case "reflection":
      return { gradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400", icon: BookOpen };
    case "dua":
      return { gradient: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400", icon: HandHeart };
    case "hadith":
      return { gradient: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400", icon: Award };
    default:
      return { gradient: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400", icon: Users };
  }
};

const MOCK_ACTIVE_PEOPLE = [
  { id: "m1", name: "عبدالله محمد", points: "5,820 نقطة", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Abdullah" },
  { id: "m2", name: "أحمد الراشد", points: "1,230 نقطة", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed" },
  { id: "m3", name: "سارة محمد", points: "1,020 نقطة", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sara" },
  { id: "m4", name: "محمد العتيبي", points: "5,560 نقطة", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Otaibi" },
  { id: "m5", name: "فاطمة الزهراء", points: "5,010 نقطة", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima" }
];

const MOCK_TAGS = [
  "#القرآن_الكريم", "أذكار", "استغفار", "الدعاء", "#قصص_الأنبياء", "#نصائح", "العلم", "رمضان"
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
  
  // Filtration States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeSortTab, setActiveSortTab] = useState("latest"); // latest, interactive, following
  const [activeMobileTab, setActiveMobileTab] = useState("feed"); // feed, groups, dashboard
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real Group States
  const [groups, setGroups] = useState<RealGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  
  // Group creation modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCat, setNewGroupCat] = useState("reflection");

  // Real Follow States for the logged-in user
  const [userFollowersCount, setUserFollowersCount] = useState(0);
  const [userFollowingCount, setUserFollowingCount] = useState(0);
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [followingUids, setFollowingUids] = useState<string[]>([]);

  // Composer Enhancements
  const [composerMode, setComposerMode] = useState<"text" | "reflection" | "poll" | "image" | "video">("text");
  const [selectedComposerGroupId, setSelectedComposerGroupId] = useState("");
  // Reflection Composer states
  const [composeVerseText, setComposeVerseText] = useState("");
  const [composeSurahName, setComposeSurahName] = useState("");
  const [composeReflectionText, setComposeReflectionText] = useState("");
  const [composeTheme, setComposeTheme] = useState("emerald-gold");
  // Poll Composer states
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  // Media Composer states
  const [attachedImageUrl, setAttachedImageUrl] = useState("");
  const [attachedVideoUrl, setAttachedVideoUrl] = useState("");

  // Social feed states
  const [creatorCategory, setCreatorCategory] = useState("good");
  const [creatorTheme, setCreatorTheme] = useState("glass");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [authorsData, setAuthorsData] = useState<Record<string, any>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [activeReactionPopup, setActiveReactionPopup] = useState<string | null>(null);

  // Comments states
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isAnonymous, setIsAnonymous] = useState<Record<string, boolean>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; userName: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 15;

  // Leaderboard dynamic query
  const [dbActivePeople, setDbActivePeople] = useState<any[]>([]);

  // Daily Challenge Interactive state
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [claimingChallenge, setClaimingChallenge] = useState(false);

  // Check Daily Challenge Status on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const isCompleted = localStorage.getItem(`daily_challenge_${today}`) === "completed";
    setDailyChallengeCompleted(isCompleted);
  }, []);

  // Auth & Load saved bookmarks
  useEffect(() => {
    const saved = localStorage.getItem("bookmarked_posts");
    if (saved) {
      try { setBookmarkedPosts(new Set(JSON.parse(saved))); } catch (e) { console.error(e); }
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Listen to active user profile details
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserData(snap.data());
      }
    });
    return () => unsub();
  }, []);

  // Fetch / Seed real groups
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "groups"), async (snap) => {
      if (snap.empty) {
        // Seed initial groups matching visual aesthetics
        const initial = [
          { name: "محبي القرآن الكريم", description: "مجلس تدبر آيات كتاب الله العزيز ومشاركتها.", memberCount: 12500, category: "reflection", creatorId: "system", createdAt: new Date() },
          { name: "أذكار وأدعية", description: "أدعية من القلوب ومشاركة الأذكار والأوراد اليومية.", memberCount: 8300, category: "dua", creatorId: "system", createdAt: new Date() },
          { name: "تفسير وعلوم القرآن", description: "مباحث تفسير القرآن الكريم والحديث النبوي الشريف.", memberCount: 7100, category: "hadith", creatorId: "system", createdAt: new Date() },
          { name: "المسلمون الجدد", description: "نصائح وإرشادات وكلمات طيبة للمسلمين الجدد والمهتمين.", memberCount: 5400, category: "good", creatorId: "system", createdAt: new Date() }
        ];
        for (const grp of initial) {
          await addDoc(collection(db, "groups"), grp);
        }
      } else {
        const grpList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RealGroup));
        setGroups(grpList);
      }
    });
    return () => unsub();
  }, []);

  // Listen to current user's joined groups
  useEffect(() => {
    if (!user || !db) return;
    const qMembers = query(collection(db, "group_members"), where("userId", "==", user.uid));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const ids = new Set(snap.docs.map(doc => doc.data().groupId));
      setJoinedGroupIds(ids);
    });
    return () => unsubMembers();
  }, [user]);

  // Listen to current user's followers, following, and posts counts (Real data stats)
  useEffect(() => {
    if (!user || !db) return;
    
    // Followers query
    const qFollowers = query(collection(db, "follows"), where("followingId", "==", user.uid));
    const unsubFollowers = onSnapshot(qFollowers, (snap) => {
      setUserFollowersCount(snap.size);
    });

    // Following query
    const qFollowing = query(collection(db, "follows"), where("followerId", "==", user.uid));
    const unsubFollowing = onSnapshot(qFollowing, (snap) => {
      setUserFollowingCount(snap.size);
      const uids = snap.docs.map(doc => doc.data().followingId);
      setFollowingUids(uids);
    });

    // User's own posts count query
    const qPosts = query(collection(db, "posts"), where("userId", "==", user.uid));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setUserPostsCount(snap.size);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubPosts();
    };
  }, [user]);

  // Fetch active people ordered by points dynamically
  useEffect(() => {
    if (!db) return;
    const fetchActivePeople = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(5));
        const snap = await getDocs(q);
        const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbActivePeople(usersList);
      } catch (e) {
        console.error("Error loading active people:", e);
      }
    };
    fetchActivePeople();
  }, [posts]);

  // Load Posts from Firestore
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
      
      // Filter blocked posts client-side
      const newPosts = rawPosts.filter(p => p.isBlocked !== true || p.userId === user?.uid) as Post[];

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === POSTS_PER_PAGE);

      // Fetch authors data dynamically
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

  // Handle Post Creation
  const handleCreatePost = async () => {
    if (!user || posting) return;

    let contentToPost = newPost.trim();
    let isReflectionType = false;
    let isPollType = false;

    if (composerMode === "reflection") {
      if (!composeVerseText.trim() || !composeReflectionText.trim()) {
        alert("يرجى ملء تفاصيل التدبر أولاً.");
        return;
      }
      contentToPost = `💡 تدبر في سورة ${composeSurahName || "كريمة"}:\n\n« ${composeVerseText} »\n\n💡 ${composeReflectionText}`;
      isReflectionType = true;
    } else if (composerMode === "poll") {
      if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
        alert("يرجى كتابة سؤال الاستطلاع وإضافة خيارين على الأقل.");
        return;
      }
      contentToPost = `📊 استطلاع رأي: ${pollQuestion.trim()}`;
      isPollType = true;
    } else if (composerMode === "image" && !attachedImageUrl.trim()) {
      alert("يرجى إدخال رابط الصورة.");
      return;
    } else if (composerMode === "video" && !attachedVideoUrl.trim()) {
      alert("يرجى إدخال رابط الفيديو.");
      return;
    }

    if (!contentToPost && !newPost.trim()) {
      alert("لا يمكن نشر منشور فارغ.");
      return;
    }

    // AI Moderation Checks
    const modStatus = checkModerationStatus(contentToPost);
    if (modStatus === "block") {
      alert("⚠️ عذراً، لا يمكن نشر محتوى يحتوي على كلمات غير لائقة.");
      return;
    }
    const isAutoBlocked = modStatus === "flag";

    setPosting(true);
    try {
      let isOffTopic = false;
      let isProfane = false;
      let reason = "";
      try {
        const modRes = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentToPost })
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
        alert(`⚠️ عذراً، لا يمكن نشر هذا المحتوى لأنه يحتوي على ألفاظ غير لائقة: ${reason}`);
        setPosting(false);
        return;
      }

      if (isOffTopic) {
        alert(`⚠️ عذراً، هذا المنشور غير متعلق بالإسلام أو المواضيع الدعوية. السبب: ${reason || "محتوى خارج السياق"}`);
        setPosting(false);
        return;
      }

      const postData: any = {
        userId: user.uid,
        userName: userData?.displayName || user.displayName || "مستخدم",
        userAvatar: userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`,
        content: contentToPost,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        category: composerMode === "reflection" ? "reflection" : creatorCategory,
        backgroundStyle: creatorTheme,
        reactions: { like: 0, amin: 0, inspired: 0, reflected: 0 },
        isBlocked: isAutoBlocked,
        autoFlagged: isAutoBlocked,
        reportsCount: isAutoBlocked ? 1 : 0
      };

      // Add real group association if posted in a group
      if (selectedComposerGroupId) {
        postData.groupId = selectedComposerGroupId;
      }

      // Add reflection metadata
      if (isReflectionType) {
        postData.isReflection = true;
        postData.verseText = composeVerseText.trim();
        postData.surahName = composeSurahName.trim() || "غير محدد";
        postData.reflectionText = composeReflectionText.trim();
        postData.theme = composeTheme;
        postData.verseKey = "1:1";
      }

      // Add poll metadata
      if (isPollType) {
        postData.isPoll = true;
        postData.pollQuestion = pollQuestion.trim();
        postData.pollOptions = pollOptions.filter(o => o.trim());
        postData.pollVotes = {};
        postData.pollOptions.forEach((_: any, idx: number) => {
          postData.pollVotes[idx.toString()] = [];
        });
      }

      // Add media metadata
      if (composerMode === "image") {
        postData.imageUrl = attachedImageUrl.trim();
      } else if (composerMode === "video") {
        postData.videoUrl = attachedVideoUrl.trim();
      }

      const docRef = await addDoc(collection(db, "posts"), postData);
      setPosts(prev => [{ id: docRef.id, ...postData, createdAt: new Date() } as Post, ...prev]);

      // Complete Daily Challenge automatically if post is created!
      if (!dailyChallengeCompleted) {
        completeDailyChallenge();
      }

      // Reset composer states
      setNewPost("");
      setComposeVerseText("");
      setComposeReflectionText("");
      setComposeSurahName("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setAttachedImageUrl("");
      setAttachedVideoUrl("");
      setComposerMode("text");
      setCreatorTheme("glass");
      setSelectedComposerGroupId("");

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

  // Complete Daily Challenge Interactive Action
  const completeDailyChallenge = async () => {
    if (!user || claimingChallenge || dailyChallengeCompleted) return;
    setClaimingChallenge(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(50)
      });
      // Update local state
      setUserData((prev: any) => prev ? { ...prev, totalPoints: (prev.totalPoints || 0) + 50 } : prev);
      
      const today = new Date().toDateString();
      localStorage.setItem(`daily_challenge_${today}`, "completed");
      setDailyChallengeCompleted(true);
      alert("🎉 مبارك! تم إنجاز التحدي اليومي وحصلت على +50 نقطة إضافية!");
    } catch (e) {
      console.error("Error completing challenge:", e);
    } finally {
      setClaimingChallenge(false);
    }
  };

  // Real Group Join Toggle Function
  const handleToggleJoinGroup = async (groupId: string) => {
    if (!user || !db) {
      alert("يجب تسجيل الدخول أولاً للانضمام للمجموعة.");
      return;
    }
    const memberDocId = `${groupId}_${user.uid}`;
    const memberRef = doc(db, "group_members", memberDocId);
    const grpRef = doc(db, "groups", groupId);
    const isJoined = joinedGroupIds.has(groupId);

    try {
      if (isJoined) {
        await deleteDoc(memberRef);
        await updateDoc(grpRef, { memberCount: increment(-1) });
      } else {
        await setDoc(memberRef, {
          groupId,
          userId: user.uid,
          joinedAt: serverTimestamp()
        });
        await updateDoc(grpRef, { memberCount: increment(1) });
      }
    } catch (e) {
      console.error("Error toggling group membership:", e);
    }
  };

  // Real Group creation submission
  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim() || !db) return;
    try {
      const grpData = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        memberCount: 1,
        category: newGroupCat,
        creatorId: user.uid,
        createdAt: serverTimestamp()
      };
      const grpRef = await addDoc(collection(db, "groups"), grpData);
      
      // Auto join creator to the group
      const memberDocId = `${grpRef.id}_${user.uid}`;
      await setDoc(doc(db, "group_members", memberDocId), {
        groupId: grpRef.id,
        userId: user.uid,
        joinedAt: serverTimestamp()
      });
      
      setNewGroupName("");
      setNewGroupDesc("");
      setShowCreateGroupModal(false);
      alert("🎉 تم إنشاء المجموعة وانضمامك إليها بنجاح!");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إنشاء المجموعة");
    }
  };

  // Toggle Reactions
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

  // Poll Vote Interaction
  const handleVotePoll = async (postId: string, optionIndex: number) => {
    if (!user) {
      alert("يجب تسجيل الدخول للتصويت.");
      return;
    }

    const postRef = doc(db, "posts", postId);
    const post = posts.find(p => p.id === postId);
    if (!post || !post.pollVotes) return;

    // Check if user already voted in this option or another
    let votedIndex: string | null = null;
    Object.entries(post.pollVotes).forEach(([idx, voters]) => {
      if (voters.includes(user.uid)) {
        votedIndex = idx;
      }
    });

    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nextVotes = { ...p.pollVotes };
      
      if (votedIndex !== null) {
        nextVotes[votedIndex] = nextVotes[votedIndex].filter(id => id !== user.uid);
      }
      
      if (votedIndex !== optionIndex.toString()) {
        nextVotes[optionIndex.toString()] = [...(nextVotes[optionIndex.toString()] || []), user.uid];
      }

      return {
        ...p,
        pollVotes: nextVotes
      };
    }));

    try {
      const nextVotes = { ...post.pollVotes };
      if (votedIndex !== null) {
        nextVotes[votedIndex] = nextVotes[votedIndex].filter(id => id !== user.uid);
      }
      if (votedIndex !== optionIndex.toString()) {
        nextVotes[optionIndex.toString()] = [...(nextVotes[optionIndex.toString()] || []), user.uid];
      }
      await updateDoc(postRef, { pollVotes: nextVotes });
    } catch (e) {
      console.error("Error voting:", e);
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

  // Share post
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

    const activeReply = replyingTo && replyingTo.postId === postId ? replyingTo : null;
    const parentId = activeReply ? activeReply.commentId : null;
    const replyToName = activeReply ? activeReply.userName : null;

    setPostingComment(postId);
    try {
      let isOffTopic = false;
      let isProfane = false;
      let reason = "";
      try {
        const modRes = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text })
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
        alert(`⚠️ عذراً، لا يمكن نشر التعليق لأنه يحتوي على ألفاظ غير لائقة: ${reason}`);
        setPostingComment(null);
        return;
      }

      if (isOffTopic) {
        alert(`⚠️ عذراً، هذا التعليق غير متعلق بالإسلام أو المواضيع الدعوية والمفيدة. السبب: ${reason}`);
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
      setReplyingTo(null);

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
          console.error(err);
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
      return { ...prev, [postId]: updated };
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
      console.error(e);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!await window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
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

  // Filter and Sort Posts
  const filteredPosts = posts.filter(p => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inContent = p.content?.toLowerCase().includes(q);
      const inUserName = p.userName?.toLowerCase().includes(q);
      const inVerse = p.verseText?.toLowerCase().includes(q);
      const inReflection = p.reflectionText?.toLowerCase().includes(q);
      if (!inContent && !inUserName && !inVerse && !inReflection) return false;
    }

    // 2. Tag Filter
    if (selectedTag) {
      const tagClean = selectedTag.replace("#", "");
      const inContent = p.content?.includes(tagClean) || p.content?.includes(selectedTag);
      const inVerse = p.verseText?.includes(tagClean) || p.verseText?.includes(selectedTag);
      const inReflection = p.reflectionText?.includes(tagClean) || p.reflectionText?.includes(selectedTag);
      if (!inContent && !inVerse && !inReflection) return false;
    }

    // 3. Real Group Filtration
    if (selectedGroupId) {
      return p.groupId === selectedGroupId;
    }

    // 4. Category Filter
    if (selectedCategory === "saved") {
      return bookmarkedPosts.has(p.id);
    }
    if (selectedCategory === "all") {
      // 5. Real Follow Tab Filtration
      if (activeSortTab === "following") {
        return followingUids.includes(p.userId) || p.userId === user?.uid;
      }
      return true;
    }
    return p.category === selectedCategory;
  }).sort((a, b) => {
    if (activeSortTab === "interactive") {
      return (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount);
    }
    return 0; // Default uses Firestore desc order
  });

  // Load dynamic active members
  const displayActivePeople = dbActivePeople.length > 0
    ? dbActivePeople.map((p, index) => ({
        id: p.id,
        name: p.displayName || "مستخدم يقين",
        points: `${Math.round(p.totalPoints || 0).toLocaleString()} نقطة`,
        avatar: p.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.id}`
      }))
    : MOCK_ACTIVE_PEOPLE;

  const currentActiveGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;

  return (
    <div
      dir="rtl"
      className="h-full w-full overflow-hidden font-arabic relative flex flex-col"
    >
      {/* Background Aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#fbbf24]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-500/5 blur-[140px] rounded-full" />
      </div>

      {/* New Sticky Top Bar matching the design image perfectly */}
      <header className="sticky top-0 z-50 bg-[#090a0f] border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0 select-none">
        
        {/* Left: Search Bar */}
        <div className="flex items-center gap-2 w-full max-w-[180px] sm:max-w-[240px] md:max-w-[280px]">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المجتمع..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pr-10 pl-4 text-[10px] sm:text-xs text-white outline-none focus:border-[#fbbf24] transition-all font-bold placeholder:text-white/20 text-right"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs (Hidden on small mobile, flex on md+) */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <button
            onClick={() => navigateInstantly("/rank")}
            className="flex items-center gap-2 py-2 px-3 text-xs font-black text-white/40 hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
            <span>الأصدقاء</span>
          </button>

          <button
            onClick={() => {
              setSelectedGroupId(null);
              setSelectedCategory("all");
              setActiveMobileTab("groups");
            }}
            className="flex items-center gap-2 py-2 px-3 text-xs font-black text-white/40 hover:text-white transition-colors"
          >
            <Folder className="w-4 h-4" />
            <span>المجموعات</span>
          </button>

          <button
            className="flex items-center gap-2 py-2 px-4.5 text-xs font-black text-[#fbbf24] border-b-2 border-[#fbbf24] transition-colors"
          >
            <Users className="w-4 h-4 text-[#fbbf24]" />
            <span>المجتمع</span>
          </button>

          <button
            onClick={() => navigateInstantly("/daily")}
            className="flex items-center gap-2 py-2 px-3 text-xs font-black text-white/40 hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>المواضيع</span>
          </button>

          <button
            onClick={() => navigateInstantly("/")}
            className="flex items-center gap-2 py-2 px-3 text-xs font-black text-white/40 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </nav>

        {/* Right: Logo & Branding */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right">
            <h1 className="text-[10px] md:text-sm font-black text-white leading-none">مجتمع يقين</h1>
            <span className="text-[6px] md:text-[8px] font-bold text-[#fbbf24] tracking-widest mt-0.5 block">YAQEEN COMMUNITY</span>
          </div>
          <div className="w-8 h-8 md:w-9 h-9 rounded-xl border border-[#fbbf24]/20 p-0.5 bg-white/5 flex items-center justify-center shrink-0">
            <img src="/logo/logo.png?v=25" alt="Yaqeen Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>

      </header>

      {/* Mobile Sticky Tab Selector */}
      <div className="sticky top-[58px] z-40 bg-background/90 backdrop-blur-md border-b border-border/20 flex items-center justify-around py-3 lg:hidden shrink-0">
        <button
          onClick={() => setActiveMobileTab("feed")}
          className={`px-4 py-2 text-xs font-black rounded-full transition-all border ${
            activeMobileTab === "feed"
              ? "bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]"
              : "border-transparent text-foreground/40"
          }`}
        >
          الخلاصة
        </button>
        <button
          onClick={() => setActiveMobileTab("groups")}
          className={`px-4 py-2 text-xs font-black rounded-full transition-all border ${
            activeMobileTab === "groups"
              ? "bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]"
              : "border-transparent text-foreground/40"
          }`}
        >
          المجموعات والأعضاء
        </button>
        <button
          onClick={() => setActiveMobileTab("dashboard")}
          className={`px-4 py-2 text-xs font-black rounded-full transition-all border ${
            activeMobileTab === "dashboard"
              ? "bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]"
              : "border-transparent text-foreground/40"
          }`}
        >
          لوحة معلوماتي
        </button>
      </div>

      {/* Categories Horizontal scrolling bubbles */}
      <div className="relative w-full overflow-x-auto no-scrollbar flex items-center gap-3 px-5 py-3.5 z-10 select-none snap-x border-b border-border/20 bg-background/10 shrink-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id && !selectedGroupId;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedGroupId(null);
                setSelectedCategory(cat.id);
                if (activeMobileTab !== "feed") setActiveMobileTab("feed");
              }}
              className={`flex items-center gap-2 py-2 px-4 rounded-full transition-all shrink-0 snap-center border font-bold text-xs ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.03]"
                  : "bg-card/40 border-border/50 text-foreground/50 hover:text-foreground hover:bg-card/75"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Layout (No general scroll, subcomponents scroll independently) */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto px-4 py-4 w-full h-full min-h-0">
        
        {/* ===================== COLUMN 1: LEFT SIDEBAR ===================== */}
        <aside className={`lg:col-span-3 flex-col h-full overflow-y-auto no-scrollbar pb-6 gap-6 ${activeMobileTab === "groups" ? "flex" : "hidden lg:flex"}`}>
          {/* Suggested Groups (Real Firestore Data) */}
          <div className="bg-[#0c0d12]/90 border border-border/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute inset-0 islamic-pattern opacity-[0.01] pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold text-[#fbbf24]/50 hover:text-[#fbbf24] cursor-pointer">المجموعات</span>
              <h3 className="text-sm font-black text-white">المجموعات الدعوية</h3>
            </div>

            <div className="space-y-4">
              {groups.map((g) => {
                const style = getGroupStyle(g.category);
                const GrpIcon = style.icon;
                const isJoined = joinedGroupIds.has(g.id);

                return (
                  <div
                    key={g.id}
                    className="w-full flex flex-col p-4 rounded-[1.8rem] bg-white/[0.02] border border-white/5 transition-all text-right group gap-3"
                  >
                    <button
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setSelectedCategory("all");
                        setActiveMobileTab("feed");
                      }}
                      className="flex items-center gap-3 text-right w-full"
                    >
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center border shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                        <GrpIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors truncate">{g.name}</h4>
                        <p className="text-[9px] text-white/30 font-bold mt-0.5">{(g.memberCount || 0).toLocaleString()} عضو</p>
                      </div>
                    </button>

                    <div className="flex justify-between items-center border-t border-white/5 pt-2">
                      <p className="text-[8px] text-white/20 truncate max-w-[120px]" title={g.description}>{g.description || "لا يوجد وصف"}</p>
                      {user && (
                        <button
                          onClick={() => handleToggleJoinGroup(g.id)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${
                            isJoined 
                              ? "bg-white/10 text-white/70 hover:bg-red-500/10 hover:text-red-400" 
                              : "bg-[#fbbf24] text-black hover:scale-105"
                          }`}
                        >
                          {isJoined ? "غادر" : "انضم"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (!user) {
                  alert("يرجى تسجيل الدخول أولاً لإنشاء مجموعة.");
                  return;
                }
                setShowCreateGroupModal(true);
              }}
              className="w-full py-3.5 border border-[#fbbf24]/30 hover:border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-5 active:scale-95"
            >
              <span>+ إنشاء مجموعة جديدة</span>
            </button>
          </div>

          {/* Active Members / Leaderboard */}
          <div className="bg-[#0c0d12]/90 border border-border/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-5">
              <span 
                onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: user?.uid } }))}
                className="text-[10px] font-bold text-[#fbbf24]/50 hover:text-[#fbbf24] cursor-pointer"
              >
                عرض الكل
              </span>
              <h3 className="text-sm font-black text-white">الأشخاص النشطون</h3>
            </div>

            <div className="space-y-3.5">
              {displayActivePeople.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => p.id && window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: p.id } }))}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img src={p.avatar} alt="" className="w-9 h-9 rounded-full border border-white/10 bg-white/5 object-cover" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-[#0c0d12] rounded-full" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-black text-white">{p.name}</h4>
                      <p className="text-[9px] text-[#fbbf24] font-bold mt-0.5">{p.points}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/20 font-bold font-mono">#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="bg-[#0c0d12]/90 border border-border/30 rounded-[2.5rem] p-6 shadow-xl shrink-0">
            <h3 className="text-sm font-black text-white mb-4">الوسوم الشائعة</h3>
            <div className="flex flex-wrap gap-2">
              {MOCK_TAGS.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(isActive ? null : tag);
                      setActiveMobileTab("feed");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      isActive
                        ? "bg-[#fbbf24] text-black border-[#fbbf24]"
                        : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ===================== COLUMN 2: MIDDLE MAIN FEED (SCROLLABLE AREA) ===================== */}
        <main 
          ref={scrollRef}
          onScroll={handleScroll}
          className={`lg:col-span-6 flex flex-col h-full overflow-y-auto no-scrollbar pb-24 gap-6 ${activeMobileTab === "feed" ? "flex" : "hidden lg:flex"}`}
        >
          {/* Group Header Info Card in Feed (If a group is selected) */}
          {selectedGroupId && currentActiveGroup && (
            <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0c0d12] to-[#040508] border border-emerald-500/20 text-right space-y-4 shadow-xl shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGroupStyle(currentActiveGroup.category).gradient} flex items-center justify-center border shadow-lg`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white leading-snug">{currentActiveGroup.name}</h2>
                    <p className="text-[9px] text-[#fbbf24] font-bold">{(currentActiveGroup.memberCount || 0).toLocaleString()} عضو نشط</p>
                  </div>
                </div>
                {user && (
                  <button
                    onClick={() => handleToggleJoinGroup(currentActiveGroup.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                      joinedGroupIds.has(currentActiveGroup.id)
                        ? "bg-white/10 text-white/70 border border-white/15"
                        : "bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black"
                    }`}
                  >
                    {joinedGroupIds.has(currentActiveGroup.id) ? "مغادرة المجموعة" : "انضمام للمجموعة"}
                  </button>
                )}
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-bold">{currentActiveGroup.description || "مجلس نقاش ودعوة للأعضاء المباركين."}</p>
            </div>
          )}

          {/* Post Creator Section */}
          {user ? (
            <div className="bg-[#0c0d12]/95 border border-[#fbbf24]/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute inset-0 islamic-pattern opacity-[0.01] pointer-events-none" />
              <div className="flex gap-4 items-start">
                <img
                  src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`}
                  alt=""
                  className="w-11 h-11 rounded-full border border-primary/20 object-cover shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-4">
                  {/* Composer Mode Input Sections */}
                  {composerMode === "text" && (
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="شاركنا شيئاً نافعاً..."
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/40 rounded-2xl py-3 px-4 text-xs md:text-sm outline-none transition-all font-bold resize-none text-right leading-relaxed text-white placeholder:text-white/20"
                      maxLength={500}
                    />
                  )}

                  {composerMode === "reflection" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#fbbf24] uppercase tracking-wider">تدبر آية / حديث 📖</span>
                        <button onClick={() => setComposerMode("text")} className="p-1 hover:bg-white/5 rounded-lg"><X className="w-3.5 h-3.5 text-white/40" /></button>
                      </div>
                      <input
                        value={composeSurahName}
                        onChange={(e) => setComposeSurahName(e.target.value)}
                        placeholder="السورة أو المصدر (مثال: سورة البقرة، البخاري)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white font-bold"
                      />
                      <textarea
                        value={composeVerseText}
                        onChange={(e) => setComposeVerseText(e.target.value)}
                        placeholder="نص الآية الكريمة أو الحديث الشريف..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs outline-none text-white font-bold font-arabic resize-none"
                      />
                      <textarea
                        value={composeReflectionText}
                        onChange={(e) => setComposeReflectionText(e.target.value)}
                        placeholder="خاطرة وتدبر الآية الكريمة أو التفسير..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white font-bold resize-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <label className="text-[8px] font-bold text-white/30">قالب الخلفية للتدبر:</label>
                        <div className="flex gap-1.5">
                          {["emerald-gold", "midnight", "royal-purple", "glass"].map(themeId => (
                            <button
                              key={themeId}
                              onClick={() => setComposeTheme(themeId)}
                              className={`w-4 h-4 rounded-full border ${composeTheme === themeId ? 'border-white scale-110' : 'border-transparent'} ${
                                themeId === 'emerald-gold' ? 'bg-emerald-800' :
                                themeId === 'midnight' ? 'bg-slate-950' :
                                themeId === 'royal-purple' ? 'bg-purple-950' : 'bg-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {composerMode === "poll" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#fbbf24] uppercase tracking-wider">إنشاء استطلاع رأي 📊</span>
                        <button onClick={() => setComposerMode("text")} className="p-1 hover:bg-white/5 rounded-lg"><X className="w-3.5 h-3.5 text-white/40" /></button>
                      </div>
                      <input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="ما هو سؤال استطلاع الرأي؟"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white font-bold"
                      />
                      <div className="space-y-2">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="text-[10px] text-white/30 font-bold shrink-0">{idx + 1}.</span>
                            <input
                              value={opt}
                              onChange={(e) => {
                                const next = [...pollOptions];
                                next[idx] = e.target.value;
                                setPollOptions(next);
                              }}
                              placeholder={`الخيار ${idx + 1}`}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs outline-none text-white"
                            />
                            {pollOptions.length > 2 && (
                              <button
                                onClick={() => setPollOptions(pollOptions.filter((_, oIdx) => oIdx !== idx))}
                                className="p-1.5 text-red-400/60 hover:text-red-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {pollOptions.length < 5 && (
                        <button
                          onClick={() => setPollOptions([...pollOptions, ""])}
                          className="text-[10px] text-primary font-bold hover:underline"
                        >
                          + إضافة خيار تصويت
                        </button>
                      )}
                    </div>
                  )}

                  {composerMode === "image" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#fbbf24] uppercase tracking-wider">إرفاق صورة دعوية 🖼️</span>
                        <button onClick={() => setComposerMode("text")} className="p-1 hover:bg-white/5 rounded-lg"><X className="w-3.5 h-3.5 text-white/40" /></button>
                      </div>
                      <input
                        value={attachedImageUrl}
                        onChange={(e) => setAttachedImageUrl(e.target.value)}
                        placeholder="أدخل رابط الصورة (URL)..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white font-mono"
                      />
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="اكتب تعليقاً على الصورة..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white"
                      />
                    </div>
                  )}

                  {composerMode === "video" && (
                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#fbbf24] uppercase tracking-wider">إرفاق رابط فيديو 🎥</span>
                        <button onClick={() => setComposerMode("text")} className="p-1 hover:bg-white/5 rounded-lg"><X className="w-3.5 h-3.5 text-white/40" /></button>
                      </div>
                      <input
                        value={attachedVideoUrl}
                        onChange={(e) => setAttachedVideoUrl(e.target.value)}
                        placeholder="أدخل رابط فيديو يوتيوب أو فيديو مباشر..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white font-mono"
                      />
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="اكتب تعليقاً على الفيديو..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none text-white"
                      />
                    </div>
                  )}

                  {/* Post-in-Group Selection Dropdown */}
                  <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <span className="text-[10px] font-bold text-white/40">انشر في مجموعة:</span>
                    <select
                      value={selectedComposerGroupId}
                      onChange={(e) => setSelectedComposerGroupId(e.target.value)}
                      className="bg-[#0c0d12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-bold"
                    >
                      <option value="">الخلاصة العامة 🌐</option>
                      {groups.filter(g => joinedGroupIds.has(g.id) || g.creatorId === user?.uid).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Composer Categories Selector */}
                  {composerMode !== "reflection" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-white/30">
                        تصنيف المنشور
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.filter(c => c.id !== "all" && c.id !== "saved" && c.id !== "reflection").map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setCreatorCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                              creatorCategory === cat.id
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Composer Action Toggles (Text, Photo, Video, Poll, Quran) */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
                    <div className="flex flex-wrap gap-3 items-center">
                      <button
                        onClick={() => setComposerMode("reflection")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          composerMode === "reflection" ? "bg-primary/20 text-[#fbbf24]" : "text-white/40 hover:text-white"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="hidden sm:inline">آية أو حديث</span>
                      </button>
                      <button
                        onClick={() => setComposerMode("poll")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          composerMode === "poll" ? "bg-primary/20 text-[#fbbf24]" : "text-white/40 hover:text-white"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="hidden sm:inline">استطلاع</span>
                      </button>
                      <button
                        onClick={() => setComposerMode("video")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          composerMode === "video" ? "bg-primary/20 text-[#fbbf24]" : "text-white/40 hover:text-white"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="hidden sm:inline">فيديو</span>
                      </button>
                      <button
                        onClick={() => setComposerMode("image")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          composerMode === "image" ? "bg-primary/20 text-[#fbbf24]" : "text-white/40 hover:text-white"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="hidden sm:inline">صورة</span>
                      </button>
                      <button
                        onClick={() => setComposerMode("text")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          composerMode === "text" ? "bg-primary/20 text-[#fbbf24]" : "text-white/40 hover:text-white"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5 text-[#fbbf24]" />
                        <span className="hidden sm:inline">نص</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCreatePost}
                      disabled={posting}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#fbbf24]/10"
                    >
                      {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      نشر المنشور
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0c0d12]/95 border border-white/5 rounded-[2.5rem] p-8 text-center shadow-xl flex flex-col items-center gap-4 shrink-0">
              <User className="w-10 h-10 text-white/20" />
              <p className="text-sm text-white/40 font-bold leading-relaxed">سجّل دخولك الآن لنشر منشور دعوي جديد أو مشاركة الأدعية وتدبرات الآيات في مجتمع يقين.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("show_auth_gate"))}
                className="px-6 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-black text-xs rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/10 cursor-pointer"
              >
                تسجيل الدخول / إنشاء حساب 🔐
              </button>
            </div>
          )}

          {/* Sort Tabs Filter Bar (Latest, Interactive, Follows) */}
          <div className="flex items-center justify-between bg-[#0c0d12]/90 border border-white/5 px-6 py-3.5 rounded-[2rem] shadow-md shrink-0">
            <span className="text-[10px] text-white/30 font-bold">فرز المنشورات</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSortTab("latest")}
                className={`px-4 py-1.5 text-xs font-black rounded-full transition-all border ${
                  activeSortTab === "latest"
                    ? "bg-[#fbbf24] text-black border-[#fbbf24] shadow-md shadow-[#fbbf24]/10"
                    : "bg-transparent border-transparent text-white/40 hover:text-white"
                }`}
              >
                الأحدث
              </button>
              <button
                onClick={() => setActiveSortTab("interactive")}
                className={`px-4 py-1.5 text-xs font-black rounded-full transition-all border ${
                  activeSortTab === "interactive"
                    ? "bg-[#fbbf24] text-black border-[#fbbf24] shadow-md"
                    : "bg-transparent border-transparent text-white/40 hover:text-white"
                }`}
              >
                الأكثر تفاعلاً
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    alert("سجّل دخولك لمتابعة الآخرين وتصفح منشوراتهم.");
                    return;
                  }
                  setActiveSortTab("following");
                }}
                className={`px-4 py-1.5 text-xs font-black rounded-full transition-all border ${
                  activeSortTab === "following"
                    ? "bg-[#fbbf24] text-black border-[#fbbf24] shadow-md"
                    : "bg-transparent border-transparent text-white/40 hover:text-white"
                }`}
              >
                المتابعات
              </button>
            </div>
          </div>

          {/* Posts Feed List */}
          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin" />
              <p className="text-xs text-white/30 font-bold">جاري تحميل المنشورات والمجالس...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                <MessageCircle className="w-8 h-8" />
              </div>
              <p className="text-sm text-white/40 font-black">لا توجد منشورات في هذا القسم بعد</p>
              <p className="text-xs text-white/20">كن أول من يشارك كلمة طيبة أو دعاء إيماني!</p>
            </div>
          ) : (
            filteredPosts.map((post, idx) => {
              const author = authorsData[post.userId];
              const authorPoints = author?.totalPoints || 0;
              const isUserAdmin = author?.email === "youssefosama@gmail.com";
              const isDarkTheme = true; 
              const activeReact = userReactions[post.id];

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#0c0d12]/95 rounded-[2.5rem] overflow-hidden shadow-lg border border-white/5 hover:border-[#fbbf24]/10 transition-all duration-300 relative group/card shrink-0"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-5 pb-2">
                    <button 
                      onClick={() => post.userId && window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: post.userId } }))}
                      className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <img
                        src={post.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${post.userId}`}
                        alt=""
                        className="w-11 h-11 rounded-full border border-white/10 object-cover bg-white/5"
                      />
                      <div className="min-w-0 text-right">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black truncate text-white">{post.userName}</p>
                          
                          {/* Crown/Star Badges */}
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md">
                              <Crown className="w-2.5 h-2.5" /> مشرف
                            </span>
                          ) : authorPoints > 1000 ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/20 px-1.5 py-0.5 rounded-md">
                              <Star className="w-2.5 h-2.5" /> طالب علم
                            </span>
                          ) : authorPoints > 500 ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                              <Sparkles className="w-2.5 h-2.5" /> نشط
                            </span>
                          ) : null}

                          {authorPoints > 0 && (
                            <span className="text-[8px] font-bold border border-white/10 px-1.5 py-0.5 rounded-md text-white/50 bg-white/5">
                              Lvl {Math.floor(authorPoints / 100) + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold mt-0.5 text-white/30">{timeAgo(post.createdAt)}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      {post.category && (
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/60">
                          {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                        </span>
                      )}

                      <button
                        onClick={() => toggleBookmark(post.id)}
                        className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#fbbf24]"
                        title={bookmarkedPosts.has(post.id) ? "إزالة الحفظ" : "حفظ المنشور"}
                      >
                        {bookmarkedPosts.has(post.id) ? (
                          <BookmarkCheck className="w-4 h-4 text-[#fbbf24]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      {user && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                            className="p-2 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {menuOpen === post.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute left-0 top-full mt-1.5 bg-[#0c0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[130px]"
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

                  {/* Post Content */}
                  <div className="px-6 py-4">
                    {post.isReflection ? (
                      <div className="p-6 md:p-8 rounded-[2rem] border border-[#fbbf24]/20 relative overflow-hidden text-center bg-gradient-to-br from-[#0a0e1c] via-[#05070e] to-[#010204] shadow-inner mt-2">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#fbbf24]/5 blur-[70px] rounded-full pointer-events-none" />
                        <div className="absolute top-3 left-4 text-[#fbbf24]/30 text-xs font-serif select-none pointer-events-none">✨</div>
                        
                        <div className="relative z-10 space-y-4">
                          <p className="font-arabic text-xl md:text-2xl font-black text-[#fbbf24] leading-relaxed text-shadow-md select-text" dir="rtl">
                            « {post.verseText} »
                          </p>
                          <p className="text-[10px] text-white/40 font-bold">[ سورة {post.surahName} ]</p>
                          <div className="w-16 h-px mx-auto bg-white/10" />
                          <p className="text-xs md:text-sm leading-relaxed font-bold whitespace-pre-wrap text-right text-white/80" dir="rtl">
                            💡 {post.reflectionText}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words font-medium text-right text-white/90">
                          {post.content}
                        </p>

                        {/* Interactive Poll Component */}
                        {post.isPoll && post.pollOptions && post.pollVotes && (
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 mt-3">
                            <p className="text-xs font-black text-white/70">📊 استطلاع رأي:</p>
                            {(() => {
                              const allVotesCount = Object.values(post.pollVotes).reduce((sum, vList) => sum + vList.length, 0);
                              return post.pollOptions.map((opt, idx) => {
                                const optionVotes = post.pollVotes?.[idx.toString()] || [];
                                const hasVoted = user && optionVotes.includes(user.uid);
                                const percentage = allVotesCount > 0 ? Math.round((optionVotes.length / allVotesCount) * 100) : 0;
                                
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleVotePoll(post.id, idx)}
                                    className="w-full relative p-3 rounded-xl border border-white/5 overflow-hidden text-right flex items-center justify-between hover:bg-white/5 active:scale-99 transition-all"
                                  >
                                    <div 
                                      className="absolute inset-y-0 right-0 bg-[#fbbf24]/5 border-l border-[#fbbf24]/20 transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="relative z-10 text-xs font-bold text-white/80 flex items-center gap-2">
                                      {hasVoted && <Check className="w-3.5 h-3.5 text-[#fbbf24]" />}
                                      <span>{opt}</span>
                                    </span>
                                    <span className="relative z-10 text-[10px] font-mono text-[#fbbf24] font-bold">
                                      {percentage}% ({optionVotes.length})
                                    </span>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        )}

                        {/* Image attachments */}
                        {post.imageUrl && (
                          <div className="rounded-2xl border border-white/5 overflow-hidden shadow-md max-h-[300px] mt-2 relative">
                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Video attachments */}
                        {post.videoUrl && (
                          <div className="rounded-2xl border border-white/5 overflow-hidden shadow-md aspect-video mt-2 bg-black flex items-center justify-center">
                            <video src={post.videoUrl} controls className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {post.isBlocked && (
                      <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2 justify-end">
                        <span>هذا المنشور قيد مراجعة الإدارة حالياً ولا يظهر للعامة.</span>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Likes/Reactions and Comments Counts */}
                  {(post.likesCount > 0 || post.commentsCount > 0) && (
                    <div className="flex items-center justify-between px-6 py-2.5 border-t bg-white/[0.01] border-white/5">
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
                        <span className="text-[10px] font-bold mr-1.5 text-white/30">
                          {post.likesCount} تفاعل
                        </span>
                      </div>

                      {post.commentsCount > 0 && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-[10px] font-bold transition-colors text-white/30 hover:text-[#fbbf24]"
                        >
                          {post.commentsCount} تعليق
                        </button>
                      )}
                    </div>
                  )}

                  {/* Social Actions Buttons Section */}
                  <div className="flex border-t relative border-white/5">
                    
                    {/* Reaction Button with Popover */}
                    <div 
                      className="flex-1 relative"
                      onMouseLeave={() => setActiveReactionPopup(null)}
                    >
                      <button
                        onClick={() => handleReact(post.id, "like")}
                        onContextMenu={(e) => { e.preventDefault(); setActiveReactionPopup(post.id); }}
                        onDoubleClick={() => setActiveReactionPopup(post.id)}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 ${
                          activeReact
                            ? "text-[#fbbf24] scale-102"
                            : "text-white/40 hover:text-white"
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

                      {/* Reactions Popover */}
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
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 border-r border-white/5 text-white/40 hover:text-[#fbbf24]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      تعليق
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black transition-all active:scale-95 border-r border-white/5 text-white/40 hover:text-blue-400"
                    >
                      <Share2 className="w-4 h-4" />
                      مشاركة
                    </button>
                  </div>

                  {/* Comments list/drawer */}
                  <AnimatePresence>
                    {expandedComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t overflow-hidden border-white/5 bg-black/20"
                      >
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                          {(() => {
                            const allCmts = comments[post.id] || [];
                            const visibleCmts = allCmts.filter(cmt => !cmt.isBlocked || cmt.userId === user?.uid);
                            
                            // Separate parents and replies
                            const parentCmts = visibleCmts.filter(cmt => !cmt.parentId);
                            const repliesCmts = visibleCmts.filter(cmt => !!cmt.parentId);
                            
                            // Sort parents by likesCount
                            const sortedParents = [...parentCmts].sort((a, b) => {
                              const likesA = a.likesCount || 0;
                              const likesB = b.likesCount || 0;
                              if (likesB !== likesA) return likesB - likesA;
                              const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                              const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                              return timeA - timeB;
                            });

                            if (sortedParents.length === 0) {
                              return (
                                <p className="text-center text-xs text-white/10 py-4 font-bold">
                                  لا توجد تعليقات بعد — كن أول من يعلّق بكلمة طيبة!
                                </p>
                              );
                            }

                            return sortedParents.map((cmt) => {
                              const commentReplies = repliesCmts.filter(r => r.parentId === cmt.id);
                              const userLiked = user && cmt.likes?.includes(user.uid);
                              
                              return (
                                <div key={cmt.id} className="space-y-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                                  {/* Parent Comment */}
                                  <div className="flex gap-3 items-start text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {cmt.isAnonymous ? (
                                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                        <EyeOff className="w-4 h-4 text-white/30" />
                                      </div>
                                    ) : (
                                      <img
                                        src={cmt.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${cmt.userId}`}
                                        alt=""
                                        className="w-9 h-9 rounded-full border border-white/10 shrink-0 object-cover bg-white/5"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="border rounded-2xl px-4 py-2.5 bg-white/5 border-white/10">
                                        <p className="text-[10px] font-black mb-0.5 flex items-center justify-between gap-2 text-white/60">
                                          <span>{cmt.isAnonymous ? "مجهول 🕶️" : cmt.userName}</span>
                                          {cmt.isBlocked && (
                                            <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                              قيد المراجعة ⏳
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xs leading-relaxed break-words font-medium text-white/90">
                                          {cmt.content}
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 mt-1 px-2">
                                        <span className="text-[8px] font-bold text-white/30">
                                          {timeAgo(cmt.createdAt)}
                                        </span>
                                        
                                        <button
                                          onClick={() => handleLikeComment(post.id, cmt.id)}
                                          className={`text-[9px] font-black transition-colors flex items-center gap-1 ${
                                            userLiked ? "text-rose-500" : "text-white/40 hover:text-white"
                                          }`}
                                        >
                                          <Heart className={`w-2.5 h-2.5 ${userLiked ? 'fill-rose-500' : ''}`} />
                                          <span>أعجبني {(cmt.likesCount || 0) > 0 ? `(${cmt.likesCount})` : ''}</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setReplyingTo({
                                              postId: post.id,
                                              commentId: cmt.id,
                                              userName: cmt.isAnonymous ? "مجهول" : cmt.userName
                                            });
                                            const inputEl = document.getElementById(`comment-input-${post.id}`);
                                            if (inputEl) inputEl.focus();
                                          }}
                                          className="text-[9px] font-black transition-colors text-white/40 hover:text-white"
                                        >
                                          رد
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nested Replies */}
                                  {commentReplies.length > 0 && (
                                    <div className="mr-8 pr-3 border-r border-[#fbbf24]/10 space-y-3 mt-2">
                                      {commentReplies.map((reply) => {
                                        const replyLiked = user && reply.likes?.includes(user.uid);
                                        return (
                                          <div key={reply.id} className="flex gap-3 items-start text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {reply.isAnonymous ? (
                                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                                <EyeOff className="w-3.5 h-3.5 text-white/30" />
                                              </div>
                                            ) : (
                                              <img
                                                src={reply.userAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${reply.userId}`}
                                                alt=""
                                                className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover bg-white/5"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="border rounded-2xl px-3.5 py-2 bg-white/5 border-white/10">
                                                <p className="text-[9px] font-black mb-0.5 flex items-center justify-between gap-2 text-white/60">
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
                                                <p className="text-xs leading-relaxed break-words font-medium text-white/90">
                                                  {reply.content}
                                                </p>
                                              </div>
                                              
                                              <div className="flex items-center gap-4 mt-1 px-2">
                                                <span className="text-[8px] font-bold text-white/30">
                                                  {timeAgo(reply.createdAt)}
                                                </span>
                                                
                                                <button
                                                  onClick={() => handleLikeComment(post.id, reply.id)}
                                                  className={`text-[9px] font-black transition-colors flex items-center gap-1 ${
                                                    replyLiked ? "text-rose-500" : "text-white/40 hover:text-white"
                                                  }`}
                                                >
                                                  <Heart className={`w-2.5 h-2.5 ${replyLiked ? 'fill-rose-500' : ''}`} />
                                                  <span>أعجبني {(reply.likesCount || 0) > 0 ? `(${reply.likesCount})` : ''}</span>
                                                </button>

                                                <button
                                                  onClick={() => {
                                                    setReplyingTo({
                                                      postId: post.id,
                                                      commentId: cmt.id,
                                                      userName: reply.isAnonymous ? "مجهول" : reply.userName
                                                    });
                                                    const inputEl = document.getElementById(`comment-input-${post.id}`);
                                                    if (inputEl) inputEl.focus();
                                                  }}
                                                  className="text-[9px] font-black transition-colors text-white/40 hover:text-white"
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

                        {/* Comment compose input */}
                        <div className="p-4 pt-0 border-t border-white/5">
                          {replyingTo && replyingTo.postId === post.id && (
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 mb-2 text-right">
                              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                <span>الرد على:</span>
                                <span className="underline font-black">@{replyingTo.userName}</span>
                              </span>
                              <button onClick={() => setReplyingTo(null)} className="text-white/45 hover:text-white p-1"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 mb-2 pt-2">
                            <button
                              onClick={() => setIsAnonymous(prev => ({ ...prev, [post.id]: !(prev[post.id] ?? false) }))}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                isAnonymous[post.id]
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                  : "bg-white/5 border-white/10 text-white/30"
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
                              className="flex-1 border rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary/50 transition-all font-bold text-right bg-white/5 border-white/20 text-white placeholder:text-white/25"
                              maxLength={300}
                            />
                            <button
                              onClick={() => handlePostComment(post.id)}
                              disabled={!commentText[post.id]?.trim() || postingComment === post.id}
                              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-md"
                            >
                              {postingComment === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

          {/* Load More trigger */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
            </div>
          )}

          {!hasMore && filteredPosts.length > 0 && (
            <p className="text-center text-[10px] text-white/20 font-bold py-8 uppercase tracking-wider">
              — نهاية المنشورات • تم تحميل جميع المشاركات —
            </p>
          )}

        </main>

        {/* ===================== COLUMN 3: RIGHT SIDEBAR ===================== */}
        <aside className={`lg:col-span-3 flex-col h-full overflow-y-auto no-scrollbar pb-6 gap-6 ${activeMobileTab === "dashboard" ? "flex" : "hidden lg:flex"}`}>
          {/* User Profile Card (Dynamic real statistics counts) */}
          {user ? (
            <div className="bg-gradient-to-b from-[#181a24] to-[#0c0d12] border border-[#fbbf24]/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center shrink-0">
              {/* Gold Ornament Mandala Background */}
              <div className="absolute top-0 inset-x-0 h-36 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.15)_0%,transparent_75%)] select-none pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="relative mt-4">
                <div className="absolute -inset-3 rounded-full border border-dashed border-[#fbbf24]/20 animate-spin-slow" />
                <img
                  src={userData?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.uid}`}
                  alt=""
                  className="w-20 h-20 rounded-full border-2 border-[#fbbf24]/50 object-cover bg-white/5 relative z-10"
                />
              </div>

              <h3 className="text-base font-black text-white mt-6 relative z-10">{userData?.displayName || user.displayName || "مستخدم يقين"}</h3>
              <p className="text-[10px] font-bold text-white/40 mt-1 relative z-10">طالب علم</p>

              {/* Total points label */}
              <button 
                onClick={completeDailyChallenge}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#fbbf24]/20 to-[#d4af37]/15 border border-[#fbbf24]/30 rounded-full text-xs font-black text-[#fbbf24] shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                {(userData?.totalPoints || 0).toLocaleString()} نقطة
              </button>

              {/* Real Profile Statistics (Posts, Followers, Following) */}
              <div className="grid grid-cols-3 gap-1 w-full border-t border-white/5 mt-6 pt-5 text-center">
                <div>
                  <span className="block text-sm font-black text-white">{userPostsCount}</span>
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">المنشورات</span>
                </div>
                <div className="border-r border-white/5">
                  <span className="block text-sm font-black text-white">{userFollowersCount.toLocaleString()}</span>
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">المتابعون</span>
                </div>
                <div className="border-r border-white/5">
                  <span className="block text-sm font-black text-white">{userFollowingCount.toLocaleString()}</span>
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">يتابع</span>
                </div>
              </div>

              {/* Profile link button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: user.uid } }))}
                className="w-full mt-6 py-3.5 bg-white/5 hover:bg-[#fbbf24]/5 hover:text-[#fbbf24] border border-white/10 rounded-2xl text-xs font-black text-white transition-all active:scale-95"
              >
                الملف الشخصي
              </button>
            </div>
          ) : (
            <div className="bg-[#0c0d12]/95 border border-white/5 rounded-[2.5rem] p-6 text-center shadow-xl flex flex-col items-center shrink-0">
              <User className="w-12 h-12 text-white/10 mb-3" />
              <h3 className="text-xs font-black text-white mb-2">لوحة التحكم الشخصية</h3>
              <p className="text-[10px] text-white/30 mb-4 leading-relaxed">سجّل دخولك لمتابعة تحدياتك اليومية وإحصائيات نقاطك في لوحة الشرف.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("show_auth_gate"))}
                className="w-full py-3 bg-[#fbbf24] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl transition-all"
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          {/* Daily Challenge Progress */}
          <div className="bg-[#0c0d12]/90 border border-border/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden shrink-0">
            <h3 className="text-sm font-black text-white mb-4 text-right">التحدي اليومي</h3>
            
            <div className="flex gap-3.5 items-start text-right">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24]/20 to-[#d4af37]/5 flex items-center justify-center border border-[#fbbf24]/30 shrink-0 shadow-lg">
                <Trophy className="w-5 h-5 text-[#fbbf24]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#fbbf24]">{dailyChallengeCompleted ? "1/1" : "0/1"}</span>
                  <h4 className="text-xs font-black text-white leading-snug">شارك آية أو حديث نبوي</h4>
                </div>
                
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-2 border border-white/5">
                  <div 
                    className="bg-gradient-to-l from-[#fbbf24] to-[#d4af37] h-full rounded-full transition-all duration-700"
                    style={{ width: dailyChallengeCompleted ? "100%" : "15%" }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={completeDailyChallenge}
              disabled={claimingChallenge || dailyChallengeCompleted}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all mt-4 flex flex-col items-center justify-center gap-1 active:scale-95 ${
                dailyChallengeCompleted
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default"
                  : "bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black shadow-lg shadow-[#fbbf24]/10"
              }`}
            >
              <span>{dailyChallengeCompleted ? "تم الإنجاز بنجاح" : "تأكيد إتمام التحدي"}</span>
            </button>
            <p className="text-center text-[9px] text-white/30 font-bold mt-2">يحصل منجز التحدي على +50 نقطة</p>
          </div>

          {/* Community Rules */}
          <div className="bg-[#0c0d12]/90 border border-border/30 rounded-[2.5rem] p-6 shadow-xl shrink-0">
            <h3 className="text-sm font-black text-white mb-5 text-right">قواعد المجتمع</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start text-right">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-normal">احترام الآخرين</h4>
                  <p className="text-[9px] text-white/30 font-bold mt-0.5">احترم جميع الأعضاء وآرائهم</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-right">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-normal">محتوى نافع</h4>
                  <p className="text-[9px] text-white/30 font-bold mt-0.5">شارك محتوى مفيد وهادف</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-right">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Ban className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-normal">تجنب المخالفات</h4>
                  <p className="text-[9px] text-white/30 font-bold mt-0.5">لا تنشر محتوى مخالف للشريعة</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-right">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Flag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-normal">الإبلاغ عن المخالفات</h4>
                  <p className="text-[9px] text-white/30 font-bold mt-0.5">ساعدنا في الحفاظ على بيئة آمنة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Banner Card */}
          <div className="bg-gradient-to-br from-[#0c2a1a] via-[#05110a] to-[#010402] border border-emerald-500/20 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden flex items-center justify-between group shrink-0">
            <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
            
            <div className="text-right flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-black text-white">ادعم مجتمع يقين</h4>
              <p className="text-[9px] text-white/40 font-bold mt-1 leading-relaxed">ساهم في نشر الخير واكسب الأجر</p>
              
              <button
                onClick={() => alert("ميزة دعم المشروع عبر البوابات المالية ستكون متوفرة قريباً، نسألكم الدعاء بظهر الغيب! 🤲")}
                className="mt-3.5 px-4 py-2 bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                ادعم الآن
              </button>
            </div>

            <div className="w-12 h-16 shrink-0 relative flex items-center justify-center select-none pointer-events-none">
              <svg viewBox="0 0 100 120" className="w-full h-full fill-current text-primary animate-pulse">
                <path d="M50 10 C45 25 30 35 30 55 C30 75 40 85 50 85 C60 85 70 75 70 55 C70 35 55 25 50 10 Z" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="50" cy="50" r="10" fill="#fbbf24" className="animate-ping" style={{ animationDuration: '3s' }} />
                <path d="M45 85 L55 85 L52 110 L48 110 Z" fill="#fbbf24" />
                <circle cx="50" cy="115" r="4" fill="#fbbf24" />
              </svg>
            </div>
          </div>

        </aside>

      </div>

      {/* ===================== NEW REAL GROUP CREATION MODAL ===================== */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCreateGroupModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0d12] border border-white/10 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                className="absolute top-6 left-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-black text-white mb-2 leading-none">إنشاء مجموعة دعوية جديدة</h3>
              <p className="text-[10px] text-white/30 font-bold mb-6">قُد مجلساً جديداً لتبادل الآيات والأدعية وكلم الطيب مع إخوتك.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 mb-1.5 pr-1">اسم المجموعة</label>
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="مثال: محبي السنن النبوية"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-[#fbbf24] transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 mb-1.5 pr-1">وصف المجموعة</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="اكتب وصفاً موجزاً لأهداف هذه المجموعة..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-[#fbbf24] transition-all font-bold resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 mb-1.5 pr-1">تصنيف المحتوى الرئيسي</label>
                  <select
                    value={newGroupCat}
                    onChange={(e) => setNewGroupCat(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none font-bold"
                  >
                    <option value="reflection">تدبر آية 📖</option>
                    <option value="dua">أدعية 🤲</option>
                    <option value="hadith">حديث شريف 📚</option>
                    <option value="good">كلمة طيبة 🌟</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="w-full py-4.5 bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-black font-black text-xs rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 mt-6 shadow-xl shadow-[#fbbf24]/10"
                >
                  تأكيد وإنشاء المجموعة 🎉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
