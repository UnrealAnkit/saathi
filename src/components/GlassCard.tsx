import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default React.memo(function GlassCard({ children, className = '', hoverEffect = true }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hoverEffect ? { 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
        background: "rgba(30, 41, 59, 0.75)"
      } : {}}
    >
      {children}
    </motion.div>
  );
}); 