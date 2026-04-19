"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

interface EditorState {
  view: "video" | "mushaf" | "prayers" | "library" | "daily" | "shamrely";
  surahId: string;
  startAyah: number;
  endAyah: number;
  backgroundUrl: string;
  reciterId: string;
  textColor: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  filter: string;
  textPosition: "top" | "center" | "bottom";
  bookmark?: { surahId: string; ayahId: number };
  activeSettingsPrayer: string | null;
  isHydrated: boolean;
}

interface EditorContextType {
  state: EditorState;
  updateState: (updates: Partial<EditorState>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialState: Omit<EditorState, 'isHydrated'> = {
  view: "mushaf",
  surahId: "1",
  startAyah: 1,
  endAyah: 7,
  backgroundUrl: "https://images.pexels.com/photos/1537086/pexels-photo-1537086.jpeg",
  reciterId: "afasy",
  textColor: "#ffffff",
  fontSize: 50,
  fontWeight: 700,
  fontFamily: "Amiri",
  filter: "none",
  textPosition: "center",
  activeSettingsPrayer: null,
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    ...initialState,
    isHydrated: false,
  });

  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("quran_editor_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const { view, ...rest } = parsed;
          setState(prev => ({ ...prev, ...rest, isHydrated: true }));
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setState(prev => ({ ...prev, isHydrated: true }));
  }, []);

  // Optimized background saving with debounce
  useEffect(() => {
    if (!mounted || !state.isHydrated) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem("quran_editor_state", JSON.stringify(state));
    }, 1000); // Wait 1s after last change before saving

    return () => clearTimeout(timeoutId);
  }, [state, mounted]);

  const updateState = useCallback((updates: Partial<EditorState>) => {
    setState((prev) => {
        // Only update if values actually changed to prevent re-renders
        const changed = Object.entries(updates).some(([key, value]) => prev[key as keyof EditorState] !== value);
        if (!changed) return prev;
        return { ...prev, ...updates };
    });
  }, []);

  const contextValue = useMemo(() => ({ state, updateState }), [state, updateState]);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
}
