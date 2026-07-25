import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Camera, Eye, Zap, RotateCcw, Scan, ShieldCheck, Activity } from "lucide-react";

interface FacialMesh3dProps {
  onScanClick?: () => void;
}

export const FacialMesh3d: React.FC<FacialMesh3dProps> = ({ onScanClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<"wireframe" | "rppg" | "nodes">("wireframe");
  const [scanBeamY, setScanBeamY] = useState<number>(0);
  const pulseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Create 3D Parametric Facial Head Model
    const createHeadGeometry = () => {
      // Create an anatomical head shape using Lathe + Deformation
      const points: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const angle = t * Math.PI;
        // Head profile curve (broader top for skull, narrower chin at bottom)
        let r = Math.sin(angle) * 3.4;
        if (t > 0.6) r *= (1 - (t - 0.6) * 0.7); // Taper chin
        if (t < 0.25) r *= (0.8 + t); // Crown curve
        const y = (0.5 - t) * 7.5;
        points.push(new THREE.Vector2(r, y));
      }

      const latheGeom = new THREE.LatheGeometry(points, 36);

      // Deform sphere/lathe to sculpt face features (eyes, nose, cheeks, jaw)
      const pos = latheGeom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Flatten back of head slightly, protrude front face (z > 0)
        if (z > 0) {
          z *= 1.35; // Pronounce face front
          
          // Nose bridge protrusion (y around 0.5 to 1.5, center x)
          if (Math.abs(x) < 1.0 && y > 0.2 && y < 1.8) {
            z += (1.0 - Math.abs(x)) * 0.9 * Math.sin((y - 0.2) / 1.6 * Math.PI);
          }

          // Eye sockets indentation (y around 1.2 to 2.2, x around 1.2)
          if (Math.abs(x) > 0.8 && Math.abs(x) < 2.2 && y > 1.0 && y < 2.4) {
            z -= 0.5 * (1 - Math.abs(Math.abs(x) - 1.5) / 0.7);
          }

          // Cheekbones (y around 0.0 to 0.8, x around 2.0)
          if (Math.abs(x) > 1.5 && y > -0.5 && y < 0.8) {
            z += 0.4;
          }

          // Mouth & Jaw structure (y < -0.8)
          if (y < -0.5) {
            x *= 0.85; // Taper jawline
          }
        } else {
          z *= 0.85; // Flatter back of skull
        }

        pos.setXYZ(i, x, y, z);
      }

      latheGeom.computeVertexNormals();
      return latheGeom;
    };

    const headGeometry = createHeadGeometry();

    // 5. Materials
    const cyanColor = new THREE.Color(0x38bdf8);
    const roseColor = new THREE.Color(0xf43f5e);
    const indigoColor = new THREE.Color(0x818cf8);

    // Solid Cybernetic Face Material
    const headMaterial = new THREE.MeshPhysicalMaterial({
      color: activeMode === "rppg" ? 0x0369a1 : 0x0f172a,
      emissive: activeMode === "rppg" ? 0x0284c7 : 0x1e1b4b,
      emissiveIntensity: activeMode === "rppg" ? 0.8 : 0.4,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    // Wireframe Mesh Shell
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: activeMode === "rppg" ? 0x38bdf8 : 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: activeMode === "wireframe" ? 0.6 : 0.25
    });

    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    const headWireframe = new THREE.Mesh(headGeometry, wireframeMaterial);
    headWireframe.scale.set(1.02, 1.02, 1.02);

    const headGroup = new THREE.Group();
    headGroup.add(headMesh);
    headGroup.add(headWireframe);
    scene.add(headGroup);

    // 6. 68-Point Facial Biometric Landmark Nodes
    const landmarkCount = 68;
    const landmarkGeom = new THREE.BufferGeometry();
    const landmarkPositions = new Float32Array(landmarkCount * 3);
    const landmarkColors = new Float32Array(landmarkCount * 3);

    // Generate realistic 68 facial landmark positions around eyebrows, eyes, nose, mouth, jaw
    let idx = 0;
    const addPt = (x: number, y: number, z: number, isVascular = false) => {
      if (idx < landmarkCount) {
        landmarkPositions[idx * 3] = x;
        landmarkPositions[idx * 3 + 1] = y;
        landmarkPositions[idx * 3 + 2] = z;

        const col = isVascular ? roseColor : cyanColor;
        landmarkColors[idx * 3] = col.r;
        landmarkColors[idx * 3 + 1] = col.g;
        landmarkColors[idx * 3 + 2] = col.b;
        idx++;
      }
    };

    // Jawline points (-8 to +8)
    for (let i = -8; i <= 8; i++) addPt(i * 0.32, -1.8 - (8 - Math.abs(i)) * 0.12, 2.2 - Math.abs(i) * 0.15);
    // Eyebrows
    for (let i = -4; i <= 4; i++) {
      if (i !== 0) addPt(i * 0.45, 1.9 + Math.cos(i) * 0.1, 2.8);
    }
    // Nose bridge & tip
    for (let i = 0; i <= 4; i++) addPt(0, 1.6 - i * 0.35, 3.1 + (i === 4 ? 0.3 : i * 0.1), true); // rPPG node
    // Eyes (left & right)
    addPt(-1.4, 1.4, 2.7); addPt(-1.1, 1.5, 2.7); addPt(-0.8, 1.4, 2.7);
    addPt(1.4, 1.4, 2.7);  addPt(1.1, 1.5, 2.7);  addPt(0.8, 1.4, 2.7);
    // Cheek rPPG Vascular Zones
    addPt(-1.8, 0.4, 2.7, true); addPt(-1.4, 0.2, 2.8, true);
    addPt(1.8, 0.4, 2.7, true);  addPt(1.4, 0.2, 2.8, true);
    // Forehead rPPG Zone
    addPt(-0.8, 2.6, 2.6, true); addPt(0, 2.7, 2.7, true); addPt(0.8, 2.6, 2.6, true);
    // Lips
    for (let i = -3; i <= 3; i++) addPt(i * 0.28, -0.9 - Math.abs(i) * 0.05, 2.8);

    landmarkGeom.setAttribute("position", new THREE.BufferAttribute(landmarkPositions, 3));
    landmarkGeom.setAttribute("color", new THREE.BufferAttribute(landmarkColors, 3));

    const landmarkMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const landmarkSystem = new THREE.Points(landmarkGeom, landmarkMat);
    headGroup.add(landmarkSystem);

    // 7. Scanning Laser Beam Line & Plane
    const beamGeom = new THREE.PlaneGeometry(8, 0.12);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const scanBeam = new THREE.Mesh(beamGeom, beamMat);
    scanBeam.position.z = 3.2;
    scene.add(scanBeam);

    // 8. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x38bdf8, 4, 30);
    cyanPointLight.position.set(6, 6, 10);
    scene.add(cyanPointLight);

    const rosePointLight = new THREE.PointLight(0xf43f5e, 3, 30);
    rosePointLight.position.set(-6, -4, -6);
    scene.add(rosePointLight);

    // 9. Interactive Drag & Cursor Eye-Tracking
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

      const rect = container.getBoundingClientRect();
      const normX = ((clientX - rect.left) / width) * 2 - 1;
      const normY = -((clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;

        previousMousePosition = { x: clientX, y: clientY };
      } else {
        // Subtle eye/head gaze tracking towards cursor
        targetRotationY = normX * 0.35;
        targetRotationX = -normY * 0.25;
      }

      cyanPointLight.position.x = normX * 10;
      cyanPointLight.position.y = normY * 10;
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

    // Window Resize Handler
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
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth head rotation interpolation
      headGroup.rotation.y += (targetRotationY - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (targetRotationX - headGroup.rotation.x) * 0.08;

      // Animate scanning laser beam sweeping up and down (-3.5 to +3.5)
      const beamY = Math.sin(elapsedTime * 2.2) * 3.5;
      scanBeam.position.y = beamY;
      setScanBeamY(Math.round(((beamY + 3.5) / 7) * 100));

      // Pulse landmark size/opacity for rPPG vascular nodes
      if (activeMode === "nodes") {
        landmarkMat.size = 0.38 + Math.sin(elapsedTime * 6) * 0.08;
      }

      // Rotate landmark system slightly for 3D depth effect
      landmarkSystem.rotation.y = Math.sin(elapsedTime * 0.5) * 0.04;

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
  }, [activeMode]);

  // 11. Pulse Wave Canvas Render Loop
  useEffect(() => {
    const canvas = pulseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;
    const points: number[] = new Array(220).fill(24);

    const drawPulse = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      step++;

      // Synthesize optical rPPG pulse wave
      const cycle = step % 40;
      let val = 24;
      if (cycle < 15) {
        val = 24 - Math.sin((cycle / 15) * Math.PI) * 16; // Primary Systolic Peak
      } else if (cycle > 20 && cycle < 30) {
        val = 24 - Math.sin(((cycle - 20) / 10) * Math.PI) * 6; // Dicrotic Notch
      } else {
        val = 24 + (Math.random() - 0.5) * 1.2;
      }

      points.push(val);
      if (points.length > canvas.width) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;

      for (let x = 0; x < points.length; x++) {
        const y = points[x];
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawPulse);
    };

    drawPulse();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full rounded-3xl bg-neutral-950/70 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
              Interactive 3D Facial Mesh Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <span>Optical rPPG Facial Telemetry</span>
          </h2>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveMode("wireframe")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "wireframe" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            3D Wireframe
          </button>
          <button
            onClick={() => setActiveMode("rppg")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "rppg" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Thermal rPPG
          </button>
          <button
            onClick={() => setActiveMode("nodes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "nodes" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            68-Landmarks
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Rendering Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-[320px] sm:h-[380px] cursor-grab active:cursor-grabbing relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-neutral-900/40 to-black/80 border border-white/5"
      >
        {/* Floating Hint */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-neutral-300 pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Move Mouse / Drag to Rotate Facial Mesh</span>
        </div>

        {/* Laser Sweep Status Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <Scan className="w-3.5 h-3.5 animate-pulse" />
          <span>Scan Sweep: {scanBeamY}%</span>
        </div>

        {/* Floating Biometric ROI Boxes */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-neutral-950/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">Facial Alignment</span>
              <span className="text-sm font-extrabold font-mono text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>68/68 Points Tracked</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live CTA Overlay */}
        {onScanClick && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={onScanClick}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-cyan-900/40 flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>Start Live Face Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-time Optical Pulse Waveform Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
            <span>REAL-TIME OPTICAL rPPG PULSE SIGNAL</span>
            <span className="text-cyan-400 font-bold">30 FPS Video Stream (Signalstats YAVG)</span>
          </div>
          <canvas 
            ref={pulseCanvasRef} 
            width={450} 
            height={50} 
            className="w-full h-12 bg-black/50 rounded-xl border border-white/5" 
          />
        </div>

        <div className="w-full md:w-1/3 flex items-center justify-end gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-full text-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500 block">Face Confidence</span>
            <span className="font-mono text-cyan-400 font-bold text-sm">99.8%</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-full text-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500 block">Liveness Index</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
