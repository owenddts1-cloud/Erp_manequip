import React, { useEffect, useRef } from 'react';

export const HalfGlobe3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = 850);
    let height = (canvas.height = 850);

    const R = 340;
    const centerX = width / 2;
    const centerY = height / 2;
    const perspective = 500;

    // --- Detailed Continent Polygon Outlines (lat, lon in radians) ---
    // lat: 0=north pole, PI=south pole (colatitude)
    // lon: -PI to PI
    const continentPolygons: Array<Array<[number, number]>> = [
      // North America (detailed outline)
      [
        [0.45, -2.8], [0.50, -2.5], [0.55, -2.2], [0.60, -1.9],
        [0.58, -1.7], [0.62, -1.55], [0.68, -1.4], [0.72, -1.3],
        [0.70, -1.2], [0.75, -1.15], [0.80, -1.15], [0.85, -1.25],
        [0.90, -1.35], [0.95, -1.4], [0.98, -1.45], [1.02, -1.5],
        [1.05, -1.55], [1.08, -1.52], [1.10, -1.45], [1.05, -1.35],
        [1.00, -1.30], [0.95, -1.25], [0.92, -1.15], [0.95, -1.05],
        [1.00, -0.95], [1.05, -0.90], [1.08, -0.85], [1.02, -0.80],
        [0.95, -0.85], [0.88, -0.90], [0.80, -0.95], [0.75, -1.05],
        [0.70, -1.15], [0.65, -1.25], [0.60, -1.40], [0.55, -1.55],
        [0.52, -1.70], [0.50, -1.85], [0.48, -2.0], [0.46, -2.2],
        [0.44, -2.5], [0.45, -2.8]
      ],
      // Central America & Mexico
      [
        [1.08, -1.52], [1.12, -1.55], [1.15, -1.53], [1.18, -1.48],
        [1.20, -1.42], [1.22, -1.40], [1.25, -1.38], [1.28, -1.35],
        [1.30, -1.30], [1.28, -1.28], [1.25, -1.30], [1.22, -1.33],
        [1.18, -1.38], [1.15, -1.42], [1.12, -1.48], [1.08, -1.52]
      ],
      // South America
      [
        [1.30, -1.30], [1.35, -1.22], [1.40, -1.15], [1.45, -1.05],
        [1.50, -0.95], [1.55, -0.88], [1.60, -0.80], [1.65, -0.75],
        [1.70, -0.72], [1.75, -0.70], [1.80, -0.72], [1.85, -0.68],
        [1.90, -0.65], [1.95, -0.70], [2.00, -0.78], [2.05, -0.85],
        [2.10, -0.95], [2.15, -1.05], [2.18, -1.15], [2.20, -1.22],
        [2.15, -1.18], [2.10, -1.12], [2.05, -1.10], [2.00, -1.12],
        [1.95, -1.18], [1.90, -1.20], [1.85, -1.15], [1.80, -1.10],
        [1.75, -1.08], [1.70, -1.10], [1.65, -1.12], [1.60, -1.08],
        [1.55, -1.02], [1.50, -0.98], [1.45, -1.05], [1.40, -1.12],
        [1.35, -1.18], [1.30, -1.30]
      ],
      // Europe (detailed)
      [
        [0.55, -0.18], [0.58, -0.10], [0.60, 0.0], [0.62, 0.08],
        [0.65, 0.15], [0.68, 0.22], [0.70, 0.30], [0.72, 0.42],
        [0.75, 0.55], [0.78, 0.60], [0.80, 0.55], [0.82, 0.45],
        [0.85, 0.40], [0.88, 0.38], [0.90, 0.30], [0.88, 0.22],
        [0.85, 0.15], [0.82, 0.10], [0.80, 0.05], [0.78, -0.05],
        [0.75, -0.10], [0.72, -0.08], [0.70, -0.12], [0.68, -0.15],
        [0.65, -0.12], [0.62, -0.15], [0.58, -0.15], [0.55, -0.18]
      ],
      // Russia / North Asia
      [
        [0.55, 0.30], [0.52, 0.50], [0.50, 0.80], [0.48, 1.10],
        [0.50, 1.40], [0.52, 1.70], [0.55, 2.0], [0.58, 2.30],
        [0.60, 2.50], [0.62, 2.70], [0.65, 2.85], [0.68, 2.80],
        [0.72, 2.60], [0.75, 2.40], [0.78, 2.10], [0.80, 1.80],
        [0.78, 1.50], [0.75, 1.25], [0.72, 1.0], [0.70, 0.80],
        [0.68, 0.60], [0.65, 0.45], [0.62, 0.35], [0.58, 0.30],
        [0.55, 0.30]
      ],
      // Africa
      [
        [0.95, 0.0], [0.98, 0.10], [1.00, 0.20], [1.05, 0.30],
        [1.10, 0.40], [1.15, 0.48], [1.20, 0.55], [1.25, 0.60],
        [1.30, 0.62], [1.35, 0.58], [1.40, 0.52], [1.45, 0.48],
        [1.50, 0.45], [1.55, 0.42], [1.60, 0.40], [1.65, 0.42],
        [1.70, 0.48], [1.75, 0.50], [1.80, 0.48], [1.85, 0.42],
        [1.90, 0.35], [1.95, 0.30], [2.00, 0.35], [2.05, 0.42],
        [2.10, 0.48], [2.15, 0.45], [2.10, 0.35], [2.05, 0.25],
        [2.00, 0.15], [1.95, 0.05], [1.90, -0.02], [1.85, -0.05],
        [1.80, 0.0], [1.75, 0.05], [1.70, 0.10], [1.65, 0.15],
        [1.60, 0.12], [1.55, 0.08], [1.50, 0.05], [1.45, 0.0],
        [1.40, -0.05], [1.35, -0.10], [1.30, -0.12], [1.25, -0.10],
        [1.20, -0.05], [1.15, 0.0], [1.10, 0.05], [1.05, 0.0],
        [1.00, -0.05], [0.95, 0.0]
      ],
      // Middle East / Arabian Peninsula
      [
        [1.05, 0.55], [1.08, 0.65], [1.10, 0.75], [1.12, 0.85],
        [1.15, 0.90], [1.18, 0.88], [1.20, 0.82], [1.22, 0.75],
        [1.20, 0.65], [1.15, 0.58], [1.10, 0.52], [1.05, 0.55]
      ],
      // India
      [
        [0.90, 1.15], [0.95, 1.18], [1.00, 1.22], [1.05, 1.25],
        [1.10, 1.30], [1.15, 1.35], [1.20, 1.32], [1.25, 1.28],
        [1.30, 1.30], [1.35, 1.25], [1.40, 1.22], [1.38, 1.18],
        [1.35, 1.12], [1.30, 1.10], [1.25, 1.08], [1.20, 1.12],
        [1.15, 1.18], [1.10, 1.20], [1.05, 1.18], [1.00, 1.15],
        [0.95, 1.12], [0.90, 1.15]
      ],
      // China / East Asia
      [
        [0.75, 1.25], [0.78, 1.40], [0.80, 1.55], [0.82, 1.70],
        [0.85, 1.85], [0.88, 2.0], [0.90, 2.10], [0.92, 2.15],
        [0.95, 2.10], [0.98, 2.05], [1.00, 1.95], [1.02, 1.85],
        [1.05, 1.75], [1.08, 1.65], [1.10, 1.55], [1.08, 1.45],
        [1.05, 1.35], [1.00, 1.28], [0.95, 1.22], [0.90, 1.20],
        [0.85, 1.22], [0.80, 1.25], [0.75, 1.25]
      ],
      // Southeast Asia
      [
        [1.10, 1.55], [1.15, 1.65], [1.18, 1.75], [1.20, 1.85],
        [1.22, 1.78], [1.20, 1.68], [1.18, 1.58], [1.15, 1.52],
        [1.10, 1.55]
      ],
      // Japan
      [
        [0.82, 2.30], [0.85, 2.35], [0.88, 2.42], [0.92, 2.48],
        [0.95, 2.45], [0.92, 2.38], [0.88, 2.32], [0.85, 2.28],
        [0.82, 2.30]
      ],
      // Australia
      [
        [1.75, 2.0], [1.80, 2.10], [1.85, 2.20], [1.90, 2.35],
        [1.95, 2.50], [2.00, 2.60], [2.05, 2.65], [2.10, 2.62],
        [2.15, 2.55], [2.18, 2.45], [2.20, 2.35], [2.18, 2.20],
        [2.15, 2.10], [2.10, 2.05], [2.05, 2.02], [2.00, 2.05],
        [1.95, 2.10], [1.90, 2.08], [1.85, 2.02], [1.80, 1.98],
        [1.75, 2.0]
      ],
      // Indonesia archipelago (simplified)
      [
        [1.50, 1.75], [1.52, 1.85], [1.55, 1.95], [1.58, 2.05],
        [1.60, 2.10], [1.58, 2.00], [1.55, 1.90], [1.52, 1.80],
        [1.50, 1.75]
      ],
      // Greenland
      [
        [0.35, -0.80], [0.38, -0.65], [0.42, -0.55], [0.45, -0.48],
        [0.48, -0.52], [0.50, -0.60], [0.48, -0.70], [0.45, -0.78],
        [0.42, -0.82], [0.38, -0.82], [0.35, -0.80]
      ]
    ];

    // --- Point-in-polygon test (ray casting, on unwrapped lat/lon space) ---
    const pointInPolygon = (lat: number, lon: number, polygon: Array<[number, number]>): boolean => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    };

    const isLand = (lat: number, lon: number): boolean => {
      for (const poly of continentPolygons) {
        if (pointInPolygon(lat, lon, poly)) return true;
      }
      return false;
    };

    // --- Generate Points on Sphere using Fibonacci Spiral ---
    const rawPoints: Array<{ x: number; y: number; z: number; isLand: boolean; isCityLight: boolean }> = [];
    const totalPointsCount = 2800;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < totalPointsCount; i++) {
      const yVal = 1 - (i / (totalPointsCount - 1)) * 2;
      const rad = Math.sqrt(1 - yVal * yVal);
      const theta = Math.acos(yVal); // Latitude [0, PI] (colatitude)
      const phi = (2 * Math.PI * i) / goldenRatio;
      const adjustedPhi = ((phi + Math.PI) % (2 * Math.PI)) - Math.PI;

      const px = Math.cos(adjustedPhi) * rad;
      const py = yVal;
      const pz = Math.sin(adjustedPhi) * rad;

      const landCheck = isLand(theta, adjustedPhi);
      const cityLightCheck = landCheck && (i % 7 === 0);

      rawPoints.push({
        x: px * R,
        y: py * R,
        z: pz * R,
        isLand: landCheck,
        isCityLight: cityLightCheck
      });
    }

    // --- Network Hub Cities (Megacities) ---
    const cities = [
      { name: 'São Paulo', lat: 2.0, lon: -0.8 },
      { name: 'New York', lat: 0.72, lon: -1.3 },
      { name: 'London', lat: 0.67, lon: -0.1 },
      { name: 'Tokyo', lat: 0.98, lon: 2.42 },
      { name: 'Sydney', lat: 2.32, lon: 2.65 },
      { name: 'Cairo', lat: 1.1, lon: 0.55 },
      { name: 'Moscow', lat: 0.62, lon: 0.67 },
      { name: 'Beijing', lat: 0.92, lon: 2.02 },
      { name: 'Cape Town', lat: 2.35, lon: 0.32 },
      { name: 'Los Angeles', lat: 0.92, lon: -2.05 },
      { name: 'Mumbai', lat: 1.25, lon: 1.28 }
    ];

    const cityNodes = cities.map(c => {
      const sinLat = Math.sin(c.lat);
      const cosLat = Math.cos(c.lat);
      const sinLon = Math.sin(c.lon);
      const cosLon = Math.cos(c.lon);

      return {
        name: c.name,
        x0: R * sinLat * cosLon,
        y0: R * cosLat,
        z0: R * sinLat * sinLon
      };
    });

    // --- Interactive Connection Arcs between Cities ---
    const arcs: Array<{ p1: number; p2: number; speed: number; progress: number }> = [];
    for (let i = 0; i < cityNodes.length; i++) {
      const next1 = (i + 1) % cityNodes.length;
      const next2 = (i + 4) % cityNodes.length;
      arcs.push({ p1: i, p2: next1, speed: 0.0035 + Math.random() * 0.005, progress: Math.random() });
      arcs.push({ p1: i, p2: next2, speed: 0.0028 + Math.random() * 0.004, progress: Math.random() });
    }

    let angleY = 0;
    let angleX = 0.35;
    let time = 0;

    // --- Render Loop ---
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.015;
      angleY += 0.0025;
      angleX = 0.32 + Math.sin(angleY * 0.2) * 0.05;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // ==============================================
      // 1. Draw Nebula Atmosphere Background Glow
      // ==============================================
      const radialGlow = ctx.createRadialGradient(centerX, centerY, R * 0.65, centerX, centerY, R + 70);
      radialGlow.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      radialGlow.addColorStop(0.6, 'rgba(99, 102, 241, 0.04)');
      radialGlow.addColorStop(1, 'rgba(7, 11, 20, 0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, R + 70, 0, Math.PI * 2);
      ctx.fill();

      // ==============================================
      // 2. Project and Draw Dots Matrix (Land & Oceans)
      // ==============================================
      rawPoints.forEach((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        if (z2 > 40) return;

        const scale = perspective / (perspective + z2);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;

        const sizeFactor = 1.0 - z2 / (R * 1.5);

        if (p.isLand) {
          if (p.isCityLight) {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00d2ff';
            ctx.arc(px, py, 2.2 * sizeFactor, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.beginPath();
            ctx.fillStyle = `rgba(0, 210, 255, ${0.55 * sizeFactor})`;
            ctx.arc(px, py, 1.5 * sizeFactor, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(99, 102, 241, ${0.07 * sizeFactor})`;
          ctx.arc(px, py, 0.9 * sizeFactor, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ==============================================
      // 2.5 Draw 3D Wireframe Grid Lines (Latitude/Longitude)
      // ==============================================
      // Latitude lines (parallels)
      const latSteps = 10;
      const lonPoints = 60;
      for (let i = 1; i < latSteps; i++) {
        const theta = (Math.PI * i) / latSteps;
        ctx.beginPath();
        let started = false;
        
        for (let j = 0; j <= lonPoints; j++) {
          const phi = (Math.PI * 2 * j) / lonPoints - Math.PI;
          
          const sx = R * Math.sin(theta) * Math.cos(phi);
          const sy = R * Math.cos(theta);
          const sz = R * Math.sin(theta) * Math.sin(phi);
          
          // Rotate Y
          const x1 = sx * cosY - sz * sinY;
          const z1 = sx * sinY + sz * cosY;
          // Rotate X
          const y2 = sy * cosX - z1 * sinX;
          const z2 = sy * sinX + z1 * cosX;
          
          if (z2 > 50) {
            started = false;
            continue;
          }
          
          const scl = perspective / (perspective + z2);
          const px = x1 * scl + centerX;
          const py = y2 * scl + centerY;
          
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Longitude lines (meridians)
      const lonSteps = 12;
      const latPoints = 40;
      for (let i = 0; i < lonSteps; i++) {
        const phi = (Math.PI * 2 * i) / lonSteps - Math.PI;
        ctx.beginPath();
        let started = false;
        
        for (let j = 0; j <= latPoints; j++) {
          const theta = (Math.PI * j) / latPoints;
          
          const sx = R * Math.sin(theta) * Math.cos(phi);
          const sy = R * Math.cos(theta);
          const sz = R * Math.sin(theta) * Math.sin(phi);
          
          // Rotate Y
          const x1 = sx * cosY - sz * sinY;
          const z1 = sx * sinY + sz * cosY;
          // Rotate X
          const y2 = sy * cosX - z1 * sinX;
          const z2 = sy * sinX + z1 * cosX;
          
          if (z2 > 50) {
            started = false;
            continue;
          }
          
          const scl = perspective / (perspective + z2);
          const px = x1 * scl + centerX;
          const py = y2 * scl + centerY;
          
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // ==============================================
      // 3. Draw Continent Outline Borders (wire mesh)
      // ==============================================
      continentPolygons.forEach((poly) => {
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < poly.length; i++) {
          const [lat, lon] = poly[i];
          const sinLat = Math.sin(lat);
          const cosLat = Math.cos(lat);
          const sinLon = Math.sin(lon);
          const cosLon = Math.cos(lon);

          const sx = R * sinLat * cosLon;
          const sy = R * cosLat;
          const sz = R * sinLat * sinLon;

          // Rotate Y
          const x1 = sx * cosY - sz * sinY;
          const z1 = sx * sinY + sz * cosY;
          // Rotate X
          const y2 = sy * cosX - z1 * sinX;
          const z2 = sy * sinX + z1 * cosX;

          if (z2 > 60) {
            started = false;
            continue;
          }

          const scl = perspective / (perspective + z2);
          const px = x1 * scl + centerX;
          const py = y2 * scl + centerY;

          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.strokeStyle = 'rgba(0, 210, 255, 0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // ==============================================
      // 4. Project and Draw Major Megacity Hubs
      // ==============================================
      const projectedCities = cityNodes.map((node) => {
        const x1 = node.x0 * cosY - node.z0 * sinY;
        const z1 = node.x0 * sinY + node.z0 * cosY;
        const y2 = node.y0 * cosX - z1 * sinX;
        const z2 = node.y0 * sinX + z1 * cosX;

        const scale = perspective / (perspective + z2);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;

        return { px, py, pz: z2, visible: z2 < 40 };
      });

      projectedCities.forEach((city) => {
        if (!city.visible) return;

        const sizeFactor = 1.0 - city.pz / (R * 1.5);

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(city.px, city.py, 4.0 * sizeFactor, 0, Math.PI * 2);
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00d2ff';
        ctx.fill();
        ctx.shadowBlur = 0;

        const ringPulse = (time * 1.5) % 1;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 210, 255, ${0.6 * (1 - ringPulse)})`;
        ctx.lineWidth = 1.0;
        ctx.arc(city.px, city.py, 12 * ringPulse * sizeFactor, 0, Math.PI * 2);
        ctx.stroke();
      });

      // ==============================================
      // 5. Project and Draw Glowing Networking Data Arcs
      // ==============================================
      arcs.forEach((arc) => {
        const pA = projectedCities[arc.p1];
        const pB = projectedCities[arc.p2];

        if (!pA.visible || !pB.visible) return;

        const nodeA = cityNodes[arc.p1];
        const nodeB = cityNodes[arc.p2];

        // Calculate 3D Midpoint
        const mx = (nodeA.x0 + nodeB.x0) / 2;
        const my = (nodeA.y0 + nodeB.y0) / 2;
        const mz = (nodeA.z0 + nodeB.z0) / 2;
        const m_dist = Math.sqrt(mx * mx + my * my + mz * mz);

        // Distance between nodes in 3D to determine arc height
        const dx = nodeB.x0 - nodeA.x0;
        const dy = nodeB.y0 - nodeA.y0;
        const dz = nodeB.z0 - nodeA.z0;
        const chordDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Arc height H
        const H = chordDist * 0.25;
        const elevation = R + H;

        // Elevated control point in 3D
        const cx0 = (mx / m_dist) * elevation;
        const cy0 = (my / m_dist) * elevation;
        const cz0 = (mz / m_dist) * elevation;

        // Rotate Y
        const cx1 = cx0 * cosY - cz0 * sinY;
        const cz1 = cx0 * sinY + cz0 * cosY;
        // Rotate X
        const cy2 = cy0 * cosX - cz1 * sinX;
        const cz2 = cy0 * sinX + cz1 * cosX;

        // Project Control Point to 2D
        const scaleC = perspective / (perspective + cz2);
        const cx_proj = cx1 * scaleC + centerX;
        const cy_proj = cy2 * scaleC + centerY;

        const avgZ = (pA.pz + pB.pz) / 2;
        const sizeFactor = 1.0 - avgZ / (R * 1.5);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
        ctx.lineWidth = 1.2 * sizeFactor;

        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00d2ff';
        ctx.moveTo(pA.px, pA.py);
        ctx.quadraticCurveTo(cx_proj, cy_proj, pB.px, pB.py);
        ctx.stroke();
        ctx.shadowBlur = 0;

        arc.progress += arc.speed;
        if (arc.progress > 1.0) {
          arc.progress = 0;
        }

        const t = arc.progress;
        const mt = 1 - t;
        const dotX = mt * mt * pA.px + 2 * mt * t * cx_proj + t * t * pB.px;
        const dotY = mt * mt * pA.py + 2 * mt * t * cy_proj + t * t * pB.py;

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d2ff';
        ctx.arc(dotX, dotY, 4.0 * sizeFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ==============================================
      // 6. Draw Glowing Atmospheric Rim Halo
      // ==============================================
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
      ctx.lineWidth = 4.0;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00d2ff';
      ctx.arc(centerX, centerY, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[48%] pointer-events-none select-none z-0 opacity-65">
      <canvas
        ref={canvasRef}
        className="w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] lg:w-[850px] lg:h-[850px]"
        style={{
          filter: 'drop-shadow(0 0 50px rgba(6,182,212,0.3))',
        }}
      />
    </div>
  );
};
