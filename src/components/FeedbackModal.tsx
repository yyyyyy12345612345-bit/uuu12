"use client";

import React, { useState } from "react";
import { X, MessageSquare, Send, AtSign, CheckCircle2, AlertCircle } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<"suggestion" | "bug" | "thanks">("suggestion");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");

    // Analytics: إرسال الرسالة كحدث إلى جوجل
    // @ts-ignore
    window.gtag?.('event', 'user_feedback', {
      'feedback_type': type,
      'message_content': message,
      'device_info': navigator.userAgent
    });
    console.log("Feedback Sent to GA:", { type, message });

    // محاكاة إرسال ناجح
    setTimeout(() => {
      setStatus("success");
      setMessage("");
      setTimeout(() => {
        setStatus("idle");
        onClose();
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg glass-effect border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 text-white/20 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white font-arabic">تواصل معنا</h3>
            <p className="text-white/40 text-sm mt-2 font-arabic">اقتراحاتكم تساعدنا على تقديم الأفضل</p>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center py-10 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
             </div>
             <p className="text-xl font-bold text-white font-arabic">تم إرسال رسالتك بنجاح</p>
             <p className="text-white/40 text-sm mt-2 font-arabic">شكراً لمساعدتنا في تطوير بيتك الروحاني</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              {[
                { id: "suggestion", label: "اقتراح" },
                { id: "bug", label: "مشكلة" },
                { id: "thanks", label: "شكر" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 ${type === t.id ? 'bg-primary text-black' : 'text-white/30 hover:text-white/60'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب هنا ما يدور في خاطرك..."
              className="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none focus:border-primary/40 transition-all resize-none font-arabic leading-relaxed shadow-inner"
              required
            />

            <div className="flex flex-col gap-3">
                <button
                type="submit"
                disabled={status === "sending"}
                className="w-full py-4 bg-primary text-black rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                {status === "sending" ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <><Send className="w-5 h-5 -rotate-45" /> <span>إرسال الرسالة</span></>
                )}
                </button>

                <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">أو عبر الإنستجرام</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <a
                    href="https://www.instagram.com/youssef_osama04?igsh=MXV2Y2o5MzE0d2c1dA=="
                    target="_blank"
                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                    <AtSign className="w-5 h-5 text-pink-500" />
                    <span>@youssef_osama04</span>
                </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
