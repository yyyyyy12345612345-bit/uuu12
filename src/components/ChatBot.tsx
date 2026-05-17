"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "السلام عليكم ورحمة الله وبركاته! أنا مساعد الذكاء الاصطناعي الخاص بالاستوديو القرآني. كيف يمكنني مساعدتك اليوم؟", sender: "bot" }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const newUserMsg = { id: Date.now(), text: message.trim(), sender: "user" };
    setMessages(prev => [...prev, newUserMsg]);
    setMessage("");
    setIsTyping(true);

    // Simulate AI response (Placeholder for future API integration)
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          text: "هذه رسالة تجريبية من المساعد الذكي. يمكنك لاحقاً ربط هذا النظام بأي API للذكاء الاصطناعي مثل ChatGPT للرد على استفسارات المستخدمين في الموقع.", 
          sender: "bot" 
        }
      ]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 left-6 z-[400] w-14 h-14 bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center justify-center text-black transition-all ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 rounded-full border border-white/40" />
        <MessageSquare className="w-6 h-6" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#111]"
        />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 sm:left-6 z-[500] w-[calc(100vw-32px)] sm:w-[380px] h-[500px] max-h-[80vh] bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Edge Glow */}
            <div className="absolute inset-0 rounded-[2rem] pointer-events-none border border-[#d4af37]/20" />
            
            {/* Header */}
            <div className="relative p-5 bg-gradient-to-b from-[#111] to-transparent border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm flex items-center gap-1">
                    المساعد الذكي <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">متصل الآن - AI Beta</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 font-arabic">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${msg.sender === "user" ? "bg-white/10" : "bg-[#d4af37]/20"}`}>
                      {msg.sender === "user" ? <User className="w-3 h-3 text-white/60" /> : <Bot className="w-3 h-3 text-[#d4af37]" />}
                    </div>
                    <div 
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        msg.sender === "user" 
                          ? "bg-gradient-to-br from-white/10 to-white/5 text-white rounded-tr-none border border-white/5" 
                          : "bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 text-white/90 rounded-tl-none border border-[#d4af37]/20"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="max-w-[80%] flex items-end gap-2">
                    <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-[#d4af37]/20">
                      <Bot className="w-3 h-3 text-[#d4af37]" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#d4af37]/5 rounded-tl-none border border-[#d4af37]/10 flex items-center gap-1.5">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5 shrink-0 relative z-10">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اسأل المساعد الذكي هنا..."
                  dir="rtl"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping}
                  className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a6e1c] flex items-center justify-center text-black disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg"
                >
                  <Send className="w-5 h-5 -translate-x-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
