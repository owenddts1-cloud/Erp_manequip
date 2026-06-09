import React, { useEffect, useRef, useState } from 'react';

export const Motherboard3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = 680); // Increased canvas width for higher resolution
    let height = (canvas.height = 680); // Increased canvas height

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const perspective = 550;

    let angleY = 0.55; // Horizontal angle (tilted Y)
    let angleX = 0.65; // Vertical elevation angle (looking down)
    let time = 0;

    // Smooth rotation interpolation variables
    let targetAngleX = 0.65;
    let targetAngleY = 0.55;

    // --- 3D Projection Matrix ---
    const project = (x: number, y: number, z: number) => {
      // Global scale adjustment (increased to 1.35x for massive visual presence)
      const geomScale = 1.35; 
      const px = x * geomScale;
      const py = y * geomScale;
      const pz = z * geomScale;

      // Rotation Y
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = px * cosY - pz * sinY;
      const z1 = px * sinY + pz * cosY;

      // Rotation X
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y2 = py * cosX - z1 * sinX;
      const z2 = py * sinX + z1 * cosX;

      // Perspective Projection
      const scale = perspective / (perspective + z2);
      const screenX = x1 * scale + centerX;
      const screenY = centerY + y2 * scale; // Flipped Y so chip renders right-side up

      return { x: screenX, y: screenY, z: z2 };
    };

    // --- Helper: Draw 3D Line ---
    const drawLine3D = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      color: string,
      lineWidth: number,
      dash: number[] = []
    ) => {
      const pt1 = project(p1.x, p1.y, p1.z);
      const pt2 = project(p2.x, p2.y, p2.z);

      const avgZ = (pt1.z + pt2.z) / 2;
      const alpha = Math.max(0.1, Math.min(1.0, 1 - avgZ / 400));

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth * (1 - avgZ / 800);
      if (dash.length > 0) {
        ctx.setLineDash(dash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);
    };

    // --- Helper: Draw 3D Solid Polygon (Face) ---
    const drawFace3D = (
      vertices: Array<{ x: number; y: number; z: number }>,
      fillColor: string,
      strokeColor: string,
      strokeWidth = 1.0
    ) => {
      const projected = vertices.map(v => project(v.x, v.y, v.z));
      
      // Compute average Z depth
      const avgZ = projected.reduce((sum, p) => sum + p.z, 0) / projected.length;
      const alpha = Math.max(0.1, Math.min(1.0, 1 - avgZ / 400));

      ctx.beginPath();
      ctx.moveTo(projected[0].x, projected[0].y);
      for (let i = 1; i < projected.length; i++) {
        ctx.lineTo(projected[i].x, projected[i].y);
      }
      ctx.closePath();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillColor;
      ctx.fill();

      if (strokeColor && strokeColor !== 'none') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth * (1 - avgZ / 800);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    };

    // --- Helper: Draw 3D Solid Box ---
    const drawSolidBox3D = (
      xMin: number, xMax: number,
      yMin: number, yMax: number,
      zMin: number, zMax: number,
      fillColor: string,
      strokeColor: string,
      strokeWidth = 1.0
    ) => {
      const v = [
        { x: xMin, y: yMin, z: zMin }, // 0
        { x: xMax, y: yMin, z: zMin }, // 1
        { x: xMax, y: yMax, z: zMin }, // 2
        { x: xMin, y: yMax, z: zMin }, // 3
        { x: xMin, y: yMin, z: zMax }, // 4
        { x: xMax, y: yMin, z: zMax }, // 5
        { x: xMax, y: yMax, z: zMax }, // 6
        { x: xMin, y: yMax, z: zMax }  // 7
      ];

      // Draw faces (holographic overlapping)
      drawFace3D([v[0], v[1], v[5], v[4]], fillColor, strokeColor, strokeWidth); // Bottom
      drawFace3D([v[4], v[5], v[6], v[7]], fillColor, strokeColor, strokeWidth); // Back
      drawFace3D([v[0], v[4], v[7], v[3]], fillColor, strokeColor, strokeWidth); // Left
      drawFace3D([v[1], v[5], v[6], v[2]], fillColor, strokeColor, strokeWidth); // Right
      drawFace3D([v[0], v[1], v[2], v[3]], fillColor, strokeColor, strokeWidth); // Front
      drawFace3D([v[3], v[2], v[6], v[7]], fillColor, strokeColor, strokeWidth); // Top
    };

    // --- Motherboard Component Coordinates ---
    // 1. Vertical Pins ("palitinhos") - Increased density for a forest-like grid
    const pins: Array<{ x: number; z: number; baseHeight: number; color: string }> = [];
    
    // Left pin row group (representing jumper header blocks)
    for (let z = -90; z <= -20; z += 12) {
      pins.push({ x: -95, z, baseHeight: 34, color: '#eab308' }); // Gold
      pins.push({ x: -85, z, baseHeight: 34, color: '#eab308' });
    }
    
    // Top right header block
    for (let x = 60; x <= 110; x += 12) {
      for (let z = -90; z <= -50; z += 12) {
        pins.push({ x, z, baseHeight: 36, color: '#00d2ff' }); // Neon cyan pins
      }
    }

    // Bottom right header block
    for (let x = 60; x <= 110; x += 12) {
      for (let z = 50; z <= 90; z += 12) {
        pins.push({ x, z, baseHeight: 32, color: '#ec4899' }); // Pink pins
      }
    }

    // 2. Circuit Traces (Increased traces count for density)
    const traces: Array<Array<{ x: number; y: number; z: number }>> = [
      // Left side inputs
      [
        { x: -125, y: 0, z: -100 },
        { x: -80, y: 0, z: -100 },
        { x: -60, y: 0, z: -70 },
        { x: -45, y: 0, z: -45 }
      ],
      [
        { x: -125, y: 0, z: -80 },
        { x: -75, y: 0, z: -80 },
        { x: -60, y: 0, z: -55 },
        { x: -45, y: 0, z: -35 }
      ],
      [
        { x: -125, y: 0, z: 90 },
        { x: -80, y: 0, z: 90 },
        { x: -60, y: 0, z: 70 },
        { x: -45, y: 0, z: 45 }
      ],
      [
        { x: -125, y: 0, z: 70 },
        { x: -75, y: 0, z: 70 },
        { x: -60, y: 0, z: 50 },
        { x: -45, y: 0, z: 30 }
      ],
      // Extra bottom-left paths
      [
        { x: -125, y: 0, z: 0 },
        { x: -75, y: 0, z: 0 },
        { x: -55, y: 0, z: 15 },
        { x: -45, y: 0, z: 15 }
      ],
      // Bottom paths
      [
        { x: -20, y: 0, z: 125 },
        { x: -20, y: 0, z: 75 },
        { x: -15, y: 0, z: 45 }
      ],
      [
        { x: 20, y: 0, z: 125 },
        { x: 20, y: 0, z: 75 },
        { x: 15, y: 0, z: 45 }
      ],
      // Right side paths
      [
        { x: 125, y: 0, z: -10 },
        { x: 75, y: 0, z: -10 },
        { x: 45, y: 0, z: -10 }
      ],
      [
        { x: 125, y: 0, z: 10 },
        { x: 75, y: 0, z: 10 },
        { x: 45, y: 0, z: 10 }
      ],
      // Top inputs
      [
        { x: -40, y: 0, z: -125 },
        { x: -40, y: 0, z: -75 },
        { x: -30, y: 0, z: -45 }
      ],
      [
        { x: 40, y: 0, z: -125 },
        { x: 40, y: 0, z: -75 },
        { x: 30, y: 0, z: -45 }
      ],
      // Extra diagonal paths
      [
        { x: 125, y: 0, z: -110 },
        { x: 80, y: 0, z: -110 },
        { x: 60, y: 0, z: -70 },
        { x: 45, y: 0, z: -45 }
      ]
    ];

    // Tracking progress for active flowing data pulses along traces (Multiple pulses per trace)
    const pulseStates = traces.map(() => [
      { progress: Math.random(), speed: 0.007 + Math.random() * 0.009 },
      { progress: (Math.random() + 0.5) % 1.0, speed: 0.007 + Math.random() * 0.009 }
    ]);

    // --- Main Render Loop ---
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.02;

      // Handle hover rotation interpolation
      if (isHovered) {
        const rY = 0.55 + (mousePos.x / width - 0.5) * 0.6;
        const rX = 0.65 + (0.5 - mousePos.y / height) * 0.5;
        targetAngleX = rX;
        targetAngleY = rY;
      } else {
        targetAngleY = 0.55 + Math.sin(time * 0.15) * 0.2;
        targetAngleX = 0.65 + Math.cos(time * 0.25) * 0.05;
      }

      // Smooth interpolation (lerp)
      angleX += (targetAngleX - angleX) * 0.08;
      angleY += (targetAngleY - angleY) * 0.08;

      // ==============================================
      // 1. Draw Motherboard PCB Substrate (Base Plate)
      // ==============================================
      // Taller vertical dimension (yMin = -12, yMax = 0) for deep 3D volume
      const pcbColor = 'rgba(13, 27, 42, 0.75)'; // Deep charcoal/teal board
      const pcbStrokeColor = 'rgba(6, 182, 212, 0.65)'; // Cyan glowing edges
      drawSolidBox3D(-130, 130, -12, 0, -130, 130, pcbColor, pcbStrokeColor, 1.5);

      // Draw Grid Lines on PCB Surface to look like blueprint design
      const gridColor = 'rgba(6, 182, 212, 0.14)';
      for (let g = -120; g <= 120; g += 20) {
        drawLine3D({ x: g, y: 0, z: -120 }, { x: g, y: 0, z: 120 }, gridColor, 1.0);
        drawLine3D({ x: -120, y: 0, z: g }, { x: 120, y: 0, z: g }, gridColor, 1.0);
      }

      // ==============================================
      // 2. Draw Circuit Traces & Animate Energy Flow
      // ==============================================
      traces.forEach((trace, idx) => {
        // Draw static faint trace path
        for (let i = 0; i < trace.length - 1; i++) {
          drawLine3D(trace[i], trace[i + 1], 'rgba(6, 182, 212, 0.28)', 1.5);
        }

        // Draw multiple flowing pulses along each trace
        const tracePulses = pulseStates[idx];
        tracePulses.forEach((state) => {
          const curSpeed = isHovered ? state.speed * 1.8 : state.speed;
          state.progress += curSpeed;
          if (state.progress > 1.0) {
            state.progress = 0;
          }

          const totalSegments = trace.length - 1;
          const segmentProgress = state.progress * totalSegments;
          const segmentIdx = Math.floor(segmentProgress);
          const t = segmentProgress - segmentIdx;

          if (segmentIdx >= 0 && segmentIdx < totalSegments) {
            const pStart = trace[segmentIdx];
            const pEnd = trace[segmentIdx + 1];

            const pulseX = pStart.x + (pEnd.x - pStart.x) * t;
            const pulseY = pStart.y + (pEnd.y - pStart.y) * t;
            const pulseZ = pStart.z + (pEnd.z - pStart.z) * t;

            const pt = project(pulseX, pulseY, pulseZ);
            ctx.beginPath();
            ctx.fillStyle = '#00d2ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d2ff';
            ctx.arc(pt.x, pt.y, 4.2 * (1 - pt.z / 800), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            
            // Draw tail
            if (t > 0.08) {
              const tailX = pulseX - (pEnd.x - pStart.x) * 0.18;
              const tailY = pulseY - (pEnd.y - pStart.y) * 0.18;
              const tailZ = pulseZ - (pEnd.z - pStart.z) * 0.18;
              drawLine3D(
                { x: pulseX, y: pulseY, z: pulseZ },
                { x: tailX, y: tailY, z: tailZ },
                'rgba(0, 210, 255, 0.75)',
                2.2
              );
            }
          }
        });
      });

      // ==============================================
      // 3. Draw On-Board Components (Heatsinks, RAM)
      // ==============================================
      // Taller RAM Slots (yMax = 32)
      const ramFill = 'rgba(99, 102, 241, 0.28)'; // Indigo glass
      const ramStroke = 'rgba(99, 102, 241, 0.75)';
      for (let rx = 55; rx <= 85; rx += 10) {
        // Draw 3D RAM plates
        drawSolidBox3D(rx - 2, rx + 2, 0, 32, -80, 80, ramFill, ramStroke, 1.2);
        // Taller top notches (y = 32 to 35)
        drawSolidBox3D(rx - 2, rx + 2, 32, 35, -78, -70, 'rgba(234, 179, 8, 0.85)', 'none');
        drawSolidBox3D(rx - 2, rx + 2, 32, 35, 70, 78, 'rgba(234, 179, 8, 0.85)', 'none');
      }

      // Large metal heatsink block (Taller yMax = 38)
      const hsFill = 'rgba(75, 85, 99, 0.48)';
      const hsStroke = 'rgba(156, 163, 175, 0.75)';
      // Left component
      drawSolidBox3D(-85, -65, 0, 38, -90, 10, hsFill, hsStroke, 1.5);
      // Top component
      drawSolidBox3D(-85, 30, 0, 38, -95, -75, hsFill, hsStroke, 1.5);

      // Heatsink fins/grate details (taller vertical lines)
      for (let hz = -85; hz <= 5; hz += 15) {
        drawLine3D({ x: -75, y: 38, z: hz }, { x: -65, y: 38, z: hz }, 'rgba(255, 255, 255, 0.35)', 1.2);
      }
      for (let hx = -80; hx <= 25; hx += 15) {
        drawLine3D({ x: hx, y: 38, z: -85 }, { x: hx, y: 38, z: -75 }, 'rgba(255, 255, 255, 0.35)', 1.2);
      }

      // ==============================================
      // 4. Draw Central CPU Core Structure (Deep 3D Heights)
      // ==============================================
      // Bottom green fiberglass layer (yMax = 9)
      drawSolidBox3D(-50, 50, 0, 9, -50, 50, 'rgba(5, 31, 17, 0.95)', 'rgba(245, 158, 11, 0.75)', 1.5);

      // Gold pins layout along the PCB connector border (y = 0 to 6)
      const edgeGoldColor = 'rgba(234, 179, 8, 0.85)';
      for (let edge = -44; edge <= 44; edge += 8) {
        drawLine3D({ x: edge, y: 0, z: -48 }, { x: edge, y: 6, z: -48 }, edgeGoldColor, 1.2);
        drawLine3D({ x: edge, y: 0, z: 48 }, { x: edge, y: 6, z: 48 }, edgeGoldColor, 1.2);
        drawLine3D({ x: -48, y: 0, z: edge }, { x: -48, y: 6, z: edge }, edgeGoldColor, 1.2);
        drawLine3D({ x: 48, y: 0, z: edge }, { x: 48, y: 6, z: edge }, edgeGoldColor, 1.2);
      }

      // Metallic IHS cover (Raised prateado chip plate, y = 9 to 26)
      const ihsFill = 'rgba(31, 41, 55, 0.92)'; 
      const ihsStroke = 'rgba(0, 210, 255, 0.7)'; 
      drawSolidBox3D(-38, 38, 9, 26, -38, 38, ihsFill, ihsStroke, 1.6);

      // Glowing CPU Core Die in middle (y = 26 to 32)
      const corePulse = (Math.sin(time * 5.0) + 1.2) / 2.2;
      const chipGlowColor = `rgba(0, 210, 255, ${0.4 + corePulse * 0.55})`;
      drawSolidBox3D(-16, 16, 26, 32, -16, 16, 'rgba(15, 23, 42, 0.9)', chipGlowColor, 2.0);

      // --- Concentric Holographic Waves Ripple ---
      // 3 expanding circles on the CPU top plane (y = 32)
      const numWaves = 3;
      for (let w = 0; w < numWaves; w++) {
        const waveOffset = w * (90 / numWaves);
        const waveRadius = ((time * 30) + waveOffset) % 90;
        const waveAlpha = (1.0 - waveRadius / 90) * 0.65;

        // Generate points for the horizontal circle on y = 32
        const circleSegments = 16;
        const points = [];
        for (let i = 0; i < circleSegments; i++) {
          const angle = (i * 2 * Math.PI) / circleSegments;
          const cx = Math.cos(angle) * waveRadius;
          const cz = Math.sin(angle) * waveRadius;
          points.push({ x: cx, y: 32, z: cz });
        }

        const projPoints = points.map(p => project(p.x, p.y, p.z));
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 210, 255, ${waveAlpha})`;
        ctx.lineWidth = 1.8 * (1 - projPoints[0].z / 800);
        ctx.moveTo(projPoints[0].x, projPoints[0].y);
        for (let i = 1; i < circleSegments; i++) {
          ctx.lineTo(projPoints[i].x, projPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw a neat geometric hologram symbol floating right above CPU (y = holoY to holoY + 14)
      const holoY = 40 + Math.sin(time * 2.5) * 4;
      const ptCore1 = project(-10, holoY, 0);
      const ptCore2 = project(0, holoY, -10);
      const ptCore3 = project(10, holoY, 0);
      const ptCore4 = project(0, holoY, 10);
      const ptCoreTop = project(0, holoY + 14, 0);

      ctx.beginPath();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00d2ff';
      ctx.moveTo(ptCore1.x, ptCore1.y);
      ctx.lineTo(ptCore2.x, ptCore2.y);
      ctx.lineTo(ptCore3.x, ptCore3.y);
      ctx.lineTo(ptCore4.x, ptCore4.y);
      ctx.closePath();
      ctx.stroke();

      // Draw lines going up to pyramid top
      [ptCore1, ptCore2, ptCore3, ptCore4].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(ptCoreTop.x, ptCoreTop.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0; // reset

      // ==============================================
      // 5. Draw 3D Wiggling Pins / Connectors ("palitinhos")
      // ==============================================
      // The user wants them to swing/wiggle actively on mouse hover (Sway scale increased to 10px)
      const wiggleIntensity = isHovered ? 1.0 : 0.12;
      const swayScale = 9.8; // Larger wiggle amplitude

      pins.forEach(pin => {
        const wigglePhase = time * 18 + pin.x * 0.15 + pin.z * 0.15;
        
        // Compute displacement of the pin top
        const dx = Math.sin(wigglePhase) * swayScale * wiggleIntensity;
        const dz = Math.cos(wigglePhase * 0.9) * swayScale * wiggleIntensity;
        const dy = Math.abs(Math.sin(wigglePhase * 1.5)) * 3 * wiggleIntensity;

        const pBase = { x: pin.x, y: 0, z: pin.z };
        const pTip = { x: pin.x + dx, y: pin.baseHeight + dy, z: pin.z + dz };

        // Draw pin post/line
        drawLine3D(pBase, pTip, 'rgba(100, 116, 139, 0.85)', 2.0); // metallic pin body

        // Draw glowing cap/bead at tip
        const tipProj = project(pTip.x, pTip.y, pTip.z);
        ctx.beginPath();
        
        // Color shifts gold/pink/cyan actively when hovered to represent connection activity
        let pinColor = pin.color;
        if (isHovered) {
          const shift = Math.floor(time * 8 + pin.x) % 3;
          if (shift === 0) pinColor = '#00d2ff';
          else if (shift === 1) pinColor = '#ec4899';
          else pinColor = '#eab308';
        }

        ctx.fillStyle = pinColor;
        if (isHovered) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = pinColor;
        }
        ctx.arc(tipProj.x, tipProj.y, 4.0 * (1 - tipProj.z / 800), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Capacitors (Tall cylindrical cans next to CPU, yMax = 44)
      const capColor = 'rgba(168, 85, 247, 0.7)'; 
      const drawCapacitor = (cx: number, cz: number, r: number, h: number) => {
        drawSolidBox3D(cx - r, cx + r, 0, h - 3, cz - r, cz + r, capColor, 'rgba(168, 85, 247, 0.95)', 1.2);
        // Silver cap
        drawSolidBox3D(cx - r, cx + r, h - 3, h, cz - r, cz + r, 'rgba(226, 232, 240, 0.9)', 'none');
        // Black rubber notch on top
        drawSolidBox3D(cx - r/2, cx + r/2, h, h+1, cz - r/2, cz + r/2, 'rgba(15, 23, 42, 0.9)', 'none');
      };
      drawCapacitor(-45, 75, 8, 44);
      drawCapacitor(-20, 75, 8, 44);
      drawCapacitor(-45, 95, 8, 44);
      drawCapacitor(-20, 95, 8, 44);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  return (
    <div
      className="relative w-full max-w-[550px] md:max-w-[620px] aspect-square mx-auto flex items-center justify-center cursor-pointer select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Blueprint Grid Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/5 filter blur-[50px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500"></div>

      {/* HUD Info Details */}
      <div className="absolute top-4 left-6 font-mono text-[9px] text-[#00d2ff]/40 flex flex-col gap-0.5 tracking-wider select-none pointer-events-none">
        <div>SYS_ENGINE: {isHovered ? 'CORE_OVERCLOCK' : 'CORE_IDLE'}</div>
        <div>MODEL: LOGIC_CORE_V2.4</div>
        <div>INTEGRITY: 100%</div>
      </div>

      <div className="absolute bottom-4 right-6 font-mono text-[9px] text-pink-500/40 tracking-wider select-none pointer-events-none animate-pulse">
        ● {isHovered ? 'ENERGY FLOW MAX' : 'FLOW STABLE'}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 35px rgba(6,182,212,0.18))',
        }}
      />
    </div>
  );
};
