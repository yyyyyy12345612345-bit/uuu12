"use client";

import { registerRoot, Composition } from "remotion";
import { MainVideo } from "./VideoComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuranVideo"
        component={MainVideo as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          surahName: "الفاتحة",
          verses: [],
          backgroundUrl: "",
          audioUrl: "",
          textColor: "#ffffff",
          fontSize: 50
        }}
        // Allow render.mjs to override duration via calculateMetadata
        calculateMetadata={async ({ props }) => {
          const verses = (props as any).verses || [];
          // Default: 8 seconds per verse (240 frames at 30fps)
          const framesPerVerse = 240;
          const totalFrames = Math.max(300, verses.length * framesPerVerse);
          return {
            durationInFrames: totalFrames,
          };
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
