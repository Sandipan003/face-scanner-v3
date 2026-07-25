import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Wand2, Eye } from "lucide-react";

interface ProphecyOrbProps {
  onScanClick?: () => void;
}

export const ProphecyOrb3d: React.FC<ProphecyOrbProps> = ({ onScanClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [magicLevel, setMagicLevel] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 1. Core Glowing Sphere
    const coreGeom = new THREE.SphereGeometry(3.0, 64, 64);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700, // Gold
      emissive: 0x8b0000, // Deep Red/Crimson
      emissiveIntensity: 0.8,
      transmission: 0.9,
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
      thickness: 2.0
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    orbGroup.add(coreMesh);

    // 2. Inner Swirling Magic Particles
    const particleCount = 400;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    const colorGold = new THREE.Color(0xffd700);
    const colorCrimson = new THREE.Color(0xb91c1c);

    for (let i = 0; i < particleCount; i++) {
      // Random position inside the sphere
      const r = 2.8 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particlePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = r * Math.cos(phi);

      const color = Math.random() > 0.5 ? colorGold : colorCrimson;
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    orbGroup.add(particles);

    // 3. Ornate Stand (Torus + Cylinder)
    const standGroup = new THREE.Group();
    
    const ringGeom = new THREE.TorusGeometry(2.4, 0.3, 16, 64);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x8b6508, // Dark Gold
      metalness: 0.9,
      roughness: 0.3
    });
    const ringMesh = new THREE.Mesh(ringGeom, standMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -2.8;
    standGroup.add(ringMesh);

    const baseGeom = new THREE.CylinderGeometry(2.8, 3.5, 0.8, 32);
    const baseMesh = new THREE.Mesh(baseGeom, standMat);
    baseMesh.position.y = -3.4;
    standGroup.add(baseMesh);
    
    scene.add(standGroup);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffd700, 5, 20);
    pointLight.position.set(0, 0, 0); // Inside the orb
    scene.add(pointLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(5, 8, 5);
    scene.add(spotLight);

    // Interactive Drag
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      previousMousePosition = { x: clientX, y: 0 };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - previousMousePosition.x;
        targetRotationY += deltaX * 0.01;
        previousMousePosition = { x: clientX, y: 0 };
      }
    };

    const onPointerUp = () => isDragging = false;

    const domElem = renderer.domElement;
    domElem.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    domElem.addEventListener("touchstart", onPointerDown);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchend", onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    const startTime = performance.now();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Rotate Orb and Particles
      orbGroup.rotation.y += (targetRotationY - orbGroup.rotation.y) * 0.1;
      orbGroup.rotation.y += 0.005; // Slow constant rotation
      particles.rotation.y = elapsedTime * 0.2;
      particles.rotation.z = Math.sin(elapsedTime * 0.1) * 0.2;
      
      // Pulse Light
      pointLight.intensity = 4 + Math.sin(elapsedTime * 3) * 2;
      
      setMagicLevel(Math.floor(50 + Math.sin(elapsedTime * 2) * 50));

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      domElem.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      domElem.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Magical Aura Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;
    const points: number[] = new Array(220).fill(24);

    const drawMagic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      step++;

      const val = 24 + Math.sin(step * 0.1) * 12 + (Math.random() - 0.5) * 8;
      points.push(val);
      if (points.length > canvas.width) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = "#fbbf24"; // Amber/Gold
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 12;

      for (let x = 0; x < points.length; x++) {
        const y = points[x];
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawMagic);
    };

    drawMagic();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full rounded-[2rem] glass-panel-magical p-6 overflow-hidden group transition-all duration-700 hover:border-amber-500/40">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-amber-400">
              Divination Core Active
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-amber-100 mt-1 flex items-center gap-2 text-glow-gold">
            <span>The Prophecy Orb</span>
          </h2>
        </div>
      </div>

      <div 
        ref={mountRef} 
        className="w-full h-[360px] sm:h-[420px] cursor-grab active:cursor-grabbing relative flex items-center justify-center rounded-2xl bg-black/40 border border-amber-900/30 shadow-inner overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20 text-xs text-amber-200 pointer-events-none">
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span className="font-sans tracking-widest uppercase">Gaze into the Orb</span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/30 text-xs font-mono text-amber-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Magic Aura: {magicLevel}%</span>
        </div>

        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-xl p-3 rounded-2xl border border-amber-500/20 flex items-center gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-sans font-bold text-amber-500 block tracking-widest">Inner Sight</span>
              <span className="text-sm font-extrabold font-serif text-amber-100 flex items-center gap-1">
                <span>Revealing True Identity</span>
              </span>
            </div>
          </div>
        </div>

        {onScanClick && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={onScanClick}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-amber-50 font-serif font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 transition-all transform hover:scale-105 border border-amber-400/30"
            >
              <Wand2 className="w-4 h-4" />
              <span>Cast Identity Spell</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-amber-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex justify-between text-[10px] font-sans font-bold tracking-widest text-amber-600 mb-1">
            <span>MAGICAL ESSENCE FLUCTUATION</span>
            <span className="text-amber-400">Stable Resonance</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width={450} 
            height={50} 
            className="w-full h-12 bg-black/40 rounded-xl border border-amber-900/30" 
          />
        </div>

        <div className="w-full md:w-1/3 flex items-center justify-end gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-amber-900/30 w-full text-center">
            <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold text-amber-600 block mb-1">Purity</span>
            <span className="font-serif text-amber-400 font-bold text-sm">99.8%</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-amber-900/30 w-full text-center">
            <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold text-amber-600 block mb-1">Status</span>
            <span className="font-serif text-green-400 font-bold text-sm">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
