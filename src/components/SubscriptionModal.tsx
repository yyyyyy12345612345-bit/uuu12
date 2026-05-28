"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShieldCheck, CreditCard, Send, Loader2, Globe, Phone, ExternalLink, Star, Crown, Zap, Gift, Wallet, Building, Smartphone, QrCode, Copy, ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { db, auth, initFirebase } from "@/lib/firebase";
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

  const [payMethod, setPayMethod] = useState<"vodafone" | "instapay" | "fawry">("vodafone");
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
      await initFirebase();
      let userProfileEmail = user.email || "";
      let userProfilePhone = "";
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          userProfileEmail = uData.email || user.email || "";
          userProfilePhone = uData.phoneNumber || uData.phone || "";
        }
      } catch (e) {
        console.error("Error fetching user profile for subscription request:", e);
      }

      await addDoc(collection(db, "subscription_requests"), {
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        userEmail: userProfileEmail,
        userPhone: userProfilePhone,
        plan: selectedPlan,
        platformLink: formData.platformLink,
        senderInfo: formData.senderInfo,
        amount: Number(formData.amount) || currentSelected?.price || 0,
        paymentMethod: payMethod === "vodafone" ? "Vodafone Cash" : "Instapay",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const PAYMENT_METHODS = [
    { id: "vodafone", name: "فودافون كاش", icon: Smartphone, color: "from-red-500 to-red-600", number: pricing.vodafoneCash || "01000000000" },
    { id: "instapay", name: "Instapay", icon: CreditCard, color: "from-purple-500 to-indigo-600", number: pricing.instapay || "id@instapay" },
    { id: "fawry", name: "Fawry Pay", icon: Building, color: "from-orange-500 to-orange-600", number: "كود Fawry: 12345" },
  ];

  const PLANS = [
    { id: "free", name: "العضوية المجانية", price: 0, icon: Star, color: "from-gray-500 to-gray-600", features: ["5 فيديوهات فقط", "علامة مائية", "خلفيات ثابتة"] },
    { id: "trial", name: "تجربة مجانية 🎁", price: 0, icon: Gift, color: "from-green-500 to-emerald-600", features: ["فيديوهات غير محدودة", "بدون علامة مائية", "خلفيات فيديو", "30 يوم"] },
    { id: "starter", name: "باقة الهواة", price: pricing.priceStarter, icon: Zap, color: "from-blue-500 to-cyan-600", features: ["50 فيديو شهرياً", "بدون علامة مائية", "خلفيات فيديو", "فتح ميزة البحث"] },
    { id: "premium", name: "عضوية التميز 👑", price: pricing.pricePremium, icon: Crown, color: "from-yellow-500 to-amber-600", features: ["غير محدود + 4K", "بدون علامة مائية", "أولوية الرندر", "قوالب حصرية"] },
  ];

  const currentSelected = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-3xl font-['Tajawal'] overflow-y-auto no-scrollbar`}>
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-7xl bg-gradient-to-br from-[#0a0b0e] via-[#0c0d10] to-[#0a0b0e] border border-white/10 rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row h-full lg:h-auto lg:max-h-[90vh] animate-in zoom-in-95 duration-500 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />
        
        {/* Animated background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse delay-1000" />
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-8 left-8 md:hidden text-white/20 z-50">
            <X className="w-8 h-8" />
        </button>

        {/* Left Section: Plans */}
        <div className="w-full lg:w-[45%] p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto no-scrollbar bg-black/20 backdrop-blur-3xl relative z-10">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white">خطط التميز</h2>
                </div>
                <p className="text-[11px] text-primary/60 font-black uppercase tracking-[0.2em] mt-2">اختر طريقك نحو الإبداع الرقمي</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {PLANS.map((p) => {
                    const isCurrent = currentPlanData?.plan === p.id;
                    const isSelected = selectedPlan === p.id;
                    return (
                        <button 
                            key={p.id}
                            onClick={() => { setSelectedPlan(p.id); setActiveTab("plans"); }}
                            className={`w-full p-6 rounded-[2rem] border-2 text-right transition-all duration-500 flex items-center justify-between group relative overflow-hidden ${
                                isSelected ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary shadow-[0_20px_60px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                            }`}
                        >
                            {/* Gradient overlay for selected */}
                            {isSelected && <div className={`absolute inset-0 bg-gradient-to-r ${p.color} opacity-10`} />}
                            
                            <div className="flex items-center gap-5 relative z-10">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                    isSelected ? `bg-gradient-to-br ${p.color} text-white shadow-xl scale-110` : 'bg-white/5 text-white/20'
                                }`}>
                                    <p.icon className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-lg ${isSelected ? 'text-white' : 'text-white/60'}`}>{p.name}</span>
                                        {isCurrent && <span className="text-[9px] font-black px-3 py-1 bg-primary text-black rounded-full shadow-lg shadow-primary/30">الحالية</span>}
                                    </div>
                                    <span className="text-[11px] text-primary/50 font-black uppercase tracking-widest mt-1 block">
                                      {p.price === 0 ? "مجانية" : `${p.price} ج.م / شهرياً`}
                                    </span>
                                </div>
                            </div>
                            {isSelected && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center text-black shadow-2xl relative z-10">
                                <Check className="w-5 h-5 stroke-[4px]" />
                              </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {currentSelected && (
                <div className="mt-10 p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 animate-in fade-in duration-700 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Crown className="w-5 h-5 text-primary" />
                        <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">مميزات الباقة</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {currentSelected.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-white/80">
                                <Check className="w-4 h-4 text-primary" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 10,000 Points Auto-Unlock Card */}
            <div className="mt-6 p-6 rounded-[2rem] bg-gradient-to-r from-yellow-500/10 via-primary/10 to-purple-500/10 border border-primary/30 flex flex-col lg:flex-row items-center gap-4 text-right relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center text-black shrink-0 animate-pulse shadow-xl shadow-primary/30 relative z-10">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="flex-1 relative z-10">
                <h5 className="font-black text-sm text-white flex items-center gap-2">
                  تحدي النخبة: باقة التميز مجاناً! 🏆
                  <Sparkles className="w-4 h-4 text-primary animate-spin-slow" />
                </h5>
                <p className="text-[11px] text-white/60 leading-relaxed mt-2">
                  اجمع 10,000 نقطة من الأنشطة اليومية، وسيتم ترقيتك لعضوية التميز (Premium) لإنتاج الفيديوهات مجاناً بالكامل دون أي رسوم!
                </p>
                {currentPlanData?.totalPoints !== undefined && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-1000 shadow-lg"
                        style={{ width: `${Math.min(100, (currentPlanData.totalPoints / 10000) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-primary shrink-0 bg-primary/10 px-3 py-1 rounded-full">
                      {(currentPlanData.totalPoints || 0).toLocaleString()} / 10,000
                    </span>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Right Section: Checkout */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center relative z-10 bg-gradient-to-br from-black/30 to-transparent">
            {activeTab === "plans" ? (
                <div className="animate-in fade-in slide-in-from-left-8 duration-500 space-y-8">
                    <div className="text-right">
                        <h3 className="text-2xl lg:text-3xl font-black text-white mb-4">بوابة الدفع</h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                          يرجى تحويل مبلغ <span className="text-primary font-black text-lg">{currentSelected?.price} ج.م</span> عبر أحد الوسائل التالية، ثم قم بإرسال إثبات الدفع.
                        </p>
                    </div>

                    {/* Payment Methods Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => {
                                  setPayMethod(method.id as any);
                                  setActiveTab("pay");
                                }}
                                className="w-full p-6 rounded-[2rem] bg-white/5 border-2 border-white/10 hover:border-primary/50 transition-all duration-300 group text-right relative overflow-hidden hover:bg-white/[0.07] hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${method.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                                            <method.icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-white/40 font-black uppercase tracking-[0.3em] mb-2 block">{method.name}</span>
                                            <span className="text-xl font-black text-white tracking-wider">{method.number}</span>
                                        </div>
                                    </div>
                                    <ArrowLeft className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {isPending ? (
                        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 flex flex-col items-center gap-6 text-center shadow-2xl">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <div>
                                <p className="text-lg font-black text-primary">الطلب قيد المراجعة</p>
                                <p className="text-[11px] text-primary/40 uppercase tracking-widest mt-2">سيتم التفعيل تلقائياً فور التأكد</p>
                            </div>
                        </div>
                    ) : (
                        <button 
                            disabled={selectedPlan === 'free' || currentPlanData?.plan === selectedPlan}
                            onClick={() => setActiveTab("pay")}
                            className="w-full py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary text-black rounded-[2rem] font-black text-lg shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className="relative z-10">{currentPlanData?.plan === selectedPlan ? 'باقة مفعّلة حالياً' : 'تأكيد الدفع وإرسال الإثبات'}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmitRequest} className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <button 
                          type="button" 
                          onClick={() => setActiveTab("plans")} 
                          className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          العودة للخيارات
                        </button>
                        <h3 className="text-2xl lg:text-3xl font-black text-white">إثبات الدفع</h3>
                    </div>

                    {/* Method Choice Selection */}
                    <div className="space-y-3 text-right">
                        <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">اختر طريقة التحويل</label>
                        <div className="grid grid-cols-3 gap-3">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => { setPayMethod(method.id as any); setFormData({ ...formData, senderInfo: "" }); }}
                                    className={`py-5 rounded-2xl border-2 transition-all font-black text-sm relative overflow-hidden ${
                                        payMethod === method.id 
                                          ? `border-primary bg-gradient-to-br ${method.color} text-white shadow-xl scale-105` 
                                          : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    <method.icon className={`w-6 h-6 mx-auto mb-2 ${payMethod === method.id ? 'animate-bounce' : ''}`} />
                                    <span className="text-[10px]">{method.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Payment info card */}
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-2 border-white/10 text-right space-y-4 shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[11px] text-primary font-black uppercase tracking-[0.3em] block relative z-10">بيانات التحويل المطلوبة</span>
                        <p className="text-base font-bold text-white/80 relative z-10">
                            يرجى تحويل مبلغ <span className="text-primary font-black text-lg">{currentSelected?.price} ج.م</span> إلى:
                        </p>
                        <div className="flex items-center justify-between gap-4 relative z-10">
                            <p className="text-2xl font-black text-white tracking-wider">
                              {PAYMENT_METHODS.find(m => m.id === payMethod)?.number || pricing.vodafoneCash || "01000000000"}
                            </p>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(PAYMENT_METHODS.find(m => m.id === payMethod)?.number || '')}
                              className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all shrink-0"
                              title="نسخ"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2 text-right">
                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">
                                {payMethod === "vodafone" ? "رقم الهاتف المحول منه" : payMethod === "instapay" ? "اسم الحساب أو عنوان Instapay" : "رقم فوري المرجعي"}
                            </label>
                            <input 
                                required
                                value={formData.senderInfo}
                                onChange={e => setFormData({...formData, senderInfo: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                                placeholder={payMethod === "vodafone" ? "010XXXXXXXX" : payMethod === "instapay" ? "username@instapay" : "أدخل رقم فوري"}
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">رابط منصتك (للدعم التقني)</label>
                            <input 
                                value={formData.platformLink}
                                onChange={e => setFormData({...formData, platformLink: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                                placeholder="https://tiktok.com/@..."
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] px-4 block">المبلغ الفعلي المحول</label>
                            <input 
                                required
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-6 text-right outline-none focus:border-primary/50 transition-all font-black text-white shadow-xl text-lg hover:bg-white/[0.07]"
                                placeholder={currentSelected?.price.toString()}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary text-black rounded-[2rem] font-black text-base shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            إرسال طلب التفعيل
                          </>
                        )}
                        {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
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
