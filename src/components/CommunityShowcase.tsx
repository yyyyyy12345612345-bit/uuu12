"use client";

import React, { useState, useEffect } from "react";
import { Star, ArrowUpRight, Play, Users, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export function CommunityShowcase() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowcase = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, "showcase"), orderBy("createdAt", "desc"), limit(12));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
       {/* Background Aesthetics */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
       </div>

       <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
             <div className="text-right flex-1">
                <div className="flex items-center justify-end gap-3 mb-4">
                   <span className="bg-primary/20 text-primary text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 uppercase tracking-[0.3em]">Community Spirit</span>
                   <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">معرض المبدعين</h2>
                <p className="text-foreground/40 font-bold text-lg max-w-2xl ml-auto">استلهم من فيديوهات المجتمع وشاركنا إبداعك في نشر كتاب الله.</p>
             </div>
             <div className="flex flex-col items-center gap-2 bg-card border border-border p-6 rounded-[2.5rem] shadow-xl">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-2xl font-black">{items.length}+</span>
                <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">فيديو منشور</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {items.map((item, i) => (
                <div 
                  key={item.id} 
                  className="group relative bg-card border border-border rounded-[3rem] overflow-hidden hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                   <div className="aspect-[9/16] relative bg-zinc-900 overflow-hidden">
                      {/* Thumbnail Placeholder / Video Link */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform duration-500">
                            <Play className="w-8 h-8 text-primary fill-primary" />
                         </div>
                      </div>
                      
                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-right">
                         <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{item.surahName}</p>
                         <h3 className="text-2xl font-black text-white mb-4 line-clamp-1">{item.surahName}</h3>
                         <div className="flex items-center justify-between">
                            <a 
                              href={item.videoUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
                            >
                               مشاهدة الفيديو <ArrowUpRight className="w-4 h-4" />
                            </a>
                            <span className="text-white/40 text-[10px] font-bold">بواسطة: {item.userName}</span>
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </section>
  );
}
