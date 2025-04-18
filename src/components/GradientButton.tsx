import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface GradientButtonProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'purple' | 'blue' | 'green';
}

export default function GradientButton({
  children,
  to,
  onClick,
  type = 'button',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  variant = 'purple'
}: GradientButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none transition-all';
  
  const variantClasses = {
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white',
    blue: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
    green: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );
  
  if (to) {
    return (
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
      >
        <Link to={to} className={allClasses}>
          {content}
        </Link>
      </motion.div>
    );
  }
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClasses}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      {content}
    </motion.button>
  );
} 