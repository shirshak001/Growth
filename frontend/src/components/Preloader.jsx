import React, { useState, useEffect } from 'react';
import './Preloader.css'; // We'll put specific styles here or in index.css

const PRELOADER_QUOTES = [
  "Aligning circadian cycles...",
  "Calibrating productivity matrices...",
  "Powering up AI Coach insights...",
  "Initializing premium Life OS interface...",
  "Connecting securely with Aria companion..."
];

const Preloader = ({ isLoading, onFinished }) => {
  const [mounted, setMounted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through quotes
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % PRELOADER_QUOTES.length);
    }, 1500);
    return () => clearInterval(quoteInterval);
  }, []);

  // Simulate smooth progress loading up to 90% or 100% when ready
  useEffect(() => {
    let progressInterval;
    if (isLoading) {
      // Fake loading progress up to 95%
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + Math.floor(Math.random() * 8) + 2;
          if (prev < 95) return prev + 1;
          return prev;
        });
      }, 100);
    } else {
      // Complete the progress instantly when ready
      setProgress(100);
    }

    return () => clearInterval(progressInterval);
  }, [isLoading]);

  // Handle fade out when loading finishes and progress reaches 100
  useEffect(() => {
    if (!isLoading && progress === 100) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setMounted(false);
        if (onFinished) onFinished();
      }, 600); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress, onFinished]);

  if (!mounted) return null;

  return (
    <div className={`preloader-overlay ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Drifting ambient neon blur backdrops */}
      <div className="ambient-blob blob-indigo"></div>
      <div className="ambient-blob blob-cyan"></div>
      <div className="ambient-blob blob-purple"></div>

      <div className="preloader-card">
        {/* Futuristic layout border highlights */}
        <div className="card-border-top"></div>
        
        {/* Brand Logo */}
        <div className="preloader-logo">
          GROWTH<span className="dot-pulse">.</span>
        </div>
        
        {/* Spinner or Ring */}
        <div className="preloader-spinner-container">
          <div className="spinner-glow-ring"></div>
          <div className="spinner-progress-circle" style={{ '--progress': `${progress}%` }}>
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" className="circle-bg" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                className="circle-fill" 
                stroke="url(#loader-gradient)"
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * progress) / 100}
              />
            </svg>
            <span className="progress-percentage">{progress}%</span>
          </div>
        </div>

        {/* Linear indicator & Status info */}
        <div className="preloader-status">
          <div className="status-label">{PRELOADER_QUOTES[quoteIndex]}</div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Footer */}
        <div className="preloader-footer">
          <span>SECURE END-TO-END LIFE ENVELOPE</span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
