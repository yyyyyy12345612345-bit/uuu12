"use client";

import React, { useState, useEffect } from "react";
import { X, Check, CreditCard, Send, Loader2, Crown, Zap, Gift, Star, Smartphone, Copy, ArrowLeft, Sparkles, Trophy, User, Hash, FileText, Link2, DollarSign } from "lucide-react";
import { db, auth, initFirebase } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit, setDoc } from "firebase/firestore";
import { useUserPlan } from "@/hooks/useUserPlan";
import { motion, AnimatePresence } from "framer-motion";


interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
}

export function SubscriptionModal({ isOpen, onClose, initialPlan }: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "pay">("plans");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || "starter");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pricing, setPricing] = useState({
    priceStarter: 100,
    priceSupporter: 200,
    pricePremium: 250,
    vodafoneCash: "",
    instapay: ""
  });

  const { userPlan: currentPlanData } = useUserPlan();
  const [isPending, setIsPending] = useState(false);

  const [payMethod, setPayMethod] = useState<"vodafone" | "instapay">("vodafone");
  const [formData, setFormData] = useState({
    fullName: "",
    senderIdentifier: "",
    transactionRef: "",
    platformLink: "",
    proofLink: "",
    amount: "",
    note: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchPricing();
      if (initialPlan) setSelectedPlan(initialPlan);
      // Auto-fill fullName from Firebase user
      const user = auth?.currentUser;
      if (user?.displayName) {
        setFormData(prev => ({ ...prev, fullName: prev.fullName || user.displayName || "" }));
      }
    }
  }, [isOpen, initialPlan]);

  useEffect(() => {
    if (selectedPlan && selectedPlan !== 'custom') {
      let price = pricing.pricePremium;
      if (selectedPlan === 'starter') price = pricing.priceStarter;
      else if (selectedPlan === 'supporter') price = pricing.priceSupporter;
      setFormData(prev => ({ ...prev, amount: price.toString() }));
    } else if (selectedPlan === 'custom') {
      setFormData(prev => ({ ...prev, amount: "" }));
    }
  }, [selectedPlan, pricing]);

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

  const generateOrderNumber = async (): Promise<string> => {
    try {
      const counterRef = doc(db, "settings", "orderCounter");
      const counterSnap = await getDoc(counterRef);
      const nextNum = (counterSnap.exists() ? (counterSnap.data().count || 0) : 0) + 1;
      await setDoc(counterRef, { count: nextNum }, { merge: true });
      return `YQ-${String(nextNum).padStart(4, '0')}`;
    } catch {
      return `YQ-${Date.now().toString().slice(-5)}`;
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth?.currentUser;
    if (!user || !db) return;

    if (!formData.fullName.trim()) {
      alert("يرجى إدخال اسمك الكامل");
      return;
    }
    if (!formData.senderIdentifier.trim()) {
      alert(payMethod === "vodafone"
        ? "يرجى إدخال رقم الموبايل المحول منه"
        : "يرجى إدخال اسمك على Instapay");
      return;
    }
    if (!formData.amount) {
      alert("يرجى إدخال المبلغ المحول");
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
        console.error("Error fetching user profile:", e);
      }

      const orderNumber = await generateOrderNumber();

      await addDoc(collection(db, "subscription_requests"), {
        orderNumber,
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        userEmail: userProfileEmail,
        userPhone: userProfilePhone,
        fullName: formData.fullName.trim(),
        plan: selectedPlan,
        senderIdentifier: formData.senderIdentifier.trim(),
        transactionRef: formData.transactionRef.trim(),
        platformLink: formData.platformLink.trim(),
        proofLink: formData.proofLink.trim(),
        note: formData.note.trim(),
        amount: Number(formData.amount) || currentSelected?.price || 0,
        paymentMethod: payMethod === "vodafone" ? "Vodafone Cash" : "Instapay",
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert(`✅ تم إرسال طلبك بنجاح!\nرقم طلبك: ${orderNumber}\nسيتم التفعيل قريباً إن شاء الله.`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const PAYMENT_METHODS = [
    {
      id: "vodafone", name: "فودافون كاش", icon: Smartphone,
      color: "from-red-500 to-red-600",
      number: pricing.vodafoneCash || "01000000000",
      senderLabel: "رقم الموبايل المحول منه",
      senderPlaceholder: "010XXXXXXXX"
    },
    {
      id: "instapay", name: "Instapay", icon: CreditCard,
      color: "from-purple-500 to-indigo-600",
      number: pricing.instapay || "id@instapay",
      senderLabel: "اسمك على Instapay",
      senderPlaceholder: "username@instapay"
    },
  ];

  const PLANS = [
    { id: "starter", name: "تبرع عادي", price: pricing.priceStarter, icon: Zap, color: "from-blue-500 to-cyan-600" },
    { id: "supporter", name: "تبرع ذهبي", price: pricing.priceSupporter, icon: Sparkles, color: "from-emerald-500 to-teal-600" },
    { id: "premium", name: "تبرع بريميوم", price: pricing.pricePremium, icon: Crown, color: "from-yellow-500 to-amber-600" },
    { id: "custom", name: "تبرع حر (مبلغ مخصص)", price: 0, icon: DollarSign, color: "from-purple-500 to-pink-600" },
  ];

  const currentSelected = PLANS.find(p => p.id === selectedPlan);
  const currentPayMethod = PAYMENT_METHODS.find(m => m.id === payMethod);

  // Days remaining for current subscription
  const daysRemaining = currentPlanData?.subscriptionExpiry
    ? Math.max(0, Math.ceil(
        (new Date(currentPlanData.subscriptionExpiry?.toDate
          ? currentPlanData.subscriptionExpiry.toDate()
          : currentPlanData.subscriptionExpiry
        ).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : null;

  return (
    <div className="force-dark fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-6 font-['Tajawal'] overflow-y-auto no-scrollbar">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-3xl" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-7xl bg-gradient-to-br from-[#0a0b0e] via-[#0c0d10] to-[#0a0b0e] border border-white/10 rounded-t-[2.5rem] rounded-b-none md:rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto lg:overflow-hidden"
      >
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />

        {/* Animated background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse delay-1000" />

        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-8 left-8 md:hidden text-white/20 z-50">
          <X className="w-8 h-8" />
        </button>

        {/* ============ LEFT SECTION: Plans ============ */}
        <div className="w-full lg:w-[45%] p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5 overflow-visible lg:overflow-y-auto lg:no-scrollbar bg-black/20 backdrop-blur-3xl relative z-10 shrink-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white">ادعم يقين القرآن</h2>
            </div>
            <p className="text-[11px] text-primary/60 font-black uppercase tracking-[0.2em] mt-2">ساهم في استمرار المشروع واحصل على ميزات إضافية</p>

            {/* Current subscription status with days remaining */}
            {currentPlanData?.plan && currentPlanData.plan !== 'free' && daysRemaining !== null && (
              <div className={`mt-4 p-3 rounded-2xl border flex items-center gap-3 ${daysRemaining > 7 ? 'bg-emerald-500/10 border-emerald-500/20' : daysRemaining > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${daysRemaining > 7 ? 'bg-emerald-400' : daysRemaining > 0 ? 'bg-amber-400' : 'bg-red-400'}`} />
                <p className={`text-xs font-black ${daysRemaining > 7 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  مستوى دعمك الحالي: <span className="capitalize">{currentPlanData.plan}</span>
                  {daysRemaining > 0 ? ` · باقي ${daysRemaining} يوم` : ' · انتهى الدعم'}
                </p>
              </div>
            )}
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
                    isSelected
                      ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary shadow-[0_20px_60px_rgba(212,175,55,0.2)]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
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
                        {isCurrent && <span className="text-[9px] font-black px-3 py-1 bg-primary text-black rounded-full shadow-lg shadow-primary/30">المفعّلة</span>}
                      </div>
                      <span className="text-[11px] text-primary/50 font-black uppercase tracking-widest mt-1 block">
                        {p.id === 'custom' ? "تبرع بأي مبلغ تختاره" : `مساهمة بقيمة ${p.price} ج.م`}
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

          {/* 10,000 Points Auto-Unlock Card */}
          <div className="mt-6 p-6 rounded-[2rem] bg-gradient-to-r from-yellow-500/10 via-primary/10 to-purple-500/10 border border-primary/30 flex flex-col lg:flex-row items-center gap-4 text-right relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center text-black shrink-0 animate-pulse shadow-xl shadow-primary/30 relative z-10">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="flex-1 relative z-10">
              <h5 className="font-black text-sm text-white flex items-center gap-2">
                تحدي الهمة: احصل على الميزات مجاناً! 🏆
                <Sparkles className="w-4 h-4 text-primary animate-spin-slow" />
              </h5>
              <p className="text-[11px] text-white/60 leading-relaxed mt-2">
                اجمع 10,000 نقطة من الأنشطة اليومية (قراءة، أذكار، استماع)، وسيتم فتح جميع الميزات المميزة لك مجاناً بالكامل دون أي تبرع!
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

        {/* ============ RIGHT SECTION: Checkout ============ */}
        <div className="flex-1 p-6 lg:p-14 flex flex-col justify-center relative z-10 bg-gradient-to-br from-black/30 to-transparent overflow-visible lg:overflow-y-auto lg:no-scrollbar">

          <AnimatePresence mode="wait">
            {activeTab === "plans" ? (
              /* ---- Payment Gateway View ---- */
              <motion.div
                key="plans-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
              >
                <div className="text-right">
                  <h3 className="text-2xl lg:text-3xl font-black text-white mb-4">طريقة التبرع</h3>
                  {selectedPlan === 'custom' ? (
                    <div className="space-y-4 mb-4">
                      <p className="text-white/50 text-sm leading-relaxed">
                        يرجى إدخال المبلغ الذي ترغب في التبرع به (بالجنيه المصري):
                      </p>
                      <div className="flex justify-end">
                        <input
                          type="number"
                          required
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full max-w-[240px] bg-white/5 border border-white/20 focus:border-primary rounded-2xl py-3.5 px-6 text-center outline-none transition-all font-black text-white text-lg placeholder:text-white/25"
                          placeholder="المبلغ ج.م"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm leading-relaxed">
                      يرجى تحويل مبلغ <span className="text-primary font-black text-lg">{currentSelected?.price} ج.م</span> عبر أحد الوسائل التالية، ثم قم بإرسال إثبات التبرع.
                    </p>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-1 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        if (selectedPlan === 'custom' && (!formData.amount || Number(formData.amount) <= 0)) {
                          alert("يرجى إدخال مبلغ تبرع صحيح أولاً");
                          return;
                        }
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
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-white tracking-wider">{method.number}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(method.number, `method-${method.id}`); }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-white/30 hover:text-primary transition-all"
                                title="نسخ الرقم"
                              >
                                {copiedId === `method-${method.id}`
                                  ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
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
                    disabled={currentPlanData?.plan === selectedPlan && selectedPlan !== 'custom'}
                    onClick={() => {
                      if (selectedPlan === 'custom' && (!formData.amount || Number(formData.amount) <= 0)) {
                        alert("يرجى إدخال مبلغ تبرع صحيح أولاً");
                        return;
                      }
                      setActiveTab("pay");
                    }}
                    className="w-full py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary text-black rounded-[2rem] font-black text-lg shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {currentPlanData?.plan === selectedPlan && selectedPlan !== 'custom' ? 'مستوى مفعّل حالياً' : 'تأكيد الدعم وإرسال إثبات التحويل'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                )}
              </motion.div>

            ) : (
              /* ---- Payment Confirmation Form ---- */
              <motion.form
                key="pay-tab"
                onSubmit={handleSubmitRequest}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5 lg:overflow-y-auto lg:no-scrollbar lg:max-h-[calc(90vh-8rem)] overflow-visible pb-6"
              >

              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("plans")}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  العودة
                </button>
                <h3 className="text-2xl lg:text-3xl font-black text-white">إثبات الدفع</h3>
              </div>

              {/* Method Choice */}
              <div className="space-y-3 text-right">
                <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] px-2 block">طريقة التحويل</label>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => { setPayMethod(method.id as any); setFormData({ ...formData, senderIdentifier: "" }); }}
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
              <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-2 border-white/10 text-right space-y-3 shadow-xl">
                <span className="text-[11px] text-primary font-black uppercase tracking-[0.3em] block">بيانات التحويل</span>
                <p className="text-sm font-bold text-white/70">
                  حوّل مبلغ <span className="text-primary font-black text-base">{currentSelected?.price} ج.م</span> إلى:
                </p>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentPayMethod?.number || '', 'paynum')}
                    className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all shrink-0"
                    title="نسخ"
                  >
                    {copiedId === 'paynum'
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <Copy className="w-4 h-4" />}
                  </button>
                  <p className="text-xl font-black text-white tracking-wider">{currentPayMethod?.number}</p>
                </div>
              </div>

              {/* ---- Form Fields ---- */}
              <div className="space-y-4">

                {/* Full Name */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 flex items-center gap-2 justify-end">
                    <User className="w-3.5 h-3.5" /> اسمك الكامل
                  </label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                    placeholder="الاسم الكامل كما هو في بطاقتك"
                  />
                </div>

                {/* Sender Identifier - dynamic label based on payMethod */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 block">
                    {currentPayMethod?.senderLabel}
                  </label>
                  <input
                    required
                    value={formData.senderIdentifier}
                    onChange={e => setFormData({ ...formData, senderIdentifier: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                    placeholder={currentPayMethod?.senderPlaceholder}
                  />
                </div>

                {/* Transaction Reference */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 flex items-center gap-2 justify-end">
                    <Hash className="w-3.5 h-3.5" />
                    رقم العملية / Reference
                    <span className="text-white/15 normal-case font-bold">(اختياري)</span>
                  </label>
                  <input
                    value={formData.transactionRef}
                    onChange={e => setFormData({ ...formData, transactionRef: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                    placeholder="مثال: 1234567890"
                  />
                </div>

                {/* Platform Link */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 flex items-center gap-2 justify-end">
                    <Link2 className="w-3.5 h-3.5" />
                    رابط حسابك على السوشيال ميديا
                    <span className="text-white/15 normal-case font-bold">(اختياري)</span>
                  </label>
                  <input
                    value={formData.platformLink}
                    onChange={e => setFormData({ ...formData, platformLink: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07]"
                    placeholder="instagram.com/اسمك أو youtube.com/c/قناتك"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 flex items-center gap-2 justify-end">
                    <DollarSign className="w-3.5 h-3.5" /> المبلغ الفعلي المحول
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-black text-white shadow-xl text-lg hover:bg-white/[0.07]"
                    placeholder={currentSelected?.price.toString()}
                  />
                </div>

                {/* Note */}
                <div className="space-y-2 text-right">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 flex items-center gap-2 justify-end">
                    <FileText className="w-3.5 h-3.5" />
                    ملاحظة للأدمين
                    <span className="text-white/15 normal-case font-bold">(اختياري)</span>
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 transition-all font-bold text-white shadow-xl text-sm hover:bg-white/[0.07] resize-none"
                    placeholder="مثال: دفعت مرتين، أو أي ملاحظة مهمة..."
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-gradient-to-r from-primary via-yellow-400 to-primary text-black rounded-[2rem] font-black text-base shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : (<><Send className="w-5 h-5" /> إرسال طلب التفعيل</>)
                }
                {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
              </button>
            </motion.form>
          )}
          </AnimatePresence>
        </div>

        {/* Desktop Close */}
        <button onClick={onClose} className="absolute top-10 left-10 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/20 hover:text-white hidden md:block z-50">
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
}
