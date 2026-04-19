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

// ── خريطة الفلاتر ──
const FILTER_MAP: Record<string, string> = {
  none: "none",
  vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
  cool: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
  warm: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
  bw: "grayscale(1) contrast(1.2)",
  dramatic: "contrast(1.4) brightness(0.7) saturate(1.2)",
};

// ── خريطة الخطوط (Google Fonts) ──
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
  audioUrl?: string;
  textColor: string;
  fontSize: number;
  fontWeight?: string | number;
  fontFamily?: string;
  filter?: string;
  textPosition?: "top" | "center" | "bottom";
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
  textPosition = "center",
}) => {
  const { durationInFrames } = useVideoConfig();
  const resolvedBg = resolveMedia(backgroundUrl);
  const cssFilter = FILTER_MAP[filter] || "none";
  const fontImport = FONT_IMPORTS[fontFamily] || FONT_IMPORTS["Amiri"];

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontImport}&display=swap');
      `}</style>
      <AbsoluteFill style={{ backgroundColor: 'black' }} />
      
      {/* خلفية + فلتر */}
      {resolvedBg && (
        <AbsoluteFill style={{ filter: cssFilter }}>
          {isVideoUrl(backgroundUrl) ? (
            <Video 
              src={resolvedBg}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                opacity: 0.5
              }}
              muted
              loop
              crossOrigin="anonymous"
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
      
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent, rgba(0,0,0,0.6))'
      }} />

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
                textPosition={textPosition}
                totalVerseFrames={actualDuration}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const VerseComponent = ({ verse, surahName, textColor, fontSize, fontWeight, fontFamily, textPosition, totalVerseFrames }: { 
  verse: Verse, surahName: string, textColor: string, fontSize: number, fontWeight: any, 
  fontFamily: string, textPosition: string, totalVerseFrames: number 
}) => {
    const frame = useCurrentFrame();
    
    const fadeFrames = Math.min(15, Math.floor(totalVerseFrames * 0.1));
    
    const opacity = interpolate(
        frame, 
        [0, fadeFrames, Math.max(fadeFrames + 1, totalVerseFrames - fadeFrames), totalVerseFrames], 
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    const scale = interpolate(
        frame,
        [0, totalVerseFrames],
        [1, 1.05],
        { easing: Easing.out(Easing.quad) }
    );

    // حساب مكان النص
    const justifyMap: Record<string, string> = {
      top: "flex-start",
      center: "center",
      bottom: "flex-end",
    };
    const paddingMap: Record<string, string> = {
      top: "80px 80px 200px 80px",
      center: "120px",
      bottom: "200px 80px 80px 80px",
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
            gap: '60px', 
            opacity, 
            transform: `scale(${scale})`,
            padding: paddingMap[textPosition] || '120px',
            textAlign: 'center'
        }}>
            <div style={{ 
                color: '#D4AF37', 
                fontSize: '32px', 
                fontWeight: 800,
                textShadow: '0 0 20px rgba(212,175,55,0.4)',
                fontFamily: `"${fontFamily}", serif`
            }}>
                {surahName}
            </div>

            <p style={{ 
                color: textColor, 
                fontSize: `${fontSize * 1.8}px`, 
                fontFamily: `"${fontFamily}", serif`,
                direction: 'rtl',
                textAlign: 'center',
                width: '100%',
                lineHeight: 1.6,
                textShadow: '0 20px 50px rgba(0,0,0,1)',
                margin: 0,
                fontWeight: fontWeight || 700
            }}>
                {verse.text}
            </p>

            <div style={{ 
                width: '200px', 
                height: '4px', 
                background: 'linear-gradient(to right, transparent, #D4AF37, #D4AF37, transparent)', 
                opacity: 0.6,
                boxShadow: '0 0 20px rgba(212,175,55,0.3)'
            }} />

            <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '42px', 
                fontWeight: 500,
                textAlign: 'center',
                width: '100%',
                lineHeight: 1.4,
                textShadow: '0 10px 30px rgba(0,0,0,0.8)',
                fontStyle: 'italic',
                fontFamily: `"${fontFamily}", serif`
            }}>
                {verse.translation}
            </p>
        </div>
    );
}
