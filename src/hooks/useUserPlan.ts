"use client";

import { useState, useEffect } from "react";
import { db, auth, initFirebase } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useUserPlan() {
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeDoc: (() => void) | null = null;

    const setup = async () => {
      await initFirebase();
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Use onSnapshot for real-time updates when admin approves
          unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              const totalPoints = data.totalPoints || 0;
              // Automatically upgrade users with 10k+ points to premium for free!
              const computedPlan = totalPoints >= 10000 ? "premium" : (data.plan || "free");
              
              setUserPlan({
                ...data,
                plan: computedPlan,
                originalPlan: data.plan || "free",
                count: data.videoRendersCount || 0
              });
            }
            setLoading(false);
          });
        } else {
          setUserPlan(null);
          setLoading(false);
        }
      });
    };
    setup();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const isFeatureLocked = (feature: "search" | "video_bg" | "unlimited_render") => {
    if (!userPlan) return true;
    
    // Bypass all locks for users with 10k+ points!
    const totalPoints = userPlan.totalPoints || 0;
    if (totalPoints >= 10000) return false;

    const plan = userPlan.plan;

    if (feature === "search") return plan === "free";
    if (feature === "video_bg") return plan === "free";
    if (feature === "unlimited_render") return plan === "free" || plan === "starter";

    return false;
  };

  return { userPlan, loading, isFeatureLocked };
}
