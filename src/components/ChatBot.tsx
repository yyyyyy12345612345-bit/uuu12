"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, useMotionValue } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "initial", role: "assistant", content: "السلام عليكم! أنا مساعدك الذكي يقين 🌸. كيف يمكنني مساعدتك في استكشاف التطبيق أو الإجابة عن استفساراتك اليوم؟" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>({
    name: "",
    points: 0,
    rank: "",
    country: "",
    gender: "",
    createdAt: "",
    registrationType: "",
    plan: "",
    videoRendersCount: 0,
    activeQuranPlan: null
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Load user data
  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const pts = localStorage.getItem("cached_total_points") || "0";
        setUserData((prev: any) => ({
          ...prev,
          name: user.displayName || "يا غالي",
          points: parseInt(pts),
          rank: "بطل قرآني"
        }));

        try {
          const { doc, onSnapshot } = await import("firebase/firestore");
          if (db) {
            unsubFirestore = onSnapshot(doc(db, "users", user.uid), (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setUserData({
                  name: data.displayName || data.username || user.displayName || "يا غالي",
                  points: data.points || data.totalPoints || parseInt(pts),
                  rank: data.rank || "بطل قرآني",
                  country: data.country || "",
                  gender: data.gender || "",
                  createdAt: data.createdAt || "",
                  registrationType: data.registrationType || "direct",
                  plan: data.plan || "free",
                  videoRendersCount: data.videoRendersCount || 0,
                  activeQuranPlan: data.activeQuranPlan || null
                });
              }
            });
          }
        } catch (e) {
          console.error("Error loading user data from Firestore in ChatBot:", e);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const parseStream = async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) return "";

    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      
      // Basic extraction for OpenAI/Groq SSE format
      const lines = chunk.split("\n").filter(line => line.trim() !== "");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            text += content;
            updateLastMessage(text);
          } catch (e) {}
        } else if (line.startsWith("{")) {
          // Gemini JSON stream format attempt
          try {
            const parsed = JSON.parse(line);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            text += content;
            updateLastMessage(text);
          } catch(e) {}
        } else {
            // Raw text (if backend strips formatting)
            try {
                const parsed = JSON.parse(line);
                if(parsed.text) {
                    text += parsed.text;
                    updateLastMessage(text);
                }
            } catch(e) {
                // If pure text stream
                if(!line.includes('"candidates"')) {
                    text += chunk;
                    updateLastMessage(text);
                    break;
                }
            }
        }
      }
    }
    return text;
  };

  const updateLastMessage = (content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
        newMessages[newMessages.length - 1].content = content;
      }
      return newMessages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg, { id: (Date.now() + 1).toString(), role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    const logMessage = async (msgText: string, sender: "user" | "bot") => {
      if (!db) return;
      try {
        await addDoc(collection(db, "chatbot_logs"), {
          userId: userData?.uid || auth.currentUser?.uid || "guest",
          userName: userData?.name || userData?.displayName || auth.currentUser?.displayName || "زائر",
          text: msgText, // AdminPanel expects .text or .message
          message: msgText,
          sender,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to log chat:", e);
      }
    };

    // Log the user's message
    logMessage(input, "user");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userData
        })
      });

      if (!res.ok) throw new Error("فشل في الاتصال بالخادم");
      
      const isStream = res.headers.get("content-type")?.includes("event-stream");
      
      if (isStream) {
        const fullResponse = await parseStream(res);
        logMessage(fullResponse, "bot");
      } else {
        const data = await res.json();
        const replyText = data.reply || data.error || "عذراً، لم أتمكن من الإجابة.";
        updateLastMessage(replyText);
        logMessage(replyText, "bot");
      }
    } catch (error) {
      updateLastMessage("حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse markdown links [Text](url) and bold text **text**
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    const regex = /(\[.*?\]\s*\(.*?\))|(\*\*.*?\*\*)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      const linkMatch = part.match(/^\[(.*?)\]\s*\((.*?)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");

        if (isExternal) {
          return (
            <a
              key={index}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-700 dark:hover:text-emerald-300 mx-1 transition-colors"
            >
              {linkText}
            </a>
          );
        } else {
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(linkUrl);
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer mx-1 transition-colors bg-transparent border-none p-0 inline"
            >
              {linkText}
            </button>
          );
        }
      }

      const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={index} className="font-extrabold text-teal-600 dark:text-teal-400">
            {boldMatch[1]}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const isFullPage = pathname === "/chat" || pathname === "/chatbot";

  // State to track if it is mobile and viewport constraints
  const [isMobile, setIsMobile] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: -400, right: 0, top: -600, bottom: 0 });

  // Motion values to share coordinates between floating button and modal
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Drag ref to prevent click action on end drag
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const modalRef = useRef<HTMLDivElement>(null);
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });

  const clampModalPosition = () => {
    if (!modalRef.current) return;

    const rect = modalRef.current.getBoundingClientRect();
    const modalWidth = rect.width || 380;
    const modalHeight = rect.height || 550;

    const currentX = dragX.get();
    const currentY = dragY.get();

    // Default starting positions relative to viewport
    // bottom-28 (112px from bottom) and right-6 (24px from right)
    const defaultRight = window.innerWidth - 24;
    const defaultLeft = defaultRight - modalWidth;
    const defaultBottom = window.innerHeight - 112;
    const defaultTop = defaultBottom - modalHeight;

    // Calculate limits for x and y translations
    const minX = 16 - defaultLeft;
    const maxX = (window.innerWidth - 16) - defaultRight;

    const minY = 16 - defaultTop;
    const maxY = (window.innerHeight - 16) - defaultBottom;

    const clampedX = Math.max(minX, Math.min(maxX, currentX));
    const clampedY = Math.max(minY, Math.min(maxY, currentY));

    setModalOffset({ x: clampedX, y: clampedY });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setDragConstraints({
        left: -window.innerWidth + 80,
        right: 0,
        top: -window.innerHeight + 150,
        bottom: 0
      });
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clamp modal position on resize/drag coordinates changes when open
  useEffect(() => {
    if (typeof window === "undefined" || !isOpen || isFullPage || isMobile) return;

    // Run after a short timeout to let the modal mount and get its correct height
    const timer = setTimeout(clampModalPosition, 50);

    window.addEventListener("resize", clampModalPosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", clampModalPosition);
    };
  }, [isOpen, isFullPage, isMobile, dragX, dragY]);

  // Click outside to close chatbot
  useEffect(() => {
    if (!isOpen || isFullPage) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick, true);
    document.addEventListener("touchstart", handleOutsideClick, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick, true);
      document.removeEventListener("touchstart", handleOutsideClick, true);
    };
  }, [isOpen, isFullPage]);

  const handleDragStart = (e: any, info: any) => {
    isDraggingRef.current = false;
    dragStartPos.current = { x: info.point.x, y: info.point.y };
  };

  const handleDrag = (e: any, info: any) => {
    const distance = Math.hypot(
      info.point.x - dragStartPos.current.x,
      info.point.y - dragStartPos.current.y
    );
    if (distance > 5) {
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) {
      e.preventDefault();
      return;
    }
    // Clamp coordinates immediately to avoid layout jumps
    clampModalPosition();
    setIsOpen(true);
  };

  if (pathname === "/video") return null; // Hide in video editor

  // CSS Class adjustments for Light/Dark mode and Mobile/Desktop/FullPage modes
  const modalClassName = isFullPage
    ? "relative w-full h-full flex flex-col bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-900/50 rounded-none shadow-none"
    : isMobile
      ? `fixed bottom-0 left-0 right-0 z-[1100] w-full h-[80vh] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 rounded-t-3xl shadow-2xl transition-all duration-300 origin-bottom ${
          isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`
      : `fixed bottom-28 right-6 z-[1100] w-[350px] sm:w-[400px] max-h-[600px] flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl transition-all duration-500 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'
        }`;

  return (
    <>
      {/* Floating Button (Hide in full page mode) */}
      {!isFullPage && (
        <motion.button
          drag={true}
          dragConstraints={dragConstraints}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleButtonClick}
          style={{ x: dragX, y: dragY }}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          className={`fixed bottom-28 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 cursor-grab active:cursor-grabbing'}`}
        >
          <Bot size={22} />
        </motion.button>
      )}

      <motion.div
        ref={modalRef}
        style={{ x: (!isFullPage && !isMobile) ? modalOffset.x : 0, y: (!isFullPage && !isMobile) ? modalOffset.y : 0 }}
        className={modalClassName}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">المساعد يقين</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">متصل الآن - AI</p>
            </div>
          </div>
          {!isFullPage && (
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 ${
          isFullPage ? 'max-h-none' : 'max-h-[400px]'
        }`}>
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm" : "bg-gray-100/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-bl-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                </p>
                {msg.content === "" && msg.role === "assistant" && (
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-950/50 rounded-b-2xl shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسألني عن أي شيء..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm transition-all outline-none text-gray-800 dark:text-gray-200"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute left-2 p-2 text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:rotate-180" />}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
