import type { Metadata } from "next";
import React from "react";
import { CatchAllPageClient } from "@/components/CatchAllPageClient";

export const metadata: Metadata = {
  title: "يقين قرآن | المصحف الإلكتروني والأذكار ونظام النقاط",
  description: "تطبيق وموقع يقين يقدم المصحف الإلكتروني كاملاً بقراءة واضحة، أذكار الصباح والمساء، عداد تسبيح ذكي ضد النقر السريع، مع نظام نقاط تحفيزي ولوحة شرف تنافسية.",
  alternates: {
    canonical: "https://yaqeenalquran.online",
  }
};

export async function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['mushaf'] },
    { slug: ['mushaf-full'] },
    { slug: ['mushaf-tafseer'] },
    { slug: ['daily'] },
    { slug: ['library'] },
    { slug: ['prayers'] },
    { slug: ['video'] },
    { slug: ['rank'] },
    { slug: ['profile'] },
    { slug: ['feed'] },
    { slug: ['chat'] },
    { slug: ['chatbot'] },
    { slug: ['mushaf-choice'] },
  ];
}

export default function CatchAllPage() {
  return <CatchAllPageClient />;
}
