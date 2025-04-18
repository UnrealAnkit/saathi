import React from 'react';
import { motion } from 'framer-motion';

interface NeonTextProps {
  children: React.ReactNode;
  color?: 'purple' | 'blue' | 'green';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  glow?: boolean;
  animate?: boolean;
}

export default function NeonText({ 
  children, 
  color = 'purple', 
  size = 'lg',
  className = '',
  glow = true,
  animate = false
}: NeonTextProps) {
  const colorClasses = {
    purple: 'text-purple-500',
    blue: 'text-blue-500',
    green: 'text-emerald-500'
  };
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };
  
  const glowClasses = glow ? {
    purple: 'text-shadow-purple',
    blue: 'text-shadow-blue',
    green: 'text-shadow-green'
  } : {};
  
  const classes = `font-bold ${colorClasses[color]} ${sizeClasses[size]} ${glow ? glowClasses[color] : ''} ${className}`;
  
  if (animate) {
    return (
      <motion.span 
        className={classes}
        animate={{ 
          opacity: [0.9, 1, 0.9]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
      >
        {children}
      </motion.span>
    );
  }
  
  return <span className={classes}>{children}</span>;
} 