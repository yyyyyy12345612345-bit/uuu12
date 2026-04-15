"use client";

import { useState, useEffect } from "react";

interface Verse {
  id: number;
  text: string;
  translation: string;
}

interface SurahData {
  id: number;
  name: string;
  transliteration: string;
  verses: Verse[];
}

export function useSurahData(surahId: string) {
  const [data, setData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surahId) return;

    async function fetchSurah() {
      // 1. Try Cache First
      const cacheKey = `surah_cache_${surahId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch (e) {
          console.error("Cache parse failed", e);
        }
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/${surahId}.json`);
        if (!response.ok) {
            if (cached) return; // Keep cached if fetch fails
            throw new Error("Failed to fetch surah data");
        }
        const result = await response.json();
        setData(result);
        // 2. Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (err) {
        if (!cached) setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }


    fetchSurah();
  }, [surahId]);

  return { data, loading, error };
}
