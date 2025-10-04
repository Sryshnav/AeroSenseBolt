import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AvatarProps {
  isSpeaking: boolean;
  tone: 'calm' | 'warning' | 'urgent' | 'positive';
}

export default function Avatar({ isSpeaking, tone }: AvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mouthOpen, setMouthOpen] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const bgGradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 150);
      bgGradient.addColorStop(0, getToneColor(tone) + '40');
      bgGradient.addColorStop(1, getToneColor(tone) + '00');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const headRadius = 60;
      const headGradient = ctx.createRadialGradient(
        centerX - 10,
        centerY - 70 - 10,
        0,
        centerX,
        centerY - 70,
        headRadius
      );
      headGradient.addColorStop(0, '#60a5fa');
      headGradient.addColorStop(1, '#3b82f6');

      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 70, headRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = getToneColor(tone);
      ctx.lineWidth = 3;
      ctx.stroke();

      if (isSpeaking) {
        ctx.strokeStyle = getToneColor(tone);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i < 3; i++) {
          const radius = headRadius + 10 + i * 15 + Math.sin(time + i) * 5;
          ctx.beginPath();
          ctx.arc(centerX, centerY - 70, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 20, centerY - 80, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 20, centerY - 80, 8, 0, Math.PI * 2);
      ctx.fill();

      const pupilOffset = isSpeaking ? Math.sin(time * 2) * 2 : 0;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(centerX - 20 + pupilOffset, centerY - 80, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 20 + pupilOffset, centerY - 80, 4, 0, Math.PI * 2);
      ctx.fill();

      let currentMouthOpen = mouthOpen;
      if (isSpeaking) {
        currentMouthOpen = Math.abs(Math.sin(time * 8)) * 15;
        setMouthOpen(currentMouthOpen);
      } else {
        currentMouthOpen = Math.max(0, currentMouthOpen - 2);
        setMouthOpen(currentMouthOpen);
      }

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (currentMouthOpen > 2) {
        ctx.ellipse(
          centerX,
          centerY - 50,
          12,
          currentMouthOpen / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#1e293b';
        ctx.fill();
      } else {
        ctx.moveTo(centerX - 12, centerY - 50);
        ctx.quadraticCurveTo(centerX, centerY - 48, centerX + 12, centerY - 50);
      }
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 20, 40, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = getToneColor(tone);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.ellipse(centerX - 50, centerY + 40, 15, 35, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 50, centerY + 40, 15, 35, 0.2, 0, Math.PI * 2);
      ctx.fill();

      time += 0.1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking, tone, mouthOpen]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={350}
        className="w-full h-auto"
      />
      <div className="absolute top-2 right-2">
        {isSpeaking ? (
          <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-500" />
        )}
      </div>
    </div>
  );
}

function getToneColor(tone: 'calm' | 'warning' | 'urgent' | 'positive'): string {
  switch (tone) {
    case 'calm':
      return '#3b82f6';
    case 'warning':
      return '#f59e0b';
    case 'urgent':
      return '#ef4444';
    case 'positive':
      return '#10b981';
    default:
      return '#3b82f6';
  }
}
