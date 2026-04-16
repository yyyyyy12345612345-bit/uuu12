"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EditorState {
  view: "video" | "mushaf" | "prayers" | "library" | "daily";
  surahId: string;
  startAyah: number;
  endAyah: number;
  backgroundUrl: string;
  reciterId: string;
  textColor: string;
  fontSize: number;
  fontWeight: number;
  bookmark?: { surahId: string; ayahId: number };
  activeSettingsPrayer: string | null;
  isHydrated: boolean; // New flag to track initialization
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
  activeSettingsPrayer: null,
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    ...initialState,
    isHydrated: false,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("quran_editor_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setState(prev => ({ ...prev, ...parsed, isHydrated: true }));
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setState(prev => ({ ...prev, isHydrated: true }));
  }, []);

  // Save to localStorage whenever state changes, but only after loading initial state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("quran_editor_state", JSON.stringify(state));
    }
  }, [state, mounted]);

  const updateState = (updates: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <EditorContext.Provider value={{ state, updateState }}>
      {children}
    </EditorContext.Provider>
  );

}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
}
