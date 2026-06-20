"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Send, Megaphone, Loader2, User, Phone, MessageSquare } from "lucide-react";
import { useInstantPathname } from "@/lib/navigation";
import { auth, db, initFirebase } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function FeedbackButton() {
  const pathname = useInstantPathname();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Draggable button position
  const buttonX = useMotionValue(0);
  const buttonY = useMotionValue(0);
  const isDragging = useRef(false);

  // Auto-fill details if user is logged in
  useEffect(() => {
    let isMounted = true;
    let unsubscribeAuth: (() => void) | null = null;

    const setupAuth = async () => {
      await initFirebase();
      if (!isMounted) return;

      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Pre-fill display name
          if (user.displayName) {
            setFullName(user.displayName);
          }
          // Fetch additional profile info (like phone number) from Firestore
          try {
            const userDoc = await getDoc(doc(db!, "users", user.uid));
            if (userDoc.exists() && isMounted) {
              const uData = userDoc.data();
              if (uData.displayName || uData.name) {
                setFullName(uData.displayName || uData.name || "");
              }
              if (uData.phoneNumber || uData.phone) {
                setPhone(uData.phoneNumber || uData.phone || "");
              }
            }
          } catch (e) {
            console.error("Error loading user profile for feedback form:", e);
          }
        } else {
          setFullName("");
          setPhone("");
        }
      });
    };
    setupAuth();

    return () => {
      isMounted = false;
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Determine if we should hide on Mushaf pages
  const isMushafPage = pathname === "/" || pathname.includes("mushaf") || pathname.includes("digital");
  if (isMushafPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !message.trim()) {
      alert("يرجى ملء جميع الحقول المطلوبة (الاسم والرسالة)");
      return;
    }

    setLoading(true);
    try {
      await initFirebase();
      if (!db) throw new Error("Firebase not initialized");

      const ticketSubject = message.length > 50 ? message.substring(0, 50) + "..." : message;

      await addDoc(collection(db, "support_tickets"), {
        userId: auth?.currentUser?.uid || "guest",
        userName: fullName.trim(),
        phone: phone.trim() || "غير محدد",
        subject: ticketSubject.trim(),
        message: message.trim(),
        status: "new",
        createdAt: serverTimestamp()
      });

      alert("✅ تم إرسال شكواك/اقتراحك بنجاح! شكراً لك.");
      
      // Reset non-profile fields
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      alert("❌ حدث خطأ أثناء إرسال الشكوى. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Draggable complaints button (Megaphone) */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0}
        style={{ x: buttonX, y: buttonY }}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={() => {
          setTimeout(() => { isDragging.current = false; }, 150);
        }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        whileHover={{ scale: isOpen ? 0 : 1.1 }}
        whileTap={{ scale: isOpen ? 0 : 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => { if (!isDragging.current) setIsOpen(true); }}
        className={`fixed bottom-36 left-4 sm:left-6 z-[400] w-12 h-12 rounded-full flex items-center justify-center group cursor-grab active:cursor-grabbing ${isOpen ? "pointer-events-none" : ""}`}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#000] border border-[#ea580c]/50 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:border-[#ea580c] transition-colors">
          <Megaphone className="w-5 h-5 text-[#ea580c]" />
        </div>
      </motion.button>

      {/* Complaints Form Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="force-dark relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 lg:p-8 text-right shadow-2xl font-arabic overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ea580c]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#ea580c]/10 border border-[#ea580c]/25 flex items-center justify-center text-[#ea580c] shadow-lg shadow-[#ea580c]/5">
                  <Megaphone className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">صندوق الشكاوى والاقتراحات</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">تواصل معنا مباشرة لتحسين تجربتك</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4.5">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1 flex items-center gap-1.5 justify-end">
                    <span>الاسم الكامل</span>
                    <User className="w-3.5 h-3.5" />
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكريم..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#ea580c]/40 focus:bg-white/[0.05] transition-all text-right shadow-inner"
                  />
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1 flex items-center gap-1.5 justify-end">
                    <span>رقم الهاتف للتواصل (اختياري)</span>
                    <Phone className="w-3.5 h-3.5" />
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#ea580c]/40 focus:bg-white/[0.05] transition-all text-left shadow-inner"
                    dir="ltr"
                  />
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1 flex items-center gap-1.5 justify-end">
                    <span>تفاصيل الشكوى أو المقترح</span>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب تفاصيل رسالتك أو شكواك هنا..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#ea580c]/40 focus:bg-white/[0.05] transition-all text-right resize-none shadow-inner"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#ea580c] to-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-[#ea580c]/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>إرسال الرسالة الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
