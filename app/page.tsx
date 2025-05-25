"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="homepage-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-orbs">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`orb orb-${i + 1}`} />
          ))}
        </div>
        <div 
          className="cursor-glow"
          style={{
            left: mousePosition.x - 100,
            top: mousePosition.y - 100,
          }}
        />
      </div>

      {/* Main Content */}
      <div className={`content ${mounted ? 'fade-in' : ''}`}>
        <div className="hero-section">
          <h1 className="main-title">
            Welcome to Your
            <span className="gradient-text"> Digital Experience</span>
          </h1>
          
          <p className="subtitle">
            Discover powerful tools and seamless interactions in our MCP workspace
          </p>

          <div className="cta-container">
            <Link href="/mcp" className="cta-button">
              <span className="button-text">Explore MCP</span>
              <div className="button-glow" />
              <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
          </div>

          <div className="features-preview">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Optimized performance for seamless experiences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Beautiful Design</h3>
              <p>Modern interface with stunning visual effects</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Powerful Tools</h3>
              <p>Advanced capabilities at your fingertips</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .homepage-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .background-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(147, 51, 234, 0.8), rgba(79, 70, 229, 0.4), transparent);
          filter: blur(1px);
          animation: float 20s infinite ease-in-out;
        }

        .orb-1 { width: 200px; height: 200px; top: 10%; left: 10%; animation-delay: 0s; }
        .orb-2 { width: 150px; height: 150px; top: 60%; right: 20%; animation-delay: -5s; }
        .orb-3 { width: 100px; height: 100px; bottom: 20%; left: 30%; animation-delay: -10s; }
        .orb-4 { width: 80px; height: 80px; top: 30%; right: 40%; animation-delay: -15s; }
        .orb-5 { width: 120px; height: 120px; bottom: 40%; right: 10%; animation-delay: -7s; }
        .orb-6 { width: 60px; height: 60px; top: 70%; left: 60%; animation-delay: -12s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
          75% { transform: translateY(-30px) rotate(270deg); }
        }

        .cursor-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transition: all 0.1s ease-out;
          z-index: 2;
        }

        .content {
          position: relative;
          z-index: 3;
          text-align: center;
          max-width: 1200px;
          width: 100%;
          opacity: 0;
          transform: translateY(30px);
        }

        .fade-in {
          animation: fadeInUp 1s ease-out forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .main-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 800;
          line-height: 1.1;
          color: white;
          margin: 0;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease-in-out infinite alternate;
        }

        @keyframes gradientShift {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(30deg); }
        }

        .subtitle {
          font-size: clamp(1.1rem, 3vw, 1.4rem);
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          max-width: 600px;
          line-height: 1.6;
        }

        .cta-container {
          margin: 3rem 0;
        }

        .cta-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }

        .cta-button:hover .button-glow {
          left: 100%;
        }

        .button-text {
          position: relative;
          z-index: 2;
        }

        .arrow-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .cta-button:hover .arrow-icon {
          transform: translateX(4px);
        }

        .features-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
          max-width: 900px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          color: white;
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .homepage-container {
            padding: 1rem;
          }

          .features-preview {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            margin-top: 3rem;
          }

          .feature-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}