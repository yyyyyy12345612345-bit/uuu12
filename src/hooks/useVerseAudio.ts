"use client";

import { useMemo } from "react";
import { getAudioUrl } from "@/lib/quranUtils";

export function useVerseAudio(surahId: number, ayahId: number, reciterId: string) {
  return useMemo(() => {
    return getAudioUrl(surahId, ayahId, reciterId);
  }, [surahId, ayahId, reciterId]);
}
