"use client";

import { useEffect, useState } from "react";

export type PexelsMediaItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
};

export function usePexelsBackgrounds(query: string) {
  const [media, setMedia] = useState<PexelsMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=12&type=both`);
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || "فشل تحميل الخلفيات");
        }

        const data = await response.json();
        if (!isMounted) return;
        setMedia(data.items ?? []);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "حدث خطأ");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { media, loading, error };
}
