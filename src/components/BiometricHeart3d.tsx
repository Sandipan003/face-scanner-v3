import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Heart, Zap, RotateCcw } from "lucide-react";

interface BiometricHeart3dProps {
  initialBpm?: number;
  onScanClick?: () => void;
}

export const BiometricHeart3d: React.FC<BiometricHeart3dProps> = ({ 
  initialBpm = 72,
  onScanClick 
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [activeTab, setActiveTab] = useState<"cardiac" | "rppg" | "mesh">("cardiac");

  // Canvas for ECG graph
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Create Parametric 3D Heart Geometry
    const createHeartGeometry = () => {
      const shape = new THREE.Shape();
      const x = 0, y = 0;
      shape.moveTo(x + 2.5, y + 2.5);
      shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
      shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
      shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
      shape.bezierCurveTo(x + 6.5, y + 7.7, x + 8, y + 5.5, x + 8, y + 3.5);
      shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
      shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

      const extrudeSettings = {
        steps: 2,
        depth: 2.2,
        bevelEnabled: true,
        bevelThickness: 1.2,
        bevelSize: 1.2,
        bevelOffset: 0,
        bevelSegments: 16
      };

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      // Rotate upright
      geom.rotateZ(Math.PI);
      return geom;
    };

    const heartGeometry = createHeartGeometry();

    // 5. Create Holographic / Cardiac Materials
    const heartMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: activeTab === "mesh",
      transparent: true,
      opacity: 0.92
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    // Outer wireframe shell
    const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial);
    const heartWireframe = new THREE.Mesh(heartGeometry, wireframeMaterial);
    heartWireframe.scale.set(1.06, 1.06, 1.06);

    const heartGroup = new THREE.Group();
    heartGroup.add(heartMesh);
    heartGroup.add(heartWireframe);
    scene.add(heartGroup);

    // 6. Glowing Inner Core Orb
    const coreGeom = new THREE.IcosahedronGeometry(2.2, 4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    heartGroup.add(coreMesh);

    // 7. Orbiting Biometric Particle Ring
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0xf43f5e); // Rose
    const color2 = new THREE.Color(0x38bdf8); // Cyan
    const color3 = new THREE.Color(0x818cf8); // Indigo

    for (let i = 0; i < particleCount; i++) {
      const radius = 6.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.5;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const mixedColor = color1.clone().lerp(i % 2 === 0 ? color2 : color3, Math.random());
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 8. Expanding Shockwave Pulse Rings
    const pulseRingGeom = new THREE.RingGeometry(4, 4.2, 64);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const pulseRing = new THREE.Mesh(pulseRingGeom, pulseRingMat);
    pulseRing.rotation.x = Math.PI / 2;
    scene.add(pulseRing);

    // 9. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xf43f5e, 4, 30);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x38bdf8, 3, 30);
    blueLight.position.set(-8, -5, -5);
    scene.add(blueLight);

    // Mouse Tracking & Drag Orbiting
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;

        previousMousePosition = { x: clientX, y: clientY };
      }

      // Move light with mouse
      const rect = container.getBoundingClientRect();
      const normX = ((clientX - rect.left) / width) * 2 - 1;
      const normY = -((clientY - rect.top) / height) * 2 + 1;
      pointLight.position.x = normX * 10;
      pointLight.position.y = normY * 10;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    domElem.addEventListener("touchstart", onPointerDown);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchend", onPointerUp);

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 10. Animation Loop
    const startTime = performance.now();
    let pulseScale = 1;
    let ringScale = 1;
    let ringOpacity = 0;

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) / 1000;
      
      // Calculate pulsation based on current BPM state
      const pulseSpeed = (bpm / 60) * Math.PI * 2;
      const beatCycle = (Math.sin(elapsedTime * pulseSpeed) + 1) / 2;
      // Double beat pulse curve (lub-dub)
      const beatFactor = Math.pow(beatCycle, 4) * 0.18 + Math.pow(Math.sin(elapsedTime * pulseSpeed * 2), 6) * 0.08;

      pulseScale = 1 + beatFactor;
      heartGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Smoothly interpolate rotation from mouse drag
      heartGroup.rotation.y += (targetRotationY - heartGroup.rotation.y) * 0.08;
      heartGroup.rotation.x += (targetRotationX - heartGroup.rotation.x) * 0.08;

      // Natural continuous slow rotation if not dragging
      if (!isDragging) {
        targetRotationY += 0.003;
      }

      // Rotate particle ring
      particleSystem.rotation.y = elapsedTime * 0.15;
      particleSystem.rotation.z = elapsedTime * 0.05;

      // Rotate core mesh inversely
      coreMesh.rotation.y = -elapsedTime * 0.5;
      coreMesh.rotation.x = elapsedTime * 0.3;

      // Animate shockwave ring on each beat peak
      if (beatFactor > 0.15 && ringOpacity <= 0) {
        ringScale = 1;
        ringOpacity = 0.8;
      }

      if (ringOpacity > 0) {
        ringScale += 0.15;
        ringOpacity -= 0.03;
        pulseRing.scale.set(ringScale, ringScale, ringScale);
        pulseRingMat.opacity = Math.max(0, ringOpacity);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
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
  }, [bpm, activeTab]);

  // 11. ECG Waveform Canvas Render Loop
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;
    const points: number[] = new Array(200).fill(25);

    const drawEcg = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      step++;
      const cycleLength = Math.round(3000 / bpm);
      const posInCycle = step % cycleLength;

      // Synthesize ECG P-Q-R-S-T wave
      let val = 25;
      if (posInCycle === 5) val = 20; // P wave
      else if (posInCycle === 10) val = 26;
      else if (posInCycle === 15) val = 30; // Q wave
      else if (posInCycle === 18) val = 5; // R peak
      else if (posInCycle === 22) val = 42; // S dip
      else if (posInCycle === 35) val = 18; // T wave
      else val = 25 + (Math.random() - 0.5) * 1.5; // Baseline noise

      points.push(val);
      if (points.length > canvas.width) {
        points.shift();
      }

      // Draw ECG Line
      ctx.beginPath();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 6;

      for (let x = 0; x < points.length; x++) {
        const y = points[x];
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawEcg);
    };

    drawEcg();

    return () => cancelAnimationFrame(animId);
  }, [bpm]);

  return (
    <div className="relative w-full rounded-3xl bg-neutral-950/70 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden group hover:border-rose-500/30 transition-all duration-500">
      {/* Glow highlight background effect */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-rose-400">
              Interactive 3D Biometric Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <span>Holographic Cardiac Model</span>
          </h2>
        </div>

        {/* Live Controls Bar */}
        <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setBpm(60)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bpm === 60 ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Rest (60)
          </button>
          <button
            onClick={() => setBpm(75)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bpm === 75 ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Active (75)
          </button>
          <button
            onClick={() => setBpm(110)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bpm === 110 ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Elevated (110)
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Rendering Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-[320px] sm:h-[380px] cursor-grab active:cursor-grabbing relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-neutral-900/40 to-black/80 border border-white/5"
      >
        {/* Floating Controls hint */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-neutral-300 pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Click & Drag to Rotate 3D Model</span>
        </div>

        {/* View Mode Toggle */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("cardiac")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
              activeTab === "cardiac" ? "bg-rose-500 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => setActiveTab("mesh")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
              activeTab === "mesh" ? "bg-rose-500 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Wireframe
          </button>
        </div>

        {/* Floating Telemetry Stats Badge */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-neutral-950/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">Current Heart Rate</span>
              <span className="text-xl font-extrabold font-mono text-white">{bpm} <span className="text-xs text-rose-400 font-normal">BPM</span></span>
            </div>
          </div>
        </div>

        {/* Live CTA overlay */}
        {onScanClick && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={onScanClick}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-rose-900/40 flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>Start Live rPPG Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-time ECG Waveform Graph Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
            <span>REAL-TIME ECG WAVEFORM OVERLAY</span>
            <span className="text-rose-400 font-bold">{bpm} BPM ({Math.round(60000 / bpm)} ms interval)</span>
          </div>
          <canvas 
            ref={ecgCanvasRef} 
            width={450} 
            height={50} 
            className="w-full h-12 bg-black/50 rounded-xl border border-white/5" 
          />
        </div>

        <div className="w-full md:w-1/3 flex items-center justify-end gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-full text-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500 block">HRV Resilience</span>
            <span className="font-mono text-purple-400 font-bold text-sm">{Math.round(85 - (bpm - 60) * 0.6)} ms</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-full text-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500 block">rPPG Quality</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">99.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
