'use client';
import { useState, useEffect, useRef } from 'react';
import { runQuery } from '@lib/actions'; // Make sure this returns Step[]

type Step = {
  type: 'text' | 'tool_use' | 'tool_result';
  content: string;
};

export default function MCPUI() {
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (stepsRef.current && steps.length > 0) {
      stepsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  const handleRun = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSteps([]); // Clear previous steps
    
    try {
      const result = await runQuery(query);
      setSteps(result);
    } catch (err) {
      setSteps([{ type: 'text', content: '❌ Error: ' + String(err) }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'text': return '🧠';
      case 'tool_use': return '🛠️';
      case 'tool_result': return '📦';
      default: return '💭';
    }
  };

  const getStepTitle = (type: string) => {
    switch (type) {
      case 'text': return 'Claude Response';
      case 'tool_use': return 'Tool Execution';
      case 'tool_result': return 'Tool Result';
      default: return 'Processing';
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'text': return 'from-blue-500/20 to-purple-500/20 border-blue-500/30';
      case 'tool_use': return 'from-green-500/20 to-teal-500/20 border-green-500/30';
      case 'tool_result': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  return (
    <div className="mcp-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-particles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`} />
          ))}
        </div>
        <div 
          className="cursor-trail"
          style={{
            left: mousePosition.x - 75,
            top: mousePosition.y - 75,
          }}
        />
      </div>

      <div className={`main-content ${mounted ? 'fade-in' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="title-container">
            <h1 className="main-title">
              <span className="title-icon">🧠</span>
              AI Tool Assistant
            </h1>
            <p className="subtitle">
              Interact with powerful AI tools and get intelligent responses
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-container">
            <label className="input-label">
              What would you like me to help you with?
            </label>
            <div className="textarea-wrapper">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question here... Try 'What is 15 * 32?' or 'Analyze this data pattern'"
                rows={4}
                className="enhanced-textarea"
                disabled={loading}
              />
              <div className="textarea-border" />
            </div>
            
            <div className="button-container">
              <button
                onClick={handleRun}
                disabled={loading || !query.trim()}
                className="run-button"
              >
                <span className="button-content">
                  {loading ? (
                    <>
                      <div className="loading-spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">⚡</span>
                      Run Query
                    </>
                  )}
                </span>
                <div className="button-glow" />
              </button>
              
              {query && (
                <div className="shortcut-hint">
                  <kbd>⌘</kbd> + <kbd>Enter</kbd> to run
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {steps.length > 0 && (
          <div className="results-section" ref={stepsRef}>
            <h2 className="results-title">
              <span className="results-icon">📋</span>
              Execution Steps
            </h2>
            <div className="steps-container">
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`step-card ${getStepColor(step.type)}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="step-header">
                    <div className="step-info">
                      <span className="step-icon">{getStepIcon(step.type)}</span>
                      <span className="step-title">{getStepTitle(step.type)}</span>
                    </div>
                    <div className="step-number">#{idx + 1}</div>
                  </div>
                  <div className="step-content">
                    <pre className="step-text">{step.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="loading-card">
              <div className="loading-animation">
                <div className="pulse-ring" />
                <div className="pulse-ring pulse-ring-2" />
                <div className="pulse-ring pulse-ring-3" />
              </div>
              <p className="loading-text">AI is thinking and processing your request...</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mcp-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          position: relative;
          overflow-x: hidden;
          padding: 2rem 1rem;
        }

        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent);
          border-radius: 50%;
          animation: particleFloat 25s infinite linear;
        }

        .particle-1 { width: 4px; height: 4px; top: 20%; left: 10%; animation-delay: 0s; }
        .particle-2 { width: 6px; height: 6px; top: 40%; right: 20%; animation-delay: -5s; }
        .particle-3 { width: 3px; height: 3px; bottom: 30%; left: 30%; animation-delay: -10s; }
        .particle-4 { width: 5px; height: 5px; top: 60%; right: 40%; animation-delay: -15s; }
        .particle-5 { width: 4px; height: 4px; bottom: 50%; right: 15%; animation-delay: -7s; }
        .particle-6 { width: 7px; height: 7px; top: 80%; left: 60%; animation-delay: -12s; }
        .particle-7 { width: 3px; height: 3px; top: 10%; right: 60%; animation-delay: -18s; }
        .particle-8 { width: 5px; height: 5px; bottom: 20%; left: 80%; animation-delay: -3s; }

        @keyframes particleFloat {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }

        .cursor-trail {
          position: absolute;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transition: all 0.2s ease-out;
        }

        .main-content {
          position: relative;
          z-index: 2;
          max-width: 4xl;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(20px);
        }

        .fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .title-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
          display: inline-block;
        }

        .main-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: white;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .title-icon {
          font-size: 1.2em;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        .input-section {
          margin-bottom: 3rem;
        }

        .input-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .input-label {
          display: block;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 1rem;
        }

        .textarea-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .enhanced-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          color: white;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
          min-height: 120px;
          transition: all 0.3s ease;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace;
        }

        .enhanced-textarea:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .enhanced-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .enhanced-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .run-button {
          position: relative;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 12px;
          padding: 0.875rem 2rem;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }

        .run-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
        }

        .run-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .button-icon {
          font-size: 1.1em;
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .run-button:hover:not(:disabled) .button-glow {
          left: 100%;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .shortcut-hint {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .shortcut-hint kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 0.125rem 0.375rem;
          font-size: 0.75rem;
          font-family: inherit;
        }

        .results-section {
          margin-bottom: 3rem;
        }

        .results-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 2rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: center;
          justify-content: center;
        }

        .results-icon {
          font-size: 1.2em;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step-card {
          background: linear-gradient(135deg, var(--tw-gradient-stops));
          backdrop-filter: blur(20px);
          border: 1px solid;
          border-radius: 20px;
          padding: 1.5rem;
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .step-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .step-icon {
          font-size: 1.25rem;
        }

        .step-title {
          font-weight: 600;
          color: white;
          font-size: 1rem;
        }

        .step-number {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .step-content {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 1rem;
        }

        .step-text {
          color: rgba(255, 255, 255, 0.9);
          font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .loading-section {
          display: flex;
          justify-content: center;
          margin: 3rem 0;
        }

        .loading-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          max-width: 400px;
        }

        .loading-animation {
          position: relative;
          width: 60px;
          height: 60px;
          margin: 0 auto 1.5rem auto;
        }

        .pulse-ring {
          position: absolute;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          width: 100%;
          height: 100%;
          animation: pulseRing 2s infinite ease-out;
        }

        .pulse-ring-2 {
          animation-delay: 0.5s;
        }

        .pulse-ring-3 {
          animation-delay: 1s;
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .loading-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .mcp-container {
            padding: 1rem 0.5rem;
          }

          .title-container,
          .input-container {
            padding: 1.5rem;
          }

          .main-title {
            font-size: 1.75rem;
            flex-direction: column;
            gap: 0.5rem;
          }

          .button-container {
            flex-direction: column;
            align-items: stretch;
          }

          .run-button {
            width: 100%;
            justify-content: center;
          }

          .step-card {
            padding: 1.25rem;
          }

          .step-text {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}