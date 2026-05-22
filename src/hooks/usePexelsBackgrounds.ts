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

        const contentType = response.headers.get('content-type') || '';
        let data: any = null;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          if (!response.ok) {
            throw new Error(text || "فشل تحميل الخلفيات");
          }
          throw new Error("خدمة الخلفيات لم تُرجع JSON صالحًا.");
        }

        if (!response.ok) {
          throw new Error(data?.error || "فشل تحميل الخلفيات");
        }

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
