import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { useMixerStore } from "../store/mixerStore";
import { STEM_COLORS } from "../types";

interface WaveformProps {
  url: string;
  stemName: string;
  showLoop?: boolean;
}

export function Waveform({ url, stemName, showLoop = false }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const { currentTime, duration } = useMixerStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const color = STEM_COLORS[stemName] || "#888";
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color + "55",
      progressColor: color,
      height: 64,
      normalize: true,
      interact: false,
      cursorWidth: 2,
      cursorColor: "#ffffff",
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      barMinHeight: 1,
    });

    ws.load(url);

    if (showLoop) {
      const regions = ws.registerPlugin(RegionsPlugin.create());
      ws.on("ready", () => {
        const dur = ws.getDuration();
        const region = regions.addRegion({
          start: 0,
          end: dur,
          color: "rgba(124, 106, 255, 0.08)",
          drag: true,
          resize: true,
        });

        region.on("update-end", () => {
          const store = useMixerStore.getState();
          store.setLoop(region.start, region.end);
          import("../audio/transport").then(({ transport }) => {
            transport.setLoop(store.loopEnabled, region.start, region.end);
          });
        });
      });
    }

    wsRef.current = ws;
    return () => { ws.destroy(); wsRef.current = null; };
  }, [url, stemName, showLoop]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !duration) return;
    const progress = currentTime / duration;
    if (progress >= 0 && progress <= 1) ws.seekTo(progress);
  }, [currentTime, duration]);

  return (
    <div className="waveform-container">
      <div ref={containerRef} className="waveform-canvas" />
    </div>
  );
}
