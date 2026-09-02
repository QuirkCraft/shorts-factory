import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Oswald";

const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export type ShortProps = {
  scenes: { src: string; text: string; duration: number }[];
  audioUrl: string;
  captions: { text: string; start: number; end: number }[];
};

export const Short: React.FC<ShortProps> = ({
  scenes,
  audioUrl,
  captions,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  let offset = 0;
  const sceneSequences = scenes.map((s, i) => {
    const from = Math.round(offset * 30);
    const durationInFrames = Math.max(1, Math.round((s.duration || 15) * 30));
    offset += s.duration || 15;
    return (
      <Sequence key={i} from={from} durationInFrames={durationInFrames}>
        <OffthreadVideo
          src={s.src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={0}
        />
      </Sequence>
    );
  });

  const spoken = captions.find((c) => t >= c.start && t < c.end) || null;
  const line = spoken ? spoken.text.toUpperCase() : "";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sceneSequences}
      <Audio src={audioUrl} />
      {line ? (
        <div
          style={{
            position: "absolute",
            bottom: 340,
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily,
            fontWeight: 700,
            fontSize: 64,
            color: "#FFFFFF",
            lineHeight: 1.2,
            textShadow:
              "3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 0 24px rgba(0,0,0,0.9)",
          }}
        >
          {line}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
