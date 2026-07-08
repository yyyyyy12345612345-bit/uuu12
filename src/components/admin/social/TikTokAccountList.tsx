import React from "react";

interface TikTokAccount {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  linkedAt?: any;
}

interface TikTokAccountListProps {
  accounts: TikTokAccount[];
  onUnlink: (id: string) => void;
}

export const TikTokAccountList: React.FC<TikTokAccountListProps> = ({ accounts, onUnlink }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accounts.length === 0 ? (
        <div className="col-span-full rounded-2xl border border-white/5 bg-white/[0.01] p-12 text-center text-white/30 text-sm font-bold">
          لا توجد حسابات TikTok مربوطة حالياً. اضغط على الزر أعلاه للربط.
        </div>
      ) : (
        accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:border-white/20 transition duration-300 relative overflow-hidden group"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                {acc.avatar ? (
                  <img src={acc.avatar} alt={acc.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                )}
              </div>
              <div className="text-right flex-1 space-y-1">
                <h3 className="text-base font-bold text-white leading-tight">{acc.displayName}</h3>
                <p className="text-xs text-white/40 font-mono">@{acc.username}</p>
                <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-black tracking-wider">
                  ✔ CONNECTED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 mt-6 pt-4">
              <div className="text-right">
                <span className="text-[10px] text-white/30 block uppercase tracking-wider">الحالة</span>
                <span className="text-xs font-bold text-white/80">نشط</span>
              </div>
              <button
                onClick={() => onUnlink(acc.id)}
                className="px-4 py-2 bg-red-500/10 border border-transparent hover:border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-black transition duration-300 cursor-pointer"
              >
                إلغاء الربط
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
