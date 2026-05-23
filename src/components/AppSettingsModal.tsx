"use client";

import React from "react";
import { X, Settings, Info, Instagram } from "lucide-react";

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center font-arabic">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-foreground/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 flex flex-col">

        {/* Decorative BG */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 blur-[80px] rounded-full translate-y-1/2" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex items-center justify-between border-b border-foreground/5">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-foreground text-right">إعدادات التطبيق</h2>
              <p className="text-[10px] text-foreground/30 uppercase tracking-widest text-right">App Settings</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-2">
            <Info className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-black text-foreground">قريباً جداً!</h3>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-[80%] mx-auto">
            سيتم إضافة خيارات هنا قريباً. اقترح علينا نعمل إيه في الإعدادات دي!
          </p>
          <a 
            href="https://www.instagram.com/youssef_osama04" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 text-pink-500 rounded-xl hover:bg-pink-500/20 hover:scale-105 active:scale-95 transition-all font-black text-xs"
          >
            <Instagram className="w-4 h-4" />
            تواصل معي على إنستقرام
          </a>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-base transition-all duration-300 bg-foreground/5 text-foreground hover:bg-foreground/10 active:scale-95"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
}
