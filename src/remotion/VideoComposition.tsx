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
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return src;
  }
  return staticFile(src);
}

interface Verse {
  id: number;
  text: string;
  translation: string;
  audio: string;
  durationInFrames?: number; // Calculated by engine
  startFrame?: number; // Calculated by engine
}

interface MainVideoProps {
  surahName: string;
  verses: Verse[];
  backgroundUrl: string;
  audioUrl?: string;
  textColor: string;
  fontSize: number;
}

export const MainVideo: React.FC<MainVideoProps> = ({
  surahName,
  verses = [],
  backgroundUrl,
  textColor = "#ffffff",
  fontSize = 60
}) => {
  const { durationInFrames } = useVideoConfig();
  const resolvedBg = resolveMedia(backgroundUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <AbsoluteFill style={{ backgroundColor: 'black' }} />
      {resolvedBg && (
        isVideoUrl(backgroundUrl) ? (
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
        )
      )}
      
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent, rgba(0,0,0,0.6))'
      }} />

      <AbsoluteFill>
        {verses.map((verse, index) => {
          // Use pre-calculated values from engine OR fallback to equal distribution
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
                totalVerseFrames={actualDuration}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const VerseComponent = ({ verse, surahName, textColor, fontSize, totalVerseFrames }: { verse: Verse, surahName: string, textColor: string, fontSize: number, totalVerseFrames: number }) => {
    const frame = useCurrentFrame();
    
    // Pro Fade: 15 frames or 10% of verse duration
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

    return (
        <div style={{ 
            height: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: '80px', 
            opacity, 
            transform: `scale(${scale})`,
            padding: '120px',
            textAlign: 'center'
        }}>
            <div style={{ 
                color: '#D4AF37', 
                fontSize: '28px', 
                fontWeight: 800,
                letterSpacing: '10px',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(212,175,55,0.4)',
                fontFamily: 'sans-serif'
            }}>
                {surahName}
            </div>

            <p style={{ 
                color: textColor, 
                fontSize: `${fontSize * 1.8}px`, 
                fontFamily: 'serif',
                direction: 'rtl',
                textAlign: 'center',
                width: '100%',
                lineHeight: 1.6,
                textShadow: '0 20px 50px rgba(0,0,0,1)',
                margin: 0,
                fontWeight: 700
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
                fontStyle: 'italic'
            }}>
                {verse.translation}
            </p>
        </div>
    );
}
