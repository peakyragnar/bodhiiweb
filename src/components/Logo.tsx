import React from 'react';

const Logo = () => {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -rotate-45">
      <path d="M20 80L50 20L80 80H20Z" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="gradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" /> {/* blue-400 */}
          <stop offset="0.5" stopColor="#5EEAD4" /> {/* teal-300 */}
          <stop offset="1" stopColor="#34D399" /> {/* emerald-400 */}
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo; 