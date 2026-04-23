"use client";

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Video,
  Audio,
  Sequence,
  Easing,
  staticFile
} from "remotion";

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const videoExtensions = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i;
  return videoExtensions.test(url) || url.includes("pexels.com/video") || url.includes("vimeo.com/external") || url.includes("videos.pexels.com");
};

function resolveMedia(src?: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//") || src.startsWith("file://")) {
    return src;
  }
  return staticFile(src);
}

// ── فلاتر الخلفية ──
const FILTER_MAP: Record<string, string> = {
  none: "none",
  vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
  cool: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
  warm: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
  bw: "grayscale(1) contrast(1.2)",
  dramatic: "contrast(1.4) brightness(0.7) saturate(1.2)",
  blur: "blur(20px) brightness(0.8)",
  invert: "invert(1) hue-rotate(180deg)",
  midnight: "brightness(0.4) contrast(1.5) saturate(0.5) hue-rotate(220deg)",
  oceanic: "hue-rotate(180deg) brightness(1.1) saturate(1.8) contrast(1.1)",
  sepia: "sepia(1) contrast(0.9) brightness(1.1)",
  saturated: "saturate(2.5) contrast(1.1)",
};

// ── الخطوط ──
const FONT_IMPORTS: Record<string, string> = {
  "Amiri": "Amiri:wght@400;700",
  "Noto Naskh Arabic": "Noto+Naskh+Arabic:wght@400;500;600;700",
  "Scheherazade New": "Scheherazade+New:wght@400;500;600;700",
  "Lateef": "Lateef:wght@200;300;400;500;600;700;800",
  "Cairo": "Cairo:wght@200;300;400;500;600;700;800;900",
  "Tajawal": "Tajawal:wght@200;300;400;500;700;800;900",
};

interface Verse {
  id: number;
  text: string;
  translation: string;
  audio: string;
  durationInFrames?: number;
  startFrame?: number;
}

interface MainVideoProps {
  surahName: string;
  verses: Verse[];
  backgroundUrl: string;
  textColor: string;
  fontSize: number;
  fontWeight?: string | number;
  fontFamily?: string;
  filter?: string;
  overlay?: "none" | "dust" | "rays" | "bokeh";
  animation?: "fade" | "scale" | "slide" | "blur" | "zoom" | "flip" | "bounce" | "glitch";
  textPosition?: "top" | "center" | "bottom";
  textVerticalOffset?: number;
}

