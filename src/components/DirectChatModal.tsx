"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle, User } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, 
  serverTimestamp, onSnapshot, query, orderBy, limit, increment
} from "firebase/firestore";

interface DirectChatModalProps {
  partnerId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export function DirectChatModal({ partnerId, onClose }: DirectChatModalProps) {
  const [partner, setPartner] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const myUid = auth?.currentUser?.uid;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to generate friendship/chat ID
  const getChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const chatId = myUid && partnerId ? getChatId(myUid, partnerId) : "";

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load partner user data
  useEffect(() => {
    if (!partnerId || !db) return;
    setLoadingPartner(true);
    const unsub = onSnapshot(doc(db, "users", partnerId), (snap) => {
      if (snap.exists()) {
        setPartner(snap.data());
      }
      setLoadingPartner(false);
    });
    return () => unsub();
  }, [partnerId]);

  // Load messages in real time & clear unread count for current user
  useEffect(() => {
    if (!chatId || !myUid || !db) return;

    setLoadingMessages(true);

    // Query messages
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setLoadingMessages(false);
      
      // Clear unread count for me
      const chatRef = doc(db, "chats", chatId);
      getDoc(chatRef).then(chatSnap => {
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          if (data.unreadCount?.[myUid] > 0) {
            updateDoc(chatRef, {
              [`unreadCount.${myUid}`]: 0
            });
          }
        }
      });
    });

    return () => unsub();
  }, [chatId, myUid]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !myUid || !chatId || !db || sending) return;

    const messageText = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      // 1. Add message doc
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: myUid,
        text: messageText,
        createdAt: serverTimestamp()
      });

      // 2. Update chat parent doc
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      const updateData: any = {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${partnerId}`]: increment(1)
      };

      if (!chatSnap.exists()) {
        // Fallback create
        await setDoc(chatRef, {
          participants: [myUid, partnerId],
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
          unreadCount: {
            [myUid]: 0,
            [partnerId]: 1
          }
        });
      } else {
        await updateDoc(chatRef, updateData);
      }
      
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (date: any) => {
    if (!date) return "";
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-[3100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 font-['Tajawal'] select-none">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[80vh] bg-[#0c0d10] border border-white/10 rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />
        
        {/* Chat Header */}
        <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-2xl shrink-0 relative z-10">
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 text-right">
            <div>
              <h3 className="text-sm font-black text-white">{loadingPartner ? "جاري التحميل..." : partner?.displayName}</h3>
              <p className="text-[10px] text-primary/60 font-bold">{loadingPartner ? "" : `@${partner?.username}`}</p>
            </div>
            {partner?.photoURL ? (
              <img src={partner.photoURL} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <User className="w-5 h-5 text-white/40" />
              </div>
            )}
          </div>
        </header>

        {/* Messages Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 bg-transparent relative z-10">
          {loadingMessages ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-white/30 font-bold">تحميل المحادثة...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center gap-4 text-white/20">
              <MessageCircle className="w-12 h-12" />
              <div>
                <p className="text-sm font-black">لا توجد رسائل بينكما بعد</p>
                <p className="text-[11px] font-bold mt-1">ابدأوا الآن بالسلام والكلمة الطيبة 🌟</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === myUid;
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-[1.8rem] px-5 py-3 shadow-lg relative group ${
                    isMe 
                      ? "bg-primary text-black rounded-tl-sm text-right" 
                      : "bg-white/5 border border-white/5 text-white rounded-tr-sm text-right"
                  }`}>
                    <p className="text-sm leading-relaxed font-bold break-words whitespace-pre-wrap">{msg.text}</p>
                    <span className={`block text-[8px] mt-1 font-mono ${isMe ? "text-black/55" : "text-white/35"}`}>
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Footer */}
        <footer className="p-4 border-t border-white/10 bg-black/20 shrink-0 relative z-10">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-primary/50 text-white font-bold text-right"
              maxLength={400}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-12 h-12 bg-primary text-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/15"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
