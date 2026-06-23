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

// ── فلاتر الخلفية السينمائية (24 فلتر) ──
const FILTER_MAP: Record<string, string> = {
  none: "none",
  vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
  cool: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
  warm: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
  bw: "grayscale(1) contrast(1.2)",
  dramatic: "contrast(1.4) brightness(0.7) saturate(1.2)",
  blur: "blur(20px) brightness(0.8)",
  invert: "invert(1) hue-rotate(180deg)",
  midnight: "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(20deg)",
  oceanic: "hue-rotate(30deg) brightness(1.05) saturate(1.2) contrast(1.1)",
  sepia: "sepia(1) contrast(0.9) brightness(1.1)",
  saturated: "saturate(2.2) contrast(1.15)",
  cinematic: "contrast(1.25) brightness(0.85) saturate(1.1) sepia(0.15)",
  golden: "sepia(0.35) contrast(1.15) brightness(1.05) saturate(1.3) hue-rotate(-5deg)",
  teal_orange: "contrast(1.2) saturate(1.25) hue-rotate(-15deg) sepia(0.1) brightness(0.9)",
  noir: "grayscale(1) contrast(1.7) brightness(0.75)",
  dreamy: "saturate(0.95) brightness(1.15) contrast(0.9) blur(1.5px)",
  neon: "saturate(2) hue-rotate(60deg) brightness(1.25) contrast(1.1)",
  pastel: "saturate(0.65) brightness(1.2) contrast(0.95)",
  lut_autumn: "sepia(0.2) saturate(1.45) hue-rotate(-20deg) contrast(1.15) brightness(0.95)",
  lut_forest: "hue-rotate(50deg) saturate(1.25) contrast(1.2) brightness(0.85)",
  high_contrast: "contrast(1.5) saturate(1.35) brightness(1.1)",
  faded: "contrast(0.8) brightness(1.15) saturate(0.65)",
  vignette: "brightness(0.95) contrast(1.05)",
  cross_process: "contrast(1.35) saturate(1.15) hue-rotate(10deg) sepia(0.12)"
};

