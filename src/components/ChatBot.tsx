"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";

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
  const [userData, setUserData] = useState({ name: "", points: 0, rank: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Load user data
  useEffect(() => {
    let unsubFirestore: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const pts = localStorage.getItem("cached_total_points") || "0";
        setUserData(prev => ({
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
                  points: data.points || parseInt(pts),
                  rank: data.rank || "بطل قرآني"
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
        await parseStream(res);
      } else {
        const data = await res.json();
        updateLastMessage(data.reply || data.error || "عذراً، لم أتمكن من الإجابة.");
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

  if (pathname === "/video") return null; // Hide in video editor

  return (
    <>
      {/* Floating Button */}
      <motion.button
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-28 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Bot size={20} />
      </motion.button>

      {/* Chat Modal */}
      <div className={`fixed bottom-28 right-6 z-50 w-[350px] sm:w-[400px] max-h-[600px] flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">المساعد يقين</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">متصل الآن - AI</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                </p>
                {msg.content === "" && msg.role === "assistant" && (
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 rounded-b-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسألني عن أي شيء..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm transition-all outline-none text-gray-800 dark:text-gray-200"
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
      </div>
    </>
  );
}
