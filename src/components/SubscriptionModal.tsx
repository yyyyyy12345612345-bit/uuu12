"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShieldCheck, CreditCard, Send, Upload, Loader2, Globe, Phone, ExternalLink, Star, Crown } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { useUserPlan } from "@/hooks/useUserPlan";

const CLOUDINARY_CLOUD_NAME = "dtuyo4gqm";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

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

  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setFormData({ ...formData, proofUrl: fileData.secure_url });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء رفع الصورة، حاول مرة أخرى");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth?.currentUser;
    if (!user || !db) return;

    if (!formData.senderInfo || !formData.proofUrl) {
        alert("يرجى إدخال بيانات المحول ورفع صورة الإيصال");
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
    { id: "free", name: "المجانية", price: 0, icon: Star, features: ["5 فيديوهات فقط", "علامة مائية مكثفة", "خلفيات ثابتة فقط"] },
    { id: "starter", name: "خطة الهواة", price: pricing.priceStarter, icon: Crown, features: ["50 فيديو / شهر", "بدون علامة مائية", "خلفيات فيديو", "فتح ميزة البحث"] },
    { id: "supporter", name: "ادعم المشروع ❤️", price: pricing.priceSupporter, icon: ShieldCheck, features: ["فيديوهات غير محدودة", "بدون علامة مائية", "أولوية في الرندر", "جودة 1080p"] },
    { id: "premium", name: "البريميوم 👑", price: pricing.pricePremium, icon: Crown, features: ["غير محدود + 4K", "بدون علامة مائية", "رندر فائق السرعة", "قوالب حصرية"] },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-6 font-arabic overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-background border-t md:border border-border rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[92vh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom duration-500">
        
        {/* Left Side: Plans Info */}
        <div className="w-full md:w-1/2 bg-card p-6 md:p-10 border-b md:border-b-0 md:border-r border-border overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <div className="text-right">
                    <h2 className="text-2xl md:text-3xl font-black mb-1">اختر خطتك</h2>
                    <p className="text-foreground/40 text-[10px] md:text-xs">اختر الخطة المناسبة لاحتياجاتك وابدأ في الإبداع</p>
                </div>
                <button onClick={onClose} className="p-2 bg-foreground/5 rounded-full md:hidden"><X className="w-6 h-6 text-foreground/40" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {PLANS.map((p) => {
                    const isCurrent = currentPlanData?.plan === p.id;
                    const isSelected = selectedPlan === p.id;
                    return (
                        <button 
                            key={p.id}
                            onClick={() => { setSelectedPlan(p.id); setActiveTab("plans"); }}
                            className={`w-full p-4 rounded-3xl border-2 text-right transition-all flex items-center justify-between group relative ${
                                isSelected ? 'border-primary bg-primary/5 shadow-xl' : 'border-border hover:border-primary/20'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isSelected ? 'bg-primary text-black border-primary' : 'bg-foreground/5 text-foreground/20 border-border'}`}>
                                    <p.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-sm md:text-base ${isSelected ? 'text-primary' : 'text-foreground'}`}>{p.name}</span>
                                        {isCurrent && (
                                            <span className="bg-primary/20 text-primary text-[7px] font-black px-2 py-0.5 rounded-full border border-primary/20">خطتك الحالية</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-foreground/40 font-bold">{p.price === 0 ? "مجاناً للأبد" : `${p.price} ج.م / شهر`}</span>
                                </div>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-primary" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 p-6 bg-foreground/[0.02] rounded-[2rem] border border-border">
                <h4 className="text-[9px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Star className="w-3 h-3 fill-primary" /> مميزات الخطة المختارة
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {PLANS.find(p => p.id === selectedPlan)?.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-foreground/60">
                            <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto no-scrollbar">
            {activeTab === "plans" ? (
                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="text-right">
                        <h3 className="text-xl md:text-2xl font-black mb-3">تفاصيل الدفع</h3>
                        <p className="text-foreground/50 text-[11px] md:text-sm leading-relaxed">
                            لتفعيل الاشتراك، يرجى تحويل المبلغ المذكور عبر أحد الوسائل المتاحة، ثم ملء النموذج لإرسال طلبك للأدمن.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-4 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between group">
                            <div className="flex flex-col text-right">
                                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Vodafone Cash</span>
                                <span className="text-lg md:text-xl font-bold text-white tracking-widest">{pricing.vodafoneCash || "سيتم التحديد"}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Phone className="w-5 h-5" />
                            </div>
                        </div>
                        
                        <div className="p-4 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/20 flex items-center justify-between group">
                            <div className="flex flex-col text-right">
                                <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Instapay</span>
                                <span className="text-base md:text-lg font-bold text-white tracking-tight">{pricing.instapay || "سيتم التحديد"}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {isPending ? (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex flex-col items-center text-center gap-2">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-sm font-bold text-amber-500">طلبك قيد المراجعة حالياً</p>
                            <p className="text-[10px] text-amber-500/60 leading-relaxed px-4">سيقوم الأدمن بتفعيل حسابك فور التأكد من وصول المبلغ.</p>
                        </div>
                    ) : (
                        <button 
                            disabled={selectedPlan === 'free' || currentPlanData?.plan === selectedPlan}
                            onClick={() => setActiveTab("pay")}
                            className="w-full py-5 bg-primary text-black rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {currentPlanData?.plan === selectedPlan 
                                ? "هذه هي خطتك الحالية" 
                                : selectedPlan === 'free' 
                                    ? "أنت بالفعل على الخطة المجانية" 
                                    : `تأكيد دفع ${PLANS.find(p => p.id === selectedPlan)?.price} ج.م`}
                        </button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={() => setActiveTab("plans")} className="text-xs text-primary font-bold hover:underline">العودة للخطط</button>
                        <h3 className="text-xl font-black">إرسال إثبات الدفع</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">رابط منصتك (اختياري)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                                <input 
                                    value={formData.platformLink}
                                    onChange={e => setFormData({...formData, platformLink: e.target.value})}
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 pr-6 pl-12 text-right outline-none focus:border-primary/40 font-bold text-sm"
                                    placeholder="https://tiktok.com/@yourname (اختياري)"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">بيانات المحول (رقمك أو يوزر انستا)</label>
                            <input 
                                required
                                value={formData.senderInfo}
                                onChange={e => setFormData({...formData, senderInfo: e.target.value})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-bold text-sm"
                                placeholder="010XXXXXXXX أو username@instapay"
                            />
                        </div>

                        <div className="space-y-1.5 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">إثبات الدفع (صورة الإيصال)</label>
                            <div className="relative group">
                                <div className={`w-full aspect-video rounded-2xl border-2 border-dashed ${uploading ? 'border-primary animate-pulse' : 'border-border'} bg-foreground/5 flex flex-col items-center justify-center overflow-hidden transition-all relative`}>
                                    {formData.proofUrl ? (
                                        <>
                                            <img src={formData.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="w-6 h-6 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {uploading ? (
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-8 h-8 text-foreground/20 mb-2" />
                                                    <span className="text-[10px] font-bold text-foreground/40">اضغط لرفع صورة الإيصال</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-primary to-amber-500 text-black rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                        إرسال الطلب للمراجعة
                    </button>
                </form>
            )}
        </div>

        <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-foreground/5 hover:bg-foreground/10 rounded-full transition-all text-foreground/40 hover:text-foreground hidden md:block"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
