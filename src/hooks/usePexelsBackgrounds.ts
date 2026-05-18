"use client";

import { useEffect, useState } from "react";

export type PexelsMediaItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
};

export function usePexelsBackgrounds(query: string, type: "images" | "videos" | "both" = "both") {
  const [media, setMedia] = useState<PexelsMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/pexels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            per_page: 40,
            type: type
          })
        });
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
  }, [query, type]);

  return { media, loading, error };
}
