import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { validateEmail, sanitizeInput, checkLoginRateLimit, recordLoginAttempt, resetLoginRateLimit } from '../services/validation';
import { HalfGlobe3D } from '../components/HalfGlobe3D';
import { Transformer3D } from '../components/Transformer3D';
import { Motherboard3D } from '../components/Motherboard3D';

const AntigravityCanvas: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      x0: number;
      y0: number;
      size: number;
      color: string;
      angle: number;
      speed: number;
    }> = [];

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false
    };

    const initParticles = () => {
      particles.length = 0;

      // Calculate spacing based on screen size for optimal density
      const spacing = Math.max(45, Math.min(60, Math.floor(width / 30)));
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x0 = (i + 0.5) * spacing + (Math.random() - 0.5) * 15;
          const y0 = (j + 0.5) * spacing + (Math.random() - 0.5) * 15;

          const r = Math.random();
          let color = 'rgba(14, 165, 233, 0.25)'; // sky-500
          if (r < 0.3) color = 'rgba(99, 102, 241, 0.25)'; // indigo-500
          else if (r < 0.6) color = 'rgba(168, 85, 247, 0.2)'; // purple-500
          else if (r < 0.8) color = 'rgba(6, 182, 212, 0.25)'; // cyan-500

          particles.push({
            x: x0,
            y: y0,
            x0,
            y0,
            size: Math.random() * 1.5 + 1.2,
            color,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.4 + 0.1
          });
        }
      }
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    let time = 0;
    const animate = () => {
      time += 0.003;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouse.active) {
        if (mouse.x === -1000) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x += (-1000 - mouse.x) * 0.08;
        mouse.y += (-1000 - mouse.y) * 0.08;
      }

      particles.forEach(p => {
        // Subtle ambient drift using sine waves
        const driftX = Math.sin(time + p.angle) * 3;
        const driftY = Math.cos(time + p.angle) * 3;

        let tx = p.x0 + driftX;
        let ty = p.y0 + driftY;

        if (mouse.x !== -1000) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const angle = Math.atan2(dy, dx);
            const swirlAngle = angle + Math.PI / 2.2; // slight spiral angle

            // Pull towards mouse (gravity) + Swirl around mouse
            const pullForce = force * 60;
            const swirlForce = force * 45;

            tx = p.x0 - Math.cos(angle) * pullForce + Math.cos(swirlAngle) * swirlForce + driftX;
            ty = p.y0 - Math.sin(angle) * pullForce + Math.sin(swirlAngle) * swirlForce + driftY;
          }
        }

        // Inertia transition
        p.x += (tx - p.x) * 0.08;
        p.y += (ty - p.y) * 0.08;

        const vx = tx - p.x;
        const vy = ty - p.y;
        const speed = Math.sqrt(vx * vx + vy * vy);

        ctx.beginPath();

        // Draw dynamic line/dash segments based on velocity
        const len = 3 + speed * 0.8;
        const drawAngle = speed > 0.2 ? Math.atan2(vy, vx) : p.angle + time;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.moveTo(p.x - Math.cos(drawAngle) * len, p.y - Math.sin(drawAngle) * len);
        ctx.lineTo(p.x + Math.cos(drawAngle) * len, p.y + Math.sin(drawAngle) * len);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

// ==========================================
// 1. Component for 3D Entrance Reveals on Scroll
// ==========================================
interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ children, delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.05 }
    );

    const current = domRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1) rotateX(0deg)';
    switch (direction) {
      case 'up':
        return 'translate3d(0, 50px, 0) scale(0.96) rotateX(-6deg)';
      case 'down':
        return 'translate3d(0, -50px, 0) scale(0.96) rotateX(6deg)';
      case 'left':
        return 'translate3d(40px, 0, 0) scale(0.98)';
      case 'right':
        return 'translate3d(-40px, 0, 0) scale(0.98)';
      default:
        return 'translate3d(0, 45px, 0) scale(0.96)';
    }
  };

  return (
    <div
      ref={domRef}
      className="transition-all duration-1000 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionDelay: `${delay}ms`,
        perspective: '1000px',
      }}
    >
      {children}
    </div>
  );
};

