"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportErrorToSystem } from "@/lib/errorTracker";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportErrorToSystem(error, {
      componentStack: errorInfo.componentStack || undefined,
      severity: "critical",
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-white font-arabic">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-5">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-white mb-2">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              تم تسجيل تفاصيل هذا الخطأ آلياً في مركز المراقبة لدى الإدارة وسنعمل على معالجته فوراً.
            </p>

            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-left font-mono text-[11px] text-rose-400 overflow-x-auto mb-6">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