export const MainVideo: React.FC<MainVideoProps> = ({
  surahName,
  verses = [],
  backgroundUrl,
  textColor = "#ffffff",
  fontSize = 60,
  fontWeight = 700,
  fontFamily = "Amiri",
  filter = "none",
  overlay = "none",
  animation = "fade",
  textPosition = "center",
  textVerticalOffset = 0,
}) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const resolvedBg = resolveMedia(backgroundUrl);
  const cssFilter = FILTER_MAP[filter] || "none";
  const fontImport = FONT_IMPORTS[fontFamily] || FONT_IMPORTS["Amiri"];

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundUrl ? 'black' : 'transparent' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontImport}&display=swap');
        
        @keyframes dustMove {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-1000px) translateX(100px) scale(0.5); opacity: 0; }
        }

        @keyframes rayMove {
          0% { transform: rotate(-20deg) translateX(-10%); opacity: 0.2; }
          50% { transform: rotate(-15deg) translateX(0%); opacity: 0.4; }
          100% { transform: rotate(-20deg) translateX(-10%); opacity: 0.2; }
        }

        @keyframes bokehMove {
           0% { transform: translate(0, 0); opacity: 0.3; }
           50% { transform: translate(50px, -50px); opacity: 0.6; }
           100% { transform: translate(-50px, 50px); opacity: 0.3; }
        }
      `}</style>

      <AbsoluteFill style={{ backgroundColor: backgroundUrl ? 'black' : 'transparent' }} />

      {/* ── الخلفية الفلترة ── */}
      {resolvedBg && (
        <AbsoluteFill style={{ filter: cssFilter }}>
          {isVideoUrl(backgroundUrl) ? (
            <Video
              src={resolvedBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
              muted loop crossOrigin="anonymous"
            />
          ) : (
            <AbsoluteFill style={{
              backgroundImage: `url(${resolvedBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.7,
            }} />
          )}
        </AbsoluteFill>
      )}

      {/* ── تأثير Overlays ── */}
      {overlay === "dust" && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              bottom: '-20px',
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: 'white',
              borderRadius: '50%',
              filter: 'blur(1px)',
              animation: `dustMove ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "rays" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '200%',
            height: '200%',
            background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(255,255,255,0.05) 10%, transparent 15%)',
            filter: 'blur(40px)',
            animation: 'rayMove 15s ease-in-out infinite',
          }} />
        </AbsoluteFill>
      )}

      {overlay === "bokeh" && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)`,
              borderRadius: '50%',
              animation: `bokehMove ${Math.random() * 20 + 20}s ease-in-out infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent, rgba(0,0,0,0.6))' }} />

      <AbsoluteFill>
        {verses.map((verse, index) => {
          const startFrame = verse.startFrame ?? Math.floor(index * (durationInFrames / verses.length));
          const actualDuration = verse.durationInFrames ?? Math.floor(durationInFrames / verses.length);
          const resolvedAudio = resolveMedia(verse.audio);

          return (
            <Sequence key={`${verse.id}-${index}`} from={startFrame} durationInFrames={actualDuration}>
              {resolvedAudio && <Audio src={resolvedAudio} />}
              <VerseComponent
                verse={verse}
                surahName={surahName}
                textColor={textColor}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                animation={animation}
                textPosition={textPosition}
                textVerticalOffset={textVerticalOffset}
                totalVerseFrames={actualDuration}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const VerseComponent = ({ verse, surahName, textColor, fontSize, fontWeight, fontFamily, animation, textPosition, textVerticalOffset, totalVerseFrames }: {
  verse: Verse, surahName: string, textColor: string, fontSize: number, fontWeight: any,
  fontFamily: string, animation: string, textPosition: string, textVerticalOffset: number, totalVerseFrames: number
}) => {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(15, Math.floor(totalVerseFrames * 0.1));

  // ── انميشن الدخول ──
  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalVerseFrames - fadeFrames, totalVerseFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Zoom/Scale effect (base)
  const baseScale = interpolate(frame, [0, totalVerseFrames], [1, 1.05], { easing: Easing.out(Easing.quad) });

  // Specialized animations
  let animationStyles: React.CSSProperties = {};

  if (animation === "scale") {
    const entranceScale = interpolate(frame, [0, fadeFrames], [0.8, 1], { extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale * entranceScale}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "slide") {
    const translateY = interpolate(frame, [0, fadeFrames], [100, 0], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5))
    });
    animationStyles.transform = `scale(${baseScale}) translateY(${translateY + textVerticalOffset}px)`;
  } else if (animation === "blur") {
    const blur = interpolate(frame, [0, fadeFrames], [40, 0], { extrapolateRight: 'clamp' });
    animationStyles.filter = `blur(${blur}px)`;
    animationStyles.transform = `scale(${baseScale}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "zoom") {
    const zoom = interpolate(frame, [0, fadeFrames], [2, 1], {
      easing: Easing.out(Easing.exp),
      extrapolateRight: 'clamp'
    });
    animationStyles.transform = `scale(${baseScale * zoom}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "flip") {
    const rotateX = interpolate(frame, [0, fadeFrames], [90, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateRight: 'clamp'
    });
    animationStyles.transform = `perspective(1000px) scale(${baseScale}) rotateX(${rotateX}deg) translateY(${textVerticalOffset}px)`;
  } else if (animation === "bounce") {
    const bounce = interpolate(frame, [0, fadeFrames], [300, 0], {
      easing: Easing.out(Easing.bounce),
      extrapolateRight: 'clamp'
    });
    animationStyles.transform = `scale(${baseScale}) translateY(${bounce + textVerticalOffset}px)`;
  } else if (animation === "glitch") {
    const jitterX = Math.random() * 10 - 5;
    const jitterY = Math.random() * 10 - 5;
    const glitchOpacity = Math.random() > 0.9 ? 0.3 : 1;

    if (frame < fadeFrames) {
      animationStyles.transform = `scale(${baseScale}) translate(${jitterX}px, ${jitterY + textVerticalOffset}px)`;
      animationStyles.opacity = glitchOpacity;
    } else {
      animationStyles.transform = `scale(${baseScale}) translateY(${textVerticalOffset}px)`;
    }
  } else {
    animationStyles.transform = `scale(${baseScale}) translateY(${textVerticalOffset}px)`;
  }

  const justifyMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end" };
  const paddingMap: Record<string, string> = {
    top: "60px 40px 100px 40px",
    center: "40px",
    bottom: "100px 40px 60px 40px"
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: justifyMap[textPosition] || 'center',
      gap: '30px',
      opacity,
      ...animationStyles,
      padding: paddingMap[textPosition] || '40px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        color: '#D4AF37', fontSize: '32px', fontWeight: 800,
        textShadow: '0 0 20px rgba(212,175,55,0.4)',
        fontFamily: `"${fontFamily}", serif`
      }}>
        {surahName}
      </div>

      <p style={{
        color: textColor, fontSize: `${fontSize * 1.8}px`, fontFamily: `"${fontFamily}", serif`,
        direction: 'rtl', textAlign: 'center', width: '100%', lineHeight: 1.6,
        textShadow: '0 20px 50px rgba(0,0,0,1)', margin: 0,
        fontWeight: fontWeight || 700
      }}>
        {verse.text}
      </p>

      <div style={{
        width: '200px', height: '4px',
        background: 'linear-gradient(to right, transparent, #D4AF37, #D4AF37, transparent)',
        opacity: 0.6, boxShadow: '0 0 20px rgba(212,175,55,0.3)'
      }} />

      <p style={{
        color: 'rgba(255,255,255,0.9)', fontSize: '42px', fontWeight: 500,
        textAlign: 'center', width: '100%', lineHeight: 1.4,
        textShadow: '0 10px 30px rgba(0,0,0,0.8)', fontStyle: 'italic',
        fontFamily: `"${fontFamily}", serif`
      }}>
        {verse.translation}
      </p>
    </div>
  );
}