// Component for Interactive Motherboard removed in favor of Motherboard3D imports.

// ==========================================
// 3. Component for Animated Numerical Metrics Counters
// ==========================================
interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ target, duration = 1800, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const current = elementRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing out curve
      const easeProgress = progress * (2 - progress);

      setCount(easeProgress * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  const isDecimal = target % 1 !== 0;
  const formattedCount = isDecimal ? Math.abs(count).toFixed(1) : Math.floor(Math.abs(count)).toString();

  return (
    <span ref={elementRef} className="tabular-nums">
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const globeVideoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      setScrollY(scrollTop);

      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial calculation
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string, highlightId?: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const targetHighlight = highlightId || id;
      setActiveHighlight(targetHighlight);
      setTimeout(() => {
        setActiveHighlight(null);
      }, 1500); // Glow flash duration
    }
  };

  // Control background videos playback speed based on mouse movement velocity
  useEffect(() => {
    const video = videoRef.current;
    const globeVideo = globeVideoRef.current;
    if (!video && !globeVideo) return;

    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastTime = Date.now();
    let targetSpeed = 1.0;
    let currentSpeed = 1.0;

    const handleMouseMoveSpeed = (e: MouseEvent) => {
      const now = Date.now();
      const dt = now - lastTime;
      if (dt <= 0) return;

      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const velocity = dist / dt; // pixels per ms

      // Scale playback speed between 0.6x (idle) and 2.2x (high velocity)
      targetSpeed = 0.6 + Math.min(1.6, velocity * 0.6);

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      lastTime = now;
    };

    window.addEventListener('mousemove', handleMouseMoveSpeed);

    const interval = setInterval(() => {
      currentSpeed += (targetSpeed - currentSpeed) * 0.1;
      // Keep decaying towards a calm 0.7x speed
      targetSpeed += (0.7 - targetSpeed) * 0.05;

      if (video) {
        try {
          video.playbackRate = currentSpeed;
        } catch (err) { }
      }
      if (globeVideo) {
        try {
          globeVideo.playbackRate = currentSpeed;
        } catch (err) { }
      }
    }, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveSpeed);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // --- Security: Client-side rate limiting ---
    const rateCheck = checkLoginRateLimit();
    if (!rateCheck.allowed) {
      setError(`Muitas tentativas de login. Tente novamente em ${Math.ceil((rateCheck.retryAfterSeconds || 900) / 60)} minutos.`);
      setIsLoading(false);
      return;
    }

    // --- Security: Input validation ---
    const sanitizedEmail = sanitizeInput(email, 320).toLowerCase();
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email inválido');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        recordLoginAttempt();
        throw error;
      }

      if (data.user) {
        const isSystemAdmin = sanitizedEmail === 'admin@manequip.com' || sanitizedEmail === 'data@manequip.com';

        if (!isSystemAdmin) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', data.user.id)
            .single();

          if (profileErr) {
            console.error('Error checking profile approval:', profileErr);
          }

          if (profile && profile.is_approved === false) {
            await supabase.auth.signOut();
            setError('Sua conta está aguardando aprovação de um administrador.');
            setIsLoading(false);
            return;
          }
        }
        resetLoginRateLimit();
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || '';

      try {
        const { data: statusData, error: rpcError } = await supabase.rpc('check_user_approval_status', {
          user_email: sanitizedEmail
        });

        if (!rpcError && statusData && statusData.length > 0) {
          const { email_exists, is_approved } = statusData[0];
          if (email_exists && !is_approved) {
            setError('Seu cadastro foi realizado com sucesso, mas está aguardando aprovação de um administrador. O acesso será liberado após a aprovação.');
            setIsLoading(false);
            return;
          }
        }
      } catch (rpcErr) {
        console.error('RPC check error:', rpcErr);
      }

      if (msg.includes('Email not confirmed') || msg.includes('confirm')) {
        setError('Seu cadastro foi realizado com sucesso, mas está aguardando aprovação de um administrador. O acesso será liberado após a aprovação.');
      } else {
        // --- Security: Generic error message (don't reveal if email exists) ---
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic background style calculations
  const scrollRatio = Math.min(1, scrollY / 1200); // 0 to 1 over 1200px scroll

  // Video 1 (Circuits): decays from 14% opacity to 0% by 600px scroll. Blurs up to 8px.
  const circuitOpacity = Math.max(0, 0.14 * (1 - scrollY / 600));
  const circuitBlur = Math.min(8, (scrollY / 600) * 8);

  // Video 2 (Globe): grows from 0% opacity to 22% between 200px and 900px scroll. Blurs down from 8px to 0px.
  const globeOpacity = scrollY < 200
    ? 0
    : Math.min(0.22, 0.22 * ((scrollY - 200) / 700));
  const globeBlur = scrollY < 200
    ? 8
    : Math.max(0, 8 - 8 * ((scrollY - 200) / 700));

  return (
    <div ref={scrollContainerRef} className={`h-screen bg-[#070b14] font-display text-slate-100 relative overflow-x-hidden overflow-y-auto scroll-smooth flex flex-col ${isMobile ? '' : 'snap-y snap-mandatory'}`}>

      {/* Background Layer 1: Motherboard Circuits Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none z-0"
        style={{
          opacity: circuitOpacity,
          filter: `blur(${circuitBlur}px)`,
          transition: 'filter 0.4s ease-out, opacity 0.4s ease-out',
        }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-background-circuit-board-31971-large.mp4" type="video/mp4" />
      </video>

      {/* Background Layer 2: 3D Holographic spinning globe (Fades in as user scrolls) */}
      <video
        ref={globeVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none z-0"
        style={{
          opacity: globeOpacity,
          filter: `blur(${globeBlur}px)`,
          transition: 'filter 0.4s ease-out, opacity 0.4s ease-out',
        }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-holographic-planet-earth-loop-41582-large.mp4" type="video/mp4" />
      </video>

      {/* Cyberpunk Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0"></div>

      {/* Interactive Swirling Antigravity Particle Field */}
      <AntigravityCanvas />

      {/* Animated Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-6 md:px-16 ${scrollY > 40 ? 'backdrop-blur-md bg-[#0a0f1d]/85 border-b border-slate-800/80 shadow-lg' : 'bg-transparent border-b border-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group cursor-pointer">
            <span className="material-symbols-outlined text-[#00d2ff] text-[18px] group-hover:rotate-180 transition-transform duration-700">precision_manufacturing</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Manequip <span className="text-[#00d2ff]">360</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-bold text-slate-400">
          <a href="#inicio" onClick={(e) => handleNavClick(e, 'inicio')} className="relative hover:text-[#00d2ff] transition-colors py-1 group">
            Início
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00d2ff] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#features" onClick={(e) => handleNavClick(e, 'features', 'feat-preditiva')} className="relative hover:text-[#00d2ff] transition-colors py-1 group">
            Funcionalidades
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00d2ff] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#tech" onClick={(e) => handleNavClick(e, 'tech', 'tech-core')} className="relative hover:text-[#00d2ff] transition-colors py-1 group">
            Tecnologia
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00d2ff] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#results" onClick={(e) => handleNavClick(e, 'results', 'metric-uptime')} className="relative hover:text-[#00d2ff] transition-colors py-1 group">
            Métricas
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00d2ff] transition-all duration-300 group-hover:w-full"></span>
          </a>
        </nav>

        {/* Symmetric Spacer to balance the logo size and keep navbar centered */}
        <div className="w-24 hidden md:block"></div>

        {/* Scroll Progress Neon Line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 transition-all duration-75 shadow-[0_1px_8px_rgba(6,182,212,0.5)]"
          style={{
            width: `${Math.min(100, scrollProgress)}%`
          }}
        />
      </header>

      {/* Hero Section & Login Form */}
      <section className={`relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-screen px-6 md:px-16 pt-24 pb-12 shrink-0 ${isMobile ? '' : 'snap-start'}`} id="inicio">

        {/* Left Column: Branding Copy (Parallax) */}
        <div
          className="lg:col-span-7 flex flex-col justify-center text-left transition-transform duration-100 ease-out"
          style={{ transform: isMobile ? 'none' : `translate3d(0, ${scrollY * 0.08}px, 0)` }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[#00d2ff] text-xs font-semibold mb-6 shadow-sm w-fit animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Industrial OS v1.2.12
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight text-white">
            Gestão Industrial de <br />
            <span className="gradient-text-blue-purple">Alta Performance</span>
          </h1>

          <p className="text-slate-350 text-lg md:text-xl mb-8 leading-relaxed max-w-2xl">
            Monitore ativos em tempo real, preveja falhas críticas por IA e otimize a manutenção geral com a plataforma de Internet das Coisas mais avançada do mercado.
          </p>

          <div className="flex flex-wrap gap-4 mb-2 lg:mb-0">
            <button
              onClick={(e) => handleNavClick(e, 'features', 'feat-preditiva')}
              className="bg-[#00a3e0] hover:bg-[#008ebd] text-white text-sm uppercase tracking-wider font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              Explorar Recursos
            </button>
            <button
              onClick={(e) => handleNavClick(e, 'results', 'metric-uptime')}
              className="bg-transparent border border-slate-800 hover:border-slate-600 text-slate-300 text-sm uppercase tracking-wider font-bold py-3.5 px-8 rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              Ver Métricas
            </button>
          </div>
        </div>

        {/* Right Column: Sleek Floating Login Box (Parallax) */}
        <div
          className="lg:col-span-5 flex items-center justify-center relative z-20 transition-transform duration-100 ease-out"
          style={{ transform: isMobile ? 'none' : `translate3d(0, ${scrollY * -0.04}px, 0)` }}
        >
          <div className="w-full max-w-[420px] bg-[#111827]/75 border border-[#1f2937]/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-t-2xl"></div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Bem-vindo de volta</h2>
              <p className="text-slate-400 text-xs">Insira suas credenciais corporativas para acessar o painel de controle.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                <p className="leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 group">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">E-mail Corporativo</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500">mail</span>
                  <input
                    className="w-full bg-[#0d111c]/90 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white text-xs placeholder:text-slate-500/60 focus:outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff] transition-all shadow-sm"
                    placeholder="nome@manequip.com"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                  <Link to="/forgot-password" className="text-[10px] font-semibold text-[#00d2ff] hover:text-cyan-400 transition-colors">Esqueceu?</Link>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500">lock</span>
                  <input
                    className="w-full bg-[#0d111c]/90 border border-slate-800 rounded-xl py-3 pl-12 pr-12 text-white text-xs placeholder:text-slate-500/60 focus:outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff] transition-all shadow-sm"
                    placeholder="Insira sua senha"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-500 hover:text-slate-400 transition-colors focus:outline-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all duration-300 h-12 mt-6 shadow-lg shadow-cyan-500/25 ${isLoading ? 'opacity-80 cursor-wait' : 'hover:-translate-y-0.5 hover:shadow-cyan-500/40'}`}
              >
                {!isLoading && <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out"></div>}
                <span className="relative flex items-center justify-center gap-2 text-white font-bold text-xs tracking-wider uppercase">
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      AUTENTICANDO...
                    </>
                  ) : (
                    <>
                      ENTRAR NO SISTEMA
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
              <p className="text-slate-500 text-xs">
                Ainda não tem acesso? <Link to="/register" className="text-[#00d2ff] font-bold hover:text-cyan-400 transition-colors ml-1 pb-0.5">Solicite uma conta</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className={`relative min-h-screen flex flex-col justify-center py-20 px-6 md:px-16 border-t border-slate-800/40 bg-[#070b14]/70 z-10 overflow-hidden shrink-0 ${isMobile ? '' : 'snap-start'}`} id="features">
        <HalfGlobe3D />
        <div className="max-w-7xl mx-auto relative z-10">
          <RevealOnScroll direction="up">
            <div className="text-center mb-16">
              <h2 className="text-sm uppercase tracking-widest text-[#00d2ff] font-bold mb-2 font-display">Funcionalidades</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Tudo o que sua indústria precisa em um só lugar
              </h3>
              <p className="text-slate-300 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
                Módulos integrados para monitoramento, análise e otimização em tempo real.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1: Manutenção Preditiva */}
            <RevealOnScroll delay={0} direction="up">
              <div
                id="feat-preditiva"
                className={`p-6 rounded-2xl bg-[#111827]/40 border border-[#1f2937]/50 hover:border-cyan-500/30 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] ${activeHighlight === 'feat-preditiva' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div>
                  <div className="size-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-[#00d2ff]/10 group-hover:border-[#00d2ff]/30 transition-all">
                    <span className="material-symbols-outlined text-[#00d2ff] text-[24px]">online_prediction</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Manutenção Preditiva</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Evite falhas críticas monitorando seus ativos usando algoritmos de IA.
                  </p>
                </div>
                <div className="w-1/3 h-1 bg-cyan-500/50 rounded-full mt-4"></div>
              </div>
            </RevealOnScroll>

            {/* Feature Card 2: Gestão de Ativos */}
            <RevealOnScroll delay={150} direction="up">
              <div
                id="feat-ativos"
                className={`p-6 rounded-2xl bg-[#111827]/40 border border-[#1f2937]/50 hover:border-indigo-500/30 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] ${activeHighlight === 'feat-ativos' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div>
                  <div className="size-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                    <span className="material-symbols-outlined text-indigo-400 text-[24px]">precision_manufacturing</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Gestão de Ativos</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Acompanhe o ciclo de vida completo de máquinas e sistemas complexos em um cadastramento digital estruturado.
                  </p>
                </div>
                <div className="w-1/3 h-1 bg-indigo-500/50 rounded-full mt-4"></div>
              </div>
            </RevealOnScroll>

            {/* Feature Card 3: Almoxarifado Integrado */}
            <RevealOnScroll delay={300} direction="up">
              <div
                id="feat-almoxarifado"
                className={`p-6 rounded-2xl bg-[#111827]/40 border border-[#1f2937]/50 hover:border-purple-500/30 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] ${activeHighlight === 'feat-almoxarifado' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div>
                  <div className="size-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all">
                    <span className="material-symbols-outlined text-purple-400 text-[24px]">category</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Almoxarifado Integrado</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Gerencie peças de reposição com controle de estoque mínimo automático e alertas de compras imediatos.
                  </p>
                </div>
                <div className="w-1/3 h-1 bg-purple-500/50 rounded-full mt-4"></div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Interactive Microchip Engine Section */}
      <section className={`relative min-h-screen flex flex-col justify-center py-20 px-6 md:px-16 overflow-hidden bg-[#070b14]/40 border-t border-slate-800/40 z-10 shrink-0 ${isMobile ? '' : 'snap-start'}`} id="tech">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Column: Text Content */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center">
            <RevealOnScroll direction="up">
              <span className="text-sm uppercase tracking-widest text-[#00d2ff] font-bold mb-2 font-display block">Tecnologia</span>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                Core Engine Manequip 360
              </h3>
              <p className="text-slate-300 text-base mb-8 leading-relaxed max-w-lg">
                O cérebro digital da operação industrial. Linhas de dados inteligentes que integram hardware e software em tempo real, fornecendo telemetria contínua com latência ultra-reduzida.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00d2ff] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider font-bold text-white mb-1">Processamento de Borda</h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Telemetria processada na ponta com algoritmos de IA para resposta em milissegundos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">hub</span>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider font-bold text-white mb-1">Conectividade IoT</h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Integração nativa com barramentos industriais e sensores de vibração e corrente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">security</span>
                  </div>
                  <div>
                    <h4 className="text-sm uppercase tracking-wider font-bold text-white mb-1">Arquitetura de Alta Resiliência</h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Sincronização de dados criptografados e tolerância a falhas na comunicação de rede.</p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right Column: 3D Interactive Motherboard Block */}
          <div className="lg:col-span-7 flex justify-center items-center relative">
            <RevealOnScroll direction="left">
              <div
                id="tech-core"
                className={`rounded-3xl ${activeHighlight === 'tech-core' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <Motherboard3D />
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </section>

      {/* Metrics & Footer Section combined */}
      <section className={`relative min-h-screen flex flex-col justify-between bg-[#070b14]/70 border-t border-slate-800/40 z-10 shrink-0 ${isMobile ? '' : 'snap-start'}`} id="results">
        <div className="max-w-7xl mx-auto w-full my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-20 px-6 md:px-16 flex-grow">

          {/* Left Side: 3D Exploded view Transformer */}
          <div className="lg:col-span-7 flex justify-center items-center relative min-h-[450px]">
            <RevealOnScroll delay={200} direction="right">
              <Transformer3D />
            </RevealOnScroll>
          </div>

          {/* Right Side: Metrics Counters */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            <RevealOnScroll direction="up">
              <div className="text-left mb-4">
                <h2 className="text-sm uppercase tracking-widest text-[#00d2ff] font-bold mb-2">Métricas</h2>
                <h3 className="text-4xl font-extrabold text-white tracking-tight">
                  Desempenho Geral
                </h3>
                <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                  Módulos integrados e sensores inteligentes operando em tempo real para maximizar a performance e eficiência da planta.
                </p>
              </div>
            </RevealOnScroll>

            {/* Metric 1 */}
            <RevealOnScroll delay={0} direction="up">
              <div
                id="metric-uptime"
                className={`p-6 rounded-2xl bg-[#111827]/30 border border-slate-800/80 flex items-center gap-6 relative overflow-hidden group ${activeHighlight === 'metric-uptime' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div className="absolute top-0 left-0 h-full w-[2px] bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors"></div>
                <span className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight w-24 text-left">
                  <AnimatedCounter target={98.4} suffix="%" />
                </span>
                <div className="text-left flex-1">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Disponibilidade Geral</span>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">Uptime operacional contínuo e confiável garantido nos equipamentos de planta.</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Metric 2 */}
            <RevealOnScroll delay={150} direction="up">
              <div
                id="metric-custos"
                className={`p-6 rounded-2xl bg-[#111827]/30 border border-slate-800/80 flex items-center gap-6 relative overflow-hidden group ${activeHighlight === 'metric-custos' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div className="absolute top-0 left-0 h-full w-[2px] bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                <span className="text-3xl md:text-4xl font-black text-[#00d2ff] leading-none tracking-tight w-24 text-left">
                  <AnimatedCounter target={35} prefix="-" suffix="%" />
                </span>
                <div className="text-left flex-1">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Custos de Manutenção</span>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">Redução drástica em intervenções corretivas emergenciais.</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Metric 3 */}
            <RevealOnScroll delay={300} direction="up">
              <div
                id="metric-monitoramento"
                className={`p-6 rounded-2xl bg-[#111827]/30 border border-slate-800/80 flex items-center gap-6 relative overflow-hidden group ${activeHighlight === 'metric-monitoramento' ? 'ring-2 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400 scale-[1.03] duration-300' : 'transition-all duration-500'
                  }`}
              >
                <div className="absolute top-0 left-0 h-full w-[2px] bg-purple-500/20 group-hover:bg-purple-500 transition-colors"></div>
                <span className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight w-24 text-left">
                  <AnimatedCounter target={24} suffix="/7" />
                </span>
                <div className="text-left flex-1">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Monitoramento Contínuo</span>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">Sensores inteligentes e alarmes integrados informando logs em tempo real.</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-slate-800/60 bg-[#060a12]/95 py-6 px-6 md:px-16 mt-auto z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-slate-500 font-medium">
            <div className="flex flex-col gap-1">
              <p>© {new Date().getFullYear()} Manequip Systems. Todos os direitos reservados.</p>
              <p className="text-slate-600/70 text-[9px] font-normal font-sans">Desenvolvido por Guilherme Lanucci</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#inicio" onClick={(e) => handleNavClick(e, 'inicio')} className="hover:text-white transition-colors">Voltar ao topo</a>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                Todos os sistemas operacionais
              </div>
            </div>
          </div>
        </footer>
      </section>

    </div>
  );
};

export default Login;