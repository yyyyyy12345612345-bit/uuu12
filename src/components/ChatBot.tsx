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
    { 
      id: "initial", 
      role: "assistant", 
      content: "السلام عليكم ورحمة الله وبركاته! أنا مساعدك الذكي «يقين». 🤍\n\nيسعدني الإجابة عن استفساراتك حول التطبيق، والأسئلة الدينية العامة، معاني الكلمات والمفردات، قصص الأنبياء والسيرة، وتدبر الآيات.\n\n⚠️ ملاحظة: بصفتي ذكاءً اصطناعياً، يسعدني شرح المعاني والقصص والآيات، ولكن لا أُصدر أحكاماً فقهية أو فتاوى شرعية ملزمة. كيف أستطيع مساعدتك اليوم؟" 
    }
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
  const [imgFailed, setImgFailed] = useState(false);
  const [imgSrc, setImgSrc] = useState("/im/chat.png");

  // Load user data
  useEffect(() => {
    if (!auth) return;
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
            }, (err) => console.error("ChatBot snapshot error:", err));
          }
        } catch (e) {
          console.error("Error loading user data from Firestore in ChatBot:", e);
        }
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
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

  const logChatInteraction = async (msgText: string, sender: "user" | "bot") => {
    if (!db) return;
    try {
      let sessionId = typeof window !== "undefined" ? localStorage.getItem("chat_session_id") : null;
      if (!sessionId && typeof window !== "undefined") {
        sessionId = "guest_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("chat_session_id", sessionId);
      }

      let isInsult = false;
      let sentiment = "neutral";

      if (sender === "user") {
        const insultRegex = /حمار|غبي|زفت|خرا|كلب|حيوان|قذر|شتم|يلعن|قحبه|شرموط/i;
        const positiveRegex = /شكرا|جزاك|حلو|رائع|ممتاز|بطل|عظيم|بارك|الله|ما شاء|جميل/i;
        if (insultRegex.test(msgText)) {
          isInsult = true;
          sentiment = "negative";
        } else if (positiveRegex.test(msgText)) {
          sentiment = "positive";
        }
      }

      const uid = userData?.uid || auth.currentUser?.uid || sessionId || "unknown";
      const name = userData?.name || userData?.displayName || auth.currentUser?.displayName || "زائر";

      await addDoc(collection(db, "chatbot_logs"), {
        userId: uid,
        userName: name,
        text: msgText,
        sender,
        isInsult,
        sentiment,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to log interaction");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg, { id: (Date.now() + 1).toString(), role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    logChatInteraction(input, "user");

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
        logChatInteraction(fullResponse, "bot");
      } else {
        const data = await res.json();
        const replyText = data.reply || data.error || "عذراً، لم أتمكن من الإجابة.";
        updateLastMessage(replyText);
        logChatInteraction(replyText, "bot");
      }
    } catch (error) {
      const errorMsg = "حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.";
      updateLastMessage(errorMsg);
      logChatInteraction(errorMsg, "bot");
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

  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [modalCoords, setModalCoords] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({ bottom: 32, right: 24 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Dynamic explicit pixel constraints for flawless movement in all directions
  const [dragBounds, setDragBounds] = useState({ left: -10, right: 1000, top: -800, bottom: 50 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateConstraints = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      const btnSize = mobile ? 48 : 64;
      const padding = 12;
      const startLeft = mobile ? 16 : 24;
      const startBottom = mobile ? 80 : 32;
      const startTop = window.innerHeight - startBottom - btnSize;

      setDragBounds({
        left: -(startLeft - padding),
        right: Math.max(0, window.innerWidth - startLeft - btnSize - padding),
        top: -Math.max(0, startTop - padding),
        bottom: Math.max(0, startBottom - padding)
      });
    };

    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, []);

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
    if (distance > 8) {
      isDraggingRef.current = true;
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) {
      e.preventDefault();
      return;
    }

    if (buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalW = 390;
      const modalH = 580;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Smart X alignment (Open next to button or align to screen bounds)
      let left: number | undefined;
      let right: number | undefined;

      if (rect.left + modalW < vw - 24) {
        left = Math.max(16, rect.left);
      } else {
        right = Math.max(16, vw - rect.right);
      }

      // Smart Y alignment (Open above or below button)
      let top: number | undefined;
      let bottom: number | undefined;

      if (rect.top - modalH > 24) {
        bottom = vh - rect.top + 8;
      } else if (rect.bottom + modalH < vh - 24) {
        top = rect.bottom + 8;
      } else {
        // Fallback clamped within screen
        top = Math.max(16, Math.min(vh - modalH - 16, rect.top - 200));
      }

      setModalCoords({ left, right, top, bottom });
    }

    setIsOpen(true);
  };

  if (pathname === "/video") return null; // Hide in video editor

  return (
    <>
      {/* Floating Draggable Mascot AI Button (Frameless & Transparent) */}
      {!isFullPage && (
        <motion.button
          ref={buttonRef}
          drag={true}
          dragConstraints={dragBounds}
          dragMomentum={false}
          dragElastic={0.08}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleButtonClick}
          whileDrag={{ scale: 1.15, cursor: "grabbing" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-20 sm:bottom-24 md:bottom-8 left-4 md:left-6 z-50 p-0 bg-transparent border-0 shadow-none outline-none group select-none ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 cursor-grab active:cursor-grabbing'}`}
          title="اسحبني لأي مكان في الشاشة أو انقر للتحدث مع يقين AI"
          style={{ touchAction: "none", userSelect: "none" }}
        >
          {/* Pure Frameless Mascot Icon */}
          <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center select-none pointer-events-none">
            {!imgFailed ? (
              <img 
                src={imgSrc} 
                alt="" 
                onError={() => {
                  if (imgSrc === "/im/chat.png") {
                    setImgSrc("/logo/yaqeen_bot.png");
                  } else {
                    setImgFailed(true);
                  }
                }}
                className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] select-none pointer-events-none" 
                draggable={false}
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 p-0.5 shadow-2xl flex items-center justify-center pointer-events-auto">
                <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                  <Bot className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
                </div>
              </div>
            )}
          </div>
        </motion.button>
      )}

      {/* Chat Window Modal */}
      <motion.div
        ref={modalRef}
        style={
          isFullPage 
            ? {} 
            : isMobile 
              ? {} 
              : {
                  position: 'fixed',
                  top: modalCoords.top !== undefined ? `${modalCoords.top}px` : undefined,
                  bottom: modalCoords.bottom !== undefined ? `${modalCoords.bottom}px` : undefined,
                  left: modalCoords.left !== undefined ? `${modalCoords.left}px` : undefined,
                  right: modalCoords.right !== undefined ? `${modalCoords.right}px` : undefined,
                }
        }
        className={
          isFullPage
            ? "relative w-full h-full flex flex-col bg-card border border-border rounded-none shadow-none"
            : isMobile
              ? `fixed bottom-0 left-0 right-0 z-[1100] w-full h-[82vh] flex flex-col bg-card/95 backdrop-blur-2xl border-t border-border rounded-t-[2.5rem] shadow-2xl transition-all duration-300 origin-bottom ${
                  isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
                }`
              : `z-[1100] w-[390px] max-h-[580px] h-[580px] flex flex-col bg-card/95 backdrop-blur-2xl border border-foreground/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                  isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'
                }`
        }
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-foreground/5 via-foreground/[0.02] to-transparent rounded-t-3xl shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-foreground/5 border border-foreground/15 flex items-center justify-center shadow-md overflow-hidden p-0.5">
              {!imgFailed ? (
                <img 
                  src={imgSrc} 
                  alt="" 
                  onError={() => {
                    if (imgSrc === "/im/chat.png") {
                      setImgSrc("/logo/yaqeen_bot.png");
                    } else {
                      setImgFailed(true);
                    }
                  }}
                  className="w-full h-full object-contain" 
                />
              ) : (
                <Bot className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">
                المساعد يقين
              </h3>
              <p className="text-[11px] text-foreground/70 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-foreground shadow-sm animate-pulse inline-block" />
                متصل الآن - ذكاء اصطناعي قرآني
              </p>
            </div>
          </div>
          {!isFullPage && (
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors"
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
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === "user" ? "bg-foreground text-background rounded-br-sm font-medium" : "bg-foreground/5 text-foreground border border-foreground/5 rounded-bl-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                </p>
                {msg.content === "" && msg.role === "assistant" && (
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-200"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] border-t border-border bg-card rounded-b-2xl shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسألني عن أي شيء..."
              className="w-full pl-12 pr-4 py-3 bg-foreground/[0.03] border border-border focus:border-foreground/30 focus:bg-background rounded-xl text-sm transition-all outline-none text-foreground"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute left-2 p-2 text-background bg-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:rotate-180" />}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
