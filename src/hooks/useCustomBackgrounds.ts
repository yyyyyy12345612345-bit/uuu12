"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, initFirebase } from "@/lib/firebase";
import { STATIC_BACKGROUNDS, STATIC_VIDEOS, BackgroundItem } from "@/data/backgrounds";

export function useCustomBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>(STATIC_BACKGROUNDS);
  const [videos, setVideos] = useState<BackgroundItem[]>(STATIC_VIDEOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchBgs() {
      try {
        await initFirebase();
        if (!db) {
          console.warn("[useCustomBackgrounds] Firestore db not initialized yet.");
          return;
        }

        const q = query(collection(db, "backgrounds"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        const fetchedItems: BackgroundItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedItems.push({
            type: data.type || "video",
            src: data.src,
            poster: data.poster || "",
            tags: data.tags || [],
            fit: data.fit || "cover",
          });
        });

        if (active) {
          const customBgs = fetchedItems.filter(item => item.type === "image");
          const customVideos = fetchedItems.filter(item => item.type === "video");

          setBackgrounds([...customBgs, ...STATIC_BACKGROUNDS]);
          setVideos([...customVideos, ...STATIC_VIDEOS]);
        }
      } catch (e) {
        console.error("[useCustomBackgrounds] Failed to fetch custom backgrounds:", e);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBgs();

    return () => {
      active = false;
    };
  }, []);

  return { backgrounds, videos, loading };
}
