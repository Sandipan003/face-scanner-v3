import React, { useEffect, useRef } from "react";

export const HealthBg3d: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates to add interactivity
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Magical Stars properties
    const starsCount = 150;
    let stars: { x: number; y: number; z: number; size: number; alpha: number, speed: number }[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starsCount; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * 1000,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.5 + 0.2
        });
      }
    };
    initStars();

    const drawMagicalNight = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate mouse coordinates for parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const centerX = width / 2;
      const centerY = height / 2;
      
      const mouseOffsetX = (mouse.x - centerX) * 0.05;
      const mouseOffsetY = (mouse.y - centerY) * 0.05;

      stars.forEach((star) => {
        // Move stars closer (Z-axis)
        star.z -= star.speed * 2;
        if (star.z <= 0) {
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
          star.z = 1000;
        }

        // 3D Perspective Projection
        const fov = 400;
        const scale = fov / (fov + star.z);
        
        const px = centerX + star.x * scale - mouseOffsetX * (1000 - star.z) * 0.001;
        const py = centerY + star.y * scale - mouseOffsetY * (1000 - star.z) * 0.001;
        
        const currentSize = star.size * scale * 2;
        const currentAlpha = Math.min(1, Math.max(0.1, 1 - (star.z / 1000))) * (0.5 + Math.sin(Date.now() * 0.002 * star.speed) * 0.5);

        // Draw glowing star
        const radGrad = ctx.createRadialGradient(px, py, 0, px, py, currentSize * 3);
        const goldAlpha = currentAlpha * 0.8;
        radGrad.addColorStop(0, `rgba(251, 191, 36, ${currentAlpha})`); // Amber/Gold core
        radGrad.addColorStop(0.2, `rgba(217, 119, 6, ${goldAlpha})`);
        radGrad.addColorStop(1, `rgba(180, 83, 9, 0)`);

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(px, py, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(px, py, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(drawMagicalNight);
    };

    drawMagicalNight();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 block" />;
};
