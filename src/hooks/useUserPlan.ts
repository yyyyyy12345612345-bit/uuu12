"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useUserPlan() {
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Use onSnapshot for real-time updates when admin approves
        const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserPlan({
              ...data,
              plan: data.plan || "free",
              count: data.videoRendersCount || 0
            });
          }
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUserPlan(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isFeatureLocked = (feature: "search" | "video_bg" | "unlimited_render") => {
    if (!userPlan) return true;
    const plan = userPlan.plan;

    if (feature === "search") return plan === "free";
    if (feature === "video_bg") return plan === "free";
    if (feature === "unlimited_render") return plan === "free" || plan === "starter";

    return false;
  };

  return { userPlan, loading, isFeatureLocked };
}
