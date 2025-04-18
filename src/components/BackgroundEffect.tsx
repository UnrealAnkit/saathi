import React, { useEffect, useRef } from 'react';

export default function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Particle class - simplified for better performance
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; // Smaller particles
        this.speedX = Math.random() * 0.5 - 0.25; // Slower movement
        this.speedY = Math.random() * 0.5 - 0.25; // Slower movement
        
        // Simplified color palette
        const colors = [
          'rgba(147, 51, 234, 0.3)',  // Purple with lower opacity
          'rgba(79, 70, 229, 0.3)',   // Indigo with lower opacity
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x > canvas.width || this.x < 0) {
          this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.speedY = -this.speedY;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create fewer particles
    const particleCount = Math.min(50, Math.floor(window.innerWidth * window.innerHeight / 20000));
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop with throttling
    let lastTime = 0;
    const fps = 30; // Lower FPS for better performance
    const fpsInterval = 1000 / fps;

    const animate = (timestamp: number) => {
      if (!ctx) return;
      
      // Throttle the animation
      const elapsed = timestamp - lastTime;
      if (elapsed < fpsInterval) {
        requestAnimationFrame(animate);
        return;
      }
      lastTime = timestamp - (elapsed % fpsInterval);
      
      // Clear canvas with semi-transparent background
      ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // Darker background with higher opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Draw connections between particles - only connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 80) { // Reduced connection distance
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.05 * (1 - distance / 80)})`; // Lower opacity
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
} 