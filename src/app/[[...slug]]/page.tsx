import React from "react";
import { CatchAllPageClient } from "@/components/CatchAllPageClient";

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['mushaf'] },
    { slug: ['mushaf-full'] },
    { slug: ['daily'] },
    { slug: ['library'] },
    { slug: ['prayers'] },
    { slug: ['video'] },
    { slug: ['rank'] },
    { slug: ['admin'] },
  ];
}

export default function CatchAllPage() {
  return <CatchAllPageClient />;
}
