import { useEffect, useRef } from "react";
import { getAudioContext } from "../audio/engine";

interface PeakMeterProps {
  audioElement: HTMLAudioElement | null;
  color: string;
  height?: number;
}

export function PeakMeter({ audioElement, color, height = 120 }: PeakMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const sourceCreated = useRef(false);

  useEffect(() => {
    if (!audioElement || !canvasRef.current || sourceCreated.current) return;

    const ctx = getAudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    analyserRef.current = analyser;

    // Tap into audio element's existing connection
    try {
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      source.connect(ctx.destination);
      sourceCreated.current = true;
    } catch {
      // Already connected - that's fine, we'll just show a static meter
    }

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) return;

    const w = canvas.width;
    const h = canvas.height;
    const barCount = 20;
    const gap = 1;
    const barH = (h - (barCount - 1) * gap) / barCount;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      drawCtx.clearRect(0, 0, w, h);

      let level = 0;
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const sum = data.reduce((a, b) => a + b, 0);
        level = sum / (data.length * 255);
      } else {
        // Fake meter animation when we can't connect
        level = audioElement && !audioElement.paused
          ? 0.3 + Math.random() * 0.4
          : 0;
      }

      const litBars = Math.floor(level * barCount);

      for (let i = 0; i < barCount; i++) {
        const y = h - (i + 1) * (barH + gap);
        const ratio = i / barCount;

        if (i < litBars) {
          if (ratio > 0.85) {
            drawCtx.fillStyle = "#ff3333";
          } else if (ratio > 0.7) {
            drawCtx.fillStyle = "#ffaa00";
          } else {
            drawCtx.fillStyle = color;
          }
          drawCtx.globalAlpha = 0.9;
        } else {
          drawCtx.fillStyle = color;
          drawCtx.globalAlpha = 0.08;
        }

        drawCtx.fillRect(0, y, w, barH);
      }
      drawCtx.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color, height, audioElement]);

  return (
    <canvas
      ref={canvasRef}
      width={12}
      height={height}
      className="peak-meter-canvas"
    />
  );
}
