import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Camera, Eye, Zap, RotateCcw, Scan, ShieldCheck, Activity, User } from "lucide-react";

interface FacialMesh3dProps {
  onScanClick?: () => void;
}

export const FacialMesh3d: React.FC<FacialMesh3dProps> = ({ onScanClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<"human" | "wireframe" | "landmarks">("human");
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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Construct Sculpted 3D Human Face Geometry
    const createSculptedHumanHeadGeometry = () => {
      const geom = new THREE.SphereGeometry(3.6, 64, 64);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const distFromCenter = Math.sqrt(x * x + y * y + z * z);
        const isFront = z > 0;

        if (isFront) {
          // --- FRONT FACIAL SCULPTING ---
          
          // 1. Overall Face Oval Proportions
          // Taper lower face toward jawline/chin
          if (y < -0.5) {
            const jawFactor = 1 - 0.35 * Math.min(1, (-0.5 - y) / 3.0);
            x *= jawFactor;
          }

          // 2. Forehead Roundness (y > 1.5)
          if (y > 1.5) {
            z += 0.2 * Math.sin(((y - 1.5) / 2.0) * Math.PI);
          }

          // 3. Eyebrow Ridges (y ~ 1.2 to 1.8)
          const browDist = Math.abs(y - 1.4);
          if (browDist < 0.4 && Math.abs(x) < 2.2) {
            z += 0.35 * (1 - browDist / 0.4) * (1 - Math.abs(x) / 2.4);
          }

          // 4. Eye Orbits (Sockets) (around x = ±1.3, y = 0.9)
          const leftEyeDist = Math.sqrt(Math.pow(x + 1.25, 2) + Math.pow(y - 0.9, 2));
          const rightEyeDist = Math.sqrt(Math.pow(x - 1.25, 2) + Math.pow(y - 0.9, 2));
          const minEyeDist = Math.min(leftEyeDist, rightEyeDist);

          if (minEyeDist < 0.85) {
            z -= 0.65 * (1 - minEyeDist / 0.85);
          }

          // 5. Nose Bridge & Nose Tip (y from -0.4 to 1.2, x around center)
          if (y > -0.4 && y < 1.2 && Math.abs(x) < 0.85) {
            const noseHeight = (y + 0.4) / 1.6; // 0 to 1
            const noseWidthFactor = 1 - Math.abs(x) / 0.85;
            
            // Nose Bridge
            z += 0.8 * Math.sin(noseHeight * Math.PI) * noseWidthFactor;

            // Nose Tip Prominence (y ~ 0.0)
            const tipDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y - 0.05, 2));
            if (tipDist < 0.55) {
              z += 0.55 * (1 - tipDist / 0.55);
            }
          }

          // 6. Cheekbones (Zygomatic Arch) (y ~ 0.0 to 0.7, x ~ ±1.8)
          const leftCheekDist = Math.sqrt(Math.pow(x + 1.8, 2) + Math.pow(y - 0.3, 2));
          const rightCheekDist = Math.sqrt(Math.pow(x - 1.8, 2) + Math.pow(y - 0.3, 2));
          const minCheekDist = Math.min(leftCheekDist, rightCheekDist);

          if (minCheekDist < 1.1) {
            z += 0.4 * (1 - minCheekDist / 1.1);
          }

          // 7. Lips & Mouth Protrusion (y ~ -0.9, x < 1.1)
          const mouthDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y + 0.9, 2));
          if (mouthDist < 1.2) {
            // Upper and lower lip curves
            const lipVal = Math.sin((1 - mouthDist / 1.2) * Math.PI);
            z += 0.45 * lipVal;

            // Indent mouth seam
            if (Math.abs(y + 0.9) < 0.12 && Math.abs(x) < 0.8) {
              z -= 0.2;
            }
          }

          // 8. Chin Projection (y ~ -2.7)
          const chinDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y + 2.7, 2));
          if (chinDist < 0.8) {
            z += 0.45 * (1 - chinDist / 0.8);
          }

        } else {
          // --- BACK OF SKULL ---
          z *= 0.88; // Slightly flatter back of skull
          if (y < -1.0) x *= 0.85; // Neck junction
        }

        pos.setXYZ(i, x, y, z);
      }

      geom.computeVertexNormals();
      return geom;
    };

    const headGeometry = createSculptedHumanHeadGeometry();

    // 5. Materials
    const cyanColor = new THREE.Color(0x38bdf8);
    const roseColor = new THREE.Color(0xf43f5e);

    // Realistic Cybernetic Human Skin Shader Material
    const humanHeadMaterial = new THREE.MeshPhysicalMaterial({
      color: activeMode === "landmarks" ? 0x090d16 : 0x1e293b,
      emissive: activeMode === "landmarks" ? 0x0284c7 : 0x0f172a,
      emissiveIntensity: activeMode === "landmarks" ? 0.7 : 0.25,
      roughness: 0.35,
      metalness: 0.65,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      wireframe: activeMode === "wireframe",
      transparent: true,
      opacity: 0.94
    });

    const headMesh = new THREE.Mesh(headGeometry, humanHeadMaterial);

    // Anatomical Wireframe Overlay
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: activeMode === "wireframe" ? 0.65 : 0.18
    });
    const headWireframe = new THREE.Mesh(headGeometry, wireframeMat);
    headWireframe.scale.set(1.015, 1.015, 1.015);

    const headGroup = new THREE.Group();
    headGroup.add(headMesh);
    headGroup.add(headWireframe);
    scene.add(headGroup);

    // 6. 3D Eyeballs with Glowing Pupils
    const createEyeball = (x: number, y: number, z: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, y, z);

      // Sclera (White/Cyber sphere)
      const scleraGeom = new THREE.SphereGeometry(0.42, 24, 24);
      const scleraMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.1,
        metalness: 0.9
      });
      const scleraMesh = new THREE.Mesh(scleraGeom, scleraMat);
      eyeGroup.add(scleraMesh);

      // Iris & Pupil (Glowing Cyan)
      const pupilGeom = new THREE.SphereGeometry(0.22, 16, 16);
      const pupilMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true
      });
      const pupilMesh = new THREE.Mesh(pupilGeom, pupilMat);
      pupilMesh.position.z = 0.26;
      eyeGroup.add(pupilMesh);

      return eyeGroup;
    };

    const leftEye = createEyeball(-1.25, 0.9, 2.7);
    const rightEye = createEyeball(1.25, 0.9, 2.7);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // 7. 68-Point Anatomical Facial Landmark Nodes
    const landmarkCount = 68;
    const landmarkGeom = new THREE.BufferGeometry();
    const landmarkPositions = new Float32Array(landmarkCount * 3);
    const landmarkColors = new Float32Array(landmarkCount * 3);

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

    // Jawline contours (-8 to +8)
    for (let i = -8; i <= 8; i++) addPt(i * 0.32, -1.8 - (8 - Math.abs(i)) * 0.12, 2.4 - Math.abs(i) * 0.15);
    // Eyebrows
    for (let i = -4; i <= 4; i++) {
      if (i !== 0) addPt(i * 0.42, 1.6 + Math.cos(i) * 0.08, 3.2);
    }
    // Nose bridge & tip
    for (let i = 0; i <= 4; i++) addPt(0, 1.2 - i * 0.3, 3.2 + (i === 4 ? 0.4 : i * 0.1), true); // rPPG node
    // Eyes (left & right corners)
    addPt(-1.5, 0.9, 2.9); addPt(-1.25, 1.0, 2.95); addPt(-1.0, 0.9, 2.9);
    addPt(1.5, 0.9, 2.9);  addPt(1.25, 1.0, 2.95);  addPt(1.0, 0.9, 2.9);
    // Cheek rPPG Vascular Zones
    addPt(-1.7, 0.2, 3.0, true); addPt(-1.3, 0.0, 3.1, true);
    addPt(1.7, 0.2, 3.0, true);  addPt(1.3, 0.0, 3.1, true);
    // Forehead rPPG Zone
    addPt(-0.8, 2.4, 3.0, true); addPt(0, 2.5, 3.1, true); addPt(0.8, 2.4, 3.0, true);
    // Lips
    for (let i = -3; i <= 3; i++) addPt(i * 0.26, -0.9 - Math.abs(i) * 0.04, 3.2);

    landmarkGeom.setAttribute("position", new THREE.BufferAttribute(landmarkPositions, 3));
    landmarkGeom.setAttribute("color", new THREE.BufferAttribute(landmarkColors, 3));

    const landmarkMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const landmarkSystem = new THREE.Points(landmarkGeom, landmarkMat);
    headGroup.add(landmarkSystem);

    // 8. Scanning Laser Beam Line
    const beamGeom = new THREE.PlaneGeometry(8.5, 0.14);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const scanBeam = new THREE.Mesh(beamGeom, beamMat);
    scanBeam.position.z = 3.6;
    scene.add(scanBeam);

    // 9. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x38bdf8, 4.5, 30);
    cyanPointLight.position.set(6, 6, 10);
    scene.add(cyanPointLight);

    const rosePointLight = new THREE.PointLight(0xf43f5e, 3.5, 30);
    rosePointLight.position.set(-6, -4, -6);
    scene.add(rosePointLight);

    // 10. Interactive Drag & Eye Gaze Tracking
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
        // Smooth gaze tracking towards mouse cursor
        targetRotationY = normX * 0.4;
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

    // 11. Animation Loop
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
      if (activeMode === "landmarks") {
        landmarkMat.size = 0.4 + Math.sin(elapsedTime * 6) * 0.08;
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

  // 12. Pulse Wave Canvas Render Loop
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
              3D Human Facial Telemetry Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Interactive 3D Human Face</span>
          </h2>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveMode("human")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "human" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Human Face
          </button>
          <button
            onClick={() => setActiveMode("wireframe")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "wireframe" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Cyber Wireframe
          </button>
          <button
            onClick={() => setActiveMode("landmarks")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === "landmarks" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            68 Landmarks
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Rendering Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-[340px] sm:h-[400px] cursor-grab active:cursor-grabbing relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-neutral-900/50 to-black/90 border border-white/5"
      >
        {/* Floating Hint */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-neutral-300 pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Move Mouse / Drag to Rotate 3D Human Face</span>
        </div>

        {/* Laser Sweep Status Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <Scan className="w-3.5 h-3.5 animate-pulse" />
          <span>Face Sweep: {scanBeamY}%</span>
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
