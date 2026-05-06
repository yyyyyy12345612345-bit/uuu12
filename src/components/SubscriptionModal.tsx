"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShieldCheck, CreditCard, Send, Loader2, Globe, Phone, ExternalLink, Star, Crown, Sparkles, Zap } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { useUserPlan } from "@/hooks/useUserPlan";


interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
}

export function SubscriptionModal({ isOpen, onClose, initialPlan }: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "pay">("plans");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || "starter");
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({
    priceStarter: 100,
    priceSupporter: 200,
    pricePremium: 250,
    vodafoneCash: "",
    instapay: ""
  });

  const { userPlan: currentPlanData } = useUserPlan();
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    platformLink: "",
    senderInfo: "",
    amount: ""
  });

  useEffect(() => {
    if (isOpen) {
        fetchPricing();
        if (initialPlan) setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  const fetchPricing = async () => {
    try {
      const s = await getDoc(doc(db, "settings", "pricing"));
      if (s.exists()) {
        const d = s.data();
        setPricing({
          priceStarter: d.priceStarter || 100,
          priceSupporter: d.priceSupporter || 200,
          pricePremium: d.pricePremium || 250,
          vodafoneCash: d.vodafoneCash || "",
          instapay: d.instapay || ""
        });
      }

      const user = auth?.currentUser;
      if (user) {
        const q = query(
          collection(db, "subscription_requests"), 
          where("userId", "==", user.uid),
          where("status", "==", "pending"),
          limit(1)
        );
        const snap = await getDocs(q);
        setIsPending(!snap.empty);
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth?.currentUser;
    if (!user || !db) return;
    if (!formData.senderInfo || !formData.amount) {
        alert("يرجى إدخال بيانات المحول والمبلغ");
        return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "subscription_requests"), {
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        plan: selectedPlan,
        platformLink: formData.platformLink,
        senderInfo: formData.senderInfo,
        amount: formData.amount,
        paymentMethod: formData.senderInfo.includes("@") ? "Instapay" : "Vodafone Cash",
        status: "pending",
        createdAt: serverTimestamp()
      });
      alert("تم إرسال طلبك بنجاح! سيتم التفعيل قريباً.");
      onClose();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const PLANS = [
    { id: "free", name: "العضوية المجانية", price: 0, icon: Star, features: ["5 فيديوهات فقط", "علامة مائية", "خلفيات ثابتة"] },
    { id: "trial", name: "تجربة مجانية 🎁", price: 0, icon: Sparkles, features: ["فيديوهات غير محدودة", "بدون علامة مائية", "خلفيات فيديو", "30 يوم"] },
    { id: "starter", name: "باقة الهواة", price: pricing.priceStarter, icon: Zap, features: ["50 فيديو شهرياً", "بدون علامة مائية", "خلفيات فيديو", "فتح ميزة البحث"] },
    { id: "premium", name: "عضوية التميز 👑", price: pricing.pricePremium, icon: Crown, features: ["غير محدود + 4K", "بدون علامة مائية", "أولوية الرندر", "قوالب حصرية"] },
  ];

  const currentSelected = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-2xl font-['Tajawal'] overflow-y-auto no-scrollbar`}>
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#064E3B] border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.7)] flex flex-col md:flex-row h-full md:h-auto md:max-h-[85vh] animate-in zoom-in-95 duration-700 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-8 left-8 md:hidden text-white/20 z-50">
            <X className="w-8 h-8" />
        </button>

        {/* Left Section: Plans */}
        <div className="w-full md:w-[45%] p-10 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto no-scrollbar bg-black/10 backdrop-blur-3xl relative z-10">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-white">خطط التميز</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-2">اختر طريقك نحو الإبداع الرقمي</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {PLANS.map((p) => {
                    const isCurrent = currentPlanData?.plan === p.id;
                    const isSelected = selectedPlan === p.id;
                    return (
                        <button 
                            key={p.id}
                            onClick={() => { setSelectedPlan(p.id); setActiveTab("plans"); }}
                            className={`w-full p-6 rounded-[2rem] border-2 text-right transition-all duration-500 flex items-center justify-between group ${
                                isSelected ? 'bg-primary/10 border-primary shadow-[0_20px_50px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-primary text-black shadow-xl shadow-primary/20' : 'bg-white/5 text-white/20'}`}>
                                    <p.icon className="w-7 h-7" />
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-base ${isSelected ? 'text-white' : 'text-white/60'}`}>{p.name}</span>
                                        {isCurrent && <span className="text-[8px] font-black px-2 py-1 bg-primary text-black rounded-lg">الحالية</span>}
                                    </div>
                                    <span className="text-[10px] text-primary/40 font-black uppercase tracking-widest mt-1 block">{p.price === 0 ? "مجانية" : `${p.price} ج.م / شهرياً`}</span>
                                </div>
                            </div>
                            {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black shadow-2xl"><Check className="w-4 h-4 stroke-[4px]" /></div>}
                        </button>
                    );
                })}
            </div>

            {currentSelected && (
                <div className="mt-10 p-8 rounded-[2rem] bg-white/5 border border-white/5 animate-in fade-in duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">مميزات الباقة</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {currentSelected.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-white/70">
                                <Check className="w-3 h-3 text-primary" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Right Section: Checkout */}
        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center relative z-10 bg-black/20">
            {activeTab === "plans" ? (
                <div className="animate-in fade-in slide-in-from-left-8 duration-700 space-y-10">
                    <div className="text-right">
                        <h3 className="text-2xl font-black text-white mb-4">بوابة الدفع</h3>
                        <p className="text-white/40 text-sm leading-relaxed">يرجى تحويل مبلغ <span className="text-primary font-black">{currentSelected?.price} ج.م</span> عبر أحد الوسائل التالية، ثم قم بإرسال إثبات الدفع.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group transition-all hover:bg-white/10">
                            <div className="text-right">
                                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2 block">Vodafone Cash</span>
                                <span className="text-2xl font-black text-white tracking-[0.2em]">{pricing.vodafoneCash || "01000000000"}</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                <Phone className="w-6 h-6" />
                            </div>
                        </div>
                        
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group transition-all hover:bg-white/10">
                            <div className="text-right">
                                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2 block">Instapay</span>
                                <span className="text-lg font-black text-white">{pricing.instapay || "id@instapay"}</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {isPending ? (
                        <div className="p-10 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex flex-col items-center gap-6 text-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <div>
                                <p className="text-base font-black text-primary">الطلب قيد المراجعة</p>
                                <p className="text-[10px] text-primary/40 uppercase tracking-widest mt-2">سيتم التفعيل تلقائياً فور التأكد</p>
                            </div>
                        </div>
                    ) : (
                        <button 
                            disabled={selectedPlan === 'free' || currentPlanData?.plan === selectedPlan}
                            onClick={() => setActiveTab("pay")}
                            className="w-full py-6 bg-primary text-black rounded-[2rem] font-black text-lg shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30"
                        >
                            {currentPlanData?.plan === selectedPlan ? 'باقة مفعّلة حالياً' : 'تأكيد الدفع وإرسال الإثبات'}
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmitRequest} className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8">
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => setActiveTab("plans")} className="text-xs font-black text-primary uppercase tracking-widest hover:underline">العودة للخيارات</button>
                        <h3 className="text-2xl font-black text-white">إثبات الدفع</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">رابط منصتك (للدعم التقني)</label>
                            <input 
                                value={formData.platformLink}
                                onChange={e => setFormData({...formData, platformLink: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl"
                                placeholder="https://tiktok.com/@..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">بيانات المحول</label>
                            <input 
                                required
                                value={formData.senderInfo}
                                onChange={e => setFormData({...formData, senderInfo: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl"
                                placeholder="010XXXXXXXX / username@instapay"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">المبلغ المحول</label>
                            <input 
                                required
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-8 text-right outline-none focus:border-primary/50 transition-all font-black text-white shadow-xl"
                                placeholder={currentSelected?.price.toString()}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-6 bg-primary text-black rounded-[2.5rem] font-black text-lg shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-6 h-6" />}
                        إرسال طلب التفعيل
                    </button>
                </form>
            )}
        </div>

        {/* Desktop Close */}
        <button onClick={onClose} className="absolute top-10 left-10 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/20 hover:text-white hidden md:block z-50">
            <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