const FONT_IMPORTS: Record<string, string> = {
  "Amiri": "Amiri:wght@400;700",
  "Noto Naskh Arabic": "Noto+Naskh+Arabic:wght@400;500;600;700",
  "Scheherazade New": "Scheherazade+New:wght@400;500;600;700",
  "Lateef": "Lateef:wght@200;300;400;500;600;700;800",
  "Cairo": "Cairo:wght@200;300;400;500;600;700;800;900",
  "Tajawal": "Tajawal:wght@200;300;400;500;700;800;900",
  "Reem Kufi": "Reem+Kufi:wght@400;700",
  "Lalezar": "Lalezar",
  "El Messiri": "El+Messiri:wght@500;700",
  "Almarai": "Almarai:wght@400;700",
  "Aref Ruqaa": "Aref+Ruqaa",
  "Alexandria": "Alexandria:wght@400;700",
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
  overlay?: string;
  animation?: string;
  textPosition?: "top" | "center" | "bottom";
  textVerticalOffset?: number;
  userPlan?: string;
  ayahDecoration?: string;
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
  userPlan = "free",
  ayahDecoration = "bracket1",
}) => {
  const { durationInFrames } = useVideoConfig();
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

        @keyframes snowMove {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(1100px) translateX(80px) rotate(360deg); opacity: 0; }
        }

        @keyframes rainMove {
          0% { transform: translateY(-100px) translateX(0); opacity: 0.6; }
          100% { transform: translateY(1200px) translateX(-100px); opacity: 0.6; }
        }

        @keyframes firefliesMove {
          0% { transform: translate(0, 0) scale(0.8); opacity: 0.2; }
          50% { transform: translate(80px, -80px) scale(1.2); opacity: 0.9; }
          100% { transform: translate(-40px, -150px) scale(0.8); opacity: 0.2; }
        }

        @keyframes smokeMove {
          0% { transform: translateY(200px) translateX(0) scale(1) rotate(0deg); opacity: 0; filter: blur(20px); }
          30% { opacity: 0.25; filter: blur(35px); }
          100% { transform: translateY(-1200px) translateX(200px) scale(3) rotate(90deg); opacity: 0; filter: blur(60px); }
        }

        @keyframes sparkleFade {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2) rotate(45deg); opacity: 0.9; }
        }

        @keyframes grainAnimation {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(-2%, 1%); }
          30% { transform: translate(1%, -2%); }
          40% { transform: translate(-1%, 3%); }
          50% { transform: translate(-2%, 1%); }
          60% { transform: translate(1%, 2%); }
          75% { transform: translate(-2%, -2%); }
          90% { transform: translate(2%, 1%); }
        }

        @keyframes lightLeakMove {
          0%, 100% { transform: translate(-10%, -10%) scale(1); opacity: 0.15; }
          50% { transform: translate(10%, 10%) scale(1.3); opacity: 0.45; }
        }

        @keyframes auroraMove {
          0%, 100% { transform: skewY(-5deg) translateY(0); filter: hue-rotate(0deg); }
          50% { transform: skewY(5deg) translateY(-20px); filter: hue-rotate(45deg); }
        }
      `}</style>

      <AbsoluteFill style={{ backgroundColor: backgroundUrl ? 'black' : 'transparent' }} />

      {/* ── الخلفية المفلترة ── */}
      {resolvedBg && (
        <AbsoluteFill style={{ filter: cssFilter }}>
          {isVideoUrl(backgroundUrl) ? (
            <Video
              src={resolvedBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              muted loop crossOrigin="anonymous"
            />
          ) : (
            <AbsoluteFill style={{
              backgroundImage: `url(${resolvedBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.9,
            }} />
          )}
        </AbsoluteFill>
      )}

      {/* Vignette Filter overlay */}
      {filter === "vignette" && (
        <AbsoluteFill style={{
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 160px rgba(0,0,0,0.85)',
          zIndex: 5
        }} />
      )}

      {/* ── تأثير Overlays (12 تأثير احترافي) ── */}
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

      {overlay === "rain" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(60)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${Math.random() * -20}%`,
              left: `${Math.random() * 120}%`,
              width: '1px',
              height: `${Math.random() * 40 + 30}px`,
              background: 'rgba(174,194,224,0.4)',
              transform: 'rotate(15deg)',
              animation: `rainMove ${Math.random() * 0.8 + 0.8}s linear infinite`,
              animationDelay: `-${Math.random() * 2}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "snow" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '-20px',
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: 'white',
              borderRadius: '50%',
              boxShadow: '0 0 5px white',
              animation: `snowMove ${Math.random() * 8 + 8}s linear infinite`,
              animationDelay: `-${Math.random() * 15}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "fireflies" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(25)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              bottom: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 5 + 3}px`,
              height: `${Math.random() * 5 + 3}px`,
              background: '#D4AF37',
              borderRadius: '50%',
              boxShadow: '0 0 15px #D4AF37, 0 0 30px #FFD700',
              animation: `firefliesMove ${Math.random() * 12 + 10}s ease-in-out infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "smoke" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              bottom: '-150px',
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 200}px`,
              height: `${Math.random() * 300 + 200}px`,
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: `smokeMove ${Math.random() * 20 + 20}s ease-out infinite`,
              animationDelay: `-${Math.random() * 25}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "sparkle" && (
        <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              width: '12px',
              height: '12px',
              background: '#FFD700',
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              boxShadow: '0 0 10px #FFD700',
              animation: `sparkleFade ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `-${Math.random() * 5}s`
            }} />
          ))}
        </AbsoluteFill>
      )}

      {overlay === "film_grain" && (
        <AbsoluteFill style={{ 
          pointerEvents: 'none', 
          overflow: 'hidden',
          opacity: 0.12,
          mixBlendMode: 'overlay'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            animation: 'grainAnimation 0.5s steps(1) infinite'
          }} />
        </AbsoluteFill>
      )}

      {overlay === "light_leak" && (
        <AbsoluteFill style={{ 
          pointerEvents: 'none', 
          overflow: 'hidden',
          mixBlendMode: 'screen'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background: 'radial-gradient(circle at 10% 20%, rgba(255, 99, 71, 0.4) 0%, rgba(255, 165, 0, 0.2) 40%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'lightLeakMove 12s ease-in-out infinite'
          }} />
        </AbsoluteFill>
      )}

      {overlay === "aurora" && (
        <AbsoluteFill style={{ 
          pointerEvents: 'none', 
          overflow: 'hidden',
          mixBlendMode: 'color-dodge',
          opacity: 0.5
        }}>
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '120%',
            height: '60%',
            background: 'linear-gradient(90deg, rgba(0,255,136,0.3) 0%, rgba(0,136,255,0.3) 50%, rgba(200,0,255,0.3) 100%)',
            filter: 'blur(80px)',
            transformOrigin: 'top center',
            animation: 'auroraMove 15s ease-in-out infinite'
          }} />
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent, rgba(0,0,0,0.6))' }} />

      {/* ── Audio Visualizer (Waves) ── */}
      <AbsoluteFill style={{ 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        paddingBottom: '80px',
        pointerEvents: 'none' 
      }}>
         <AudioVisualizer color={textColor} />
      </AbsoluteFill>

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
                ayahDecoration={ayahDecoration}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* Static Surah Name Badge at the top */}
      {surahName && (
        <AbsoluteFill style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: '80px',
          pointerEvents: 'none',
          zIndex: 50
        }}>
          <div style={{
            padding: '10px 30px',
            borderRadius: '25px',
            backgroundColor: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFD700',
            fontSize: '32px',
            fontWeight: 800,
            textShadow: '0 0 20px rgba(255,215,0,0.4)',
            fontFamily: `"${fontFamily}", serif`,
            letterSpacing: '2px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            سورة {surahName}
          </div>
        </AbsoluteFill>
      )}

      {/* ── Watermarks for Free Users ── */}
      {userPlan === "free" && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
           {[...Array(6)].map((_, row) => (
             <div key={row} style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {[...Array(3)].map((_, col) => (
                   <div key={col} style={{ 
                      color: 'rgba(255,255,255,0.15)', 
                      fontSize: '30px', 
                      fontWeight: 900,
                      transform: 'rotate(-30deg)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'sans-serif'
                   }}>
                      yaqeenalquran.online
                   </div>
                ))}
             </div>
           ))}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const VerseComponent = ({ verse, surahName, textColor, fontSize, fontWeight, fontFamily, animation, textPosition, textVerticalOffset, totalVerseFrames, ayahDecoration }: {
  verse: Verse, surahName: string, textColor: string, fontSize: number, fontWeight: any,
  fontFamily: string, animation: string, textPosition: string, textVerticalOffset: number, totalVerseFrames: number, ayahDecoration: string
}) => {
  const frame = useCurrentFrame();

  const fadeIn = Math.min(15, Math.floor(totalVerseFrames * 0.15));
  const fadeOut = Math.min(10, Math.floor(totalVerseFrames * 0.1));

  const lineOpacity = interpolate(
    frame,
    [0, fadeIn, totalVerseFrames - fadeOut, totalVerseFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Zoom/Scale effect
  const baseScale = interpolate(frame, [0, totalVerseFrames], [1, 1.03], { easing: Easing.out(Easing.quad) });

  // Entrance animation
  let animationStyles: React.CSSProperties = {};
  const entranceY = interpolate(frame, [0, fadeIn], [40, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });

  if (animation === "scale") {
    const s = interpolate(frame, [0, fadeIn], [0.85, 1], { extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale * s}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "slide") {
    animationStyles.transform = `scale(${baseScale}) translateY(${entranceY + textVerticalOffset}px)`;
  } else if (animation === "blur") {
    const blur = interpolate(frame, [0, fadeIn], [20, 0], { extrapolateRight: 'clamp' });
    animationStyles.filter = `blur(${blur}px)`;
    animationStyles.transform = `scale(${baseScale}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "zoom") {
    const zoom = interpolate(frame, [0, fadeIn], [1.5, 1], { easing: Easing.out(Easing.exp), extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale * zoom}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "flip") {
    const rotateX = interpolate(frame, [0, fadeIn], [60, 0], { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' });
    animationStyles.transform = `perspective(1000px) scale(${baseScale}) rotateX(${rotateX}deg) translateY(${textVerticalOffset}px)`;
  } else if (animation === "bounce") {
    const bounce = interpolate(frame, [0, fadeIn], [150, 0], { easing: Easing.out(Easing.bounce), extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale}) translateY(${bounce + textVerticalOffset}px)`;
  } else if (animation === "glitch") {
    const jitterX = Math.random() > 0.92 ? (Math.random() - 0.5) * 16 : 0;
    const jitterY = Math.random() > 0.92 ? (Math.random() - 0.5) * 16 : 0;
    animationStyles.transform = `scale(${baseScale}) translate(${jitterX}px, ${jitterY + textVerticalOffset}px)`;
    if (Math.random() > 0.94) {
      animationStyles.filter = `hue-rotate(${Math.random() * 360}deg) saturate(3)`;
    }
  } else if (animation === "elastic") {
    const t = frame / fadeIn;
    const elasticScale = 1 - Math.cos(t * Math.PI * 2.5) * Math.exp(-t * 2.5);
    const s = frame < fadeIn ? Math.max(0, elasticScale) : 1;
    animationStyles.transform = `scale(${baseScale * s}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "swing") {
    const rot = Math.sin(frame / 8) * 8;
    animationStyles.transform = `scale(${baseScale}) rotate(${rot}deg) translateY(${textVerticalOffset}px)`;
  } else if (animation === "spiral") {
    const rot = interpolate(frame, [0, fadeIn], [360, 0], { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' });
    const s = interpolate(frame, [0, fadeIn], [0.1, 1], { extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale * s}) rotate(${rot}deg) translateY(${textVerticalOffset}px)`;
  } else if (animation === "cinematic") {
    const track = interpolate(frame, [0, totalVerseFrames], [1, 10], { extrapolateRight: 'clamp' });
    animationStyles.letterSpacing = `${track}px`;
    animationStyles.transform = `scale(${baseScale}) translateY(${textVerticalOffset}px)`;
  } else if (animation === "rotate") {
    const rot = interpolate(frame, [0, fadeIn], [-180, 0], { easing: Easing.out(Easing.back(1.2)), extrapolateRight: 'clamp' });
    animationStyles.transform = `scale(${baseScale}) rotate(${rot}deg) translateY(${textVerticalOffset}px)`;
  } else {
    animationStyles.transform = `scale(${baseScale}) translateY(${entranceY + textVerticalOffset}px)`;
  }

  const showTranslation = !!verse.translation;

  const justifyMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end" };
  const paddingMap: Record<string, string> = {
    top: "260px 40px 100px 40px",
    center: "160px 40px 40px 40px",
    bottom: "100px 40px 60px 40px"
  };

  const renderTextContent = () => {
    if (animation === "wave") {
      return (
        <span style={{ display: 'inline-block' }}>
          {(verse.text || "").split("").map((char, charIdx) => {
            const charOffset = Math.sin((frame / 6) + (charIdx * 0.4)) * 12;
            return (
              <span key={charIdx} style={{
                display: 'inline-block',
                transform: `translateY(${charOffset}px)`,
                whiteSpace: char === " " ? "pre" : "normal"
              }}>
                {char}
              </span>
            );
          })}
        </span>
      );
    }

    if (animation === "typewriter") {
      const charIndex = Math.floor(interpolate(frame, [0, Math.min(totalVerseFrames - 10, 45)], [0, (verse.text || "").length], { extrapolateRight: 'clamp' }));
      return (verse.text || "").slice(0, charIndex);
    }

    if (animation === "split") {
      return (
        <span style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(verse.text || "").split(" ").map((word, wordIdx) => {
            const dir = wordIdx % 2 === 0 ? -60 : 60;
            const x = interpolate(frame, [0, fadeIn], [dir, 0], { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' });
            return (
              <span key={wordIdx} style={{
                display: 'inline-block',
                transform: `translateX(${x}px)`,
              }}>
                {word}
              </span>
            );
          })}
        </span>
      );
    }

    return verse.text;
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: justifyMap[textPosition] || 'center',
      gap: '30px',
      opacity: lineOpacity,
      ...animationStyles,
      padding: paddingMap[textPosition] || '40px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>

      <p style={{
        color: textColor, fontSize: `${fontSize * 1.5}px`, fontFamily: `"${fontFamily}", serif`,
        direction: 'rtl', textAlign: 'center', width: '100%', lineHeight: 2.4,
        textShadow: '0 20px 50px rgba(0,0,0,1)', margin: 0,
        fontWeight: fontWeight || 700
      }}>
        {renderTextContent()}
      </p>

      <div style={{
        width: '200px', height: '4px',
        background: 'linear-gradient(to right, transparent, #FFD700, #FFD700, transparent)',
        opacity: 0.6, boxShadow: '0 0 20px rgba(255,215,0,0.3)'
      }} />

      {showTranslation && (
        <p style={{
          color: 'rgba(255,255,255,0.9)', fontSize: '38px', fontWeight: 500,
          textAlign: 'center', width: '100%', lineHeight: 1.8,
          textShadow: '0 10px 30px rgba(0,0,0,0.8)', fontStyle: 'italic',
          fontFamily: `"${fontFamily}", serif`
        }}>
          {verse.translation}
        </p>
      )}

      {/* Verse Number (Bottom) */}
      <div style={{
        position: 'absolute',
        bottom: '180px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{
          color: '#FFD700',
          fontSize: '45px',
          fontWeight: 'bold',
          fontFamily: `"${fontFamily}", serif`,
          textShadow: '0 4px 15px rgba(0,0,0,0.8)'
        }}>
          {(() => {
            const dec = ayahDecoration || "bracket1";
            if (dec === "none") return `${verse.id}`;
            if (dec === "bracket1") return `﴿ ${verse.id} ﴾`;
            if (dec === "bracket2") return `﴾ ${verse.id} ﴿`;
            if (dec === "star") return `✧ ${verse.id} ✧`;
            if (dec === "diamond") return `✥ ${verse.id} ✥`;
            if (dec === "ornament") return `۞ ${verse.id} ۞`;
            return `﴿ ${verse.id} ﴾`;
          })()}
        </span>
      </div>
    </div>
  );
};

const AudioVisualizer = ({ color }: { color: string }) => {
  const frame = useCurrentFrame();
  const bars = 40;
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
      {[...Array(bars)].map((_, i) => {
        const wave1 = Math.sin(frame / 5 + i / 3);
        const wave2 = Math.sin(frame / 10 - i / 5);
        const combined = (wave1 + wave2 + 2) / 4;
        
        const height = interpolate(combined, [0, 1], [10, 80]);
        const opacity = interpolate(combined, [0, 1], [0.3, 0.8]);
        
        return (
          <div key={i} style={{
            width: '8px',
            height: `${height}px`,
            backgroundColor: color,
            borderRadius: '4px',
            opacity,
            boxShadow: `0 0 15px ${color}40`,
          }} />
        );
      })}
    </div>
  );
};
