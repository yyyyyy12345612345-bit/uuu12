"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

/**
 * أنواع views المتاحة في التطبيق
 */
export type ViewType = 
  | "video" 
  | "mushaf" 
  | "prayers" 
  | "library" 
  | "daily" 
  | "shamrely"
  | "mushaf-full"
  | "mushaf-tafseer"
  | "mushaf-choice"
  | "rank"
  | "showcase"
  | "admin";

/**
 * أنواع الرسوم المتحركة للنص (16 نوع)
 */
export type AnimationType =
  | "fade"
  | "slide"
  | "zoom"
  | "fly"
  | "bounce"
  | "glitch"
  | "scale"
  | "blur"
  | "flip"
  | "wave"
  | "typewriter"
  | "elastic"
  | "swing"
  | "spiral"
  | "cinematic"
  | "split"
  | "rotate";

/**
 * أنواع الجسيمات البصرية
 */
export type ParticlesType = "none" | "snow" | "leaves" | "petals";

/**
 * أنواع الموجة الصوتية
 */
export type VisualizerStyle = "bars" | "wave" | "dots";

/**
 * أنواع زخرفة الآية
 */
export type AyahDecoration = "none" | "bracket1" | "bracket2" | "star" | "diamond" | "ornament";

/**
 * مواقع النص في الفيديو
 */
export type TextPosition = "top" | "center" | "bottom";

/**
 * واجهة حالة المحرر
 */
export interface EditorState {
  /** view الحالي النشط */
  view: ViewType;
  /** رقم السورة المحددة */
  surahId: string;
  /** رقم الآية البداية */
  startAyah: number;
  /** رقم الآية النهاية */
  endAyah: number;
  /** رابط الخلفية */
  backgroundUrl: string;
  /** معرف القارئ */
  reciterId: string;
  /** لون النص */
  textColor: string;
  /** حجم الخط */
  fontSize: number;
  /** سماكة الخط */
  fontWeight: number;
  /** نوع الخط */
  fontFamily: string;
  /** الفلتر المطبق */
  filter: string;
  /** الطبقة العلوية */
  overlay: string;
  /** نوع الأنيميشن */
  animation: AnimationType;
  /** موقع النص */
  textPosition: TextPosition;
  /** الإزاحة العمودية للنص */
  textVerticalOffset: number;
  /** إظهار الموجة الصوتية */
  showVisualizer: boolean;
  /** لون الموجة الصوتية */
  visualizerColor: string;
  /** نمط الموجة الصوتية */
  visualizerStyle: VisualizerStyle;
  /** حساب TikTok */
  tiktokHandle: string;
  /** حساب Instagram */
  instaHandle: string;
  /** نوع الجسيمات */
  particles: ParticlesType;
  /** حجم خط المصحف */
  mushafFontSize: number;
  /** زخرفة الآية */
  ayahDecoration: AyahDecoration;
  /** الإشارة المرجعية الحالية */
  bookmark?: { surahId: string; ayahId: number };
  /** الصلاة النشطة في الإعدادات */
  activeSettingsPrayer: string | null;
  /** هل تم تحميل الحالة من التخزين المحلي */
  isHydrated: boolean;
}

/**
 * واجهة سياق المحرر
 */
export interface EditorContextType {
  /** الحالة الحالية */
  state: EditorState;
  /** دالة تحديث الحالة */
  updateState: (updates: Partial<EditorState>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * الحالة الأولية للمحرر
 */
const initialState: Omit<EditorState, 'isHydrated'> = {
  view: "mushaf",
  surahId: "1",
  startAyah: 1,
  endAyah: 7,
  backgroundUrl: "/mushaf-bg.jpg.png",
  reciterId: "afasy",
  textColor: "#ffffff",
  fontSize: 50,
  fontWeight: 700,
  fontFamily: "Amiri",
  filter: "none",
  overlay: "none",
  animation: "fade",
  textPosition: "center",
  textVerticalOffset: 0,
  showVisualizer: true,
  visualizerColor: "#D4AF37",
  visualizerStyle: "bars",
  tiktokHandle: "",
  instaHandle: "",
  particles: "none",
  mushafFontSize: 22,
  ayahDecoration: "bracket1",
  activeSettingsPrayer: null,
};

/**
 * مزود سياق المحرر - يدير حالة التطبيق العالمية
 * @param children - المكونات الأبناء
 */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    ...initialState,
    isHydrated: false,
  });

  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("quran_editor_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const { view, ...rest } = parsed;
          setState(prev => ({ ...prev, ...rest, isHydrated: true }));
          return;
        }
      }
    } catch (error) {
      console.error("[EditorProvider] Failed to parse saved state:", error);
    }
    setState(prev => ({ ...prev, isHydrated: true }));
  }, []);

  // Optimized background saving with debounce
  useEffect(() => {
    if (!mounted || !state.isHydrated) return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("quran_editor_state", JSON.stringify(state));
      } catch (error) {
        console.error("[EditorProvider] Failed to save state:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, mounted]);

  /**
   * تحديث حالة المحرر
   * @param updates - التحديثات الجزئية للحالة
   */
  const updateState = useCallback((updates: Partial<EditorState>): void => {
    setState((prev) => {
      const changed = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof EditorState] !== value
      );
      if (!changed) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const contextValue = useMemo(
    () => ({ state, updateState }), 
    [state, updateState]
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook للوصول إلى سياق المحرر
 * @returns سياق المحرر مع الحالة ودالة التحديث
 * @throws Error إذا تم استخدامه خارج EditorProvider
 */
export function useEditor(): EditorContextType {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
}