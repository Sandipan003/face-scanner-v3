import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Wand2, Eye, Sparkles } from "lucide-react";

interface ProphecyOrb3dProps {
  onScanClick?: () => void;
}

export const ProphecyOrb3d: React.FC<ProphecyOrb3dProps> = ({ onScanClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [magicLevel, setMagicLevel] = useState(88);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // ==========================================
    // 🔮 THE CRYSTAL BALL SHELL
    // ==========================================
    const orbGeom = new THREE.SphereGeometry(3.2, 64, 64);
    
    // Create an artificial environment map for glassy reflections
    const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 100, renderTarget);
    scene.add(cubeCamera);

    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      metalness: 0,
      roughness: 0.1,
      ior: 1.5,
      thickness: 0.5,
      specularIntensity: 2.0,
      specularColor: new THREE.Color(0xffffff),
      envMap: renderTarget.texture,
      transparent: true,
      side: THREE.FrontSide
    });

    const orbMesh = new THREE.Mesh(orbGeom, orbMat);
    orbGroup.add(orbMesh);

    // Subtle inner glow sphere (Additive Blending)
    const glowGeom = new THREE.SphereGeometry(3.1, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    orbGroup.add(glowMesh);

    // ==========================================
    // 🌌 INNER SWIRLING MAGIC & CORE
    // ==========================================
    
    // Solid energy core
    const coreGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    orbGroup.add(coreMesh);

    // Swirling Particles
    const particleCount = 600;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount * 2); // theta, phi
    const particleRadii = new Float32Array(particleCount);

    const colorGold = new THREE.Color(0xffd700);
    const colorCrimson = new THREE.Color(0xff0000);
    const colorPurple = new THREE.Color(0x9370db);

    for (let i = 0; i < particleCount; i++) {
      // Random position inside the orb
      const r = 1.3 + Math.random() * 1.6;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particleRadii[i] = r;
      particleAngles[i * 2] = theta;
      particleAngles[i * 2 + 1] = phi;

      particlePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = r * Math.cos(phi);

      let color = colorGold;
      const rand = Math.random();
      if (rand > 0.6) color = colorCrimson;
      if (rand > 0.85) color = colorPurple;

      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;

      particleSpeeds[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Glowy particles texture
    const generateParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const context = canvas.getContext('2d')!;
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(canvas);
    };

    const particleMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      map: generateParticleTexture(),
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    orbGroup.add(particles);

    // ==========================================
    // 🏆 ORNATE STAND (GOLDEN BASE)
    // ==========================================
    const standGroup = new THREE.Group();
    
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Metallic Gold
      metalness: 1.0,
      roughness: 0.2,
      envMap: renderTarget.texture
    });

    // Top ring holding the orb
    const ringGeom = new THREE.TorusGeometry(2.2, 0.15, 16, 64);
    const ringMesh = new THREE.Mesh(ringGeom, standMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -2.8;
    standGroup.add(ringMesh);

    // Base pedestal
    const baseGeom = new THREE.CylinderGeometry(2.6, 3.2, 0.8, 32);
    const baseMesh = new THREE.Mesh(baseGeom, standMat);
    baseMesh.position.y = -3.3;
    standGroup.add(baseMesh);

    // Bottom lip
    const lipGeom = new THREE.TorusGeometry(3.2, 0.2, 16, 64);
    const lipMesh = new THREE.Mesh(lipGeom, standMat);
    lipMesh.rotation.x = Math.PI / 2;
    lipMesh.position.y = -3.7;
    standGroup.add(lipMesh);
    
    scene.add(standGroup);

    // ==========================================
    // 💡 LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffa500, 20, 30);
    pointLight.position.set(0, 0, 0); // Inside the orb
    scene.add(pointLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 100);
    spotLight.position.set(10, 15, 10);
    spotLight.lookAt(0, 0, 0);
    scene.add(spotLight);

    const rimLight = new THREE.SpotLight(0xff0000, 50);
    rimLight.position.set(-10, -10, -10);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // ==========================================
    // 🖱 INTERACTION & ANIMATION
    // ==========================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        
        // Limit X rotation
        targetRotationX = Math.max(-0.5, Math.min(0.5, targetRotationX));
        
        previousMousePosition = { x: clientX, y: clientY };
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

    // A fake scene for generating reflections
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x111111);
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(2,20,2), new THREE.MeshBasicMaterial({color: 0xffaa00}));
    box1.position.set(10, 0, -10);
    envScene.add(box1);
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(5,5,1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    box2.position.set(-10, 5, -5);
    envScene.add(box2);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Rotate Orb and Particles
      orbGroup.rotation.y += (targetRotationY - orbGroup.rotation.y) * 0.1;
      orbGroup.rotation.x += (targetRotationX - orbGroup.rotation.x) * 0.1;
      
      // Auto slow spin
      targetRotationY += 0.002;

      // Update particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const r = particleRadii[i];
        let theta = particleAngles[i * 2];
        let phi = particleAngles[i * 2 + 1];

        // Animate angles
        theta += particleSpeeds[i] * 0.01;
        phi += Math.sin(elapsedTime * particleSpeeds[i]) * 0.005;

        // Save back
        particleAngles[i * 2] = theta;
        particleAngles[i * 2 + 1] = phi;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Core pulsing
      coreMesh.scale.setScalar(1.0 + Math.sin(elapsedTime * 3) * 0.05);

      // Render environment map for reflections
      orbMesh.visible = false;
      cubeCamera.position.copy(orbMesh.position);
      cubeCamera.update(renderer, scene);
      // We render envScene to get nice reflections, but also include scene objects
      cubeCamera.update(renderer, envScene);
      orbMesh.visible = true;

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
      if (container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      orbGeom.dispose();
      orbMat.dispose();
      glowGeom.dispose();
      glowMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      ringGeom.dispose();
      baseGeom.dispose();
      standMat.dispose();
    };
  }, []);

  // Sync canvas background logic from BiometricHeart3d
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const drawMagic = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      // Create a smooth, magical energy wave
      for (let i = 0; i < width; i++) {
        // Smooth sine waves combining low and medium frequencies
        const wave1 = Math.sin((i * 0.01) + offset) * 15;
        const wave2 = Math.sin((i * 0.03) - offset * 1.5) * 8;
        const wave3 = Math.sin((i * 0.07) + offset * 2) * 3;
        
        ctx.lineTo(i, height / 2 + wave1 + wave2 + wave3);
      }

      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)"; // Amber glow
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; // White hot core
      ctx.lineWidth = 1;
      ctx.stroke();

      offset += 0.05;
      animId = requestAnimationFrame(drawMagic);
    };

    drawMagic();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-amber-400">
              Divination Core Active
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-amber-100 mt-1 flex items-center gap-2 text-glow-gold font-serif">
            <span>The Prophecy Orb</span>
          </h2>
        </div>
      </div>

      <div className="w-full h-[360px] sm:h-[420px] relative rounded-2xl bg-black/40 border border-amber-900/30 shadow-inner overflow-hidden">
        {/* Three.js Canvas Container */}
        <div 
          ref={mountRef} 
          className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
        />

        {/* UI Overlays */}
        <button 
          onClick={onScanClick}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20 text-xs text-amber-200 font-sans cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transform duration-200"
        >
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span className="tracking-widest uppercase">Gaze into the Orb</span>
        </button>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/30 text-xs font-mono text-amber-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Magic Aura: {magicLevel}%</span>
        </div>

        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-xl p-3 rounded-2xl border border-amber-500/20 flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
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

      <div className="mt-6 pt-4 border-t border-amber-900/30 flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
        <div className="w-full md:w-2/3">
          <div className="flex justify-between text-[10px] font-bold tracking-widest text-amber-600 mb-1">
            <span>MAGICAL ESSENCE FLUCTUATION</span>
            <span className="text-amber-400">Stable Resonance</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width={450} 
            height={60} 
            className="w-full h-[60px] rounded-xl bg-black/60 border border-amber-900/40"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="flex-1 p-3 rounded-2xl bg-black/40 border border-amber-900/30 text-center">
            <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Purity</span>
            <span className="font-serif text-amber-100 font-bold text-xl">99.8%</span>
          </div>
          <div className="flex-1 p-3 rounded-2xl bg-black/40 border border-amber-900/30 text-center">
            <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Status</span>
            <span className="font-serif text-emerald-400 font-bold text-xl">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
