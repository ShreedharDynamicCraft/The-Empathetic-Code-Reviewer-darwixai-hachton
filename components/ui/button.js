import * as React from "react";
import { motion } from "framer-motion";

export function Button({ className = "", variant = "default", children, disabled = false, ...props }) {
  const variants = {
    default:
      "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 text-sm font-medium shadow-lg hover:shadow-violet-500/25 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 hover:scale-105 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed",
    destructive:
      "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-red-300 px-4 py-2 text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
  };
  
  return (
    <motion.button 
      className={`${variants[variant] || variants.default} ${className}`} 
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}


