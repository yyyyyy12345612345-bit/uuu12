"use client";

import nextDynamic from "next/dynamic";

const AdminPanel = nextDynamic(() => import("@/components/AdminPanel").then(mod => mod.AdminPanel), { ssr: false });

export default function AdminPage() {
  return <AdminPanel />;
}
