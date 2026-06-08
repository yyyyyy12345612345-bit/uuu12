"use client";
import { useState, useEffect, useCallback } from "react";

export function ErrorDebug() {
  const [errors, setErrors] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const orig = console.error;
    console.error = (...args: any[]) => {
      setErrors(prev => [args.map(a => typeof a === "object" ? JSON.stringify(a).slice(0, 200) : String(a)).join(" "), ...prev].slice(0, 20));
      orig.apply(console, args);
    };
    window.addEventListener("error", (e) => {
      setErrors(prev => [`[Error] ${e.message}`, ...prev].slice(0, 20));
    });
    window.addEventListener("unhandledrejection", (e) => {
      setErrors(prev => [`[Unhandled] ${e.reason?.message || e.reason}`, ...prev].slice(0, 20));
    });
  }, []);

  if (!show) return <button onClick={() => setShow(true)} className="fixed bottom-2 left-2 z-[9999] bg-red-600/70 text-white text-xs px-2 py-0.5 rounded">!</button>;
  return <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/90 text-white text-xs p-2 max-h-40 overflow-y-auto font-mono" dir="ltr">
    <button onClick={() => setShow(false)} className="float-right bg-red-600 px-1 rounded">x</button>
    <div className="font-bold mb-1">Errors ({errors.length})</div>
    {errors.length === 0 && <div className="opacity-50">No errors</div>}
    {errors.map((e, i) => <div key={i} className="border-b border-white/10 py-0.5 break-all">{e}</div>)}
  </div>;
}
