"use client";

import React from "react";
import { X, MessageSquare, Phone, AtSign } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 font-arabic">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-sm bg-[#050505] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden force-dark">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] -translate-y-10 translate-x-10 pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 text-white/20 hover:text-white transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-8 text-center relative z-10 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2">تواصل معنا</h3>
            <p className="text-white/40 text-sm font-bold leading-relaxed px-4">يسعدنا تواصلكم الدائم معنا لأي استفسار أو مساعدة.</p>
        </div>

        <div className="flex flex-col gap-4 relative z-10">


            <a
                href="https://www.instagram.com/youssef_osama04"
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-pink-500/10 border border-pink-500/30 text-pink-500 rounded-[1.5rem] font-black text-base flex flex-row-reverse items-center justify-center gap-3 shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:bg-pink-500/20 transition-all hover:scale-105 active:scale-95"
            >
                <AtSign className="w-5 h-5" />
                <span>إنستجرام @youssef_osama04</span>
            </a>
        </div>
      </div>
    </div>
  );
}
