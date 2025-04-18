import React, { createContext, useContext, useState, useEffect } from 'react';

interface PerformanceContextType {
  highPerformanceMode: boolean;
  togglePerformanceMode: () => void;
}

const PerformanceContext = createContext<PerformanceContextType>({
  highPerformanceMode: false,
  togglePerformanceMode: () => {},
});

export const usePerformance = () => useContext(PerformanceContext);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highPerformanceMode, setHighPerformanceMode] = useState(() => {
    // Default to low performance mode on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const savedPreference = localStorage.getItem('highPerformanceMode');
    
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    
    return !isMobile;
  });

  useEffect(() => {
    localStorage.setItem('highPerformanceMode', highPerformanceMode.toString());
  }, [highPerformanceMode]);

  const togglePerformanceMode = () => {
    setHighPerformanceMode(prev => !prev);
  };

  return (
    <PerformanceContext.Provider value={{ highPerformanceMode, togglePerformanceMode }}>
      {children}
    </PerformanceContext.Provider>
  );
}; 