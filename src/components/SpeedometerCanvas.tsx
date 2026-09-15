import React, { useEffect, useRef } from 'react';

interface SpeedometerCanvasProps {
  score: number; // 0 to 100
}

export const SpeedometerCanvas: React.FC<SpeedometerCanvasProps> = ({ score }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = 300;
    const height = 170;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height - 25;
    const radius = 105;

    // Arc angles: from PI to 2*PI (half circle gauge)
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // 1. Draw Background Arc Track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Draw Gradient Active Arc
    const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    gradient.addColorStop(0, '#ef4444'); // Red
    gradient.addColorStop(0.35, '#f59e0b'); // Amber
    gradient.addColorStop(0.7, '#10b981'); // Emerald
    gradient.addColorStop(1, '#06b6d4'); // Cyan

    const clampedScore = Math.max(0, Math.min(100, score));
    const activeAngle = startAngle + (clampedScore / 100) * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, activeAngle, false);
    ctx.lineWidth = 14;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 3. Draw tick marks along the arc
    for (let i = 0; i <= 10; i++) {
      const tickAngle = startAngle + (i / 10) * Math.PI;
      const innerR = radius - 16;
      const outerR = radius - (i % 5 === 0 ? 24 : 20);

      const x1 = centerX + innerR * Math.cos(tickAngle);
      const y1 = centerY + innerR * Math.sin(tickAngle);
      const x2 = centerX + outerR * Math.cos(tickAngle);
      const y2 = centerY + outerR * Math.sin(tickAngle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();
    }

    // 4. Draw Needle Pointer
    const needleAngle = startAngle + (clampedScore / 100) * Math.PI;
    const needleLength = radius - 20;

    const needleTipX = centerX + needleLength * Math.cos(needleAngle);
    const needleTipY = centerY + needleLength * Math.sin(needleAngle);

    // Needle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.moveTo(centerX - 4 * Math.sin(needleAngle), centerY + 4 * Math.cos(needleAngle));
    ctx.lineTo(needleTipX, needleTipY);
    ctx.lineTo(centerX + 4 * Math.sin(needleAngle), centerY - 4 * Math.cos(needleAngle));
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.restore();

    // 5. Center Hub / Pivot Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }, [score]);

  return (
    <div className="flex justify-center items-center">
      <canvas ref={canvasRef} id="speedometer-canvas" />
    </div>
  );
};
