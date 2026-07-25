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
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // DNA Helix properties
    const nodesCount = 42;
    const speed = 0.008;
    let angle = 0;

    const drawDnaHelix = () => {
      ctx.clearRect(0, 0, width, height);

      // Add a subtle grid glow in the background
      ctx.strokeStyle = "rgba(99, 102, 241, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Smoothly interpolate mouse coordinates for organic motion response
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const centerX = width / 2 + (mouse.x - width / 2) * 0.15;
      const centerY = height / 2 + (mouse.y - height / 2) * 0.15;

      angle += speed;

      const pointsA: { x: number; y: number; z: number; size: number; alpha: number }[] = [];
      const pointsB: { x: number; y: number; z: number; size: number; alpha: number }[] = [];

      // Generate 3D coordinates for two helix strands
      for (let i = 0; i < nodesCount; i++) {
        // Vertical spacing along the helix length
        const t = (i / nodesCount) - 0.5;
        const yOffset = t * height * 1.1;

        // Helix rotation offsets
        const helixAngle = angle + t * Math.PI * 4;
        const radius = 90 + Math.sin(angle * 0.5 + t * Math.PI) * 20;

        // 3D coordinates (rotation in X-Z plane)
        const x3d_A = Math.cos(helixAngle) * radius;
        const z3d_A = Math.sin(helixAngle) * radius;

        const x3d_B = Math.cos(helixAngle + Math.PI) * radius;
        const z3d_B = Math.sin(helixAngle + Math.PI) * radius;

        // Simple 3D perspective projection
        const fov = 400; // Focal length
        const cameraDistance = 300;

        // Perspective scale factors
        const scaleA = fov / (fov + z3d_A + cameraDistance);
        const scaleB = fov / (fov + z3d_B + cameraDistance);

        // Project to 2D canvas coordinates
        // Rotate slightly on the screen plane for elegance
        const angleScreen = -0.4;
        const cosS = Math.cos(angleScreen);
        const sinS = Math.sin(angleScreen);

        const rxA = x3d_A * cosS - yOffset * sinS;
        const ryA = x3d_A * sinS + yOffset * cosS;

        const rxB = x3d_B * cosS - yOffset * sinS;
        const ryB = x3d_B * sinS + yOffset * cosS;

        pointsA.push({
          x: centerX + rxA * scaleA,
          y: centerY + ryA * scaleA,
          z: z3d_A,
          size: 5.5 * scaleA,
          alpha: Math.max(0.1, Math.min(1, 0.7 - z3d_A / (radius * 2))),
        });

        pointsB.push({
          x: centerX + rxB * scaleB,
          y: centerY + ryB * scaleB,
          z: z3d_B,
          size: 5.5 * scaleB,
          alpha: Math.max(0.1, Math.min(1, 0.7 - z3d_B / (radius * 2))),
        });
      }

      // 1. Draw connection rungs (bars) between the two strands
      for (let i = 0; i < nodesCount; i++) {
        const pA = pointsA[i];
        const pB = pointsB[i];

        // Draw bar if it is in view boundaries
        const grad = ctx.createLinearGradient(pA.x, pA.y, pB.x, pB.y);
        
        // Dynamic colors: Indigo/Purple/Cyan base on node Z position
        const alpha = Math.min(pA.alpha, pB.alpha) * 0.25;
        grad.addColorStop(0, `rgba(99, 102, 241, ${alpha})`); // Indigo
        grad.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.6})`); // Purple
        grad.addColorStop(1, `rgba(45, 212, 191, ${alpha})`); // Teal

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * ((pA.size + pB.size) / 11);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }

      // 2. Draw outer strands curves
      ctx.lineWidth = 2.5;
      for (let i = 0; i < nodesCount - 1; i++) {
        const drawSegment = (pts: typeof pointsA, colorRgb: string) => {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const alpha = (p1.alpha + p2.alpha) * 0.15;
          ctx.strokeStyle = `rgba(${colorRgb}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        };

        drawSegment(pointsA, "99, 102, 241"); // Indigo strand
        drawSegment(pointsB, "45, 212, 191"); // Teal strand
      }

      // 3. Draw nodes (glowing endpoints)
      // Sort nodes by Z value (depth sorting) to render correct overlapping
      const allNodes = [
        ...pointsA.map((p) => ({ ...p, color: "99, 102, 241" })), // Indigo
        ...pointsB.map((p) => ({ ...p, color: "45, 212, 191" })), // Teal
      ].sort((a, b) => b.z - a.z);

      allNodes.forEach((node) => {
        const glowRad = node.size * 2.2;
        const radGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRad);
        radGrad.addColorStop(0, `rgba(${node.color}, ${node.alpha})`);
        radGrad.addColorStop(0.3, `rgba(${node.color}, ${node.alpha * 0.4})`);
        radGrad.addColorStop(1, `rgba(${node.color}, 0)`);

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Core bright center
        ctx.fillStyle = `rgba(255, 255, 255, ${node.alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(drawDnaHelix);
    };

    drawDnaHelix();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 block" />;
};
