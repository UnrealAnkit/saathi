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
    purple: 'neon-text-purple',
    blue: 'neon-text-blue',
    green: 'neon-text-green'
  } : {};
  
  const classes = `font-bold ${colorClasses[color]} ${sizeClasses[size]} ${glow ? glowClasses[color] : ''} ${className}`;
  
  if (animate) {
    return (
      <motion.span 
        className={classes}
        animate={{ 
          textShadow: glow ? [
            `0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px currentColor, 0 0 82px currentColor, 0 0 92px currentColor, 0 0 102px currentColor, 0 0 151px currentColor`,
            `0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px currentColor, 0 0 72px currentColor, 0 0 82px currentColor, 0 0 92px currentColor, 0 0 102px currentColor`,
            `0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px currentColor, 0 0 82px currentColor, 0 0 92px currentColor, 0 0 102px currentColor, 0 0 151px currentColor`
          ] : undefined
        }}
        transition={{ 
          duration: 1.5, 
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