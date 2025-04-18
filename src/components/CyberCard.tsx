import React from 'react';
import { motion } from 'framer-motion';

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  glitch?: boolean;
}

export default function CyberCard({ children, className = '', glitch = false }: CyberCardProps) {
  return (
    <motion.div
      className={`relative bg-gray-900 border border-purple-500 rounded-md p-6 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
      }}
    >
      {/* Diagonal lines background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(45deg, #8b5cf6 0, #8b5cf6 1px, transparent 0, transparent 50%)",
          backgroundSize: "10px 10px"
        }}></div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute transform rotate-45 bg-purple-600 text-white font-mono text-xs text-center leading-tight py-1 right-[-35px] top-[32px] w-[170px]">
          CYBER
        </div>
      </div>
      
      {/* Glitch effect */}
      {glitch && (
        <motion.div
          className="absolute inset-0 bg-purple-500 opacity-0 mix-blend-overlay"
          animate={{ 
            opacity: [0, 0.5, 0],
            x: [-10, 5, 0],
          }}
          transition={{ 
            duration: 0.2, 
            repeat: Infinity, 
            repeatType: "mirror",
            repeatDelay: Math.random() * 5 + 5
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
} 