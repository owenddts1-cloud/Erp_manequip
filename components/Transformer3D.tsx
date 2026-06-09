import React, { useEffect, useRef, useState } from 'react';

export const Transformer3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = 650); // High-res canvas width
    let height = (canvas.height = 650); // High-res canvas height

    const centerX = width / 2;
    const centerY = height / 2 - 20;
    const perspective = 550; // Perspective focal depth

    let angleY = 0.65; // Auto Y rotation angle
    let angleX = 0.38; // Tilted X perspective elevation
    let time = 0;

    // --- Math 3D Rotation and Projection ---
    const project = (x: number, y: number, z: number, xOffset = 0, yOffset = 0, zOffset = 0) => {
      // Global scale adjustment (2.1x overall scale)
      const geomScale = 1.25; 
      let px = (x + xOffset) * geomScale;
      let py = (y + yOffset) * geomScale;
      let pz = (z + zOffset) * geomScale;

      // Rotate Y (horizontal rotation)
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = px * cosY - pz * sinY;
      const z1 = px * sinY + pz * cosY;

      // Rotate X (vertical tilt)
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y2 = py * cosX - z1 * sinX;
      const z2 = py * sinX + z1 * cosX;

      // Perspective projection scaling
      const scale = perspective / (perspective + z2);
      const screenX = x1 * scale + centerX;
      // Invert Y coordinate rendering: screen coordinate Y increases downwards, so we subtract
      const screenY = centerY - y2 * scale; 

      return { x: screenX, y: screenY, z: z2 };
    };

    // --- Helper: Draw 3D Line ---
    const drawLine3D = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      color: string,
      lineWidth: number
    ) => {
      const pt1 = project(p1.x, p1.y, p1.z);
      const pt2 = project(p2.x, p2.y, p2.z);

      const avgZ = (pt1.z + pt2.z) / 2;
      const alphaScale = Math.max(0.2, Math.min(1.0, 1 - avgZ / 350));
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alphaScale;
      ctx.lineWidth = lineWidth * 1.5 * (1 - avgZ / 700);
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
      ctx.globalAlpha = 1.0; // reset
    };

    // --- Helper: Draw 3D Solid & Wireframe Box ---
    const drawBox3D = (
      xMin: number, xMax: number,
      yMin: number, yMax: number,
      zMin: number, zMax: number,
      xOffset: number, yOffset: number, zOffset: number,
      color: string,
      lineWidth = 1.2,
      fillColor?: string
    ) => {
      const vertices = [
        { x: xMin + xOffset, y: yMin + yOffset, z: zMin + zOffset }, // 0
        { x: xMax + xOffset, y: yMin + yOffset, z: zMin + zOffset }, // 1
        { x: xMax + xOffset, y: yMax + yOffset, z: zMin + zOffset }, // 2
        { x: xMin + xOffset, y: yMax + yOffset, z: zMin + zOffset }, // 3
        { x: xMin + xOffset, y: yMin + yOffset, z: zMax + zOffset }, // 4
        { x: xMax + xOffset, y: yMin + yOffset, z: zMax + zOffset }, // 5
        { x: xMax + xOffset, y: yMax + yOffset, z: zMax + zOffset }, // 6
        { x: xMin + xOffset, y: yMax + yOffset, z: zMax + zOffset }, // 7
      ];

      const projected = vertices.map(v => project(v.x, v.y, v.z));
      const avgZ = projected.reduce((sum, p) => sum + p.z, 0) / projected.length;
      const alphaScale = Math.max(0.2, Math.min(0.95, 1 - avgZ / 400));

      if (fillColor) {
        const drawFace = (indices: number[]) => {
          ctx.beginPath();
          ctx.moveTo(projected[indices[0]].x, projected[indices[0]].y);
          for (let idx = 1; idx < indices.length; idx++) {
            ctx.lineTo(projected[indices[idx]].x, projected[indices[idx]].y);
          }
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.globalAlpha = alphaScale * 0.55;
          ctx.fill();
        };

        // Draw 6 faces with slight transparency
        drawFace([0, 1, 5, 4]); // Bottom
        drawFace([4, 5, 6, 7]); // Back
        drawFace([0, 4, 7, 3]); // Left
        drawFace([1, 5, 6, 2]); // Right
        drawFace([0, 1, 2, 3]); // Front
        drawFace([3, 2, 6, 7]); // Top
      }

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // front
        [4, 5], [5, 6], [6, 7], [7, 4], // back
        [0, 4], [1, 5], [2, 6], [3, 7], // joiners
      ];

      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];

        const edgeAvgZ = (p1.z + p2.z) / 2;
        const edgeAlpha = Math.max(0.2, Math.min(0.9, 1 - edgeAvgZ / 350));
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = edgeAlpha;
        ctx.lineWidth = lineWidth * 1.5 * (1 - edgeAvgZ / 700);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      ctx.globalAlpha = 1.0;
    };

    // --- Helper: Draw 3D Solid & Wireframe Cylinder ---
    const drawCylinder3D = (
      cx: number, cy: number, cz: number,
      radius: number, length: number,
      direction: 'X' | 'Y' | 'Z',
      xOffset: number, yOffset: number, zOffset: number,
      color: string,
      segments = 12,
      lineWidth = 1.2,
      fillColor?: string
    ) => {
      const ring1 = [];
      const ring2 = [];

      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const d1 = Math.cos(angle) * radius;
        const d2 = Math.sin(angle) * radius;

        if (direction === 'Y') {
          ring1.push({ x: cx + d1, y: cy - length / 2, z: cz + d2 });
          ring2.push({ x: cx + d1, y: cy + length / 2, z: cz + d2 });
        } else if (direction === 'Z') {
          ring1.push({ x: cx + d1, y: cy + d2, z: cz - length / 2 });
          ring2.push({ x: cx + d1, y: cy + d2, z: cz + length / 2 });
        }
      }

      const projRing1 = ring1.map(v => project(v.x + xOffset, v.y + yOffset, v.z + zOffset));
      const projRing2 = ring2.map(v => project(v.x + xOffset, v.y + yOffset, v.z + zOffset));

      const avgZ = (projRing1.reduce((sum, p) => sum + p.z, 0) + projRing2.reduce((sum, p) => sum + p.z, 0)) / (segments * 2);
      const alphaScale = Math.max(0.2, Math.min(1.0, 1 - avgZ / 350));

      if (fillColor) {
        // Draw the curved surface faces (quads connecting ring1 and ring2)
        for (let i = 0; i < segments; i++) {
          const next = (i + 1) % segments;
          ctx.beginPath();
          ctx.moveTo(projRing1[i].x, projRing1[i].y);
          ctx.lineTo(projRing1[next].x, projRing1[next].y);
          ctx.lineTo(projRing2[next].x, projRing2[next].y);
          ctx.lineTo(projRing2[i].x, projRing2[i].y);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.globalAlpha = alphaScale * 0.45;
          ctx.fill();
        }

        // Draw circular caps
        const drawCap = (projRing: any[]) => {
          ctx.beginPath();
          ctx.moveTo(projRing[0].x, projRing[0].y);
          for (let i = 1; i < projRing.length; i++) {
            ctx.lineTo(projRing[i].x, projRing[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.globalAlpha = alphaScale * 0.55;
          ctx.fill();
        };
        drawCap(projRing1);
        drawCap(projRing2);
      }

      // Draw outlines
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;

        drawLine3D(
          { x: ring1[i].x + xOffset, y: ring1[i].y + yOffset, z: ring1[i].z + zOffset },
          { x: ring1[next].x + xOffset, y: ring1[next].y + yOffset, z: ring1[next].z + zOffset },
          color,
          lineWidth
        );

        drawLine3D(
          { x: ring2[i].x + xOffset, y: ring2[i].y + yOffset, z: ring2[i].z + zOffset },
          { x: ring2[next].x + xOffset, y: ring2[next].y + yOffset, z: ring2[next].z + zOffset },
          color,
          lineWidth
        );

        if (i % 3 === 0) {
          drawLine3D(
            { x: ring1[i].x + xOffset, y: ring1[i].y + yOffset, z: ring1[i].z + zOffset },
            { x: ring2[i].x + xOffset, y: ring2[i].y + yOffset, z: ring2[i].z + zOffset },
            color,
            lineWidth * 0.8
          );
        }
      }
    };

    // --- Helper: Draw 3D Cooling Fan (Hélice) ---
    const drawCoolingFan3D = (
      cx: number, cy: number, cz: number,
      radius: number,
      xOffset: number, yOffset: number, zOffset: number,
      fanAngle: number,
      casingColor: string,
      bladeColor: string
    ) => {
      const segments = 16;
      const ring = [];

      // Generate fan outer circle casing (lying on the Y-Z plane)
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const dy = Math.cos(angle) * radius;
        const dz = Math.sin(angle) * radius;
        ring.push({ x: cx, y: cy + dy, z: cz + dz });
      }

      const projRing = ring.map(v => project(v.x + xOffset, v.y + yOffset, v.z + zOffset));
      const avgZ = projRing.reduce((sum, p) => sum + p.z, 0) / segments;
      const alpha = Math.max(0.2, Math.min(1.0, 1 - avgZ / 350));

      // Draw circular fan casing outline
      ctx.beginPath();
      ctx.strokeStyle = casingColor;
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = alpha;
      ctx.moveTo(projRing[0].x, projRing[0].y);
      for (let i = 1; i < segments; i++) {
        ctx.lineTo(projRing[i].x, projRing[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw rotating fan blades (hélices)
      const centerProj = project(cx + xOffset, cy + yOffset, cz + zOffset);
      const numBlades = 4;
      for (let b = 0; b < numBlades; b++) {
        const angle = fanAngle + (b * Math.PI) / 2;
        const tipY = cy + Math.cos(angle) * (radius - 2);
        const tipZ = cz + Math.sin(angle) * (radius - 2);

        const tipProj = project(cx + xOffset, tipY + yOffset, tipZ + zOffset);

        ctx.beginPath();
        ctx.strokeStyle = bladeColor;
        ctx.lineWidth = 3.0; // Thicker blades
        ctx.globalAlpha = alpha;
        ctx.moveTo(centerProj.x, centerProj.y);
        ctx.lineTo(tipProj.x, tipProj.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.012;
      angleY += 0.0035; // Auto rotate Y

      const targetExplosion = isHovered ? 1.0 : 0.5 - 0.5 * Math.cos(time * 0.65);
      const explosionFactor = targetExplosion;

      // Scaled up displacement values (2.0x overall impact)
      const tankYOffset = -187 * explosionFactor;       // Tank slides UP
      const windingYOffset = -76 * explosionFactor;    // Windings slide UP partially
      const radLeftXOffset = -70 * explosionFactor;    // Left radiators slide left
      const radRightXOffset = 70 * explosionFactor;    // Right radiators slide right

      // ==============================================
      // 1. Draw Static Center: MAGNETIC CORE (Steel Grey)
      // ==============================================
      const coreColor = 'rgba(148, 163, 184, 0.45)';
      const coreFillColor = 'rgba(148, 163, 184, 0.15)';
      const coreFluxColor = 'rgba(0, 210, 255, 0.8)';

      // 3 Vertical Core Legs (Limbs)
      drawBox3D(-65, -47, -14, 14, -14, 14, 0, 0, 0, coreColor, 1.5, coreFillColor);
      drawBox3D(-9, 9, -85, 85, -14, 14, 0, 0, 0, coreColor, 1.5, coreFillColor);
      drawBox3D(47, 65, -85, 85, -14, 14, 0, 0, 0, coreColor, 1.5, coreFillColor);

      // Adjust height of outer legs to match top plate
      drawBox3D(-65, -47, -85, 85, -14, 14, 0, 0, 0, coreColor, 1.5, coreFillColor);

      // Top and Bottom Yokes (Horizontal steel plates connecting limbs)
      drawBox3D(-82, 82, 75, 95, -14, 14, 0, 0, 0, coreColor, 1.8, 'rgba(100, 116, 139, 0.2)');
      drawBox3D(-82, 82, -95, -75, -14, 14, 0, 0, 0, coreColor, 1.8, 'rgba(100, 116, 139, 0.2)');

      // Internal glowing magnetic flux lines
      const fluxPulse = (Math.sin(time * 4.5) + 1) / 2;
      const fluxAlpha = 0.25 + 0.5 * fluxPulse;
      drawLine3D({ x: -56, y: -75, z: 0 }, { x: -56, y: 75, z: 0 }, `rgba(0, 210, 255, ${fluxAlpha})`, 2.0);
      drawLine3D({ x: 0, y: -75, z: 0 }, { x: 0, y: 75, z: 0 }, `rgba(0, 210, 255, ${fluxAlpha})`, 2.0);
      drawLine3D({ x: 56, y: -75, z: 0 }, { x: 56, y: 75, z: 0 }, `rgba(0, 210, 255, ${fluxAlpha})`, 2.0);

      // ==============================================
      // 2. Draw Active Part: COPPER COILS / WINDINGS (Amber/Orange)
      // ==============================================
      const windingColor = '#f59e0b'; // Amber copper wireframe
      const windingFillColor = 'rgba(245, 158, 11, 0.16)';
      drawCylinder3D(-56, 0, 0, 37, 120, 'Y', 0, windingYOffset, 0, windingColor, 16, 1.6, windingFillColor);
      drawCylinder3D(0, 0, 0, 37, 120, 'Y', 0, windingYOffset, 0, windingColor, 16, 1.6, windingFillColor);
      drawCylinder3D(56, 0, 0, 37, 120, 'Y', 0, windingYOffset, 0, windingColor, 16, 1.6, windingFillColor);

      // ==============================================
      // 3. Draw Base: DOUBLE REINFORCED BASE PLATES (Slate Steel)
      // ==============================================
      drawBox3D(-128, 128, -136, -119, -76, 76, 0, 0, 0, 'rgba(71, 85, 105, 0.75)', 2.0, 'rgba(71, 85, 105, 0.25)');
      drawBox3D(-133, 133, -153, -143, -82, 82, 0, 0, 0, 'rgba(71, 85, 105, 0.55)', 1.8, 'rgba(71, 85, 105, 0.18)');

      // ==============================================
      // 4. Draw Outer Tank: CORRUGATED CASING (Slides UP)
      // ==============================================
      const tankFrameColor = '#06b6d4'; // Cyan neon housing
      const tankFillColor = 'rgba(6, 182, 212, 0.08)';
      drawBox3D(-116, 116, -112, 112, -65, 65, 0, tankYOffset, 0, tankFrameColor, 1.6, tankFillColor);

      // Corrugated fins/vertical cooling tubes on the front/back walls
      const drawTankCorrugations = () => {
        const tY = tankYOffset;
        for (let cx = -88; cx <= 88; cx += 22) {
          drawLine3D({ x: cx, y: -112 + tY, z: 65 }, { x: cx, y: 112 + tY, z: 65 }, 'rgba(6, 182, 212, 0.55)', 1.2);
          drawLine3D({ x: cx, y: -112 + tY, z: -65 }, { x: cx, y: 112 + tY, z: -65 }, 'rgba(6, 182, 212, 0.3)', 1.0);
        }
      };
      drawTankCorrugations();

      // Top Lid Cover plate
      drawBox3D(-120, 120, 110, 115, -68, 68, 0, tankYOffset, 0, 'rgba(0, 210, 255, 0.65)', 1.5, 'rgba(0, 210, 255, 0.15)');

      // ==============================================
      // 5. Draw Top Accessories: OIL CONSERVATOR & SUPPORT ARMS
      // ==============================================
      const conservatorColor = 'rgba(148, 163, 184, 0.85)';
      const conservatorFill = 'rgba(148, 163, 184, 0.2)';
      
      // Conservator tank centered on the right (cz = 0)
      drawCylinder3D(61, 150, 0, 20, 126, 'Z', 0, tankYOffset, 0, conservatorColor, 12, 1.4, conservatorFill);

      // Angled reinforced bracket arms (fidelidade ao modelo real)
      const bracketColor = 'rgba(100, 116, 139, 0.8)';
      // Support bracket 1 (back Z = -35)
      drawLine3D({ x: 92, y: 70 + tankYOffset, z: -35 }, { x: 61, y: 150 + tankYOffset, z: -35 }, bracketColor, 3.0);
      drawLine3D({ x: 61, y: 115 + tankYOffset, z: -35 }, { x: 61, y: 150 + tankYOffset, z: -35 }, bracketColor, 2.5);
      // Support bracket 2 (front Z = 35)
      drawLine3D({ x: 92, y: 70 + tankYOffset, z: 35 }, { x: 61, y: 150 + tankYOffset, z: 35 }, bracketColor, 3.0);
      drawLine3D({ x: 61, y: 115 + tankYOffset, z: 35 }, { x: 61, y: 150 + tankYOffset, z: 35 }, bracketColor, 2.5);
      // Angled cross member connecting the support brackets
      drawLine3D({ x: 61, y: 130 + tankYOffset, z: -35 }, { x: 61, y: 130 + tankYOffset, z: 35 }, bracketColor, 1.5);

      // Connecting pipes/tubes from main body to conservator
      drawLine3D({ x: 44, y: 115 + tankYOffset, z: 0 }, { x: 44, y: 150 + tankYOffset, z: 20 }, 'rgba(6, 182, 212, 0.65)', 1.8);

      // ==============================================
      // 6. Draw Top Accessories: CERAMIC INSULATOR BUSHINGS (3 Back, 4 Front)
      // ==============================================
      // Fiel ao modelo real: 3 buchas traseiras maiores, 4 dianteiras menores
      // Cor de cerâmica marrom rust with pontas de metal douradas
      const ceramicBrown = 'rgba(146, 64, 14, 0.95)';
      const ceramicFill = 'rgba(120, 53, 4, 0.4)';
      const metalGold = 'rgba(234, 179, 8, 0.95)';
      
      // 3 Tall High-Voltage Bushings (Z = -34)
      const drawBushingsBack = () => {
        const xPos = [-50, 0, 50];
        xPos.forEach(bx => {
          // Center gold conductor rod
          drawLine3D(
            { x: bx, y: 115 + tankYOffset, z: -34 },
            { x: bx, y: 185 + tankYOffset, z: -34 },
            metalGold,
            2.5
          );
          // Disc insulator fins (Ribbed ceramic shape)
          drawCylinder3D(bx, 124 + tankYOffset, 0, 13.5, 6, 'Y', 0, 0, -34, ceramicBrown, 8, 1.0, ceramicFill);
          drawCylinder3D(bx, 138 + tankYOffset, 0, 11.5, 6, 'Y', 0, 0, -34, ceramicBrown, 8, 1.0, ceramicFill);
          drawCylinder3D(bx, 152 + tankYOffset, 0, 9.5, 6, 'Y', 0, 0, -34, ceramicBrown, 8, 1.0, ceramicFill);
          drawCylinder3D(bx, 166 + tankYOffset, 0, 8.0, 6, 'Y', 0, 0, -34, ceramicBrown, 8, 1.0, ceramicFill);
        });
      };

      // 4 Shorter Bushings in front (Z = 34)
      const drawBushingsFront = () => {
        const xPos = [-75, -25, 25, 75];
        xPos.forEach(bx => {
          // Center gold conductor rod
          drawLine3D(
            { x: bx, y: 115 + tankYOffset, z: 34 },
            { x: bx, y: 153 + tankYOffset, z: 34 },
            metalGold,
            2.0
          );
          // Disc fins
          drawCylinder3D(bx, 122 + tankYOffset, 0, 10.5, 5, 'Y', 0, 0, 34, ceramicBrown, 8, 1.0, ceramicFill);
          drawCylinder3D(bx, 134 + tankYOffset, 0, 8.8, 5, 'Y', 0, 0, 34, ceramicBrown, 8, 1.0, ceramicFill);
          drawCylinder3D(bx, 146 + tankYOffset, 0, 7.2, 5, 'Y', 0, 0, 34, ceramicBrown, 8, 1.0, ceramicFill);
        });
      };

      drawBushingsBack();
      drawBushingsFront();

      // ==============================================
      // 7. Draw Cooling Radiators (Fins Slide Left/Right)
      // ==============================================
      const radiatorColor = 'rgba(99, 102, 241, 0.7)'; // Indigo radiators
      const radiatorFill = 'rgba(99, 102, 241, 0.12)';
      
      const drawRadiatorBank = (baseX: number, explosionOffset: number) => {
        // Render 5 vertical radiator panel fins
        for (let offsetZ = -41; offsetZ <= 41; offsetZ += 20) {
          drawBox3D(
            baseX - 5, baseX + 5,
            -78, 78,
            offsetZ - 7, offsetZ + 7,
            explosionOffset, tankYOffset * 0.4, 0,
            radiatorColor,
            1.0,
            radiatorFill
          );
        }
      };

      drawRadiatorBank(-121, radLeftXOffset);
      drawRadiatorBank(121, radRightXOffset);

      // ==============================================
      // 8. Draw Radiator Fan Motors (Animação Hélice em Rotação)
      // ==============================================
      // Mount fans on the outer side panel of left and right radiator banks
      const fanSpeed = time * 5.0;
      const fanCasingColor = 'rgba(99, 102, 241, 0.85)';
      const fanBladeColor = '#00d2ff'; // Cyan glowing rotating blades

      // Fan 1 (Left Radiator - Front side)
      drawCoolingFan3D(-127, 20, 25, 14, radLeftXOffset, tankYOffset * 0.4, 0, fanSpeed, fanCasingColor, fanBladeColor);
      // Fan 2 (Left Radiator - Back side)
      drawCoolingFan3D(-127, 20, -25, 14, radLeftXOffset, tankYOffset * 0.4, 0, fanSpeed, fanCasingColor, fanBladeColor);

      // Fan 3 (Right Radiator - Front side)
      drawCoolingFan3D(127, 20, 25, 14, radRightXOffset, tankYOffset * 0.4, 0, -fanSpeed, fanCasingColor, fanBladeColor); // Reverse spin
      // Fan 4 (Right Radiator - Back side)
      drawCoolingFan3D(127, 20, -25, 14, radRightXOffset, tankYOffset * 0.4, 0, -fanSpeed, fanCasingColor, fanBladeColor);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered]);

  return (
    <div 
      className="relative w-full max-w-[550px] md:max-w-[650px] aspect-square mx-auto flex items-center justify-center cursor-pointer select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Blueprint Grid Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/5 filter blur-[50px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500"></div>
      
      {/* HUD Info Details */}
      <div className="absolute top-4 left-6 font-mono text-[9px] text-[#00d2ff]/40 flex flex-col gap-0.5 tracking-wider select-none pointer-events-none">
        <div>SYS_XFMR: {isHovered ? 'EXPLODED_HOLD' : 'CYCLE_ACTIVE'}</div>
        <div>MODEL: IND_POWER_XFMR_360</div>
        <div>COOLING: FORCED_AIR_ACTIVE</div>
      </div>

      <div className="absolute bottom-4 right-6 font-mono text-[9px] text-amber-500/40 tracking-wider select-none pointer-events-none animate-pulse">
        ● LIVE RENDERING [60FPS]
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
