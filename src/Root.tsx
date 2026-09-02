import React from "react";
import { Composition } from "remotion";
import { Short, type ShortProps } from "./Short";

const defaultProps: ShortProps = {
  scenes: [
    {
      src: "https://videos.pexels.com/video-files/12902301/12902301-hd_1080_1920_30fps.mp4",
      text: "placeholder scene",
      duration: 15,
    },
  ],
  audioUrl: "",
  captions: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Shorts"
      component={Short}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1800}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const sceneTotal = props.scenes.reduce(
          (a, s) => a + (s.duration || 15),
          0
        );
        const duration =
          props.audioSeconds && props.audioSeconds > 1
            ? Math.min(sceneTotal, props.audioSeconds)
            : sceneTotal;
        return {
          durationInFrames: Math.max(30, Math.floor(duration * 30)),
        };
      }}
    />
  );
};
