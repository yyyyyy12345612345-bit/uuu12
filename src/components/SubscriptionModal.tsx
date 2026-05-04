"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShieldCheck, CreditCard, Send, Upload, Loader2, Globe, Phone, ExternalLink } from "lucide-react";
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

  // Form State
  const [formData, setFormData] = useState({
    platformLink: "",
    senderInfo: "",
    proofUrl: ""
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

      // Check for pending requests
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

    if (!formData.platformLink || !formData.senderInfo || !formData.proofUrl) {
        alert("يرجى ملء جميع البيانات ورفع إثبات الدفع");
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
        proofUrl: formData.proofUrl,
        paymentMethod: formData.senderInfo.includes("@") ? "Instapay" : "Vodafone Cash",
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      alert("تم إرسال طلبك بنجاح! سيقوم الأدمن بمراجعته وتفعيل حسابك خلال ساعات.");
      onClose();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const PLANS = [
    { id: "free", name: "المجانية", price: 0, features: ["5 فيديوهات فقط", "علامة مائية مكثفة", "خلفيات ثابتة فقط", "البحث مقفول"] },
    { id: "starter", name: "خطة الهواة", price: pricing.priceStarter, features: ["50 فيديو / شهر", "بدون علامة مائية", "خلفيات فيديو", "فتح ميزة البحث"] },
    { id: "supporter", name: "ادعم المشروع ❤️", price: pricing.priceSupporter, features: ["فيديوهات غير محدودة", "بدون علامة مائية", "أولوية في الرندر", "جودة 1080p"] },
    { id: "premium", name: "البريميوم 👑", price: pricing.pricePremium, features: ["غير محدود + 4K", "بدون علامة مائية", "رندر فائق السرعة", "قوالب وخلفيات حصرية"] },
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 font-arabic overflow-y-auto">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-background border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-in zoom-in-95 duration-300">
        
        {/* Left Side: Plans Info */}
        <div className="w-full md:w-1/2 bg-card p-8 md:p-12 border-b md:border-b-0 md:border-r border-border">
            <h2 className="text-3xl font-black mb-2">اختر خطتك</h2>
            <p className="text-foreground/40 text-sm mb-8">اختر الخطة المناسبة لاحتياجاتك وابدأ في الإبداع</p>

            <div className="space-y-3">
                {PLANS.map((p) => {
                    const isCurrent = currentPlanData?.plan === p.id;
                    return (
                        <button 
                            key={p.id}
                            onClick={() => { setSelectedPlan(p.id); setActiveTab("plans"); }}
                            className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between group relative ${
                                selectedPlan === p.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border hover:border-primary/20'
                            }`}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${selectedPlan === p.id ? 'text-primary' : 'text-foreground'}`}>{p.name}</span>
                                    {isCurrent && (
                                        <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/20">خطتك الحالية</span>
                                    )}
                                </div>
                                <span className="text-[10px] text-foreground/40">{p.price === 0 ? "مجاناً للأبد" : `${p.price} ج.م / شهر`}</span>
                            </div>
                            {selectedPlan === p.id && <Check className="w-5 h-5 text-primary" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 p-6 bg-foreground/[0.02] rounded-3xl border border-border">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">مميزات الخطة المختارة</h4>
                <div className="grid grid-cols-1 gap-3">
                    {PLANS.find(p => p.id === selectedPlan)?.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/60">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            {activeTab === "plans" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="text-center md:text-right">
                        <h3 className="text-2xl font-black mb-4">تفاصيل الاشتراك</h3>
                        <p className="text-foreground/50 text-sm leading-relaxed">
                            لتفعيل الاشتراك، يرجى تحويل المبلغ المذكور عبر أحد الوسائل المتاحة، ثم ملء النموذج لإرسال طلبك للأدمن.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-emerald-500 font-black uppercase">Vodafone Cash</span>
                                <span className="text-xl font-bold text-white tracking-widest">{pricing.vodafoneCash || "سيتم التحديد"}</span>
                            </div>
                            <Phone className="w-8 h-8 text-emerald-500 opacity-40" />
                        </div>
                        
                        <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-blue-500 font-black uppercase">Instapay</span>
                                <span className="text-lg font-bold text-white tracking-tighter">{pricing.instapay || "سيتم التحديد"}</span>
                            </div>
                            <CreditCard className="w-8 h-8 text-blue-500 opacity-40" />
                        </div>
                    </div>

                    {isPending ? (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col items-center text-center gap-2">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-sm font-bold text-amber-500">طلبك قيد المراجعة حالياً</p>
                            <p className="text-[10px] text-amber-500/60">سيتم تفعيل حسابك فور تأكد الأدمن من التحويل.</p>
                        </div>
                    ) : (
                        <button 
                            disabled={selectedPlan === 'free' || currentPlanData?.plan === selectedPlan}
                            onClick={() => setActiveTab("pay")}
                            className="w-full py-5 bg-primary text-black rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {currentPlanData?.plan === selectedPlan 
                                ? "هذه هي خطتك الحالية" 
                                : selectedPlan === 'free' 
                                    ? "أنت بالفعل على الخطة المجانية" 
                                    : "تأكيد الدفع وإرسال الإثبات"}
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={() => setActiveTab("plans")} className="text-xs text-primary font-bold">العودة للخطط</button>
                        <h3 className="text-xl font-black">إرسال إثبات الدفع</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">رابط منصتك (تيك توك / إنستا)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                                <input 
                                    required
                                    value={formData.platformLink}
                                    onChange={e => setFormData({...formData, platformLink: e.target.value})}
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 pr-6 pl-12 text-right outline-none focus:border-primary/40 font-bold"
                                    placeholder="https://tiktok.com/@yourname"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">بيانات المحول (رقمك أو يوزر انستا باي)</label>
                            <input 
                                required
                                value={formData.senderInfo}
                                onChange={e => setFormData({...formData, senderInfo: e.target.value})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-bold"
                                placeholder="010XXXXXXXX أو username@instapay"
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">رابط صورة الإثبات (سكرين شوت)</label>
                            <div className="relative">
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                                <input 
                                    required
                                    value={formData.proofUrl}
                                    onChange={e => setFormData({...formData, proofUrl: e.target.value})}
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 pr-6 pl-12 text-right outline-none focus:border-primary/40 font-bold"
                                    placeholder="ارفع الصورة وضع الرابط هنا"
                                />
                            </div>
                            <p className="text-[9px] text-foreground/30 text-right mt-1 px-4">يمكنك رفع الصورة على أي موقع رفع صور ووضع الرابط هنا.</p>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-primary to-amber-500 text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                        إرسال الطلب للمراجعة
                    </button>
                </form>
            )}
        </div>

        <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-foreground/5 hover:bg-foreground/10 rounded-full transition-all text-foreground/40 hover:text-foreground"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
