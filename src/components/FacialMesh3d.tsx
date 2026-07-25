import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Eye, Zap, RotateCcw, Scan, ShieldCheck, User } from "lucide-react";

interface FacialMesh3dProps {
  onScanClick?: () => void;
}

export const FacialMesh3d: React.FC<FacialMesh3dProps> = ({ onScanClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [scanBeamY, setScanBeamY] = useState<number>(0);
  const [wireframeColor, setWireframeColor] = useState<string>("cyan");
  const pulseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 440;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    
    // 2. Camera Setup (Frontal portrait perspective matching reference image)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 13.5);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 4. Construct High-Density Anatomical Human Head Mesh
    const createHighDensityHeadGeometry = () => {
      // High-density sphere resolution for detailed wireframe grid
      const geom = new THREE.SphereGeometry(3.6, 96, 96);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const isFront = z > 0;

        if (isFront) {
          // 1. Jawline & Chin Taper
          if (y < -0.4) {
            const jawFactor = 1 - 0.38 * Math.min(1, (-0.4 - y) / 3.0);
            x *= jawFactor;
          }

          // 2. Forehead Dome (y > 1.4)
          if (y > 1.4) {
            z += 0.22 * Math.sin(((y - 1.4) / 2.2) * Math.PI);
          }

          // 3. Eyebrow Ridges (y ~ 1.2 to 1.8)
          const browDist = Math.abs(y - 1.35);
          if (browDist < 0.45 && Math.abs(x) < 2.2) {
            z += 0.38 * (1 - browDist / 0.45) * (1 - Math.abs(x) / 2.3);
          }

          // 4. Eye Sockets & Orbit (x ~ ±1.25, y ~ 0.85)
          const leftEyeDist = Math.sqrt(Math.pow(x + 1.25, 2) + Math.pow(y - 0.85, 2));
          const rightEyeDist = Math.sqrt(Math.pow(x - 1.25, 2) + Math.pow(y - 0.85, 2));
          const minEyeDist = Math.min(leftEyeDist, rightEyeDist);

          if (minEyeDist < 0.9) {
            // Depress eye orbit socket
            z -= 0.7 * (1 - minEyeDist / 0.9);
          }

          // 5. Nose Bridge, Tip & Nostril Wings (y from -0.5 to 1.2)
          if (y > -0.5 && y < 1.2 && Math.abs(x) < 0.95) {
            const noseT = (y + 0.5) / 1.7; // 0 to 1
            const noseWidthFactor = 1 - Math.abs(x) / 0.95;
            
            // Bridge protrusion
            z += 0.85 * Math.sin(noseT * Math.PI) * noseWidthFactor;

            // Tip prominence (y ~ -0.05)
            const tipDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y + 0.05, 2));
            if (tipDist < 0.5) {
              z += 0.6 * (1 - tipDist / 0.5);
            }

            // Nostril wings (x ~ ±0.45, y ~ -0.2)
            const leftNostril = Math.sqrt(Math.pow(x + 0.45, 2) + Math.pow(y + 0.2, 2));
            const rightNostril = Math.sqrt(Math.pow(x - 0.45, 2) + Math.pow(y + 0.2, 2));
            if (Math.min(leftNostril, rightNostril) < 0.35) {
              z += 0.3 * (1 - Math.min(leftNostril, rightNostril) / 0.35);
            }
          }

          // 6. Cheekbones (y ~ 0.0 to 0.7, x ~ ±1.8)
          const leftCheek = Math.sqrt(Math.pow(x + 1.8, 2) + Math.pow(y - 0.2, 2));
          const rightCheek = Math.sqrt(Math.pow(x - 1.8, 2) + Math.pow(y - 0.2, 2));
          if (Math.min(leftCheek, rightCheek) < 1.1) {
            z += 0.42 * (1 - Math.min(leftCheek, rightCheek) / 1.1);
          }

          // 7. Lips & Philtrum (y ~ -0.9, x < 1.1)
          const mouthDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y + 0.9, 2));
          if (mouthDist < 1.15) {
            const lipVal = Math.sin((1 - mouthDist / 1.15) * Math.PI);
            z += 0.48 * lipVal;

            // Seam between lips
            if (Math.abs(y + 0.9) < 0.1 && Math.abs(x) < 0.75) {
              z -= 0.25;
            }
          }

          // 8. Chin Projection (y ~ -2.7)
          const chinDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y + 2.7, 2));
          if (chinDist < 0.8) {
            z += 0.5 * (1 - chinDist / 0.8);
          }

        } else {
          // Back of skull
          z *= 0.88;
          if (y < -1.0) x *= 0.85;
        }

        pos.setXYZ(i, x, y, z);
      }

      geom.computeVertexNormals();
      return geom;
    };

    // 5. Create Ears Geometry
    const createEarGeometry = (isRight: boolean) => {
      const earGroup = new THREE.Group();
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.bezierCurveTo(0.8, 0.4, 1.2, 1.5, 0.6, 2.2);
      earShape.bezierCurveTo(0.2, 2.6, -0.6, 2.4, -0.7, 1.8);
      earShape.bezierCurveTo(-0.8, 1.2, -0.4, 0.4, 0, 0);

      const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 8
      };
      const earGeom = new THREE.ExtrudeGeometry(earShape, extrudeSettings);
      earGeom.center();

      const earMat = new THREE.MeshBasicMaterial({
        color: wireframeColor === "emerald" ? 0x10b981 : wireframeColor === "rose" ? 0xf43f5e : 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });

      const earMesh = new THREE.Mesh(earGeom, earMat);
      earMesh.position.set(isRight ? 3.35 : -3.35, 0.3, 0.1);
      earMesh.rotation.y = isRight ? -0.45 : 0.45;
      earMesh.rotation.z = isRight ? -0.1 : 0.1;

      earGroup.add(earMesh);
      return earGroup;
    };

    const headGeometry = createHighDensityHeadGeometry();

    // Wireframe Line Material matching reference image
    const wireframeColorHex = wireframeColor === "emerald" ? 0x10b981 : wireframeColor === "rose" ? 0xf43f5e : 0x38bdf8;

    const mainWireframeMat = new THREE.MeshBasicMaterial({
      color: wireframeColorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    const headWireframeMesh = new THREE.Mesh(headGeometry, mainWireframeMat);

    // Inner subtle glow mesh
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: wireframeColorHex,
      transparent: true,
      opacity: 0.08
    });
    const innerGlowMesh = new THREE.Mesh(headGeometry, innerGlowMat);

    const headGroup = new THREE.Group();
    headGroup.add(headWireframeMesh);
    headGroup.add(innerGlowMesh);

    // Add Ears
    headGroup.add(createEarGeometry(false));
    headGroup.add(createEarGeometry(true));

    scene.add(headGroup);

    // 6. High-Density Wireframe Eyeballs & Irises
    const createWireframeEye = (x: number, y: number, z: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, y, z);

      // Wireframe Eyeball Sphere
      const eyeGeom = new THREE.SphereGeometry(0.48, 24, 24);
      const eyeMat = new THREE.MeshBasicMaterial({
        color: wireframeColorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      eyeGroup.add(eyeMesh);

      // Inner Iris Rings
      const irisGeom = new THREE.TorusGeometry(0.24, 0.04, 16, 32);
      const irisMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.95
      });
      const irisMesh = new THREE.Mesh(irisGeom, irisMat);
      irisMesh.position.z = 0.42;
      eyeGroup.add(irisMesh);

      return eyeGroup;
    };

    const leftEye = createWireframeEye(-1.25, 0.85, 2.65);
    const rightEye = createWireframeEye(1.25, 0.85, 2.65);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // 7. Scanning Laser Beam Line
    const beamGeom = new THREE.PlaneGeometry(9.0, 0.15);
    const beamMat = new THREE.MeshBasicMaterial({
      color: wireframeColorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const scanBeam = new THREE.Mesh(beamGeom, beamMat);
    scanBeam.position.z = 3.6;
    scene.add(scanBeam);

    // 8. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(wireframeColorHex, 4, 30);
    pointLight.position.set(6, 6, 10);
    scene.add(pointLight);

    // 9. Interactive Mouse Drag & Gaze Tracking
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
        // Gaze tracking towards cursor
        targetRotationY = normX * 0.35;
        targetRotationX = -normY * 0.2;
      }

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

      // Animate laser scan sweep (-3.8 to +3.8)
      const beamY = Math.sin(elapsedTime * 2.2) * 3.8;
      scanBeam.position.y = beamY;
      setScanBeamY(Math.round(((beamY + 3.8) / 7.6) * 100));

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
  }, [wireframeColor]);

  // 11. Optical rPPG Signal Canvas Loop
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

      const cycle = step % 40;
      let val = 24;
      if (cycle < 15) {
        val = 24 - Math.sin((cycle / 15) * Math.PI) * 16;
      } else if (cycle > 20 && cycle < 30) {
        val = 24 - Math.sin(((cycle - 20) / 10) * Math.PI) * 6;
      } else {
        val = 24 + (Math.random() - 0.5) * 1.2;
      }

      points.push(val);
      if (points.length > canvas.width) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = wireframeColor === "emerald" ? "#10b981" : wireframeColor === "rose" ? "#f43f5e" : "#38bdf8";
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
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
  }, [wireframeColor]);

  return (
    <div className="relative w-full rounded-3xl bg-[#030712] border border-white/10 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
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
              High-Density 3D Wireframe Head Scan
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Cybernetic Human Face 3D</span>
          </h2>
        </div>

        {/* Color Palette Toggle */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setWireframeColor("cyan")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              wireframeColor === "cyan" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Cyan
          </button>
          <button
            onClick={() => setWireframeColor("emerald")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              wireframeColor === "emerald" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Emerald
          </button>
          <button
            onClick={() => setWireframeColor("rose")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              wireframeColor === "rose" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            Rose
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Rendering Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-[360px] sm:h-[420px] cursor-grab active:cursor-grabbing relative flex items-center justify-center rounded-2xl bg-black border border-white/5 shadow-inner overflow-hidden"
      >
        {/* Floating Hint */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-neutral-300 pointer-events-none">
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Move Cursor / Drag to Orbit 3D Wireframe Face</span>
        </div>

        {/* Laser Sweep Status Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <Scan className="w-3.5 h-3.5 animate-pulse" />
          <span>Laser Sweep: {scanBeamY}%</span>
        </div>

        {/* Floating Biometric ROI Boxes */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-neutral-950/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">Wireframe Resolution</span>
              <span className="text-sm font-extrabold font-mono text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>96x96 Quad Grid (Anatomical)</span>
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
            className="w-full h-12 bg-black rounded-xl border border-white/5" 
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
