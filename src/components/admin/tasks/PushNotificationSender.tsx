import React from "react";
import { Bell, Users, TrendingUp, Loader2, Copy, CheckCircle } from "lucide-react";
import { PushNotification } from "../AdminPanel.types";

const INPUT_CLASS = "w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-sm text-white outline-none resize-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition";
const LABEL = "text-xs font-black uppercase tracking-[0.18em] text-white/30";
const BTN_GHOST = "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition font-bold";

interface PushNotificationSenderProps {
  pushTitle: string;
  setPushTitle: (v: string) => void;
  pushBody: string;
  setPushBody: (v: string) => void;
  pushTarget: 'all' | 'subscribers' | 'free';
  setPushTarget: (v: 'all' | 'subscribers' | 'free') => void;
  pushHistory: PushNotification[];
  isSendingPush: boolean;
  pushHistoryLoading: boolean;
  handleSendPushNotification: () => void;
  fetchPushHistory: () => void;
  totalUsers: number;
  pushSubscribers: number;
}

export function PushNotificationSender({
  pushTitle,
  setPushTitle,
  pushBody,
  setPushBody,
  pushTarget,
  setPushTarget,
  pushHistory,
  isSendingPush,
  pushHistoryLoading,
  handleSendPushNotification,
  fetchPushHistory,
  totalUsers,
  pushSubscribers
}: PushNotificationSenderProps) {
  const reachPercentage = totalUsers > 0 ? Math.round((pushSubscribers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Bell, label: 'المشتركين', value: pushSubscribers, note: 'لديهم FCM Token', color: 'text-violet-400' },
          { icon: Users, label: 'إجمالي المستخدمين', value: totalUsers, note: 'جميع الحسابات', color: 'text-emerald-400' },
          { icon: TrendingUp, label: 'نسبة الوصول', value: `${reachPercentage}%`, note: 'من إجمالي المستخدمين', color: 'text-sky-400' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-center">
            <item.icon className={`mx-auto mb-3 h-7 w-7 ${item.color}`} />
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">{item.label}</p>
            <p className={`mt-3 text-3xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-white/20 mt-1">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <button onClick={fetchPushHistory} className={BTN_GHOST}>
            {pushHistoryLoading ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : "سجل الإشعارات"}
          </button>
          <div className="text-right">
            <h2 className="text-xl font-black">إرسال إشعار فوري</h2>
            <p className="text-sm text-white/30 mt-1">ابعت إشعار لجميع المستخدمين أو فئة منهم</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-3 text-right">
            <label className={LABEL}>قوالب سريعة</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '📖 تذكير يومي', title: '📖 وقت القرآن', body: 'لم تقرأ القرآن اليوم بعد. ابدأ بسورة واحدة على الأقل 🌙' },
                { label: '🌿 سورة الكهف', title: '🌿 يوم الجمعة المبارك', body: 'لا تنسَ قراءة سورة الكهف اليوم! من قرأها أضاءت له نور بين الجمعتين 🤍' },
                { label: '✨ تحديث جديد', title: '✨ تحديث سكينة', body: 'ميزات جديدة رائعة متاحة الآن! اكتشفها الآن 🚀' },
                { label: '🎯 تحدي', title: '🎯 تحدي اليوم', body: 'اقرأ 10 آيات وافوز بـ 100 نقطة! هل أنت مستعد؟ 💪' },
              ].map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => { setPushTitle(t.title); setPushBody(t.body); }}
                  className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white/60 hover:bg-[#fbbf24]/10 hover:text-[#fbbf24] border border-white/5 transition"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className={LABEL}>عنوان الإشعار</label>
            <input
              value={pushTitle}
              onChange={e => setPushTitle(e.target.value)}
              className={INPUT_CLASS}
              placeholder="مثال: 📖 وقت القرآن"
              maxLength={60}
            />
            <p className="text-xs text-white/20 text-left">{pushTitle.length}/60</p>
          </div>

          <div className="space-y-2 text-right">
            <label className={LABEL}>نص الرسالة</label>
            <textarea
              value={pushBody}
              onChange={e => setPushBody(e.target.value)}
              rows={4}
              className={INPUT_CLASS}
              placeholder="اكتب رسالتك هنا..."
              maxLength={200}
            />
            <p className="text-xs text-white/20 text-left">{pushBody.length}/200</p>
          </div>

          <div className="space-y-2 text-right">
            <label className={LABEL}>الفئة المستهدفة</label>
            <div className="flex gap-3">
              {[
                { id: 'all', label: 'الكل', count: totalUsers },
                { id: 'subscribers', label: 'المشتركون فقط', count: pushSubscribers },
                { id: 'free', label: 'المجانيون', count: totalUsers - pushSubscribers },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPushTarget(t.id as any)}
                  className={`flex-1 rounded-xl p-4 text-center font-black text-sm transition border ${
                    pushTarget === t.id
                      ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]'
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <p>{t.label}</p>
                  <p className="text-[11px] mt-1 opacity-60">{t.count} مستخدم</p>
                </button>
              ))}
            </div>
          </div>

          {(pushTitle || pushBody) && (
            <div className="rounded-xl border border-violet-500/20 bg-white/[0.03] p-5 text-right">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">معاينة الإشعار</p>
              <div className="flex items-start gap-3">
                <img src="/logo/logo.png" className="w-10 h-10 rounded-xl" alt="" />
                <div>
                  <p className="font-black text-white text-sm">{pushTitle || 'العنوان'}</p>
                  <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{pushBody || 'الرسالة...'}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSendPushNotification}
            disabled={isSendingPush || !pushTitle || !pushBody}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-5 text-white font-black text-base transition hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-violet-500/20"
          >
            {isSendingPush ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>
            ) : (
              <><Bell className="w-5 h-5" /> إرسال الإشعار الآن</>
            )}
          </button>
        </div>
      </div>

      {pushHistory.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
          <h3 className="text-lg font-black mb-5">سجل الإشعارات المُرسلة</h3>
          <div className="space-y-3">
            {pushHistory.map(p => (
              <div
                key={p.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start justify-between gap-4"
              >
                <div className="text-left">
                  <span
                    className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      p.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {p.status === 'pending' ? 'في الانتظار' : 'مُرسل'}
                  </span>
                  <p className="text-[10px] text-white/30 mt-1">{p.target}</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-black text-sm">{p.title}</p>
                  <p className="text-white/40 text-[11px] mt-1">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
