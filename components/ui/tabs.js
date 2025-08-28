"use client";
import * as React from "react";
import { motion } from "framer-motion";

export function Tabs({ defaultValue, children, className = "" }) {
  const [value, setValue] = React.useState(defaultValue);
  const api = React.useMemo(() => ({ value, setValue }), [value]);
  return <div data-tabs className={className}>{React.Children.map(children, (c) => React.cloneElement(c, { api }))}</div>;
}

export function TabsList({ children, api, className = "" }) {
  return (
    <div className={`mb-4 inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/20 p-1 backdrop-blur-sm ${className}`}>
      {React.Children.map(children, (c) => React.cloneElement(c, { api }))}
    </div>
  );
}

export function TabsTrigger({ value, children, api, className = "" }) {
  const active = api.value === value;
  return (
    <motion.button
      onClick={() => api.setValue(value)}
      className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
        active 
          ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30" 
          : "text-white/70 hover:text-white hover:bg-white/10"
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

export function TabsContent({ value, children, api, className = "" }) {
  if (api.value !== value) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
}


