import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export const revalidate = 60; // كاش لمدة دقيقة على سيرفرات الحافة

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "total";
    const limitCount = Math.min(parseInt(searchParams.get("limit") || "100", 10), 100);

    let orderByField = "totalPoints";
    if (tab === "quran") orderByField = "quranPoints";
    else if (tab === "athkar") orderByField = "athkarPoints";
    else if (tab === "listen") orderByField = "listenPoints";
    else if (tab === "istighfar") orderByField = "istighfarPoints";
    else if (tab === "salawat") orderByField = "salawatPoints";

    getAdminApp();
    const db = admin.firestore();
    const snapshot = await db.collection("users")
      .orderBy(orderByField, "desc")
      .limit(limitCount)
      .get();

    // 🔒 فلترة صارمة: إرجاع البيانات العامة فقط وحجب الإيميلات وأرقام الهواتف وكلمات المرور نهائياً
    const sanitizedUsers = snapshot.docs
      .map(doc => {
        const d = doc.data();
        if (d.isBanned) return null;
        return {
          id: doc.id,
          username: d.username || "",
          displayName: d.displayName || d.username || "قارئ",
          photoURL: d.photoURL || "",
          country: d.country || "",
          gender: d.gender || "",
          totalPoints: Number(d.totalPoints) || 0,
          quranPoints: Number(d.quranPoints) || 0,
          athkarPoints: Number(d.athkarPoints) || 0,
          listenPoints: Number(d.listenPoints) || 0,
          istighfarPoints: Number(d.istighfarPoints) || 0,
          salawatPoints: Number(d.salawatPoints) || 0,
          rank: d.rank || "",
        };
      })
      .filter(Boolean);

    return NextResponse.json({ users: sanitizedUsers }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("[Leaderboard API] Error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
