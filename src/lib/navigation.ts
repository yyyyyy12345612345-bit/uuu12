import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Maps a URL path segment to the corresponding component view ID
 */
export function getViewFromPathname(path: string): string {
  if (!path || path === "/") return "mushaf-choice";
  const segment = path.split('/').filter(Boolean)[0];
  const mapping: Record<string, string> = {
    'audio': 'library',
    'mushaf-full': 'mushaf-full',
    'mushaf-tafseer': 'mushaf-tafseer',
    'digital': 'mushaf-full',
    'daily': 'daily',
    'video': 'video',
    'rank': 'rank',
    'leaderboard': 'rank',
    'security': 'mushaf-choice',
    'admin': 'admin',
    'chat': 'mushaf-choice',
    'prayers': 'prayers',
    'profile': 'mushaf-choice'
  };
  return mapping[segment] || segment || "mushaf-choice";
}

/**
 * Triggers an instant client-side route transition bypassing Next.js routing latency.
 * Updates history state and fires a custom event for subscribers.
 */
export function navigateInstantly(path: string) {
  if (typeof window !== "undefined") {
    // 1. Synchronously update the browser address bar
    window.history.pushState(null, '', path);
    // 2. Dispatch event to instantly update active view in all listening components
    const event = new CustomEvent("instant-navigation", { detail: { path } });
    window.dispatchEvent(event);
  }
}

/**
 * Hook to get the current URL pathname instantly, responding to:
 * - standard page load / Next.js routing (usePathname)
 * - custom instant navigation events (instant-navigation)
 * - browser back/forward buttons (popstate)
 */
export function useInstantPathname(): string {
  const nextPathname = usePathname();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return nextPathname || "/";
  });

  useEffect(() => {
    if (nextPathname) {
      setCurrentPath(nextPathname);
    }
  }, [nextPathname]);

  useEffect(() => {
    const handleInstantNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      setCurrentPath(customEvent.detail.path);
    };

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("instant-navigation", handleInstantNav);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("instant-navigation", handleInstantNav);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return currentPath;
}
